import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { BottomNav } from "./BottomNav";
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
      <div className="mx-auto max-w-md">
        <header className={`safe-top ${accentBg[accent]} px-5 pb-8 pt-6 text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {right}
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="-mt-4 rounded-t-3xl bg-background px-4 pb-28 pt-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
