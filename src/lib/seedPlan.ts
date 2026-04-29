// Summer Training Plan seed: 7 templates + weekly schedule.
// Idempotent — only runs when triggered explicitly from Plan page.

export type SeedExercise = { name: string; group: string; bodyArea?: string; sets: number; reps: number };
export type SeedTemplate = {
  module: "gym" | "pt" | "cardio";
  name: string;
  emoji: string;
  payload: any;
  dayOfWeek: number; // 0=Sun..6=Sat
  label?: string;
};

export const SUMMER_PLAN_TEMPLATES: SeedTemplate[] = [
  {
    module: "gym", name: "Push", emoji: "💪", dayOfWeek: 1, label: "Push",
    payload: {
      exercises: [
        { name: "Dumbbell Bench Press", group: "Chest", sets: 4, reps: 10 },
        { name: "Incline Dumbbell Press", group: "Chest", sets: 3, reps: 12 },
        { name: "Seated Dumbbell Shoulder Press", group: "Shoulders", sets: 3, reps: 12 },
        { name: "Cable Lateral Raise", group: "Shoulders", sets: 3, reps: 15 },
        { name: "Face Pull", group: "Back", sets: 3, reps: 15 },
        { name: "Tricep Pushdown", group: "Arms", sets: 3, reps: 15 },
        { name: "Push-Up", group: "Chest", sets: 1, reps: 20 },
        { name: "Pallof Press", group: "Core", sets: 3, reps: 12 },
        { name: "Cable Woodchop (High to Low)", group: "Core", sets: 3, reps: 12 },
      ] as SeedExercise[],
    },
  },
  {
    module: "gym", name: "Kettlebell", emoji: "🏋", dayOfWeek: 2, label: "Kettlebell + Conditioning",
    payload: {
      exercises: [
        { name: "Kettlebell Swing", group: "Olympic", sets: 4, reps: 15 },
        { name: "Turkish Get-Up", group: "Olympic", sets: 3, reps: 3 },
        { name: "Single-Arm KB Row", group: "Back", sets: 3, reps: 12 },
        { name: "Goblet Squat", group: "Legs", sets: 3, reps: 10 },
        { name: "Farmer's Carry", group: "Olympic", sets: 3, reps: 30 },
        { name: "Dead Bug", group: "Core", sets: 3, reps: 12 },
      ] as SeedExercise[],
    },
  },
  {
    module: "gym", name: "Pull", emoji: "🪢", dayOfWeek: 3, label: "Pull",
    payload: {
      exercises: [
        { name: "Pull-Up", group: "Back", sets: 4, reps: 10 },
        { name: "Seated Cable Row", group: "Back", sets: 3, reps: 12 },
        { name: "Dumbbell Row", group: "Back", sets: 3, reps: 12 },
        { name: "Face Pull", group: "Back", sets: 3, reps: 15 },
        { name: "Barbell Curl", group: "Arms", sets: 3, reps: 12 },
        { name: "Hammer Curl", group: "Arms", sets: 3, reps: 12 },
      ] as SeedExercise[],
    },
  },
  {
    module: "cardio", name: "Football", emoji: "⚽", dayOfWeek: 4, label: "Football",
    payload: { activity: "Football", durationMin: 60 },
  },
  {
    module: "gym", name: "Lower – Knee Safe", emoji: "🦵", dayOfWeek: 5, label: "Lower Body",
    payload: {
      exercises: [
        { name: "Leg Press", group: "Legs", sets: 4, reps: 12 },
        { name: "Romanian Deadlift", group: "Legs", sets: 4, reps: 10 },
        { name: "Lying Leg Curl", group: "Legs", sets: 3, reps: 15 },
        { name: "Hip Abduction Machine", group: "Legs", sets: 3, reps: 15 },
        { name: "Calf Raise", group: "Legs", sets: 4, reps: 20 },
        { name: "Step-Up (Low Box)", group: "Legs", sets: 3, reps: 10 },
        { name: "Hip Thrust", group: "Legs", sets: 3, reps: 15 },
        { name: "Copenhagen Plank", group: "Core", sets: 3, reps: 10 },
        { name: "Landmine Rotation", group: "Core", sets: 3, reps: 10 },
      ] as SeedExercise[],
    },
  },
  {
    module: "cardio", name: "Cycling", emoji: "🚴", dayOfWeek: 6, label: "Cycling Z2",
    payload: { activity: "Cycling", durationMin: 60 },
  },
  {
    module: "pt", name: "Fascia & Stretch", emoji: "🧘", dayOfWeek: 0, label: "Fascia + Stretch",
    payload: {
      exercises: [
        { name: "Foam Roll - IT Band", group: "Fascia", bodyArea: "Hip", sets: 1, reps: 60 },
        { name: "Foam Roll - Quad", group: "Fascia", bodyArea: "Knee", sets: 1, reps: 60 },
        { name: "Foam Roll - Hip Flexor", group: "Fascia", bodyArea: "Hip", sets: 1, reps: 60 },
        { name: "Foam Roll - Thoracic", group: "Fascia", bodyArea: "Spine", sets: 1, reps: 60 },
        { name: "Hip Flexor Lunge Stretch", group: "Stretch", bodyArea: "Hip", sets: 1, reps: 90 },
        { name: "Seated Hamstring Stretch", group: "Stretch", bodyArea: "Knee", sets: 1, reps: 90 },
        { name: "Pigeon Pose", group: "Stretch", bodyArea: "Hip", sets: 1, reps: 90 },
        { name: "Standing Quad Stretch", group: "Stretch", bodyArea: "Knee", sets: 1, reps: 90 },
        { name: "Doorway Chest Stretch", group: "Stretch", bodyArea: "Shoulder", sets: 1, reps: 90 },
        { name: "Wall Calf Stretch", group: "Stretch", bodyArea: "Ankle", sets: 1, reps: 90 },
      ] as SeedExercise[],
    },
  },
];
