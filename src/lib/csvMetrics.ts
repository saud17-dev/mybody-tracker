import Papa from "papaparse";

export type ParsedMetric = {
  date: string;
  weightKg?: number;
  muscleMassPct?: number;
  bodyFatPct?: number;
};

export type ParsedMetrics = { rows: ParsedMetric[]; errors: string[] };

export function parseMetricsCsv(text: string): ParsedMetrics {
  const out: ParsedMetrics = { rows: [], errors: [] };
  const res = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (res.errors.length) out.errors.push(...res.errors.map((e) => `Row ${e.row}: ${e.message}`));

  res.data.forEach((row, i) => {
    const lineNum = i + 2;
    const date = (row.date || "").trim();
    if (!date) { out.errors.push(`Row ${lineNum}: date required`); return; }
    const d = new Date(date);
    if (isNaN(d.getTime())) { out.errors.push(`Row ${lineNum}: invalid date "${date}"`); return; }

    const num = (k: string) => {
      const v = (row[k] || "").trim();
      if (!v) return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    };

    out.rows.push({
      date: d.toISOString(),
      weightKg: num("weight_kg"),
      muscleMassPct: num("muscle_mass_pct"),
      bodyFatPct: num("body_fat_pct"),
    });
  });
  return out;
}

export function metricsToCsv(metrics: { date: string; weightKg?: number; muscleMassPct?: number; bodyFatPct?: number }[]): string {
  return Papa.unparse(metrics.map((m) => ({
    date: m.date.slice(0, 10),
    weight_kg: m.weightKg ?? "",
    muscle_mass_pct: m.muscleMassPct ?? "",
    body_fat_pct: m.bodyFatPct ?? "",
  })));
}
