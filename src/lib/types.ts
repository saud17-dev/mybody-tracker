export type ModuleType = "gym" | "pt" | "cardio";

export interface GymSet {
  reps: number;
  weight: number;
}

export interface GymExerciseEntry {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  sets: GymSet[];
}

export interface GymSession {
  id: string;
  date: string; // ISO
  exercises: GymExerciseEntry[];
  notes?: string;
}

export interface PTExerciseEntry {
  id: string;
  exerciseName: string;
  category: string;
  sets: number;
  reps: number;
  painScale: number; // 1-10
  notes?: string;
}

export interface PTSession {
  id: string;
  date: string;
  exercises: PTExerciseEntry[];
  overallNotes?: string;
}

export interface CardioSession {
  id: string;
  date: string;
  activity: string;
  durationMin: number;
  distanceKm?: number;
  notes?: string;
}

export interface BodyMetric {
  id: string;
  date: string;
  weightKg?: number;
  muscleMassPct?: number;
  bodyFatPct?: number;
}

export interface Goals {
  weeklyGym: number;
  weeklyPT: number;
  weeklyCardio: number;
  targetWeightKg?: number;
  targetMuscleMassPct?: number;
  targetBodyFatPct?: number;
}
