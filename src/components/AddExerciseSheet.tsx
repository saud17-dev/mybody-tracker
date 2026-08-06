import { useMemo, useState } from "react";
import { Search, Info, Check, ChevronDown } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useExerciseCatalog, useCreateExercise, POPULAR_EXERCISES,
  MUSCLE_GROUPS, EQUIPMENT, EXERCISE_TYPES,
  type CatalogExercise, type ExerciseType,
} from "@/lib/exerciseDb";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (e: CatalogExercise) => void;
}

const initials = (name: string) =>
  name.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function AddExerciseSheet({ open, onOpenChange, onSelect }: Props) {
  const { exercises, isLoading } = useExerciseCatalog();
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState<string | null>(null);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | "equipment" | "muscle">(null);
  const [detail, setDetail] = useState<CatalogExercise | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return exercises.filter((e) => {
      if (equipment && e.equipment !== equipment) return false;
      if (muscle && e.muscleGroup !== muscle) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, query, equipment, muscle]);

  const popular = useMemo(() => {
    const order = new Map(POPULAR_EXERCISES.map((n, i) => [n.toLowerCase(), i]));
    return filtered
      .filter((e) => order.has(e.name.toLowerCase()))
      .sort((a, b) => order.get(a.name.toLowerCase())! - order.get(b.name.toLowerCase())!);
  }, [filtered]);

  const all = useMemo(
    () => [...filtered].sort((a, b) => a.name.localeCompare(b.name)),
    [filtered],
  );

  const equipmentValues = useMemo(() => {
    const s = new Set(exercises.map((e) => e.equipment).filter(Boolean));
    return Array.from(s).sort();
  }, [exercises]);
  const muscleValues = useMemo(() => {
    const s = new Set(exercises.map((e) => e.muscleGroup).filter(Boolean));
    return Array.from(s).sort();
  }, [exercises]);

  const pick = (e: CatalogExercise) => {
    onSelect(e);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[100dvh] rounded-none p-0 flex flex-col gap-0">
          <div className="sticky top-0 z-10 border-b bg-card px-3 pt-4 pb-3 safe-top">
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="px-2 text-muted-foreground"
                onClick={() => onOpenChange(false)}>Cancel</Button>
              <p className="text-base font-semibold">Add Exercise</p>
              <Button variant="ghost" className="px-2 font-semibold text-gym"
                onClick={() => setCreating(true)}>Create</Button>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search exercise" className="pl-9" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <FilterChip label={equipment ?? "All Equipment"} active={!!equipment}
                onClick={() => setPicker("equipment")} />
              <FilterChip label={muscle ?? "All Muscles"} active={!!muscle}
                onClick={() => setPicker("muscle")} />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="pb-16">
              {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Loading exercises…</p>}
              {!isLoading && all.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">No exercises match.</p>
              )}
              {popular.length > 0 && (
                <>
                  <SectionHeader>Popular Exercises</SectionHeader>
                  {popular.map((e) => (
                    <ExerciseRow key={`pop-${e.id}`} ex={e} onPick={() => pick(e)} onInfo={() => setDetail(e)} />
                  ))}
                </>
              )}
              {all.length > 0 && (
                <>
                  <SectionHeader>All Exercises</SectionHeader>
                  {all.map((e) => (
                    <ExerciseRow key={e.id} ex={e} onPick={() => pick(e)} onInfo={() => setDetail(e)} />
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Filter value sheets */}
      <Sheet open={!!picker} onOpenChange={(o) => { if (!o) setPicker(null); }}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-2xl p-0">
          <div className="sticky top-0 border-b bg-card px-4 py-3 text-sm font-semibold">
            {picker === "equipment" ? "Equipment" : "Muscles"}
          </div>
          <div className="p-2">
            <OptionRow label={picker === "equipment" ? "All Equipment" : "All Muscles"}
              selected={picker === "equipment" ? !equipment : !muscle}
              onClick={() => {
                picker === "equipment" ? setEquipment(null) : setMuscle(null);
                setPicker(null);
              }} />
            {(picker === "equipment" ? equipmentValues : muscleValues).map((v) => (
              <OptionRow key={v} label={v}
                selected={picker === "equipment" ? equipment === v : muscle === v}
                onClick={() => {
                  picker === "equipment" ? setEquipment(v) : setMuscle(v);
                  setPicker(null);
                }} />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          {detail && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold leading-tight">{detail.name}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{detail.muscleGroup}</Badge>
                  <Badge variant="outline">{detail.equipment}</Badge>
                </div>
              </div>
              {detail.secondaryMuscles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secondary muscles</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {detail.secondaryMuscles.map((m) => (
                      <Badge key={m} variant="outline" className="text-[11px]">{m}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                  {detail.instructions || "No instructions yet."}
                </p>
              </div>
              <Button className="w-full bg-gym hover:bg-gym/90" size="lg"
                onClick={() => { pick(detail); setDetail(null); }}>
                Add to workout
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CreateExerciseSheet open={creating} onOpenChange={setCreating}
        defaultName={query} onCreated={(e) => { setCreating(false); pick(e); }} />
    </>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="bg-muted/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        active ? "border-gym bg-gym/10 text-gym" : "border-border bg-muted/40 text-muted-foreground",
      )}>
      <span className="truncate">{label}</span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
    </button>
  );
}

function OptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent/10">
      <span>{label}</span>
      {selected && <Check className="h-4 w-4 text-gym" />}
    </button>
  );
}

function ExerciseRow({ ex, onPick, onInfo }: { ex: CatalogExercise; onPick: () => void; onInfo: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 hover:bg-accent/5">
      <button type="button" onClick={onPick} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gym/15 text-xs font-bold text-gym">
          {initials(ex.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{ex.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{ex.muscleGroup}</span>
        </span>
      </button>
      <button type="button" onClick={onInfo} aria-label={`About ${ex.name}`}
        className="rounded-full p-2 text-muted-foreground/60 hover:text-gym">
        <Info className="h-4 w-4" />
      </button>
    </div>
  );
}

function CreateExerciseSheet({
  open, onOpenChange, defaultName, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultName?: string;
  onCreated: (e: CatalogExercise) => void;
}) {
  const { create, isCreating } = useCreateExercise();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Chest");
  const [equipment, setEquipment] = useState("Barbell");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("weight_reps");

  const submit = async () => {
    if (!name.trim()) return toast.error("Enter a name");
    try {
      const created = await create({ name: name.trim(), muscleGroup, equipment, exerciseType });
      toast.success("Exercise created");
      setName("");
      onCreated(created);
    } catch (e: any) {
      toast.error(/duplicate/i.test(e.message || "") ? "That exercise already exists" : e.message || "Failed to create");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (o) setName(defaultName || ""); }}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <h3 className="text-lg font-semibold">Create exercise</h3>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sissy Squat" />
          </div>
          <div className="space-y-1.5">
            <Label>Muscle group</Label>
            <Select value={muscleGroup} onValueChange={setMuscleGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MUSCLE_GROUPS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Equipment</Label>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EQUIPMENT.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={exerciseType} onValueChange={(v) => setExerciseType(v as ExerciseType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXERCISE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-gym hover:bg-gym/90" onClick={submit} disabled={isCreating}>
            {isCreating ? "Creating…" : "Create exercise"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
