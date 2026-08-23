# Carry last session's weights, reps and sets into the next workout

Today the Gym log only *shows* your last performance in the small grey "PREVIOUS" column, but every new exercise starts at 0 kg / 8 reps with a single set. This change pre-fills the new session with exactly what you did last time.

## What changes

### Adding an exercise
When you pick an exercise from the Add Exercise sheet:
- If you have logged it before, the card is created with the **same number of sets** and each set pre-filled with the **weight and reps (or time/distance)** from that last session.
- Pre-filled sets are not marked done — they are editable starting points you tick off as you go.
- Never logged before: unchanged behaviour (one empty set).

### Adding a set inside an exercise
"+ Add Set" already copies the last row; if the row being added matches an existing set index from last time, use last time's values for that index instead.

### Loading a template
Templates keep their prescribed set count, but each set's weight/reps are seeded from your last logged performance for that exercise instead of 0.

### Visual clarity
Pre-filled values render slightly muted until you edit or tick the set, so it's obvious they are suggestions from last time, not logged data.

### PT page
Same carry-over applies to PT exercises (reps/weight from last PT session for that exercise); pain scale is not carried over.

## Technical notes
- Reuse the existing `previousByExercise` map in `src/pages/Gym.tsx` (already excludes the session being edited); extend it to also return set count.
- Seed in `addExercise`, in the template loader, and in `addSet`.
- Editing a past workout is unaffected — it loads the saved session as-is.
- No database or schema changes.
