import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const SCHEMA_DOC = {
  units: 'Weights in kg, distances in km, durations in minutes unless the field name says seconds. All timestamps are UTC ISO strings; `date` fields on meal_logs are calendar dates.',
  profiles: 'One row: display_name, preferred display unit (kg/lbs — data is always stored in kg), default rest timer in seconds.',
  goals: 'Weekly training targets (weekly_gym/pt/cardio session counts) and body composition targets.',
  gym_sessions:
    'One strength workout. `exercises` is a JSON array of { id, exerciseId, exerciseName, muscleGroup, equipment, exerciseType, notes, restSeconds, sets: [{ reps, weight (kg), durationSec?, distanceKm? }] }. started_at/ended_at give real session duration when present.',
  pt_sessions:
    'Physiotherapy session. `exercises` is a JSON array of { exerciseName, category, bodyArea, notes, sets: [{ reps (or held seconds), weight?, painScale 1-10 }] }.',
  cardio_sessions:
    'One cardio/recovery entry: activity (e.g. Running, Swimming, Sauna, Steam Room), duration_min, optional distance_km. Sauna and Steam Room are heat-therapy sessions, not cardio.',
  body_metrics:
    'Smart-scale measurements (Renpho). weight kg, bmi, body_fat_pct, muscle_mass_pct/kg, skeletal_muscle_pct, fat_free_mass_kg, subcutaneous_fat_pct, visceral_fat (index, lower is better, <10 healthy), body_water_pct, bone_mass_kg, protein_pct, bmr_kcal, metabolic_age (years).',
  workout_templates: 'Saved reusable workouts. `payload` mirrors the session `exercises` shape for that module.',
  plan_schedule: 'Weekly plan: day_of_week 0=Sunday..6=Saturday, module (gym/pt/cardio/rest), optional template_id and label.',
  plan_skips: 'Days deliberately skipped for a given week_start (Sunday) — treat as intentional rest, not a missed session.',
  meal_logs: 'One logged meal on a calendar date: meal_type (Breakfast/Lunch/Dinner/Snack), protein_g, calories.',
  meal_presets: 'User-saved meals for quick logging.',
  nutrition_goals: 'Daily protein (g) and calorie targets.',
  custom_exercises: 'Legacy user-created exercise names per module.',
  favorite_exercises: 'Exercises the user starred, per module.',
  exercises: 'Catalog rows for every exercise referenced in the sessions above, plus any the user created. Includes muscle_group, secondary_muscles, equipment, exercise_type, instructions.',
  summary: 'Pre-computed rollups so you do not have to recompute them. Derived entirely from the raw tables below.',
}

const HEAT = ['sauna', 'steam room', 'steam']
const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10)
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)

