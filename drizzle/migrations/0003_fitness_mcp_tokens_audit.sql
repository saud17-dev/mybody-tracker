CREATE TABLE public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text,
  scope text NOT NULL CHECK (scope IN ('read','write')),
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_tokens TO authenticated;
GRANT ALL ON public.api_tokens TO service_role;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own api_tokens" ON public.api_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.agent_audit (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  token_id uuid,
  tool_name text NOT NULL,
  arguments jsonb NOT NULL,
  dry_run boolean NOT NULL,
  result_summary text,
  rows_affected int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_audit TO authenticated;
GRANT ALL ON public.agent_audit TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.agent_audit_id_seq TO service_role;
ALTER TABLE public.agent_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own agent_audit" ON public.agent_audit FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX agent_audit_user_created_idx ON public.agent_audit (user_id, created_at DESC);
CREATE INDEX agent_audit_token_created_idx ON public.agent_audit (token_id, created_at DESC);

-- Migrate live share-data tokens (same SHA-256 hash) as read tokens, 30-day expiry
INSERT INTO public.api_tokens (user_id, token_hash, label, scope, expires_at, last_used_at, created_at)
SELECT user_id, token_hash, name, 'read', now() + interval '30 days', last_used_at, created_at
FROM public.share_tokens WHERE revoked_at IS NULL
ON CONFLICT (token_hash) DO NOTHING;
COMMENT ON TABLE public.share_tokens IS 'DEPRECATED: replaced by api_tokens';

-- Atomic: replace a template's exercise list
CREATE OR REPLACE FUNCTION public.mcp_set_template_exercises(p_user uuid, p_code text, p_exercises jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t_id uuid; n int;
BEGIN
  SELECT id INTO t_id FROM program_templates WHERE user_id = p_user AND code = p_code;
  IF t_id IS NULL THEN RAISE EXCEPTION 'template % not found', p_code; END IF;
  DELETE FROM template_exercises WHERE template_id = t_id;
  INSERT INTO template_exercises (template_id, sort_order, exercise_name, sets, reps, load_note, coaching_cue, is_knee_critical)
  SELECT t_id, (e->>'sort_order')::int, e->>'exercise_name', (e->>'sets')::int, e->>'reps', e->>'load_note', e->>'coaching_cue',
         COALESCE((e->>'is_knee_critical')::boolean, false)
  FROM jsonb_array_elements(p_exercises) e;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Atomic: upsert daily metrics, never overwriting with null
CREATE OR REPLACE FUNCTION public.mcp_upsert_daily_metrics(p_user uuid, p_rows jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  INSERT INTO daily_metrics AS d (user_id, date, sleep_asleep_min, sleep_in_bed_min, sleep_efficiency, sleep_score,
    sleep_deep_min, sleep_rem_min, sleep_light_min, sleep_wake_min, sleep_start, sleep_end, resting_hr, hrv_ms, nonrem_hr,
    steps, cardio_load, workout_min, workout_peak_min, workouts, vo2max, weight_kg, body_fat_pct, source, imported_at)
  SELECT p_user, r.date, r.sleep_asleep_min, r.sleep_in_bed_min, r.sleep_efficiency, r.sleep_score,
    r.sleep_deep_min, r.sleep_rem_min, r.sleep_light_min, r.sleep_wake_min, r.sleep_start, r.sleep_end, r.resting_hr, r.hrv_ms, r.nonrem_hr,
    r.steps, r.cardio_load, r.workout_min, r.workout_peak_min, r.workouts, r.vo2max, r.weight_kg, r.body_fat_pct, 'agent', now()
  FROM jsonb_to_recordset(p_rows) AS r(date date, sleep_asleep_min int, sleep_in_bed_min int, sleep_efficiency numeric, sleep_score numeric,
    sleep_deep_min int, sleep_rem_min int, sleep_light_min int, sleep_wake_min int, sleep_start timestamptz, sleep_end timestamptz,
    resting_hr numeric, hrv_ms numeric, nonrem_hr numeric, steps int, cardio_load numeric, workout_min int, workout_peak_min int,
    workouts text, vo2max numeric, weight_kg numeric, body_fat_pct numeric)
  ON CONFLICT (user_id, date) DO UPDATE SET
    sleep_asleep_min = COALESCE(EXCLUDED.sleep_asleep_min, d.sleep_asleep_min),
    sleep_in_bed_min = COALESCE(EXCLUDED.sleep_in_bed_min, d.sleep_in_bed_min),
    sleep_efficiency = COALESCE(EXCLUDED.sleep_efficiency, d.sleep_efficiency),
    sleep_score = COALESCE(EXCLUDED.sleep_score, d.sleep_score),
    sleep_deep_min = COALESCE(EXCLUDED.sleep_deep_min, d.sleep_deep_min),
    sleep_rem_min = COALESCE(EXCLUDED.sleep_rem_min, d.sleep_rem_min),
    sleep_light_min = COALESCE(EXCLUDED.sleep_light_min, d.sleep_light_min),
    sleep_wake_min = COALESCE(EXCLUDED.sleep_wake_min, d.sleep_wake_min),
    sleep_start = COALESCE(EXCLUDED.sleep_start, d.sleep_start),
    sleep_end = COALESCE(EXCLUDED.sleep_end, d.sleep_end),
    resting_hr = COALESCE(EXCLUDED.resting_hr, d.resting_hr),
    hrv_ms = COALESCE(EXCLUDED.hrv_ms, d.hrv_ms),
    nonrem_hr = COALESCE(EXCLUDED.nonrem_hr, d.nonrem_hr),
    steps = COALESCE(EXCLUDED.steps, d.steps),
    cardio_load = COALESCE(EXCLUDED.cardio_load, d.cardio_load),
    workout_min = COALESCE(EXCLUDED.workout_min, d.workout_min),
    workout_peak_min = COALESCE(EXCLUDED.workout_peak_min, d.workout_peak_min),
    workouts = COALESCE(EXCLUDED.workouts, d.workouts),
    vo2max = COALESCE(EXCLUDED.vo2max, d.vo2max),
    weight_kg = COALESCE(EXCLUDED.weight_kg, d.weight_kg),
    body_fat_pct = COALESCE(EXCLUDED.body_fat_pct, d.body_fat_pct),
    imported_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.mcp_set_template_exercises(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mcp_upsert_daily_metrics(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mcp_set_template_exercises(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.mcp_upsert_daily_metrics(uuid, jsonb) TO service_role;