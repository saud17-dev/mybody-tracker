import Papa from "papaparse";

export type MetricField =
  | "date"
  | "weight"
  | "bodyFat"
  | "muscle"
  | "bmi"
  | "fatFreeMass"
  | "subFat"
  | "visceralFat"
  | "bodyWater"
  | "muscleMassKg"
  | "boneMass"
  | "protein"
  | "bmr"
  | "metabolicAge"
  | "ignore";

export type WeightUnit = "kg" | "lbs";
export type PctScale = "percent" | "fraction"; // 0.182 vs 18.2

export type WizardRow = Record<string, string>;
export type WizardData = {
  headers: string[];
  rows: WizardRow[];
  delimiter: string;
};

export type Mapping = {
  columns: Record<string, MetricField>; // header -> field
  weightUnit: WeightUnit;
  bodyFatScale: PctScale;
  muscleScale: PctScale;
};

export type NormalizedRow = {
  date: string; // ISO
  weightKg?: number;
  bodyFatPct?: number;
  muscleMassPct?: number;
  bmi?: number;
  fatFreeMassKg?: number;
  subcutaneousFatPct?: number;
  visceralFat?: number;
  bodyWaterPct?: number;
  muscleMassKg?: number;
  boneMassKg?: number;
  proteinPct?: number;
  bmrKcal?: number;
  metabolicAge?: number;
  raw: WizardRow;
};

export type WizardResult = {
  rows: NormalizedRow[];
  errors: string[];
  skipped: number;
};

/* ------------------------------------------------------------------ */
/* Parse                                                               */
/* ------------------------------------------------------------------ */

export function parseAny(text: string): WizardData {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/);
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    const fieldCount = Math.max(
      l.split(",").length,
      l.split(";").length,
      l.split("\t").length,
    );
    if (fieldCount >= 2) { startIdx = i; break; }
  }
  const body = lines.slice(startIdx).join("\n");

  const res = Papa.parse<Record<string, string>>(body, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = (res.meta.fields || []).filter(Boolean);
  const rows = (res.data || []).filter((r) =>
    Object.values(r).some((v) => (v ?? "").toString().trim() !== ""),
  );
  return { headers, rows, delimiter: res.meta.delimiter || "," };
}

/* ------------------------------------------------------------------ */
/* Auto-detect column mapping                                          */
/* ------------------------------------------------------------------ */

