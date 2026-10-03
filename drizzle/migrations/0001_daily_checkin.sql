CREATE TABLE public.daily_checkin (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  knee_left smallint CHECK (knee_left BETWEEN 0 AND 10),
  knee_right smallint CHECK (knee_right BETWEEN 0 AND 10),
  swelling boolean DEFAULT false,
  soreness smallint CHECK (soreness BETWEEN 1 AND 5),
  sleep_felt smallint CHECK (sleep_felt BETWEEN 1 AND 5),
  note text,
  PRIMARY KEY (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_checkin TO authenticated;
GRANT ALL ON public.daily_checkin TO service_role;
ALTER TABLE public.daily_checkin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checkin" ON public.daily_checkin FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);