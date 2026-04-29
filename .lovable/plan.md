# Plan page — mobile-first, ADHD-friendly redesign

Goal: turn the top of the Plan page into something a phone-thumb loves and an ADHD brain instantly parses — bold module colors, large taps, swipeable cards, light motion, less visual noise.

## What changes (visible)

### 1. Next 4 days → swipeable card carousel
- Replace the 2×2 grid with a horizontal **snap-scrolling row**. Each card is ~78% of the viewport width so the next card peeks in — a clear visual cue that you can swipe.
- Cards become **bigger and bolder**:
  - Full module color as the card background (`bg-gym`, `bg-pt`, `bg-cardio`) with white text — instantly distinguishable at a glance.
  - Today's card gets a subtle ring + a small pulsing "TODAY" pill in the top-right.
  - Big day name (`text-2xl`), date underneath, large emoji/icon in a frosted circle, template name in 2-line clamp.
  - Full-width **"Start →"** button at the bottom of each card (44px tall — proper thumb target).
  - Rest days use a calm muted card with a coffee icon (clearly different from active days).
- Page indicator dots under the row to show position.
- Native momentum scroll, no JS dependency — uses `snap-x snap-mandatory` + `overscroll-x-contain`. Works perfectly on iOS/Android.

### 2. Most-used templates → touch-friendly chip strip
- On mobile the "Most used" list moves **directly under** the next-4 carousel as a horizontal scrollable strip of chunky cards (each ~9rem wide, 56px tall icon, big tap area).
- Each chip: colored left border in its module color (gym=green, pt=purple, cardio=orange) + colored icon badge — same color language as the day cards, so you learn the system once.
- Usage count rendered as a tiny "×N" badge in the corner instead of a text line — more glanceable.
- On desktop (lg+) it stays as a vertical list to the side, like today.

### 3. Visual stimulation (ADHD-friendly, not chaotic)
- **One bold accent per element**, not rainbow soup. Module color = identity, neutral surfaces around it = breathing room.
- Subtle gradient backgrounds on the day cards using existing `--gradient-gym/pt/cardio` tokens already in `index.css`.
- Light **active-press scale** (`active:scale-95`) on every tappable card so taps feel responsive — instant feedback is huge for ADHD focus.
- Today's card gets a soft pulse animation (`animate-pulse` on the TODAY pill only — not the whole card, that would be exhausting).
- Larger type, more contrast on key info (day name, template name) — secondary info shrinks to 10–11px so eyes know what to land on first.
- Rounded `rounded-2xl` everywhere on the hero for a friendlier, more "app-y" feel.

### 4. Layout below the hero (unchanged behavior, tightened spacing)
- Summer-plan import banner, full-week accordion, all-templates accordion, CSV import — all stay collapsed by default. Spacing tightened from `mt-7` to `mt-5` so less scroll.

## What stays the same

- Drag-to-swap, skip-this-week, move-to-today, swap dialogs, CSV import, Summer plan seed — all unchanged. Same data, same routes, same templates table.
- Desktop layout still uses the side-by-side hero (carousel + vertical "most used" list).

## Technical notes

- Files touched:
  - `src/pages/Plan.tsx` — restructure the hero section only (lines ~140–248); rest of file untouched.
  - `src/index.css` — add a small `.snap-card` utility + safe horizontal padding helper if needed.
- No new dependencies — pure CSS scroll-snap.
- Module colors come from existing tokens: `bg-gym`, `bg-pt`, `bg-cardio`, `--gradient-gym/pt/cardio`. White-on-color contrast is already AA-compliant for these hues.
- Carousel structure:

```text
┌──────────────────────────────────────────────────┐
│  [TODAY •••]  [TUE]  [WED]  [THU]   →  swipe    │
│  ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │  GREEN  │ │ PURP │ │ ORNG │ │ MUTE │        │
│  │  PUSH   │ │  PT  │ │ RUN  │ │ REST │        │
│  │ Start → │ │Start→│ │Start→│ │      │        │
│  └─────────┘ └──────┘ └──────┘ └──────┘        │
│        • ○ ○ ○                                  │
└──────────────────────────────────────────────────┘
[ 💪 Push ×3 ] [ 🏃 Run ×2 ] [ 🧘 Mobility ×1 ] →
```

- Page-indicator dots derived from scroll position via a tiny `onScroll` handler (no library).
- The "Most used" horizontal strip on mobile is the same data, just a different layout — flips to vertical at `lg:` breakpoint via Tailwind responsive classes.

## Out of scope

- No changes to the goals/streaks dashboard.
- No new database fields or migrations.
- No icon library swap — we keep lucide.
