# Hevy-style active workout session

Rebuild the Gym "New / Edit workout" sheet so starting a workout looks and behaves like the screenshots. Existing data model, saving, drafts, and history stay unchanged.

## 1. Session header (screenshot 4)
- Sticky top bar: collapse chevron (minimise the sheet back to the page while the session keeps running), live elapsed session time in place of the title ("1min 8s") once a workout is running, a clock icon button, and a filled "Finish" pill on the right (replaces the bottom "Save workout" button).
- For an edit of a past workout the timer is replaced by "Edit Workout" and Finish saves changes.
- Date picker moves into a compact row under the header so backdating still works.

## 2. Stats strip
- Under the header: Duration / Volume / Sets, updating live as sets are entered and ticked.
- Empty state below it: dumbbell icon, "Get started", and a primary "Add Exercise" button.

## 3. Exercise cards (screenshots 1 & 2)
- Round thumbnail with initials, exercise name in the accent colour, and a "..." menu (remove exercise, reorder later).
- "Add notes here..." inline note field per exercise (stored per exercise entry).
- "Rest Timer: 20s" row with a small timer icon — tap to set the per-exercise rest duration; ticking a set auto-starts that duration.
- Set table columns: SET / PREVIOUS / KG / REPS / ✓ (columns still adapt to exercise_type as today).
- Completed set row turns fully green; the active row is highlighted with a left accent bar.
- "+ Add Set" full-width button per exercise.

## 4. Session action buttons
- Below the exercise list: full-width "+ Add Exercise", then a two-up row "Settings" and "Discard Workout" (destructive colour, confirm dialog before discarding).

## 5. Clock sheet (screenshot 4)
- The clock icon in the header opens a bottom sheet titled "Clock" with a Timer / Stopwatch segmented toggle.
- Timer: large circular countdown ring, -15s / +15s, Start / Pause / Reset.
- Stopwatch: count-up mode (replaces the current floating stopwatch).
- Rest running: compact bottom bar with progress line, big MM:SS, and -15 / +15 / Skip (screenshot 2).

## 6. Plate calculator (screenshot 3)
- Tapping a KG cell opens a "Plate Calculator" sheet: target weight, visual plate stack per side, "Closest possible weight is Xkg" warning, available plate chips (25/20/15/10/5/2.5/1.25) and bar selection (Standard 20kg / Short 15kg / Olympic etc.).
- Plate and bar availability saved locally so it persists between sessions.

## Technical notes
- No database changes. Per-exercise `notes` and `restSeconds` are added as optional fields on `GymExerciseEntry` (jsonb) — existing sessions stay valid.
- New components: `WorkoutSessionHeader`, `ClockSheet` (absorbs `RestTimer` + `ManualStopwatch`), `PlateCalculatorSheet`, `WorkoutExerciseCard` extracted out of `Gym.tsx` to keep the page manageable.
- Colours use existing theme tokens (sage `gym`, terracotta accent, `success` for completed sets) rather than Hevy blue.
- Draft autosave extends to cover per-exercise notes, rest settings, and elapsed time so a refresh mid-session restores the running workout.
