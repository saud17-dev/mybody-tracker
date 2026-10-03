import { useEffect, useState, useCallback } from "react";
import { Copy, KeyRound, AlertTriangle, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Tok = { id: string; label: string | null; scope: string; created_at: string; expires_at: string | null; last_used_at: string | null; revoked_at: string | null };
type Audit = { id: number; created_at: string; tool_name: string; dry_run: boolean; rows_affected: number | null; result_summary: string | null; arguments: unknown };

const MCP_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/fitness-mcp`;
const fmt = (d: string | null) => (d ? format(new Date(d), "d MMM yyyy") : "—");

export default function ApiAccess() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<Tok[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [hideDry, setHideDry] = useState(false);
  const [label, setLabel] = useState("Claude");
  const [scope, setScope] = useState<"read" | "write">("read");
  const [days, setDays] = useState("90");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [t, a] = await Promise.all([
      supabase.from("api_tokens").select("id,label,scope,created_at,expires_at,last_used_at,revoked_at").order("created_at", { ascending: false }),
      supabase.from("agent_audit").select("id,created_at,tool_name,dry_run,rows_affected,result_summary,arguments").order("created_at", { ascending: false }).limit(100),
    ]);
    setTokens((t.data ?? []) as Tok[]);
    setAudit((a.data ?? []) as Audit[]);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-api-tokens", { body: { action: "create", label, scope, days: Number(days) } });
    setBusy(false);
    if (error || !data?.token) return toast.error("Couldn't create token");
    setFresh(data.token); load();
  };
  const revoke = async (id: string) => {
    const { error } = await supabase.functions.invoke("manage-api-tokens", { body: { action: "revoke", id } });
    if (error) return toast.error("Couldn't revoke"); toast.success("Token revoked"); load();
  };
  const status = (t: Tok) => t.revoked_at ? "Revoked" : t.expires_at && new Date(t.expires_at) <= new Date() ? "Expired" : "Active";
  const rows = hideDry ? audit.filter((a) => !a.dry_run) : audit;

  return (
    <AppShell title="API access" subtitle="Let Claude read and log for you" accent="primary">
      <Card className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground">MCP server address</p>
        <div className="flex gap-2">
          <code className="flex-1 truncate rounded bg-muted px-2 py-2 text-xs">{MCP_URL}</code>
          <Button size="icon" variant="outline" aria-label="Copy address" onClick={() => { navigator.clipboard.writeText(MCP_URL); toast.success("Copied"); }}><Copy className="h-4 w-4" /></Button>
        </div>
      </Card>

      <h2 className="mt-6 mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Create token</h2>
      <Card className="p-4 space-y-3">
        <div><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Access</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "read" | "write")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="read">Read only</SelectItem><SelectItem value="write">Read + write</SelectItem></SelectContent>
            </Select></div>
          <div><Label>Expires in</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="30">30 days</SelectItem><SelectItem value="90">90 days</SelectItem><SelectItem value="365">365 days</SelectItem></SelectContent>
            </Select></div>
        </div>
        <Button className="w-full" disabled={busy || !label.trim()} onClick={create}><KeyRound className="h-4 w-4 mr-2" />Create token</Button>
        {fresh && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive"><AlertTriangle className="h-3.5 w-3.5" />Copy it now — it won't be shown again.</p>
            <div className="flex gap-2">
              <code className="flex-1 break-all rounded bg-muted px-2 py-2 text-xs">{fresh}</code>
              <Button size="icon" variant="outline" aria-label="Copy token" onClick={() => { navigator.clipboard.writeText(fresh); toast.success("Copied"); }}><Copy className="h-4 w-4" /></Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setFresh(null)}>I've saved it</Button>
          </div>
        )}
      </Card>

      <h2 className="mt-6 mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">My tokens</h2>
      <div className="space-y-2">
        {tokens.length === 0 && <p className="px-1 text-sm text-muted-foreground">No tokens yet.</p>}
        {tokens.map((t) => (
          <Card key={t.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{t.label || "Untitled"}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant={t.scope === "write" ? "default" : "secondary"}>{t.scope}</Badge>
                  <Badge variant={status(t) === "Active" ? "outline" : "destructive"}>{status(t)}</Badge>
                </div>
              </div>
              {status(t) === "Active" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-destructive">Revoke</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Revoke "{t.label}"?</AlertDialogTitle>
                      <AlertDialogDescription>Anything using this token will stop working immediately. This can't be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => revoke(t.id)}>Revoke</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
              <span>Created<br /><b className="text-foreground">{fmt(t.created_at)}</b></span>
              <span>Expires<br /><b className="text-foreground">{fmt(t.expires_at)}</b></span>
              <span>Last used<br /><b className="text-foreground">{fmt(t.last_used_at)}</b></span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h2>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Hide dry runs <Switch checked={hideDry} onCheckedChange={setHideDry} /></label>
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && <p className="px-1 text-sm text-muted-foreground">No activity yet.</p>}
        {rows.map((a) => (
          <Card key={a.id} className="p-3">
            <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.tool_name}</p>
                <p className="text-[11px] text-muted-foreground">{format(new Date(a.created_at), "d MMM, HH:mm:ss")} · {a.dry_run ? "dry run" : "real"} · {a.rows_affected ?? 0} rows</p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === a.id ? "rotate-180" : ""}`} />
            </button>
            {open === a.id && (
              <div className="mt-2 space-y-1">
                {a.result_summary && <p className="text-xs">{a.result_summary}</p>}
                <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(a.arguments, null, 2)}</pre>
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
