// Cloud-backed React hooks for all app data.
// Replaces the old localStorage hooks. All weights stored in kg.

import { useEffect, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import type {
  GymSession, PTSession, CardioSession, BodyMetric, Goals,
  Profile, CustomExercise, PlanDay, WorkoutTemplate,
} from "./types";

// ---------- helpers ----------
const onSaveError = (e: any) => {
  const msg = e?.message || "Save failed";
  if (/jwt|expired|not authenticated|auth/i.test(msg)) {
    toast.error("Session expired — please sign in again");
  } else {
    toast.error(`Save failed: ${msg}`);
  }
};

// ---------- Profile ----------
export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, unit, rest_timer_seconds")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        displayName: data.display_name,
        unit: (data.unit as any) || "kg",
        restTimerSeconds: data.rest_timer_seconds ?? 90,
      };
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const payload: any = { updated_at: new Date().toISOString() };
      if (patch.displayName !== undefined) payload.display_name = patch.displayName;
      if (patch.unit !== undefined) payload.unit = patch.unit;
      if (patch.restTimerSeconds !== undefined) payload.rest_timer_seconds = patch.restTimerSeconds;
      const { error } = await supabase.from("profiles").update(payload).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
    onError: onSaveError,
  });

  return { profile: q.data ?? null, loading: q.isLoading, update: update.mutateAsync };
}

