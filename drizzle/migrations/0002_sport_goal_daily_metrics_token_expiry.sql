ALTER TABLE public.goals ADD COLUMN weekly_sport integer NOT NULL DEFAULT 1;

ALTER TABLE public.share_tokens ADD COLUMN expires_at timestamptz DEFAULT (now() + interval '90 days');
UPDATE public.share_tokens SET expires_at = now() + interval '90 days' WHERE expires_at IS NULL;

CREATE TABLE public.daily_metrics (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  sleep_asleep_min int, sleep_in_bed_min int, sleep_efficiency numeric, sleep_score numeric,
  sleep_deep_min int, sleep_rem_min int, sleep_light_min int, sleep_wake_min int,
  sleep_start timestamptz, sleep_end timestamptz,
  resting_hr numeric, hrv_ms numeric, nonrem_hr numeric,
  steps int, cardio_load numeric, workout_min int, workout_peak_min int, workouts text,
  vo2max numeric, weight_kg numeric, body_fat_pct numeric,
  source text DEFAULT 'takeout',
  imported_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_metrics TO authenticated;
GRANT ALL ON public.daily_metrics TO service_role;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily_metrics" ON public.daily_metrics FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);