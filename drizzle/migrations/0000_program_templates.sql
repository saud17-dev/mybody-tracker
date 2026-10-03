CREATE TABLE public.program_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('gym','pt','cardio','sport','recovery')),
  day_of_week smallint CHECK (day_of_week BETWEEN 0 AND 6),
  target_minutes int,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_templates TO authenticated;
GRANT ALL ON public.program_templates TO service_role;
ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own program_templates" ON public.program_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX program_templates_user_dow_idx ON public.program_templates (user_id, day_of_week);

CREATE TABLE public.template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  exercise_name text NOT NULL,
  sets int,
  reps text,
  load_note text,
  coaching_cue text,
  is_knee_critical boolean NOT NULL DEFAULT false,
  UNIQUE (template_id, sort_order)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_exercises TO authenticated;
GRANT ALL ON public.template_exercises TO service_role;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own template_exercises" ON public.template_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.program_templates t WHERE t.id = template_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.program_templates t WHERE t.id = template_id AND t.user_id = auth.uid()));