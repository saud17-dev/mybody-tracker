import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Target, ListChecks, Plus, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { getExerciseTags, type ExerciseDef } from "@/lib/exercises";
import { getExerciseCues, getTargetArea } from "@/lib/exerciseCues";
import { ExerciseImage } from "@/components/ExerciseImage";

interface Props {
  module: "gym" | "pt";
  exercise: ExerciseDef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onSelect?: () => void;
  selectLabel?: string;
  muscleLabel?: string;
  equipment?: string;
  secondaryMuscles?: string[];
  instructions?: string;
}

export function ExerciseDetailDrawer({
  module, exercise, open, onOpenChange, isFavorite, onToggleFavorite, onSelect,
  selectLabel = "Add to workout", muscleLabel, equipment, secondaryMuscles, instructions,
}: Props) {
  if (!exercise) return null;
  const tags = getExerciseTags(module, exercise);
  const muscle = muscleLabel ?? tags.muscle;
  const equip = equipment ?? tags.equipment;
  const cues = getExerciseCues(exercise.name, exercise.group);
  const area = getTargetArea({ module, name: exercise.name, group: exercise.group, bodyArea: exercise.bodyArea });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:mx-auto">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl leading-tight">{exercise.name}</SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{muscle}</Badge>
                {equip && <Badge variant="outline">{equip}</Badge>}
                {exercise.bodyArea && <Badge variant="outline">{exercise.bodyArea}</Badge>}
              </SheetDescription>
            </div>
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorite}
                aria-label="Toggle favorite"
                className="shrink-0"
              >
                <Star className={cn("h-5 w-5", isFavorite && "fill-warning text-warning")} />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ExerciseImage
          name={exercise.name}
          muscle={muscle}
          equipment={equip}
          variant="banner"
          className="mt-4"
        />




        <div className="mt-5 space-y-5">
          <section className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Target area
            </div>
            <p className="mt-1.5 text-sm">{area}</p>
          </section>

          {equip && (
            <section className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Dumbbell className="h-3.5 w-3.5" />
                Recommended equipment
              </div>
              <p className="mt-1.5 text-sm">{equip}</p>
            </section>
          )}

          {secondaryMuscles && secondaryMuscles.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Secondary muscles
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {secondaryMuscles.map((m) => (
                  <Badge key={m} variant="outline" className="text-[11px]">{m}</Badge>
                ))}
              </div>
            </section>
          )}

          {instructions && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{instructions}</p>
            </section>
          )}



          <section>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              Common cues
            </div>
            <ul className="mt-2 space-y-2">
              {cues.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </section>

          {onSelect && (
            <Button onClick={onSelect} className="w-full" size="lg">
              <Plus className="mr-1.5 h-4 w-4" />
              {selectLabel}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
