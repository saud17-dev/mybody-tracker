import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface AppShellProps {
  title: string;
  subtitle?: string;
  accent?: "primary" | "gym" | "pt" | "cardio";
  right?: ReactNode;
  children: ReactNode;
}

function UserMenu() {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white hover:bg-white/25 transition"
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
  );
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
      <TopNav />
      <div className="mx-auto max-w-md md:max-w-6xl md:px-6 md:pt-8">
        <header
          className={cn(
            "safe-top px-5 pb-8 pt-6 text-white",
            accentBg[accent],
            "md:rounded-3xl md:px-8 md:pb-10 md:pt-8 md:shadow-[var(--shadow-elevated)]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-white/80 md:text-base">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {right}
              <div className="md:hidden">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>
        <main className="-mt-4 rounded-t-3xl bg-background px-4 pb-28 pt-6 md:mt-6 md:rounded-none md:bg-transparent md:px-0 md:pb-12 md:pt-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
