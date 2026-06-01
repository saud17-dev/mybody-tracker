// Format milliseconds (or two ISO strings) as a workout-friendly duration.
import { format, parseISO } from "date-fns";

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function sessionDurationMs(startedAt?: string, endedAt?: string): number | null {
  if (!startedAt || !endedAt) return null;
  const a = Date.parse(startedAt);
  const b = Date.parse(endedAt);
  if (isNaN(a) || isNaN(b) || b < a) return null;
  return b - a;
}

/** Returns e.g. "18:42 → 19:35 · 53m" or null if data missing. */
export function formatSessionTimes(startedAt?: string, endedAt?: string): string | null {
  const ms = sessionDurationMs(startedAt, endedAt);
  if (ms == null) return null;
  const start = format(parseISO(startedAt!), "HH:mm");
  const end = format(parseISO(endedAt!), "HH:mm");
  return `${start} → ${end} · ${formatDuration(ms)}`;
}
