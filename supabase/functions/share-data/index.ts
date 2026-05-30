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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token || token.length < 16) {
      return json({ error: 'Missing or invalid token' }, 400)
    }

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

    const tables = [
      'profiles', 'goals', 'gym_sessions', 'pt_sessions', 'cardio_sessions',
      'body_metrics', 'workout_templates', 'plan_schedule', 'plan_skips',
      'meal_logs', 'meal_presets', 'nutrition_goals', 'custom_exercises',
    ] as const

    const results: Record<string, unknown[]> = {}
    for (const t of tables) {
      const col = t === 'profiles' ? 'id' : 'user_id'
      const { data, error } = await admin.from(t).select('*').eq(col, uid)
      if (error) return json({ error: `Failed reading ${t}: ${error.message}` }, 500)
      results[t] = data ?? []
    }

    admin.from('share_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tokenRow.id).then(() => {})

    return json({
      generated_at: new Date().toISOString(),
      note: 'Read-only export of fitness tracker data. Weights in kg, distances in km.',
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
