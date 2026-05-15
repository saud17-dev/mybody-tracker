// LocalStorage-backed draft for in-progress workouts.
// Keys are namespaced per user so signing in/out doesn't collide.

const key = (mod: string, uid?: string) => `mybody:draft:${mod}:${uid ?? "anon"}`;

export interface Draft<T> {
  at: number; // ms timestamp when first started / last edited
  data: T;
}

export function saveDraft<T>(mod: string, uid: string | undefined, data: T) {
  try {
    const existing = loadDraft<T>(mod, uid);
    const at = existing?.at ?? Date.now();
    localStorage.setItem(key(mod, uid), JSON.stringify({ at, data }));
  } catch { /* ignore quota */ }
}

export function loadDraft<T>(mod: string, uid: string | undefined): Draft<T> | null {
  try {
    const raw = localStorage.getItem(key(mod, uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft<T>;
    if (!parsed || typeof parsed.at !== "number") return null;
    return parsed;
  } catch { return null; }
}

export function clearDraft(mod: string, uid?: string) {
  try { localStorage.removeItem(key(mod, uid)); } catch { /* */ }
}

export function draftAge(at: number): string {
  const mins = Math.max(0, Math.floor((Date.now() - at) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
