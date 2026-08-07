import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const fmtClock = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

/* ------------------------------------------------------------------ */
/* Bottom rest bar: shown while a rest countdown is running            */
/* ------------------------------------------------------------------ */
export function RestBar({
  seconds,
  onDone,
  onSkip,
}: {
  seconds: number;
  onDone?: () => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const baseRef = useRef(seconds);
  const startRef = useRef(Date.now());
  const totalRef = useRef(seconds);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => {
      const next = baseRef.current - Math.floor((Date.now() - startRef.current) / 1000);
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(id);
        setFinished(true);
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; o.type = "sine";
          g.gain.setValueAtTime(0.3, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          o.start(); o.stop(ctx.currentTime + 0.4);
        } catch { /* ignore */ }
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        onDone?.();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [finished, onDone]);

  const adjust = (d: number) => {
    baseRef.current = Math.max(5, remaining + d);
    totalRef.current = Math.max(totalRef.current, baseRef.current);
    startRef.current = Date.now();
    setRemaining(baseRef.current);
    setFinished(false);
  };

  const pct = Math.max(0, Math.min(100, (remaining / totalRef.current) * 100));

  return (
    <div className="border-t bg-card">
      <div className="h-1 w-full bg-muted">
        <div
          className={cn("h-full transition-[width] duration-300 ease-linear", finished ? "bg-success" : "bg-gym")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="px-4 pb-3 pt-2">
        <p className={cn("text-center text-4xl font-bold tabular-nums", finished && "text-success")}>
          {fmtClock(Math.max(0, remaining))}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Button variant="secondary" onClick={() => adjust(-15)}>-15</Button>
          <Button variant="secondary" onClick={() => adjust(15)}>+15</Button>
          <Button className="bg-gym text-module-foreground hover:bg-gym/90" onClick={onSkip}>
            {finished ? "Done" : "Skip"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Clock sheet: Timer / Stopwatch                                      */
/* ------------------------------------------------------------------ */
export function ClockSheet({
  open,
  onOpenChange,
  defaultSeconds,
  onStartRest,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultSeconds: number;
  onStartRest: (seconds: number) => void;
}) {
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  const [target, setTarget] = useState(defaultSeconds);

  useEffect(() => { if (open) setTarget(defaultSeconds); }, [open, defaultSeconds]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <p className="text-center text-base font-semibold">Clock</p>

        <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-1 rounded-xl border p-1">
          {(["timer", "stopwatch"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg py-2.5 text-sm font-semibold capitalize transition-colors",
                mode === m ? "bg-gym text-module-foreground" : "text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "timer" ? (
          <div className="mt-6 flex flex-col items-center gap-5 pb-4">
            <div className="flex w-full max-w-sm items-center justify-between">
              <button type="button" className="text-sm font-semibold text-gym"
                onClick={() => setTarget((t) => Math.max(15, t - 15))}>-15s</button>
              <div className="flex h-44 w-44 items-center justify-center rounded-full border-8 border-gym">
                <span className="text-4xl font-bold tabular-nums">{fmtClock(target)}</span>
              </div>
              <button type="button" className="text-sm font-semibold text-gym"
                onClick={() => setTarget((t) => t + 15)}>+15s</button>
            </div>
            <Button size="lg" className="w-full max-w-sm bg-gym text-module-foreground hover:bg-gym/90"
              onClick={() => { onStartRest(target); onOpenChange(false); }}>
              Start
            </Button>
          </div>
        ) : (
          <StopwatchPanel />
        )}
      </SheetContent>
    </Sheet>
  );
}

function StopwatchPanel() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const baseRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) { baseRef.current = elapsed; setRunning(false); }
    else { startRef.current = Date.now(); setRunning(true); }
  };
  const reset = () => { baseRef.current = 0; startRef.current = Date.now(); setElapsed(0); };

  return (
    <div className="mt-6 flex flex-col items-center gap-5 pb-4">
      <div className="flex h-44 w-44 items-center justify-center rounded-full border-8 border-accent">
        <span className="text-4xl font-bold tabular-nums">{fmtClock(elapsed)}</span>
      </div>
      <div className="flex w-full max-w-sm gap-2">
        <Button size="lg" className="flex-1 bg-gym text-module-foreground hover:bg-gym/90" onClick={toggle}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Start"}
        </Button>
        <Button size="lg" variant="secondary" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
