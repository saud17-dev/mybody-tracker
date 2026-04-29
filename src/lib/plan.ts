// Saud's Summer Training Plan — April → End of July
// Structured templates that pre-fill the Gym/PT/Cardio loggers.

export type TemplateModule = "gym" | "pt" | "cardio";

export interface GymTemplateExercise {
  name: string;
  group: string;
  sets: number;
  reps: number; // target reps per set
  note?: string;
  phase?: 1 | 2 | 3; // optional: only show from this phase onward
}

export interface PTTemplateExercise {
  name: string;
  group: string;
  sets: number;
  reps: number; // for held stretches, "reps" = seconds
  note?: string;
}

export interface CardioTemplate {
  activity: string;
  durationMin: number;
  note?: string;
}

export interface WorkoutTemplate {
  id: string;
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday (JS getDay)
  dayLabel: string;
  title: string;
  module: TemplateModule;
  location: string;
  emoji: string;
  gym?: GymTemplateExercise[];
  pt?: PTTemplateExercise[];
  cardio?: CardioTemplate;
  notes?: string;
}

export const PLAN_META = {
  athlete: "Saud",
  startWeight: 77,
  startDate: "2026-04-07", // Phase 1 start (Tuesday Apr 7)
  phases: [
    { id: 1, name: "Foundation", weeks: "1–6", from: "2026-04-07", to: "2026-05-18", goal: "Re-establish movement quality, build tendon and fascial resilience around the knee, create a strength base without overloading the patella." },
    { id: 2, name: "Build", weeks: "7–12", from: "2026-05-19", to: "2026-06-29", goal: "Hypertrophy focus. The summer body is made in this phase." },
    { id: 3, name: "Sharpen", weeks: "13–16", from: "2026-06-30", to: "2026-07-31", goal: "Reveal the muscle built in Phase 2. Definition and conditioning for summer." },
  ] as const,
};

export const KNEE_RULES = {
  avoid: [
    "Deep squats below 90°",
    "Heavy lunges with forward knee travel",
    "Leg extension machine (direct patella tendon load)",
    "High-impact plyometrics (box jumps, jump squats)",
    "Long distance running on hard pavement",
  ],
  helps: [
    "Cycling — zero impact, builds VMO",
    "Hip hinge patterns (RDL, kettlebell swings)",
    "Glute and hip abductor work — reduces lateral patella pull",
    "Controlled step-ups with slow descent",
    "Daily hip flexor and quad fascia stretching",
  ],
};

export const RULES_FOR_SHARP = [
  "Train upper body hard — V-taper reads lean even before fat loss",
  "Protect the knee — never train through sharp pain",
  "Cycling is underrated — burns fat, preserves muscle, heals the knee",
  "Football counts — agility, explosive movement, social dopamine",
  "Fascia work — 10 min every morning",
  "Protein at breakfast — you can't build in a deficit",
  "Sleep is when muscle is built",
];

// ----- Templates (day 0 = Sunday … 6 = Saturday) -----

