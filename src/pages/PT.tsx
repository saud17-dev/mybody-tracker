import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, HeartPulse, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExercisePicker } from "@/components/ExercisePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PT_EXERCISES } from "@/lib/exercises";
import { usePTSessions, uid } from "@/lib/storage";
import { getTemplateById } from "@/lib/plan";
import type { PTExerciseEntry } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const painColor = (n: number) =>
  n <= 3 ? "text-emerald-500" : n <= 6 ? "text-amber-500" : "text-destructive";

export default function PT() {
  const [sessions, setSessions] = usePTSessions();
  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState<PTExerciseEntry[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [picker, setPicker] = useState<{ name: string; group: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tplId = searchParams.get("template");
    if (!tplId) return;
    const tpl = getTemplateById(tplId);
    if (!tpl || tpl.module !== "pt" || !tpl.pt) {
      toast.error("Template not found");
    } else {
      setExercises(
        tpl.pt.map((e) => ({
          id: uid(),
          exerciseName: e.name,
          category: e.group,
          sets: e.sets,
          reps: e.reps,
          painScale: 2,
          notes: e.note || "",
        })),
      );
      setOverallNotes([tpl.title, tpl.notes].filter(Boolean).join(" — "));
      setOpen(true);
      toast.success(`Loaded "${tpl.title}"`);
    }
    searchParams.delete("template");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExerciseFromPicker = () => {
    if (!picker) return;
    setExercises((p) => [
      ...p,
      { id: uid(), exerciseName: picker.name, category: picker.group, sets: 3, reps: 10, painScale: 2, notes: "" },
    ]);
    setPicker(null);
  };

  const update = (id: string, patch: Partial<PTExerciseEntry>) =>
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => setExercises((prev) => prev.filter((e) => e.id !== id));

  const reset = () => {
    setExercises([]);
    setOverallNotes("");
    setPicker(null);
  };

  const save = () => {
    if (exercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    setSessions((prev) => [
      { id: uid(), date: new Date().toISOString(), exercises, overallNotes: overallNotes || undefined },
      ...prev,
    ]);
    toast.success("PT session logged");
    reset();
    setOpen(false);
  };

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell
      title="PT Log"
      subtitle={`${sessions.length} sessions logged`}
      accent="pt"
      right={
        <Sheet
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <SheetTrigger asChild>
            <Button size="icon" className="h-11 w-11 rounded-full bg-white text-pt hover:bg-white/90">
              <Plus className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl p-0">
            <SheetHeader className="sticky top-0 z-10 border-b bg-card px-5 pb-4 pt-5">
              <SheetTitle>New PT Session</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Label>Add exercise</Label>
                <div className="flex gap-2">
                  <ExercisePicker
                    exercises={PT_EXERCISES}
                    value={picker?.name}
                    onChange={(name, group) => setPicker({ name, group })}
                  />
                  <Button onClick={addExerciseFromPicker} disabled={!picker} className="bg-pt hover:bg-pt/90">
                    Add
                  </Button>
                </div>
              </div>

              {exercises.length === 0 && (
                <div className="rounded-xl border border-dashed bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                  No exercises yet.
                </div>
              )}

              {exercises.map((ex) => (
                <Card key={ex.id} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                    <div>
                      <p className="font-semibold">{ex.exerciseName}</p>
                      <p className="text-xs text-muted-foreground">{ex.category}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(ex.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={ex.sets}
                          onChange={(e) => update(ex.id, { sets: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={ex.reps}
                          onChange={(e) => update(ex.id, { reps: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Pain (1-10)</Label>
                        <span className={cn("text-lg font-bold tabular-nums", painColor(ex.painScale))}>
                          {ex.painScale}
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[ex.painScale]}
                        onValueChange={([v]) => update(ex.id, { painScale: v })}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>None</span>
                        <span>Severe</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={ex.notes || ""}
                        onChange={(e) => update(ex.id, { notes: e.target.value })}
                        placeholder="Form cues, sensations..."
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <div className="space-y-2">
                <Label>Overall notes</Label>
                <Textarea value={overallNotes} onChange={(e) => setOverallNotes(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="sticky bottom-0 border-t bg-card p-4 safe-bottom">
              <Button onClick={save} className="w-full bg-pt hover:bg-pt/90" size="lg">
                Save session
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-4 space-y-3">
          {sorted.length === 0 && (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <HeartPulse className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No PT sessions yet.</p>
            </div>
          )}
          {sorted.map((s) => {
            const avgPain = s.exercises.reduce((a, e) => a + e.painScale, 0) / s.exercises.length;
            return (
              <Card key={s.id} className="p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {format(parseISO(s.date), "EEE, MMM d • HH:mm")}
                    </p>
                    <p className="mt-1 font-semibold">{s.exercises.length} exercises</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Avg pain</p>
                    <p className={cn("text-xl font-bold", painColor(avgPain))}>{avgPain.toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {s.exercises.map((e) => (
                    <div key={e.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{e.exerciseName}</span>
                        <span className={cn("text-xs font-bold", painColor(e.painScale))}>Pain {e.painScale}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {e.sets} × {e.reps}
                      </p>
                      {e.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{e.notes}"</p>}
                    </div>
                  ))}
                </div>
                {s.overallNotes && (
                  <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">"{s.overallNotes}"</p>
                )}
                <button
                  onClick={() => {
                    setSessions((prev) => prev.filter((x) => x.id !== s.id));
                    toast("Session deleted");
                  }}
                  className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </Card>
            );
          })}
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Sessions</p>
            <p className="text-3xl font-bold">{sessions.length}</p>
            {sessions.length > 0 && (
              <>
                <p className="mt-4 text-sm text-muted-foreground">Avg pain (all-time)</p>
                <p className="text-3xl font-bold">
                  {(
                    sessions.flatMap((s) => s.exercises).reduce((a, e) => a + e.painScale, 0) /
                    Math.max(sessions.flatMap((s) => s.exercises).length, 1)
                  ).toFixed(1)}
                </p>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
