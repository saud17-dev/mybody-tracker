import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Dumbbell, X, Trophy, TrendingUp, Timer, Check, Pencil, Library, ChevronDown, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { ClockSheet, RestBar } from "@/components/ClockSheet";
import { PlateCalculatorSheet } from "@/components/PlateCalculatorSheet";
import { WorkoutExerciseCard } from "@/components/WorkoutExerciseCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CatalogExercise } from "@/lib/exerciseDb";
import {
  useGymSessions, useProfile, useWorkoutTemplates, uid,
} from "@/lib/cloud";
import { computePRs, detectNewPRs, exerciseSeries } from "@/lib/stats";
import { fromInput, toDisplay, formatWeight } from "@/lib/units";
import { saveDraft, loadDraft, clearDraft, draftAge } from "@/lib/draft";
import { formatSessionTimes, todayInputDate, dateWithCurrentTime, isoToInputDate } from "@/lib/duration";
import { useAuth } from "@/lib/auth";
import type { GymExerciseEntry, GymSet, GymSession } from "@/lib/types";
import { toast } from "sonner";

interface DraftPayload {
  exercises: GymExerciseEntry[];
  notes: string;
  doneSets: Record<string, boolean>;
}

export default function Gym() {
  const { user } = useAuth();
  const { sessions, create, update, remove, restore } = useGymSessions();
  const { profile } = useProfile();
  const unit = profile?.unit ?? "kg";
  const restDefault = profile?.restTimerSeconds ?? 90;
  const { templates } = useWorkoutTemplates();
  

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<GymExerciseEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [doneSets, setDoneSets] = useState<Record<string, boolean>>({});
  // string-state per set so users can type "70.", "70.25" without losing the dot
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const [restRunning, setRestRunning] = useState(false);
  const [restSeconds, setRestSecondsState] = useState(90);
  const [restKey, setRestKey] = useState(0);
  const [clockOpen, setClockOpen] = useState(false);
  const [plateTarget, setPlateTarget] = useState<{ exId: string; idx: number; kg: number } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  const [prCelebrate, setPrCelebrate] = useState<{ exerciseName: string; weight: number; reps: number }[] | null>(null);
  const [chartFor, setChartFor] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GymSession | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{ at: number; data: DraftPayload } | null>(null);
  const [expandedExId, setExpandedExId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string>(todayInputDate());
  const [addOpen, setAddOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const historicalPRs = useMemo(() => computePRs(sessions), [sessions]);

  // last logged sets per exercise name (for the PREVIOUS column)
  const previousByExercise = useMemo(() => {
    const m = new Map<string, GymSet[]>();
    const ordered = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    for (const s of ordered) {
      if (editingId && s.id === editingId) continue;
      for (const e of s.exercises) {
        const key = e.exerciseName.toLowerCase();
        if (!m.has(key)) m.set(key, e.sets);
      }
    }
    return m;
  }, [sessions, editingId]);

  const previousLabel = (exerciseName: string, idx: number, type?: string): string => {
    const sets = previousByExercise.get(exerciseName.toLowerCase());
    const s = sets?.[idx];
    if (!s) return "—";
    if (type === "duration") return s.durationSec ? `${s.durationSec}s` : "—";
    if (type === "distance_duration") {
      const d = s.distanceKm != null ? `${s.distanceKm} km` : "";
      const t = s.durationSec ? `${s.durationSec}s` : "";
      return [d, t].filter(Boolean).join(" · ") || "—";
    }
    if (type === "bodyweight_reps") return `${s.reps} reps`;
    return `${formatWeight(s.weight, unit, 1)} × ${s.reps}`;
  };

  // Live session clock
  useEffect(() => {
    if (!open || editingId) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open, editingId]);

  const elapsedSec = startedAt
    ? Math.max(0, Math.floor((nowTick - new Date(startedAt).getTime()) / 1000))
    : 0;
  const elapsedLabel =
    elapsedSec < 60
      ? `${elapsedSec}s`
      : `${Math.floor(elapsedSec / 60)}min ${elapsedSec % 60}s`;

  const sessionVolumeKg = useMemo(
    () => exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.reps * s.weight, 0), 0),
    [exercises],
  );
  const completedSetCount = useMemo(
    () => Object.values(doneSets).filter(Boolean).length,
    [doneSets],
  );

  const startRest = (seconds: number) => {
    setRestSecondsState(seconds);
    setRestKey((k) => k + 1);
    setRestRunning(true);
  };


  // Load draft on mount (only when starting a new workout, not editing)
  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const d = loadDraft<DraftPayload>("gym", user.id);
    if (d && d.data.exercises.length > 0) setResumePrompt(d);
  }, [user]);

  // Track when a new workout was started
  useEffect(() => {
    if (open && !editingId && !startedAt) {
      setStartedAt(new Date().toISOString());
    }
  }, [open, editingId, startedAt]);

  // Autosave draft (only for NEW workouts, not edits)
  useEffect(() => {
    if (!user || editingId) return;
    if (exercises.length === 0 && !notes) {
      clearDraft("gym", user.id);
      return;
    }
    saveDraft<DraftPayload>("gym", user.id, { exercises, notes, doneSets });
  }, [user, editingId, exercises, notes, doneSets]);

  // Template loader
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

  // ---------- mutators ----------
  const addExercise = (e: CatalogExercise) => {
    setExercises((p) => [
      ...p,
      {
        id: uid(),
        exerciseName: e.name,
        muscleGroup: e.muscleGroup,
        exerciseId: e.id,
        equipment: e.equipment,
        exerciseType: e.exerciseType,
        sets: [{ reps: e.exerciseType === "duration" || e.exerciseType === "distance_duration" ? 0 : 8, weight: 0 }],
      },
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
    setWeightDrafts((d) => { const n = { ...d }; delete n[`${exId}:${i}`]; return n; });
  };

  const removeExercise = (id: string) => setExercises((p) => p.filter((e) => e.id !== id));

  const patchExercise = (id: string, patch: Partial<GymExerciseEntry>) =>
    setExercises((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const toggleSetDone = (exId: string, idx: number) => {
    const key = `${exId}:${idx}`;
    setDoneSets((d) => {
      const next = { ...d, [key]: !d[key] };
      if (next[key]) {
        const ex = exercises.find((e) => e.id === exId);
        startRest(ex?.restSeconds ?? restDefault);
      }
      return next;
    });
  };


  const reset = () => {
    setExercises([]); setNotes(""); setDoneSets({});
    setWeightDrafts({}); setRestRunning(false); setEditingId(null);
    setStartedAt(null); setSessionDate(todayInputDate());
  };

  const openForEdit = (s: GymSession) => {
    setEditingId(s.id);
    setExercises(s.exercises.map((e) => ({ ...e, sets: e.sets.map((st) => ({ ...st })) })));
    setNotes(s.notes ?? "");
    setDoneSets({});
    setWeightDrafts({});
    setStartedAt(s.startedAt ?? null);
    setSessionDate(isoToInputDate(s.date));
    setOpen(true);
  };

  const save = async () => {
    if (exercises.length === 0) return toast.error("Add at least one exercise");
    // Commit any pending weight-string drafts back into exercises
    const finalExercises = exercises.map((e) => ({
      ...e,
      sets: e.sets.map((s, i) => {
        const k = `${e.id}:${i}`;
        if (weightDrafts[k] !== undefined) {
          const v = parseFloat(weightDrafts[k]);
          return { ...s, weight: isNaN(v) ? s.weight : fromInput(v, unit) };
        }
        return s;
      }),
    }));

    try {
      const endedAt = new Date().toISOString();
      if (editingId) {
        const orig = sessions.find((s) => s.id === editingId);
        await update({
          id: editingId,
          date: dateWithCurrentTime(sessionDate, orig?.date ? new Date(orig.date) : new Date()),
          exercises: finalExercises,
          notes: notes || undefined,
          startedAt: startedAt ?? orig?.startedAt,
          endedAt: orig?.endedAt ?? endedAt,
        } as GymSession);
        toast.success("Workout updated");
      } else {
        const newPRs = detectNewPRs(finalExercises, historicalPRs);
        await create({
          date: dateWithCurrentTime(sessionDate), exercises: finalExercises, notes: notes || undefined,
          startedAt: startedAt ?? endedAt, endedAt,
        });
        toast.success("Workout logged");
        if (newPRs.length) setPrCelebrate(newPRs);
        if (user) clearDraft("gym", user.id);
      }
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  // Display for the controlled input
  const displayWeight = (exId: string, i: number, kg: number): string => {
    const k = `${exId}:${i}`;
    if (weightDrafts[k] !== undefined) return weightDrafts[k];
    const v = toDisplay(kg, unit) ?? 0;
    return v === 0 ? "" : String(Number(v.toFixed(2)));
  };

  const setWeightDraft = (exId: string, i: number, raw: string) => {
    const k = `${exId}:${i}`;
    setWeightDrafts((d) => ({ ...d, [k]: raw }));
    // also try to commit numeric value live (so save-from-button works without blur)
    if (raw === "" || raw === "-" || raw.endsWith(".")) return;
    const v = parseFloat(raw);
    if (!isNaN(v)) updateSet(exId, i, { weight: fromInput(v, unit) });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const snapshot = pendingDelete;
    setPendingDelete(null);
    try {
      await remove(snapshot.id);
      toast("Workout deleted", {
        action: {
          label: "Undo",
          onClick: () => { restore(snapshot).then(() => toast.success("Restored")).catch(() => {}); },
        },
        duration: 6000,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const acceptResume = () => {
    if (!resumePrompt) return;
    setExercises(resumePrompt.data.exercises);
    setNotes(resumePrompt.data.notes);
    setDoneSets(resumePrompt.data.doneSets || {});
    setResumePrompt(null);
    setOpen(true);
  };
  const dismissResume = () => {
    if (user) clearDraft("gym", user.id);
    setResumePrompt(null);
  };

  const sorted = sessions;

  return (
    <AppShell title="Gym Log" subtitle={`${sessions.length} workouts logged`} accent="gym"
      right={
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost" className="h-11 w-11 rounded-full text-module-foreground hover:bg-module-foreground/15" aria-label="Exercise library">
            <Link to="/exercises"><Library className="h-5 w-5" /></Link>
          </Button>
          <Button onClick={() => { reset(); setOpen(true); }}
            className="h-11 rounded-full bg-background px-4 text-gym hover:bg-background/90 font-semibold shadow-lg">
            <Plus className="h-5 w-5" /> Log workout
          </Button>
        </div>
      }
    >
      {/* Resume in-progress workout banner */}
      {resumePrompt && !open && (
        <Card className="mb-4 flex items-center gap-3 border-gym/40 bg-gym/5 p-3">
          <RotateCcw className="h-5 w-5 shrink-0 text-gym" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">Resume in-progress workout</p>
            <p className="text-xs text-muted-foreground">
              {resumePrompt.data.exercises.length} exercises · started {draftAge(resumePrompt.at)}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={dismissResume}>Discard</Button>
          <Button size="sm" className="bg-gym hover:bg-gym/90" onClick={acceptResume}>Resume</Button>
        </Card>
      )}

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
              <p className="text-sm text-muted-foreground">No workouts yet.</p>
              <Button onClick={() => { reset(); setOpen(true); }} className="mt-4 bg-gym hover:bg-gym/90">
                <Plus className="h-4 w-4" /> Start your first workout
              </Button>
            </div>
          )}
          {sorted.map((s) => {
            const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0);
            const totalVolKg = s.exercises.reduce(
              (a, e) => a + e.sets.reduce((b, st) => b + st.reps * st.weight, 0), 0);
            const times = formatSessionTimes(s.startedAt, s.endedAt);
            return (
              <Card key={s.id} className="p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {format(parseISO(s.date), "EEE, MMM d • HH:mm")}
                    </p>
                    {times && <p className="text-xs text-muted-foreground">{times}</p>}
                    <p className="mt-1 font-semibold">{s.exercises.length} exercises · {totalSets} sets</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openForEdit(s)}
                      aria-label="Edit workout">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => setPendingDelete(s)} aria-label="Delete workout">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {s.exercises.map((e) => {
                    const expanded = expandedExId === `${s.id}:${e.id}`;
                    return (
                      <Collapsible key={e.id} open={expanded}
                        onOpenChange={(o) => setExpandedExId(o ? `${s.id}:${e.id}` : null)}>
                        <div className="flex items-center gap-1.5">
                          <CollapsibleTrigger asChild>
                            <button className="flex flex-1 items-center justify-between rounded-lg bg-gym/5 px-3 py-2 text-left text-sm hover:bg-gym/10">
                              <span className="font-medium">{e.exerciseName}</span>
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {e.sets.length} sets
                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
                              </span>
                            </button>
                          </CollapsibleTrigger>
                          <button onClick={() => setChartFor(e.exerciseName)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-gym"
                            aria-label="Show chart">
                            <TrendingUp className="h-4 w-4" />
                          </button>
                        </div>
                        <CollapsibleContent>
                          <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-gym/20 pl-3 text-xs text-muted-foreground">
                            {e.sets.map((st, i) => (
                              <div key={i} className="flex items-center gap-2 tabular-nums">
                                <span className="w-5 text-right">{i + 1}.</span>
                                <span className="font-semibold text-foreground">{st.reps}</span>
                                <span>×</span>
                                <span className="font-semibold text-foreground">{formatWeight(st.weight, unit, 1)}</span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>

                {totalVolKg > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Total volume:{" "}
                    <span className="font-semibold text-foreground">
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

      {/* Active workout session sheet */}
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setRestRunning(false); }}>
        <SheetContent side="bottom" className="flex h-[100dvh] flex-col gap-0 rounded-none p-0">
          {/* Header */}
          <SheetHeader className="shrink-0 border-b bg-card px-3 pb-3 pt-4 safe-top">
            <SheetTitle className="sr-only">{editingId ? "Edit workout" : "Active workout"}</SheetTitle>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full border"
                aria-label="Minimise workout" onClick={() => setOpen(false)}>
                <ChevronDown className="h-5 w-5" />
              </Button>
              <p className="flex-1 text-base font-semibold text-gym">
                {editingId ? "Edit Workout" : elapsedLabel}
              </p>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full border"
                aria-label="Clock" onClick={() => setClockOpen(true)}>
                <Clock className="h-5 w-5" />
              </Button>
              <Button onClick={save} className="h-10 rounded-full bg-gym px-5 font-semibold text-module-foreground hover:bg-gym/90">
                Finish
              </Button>
            </div>
          </SheetHeader>

          {/* Stats strip */}
          <div className="shrink-0 border-b bg-card px-4 py-3">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Duration" value={editingId ? "—" : elapsedLabel} accent />
              <Stat label="Volume" value={formatWeight(sessionVolumeKg, unit, 0)} />
              <Stat label="Sets" value={String(completedSetCount)} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" value={sessionDate} max={todayInputDate()} className="h-8 w-auto text-xs"
                onChange={(e) => setSessionDate(e.target.value || todayInputDate())} />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {exercises.length === 0 && (
              <div className="py-16 text-center">
                <Dumbbell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-semibold text-muted-foreground">Get started</p>
                <p className="mt-1 text-sm text-muted-foreground">Add an exercise to begin your workout.</p>
              </div>
            )}

            {exercises.map((ex) => (
              <WorkoutExerciseCard
                key={ex.id}
                ex={ex}
                unit={unit}
                defaultRest={restDefault}
                doneSets={doneSets}
                previousLabel={previousLabel}
                displayWeight={displayWeight}
                setWeightDraft={setWeightDraft}
                onUpdateSet={updateSet}
                onToggleDone={toggleSetDone}
                onAddSet={addSet}
                onRemoveSet={removeSet}
                onRemoveExercise={removeExercise}
                onPatchExercise={patchExercise}
                onPlateCalc={(exId, idx, kg) => setPlateTarget({ exId, idx, kg })}
              />
            ))}

            <Button size="lg" className="w-full bg-gym font-semibold text-module-foreground hover:bg-gym/90"
              onClick={() => setAddOpen(true)}>
              <Plus className="h-5 w-5" /> Add Exercise
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" asChild>
                <Link to="/exercises"><Library className="h-4 w-4" /> Library</Link>
              </Button>
              <Button variant="secondary" size="lg" className="text-destructive"
                onClick={() => setConfirmDiscard(true)}>
                Discard Workout
              </Button>
            </div>

            <div className="space-y-2 pb-8">
              <Label>Workout notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="How did the session feel?" rows={3} />
            </div>
          </div>

          {restRunning && (
            <RestBar key={restKey} seconds={restSeconds} onSkip={() => setRestRunning(false)} />
          )}
        </SheetContent>
      </Sheet>

      <AddExerciseSheet open={addOpen} onOpenChange={setAddOpen} onSelect={addExercise} />

      <ClockSheet open={clockOpen} onOpenChange={setClockOpen} defaultSeconds={restDefault}
        onStartRest={(s) => startRest(s)} />

      <PlateCalculatorSheet
        open={plateTarget !== null}
        targetKg={plateTarget ? Number((toDisplay(plateTarget.kg, "kg") ?? 0).toFixed(2)) : 0}
        onApply={(kg) => {
          if (!plateTarget) return;
          const shown = toDisplay(kg, unit) ?? kg;
          setWeightDraft(plateTarget.exId, plateTarget.idx, String(Number(shown.toFixed(2))));
        }}
        onOpenChange={(o) => { if (!o) setPlateTarget(null); }} />

      {/* Discard confirm */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything logged in this session will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setConfirmDiscard(false);
                if (user) clearDraft("gym", user.id);
                reset();
                setOpen(false);
              }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <ExerciseChartDialog name={chartFor} sessions={sessions} unit={unit} onClose={() => setChartFor(null)} />

      {/* Delete confirm */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && format(parseISO(pendingDelete.date), "EEE, MMM d • HH:mm")} —{" "}
              {pendingDelete?.exercises.length} exercises will be removed. You can undo for a few seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!prCelebrate} onOpenChange={(o) => { if (!o) setPrCelebrate(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" /> New Personal Record!
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
}: { name: string | null; sessions: GymSession[]; unit: "kg" | "lbs"; onClose: () => void }) {
  const data = useMemo(() => {
    if (!name) return [];
    return exerciseSeries(sessions, name).map((p) => ({
      date: format(parseISO(p.date), "MMM d"),
      weight: toDisplay(p.topWeight, unit),
      volume: toDisplay(p.volume, unit),
    }));
  }, [name, sessions, unit]);

  // Recent set-by-set entries for this exercise
  const recentEntries = useMemo(() => {
    if (!name) return [];
    const out: { date: string; sets: { reps: number; weight: number }[] }[] = [];
    for (const s of sessions) {
      for (const e of s.exercises) {
        if (e.exerciseName === name) {
          out.push({ date: s.date, sets: e.sets });
          break;
        }
      }
      if (out.length >= 10) break;
    }
    return out;
  }, [name, sessions]);

  return (
    <Dialog open={!!name} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> {name}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="recent">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent sessions</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-3 space-y-2">
            {recentEntries.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No history yet.</p>
            )}
            {recentEntries.map((r, i) => (
              <Card key={i} className="p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {format(parseISO(r.date), "EEE, MMM d • HH:mm")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.sets.map((st, j) => (
                    <span key={j} className="rounded bg-muted px-2 py-0.5 text-xs tabular-nums">
                      {st.reps} × {formatWeight(st.weight, unit, 1)}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="chart" className="mt-3">
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
          </TabsContent>
        </Tabs>
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-base font-bold tabular-nums", accent && "text-gym")}>{value}</p>
    </div>
  );
}
