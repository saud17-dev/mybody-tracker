import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async (email: string, password: string) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (e: any) { return toast.error(e.errors?.[0]?.message || "Invalid input"); }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate("/");
  };

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (e: any) { return toast.error(e.errors?.[0]?.message || "Invalid input"); }
    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName.trim() || email.split("@")[0] },
      },
    });
    if (signUpError) {
      setSubmitting(false);
      return toast.error(signUpError.message);
    }
    // Auto sign-in (email confirmation is disabled server-side).
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) return toast.error(signInError.message);
    toast.success("Account created — you're in!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-gym/5 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-white shadow-lg">
            <Dumbbell className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Fitness Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Train. Log. Progress.</p>
        </div>
        <Card className="p-5">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm onSubmit={handleSignIn} submitting={submitting} /></TabsContent>
            <TabsContent value="signup"><SignUpForm onSubmit={handleSignUp} submitting={submitting} /></TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function SignInForm({ onSubmit, submitting }: { onSubmit: (e: string, p: string) => void; submitting: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(email, password); }}>
      <div className="space-y-1.5">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-pwd">Password</Label>
        <Input id="si-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm({ onSubmit, submitting }: { onSubmit: (e: string, p: string, n: string) => void; submitting: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(email, password, name); }}>
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Display name</Label>
        <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pwd">Password</Label>
        <Input id="su-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={6} />
        <p className="text-[10px] text-muted-foreground">At least 6 characters. Strong passwords recommended.</p>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}
