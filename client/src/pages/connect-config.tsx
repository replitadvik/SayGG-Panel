import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Key, Copy, RotateCcw, Pencil, RefreshCw,
  Shield, Clock, User, FileText, ChevronDown, ChevronUp, Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "\u2014";
  const date = new Date(d);
  return date.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      data-testid="button-copy-secret"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ConnectConfigPage() {
  const { toast } = useToast();

  const { data: config, isLoading: configLoading } = useQuery<any>({
    queryKey: ["/api/connect-config"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/connect-config/audit-logs"],
  });

  const [gameName, setGameName] = useState("");
  const [editSecretOpen, setEditSecretOpen] = useState(false);
  const [editSecretValue, setEditSecretValue] = useState("");
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotateSecret, setRotateSecret] = useState("");
  const [gracePeriod, setGracePeriod] = useState("60");
  const [rotateNote, setRotateNote] = useState("");
  const [showPrevious, setShowPrevious] = useState(false);
  const [showAudit, setShowAudit] = useState(true);

  useEffect(() => {
    if (config) {
      setGameName(config.gameName || "");
    }
  }, [config]);

  const gameNameMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("PATCH", "/api/connect-config/game", { gameName: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connect-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connect-config/audit-logs"] });
      toast({ title: "Game name updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const editSecretMutation = useMutation({
    mutationFn: async (secret: string) => {
      await apiRequest("PATCH", "/api/connect-config/secret", { activeSecret: secret });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connect-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connect-config/audit-logs"] });
      setEditSecretOpen(false);
      setEditSecretValue("");
      toast({ title: "Secret updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: async (data: { newSecret: string; gracePeriodMinutes: number; note: string }) => {
      await apiRequest("POST", "/api/connect-config/rotate-secret", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connect-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connect-config/audit-logs"] });
      setRotateOpen(false);
      setRotateSecret("");
      setRotateNote("");
      toast({ title: "Secret rotated successfully" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/connect-config/generate-secret");
      return res.json();
    },
    onSuccess: (data: any) => {
      setRotateSecret(data.secret);
      toast({ title: "Secret generated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const gracePeriodActive = config?.gracePeriodUntil && new Date(config.gracePeriodUntil) > new Date();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-connect-config-title">Connect Config</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage connect secret & settings</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Key className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Active Connect Secret</h2>
        </div>
        <div className="p-5 space-y-4">
          {config?.activeSecret ? (
            <>
              <div className="p-4 rounded bg-muted/60 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Secret</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium" data-testid="text-secret-version">
                      v{config.secretVersion}
                    </span>
                    <CopyButton text={config.activeSecret} />
                  </div>
                </div>
                <code className="block text-xs font-mono break-all p-3 bg-background rounded border border-border/60 select-all" data-testid="text-connect-active-secret">
                  {config.activeSecret}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Created</span>
                  <p className="font-medium" data-testid="text-secret-created-at">{formatDate(config.createdAt)}</p>
                </div>
                <div className="p-3 rounded bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1 mb-1"><User className="h-3 w-3" /> Created By</span>
                  <p className="font-medium" data-testid="text-secret-created-by">{config.createdBy || "System"}</p>
                </div>
                <div className="p-3 rounded bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Changed</span>
                  <p className="font-medium" data-testid="text-secret-changed-at">{formatDate(config.changedAt)}</p>
                </div>
                <div className="p-3 rounded bg-muted/40">
                  <span className="text-muted-foreground flex items-center gap-1 mb-1"><User className="h-3 w-3" /> Changed By</span>
                  <p className="font-medium" data-testid="text-secret-changed-by">{config.changedBy || "\u2014"}</p>
                </div>
              </div>

              {gracePeriodActive && (
                <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <span className="font-medium">Grace Period Active</span> {"\u2014"} Previous secret accepted until {formatDate(config.gracePeriodUntil)}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditSecretValue(config.activeSecret); setEditSecretOpen(true); }}
                  className="rounded gap-1.5 text-xs h-9"
                  data-testid="button-edit-secret"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotateOpen(true)}
                  className="rounded gap-1.5 text-xs h-9"
                  data-testid="button-rotate-secret"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Rotate
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-3">No connect secret configured</p>
              <Button size="sm" onClick={() => setRotateOpen(true)} className="rounded h-9 text-xs" data-testid="button-create-secret">
                Create Secret
              </Button>
            </div>
          )}
        </div>
      </div>

      {config?.previousSecret && (
        <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between bg-panel-header px-5 py-3" onClick={() => setShowPrevious(!showPrevious)}>
            <span className="flex items-center gap-2 text-sm font-semibold text-panel-header-foreground">
              <Shield className="h-4 w-4 text-panel-header-foreground/70" />
              Previous / Fallback Secret
            </span>
            {showPrevious ? <ChevronUp className="h-4 w-4 text-panel-header-foreground/50" /> : <ChevronDown className="h-4 w-4 text-panel-header-foreground/50" />}
          </button>
          {showPrevious && (
            <div className="p-5 space-y-3">
              <div className="p-4 rounded bg-muted/60 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Previous Secret</span>
                  <CopyButton text={config.previousSecret} />
                </div>
                <code className="block text-xs font-mono break-all p-3 bg-background rounded border border-border/60 select-all" data-testid="text-connect-previous-secret">
                  {config.previousSecret}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                {gracePeriodActive
                  ? `Still accepted during grace period until ${formatDate(config.gracePeriodUntil)}`
                  : "Grace period has expired. No longer accepted for new connections."}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Connect Settings</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default Game Name</Label>
            <div className="flex gap-2">
              <Input
                value={gameName}
                onChange={e => setGameName(e.target.value)}
                placeholder="e.g. PUBG"
                className="h-11 rounded bg-muted/50 border-border/60"
                data-testid="input-connect-game-name"
              />
              <Button
                onClick={() => gameNameMutation.mutate(gameName)}
                disabled={gameNameMutation.isPending || !gameName.trim()}
                className="rounded h-11"
                data-testid="button-save-game-name"
              >
                {gameNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Game name used in the /connect endpoint for client verification</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <button className="w-full flex items-center justify-between bg-panel-header px-5 py-3" onClick={() => setShowAudit(!showAudit)}>
          <span className="flex items-center gap-2 text-sm font-semibold text-panel-header-foreground">
            <Clock className="h-4 w-4 text-panel-header-foreground/70" />
            Audit History
            {auditLogs && auditLogs.length > 0 && (
              <span className="text-xs font-normal text-panel-header-foreground/50">({auditLogs.length})</span>
            )}
          </span>
          {showAudit ? <ChevronUp className="h-4 w-4 text-panel-header-foreground/50" /> : <ChevronDown className="h-4 w-4 text-panel-header-foreground/50" />}
        </button>
        {showAudit && (
          <div className="p-5">
            {logsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No audit history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-3 p-3 rounded bg-muted/40 text-xs" data-testid={`audit-log-${log.id}`}>
                    <div className="flex-shrink-0 mt-0.5">
                      {log.actionType === "rotate" ? (
                        <RotateCcw className="h-3.5 w-3.5 text-orange-500" />
                      ) : log.actionType === "create" ? (
                        <Key className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Pencil className="h-3.5 w-3.5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground capitalize">
                          {log.actionType === "rotate" ? "Secret Rotated" :
                           log.actionType === "create" ? "Created" :
                           `Updated ${log.entityType?.replace(/_/g, " ")}`}
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-muted-foreground space-y-0.5">
                        {log.oldValue && <p>From: <code className="bg-background px-1 rounded text-foreground">{log.oldValue}</code></p>}
                        {log.newValue && <p>To: <code className="bg-background px-1 rounded text-foreground">{log.newValue}</code></p>}
                        {log.note && <p className="italic">{log.note}</p>}
                      </div>
                      <p className="text-muted-foreground">by <span className="font-medium text-foreground">{log.actorUsername || "System"}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={editSecretOpen} onOpenChange={setEditSecretOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base font-semibold">Edit Active Secret</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Secret</Label>
              <Input
                value={editSecretValue}
                onChange={e => setEditSecretValue(e.target.value)}
                placeholder="Enter secret (min 16 characters)"
                className="h-11 rounded bg-muted/50 border-border/60 font-mono text-xs"
                data-testid="input-edit-secret"
              />
              <p className="text-xs text-muted-foreground">
                This directly replaces the current active secret without creating a fallback. Use "Rotate" instead if you want to keep the old secret as a fallback.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditSecretOpen(false)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => editSecretMutation.mutate(editSecretValue)}
              disabled={editSecretMutation.isPending || editSecretValue.trim().length < 16}
              className="rounded h-10"
              data-testid="button-confirm-edit-secret"
            >
              {editSecretMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base font-semibold">Rotate Connect Secret</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">New Secret</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={rotateSecret}
                  onChange={e => setRotateSecret(e.target.value)}
                  placeholder="Enter new secret (min 16 chars)"
                  className="h-11 rounded bg-muted/50 border-border/60 font-mono text-xs flex-1 min-w-0"
                  data-testid="input-rotate-secret"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="rounded h-11 gap-1.5 whitespace-nowrap text-xs"
                  data-testid="button-generate-secret"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Grace Period (minutes)</Label>
              <Input type="number" min="0" max="1440" value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-grace-period" />
              <p className="text-xs text-muted-foreground">Both old and new secrets accepted during this period (0-1440 min)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Note (optional)</Label>
              <Input value={rotateNote} onChange={e => setRotateNote(e.target.value)} placeholder="e.g. Scheduled rotation" className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-rotate-note" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRotateOpen(false)} className="rounded h-10">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rotateMutation.mutate({
                newSecret: rotateSecret,
                gracePeriodMinutes: parseInt(gracePeriod) || 60,
                note: rotateNote,
              })}
              disabled={rotateMutation.isPending || rotateSecret.trim().length < 16}
              className="rounded h-10"
              data-testid="button-confirm-rotate"
            >
              {rotateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rotate Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
