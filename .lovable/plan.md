## Changes to `src/pages/Goals.tsx`

### 1. Remove the Streaks section
Delete the entire `<section>` block that renders the "Streaks" header + 3 `StreakCard`s (and drop the now-unused `useWorkoutStreaks` import / `streaks` variable / `StreakCard` component / `Flame` icon).

### 2. Add "This week's plan" section (right under the 3 weekly goal rings)
A compact 7-day grid (Mon→Sun, today highlighted) reusing the existing schedule data:
- `usePlanSchedule()` for the saved day → module/template mapping
- `useWorkoutTemplates()` for template names + emojis
- `usePlanSkips()` so skipped days render as Rest

Each day cell shows: weekday label, emoji/icon, template name (e.g. "Push", "Pull", "Kettlebell"), and a small **Edit** affordance opening a `Sheet` with a `Select` for module (gym/pt/cardio/rest) + `Select` for template — saves via `upsertDay`. This is the same pattern as `SortableDayRow` in `Plan.tsx`, simplified (no drag, no carousel).

A "Manage full plan →" link at the bottom navigates to `/plan` for advanced editing (templates CRUD, CSV import, swap days). This keeps Goals focused while preserving the richer Plan page.

### 3. Volume by muscle: this week + last week
Extend `src/lib/stats.ts`:
- New `useTwoWeekMuscleVolume(gym)` returning `{ group, thisWeek, lastWeek, thisSets, lastSets }[]` (compute last week using `subWeeks(start, 1)` / `subWeeks(end, 1)` from `date-fns`).

Update the muscle-volume `BarChart` in Goals to render two bars per group (`Bar dataKey="lastWeek" fill="hsl(var(--muted-foreground))"` and `dataKey="thisWeek" fill="hsl(var(--gym))"`), with a small legend ("Last week" / "This week"). Header becomes "Volume by muscle (last 2 weeks)".

### 4. New "Last week's workouts" section
Above or alongside the volume chart, a list grouped by day showing what was actually done last week so the user can vary this week:

```
Mon · Push      Bench Press · Shoulder Press · Tricep Pushdown
Wed · Pull      Pull-Up · Barbell Row · Hammer Curl
Thu · Cardio    Football · 60 min
```

Built from `gym`, `pt`, `cardio` filtered to `[startOfWeek(subWeeks(now,1)), endOfWeek(subWeeks(now,1))]`. Each row shows day, module chip, and a one-line summary of exercise names (gym/pt) or activity + duration (cardio). Empty state: "No workouts logged last week."

## Files touched
- `src/pages/Goals.tsx` — remove Streaks, add WeekPlan section + LastWeek recap, swap muscle chart to 2-week.
- `src/lib/stats.ts` — add `useTwoWeekMuscleVolume` and a `useLastWeekSessions` helper.

## Out of scope
- Template CRUD, drag-to-reorder, CSV import — stays on `/plan`.
- Changing how "this week" is computed elsewhere.
