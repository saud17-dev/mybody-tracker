CREATE INDEX IF NOT EXISTS exercises_name_lower_idx ON public.exercises (lower(name));

UPDATE public.gym_sessions gs
SET exercises = sub.new_ex
FROM (
  SELECT gs2.id,
    (
      SELECT jsonb_agg(
        CASE WHEN ex.id IS NOT NULL THEN e.value || jsonb_build_object('exerciseId', ex.id)
             ELSE e.value END
        ORDER BY e.ordinality
      )
      FROM jsonb_array_elements(gs2.exercises) WITH ORDINALITY AS e(value, ordinality)
      LEFT JOIN public.exercises ex
        ON lower(ex.name) = lower(e.value->>'exerciseName')
    ) AS new_ex
  FROM public.gym_sessions gs2
  WHERE jsonb_typeof(gs2.exercises) = 'array'
    AND jsonb_array_length(gs2.exercises) > 0
) sub
WHERE gs.id = sub.id AND sub.new_ex IS NOT NULL;