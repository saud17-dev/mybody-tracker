import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCheckins, trafficLight, LIGHT_TEXT, todayKey, type Light } from "@/lib/checkin";

const lightStyle: Record<Light, string> = {
  green: "bg-success/15 border-success/40 text-success",
  yellow: "bg-warning/15 border-warning/40 text-warning",
  red: "bg-destructive/15 border-destructive/40 text-destructive",
};
const dot: Record<Light, string> = { green: "bg-success", yellow: "bg-warning", red: "bg-destructive" };

export function TrafficLightBanner({ light, className }: { light: Light; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border p-4", lightStyle[light], className)}>
      <span className={cn("h-4 w-4 shrink-0 rounded-full", dot[light])} />
      <span className="text-sm font-semibold">{LIGHT_TEXT[light]}</span>
    </div>
  );
}

function Picker({ label, value, onChange, low, high }: { label: string; value: number; onChange: (n: number) => void; low: string; high: string }) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={cn("h-11 rounded-xl border text-sm font-bold transition",
              value === n ? "border-primary bg-primary text-primary-foreground" : "bg-muted/40")}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export function DailyCheckinCard() {
  const { today, list, save, saving, loading } = useCheckins();
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [swelling, setSwelling] = useState(false);
  const [soreness, setSoreness] = useState(1);
  const [sleep, setSleep] = useState(3);
  const [note, setNote] = useState("");
  const isSunday = new Date().getDay() === 0;

  if (loading) return null;

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily check-in</h2>
      {today ? (
        <TrafficLightBanner light={trafficLight(today)} />
      ) : (
        <Card className="space-y-4 p-4">
          {isSunday && (
            <div className="rounded-xl bg-accent/15 p-3 text-sm font-semibold text-accent">
              Post-football check — this is the one that matters.
            </div>
          )}
          {([["Left knee", left, setLeft], ["Right knee", right, setRight]] as const).map(([lbl, v, set]) => (
            <div key={lbl}>
              <div className="mb-2 flex justify-between text-sm font-medium"><span>{lbl} pain</span><span className="font-bold text-primary">{v}/10</span></div>
              <Slider min={0} max={10} step={1} value={[v]} onValueChange={([n]) => set(n)} />
            </div>
          ))}
          <label className="flex items-center justify-between text-sm font-medium">
            Swelling
            <Switch checked={swelling} onCheckedChange={setSwelling} />
          </label>
          <Picker label="Soreness / stiffness" value={soreness} onChange={setSoreness} low="None" high="Very" />
          <Picker label="Sleep felt" value={sleep} onChange={setSleep} low="Awful" high="Great" />
          <Textarea placeholder="Note (optional)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          <Button className="h-12 w-full" disabled={saving}
            onClick={() => save({ date: todayKey(), knee_left: left, knee_right: right, swelling, soreness, sleep_felt: sleep, note: note.trim() || null })}>
            Save check-in
          </Button>
        </Card>
      )}
      {list.length > 1 && <KneeTrend list={list} />}
    </section>
  );
}

function KneeTrend({ list }: { list: ReturnType<typeof useCheckins>["list"] }) {
  const data = list.map((c) => {
    const d = parseISO(c.date);
    return { day: format(d, d.getDay() === 6 ? "EEE d" : "d"), left: c.knee_left, right: c.knee_right };
  });
  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold">Knee pain — last 30 days</div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="left" name="Left" stroke="hsl(var(--gym))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="right" name="Right" stroke="hsl(var(--pt))" strokeWidth={2} dot={{ r: 2 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Saturdays are labelled with the day name so football spikes stand out.</p>
    </Card>
  );
}
