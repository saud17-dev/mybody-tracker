import { useEffect, useState, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PT_EXERCISES, PT_BODY_AREAS } from "@/lib/exercises";
import {
  usePTSessions, useWorkoutTemplates, useRecentPTExercises, uid,
} from "@/lib/cloud";
import type { PTExerciseEntry, PTSet } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const painColor = (n: number) =>
  n <= 3 ? "text-emerald-500" : n <= 6 ? "text-amber-500" : "text-destructive";

export default function PT() {
  const { sessions, create, remove } = usePTSessions();
  const { templates } = useWorkoutTemplates();
  const recent = useRecentPTExercises(sessions, 8);

  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState<PTExerciseEntry[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [picker, setPicker] = useState<{ name: string; group: string; bodyArea?: string } | null>(null);
  const [bodyAreaFilter, setBodyAreaFilter] = useState<string>("All");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tplId = searchParams.get("template");
    if (!tplId) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && tpl.module === "pt" && Array.isArray(tpl.payload?.exercises)) {
      setExercises(
        tpl.payload.exercises.map((e: any) => ({
          id: uid(),
          exerciseName: e.name,
          category: e.group,
          bodyArea: e.bodyArea,
          notes: "",
          sets: Array.from({ length: e.sets || 3 }, () => ({
            reps: e.reps || 10, painScale: 2,
          } as PTSet)),
        })),
      );
      setOverallNotes(tpl.name);
      setOpen(true);
    } else if (templates.length > 0) {
      toast.error("Template not found");
    }
    searchParams.delete("template");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.length]);

  const addExercise = () => {
    if (!picker) return;
    setExercises((p) => [
      ...p,
      {
        id: uid(),
        exerciseName: picker.name,
        category: picker.group,
        bodyArea: picker.bodyArea,
        notes: "",
        sets: [{ reps: 10, painScale: 2 }],
      },
    ]);
    setPicker(null);
  };

  const updateSet = (exId: string, idx: number, patch: Partial<PTSet>) =>
    setExercises((p) => p.map((e) =>
      e.id === exId ? { ...e, sets: e.sets.map((s, i) => i === idx ? { ...s, ...patch } : s) } : e
    ));

  const addSet = (exId: string) =>
    setExercises((p) => p.map((e) => {
      if (e.id !== exId) return e;
      const last = e.sets[e.sets.length - 1] || { reps: 10, painScale: 2 };
      return { ...e, sets: [...e.sets, { ...last }] };
    }));

  const removeSet = (exId: string, i: number) =>
    setExercises((p) => p.map((e) => e.id === exId ? { ...e, sets: e.sets.filter((_, ix) => ix !== i) } : e));

  const updateNotes = (exId: string, notes: string) =>
    setExercises((p) => p.map((e) => e.id === exId ? { ...e, notes } : e));

  const removeExercise = (exId: string) => setExercises((p) => p.filter((e) => e.id !== exId));

  const reset = () => { setExercises([]); setOverallNotes(""); setPicker(null); };

  const save = async () => {
    if (exercises.length === 0) return toast.error("Add at least one exercise");
    try {
      await create({ date: new Date().toISOString(), exercises, overallNotes: overallNotes || undefined });
      toast.success("PT session logged");
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const sorted = sessions;

  return (
    <AppShell title="PT Log" subtitle={`${sessions.length} sessions logged`} accent="pt"
      right={
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
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
                <Label>Body area</Label>
                <Select value={bodyAreaFilter} onValueChange={setBodyAreaFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PT_BODY_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Add exercise</Label>
                <div className="flex gap-2">
                  <ExercisePicker module="pt" exercises={PT_EXERCISES} recent={recent}
                    bodyAreaFilter={bodyAreaFilter}
                    value={picker?.name}
                    onChange={(name, group, bodyArea) => setPicker({ name, group, bodyArea })} />
                  <Button onClick={addExercise} disabled={!picker} className="bg-pt hover:bg-pt/90">Add</Button>
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
                      <p className="text-xs text-muted-foreground">{ex.category}{ex.bodyArea ? ` · ${ex.bodyArea}` : ""}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeExercise(ex.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 p-3">
                    <div className="grid grid-cols-[2rem_1fr_3fr_2rem] items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
                      <span>#</span><span>Reps/sec</span><span>Pain (1-10)</span><span />
                    </div>
                    {ex.sets.map((s, i) => (
                      <div key={i} className="grid grid-cols-[2rem_1fr_3fr_2rem] items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">{i + 1}</span>
                        <Input type="number" inputMode="numeric" value={s.reps || ""}
                          onChange={(e) => updateSet(ex.id, i, { reps: Number(e.target.value) || 0 })} />
                        <div className="flex items-center gap-2">
                          <Slider min={1} max={10} step={1} value={[s.painScale]}
                            onValueChange={([v]) => updateSet(ex.id, i, { painScale: v })}
                            className="flex-1" />
                          <span className={cn("w-6 text-right text-sm font-bold tabular-nums", painColor(s.painScale))}>
                            {s.painScale}
                          </span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => removeSet(ex.id, i)} disabled={ex.sets.length === 1}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => addSet(ex.id)}>
                      <Plus className="h-4 w-4" /> Add set
                    </Button>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Notes</Label>
                      <Textarea value={ex.notes || ""} onChange={(e) => updateNotes(ex.id, e.target.value)}
                        placeholder="Form cues, sensations..." rows={2} />
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
              <Button onClick={save} className="w-full bg-pt hover:bg-pt/90" size="lg">Save session</Button>
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
            const allSets = s.exercises.flatMap((e) => e.sets);
            const avgPain = allSets.length
              ? allSets.reduce((a, st) => a + (st.painScale || 0), 0) / allSets.length
              : 0;
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
                  {s.exercises.map((e) => {
                    const exAvg = e.sets.length ? e.sets.reduce((a, x) => a + x.painScale, 0) / e.sets.length : 0;
                    return (
                      <div key={e.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{e.exerciseName}</span>
                          <span className={cn("text-xs font-bold", painColor(exAvg))}>Pain {exAvg.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {e.sets.length} sets · {e.sets.map((s) => s.reps).join(", ")} reps
                        </p>
                        {e.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{e.notes}"</p>}
                      </div>
                    );
                  })}
                </div>
                {s.overallNotes && (
                  <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">"{s.overallNotes}"</p>
                )}
                <button onClick={() => { remove(s.id); toast("Session deleted"); }}
                  className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
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
            {(() => {
              const allSets = sessions.flatMap((s) => s.exercises.flatMap((e) => e.sets));
              if (!allSets.length) return null;
              const avg = allSets.reduce((a, x) => a + x.painScale, 0) / allSets.length;
              return (
                <>
                  <p className="mt-4 text-sm text-muted-foreground">Avg pain (all-time)</p>
                  <p className="text-3xl font-bold">{avg.toFixed(1)}</p>
                </>
              );
            })()}
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
