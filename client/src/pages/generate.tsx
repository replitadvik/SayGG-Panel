import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, Wallet, Copy, Check, Download, ExternalLink, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { Game, GameDuration } from "@shared/schema";

function formatDuration(hours: number) {
  if (hours < 1) return `${hours}h`;
  if (hours < 24) return `${hours} Hour${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `${days} Day${days !== 1 ? "s" : ""}`;
  return `${days}d ${rem}h`;
}

export default function GeneratePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGameId, setSelectedGameId] = useState("");
  const [duration, setDuration] = useState("");
  const [maxDevices, setMaxDevices] = useState("1");
  const [customInput, setCustomInput] = useState("random");
  const [customLicense, setCustomLicense] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState<any[]>([]);
  const [lastGenMeta, setLastGenMeta] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const isOwner = user?.level === 1;

  const { data: activeGames = [], isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/active"],
  });

  const { data: durations = [], isLoading: durationsLoading } = useQuery<GameDuration[]>({
    queryKey: ["/api/games", selectedGameId, "durations"],
    queryFn: async () => {
      if (!selectedGameId) return [];
      const res = await fetch(`/api/games/${selectedGameId}/durations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load durations");
      return res.json();
    },
    enabled: !!selectedGameId,
  });

  const selectedDuration = durations.find((d: GameDuration) => String(d.durationHours) === duration);
  const unitPrice = selectedDuration?.price ?? 0;
  const devCount = parseInt(maxDevices || "1") || 1;
  const cost = unitPrice * devCount;

  const deviceCap = user?.level === 3 ? 2 : (user?.level === 2 ? Math.min(user?.maxDevicesLimit ?? 1000, 1000) : Infinity);
  const devicesExceeded = !isOwner && devCount > deviceCap;
  const balanceInsufficient = !isOwner && cost > (user?.saldo ?? 0);

  const validationError = devicesExceeded
    ? `Max devices exceeded. Your account allows up to ${deviceCap} devices per key.`
    : balanceInsufficient && cost > 0
      ? `Insufficient balance. This key costs ${formatCurrency(cost)} but your balance is ${formatCurrency(user?.saldo ?? 0)}.`
      : null;

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/keys/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      const key = data.key;
      setGeneratedKeys(prev => [key, ...prev]);
      setLastGenMeta({
        game: key.game,
        duration: key.duration,
        maxDevices: key.maxDevices,
        cost: data.cost,
        balanceAfter: data.balanceAfter,
        keyType: customInput === "custom" ? "Custom" : "Random",
      });
      setCopied(false);
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Key Generated!" });
    },
    onError: (e: any) => {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
    },
  });

  const logActionMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/keys/log-action", data);
    },
  });

  const handleGameChange = (val: string) => {
    setSelectedGameId(val);
    setDuration("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || !duration) return;
    if (validationError) return;
    generateMutation.mutate({
      gameId: parseInt(selectedGameId),
      duration: parseInt(duration),
      maxDevices: devCount,
      customInput,
      customLicense: customInput === "custom" ? customLicense : undefined,
    });
  };

  const handleCopy = () => {
    const text = generatedKeys.map(k => k.userKey).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
    logActionMutation.mutate({
      action: "Key Copied",
      keyIds: generatedKeys.map(k => k.id),
    });
  };

  const handleDownload = () => {
    const lines = generatedKeys.map(k => k.userKey);
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keys-${ts}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "File downloaded" });
    logActionMutation.mutate({
      action: "Key Downloaded",
      keyIds: generatedKeys.map(k => k.id),
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-generate-title">Generate Key</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create a new license key</p>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <Wallet className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Your Balance</p>
          <p className="text-lg font-bold font-mono text-foreground" data-testid="text-balance">
            {isOwner ? <span className="text-primary">∞</span> : formatCurrency(user?.saldo ?? 0)}
          </p>
        </div>
      </div>

      {generatedKeys.length > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 shadow-sm overflow-hidden" data-testid="panel-generated-result">
          <div className="bg-emerald-500/10 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {generatedKeys.length === 1 ? "Key Generated" : `${generatedKeys.length} Keys Generated`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={handleCopy}
                data-testid="button-copy-key"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={handleDownload}
                data-testid="button-download-key"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1.5">
              {generatedKeys.map((k, i) => (
                <div key={k.id || i} className="flex items-center gap-2 px-3 py-2 rounded bg-card border border-border/40">
                  <code className="text-sm font-mono font-bold flex-1 break-all" data-testid={`text-generated-key-${i}`}>{k.userKey}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(k.userKey);
                      toast({ title: "Copied" });
                    }}
                    className="text-muted-foreground hover:text-primary flex-shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {lastGenMeta && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-2 border-t border-border/40">
                <div className="text-muted-foreground">Game: <span className="text-foreground font-medium">{lastGenMeta.game}</span></div>
                <div className="text-muted-foreground">Duration: <span className="text-foreground font-medium">{formatDuration(lastGenMeta.duration)}</span></div>
                <div className="text-muted-foreground">Devices: <span className="text-foreground font-medium">{lastGenMeta.maxDevices}</span></div>
                <div className="text-muted-foreground">Cost: <span className="text-foreground font-mono font-medium">{isOwner ? "Free" : formatCurrency(lastGenMeta.cost)}</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-panel-header-foreground/70" />
            <h2 className="text-sm font-semibold text-panel-header-foreground">Key Details</h2>
          </div>
          <Link href="/keys">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded gap-1 text-[11px] text-panel-header-foreground/60 hover:text-panel-header-foreground hover:bg-panel-header-foreground/10"
              data-testid="button-goto-keys"
            >
              <ExternalLink className="h-3 w-3" />
              Keys
            </Button>
          </Link>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Game</Label>
              <Select value={selectedGameId} onValueChange={handleGameChange}>
                <SelectTrigger data-testid="select-game" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>
                  {gamesLoading && <SelectItem value="_loading" disabled>Loading...</SelectItem>}
                  {activeGames.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              <Select value={duration} onValueChange={setDuration} disabled={!selectedGameId}>
                <SelectTrigger data-testid="select-duration" className="h-11 rounded bg-muted/50 border-border/60">
                  <SelectValue placeholder={selectedGameId ? "Select duration" : "Select a game first"} />
                </SelectTrigger>
                <SelectContent>
                  {durationsLoading && <SelectItem value="_loading" disabled>Loading...</SelectItem>}
                  {durations.map((d: GameDuration) => (
                    <SelectItem key={d.id} value={String(d.durationHours)}>
                      {d.label} — {formatCurrency(d.price)}/Device
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Devices</Label>
              <Input
                type="number"
                min="1"
                max={isOwner ? undefined : deviceCap}
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                className={`h-11 rounded bg-muted/50 border-border/60 ${devicesExceeded ? "border-destructive" : ""}`}
                data-testid="input-max-devices"
              />
              {user?.level === 3 && (
                <p className="text-xs text-muted-foreground">Reseller: max 2 devices</p>
              )}
              {user?.level === 2 && (
                <p className="text-xs text-muted-foreground">Limit: {deviceCap} devices</p>
              )}
              {devicesExceeded && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Your account allows up to {deviceCap} devices per key.
                </p>
              )}
            </div>

            {user?.level !== 3 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Key Type</Label>
                <Select value={customInput} onValueChange={setCustomInput}>
                  <SelectTrigger data-testid="select-key-type" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {customInput === "custom" && (
                  <Input
                    placeholder="Enter custom key (4-19 chars)"
                    value={customLicense}
                    onChange={(e) => setCustomLicense(e.target.value)}
                    minLength={4}
                    maxLength={19}
                    className="h-11 rounded bg-muted/50 border-border/60 font-mono"
                    data-testid="input-custom-key"
                  />
                )}
              </div>
            )}

            {cost > 0 && (
              <div className={`p-4 rounded border text-sm ${validationError ? "bg-destructive/5 border-destructive/30" : "bg-muted/60 border-border/60"}`}>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-bold text-primary font-mono">{isOwner ? "Free (Owner)" : formatCurrency(cost)}</span>
                </div>
                {!isOwner && (
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-mono ${balanceInsufficient ? "text-destructive font-medium" : "text-foreground"}`}>
                      {formatCurrency((user?.saldo ?? 0) - cost)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {validationError && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/30 flex items-start gap-2" data-testid="text-validation-error">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-medium">{validationError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded text-sm font-semibold"
              disabled={generateMutation.isPending || !selectedGameId || !duration || !!validationError}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Generate Key
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
