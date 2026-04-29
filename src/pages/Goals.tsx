import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Settings as SettingsIcon,
  Dumbbell,
  HeartPulse,
  Activity,
  Scale,
  TrendingUp,
  Trash2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  useGymSessions,
  usePTSessions,
  useCardioSessions,
  useBodyMetrics,
  useGoals,
  uid,
} from "@/lib/storage";
import { useWeeklyCounts } from "@/lib/stats";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RingProps {
  label: string;
  current: number;
  target: number;
  variant: "gym" | "pt" | "cardio";
  Icon: React.ComponentType<{ className?: string }>;
}

const variantStyles = {
  gym: { bg: "bg-gym/10", text: "text-gym", bar: "[&>div]:bg-gym" },
  pt: { bg: "bg-pt/10", text: "text-pt", bar: "[&>div]:bg-pt" },
  cardio: { bg: "bg-cardio/10", text: "text-cardio", bar: "[&>div]:bg-cardio" },
} as const;

function GoalRing({ label, current, target, variant, Icon }: RingProps) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const s = variantStyles[variant];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", s.bg)}>
          <Icon className={cn("h-4 w-4", s.text)} />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{Math.round(pct)}%</span>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {current}
        <span className="text-base font-normal text-muted-foreground">/{target}</span>
      </p>
      <Progress value={pct} className={cn("mt-2 h-1.5", s.bar)} />
    </Card>
  );
}

