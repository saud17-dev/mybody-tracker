import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, Play, AlertTriangle, Sparkles, ListChecks, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TEMPLATES,
  getCurrentPhase,
  getCurrentWeek,
  getTodayTemplate,
  exercisesForPhase,
  KNEE_RULES,
  RULES_FOR_SHARP,
  PLAN_META,
  type WorkoutTemplate,
} from "@/lib/plan";
import { cn } from "@/lib/utils";

const moduleColor = {
  gym: "bg-gym/10 text-gym",
  pt: "bg-pt/10 text-pt",
  cardio: "bg-cardio/10 text-cardio",
} as const;

const moduleRoute = { gym: "/gym", pt: "/pt", cardio: "/cardio" } as const;

function TemplateCard({ tpl, phaseId, highlight = false }: { tpl: WorkoutTemplate; phaseId: number; highlight?: boolean }) {
  const navigate = useNavigate();
  const exCount =
    tpl.gym ? exercisesForPhase(tpl.gym, phaseId).length :
    tpl.pt ? tpl.pt.length :
    tpl.cardio ? 1 : 0;

  return (
    <Card className={cn("overflow-hidden", highlight && "ring-2 ring-primary shadow-[var(--shadow-elevated)]")}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="text-2xl">{tpl.emoji}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tpl.dayLabel}</p>
          <p className="truncate font-semibold">{tpl.title}</p>
        </div>
        <Badge variant="secondary" className={cn("shrink-0 capitalize", moduleColor[tpl.module])}>
          {tpl.module}
        </Badge>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-xs">
        <span className="text-muted-foreground">
          {tpl.module === "cardio"
            ? `${tpl.cardio?.activity} · ${tpl.cardio?.durationMin} min`
            : `${exCount} exercises`}
        </span>
        <Button
          size="sm"
          className="h-7 gap-1"
          onClick={() => navigate(`${moduleRoute[tpl.module]}?template=${tpl.id}`)}
        >
          <Play className="h-3 w-3" /> Start
        </Button>
      </div>
    </Card>
  );
}

export default function Plan() {
  const today = new Date();
  const phase = useMemo(() => getCurrentPhase(today), []);
  const week = useMemo(() => getCurrentWeek(today), []);
  const todayTpl = useMemo(() => getTodayTemplate(today), []);
  // Sort templates Mon..Sun
  const ordered = useMemo(() => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return [...TEMPLATES].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
  }, []);

  return (
    <AppShell
      title="Summer Plan"
      subtitle={`${PLAN_META.athlete} · ${format(today, "EEEE, MMM d")}`}
      accent="primary"
    >
      {/* Phase tracker */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
            Phase {phase.id} of 3 · Week {week}
          </p>
          <p className="mt-1 text-xl font-bold">{phase.name}</p>
          <p className="mt-0.5 text-xs opacity-80">Weeks {phase.weeks}</p>
        </div>
        <p className="px-5 py-4 text-sm text-muted-foreground">{phase.goal}</p>
      </Card>

      {/* Today */}
      {todayTpl && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Today
          </h2>
          <TemplateCard tpl={todayTpl} phaseId={phase.id} highlight />
        </section>
      )}

      {/* Weekly schedule */}
      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Weekly schedule
        </h2>
        <div className="space-y-2.5">
          {ordered.map((t) => (
            <TemplateCard key={t.id} tpl={t} phaseId={phase.id} highlight={t.id === todayTpl?.id} />
          ))}
        </div>
      </section>

      {/* Patella alta */}
      <section className="mt-7">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" /> Knee rules (Patella Alta)
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">Always avoid</p>
            <ul className="space-y-1.5 text-sm">
              {KNEE_RULES.avoid.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-destructive">✗</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">What helps</p>
            <ul className="space-y-1.5 text-sm">
              {KNEE_RULES.helps.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Rules for sharp */}
      <section className="mt-7">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Rules for looking sharp
        </h2>
        <Card className="p-4">
          <ol className="space-y-2 text-sm">
            {RULES_FOR_SHARP.map((r, i) => (
              <li key={r} className="flex gap-3">
                <span className="font-bold text-primary tabular-nums">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* Phases overview */}
      <section className="mt-7">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" /> All phases
        </h2>
        <div className="space-y-2">
          {PLAN_META.phases.map((p) => (
            <Card key={p.id} className={cn("p-4", p.id === phase.id && "border-primary")}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  Phase {p.id} — {p.name}
                </p>
                <span className="text-xs text-muted-foreground">Wk {p.weeks}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.goal}</p>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
