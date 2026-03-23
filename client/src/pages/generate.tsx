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

export default function GeneratePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [game, setGame] = useState("");
  const [duration, setDuration] = useState("");
  const [maxDevices, setMaxDevices] = useState("1");
  const [customInput, setCustomInput] = useState("random");
  const [customLicense, setCustomLicense] = useState("");
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: games = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/games"],
  });

  const { data: prices = [] } = useQuery<any[]>({
    queryKey: ["/api/prices"],
  });

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

  const selectedPrice = prices.find((p: any) => p.duration === parseInt(duration));
  const cost = selectedPrice ? selectedPrice.price * parseInt(maxDevices || "1") : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      game,
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

  const getDurationLabel = (hours: number) => {
    if (hours === 1) return "1 Hour Trail";
    if (hours === 2) return "2 Hours Trail";
    if (hours < 24) return `${hours} Hours`;
    if (hours % 720 === 0) return `${hours / 720} Month(s)`;
    if (hours % 24 === 0) return `${hours / 24} Day(s)`;
    return `${hours} Hours`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-generate-title">Generate Key</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Balance: {formatCurrency(user?.saldo ?? 0)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Game</Label>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger data-testid="select-game"><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(games).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger data-testid="select-duration"><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {prices.map((p: any) => (
                    <SelectItem key={p.duration} value={String(p.duration)}>
                      {getDurationLabel(p.duration)} — {formatCurrency(p.price)}/Device
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Devices</Label>
              <Input
                type="number"
                min="1"
                max={user?.level === 3 ? 2 : 99}
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                data-testid="input-max-devices"
              />
              {user?.level === 3 && (
                <p className="text-xs text-muted-foreground">Reseller: max 2 devices</p>
              )}
            </div>

            {user?.level !== 3 && (
              <div className="space-y-2">
                <Label>Key Type</Label>
                <Select value={customInput} onValueChange={setCustomInput}>
                  <SelectTrigger data-testid="select-key-type"><SelectValue /></SelectTrigger>
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
                    data-testid="input-custom-key"
                  />
                )}
              </div>
            )}

            {cost > 0 && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                Cost: <span className="font-bold text-primary">{formatCurrency(cost)}</span>
                <span className="text-muted-foreground"> • Remaining: {formatCurrency((user?.saldo ?? 0) - cost)}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={generateMutation.isPending || !game || !duration}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedKey && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">Generated Key</div>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg font-mono font-bold bg-muted px-4 py-2 rounded" data-testid="text-generated-key">
                  {generatedKey.key?.userKey}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy} data-testid="button-copy-key">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Game: {generatedKey.key?.game} • Cost: {formatCurrency(generatedKey.cost)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
