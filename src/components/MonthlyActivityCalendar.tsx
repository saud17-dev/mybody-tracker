import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay,
  isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell, HeartPulse, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { GymSession, PTSession, CardioSession } from "@/lib/types";

interface Props {
  gym: GymSession[];
  pt: PTSession[];
  cardio: CardioSession[];
}

interface DayInfo {
  gym: number;
  pt: number;
  cardio: number;
  items: { module: "gym" | "pt" | "cardio"; label: string }[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthlyActivityCalendar({ gym, pt, cardio }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const today = new Date();

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const dayMap = useMemo(() => {
    const map = new Map<string, DayInfo>();
    const ensure = (key: string) => {
      let d = map.get(key);
      if (!d) { d = { gym: 0, pt: 0, cardio: 0, items: [] }; map.set(key, d); }
      return d;
    };
    const safeKey = (iso: string) => {
      try { return format(parseISO(iso), "yyyy-MM-dd"); } catch { return null; }
    };
    for (const s of gym) {
      const k = safeKey(s.date); if (!k) continue;
      const info = ensure(k); info.gym += 1;
      const names = s.exercises.map((e) => e.exerciseName).slice(0, 3).join(", ");
      info.items.push({ module: "gym", label: names || "Gym session" });
    }
    for (const s of pt) {
      const k = safeKey(s.date); if (!k) continue;
      const info = ensure(k); info.pt += 1;
      info.items.push({ module: "pt", label: `PT · ${s.exercises.length} exercise${s.exercises.length === 1 ? "" : "s"}` });
    }
    for (const s of cardio) {
      const k = safeKey(s.date); if (!k) continue;
      const info = ensure(k); info.cardio += 1;
      info.items.push({ module: "cardio", label: `${s.activity} · ${s.durationMin}m${s.distanceKm ? ` · ${s.distanceKm}km` : ""}` });
    }
    return map;
  }, [gym, pt, cardio]);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const d of days) {
      if (!isSameMonth(d, cursor)) continue;
      const info = dayMap.get(format(d, "yyyy-MM-dd"));
      if (info && (info.gym + info.pt + info.cardio) > 0) n += 1;
    }
    return n;
  }, [days, dayMap, cursor]);

  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{format(cursor, "MMMM yyyy")}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{activeCount} active day{activeCount === 1 ? "" : "s"}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{w}</div>
        ))}
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const info = dayMap.get(key);
          const inMonth = isSameMonth(d, cursor);
          const isToday = isSameDay(d, today);
          const isFuture = isAfter(d, today) && !isToday;
          const total = (info?.gym ?? 0) + (info?.pt ?? 0) + (info?.cardio ?? 0);
          const allThree = info && info.gym > 0 && info.pt > 0 && info.cardio > 0;

          const cell = (
            <button
              type="button"
              disabled={!info}
              className={cn(
                "relative flex aspect-square w-full flex-col items-center justify-center rounded-lg border text-xs transition-all",
                "md:rounded-xl md:text-sm",
                inMonth ? "border-border/60 bg-card" : "border-transparent bg-muted/30 text-muted-foreground/50",
                isFuture && "opacity-40",
                isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                allThree && "bg-gradient-to-br from-gym/15 via-pt/15 to-cardio/15 border-primary/30",
                info && "hover:scale-[1.04] cursor-pointer hover:shadow-md",
              )}
            >
              <span className={cn("font-semibold tabular-nums", isToday && "text-primary")}>{format(d, "d")}</span>
              {total > 0 && (
                <div className="mt-0.5 flex items-center gap-0.5">
                  {info!.gym > 0 && <span className="h-1.5 w-1.5 rounded-full bg-gym md:h-2 md:w-2" />}
                  {info!.pt > 0 && <span className="h-1.5 w-1.5 rounded-full bg-pt md:h-2 md:w-2" />}
                  {info!.cardio > 0 && <span className="h-1.5 w-1.5 rounded-full bg-cardio md:h-2 md:w-2" />}
                </div>
              )}
            </button>
          );

          if (!info) return <div key={key}>{cell}</div>;
          return (
            <Popover key={key}>
              <PopoverTrigger asChild>{cell}</PopoverTrigger>
              <PopoverContent className="w-60 p-3" align="center">
                <p className="text-xs font-semibold">{format(d, "EEEE, MMM d")}</p>
                <ul className="mt-2 space-y-1.5">
                  {info.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        it.module === "gym" && "bg-gym/15 text-gym",
                        it.module === "pt" && "bg-pt/15 text-pt",
                        it.module === "cardio" && "bg-cardio/15 text-cardio",
                      )}>
                        {it.module === "gym" && <Dumbbell className="h-3 w-3" />}
                        {it.module === "pt" && <HeartPulse className="h-3 w-3" />}
                        {it.module === "cardio" && <Activity className="h-3 w-3" />}
                      </span>
                      <span className="truncate">{it.label}</span>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gym" /> Gym</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pt" /> PT</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cardio" /> Cardio</span>
      </div>
    </Card>
  );
}
