import { useMemo } from "react";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, subDays, differenceInDays, startOfDay } from "date-fns";
import type { GymSession, PTSession, CardioSession, BodyMetric } from "@/lib/types";

// ----- Body composition trends -----
export interface MetricTrend {
  latest?: number;
  weekChange?: number;   // latest - value ~7 days ago
  monthChange?: number;  // latest - value ~30 days ago
  weekPctChange?: number;
  monthPctChange?: number;
  toTarget?: number;     // signed distance to target (latest - target)
  targetPct?: number;    // 0..100 progress from baseline (oldest) to target
  onTrack?: boolean;     // moving in the direction of target
}

export interface BodyTrends {
  weight: MetricTrend;
  muscle: MetricTrend;
  bodyFat: MetricTrend;
}

function pickClosest(metrics: { date: Date; value: number }[], target: Date) {
  if (metrics.length === 0) return undefined;
  let best = metrics[0];
  let bestDiff = Math.abs(differenceInDays(best.date, target));
  for (const m of metrics) {
    const d = Math.abs(differenceInDays(m.date, target));
    if (d < bestDiff) { best = m; bestDiff = d; }
  }
  // require a reasonable proximity (≤ 10 days off) to be useful
  return bestDiff <= 14 ? best : undefined;
}

function trendFor(
  metrics: BodyMetric[],
  key: "weightKg" | "muscleMassPct" | "bodyFatPct",
  target: number | undefined,
  lowerIsBetter: boolean,
): MetricTrend {
  const points = metrics
    .map((m) => {
      const v = m[key];
      if (v == null) return null;
      try { return { date: parseISO(m.date), value: Number(v) }; } catch { return null; }
    })
    .filter((p): p is { date: Date; value: number } => p !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length === 0) return {};
  const latest = points[points.length - 1];
  const now = latest.date;

  const weekRef = pickClosest(points, subDays(now, 7));
  const monthRef = pickClosest(points, subDays(now, 30));

  const weekChange = weekRef && weekRef !== latest ? latest.value - weekRef.value : undefined;
  const monthChange = monthRef && monthRef !== latest ? latest.value - monthRef.value : undefined;

  const weekPctChange = weekChange != null && weekRef!.value !== 0
    ? (weekChange / weekRef!.value) * 100 : undefined;
  const monthPctChange = monthChange != null && monthRef!.value !== 0
    ? (monthChange / monthRef!.value) * 100 : undefined;

  let toTarget: number | undefined;
  let targetPct: number | undefined;
  let onTrack: boolean | undefined;
  if (target != null) {
    toTarget = latest.value - target;
    const baseline = points[0].value;
    const totalGap = target - baseline;
    if (Math.abs(totalGap) > 0.001) {
      const progressed = latest.value - baseline;
      targetPct = Math.max(0, Math.min(100, (progressed / totalGap) * 100));
    } else {
      targetPct = 100;
    }
    if (weekChange != null) {
      onTrack = lowerIsBetter ? weekChange <= 0 : weekChange >= 0;
      // If already past target in the desired direction, always on track
      if (lowerIsBetter ? latest.value <= target : latest.value >= target) onTrack = true;
    }
  }

  return {
    latest: latest.value,
    weekChange, monthChange, weekPctChange, monthPctChange,
    toTarget, targetPct, onTrack,
  };
}

export function useBodyTrends(
  metrics: BodyMetric[],
  goals: { targetWeightKg?: number; targetMuscleMassPct?: number; targetBodyFatPct?: number },
): BodyTrends {
  return useMemo(() => ({
    weight: trendFor(metrics, "weightKg", goals.targetWeightKg, true),
    muscle: trendFor(metrics, "muscleMassPct", goals.targetMuscleMassPct, false),
    bodyFat: trendFor(metrics, "bodyFatPct", goals.targetBodyFatPct, true),
  }), [metrics, goals.targetWeightKg, goals.targetMuscleMassPct, goals.targetBodyFatPct]);
}


