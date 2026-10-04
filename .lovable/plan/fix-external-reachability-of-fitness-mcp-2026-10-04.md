# Fix external reachability of fitness-mcp

Only two files change: `supabase/config.toml` and `supabase/functions/fitness-mcp/index.ts`. The tools, auth, audit log and guardrails stay the same.

The transport is already JSON-RPC 2.0 MCP. `initialize`, `ping`, `tools/list` and `tools/call` all run on one POST endpoint, and notifications get a 202. It doesn't need rebuilding; the only missing piece was the `mcp-session-id` header, which is added below.

## supabase/config.toml

```diff
 [functions.share-data]
 verify_jwt = false
+
+[functions.fitness-mcp]
+verify_jwt = false
```

## supabase/functions/fitness-mcp/index.ts

### Headers (lines 7–13)

```diff
 const cors = {
   'Access-Control-Allow-Origin': '*',
-  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version',
   'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
+  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey, mcp-session-id, mcp-protocol-version, accept',
+  'Access-Control-Expose-Headers': 'mcp-session-id',
 }
-const json = (b: unknown, status = 200) =>
-  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
+const json = (b: unknown, status = 200, extra: Record<string, string> = {}) =>
+  new Response(JSON.stringify(b), { status, headers: { ...cors, ...extra, 'Content-Type': 'application/json' } })
```

`Access-Control-Allow-Origin` and `Access-Control-Expose-Headers` are part of `cors`, which every response already spreads in, including the 401s, the parse error and JSON-RPC errors.

### Routing at the top of the handler (lines 339–341)

```diff
 Deno.serve(async (req) => {
-  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
-  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
+  if (req.method === 'OPTIONS') {
+    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Max-Age': '86400' } })
+  }
+  if (req.method === 'GET') {
+    // Unauthenticated health check: no user data, only the tool count.
+    return json({ status: 'ok', transport: 'streamable-http', tools: tools.length })
+  }
+  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
```

### Session id (around lines 355–358)

```diff
+  // Reuse the client's session id; mint one on initialize or when it is missing.
+  const sessionId = req.headers.get('mcp-session-id') ?? crypto.randomUUID()
+  const sess = { 'mcp-session-id': sessionId }
-  const reply = (result: unknown) => json({ jsonrpc: '2.0', id, result })
-  const rpcErr = (code: number, message: string) => json({ jsonrpc: '2.0', id, error: { code, message } })
+  const reply = (result: unknown) => json({ jsonrpc: '2.0', id, result }, 200, sess)
+  const rpcErr = (code: number, message: string) => json({ jsonrpc: '2.0', id, error: { code, message } }, 200, sess)

-  if (...notifications/...) return new Response(null, { status: 202, headers: cors })
+  if (...notifications/...) return new Response(null, { status: 202, headers: { ...cors, ...sess } })
```

The `initialize` result already includes `protocolVersion`, `capabilities` and `serverInfo`; it now also sends the `mcp-session-id` header.

## After applying

1. Redeploy fitness-mcp.
2. Check that a GET returns the health JSON with `tools: 14` and no login.
3. Check that OPTIONS returns 204 with the headers above.
4. Check that `initialize` returns the result plus the `mcp-session-id` header.
5. Check that `tools/list` works with a temporary token, then revoke the token.
