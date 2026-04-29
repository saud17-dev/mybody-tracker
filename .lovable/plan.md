# Fix data loss + global sign-out + flexible plan

## 1. Why data appeared to vanish on refresh

All your data (workouts, metrics, plan) is already saved to the cloud database — there's no local-only storage in the pages. The most likely cause is that **your session was signed out** when you refreshed (you're currently on `/auth` right now, which proves it). On a fresh sign-in, the app shows that account's data, but if writes were made before login or under a different account/device, they won't appear.

Two real bugs contribute to the "lost" feeling and will be fixed:

1. **Silent write failures**: today, `create()` calls (gym/PT/cardio/metrics) don't show an error toast if the Supabase insert fails (e.g. session expired mid-session). The UI cleared the form, you assumed it saved, refresh showed nothing.
2. **No session-expiry handling**: when the auth token expires while the page is open, the next save just fails quietly. We'll detect this and prompt re-login.

### What we'll change
- Wrap every mutation hook in `src/lib/cloud.ts` with proper error surfacing — every failed insert/update fires a `toast.error` with the real reason.
- In `App.tsx`, listen for `SIGNED_OUT` / `TOKEN_REFRESHED` events; on unexpected sign-out show a toast "Session expired — please sign in again" before redirecting to `/auth`.
- Add a small "Saving…/Saved ✓" indicator on the Goals/Gym/PT/Cardio save buttons so you visibly confirm the round-trip.
- Add a retry on transient network failures (1 retry, 1s backoff) inside the cloud mutations.

This guarantees: if a save succeeds you see "Saved ✓", if it fails you see a red error — never silent loss.

## 2. Sign-out available on every page

Currently sign-out lives only inside Settings. We'll add a header avatar/menu to the shared `AppShell` so it appears on Goals, Plan, Gym, PT, Cardio, and Settings.

- Add a circular avatar button (initials from email) in the top-right of `AppShell.tsx`.
- Tapping opens a small dropdown with: **Settings**, **Sign out**.
- Sign out clears the session and routes to `/auth`.
- Settings page keeps its existing in-page sign-out button as well.

## 3. Flexible weekly plan (keep current data)

Today the plan locks each weekday to one slot. We'll make it a **drag-and-arrange weekly board** while keeping the same database (`plan_schedule`) and your existing entries intact.

### New behaviors
- **Drag to reorder**: long-press any day card and drag it onto another weekday to swap their workouts. Useful when you want to move "Push" from Monday to Tuesday because you're tired.
- **Quick swap**: tap a day → existing edit sheet now also has a "Swap with…" picker listing the other 6 days (one tap moves both).
- **Move to today**: each day card gets a small "→ Today" action that swaps that workout into today's slot.
- **Skip / mark as rest for this week**: a per-day "Skip this week" toggle (stored locally per ISO week) so the plan stays intact but today shows Rest without overwriting your template.
- **Reset to original** button on the page that re-applies the saved schedule if you experimented.

### Data model
- No schema change needed. Reorder = two `upsertDay` calls (swap module/template_id/label between two `day_of_week` rows).
- "Skip this week" stored in a new tiny table `plan_skips (user_id, week_start date, day_of_week int)` with own-row RLS, queried for the current week only. Auto-cleared on Monday rollover by a simple "where week_start = current monday" filter.

### UI
- Replace the static `space-y-2` list in `Plan.tsx` with a `@dnd-kit/sortable` vertical list (already a common Lovable pattern; lightweight, touch-friendly).
- Keep the existing `DayEditor` sheet, the Today card, the Summer Plan import, and the CSV importer exactly as they are.

## Technical notes

- Files touched:
  - `src/lib/cloud.ts` — error toasts + retry on every mutation; helper to detect auth errors.
  - `src/App.tsx` — global auth-state listener with toast on unexpected sign-out.
  - `src/components/AppShell.tsx` — header avatar dropdown (Settings + Sign out).
  - `src/pages/Plan.tsx` — dnd-kit sortable, swap action, "→ Today", "Skip this week", "Reset" button.
  - New `src/lib/planSkips.ts` + migration to create `plan_skips` table with RLS `auth.uid() = user_id`.
- New dep: `@dnd-kit/core`, `@dnd-kit/sortable` (small, no native deps).
- No destructive migrations; existing `plan_schedule`, templates, sessions, metrics untouched.

## What stays the same

- Your imported Summer Plan, CSV templates, body-metrics wizard, Apple-Health section, auth password rules — all unchanged.
- Database tables for sessions/metrics/goals/templates/schedule are not migrated or rewritten.
