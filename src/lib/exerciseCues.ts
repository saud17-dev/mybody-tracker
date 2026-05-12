// Lightweight cue + target-area lookup. Pattern-based so it covers any exercise
// name without needing a per-exercise database.

const RULES: { test: RegExp; cues: string[] }[] = [
  { test: /foam roll|lacrosse ball/i, cues: [
    "Move slowly, ~1 inch per second",
    "Pause 20–30s on tender spots, breathe",
    "Stay off bony landmarks and the lower back",
  ]},
  { test: /stretch|pose|fold|pigeon|cobra|sphinx|downward dog/i, cues: [
    "Ease into the stretch, never force it",
    "Hold 20–45s, breathe slow and deep",
    "You should feel tension, not sharp pain",
  ]},
  { test: /balance|single[- ]leg stance|tandem|bosu/i, cues: [
    "Soft knee, weight on tripod of foot",
    "Eyes on a fixed point (or closed for harder)",
    "Small ankle/hip adjustments — don't lock out",
  ]},
  { test: /plank|hollow|dead bug|bird ?dog|side plank|pallof|copenhagen/i, cues: [
    "Ribs down, glutes squeezed, neutral spine",
    "Breathe — don't hold your breath",
    "Quality over time: stop when form breaks",
  ]},
  { test: /deadlift|rdl|good morning|kettlebell swing|hip thrust|bridge|hyperextension|superman/i, cues: [
    "Hinge at hips, neutral spine throughout",
    "Brace core before each rep",
    "Drive through heels, finish with glutes",
  ]},
  { test: /squat|leg press|hack squat|lunge|step[- ]?up|pistol|sissy|wall sit|cossack/i, cues: [
    "Feet planted, brace core",
    "Knees track in line with toes",
    "Control the descent, drive through midfoot",
  ]},
  { test: /bench press|push[- ]?up|chest press|fly|crossover|dip/i, cues: [
    "Retract and depress shoulder blades",
    "Feet planted, slight arch in upper back",
    "Control the eccentric, drive smoothly",
  ]},
  { test: /row|pulldown|pull[- ]?up|chin[- ]?up|face pull|reverse fly/i, cues: [
    "Initiate from the back, not the arms",
    "Pull elbows toward hips/torso",
    "Squeeze shoulder blades at the end range",
  ]},
  { test: /overhead press|shoulder press|push press|jerk|z press/i, cues: [
    "Glutes and core tight, ribs stacked over hips",
    "Bar path straight up over mid-foot",
    "Lock out fully overhead",
  ]},
  { test: /lateral raise|front raise|rear delt|y[- ]raise|t[- ]raise|w[- ]raise|wall angel|arnold/i, cues: [
    "Slight bend in elbows, no swinging",
    "Lead with the elbows, not the hands",
    "Control the lowering phase",
  ]},
  { test: /curl/i, cues: [
    "Elbows pinned to your sides",
    "Full range — straighten at the bottom",
    "Slow 2–3s eccentric, no swinging",
  ]},
  { test: /tricep|pushdown|skullcrusher|jm press|kickback|close[- ]grip/i, cues: [
    "Keep elbows tucked and stationary",
    "Only the forearm should move",
    "Lock out fully, control on the way back",
  ]},
  { test: /clean|snatch|thruster|wall ball|burpee|man maker|devil press/i, cues: [
    "Set a strong start position before each rep",
    "Drive aggressively through the legs",
    "Keep the bar/weight close to the body",
  ]},
  { test: /carry/i, cues: [
    "Tall posture, ribs over hips",
    "Brace core, shoulders packed down",
    "Walk smooth — no waddling or leaning",
  ]},
  { test: /crunch|sit[- ]?up|leg raise|toes[- ]to[- ]bar|v[- ]?up|woodchop|russian twist|ab wheel|dragon flag|l[- ]sit/i, cues: [
    "Posterior pelvic tilt, lower back flat",
    "Move under control — no momentum",
    "Exhale through the hardest point",
  ]},
  { test: /clamshell|fire hydrant|monster walk|side[- ]lying|hip abduction|adductor/i, cues: [
    "Keep hips stacked, don't roll back",
    "Move slow with full control",
    "Feel it in the glute, not the lower back",
  ]},
  { test: /cat[- ]cow|thoracic|pelvic tilt|spinal|chin tuck|neck/i, cues: [
    "Move smoothly through full range",
    "Pair the motion with your breath",
    "Stop short of any sharp pain",
  ]},
  { test: /external rotation|internal rotation|band pull|scapular|wall slide/i, cues: [
    "Elbows pinned, only rotate the shoulder",
    "Move slowly — quality over reps",
    "Stop if you feel pinching",
  ]},
  { test: /calf raise|heel raise|toe curl|ankle/i, cues: [
    "Full range — stretch at the bottom, peak contraction at the top",
    "Pause briefly at the top",
    "Keep weight evenly across the foot",
  ]},
];

