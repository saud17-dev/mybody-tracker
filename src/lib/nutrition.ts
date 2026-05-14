// Cloud-backed React hooks for nutrition data.
// Follows the same pattern as cloud.ts — all data via Supabase.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

// ── Types ──────────────────────────────────────────────────────────────────

export interface MealLog {
  id: string;
  date: string;           // YYYY-MM-DD
  mealName: string;
  mealType: string;       // Breakfast | Lunch | Dinner | Snack | Shake
  proteinG: number;
  calories?: number;
}

export interface MealPreset {
  id: string;
  name: string;
  mealType: string;
  proteinG: number;
  calories?: number;
}

export interface NutritionGoal {
  dailyProteinG: number;
  dailyCalories?: number;
}

// ── Error helper ──────────────────────────────────────────────────────────

const onSaveError = (e: any) => {
  const msg = e?.message || "Save failed";
  if (/jwt|expired|not authenticated|auth/i.test(msg)) {
    toast.error("Session expired — please sign in again");
  } else {
    toast.error(`Save failed: ${msg}`);
  }
};

// ── Meal Logs ─────────────────────────────────────────────────────────────

function rowToLog(r: any): MealLog {
  return {
    id: r.id,
    date: r.date,
    mealName: r.meal_name,
    mealType: r.meal_type,
    proteinG: Number(r.protein_g),
    calories: r.calories == null ? undefined : Number(r.calories),
  };
}

export function useMealLogs() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["meal_logs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MealLog[]> => {
      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToLog);
    },
  });

  const create = useMutation({
    mutationFn: async (m: Omit<MealLog, "id">) => {
      const { error } = await supabase.from("meal_logs").insert({
        user_id: user!.id,
        date: m.date,
        meal_name: m.mealName,
        meal_type: m.mealType,
        protein_g: m.proteinG,
        calories: m.calories ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal_logs", user?.id] }),
    onError: onSaveError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal_logs", user?.id] }),
    onError: onSaveError,
  });

  return {
    logs: q.data ?? [],
    loading: q.isLoading,
    create: create.mutateAsync,
    remove: remove.mutateAsync,
  };
}

// ── Meal Presets ──────────────────────────────────────────────────────────

function rowToPreset(r: any): MealPreset {
  return {
    id: r.id,
    name: r.name,
    mealType: r.meal_type,
    proteinG: Number(r.protein_g),
    calories: r.calories == null ? undefined : Number(r.calories),
  };
}

export function useMealPresets() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["meal_presets", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MealPreset[]> => {
      const { data, error } = await supabase
        .from("meal_presets")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return (data ?? []).map(rowToPreset);
    },
  });

  const addPreset = useMutation({
    mutationFn: async (p: Omit<MealPreset, "id">) => {
      const { error } = await supabase.from("meal_presets").insert({
        user_id: user!.id,
        name: p.name,
        meal_type: p.mealType,
        protein_g: p.proteinG,
        calories: p.calories ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal_presets", user?.id] }),
    onError: onSaveError,
  });

  const removePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_presets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal_presets", user?.id] }),
    onError: onSaveError,
  });

  return {
    presets: q.data ?? [],
    addPreset: addPreset.mutateAsync,
    removePreset: removePreset.mutateAsync,
  };
}

// ── Nutrition Goal ────────────────────────────────────────────────────────

export function useNutritionGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["nutrition_goal", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NutritionGoal> => {
      const { data, error } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return {
        dailyProteinG: data?.daily_protein_g ?? 160,
        dailyCalories: data?.daily_calories ?? undefined,
      };
    },
  });

  const save = useMutation({
    mutationFn: async (g: NutritionGoal) => {
      const { error } = await supabase.from("nutrition_goals").upsert({
        user_id: user!.id,
        daily_protein_g: g.dailyProteinG,
        daily_calories: g.dailyCalories ?? null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nutrition_goal", user?.id] }),
    onError: onSaveError,
  });

  return {
    goal: q.data ?? { dailyProteinG: 160 },
    save: save.mutateAsync,
  };
}
