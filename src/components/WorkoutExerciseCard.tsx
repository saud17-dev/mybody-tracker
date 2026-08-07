import { useState } from "react";
import { MoreVertical, Plus, Timer, Check, Trash2, Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GymExerciseEntry, GymSet } from "@/lib/types";

const initials = (name: string) =>
  name.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const restLabel = (s: number) => (s % 60 === 0 ? `${s / 60}min` : s >= 60 ? `${Math.floor(s / 60)}min ${s % 60}s` : `${s}s`);

interface Props {
  ex: GymExerciseEntry;
  unit: string;
  defaultRest: number;
  doneSets: Record<string, boolean>;
  previousLabel: (name: string, idx: number, type?: string) => string;
  displayWeight: (exId: string, i: number, kg: number) => string;
  setWeightDraft: (exId: string, i: number, raw: string) => void;
  onUpdateSet: (exId: string, i: number, patch: Partial<GymSet>) => void;
  onToggleDone: (exId: string, i: number) => void;
  onAddSet: (exId: string) => void;
  onRemoveSet: (exId: string, i: number) => void;
  onRemoveExercise: (exId: string) => void;
  onPatchExercise: (exId: string, patch: Partial<GymExerciseEntry>) => void;
  onPlateCalc: (targetKg: number) => void;
}

export function WorkoutExerciseCard({
  ex, unit, defaultRest, doneSets, previousLabel, displayWeight, setWeightDraft,
  onUpdateSet, onToggleDone, onAddSet, onRemoveSet, onRemoveExercise, onPatchExercise, onPlateCalc,
}: Props) {
  const [editRest, setEditRest] = useState(false);
  const type = ex.exerciseType ?? "weight_reps";
  const rest = ex.restSeconds ?? defaultRest;

  const fields: { key: "weight" | "reps" | "duration" | "distance"; label: string }[] =
    type === "bodyweight_reps" ? [{ key: "reps", label: "Reps" }]
    : type === "weighted_bodyweight" ? [{ key: "weight", label: `+${unit}` }, { key: "reps", label: "Reps" }]
    : type === "assisted_bodyweight" ? [{ key: "weight", label: `-${unit}` }, { key: "reps", label: "Reps" }]
    : type === "duration" ? [{ key: "duration", label: "Time (s)" }]
    : type === "distance_duration" ? [{ key: "distance", label: "Km" }, { key: "duration", label: "Time (s)" }]
    : [{ key: "weight", label: unit.toUpperCase() }, { key: "reps", label: "Reps" }];

  const cols = `1.75rem 4rem ${fields.map(() => "1fr").join(" ")} 2.25rem 1.75rem`;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-3 pt-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gym/15 text-xs font-bold text-gym">
          {initials(ex.exerciseName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gym">{ex.exerciseName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {ex.muscleGroup}{ex.equipment ? ` · ${ex.equipment}` : ""}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Exercise options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditRest(true)}>Set rest timer</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onRemoveExercise(ex.id)}>
              Remove exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input
        value={ex.notes ?? ""}
        onChange={(e) => onPatchExercise(ex.id, { notes: e.target.value })}
        placeholder="Add notes here..."
        className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />

      <div className="flex items-center gap-2 px-3 pb-1">
        <Timer className="h-4 w-4 text-gym" />
        {editRest ? (
          <div className="flex items-center gap-1">
            <Input type="number" inputMode="numeric" autoFocus className="h-8 w-20"
              value={rest}
              onChange={(e) => onPatchExercise(ex.id, { restSeconds: Math.max(0, Number(e.target.value) || 0) })} />
            <span className="text-xs text-muted-foreground">sec</span>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditRest(false)}>Done</Button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditRest(true)} className="text-sm font-medium text-gym">
            Rest Timer: {restLabel(rest)}
          </button>
        )}
      </div>

      <div className="space-y-1 p-3 pt-2">
        <div className="grid items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={{ gridTemplateColumns: cols }}>
          <span>Set</span>
          <span>Previous</span>
          {fields.map((f) => <span key={f.key}>{f.label}</span>)}
          <span className="flex justify-center"><Check className="h-3.5 w-3.5" /></span>
          <span />
        </div>

        {ex.sets.map((s, i) => {
          const isDone = !!doneSets[`${ex.id}:${i}`];
          return (
            <div key={i}
              className={cn(
                "grid items-center gap-2 rounded-md py-1 transition-colors",
                isDone && "bg-success/20",
              )}
              style={{ gridTemplateColumns: cols }}>
              <span className={cn("pl-1 text-sm font-bold tabular-nums", isDone ? "text-success" : "text-foreground")}>
                {i + 1}
              </span>
              <span className="truncate text-xs tabular-nums text-muted-foreground">
                {previousLabel(ex.exerciseName, i, type)}
              </span>
              {fields.map((f) => {
                if (f.key === "reps") return (
                  <Input key="reps" type="number" inputMode="numeric" value={s.reps || ""}
                    onChange={(e) => onUpdateSet(ex.id, i, { reps: Number(e.target.value) || 0 })}
                    className="h-9 border-0 bg-muted/40 text-center font-semibold" />
                );
                if (f.key === "weight") return (
                  <div key="weight" className="relative">
                    <Input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*"
                      value={displayWeight(ex.id, i, s.weight)}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", ".");
                        if (v === "" || /^\d+(\.\d{0,3})?$/.test(v) || /^\d+\.$/.test(v)) {
                          setWeightDraft(ex.id, i, v);
                        }
                      }}
                      placeholder="0"
                      className="h-9 border-0 bg-muted/40 pr-7 text-center font-semibold" />
                    <button type="button" onClick={() => onPlateCalc(s.weight)}
                      aria-label="Plate calculator"
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-gym">
                      <Calculator className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
                if (f.key === "duration") return (
                  <Input key="duration" type="number" inputMode="numeric" value={s.durationSec || ""}
                    onChange={(e) => onUpdateSet(ex.id, i, { durationSec: Number(e.target.value) || 0 })}
                    placeholder="0" className="h-9 border-0 bg-muted/40 text-center font-semibold" />
                );
                return (
                  <Input key="distance" type="number" inputMode="decimal" step="0.01" value={s.distanceKm ?? ""}
                    onChange={(e) => onUpdateSet(ex.id, i, { distanceKm: Number(e.target.value) || 0 })}
                    placeholder="0" className="h-9 border-0 bg-muted/40 text-center font-semibold" />
                );
              })}
              <button type="button" onClick={() => onToggleDone(ex.id, i)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all active:scale-90",
                  isDone ? "bg-success text-module-foreground" : "bg-muted text-muted-foreground hover:bg-gym/20",
                )}
                aria-pressed={isDone}
                title={isDone ? "Mark not done" : "Mark set done & start rest"}>
                <Check className="h-4 w-4" />
              </button>
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={() => onRemoveSet(ex.id, i)} disabled={ex.sets.length === 1}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          );
        })}

        <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => onAddSet(ex.id)}>
          <Plus className="h-4 w-4" /> Add Set
        </Button>
      </div>
    </Card>
  );
}
