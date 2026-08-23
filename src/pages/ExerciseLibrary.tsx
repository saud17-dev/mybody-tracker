import { useMemo, useState } from "react";
import { Search, Star, Library as LibraryIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExerciseDetailDrawer } from "@/components/ExerciseDetailDrawer";
import { ExerciseTags } from "@/components/ExerciseTags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PT_EXERCISES, PT_BODY_AREAS, getExerciseTags, type ExerciseDef } from "@/lib/exercises";
import { useExerciseCatalog } from "@/lib/exerciseDb";
import { useFavorites, useCustomExercises } from "@/lib/cloud";
import { cn } from "@/lib/utils";

export default function ExerciseLibrary() {
  return (
    <AppShell title="Exercise Library" subtitle="Muscle, equipment, cues & favorites" accent="primary">
      <Tabs defaultValue="gym">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gym">Gym</TabsTrigger>
          <TabsTrigger value="pt">PT</TabsTrigger>
        </TabsList>
        <TabsContent value="gym" className="mt-4">
          <GymLibrary />
        </TabsContent>
        <TabsContent value="pt" className="mt-4">
          <PTLibrary />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/** Row shape shared by both tabs. */
interface LibRow {
  name: string;
  muscle: string;
  equipment: string | null;
  detail: ExerciseDef;
  secondaryMuscles?: string[];
  instructions?: string | null;
}

function GymLibrary() {
  const { exercises, isLoading } = useExerciseCatalog();
  const { favorites, toggle } = useFavorites("gym");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [detail, setDetail] = useState<LibRow | null>(null);

  const muscles = useMemo(
    () => ["All", ...Array.from(new Set(exercises.map((e) => e.muscleGroup))).sort()],
    [exercises],
  );
  const equipments = useMemo(
    () => ["All", ...Array.from(new Set(exercises.map((e) => e.equipment))).sort()],
    [exercises],
  );

  const rows = useMemo<LibRow[]>(() => {
    const q = query.toLowerCase().trim();
    return exercises
      .filter((e) => {
        if (muscle !== "All" && e.muscleGroup !== muscle) return false;
        if (equipment !== "All" && e.equipment !== equipment) return false;
        if (q && !e.name.toLowerCase().includes(q) && !e.muscleGroup.toLowerCase().includes(q)
          && !e.equipment.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((e) => ({
        name: e.name,
        muscle: e.muscleGroup,
        equipment: e.equipment,
        secondaryMuscles: e.secondaryMuscles,
        instructions: e.instructions,
        detail: { name: e.name, group: e.muscleGroup, equipment: e.equipment },
      }));
  }, [exercises, query, muscle, equipment]);

  return (
    <ListShell
      query={query} setQuery={setQuery}
      chipRows={[
        { value: muscle, set: setMuscle, options: muscles },
        { value: equipment, set: setEquipment, options: equipments },
      ]}
      rows={rows}
      favorites={favorites}
      onToggleFav={toggle}
      onOpen={setDetail}
      loading={isLoading}
      detail={detail}
      onCloseDetail={() => setDetail(null)}
      module="gym"
    />
  );
}

function PTLibrary() {
  const { favorites, toggle } = useFavorites("pt");
  const { items: customs } = useCustomExercises("pt");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [detail, setDetail] = useState<LibRow | null>(null);

  const all = useMemo<ExerciseDef[]>(() => [
    ...PT_EXERCISES,
    ...customs.map((c) => ({ name: c.name, group: c.muscleGroup, bodyArea: c.bodyArea })),
  ], [customs]);

  const tagged = useMemo(
    () => all.map((e) => ({ e, ...getExerciseTags("pt", e) })),
    [all],
  );

  const equipments = useMemo(
    () => ["All", ...Array.from(new Set(tagged.map((t) => t.equipment))).sort()],
    [tagged],
  );

  const rows = useMemo<LibRow[]>(() => {
    const q = query.toLowerCase().trim();
    return tagged
      .filter((t) => {
        if (area !== "All" && t.e.bodyArea !== area) return false;
        if (equipment !== "All" && t.equipment !== equipment) return false;
        if (q && !t.e.name.toLowerCase().includes(q) && !t.muscle.toLowerCase().includes(q)
          && !t.equipment.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((t) => ({
        name: t.e.name,
        muscle: t.muscle,
        equipment: t.equipment,
        detail: { ...t.e, equipment: t.equipment },
      }));
  }, [tagged, query, area, equipment]);

  return (
    <ListShell
      query={query} setQuery={setQuery}
      chipRows={[
        { value: area, set: setArea, options: [...PT_BODY_AREAS] },
        { value: equipment, set: setEquipment, options: equipments },
      ]}
      rows={rows}
      favorites={favorites}
      onToggleFav={toggle}
      onOpen={setDetail}
      detail={detail}
      onCloseDetail={() => setDetail(null)}
      module="pt"
    />
  );
}

function ListShell({
  query, setQuery, chipRows, rows, favorites, onToggleFav, onOpen, loading,
  detail, onCloseDetail, module,
}: {
  query: string;
  setQuery: (v: string) => void;
  chipRows: { value: string; set: (v: string) => void; options: string[] }[];
  rows: LibRow[];
  favorites: Set<string>;
  onToggleFav: (name: string) => void;
  onOpen: (r: LibRow) => void;
  loading?: boolean;
  detail: LibRow | null;
  onCloseDetail: () => void;
  module: "gym" | "pt";
}) {
  const favItems = rows.filter((r) => favorites.has(r.name));
  const others = rows.filter((r) => !favorites.has(r.name));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, muscle or equipment…" className="pl-9" />
      </div>

      {chipRows.map((row, i) => (
        <div key={i} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {row.options.map((g) => (
            <button key={g} onClick={() => row.set(g)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                row.value === g
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent/10",
              )}>
              {g}
            </button>
          ))}
        </div>
      ))}

      {loading && <p className="py-10 text-center text-sm text-muted-foreground">Loading exercises…</p>}

      {!loading && rows.length === 0 && (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <LibraryIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No exercises match.</p>
        </div>
      )}

      {favItems.length > 0 && (
        <Section label="Favorites">
          {favItems.map((r) => (
            <Row key={r.name} row={r} isFav onToggleFav={() => onToggleFav(r.name)} onOpen={() => onOpen(r)} />
          ))}
        </Section>
      )}
      {others.length > 0 && (
        <Section label={favItems.length ? "All exercises" : `${rows.length} exercises`}>
          {others.map((r) => (
            <Row key={r.name} row={r} isFav={false} onToggleFav={() => onToggleFav(r.name)} onOpen={() => onOpen(r)} />
          ))}
        </Section>
      )}

      <ExerciseDetailDrawer
        module={module}
        exercise={detail?.detail ?? null}
        muscleLabel={detail?.muscle}
        equipment={detail?.equipment ?? undefined}
        secondaryMuscles={detail?.secondaryMuscles}
        instructions={detail?.instructions ?? undefined}
        open={!!detail}
        onOpenChange={(o) => { if (!o) onCloseDetail(); }}
        isFavorite={detail ? favorites.has(detail.name) : false}
        onToggleFavorite={detail ? () => onToggleFav(detail.name) : undefined}
      />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ row, isFav, onToggleFav, onOpen }: {
  row: LibRow; isFav: boolean; onToggleFav: () => void; onOpen: () => void;
}) {
  return (
    <Card className="flex items-center gap-2 p-3">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{row.name}</p>
        <ExerciseTags className="mt-1" muscle={row.muscle} equipment={row.equipment} />
      </button>
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onToggleFav}
        aria-label={isFav ? "Remove favorite" : "Add favorite"}>
        <Star className={cn("h-4 w-4", isFav && "fill-warning text-warning")} />
      </Button>
    </Card>
  );
}
