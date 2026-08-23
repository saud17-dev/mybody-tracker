import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  muscle?: string | null;
  equipment?: string | null;
  extra?: string | null;
  className?: string;
}

/** Shared muscle + recommended-equipment tags used by the library and all pickers. */
export function ExerciseTags({ muscle, equipment, extra, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {muscle && <Badge variant="secondary" className="text-[10px]">{muscle}</Badge>}
      {equipment && <Badge variant="outline" className="text-[10px]">{equipment}</Badge>}
      {extra && <Badge variant="outline" className="text-[10px] opacity-70">{extra}</Badge>}
    </div>
  );
}
