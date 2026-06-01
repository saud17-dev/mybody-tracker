export type ModuleType = "gym" | "pt" | "cardio";
export type Unit = "kg" | "lbs";

export interface GymSet {
  reps: number;
  weight: number; // always stored in kg
}

export interface GymExerciseEntry {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  sets: GymSet[];
}

export interface GymSession {
  id: string;
  date: string;
  exercises: GymExerciseEntry[];
  notes?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface PTSet {
  reps: number;       // reps OR seconds for held stretches
  weight?: number;    // optional, kg
  painScale: number;  // 1-10
}

export interface PTExerciseEntry {
  id: string;
  exerciseName: string;
  category: string;
  bodyArea?: string;
  sets: PTSet[];
  notes?: string;
}

export interface PTSession {
  id: string;
  date: string;
  exercises: PTExerciseEntry[];
  overallNotes?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface CardioSession {
  id: string;
  date: string;
  activity: string;
  durationMin: number;
  distanceKm?: number;
  notes?: string;
  startedAt?: string;
  endedAt?: string;
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

export interface Profile {
  id: string;
  displayName: string | null;
  unit: Unit;
  restTimerSeconds: number;
}

export interface CustomExercise {
  id: string;
  module: "gym" | "pt";
  name: string;
  muscleGroup: string;
  bodyArea?: string;
}

export interface PlanDay {
  day_of_week: number; // 0-6, Sun-Sat
  module: "gym" | "pt" | "cardio" | "rest";
  template_id?: string | null;
  label?: string | null;
}

export interface WorkoutTemplate {
  id: string;
  module: "gym" | "pt" | "cardio";
  name: string;
  emoji?: string;
  payload: any;
}
