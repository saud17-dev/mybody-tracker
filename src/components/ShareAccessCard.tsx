import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Copy, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

type TokenRow = {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-data`;

export function ShareAccessCard() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("Claude access");
  const [justCreated, setJustCreated] = useState<{ id: string; token: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "revoke" | "delete"; id: string; name: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-share-token", { body: { action: "list" } });
    setLoading(false);
    if (error) return toast.error(error.message);
    setTokens(data?.tokens ?? []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-share-token", {
      body: { action: "create", name: newName || "Claude access" },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    const token = data?.token as string;
    const url = `${FN_URL}?token=${encodeURIComponent(token)}`;
    setJustCreated({ id: data.record.id, token, url });
    await load();
    toast.success("Share link created — copy it now, it won't be shown again.");
  };

  const doConfirmed = async () => {
    if (!confirm) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke("manage-share-token", {
      body: { action: confirm.kind, id: confirm.id },
    });
    setBusy(false);
    const id = confirm.id;
    setConfirm(null);
    if (error) return toast.error(error.message);
    if (justCreated?.id === id) setJustCreated(null);
    await load();
    toast.success(confirm.kind === "revoke" ? "Token revoked" : "Token deleted");
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleString() : "—");

  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Share access (Claude / external tools)</p>
        <p className="text-[11px] text-muted-foreground">
          Generate a read-only link that returns all your fitness data as JSON. Anyone with the link can read your data — treat it like a password. Revoke anytime.
        </p>
      </div>

      <div className="flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Label" maxLength={60} />
        <Button onClick={create} disabled={busy}>
          {busy && <Loader2 className="size-4 mr-2 animate-spin" />}Generate
        </Button>
      </div>

      {justCreated && (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3 space-y-2">
          <p className="text-xs font-medium">Your share link (shown once):</p>
          <div className="flex gap-2">
            <Input readOnly value={justCreated.url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button size="sm" variant="outline" onClick={() => copy(justCreated.url)}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Paste this URL into Claude with a prompt like "fetch this URL and summarize my training". If Claude can't fetch URLs, open it in your browser and paste the JSON instead.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : tokens.length === 0 ? (
          <p className="text-xs text-muted-foreground">No share links yet.</p>
        ) : (
          tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 border rounded-md p-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  Created {fmt(t.created_at)} · Used {fmt(t.last_used_at)}
                  {t.revoked_at && <span className="text-destructive"> · Revoked</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {!t.revoked_at && (
                  <Button size="sm" variant="outline" disabled={busy}
                    onClick={() => setConfirm({ kind: "revoke", id: t.id, name: t.name })}>
                    Revoke
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={busy}
                  onClick={() => setConfirm({ kind: "delete", id: t.id, name: t.name })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "revoke" ? "Revoke this share link?" : "Delete this share link?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "revoke"
                ? `"${confirm?.name}" will stop working immediately. You can delete it later.`
                : `"${confirm?.name}" will be permanently removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doConfirmed}>
              {confirm?.kind === "revoke" ? "Revoke" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
