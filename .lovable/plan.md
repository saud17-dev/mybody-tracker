## Monthly activity calendar

Add a full-month calendar to the home/Goals page that highlights days you logged a Gym, PT, or Cardio session — at-a-glance proof of consistency, with color coding that matches the rest of the app.

### Where it goes
Insert a new section on `src/pages/Goals.tsx`, just after the Streaks section (around line 156), titled "This month". Defaults to the current month with prev/next month arrows.

### Visual design
- Standard 7-column grid (Mon–Sun, matching weekly streak start), labeled weekday headers, leading/trailing blanks for offset.
- Each day cell shows the day number plus up to three small dots (color-coded) indicating which modules were active:
  - Gym → `hsl(var(--gym))`
  - PT → `hsl(var(--pt))`
  - Cardio → `hsl(var(--cardio))`
- Today's cell gets a primary ring; days fully covering all three modules get a subtle glow background.
- Empty days stay muted; future days are dimmed further.
- Footer legend with the three colored dots + counts ("12 active days this month").
- Tap a day → small popover/tooltip listing the sessions that occurred (e.g. "Gym · Push", "Cardio · Run 5 km").

### Data
Reuse existing hooks/data already loaded on Goals: `gym`, `pt`, `cardio` session arrays. Build a `Map<isoDate, { gym, pt, cardio, items[] }>` for the visible month using `date-fns` (`startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `format`, `isSameDay`). No DB changes, no new queries.

### New file
`src/components/MonthlyActivityCalendar.tsx` — self-contained component receiving `gym`, `pt`, `cardio` as props plus optional `unit`. Handles month navigation locally with `useState`.

### Responsive
Mobile: compact cells (~40px), dots below number. Desktop (`md:`): larger cells (~56px), dots inline beside number, slightly more padding — fits naturally inside the existing `max-w-6xl` shell.

### Out of scope
No backend/schema changes. No editing of past days from the calendar.