import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MealLog } from "@/lib/nutrition";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Shake"] as const;
const MEAL_ICONS: Record<string, string> = {
  Breakfast: "🍳", Lunch: "🥗", Dinner: "🍗", Snack: "🥜", Shake: "🥤",
};

const PORTIONS: { value: number; label: string }[] = [
  { value: 0.25, label: "¼" },
  { value: 0.5, label: "½" },
  { value: 0.75, label: "¾" },
  { value: 1, label: "1" },
  { value: 1.5, label: "1½" },
  { value: 2, label: "2" },
];

const round1 = (n: number) => Math.round(n * 10) / 10;
/** Strip a trailing "× ½" style portion suffix so re-scaling never stacks labels. */
const baseName = (name: string) => name.replace(/\s*×\s*(¼|½|¾|1½|\d+(\.\d+)?)\s*$/u, "").trim();

interface Props {
  log: MealLog | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (log: MealLog) => Promise<unknown>;
}

type NumField = number | "";

/** Edit an already-logged meal: name, type, date, macros and portion fractions. */
export function MealEditSheet({ log, open, onOpenChange, onSave }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("Lunch");
  const [date, setDate] = useState("");
  const [protein, setProtein] = useState<NumField>("");
  const [carbs, setCarbs] = useState<NumField>("");
  const [fat, setFat] = useState<NumField>("");
  const [calories, setCalories] = useState<NumField>("");
  const [portion, setPortion] = useState(1);
  const [saving, setSaving] = useState(false);

  // Snapshot of the meal as it was when the sheet opened — portions scale from here.
  const [base, setBase] = useState<MealLog | null>(null);

  useEffect(() => {
    if (!open || !log) return;
    setBase(log);
    setName(log.mealName);
    setType(log.mealType);
    setDate(log.date);
    setProtein(log.proteinG);
    setCarbs(log.carbsG ?? "");
    setFat(log.fatG ?? "");
    setCalories(log.calories ?? "");
    setPortion(1);
  }, [open, log]);

  const applyPortion = (factor: number) => {
    if (!base) return;
    setPortion(factor);
    const label = PORTIONS.find((p) => p.value === factor)?.label ?? String(factor);
    setName(factor === 1 ? baseName(base.mealName) : `${baseName(base.mealName)} × ${label}`);
    setProtein(round1(base.proteinG * factor));
    setCarbs(base.carbsG == null ? "" : round1(base.carbsG * factor));
    setFat(base.fatG == null ? "" : round1(base.fatG * factor));
    setCalories(base.calories == null ? "" : Math.round(base.calories * factor));
  };

  const save = async () => {
    if (!log) return;
    if (!name.trim()) return toast.error("Enter a meal name");
    if (protein === "" || Number(protein) < 0) return toast.error("Enter protein grams");
    setSaving(true);
    try {
      await onSave({
        ...log,
        date: date || log.date,
        mealName: name.trim(),
        mealType: type,
        proteinG: Number(protein),
        calories: calories === "" ? undefined : Number(calories),
        carbsG: carbs === "" ? undefined : Number(carbs),
        fatG: fat === "" ? undefined : Number(fat),
      });
      toast.success("Meal updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Edit meal</SheetTitle>
          <SheetDescription>Fix the macros or log only a fraction of the portion.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4 pb-4">
          <div className="space-y-1">
            <Label>Meal name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Portion eaten</Label>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {PORTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => applyPortion(p.value)}
                  className={cn(
                    "min-w-11 shrink-0 rounded-lg border py-2 text-sm font-semibold transition-colors",
                    portion === p.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Scales the macros below from the originally logged amount.
            </p>
          </div>

          <div className="space-y-1">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
              <Input type="number" inputMode="decimal" step="0.1" value={protein}
                onChange={(e) => setProtein(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Carbs (g)</Label>
              <Input type="number" inputMode="decimal" step="0.1" value={carbs}
                onChange={(e) => setCarbs(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Fat (g)</Label>
              <Input type="number" inputMode="decimal" step="0.1" value={fat}
                onChange={(e) => setFat(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Calories</Label>
              <Input type="number" inputMode="decimal" value={calories}
                onChange={(e) => setCalories(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <Button onClick={save} disabled={saving} className="w-full" size="lg">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
