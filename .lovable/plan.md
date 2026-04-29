## Problem

A user reported being unable to sign up with the message "weak email". The sign-up form (`src/pages/Auth.tsx`) only validates email format and `password >= 6 chars` on the client. Any stricter rule (HIBP breach check, min length, character classes) is enforced server-side by Supabase Auth and surfaced via `signUpError.message` — which is shown raw in a toast and can read confusingly (the user likely saw a "weak password" message and read it as "weak email").

## Fix

### 1. Improve client-side password validation + UX in `src/pages/Auth.tsx`
- Bump the client `passwordSchema` minimum from 6 to **8 characters** to match Supabase's typical default and fail fast with a clear message.
- Add a live password strength hint under the sign-up password field (length, has letter, has number) so users know what's expected before submitting.
- Map common Supabase auth error messages to friendlier text in the catch handler:
  - "Password should be..." / "weak_password" → "Password is too weak. Try a longer password mixing letters, numbers, and symbols."
  - "Password ... data breach" / "pwned" → "This password has appeared in a known data breach. Please choose a different one."
  - "User already registered" → "An account with this email already exists. Try signing in instead."
  - Fallback → show original message.
- Update the small helper line under the password field from "At least 6 characters" to reflect the new rule.

### 2. Inspect current auth settings (read-only check)
Confirm whether HIBP / strict password rules are turned on for this project so we know which messages to map. If HIBP is on and the user wants to keep it, the friendlier messaging above resolves the confusion. If they want to relax it, we can disable `password_hibp_enabled` via `configure_auth` — but recommended to keep it on for security.

## Files to change
- `src/pages/Auth.tsx` — stricter client validation, password hint, friendlier server-error mapping.

## Not changing
- No DB migration needed.
- Not disabling HIBP / password rules unless you ask — they protect your users.