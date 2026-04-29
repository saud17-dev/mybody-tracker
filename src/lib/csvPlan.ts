import Papa from "papaparse";

export type ParsedTemplate = {
  template_name: string;
  emoji?: string;
  module: "gym" | "pt" | "cardio";
  day_of_week?: number | null;
  label?: string | null;
  exercises: { name: string; group: string; sets: number; reps: number }[];
  cardio?: { activity: string; durationMin: number };
};

export type ParsedRest = { module: "rest"; day_of_week: number };
export type ParsedPlan = { templates: ParsedTemplate[]; rests: ParsedRest[]; errors: string[] };

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5, sat: 6, saturday: 6,
};

function parseDow(v: string | undefined): number | null {
  if (!v) return null;
  const t = v.trim().toLowerCase();
  if (!t) return null;
  if (/^[0-6]$/.test(t)) return Number(t);
  return DAY_MAP[t] ?? null;
}

export function parsePlanCsv(text: string): ParsedPlan {
  const out: ParsedPlan = { templates: [], rests: [], errors: [] };
  const res = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (res.errors.length) out.errors.push(...res.errors.map((e) => `Row ${e.row}: ${e.message}`));

  const map = new Map<string, ParsedTemplate>();

  res.data.forEach((row, i) => {
    const lineNum = i + 2;
    const module = (row.module || "").trim().toLowerCase();
    if (!module) return;
    if (!["gym", "pt", "cardio", "rest"].includes(module)) {
      out.errors.push(`Row ${lineNum}: invalid module "${module}"`);
      return;
    }
    const dow = parseDow(row.day_of_week);

    if (module === "rest") {
      if (dow == null) { out.errors.push(`Row ${lineNum}: rest row needs day_of_week`); return; }
      out.rests.push({ module: "rest", day_of_week: dow });
      return;
    }

    const name = (row.template_name || "").trim();
    if (!name) { out.errors.push(`Row ${lineNum}: template_name required`); return; }

    let tpl = map.get(name);
    if (!tpl) {
      tpl = {
        template_name: name,
        emoji: (row.emoji || "").trim() || undefined,
        module: module as any,
        day_of_week: dow,
        label: (row.label || "").trim() || null,
        exercises: [],
      };
      map.set(name, tpl);
    }

    if (module === "cardio") {
      const activity = (row.cardio_activity || "").trim();
      const dur = Number(row.cardio_duration_min);
      if (!activity || !dur) {
        out.errors.push(`Row ${lineNum}: cardio needs cardio_activity & cardio_duration_min`);
        return;
      }
      tpl.cardio = { activity, durationMin: dur };
    } else {
      const ex = (row.exercise_name || "").trim();
      if (!ex) return;
      tpl.exercises.push({
        name: ex,
        group: (row.muscle_group || "Other").trim(),
        sets: Number(row.sets) || 3,
        reps: Number(row.reps) || 10,
      });
    }
  });

  out.templates = Array.from(map.values());
  return out;
}
