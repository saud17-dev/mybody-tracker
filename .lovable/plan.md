# Hevy-style exercise selection on the Gym page

## Schema changes (review before I apply)

Nothing is removed or renamed. Two additive changes:

1. **`exercises` table** — no structural change needed; it already has everything
   (`name`, `muscle_group`, `secondary_muscles`, `equipment`, `exercise_type`,
   `instructions`, `is_custom`, `created_by`). I will only add:
   - `GRANT`/policy check so signed-in users can read all rows and insert their own
     custom rows (already covered by the existing read-all + insert-own policies).
   - An index on `lower(name)` for fast case-insensitive search.

2. **Linking existing workout data** — gym workouts are stored as a `jsonb`
   `exercises` array inside `gym_sessions` (not as separate rows), so there is no
   column to hang a real foreign key on without restructuring the table. Instead:
   - Each entry in the jsonb array gains an optional `exerciseId` field going forward.
   - A one-off data backfill matches existing entries to `exercises.id` by
     case-insensitive name and writes `exerciseId` into the jsonb. Entries with no
     match keep their plain `exerciseName` and stay fully functional.
   - `exerciseName` stays in the payload as the source of truth for display, so no
     existing session can break.

   If you would rather have a true FK column, that requires splitting
   `gym_sessions.exercises` into a child table — say the word and I will plan that
   separately instead.

No other tables are touched.

## App changes

### Add Exercise screen (full-screen sheet)
- Sticky header: `Cancel` / title "Add Exercise" / `Create`.
- Search input with magnifier, case-insensitive substring match on name.
- Two filter chips: "All Equipment" and "All Muscles"; each opens a bottom sheet
  with the distinct values from the table. Selecting one relabels the chip and
  filters. Filters combine with search.

### Exercise list
- "Popular Exercises" section (hardcoded set: Bench Press (Barbell), Squat (Barbell),
  Deadlift (Barbell), Pull-Up, Lat Pulldown (Cable), Bent Over Row (Barbell),
  Overhead Press (Barbell), Bicep Curl (Dumbbell), Leg Press (Machine), Plank).
- "All Exercises" alphabetically below it.
- Row: circular thumbnail placeholder with initials, semibold name, gray
  `muscle_group` subtitle, and an ⓘ button opening a detail sheet with equipment,
  secondary muscles and instructions.

### Create custom exercise
- `Create` in the header opens a form (name, muscle group, equipment, type) and
  inserts into `exercises` with `is_custom = true`, `created_by = auth.uid()`.
  New row appears in the list immediately and is selectable.

### Logging behavior by `exercise_type`
| type | columns |
| --- | --- |
| weight_reps | kg + reps |
| bodyweight_reps | reps |
| weighted_bodyweight | +kg (added) + reps |
| assisted_bodyweight | -kg (assistance) + reps |
| duration | time |
| distance_duration | distance + time |

Every set row keeps a PREVIOUS column (last session's value for that exercise) and
the existing green completion checkmark.

## Technical notes
- New `src/lib/exerciseDb.ts`: typed hooks `useExerciseCatalog()` and
  `useCreateExercise()` reading from the `exercises` table via React Query.
- New `src/components/AddExerciseSheet.tsx` replaces `ExercisePicker` on `/gym`
  (PT keeps its current picker).
- `GymExerciseEntry` gains optional `exerciseId`, `equipment`, `exerciseType`.
- Set-row rendering in `Gym.tsx` becomes type-driven; kg/reps stay the default so
  existing sessions render exactly as today.
- Weights continue to be stored in kg and converted at the UI boundary.