// Order matters: more specific patterns first so they win the scoring.
const FIELD_KEYWORDS: Record<Exclude<MetricField, "ignore">, RegExp[]> = {
  date: [/^date$/i, /\bdate\b/i, /\bday\b/i, /timestamp/i, /when/i],
  bmi: [/\bbmi\b/i, /body.?mass.?index/i],
  bodyFat: [/body.?fat/i, /^fat\s*\(?%/i, /\bbf\b/i, /%\s*fat/i, /fat\s*%/i, /fat\s*mass\s*\(?%/i],
  subFat: [/subcutaneous/i, /sub.?fat/i],
  visceralFat: [/visceral/i],
  bodyWater: [/body.?water/i, /\bwater\b/i, /hydration/i],
  muscle: [/skeletal.?muscle.*%/i, /muscle.*%/i, /\bsmm\b.*%/i, /lean.*%/i],
  muscleMassKg: [/muscle.?mass.*\(?kg/i, /muscle.?mass.*\(?lb/i, /^muscle\s*\(?kg/i, /lean.*\(?kg/i],
  fatFreeMass: [/fat.?free.?mass/i, /\bffm\b/i, /lean.?body.?mass/i, /\blbm\b/i],
  boneMass: [/bone.?mass/i, /\bbone\b/i],
  protein: [/protein/i],
  bmr: [/\bbmr\b/i, /basal.?metabolic/i, /metabolism.*\(?kcal/i, /\bkcal\b/i],
  metabolicAge: [/metabolic.?age/i, /body.?age/i],
  weight: [/^weight/i, /^wt$/i, /\bkg\b/i, /\blbs?\b/i, /pound/i, /poids/i, /gewicht/i, /\bmass\s*\(?kg/i],
};

export function autoDetect(data: WizardData): Mapping {
  const columns: Record<string, MetricField> = {};
  const used = new Set<MetricField>();

  const candidates: { header: string; field: MetricField; score: number }[] = [];
  for (const h of data.headers) {
    for (const [field, regs] of Object.entries(FIELD_KEYWORDS) as [Exclude<MetricField, "ignore">, RegExp[]][]) {
      let score = 0;
      regs.forEach((r, i) => { if (r.test(h)) score += regs.length - i; });
      if (score > 0) candidates.push({ header: h, field, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  for (const c of candidates) {
    if (columns[c.header]) continue;
    if (used.has(c.field)) continue;
    columns[c.header] = c.field;
    used.add(c.field);
  }
  for (const h of data.headers) if (!columns[h]) columns[h] = "ignore";

  const weightHeader = Object.entries(columns).find(([, f]) => f === "weight")?.[0];
  let weightUnit: WeightUnit = "kg";
  if (weightHeader) {
    if (/lb|pound/i.test(weightHeader)) weightUnit = "lbs";
    else {
      const samples = data.rows.slice(0, 20).map((r) => parseNumber(r[weightHeader])).filter((n): n is number => n != null);
      if (samples.length && samples.every((s) => s > 110)) weightUnit = "lbs";
    }
  }

  const bfHeader = Object.entries(columns).find(([, f]) => f === "bodyFat")?.[0];
  const mmHeader = Object.entries(columns).find(([, f]) => f === "muscle")?.[0];
  const detectScale = (header?: string): PctScale => {
    if (!header) return "percent";
    const samples = data.rows.slice(0, 20).map((r) => parseNumber(r[header])).filter((n): n is number => n != null);
    if (!samples.length) return "percent";
    return samples.every((s) => s > 0 && s < 1) ? "fraction" : "percent";
  };

  return {
    columns,
    weightUnit,
    bodyFatScale: detectScale(bfHeader),
    muscleScale: detectScale(mmHeader),
  };
}

/* ------------------------------------------------------------------ */
/* Normalize                                                           */
/* ------------------------------------------------------------------ */

const KG_PER_LB = 0.45359237;

export function normalize(data: WizardData, mapping: Mapping): WizardResult {
  const out: WizardResult = { rows: [], errors: [], skipped: 0 };

  const findCol = (field: MetricField) =>
    Object.entries(mapping.columns).find(([, f]) => f === field)?.[0];

  const dateCol = findCol("date");
  if (!dateCol) {
    out.errors.push("No date column selected — pick which column contains the measurement date.");
    return out;
  }

  const cols: Partial<Record<MetricField, string>> = {};
  (
    ["weight", "bodyFat", "muscle", "bmi", "fatFreeMass", "subFat", "visceralFat",
      "bodyWater", "muscleMassKg", "boneMass", "protein", "bmr", "metabolicAge"] as MetricField[]
  ).forEach((f) => { const c = findCol(f); if (c) cols[f] = c; });

  const get = (row: WizardRow, f: MetricField) => (cols[f] ? parseNumber(row[cols[f]!]) : undefined);

  data.rows.forEach((row, i) => {
    const lineNum = i + 2;
    const rawDate = (row[dateCol] || "").trim();
    if (!rawDate) { out.skipped++; return; }
    const iso = parseDate(rawDate);
    if (!iso) { out.errors.push(`Row ${lineNum}: cannot parse date "${rawDate}"`); return; }

    const w = get(row, "weight");
    const bf = get(row, "bodyFat");
    const mm = get(row, "muscle");
    const ffm = get(row, "fatFreeMass");
    const mmKg = get(row, "muscleMassKg");
    const bone = get(row, "boneMass");

    const toKg = (v?: number) => v != null ? (mapping.weightUnit === "lbs" ? +(v * KG_PER_LB).toFixed(2) : v) : undefined;
    const scalePct = (v: number | undefined, scale: PctScale) =>
      v != null ? (scale === "fraction" ? +(v * 100).toFixed(2) : v) : undefined;

    const norm: NormalizedRow = {
      date: iso,
      weightKg: toKg(w),
      bodyFatPct: scalePct(bf, mapping.bodyFatScale),
      muscleMassPct: scalePct(mm, mapping.muscleScale),
      fatFreeMassKg: toKg(ffm),
      muscleMassKg: toKg(mmKg),
      boneMassKg: toKg(bone),
      bmi: get(row, "bmi"),
      subcutaneousFatPct: get(row, "subFat"),
      visceralFat: get(row, "visceralFat"),
      bodyWaterPct: get(row, "bodyWater"),
      proteinPct: get(row, "protein"),
      bmrKcal: get(row, "bmr"),
      metabolicAge: get(row, "metabolicAge"),
      raw: row,
    };

    const hasAny = Object.entries(norm).some(([k, v]) => k !== "date" && k !== "raw" && v != null);
    if (!hasAny) { out.skipped++; return; }

    out.rows.push(norm);
  });

  return out;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function parseNumber(v: unknown): number | undefined {
  if (v == null) return undefined;
  let s = String(v).trim();
  if (!s) return undefined;
  // Treat common "empty" placeholders from exports (Renpho uses "--")
  if (/^-+$/.test(s) || s === "—" || s.toLowerCase() === "n/a" || s.toLowerCase() === "na") return undefined;
  s = s.replace(/[a-zA-Z%]+/g, "").trim();
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  s = s.replace(/\s/g, "");
  if (!s || s === "-" || s === ".") return undefined;
  const n = Number(s);
  return isNaN(n) ? undefined : n;
}

function parseDate(s: string): string | null {
  const trimmed = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (/^\d{5}(\.\d+)?$/.test(trimmed)) {
    const epoch = new Date(Date.UTC(1899, 11, 30)).getTime();
    const ms = epoch + Number(trimmed) * 86400000;
    return new Date(ms).toISOString();
  }
  const m = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(.*)$/);
  if (m) {
    let [, a, b, y, rest] = m;
    let day: number, month: number;
    const ai = +a, bi = +b;
    if (ai > 12) { day = ai; month = bi; }
    else if (bi > 12) { day = bi; month = ai; }
    else { day = ai; month = bi; }
    let year = +y;
    if (year < 100) year += 2000;
    const time = rest.trim();
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}${time ? "T" + time : ""}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
