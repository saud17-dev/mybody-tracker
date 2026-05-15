# Fix 7 UX Issues in Gym & PT

## 1. Exercises Library — browseable catalog
The current `ExercisePicker` only opens when adding a workout. Add a dedicated browseable library accessible without starting a session.

- New route `/exercises` with a tabbed page (Gym / PT).
- Reuses `GYM_EXERCISES`, `PT_EXERCISES`, custom exercises and `EXERCISE_CUES`.
- Search bar, group/body-area filter chips, favorite toggle, tap to open existing `ExerciseDetailDrawer`.
- Add a "Library" link in `BottomNav` (or `TopNav` overflow) and a small "Browse library" button at the top of the Gym/PT picker sheets.

## 2. Beginner clarity
- Promote primary CTAs: replace the small white circular `+` icon in `AppShell.right` with a labeled pill `+ Start workout` / `+ New PT session` so first-time users see it.
- Empty-state cards get a prominent inline `Start your first workout` button (already partly there; make it a real `Button` in accent color).
- Move destructive icons (trash) behind a kebab/ellipsis menu instead of a bare icon next to the title — reduces accidental taps.

## 3. Confirm before delete + undo
Wrap every destructive action with confirm + undo:
- Use `AlertDialog` for "Delete this workout?" on Gym/PT/Cardio history cards.
- After confirmed delete, show a `sonner` toast with an `action: { label: "Undo", onClick: ... }` that re-creates the session within 6s. Implement by capturing the full row before delete and re-inserting via `create`.
- Same pattern for body-metric and meal-log deletion.

## 4. Decimals in weight inputs
Current input uses `Number(v.toFixed(2))` as controlled value with `step="0.5"`, which fights the user while typing `70.25` and rejects values that aren't multiples of 0.5 in some browsers.

- Change weight input to **string-state** per set (e.g. `setDrafts[exId:i]`) so typing `70.` and `70.25` works.
- `step="0.01"`, `inputMode="decimal"`, parse on blur/save with `parseFloat` and store kg.
- Same fix for cardio distance and body-metric weight fields.

## 5. Edit past workouts
Add an Edit action on every Gym/PT history card.

- New mutation `update` in `useGymSessions` / `usePTSessions` (`supabase.from(...).update({ exercises, notes }).eq("id", id)`).
- Reuse the existing New-Workout `Sheet` in "edit mode": when opened with a session id, prefill `exercises`/`notes`, change save handler to `update` instead of `create`, and change the title to `Edit workout`.
- Available even if user logged off and came back — already user-scoped via RLS.

## 6. In-progress workout autosave (app no longer "shuts off" workouts)
Today the sheet keeps state in React only — closing the app or the sheet loses everything.

- Persist the current draft to `localStorage` on every change (key per module: `draft:gym:<userId>`, `draft:pt:<userId>`).
- On Gym/PT mount, if a draft exists, show a small banner: `Resume in-progress workout (started 12 min ago) [Resume] [Discard]`.
- Clear the draft on successful save or explicit Discard.
- Pure client-side; no schema changes.

## 7. See previous exercise sets in detail
Today tapping an exercise chip in history only opens the line chart.

- Extend `ExerciseChartDialog` (or add a sibling tab) to show a "Recent sessions" list under the chart: last ~10 entries with date, every set (`8 × 60kg`, `6 × 65kg`, …), and PR badge if applicable.
- On the History card itself, expand each chip-row into a collapsible that lists the sets inline so you don't need to open a dialog to glance at last week.

---

## Technical section

**New files**
- `src/pages/ExerciseLibrary.tsx` — browseable list, reuses picker building blocks.
- `src/lib/draft.ts` — typed `loadDraft`/`saveDraft`/`clearDraft` for gym/pt drafts.

**Edited files**
- `src/lib/cloud.ts` — add `update` mutation to `useGymSessions` and `usePTSessions`; capture-and-reinsert helper for undo.
- `src/components/ExercisePicker.tsx` — add "Browse library" button at top of popover.
- `src/pages/Gym.tsx` & `src/pages/PT.tsx`:
  - String-state weight inputs.
  - Edit-mode sheet (`editingId` + `update`).
  - Draft autosave + resume banner.
  - `AlertDialog` for delete + undo toast.
  - Expandable history exercise rows showing sets.
  - Replace icon-only `+` trigger with labeled pill button.
- `src/pages/Cardio.tsx` — same delete-confirm + undo + decimal fix.
- `src/components/BottomNav.tsx` & `App.tsx` — add `/exercises` route + nav entry.
- `src/components/AppShell.tsx` (small) — accept a wider right slot if needed for the labeled CTA.

**Out of scope**: redesign of charts/PR logic, server-side draft sync, sharing exercises across devices.