function streaks(days: string[]) {
  const uniq = [...new Set(days)].sort()
  if (!uniq.length) return { current: 0, best: 0, last: null as string | null }
  let best = 1, run = 1
  for (let i = 1; i < uniq.length; i++) {
    const diff = (Date.parse(uniq[i]) - Date.parse(uniq[i - 1])) / 86400000
    run = diff === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = daysAgo(1).toISOString().slice(0, 10)
  const last = uniq[uniq.length - 1]
  let current = 0
  if (last === today || last === yesterday) {
    current = 1
    for (let i = uniq.length - 1; i > 0; i--) {
      const diff = (Date.parse(uniq[i]) - Date.parse(uniq[i - 1])) / 86400000
      if (diff === 1) current++
      else break
    }
  }
  return { current, best, last }
}

function volumeByMuscle(sessions: any[], from: Date, to: Date) {
  const out: Record<string, number> = {}
  for (const s of sessions) {
    const t = Date.parse(s.date)
    if (t < from.getTime() || t >= to.getTime()) continue
    for (const ex of (s.exercises ?? []) as any[]) {
      const mg = ex.muscleGroup || 'Other'
      for (const set of (ex.sets ?? []) as any[]) {
        out[mg] = (out[mg] ?? 0) + (Number(set.reps) || 0) * (Number(set.weight) || 0)
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Math.round(v)]))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token || token.length < 16) {
      return json({ error: 'Missing or invalid token' }, 400)
    }
    const sinceParam = url.searchParams.get('since')
    if (sinceParam && !/^\d{4}-\d{2}-\d{2}$/.test(sinceParam)) {
      return json({ error: 'Invalid `since` — expected YYYY-MM-DD' }, 400)
    }
    const since = sinceParam ? new Date(`${sinceParam}T00:00:00Z`).toISOString() : null

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const tokenHash = await sha256Hex(token)
    const { data: tokenRow, error: tokenErr } = await admin
      .from('share_tokens')
      .select('id, user_id, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (tokenErr) return json({ error: 'Lookup failed' }, 500)
    if (!tokenRow || tokenRow.revoked_at) return json({ error: 'Invalid or revoked token' }, 401)

    const uid = tokenRow.user_id as string

    // table -> owner column, date column used for the optional `since` filter
    const tables: Array<[string, string, string | null]> = [
      ['profiles', 'id', null],
      ['goals', 'user_id', null],
      ['nutrition_goals', 'user_id', null],
      ['gym_sessions', 'user_id', 'date'],
      ['pt_sessions', 'user_id', 'date'],
      ['cardio_sessions', 'user_id', 'date'],
      ['body_metrics', 'user_id', 'date'],
      ['meal_logs', 'user_id', 'date'],
      ['workout_templates', 'user_id', null],
      ['plan_schedule', 'user_id', null],
      ['plan_skips', 'user_id', null],
      ['meal_presets', 'user_id', null],
      ['custom_exercises', 'user_id', null],
      ['favorite_exercises', 'user_id', null],
    ]

    const results: Record<string, any[]> = {}
    for (const [t, col, dateCol] of tables) {
      let q = admin.from(t).select('*').eq(col, uid)
      if (since && dateCol) q = q.gte(dateCol, dateCol === 'date' && t === 'meal_logs' ? sinceParam! : since)
      const { data, error } = await q
      if (error) return json({ error: `Failed reading ${t}: ${error.message}` }, 500)
      results[t] = data ?? []
    }

    // Exercise catalog rows the user actually touched, plus their own creations.
    const usedIds = new Set<string>()
    for (const s of results.gym_sessions) {
      for (const ex of (s.exercises ?? []) as any[]) if (ex?.exerciseId) usedIds.add(ex.exerciseId)
    }
    const catalog: any[] = []
    const seen = new Set<string>()
    const { data: ownEx } = await admin.from('exercises').select('*').eq('created_by', uid)
    for (const e of ownEx ?? []) { catalog.push(e); seen.add(e.id) }
    const idList = [...usedIds].filter((id) => !seen.has(id))
    if (idList.length) {
      const { data: usedEx } = await admin.from('exercises').select('*').in('id', idList)
      for (const e of usedEx ?? []) catalog.push(e)
    }
    results.exercises = catalog

    const { data: authUser } = await admin.auth.admin.getUserById(uid)

    // ---- summary -------------------------------------------------------
    const gymDays = results.gym_sessions.map((s: any) => dayKey(s.date))
    const ptDays = results.pt_sessions.map((s: any) => dayKey(s.date))
    const cardioAll = results.cardio_sessions
    const cardioDays = cardioAll
      .filter((s: any) => !HEAT.includes(String(s.activity).toLowerCase()))
      .map((s: any) => dayKey(s.date))
    const swimDays = cardioAll
      .filter((s: any) => String(s.activity).toLowerCase().includes('swim'))
      .map((s: any) => dayKey(s.date))
    const heatDays = cardioAll
      .filter((s: any) => HEAT.includes(String(s.activity).toLowerCase()))
      .map((s: any) => dayKey(s.date))

    const countSince = (rows: any[], n: number) =>
      rows.filter((s: any) => Date.parse(s.date) >= daysAgo(n).getTime()).length

    const now = new Date()
    const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()))
    const lastWeekStart = new Date(startOfWeek.getTime() - 7 * 86400000)
    const nextWeek = new Date(startOfWeek.getTime() + 7 * 86400000)

    const metrics = [...results.body_metrics].sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date))
    const goals = results.goals[0] ?? null

    const mealsLast30 = results.meal_logs.filter((m: any) => Date.parse(`${m.date}T00:00:00Z`) >= daysAgo(30).getTime())
    const mealDays = new Set(mealsLast30.map((m: any) => m.date)).size || 1
    const sum = (rows: any[], k: string) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0)

    const summary = {
      account: { email: authUser?.user?.email ?? null, member_since: authUser?.user?.created_at ?? null },
      totals: {
        gym_sessions: results.gym_sessions.length,
        pt_sessions: results.pt_sessions.length,
        cardio_sessions: cardioDays.length,
        swimming_sessions: swimDays.length,
        heat_therapy_sessions: heatDays.length,
        body_measurements: results.body_metrics.length,
        meals_logged: results.meal_logs.length,
      },
      last_7_days: {
        gym: countSince(results.gym_sessions, 7),
        pt: countSince(results.pt_sessions, 7),
        cardio: countSince(cardioAll.filter((s: any) => !HEAT.includes(String(s.activity).toLowerCase())), 7),
      },
      last_30_days: {
        gym: countSince(results.gym_sessions, 30),
        pt: countSince(results.pt_sessions, 30),
        cardio: countSince(cardioAll.filter((s: any) => !HEAT.includes(String(s.activity).toLowerCase())), 30),
      },
      streaks: {
        gym: streaks(gymDays),
        pt: streaks(ptDays),
        cardio: streaks(cardioDays),
        swimming: streaks(swimDays),
        heat_therapy: streaks(heatDays),
      },
      weekly_targets: goals
        ? { gym: goals.weekly_gym, pt: goals.weekly_pt, cardio: goals.weekly_cardio }
        : null,
      volume_by_muscle_kg: {
        this_week: volumeByMuscle(results.gym_sessions, startOfWeek, nextWeek),
        last_week: volumeByMuscle(results.gym_sessions, lastWeekStart, startOfWeek),
      },
      latest_body_metrics: metrics[0] ?? null,
      previous_body_metrics: metrics[1] ?? null,
      body_targets: goals
        ? {
            target_weight: goals.target_weight,
            target_muscle_mass_pct: goals.target_muscle_mass_pct,
            target_body_fat_pct: goals.target_body_fat_pct,
          }
        : null,
      nutrition_last_30_days: {
        avg_protein_g_per_logged_day: Math.round(sum(mealsLast30, 'protein_g') / mealDays),
        avg_calories_per_logged_day: Math.round(sum(mealsLast30, 'calories') / mealDays),
        logged_days: mealDays,
        daily_protein_target_g: results.nutrition_goals[0]?.daily_protein_g ?? null,
        daily_calorie_target: results.nutrition_goals[0]?.daily_calories ?? null,
      },
    }

    admin.from('share_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tokenRow.id).then(() => {})

    return json({
      generated_at: new Date().toISOString(),
      note: 'Read-only export of the user\'s fitness tracker. Read `schema` for field meanings and `summary` for pre-computed rollups, then use the raw tables for detail. Supports ?since=YYYY-MM-DD to trim history.',
      filtered_since: sinceParam,
      schema: SCHEMA_DOC,
      summary,
      ...results,
    }, 200)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
