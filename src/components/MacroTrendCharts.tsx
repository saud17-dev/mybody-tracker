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
    const firstWeek = startOfWeek(addWeeks(new Date(), -(weeks - 1)), { weekStartsOn: 6 });
    const buckets: WeekPoint[] = [];
    for (let i = 0; i < weeks; i++) {
      const start = addWeeks(firstWeek, i);
      const inWeek = logs.filter((l) => {
        const d = new Date(`${l.date}T00:00:00`);
        return isSameWeek(d, start, { weekStartsOn: 6 });
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

  const charts: { key: keyof WeekPoint; title: string; unit: string; color: string; target?: number }[] = [
    { key: "protein", title: "Protein", unit: "g", color: "hsl(var(--primary))", target: goal?.dailyProteinG },
    { key: "carbs", title: "Carbs", unit: "g", color: "hsl(var(--gym))", target: goal?.dailyCarbsG },
    { key: "fat", title: "Fat", unit: "g", color: "hsl(var(--pt))", target: goal?.dailyFatG },
    { key: "calories", title: "Calories", unit: "kcal", color: "hsl(var(--accent))", target: goal?.dailyCalories },
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
        <MacroChart key={c.key} data={data} {...c} />
      ))}
    </div>
  );
}

function MacroChart({
  data, dataKey, title, unit, color, target,
}: { data: WeekPoint[]; dataKey?: never; title: string; unit: string; color: string; target?: number } & {
  key?: string;
} & { [k: string]: any }) {
  const field = arguments[0].key as keyof WeekPoint;
  return null;
}
