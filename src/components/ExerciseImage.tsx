import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { exerciseImage, fallbackImage } from "@/lib/exerciseImages";

interface Props {
  name: string;
  muscle?: string | null;
  equipment?: string | null;
  className?: string;
  /** Rounded thumbnail (list rows) vs. wide banner (detail sheets). */
  variant?: "thumb" | "banner";
}

export function ExerciseImage({ name, muscle, equipment, className, variant = "thumb" }: Props) {
  const { src } = exerciseImage(name, muscle, equipment);
  const [current, setCurrent] = useState(src);

  useEffect(() => setCurrent(src), [src]);

  return (
    <img
      src={current}
      alt={name}
      loading="lazy"
      width={512}
      height={512}
      onError={() => setCurrent(fallbackImage(name, muscle, equipment))}
      className={cn(
        "shrink-0 bg-muted object-cover",
        variant === "thumb" ? "h-11 w-11 rounded-full" : "h-40 w-full rounded-xl",
        className,
      )}
    />
  );
}