export default function Goals() {
  const [gym] = useGymSessions();
  const [pt] = usePTSessions();
  const [cardio] = useCardioSessions();
  const [metrics, setMetrics] = useBodyMetrics();
  const [goals, setGoals] = useGoals();

  const weekly = useWeeklyCounts(gym, pt, cardio);

  const [metricOpen, setMetricOpen] = useState(false);
  const [weight, setWeight] = useState<number | "">("");
  const [muscle, setMuscle] = useState<number | "">("");
  const [bodyFat, setBodyFat] = useState<number | "">("");

  const addMetric = () => {
    if (weight === "" && muscle === "" && bodyFat === "") {
      toast.error("Enter at least one value");
      return;
    }
    setMetrics((prev) => [
      ...prev,
      {
        id: uid(),
        date: new Date().toISOString(),
        weightKg: weight === "" ? undefined : Number(weight),
        muscleMassPct: muscle === "" ? undefined : Number(muscle),
        bodyFatPct: bodyFat === "" ? undefined : Number(bodyFat),
      },
    ]);
    setWeight(""); setMuscle(""); setBodyFat("");
    setMetricOpen(false);
    toast.success("Measurement added");
  };

  const sortedMetrics = useMemo(
    () => [...metrics].sort((a, b) => a.date.localeCompare(b.date)),
    [metrics],
  );

  const chartData = useMemo(
    () =>
      sortedMetrics.map((m) => ({
        date: format(parseISO(m.date), "MMM d"),
        weight: m.weightKg ?? null,
        muscle: m.muscleMassPct ?? null,
        bodyFat: m.bodyFatPct ?? null,
      })),
    [sortedMetrics],
  );

  const latest = sortedMetrics[sortedMetrics.length - 1];

  return (
    <AppShell
      title="Your Goals"
      subtitle={format(new Date(), "EEEE, MMM d")}
      accent="primary"
      right={<GoalSettings goals={goals} setGoals={setGoals} />}
    >
      <section>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          This week
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <GoalRing label="Gym" current={weekly.gym} target={goals.weeklyGym} variant="gym" Icon={Dumbbell} />
          <GoalRing label="PT" current={weekly.pt} target={goals.weeklyPT} variant="pt" Icon={HeartPulse} />
          <GoalRing label="Cardio" current={weekly.cardio} target={goals.weeklyCardio} variant="cardio" Icon={Activity} />
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Body composition
          </h2>
          <Sheet open={metricOpen} onOpenChange={setMetricOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary">
                <Plus className="h-4 w-4" /> Log
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Add measurement</SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" inputMode="decimal" step="0.1" value={weight}
                    onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Muscle mass (%)</Label>
                  <Input type="number" inputMode="decimal" step="0.1" value={muscle}
                    onChange={(e) => setMuscle(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Body fat (%)</Label>
                  <Input type="number" inputMode="decimal" step="0.1" value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <Button onClick={addMetric} className="w-full" size="lg">Save</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {latest ? (
          <div className="grid grid-cols-3 gap-3">
            <BodyStat label="Weight" unit="kg" current={latest.weightKg} target={goals.targetWeightKg} Icon={Scale} />
            <BodyStat label="Muscle" unit="%" current={latest.muscleMassPct} target={goals.targetMuscleMassPct} Icon={TrendingUp} />
            <BodyStat label="Body fat" unit="%" current={latest.bodyFatPct} target={goals.targetBodyFatPct} Icon={TrendingUp} />
          </div>
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No measurements yet. Tap "Log" to add one.
          </Card>
        )}
      </section>

      {chartData.length >= 2 && (
        <section className="mt-7">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </h2>
          <Tabs defaultValue="weight">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="muscle">Muscle</TabsTrigger>
              <TabsTrigger value="bodyFat">Body fat</TabsTrigger>
            </TabsList>
            <TabsContent value="weight">
              <MetricChart data={chartData} dataKey="weight" target={goals.targetWeightKg} color="hsl(var(--primary))" unit="kg" />
            </TabsContent>
            <TabsContent value="muscle">
              <MetricChart data={chartData} dataKey="muscle" target={goals.targetMuscleMassPct} color="hsl(var(--gym))" unit="%" />
            </TabsContent>
            <TabsContent value="bodyFat">
              <MetricChart data={chartData} dataKey="bodyFat" target={goals.targetBodyFatPct} color="hsl(var(--cardio))" unit="%" />
            </TabsContent>
          </Tabs>
        </section>
      )}

      {metrics.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent measurements
          </h2>
          <div className="space-y-2">
            {[...metrics].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((m) => (
              <Card key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{format(parseISO(m.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      m.weightKg != null && `${m.weightKg} kg`,
                      m.muscleMassPct != null && `${m.muscleMassPct}% muscle`,
                      m.bodyFatPct != null && `${m.bodyFatPct}% fat`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => setMetrics((prev) => prev.filter((x) => x.id !== m.id))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function BodyStat({
  label, unit, current, target, Icon,
}: { label: string; unit: string; current?: number; target?: number; Icon: React.ComponentType<{ className?: string }> }) {
  const diff = current != null && target != null ? current - target : null;
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">
        {current != null ? current : "—"}
        {current != null && <span className="text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
      {target != null && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Goal: {target}{unit}
          {diff != null && (
            <span className={cn("ml-1 font-semibold", Math.abs(diff) < 0.5 ? "text-primary" : diff > 0 ? "text-destructive" : "text-emerald-500")}>
              {diff > 0 ? "+" : ""}{diff.toFixed(1)}
            </span>
          )}
        </p>
      )}
    </Card>
  );
}

function MetricChart({
  data, dataKey, target, color, unit,
}: { data: any[]; dataKey: string; target?: number; color: string; unit: string }) {
  const filtered = data.filter((d) => d[dataKey] != null);
  if (filtered.length < 2) {
    return (
      <Card className="mt-3 p-6 text-center text-sm text-muted-foreground">
        Need at least 2 data points
      </Card>
    );
  }
  return (
    <Card className="mt-3 p-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: any) => [`${v}${unit}`, ""]}
            />
            {target != null && (
              <ReferenceLine y={target} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Goal ${target}${unit}`, fontSize: 10, fill: color, position: "right" }} />
            )}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function GoalSettings({ goals, setGoals }: { goals: ReturnType<typeof useGoals>[0]; setGoals: ReturnType<typeof useGoals>[1] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(goals);

  const num = (v: any) => (v === "" || v == null ? undefined : Number(v));

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(goals); }}>
      <SheetTrigger asChild>
        <Button size="icon" className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Edit Goals</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weekly frequency</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Gym</Label>
                <Input type="number" min={0} value={draft.weeklyGym}
                  onChange={(e) => setDraft({ ...draft, weeklyGym: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PT</Label>
                <Input type="number" min={0} value={draft.weeklyPT}
                  onChange={(e) => setDraft({ ...draft, weeklyPT: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cardio</Label>
                <Input type="number" min={0} value={draft.weeklyCardio}
                  onChange={(e) => setDraft({ ...draft, weeklyCardio: Number(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body composition targets</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Target weight (kg)</Label>
                <Input type="number" step="0.1" value={draft.targetWeightKg ?? ""}
                  onChange={(e) => setDraft({ ...draft, targetWeightKg: num(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target muscle mass (%)</Label>
                <Input type="number" step="0.1" value={draft.targetMuscleMassPct ?? ""}
                  onChange={(e) => setDraft({ ...draft, targetMuscleMassPct: num(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target body fat (%)</Label>
                <Input type="number" step="0.1" value={draft.targetBodyFatPct ?? ""}
                  onChange={(e) => setDraft({ ...draft, targetBodyFatPct: num(e.target.value) })} />
              </div>
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={() => { setGoals(draft); setOpen(false); toast.success("Goals updated"); }}>
            Save goals
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
