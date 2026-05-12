# Expand exercise library from JEFIT (curated)

Goal: grow the exercise picker so the user rarely needs to add a custom one, and never creates a near-duplicate of an existing name.

## Scope

- Add ~100–200 commonly-used exercises pulled from JEFIT's muscle categories into `src/lib/exercises.ts`.
- Cover both `GYM_EXERCISES` (strength/conditioning) and `PT_EXERCISES` (mobility/rehab/stability — JEFIT stretching + bodyweight pulls).
- No exercise pages are crawled at runtime; this is a one-time static expansion of the seed list.

## Source

- Landing: `https://www.jefit.com/exercises`
- Per-muscle pages (Abs, Back, Biceps, Chest, Forearms, Glutes, Shoulders, Triceps, Upper Legs, Lower Legs) and Stretching for PT additions.
- I'll fetch each muscle page once during planning execution, extract exercise names, then hand-curate the merged list (drop obscure machine-only variants, keep recognizable names).

## Dedupe rules

Before adding any new entry, normalize and compare against existing names:

```text
normalize(name) = lowercase, trim, collapse spaces,
                  strip punctuation,
                  unify synonyms: "DB"->"Dumbbell", "BB"->"Barbell",
                                  "KB"->"Kettlebell", "1-arm"/"single arm"->"Single-Arm"
```

Skip any candidate whose normalized form already exists in `GYM_EXERCISES` or `PT_EXERCISES`. This is a build-time check in the script that produces the new list — runtime picker behavior is unchanged.

## Mapping to existing groups

Map JEFIT muscles → current `group` values (no schema change):

```text
Abs            -> Core
Back           -> Back
Biceps, Triceps, Forearms -> Arms
Chest          -> Chest
Glutes, Upper Legs, Lower Legs -> Legs
Shoulders      -> Shoulders
Olympic lifts already present -> Olympic
Stretching/Mobility (PT)      -> Mobility / Stretch / Stability
```

PT additions get a `bodyArea` per the existing enum (Knee, Hip, Shoulder, Spine, Ankle, Core).

## Files touched

- `src/lib/exercises.ts` — append new entries to `GYM_EXERCISES` and `PT_EXERCISES`. No other changes.

## Out of scope

- No fuzzy-match dedupe in the picker UI (user chose curated expansion only).
- No DB migration — exercise lists are static TS arrays.
- No JEFIT branding/attribution displayed (names are factual exercise names).

## Acceptance

- `GYM_EXERCISES` grows by ~80–140 entries, all unique under the normalize rule.
- `PT_EXERCISES` grows by ~20–40 mobility/stretch entries, all unique.
- Existing entries untouched; existing favorites/recents keep working.
- `bun run build` passes.
