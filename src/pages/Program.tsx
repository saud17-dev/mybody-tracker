import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { AlertTriangle, Clock, Footprints, Play, Waves, Moon, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePTSessions, uid } from "@/lib/cloud";
import {
  useProgramTemplates, loggingRoute, setProgramPrefill, parseReps, exerciseNote,
  type ProgramTemplate, type ProgramSessionType,
} from "@/lib/program";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STATIC_DAYS: Record<number, { title: string; icon: typeof Moon }> = {
  0: { title: "Rest + knee check (day after football)", icon: Moon },
  4: { title: "Pool or bike, 30–40 min easy", icon: Waves },
};

const typeStyle: Record<ProgramSessionType, string> = {
  gym: "bg-gym/20 text-gym hover:bg-gym/20",
  pt: "bg-pt/20 text-pt hover:bg-pt/20",
  cardio: "bg-cardio/20 text-cardio hover:bg-cardio/20",
  sport: "bg-cardio/20 text-cardio hover:bg-cardio/20",
  recovery: "bg-accent/20 text-accent hover:bg-accent/20",
};
const typeBorder: Record<ProgramSessionType, string> = {
  gym: "border-l-gym", pt: "border-l-pt", cardio: "border-l-cardio", sport: "border-l-cardio", recovery: "border-l-accent",
};

const KNEE_TIP = "Stop if pain goes above 3/10.";

export default function Program() {
  const { templates, loading } = useProgramTemplates();
  const pt = usePTSessions();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ProgramTemplate | null>(null);
  const [starting, setStarting] = useState(false);
  const todayDow = new Date().getDay();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const knee = templates.find((t) => t.code === "KNEE");
  const unscheduled = templates.filter((t) => t.day_of_week == null);

  const start = async (t: ProgramTemplate) => {
    setStarting(true);
    try {
      if (t.session_type === "gym" && knee) {
        const now = new Date().toISOString();
        await pt.create({
          date: now, startedAt: now, endedAt: now,
          overallNotes: `${knee.name} (auto with ${t.name})`,
          exercises: knee.exercises.map((e) => ({
            id: uid(), exerciseName: e.exercise_name, category: "Program", notes: exerciseNote(e),
            sets: Array.from({ length: e.sets || 1 }, () => ({ reps: parseReps(e.reps, 10), painScale: 2 })),
          })),
        });
        toast.success(`${knee.name} logged as a PT session`);
      }
      setProgramPrefill({ name: t.name, targetMinutes: t.target_minutes, exercises: t.exercises });
      navigate(loggingRoute(t.session_type));
    } catch {
      /* error toast handled by mutation */
    } finally {
      setStarting(false);
    }
  };

  return (
    <AppShell title="Program" subtitle="Your week, Sunday → Saturday" accent="primary">
      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {DAYS.map((day, dow) => {
          const date = addDays(weekStart, dow);
          const isToday = dow === todayDow;
          const tpls = templates.filter((t) => t.day_of_week === dow);
          const stat = STATIC_DAYS[dow];
          return (
            <div key={day}>
              <div className="mb-1.5 flex items-baseline gap-2 px-1">
                <span className={cn("text-sm font-bold", isToday ? "text-primary" : "text-foreground")}>{day}</span>
                <span className="text-xs text-muted-foreground">{format(date, "MMM d")}</span>
                {isToday && <Badge className="h-5 px-2 text-[10px]">Today</Badge>}
              </div>
              {tpls.length > 0 ? tpls.map((t) => (
                <TemplateCard key={t.id} t={t} onClick={() => setSelected(t)} highlight={isToday} />
              )) : stat ? (
                <Card className="flex items-center gap-3 border-dashed p-4">
                  <stat.icon className="h-5 w-5 shrink-0 text-accent" />
                  <span className="text-sm font-medium">{stat.title}</span>
                </Card>
              ) : (
                <Card className="flex items-center gap-3 border-dashed p-4 text-muted-foreground">
                  <Footprints className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Walk only — 20–30 min</span>
                </Card>
              )}
            </div>
          );
        })}

        {unscheduled.length > 0 && (
          <div className="pt-2">
            <div className="mb-1.5 px-1 text-sm font-bold">Any day</div>
            {unscheduled.map((t) => <TemplateCard key={t.id} t={t} onClick={() => setSelected(t)} />)}
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="flex max-h-[90vh] flex-col rounded-t-2xl p-0">
          {selected && (
            <>
              <SheetHeader className="border-b p-4 text-left">
                <div className="flex items-center gap-2">
                  <Badge className={cn("uppercase", typeStyle[selected.session_type])}>{selected.session_type}</Badge>
                  {selected.target_minutes && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />{selected.target_minutes} min
                    </span>
                  )}
                </div>
                <SheetTitle className="text-xl">{selected.name}</SheetTitle>
                {selected.notes && <p className="text-sm text-muted-foreground">{selected.notes}</p>}
              </SheetHeader>
              <ol className="flex-1 space-y-2 overflow-y-auto p-4">
                {selected.exercises.map((e, i) => (
                  <li key={e.id} className={cn("rounded-xl border bg-card p-3", e.is_knee_critical && "border-destructive/50")}>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold leading-tight">{e.exercise_name}</span>
                          {e.is_knee_critical && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button title={KNEE_TIP} aria-label={`Knee-critical: ${KNEE_TIP}`}
                                  className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                                  <AlertTriangle className="h-3.5 w-3.5" />Knee
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="left" className="w-auto text-sm">{KNEE_TIP}</PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="mt-1 text-sm font-medium text-primary">
                          {e.sets ?? "–"} × {e.reps ?? "–"}
                          {e.load_note && <span className="ml-2 text-muted-foreground">· {e.load_note}</span>}
                        </div>
                        {e.coaching_cue && <p className="mt-1 text-xs text-muted-foreground">{e.coaching_cue}</p>}
                      </div>
                    </div>
                  </li>
                ))}
                {selected.session_type === "gym" && knee && (
                  <li className="rounded-xl bg-pt/10 p-3 text-xs text-pt">
                    Starting also logs your {knee.name} as a PT session for today.
                  </li>
                )}
              </ol>
              <div className="border-t p-4 safe-bottom">
                <Button size="lg" className="h-14 w-full text-base" disabled={starting} onClick={() => start(selected)}>
                  <Play className="mr-2 h-5 w-5" />Start this session
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function TemplateCard({ t, onClick, highlight }: { t: ProgramTemplate; onClick: () => void; highlight?: boolean }) {
  return (
    <Card onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn("mb-2 flex cursor-pointer items-center gap-3 border-l-4 p-4 transition active:scale-[0.98]",
        typeBorder[t.session_type], highlight && "ring-2 ring-primary")}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold">{t.name}</div>
        <div className="mt-1 flex items-center gap-2">
          <Badge className={cn("text-[10px] uppercase", typeStyle[t.session_type])}>{t.session_type}</Badge>
          {t.target_minutes && <span className="text-xs text-muted-foreground">{t.target_minutes} min</span>}
          <span className="text-xs text-muted-foreground">· {t.exercises.length} exercises</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Card>
  );
}
