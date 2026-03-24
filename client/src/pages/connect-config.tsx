import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Key, Copy, RotateCcw, Pencil, RefreshCw,
  Shield, Clock, User, FileText, ChevronDown, ChevronUp, Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5"
      data-testid="button-copy-secret"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
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
      toast({ title: "Secret generated", description: "Paste or use the generated value" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const gracePeriodActive = config?.gracePeriodUntil && new Date(config.gracePeriodUntil) > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-connect-config-title">Connect Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your connect license secret, game config, and view change history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            Active Connect Secret
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.activeSecret ? (
            <>
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current Secret</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium" data-testid="text-secret-version">
                      v{config.secretVersion}
                    </span>
                    <CopyButton text={config.activeSecret} />
                  </div>
                </div>
                <code
                  className="block text-sm font-mono break-all p-3 bg-background rounded border select-all"
                  data-testid="text-connect-active-secret"
                >
                  {config.activeSecret}
                </code>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Created</span>
                  <p className="font-medium" data-testid="text-secret-created-at">{formatDate(config.createdAt)}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Created By</span>
                  <p className="font-medium" data-testid="text-secret-created-by">{config.createdBy || "System"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Last Changed</span>
                  <p className="font-medium" data-testid="text-secret-changed-at">{formatDate(config.changedAt)}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Changed By</span>
                  <p className="font-medium" data-testid="text-secret-changed-by">{config.changedBy || "—"}</p>
                </div>
              </div>

              {gracePeriodActive && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm">
                  <span className="font-medium text-yellow-700 dark:text-yellow-400">Grace Period Active</span>
                  <span className="text-yellow-600 dark:text-yellow-500 ml-2">
                    Previous secret accepted until {formatDate(config.gracePeriodUntil)}
                  </span>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditSecretValue(config.activeSecret); setEditSecretOpen(true); }}
                  className="gap-1.5"
                  data-testid="button-edit-secret"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Secret
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotateOpen(true)}
                  className="gap-1.5"
                  data-testid="button-rotate-secret"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Rotate Secret
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No connect secret configured yet</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setRotateOpen(true)}
                data-testid="button-create-secret"
              >
                Create Secret
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {config?.previousSecret && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowPrevious(!showPrevious)}>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Previous / Fallback Secret
              </span>
              {showPrevious ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {showPrevious && (
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Previous Secret</Label>
                  <CopyButton text={config.previousSecret} />
                </div>
                <code
                  className="block text-sm font-mono break-all p-3 bg-background rounded border select-all"
                  data-testid="text-connect-previous-secret"
                >
                  {config.previousSecret}
                </code>
              </div>
              {gracePeriodActive && (
                <p className="text-xs text-muted-foreground">
                  This secret is still accepted during the grace period until {formatDate(config.gracePeriodUntil)}
                </p>
              )}
              {!gracePeriodActive && (
                <p className="text-xs text-muted-foreground">
                  Grace period has expired. This secret is no longer accepted for new connections.
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Connect Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Game Name</Label>
            <div className="flex gap-2">
              <Input
                value={gameName}
                onChange={e => setGameName(e.target.value)}
                placeholder="e.g. PUBG"
                data-testid="input-connect-game-name"
              />
              <Button
                onClick={() => gameNameMutation.mutate(gameName)}
                disabled={gameNameMutation.isPending || !gameName.trim()}
                data-testid="button-save-game-name"
              >
                {gameNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The game name used in the /connect endpoint for client verification
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowAudit(!showAudit)}>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Audit History
              {auditLogs && auditLogs.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({auditLogs.length} {auditLogs.length === 1 ? "entry" : "entries"})
                </span>
              )}
            </span>
            {showAudit ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {showAudit && (
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No audit history yet</p>
                <p className="text-xs mt-1">Changes to connect configuration will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-3 p-3 bg-muted rounded-lg text-sm" data-testid={`audit-log-${log.id}`}>
                    <div className="flex-shrink-0 mt-0.5">
                      {log.actionType === "rotate" ? (
                        <RotateCcw className="h-4 w-4 text-orange-500" />
                      ) : log.actionType === "create" ? (
                        <Key className="h-4 w-4 text-green-500" />
                      ) : (
                        <Pencil className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">
                          {log.actionType === "rotate" ? "Secret Rotated" :
                           log.actionType === "create" ? "Created" :
                           `Updated ${log.entityType?.replace(/_/g, " ")}`}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs space-y-0.5">
                        {log.oldValue && (
                          <p>From: <code className="bg-background px-1 rounded">{log.oldValue}</code></p>
                        )}
                        {log.newValue && (
                          <p>To: <code className="bg-background px-1 rounded">{log.newValue}</code></p>
                        )}
                        {log.note && <p className="italic">{log.note}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by <span className="font-medium">{log.actorUsername || "System"}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={editSecretOpen} onOpenChange={setEditSecretOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Active Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Active Secret</Label>
              <Input
                value={editSecretValue}
                onChange={e => setEditSecretValue(e.target.value)}
                placeholder="Enter secret (min 16 characters)"
                data-testid="input-edit-secret"
              />
              <p className="text-xs text-muted-foreground">
                This directly replaces the current active secret without creating a fallback.
                Use "Rotate Secret" instead if you want to keep the old secret as a fallback.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSecretOpen(false)}>Cancel</Button>
            <Button
              onClick={() => editSecretMutation.mutate(editSecretValue)}
              disabled={editSecretMutation.isPending || editSecretValue.trim().length < 16}
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
          <DialogHeader>
            <DialogTitle>Rotate Connect Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>New Secret</Label>
              <div className="flex gap-2">
                <Input
                  value={rotateSecret}
                  onChange={e => setRotateSecret(e.target.value)}
                  placeholder="Enter new secret (min 16 characters)"
                  data-testid="input-rotate-secret"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="gap-1.5 whitespace-nowrap"
                  data-testid="button-generate-secret"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Grace Period (minutes)</Label>
              <Input
                type="number"
                min="0"
                max="1440"
                value={gracePeriod}
                onChange={e => setGracePeriod(e.target.value)}
                data-testid="input-grace-period"
              />
              <p className="text-xs text-muted-foreground">
                During this period, both old and new secrets will be accepted (0-1440 min)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input
                value={rotateNote}
                onChange={e => setRotateNote(e.target.value)}
                placeholder="e.g. Scheduled rotation, compromised key"
                data-testid="input-rotate-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rotateMutation.mutate({
                newSecret: rotateSecret,
                gracePeriodMinutes: parseInt(gracePeriod) || 60,
                note: rotateNote,
              })}
              disabled={rotateMutation.isPending || rotateSecret.trim().length < 16}
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
