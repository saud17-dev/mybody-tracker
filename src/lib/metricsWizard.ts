import Papa from "papaparse";

export type MetricField = "date" | "weight" | "bodyFat" | "muscle" | "ignore";
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
  // Strip BOM
  const clean = text.replace(/^\uFEFF/, "");
  // Skip leading metadata lines until we find a row that looks like headers
  // (e.g. some apps prepend "Exported on …")
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

const FIELD_KEYWORDS: Record<Exclude<MetricField, "ignore">, RegExp[]> = {
  date: [/^date$/i, /date/i, /time/i, /day/i, /when/i, /timestamp/i],
  weight: [/^weight/i, /^wt$/i, /mass/i, /\bkg\b/i, /\blbs?\b/i, /pound/i, /poids/i, /gewicht/i],
  bodyFat: [/body.?fat/i, /^fat/i, /bf\b/i, /%\s*fat/i, /fat\s*%/i, /fat\s*mass/i],
  muscle: [/muscle/i, /lean/i, /smm/i, /\bmm\b/i, /skeletal/i],
};

export function autoDetect(data: WizardData): Mapping {
  const columns: Record<string, MetricField> = {};
  const used = new Set<MetricField>();

  // Score each header against each field, take best non-conflicting match
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

  // Detect weight unit: if header contains "lb" or sample values are >= 130 → lbs
  const weightHeader = Object.entries(columns).find(([, f]) => f === "weight")?.[0];
  let weightUnit: WeightUnit = "kg";
  if (weightHeader) {
    if (/lb|pound/i.test(weightHeader)) weightUnit = "lbs";
    else {
      const samples = data.rows.slice(0, 20).map((r) => parseNumber(r[weightHeader])).filter((n): n is number => n != null);
      if (samples.length && samples.every((s) => s > 110)) weightUnit = "lbs";
    }
  }

  // Detect body-fat / muscle scale (percent vs fraction)
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
/* Normalize using a (possibly user-edited) mapping                    */
/* ------------------------------------------------------------------ */

export function normalize(data: WizardData, mapping: Mapping): WizardResult {
  const out: WizardResult = { rows: [], errors: [], skipped: 0 };

  const findCol = (field: MetricField) =>
    Object.entries(mapping.columns).find(([, f]) => f === field)?.[0];

  const dateCol = findCol("date");
  const weightCol = findCol("weight");
  const bfCol = findCol("bodyFat");
  const mmCol = findCol("muscle");

  if (!dateCol) {
    out.errors.push("No date column selected — pick which column contains the measurement date.");
    return out;
  }

  data.rows.forEach((row, i) => {
    const lineNum = i + 2;
    const rawDate = (row[dateCol] || "").trim();
    if (!rawDate) { out.skipped++; return; }
    const iso = parseDate(rawDate);
    if (!iso) { out.errors.push(`Row ${lineNum}: cannot parse date "${rawDate}"`); return; }

    const w = weightCol ? parseNumber(row[weightCol]) : undefined;
    const bf = bfCol ? parseNumber(row[bfCol]) : undefined;
    const mm = mmCol ? parseNumber(row[mmCol]) : undefined;

    const weightKg = w != null
      ? (mapping.weightUnit === "lbs" ? +(w * 0.45359237).toFixed(2) : w)
      : undefined;
    const bodyFatPct = bf != null
      ? (mapping.bodyFatScale === "fraction" ? +(bf * 100).toFixed(2) : bf)
      : undefined;
    const muscleMassPct = mm != null
      ? (mapping.muscleScale === "fraction" ? +(mm * 100).toFixed(2) : mm)
      : undefined;

    if (weightKg == null && bodyFatPct == null && muscleMassPct == null) {
      out.skipped++;
      return;
    }

    out.rows.push({ date: iso, weightKg, bodyFatPct, muscleMassPct, raw: row });
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
  // Strip units like "kg", "lbs", "%"
  s = s.replace(/[a-zA-Z%]+/g, "").trim();
  // Handle European decimal comma if no dot present
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  // Remove thousands separators
  s = s.replace(/\s/g, "");
  const n = Number(s);
  return isNaN(n) ? undefined : n;
}

function parseDate(s: string): string | null {
  const trimmed = s.trim();
  // ISO-ish: 2026-04-01 or 2026-04-01T...
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Numeric serial (Excel) — best effort
  if (/^\d{5}(\.\d+)?$/.test(trimmed)) {
    const epoch = new Date(Date.UTC(1899, 11, 30)).getTime();
    const ms = epoch + Number(trimmed) * 86400000;
    return new Date(ms).toISOString();
  }
  // dd/mm/yyyy or dd-mm-yyyy or mm/dd/yyyy — disambiguate
  const m = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(.*)$/);
  if (m) {
    let [, a, b, y, rest] = m;
    let day: number, month: number;
    const ai = +a, bi = +b;
    if (ai > 12) { day = ai; month = bi; }
    else if (bi > 12) { day = bi; month = ai; } // mm/dd/yyyy
    else { day = ai; month = bi; } // default to dd/mm
    let year = +y;
    if (year < 100) year += 2000;
    const time = rest.trim();
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}${time ? "T" + time : ""}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Fallback to Date parser
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
