import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Key, Wallet, Copy, Check, Download,
  AlertTriangle, Sparkles, Shield, Clock, Monitor, Gamepad2, ChevronRight
} from "lucide-react";
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

function formatCreatedAt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function GeneratePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [duration, setDuration] = useState("");
  const [maxDevices, setMaxDevices] = useState("1");
  const [customInput, setCustomInput] = useState("random");
  const [customLicense, setCustomLicense] = useState("");
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [genMeta, setGenMeta] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [showResult, setShowResult] = useState(false);

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

  const selectedGame = activeGames.find(g => String(g.id) === selectedGameId);

  const logActionMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/keys/log-action", data);
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/keys/generate", data);
      return res.json();
    },
    onSuccess: async (data) => {
      const key = data.key;
      setGeneratedKey(key);
      setGenMeta({
        game: key.game,
        gameDisplay: selectedGame?.displayName || key.game,
        duration: key.duration,
        maxDevices: key.maxDevices,
        cost: data.cost,
        balanceAfter: data.balanceAfter,
        keyType: customInput === "custom" ? "Custom" : "Random",
        createdAt: key.createdAt,
      });
      setCopied(false);
      setAutoCopied(false);
      setShowResult(true);

      try {
        await navigator.clipboard.writeText(key.userKey);
        setAutoCopied(true);
        setTimeout(() => setAutoCopied(false), 3000);
        toast({ title: "Key generated & copied to clipboard" });
      } catch {
        toast({ title: "Key generated successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
    onError: (e: any) => {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
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
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey.userKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
    logActionMutation.mutate({
      action: "Key Copied",
      keyIds: [generatedKey.id],
    });
  };

  const handleDownload = () => {
    if (!generatedKey || !genMeta) return;
    const content = [
      `Game: ${genMeta.gameDisplay}`,
      `Key: ${generatedKey.userKey}`,
      `Duration: ${formatDuration(genMeta.duration)}`,
      `Devices: ${genMeta.maxDevices}`,
      `Created At: ${formatCreatedAt(genMeta.createdAt)}`,
      ``,
      `Note: Key will start on first use`,
    ].join("\n");

    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generatedKey.userKey}-${ts}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Key file downloaded" });
    logActionMutation.mutate({
      action: "Key Downloaded",
      keyIds: [generatedKey.id],
    });
  };

  return (
    <div className="max-w-xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" data-testid="text-generate-title">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Generate Key
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-9">Create a new premium license key</p>
        </div>
        <Link href="/keys">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-border/60 hover:bg-muted/80"
            data-testid="button-goto-keys"
          >
            <Key className="h-3 w-3" />
            My Keys
            <ChevronRight className="h-3 w-3 opacity-50" />
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent dark:from-primary/8 dark:via-primary/4 dark:to-transparent p-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 dark:bg-primary/15 border border-primary/10">
            <Wallet className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Available Balance</p>
            <p className="text-xl font-bold font-mono text-foreground leading-tight mt-0.5" data-testid="text-balance">
              {isOwner ? <span className="text-primary">∞</span> : formatCurrency(user?.saldo ?? 0)}
            </p>
          </div>
          {isOwner && (
            <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Owner</span>
            </div>
          )}
        </div>
      </div>

      {showResult && generatedKey && genMeta && (
        <div
          ref={resultRef}
          className="mb-5 rounded-lg border border-emerald-500/30 dark:border-emerald-500/20 overflow-hidden shadow-sm animate-fade-in"
          data-testid="panel-generated-result"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Key Generated Successfully</p>
                  {autoCopied && (
                    <p className="text-[10px] text-emerald-100 mt-0.5 flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" />
                      Auto-copied to clipboard
                    </p>
                  )}
                </div>
              </div>
              <Shield className="h-4 w-4 text-white/40" />
            </div>
          </div>

          <div className="bg-card dark:bg-card">
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">License Key</p>
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/50">
                <code
                  className="text-sm sm:text-base font-mono font-bold text-foreground flex-1 break-all select-all leading-relaxed"
                  data-testid="text-generated-key-0"
                >
                  {generatedKey.userKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                  data-testid="button-inline-copy"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="mx-5 border-t border-border/40" />

            <div className="px-5 py-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-muted/60 dark:bg-muted/40">
                  <Gamepad2 className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Game</p>
                  <p className="text-sm font-medium text-foreground truncate" data-testid="text-result-game">{genMeta.gameDisplay}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-muted/60 dark:bg-muted/40">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                  <p className="text-sm font-medium text-foreground" data-testid="text-result-duration">{formatDuration(genMeta.duration)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-muted/60 dark:bg-muted/40">
                  <Monitor className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Devices</p>
                  <p className="text-sm font-medium text-foreground" data-testid="text-result-devices">{genMeta.maxDevices}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-muted/60 dark:bg-muted/40">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Created At</p>
                  <p className="text-sm font-medium text-foreground" data-testid="text-result-created">{formatCreatedAt(genMeta.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="mx-5 px-3 py-2 rounded-md bg-primary/5 dark:bg-primary/8 border border-primary/10 mb-4">
              <p className="text-[11px] text-primary font-medium flex items-center gap-1.5" data-testid="text-first-use-note">
                <Clock className="h-3 w-3" />
                Key will start on first use
              </p>
            </div>

            <div className="px-5 pb-4 flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs font-medium gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all"
                data-testid="button-copy-key"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Key"}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs font-medium gap-1.5 border-border/60 hover:bg-muted/80 transition-all"
                data-testid="button-download-key"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>

            {!isOwner && genMeta.cost > 0 && (
              <>
                <div className="mx-5 border-t border-border/40" />
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Cost</span>
                  <span className="text-xs font-mono font-semibold text-foreground">{formatCurrency(genMeta.cost)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Key className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Key Configuration</h2>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Game</Label>
              <Select value={selectedGameId} onValueChange={handleGameChange}>
                <SelectTrigger
                  data-testid="select-game"
                  className="h-11 rounded-md bg-background dark:bg-muted/30 border-border/60 focus:border-primary/50 transition-colors"
                >
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {gamesLoading && <SelectItem value="_loading" disabled>Loading...</SelectItem>}
                  {activeGames.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration & Price</Label>
              <Select value={duration} onValueChange={setDuration} disabled={!selectedGameId}>
                <SelectTrigger
                  data-testid="select-duration"
                  className="h-11 rounded-md bg-background dark:bg-muted/30 border-border/60 focus:border-primary/50 transition-colors"
                >
                  <SelectValue placeholder={selectedGameId ? "Select duration" : "Select a game first"} />
                </SelectTrigger>
                <SelectContent>
                  {durationsLoading && <SelectItem value="_loading" disabled>Loading...</SelectItem>}
                  {durations.map((d: GameDuration) => (
                    <SelectItem key={d.id} value={String(d.durationHours)}>
                      {d.label} — {formatCurrency(d.price)}/device
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Devices</Label>
                {!isOwner && (
                  <span className="text-[10px] text-muted-foreground font-mono">Limit: {deviceCap}</span>
                )}
              </div>
              <Input
                type="number"
                min="1"
                max={isOwner ? undefined : deviceCap}
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                className={`h-11 rounded-md bg-background dark:bg-muted/30 border-border/60 focus:border-primary/50 transition-colors font-mono ${devicesExceeded ? "border-destructive focus:border-destructive" : ""}`}
                data-testid="input-max-devices"
              />
              {devicesExceeded && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                  <p className="text-[11px] text-destructive font-medium">
                    Your account allows up to {deviceCap} devices per key.
                  </p>
                </div>
              )}
            </div>

            {user?.level !== 3 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Type</Label>
                <Select value={customInput} onValueChange={setCustomInput}>
                  <SelectTrigger
                    data-testid="select-key-type"
                    className="h-11 rounded-md bg-background dark:bg-muted/30 border-border/60 focus:border-primary/50 transition-colors"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random Key</SelectItem>
                    <SelectItem value="custom">Custom Key</SelectItem>
                  </SelectContent>
                </Select>
                {customInput === "custom" && (
                  <Input
                    placeholder="Enter custom key (4-19 chars)"
                    value={customLicense}
                    onChange={(e) => setCustomLicense(e.target.value)}
                    minLength={4}
                    maxLength={19}
                    className="h-11 rounded-md bg-background dark:bg-muted/30 border-border/60 font-mono focus:border-primary/50 transition-colors"
                    data-testid="input-custom-key"
                  />
                )}
              </div>
            )}

            {(cost > 0 || (selectedGameId && duration)) && (
              <div className={`rounded-md border overflow-hidden ${validationError ? "border-destructive/40" : "border-border/50"}`}>
                <div className={`px-4 py-3 space-y-2 ${validationError ? "bg-destructive/5" : "bg-muted/30 dark:bg-muted/20"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Cost</span>
                    <span className="text-base font-bold font-mono text-primary" data-testid="text-cost">
                      {isOwner ? "Free" : cost > 0 ? formatCurrency(cost) : "—"}
                    </span>
                  </div>
                  {!isOwner && cost > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/30">
                      <span className="text-[11px] text-muted-foreground">Balance After</span>
                      <span className={`text-xs font-mono font-medium ${balanceInsufficient ? "text-destructive" : "text-foreground"}`}>
                        {formatCurrency((user?.saldo ?? 0) - cost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {validationError && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-destructive/8 dark:bg-destructive/10 border border-destructive/20" data-testid="text-validation-error">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-destructive font-medium leading-relaxed">{validationError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-md text-sm font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
              disabled={generateMutation.isPending || !selectedGameId || !duration || !!validationError}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Key
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
