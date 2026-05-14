import { useState, useMemo } from "react";
import { format, parseISO, startOfWeek, isWithinInterval, endOfWeek } from "date-fns";
import { Plus, Trash2, UtensilsCrossed, Flame, ChevronDown, ChevronUp, Zap, BookOpen } from "lucide-react";
import { MealLibrarySheet } from "@/components/MealLibrarySheet";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useMealLogs, useMealPresets, useNutritionGoal } from "@/lib/nutrition";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

// ── Color token for nutrition (amber/yellow)
// Add to your index.css: --nutrition: 38 95% 50%;
// We'll use accent as fallback here

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Shake"] as const;
type MealType = typeof MEAL_TYPES[number];

const MEAL_ICONS: Record<MealType, string> = {
  Breakfast: "🍳",
  Lunch: "🥗",
  Dinner: "🍗",
  Snack: "🥜",
  Shake: "🥤",
};

export default function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { logs, loading, create: createLog, remove: removeLog } = useMealLogs();
  const { presets, addPreset, removePreset } = useMealPresets();
  const { goal, save: saveGoal } = useNutritionGoal();

  const [logOpen, setLogOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Log form state
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType>("Lunch");
  const [protein, setProtein] = useState<number | "">("");
  const [calories, setCalories] = useState<number | "">("");

  // Preset form state
  const [presetName, setPresetName] = useState("");
  const [presetType, setPresetType] = useState<MealType>("Lunch");
  const [presetProtein, setPresetProtein] = useState<number | "">("");
  const [presetCalories, setPresetCalories] = useState<number | "">("");

  // Goal form state
  const [draftProtein, setDraftProtein] = useState(goal.dailyProteinG);
  const [draftCalories, setDraftCalories] = useState(goal.dailyCalories);

  // Today's logs
  const todayLogs = useMemo(
    () => logs.filter((l) => l.date === today),
    [logs, today]
  );

  // Weekly data for chart
  const weeklyData = useMemo(() => {
    const days: { date: string; label: string; protein: number; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLogs = logs.filter((l) => l.date === dateStr);
      days.push({
        date: dateStr,
        label: format(d, "EEE"),
        protein: dayLogs.reduce((s, l) => s + l.proteinG, 0),
        calories: dayLogs.reduce((s, l) => s + (l.calories ?? 0), 0),
      });
    }
    return days;
  }, [logs]);

  const todayProtein = todayLogs.reduce((s, l) => s + l.proteinG, 0);
  const todayCalories = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const proteinPct = goal.dailyProteinG > 0 ? Math.min(100, (todayProtein / goal.dailyProteinG) * 100) : 0;
  const calPct = goal.dailyCalories && goal.dailyCalories > 0 ? Math.min(100, (todayCalories / goal.dailyCalories) * 100) : 0;
  const proteinRemaining = Math.max(0, goal.dailyProteinG - todayProtein);

  const weekAvgProtein = useMemo(() => {
    const days = weeklyData.filter((d) => d.protein > 0);
    return days.length > 0 ? Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length) : 0;
  }, [weeklyData]);

  const logMeal = async (
    name: string,
    type: MealType,
    prot: number | "",
    cal: number | ""
  ) => {
    if (!name.trim()) return toast.error("Enter a meal name");
    if (prot === "" || prot <= 0) return toast.error("Enter protein grams");
    try {
      await createLog({
        date: today,
        mealName: name.trim(),
        mealType: type,
        proteinG: Number(prot),
        calories: cal === "" ? undefined : Number(cal),
      });
      toast.success("Meal logged");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleLogSubmit = async () => {
    await logMeal(mealName, mealType, protein, calories);
    setMealName(""); setProtein(""); setCalories("");
    setLogOpen(false);
  };

  const handlePresetTap = async (p: typeof presets[0]) => {
    await logMeal(p.name, p.mealType as MealType, p.proteinG, p.calories ?? "");
    toast.success(`${p.name} logged`);
  };

  const handleAddPreset = async () => {
    if (!presetName.trim()) return toast.error("Enter a name");
    if (presetProtein === "" || presetProtein <= 0) return toast.error("Enter protein grams");
    try {
      await addPreset({
        name: presetName.trim(),
        mealType: presetType,
        proteinG: Number(presetProtein),
        calories: presetCalories === "" ? undefined : Number(presetCalories),
      });
      setPresetName(""); setPresetProtein(""); setPresetCalories("");
      toast.success("Preset saved");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const mealTypeGroups = useMemo(() => {
    const groups: Record<string, typeof todayLogs> = {};
    for (const log of todayLogs) {
      if (!groups[log.mealType]) groups[log.mealType] = [];
      groups[log.mealType].push(log);
    }
    return groups;
  }, [todayLogs]);

  return (
    <AppShell
      title="Nutrition"
      subtitle={format(new Date(), "EEEE, MMM d")}
      accent="primary"
      right={
        <Button
          size="icon"
          className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25"
          onClick={() => { setDraftProtein(goal.dailyProteinG); setDraftCalories(goal.dailyCalories); setGoalOpen(true); }}
          aria-label="Edit goal"
        >
          <Zap className="h-5 w-5" />
        </Button>
      }
    >
      {/* ── Daily summary cards */}
      <section>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Protein card */}
          <Card className="p-4 col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{Math.round(proteinPct)}%</span>
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Protein</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {Math.round(todayProtein)}
              <span className="text-base font-normal text-muted-foreground">/{goal.dailyProteinG}g</span>
            </p>
            <Progress value={proteinPct} className="mt-2 h-2 [&>div]:bg-primary" />
            {proteinRemaining > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{Math.round(proteinRemaining)}g</span> to go
              </p>
            )}
            {proteinRemaining === 0 && todayProtein > 0 && (
              <p className="mt-1.5 text-xs font-semibold text-primary">Target hit 🎉</p>
            )}
          </Card>

          {/* Calories card (optional) */}
          {goal.dailyCalories && goal.dailyCalories > 0 ? (
            <Card className="p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                <Flame className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Calories</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {Math.round(todayCalories)}
                <span className="text-xs font-normal text-muted-foreground">/{goal.dailyCalories}</span>
              </p>
              <Progress value={calPct} className="mt-2 h-1.5 [&>div]:bg-accent" />
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-4 text-center">
              <Flame className="h-5 w-5 text-muted-foreground/40" />
              <p className="mt-1 text-xs text-muted-foreground">No calorie goal set</p>
            </Card>
          )}

          {/* Week avg card */}
          <Card className="p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gym/10">
              <Flame className="h-4 w-4 text-gym" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">7-day avg</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {weekAvgProtein}<span className="text-xs font-normal text-muted-foreground">g</span>
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">protein / day</p>
          </Card>
        </div>
      </section>

      {/* ── Quick-add presets */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick add</h2>
          <Sheet open={presetOpen} onOpenChange={setPresetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary">
                <Plus className="h-4 w-4" /> Preset
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader><SheetTitle>New preset meal</SheetTitle></SheetHeader>
              <div className="mt-5 space-y-4">
                <div className="space-y-1">
                  <Label>Meal name</Label>
                  <Input placeholder="e.g. Chicken + rice" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_TYPES.map((t) => (
                      <button key={t}
                        onClick={() => setPresetType(t)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          presetType === t ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {MEAL_ICONS[t]} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Protein (g)</Label>
                    <Input type="number" inputMode="decimal" value={presetProtein}
                      onChange={(e) => setPresetProtein(e.target.value === "" ? "" : Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Calories (optional)</Label>
                    <Input type="number" inputMode="decimal" value={presetCalories}
                      onChange={(e) => setPresetCalories(e.target.value === "" ? "" : Number(e.target.value))} />
                  </div>
                </div>
                <Button onClick={handleAddPreset} className="w-full" size="lg">Save preset</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {presets.length === 0 ? (
          <Card className="p-5 text-center text-sm text-muted-foreground">
            No presets yet. Add your regular meals for one-tap logging.
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <Card
                key={p.id}
                className="group relative flex cursor-pointer flex-col gap-0.5 p-3 transition-colors hover:border-primary/40 active:scale-[.98]"
                onClick={() => handlePresetTap(p)}
              >
                <span className="text-base">{MEAL_ICONS[p.mealType as MealType] ?? "🍽️"}</span>
                <p className="mt-1 text-sm font-semibold leading-tight">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.proteinG}g protein{p.calories ? ` · ${p.calories} kcal` : ""}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); removePreset(p.id); }}
                  className="absolute right-2 top-2 hidden text-muted-foreground hover:text-destructive group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Log a custom meal */}
      <section className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" size="lg" onClick={() => setLibraryOpen(true)}>
          <BookOpen className="mr-2 h-4 w-4" /> Library
        </Button>
        <Sheet open={logOpen} onOpenChange={setLogOpen}>
          <SheetTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" /> Log meal
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader><SheetTitle>Log meal</SheetTitle></SheetHeader>
            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <Label>Meal name</Label>
                <Input placeholder="e.g. Grilled salmon" value={mealName} onChange={(e) => setMealName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPES.map((t) => (
                    <button key={t}
                      onClick={() => setMealType(t)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        mealType === t ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {MEAL_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Protein (g)</Label>
                  <Input type="number" inputMode="decimal" step="1" value={protein}
                    onChange={(e) => setProtein(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Calories (optional)</Label>
                  <Input type="number" inputMode="decimal" step="1" value={calories}
                    onChange={(e) => setCalories(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={handleLogSubmit} className="w-full" size="lg">Save</Button>
            </div>
          </SheetContent>
        </Sheet>
      </section>

      {/* ── Today's log */}
      {todayLogs.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's meals</h2>
          <div className="space-y-2">
            {(Object.entries(mealTypeGroups) as [MealType, typeof todayLogs][]).map(([type, entries]) => (
              <div key={type}>
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {MEAL_ICONS[type]} {type}
                </p>
                {entries.map((log) => (
                  <Card key={log.id} className="mb-1.5 flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{log.mealName}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">{log.proteinG}g</span> protein
                        {log.calories ? ` · ${log.calories} kcal` : ""}
                      </p>
                    </div>
                    <button onClick={() => removeLog(log.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Weekly chart */}
      <section className="mt-7">
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">This week</h2>
        <Card className="p-3">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [`${v}g`, "Protein"]}
                />
                {goal.dailyProteinG > 0 && (
                  <ReferenceLine y={goal.dailyProteinG} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: `Goal ${goal.dailyProteinG}g`, fontSize: 10, fill: "hsl(var(--primary))", position: "right" }} />
                )}
                <Bar dataKey="protein" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-[10px] text-muted-foreground">Daily protein (g)</p>
        </Card>
      </section>

      {/* ── History */}
      {logs.length > 0 && (
        <section className="mt-7">
          <button
            onClick={() => setHistoryExpanded((v) => !v)}
            className="mb-3 flex w-full items-center justify-between px-1"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
            {historyExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {historyExpanded && (
            <div className="space-y-1.5">
              {[...new Set(logs.map((l) => l.date))].slice(0, 14).map((date) => {
                const dayLogs = logs.filter((l) => l.date === date);
                const dayProtein = dayLogs.reduce((s, l) => s + l.proteinG, 0);
                const dayCalories = dayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
                const hitTarget = dayProtein >= goal.dailyProteinG;
                return (
                  <Card key={date} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{format(parseISO(date), "EEE, MMM d")}</p>
                      <p className="text-xs text-muted-foreground">
                        {dayLogs.length} meal{dayLogs.length !== 1 ? "s" : ""}
                        {dayCalories > 0 ? ` · ${dayCalories} kcal` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold tabular-nums", hitTarget ? "text-primary" : "text-foreground")}>
                        {Math.round(dayProtein)}g
                      </p>
                      {hitTarget && <p className="text-[10px] text-primary">✓ goal</p>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Meal library sheet */}
      <MealLibrarySheet
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onPick={(m) => logMeal(m.name, m.mealType, m.proteinG, m.calories)}
      />

      {/* ── Goal editor sheet */}
      <Sheet open={goalOpen} onOpenChange={setGoalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle>Nutrition goals</SheetTitle></SheetHeader>
          <div className="mt-5 space-y-4">
            <div className="space-y-1">
              <Label>Daily protein target (g)</Label>
              <Input type="number" inputMode="decimal" value={draftProtein}
                onChange={(e) => setDraftProtein(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Daily calories target (optional)</Label>
              <Input type="number" inputMode="decimal" value={draftCalories ?? ""}
                onChange={(e) => setDraftCalories(e.target.value === "" ? undefined : Number(e.target.value))} />
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={async () => {
                await saveGoal({ dailyProteinG: draftProtein, dailyCalories: draftCalories });
                toast.success("Goals updated");
                setGoalOpen(false);
              }}
            >
              Save goals
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
