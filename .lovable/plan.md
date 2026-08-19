# Give Claude a complete read-only view

Your share link already returns most of your data, but a few things are missing and the payload has no explanation of what the numbers mean — so Claude has to guess. This makes the export complete and self-describing, still strictly read-only.

## What changes

1. **Add the missing data**
   - Favorite exercises (currently not exported).
   - Your custom entries from the exercise catalog, plus the catalog details (muscle group, equipment, type, instructions) for every exercise you have actually logged — so Claude can reason about what muscles a session hit.
   - Account basics: email and account creation date.

2. **Add a summary section Claude reads first**
   A computed block at the top of the export with: totals per module, current and best streaks, sessions in the last 7/30 days, weekly volume by muscle group for the last two weeks, latest body metrics vs. targets, swimming and heat-therapy day counts, and average daily protein/calories for the last 30 days.

3. **Add a data dictionary**
   A short `schema` block naming each table, what a row means, and units (weights in kg, distances in km, dates in UTC). This is what stops Claude from misreading e.g. `visceral_fat` or the JSON shape of `gym_sessions.exercises`.

4. **Keep it read-only and safe**
   No write endpoint, no changes to token handling. The link stays revocable from Settings, and the Settings card gets a short "what Claude can see" list plus a suggested starter prompt.

## Technical notes

- All work is in `supabase/functions/share-data/index.ts`; it keeps the existing token-hash lookup and `last_used_at` update.
- Extra tables read with the service client: `favorite_exercises`, and `exercises` filtered to ids referenced by the user's sessions plus `created_by = uid`.
- Email/created_at pulled via `auth.admin.getUserById(uid)`.
- Summary computed in the function from the already-fetched rows (no extra queries), returned under `summary`; raw tables stay unchanged so nothing existing breaks.
- Optional `?since=YYYY-MM-DD` query param to trim large exports; default remains everything.
- `src/components/ShareAccessCard.tsx` gets the copy update only.