// ---------- Goals ----------
export function useGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Goals> => {
      const { data, error } = await supabase
        .from("goals").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return {
        weeklyGym: data?.weekly_gym ?? 4,
        weeklyPT: data?.weekly_pt ?? 1,
        weeklyCardio: data?.weekly_cardio ?? 2,
        targetWeightKg: data?.target_weight ?? undefined,
        targetMuscleMassPct: data?.target_muscle_mass_pct ?? undefined,
        targetBodyFatPct: data?.target_body_fat_pct ?? undefined,
      };
    },
  });

  const save = useMutation({
    mutationFn: async (g: Goals) => {
      const { error } = await supabase.from("goals").upsert({
        user_id: user!.id,
        weekly_gym: g.weeklyGym,
        weekly_pt: g.weeklyPT,
        weekly_cardio: g.weeklyCardio,
        target_weight: g.targetWeightKg ?? null,
        target_muscle_mass_pct: g.targetMuscleMassPct ?? null,
        target_body_fat_pct: g.targetBodyFatPct ?? null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", user?.id] }),
    onError: onSaveError,
  });

  return {
    goals: q.data ?? { weeklyGym: 4, weeklyPT: 1, weeklyCardio: 2 } as Goals,
    save: save.mutateAsync,
  };
}

// ---------- Gym sessions ----------
function rowToGym(r: any): GymSession {
  return { id: r.id, date: r.date, exercises: r.exercises ?? [], notes: r.notes ?? undefined };
}

export function useGymSessions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["gym", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<GymSession[]> => {
      const { data, error } = await supabase
        .from("gym_sessions").select("*").eq("user_id", user!.id).order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToGym);
    },
  });

  const create = useMutation({
    mutationFn: async (s: Omit<GymSession, "id">) => {
      const { data, error } = await supabase.from("gym_sessions").insert({
        user_id: user!.id, date: s.date, exercises: s.exercises as any, notes: s.notes ?? null,
      }).select().single();
      if (error) throw error;
      return rowToGym(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gym", user?.id] }),
    onError: onSaveError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gym_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gym", user?.id] }),
    onError: onSaveError,
  });

  return { sessions: q.data ?? [], loading: q.isLoading, create: create.mutateAsync, remove: remove.mutateAsync };
}

// ---------- PT sessions ----------
function rowToPT(r: any): PTSession {
  return { id: r.id, date: r.date, exercises: r.exercises ?? [], overallNotes: r.overall_notes ?? undefined };
}

export function usePTSessions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["pt", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PTSession[]> => {
      const { data, error } = await supabase.from("pt_sessions").select("*").eq("user_id", user!.id).order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToPT);
    },
  });
  const create = useMutation({
    mutationFn: async (s: Omit<PTSession, "id">) => {
      const { error } = await supabase.from("pt_sessions").insert({
        user_id: user!.id, date: s.date, exercises: s.exercises as any, overall_notes: s.overallNotes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pt", user?.id] }),
    onError: onSaveError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pt_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pt", user?.id] }),
    onError: onSaveError,
  });
  return { sessions: q.data ?? [], loading: q.isLoading, create: create.mutateAsync, remove: remove.mutateAsync };
}

// ---------- Cardio sessions ----------
function rowToCardio(r: any): CardioSession {
  return {
    id: r.id, date: r.date, activity: r.activity, durationMin: Number(r.duration_min),
    distanceKm: r.distance_km == null ? undefined : Number(r.distance_km),
    notes: r.notes ?? undefined,
  };
}

export function useCardioSessions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cardio", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CardioSession[]> => {
      const { data, error } = await supabase.from("cardio_sessions").select("*").eq("user_id", user!.id).order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToCardio);
    },
  });
  const create = useMutation({
    mutationFn: async (s: Omit<CardioSession, "id">) => {
      const { error } = await supabase.from("cardio_sessions").insert({
        user_id: user!.id, date: s.date, activity: s.activity,
        duration_min: s.durationMin, distance_km: s.distanceKm ?? null, notes: s.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cardio", user?.id] }),
    onError: onSaveError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cardio_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cardio", user?.id] }),
    onError: onSaveError,
  });
  return { sessions: q.data ?? [], loading: q.isLoading, create: create.mutateAsync, remove: remove.mutateAsync };
}

// ---------- Body metrics ----------
function rowToBody(r: any): BodyMetric {
  return {
    id: r.id, date: r.date,
    weightKg: r.weight == null ? undefined : Number(r.weight),
    muscleMassPct: r.muscle_mass_pct == null ? undefined : Number(r.muscle_mass_pct),
    bodyFatPct: r.body_fat_pct == null ? undefined : Number(r.body_fat_pct),
  };
}
export function useBodyMetrics() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["body", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BodyMetric[]> => {
      const { data, error } = await supabase.from("body_metrics").select("*").eq("user_id", user!.id).order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToBody);
    },
  });
  const create = useMutation({
    mutationFn: async (m: Omit<BodyMetric, "id">) => {
      const { error } = await supabase.from("body_metrics").insert({
        user_id: user!.id, date: m.date,
        weight: m.weightKg ?? null, muscle_mass_pct: m.muscleMassPct ?? null, body_fat_pct: m.bodyFatPct ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body", user?.id] }),
    onError: onSaveError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("body_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body", user?.id] }),
    onError: onSaveError,
  });
  return { metrics: q.data ?? [], loading: q.isLoading, create: create.mutateAsync, remove: remove.mutateAsync };
}

