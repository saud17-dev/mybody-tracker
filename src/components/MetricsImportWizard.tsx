import { useRef, useState, useMemo } from "react";
import { Upload, Download, FileText, AlertCircle, Wand2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  parseAny, autoDetect, normalize,
  type WizardData, type Mapping, type MetricField, type NormalizedRow,
} from "@/lib/metricsWizard";

type Props = {
  onConfirm: (rows: NormalizedRow[]) => Promise<void> | void;
  templateUrl?: string;
  templateFilename?: string;
};

const FIELD_LABELS: Record<MetricField, string> = {
  date: "Date",
  weight: "Weight",
  bodyFat: "Body fat %",
  muscle: "Skeletal muscle %",
  bmi: "BMI",
  fatFreeMass: "Fat-free mass (kg)",
  subFat: "Subcutaneous fat %",
  visceralFat: "Visceral fat",
  bodyWater: "Body water %",
  muscleMassKg: "Muscle mass (kg)",
  boneMass: "Bone mass (kg)",
  protein: "Protein %",
  bmr: "BMR (kcal)",
  metabolicAge: "Metabolic age",
  ignore: "Ignore",
};

export function MetricsImportWizard({ onConfirm, templateUrl, templateFilename }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<WizardData | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const result = useMemo(() => (data && mapping ? normalize(data, mapping) : null), [data, mapping]);

  const downloadTemplate = async () => {
    if (!templateUrl) return;
    try {
      const res = await fetch(templateUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = templateFilename || "template.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Could not download template"); }
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseAny(text);
      if (!parsed.headers.length) { toast.error("No columns detected in file"); return; }
      const m = autoDetect(parsed);
      setData(parsed);
      setMapping(m);
      setOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Could not read file");
    }
  };

  const setCol = (header: string, field: MetricField) => {
    if (!mapping) return;
    const next = { ...mapping.columns };
    // Ensure each field (except ignore) is mapped to at most one column
    if (field !== "ignore") {
      for (const k of Object.keys(next)) if (next[k] === field && k !== header) next[k] = "ignore";
    }
    next[header] = field;
    setMapping({ ...mapping, columns: next });
  };

  const confirm = async () => {
    if (!result) return;
    setBusy(true);
    try {
      await onConfirm(result.rows);
      toast.success(`Imported ${result.rows.length} measurement(s)`);
      setOpen(false);
      setData(null);
      setMapping(null);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally { setBusy(false); }
  };

  const detectedCount = mapping
    ? Object.values(mapping.columns).filter((f) => f !== "ignore").length
    : 0;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Wand2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">Smart import body metrics</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload any CSV from Renpho, Withings, MyFitnessPal, Apple Health export, or your own spreadsheet — columns and units are auto-detected.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {templateUrl && (
              <Button size="sm" variant="outline" onClick={downloadTemplate}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Template
              </Button>
            )}
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload file
            </Button>
            <input
              ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" /> Review import
            </DialogTitle>
          </DialogHeader>

          {data && mapping && result && (
            <div className="space-y-4">
              <Card className="p-3 bg-primary/5 border-primary/30">
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Auto-detected {detectedCount} column(s)</p>
                    <p className="text-muted-foreground">
                      Weight in <strong>{mapping.weightUnit}</strong>
                      {" · "}body-fat as <strong>{mapping.bodyFatScale === "fraction" ? "0–1" : "0–100%"}</strong>
                      {" · "}muscle as <strong>{mapping.muscleScale === "fraction" ? "0–1" : "0–100%"}</strong>
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Column mapping</p>
                <div className="space-y-2">
                  {data.headers.map((h) => (
                    <div key={h} className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{h}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          e.g. {data.rows.slice(0, 3).map((r) => r[h]).filter(Boolean).join(", ") || "—"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Select value={mapping.columns[h]} onValueChange={(v) => setCol(h, v as MetricField)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(FIELD_LABELS) as MetricField[]).map((f) => (
                            <SelectItem key={f} value={f}>{FIELD_LABELS[f]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Weight unit</Label>
                  <Select value={mapping.weightUnit} onValueChange={(v) => setMapping({ ...mapping, weightUnit: v as any })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Body-fat scale</Label>
                  <Select value={mapping.bodyFatScale} onValueChange={(v) => setMapping({ ...mapping, bodyFatScale: v as any })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">0–100 %</SelectItem>
                      <SelectItem value="fraction">0–1 (fraction)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Muscle scale</Label>
                  <Select value={mapping.muscleScale} onValueChange={(v) => setMapping({ ...mapping, muscleScale: v as any })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">0–100 %</SelectItem>
                      <SelectItem value="fraction">0–1 (fraction)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {result.errors.length > 0 && (
                <Card className="p-3 border-destructive/40 bg-destructive/5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-destructive">{result.errors.length} issue(s)</p>
                      {result.errors.slice(0, 6).map((e, i) => <p key={i} className="text-muted-foreground">{e}</p>)}
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Preview · {result.rows.length} row(s)
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-[11px] text-muted-foreground">{result.skipped} skipped (empty)</p>
                  )}
                </div>
                <div className="space-y-1 text-xs max-h-56 overflow-auto rounded-md border p-2">
                  {result.rows.slice(0, 30).map((r, i) => (
                    <p key={i} className="text-muted-foreground tabular-nums">
                      <span className="text-foreground font-medium">{r.date.slice(0, 10)}</span>
                      {" · "}
                      {[
                        r.weightKg != null && `${r.weightKg.toFixed(1)} kg`,
                        r.muscleMassPct != null && `${r.muscleMassPct.toFixed(1)}% muscle`,
                        r.bodyFatPct != null && `${r.bodyFatPct.toFixed(1)}% fat`,
                      ].filter(Boolean).join(" · ") || "—"}
                    </p>
                  ))}
                  {result.rows.length > 30 && (
                    <p className="text-[11px] text-center text-muted-foreground pt-1">
                      …and {result.rows.length - 30} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={confirm} disabled={busy || !result || result.rows.length === 0}>
              {busy ? "Importing…" : `Import ${result?.rows.length || 0} row(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
