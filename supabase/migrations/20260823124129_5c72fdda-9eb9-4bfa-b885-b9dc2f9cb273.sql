ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS carbs_g numeric, ADD COLUMN IF NOT EXISTS fat_g numeric;
ALTER TABLE public.meal_presets ADD COLUMN IF NOT EXISTS carbs_g numeric, ADD COLUMN IF NOT EXISTS fat_g numeric;
ALTER TABLE public.nutrition_goals ADD COLUMN IF NOT EXISTS daily_carbs_g integer, ADD COLUMN IF NOT EXISTS daily_fat_g integer;