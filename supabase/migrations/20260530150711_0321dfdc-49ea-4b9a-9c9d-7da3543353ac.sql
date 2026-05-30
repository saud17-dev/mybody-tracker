
CREATE TABLE public.share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Claude access',
  token_hash text NOT NULL UNIQUE,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_tokens TO authenticated;
GRANT ALL ON public.share_tokens TO service_role;

ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own share_tokens select" ON public.share_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own share_tokens insert" ON public.share_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own share_tokens update" ON public.share_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own share_tokens delete" ON public.share_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX share_tokens_user_id_idx ON public.share_tokens(user_id);
