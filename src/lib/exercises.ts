export interface ExerciseDef {
  name: string;
  group: string;
}

export const GYM_EXERCISES: ExerciseDef[] = [
  // Chest
  { name: "Barbell Bench Press", group: "Chest" },
  { name: "Incline Barbell Bench Press", group: "Chest" },
  { name: "Decline Barbell Bench Press", group: "Chest" },
  { name: "Dumbbell Bench Press", group: "Chest" },
  { name: "Incline Dumbbell Press", group: "Chest" },
  { name: "Dumbbell Flyes", group: "Chest" },
  { name: "Cable Crossover", group: "Chest" },
  { name: "Push-Up", group: "Chest" },
  { name: "Dips (Chest)", group: "Chest" },
  { name: "Pec Deck Machine", group: "Chest" },
  // Back
  { name: "Deadlift", group: "Back" },
  { name: "Pull-Up", group: "Back" },
  { name: "Chin-Up", group: "Back" },
  { name: "Lat Pulldown", group: "Back" },
  { name: "Barbell Row", group: "Back" },
  { name: "Dumbbell Row", group: "Back" },
  { name: "Seated Cable Row", group: "Back" },
  { name: "T-Bar Row", group: "Back" },
  { name: "Face Pull", group: "Back" },
  { name: "Hyperextension", group: "Back" },
  // Legs
  { name: "Back Squat", group: "Legs" },
  { name: "Front Squat", group: "Legs" },
  { name: "Romanian Deadlift", group: "Legs" },
  { name: "Leg Press", group: "Legs" },
  { name: "Bulgarian Split Squat", group: "Legs" },
  { name: "Walking Lunges", group: "Legs" },
  { name: "Leg Extension", group: "Legs" },
  { name: "Leg Curl", group: "Legs" },
  { name: "Calf Raise", group: "Legs" },
  { name: "Hip Thrust", group: "Legs" },
  { name: "Goblet Squat", group: "Legs" },
  // Shoulders
  { name: "Overhead Press", group: "Shoulders" },
  { name: "Dumbbell Shoulder Press", group: "Shoulders" },
  { name: "Arnold Press", group: "Shoulders" },
  { name: "Lateral Raise", group: "Shoulders" },
  { name: "Front Raise", group: "Shoulders" },
  { name: "Rear Delt Fly", group: "Shoulders" },
  { name: "Upright Row", group: "Shoulders" },
  { name: "Shrugs", group: "Shoulders" },
  // Arms
  { name: "Barbell Curl", group: "Arms" },
  { name: "Dumbbell Curl", group: "Arms" },
  { name: "Hammer Curl", group: "Arms" },
  { name: "Preacher Curl", group: "Arms" },
  { name: "Concentration Curl", group: "Arms" },
  { name: "Tricep Pushdown", group: "Arms" },
  { name: "Skullcrusher", group: "Arms" },
  { name: "Overhead Tricep Extension", group: "Arms" },
  { name: "Close-Grip Bench Press", group: "Arms" },
  { name: "Dips (Triceps)", group: "Arms" },
  // Core
  { name: "Plank", group: "Core" },
  { name: "Hanging Leg Raise", group: "Core" },
  { name: "Cable Crunch", group: "Core" },
  { name: "Russian Twist", group: "Core" },
  { name: "Ab Wheel Rollout", group: "Core" },
  { name: "Sit-Up", group: "Core" },
  { name: "Mountain Climber", group: "Core" },
  // Olympic / Full Body
  { name: "Power Clean", group: "Olympic" },
  { name: "Clean & Jerk", group: "Olympic" },
  { name: "Snatch", group: "Olympic" },
  { name: "Kettlebell Swing", group: "Olympic" },
  { name: "Thruster", group: "Olympic" },
];

export const PT_EXERCISES: ExerciseDef[] = [
  // Mobility
  { name: "Cat-Cow Stretch", group: "Mobility" },
  { name: "Thoracic Rotations", group: "Mobility" },
  { name: "Hip 90/90", group: "Mobility" },
  { name: "World's Greatest Stretch", group: "Mobility" },
  { name: "Ankle Mobility Drill", group: "Mobility" },
  { name: "Shoulder Pass-Through", group: "Mobility" },
  // Stability / Core
  { name: "Dead Bug", group: "Stability" },
  { name: "Bird Dog", group: "Stability" },
  { name: "Side Plank", group: "Stability" },
  { name: "Pallof Press", group: "Stability" },
  { name: "Glute Bridge", group: "Stability" },
  { name: "Single-Leg Glute Bridge", group: "Stability" },
  // Shoulder / Rotator Cuff
  { name: "Band Pull-Apart", group: "Shoulder" },
  { name: "External Rotation (Band)", group: "Shoulder" },
  { name: "Internal Rotation (Band)", group: "Shoulder" },
  { name: "Scapular Wall Slides", group: "Shoulder" },
  { name: "Y-T-W Raises", group: "Shoulder" },
  { name: "Prone Snow Angel", group: "Shoulder" },
  // Knee / Hip
  { name: "Wall Sit", group: "Knee/Hip" },
  { name: "Step-Up", group: "Knee/Hip" },
  { name: "Terminal Knee Extension", group: "Knee/Hip" },
  { name: "Clamshell", group: "Knee/Hip" },
  { name: "Monster Walk (Band)", group: "Knee/Hip" },
  { name: "Side-Lying Leg Raise", group: "Knee/Hip" },
  // Lower Back
  { name: "McKenzie Press-Up", group: "Lower Back" },
  { name: "Knee-to-Chest Stretch", group: "Lower Back" },
  { name: "Child's Pose", group: "Lower Back" },
  { name: "Pelvic Tilt", group: "Lower Back" },
  // Foot / Ankle
  { name: "Calf Stretch", group: "Foot/Ankle" },
  { name: "Heel Raises", group: "Foot/Ankle" },
  { name: "Toe Curls", group: "Foot/Ankle" },
  { name: "Single-Leg Balance", group: "Foot/Ankle" },
  // Neck
  { name: "Chin Tuck", group: "Neck" },
  { name: "Neck Rotation Stretch", group: "Neck" },
  { name: "Upper Trap Stretch", group: "Neck" },
];

export const CARDIO_ACTIVITIES = [
  "Running",
  "Treadmill",
  "Cycling",
  "Stationary Bike",
  "Rowing",
  "Swimming",
  "Elliptical",
  "Stair Climber",
  "Walking",
  "Hiking",
  "Jump Rope",
  "HIIT",
  "Boxing",
];
