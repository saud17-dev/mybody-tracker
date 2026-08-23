DROP POLICY IF EXISTS "own share_tokens select" ON public.share_tokens;
DROP POLICY IF EXISTS "own share_tokens insert" ON public.share_tokens;
DROP POLICY IF EXISTS "own share_tokens update" ON public.share_tokens;
DROP POLICY IF EXISTS "own share_tokens delete" ON public.share_tokens;

REVOKE ALL ON public.share_tokens FROM anon;
REVOKE ALL ON public.share_tokens FROM authenticated;
GRANT ALL ON public.share_tokens TO service_role;

ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;