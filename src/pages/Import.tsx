import { useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const INT = ["sleep_asleep_min", "sleep_in_bed_min", "sleep_deep_min", "sleep_rem_min", "sleep_light_min", "sleep_wake_min", "steps", "workout_min", "workout_peak_min"];
const NUM = ["sleep_efficiency", "sleep_score", "resting_hr", "hrv_ms", "nonrem_hr", "cardio_load", "vo2max", "weight_kg", "body_fat_pct"];
const TS = ["sleep_start", "sleep_end"];
const TEXT = ["workouts"];
const ALLOWED = new Set(["date", ...INT, ...NUM, ...TS, ...TEXT]);

/** Minimal RFC4180 CSV parser (handles quotes, commas, newlines in quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

type Result = { inserted: number; updated: number; skipped: string[] };

export default function ImportPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (file: File) => {
    if (!user) return;
    setBusy(true); setResult(null); setError(null);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("File is over 10 MB.");
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("No data rows found.");
      const header = rows[0].map((h) => h.trim().replace(/^\uFEFF/, ""));
      const unknown = header.filter((h) => !ALLOWED.has(h));
      if (unknown.length) throw new Error(`Unknown column(s): ${unknown.join(", ")}`);
      if (!header.includes("date")) throw new Error("Missing required 'date' column.");

      const skipped: string[] = [];
      const byDate = new Map<string, Record<string, unknown>>();
      rows.slice(1).forEach((r, idx) => {
        const rec: Record<string, unknown> = {};
        let bad = false;
        header.forEach((h, i) => {
          const raw = (r[i] ?? "").trim();
          if (raw === "") return; // blank → don't touch existing value
          if (h === "date") {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) bad = true; else rec.date = raw;
          } else if (INT.includes(h) || NUM.includes(h)) {
            const n = Number(raw);
            if (!Number.isFinite(n)) bad = true; else rec[h] = INT.includes(h) ? Math.round(n) : n;
          } else if (TS.includes(h)) {
            const d = new Date(raw);
            if (isNaN(d.getTime())) bad = true; else rec[h] = d.toISOString();
          } else rec[h] = raw.slice(0, 2000);
        });
        if (bad || !rec.date) { skipped.push(`row ${idx + 2}`); return; }
        byDate.set(rec.date as string, { ...(byDate.get(rec.date as string) ?? {}), ...rec });
      });
      if (byDate.size === 0) throw new Error("No valid rows.");

      const dates = [...byDate.keys()];
      const existing = new Set<string>();
      for (let i = 0; i < dates.length; i += 500) {
        const { data, error } = await supabase.from("daily_metrics").select("date")
          .eq("user_id", user.id).in("date", dates.slice(i, i + 500));
        if (error) throw error;
        data?.forEach((d) => existing.add(d.date));
      }

      // Group rows by their column set so blank cells are omitted (not nulled) on upsert.
      const groups = new Map<string, Record<string, unknown>[]>();
      for (const rec of byDate.values()) {
        const full = { ...rec, user_id: user.id, source: "takeout", imported_at: new Date().toISOString() };
        const key = Object.keys(full).sort().join(",");
        groups.set(key, [...(groups.get(key) ?? []), full]);
      }
      for (const batch of groups.values()) {
        for (let i = 0; i < batch.length; i += 500) {
          const { error } = await supabase.from("daily_metrics")
            .upsert(batch.slice(i, i + 500) as any, { onConflict: "user_id,date" });
          if (error) throw error;
        }
      }
      setResult({ inserted: dates.filter((d) => !existing.has(d)).length, updated: dates.filter((d) => existing.has(d)).length, skipped });
    } catch (e: any) {
      setError(e?.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Import" subtitle="Fitbit / Google Health daily data" accent="primary">
      <Card className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Upload a CSV whose header uses these exact column names. <span className="font-mono">date</span> (YYYY-MM-DD) is required; blank cells leave existing values untouched.
        </p>
        <p className="break-words rounded-xl bg-muted/40 p-3 font-mono text-[11px] text-muted-foreground">
          {["date", ...INT.slice(0, 2), ...NUM.slice(0, 2), ...INT.slice(2, 6), ...TS, ...NUM.slice(2, 5), "steps", "cardio_load", "workout_min", "workout_peak_min", "workouts", "vo2max", "weight_kg", "body_fat_pct"].filter((v, i, a) => a.indexOf(v) === i).join(", ")}
        </p>
        <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">
          <Upload className="h-5 w-5" />{busy ? "Importing…" : "Choose CSV file"}
          <input type="file" accept=".csv,text/csv" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
        </label>
        {result && (
          <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div>
              <div className="font-semibold">{result.inserted} inserted · {result.updated} updated</div>
              {result.skipped.length > 0 && <div className="text-xs text-muted-foreground">Skipped invalid: {result.skipped.slice(0, 10).join(", ")}{result.skipped.length > 10 ? "…" : ""}</div>}
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          </div>
        )}
        {!busy && !result && !error && <Button variant="ghost" className="hidden" />}
      </Card>
    </AppShell>
  );
}
