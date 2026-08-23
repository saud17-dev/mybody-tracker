# Show muscle + recommended equipment everywhere, from one shared source

Today the Gym picker on `/gym` reads the `exercises` catalog in the database (178 rows, every row has a muscle group and equipment), while the Exercise Library page and the PT picker read a separate hardcoded list in `src/lib/exercises.ts` that only has a name and a group — no equipment. That is why the library and the lists don't match.

## What changes

### 1. One source of truth for Gym
The Exercise Library's Gym tab switches to the same database catalog the `/gym` picker uses. Same 178 exercises, same names, same muscle group, same equipment — library and list can no longer drift.

### 2. Equipment shown everywhere
Every exercise row (library, Gym picker, PT picker, and the logged-exercise cards in an active workout) shows two tags:
- muscle group (e.g. Chest, Upper Legs)
- recommended equipment (Barbell, Dumbbell, Kettlebell, Body Weight, Strength Machine, Bands, ...)

The detail drawer additionally lists secondary muscles worked and instructions where the catalog has them.

### 3. PT exercises get equipment too
PT exercises stay in the code list (they're not in the catalog), but each one gains a `primaryMuscle` and an `equipment` value so PT rows show the same two tags in the same style. Values used: Body Weight, Bands, Foam Roller, Lacrosse Ball, Wall, Box/Step, Dumbbell, BOSU — assigned per exercise (e.g. Band Pull-Apart -> Bands, Foam Roll - Quad -> Foam Roller, Dead Bug -> Body Weight).

### 4. Filters match
The library's Gym tab gets the same two filter chips as the Gym picker (muscle and equipment) so filtering behaves identically in both places. PT keeps its body-area chips and gains an equipment chip.

## Technical notes

- `ExerciseDef` in `src/lib/exercises.ts` gains optional `equipment` and `primaryMuscle`; PT entries are filled in.
- New shared row component (`ExerciseRow`) rendering name + muscle badge + equipment badge, used by `ExerciseLibrary.tsx`, `ExercisePicker.tsx`, and `AddExerciseSheet.tsx` so all three look identical.
- `ExerciseLibrary.tsx` Gym tab uses `useExerciseCatalog()` from `src/lib/exerciseDb.ts`; custom exercises created from `/gym` (stored in the catalog as `is_custom`) now appear in the library automatically.
- `ExerciseDetailDrawer.tsx` accepts the catalog shape (equipment, secondary muscles, instructions) in addition to the existing static shape.
- `WorkoutExerciseCard` shows the equipment tag next to the muscle group using the `equipment` already stored on each logged entry.
- Favorites keep working — they are keyed by exercise name, which is unchanged.
- No database or schema changes.
