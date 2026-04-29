// One-time migration of legacy localStorage data into the user's cloud account.
import { supabase } from "@/integrations/supabase/client";

const MIGRATED_KEY = "ft.migratedAt";

const LEGACY = {
  gym: "ft.gymSessions",
  pt: "ft.ptSessions",
  cardio: "ft.cardioSessions",
  body: "ft.bodyMetrics",
  goals: "ft.goals",
};

const readLS = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export async function migrateLocalToCloud(userId: string) {
  if (localStorage.getItem(MIGRATED_KEY)) return { migrated: false, reason: "already" };

  const gym = readLS<any[]>(LEGACY.gym, []);
  const pt = readLS<any[]>(LEGACY.pt, []);
  const cardio = readLS<any[]>(LEGACY.cardio, []);
  const body = readLS<any[]>(LEGACY.body, []);
  const goals = readLS<any | null>(LEGACY.goals, null);

  let inserted = 0;

  if (gym.length) {
    const rows = gym.map((s) => ({
      user_id: userId,
      date: s.date,
      exercises: s.exercises ?? [],
      notes: s.notes ?? null,
    }));
    const { error } = await supabase.from("gym_sessions").insert(rows);
    if (!error) inserted += rows.length;
  }

  if (pt.length) {
    // Legacy PT had {sets: number, reps: number, painScale, notes}; convert to set-by-set.
    const rows = pt.map((s) => ({
      user_id: userId,
      date: s.date,
      exercises: (s.exercises ?? []).map((e: any) => ({
        id: e.id,
        exerciseName: e.exerciseName,
        category: e.category,
        bodyArea: e.bodyArea,
        notes: e.notes,
        sets: Array.isArray(e.sets)
          ? e.sets
          : Array.from({ length: Number(e.sets) || 0 }, () => ({
              reps: Number(e.reps) || 0,
              painScale: Number(e.painScale) || 0,
            })),
      })),
      overall_notes: s.overallNotes ?? null,
    }));
    const { error } = await supabase.from("pt_sessions").insert(rows);
    if (!error) inserted += rows.length;
  }

  if (cardio.length) {
    const rows = cardio.map((s) => ({
      user_id: userId,
      date: s.date,
      activity: s.activity,
      duration_min: s.durationMin,
      distance_km: s.distanceKm ?? null,
      notes: s.notes ?? null,
    }));
    const { error } = await supabase.from("cardio_sessions").insert(rows);
    if (!error) inserted += rows.length;
  }

  if (body.length) {
    const rows = body.map((m) => ({
      user_id: userId,
      date: m.date,
      weight: m.weightKg ?? null,
      muscle_mass_pct: m.muscleMassPct ?? null,
      body_fat_pct: m.bodyFatPct ?? null,
    }));
    const { error } = await supabase.from("body_metrics").insert(rows);
    if (!error) inserted += rows.length;
  }

  if (goals) {
    await supabase.from("goals").update({
      weekly_gym: goals.weeklyGym ?? 4,
      weekly_pt: goals.weeklyPT ?? 1,
      weekly_cardio: goals.weeklyCardio ?? 2,
      target_weight: goals.targetWeightKg ?? null,
      target_muscle_mass_pct: goals.targetMuscleMassPct ?? null,
      target_body_fat_pct: goals.targetBodyFatPct ?? null,
    }).eq("user_id", userId);
  }

  localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
  // Clean up legacy keys so they don't reappear
  Object.values(LEGACY).forEach((k) => localStorage.removeItem(k));

  return { migrated: true, inserted };
}
