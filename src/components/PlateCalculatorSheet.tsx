import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BARS = [
  { label: "Standard (20kg)", value: 20 },
  { label: "Short (15kg)", value: 15 },
  { label: "EZ (10kg)", value: 10 },
  { label: "None (0kg)", value: 0 },
];

const KEY = "gym.plateCalc";

interface Prefs { plates: number[]; bar: number }

const loadPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { plates: ALL_PLATES, bar: 20 };
};

function solve(target: number, bar: number, plates: number[]) {
  const perSide = (target - bar) / 2;
  if (perSide <= 0) return { stack: [] as number[], total: bar };
  const sorted = [...plates].sort((a, b) => b - a);
  const stack: number[] = [];
  let left = perSide;
  for (const p of sorted) {
    while (left >= p - 1e-9) { stack.push(p); left -= p; }
  }
  const total = bar + stack.reduce((a, b) => a + b, 0) * 2;
  return { stack, total };
}

export function PlateCalculatorSheet({
  open,
  onOpenChange,
  targetKg,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetKg: number;
}) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  const { stack, total } = useMemo(
    () => solve(targetKg, prefs.bar, prefs.plates),
    [targetKg, prefs],
  );

  const exact = Math.abs(total - targetKg) < 0.01;

  const togglePlate = (p: number) =>
    setPrefs((s) => ({
      ...s,
      plates: s.plates.includes(p) ? s.plates.filter((x) => x !== p) : [...s.plates, p],
    }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <p className="text-center text-base font-semibold">Plate Calculator</p>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Target Weight: {targetKg}kg
        </p>

        <div className="my-6 flex min-h-[64px] flex-wrap items-center justify-center gap-1.5">
          {stack.length === 0 ? (
            <span className="text-sm text-muted-foreground">Bar only</span>
          ) : (
            stack.map((p, i) => (
              <span key={i}
                className="flex items-center justify-center rounded-sm bg-muted-foreground/80 px-3 font-bold tabular-nums text-background"
                style={{ height: `${28 + p * 1.5}px` }}>
                {p}
              </span>
            ))
          )}
        </div>

        {!exact && (
          <p className="text-center text-sm font-medium text-destructive">
            Closest possible weight is {total}kg
          </p>
        )}

        <p className="mt-6 text-sm font-semibold text-muted-foreground">Available Equipment</p>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm">Plates (kg)</span>
          <div className="flex flex-1 flex-wrap gap-2">
            {ALL_PLATES.map((p) => {
              const on = prefs.plates.includes(p);
              return (
                <button key={p} type="button" onClick={() => togglePlate(p)}
                  className={cn(
                    "h-11 w-11 rounded-full text-sm font-semibold tabular-nums transition-colors",
                    on ? "bg-gym text-module-foreground" : "bg-muted text-muted-foreground",
                  )}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 pb-4">
          <span className="w-24 shrink-0 text-sm">Bar (kg)</span>
          <div className="flex flex-1 flex-wrap gap-2">
            {BARS.map((b) => (
              <button key={b.value} type="button"
                onClick={() => setPrefs((s) => ({ ...s, bar: b.value }))}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                  prefs.bar === b.value ? "bg-gym text-module-foreground" : "bg-muted text-muted-foreground",
                )}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
