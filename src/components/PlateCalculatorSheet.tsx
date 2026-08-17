import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    if (raw) {
      const p = JSON.parse(raw) as Prefs;
      const plates = Array.isArray(p?.plates)
        ? p.plates.filter((x) => ALL_PLATES.includes(x))
        : [];
      const bar = BARS.some((b) => b.value === p?.bar) ? p.bar : 20;
      return { plates: plates.length ? plates : ALL_PLATES, bar };
    }
  } catch { /* ignore */ }
  return { plates: ALL_PLATES, bar: 20 };
};

function solve(target: number, bar: number, plates: number[]) {
  const perSide = (target - bar) / 2;
  if (!(perSide > 0)) return { stack: [] as number[], total: bar };
  const sorted = [...plates].sort((a, b) => b - a);
  const stack: number[] = [];
  let left = perSide;
  for (const p of sorted) {
    while (left >= p - 1e-9) { stack.push(p); left -= p; }
  }
  const total = bar + stack.reduce((a, b) => a + b, 0) * 2;
  return { stack, total: Math.round(total * 100) / 100 };
}

export function PlateCalculatorSheet({
  open,
  onOpenChange,
  targetKg,
  onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetKg: number;
  onApply?: (kg: number) => void;
}) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [target, setTarget] = useState<string>(String(targetKg || ""));

  useEffect(() => {
    if (open) setTarget(targetKg ? String(targetKg) : "");
  }, [open, targetKg]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  const targetNum = Number(target) || 0;

  const { stack, total } = useMemo(
    () => solve(targetNum, prefs.bar, prefs.plates),
    [targetNum, prefs],
  );

  const exact = targetNum > 0 && Math.abs(total - targetNum) < 0.01;

  const bump = (delta: number) =>
    setTarget(String(Math.max(0, Math.round(((Number(target) || 0) + delta) * 100) / 100)));

  const togglePlate = (p: number) =>
    setPrefs((s) => {
      const next = s.plates.includes(p) ? s.plates.filter((x) => x !== p) : [...s.plates, p];
      return { ...s, plates: next.length ? next : ALL_PLATES };
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <p className="text-center text-base font-semibold">Plate Calculator</p>

        <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => bump(-2.5)} aria-label="Decrease 2.5kg">
            <Minus className="h-4 w-4" />
          </Button>
          <div className="relative flex-1">
            <Input
              type="text" inputMode="decimal" value={target} placeholder="0"
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                if (v === "" || /^\d*\.?\d{0,3}$/.test(v)) setTarget(v);
              }}
              className="h-12 pr-10 text-center text-lg font-bold tabular-nums" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
          </div>
          <Button variant="secondary" size="icon" onClick={() => bump(2.5)} aria-label="Increase 2.5kg">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mx-auto mt-2 flex max-w-xs justify-center gap-2">
          {[-5, -1.25, 1.25, 5].map((d) => (
            <button key={d} type="button" onClick={() => bump(d)}
              className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

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

        <p className="text-center text-sm text-muted-foreground">
          Per side · Bar {prefs.bar}kg · Total <span className="font-semibold text-foreground tabular-nums">{total}kg</span>
        </p>
        {!exact && targetNum > 0 && (
          <p className="mt-1 text-center text-sm font-medium text-warning">
            Closest possible weight is {total}kg
          </p>
        )}

        {onApply && (
          <Button className="mt-4 w-full" size="lg"
            onClick={() => { onApply(total); onOpenChange(false); }}>
            Apply {total}kg to set
          </Button>
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
