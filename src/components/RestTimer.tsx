import { useEffect, useState, useRef } from "react";
import { Pause, Play, SkipForward, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  onClose: () => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export function RestTimer({ initialSeconds, onComplete, onClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startRef = useRef(Date.now());
  const baseRef = useRef(initialSeconds);

  useEffect(() => {
    if (paused || completed) return;
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const next = baseRef.current - elapsed;
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(id);
        setCompleted(true);
        try {
          // brief beep
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
        onComplete?.();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [paused, completed, onComplete]);

  const adjust = (delta: number) => {
    baseRef.current = Math.max(5, baseRef.current + delta);
    startRef.current = Date.now();
    setRemaining(baseRef.current);
    setCompleted(false);
  };

  const restart = () => {
    baseRef.current = initialSeconds;
    startRef.current = Date.now();
    setRemaining(initialSeconds);
    setPaused(false);
    setCompleted(false);
  };

  const done = completed;
  const pct = Math.max(0, Math.min(100, (remaining / initialSeconds) * 100));

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-3 pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto">
        <Card className={cn(
          "overflow-hidden shadow-lg border-2",
          done ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-gym",
        )}>
          <div className="relative">
            <div
              className={cn("absolute left-0 top-0 h-full transition-[width] duration-300 ease-linear", done ? "bg-emerald-500/20" : "bg-gym/20")}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {done ? "Rest complete" : "Rest"}
                </span>
                <span className={cn("text-3xl font-bold tabular-nums", done && "text-emerald-600")}>
                  {fmt(Math.max(0, remaining))}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => adjust(-15)} disabled={done}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => adjust(15)} disabled={done}>
                  <Plus className="h-4 w-4" />
                </Button>
                {done ? (
                  <Button size="sm" variant="outline" className="h-9" onClick={restart}>
                    <Play className="h-4 w-4 mr-1" /> Again
                  </Button>
                ) : (
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => {
                    if (paused) {
                      // resume: rebase
                      baseRef.current = remaining;
                      startRef.current = Date.now();
                    }
                    setPaused((p) => !p);
                  }}>
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onClose}>
                  {done ? <X className="h-4 w-4" /> : <SkipForward className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
