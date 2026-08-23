// Per-week "skip this day" markers — keep the saved schedule intact
// but treat a day as Rest for the current week only.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { toast } from "sonner";

// Week start = Sunday at 00:00 in local TZ, formatted YYYY-MM-DD.
export function currentWeekStart(d = new Date()): string {
  const day = d.getDay(); // 0 Sun..6 Sat
  const sunday = new Date(d);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(sunday.getDate() - day);
  const yyyy = sunday.getFullYear();
  const mm = String(sunday.getMonth() + 1).padStart(2, "0");
  const dd = String(sunday.getDate()).padStart(2, "0");
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
