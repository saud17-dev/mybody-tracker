import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ExerciseDef } from "@/lib/exercises";

interface ExercisePickerProps {
  exercises: ExerciseDef[];
  value?: string;
  onChange: (name: string, group: string) => void;
  placeholder?: string;
}

export function ExercisePicker({ exercises, value, onChange, placeholder = "Select exercise" }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = q ? exercises.filter((e) => e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)) : exercises;
    const map = new Map<string, ExerciseDef[]>();
    for (const ex of filtered) {
      if (!map.has(ex.group)) map.set(ex.group, []);
      map.get(ex.group)!.push(ex);
    }
    return Array.from(map.entries());
  }, [exercises, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
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
        </div>
        <ScrollArea className="h-72">
          {grouped.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No exercises found</p>
          )}
          {grouped.map(([group, items]) => (
            <div key={group} className="px-1 py-1">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </div>
              {items.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  onClick={() => {
                    onChange(ex.name, ex.group);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-accent/10"
                >
                  <span>{ex.name}</span>
                  {value === ex.name && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
