# Built-in template library: 10 ready-made workouts

Today templates only exist per user in the database, created manually or by the Summer Plan seed. This adds a shared, built-in library of 10 well-rounded programs that anyone using the app can browse and add with one tap.

## The 10 templates

Each is a distinct session — different exercise selection, order, and emphasis — while together covering every major muscle group across a week.

| Template | Focus |
| --- | --- |
| Upper 1 | Horizontal emphasis: barbell bench, chest-supported row, incline DB press, lat pulldown, lateral raise, curl, pushdown |
| Upper 2 | Vertical emphasis: overhead press, pull-up, seated cable row, incline DB fly, rear delt fly, hammer curl, overhead extension |
| Lower 1 | Squat-dominant: back squat, Bulgarian split squat, leg press, leg extension, standing calf raise, hanging knee raise |
| Lower 2 | Hinge-dominant: Romanian deadlift, hip thrust, walking lunge, lying leg curl, seated calf raise, Pallof press |
| Push 1 | Heavy chest: barbell bench, seated DB shoulder press, incline DB press, cable lateral raise, rope pushdown, overhead triceps |
| Push 2 | Shoulder-led: standing overhead press, incline barbell press, cable fly, DB lateral raise, dips, skullcrusher |
| Pull 1 | Vertical pull: pull-up, barbell row, lat pulldown, face pull, barbell curl, reverse fly |
| Pull 2 | Horizontal pull: deadlift, seated cable row, single-arm DB row, straight-arm pulldown, hammer curl, shrug |
| Kettlebell 1 | Ballistic: two-hand swing, clean and press, goblet squat, single-arm row, Turkish get-up, farmer's carry |
| Kettlebell 2 | Grind/flow: single-arm swing, front squat, single-leg deadlift, half-kneeling press, renegade row, windmill, racked carry |

Every exercise name is taken from the existing exercise library so pre-filled last-session weights, cues and detail drawers keep working.

## How users get them

- A new **Template library** section on the Plan page (inside the collapsible area, above "All templates") lists the 10 presets with emoji, name, module and exercise count.
- Tapping one opens a preview of its exercises with sets/reps; an **Add to my templates** button copies it into the user's own `workout_templates` so it can be scheduled to a day or started from Gym.
- Already-added presets show as "Added" instead of duplicating.
- The Gym start sheet's template list picks them up automatically once added.

## Technical details

- New `src/lib/templateLibrary.ts` exporting `PRESET_TEMPLATES` in the same shape as `SUMMER_PLAN_TEMPLATES` (module, name, emoji, payload.exercises with `name`, `group`, `sets`, `reps`).
- New `src/components/TemplateLibrarySheet.tsx` for browse/preview/add, using the existing `useWorkoutTemplates().create`.
- `src/pages/Plan.tsx` renders the new section; dedupe by lowercased template name.
- No database migration — presets live in code and are copied into each user's own templates on add.
