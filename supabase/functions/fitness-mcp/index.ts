// MCP server (streamable HTTP, JSON responses) for scoped external-agent access.
// Auth: Authorization: Bearer <api token>. user_id is ALWAYS resolved from the token.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { zodToJsonSchema } from 'npm:zod-to-json-schema@3.23.5'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const SPORT = ['Football', 'Basketball', 'Tennis', 'Padel', 'Squash', 'Volleyball']
const TZ = 'Asia/Riyadh'
const RATE_LIMIT = 60

async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('')
}
function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function addDays(d: string, n: number) {
  const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10)
}
function daysAgoIso(days: number) { return new Date(Date.now() - days * 86400000).toISOString() }
function weekStartLocal(): string {
  const t = todayLocal(); const dow = new Date(t + 'T00:00:00Z').getUTCDay(); return addDays(t, -dow)
}
class ToolErr extends Error {}

// ---------- schemas ----------
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
const dryRun = z.boolean().describe('If true, perform no writes and return exactly what would change.')
const bodyWeight = z.number().min(30, 'weight_kg must be 30–300').max(300, 'weight_kg must be 30–300')
const bodyFat = z.number().min(3, 'body_fat_pct must be 3–60').max(60, 'body_fat_pct must be 3–60')
const knee = z.number().int().min(0, 'knee score must be 0–10').max(10, 'knee score must be 0–10')
const sessionType = z.enum(['gym', 'pt', 'cardio', 'sport', 'recovery'])

const dailyRow = z.object({
  date: dateStr,
  sleep_asleep_min: z.number().int().optional(), sleep_in_bed_min: z.number().int().optional(),
  sleep_efficiency: z.number().optional(), sleep_score: z.number().optional(),
  sleep_deep_min: z.number().int().optional(), sleep_rem_min: z.number().int().optional(),
  sleep_light_min: z.number().int().optional(), sleep_wake_min: z.number().int().optional(),
  sleep_start: z.string().datetime({ offset: true }).optional(), sleep_end: z.string().datetime({ offset: true }).optional(),
  resting_hr: z.number().optional(), hrv_ms: z.number().optional(), nonrem_hr: z.number().optional(),
  steps: z.number().int().optional(), cardio_load: z.number().optional(),
  workout_min: z.number().int().optional(), workout_peak_min: z.number().int().optional(),
  workouts: z.string().optional(), vo2max: z.number().optional(),
  weight_kg: bodyWeight.optional(), body_fat_pct: bodyFat.optional(),
}).strict()

type Ctx = { db: SupabaseClient; uid: string }
type Result = { summary: string; rows: number; data: unknown }
type Tool = { name: string; description: string; write: boolean; schema: z.ZodObject<any>; run: (a: any, c: Ctx) => Promise<Result> }

const sel = async <T,>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> => {
  const { data, error } = await p; if (error) throw new Error(error.message); return data as T
}
function diff(before: Record<string, unknown> | null, after: Record<string, unknown>) {
  const changes: Record<string, { before: unknown; after: unknown }> = {}
  for (const [k, v] of Object.entries(after)) {
    if (v === undefined) continue
    const b = before ? before[k] ?? null : null
    if (!before || JSON.stringify(b) !== JSON.stringify(v)) changes[k] = { before: b, after: v }
  }
  return changes
}

// ---------- read helpers ----------
async function sessions(c: Ctx, days: number) {
  const since = daysAgoIso(days)
  const [gym, pt, cardio] = await Promise.all([
    sel(c.db.from('gym_sessions').select('*').eq('user_id', c.uid).gte('date', since).order('date', { ascending: false })),
    sel(c.db.from('pt_sessions').select('*').eq('user_id', c.uid).gte('date', since).order('date', { ascending: false })),
    sel(c.db.from('cardio_sessions').select('*').eq('user_id', c.uid).gte('date', since).order('date', { ascending: false })),
  ]) as any[][]
  const dur = (s: any) => s.started_at && s.ended_at ? Math.round((+new Date(s.ended_at) - +new Date(s.started_at)) / 60000) : null
  const out = [
    ...gym.map((s) => ({ id: s.id, type: 'gym', name: s.notes || 'Gym session', date: s.date, duration_min: dur(s), exercises: s.exercises, notes: s.notes })),
    ...pt.map((s) => ({ id: s.id, type: 'pt', name: s.overall_notes || 'PT session', date: s.date, duration_min: dur(s), exercises: s.exercises, notes: s.overall_notes })),
    ...cardio.map((s) => ({ id: s.id, type: SPORT.includes(s.activity) ? 'sport' : 'cardio', name: s.activity, date: s.date, duration_min: Number(s.duration_min), distance_km: s.distance_km, notes: s.notes })),
  ]
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}
const avg = (xs: any[]) => { const v = xs.filter((x) => x != null).map(Number); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null }