// ---------- Custom exercises ----------
export function useCustomExercises(module: "gym" | "pt") {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["custom_ex", user?.id, module],
    enabled: !!user,
    queryFn: async (): Promise<CustomExercise[]> => {
      const { data, error } = await supabase.from("custom_exercises").select("*")
        .eq("user_id", user!.id).eq("module", module).order("name");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id, module: r.module, name: r.name, muscleGroup: r.muscle_group, bodyArea: r.body_area ?? undefined,
      }));
    },
  });
  const add = useMutation({
    mutationFn: async (ex: { name: string; muscleGroup: string; bodyArea?: string }) => {
      const { error } = await supabase.from("custom_exercises").insert({
        user_id: user!.id, module, name: ex.name.trim(),
        muscle_group: ex.muscleGroup, body_area: ex.bodyArea ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_ex", user?.id, module] }),
    onError: onSaveError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_ex", user?.id, module] }),
    onError: onSaveError,
  });
  return { items: q.data ?? [], add: add.mutateAsync, remove: remove.mutateAsync };
}

// ---------- Favorites ----------
export function useFavorites(module: "gym" | "pt") {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["favs", user?.id, module],
    enabled: !!user,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase.from("favorite_exercises").select("exercise_name")
        .eq("user_id", user!.id).eq("module", module);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.exercise_name));
    },
  });
  const toggle = useMutation({
    mutationFn: async (name: string) => {
      const set = q.data ?? new Set();
      if (set.has(name)) {
        const { error } = await supabase.from("favorite_exercises").delete()
          .eq("user_id", user!.id).eq("module", module).eq("exercise_name", name);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorite_exercises").insert({
          user_id: user!.id, module, exercise_name: name,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favs", user?.id, module] }),
    onError: onSaveError,
  });
  return { favorites: q.data ?? new Set<string>(), toggle: toggle.mutateAsync };
}

// ---------- Recent exercises (derived from sessions, not server-side) ----------
export function useRecentGymExercises(sessions: GymSession[], limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (!seen.has(e.exerciseName)) {
        seen.add(e.exerciseName);
        out.push(e.exerciseName);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}
export function useRecentPTExercises(sessions: PTSession[], limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (!seen.has(e.exerciseName)) {
        seen.add(e.exerciseName);
        out.push(e.exerciseName);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

// ---------- Plan schedule ----------
export function usePlanSchedule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["sched", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PlanDay[]> => {
      const { data, error } = await supabase.from("plan_schedule").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        day_of_week: r.day_of_week, module: r.module, template_id: r.template_id, label: r.label,
      }));
    },
  });
  const upsertDay = useMutation({
    mutationFn: async (d: PlanDay) => {
      const { error } = await supabase.from("plan_schedule").upsert({
        user_id: user!.id,
        day_of_week: d.day_of_week,
        module: d.module,
        template_id: d.template_id ?? null,
        label: d.label ?? null,
      }, { onConflict: "user_id,day_of_week" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sched", user?.id] }),
    onError: onSaveError,
  });

  const swapDays = useMutation({
    mutationFn: async ({ a, b }: { a: number; b: number }) => {
      const days = q.data ?? [];
      const da = days.find((d) => d.day_of_week === a);
      const db = days.find((d) => d.day_of_week === b);
      // Move via temp slot (-1 is invalid by check; use upsert delete approach)
      // Strategy: delete both, then insert swapped.
      const { error: delErr } = await supabase
        .from("plan_schedule")
        .delete()
        .eq("user_id", user!.id)
        .in("day_of_week", [a, b]);
      if (delErr) throw delErr;
      const rows: any[] = [];
      if (da) rows.push({ user_id: user!.id, day_of_week: b, module: da.module, template_id: da.template_id ?? null, label: da.label ?? null });
      if (db) rows.push({ user_id: user!.id, day_of_week: a, module: db.module, template_id: db.template_id ?? null, label: db.label ?? null });
      if (rows.length) {
        const { error: insErr } = await supabase.from("plan_schedule").insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sched", user?.id] }),
    onError: onSaveError,
  });

  return { days: q.data ?? [], upsertDay: upsertDay.mutateAsync, swapDays: swapDays.mutateAsync };
}

// ---------- Workout templates ----------
export function useWorkoutTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["tpls", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WorkoutTemplate[]> => {
      const { data, error } = await supabase.from("workout_templates").select("*")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id, module: r.module, name: r.name, emoji: r.emoji ?? undefined, payload: r.payload ?? {},
      }));
    },
  });
  const create = useMutation({
    mutationFn: async (t: Omit<WorkoutTemplate, "id">) => {
      const { data, error } = await supabase.from("workout_templates").insert({
        user_id: user!.id, module: t.module, name: t.name, emoji: t.emoji ?? null, payload: t.payload,
      }).select().single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tpls", user?.id] }),
    onError: onSaveError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tpls", user?.id] }),
    onError: onSaveError,
  });
  return { templates: q.data ?? [], create: create.mutateAsync, remove: remove.mutateAsync };
}

export const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2) + Date.now().toString(36);
