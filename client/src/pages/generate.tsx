import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, Wallet, Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { Game, GameDuration } from "@shared/schema";

export default function GeneratePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGameId, setSelectedGameId] = useState("");
  const [duration, setDuration] = useState("");
  const [maxDevices, setMaxDevices] = useState("1");
  const [customInput, setCustomInput] = useState("random");
  const [customLicense, setCustomLicense] = useState("");
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
  const cost = selectedDuration ? selectedDuration.price * parseInt(maxDevices || "1") : 0;

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/keys/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data);
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Key Generated!" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleGameChange = (val: string) => {
    setSelectedGameId(val);
    setDuration("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId) return;
    generateMutation.mutate({
      gameId: parseInt(selectedGameId),
      duration: parseInt(duration),
      maxDevices: parseInt(maxDevices),
      customInput,
      customLicense: customInput === "custom" ? customLicense : undefined,
    });
  };

  const handleCopy = () => {
    if (generatedKey?.key?.userKey) {
      navigator.clipboard.writeText(generatedKey.key.userKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(user?.saldo ?? 0)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Key className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Key Details</h2>
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
                max={user?.level === 3 ? 2 : 99}
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                className="h-11 rounded bg-muted/50 border-border/60"
                data-testid="input-max-devices"
              />
              {user?.level === 3 && (
                <p className="text-xs text-muted-foreground">Reseller: max 2 devices</p>
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
              <div className="p-4 rounded bg-muted/60 border border-border/60 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-bold text-primary font-mono">{user?.level === 1 ? "Free (Owner)" : formatCurrency(cost)}</span>
                </div>
                {user?.level !== 1 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-mono text-foreground">{formatCurrency((user?.saldo ?? 0) - cost)}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded text-sm font-semibold"
              disabled={generateMutation.isPending || !selectedGameId || !duration}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Generate Key
            </Button>
          </form>
        </div>
      </div>

      {generatedKey && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
          <div className="text-center space-y-3">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Generated Successfully</div>
            <div className="flex items-center justify-center gap-2">
              <code className="text-sm font-mono font-bold bg-card px-4 py-2.5 rounded border border-border/60" data-testid="text-generated-key">
                {generatedKey.key?.userKey}
              </code>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded" onClick={handleCopy} data-testid="button-copy-key">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {generatedKey.key?.game} — Cost: <span className="font-mono">{formatCurrency(generatedKey.cost)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
