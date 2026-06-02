ALTER TABLE public.body_metrics
  ADD COLUMN IF NOT EXISTS bmi numeric,
  ADD COLUMN IF NOT EXISTS skeletal_muscle_pct numeric,
  ADD COLUMN IF NOT EXISTS fat_free_mass_kg numeric,
  ADD COLUMN IF NOT EXISTS subcutaneous_fat_pct numeric,
  ADD COLUMN IF NOT EXISTS visceral_fat numeric,
  ADD COLUMN IF NOT EXISTS body_water_pct numeric,
  ADD COLUMN IF NOT EXISTS muscle_mass_kg numeric,
  ADD COLUMN IF NOT EXISTS bone_mass_kg numeric,
  ADD COLUMN IF NOT EXISTS protein_pct numeric,
  ADD COLUMN IF NOT EXISTS bmr_kcal numeric,
  ADD COLUMN IF NOT EXISTS metabolic_age numeric;