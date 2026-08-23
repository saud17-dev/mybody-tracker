// Built-in template library — presets any user can copy into their own templates.
export type PresetExercise = { name: string; group: string; sets: number; reps: number };
export type PresetTemplate = {
  key: string;
  module: "gym";
  name: string;
  emoji: string;
  focus: string;
  payload: { exercises: PresetExercise[] };
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    key: "upper-1", module: "gym", name: "Upper 1", emoji: "💪",
    focus: "Horizontal push & pull emphasis",
    payload: { exercises: [
      { name: "Barbell Bench Press", group: "Chest", sets: 4, reps: 8 },
      { name: "Chest-Supported Row", group: "Back", sets: 4, reps: 10 },
      { name: "Incline Dumbbell Press", group: "Chest", sets: 3, reps: 12 },
      { name: "Lat Pulldown", group: "Back", sets: 3, reps: 12 },
      { name: "Lateral Raise", group: "Shoulders", sets: 3, reps: 15 },
      { name: "Dumbbell Curl", group: "Arms", sets: 3, reps: 12 },
      { name: "Tricep Pushdown", group: "Arms", sets: 3, reps: 15 },
    ] },
  },
  {
    key: "upper-2", module: "gym", name: "Upper 2", emoji: "🧱",
    focus: "Vertical push & pull emphasis",
    payload: { exercises: [
      { name: "Overhead Press", group: "Shoulders", sets: 4, reps: 8 },
      { name: "Pull-Up", group: "Back", sets: 4, reps: 8 },
      { name: "Seated Cable Row", group: "Back", sets: 3, reps: 12 },
      { name: "Cable Fly", group: "Chest", sets: 3, reps: 15 },
      { name: "Rear Delt Fly", group: "Shoulders", sets: 3, reps: 15 },
      { name: "Hammer Curl", group: "Arms", sets: 3, reps: 12 },
      { name: "Overhead Tricep Extension", group: "Arms", sets: 3, reps: 12 },
    ] },
  },
  {
    key: "lower-1", module: "gym", name: "Lower 1", emoji: "🦵",
    focus: "Squat dominant + quads",
    payload: { exercises: [
      { name: "Back Squat", group: "Legs", sets: 4, reps: 6 },
      { name: "Bulgarian Split Squat", group: "Legs", sets: 3, reps: 10 },
      { name: "Leg Press", group: "Legs", sets: 3, reps: 12 },
      { name: "Leg Extension", group: "Legs", sets: 3, reps: 15 },
      { name: "Standing Calf Raise", group: "Legs", sets: 4, reps: 15 },
      { name: "Hanging Leg Raise", group: "Core", sets: 3, reps: 12 },
    ] },
  },
  {
    key: "lower-2", module: "gym", name: "Lower 2", emoji: "🍑",
    focus: "Hinge dominant + posterior chain",
    payload: { exercises: [
      { name: "Romanian Deadlift", group: "Legs", sets: 4, reps: 8 },
      { name: "Hip Thrust", group: "Legs", sets: 4, reps: 10 },
      { name: "Walking Lunges", group: "Legs", sets: 3, reps: 12 },
      { name: "Lying Leg Curl", group: "Legs", sets: 3, reps: 12 },
      { name: "Seated Calf Raise", group: "Legs", sets: 4, reps: 15 },
      { name: "Pallof Press", group: "Core", sets: 3, reps: 12 },
    ] },
  },
  {
    key: "push-1", module: "gym", name: "Push 1", emoji: "🔥",
    focus: "Heavy chest-led push",
    payload: { exercises: [
      { name: "Barbell Bench Press", group: "Chest", sets: 4, reps: 6 },
      { name: "Seated Dumbbell Shoulder Press", group: "Shoulders", sets: 3, reps: 10 },
      { name: "Incline Dumbbell Press", group: "Chest", sets: 3, reps: 12 },
      { name: "Cable Lateral Raise", group: "Shoulders", sets: 3, reps: 15 },
      { name: "Rope Tricep Pushdown", group: "Arms", sets: 3, reps: 15 },
      { name: "Overhead Cable Tricep Extension", group: "Arms", sets: 3, reps: 12 },
    ] },
  },
  {
    key: "push-2", module: "gym", name: "Push 2", emoji: "⚡",
    focus: "Shoulder-led push",
    payload: { exercises: [
      { name: "Overhead Press", group: "Shoulders", sets: 4, reps: 8 },
      { name: "Incline Barbell Bench Press", group: "Chest", sets: 4, reps: 8 },
      { name: "Cable Crossover", group: "Chest", sets: 3, reps: 15 },
      { name: "Lateral Raise", group: "Shoulders", sets: 4, reps: 15 },
      { name: "Dips (Triceps)", group: "Arms", sets: 3, reps: 10 },
      { name: "Skullcrusher", group: "Arms", sets: 3, reps: 12 },
    ] },
  },
  {
    key: "pull-1", module: "gym", name: "Pull 1", emoji: "🪢",
    focus: "Vertical pull emphasis",
    payload: { exercises: [
      { name: "Pull-Up", group: "Back", sets: 4, reps: 8 },
      { name: "Barbell Row", group: "Back", sets: 4, reps: 10 },
      { name: "Lat Pulldown", group: "Back", sets: 3, reps: 12 },
      { name: "Face Pull", group: "Back", sets: 3, reps: 15 },
      { name: "Barbell Curl", group: "Arms", sets: 3, reps: 10 },
      { name: "Rear Delt Fly", group: "Shoulders", sets: 3, reps: 15 },
    ] },
  },
  {
    key: "pull-2", module: "gym", name: "Pull 2", emoji: "🎣",
    focus: "Horizontal pull + deadlift",
    payload: { exercises: [
      { name: "Deadlift", group: "Back", sets: 4, reps: 5 },
      { name: "Seated Cable Row", group: "Back", sets: 4, reps: 10 },
      { name: "Dumbbell Row", group: "Back", sets: 3, reps: 12 },
      { name: "Straight-Arm Pulldown", group: "Back", sets: 3, reps: 15 },
      { name: "Cable Hammer Curl (Rope)", group: "Arms", sets: 3, reps: 12 },
      { name: "Dumbbell Shrug", group: "Shoulders", sets: 3, reps: 15 },
    ] },
  },
  {
    key: "kb-1", module: "gym", name: "Kettlebell 1", emoji: "🏋",
    focus: "Ballistic power + carries",
    payload: { exercises: [
      { name: "Kettlebell Swing", group: "Kettlebell", sets: 5, reps: 15 },
      { name: "Kettlebell Clean and Press", group: "Kettlebell", sets: 4, reps: 8 },
      { name: "Goblet Squat (Kettlebell)", group: "Kettlebell", sets: 3, reps: 12 },
      { name: "Single-Arm Kettlebell Row", group: "Kettlebell", sets: 3, reps: 12 },
      { name: "Kettlebell Turkish Get-Up", group: "Kettlebell", sets: 3, reps: 3 },
      { name: "Kettlebell Farmer's Carry", group: "Kettlebell", sets: 3, reps: 40 },
    ] },
  },
  {
    key: "kb-2", module: "gym", name: "Kettlebell 2", emoji: "🌀",
    focus: "Grinds, unilateral strength & core",
    payload: { exercises: [
      { name: "Single-Arm Kettlebell Swing", group: "Kettlebell", sets: 4, reps: 12 },
      { name: "Double Kettlebell Front Squat", group: "Kettlebell", sets: 4, reps: 10 },
      { name: "Kettlebell Single-Leg Deadlift", group: "Kettlebell", sets: 3, reps: 10 },
      { name: "Half Kneeling Kettlebell Press", group: "Kettlebell", sets: 3, reps: 10 },
      { name: "Kettlebell Renegade Row", group: "Kettlebell", sets: 3, reps: 10 },
      { name: "Kettlebell Windmill", group: "Kettlebell", sets: 3, reps: 8 },
      { name: "Kettlebell Racked Carry", group: "Kettlebell", sets: 3, reps: 40 },
    ] },
  },
];
