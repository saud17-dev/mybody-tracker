# Plate calculator fix + swimming & heat therapy tracking

## 1. Plate calculator (Gym)

Today the sheet only reads the weight already typed in a set, so with an empty/0 weight it just shows "Bar only" and there is no way to change anything or push a result back.

Changes:
- Add an editable target weight at the top of the sheet: numeric field plus quick -/+ steps (2.5 / 5 kg).
- Show the plate stack per side, the bar, and the achievable total; keep the "closest possible weight" note when the target can't be matched exactly.
- Add an **Apply** button that writes the achievable total back into the set that opened the calculator, then closes the sheet.
- Guard the saved equipment preferences: if all plates get toggled off, fall back to the default set instead of producing an empty stack; validate stored preferences on load.
- Respect the profile weight unit for display/entry.

## 2. Swimming and heat therapy

Both are logged from the existing Cardio page:
- Add **Sauna** and **Steam Room** to the activity list (Swimming already exists). Distance is hidden for these; duration stays.
- Group them under a "Heat therapy" concept so the two activities roll up into one counter.

## 3. Visuals

- **Goals page cards**: two new counter cards — Swimming and Heat therapy — each showing days this week, days this month, and current streak-style "last session" info, styled with distinct theme colors.
- **Monthly calendar**: `MonthlyActivityCalendar` gets two extra dot colors (swim, heat) so those days are visible at a glance, with the day popover listing the session (activity, duration), and the legend extended.

## Technical notes

- No database changes: swimming and sauna/steam are rows in `cardio_sessions` distinguished by `activity`.
- New helper in `src/lib/stats.ts` to count swim days and heat-therapy days per week/month from cardio sessions.
- `MonthlyActivityCalendar` props extended to split cardio rows into cardio / swim / heat buckets.
- New color tokens for swim and heat added to `src/index.css` and `tailwind.config.ts`, matching the existing earthy palette (no hardcoded colors).
- Plate calculator changes stay in `PlateCalculatorSheet.tsx`, with `Gym.tsx` passing the set identity so Apply can update the right weight field.
