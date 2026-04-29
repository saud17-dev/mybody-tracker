import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Activity } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARDIO_ACTIVITIES } from "@/lib/exercises";
import { useCardioSessions, uid } from "@/lib/storage";
import { getTemplateById } from "@/lib/plan";
import { toast } from "sonner";

export default function Cardio() {
  const [sessions, setSessions] = useCardioSessions();
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState(CARDIO_ACTIVITIES[0]);
  const [duration, setDuration] = useState<number>(30);
  const [distance, setDistance] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tplId = searchParams.get("template");
    if (!tplId) return;
    const tpl = getTemplateById(tplId);
    if (!tpl || tpl.module !== "cardio" || !tpl.cardio) {
      toast.error("Template not found");
    } else {
      const match = CARDIO_ACTIVITIES.find((a) => a.toLowerCase() === tpl.cardio!.activity.toLowerCase());
      setActivity(match ?? CARDIO_ACTIVITIES[0]);
      setDuration(tpl.cardio.durationMin);
      setNotes([tpl.cardio.note, tpl.notes].filter(Boolean).join(" — "));
      setOpen(true);
      toast.success(`Loaded "${tpl.title}"`);
    }
    searchParams.delete("template");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setActivity(CARDIO_ACTIVITIES[0]);
    setDuration(30);
    setDistance("");
    setNotes("");
  };

  const save = () => {
    if (!duration || duration <= 0) {
      toast.error("Add a duration");
      return;
    }
    setSessions((prev) => [
      {
        id: uid(),
        date: new Date().toISOString(),
        activity,
        durationMin: duration,
        distanceKm: distance === "" ? undefined : Number(distance),
        notes: notes || undefined,
      },
      ...prev,
    ]);
    toast.success("Cardio logged");
    reset();
    setOpen(false);
  };

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const totalMin = sessions.reduce((a, s) => a + s.durationMin, 0);
  const totalKm = sessions.reduce((a, s) => a + (s.distanceKm || 0), 0);

  return (
    <AppShell
      title="Cardio Log"
      subtitle={`${sessions.length} sessions · ${totalMin} min`}
      accent="cardio"
      right={
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <SheetTrigger asChild>
            <Button size="icon" className="h-11 w-11 rounded-full bg-white text-cardio hover:bg-white/90">
              <Plus className="h-5 w-5" />
            </Button>
          </SheetTrigger>
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
                    {CARDIO_ACTIVITIES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <Button onClick={save} className="w-full bg-cardio hover:bg-cardio/90" size="lg">
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
              <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No cardio sessions yet.</p>
            </div>
          )}
          {sorted.map((s) => (
            <Card key={s.id} className="flex items-center gap-4 p-4 shadow-[var(--shadow-card)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cardio/10 text-cardio">
                <Activity className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{s.activity}</p>
                <p className="text-xs text-muted-foreground">{format(parseISO(s.date), "EEE, MMM d • HH:mm")}</p>
                {s.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{s.notes}"</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums">{s.durationMin}<span className="text-xs font-normal text-muted-foreground"> min</span></p>
                {s.distanceKm != null && (
                  <p className="text-xs text-muted-foreground">{s.distanceKm} km</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSessions((prev) => prev.filter((x) => x.id !== s.id));
                  toast("Deleted");
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
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
            <p className="text-2xl font-bold">{totalKm.toFixed(1)}<span className="text-sm font-normal"> km</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg session</p>
            <p className="text-2xl font-bold">
              {sessions.length ? Math.round(totalMin / sessions.length) : 0}<span className="text-sm font-normal"> min</span>
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
