CREATE TABLE public.plan_skips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, day_of_week)
);

ALTER TABLE public.plan_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own plan_skips all"
ON public.plan_skips
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_plan_skips_user_week ON public.plan_skips (user_id, week_start);