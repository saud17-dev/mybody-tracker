// Apple Health (HealthKit) / Android Health Connect wrapper.
// Uses dynamic import so the web bundle works without the native plugin.

import { Capacitor } from "@capacitor/core";

export type HealthMetric = { date: string; weightKg?: number; bodyFatPct?: number; muscleMassPct?: number };
export type HealthWorkout = { date: string; activity: string; durationMin: number; distanceKm?: number };

export const isHealthAvailable = () =>
  Capacitor.isNativePlatform() && (Capacitor.getPlatform() === "ios" || Capacitor.getPlatform() === "android");

async function getPlugin(): Promise<any | null> {
  if (!isHealthAvailable()) return null;
  try {
    const mod = await import("capacitor-health");
    return (mod as any).Health ?? (mod as any).default ?? null;
  } catch {
    return null;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  const Health = await getPlugin();
  if (!Health) return false;
  try {
    await Health.requestHealthPermissions({
      permissions: ["READ_WEIGHT", "READ_BODY_FAT", "READ_LEAN_BODY_MASS", "READ_WORKOUTS"],
    });
    return true;
  } catch (e) {
    console.error("Health permission error", e);
    return false;
  }
}

export async function fetchHealthMetrics(sinceDays = 90): Promise<HealthMetric[]> {
  const Health = await getPlugin();
  if (!Health) return [];
  const start = new Date(Date.now() - sinceDays * 86400_000).toISOString();
  const end = new Date().toISOString();
  const byDate = new Map<string, HealthMetric>();

  const queries: { key: keyof HealthMetric; type: string; transform?: (v: number) => number }[] = [
    { key: "weightKg", type: "weight" },
    { key: "bodyFatPct", type: "body-fat-percentage", transform: (v) => v * 100 },
  ];

  for (const { key, type, transform } of queries) {
    try {
      const res = await Health.queryAggregated({ startDate: start, endDate: end, dataType: type, bucket: "day" });
      const rows: any[] = res?.aggregatedData ?? [];
      for (const r of rows) {
        const day = (r.startDate || "").slice(0, 10);
        if (!day) continue;
        const cur = byDate.get(day) ?? { date: new Date(day).toISOString() };
        const v = transform ? transform(r.value) : r.value;
        (cur as any)[key] = v;
        byDate.set(day, cur);
      }
    } catch (e) {
      console.warn(`Health query ${type} failed`, e);
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchHealthWorkouts(sinceDays = 90): Promise<HealthWorkout[]> {
  const Health = await getPlugin();
  if (!Health) return [];
  const start = new Date(Date.now() - sinceDays * 86400_000).toISOString();
  const end = new Date().toISOString();
  try {
    const res = await Health.queryWorkouts({ startDate: start, endDate: end, includeHeartRate: false, includeRoute: false });
    const rows: any[] = res?.workouts ?? [];
    return rows.map((w) => ({
      date: w.startDate,
      activity: w.workoutType || "Workout",
      durationMin: Math.round((w.duration || 0) / 60),
      distanceKm: w.distance ? w.distance / 1000 : undefined,
    }));
  } catch (e) {
    console.warn("Health workouts failed", e);
    return [];
  }
}
