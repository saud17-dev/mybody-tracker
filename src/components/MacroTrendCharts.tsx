import { useMemo } from "react";
import { format, startOfWeek, addWeeks, isSameWeek } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, ReferenceLine } from "recharts";
import type { MealLog, NutritionGoal } from "@/lib/nutrition";
import { macrosFor } from "@/lib/mealLibrary";

interface Props {
  logs: MealLog[];
  goal?: NutritionGoal;
  weeks?: number;
  className?: string;
}

interface WeekPoint {
  label: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  days: number;
}

/** Fill in carbs/fat with the same estimate the library uses, so older logs still chart. */
function macrosOf(l: MealLog) {
  const est = macrosFor({ proteinG: l.proteinG, calories: l.calories ?? 0, carbsG: l.carbsG, fatG: l.fatG });
  return { protein: l.proteinG, calories: l.calories ?? 0, carbs: est.carbsG, fat: est.fatG };
}

/** Weekly average-per-day macro trends (protein, carbs, fat, calories). */
export function MacroTrendCharts({ logs, goal, weeks = 8, className }: Props) {
  const data = useMemo<WeekPoint[]>(() => {
    const firstWeek = startOfWeek(addWeeks(new Date(), -(weeks - 1)), { weekStartsOn: 0 });
    const buckets: WeekPoint[] = [];
    for (let i = 0; i < weeks; i++) {
      const start = addWeeks(firstWeek, i);
      const inWeek = logs.filter((l) => {
        const d = new Date(`${l.date}T00:00:00`);
        return isSameWeek(d, start, { weekStartsOn: 0 });
      });
      const dayCount = new Set(inWeek.map((l) => l.date)).size || 1;
      const sum = inWeek.reduce(
        (acc, l) => {
          const m = macrosOf(l);
          acc.protein += m.protein;
          acc.carbs += m.carbs;
          acc.fat += m.fat;
          acc.calories += m.calories;
          return acc;
        },
        { protein: 0, carbs: 0, fat: 0, calories: 0 },
      );
      buckets.push({
        label: format(start, "MMM d"),
        days: inWeek.length ? dayCount : 0,
        protein: Math.round(sum.protein / dayCount),
        carbs: Math.round(sum.carbs / dayCount),
        fat: Math.round(sum.fat / dayCount),
        calories: Math.round(sum.calories / dayCount),
      });
    }
    return buckets;
  }, [logs, weeks]);

  const hasData = data.some((d) => d.days > 0);

  const charts: { field: "protein" | "carbs" | "fat" | "calories"; title: string; unit: string; color: string; target?: number }[] = [
    { field: "protein", title: "Protein", unit: "g", color: "hsl(var(--primary))", target: goal?.dailyProteinG },
    { field: "carbs", title: "Carbs", unit: "g", color: "hsl(var(--gym))", target: goal?.dailyCarbsG },
    { field: "fat", title: "Fat", unit: "g", color: "hsl(var(--pt))", target: goal?.dailyFatG },
    { field: "calories", title: "Calories", unit: "kcal", color: "hsl(var(--accent))", target: goal?.dailyCalories },
  ];

  if (!hasData) {
    return (
      <Card className={cn("p-6 text-center text-sm text-muted-foreground", className)}>
        Log a few meals and your weekly macro trends will show up here.
      </Card>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {charts.map((c) => (
        <MacroChart key={c.field} data={data} {...c} />
      ))}
    </div>
  );
}

function MacroChart({
  data, field, title, unit, color, target,
}: {
  data: WeekPoint[];
  field: "protein" | "carbs" | "fat" | "calories";
  title: string;
  unit: string;
  color: string;
  target?: number;
}) {
  const withData = data.filter((d) => d.days > 0);
  const current = withData.at(-1)?.[field] ?? 0;
  const previous = withData.at(-2)?.[field];
  const delta = previous != null && previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  const TrendIcon = delta == null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const gradId = `macro-grad-${field}`;

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums" style={{ color }}>
            {current}
            <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}/day</span>
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            delta == null || delta === 0
              ? "bg-muted text-muted-foreground"
              : delta > 0
                ? "bg-primary/15 text-primary"
                : "bg-destructive/15 text-destructive",
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
        </span>
      </div>

      <div className="mt-2 h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(v: any) => [`${v} ${unit}/day`, title]}
              labelFormatter={(l) => `Week of ${l}`}
            />
            {target ? (
              <ReferenceLine y={target} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            ) : null}
            <Area
              type="monotone"
              dataKey={field}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={{ r: 2, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

