import { MoreVertical, Plus, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseImage } from "@/components/ExerciseImage";
import { ExerciseCountdown } from "@/components/ExerciseCountdown";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PTExerciseEntry, PTSet } from "@/lib/types";

export const painColor = (n: number) =>
  n <= 3 ? "text-success" : n <= 6 ? "text-warning" : "text-destructive";

interface Props {
  ex: PTExerciseEntry;
  unit: string;
  doneSets: Record<string, boolean>;
  previousLabel: (name: string, idx: number) => string;
  onUpdateSet: (exId: string, i: number, patch: Partial<PTSet>) => void;
  onToggleDone: (exId: string, i: number) => void;
  onAddSet: (exId: string) => void;
  onRemoveSet: (exId: string, i: number) => void;
  onRemoveExercise: (exId: string) => void;
  onNotes: (exId: string, notes: string) => void;
  onPainAll: (exId: string, pain: number) => void;
}

export function PTExerciseCard({
  ex, unit, doneSets, previousLabel, onUpdateSet, onToggleDone,
  onAddSet, onRemoveSet, onRemoveExercise, onNotes, onPainAll,
}: Props) {
  const pain = Math.round(
    ex.sets.reduce((a, s) => a + (s.painScale || 0), 0) / Math.max(1, ex.sets.length),
  ) || 1;
  const cols = "1.75rem 4rem 1fr 1fr 2.25rem 1.75rem";

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-3 pt-3">
        <ExerciseImage name={ex.exerciseName} muscle={ex.bodyArea ?? ex.category} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-pt">{ex.exerciseName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {ex.category}{ex.bodyArea ? ` · ${ex.bodyArea}` : ""}
          </p>
        </div>
        <ExerciseCountdown defaultSeconds={30} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Exercise options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={() => onRemoveExercise(ex.id)}>
              Remove exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1 p-3 pt-2">
        <div className="grid items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={{ gridTemplateColumns: cols }}>
          <span>Set</span>
          <span>Previous</span>
          <span>{unit.toUpperCase()}</span>
          <span>Reps</span>
          <span className="flex justify-center"><Check className="h-3.5 w-3.5" /></span>
          <span />
        </div>

        {ex.sets.map((s, i) => {
          const isDone = !!doneSets[`${ex.id}:${i}`];
          return (
            <div key={i}
              className={cn("grid items-center gap-2 rounded-md py-1 transition-colors", isDone && "bg-success/20")}
              style={{ gridTemplateColumns: cols }}>
              <span className={cn("pl-1 text-sm font-bold tabular-nums", isDone ? "text-success" : "text-foreground")}>
                {i + 1}
              </span>
              <span className="truncate text-xs tabular-nums text-muted-foreground">
                {previousLabel(ex.exerciseName, i)}
              </span>
              <Input type="text" inputMode="decimal" value={s.weight ?? ""}
                onChange={(e) => {
                  const v = e.target.value.replace(",", ".");
                  if (v === "" || /^\d+(\.\d{0,3})?$/.test(v) || /^\d+\.$/.test(v)) {
                    onUpdateSet(ex.id, i, { weight: v === "" ? undefined : Number(v) });
                  }
                }}
                placeholder="—"
                className="h-9 border-0 bg-muted/40 text-center font-semibold" />
              <Input type="number" inputMode="numeric" value={s.reps || ""}
                onChange={(e) => onUpdateSet(ex.id, i, { reps: Number(e.target.value) || 0 })}
                className="h-9 border-0 bg-muted/40 text-center font-semibold" />
              <button type="button" onClick={() => onToggleDone(ex.id, i)}
                aria-pressed={isDone}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all active:scale-90",
                  isDone ? "bg-success text-module-foreground" : "bg-muted text-muted-foreground hover:bg-pt/20",
                )}>
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

        <Textarea value={ex.notes || ""} onChange={(e) => onNotes(ex.id, e.target.value)}
          placeholder="Add notes here..." rows={2} className="mt-3 resize-none" />

        <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pain level
            </span>
            <span className={cn("text-sm font-bold tabular-nums", painColor(pain))}>{pain}/10</span>
          </div>
          <Slider min={1} max={10} step={1} value={[pain]}
            onValueChange={([v]) => onPainAll(ex.id, v)} />
        </div>
      </div>
    </Card>
  );
}
