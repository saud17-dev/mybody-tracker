import { NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, HeartPulse, Activity, Target, CalendarDays, LogOut, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const items = [
  { to: "/", label: "Goals", icon: Target, end: true, color: "text-primary" },
  { to: "/plan", label: "Plan", icon: CalendarDays, color: "text-accent" },
  { to: "/gym", label: "Gym", icon: Dumbbell, color: "text-gym" },
  { to: "/pt", label: "PT", icon: HeartPulse, color: "text-pt" },
  { to: "/cardio", label: "Cardio", icon: Activity, color: "text-cardio" },
];

export function TopNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials =
    (user?.email || "?")
      .split("@")[0]
      .split(/[._-]/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-40 hidden border-b bg-card/95 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-white">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">MyBody</span>
        </div>
        <ul className="flex flex-1 items-center justify-center gap-1">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? `${it.color} bg-muted`
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{it.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground hover:bg-muted/70 transition"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <SettingsIcon className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async () => {
                await signOut();
                toast.success("Signed out");
                navigate("/auth");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
