import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, HeartPulse, X, Pencil, Library, ChevronDown, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExercisePicker } from "@/components/ExercisePicker";
import { ExerciseCountdown } from "@/components/ExerciseCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PT_EXERCISES, PT_BODY_AREAS } from "@/lib/exercises";
import {
  usePTSessions, useWorkoutTemplates, useRecentPTExercises, uid,
} from "@/lib/cloud";
import { saveDraft, loadDraft, clearDraft, draftAge } from "@/lib/draft";
import { formatSessionTimes, todayInputDate, dateWithCurrentTime, isoToInputDate } from "@/lib/duration";
import { useAuth } from "@/lib/auth";
import type { PTExerciseEntry, PTSet, PTSession } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const painColor = (n: number) =>
  n <= 3 ? "text-emerald-500" : n <= 6 ? "text-amber-500" : "text-destructive";

interface DraftPayload {
  exercises: PTExerciseEntry[];
  overallNotes: string;
}

export default function PT() {
  const { user } = useAuth();
  const { sessions, create, update, remove, restore } = usePTSessions();
  const { templates } = useWorkoutTemplates();
  const recent = useRecentPTExercises(sessions, 8);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<PTExerciseEntry[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [picker, setPicker] = useState<{ name: string; group: string; bodyArea?: string } | null>(null);
  const [bodyAreaFilter, setBodyAreaFilter] = useState<string>("All");
  const [pendingDelete, setPendingDelete] = useState<PTSession | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{ at: number; data: DraftPayload } | null>(null);
  const [expandedExId, setExpandedExId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string>(todayInputDate());
  const [searchParams, setSearchParams] = useSearchParams();

  // Load draft once
  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const d = loadDraft<DraftPayload>("pt", user.id);
    if (d && d.data.exercises.length > 0) setResumePrompt(d);
  }, [user]);

  // Track when a new session was started
  useEffect(() => {
    if (open && !editingId && !startedAt) {
      setStartedAt(new Date().toISOString());
    }
  }, [open, editingId, startedAt]);

  // Autosave (only for new, not edits)
  useEffect(() => {
    if (!user || editingId) return;
    if (exercises.length === 0 && !overallNotes) {
      clearDraft("pt", user.id);
      return;
    }
    saveDraft<DraftPayload>("pt", user.id, { exercises, overallNotes });
  }, [user, editingId, exercises, overallNotes]);

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
          sets: [{ reps: e.reps || 10, painScale: 2 } as PTSet],
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

  const reset = () => { setExercises([]); setOverallNotes(""); setPicker(null); setEditingId(null); setStartedAt(null); setSessionDate(todayInputDate()); };

  const openForEdit = (s: PTSession) => {
    setEditingId(s.id);
    setExercises(s.exercises.map((e) => ({ ...e, sets: e.sets.map((st) => ({ ...st })) })));
    setOverallNotes(s.overallNotes ?? "");
    setStartedAt(s.startedAt ?? null);
    setSessionDate(isoToInputDate(s.date));
    setOpen(true);
  };

  const save = async () => {
    if (exercises.length === 0) return toast.error("Add at least one exercise");
    try {
      const endedAt = new Date().toISOString();
      if (editingId) {
        const orig = sessions.find((s) => s.id === editingId);
        await update({
          id: editingId,
          date: dateWithCurrentTime(sessionDate, orig?.date ? new Date(orig.date) : new Date()),
          exercises,
          overallNotes: overallNotes || undefined,
          startedAt: startedAt ?? orig?.startedAt,
          endedAt: orig?.endedAt ?? endedAt,
        } as PTSession);
        toast.success("Session updated");
      } else {
        await create({
          date: dateWithCurrentTime(sessionDate), exercises, overallNotes: overallNotes || undefined,
          startedAt: startedAt ?? endedAt, endedAt,
        });
        toast.success("PT session logged");
        if (user) clearDraft("pt", user.id);
      }
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const snap = pendingDelete;
    setPendingDelete(null);
    try {
      await remove(snap.id);
      toast("Session deleted", {
        action: { label: "Undo", onClick: () => { restore(snap).then(() => toast.success("Restored")).catch(() => {}); } },
        duration: 6000,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const acceptResume = () => {
    if (!resumePrompt) return;
    setExercises(resumePrompt.data.exercises);
    setOverallNotes(resumePrompt.data.overallNotes);
    setResumePrompt(null);
    setOpen(true);
  };
  const dismissResume = () => {
    if (user) clearDraft("pt", user.id);
    setResumePrompt(null);
  };

  const sorted = sessions;

  return (
    <AppShell title="PT Log" subtitle={`${sessions.length} sessions logged`} accent="pt"
      right={
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost" className="h-11 w-11 rounded-full text-white hover:bg-white/15" aria-label="Exercise library">
            <Link to="/exercises"><Library className="h-5 w-5" /></Link>
          </Button>
          <Button onClick={() => { reset(); setOpen(true); }}
            className="h-11 rounded-full bg-white px-4 text-pt hover:bg-white/90 font-semibold shadow-lg">
            <Plus className="h-5 w-5" /> Log session
          </Button>
        </div>
      }
    >
      {resumePrompt && !open && (
        <Card className="mb-4 flex items-center gap-3 border-pt/40 bg-pt/5 p-3">
          <RotateCcw className="h-5 w-5 shrink-0 text-pt" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">Resume in-progress session</p>
            <p className="text-xs text-muted-foreground">
              {resumePrompt.data.exercises.length} exercises · started {draftAge(resumePrompt.at)}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={dismissResume}>Discard</Button>
          <Button size="sm" className="bg-pt hover:bg-pt/90" onClick={acceptResume}>Resume</Button>
        </Card>
      )}

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
              <Button onClick={() => { reset(); setOpen(true); }} className="mt-4 bg-pt hover:bg-pt/90">
                <Plus className="h-4 w-4" /> Start your first session
              </Button>
            </div>
          )}
          {sorted.map((s) => {
            const allSets = s.exercises.flatMap((e) => e.sets);
            const avgPain = allSets.length
              ? allSets.reduce((a, st) => a + (st.painScale || 0), 0) / allSets.length
              : 0;
            const times = formatSessionTimes(s.startedAt, s.endedAt);
            return (
              <Card key={s.id} className="p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {format(parseISO(s.date), "EEE, MMM d • HH:mm")}
                    </p>
                    {times && <p className="text-xs text-muted-foreground">{times}</p>}
                    <p className="mt-1 font-semibold">{s.exercises.length} exercises</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right pr-1">
                      <p className="text-[10px] text-muted-foreground">Avg pain</p>
                      <p className={cn("text-base font-bold", painColor(avgPain))}>{avgPain.toFixed(1)}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openForEdit(s)} aria-label="Edit">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => setPendingDelete(s)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {s.exercises.map((e) => {
                    const exAvg = e.sets.length ? e.sets.reduce((a, x) => a + x.painScale, 0) / e.sets.length : 0;
                    const expanded = expandedExId === `${s.id}:${e.id}`;
                    return (
                      <Collapsible key={e.id} open={expanded}
                        onOpenChange={(o) => setExpandedExId(o ? `${s.id}:${e.id}` : null)}>
                        <CollapsibleTrigger asChild>
                          <button className="flex w-full items-center justify-between rounded-lg bg-pt/5 px-3 py-2 text-left text-sm hover:bg-pt/10">
                            <span className="min-w-0 truncate font-medium">{e.exerciseName}</span>
                            <span className="flex items-center gap-2 text-xs">
                              <span className={cn("font-bold", painColor(exAvg))}>Pain {exAvg.toFixed(1)}</span>
                              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                            </span>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-pt/20 pl-3 text-xs text-muted-foreground">
                            {e.sets.map((st, i) => (
                              <div key={i} className="flex items-center gap-2 tabular-nums">
                                <span className="w-5 text-right">{i + 1}.</span>
                                <span className="font-semibold text-foreground">{st.reps}</span>
                                <span>reps · pain</span>
                                <span className={cn("font-semibold", painColor(st.painScale))}>{st.painScale}</span>
                              </div>
                            ))}
                            {e.notes && <p className="italic">"{e.notes}"</p>}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
                {s.overallNotes && (
                  <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">"{s.overallNotes}"</p>
                )}
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

      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl p-0">
          <SheetHeader className="sticky top-0 z-10 border-b bg-card px-5 pb-4 pt-5">
            <SheetTitle>{editingId ? "Edit PT Session" : "New PT Session"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={sessionDate} max={todayInputDate()}
                onChange={(e) => setSessionDate(e.target.value || todayInputDate())} />
            </div>
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
              <div className="flex items-center justify-between">
                <Label>Add exercise</Label>
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  <Link to="/exercises"><Library className="h-3.5 w-3.5" /> Browse library</Link>
                </Button>
              </div>
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
                <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{ex.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">{ex.category}{ex.bodyArea ? ` · ${ex.bodyArea}` : ""}</p>
                  </div>
                  <ExerciseCountdown defaultSeconds={30} />
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
            <Button onClick={save} className="w-full bg-pt hover:bg-pt/90" size="lg">
              {editingId ? "Save changes" : "Save session"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
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
    </AppShell>
  );
}
