import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/**
 * Floating manual count-up rest stopwatch. Always visible during an active
 * workout session. Tap the main button to start/pause; reset to zero with the
 * reset button.
 */
export function ManualStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const baseRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      baseRef.current = elapsed;
      setRunning(false);
    } else {
      startRef.current = Date.now();
      setRunning(true);
    }
  };

  const reset = () => {
    baseRef.current = 0;
    startRef.current = Date.now();
    setElapsed(0);
  };

  const active = running || elapsed > 0;

  return (
    <div className="pointer-events-none sticky bottom-20 z-20 flex justify-end px-1 pt-2">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-1 rounded-full border-2 bg-card/95 p-1 shadow-lg backdrop-blur transition-colors",
          running ? "border-gym" : active ? "border-emerald-500" : "border-border",
        )}
      >
        <Button
          type="button"
          onClick={toggle}
          size="sm"
          className={cn(
            "h-10 gap-2 rounded-full px-4 font-bold tabular-nums",
            running ? "bg-gym text-white hover:bg-gym/90" : "bg-foreground text-background hover:bg-foreground/90",
          )}
          title={running ? "Pause rest timer" : "Start rest timer"}
        >
          {running ? <Pause className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
          <span className="text-base">{fmt(elapsed)}</span>
        </Button>
        {active && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={reset}
            title="Reset rest timer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        {!active && !running && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={toggle}
            title="Start rest timer"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
