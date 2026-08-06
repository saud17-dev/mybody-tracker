# Dark earthy theme from the Saud palette

Recolor the whole app around the uploaded palette (cream `#e8e4dd`, stone `#dcd6cc`, sage `#9aa88f`, dark cocoa `#5a3a2a`, terracotta `#c46a3a`) with a dark background everywhere.

## Look and feel

- Background: very dark warm brown-black derived from the cocoa tone, not blue-grey.
- Cards / sheets / popovers: slightly lighter warm brown surfaces so they lift off the background.
- Text: cream `#e8e4dd` for primary text, stone `#dcd6cc` dimmed for secondary/muted text.
- Primary action colour: sage `#9aa88f` (brightened a touch so it passes contrast on dark).
- Accent / highlights: terracotta `#c46a3a`.
- Borders and inputs: muted cocoa lines, low contrast so the UI stays calm.

Module colours (used across Plan, Goals, calendars, streak cards, charts):
- Gym: sage
- PT: warm cream/stone tone
- Cardio: terracotta
Gradients for the module hero cards get rebuilt from these same tones.

## What changes

1. **Design tokens** (`src/index.css`): rewrite the light and dark token sets so both resolve to the dark earthy palette — the app then looks the same regardless of the system theme. Update `--gradient-*` and shadow tokens to warm brown values.
2. **Force dark mode**: apply the `dark` class on the document root so shadcn dark variants engage app-wide.
3. **Remove hardcoded colours**: about 50 spots still use raw Tailwind colours (`bg-white`, `text-white`, `bg-black`, `emerald-*`, `amber-*`, `red-*`) in Gym, PT, Plan, Goals, Nutrition, calendar and timer components. Replace them with semantic tokens (`bg-card`, `text-foreground`, `text-primary`, `bg-primary/10`, `text-destructive`, etc.) so nothing renders as a bright white block on the dark background.
4. **Set-complete "done" state** and other status cues get re-tuned: the emerald green completed-set row becomes sage-tinted, warnings become terracotta.
5. Recheck contrast on the busiest screens (Gym logging, Plan carousel, Goals charts) and adjust token lightness where text sits on coloured cards.

## Technical notes

- All colours stay HSL in `index.css`; `tailwind.config.ts` keeps referencing the same variables, plus module colours get foreground variants where cards place text on a filled module colour.
- No component logic or data changes — presentation only.