// ---------- tools ----------
const tools: Tool[] = [
  {
    name: 'get_dashboard', write: false,
    description: 'One-call overview: this week\'s session counts vs weekly goals, last 10 sessions, latest check-in, latest body measurement, and 7-day resting HR/HRV/sleep averages. Prefer this over granular tools.',
    schema: z.object({}).strict(),
    run: async (_a, c) => {
      const ws = weekStartLocal()
      const all = await sessions(c, 14)
      const week = all.filter((s) => s.date >= new Date(ws + 'T00:00:00+03:00').toISOString())
      const count = (t: string) => week.filter((s) => s.type === t).length
      const [goals, checkin, body, dm] = await Promise.all([
        sel(c.db.from('goals').select('weekly_gym, weekly_pt, weekly_cardio, weekly_sport').eq('user_id', c.uid).maybeSingle()),
        sel(c.db.from('daily_checkin').select('*').eq('user_id', c.uid).order('date', { ascending: false }).limit(1).maybeSingle()),
        sel(c.db.from('body_metrics').select('*').eq('user_id', c.uid).order('date', { ascending: false }).limit(1).maybeSingle()),
        sel(c.db.from('daily_metrics').select('date, resting_hr, hrv_ms, sleep_asleep_min').eq('user_id', c.uid).gte('date', addDays(todayLocal(), -7))),
      ]) as any[]
      const last10 = (await sessions(c, 365)).slice(0, 10).map(({ exercises: _e, ...s }: any) => s)
      return {
        summary: 'dashboard', rows: 0, data: {
          week_start: ws,
          this_week: { gym: count('gym'), pt: count('pt'), cardio: count('cardio'), sport: count('sport') },
          weekly_goals: goals ? { gym: goals.weekly_gym, pt: goals.weekly_pt, cardio: goals.weekly_cardio, sport: goals.weekly_sport } : null,
          last_sessions: last10, latest_checkin: checkin, latest_body_metric: body,
          averages_7d: { resting_hr: avg(dm.map((r: any) => r.resting_hr)), hrv_ms: avg(dm.map((r: any) => r.hrv_ms)), sleep_asleep_min: avg(dm.map((r: any) => r.sleep_asleep_min)), days_with_data: dm.length },
        },
      }
    },
  },
  {
    name: 'get_program', write: false,
    description: 'All active program templates with day_of_week (0=Sunday) and their exercises in order.',
    schema: z.object({}).strict(),
    run: async (_a, c) => {
      const t = await sel(c.db.from('program_templates').select('*, template_exercises(*)').eq('user_id', c.uid).eq('active', true).order('sort_order')) as any[]
      t.forEach((x) => x.template_exercises.sort((a: any, b: any) => a.sort_order - b.sort_order))
      return { summary: `${t.length} templates`, rows: 0, data: t }
    },
  },
  {
    name: 'get_sessions', write: false,
    description: 'Logged gym/PT/cardio/sport sessions in the last N days, including exercises, sets, reps and weights (kg).',
    schema: z.object({ days: z.number().int().min(1).max(365).default(30) }).strict(),
    run: async (a, c) => { const s = await sessions(c, a.days); return { summary: `${s.length} sessions`, rows: 0, data: s } },
  },
  {
    name: 'get_checkins', write: false,
    description: 'Daily knee/soreness/sleep check-ins for the last N days, newest first.',
    schema: z.object({ days: z.number().int().min(1).max(365).default(30) }).strict(),
    run: async (a, c) => {
      const d = await sel(c.db.from('daily_checkin').select('*').eq('user_id', c.uid).gte('date', addDays(todayLocal(), -a.days)).order('date', { ascending: false })) as any[]
      return { summary: `${d.length} check-ins`, rows: 0, data: d }
    },
  },
  {
    name: 'get_body_metrics', write: false,
    description: 'Most recent body composition measurements (weight, body fat, muscle, etc.), newest first.',
    schema: z.object({ limit: z.number().int().min(1).max(200).default(20) }).strict(),
    run: async (a, c) => {
      const d = await sel(c.db.from('body_metrics').select('*').eq('user_id', c.uid).order('date', { ascending: false }).limit(a.limit)) as any[]
      return { summary: `${d.length} measurements`, rows: 0, data: d }
    },
  },
  {
    name: 'get_daily_metrics', write: false,
    description: 'Imported wearable daily data (sleep, resting HR, HRV, steps, VO2max…) for the last N days.',
    schema: z.object({ days: z.number().int().min(1).max(400).default(30) }).strict(),
    run: async (a, c) => {
      const d = await sel(c.db.from('daily_metrics').select('*').eq('user_id', c.uid).gte('date', addDays(todayLocal(), -a.days)).order('date', { ascending: false })) as any[]
      return { summary: `${d.length} days`, rows: 0, data: d }
    },
  },
  // ----- writes -----
  {
    name: 'upsert_template', write: true,
    description: 'Create or update a program template by its code (session_type gym|pt|cardio|sport|recovery, day_of_week 0=Sunday or null).',
    schema: z.object({
      code: z.string().min(1).max(32), name: z.string().min(1).max(100), session_type: sessionType,
      day_of_week: z.number().int().min(0).max(6).nullable().optional(), target_minutes: z.number().int().min(1).max(600).nullable().optional(),
      notes: z.string().max(2000).nullable().optional(), dry_run: dryRun,
    }).strict(),
    run: async (a, c) => {
      const { dry_run, ...f } = a
      const before = await sel(c.db.from('program_templates').select('*').eq('user_id', c.uid).eq('code', f.code).maybeSingle()) as any
      const changes = diff(before, f)
      if (dry_run) return { summary: `would ${before ? 'update' : 'insert'} 1 row in program_templates`, rows: 1, data: { table: 'program_templates', action: before ? 'update' : 'insert', rows: 1, changes } }
      const r = before
        ? await sel(c.db.from('program_templates').update(f).eq('id', before.id).select().single())
        : await sel(c.db.from('program_templates').insert({ ...f, user_id: c.uid }).select().single())
      return { summary: `${before ? 'updated' : 'inserted'} template ${f.code}`, rows: 1, data: { action: before ? 'updated' : 'inserted', changes, row: r } }
    },
  },
  {
    name: 'set_template_exercises', write: true,
    description: 'Replace the entire exercise list of a template (max 15). Dry run returns the old and new lists.',
    schema: z.object({
      template_code: z.string().min(1),
      exercises: z.array(z.object({
        sort_order: z.number().int().min(0), exercise_name: z.string().min(1).max(120),
        sets: z.number().int().min(1).max(20).nullable().optional(), reps: z.string().max(40).nullable().optional(),
        load_note: z.string().max(200).nullable().optional(), coaching_cue: z.string().max(500).nullable().optional(),
        is_knee_critical: z.boolean().default(false),
      }).strict()).max(15, 'at most 15 exercises per template'),
      dry_run: dryRun,
    }).strict(),
    run: async (a, c) => {
      const orders = a.exercises.map((e: any) => e.sort_order)
      if (new Set(orders).size !== orders.length) throw new ToolErr('sort_order values must be unique')
      const t = await sel(c.db.from('program_templates').select('id').eq('user_id', c.uid).eq('code', a.template_code).maybeSingle()) as any
      if (!t) throw new ToolErr(`template ${a.template_code} not found`)
      const old = await sel(c.db.from('template_exercises').select('sort_order, exercise_name, sets, reps, load_note, coaching_cue, is_knee_critical').eq('template_id', t.id).order('sort_order')) as any[]
      if (a.dry_run) return { summary: `would replace ${old.length} with ${a.exercises.length} rows in template_exercises`, rows: a.exercises.length, data: { table: 'template_exercises', removed: old.length, inserted: a.exercises.length, old_list: old, new_list: a.exercises } }
      const { data, error } = await c.db.rpc('mcp_set_template_exercises', { p_user: c.uid, p_code: a.template_code, p_exercises: a.exercises })
      if (error) throw new Error(error.message)
      return { summary: `replaced exercises of ${a.template_code}`, rows: data as number, data: { replaced: old.length, inserted: data, old_list: old } }
    },
  },
  {
    name: 'deactivate_template', write: true,
    description: 'Mark a template inactive (active=false). Templates are never deleted.',
    schema: z.object({ code: z.string().min(1), dry_run: dryRun }).strict(),
    run: async (a, c) => {
      const t = await sel(c.db.from('program_templates').select('id, active').eq('user_id', c.uid).eq('code', a.code).maybeSingle()) as any
      if (!t) throw new ToolErr(`template ${a.code} not found`)
      const changes = { active: { before: t.active, after: false } }
      if (a.dry_run) return { summary: `would update 1 row in program_templates`, rows: t.active ? 1 : 0, data: { table: 'program_templates', action: 'update', rows: 1, changes } }
      await sel(c.db.from('program_templates').update({ active: false }).eq('id', t.id).select())
      return { summary: `deactivated ${a.code}`, rows: 1, data: { changes } }
    },
  },
  {
    name: 'log_session', write: true,
    description: 'Log a completed session (date within the last 7 days, not future). gym→gym log, pt/sport-prep/recovery with exercises→PT log, cardio/sport without exercises→cardio log (name = activity).',
    schema: z.object({
      date: dateStr, session_type: sessionType, name: z.string().min(1).max(100),
      duration_min: z.number().min(1).max(600),
      exercises: z.array(z.object({
        exercise_name: z.string().min(1).max(120),
        sets: z.array(z.object({ reps: z.number().int().min(0).max(1000), weight_kg: z.number().min(0).max(500).default(0) }).strict()).min(1).max(30),
      }).strict()).max(30).default([]),
      notes: z.string().max(2000).optional(), dry_run: dryRun,
    }).strict(),
    run: async (a, c) => {
      const today = todayLocal()
      if (a.date > today) throw new ToolErr('date cannot be in the future')
      if (a.date < addDays(today, -7)) throw new ToolErr('date cannot be more than 7 days in the past')
      const start = new Date(`${a.date}T12:00:00+03:00`)
      const end = new Date(+start + a.duration_min * 60000)
      const base = { user_id: c.uid, date: start.toISOString(), started_at: start.toISOString(), ended_at: end.toISOString() }
      let table: string, row: Record<string, unknown>
      const noteText = [a.name, a.notes].filter(Boolean).join(' — ')
      if (a.session_type === 'gym') {
        table = 'gym_sessions'
        row = { ...base, notes: noteText, exercises: a.exercises.map((e: any) => ({ id: crypto.randomUUID(), exerciseName: e.exercise_name, muscleGroup: 'Other', sets: e.sets.map((s: any) => ({ reps: s.reps, weight: s.weight_kg })) })) }
      } else if (a.exercises.length > 0 || a.session_type === 'pt') {
        table = 'pt_sessions'
        row = { ...base, overall_notes: noteText, exercises: a.exercises.map((e: any) => ({ id: crypto.randomUUID(), exerciseName: e.exercise_name, category: a.session_type, sets: e.sets.map((s: any) => ({ reps: s.reps, weight: s.weight_kg, painScale: 1 })) })) }
      } else {
        table = 'cardio_sessions'
        row = { ...base, activity: a.name, duration_min: a.duration_min, notes: a.notes ?? null }
      }
      if (a.dry_run) return { summary: `would insert 1 row into ${table}`, rows: 1, data: { table, action: 'insert', rows: 1, row } }
      const r = await sel(c.db.from(table).insert(row).select('id').single()) as any
      return { summary: `inserted 1 row into ${table}`, rows: 1, data: { table, id: r.id } }
    },
  },
  {
    name: 'upsert_checkin', write: true,
    description: 'Create or update the daily check-in for a date (knees 0–10, soreness/sleep 1–5).',
    schema: z.object({
      date: dateStr, knee_left: knee.optional(), knee_right: knee.optional(), swelling: z.boolean().optional(),
      soreness: z.number().int().min(1).max(5).optional(), sleep_felt: z.number().int().min(1).max(5).optional(),
      note: z.string().max(1000).optional(), dry_run: dryRun,
    }).strict(),
    run: async (a, c) => {
      const { dry_run, ...f } = a
      const before = await sel(c.db.from('daily_checkin').select('*').eq('user_id', c.uid).eq('date', f.date).maybeSingle()) as any
      const changes = diff(before, f)
      if (dry_run) return { summary: `would ${before ? 'update' : 'insert'} 1 row in daily_checkin`, rows: 1, data: { table: 'daily_checkin', action: before ? 'update' : 'insert', rows: 1, changes } }
      await sel(c.db.from('daily_checkin').upsert({ ...f, user_id: c.uid }, { onConflict: 'user_id,date' }).select())
      return { summary: `${before ? 'updated' : 'inserted'} check-in ${f.date}`, rows: 1, data: { changes } }
    },
  },
  {
    name: 'add_body_metric', write: true,
    description: 'Add a body measurement (weight 30–300 kg, body fat 3–60 %, muscle mass %).',
    schema: z.object({ date: dateStr, weight_kg: bodyWeight.optional(), body_fat_pct: bodyFat.optional(), muscle_mass_pct: z.number().min(5).max(80).optional(), dry_run: dryRun }).strict(),
    run: async (a, c) => {
      if (a.weight_kg == null && a.body_fat_pct == null && a.muscle_mass_pct == null) throw new ToolErr('provide at least one measurement')
      const row = { user_id: c.uid, date: new Date(`${a.date}T08:00:00+03:00`).toISOString(), weight: a.weight_kg ?? null, body_fat_pct: a.body_fat_pct ?? null, muscle_mass_pct: a.muscle_mass_pct ?? null }
      if (a.dry_run) return { summary: 'would insert 1 row into body_metrics', rows: 1, data: { table: 'body_metrics', action: 'insert', rows: 1, row } }
      await sel(c.db.from('body_metrics').insert(row).select())
      return { summary: 'inserted 1 body metric', rows: 1, data: { row } }
    },
  },
  {
    name: 'upsert_daily_metrics', write: true,
    description: 'Upsert wearable daily rows by date (max 400). Omitted fields never overwrite existing values.',
    schema: z.object({ rows: z.array(dailyRow).min(1).max(400, 'at most 400 rows per call'), dry_run: dryRun }).strict(),
    run: async (a, c) => {
      const dates = a.rows.map((r: any) => r.date)
      if (new Set(dates).size !== dates.length) throw new ToolErr('duplicate dates in rows')
      const existing = await sel(c.db.from('daily_metrics').select('*').eq('user_id', c.uid).in('date', dates)) as any[]
      const byDate = new Map(existing.map((r) => [r.date, r]))
      const inserted = dates.filter((d: string) => !byDate.has(d)).length
      if (a.dry_run) {
        const updates = a.rows.filter((r: any) => byDate.has(r.date)).map((r: any) => {
          const before = byDate.get(r.date); const changes = diff(before, r); delete (changes as any).date
          return { date: r.date, changes }
        }).filter((u: any) => Object.keys(u.changes).length)
        return { summary: `would insert ${inserted}, update ${dates.length - inserted} rows in daily_metrics`, rows: dates.length, data: { table: 'daily_metrics', inserted, updated: dates.length - inserted, overwrites: updates } }
      }
      const { data, error } = await c.db.rpc('mcp_upsert_daily_metrics', { p_user: c.uid, p_rows: a.rows })
      if (error) throw new Error(error.message)
      return { summary: `inserted ${inserted}, updated ${dates.length - inserted}`, rows: data as number, data: { inserted, updated: dates.length - inserted } }
    },
  },
  {
    name: 'set_weekly_goals', write: true,
    description: 'Set weekly session targets for gym, PT, cardio and sport (weeks start Sunday).',
    schema: z.object({
      gym: z.number().int().min(0).max(14).optional(), pt: z.number().int().min(0).max(14).optional(),
      cardio: z.number().int().min(0).max(14).optional(), sport: z.number().int().min(0).max(14).optional(), dry_run: dryRun,
    }).strict(),
    run: async (a, c) => {
      const f: Record<string, number> = {}
      if (a.gym != null) f.weekly_gym = a.gym; if (a.pt != null) f.weekly_pt = a.pt
      if (a.cardio != null) f.weekly_cardio = a.cardio; if (a.sport != null) f.weekly_sport = a.sport
      if (!Object.keys(f).length) throw new ToolErr('provide at least one goal')
      const before = await sel(c.db.from('goals').select('*').eq('user_id', c.uid).maybeSingle()) as any
      const changes = diff(before, f)
      if (a.dry_run) return { summary: `would ${before ? 'update' : 'insert'} 1 row in goals`, rows: 1, data: { table: 'goals', action: before ? 'update' : 'insert', rows: 1, changes } }
      await sel(c.db.from('goals').upsert({ ...f, user_id: c.uid, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select())
      return { summary: 'updated weekly goals', rows: 1, data: { changes } }
    },
  },
]
const byName = new Map(tools.map((t) => [t.name, t]))

function toolList() {
  return tools.map((t) => {
    const s: any = zodToJsonSchema(t.schema, { target: 'jsonSchema7', $refStrategy: 'none' }); delete s.$schema
    return { name: t.name, description: t.description, inputSchema: s, annotations: { readOnlyHint: !t.write, destructiveHint: false } }
  })
}

// ---------- HTTP ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (raw.length < 16) return json({ error: 'Unauthorized' }, 401)
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: tok } = await db.from('api_tokens').select('id, user_id, scope, expires_at, revoked_at').eq('token_hash', await sha256Hex(raw)).maybeSingle()
  if (!tok || tok.revoked_at || (tok.expires_at && new Date(tok.expires_at) <= new Date())) return json({ error: 'Unauthorized' }, 401)
  const ctx: Ctx = { db, uid: tok.user_id }

  let msg: any
  try { msg = await req.json() } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400) }
  if (Array.isArray(msg)) return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Batching not supported' } }, 400)
  const id = msg?.id ?? null
  const reply = (result: unknown) => json({ jsonrpc: '2.0', id, result })
  const rpcErr = (code: number, message: string) => json({ jsonrpc: '2.0', id, error: { code, message } })

  if (id === null && typeof msg?.method === 'string' && msg.method.startsWith('notifications/')) return new Response(null, { status: 202, headers: cors })
  db.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tok.id).then(() => {})

  switch (msg?.method) {
    case 'initialize':
      return reply({
        protocolVersion: msg.params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'your-daily-move', title: 'Your Daily Move', version: '1.0.0' },
        instructions: `Fitness tracker (token scope: ${tok.scope}). Start with get_dashboard. Every write tool needs dry_run; call with dry_run=true first, show the user the changes, then repeat with dry_run=false. Nothing can be deleted.`,
      })
    case 'ping': return reply({})
    case 'tools/list': return reply({ tools: toolList() })
    case 'tools/call': break
    default: return rpcErr(-32601, `Method not found: ${msg?.method}`)
  }

  const name = msg.params?.name as string
  const args = msg.params?.arguments ?? {}
  const tool = byName.get(name)
  const audit = (dry: boolean, summary: string, rows: number | null) =>
    db.from('agent_audit').insert({ user_id: tok.user_id, token_id: tok.id, tool_name: name ?? '(none)', arguments: args, dry_run: dry, result_summary: summary.slice(0, 1000), rows_affected: rows })
  const fail = async (text: string, dry = false) => { await audit(dry, `error: ${text}`, 0); return reply({ content: [{ type: 'text', text }], isError: true }) }

  // rate limit: calls by this token in last 60s
  const { count } = await db.from('agent_audit').select('id', { count: 'exact', head: true }).eq('token_id', tok.id).gte('created_at', new Date(Date.now() - 60000).toISOString())
  if ((count ?? 0) >= RATE_LIMIT) { await audit(args?.dry_run === true, 'error: rate limited', 0); return rpcErr(-32029, 'Rate limit exceeded: 60 calls per minute') }

  if (!tool) return fail(`Unknown tool: ${name}`)
  if (tool.write && tok.scope !== 'write') return fail('This token is read-only; write tools need a token with write scope.', args?.dry_run === true)
  if (tool.write && typeof args?.dry_run !== 'boolean') return fail('dry_run (boolean) is required for write tools.')
  const parsed = tool.schema.safeParse(args)
  if (!parsed.success) return fail('Validation error: ' + parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '), args?.dry_run === true)

  const dry = tool.write ? parsed.data.dry_run === true : false
  try {
    const r = await tool.run(parsed.data, ctx)
    if (tool.write || true) await audit(dry, r.summary, tool.write ? r.rows : 0)
    return reply({ content: [{ type: 'text', text: JSON.stringify({ dry_run: tool.write ? dry : undefined, summary: r.summary, result: r.data }) }] })
  } catch (e) {
    const m = e instanceof ToolErr ? e.message : 'Unexpected error; nothing was written.'
    if (!(e instanceof ToolErr)) console.error(name, e)
    return fail(m, dry)
  }
})
