# Plan import/export + body metrics CSV + Apple Health

Three additions to make data entry faster and bring in Apple Health on iPhone.

---

## 1. Plan template — download, fill, upload (CSV)

A simple CSV format anyone can edit in Numbers/Excel/Sheets. One row = one exercise within a template; templates and the schedule are derived from the rows.

**CSV columns:**
```text
template_name, emoji, module, day_of_week, label, exercise_name, muscle_group, sets, reps, cardio_activity, cardio_duration_min
```

- `module` — `gym` | `pt` | `cardio` | `rest`
- `day_of_week` — `Mon`..`Sun` (or 0–6) or blank if the template isn't scheduled
- For `cardio` rows: leave exercise/sets/reps blank, fill `cardio_activity` + `cardio_duration_min`
- For `rest` rows: only `day_of_week` + `module=rest` matter
- Multiple rows with the same `template_name` are grouped into one template

**Example bundled file** (`public/templates/plan-template.csv`) preloaded with 2 sample rows + a comment header so users can see exactly how to fill it.

### UI (in Plan page, next to "Import Summer Plan")
A new card "Import from CSV" with two buttons:
- **Download template** — serves `/templates/plan-template.csv`
- **Upload CSV** — file input → parse → preview dialog showing detected templates + scheduled days → "Confirm import" inserts into `workout_templates` and `plan_schedule` (idempotent: skip templates whose name already exists).

Errors surface inline (row number + reason).

---

## 2. Body metrics / composition — download, fill, upload (CSV)

Same pattern, in the Goals page (Body tab) and Settings → Data section.

**CSV columns:**
```text
date, weight_kg, muscle_mass_pct, body_fat_pct
```

- `date` — `YYYY-MM-DD`
- Empty cells are ignored (only fields you measured)
- Bundled `public/templates/body-metrics-template.csv` with 3 example rows

**UI:**
- "Download template" + "Upload CSV" buttons in Body section
- On upload: parse → preview table → confirm → batch insert into `body_metrics` (skip rows whose date already exists for that user)

Also add **CSV export** alongside the existing JSON export in Settings (one button each for body metrics, gym log, PT log, cardio log).

---

## 3. Apple Health integration

Apple Health (HealthKit) is iOS-only and only accessible to **native iOS apps**, not websites or PWAs. So this requires wrapping the app with Capacitor and using a HealthKit plugin.

### What we'll set up
1. **Capacitor scaffolding** — install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`; add `capacitor.config.ts` (appId `app.lovable.c1564c344d9a425482365642091f9ed1`, appName `mybody-tracker`, sandbox URL for hot-reload).
2. **Health plugin** — install `capacitor-health` (community plugin supporting HealthKit on iOS and Health Connect on Android).
3. **Health service wrapper** (`src/lib/health.ts`):
   - `isAvailable()` — returns false on web/Android-without-Health-Connect
   - `requestPermissions()` — body mass, body fat %, lean body mass, workouts (read), plus write for workouts
   - `syncBodyMetrics(sinceDate)` — pulls weight / body fat / muscle mass samples and inserts into `body_metrics` (dedup by date)
   - `syncWorkouts(sinceDate)` — pulls HKWorkout samples; maps running/cycling/etc → `cardio_sessions`, strength training → `gym_sessions` (as a single empty session you can fill in)
   - `pushWorkout(session)` — optional: writes a finished cardio/gym session back to Health
4. **Settings UI** — new "Apple Health" section that:
   - Hides itself unless `isAvailable()` is true (so web users don't see a dead button)
   - "Connect Apple Health" → permission prompt
   - "Sync now" → pulls last 90 days, shows toast with counts imported
   - Toggle "Auto-sync on open"

### Caveats to share with the user
- Apple Health data only flows once the app is installed as a native iOS app via Xcode (Mac required). Steps:
  1. Export to GitHub → `git pull` locally
  2. `npm install`
  3. `npx cap add ios`
  4. `npm run build && npx cap sync`
  5. `npx cap run ios` (Xcode + a Mac required; for App Store you'll need an Apple Developer account)
- Until then, the CSV upload above is the practical way to bring weight history in.

---

## Files to change

- `public/templates/plan-template.csv` *(new)* — sample CSV
- `public/templates/body-metrics-template.csv` *(new)* — sample CSV
- `src/lib/csvPlan.ts` *(new)* — parse/serialize plan CSV
- `src/lib/csvMetrics.ts` *(new)* — parse/serialize metrics CSV
- `src/components/CsvImport.tsx` *(new)* — generic upload + preview dialog
- `src/pages/Plan.tsx` — add "Import from CSV" card
- `src/pages/Goals.tsx` — add CSV import/export to Body tab
- `src/pages/Settings.tsx` — add per-table CSV export + Apple Health section
- `src/lib/health.ts` *(new)* — HealthKit wrapper with web no-op fallback
- `package.json` — add `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `capacitor-health`, `papaparse`
- `capacitor.config.ts` *(new)* — Capacitor config with sandbox URL for hot reload

No DB migrations needed — uses existing tables.

---

## Open questions

1. **Android Health Connect** too, or iPhone-only for now? (Same plugin supports it, just adds Android setup.)
2. **CSV vs Excel (.xlsx)** for the template — CSV is universal and editable everywhere; .xlsx allows dropdowns for `module` but adds a heavier parser. Default: CSV.
3. **Apple Health write-back** (push your logged workouts into Health) or read-only? Default: read-only to start.