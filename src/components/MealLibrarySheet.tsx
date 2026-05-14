import { useMemo, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MEAL_LIBRARY, LIBRARY_CATEGORIES, type LibraryMeal, type LibraryCategory } from "@/lib/mealLibrary";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (meal: LibraryMeal) => void;
}

export function MealLibrarySheet({ open, onOpenChange, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<LibraryCategory | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEAL_LIBRARY.filter((m) => {
      if (cat !== "All" && m.category !== cat) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, cat]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Meal library
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus={false}
              placeholder="Search meals…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {LIBRARY_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  cat === c.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No meals match.</p>
          ) : (
            <div className="space-y-1.5 pb-6">
              {filtered.map((m) => (
                <Card
                  key={m.id}
                  onClick={() => {
                    onPick(m);
                    onOpenChange(false);
                  }}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:border-primary/40 active:scale-[.99]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                    {m.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {m.name}
                      {m.approximate && (
                        <span className="ml-1.5 align-middle text-[9px] font-medium uppercase text-muted-foreground">≈</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{m.serving}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-primary">{m.proteinG}g</p>
                    <p className="text-[10px] text-muted-foreground">{m.calories} kcal</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
