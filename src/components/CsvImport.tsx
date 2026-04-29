import { useRef, useState, ReactNode } from "react";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Props<T> = {
  title: string;
  description: string;
  templateUrl: string;
  templateFilename: string;
  parse: (text: string) => { errors: string[] } & T;
  renderPreview: (parsed: T) => ReactNode;
  isEmpty: (parsed: T) => boolean;
  onConfirm: (parsed: T) => Promise<void> | void;
};

export function CsvImport<T>({
  title, description, templateUrl, templateFilename, parse, renderPreview, isEmpty, onConfirm,
}: Props<T>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<({ errors: string[] } & T) | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const downloadTemplate = async () => {
    try {
      const res = await fetch(templateUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = templateFilename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Could not download template"); }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const result = parse(text);
    setParsed(result);
    setOpen(true);
  };

  const confirm = async () => {
    if (!parsed) return;
    setBusy(true);
    try {
      await onConfirm(parsed);
      toast.success("Imported");
      setOpen(false);
      setParsed(null);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Template
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }} />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview import</DialogTitle></DialogHeader>
          {parsed && (
            <div className="space-y-3">
              {parsed.errors.length > 0 && (
                <Card className="p-3 border-destructive/40 bg-destructive/5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-destructive">{parsed.errors.length} issue(s)</p>
                      {parsed.errors.slice(0, 8).map((e, i) => <p key={i} className="text-muted-foreground">{e}</p>)}
                    </div>
                  </div>
                </Card>
              )}
              {renderPreview(parsed)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={confirm} disabled={busy || !parsed || isEmpty(parsed)}>
              {busy ? "Importing…" : "Confirm import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
