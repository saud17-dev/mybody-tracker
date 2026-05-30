import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function randomToken(bytes = 36): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const jwt = authHeader.replace('Bearer ', '')
  const { data: claims, error: cErr } = await userClient.auth.getClaims(jwt)
  if (cErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401)
  const userId = claims.claims.sub as string

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: { action?: string; id?: string; name?: string } = {}
  try { body = await req.json() } catch { /* empty */ }

  const action = body.action ?? 'list'

  if (action === 'list') {
    const { data, error } = await admin
      .from('share_tokens')
      .select('id, name, created_at, last_used_at, revoked_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, 500)
    return json({ tokens: data ?? [] }, 200)
  }

  if (action === 'create') {
    const token = randomToken()
    const tokenHash = await sha256Hex(token)
    const { data, error } = await admin
      .from('share_tokens')
      .insert({ user_id: userId, name: body.name ?? 'Claude access', token_hash: tokenHash })
      .select('id, name, created_at')
      .single()
    if (error) return json({ error: error.message }, 500)
    return json({ token, record: data }, 200)
  }

  if (action === 'revoke') {
    if (!body.id) return json({ error: 'id required' }, 400)
    const { error } = await admin
      .from('share_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('user_id', userId)
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true }, 200)
  }

  if (action === 'delete') {
    if (!body.id) return json({ error: 'id required' }, 400)
    const { error } = await admin
      .from('share_tokens')
      .delete()
      .eq('id', body.id)
      .eq('user_id', userId)
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true }, 200)
  }

  return json({ error: 'Unknown action' }, 400)
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
