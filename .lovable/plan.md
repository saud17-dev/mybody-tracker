
# Migrate Summer Training Plan into the App

Your PDF is a 16-week, 3-phase program built around a fixed weekly split. Rather than just dumping it as text, I'll turn it into **structured workout templates** you can tap to start a pre-filled session — so the plan actually drives your logging instead of sitting in a drawer.

## What gets added

### 1. New "Plan" tab (5th bottom-nav item)
A dedicated module showing:
- **Today's session** card at the top (auto-picks based on day of week + current phase)
- **Weekly schedule** (Mon–Sun grid with session type + location)
- **Phase tracker** — current phase (Foundation / Build / Sharpen), week number, dates, goal summary
- **Notes panel** — your patella alta rules ("avoid", "what helps"), fascia principles, "rules for looking sharp"

### 2. Workout templates (data layer)
Each scheduled session becomes a reusable template with prescribed exercises, sets × reps, and notes. Tapping **Start session** opens the existing Gym/PT/Cardio sheet **pre-filled** with all exercises — you just enter the actual weights.

Templates created:
- **Mon — Push** (Gym): DB bench 4×10, incline DB 3×12, seated DB press 3×12, cable lat raises 3×15, face pulls 3×15, tricep pushdown 3×15, push-ups to failure
- **Tue — Kettlebell + Core** (Gym): KB swing 4×15, Turkish get-up 3×3, single-arm KB row 3×12, goblet squat 3×10, farmer's carry 3×30m, Pallof press, cable woodchop, dead bug
- **Wed — Pull** (Gym): pull-ups 4×10, seated cable row 3×12, single-arm DB row 3×12, face pulls 3×15, barbell curl 3×12, hammer curl 3×12
- **Thu — Football** (Cardio): activity=Football, default 60 min, with warm-up reminder
- **Fri — Lower (knee-safe)** (Gym): leg press 4×12, RDL 4×10, lying leg curl 3×15, hip abduction 3×15, calf raise 4×20, step-ups 3×10, glute bridge 3×15, Copenhagen plank, landmine rotation
- **Sat — Cycling** (Cardio): activity=Cycling, default 50 min Zone 2
- **Sun — Fascia & Stretch** (PT): foam roll IT band / quad / hip flexor / thoracic + 6 held stretches (90s each), pain scale per area

Phase 2 adds cable flyes, lateral raise drop sets, incline curl, overhead tricep extension, single-leg RDL — surfaced as "Phase 2 additions" inside affected templates and auto-included once your current date crosses week 7.

Phase 3 adds HIIT finisher prompts on Tue/Fri and switches Saturday cycling to interval mode.

### 3. Exercise library additions
A few exercises in your plan aren't yet in the library — I'll add: Turkish Get-Up, Farmer's Carry, Cable Woodchop, Copenhagen Plank, Landmine Rotation, Single-Leg RDL, Cable Fly, Incline Curl, Foam Roll (IT Band / Quad / Hip Flexor / Thoracic), Hip Flexor Lunge Stretch, Pigeon Pose, Doorway Chest Stretch, Standing Quad Stretch, Wall Calf Stretch, Seated Hamstring Stretch. Football added to cardio activities.

### 4. Goals auto-set from the plan
Weekly targets pre-filled to match the schedule: **Gym 4 / PT 1 / Cardio 2**. Body composition: starting weight 77kg recorded; you set the target.

### 5. Patella alta safety chips
Knee-risky exercises (anything with "Squat", "Lunge", "Leg Extension", "Box Jump") get a small ⚠ chip in the Gym picker with the reason — soft warning, not a block.

## Technical notes

- New file `src/lib/plan.ts`: types for `WorkoutTemplate`, `PhaseDef`, the Saud plan data, and helpers `getCurrentPhase(date)`, `getTodayTemplate(date)`.
- New page `src/pages/Plan.tsx` + route `/plan`; `BottomNav` extended to 5 items (icons compress slightly on narrow screens).
- Gym/PT/Cardio sheets accept an optional `?template=<id>` query param; when present, the sheet opens auto and seeds `exercises` state from the template. Existing manual flow unchanged.
- Exercise library extended in `src/lib/exercises.ts`; new "Stretch" and "Recovery" PT groups added.
- All plan data is static (no migration needed); your existing localStorage sessions are untouched.

## Out of scope for this pass
Supplement tracker, nutrition logging, video links inside the app, and progressive-overload auto-suggestions. Easy to add next if useful.