const GROUP_FALLBACK: Record<string, string[]> = {
  Chest: ["Retract scapula and brace core", "Control eccentric, drive concentric", "Stop a rep short of failure"],
  Back: ["Lead with elbows, not biceps", "Squeeze at end range", "Maintain neutral spine"],
  Legs: ["Brace core before each rep", "Knees track toes", "Drive through midfoot"],
  Shoulders: ["Ribs stacked over hips", "Slight elbow bend, no swinging", "Control the lowering phase"],
  Arms: ["Elbows stationary, isolate the muscle", "Full range of motion", "Slow eccentric, no momentum"],
  Core: ["Brace 360° around the spine", "Move under control", "Exhale through the hardest point"],
  Olympic: ["Strong setup before every rep", "Bar/weight close to body", "Drive aggressively, finish tall"],
  Mobility: ["Smooth, controlled reps", "Pair movement with breath", "Stay below any pain threshold"],
  Stability: ["Quality over duration", "Breathe normally", "Stop when form breaks"],
  Shoulder: ["Slow, controlled rotation", "Stop short of pinching", "Quality reps over heavy load"],
  "Knee/Hip": ["Keep hips level", "Feel the target muscle, not the lower back", "Move slowly, no momentum"],
  "Lower Back": ["Move gently, never force range", "Pair with breath", "Avoid sharp pain"],
  "Foot/Ankle": ["Full ROM, brief pause at end range", "Even weight across the foot", "Slow tempo"],
  Neck: ["Move gently, small range", "Stop at the first sign of pinching", "Hold 10–20s"],
  Fascia: ["Slow passes, ~1 inch/second", "Pause on tender spots, breathe", "Skip bony areas and lower back"],
  Stretch: ["Ease in, never force", "Hold 20–45s", "Tension yes, sharp pain no"],
  "Leg Strength": ["Brace core before each rep", "Move with control", "Stop when form breaks"],
};

const GYM_AREA: Record<string, string> = {
  Chest: "Pecs (chest)",
  Back: "Lats and upper back",
  Legs: "Quads, glutes, hamstrings",
  Shoulders: "Deltoids",
  Arms: "Biceps, triceps, forearms",
  Core: "Abs and obliques",
  Olympic: "Full body",
};

export function getExerciseCues(name: string, group: string): string[] {
  for (const r of RULES) if (r.test.test(name)) return r.cues;
  return GROUP_FALLBACK[group] ?? [
    "Set up with intent before each rep",
    "Move under control, full range",
    "Stop a rep or two short of failure",
  ];
}

export function getTargetArea(opts: {
  module: "gym" | "pt";
  name: string;
  group: string;
  bodyArea?: string;
}): string {
  if (opts.module === "pt") return opts.bodyArea || opts.group;
  return GYM_AREA[opts.group] ?? opts.group;
}
