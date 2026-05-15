import { useEffect, ReactNode, useState, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { migrateLocalToCloud } from "@/lib/migrate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Goals from "./pages/Goals";
import Gym from "./pages/Gym";
import PT from "./pages/PT";
import Cardio from "./pages/Cardio";
import Plan from "./pages/Plan";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Nutrition from "./pages/Nutrition";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (user) wasSignedIn.current = true;
  }, [user]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && wasSignedIn.current) {
        toast.error("Session expired — please sign in again");
        navigate("/auth", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function MigrationGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!user) { setDone(true); return; }
    migrateLocalToCloud(user.id).then((res) => {
      if (res.migrated && res.inserted) toast.success(`Imported ${res.inserted} entries from this device`);
      setDone(true);
    }).catch(() => setDone(true));
  }, [user]);
  if (!done) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Syncing…</div>;
  return <>{children}</>;
}

const Shell = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute><MigrationGate>{children}</MigrationGate></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Shell><Goals /></Shell>} />
            <Route path="/plan" element={<Shell><Plan /></Shell>} />
            <Route path="/gym" element={<Shell><Gym /></Shell>} />
            <Route path="/pt" element={<Shell><PT /></Shell>} />
            <Route path="/cardio" element={<Shell><Cardio /></Shell>} />
            <Route path="/nutrition" element={<Shell><Nutrition /></Shell>} />
            <Route path="/exercises" element={<Shell><ExerciseLibrary /></Shell>} />
            <Route path="/settings" element={<Shell><Settings /></Shell>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
