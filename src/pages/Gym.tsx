import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Dumbbell, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExercisePicker } from "@/components/ExercisePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GYM_EXERCISES } from "@/lib/exercises";
import { useGymSessions, uid } from "@/lib/storage";
import { getTemplateById, getCurrentPhase, exercisesForPhase } from "@/lib/plan";
import type { GymExerciseEntry, GymSet } from "@/lib/types";
import { toast } from "sonner";

export default function Gym() {
  const [sessions, setSessions] = useGymSessions();
  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState<GymExerciseEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [picker, setPicker] = useState<{ name: string; group: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load template from ?template=<id>
  useEffect(() => {
    const tplId = searchParams.get("template");
    if (!tplId) return;
    const tpl = getTemplateById(tplId);
    if (!tpl || tpl.module !== "gym" || !tpl.gym) {
      toast.error("Template not found");
    } else {
      const phase = getCurrentPhase();
      const filtered = exercisesForPhase(tpl.gym, phase.id);
      setExercises(
        filtered.map((e) => ({
          id: uid(),
          exerciseName: e.name,
          muscleGroup: e.group,
          sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: 0 })),
        })),
      );
      setNotes([tpl.title, tpl.notes].filter(Boolean).join(" — "));
      setOpen(true);
      toast.success(`Loaded "${tpl.title}"`);
    }
    searchParams.delete("template");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExerciseFromPicker = () => {
    if (!picker) return;
    setExercises((prev) => [
      ...prev,
      { id: uid(), exerciseName: picker.name, muscleGroup: picker.group, sets: [{ reps: 8, weight: 0 }] },
    ]);
    setPicker(null);
  };

  const updateSet = (exId: string, idx: number, patch: Partial<GymSet>) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exId ? { ...e, sets: e.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) } : e,
      ),
    );
  };

  const addSet = (exId: string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e;
        const last = e.sets[e.sets.length - 1] || { reps: 8, weight: 0 };
        return { ...e, sets: [...e.sets, { ...last }] };
      }),
    );
  };

  const removeSet = (exId: string, idx: number) =>
    setExercises((prev) =>
      prev.map((e) => (e.id === exId ? { ...e, sets: e.sets.filter((_, i) => i !== idx) } : e)),
    );

  const removeExercise = (exId: string) => setExercises((prev) => prev.filter((e) => e.id !== exId));

  const reset = () => {
    setExercises([]);
    setNotes("");
    setPicker(null);
  };

  const save = () => {
    if (exercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    setSessions((prev) => [
      { id: uid(), date: new Date().toISOString(), exercises, notes: notes || undefined },
      ...prev,
    ]);
    toast.success("Workout logged");
    reset();
    setOpen(false);
  };

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell
      title="Gym Log"
      subtitle={`${sessions.length} workouts logged`}
      accent="gym"
      right={
        <Sheet
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <SheetTrigger asChild>
            <Button size="icon" className="h-11 w-11 rounded-full bg-white text-gym hover:bg-white/90">
              <Plus className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl p-0">
            <SheetHeader className="sticky top-0 z-10 border-b bg-card px-5 pb-4 pt-5">
              <SheetTitle>New Workout</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Label>Add exercise</Label>
                <div className="flex gap-2">
                  <ExercisePicker
                    exercises={GYM_EXERCISES}
                    value={picker?.name}
                    onChange={(name, group) => setPicker({ name, group })}
                  />
                  <Button onClick={addExerciseFromPicker} disabled={!picker} className="bg-gym hover:bg-gym/90">
                    Add
                  </Button>
                </div>
              </div>

              {exercises.length === 0 && (
                <div className="rounded-xl border border-dashed bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                  No exercises yet. Pick one above.
                </div>
              )}

              {exercises.map((ex) => (
                <Card key={ex.id} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                    <div>
                      <p className="font-semibold">{ex.exerciseName}</p>
                      <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeExercise(ex.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
                      <span>#</span>
                      <span>Reps</span>
                      <span>Weight (kg)</span>
                      <span />
                    </div>
                    {ex.sets.map((s, i) => (
                      <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">{i + 1}</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={s.reps}
                          onChange={(e) => updateSet(ex.id, i, { reps: Number(e.target.value) || 0 })}
                        />
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          value={s.weight}
                          onChange={(e) => updateSet(ex.id, i, { weight: Number(e.target.value) || 0 })}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSet(ex.id, i)}
                          disabled={ex.sets.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => addSet(ex.id)}>
                      <Plus className="h-4 w-4" /> Add set
                    </Button>
                  </div>
                </Card>
              ))}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did the session feel?"
                  rows={3}
                />
              </div>
            </div>
            <div className="sticky bottom-0 border-t bg-card p-4 safe-bottom">
              <Button onClick={save} className="w-full bg-gym hover:bg-gym/90" size="lg">
                Save workout
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
              <Dumbbell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No workouts yet. Tap + to start.</p>
            </div>
          )}
          {sorted.map((s) => {
            const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0);
            const totalVolume = s.exercises.reduce(
              (a, e) => a + e.sets.reduce((b, st) => b + st.reps * st.weight, 0),
              0,
            );
            return (
              <Card key={s.id} className="p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {format(parseISO(s.date), "EEE, MMM d • HH:mm")}
                    </p>
                    <p className="mt-1 font-semibold">
                      {s.exercises.length} exercises · {totalSets} sets
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSessions((prev) => prev.filter((x) => x.id !== s.id));
                      toast("Workout deleted");
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.exercises.map((e) => (
                    <span key={e.id} className="rounded-full bg-gym/10 px-2.5 py-1 text-xs font-medium text-gym">
                      {e.exerciseName}
                    </span>
                  ))}
                </div>
                {totalVolume > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Total volume: <span className="font-semibold text-foreground">{totalVolume.toLocaleString()} kg</span>
                  </p>
                )}
                {s.notes && <p className="mt-2 text-sm text-muted-foreground">"{s.notes}"</p>}
              </Card>
            );
          })}
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Total workouts</p>
            <p className="text-3xl font-bold">{sessions.length}</p>
            <p className="mt-4 text-sm text-muted-foreground">Total sets</p>
            <p className="text-3xl font-bold">
              {sessions.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets.length, 0), 0)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Total volume (kg)</p>
            <p className="text-3xl font-bold">
              {sessions
                .reduce(
                  (a, s) => a + s.exercises.reduce((b, e) => b + e.sets.reduce((c, st) => c + st.reps * st.weight, 0), 0),
                  0,
                )
                .toLocaleString()}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
