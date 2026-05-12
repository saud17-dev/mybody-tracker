import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, Star, Clock, Plus, Info } from "lucide-react";
import { ExerciseDetailDrawer } from "@/components/ExerciseDetailDrawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ExerciseDef } from "@/lib/exercises";
import { useFavorites, useCustomExercises } from "@/lib/cloud";
import { toast } from "sonner";

interface ExercisePickerProps {
  module: "gym" | "pt";
  exercises: ExerciseDef[];
  recent?: string[];
  value?: string;
  onChange: (name: string, group: string, bodyArea?: string) => void;
  placeholder?: string;
  bodyAreaFilter?: string; // "All" or specific area; only used when module === "pt"
}

export function ExercisePicker({
  module, exercises, recent = [], value, onChange, placeholder = "Select exercise", bodyAreaFilter,
}: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<ExerciseDef | null>(null);
  const { favorites, toggle } = useFavorites(module);
  const { items: customs, add } = useCustomExercises(module);

  // merge custom exercises into list
  const allExercises = useMemo<ExerciseDef[]>(() => {
    const ce: ExerciseDef[] = customs.map((c) => ({
      name: c.name,
      group: c.muscleGroup,
      bodyArea: c.bodyArea,
    }));
    return [...exercises, ...ce];
  }, [exercises, customs]);

  const groupedSections = useMemo(() => {
    const q = query.toLowerCase().trim();
    let filtered = allExercises;
    if (bodyAreaFilter && bodyAreaFilter !== "All" && module === "pt") {
      filtered = filtered.filter((e) => e.bodyArea === bodyAreaFilter);
    }
    if (q) {
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)
      );
    }
    const byName = new Map(filtered.map((e) => [e.name, e]));

    const favItems = filtered.filter((e) => favorites.has(e.name));
    const recentItems = recent
      .map((n) => byName.get(n))
      .filter((e): e is ExerciseDef => !!e && !favorites.has(e.name));

    const map = new Map<string, ExerciseDef[]>();
    for (const ex of filtered) {
      if (favorites.has(ex.name)) continue;
      if (recentItems.some((r) => r.name === ex.name)) continue;
      if (!map.has(ex.group)) map.set(ex.group, []);
      map.get(ex.group)!.push(ex);
    }
    const sections: { label: string; icon?: any; items: ExerciseDef[] }[] = [];
    if (favItems.length) sections.push({ label: "Favorites", icon: Star, items: favItems });
    if (recentItems.length) sections.push({ label: "Recent", icon: Clock, items: recentItems });
    for (const [g, items] of map) sections.push({ label: g, items });
    return sections;
  }, [allExercises, query, favorites, recent, bodyAreaFilter, module]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox"
          className="w-full justify-between font-normal">
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 opacity-50" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercise..."
            className="h-11 border-0 px-0 focus-visible:ring-0"
            autoFocus
          />
          <CustomExerciseDialog module={module} onAdd={add} prefilledName={query} onCreated={(name) => {
            setQuery("");
            // Auto-select if exact match
            setTimeout(() => {
              const e = allExercises.find((x) => x.name === name);
              if (e) onChange(e.name, e.group, e.bodyArea);
            }, 100);
          }} />
        </div>
        <ScrollArea className="h-72">
          {groupedSections.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No exercises found</p>
          )}
          {groupedSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div key={sec.label} className="px-1 py-1">
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {Icon && <Icon className="h-3 w-3" />}
                  {sec.label}
                </div>
                {sec.items.map((ex) => (
                  <div key={ex.name} className="group flex items-center rounded-md hover:bg-accent/10">
                    <button type="button"
                      onClick={() => { onChange(ex.name, ex.group, ex.bodyArea); setOpen(false); setQuery(""); }}
                      className="flex flex-1 items-center justify-between px-2 py-2 text-left text-sm">
                      <span>{ex.name}</span>
                      {value === ex.name && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); toggle(ex.name); }}
                      className="px-2 py-2 text-muted-foreground/40 hover:text-amber-500"
                      aria-label="Toggle favorite">
                      <Star className={cn("h-4 w-4", favorites.has(ex.name) && "fill-amber-500 text-amber-500")} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function CustomExerciseDialog({
  module, onAdd, prefilledName, onCreated,
}: {
  module: "gym" | "pt";
  onAdd: (e: { name: string; muscleGroup: string; bodyArea?: string }) => Promise<any>;
  prefilledName?: string;
  onCreated: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState(module === "gym" ? "Chest" : "Mobility");
  const [bodyArea, setBodyArea] = useState("Knee");

  const groups = module === "gym"
    ? ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Olympic", "Other"]
    : ["Mobility", "Stability", "Shoulder", "Knee/Hip", "Lower Back", "Foot/Ankle", "Neck", "Fascia", "Stretch", "Leg Strength", "Other"];

  const submit = async () => {
    if (!name.trim()) { toast.error("Enter a name"); return; }
    try {
      await onAdd({ name: name.trim(), muscleGroup: group, bodyArea: module === "pt" ? bodyArea : undefined });
      toast.success("Custom exercise added");
      setOpen(false);
      onCreated(name.trim());
      setName("");
    } catch (e: any) {
      toast.error(e.message || "Failed to add");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setName(prefilledName || ""); }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" aria-label="Add custom exercise">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New custom exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Sissy Squat" />
          </div>
          <div className="space-y-1.5">
            <Label>{module === "gym" ? "Muscle group" : "Category"}</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {module === "pt" && (
            <div className="space-y-1.5">
              <Label>Body area</Label>
              <Select value={bodyArea} onValueChange={setBodyArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Knee", "Hip", "Shoulder", "Spine", "Ankle", "Core"].map((a) =>
                    <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
