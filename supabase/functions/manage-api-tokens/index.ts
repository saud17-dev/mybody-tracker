import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('')
}
function randomToken() {
  const a = new Uint8Array(36); crypto.getRandomValues(a)
  return 'ydm_' + btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), label: z.string().trim().min(1).max(80), scope: z.enum(['read', 'write']), days: z.union([z.literal(30), z.literal(90), z.literal(365)]) }),
  z.object({ action: z.literal('revoke'), id: z.string().uuid() }),
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: claims, error: cErr } = await userClient.auth.getClaims(authHeader.slice(7))
  if (cErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401)
  const userId = claims.claims.sub as string

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const b = parsed.data

  if (b.action === 'create') {
    const token = randomToken()
    const { data, error } = await admin.from('api_tokens').insert({
      user_id: userId, token_hash: await sha256Hex(token), label: b.label, scope: b.scope,
      expires_at: new Date(Date.now() + b.days * 86400000).toISOString(),
    }).select('id').single()
    if (error) return json({ error: error.message }, 500)
    return json({ token, id: data.id })
  }
  const { data, error } = await admin.from('api_tokens').update({ revoked_at: new Date().toISOString() })
    .eq('id', b.id).eq('user_id', userId).is('revoked_at', null).select('id')
  if (error) return json({ error: error.message }, 500)
  if (!data?.length) return json({ error: 'Not found' }, 404)
  return json({ ok: true })
})
