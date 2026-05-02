import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExerciseCountdownProps {
  defaultSeconds?: number;
  className?: string;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export function ExerciseCountdown({ defaultSeconds = 30, className }: ExerciseCountdownProps) {
  const [base, setBase] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const startRef = useRef<number>(0);
  const baseAtStartRef = useRef<number>(defaultSeconds);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const next = baseAtStartRef.current - elapsed;
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(id);
        setRunning(false);
        setDone(true);
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; o.type = "sine";
          g.gain.setValueAtTime(0.3, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          o.start(); o.stop(ctx.currentTime + 0.4);
        } catch {}
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (done) {
      setRemaining(base);
      baseAtStartRef.current = base;
      startRef.current = Date.now();
      setDone(false);
      setRunning(true);
      return;
    }
    if (running) {
      setRunning(false);
    } else {
      baseAtStartRef.current = remaining > 0 ? remaining : base;
      startRef.current = Date.now();
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setRemaining(base);
  };

  const adjust = (delta: number) => {
    const nb = Math.max(5, base + delta);
    setBase(nb);
    if (!running) setRemaining(nb);
  };

  return (
    <div className={cn(
      "flex items-center gap-1 rounded-lg border px-2 py-1.5",
      done ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : running ? "border-pt bg-pt/5" : "border-border bg-muted/30",
      className,
    )}>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjust(-15)}>
        <Minus className="h-3 w-3" />
      </Button>
      <span className={cn(
        "min-w-[3.2rem] text-center font-bold tabular-nums text-sm",
        done && "text-emerald-600",
        running && "text-pt",
      )}>
        {fmt(Math.max(0, remaining))}
      </span>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjust(15)}>
        <Plus className="h-3 w-3" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={toggle}>
        {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={reset}>
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
