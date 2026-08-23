import { EXERCISE_IMAGE_BASE, EXERCISE_IMAGE_PATHS } from "./exerciseImageMap";
import chestImg from "@/assets/muscle/chest.jpg";
import backImg from "@/assets/muscle/back.jpg";
import shouldersImg from "@/assets/muscle/shoulders.jpg";
import armsImg from "@/assets/muscle/arms.jpg";
import legsImg from "@/assets/muscle/legs.jpg";
import glutesImg from "@/assets/muscle/glutes.jpg";
import coreImg from "@/assets/muscle/core.jpg";
import cardioImg from "@/assets/muscle/cardio.jpg";
import kettlebellImg from "@/assets/muscle/kettlebell.jpg";
import mobilityImg from "@/assets/muscle/mobility.jpg";

const normalize = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

/** Generic illustration used when no photo exists for the exercise. */
export function fallbackImage(name: string, muscle?: string | null, equipment?: string | null): string {
  const n = normalize(name);
  const m = normalize(muscle ?? "");
  const e = normalize(equipment ?? "");

  if (e.includes("kettlebell") || n.includes("kettlebell")) return kettlebellImg;
  if (/stretch|mobility|foam roll|yoga|breathing|release|rotation|circle|alphabet|hold/.test(n)) return mobilityImg;
  if (m.includes("cardio") || /run|jog|bike|row machine|jump rope|burpee|climber|skater|high knee/.test(n)) return cardioImg;
  if (m.includes("chest")) return chestImg;
  if (m.includes("back") || m.includes("lat") || m.includes("trap")) return backImg;
  if (m.includes("shoulder") || m.includes("delt")) return shouldersImg;
  if (m.includes("bicep") || m.includes("tricep") || m.includes("forearm") || m.includes("arm")) return armsImg;
  if (m.includes("glute") || m.includes("hip")) return glutesImg;
  if (m.includes("ab") || m.includes("core") || m.includes("oblique")) return coreImg;
  if (m.includes("leg") || m.includes("quad") || m.includes("hamstring") || m.includes("calf") || m.includes("knee"))
    return legsImg;
  if (/squat|lunge|deadlift|calf/.test(n)) return legsImg;
  if (/press|push/.test(n)) return chestImg;
  if (/row|pull/.test(n)) return backImg;
  return mobilityImg;
}

/** Photo URL for an exercise, or null when only the generic illustration exists. */
export function exercisePhoto(name: string): string | null {
  const path = EXERCISE_IMAGE_PATHS[normalize(name)];
  return path ? EXERCISE_IMAGE_BASE + path : null;
}

/** Best available image for an exercise (photo, else generic illustration). */
export function exerciseImage(name: string, muscle?: string | null, equipment?: string | null) {
  const photo = exercisePhoto(name);
  return { src: photo ?? fallbackImage(name, muscle, equipment), isPhoto: !!photo };
}
