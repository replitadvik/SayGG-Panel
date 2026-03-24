import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const selectedGame = activeGames.find(g => String(g.id) === selectedGameId);
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
    if (!selectedGame) return;
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
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-lg font-bold tracking-tight uppercase" data-testid="text-generate-title">Generate Key</h1>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            Balance: <span className="text-foreground font-mono">{formatCurrency(user?.saldo ?? 0)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Game</Label>
              <Select value={selectedGameId} onValueChange={handleGameChange}>
                <SelectTrigger data-testid="select-game" className="h-9 bg-muted border-border"><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>
                  {gamesLoading && <SelectItem value="_loading" disabled>Loading...</SelectItem>}
                  {activeGames.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration</Label>
              <Select value={duration} onValueChange={setDuration} disabled={!selectedGameId}>
                <SelectTrigger data-testid="select-duration" className="h-9 bg-muted border-border">
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

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max Devices</Label>
              <Input
                type="number"
                min="1"
                max={user?.level === 3 ? 2 : 99}
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                className="h-9 bg-muted border-border"
                data-testid="input-max-devices"
              />
              {user?.level === 3 && (
                <p className="text-[10px] text-muted-foreground">Reseller: max 2 devices</p>
              )}
            </div>

            {user?.level !== 3 && (
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Key Type</Label>
                <Select value={customInput} onValueChange={setCustomInput}>
                  <SelectTrigger data-testid="select-key-type" className="h-9 bg-muted border-border"><SelectValue /></SelectTrigger>
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
                    className="h-9 bg-muted border-border font-mono"
                    data-testid="input-custom-key"
                  />
                )}
              </div>
            )}

            {cost > 0 && (
              <div className="p-3 bg-muted border border-border text-xs">
                <span className="text-muted-foreground uppercase tracking-wider">Cost: </span>
                <span className="font-bold text-primary font-mono">{formatCurrency(cost)}</span>
                <span className="text-muted-foreground ml-2">Remaining: <span className="font-mono">{formatCurrency((user?.saldo ?? 0) - cost)}</span></span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-9 text-xs font-semibold uppercase tracking-wider"
              disabled={generateMutation.isPending || !selectedGameId || !duration}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedKey && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Generated Key</div>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg font-mono font-bold bg-muted px-4 py-2 border border-border" data-testid="text-generated-key">
                  {generatedKey.key?.userKey}
                </code>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleCopy} data-testid="button-copy-key">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Game: {generatedKey.key?.game} | Cost: <span className="font-mono">{formatCurrency(generatedKey.cost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
