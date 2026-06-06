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

/** Returns today's date as yyyy-MM-dd for <input type="date"> defaults. */
export function todayInputDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** ISO yyyy-MM-dd → ISO string that uses the given (or current) time-of-day.
 *  Lets users backdate a log while keeping a sensible timestamp. */
export function dateWithCurrentTime(yyyymmdd: string, base: Date = new Date()): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  if (!y || !m || !d) return base.toISOString();
  const dt = new Date(y, m - 1, d, base.getHours(), base.getMinutes(), base.getSeconds());
  return dt.toISOString();
}

/** Extract yyyy-MM-dd from an ISO string for <input type="date">. */
export function isoToInputDate(iso: string): string {
  try { return format(parseISO(iso), "yyyy-MM-dd"); }
  catch { return todayInputDate(); }
}
