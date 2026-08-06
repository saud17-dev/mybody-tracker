// Shared exercise catalog backed by the `exercises` table.
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

export type ExerciseType =
  | "weight_reps"
  | "bodyweight_reps"
  | "weighted_bodyweight"
  | "assisted_bodyweight"
  | "duration"
  | "distance_duration";

export interface CatalogExercise {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string;
  exerciseType: ExerciseType;
  instructions?: string | null;
  isCustom: boolean;
}

export const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms",
  "Abs", "Glutes", "Upper Legs", "Lower Legs", "Cardio",
];

export const EQUIPMENT = [
  "Barbell", "Dumbbell", "Body Weight", "Strength Machine", "Cardio Machine",
  "Kettlebell", "EZ Curl Bar", "Bands", "Pullup Bar", "Bench", "Weight Plate",
  "Exercise Ball",
];

export const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: "weight_reps", label: "Weight & reps" },
  { value: "bodyweight_reps", label: "Bodyweight reps" },
  { value: "weighted_bodyweight", label: "Weighted bodyweight (+kg)" },
  { value: "assisted_bodyweight", label: "Assisted bodyweight (-kg)" },
  { value: "duration", label: "Duration" },
  { value: "distance_duration", label: "Distance & duration" },
];

export const POPULAR_EXERCISES = [
  "Bench Press (Barbell)",
  "Squat (Barbell)",
  "Deadlift (Barbell)",
  "Pull-Up",
  "Lat Pulldown (Cable)",
  "Bent Over Row (Barbell)",
  "Overhead Press (Barbell)",
  "Bicep Curl (Dumbbell)",
  "Leg Press (Machine)",
  "Plank",
];

const mapRow = (r: any): CatalogExercise => ({
  id: r.id,
  name: r.name,
  muscleGroup: r.muscle_group,
  secondaryMuscles: r.secondary_muscles ?? [],
  equipment: r.equipment,
  exerciseType: (r.exercise_type ?? "weight_reps") as ExerciseType,
  instructions: r.instructions,
  isCustom: !!r.is_custom,
});

export function useExerciseCatalog() {
  const q = useQuery({
    queryKey: ["exercise-catalog"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CatalogExercise[]> => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });

  const byName = useMemo(() => {
    const m = new Map<string, CatalogExercise>();
    for (const e of q.data ?? []) m.set(e.name.toLowerCase(), e);
    return m;
  }, [q.data]);

  return { exercises: q.data ?? [], byName, isLoading: q.isLoading };
}

export function useCreateExercise() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async (input: {
      name: string; muscleGroup: string; equipment: string; exerciseType: ExerciseType;
    }): Promise<CatalogExercise> => {
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          name: input.name,
          muscle_group: input.muscleGroup,
          equipment: input.equipment,
          exercise_type: input.exerciseType,
          is_custom: true,
          created_by: user!.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercise-catalog"] }),
  });
  return { create: m.mutateAsync, isCreating: m.isPending };
}
