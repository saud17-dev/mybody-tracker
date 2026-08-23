import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Library, Plus } from "lucide-react";
import { PRESET_TEMPLATES, type PresetTemplate } from "@/lib/templateLibrary";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  existingNames: string[];
  onAdd: (t: { module: "gym"; name: string; emoji?: string; payload: any }) => Promise<any>;
}

export function TemplateLibrarySheet({ existingNames, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const taken = new Set(existingNames.map((n) => n.toLowerCase()));

  const add = async (t: PresetTemplate) => {
    setBusy(t.key);
    try {
      await onAdd({ module: t.module, name: t.name, emoji: t.emoji, payload: t.payload });
      toast.success(`${t.name} added to your templates`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <Library className="mr-1 h-4 w-4" /> Template library
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Template library</SheetTitle>
        </SheetHeader>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">
          Ready-made, well-rounded workouts. Add one to your templates to schedule or start it.
        </p>
        <div className="space-y-2 pb-6">
          {PRESET_TEMPLATES.map((t) => {
            const added = taken.has(t.name.toLowerCase());
            const isOpen = expanded === t.key;
            return (
              <Card key={t.key} className="p-3">
                <div className="flex items-center gap-3">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => setExpanded(isOpen ? null : t.key)}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t.focus}</span>
                    </span>
                    <Badge variant="secondary" className="h-5 shrink-0 text-[10px]">
                      {t.payload.exercises.length}
                    </Badge>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {added ? (
                    <Button size="sm" variant="ghost" disabled className="shrink-0">
                      <Check className="mr-1 h-3 w-3" /> Added
                    </Button>
                  ) : (
                    <Button size="sm" className="shrink-0" disabled={busy === t.key} onClick={() => add(t)}>
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  )}
                </div>
                {isOpen && (
                  <ul className="mt-3 space-y-1 border-t pt-3">
                    {t.payload.exercises.map((e) => (
                      <li key={e.name} className="flex items-center justify-between text-xs">
                        <span className="truncate">{e.name}</span>
                        <span className="shrink-0 text-muted-foreground">{e.sets} × {e.reps}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
