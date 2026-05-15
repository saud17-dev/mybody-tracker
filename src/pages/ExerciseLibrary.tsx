import { useMemo, useState } from "react";
import { Search, Star, Library as LibraryIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExerciseDetailDrawer } from "@/components/ExerciseDetailDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GYM_EXERCISES, PT_EXERCISES, PT_BODY_AREAS, type ExerciseDef } from "@/lib/exercises";
import { useFavorites, useCustomExercises } from "@/lib/cloud";
import { cn } from "@/lib/utils";

export default function ExerciseLibrary() {
  return (
    <AppShell title="Exercise Library" subtitle="Browse cues, target areas & favorites" accent="primary">
      <Tabs defaultValue="gym">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gym">Gym</TabsTrigger>
          <TabsTrigger value="pt">PT</TabsTrigger>
        </TabsList>
        <TabsContent value="gym" className="mt-4">
          <LibraryList module="gym" base={GYM_EXERCISES} />
        </TabsContent>
        <TabsContent value="pt" className="mt-4">
          <LibraryList module="pt" base={PT_EXERCISES} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function LibraryList({ module, base }: { module: "gym" | "pt"; base: ExerciseDef[] }) {
  const { favorites, toggle } = useFavorites(module);
  const { items: customs } = useCustomExercises(module);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [detail, setDetail] = useState<ExerciseDef | null>(null);

  const all = useMemo<ExerciseDef[]>(() => {
    const ce: ExerciseDef[] = customs.map((c) => ({
      name: c.name, group: c.muscleGroup, bodyArea: c.bodyArea,
    }));
    return [...base, ...ce];
  }, [base, customs]);

  const groups = useMemo(() => {
    if (module === "pt") return ["All", ...PT_BODY_AREAS.filter((a) => a !== "All")];
    const set = new Set<string>();
    all.forEach((e) => set.add(e.group));
    return ["All", ...Array.from(set)];
  }, [all, module]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return all.filter((e) => {
      if (filter !== "All") {
        if (module === "pt") { if (e.bodyArea !== filter) return false; }
        else if (e.group !== filter) return false;
      }
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q);
    });
  }, [all, query, filter, module]);

  const favItems = filtered.filter((e) => favorites.has(e.name));
  const others = filtered.filter((e) => !favorites.has(e.name));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…" className="pl-9" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {groups.map((g) => (
          <button key={g} onClick={() => setFilter(g)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === g
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent/10",
            )}>
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <LibraryIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No exercises match.</p>
        </div>
      )}

      {favItems.length > 0 && (
        <Section label="Favorites">
          {favItems.map((ex) => (
            <Row key={ex.name} ex={ex} isFav onToggleFav={() => toggle(ex.name)} onOpen={() => setDetail(ex)} />
          ))}
        </Section>
      )}
      {others.length > 0 && (
        <Section label={favItems.length ? "All exercises" : `${filtered.length} exercises`}>
          {others.map((ex) => (
            <Row key={ex.name} ex={ex} isFav={false} onToggleFav={() => toggle(ex.name)} onOpen={() => setDetail(ex)} />
          ))}
        </Section>
      )}

      <ExerciseDetailDrawer
        module={module}
        exercise={detail}
        open={!!detail}
        onOpenChange={(o) => { if (!o) setDetail(null); }}
        isFavorite={detail ? favorites.has(detail.name) : false}
        onToggleFavorite={detail ? () => toggle(detail.name) : undefined}
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

function Row({ ex, isFav, onToggleFav, onOpen }: {
  ex: ExerciseDef; isFav: boolean; onToggleFav: () => void; onOpen: () => void;
}) {
  return (
    <Card className="flex items-center gap-2 p-3">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{ex.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Badge variant="secondary" className="text-[10px]">{ex.group}</Badge>
          {ex.bodyArea && <Badge variant="outline" className="text-[10px]">{ex.bodyArea}</Badge>}
        </div>
      </button>
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onToggleFav}
        aria-label={isFav ? "Remove favorite" : "Add favorite"}>
        <Star className={cn("h-4 w-4", isFav && "fill-amber-500 text-amber-500")} />
      </Button>
    </Card>
  );
}