export function useWeeklyCounts(
  gym: GymSession[],
  pt: PTSession[],
  cardio: CardioSession[],
) {
  return useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const inWeek = (d: string) => {
      try { return isWithinInterval(parseISO(d), { start, end }); } catch { return false; }
    };
    return {
      gym: gym.filter((s) => inWeek(s.date)).length,
      pt: pt.filter((s) => inWeek(s.date)).length,
      cardio: cardio.filter((s) => inWeek(s.date)).length,
    };
  }, [gym, pt, cardio]);
}

// Group total weekly volume (kg) by muscle group
export function useWeeklyMuscleVolume(gym: GymSession[]) {
  return useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const map = new Map<string, { sets: number; volume: number }>();
    for (const s of gym) {
      try {
        if (!isWithinInterval(parseISO(s.date), { start, end })) continue;
      } catch { continue; }
      for (const ex of s.exercises) {
        const cur = map.get(ex.muscleGroup) || { sets: 0, volume: 0 };
        cur.sets += ex.sets.length;
        cur.volume += ex.sets.reduce((a, st) => a + st.reps * st.weight, 0);
        map.set(ex.muscleGroup, cur);
      }
    }
    return Array.from(map.entries())
      .map(([group, v]) => ({ group, sets: v.sets, volume: Math.round(v.volume) }))
      .sort((a, b) => b.volume - a.volume);
  }, [gym]);
}

// Personal records per exercise: best (weight*reps) score, plus best weight
export interface PRRecord {
  exercise: string;
  bestWeight: number;
  bestReps: number;
  best1RMEst: number; // Epley
  date: string;
}
export function computePRs(gym: GymSession[]): Map<string, PRRecord> {
  const out = new Map<string, PRRecord>();
  // Iterate oldest-first to track when records were set
  const sorted = [...gym].sort((a, b) => a.date.localeCompare(b.date));
  for (const s of sorted) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (set.weight <= 0 || set.reps <= 0) continue;
        const est = set.weight * (1 + set.reps / 30); // Epley
        const cur = out.get(ex.exerciseName);
        if (!cur || est > cur.best1RMEst) {
          out.set(ex.exerciseName, {
            exercise: ex.exerciseName,
            bestWeight: set.weight,
            bestReps: set.reps,
            best1RMEst: est,
            date: s.date,
          });
        }
      }
    }
  }
  return out;
}

// Detect new PRs in a session being saved (compared to historical PRs from prior sessions)
export function detectNewPRs(
  newExercises: { exerciseName: string; sets: { reps: number; weight: number }[] }[],
  historicalPRs: Map<string, PRRecord>,
): { exerciseName: string; weight: number; reps: number }[] {
  const found: { exerciseName: string; weight: number; reps: number }[] = [];
  for (const ex of newExercises) {
    let bestEst = 0;
    let bestSet: { reps: number; weight: number } | null = null;
    for (const s of ex.sets) {
      if (s.weight <= 0 || s.reps <= 0) continue;
      const est = s.weight * (1 + s.reps / 30);
      if (est > bestEst) { bestEst = est; bestSet = s; }
    }
    if (!bestSet) continue;
    const prior = historicalPRs.get(ex.exerciseName);
    if (!prior || bestEst > prior.best1RMEst) {
      found.push({ exerciseName: ex.exerciseName, weight: bestSet.weight, reps: bestSet.reps });
    }
  }
  return found;
}

// Per-exercise series for charting
export function exerciseSeries(gym: GymSession[], exerciseName: string) {
  const points: { date: string; topWeight: number; volume: number }[] = [];
  const sorted = [...gym].sort((a, b) => a.date.localeCompare(b.date));
  for (const s of sorted) {
    for (const ex of s.exercises) {
      if (ex.exerciseName !== exerciseName) continue;
      const topWeight = Math.max(0, ...ex.sets.map((x) => x.weight));
      const volume = ex.sets.reduce((a, st) => a + st.reps * st.weight, 0);
      points.push({ date: s.date, topWeight, volume });
    }
  }
  return points;
}
