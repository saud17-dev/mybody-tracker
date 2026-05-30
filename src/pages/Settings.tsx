import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Heart, LogOut, Scale, Timer, User as UserIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  useProfile, useGymSessions, usePTSessions, useCardioSessions,
  useBodyMetrics, useGoals, useCustomExercises, useFavorites, useWorkoutTemplates, usePlanSchedule,
} from "@/lib/cloud";
import { metricsToCsv } from "@/lib/csvMetrics";
import { isHealthAvailable, requestHealthPermissions, fetchHealthMetrics, fetchHealthWorkouts } from "@/lib/health";
import { ShareAccessCard } from "@/components/ShareAccessCard";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, update } = useProfile();
  const { sessions: gym } = useGymSessions();
  const { sessions: pt } = usePTSessions();
  const { sessions: cardio } = useCardioSessions();
  const { metrics } = useBodyMetrics();
  const { goals } = useGoals();
  const { items: customGym } = useCustomExercises("gym");
  const { items: customPT } = useCustomExercises("pt");
  const { favorites: favGym } = useFavorites("gym");
  const { favorites: favPT } = useFavorites("pt");
  const { templates } = useWorkoutTemplates();
  const { days } = usePlanSchedule();

  const [displayName, setDisplayName] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [restSeconds, setRestSeconds] = useState(90);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setUnit(profile.unit);
      setRestSeconds(profile.restTimerSeconds);
    }
  }, [profile]);

  const saveProfile = async () => {
    try {
      await update({ displayName, unit, restTimerSeconds: restSeconds });
      toast.success("Profile saved");
    } catch (e: any) { toast.error(e.message); }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      profile, goals,
      gymSessions: gym, ptSessions: pt, cardioSessions: cardio,
      bodyMetrics: metrics,
      customExercises: { gym: customGym, pt: customPT },
      favorites: { gym: Array.from(favGym), pt: Array.from(favPT) },
      workoutTemplates: templates,
      planSchedule: days,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitness-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const exportMetricsCsv = () => {
    const csv = metricsToCsv(metrics);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `body-metrics-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const healthAvailable = isHealthAvailable();
  const [healthBusy, setHealthBusy] = useState(false);
  const { create: createMetric } = useBodyMetrics();
  const { create: createCardio } = useCardioSessions();

  const syncHealth = async () => {
    setHealthBusy(true);
    try {
      const ok = await requestHealthPermissions();
      if (!ok) { toast.error("Health permission denied"); return; }
      const [hm, hw] = await Promise.all([fetchHealthMetrics(90), fetchHealthWorkouts(90)]);
      const existingDates = new Set(metrics.map((m) => m.date.slice(0, 10)));
      let nm = 0, nw = 0;
      for (const m of hm) {
        if (existingDates.has(m.date.slice(0, 10))) continue;
        await createMetric({ date: m.date, weightKg: m.weightKg, muscleMassPct: m.muscleMassPct, bodyFatPct: m.bodyFatPct });
        nm++;
      }
      for (const w of hw) {
        await createCardio({ date: w.date, activity: w.activity, durationMin: w.durationMin, distanceKm: w.distanceKm });
        nw++;
      }
      toast.success(`Synced ${nm} measurement(s) and ${nw} workout(s)`);
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally { setHealthBusy(false); }
  };

  return (
    <AppShell title="Settings" subtitle={user?.email || ""} accent="primary"
      right={
        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25"
          onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      }>
      <section>
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <UserIcon className="h-3.5 w-3.5" /> Profile
        </h2>
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Scale className="h-3.5 w-3.5" /> Units
        </h2>
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Weight & distance</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Metric (kg, km)</SelectItem>
                <SelectItem value="lbs">Imperial (lbs, mi)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">All historical data is stored in metric and converted on display.</p>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Timer className="h-3.5 w-3.5" /> Rest timer
        </h2>
        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Default rest between sets (seconds)</Label>
            <Input type="number" min={5} max={600} value={restSeconds}
              onChange={(e) => setRestSeconds(Number(e.target.value) || 0)} />
          </div>
        </Card>
      </section>

      <Button size="lg" className="w-full mt-5" onClick={saveProfile}>Save changes</Button>

      <section className="mt-7">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</h2>
        <Card className="p-4 space-y-3">
          <Button variant="outline" className="w-full" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" /> Export all data (JSON)
          </Button>
          <Button variant="outline" className="w-full" onClick={exportMetricsCsv}>
            <Download className="h-4 w-4 mr-2" /> Export body metrics (CSV)
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {gym.length} workouts · {pt.length} PT · {cardio.length} cardio · {metrics.length} measurements
          </p>
        </Card>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Heart className="h-3.5 w-3.5" /> Apple Health
        </h2>
        <Card className="p-4 space-y-3">
          {healthAvailable ? (
            <>
              <p className="text-xs text-muted-foreground">
                Pull weight, body-fat and workouts from the Health app on your iPhone.
              </p>
              <Button className="w-full" onClick={syncHealth} disabled={healthBusy}>
                <Heart className="h-4 w-4 mr-2" />
                {healthBusy ? "Syncing…" : "Sync last 90 days"}
              </Button>
            </>
          ) : (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">iOS native app required</p>
              <p>
                Apple Health is only accessible to native iOS apps. To enable it: export this project to GitHub, then run locally:
              </p>
              <pre className="overflow-x-auto rounded bg-muted p-2 text-[10px] leading-relaxed">{`npm install
npx cap add ios
npm run build
npx cap sync
npx cap run ios`}</pre>
              <p>Requires a Mac with Xcode. Once installed on iPhone, this section will activate.</p>
            </div>
          )}
        </Card>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h2>
        <Card className="p-4">
          <Button variant="outline" className="w-full text-destructive hover:text-destructive"
            onClick={async () => { await signOut(); navigate("/auth"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </Card>
      </section>
    </AppShell>
  );
}
