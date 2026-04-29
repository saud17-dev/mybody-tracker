import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format } from "date-fns";
import { CalendarDays, Play, Plus, Sparkles, Pencil, Trash2, Dumbbell, HeartPulse, Activity, Coffee, GripVertical, ArrowDownToLine, RotateCcw, EyeOff, Eye, Flame, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ExercisePicker } from "@/components/ExercisePicker";
import { CsvImport } from "@/components/CsvImport";
import { GYM_EXERCISES, PT_EXERCISES, CARDIO_ACTIVITIES } from "@/lib/exercises";
import { usePlanSchedule, useWorkoutTemplates } from "@/lib/cloud";
import { usePlanSkips } from "@/lib/planSkips";
import { SUMMER_PLAN_TEMPLATES } from "@/lib/seedPlan";
import { parsePlanCsv, type ParsedPlan } from "@/lib/csvPlan";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const moduleStyle = {
  gym: { bg: "bg-gym/10", text: "text-gym", icon: Dumbbell, route: "/gym" },
  pt: { bg: "bg-pt/10", text: "text-pt", icon: HeartPulse, route: "/pt" },
  cardio: { bg: "bg-cardio/10", text: "text-cardio", icon: Activity, route: "/cardio" },
  rest: { bg: "bg-muted", text: "text-muted-foreground", icon: Coffee, route: "" },
} as const;

// Bold, full-color treatments for the hero day cards (ADHD-friendly visual identity)
const moduleHero = {
  gym: {
    surface: "bg-[image:var(--gradient-gym)] text-white",
    chip: "bg-white/20 text-white",
    border: "border-gym",
    accent: "text-gym",
    soft: "bg-gym/10",
    label: "Gym",
  },
  pt: {
    surface: "bg-[image:var(--gradient-pt)] text-white",
    chip: "bg-white/20 text-white",
    border: "border-pt",
    accent: "text-pt",
    soft: "bg-pt/10",
    label: "PT",
  },
  cardio: {
    surface: "bg-[image:var(--gradient-cardio)] text-white",
    chip: "bg-white/20 text-white",
    border: "border-cardio",
    accent: "text-cardio",
    soft: "bg-cardio/10",
    label: "Cardio",
  },
  rest: {
    surface: "bg-muted text-muted-foreground",
    chip: "bg-foreground/10 text-foreground",
    border: "border-border",
    accent: "text-muted-foreground",
    soft: "bg-muted",
    label: "Rest",
  },
} as const;

