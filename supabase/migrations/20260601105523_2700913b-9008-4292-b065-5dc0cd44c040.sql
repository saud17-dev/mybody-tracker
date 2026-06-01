ALTER TABLE public.gym_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz, ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE public.pt_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz, ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE public.cardio_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz, ADD COLUMN IF NOT EXISTS ended_at timestamptz;