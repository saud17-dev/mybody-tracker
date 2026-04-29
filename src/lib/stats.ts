import { useMemo } from "react";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import type { GymSession, PTSession, CardioSession } from "@/lib/types";

export function useWeeklyCounts(
  gym: GymSession[],
  pt: PTSession[],
  cardio: CardioSession[],
) {
  return useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const inWeek = (d: string) => isWithinInterval(parseISO(d), { start, end });
    return {
      gym: gym.filter((s) => inWeek(s.date)).length,
      pt: pt.filter((s) => inWeek(s.date)).length,
      cardio: cardio.filter((s) => inWeek(s.date)).length,
    };
  }, [gym, pt, cardio]);
}
