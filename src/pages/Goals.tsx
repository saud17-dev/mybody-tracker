import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Plus, Settings as SettingsIcon, Dumbbell, HeartPulse, Activity, Scale, TrendingUp, TrendingDown, Minus, Trash2, BarChart3, Sparkles, Target, CalendarDays, ChevronRight, Coffee, Pencil,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGymSessions, usePTSessions, useCardioSessions, useBodyMetrics, useGoals, useProfile,
  usePlanSchedule, useWorkoutTemplates,
} from "@/lib/cloud";
import { usePlanSkips } from "@/lib/planSkips";
import { useWeeklyCounts, useTwoWeekMuscleVolume, useLastWeekSessions, useBodyTrends, type MetricTrend } from "@/lib/stats";
import { toDisplay, fromInput, formatWeight } from "@/lib/units";
import type { Goals } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MetricsImportWizard } from "@/components/MetricsImportWizard";
import { MonthlyActivityCalendar } from "@/components/MonthlyActivityCalendar";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

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
        {current}<span className="text-base font-normal text-muted-foreground">/{target}</span>
      </p>
      <Progress value={pct} className={cn("mt-2 h-1.5", s.bar)} />
    </Card>
  );
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const { sessions: gym } = useGymSessions();
  const { sessions: pt } = usePTSessions();
  const { sessions: cardio } = useCardioSessions();
  const { metrics, create: createMetric, remove: removeMetric } = useBodyMetrics();
  const { goals, save: saveGoals } = useGoals();
  const { profile } = useProfile();
  const unit = profile?.unit ?? "kg";

  const weekly = useWeeklyCounts(gym, pt, cardio);
  const muscleVolume = useWeeklyMuscleVolume(gym);
  const streaks = useWorkoutStreaks(gym, pt, cardio);

  const trends = useBodyTrends(metrics, goals);

  const [metricOpen, setMetricOpen] = useState(false);
  const [weight, setWeight] = useState<number | "">("");
  const [muscle, setMuscle] = useState<number | "">("");
  const [bodyFat, setBodyFat] = useState<number | "">("");

  const addMetric = async () => {
    if (weight === "" && muscle === "" && bodyFat === "") return toast.error("Enter at least one value");
    try {
      await createMetric({
        date: new Date().toISOString(),
        weightKg: weight === "" ? undefined : fromInput(Number(weight), unit),
        muscleMassPct: muscle === "" ? undefined : Number(muscle),
        bodyFatPct: bodyFat === "" ? undefined : Number(bodyFat),
      });
      setWeight(""); setMuscle(""); setBodyFat("");
      setMetricOpen(false);
      toast.success("Measurement added");
    } catch (e: any) { toast.error(e.message); }
  };

  const sortedMetrics = useMemo(
    () => [...metrics].sort((a, b) => a.date.localeCompare(b.date)),
    [metrics],
  );
  const chartData = useMemo(
    () => sortedMetrics.map((m) => ({
      date: format(parseISO(m.date), "MMM d"),
      weight: toDisplay(m.weightKg, unit) ?? null,
      muscle: m.muscleMassPct ?? null,
      bodyFat: m.bodyFatPct ?? null,
    })),
    [sortedMetrics, unit],
  );
  const latest = sortedMetrics[sortedMetrics.length - 1];
  const targetWeightDisp = toDisplay(goals.targetWeightKg, unit);

  return (
    <AppShell title="Your Goals" subtitle={format(new Date(), "EEEE, MMM d")} accent="primary"
      right={
        <div className="flex gap-2">
          <Button size="icon" className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={() => navigate("/settings")} aria-label="Settings">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      }>
      <section>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">This week</h2>
        <div className="grid grid-cols-3 gap-3">
          <GoalRing label="Gym" current={weekly.gym} target={goals.weeklyGym} variant="gym" Icon={Dumbbell} />
          <GoalRing label="PT" current={weekly.pt} target={goals.weeklyPT} variant="pt" Icon={HeartPulse} />
          <GoalRing label="Cardio" current={weekly.cardio} target={goals.weeklyCardio} variant="cardio" Icon={Activity} />
        </div>
      </section>

      {/* Edit goals */}
      <div className="mt-4 px-1">
        <GoalEditor goals={goals} unit={unit} onSave={async (g) => { await saveGoals(g); toast.success("Goals updated"); }} />
      </div>

      {/* Streaks */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Flame className="h-3.5 w-3.5" /> Streaks
          </h2>
          {streaks.any.current > 0 && (
            <span className="text-[11px] font-semibold text-primary">
              🔥 {streaks.any.current}-day overall
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StreakCard label="Gym" streak={streaks.gym} variant="gym" Icon={Dumbbell} />
          <StreakCard label="PT" streak={streaks.pt} variant="pt" Icon={HeartPulse} />
          <StreakCard label="Cardio" streak={streaks.cardio} variant="cardio" Icon={Activity} />
        </div>
      </section>

      {/* Monthly activity calendar */}
      <section className="mt-7">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">This month</h2>
        <MonthlyActivityCalendar gym={gym} pt={pt} cardio={cardio} />
      </section>

      {/* Weekly volume by muscle group */}
      {muscleVolume.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> Volume by muscle (this week)
          </h2>
          <Card className="p-3">
            <div className="h-56 w-full">
              <ResponsiveContainer>
                <BarChart data={muscleVolume.map((v) => ({
                  group: v.group,
                  volume: Math.round(toDisplay(v.volume, unit) ?? 0),
                  sets: v.sets,
                }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="group" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, name: string) => [name === "volume" ? `${v} ${unit}` : `${v} sets`, ""]}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--gym))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-center text-[10px] text-muted-foreground">Total weekly tonnage by muscle</p>
          </Card>
        </section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Body composition</h2>
          <Sheet open={metricOpen} onOpenChange={setMetricOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary">
                <Plus className="h-4 w-4" /> Log
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader><SheetTitle>Add measurement</SheetTitle></SheetHeader>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label>Weight ({unit})</Label>
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
            <BodyStat label="Weight" unit={unit} currentDisp={toDisplay(latest.weightKg, unit)} targetDisp={targetWeightDisp} Icon={Scale} />
            <BodyStat label="Muscle" unit="%" currentDisp={latest.muscleMassPct} targetDisp={goals.targetMuscleMassPct} Icon={TrendingUp} />
            <BodyStat label="Body fat" unit="%" currentDisp={latest.bodyFatPct} targetDisp={goals.targetBodyFatPct} Icon={TrendingUp} />
          </div>
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">No measurements yet. Tap "Log" to add one.</Card>
        )}
      </section>

      {(trends.weight.latest != null || trends.muscle.latest != null || trends.bodyFat.latest != null) && (
        <section className="mt-7">
          <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Trend insights
          </h2>
          <div className="space-y-2">
            <TrendInsightCard
              label="Weight"
              trend={trends.weight}
              unit={unit}
              targetDisp={targetWeightDisp}
              displayValue={(v) => toDisplay(v, unit) ?? v}
              lowerIsBetter
              Icon={Scale}
              accent="text-primary"
            />
            <TrendInsightCard
              label="Muscle mass"
              trend={trends.muscle}
              unit="%"
              targetDisp={goals.targetMuscleMassPct}
              displayValue={(v) => v}
              Icon={TrendingUp}
              accent="text-gym"
            />
            <TrendInsightCard
              label="Body fat"
              trend={trends.bodyFat}
              unit="%"
              targetDisp={goals.targetBodyFatPct}
              displayValue={(v) => v}
              lowerIsBetter
              Icon={TrendingDown}
              accent="text-cardio"
            />
          </div>
        </section>
      )}

      {chartData.length >= 2 && (
        <section className="mt-7">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</h2>
          <Tabs defaultValue="weight">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="muscle">Muscle</TabsTrigger>
              <TabsTrigger value="bodyFat">Body fat</TabsTrigger>
            </TabsList>
            <TabsContent value="weight">
              <MetricChart data={chartData} dataKey="weight" target={targetWeightDisp} color="hsl(var(--primary))" unit={unit} />
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
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent measurements</h2>
          <div className="space-y-2">
            {[...metrics].slice(0, 6).map((m) => (
              <Card key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{format(parseISO(m.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      m.weightKg != null && formatWeight(m.weightKg, unit, 1),
                      m.muscleMassPct != null && `${m.muscleMassPct}% muscle`,
                      m.bodyFatPct != null && `${m.bodyFatPct}% fat`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button onClick={() => removeMetric(m.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bulk import measurements
        </h2>
        <MetricsImportWizard
          templateUrl="/templates/body-metrics-template.csv"
          templateFilename="body-metrics-template.csv"
          onConfirm={async (rows) => {
            const existing = new Set(metrics.map((m) => m.date.slice(0, 10)));
            for (const r of rows) {
              if (existing.has(r.date.slice(0, 10))) continue;
              await createMetric({
                date: r.date,
                weightKg: r.weightKg,
                muscleMassPct: r.muscleMassPct,
                bodyFatPct: r.bodyFatPct,
              });
            }
          }}
        />
      </section>
    </AppShell>
  );
}

function BodyStat({
  label, unit, currentDisp, targetDisp, Icon,
}: { label: string; unit: string; currentDisp?: number; targetDisp?: number; Icon: React.ComponentType<{ className?: string }> }) {
  const diff = currentDisp != null && targetDisp != null ? currentDisp - targetDisp : null;
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">
        {currentDisp != null ? currentDisp.toFixed(1).replace(/\.0$/, "") : "—"}
        {currentDisp != null && <span className="text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
      {targetDisp != null && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Goal: {targetDisp.toFixed(1).replace(/\.0$/, "")}{unit}
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

function MetricChart({ data, dataKey, target, color, unit }:
  { data: any[]; dataKey: string; target?: number; color: string; unit: string }) {
  const filtered = data.filter((d) => d[dataKey] != null);
  if (filtered.length < 2) {
    return <Card className="mt-3 p-6 text-center text-sm text-muted-foreground">Need at least 2 data points</Card>;
  }
  return (
    <Card className="mt-3 p-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: any) => [`${v}${unit}`, ""]} />
            {target != null && (
              <ReferenceLine y={target} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5}
                label={{ value: `Goal ${target}${unit}`, fontSize: 10, fill: color, position: "right" }} />
            )}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function GoalEditor({ goals, unit, onSave }: { goals: Goals; unit: "kg" | "lbs"; onSave: (g: Goals) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(goals);

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(goals); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <SettingsIcon className="h-4 w-4 mr-1" /> Edit weekly targets & body goals
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>Edit Goals</SheetTitle></SheetHeader>
        <div className="mt-5 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weekly frequency</p>
            <div className="grid grid-cols-3 gap-3">
              {(["weeklyGym","weeklyPT","weeklyCardio"] as const).map((k, i) => (
                <div key={k} className="space-y-1">
                  <Label className="text-xs">{["Gym","PT","Cardio"][i]}</Label>
                  <Input type="number" min={0} value={draft[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) || 0 })} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body composition targets</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Target weight ({unit})</Label>
                <Input type="number" step="0.1" value={toDisplay(draft.targetWeightKg, unit) ?? ""}
                  onChange={(e) => setDraft({
                    ...draft,
                    targetWeightKg: e.target.value === "" ? undefined : fromInput(Number(e.target.value), unit),
                  })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target muscle mass (%)</Label>
                <Input type="number" step="0.1" value={draft.targetMuscleMassPct ?? ""}
                  onChange={(e) => setDraft({ ...draft, targetMuscleMassPct: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target body fat (%)</Label>
                <Input type="number" step="0.1" value={draft.targetBodyFatPct ?? ""}
                  onChange={(e) => setDraft({ ...draft, targetBodyFatPct: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={async () => { await onSave(draft); setOpen(false); }}>
            Save goals
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TrendInsightCard({
  label, trend, unit, targetDisp, displayValue, lowerIsBetter, Icon, accent,
}: {
  label: string;
  trend: MetricTrend;
  unit: string;
  targetDisp?: number;
  displayValue: (v: number) => number;
  lowerIsBetter?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  if (trend.latest == null) {
    return (
      <Card className="flex items-center gap-3 px-4 py-3">
        <Icon className={cn("h-4 w-4", accent)} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">No data yet</p>
        </div>
      </Card>
    );
  }

  const fmt = (v: number, dec = 1) => v.toFixed(dec).replace(/\.0$/, "");
  const renderChange = (change?: number, pct?: number) => {
    if (change == null) return <span className="text-muted-foreground">—</span>;
    const isFlat = Math.abs(change) < 0.05;
    const ArrowIcon = isFlat ? Minus : change > 0 ? TrendingUp : TrendingDown;
    const good = lowerIsBetter ? change < 0 : change > 0;
    const cls = isFlat ? "text-muted-foreground" : good ? "text-emerald-500" : "text-destructive";
    const dispChange = displayValue(Math.abs(change));
    return (
      <span className={cn("inline-flex items-center gap-0.5 font-semibold tabular-nums", cls)}>
        <ArrowIcon className="h-3 w-3" />
        {change > 0 ? "+" : change < 0 ? "−" : ""}{fmt(dispChange)}{unit}
        {pct != null && !isFlat && <span className="ml-0.5 opacity-70">({pct > 0 ? "+" : ""}{fmt(pct)}%)</span>}
      </span>
    );
  };

  const targetProgress = trend.targetPct != null ? Math.round(trend.targetPct) : null;
  const distance = trend.toTarget != null ? displayValue(Math.abs(trend.toTarget)) : null;
  const atTarget = trend.toTarget != null && Math.abs(trend.toTarget) < 0.5;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", accent)} />
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {fmt(displayValue(trend.latest))}{unit} <span className="opacity-50">now</span>
            </p>
          </div>
        </div>
        {trend.onTrack != null && targetDisp != null && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            atTarget ? "bg-primary/15 text-primary" :
            trend.onTrack ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/10 text-destructive",
          )}>
            {atTarget ? "At target" : trend.onTrack ? "On track" : "Off track"}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">7-day</p>
          <p className="mt-0.5">{renderChange(trend.weekChange, trend.weekPctChange)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">30-day</p>
          <p className="mt-0.5">{renderChange(trend.monthChange, trend.monthPctChange)}</p>
        </div>
      </div>

      {targetDisp != null && targetProgress != null && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" /> Goal {fmt(targetDisp)}{unit}
            </span>
            <span className="font-semibold tabular-nums">
              {atTarget ? "Reached 🎉" : `${distance != null ? fmt(distance) + unit : ""} to go`}
            </span>
          </div>
          <Progress value={targetProgress} className="h-1.5" />
        </div>
      )}
    </Card>
  );
}


function StreakCard({
  label, streak, variant, Icon,
}: {
  label: string;
  streak: ModuleStreak;
  variant: "gym" | "pt" | "cardio";
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const variantStyle = {
    gym: { bg: "bg-gym/10", text: "text-gym" },
    pt: { bg: "bg-pt/10", text: "text-pt" },
    cardio: { bg: "bg-cardio/10", text: "text-cardio" },
  }[variant];
  const hasData = streak.totalActiveDays > 0;
  return (
    <Card className="flex flex-col items-center gap-1.5 p-3 text-center">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", variantStyle.bg)}>
        <Icon className={cn("h-4 w-4", variantStyle.text)} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold leading-none">{streak.current}</span>
        <span className="text-[10px] text-muted-foreground">day{streak.current === 1 ? "" : "s"}</span>
      </div>
      {hasData ? (
        <div className="mt-1 w-full space-y-0.5 text-[10px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1"><Flame className="h-2.5 w-2.5" /> Best</span>
            <span className="font-semibold text-foreground">{streak.best}d</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1"><CalendarX className="h-2.5 w-2.5" /> Longest off</span>
            <span className="font-semibold text-foreground">{streak.longestGap}d</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last</span>
            <span className="font-semibold text-foreground">
              {streak.lastSessionDaysAgo === 0 ? "Today" :
               streak.lastSessionDaysAgo === 1 ? "1d ago" :
               `${streak.lastSessionDaysAgo}d ago`}
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-[10px] italic text-muted-foreground">No sessions yet</p>
      )}
    </Card>
  );
}
