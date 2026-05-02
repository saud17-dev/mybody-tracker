import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Dumbbell, X, Trophy, TrendingUp, Timer, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { ExercisePicker } from "@/components/ExercisePicker";
import { RestTimer } from "@/components/RestTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GYM_EXERCISES } from "@/lib/exercises";
import {
  useGymSessions, useProfile, useWorkoutTemplates, useRecentGymExercises, uid,
} from "@/lib/cloud";
import { computePRs, detectNewPRs, exerciseSeries } from "@/lib/stats";
import { fromInput, toDisplay, formatWeight } from "@/lib/units";
import type { GymExerciseEntry, GymSet } from "@/lib/types";
import { toast } from "sonner";

export default function Gym() {
  const navigate = useNavigate();
  const { sessions, create, remove } = useGymSessions();
  const { profile } = useProfile();
  const unit = profile?.unit ?? "kg";
  const restDefault = profile?.restTimerSeconds ?? 90;
  const { templates } = useWorkoutTemplates();
  const recent = useRecentGymExercises(sessions, 8);

  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState<GymExerciseEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [doneSets, setDoneSets] = useState<Record<string, boolean>>({});
  const [restRunning, setRestRunning] = useState(false);
  const [restKey, setRestKey] = useState(0);
  const [prCelebrate, setPrCelebrate] = useState<{ exerciseName: string; weight: number; reps: number }[] | null>(null);
  const [chartFor, setChartFor] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const historicalPRs = useMemo(() => computePRs(sessions), [sessions]);

  useEffect(() => {
    const tplId = searchParams.get("template");
    if (!tplId) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && tpl.module === "gym" && Array.isArray(tpl.payload?.exercises)) {
      setExercises(
        tpl.payload.exercises.map((e: any) => ({
          id: uid(), exerciseName: e.name, muscleGroup: e.group,
          sets: Array.from({ length: e.sets || 3 }, () => ({ reps: e.reps || 8, weight: 0 })),
        })),
      );
      setNotes(tpl.name);
      setOpen(true);
    } else if (templates.length > 0) {
      toast.error("Template not found");
    }
    searchParams.delete("template");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.length]);

  const addExercise = (name: string, group: string) => {
    setExercises((p) => [
      ...p,
      { id: uid(), exerciseName: name, muscleGroup: group, sets: [{ reps: 8, weight: 0 }] },
    ]);
  };

  const updateSet = (exId: string, idx: number, patch: Partial<GymSet>) =>
    setExercises((p) => p.map((e) =>
      e.id === exId ? { ...e, sets: e.sets.map((s, i) => i === idx ? { ...s, ...patch } : s) } : e
    ));

  const addSet = (exId: string) =>
    setExercises((p) => p.map((e) => {
      if (e.id !== exId) return e;
      const last = e.sets[e.sets.length - 1] || { reps: 8, weight: 0 };
      return { ...e, sets: [...e.sets, { ...last }] };
    }));

  const removeSet = (exId: string, i: number) => {
    setExercises((p) => p.map((e) => e.id === exId ? { ...e, sets: e.sets.filter((_, ix) => ix !== i) } : e));
    setDoneSets((d) => { const n = { ...d }; delete n[`${exId}:${i}`]; return n; });
  };

  const removeExercise = (id: string) => setExercises((p) => p.filter((e) => e.id !== id));

  const toggleSetDone = (exId: string, idx: number) => {
    const key = `${exId}:${idx}`;
    setDoneSets((d) => {
      const next = { ...d, [key]: !d[key] };
      if (next[key]) {
        // start (or restart) rest timer
        setRestKey((k) => k + 1);
        setRestRunning(true);
      }
      return next;
    });
  };

  const reset = () => { setExercises([]); setNotes(""); setDoneSets({}); setRestRunning(false); };

  const save = async () => {
    if (exercises.length === 0) return toast.error("Add at least one exercise");
    const newPRs = detectNewPRs(exercises, historicalPRs);
    try {
      await create({ date: new Date().toISOString(), exercises, notes: notes || undefined });
      toast.success("Workout logged");
      if (newPRs.length) setPrCelebrate(newPRs);
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  // Convert weight from kg storage → display unit. UI inputs operate in display unit.
  const inputForWeight = (kg: number) => {
    const v = toDisplay(kg, unit) ?? 0;
    return v === 0 ? "" : Number(v.toFixed(2));
  };

  const sorted = sessions; // already date-desc

  return (
    <AppShell title="Gym Log" subtitle={`${sessions.length} workouts logged`} accent="gym"
      right={
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
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
                <ExercisePicker module="gym" exercises={GYM_EXERCISES} recent={recent}
                  onChange={(name, group) => addExercise(name, group)} />
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
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
                      <span>#</span><span>Reps</span><span>Weight ({unit})</span><span>Done</span><span />
                    </div>
                    {ex.sets.map((s, i) => {
                      const isDone = !!doneSets[`${ex.id}:${i}`];
                      return (
                        <div key={i} className={cn(
                          "grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2 rounded-md transition-colors",
                          isDone && "bg-emerald-500/10",
                        )}>
                          <span className={cn(
                            "text-sm font-semibold tabular-nums",
                            isDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                          )}>{i + 1}</span>
                          <Input type="number" inputMode="numeric" value={s.reps || ""}
                            onChange={(e) => updateSet(ex.id, i, { reps: Number(e.target.value) || 0 })}
                            className={cn(isDone && "line-through text-muted-foreground opacity-70")} />
                          <Input type="number" inputMode="decimal" step="0.5"
                            value={inputForWeight(s.weight)}
                            onChange={(e) => {
                              const v = e.target.value === "" ? 0 : Number(e.target.value);
                              updateSet(ex.id, i, { weight: fromInput(v, unit) });
                            }}
                            className={cn(isDone && "line-through text-muted-foreground opacity-70")} />
                          <button
                            type="button"
                            onClick={() => toggleSetDone(ex.id, i)}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-md border-2 transition-all active:scale-90",
                              isDone
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-muted-foreground/30 bg-background hover:border-gym hover:bg-gym/10",
                            )}
                            title={isDone ? "Mark not done" : "Mark set done & start rest"}
                            aria-pressed={isDone}
                          >
                            {isDone ? <Check className="h-5 w-5" /> : <Timer className="h-4 w-4 text-gym" />}
                          </button>
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => removeSet(ex.id, i)} disabled={ex.sets.length === 1}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => addSet(ex.id)}>
                      <Plus className="h-4 w-4" /> Add set
                    </Button>
                  </div>
                </Card>
              ))}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did the session feel?" rows={3} />
              </div>
            </div>
            <div className="sticky bottom-0 border-t bg-card p-4 safe-bottom">
              <Button onClick={save} className="w-full bg-gym hover:bg-gym/90" size="lg">Save workout</Button>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="prs">PRs</TabsTrigger>
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
            const totalVolKg = s.exercises.reduce((a, e) => a + e.sets.reduce((b, st) => b + st.reps * st.weight, 0), 0);
            return (
              <Card key={s.id} className="p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {format(parseISO(s.date), "EEE, MMM d • HH:mm")}
                    </p>
                    <p className="mt-1 font-semibold">{s.exercises.length} exercises · {totalSets} sets</p>
                  </div>
                  <button onClick={() => { remove(s.id); toast("Workout deleted"); }}
                    className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.exercises.map((e) => (
                    <button key={e.id} onClick={() => setChartFor(e.exerciseName)}
                      className="rounded-full bg-gym/10 px-2.5 py-1 text-xs font-medium text-gym hover:bg-gym/20">
                      {e.exerciseName}
                    </button>
                  ))}
                </div>
                {totalVolKg > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Total volume: <span className="font-semibold text-foreground">
                      {formatWeight(totalVolKg, unit, 0)}
                    </span>
                  </p>
                )}
                {s.notes && <p className="mt-2 text-sm text-muted-foreground">"{s.notes}"</p>}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="prs" className="mt-4 space-y-2">
          {historicalPRs.size === 0 && (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No PRs yet. Log a workout!</p>
            </div>
          )}
          {Array.from(historicalPRs.values())
            .sort((a, b) => b.best1RMEst - a.best1RMEst)
            .map((pr) => (
              <Card key={pr.exercise} className="p-3 cursor-pointer hover:bg-accent/5" onClick={() => setChartFor(pr.exercise)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{pr.exercise}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(pr.date), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums">
                      {formatWeight(pr.bestWeight, unit, 1)} × {pr.bestReps}
                    </p>
                    <p className="text-[10px] text-muted-foreground">est 1RM {formatWeight(pr.best1RMEst, unit, 0)}</p>
                  </div>
                </div>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Total workouts</p>
            <p className="text-3xl font-bold">{sessions.length}</p>
            <p className="mt-4 text-sm text-muted-foreground">Total sets</p>
            <p className="text-3xl font-bold">
              {sessions.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets.length, 0), 0)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Total volume ({unit})</p>
            <p className="text-3xl font-bold">
              {(toDisplay(
                sessions.reduce((a, s) => a + s.exercises.reduce(
                  (b, e) => b + e.sets.reduce((c, st) => c + st.reps * st.weight, 0), 0), 0),
                unit,
              ) ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {restRunning && (
        <RestTimer initialSeconds={restDefault} onClose={() => setRestRunning(false)} />
      )}

      <ExerciseChartDialog name={chartFor} sessions={sessions} unit={unit} onClose={() => setChartFor(null)} />

      <Dialog open={!!prCelebrate} onOpenChange={(o) => { if (!o) setPrCelebrate(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> New Personal Record!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {prCelebrate?.map((pr) => (
              <Card key={pr.exerciseName} className="p-3">
                <p className="font-semibold">{pr.exerciseName}</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatWeight(pr.weight, unit, 1)} × {pr.reps}
                </p>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ExerciseChartDialog({
  name, sessions, unit, onClose,
}: { name: string | null; sessions: any[]; unit: "kg" | "lbs"; onClose: () => void }) {
  const data = useMemo(() => {
    if (!name) return [];
    return exerciseSeries(sessions, name).map((p) => ({
      date: format(parseISO(p.date), "MMM d"),
      weight: toDisplay(p.topWeight, unit),
      volume: toDisplay(p.volume, unit),
    }));
  }, [name, sessions, unit]);

  return (
    <Dialog open={!!name} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> {name}
          </DialogTitle>
        </DialogHeader>
        {data.length < 2 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Need at least 2 sessions for a chart. Currently: {data.length}
          </p>
        ) : (
          <Tabs defaultValue="weight">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weight">Top weight</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
            </TabsList>
            <TabsContent value="weight">
              <Chart data={data} key1="weight" unit={unit} />
            </TabsContent>
            <TabsContent value="volume">
              <Chart data={data} key1="volume" unit={unit} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Chart({ data, key1, unit }: { data: any[]; key1: string; unit: string }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
            formatter={(v: any) => [`${Number(v).toFixed(1)} ${unit}`, ""]}
          />
          <Line type="monotone" dataKey={key1} stroke="hsl(var(--gym))" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