export default function Plan() {
  const navigate = useNavigate();
  const today = new Date();
  const todayDow = today.getDay();
  const { days, upsertDay, swapDays } = usePlanSchedule();
  const { templates, create: createTpl, remove: removeTpl } = useWorkoutTemplates();
  const { skipped, toggle: toggleSkip, clearAll: clearSkips } = usePlanSkips();
  const [importing, setImporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canImportSummer =
    days.length === 0 && !templates.some((t) => t.name === "Push");

  const importSummerPlan = async () => {
    setImporting(true);
    try {
      for (const t of SUMMER_PLAN_TEMPLATES) {
        const id = await createTpl({
          module: t.module, name: t.name, emoji: t.emoji, payload: t.payload,
        });
        await upsertDay({
          day_of_week: t.dayOfWeek, module: t.module, template_id: id, label: t.label ?? null,
        });
      }
      toast.success("Summer Plan imported");
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const dayMap = useMemo(() => {
    const m = new Map(days.map((d) => [d.day_of_week, d]));
    return m;
  }, [days]);

  const rawTodayPlan = dayMap.get(todayDow);
  const todayIsSkipped = skipped.has(todayDow);
  const todayPlan = todayIsSkipped
    ? { day_of_week: todayDow, module: "rest" as const, template_id: null, label: "Skipped this week" }
    : rawTodayPlan;
  const todayTpl = todayPlan?.template_id ? templates.find((t) => t.id === todayPlan.template_id) : null;

  const startToday = () => {
    if (!todayPlan || todayPlan.module === "rest") return;
    const url = `${moduleStyle[todayPlan.module].route}${todayPlan.template_id ? `?template=${todayPlan.template_id}` : ""}`;
    navigate(url);
  };

  const moveToToday = async (sourceDow: number) => {
    if (sourceDow === todayDow) return;
    await swapDays({ a: sourceDow, b: todayDow });
    toast.success(`Moved to ${DAYS[todayDow]}`);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = Number(active.id);
    const b = Number(over.id);
    await swapDays({ a, b });
  };

  const dowOrder = [1, 2, 3, 4, 5, 6, 0];

  // Next 4 days starting today
  const next4 = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const d = addDays(today, i);
      const dow = d.getDay();
      const plan = dayMap.get(dow);
      const isSkipped = i === 0 ? skipped.has(dow) : false; // skip only applies to current week's today logic
      const tpl = plan?.template_id ? templates.find((t) => t.id === plan.template_id) : null;
      return { date: d, dow, plan, tpl, isToday: i === 0, isSkipped };
    });
  }, [today, dayMap, templates, skipped]);

  // Most used templates: count appearances in plan_schedule (descending)
  const mostUsedTemplates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of days) {
      if (d.template_id) counts.set(d.template_id, (counts.get(d.template_id) ?? 0) + 1);
    }
    const enriched = templates
      .map((t) => ({ tpl: t, count: counts.get(t.id) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.tpl.name.localeCompare(b.tpl.name));
    return enriched.slice(0, 5);
  }, [days, templates]);

  const startTemplate = (t: { id: string; module: keyof typeof moduleStyle }) => {
    navigate(`${moduleStyle[t.module].route}?template=${t.id}`);
  };

  return (
    <AppShell title="Your Plan" subtitle={format(today, "EEEE, MMM d")} accent="primary">
      {/* Hero: Next 4 days + most used templates */}
      <section>
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          {/* Next 4 days */}
          <div>
            <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Next 4 days
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {next4.map(({ date, dow, plan, tpl, isToday, isSkipped }) => {
                const effectivePlan = isSkipped
                  ? { module: "rest" as const, template_id: null, label: "Skipped" }
                  : plan;
                const ms = effectivePlan ? moduleStyle[effectivePlan.module] : moduleStyle.rest;
                const Icon = ms.icon;
                const title = isSkipped
                  ? "Skipped this week"
                  : tpl?.name || effectivePlan?.label || (effectivePlan?.module === "rest" ? "Rest" : "No plan");
                const canStart = effectivePlan && effectivePlan.module !== "rest";
                return (
                  <Card
                    key={`${date.toISOString()}`}
                    className={cn(
                      "group flex flex-col overflow-hidden p-3 transition",
                      isToday && "border-2 border-primary shadow-[var(--shadow-elevated)]",
                      isSkipped && "opacity-60",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {isToday ? "Today" : format(date, "EEE")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{format(date, "MMM d")}</p>
                      </div>
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", ms.bg)}>
                        <Icon className={cn("h-4 w-4", ms.text)} />
                      </div>
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {effectivePlan?.module ?? "—"}
                    </p>
                    <p className={cn("mb-2 line-clamp-2 text-sm font-semibold leading-tight", isSkipped && "line-through")}>
                      {title}
                    </p>
                    {canStart ? (
                      <Button
                        size="sm"
                        variant={isToday ? "default" : "outline"}
                        className="mt-auto h-8 gap-1 text-xs"
                        onClick={() => {
                          const url = `${moduleStyle[effectivePlan!.module].route}${effectivePlan!.template_id ? `?template=${effectivePlan!.template_id}` : ""}`;
                          navigate(url);
                        }}
                      >
                        <Play className="h-3 w-3" /> Start
                      </Button>
                    ) : (
                      <div className="mt-auto h-8" />
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Most used templates */}
          <div>
            <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Flame className="h-3.5 w-3.5" /> Most used
            </h2>
            {mostUsedTemplates.length === 0 ? (
              <Card className="p-4 text-center text-xs text-muted-foreground">
                No templates yet.
              </Card>
            ) : (
              <div className="space-y-2">
                {mostUsedTemplates.map(({ tpl, count }) => {
                  const style = moduleStyle[tpl.module as keyof typeof moduleStyle] ?? moduleStyle.rest;
                  const Icon = style.icon;
                  return (
                    <Card
                      key={tpl.id}
                      role="button"
                      onClick={() => startTemplate({ id: tpl.id, module: tpl.module as any })}
                      className="flex cursor-pointer items-center gap-2.5 p-2.5 transition hover:border-primary/40 hover:shadow-sm"
                    >
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", style.bg)}>
                        <Icon className={cn("h-4 w-4", style.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-tight">
                          {tpl.emoji ? `${tpl.emoji} ` : ""}{tpl.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tpl.module} {count > 0 && `· used ${count}×/wk`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {canImportSummer && (
        <section className="mt-6">
          <Card className="overflow-hidden border-2 border-dashed border-primary/40 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Import Summer Training Plan</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  7 templates wired to Mon–Sun.
                </p>
                <Button size="sm" className="mt-3" onClick={importSummerPlan} disabled={importing}>
                  {importing ? "Importing..." : "Import plan"}
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Collapsible: full week, all templates, import/export */}
      <section className="mt-6">
        <Accordion type="multiple" className="space-y-2">
          {/* Full week */}
          <AccordionItem value="week" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="py-3 text-sm">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Full week schedule
                {skipped.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
                    {skipped.size} skipped
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {skipped.size > 0 && (
                <div className="mb-2 flex justify-end">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => clearSkips()}>
                    <RotateCcw className="h-3 w-3" /> Reset week
                  </Button>
                </div>
              )}
              <p className="mb-2 text-[11px] text-muted-foreground">
                Drag <GripVertical className="inline h-3 w-3" /> to swap days. Tap a card to edit.
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={dowOrder.map(String)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {dowOrder.map((dow) => {
                      const plan = dayMap.get(dow);
                      const tpl = plan?.template_id ? templates.find((t) => t.id === plan.template_id) : null;
                      return (
                        <SortableDayRow
                          key={dow}
                          dow={dow}
                          plan={plan}
                          tplName={tpl?.name}
                          isToday={dow === todayDow}
                          isSkipped={skipped.has(dow)}
                          templates={templates}
                          onSave={async (m, tplId, label) => {
                            await upsertDay({ day_of_week: dow, module: m, template_id: tplId ?? null, label: label ?? null });
                            toast.success(`${DAYS[dow]} updated`);
                          }}
                          onSkipToggle={() => toggleSkip(dow)}
                          onMoveToToday={() => moveToToday(dow)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </AccordionContent>
          </AccordionItem>

          {/* All templates */}
          <AccordionItem value="templates" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="py-3 text-sm">
              <span className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                All templates
                <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{templates.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mb-2 flex justify-end">
                <NewTemplateDialog onCreate={createTpl} />
              </div>
              {templates.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No templates yet. Create one to reuse exercise lists.
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => {
                    const style = moduleStyle[t.module as keyof typeof moduleStyle] ?? moduleStyle.rest;
                    const Icon = style.icon;
                    const count =
                      t.module === "cardio" ? `${t.payload?.activity || ""} · ${t.payload?.durationMin || 0}m` :
                      `${(t.payload?.exercises || []).length} exercises`;
                    return (
                      <Card key={t.id} className="flex items-center gap-3 p-3">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", style.bg)}>
                          <Icon className={cn("h-4 w-4", style.text)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{t.emoji ? `${t.emoji} ` : ""}{t.name}</p>
                          <p className="text-xs text-muted-foreground">{count}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`${style.route}?template=${t.id}`)}>
                          <Play className="h-3 w-3 mr-1" /> Start
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeTpl(t.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Import / export */}
          <AccordionItem value="import" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="py-3 text-sm">
              <span className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                Import / export plan (CSV)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <CsvImport<ParsedPlan>
                title="Import plan from CSV"
                description="Download the template, fill it in Excel/Numbers/Sheets, then upload to create templates and schedule days in one go."
                templateUrl="/templates/plan-template.csv"
                templateFilename="plan-template.csv"
                parse={parsePlanCsv}
                isEmpty={(p) => p.templates.length === 0 && p.rests.length === 0}
                renderPreview={(p) => (
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold">{p.templates.length} template(s), {p.rests.length} rest day(s)</p>
                    {p.templates.map((t) => (
                      <div key={t.template_name} className="rounded-md border p-2">
                        <p className="font-medium">{t.emoji ? `${t.emoji} ` : ""}{t.template_name} <span className="text-muted-foreground">· {t.module}{t.day_of_week != null ? ` · ${DAYS[t.day_of_week]}` : ""}</span></p>
                        {t.cardio
                          ? <p className="text-muted-foreground">{t.cardio.activity} · {t.cardio.durationMin}m</p>
                          : <p className="text-muted-foreground">{t.exercises.length} exercises</p>}
                      </div>
                    ))}
                  </div>
                )}
                onConfirm={async (p) => {
                  const existingNames = new Set(templates.map((t) => t.name.toLowerCase()));
                  for (const t of p.templates) {
                    if (existingNames.has(t.template_name.toLowerCase())) continue;
                    const payload = t.module === "cardio"
                      ? (t.cardio ?? { activity: "Cardio", durationMin: 30 })
                      : { exercises: t.exercises };
                    const id = await createTpl({
                      module: t.module, name: t.template_name, emoji: t.emoji, payload,
                    });
                    if (t.day_of_week != null) {
                      await upsertDay({ day_of_week: t.day_of_week, module: t.module, template_id: id, label: t.label ?? null });
                    }
                  }
                  for (const r of p.rests) {
                    await upsertDay({ day_of_week: r.day_of_week, module: "rest", template_id: null, label: null });
                  }
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </AppShell>
  );
}

function SortableDayRow({
  dow, plan, tplName, isToday, isSkipped, templates, onSave, onSkipToggle, onMoveToToday,
}: {
  dow: number;
  plan?: { module: "gym" | "pt" | "cardio" | "rest"; template_id?: string | null; label?: string | null };
  tplName?: string;
  isToday: boolean;
  isSkipped: boolean;
  templates: { id: string; name: string; module: string }[];
  onSave: (m: "gym" | "pt" | "cardio" | "rest", tplId?: string | null, label?: string | null) => Promise<void>;
  onSkipToggle: () => void;
  onMoveToToday: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(dow) });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : "auto" } as React.CSSProperties;
  const ms = plan ? moduleStyle[plan.module] : moduleStyle.rest;
  const Icon = ms.icon;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-80")}>
      <Card className={cn(
        "flex items-center gap-2 p-3 transition",
        isToday && "ring-1 ring-primary/30",
        isSkipped && "opacity-60",
      )}>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag day"
          className="flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="w-10 text-xs font-bold uppercase text-muted-foreground">{DAYS[dow]}</div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", ms.bg)}>
          <Icon className={cn("h-4 w-4", ms.text)} />
        </div>
        <DayEditor
          dayOfWeek={dow}
          current={plan}
          templates={templates}
          onSave={onSave}
        >
          <div className="min-w-0 flex-1 cursor-pointer py-1">
            {plan ? (
              <>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {plan.module}{isSkipped && " · skipped"}
                </p>
                <p className={cn("truncate text-sm font-medium", isSkipped && "line-through")}>
                  {tplName || plan.label || (plan.module === "rest" ? "Rest" : "No template")}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tap to schedule</p>
            )}
          </div>
        </DayEditor>
        {!isToday && plan && plan.module !== "rest" && (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Move to today"
            className="h-8 w-8 shrink-0"
            onClick={onMoveToToday}
            title="Swap with today"
          >
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          aria-label={isSkipped ? "Unskip this week" : "Skip this week"}
          title={isSkipped ? "Unskip this week" : "Skip this week"}
          className="h-8 w-8 shrink-0"
          onClick={onSkipToggle}
        >
          {isSkipped ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </Card>
    </div>
  );
}

function DayEditor({
  dayOfWeek, current, templates, onSave, children,
}: {
  dayOfWeek: number;
  current?: { module: string; template_id?: string | null; label?: string | null };
  templates: { id: string; name: string; module: string }[];
  onSave: (m: "gym" | "pt" | "cardio" | "rest", tplId?: string | null, label?: string | null) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mod, setMod] = useState<"gym" | "pt" | "cardio" | "rest">((current?.module as any) || "rest");
  const [tplId, setTplId] = useState<string>(current?.template_id || "");
  const [label, setLabel] = useState(current?.label || "");

  const filteredTpls = templates.filter((t) => t.module === mod);

  return (
    <Sheet open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) {
        setMod((current?.module as any) || "rest");
        setTplId(current?.template_id || "");
        setLabel(current?.label || "");
      }
    }}>
      <SheetTrigger asChild>
        <div>{children}</div>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>Schedule {DAYS[dayOfWeek]}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Module</Label>
            <Select value={mod} onValueChange={(v) => { setMod(v as any); setTplId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gym">Gym</SelectItem>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="rest">Rest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mod !== "rest" && (
            <>
              <div className="space-y-2">
                <Label>Template (optional)</Label>
                <Select value={tplId || "__none__"} onValueChange={(v) => setTplId(v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="No template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No template</SelectItem>
                    {filteredTpls.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Push day" />
              </div>
            </>
          )}
          <Button className="w-full" size="lg"
            onClick={async () => {
              await onSave(mod, tplId || null, label || null);
              setOpen(false);
            }}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewTemplateDialog({ onCreate }: { onCreate: (t: any) => Promise<any> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💪");
  const [mod, setMod] = useState<"gym" | "pt" | "cardio">("gym");

  // Gym/PT exercises list state
  const [exList, setExList] = useState<{ name: string; group: string; bodyArea?: string; sets: number; reps: number }[]>([]);
  const [picker, setPicker] = useState<{ name: string; group: string; bodyArea?: string } | null>(null);

  // Cardio fields
  const [cardioActivity, setCardioActivity] = useState(CARDIO_ACTIVITIES[0]);
  const [cardioDuration, setCardioDuration] = useState(30);

  const reset = () => {
    setName(""); setEmoji("💪"); setMod("gym"); setExList([]); setPicker(null);
    setCardioActivity(CARDIO_ACTIVITIES[0]); setCardioDuration(30);
  };

  const submit = async () => {
    if (!name.trim()) return toast.error("Enter a name");
    let payload: any = {};
    if (mod === "cardio") {
      payload = { activity: cardioActivity, durationMin: cardioDuration };
    } else {
      if (exList.length === 0) return toast.error("Add at least one exercise");
      payload = { exercises: exList };
    }
    try {
      await onCreate({ module: mod, name: name.trim(), emoji, payload });
      toast.success("Template created");
      setOpen(false);
      reset();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary">
          <Plus className="h-4 w-4" /> New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[3rem_1fr] gap-2">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="text-center text-xl" maxLength={2} />
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" />
          </div>
          <div className="space-y-1.5">
            <Label>Module</Label>
            <Select value={mod} onValueChange={(v) => { setMod(v as any); setExList([]); setPicker(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gym">Gym</SelectItem>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mod === "cardio" ? (
            <>
              <div className="space-y-1.5">
                <Label>Activity</Label>
                <Select value={cardioActivity} onValueChange={setCardioActivity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARDIO_ACTIVITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input type="number" value={cardioDuration} onChange={(e) => setCardioDuration(Number(e.target.value) || 0)} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Add exercise</Label>
                <div className="flex gap-2">
                  <ExercisePicker module={mod} exercises={mod === "gym" ? GYM_EXERCISES : PT_EXERCISES}
                    value={picker?.name} onChange={(name, group, bodyArea) => setPicker({ name, group, bodyArea })} />
                  <Button onClick={() => {
                    if (!picker) return;
                    setExList((p) => [...p, { ...picker, sets: 3, reps: 10 }]);
                    setPicker(null);
                  }} disabled={!picker}>Add</Button>
                </div>
              </div>
              <div className="space-y-2">
                {exList.map((ex, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{ex.name}</p>
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                        onClick={() => setExList((p) => p.filter((_, ix) => ix !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Sets</Label>
                        <Input type="number" value={ex.sets}
                          onChange={(e) => setExList((p) => p.map((x, ix) => ix === i ? { ...x, sets: Number(e.target.value) || 0 } : x))} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Reps</Label>
                        <Input type="number" value={ex.reps}
                          onChange={(e) => setExList((p) => p.map((x, ix) => ix === i ? { ...x, reps: Number(e.target.value) || 0 } : x))} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
        <DialogFooter><Button onClick={submit}>Create template</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
