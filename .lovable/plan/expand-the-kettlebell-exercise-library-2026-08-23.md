# Expand the kettlebell exercise library

## Why it looks empty

The exercise database currently holds 178 exercises, and only **3** are tagged as Kettlebell equipment:

- Kettlebell Swing
- Overhead Press (Kettlebell)
- Floor Press (Kettlebell)

Compared to 42 machine, 40 bodyweight, 34 dumbbell and 31 barbell entries. Nothing is filtering them out — the original seed list simply barely included kettlebells.

## What to add

Seed roughly 30 more kettlebell movements, each with a primary muscle, secondary muscles and the Kettlebell equipment tag so they show in the library, the Gym picker and the equipment filter:

- Swings/ballistics: two-hand swing (exists), single-arm swing, dead stop swing, high pull, snatch, clean, clean and press, push press, jerk
- Squats/lunges: goblet squat, front squat (double), racked lunge, reverse lunge, split squat, step-up, cossack squat
- Hinge/posterior: single-leg deadlift, sumo deadlift, romanian deadlift, good morning, swing to squat
- Press/upper: single-arm overhead press, double overhead press, half kneeling press, Z press, bent-over row, single-arm row, renegade row, gorilla row, upright row, pullover, halo, curl
- Core/carry: Turkish get-up, windmill, suitcase carry, racked carry, farmer's carry, sit-up, Russian twist

## Technical details

- New database migration inserting the exercises into `public.exercises` with `equipment = 'Kettlebell'`, correct `muscle_group`, `secondary_muscles`, and `exercise_type` (`weight_reps` for most; `duration` for carries and holds). Insert guarded so existing names are not duplicated.
- Mirror the same names in the static list in `src/lib/exercises.ts` (with `equipment: "Kettlebell"`) so PT/offline pickers match the library, keeping the existing normalization so no duplicate variants appear.
- Add short form cues for the new movements in `src/lib/exerciseCues.ts` so the detail drawer stays useful.
