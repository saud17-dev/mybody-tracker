import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  title: string;
  subtitle?: string;
  accent?: "primary" | "gym" | "pt" | "cardio";
  right?: ReactNode;
  children: ReactNode;
}

const accentBg: Record<string, string> = {
  primary: "bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))]",
  gym: "bg-[image:var(--gradient-gym)]",
  pt: "bg-[image:var(--gradient-pt)]",
  cardio: "bg-[image:var(--gradient-cardio)]",
};

export function AppShell({ title, subtitle, accent = "primary", right, children }: AppShellProps) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-md">
        <header className={`safe-top ${accentBg[accent]} px-5 pb-8 pt-6 text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
            </div>
            {right}
          </div>
        </header>
        <main className="-mt-4 rounded-t-3xl bg-background px-4 pb-28 pt-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
