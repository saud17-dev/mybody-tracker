import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export interface Checkin {
  date: string; // yyyy-MM-dd
  knee_left: number | null;
  knee_right: number | null;
  swelling: boolean | null;
  soreness: number | null;
  sleep_felt: number | null;
  note: string | null;
}

export type Light = "green" | "yellow" | "red";

export const LIGHT_TEXT: Record<Light, string> = {
  green: "Train as planned",
  yellow: "Reduce range, cut knee-loading volume 40%, no impact",
  red: "No lower-body loading today. Upper body and mobility only.",
};

/** Worse knee drives it. Swelling → red. Soreness ≥3 counts as stiffness → at least yellow. */
export function trafficLight(c: Checkin): Light {
  const knee = Math.max(c.knee_left ?? 0, c.knee_right ?? 0);
  if (c.swelling || knee >= 4) return "red";
  if (knee >= 2 || (c.soreness ?? 0) >= 3) return "yellow";
  return "green";
}

export const todayKey = () => format(new Date(), "yyyy-MM-dd");

export function useCheckins() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["checkins", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Checkin[]> => {
      const since = format(subDays(new Date(), 29), "yyyy-MM-dd");
      const { data, error } = await supabase.from("daily_checkin").select("*")
        .eq("user_id", user!.id).gte("date", since).order("date");
      if (error) throw error;
      return data ?? [];
    },
  });
  const save = useMutation({
    mutationFn: async (c: Checkin) => {
      const { error } = await supabase.from("daily_checkin").upsert({ ...c, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins", user?.id] }),
    onError: () => toast.error("Couldn't save check-in"),
  });
  const list = q.data ?? [];
  const today = list.find((c) => c.date === todayKey()) ?? null;
  return { list, today, loading: q.isLoading, save: save.mutateAsync, saving: save.isPending };
}
