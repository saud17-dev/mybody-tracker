import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Activity, Library } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CARDIO_ACTIVITIES } from "@/lib/exercises";
import { useCardioSessions, useProfile, useWorkoutTemplates } from "@/lib/cloud";
import { distanceLabel, distanceToDisplay, distanceFromInput } from "@/lib/units";
import { formatSessionTimes } from "@/lib/duration";
import type { CardioSession } from "@/lib/types";
import { toast } from "sonner";

export default function Cardio() {
  const { sessions, create, remove, restore } = useCardioSessions();
  const { profile } = useProfile();
  const unit = profile?.unit ?? "kg";
  const distLbl = distanceLabel(unit);
  const { templates } = useWorkoutTemplates();

  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState(CARDIO_ACTIVITIES[0]);
  const [duration, setDuration] = useState<string>("30");
  const [distance, setDistance] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CardioSession | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (open && !startedAt) setStartedAt(new Date().toISOString());
  }, [open, startedAt]);

  useEffect(() => {
    const tplId = searchParams.get("template");
    if (!tplId) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && tpl.module === "cardio") {
      setActivity(tpl.payload?.activity || CARDIO_ACTIVITIES[0]);
      setDuration(String(tpl.payload?.durationMin || 30));
      setNotes(tpl.name);
      setOpen(true);
    } else if (templates.length > 0) {
      toast.error("Template not found");
    }
    searchParams.delete("template");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.length]);

  const reset = () => {
    setActivity(CARDIO_ACTIVITIES[0]); setDuration("30"); setDistance(""); setNotes("");
    setStartedAt(null);
  };

  const save = async () => {
    const dur = parseFloat(duration);
    if (!dur || dur <= 0) return toast.error("Add a duration");
    const dist = distance.trim() === "" ? undefined : parseFloat(distance);
    const distKm = dist == null || isNaN(dist) ? undefined : distanceFromInput(dist, unit);
    try {
      const endedAt = new Date().toISOString();
      await create({
        date: new Date().toISOString(), activity, durationMin: dur,
        distanceKm: distKm, notes: notes || undefined,
        startedAt: startedAt ?? endedAt, endedAt,
      });
      toast.success("Cardio logged");
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

  const sorted = sessions;
  const totalMin = sessions.reduce((a, s) => a + s.durationMin, 0);
  const totalDistDisp = sessions.reduce((a, s) => a + (distanceToDisplay(s.distanceKm, unit) ?? 0), 0);

  const allowDecimal = (raw: string) => raw === "" || /^\d+(\.\d{0,3})?$/.test(raw) || /^\d+\.$/.test(raw);

  return (
    <AppShell title="Cardio Log" subtitle={`${sessions.length} sessions · ${totalMin} min`} accent="cardio"
      right={
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost" className="h-11 w-11 rounded-full text-white hover:bg-white/15" aria-label="Exercise library">
            <Link to="/exercises"><Library className="h-5 w-5" /></Link>
          </Button>
          <Button onClick={() => { reset(); setOpen(true); }}
            className="h-11 rounded-full bg-white px-4 text-cardio hover:bg-white/90 font-semibold shadow-lg">
            <Plus className="h-5 w-5" /> Log cardio
          </Button>
        </div>
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
              <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No cardio sessions yet.</p>
              <Button onClick={() => { reset(); setOpen(true); }} className="mt-4 bg-cardio hover:bg-cardio/90">
                <Plus className="h-4 w-4" /> Log your first session
              </Button>
            </div>
          )}
          {sorted.map((s) => {
            const distDisp = distanceToDisplay(s.distanceKm, unit);
            return (
              <Card key={s.id} className="flex items-center gap-4 p-4 shadow-[var(--shadow-card)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cardio/10 text-cardio">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.activity}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(s.date), "EEE, MMM d • HH:mm")}</p>
                  {s.notes && <p className="mt-1 text-xs italic text-muted-foreground truncate">"{s.notes}"</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums">
                    {s.durationMin}<span className="text-xs font-normal text-muted-foreground"> min</span>
                  </p>
                  {distDisp != null && (
                    <p className="text-xs text-muted-foreground">{distDisp.toFixed(1)} {distLbl}</p>
                  )}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8"
                  onClick={() => setPendingDelete(s)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </Card>
            );
          })}
        </TabsContent>
        <TabsContent value="stats" className="mt-4 grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total sessions</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total time</p>
            <p className="text-2xl font-bold">{totalMin}<span className="text-sm font-normal"> min</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total distance</p>
            <p className="text-2xl font-bold">{totalDistDisp.toFixed(1)}<span className="text-sm font-normal"> {distLbl}</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg session</p>
            <p className="text-2xl font-bold">
              {sessions.length ? Math.round(totalMin / sessions.length) : 0}<span className="text-sm font-normal"> min</span>
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <SheetHeader className="border-b px-5 pb-4 pt-5">
            <SheetTitle>New Cardio Session</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Activity</Label>
              <Select value={activity} onValueChange={setActivity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARDIO_ACTIVITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={duration}
                  onChange={(e) => { const v = e.target.value.replace(",", "."); if (allowDecimal(v)) setDuration(v); }} />
              </div>
              <div className="space-y-2">
                <Label>Distance ({distLbl})</Label>
                <Input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={distance}
                  onChange={(e) => { const v = e.target.value.replace(",", "."); if (allowDecimal(v)) setDistance(v); }}
                  placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <Button onClick={save} className="w-full bg-cardio hover:bg-cardio/90" size="lg">Save session</Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && format(parseISO(pendingDelete.date), "EEE, MMM d • HH:mm")} — {pendingDelete?.activity}.
              You can undo for a few seconds.
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