export const TEMPLATES: WorkoutTemplate[] = [
  {
    id: "mon-push",
    day: 1,
    dayLabel: "Monday",
    title: "Push — Chest, Shoulders, Triceps",
    module: "gym",
    location: "Gym",
    emoji: "💪",
    gym: [
      { name: "Dumbbell Bench Press", group: "Chest", sets: 4, reps: 10 },
      { name: "Incline Dumbbell Press", group: "Chest", sets: 3, reps: 12 },
      { name: "Seated Dumbbell Shoulder Press", group: "Shoulders", sets: 3, reps: 12 },
      { name: "Cable Lateral Raise", group: "Shoulders", sets: 3, reps: 15 },
      { name: "Face Pull", group: "Back", sets: 3, reps: 15, note: "Shoulder health — do not skip" },
      { name: "Tricep Pushdown", group: "Arms", sets: 3, reps: 15 },
      { name: "Push-Up", group: "Chest", sets: 1, reps: 20, note: "To failure" },
      { name: "Cable Fly", group: "Chest", sets: 3, reps: 15, phase: 2, note: "Phase 2: chest definition" },
      { name: "Overhead Tricep Extension", group: "Arms", sets: 3, reps: 12, phase: 2 },
    ],
  },
  {
    id: "tue-kb",
    day: 2,
    dayLabel: "Tuesday",
    title: "Kettlebell + Conditioning",
    module: "gym",
    location: "Outdoor / Gym",
    emoji: "🏋️",
    gym: [
      { name: "Kettlebell Swing", group: "Olympic", sets: 4, reps: 15, note: "Hip hinge, minimal knee load" },
      { name: "Turkish Get-Up", group: "Olympic", sets: 3, reps: 3, note: "Each side — full body fascia + stability" },
      { name: "Single-Arm KB Row", group: "Back", sets: 3, reps: 12, note: "Each side" },
      { name: "Goblet Squat", group: "Legs", sets: 3, reps: 10, note: "Controlled, stop at 90°" },
      { name: "Farmer's Carry", group: "Olympic", sets: 3, reps: 30, note: "30 meters" },
      { name: "Pallof Press", group: "Core", sets: 3, reps: 12, note: "Anti-rotation" },
      { name: "Cable Woodchop (High to Low)", group: "Core", sets: 3, reps: 12, note: "Rotational power — mirrors a football kick" },
      { name: "Dead Bug", group: "Core", sets: 3, reps: 10, note: "Multi-plane stability — knee-friendly" },
    ],
    notes: "Phase 3: add 10–15 min HIIT finisher (battle ropes, bike sprints, KB swings).",
  },
  {
    id: "wed-pull",
    day: 3,
    dayLabel: "Wednesday",
    title: "Pull — Back, Biceps",
    module: "gym",
    location: "Gym",
    emoji: "🎯",
    gym: [
      { name: "Pull-Up", group: "Back", sets: 4, reps: 10, note: "Or lat pulldown" },
      { name: "Seated Cable Row", group: "Back", sets: 3, reps: 12 },
      { name: "Dumbbell Row", group: "Back", sets: 3, reps: 12, note: "Single-arm, each side" },
      { name: "Face Pull", group: "Back", sets: 3, reps: 15 },
      { name: "Barbell Curl", group: "Arms", sets: 3, reps: 12 },
      { name: "Hammer Curl", group: "Arms", sets: 3, reps: 12 },
      { name: "Incline Dumbbell Curl", group: "Arms", sets: 3, reps: 12, phase: 2, note: "Phase 2: bicep peak" },
    ],
  },
  {
    id: "thu-football",
    day: 4,
    dayLabel: "Thursday",
    title: "Football",
    module: "cardio",
    location: "Outdoor",
    emoji: "⚽",
    cardio: { activity: "Football", durationMin: 60, note: "5 min light jog → leg swings → hip circles → dynamic stretches. Never skip warm-up." },
    notes: "Dopamine + social + fascia session combined.",
  },
  {
    id: "fri-lower",
    day: 5,
    dayLabel: "Friday",
    title: "Lower Body — Knee-Safe",
    module: "gym",
    location: "Gym",
    emoji: "🦵",
    gym: [
      { name: "Leg Press", group: "Legs", sets: 4, reps: 12, note: "Controlled range, stop before full knee bend" },
      { name: "Romanian Deadlift", group: "Legs", sets: 4, reps: 10, note: "Hamstring dominant, minimal knee stress" },
      { name: "Lying Leg Curl", group: "Legs", sets: 3, reps: 15 },
      { name: "Hip Abduction Machine", group: "Legs", sets: 3, reps: 15, note: "Patella stabilizer — most important" },
      { name: "Calf Raise", group: "Legs", sets: 4, reps: 20 },
      { name: "Step-Up (Low Box)", group: "Legs", sets: 3, reps: 10, note: "Each leg, controlled descent" },
      { name: "Glute Bridge", group: "Core", sets: 3, reps: 15 },
      { name: "Copenhagen Plank", group: "Core", sets: 3, reps: 30, note: "Each side — directly stabilizes patella" },
      { name: "Landmine Rotation", group: "Core", sets: 3, reps: 10, note: "Full rotational power" },
      { name: "Single-Leg RDL", group: "Legs", sets: 3, reps: 10, phase: 2, note: "Phase 2: knee stability + balance" },
    ],
    notes: "⚠ Avoid: full barbell squats, lunges, leg extension machine.",
  },
  {
    id: "sat-cycling",
    day: 6,
    dayLabel: "Saturday",
    title: "Cycling",
    module: "cardio",
    location: "Outdoor",
    emoji: "🚴",
    cardio: { activity: "Cycling", durationMin: 50, note: "Zone 2 — slightly breathless but can talk. Best thing for patella alta outside the gym." },
    notes: "Phase 2: 60–75 min. Phase 3: interval rides (5 min hard / 5 min easy / repeat).",
  },
  {
    id: "sun-fascia",
    day: 0,
    dayLabel: "Sunday",
    title: "Fascia + Stretch Protocol",
    module: "pt",
    location: "Home",
    emoji: "🧘",
    pt: [
      { name: "Foam Roll - IT Band", group: "Fascia", sets: 2, reps: 60, note: "60s each side" },
      { name: "Foam Roll - Quad", group: "Fascia", sets: 2, reps: 60, note: "60s each side" },
      { name: "Foam Roll - Hip Flexor", group: "Fascia", sets: 2, reps: 60, note: "60s each side" },
      { name: "Foam Roll - Thoracic", group: "Fascia", sets: 1, reps: 60 },
      { name: "Hip Flexor Lunge Stretch", group: "Stretch", sets: 1, reps: 90, note: "Most important for knee" },
      { name: "Seated Hamstring Stretch", group: "Stretch", sets: 1, reps: 90 },
      { name: "Pigeon Pose", group: "Stretch", sets: 1, reps: 90, note: "Glute / hip external rotator" },
      { name: "Standing Quad Stretch", group: "Stretch", sets: 1, reps: 90 },
      { name: "Doorway Chest Stretch", group: "Stretch", sets: 1, reps: 90, note: "Counteracts pushing work" },
      { name: "Wall Calf Stretch", group: "Stretch", sets: 1, reps: 90 },
    ],
    notes: "Hold each stretch 90 seconds. 10-min version every morning on waking.",
  },
];

export function getCurrentPhase(date: Date = new Date()) {
  const t = date.getTime();
  for (const p of PLAN_META.phases) {
    if (t >= new Date(p.from).getTime() && t <= new Date(p.to).getTime() + 86400000) {
      return p;
    }
  }
  // Default: closest phase
  return PLAN_META.phases[0];
}

export function getCurrentWeek(date: Date = new Date()): number {
  const start = new Date(PLAN_META.startDate).getTime();
  const diffDays = Math.floor((date.getTime() - start) / 86400000);
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function getTodayTemplate(date: Date = new Date()): WorkoutTemplate | undefined {
  return TEMPLATES.find((t) => t.day === date.getDay());
}

export function getTemplateById(id: string): WorkoutTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function exercisesForPhase<T extends { phase?: 1 | 2 | 3 }>(items: T[], phaseId: number): T[] {
  return items.filter((it) => !it.phase || it.phase <= phaseId);
}
