import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type ProgramSessionType = "gym" | "pt" | "cardio" | "sport" | "recovery";

export interface TemplateExercise {
  id: string;
  sort_order: number;
  exercise_name: string;
  sets: number | null;
  reps: string | null;
  load_note: string | null;
  coaching_cue: string | null;
  is_knee_critical: boolean;
}

export interface ProgramTemplate {
  id: string;
  code: string;
  name: string;
  session_type: ProgramSessionType;
  day_of_week: number | null;
  target_minutes: number | null;
  notes: string | null;
  sort_order: number;
  exercises: TemplateExercise[];
}

export function useProgramTemplates() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["program_templates", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProgramTemplate[]> => {
      const { data, error } = await supabase
        .from("program_templates")
        .select("*, template_exercises(*)")
        .eq("user_id", user!.id)
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        ...t,
        exercises: [...(t.template_exercises ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
  });
  return { templates: q.data ?? [], loading: q.isLoading };
}

/** First number in a reps string like "5–8", "30–45s", "8 each leg". */
export function parseReps(reps: string | null | undefined, fallback = 8): number {
  const m = String(reps ?? "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : fallback;
}

export function exerciseNote(e: TemplateExercise): string {
  return [e.reps ? `Target: ${e.reps}` : null, e.load_note, e.coaching_cue,
    e.is_knee_critical ? "Knee-critical: stop if pain goes above 3/10." : null]
    .filter(Boolean).join(" · ");
}

/** Which existing logging page handles each session type. */
export function loggingRoute(t: ProgramSessionType): "/gym" | "/pt" | "/cardio" {
  if (t === "gym") return "/gym";
  if (t === "cardio") return "/cardio";
  return "/pt"; // pt, sport, recovery are exercise lists → PT logger
}

const KEY = "program-prefill";
export interface ProgramPrefill { name: string; targetMinutes: number | null; exercises: TemplateExercise[] }
export function setProgramPrefill(p: ProgramPrefill) { sessionStorage.setItem(KEY, JSON.stringify(p)); }
export function takeProgramPrefill(): ProgramPrefill | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try { return JSON.parse(raw); } catch { return null; }
}
