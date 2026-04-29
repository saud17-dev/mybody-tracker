import { NavLink } from "react-router-dom";
import { Dumbbell, HeartPulse, Activity, Target, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Goals", icon: Target, end: true },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/gym", label: "Gym", icon: Dumbbell },
  { to: "/pt", label: "PT", icon: HeartPulse },
  { to: "/cardio", label: "Cardio", icon: Activity },
];

const colorMap: Record<string, string> = {
  "/": "text-primary",
  "/plan": "text-accent",
  "/gym": "text-gym",
  "/pt": "text-pt",
  "/cardio": "text-cardio",
};

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-xl safe-bottom">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                    isActive ? colorMap[it.to] : "text-muted-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                    <span>{it.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
