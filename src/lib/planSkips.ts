// Per-week "skip this day" markers — keep the saved schedule intact
// but treat a day as Rest for the current week only.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { toast } from "sonner";

// ISO week start = Monday at 00:00 in local TZ, formatted YYYY-MM-DD.
export function currentWeekStart(d = new Date()): string {
  const day = d.getDay(); // 0 Sun..6 Sat
  const diffToMon = (day + 6) % 7; // Mon=>0, Tue=>1, ..., Sun=>6
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diffToMon);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function usePlanSkips() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const week = currentWeekStart();

  const q = useQuery({
    queryKey: ["plan_skips", user?.id, week],
    enabled: !!user,
    queryFn: async (): Promise<Set<number>> => {
      const { data, error } = await supabase
        .from("plan_skips")
        .select("day_of_week")
        .eq("user_id", user!.id)
        .eq("week_start", week);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.day_of_week));
    },
  });

  const toggle = useMutation({
    mutationFn: async (dow: number) => {
      const skipped = q.data ?? new Set<number>();
      if (skipped.has(dow)) {
        const { error } = await supabase
          .from("plan_skips")
          .delete()
          .eq("user_id", user!.id)
          .eq("week_start", week)
          .eq("day_of_week", dow);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("plan_skips")
          .insert({ user_id: user!.id, week_start: week, day_of_week: dow });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan_skips", user?.id, week] }),
    onError: (e: any) => toast.error(e?.message || "Could not update skip"),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("plan_skips")
        .delete()
        .eq("user_id", user!.id)
        .eq("week_start", week);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan_skips", user?.id, week] }),
    onError: (e: any) => toast.error(e?.message || "Could not reset"),
  });

  return {
    week,
    skipped: q.data ?? new Set<number>(),
    toggle: toggle.mutateAsync,
    clearAll: clearAll.mutateAsync,
  };
}
