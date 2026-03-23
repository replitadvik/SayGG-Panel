import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Shield, Type, Wrench, Key, RotateCcw } from "lucide-react";

const featureList = ["ESP", "Item", "AIM", "SilentAim", "BulletTrack", "Floating", "Memory", "Setting"] as const;

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: features, isLoading: featuresLoading } = useQuery<any>({
    queryKey: ["/api/settings/features"],
  });

  const { data: modnameData, isLoading: modLoading } = useQuery<any>({
    queryKey: ["/api/settings/modname"],
  });

  const { data: ftextData, isLoading: ftextLoading } = useQuery<any>({
    queryKey: ["/api/settings/ftext"],
  });

  const { data: maintenanceData, isLoading: maintLoading } = useQuery<any>({
    queryKey: ["/api/settings/maintenance"],
  });

  const { data: connectData, isLoading: connectLoading } = useQuery<any>({
    queryKey: ["/api/settings/connect"],
  });

  const [featureState, setFeatureState] = useState<Record<string, string>>({});
  const [modname, setModname] = useState("");
  const [ftextStatus, setFtextStatus] = useState("");
  const [ftextContent, setFtextContent] = useState("");
  const [maintStatus, setMaintStatus] = useState("off");
  const [maintInput, setMaintInput] = useState("");
  const [connectGameName, setConnectGameName] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [gracePeriod, setGracePeriod] = useState("60");

  useEffect(() => {
    if (features) {
      const state: Record<string, string> = {};
      for (const f of featureList) {
        state[f] = features[f] || "off";
      }
      setFeatureState(state);
    }
  }, [features]);

  useEffect(() => {
    if (modnameData) setModname(modnameData.modname || "");
  }, [modnameData]);

  useEffect(() => {
    if (ftextData) {
      setFtextStatus(ftextData._status || "");
      setFtextContent(ftextData._ftext || "");
    }
  }, [ftextData]);

  useEffect(() => {
    if (maintenanceData) {
      setMaintStatus(maintenanceData.status || "off");
      setMaintInput(maintenanceData.myinput || "");
    }
  }, [maintenanceData]);

  useEffect(() => {
    if (connectData) {
      setConnectGameName(connectData.gameName || "");
    }
  }, [connectData]);

  const featuresMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("PATCH", "/api/settings/features", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/features"] });
      toast({ title: "Features updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const modnameMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("PATCH", "/api/settings/modname", { modname: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/modname"] });
      toast({ title: "Mod name updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const ftextMutation = useMutation({
    mutationFn: async (data: { _status: string; _ftext: string }) => {
      await apiRequest("PATCH", "/api/settings/ftext", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/ftext"] });
      toast({ title: "Text settings updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: async (data: { status: string; myinput: string }) => {
      await apiRequest("PATCH", "/api/settings/maintenance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/maintenance"] });
      toast({ title: "Maintenance status updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const gameNameMutation = useMutation({
    mutationFn: async (gameName: string) => {
      await apiRequest("PATCH", "/api/settings/connect/game", { gameName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/connect"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({ title: "Game name updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const rotateSecretMutation = useMutation({
    mutationFn: async (data: { newSecret: string; gracePeriodMinutes: number }) => {
      await apiRequest("POST", "/api/settings/connect/rotate-secret", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/connect"] });
      setNewSecret("");
      toast({ title: "Secret rotated successfully" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const isLoading = featuresLoading || modLoading || ftextLoading || maintLoading || connectLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Feature Toggles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featureList.map(f => (
              <div key={f} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">{f}</Label>
                <Switch
                  checked={featureState[f] === "on"}
                  onCheckedChange={(checked) =>
                    setFeatureState(prev => ({ ...prev, [f]: checked ? "on" : "off" }))
                  }
                  data-testid={`switch-feature-${f.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <Button
            onClick={() => featuresMutation.mutate(featureState)}
            disabled={featuresMutation.isPending}
            data-testid="button-save-features"
          >
            {featuresMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Features
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Mod Name
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={modname}
            onChange={e => setModname(e.target.value)}
            placeholder="Enter mod name"
            data-testid="input-modname"
          />
          <Button
            onClick={() => modnameMutation.mutate(modname)}
            disabled={modnameMutation.isPending}
            data-testid="button-save-modname"
          >
            {modnameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Mod Name
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5" />
            Floating Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Status Text</Label>
            <Input
              value={ftextStatus}
              onChange={e => setFtextStatus(e.target.value)}
              placeholder="Status text"
              data-testid="input-ftext-status"
            />
          </div>
          <div className="space-y-1">
            <Label>Credit / Footer Text</Label>
            <Textarea
              value={ftextContent}
              onChange={e => setFtextContent(e.target.value)}
              placeholder="Credit text"
              rows={3}
              data-testid="input-ftext-content"
            />
          </div>
          <Button
            onClick={() => ftextMutation.mutate({ _status: ftextStatus, _ftext: ftextContent })}
            disabled={ftextMutation.isPending}
            data-testid="button-save-ftext"
          >
            {ftextMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Text
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={maintStatus === "on"}
              onCheckedChange={(checked) => setMaintStatus(checked ? "on" : "off")}
              data-testid="switch-maintenance"
            />
            <Label>{maintStatus === "on" ? "Maintenance ON" : "Maintenance OFF"}</Label>
          </div>
          <div className="space-y-1">
            <Label>Maintenance Message</Label>
            <Textarea
              value={maintInput}
              onChange={e => setMaintInput(e.target.value)}
              placeholder="Message shown during maintenance"
              rows={2}
              data-testid="input-maintenance-message"
            />
          </div>
          <Button
            onClick={() => maintenanceMutation.mutate({ status: maintStatus, myinput: maintInput })}
            disabled={maintenanceMutation.isPending}
            data-testid="button-save-maintenance"
          >
            {maintenanceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Maintenance
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            Connect Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Game Name</Label>
            <div className="flex gap-2">
              <Input
                value={connectGameName}
                onChange={e => setConnectGameName(e.target.value)}
                placeholder="e.g. PUBG"
                data-testid="input-connect-game-name"
              />
              <Button
                onClick={() => gameNameMutation.mutate(connectGameName)}
                disabled={gameNameMutation.isPending}
                data-testid="button-save-game-name"
              >
                {gameNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>

          {connectData && (
            <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Secret</span>
                <code data-testid="text-connect-secret-masked">{connectData.secretMasked}</code>
              </div>
              {connectData.previousSecretMasked && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previous Secret</span>
                  <code>{connectData.previousSecretMasked}</code>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>v{connectData.secretVersion}</span>
              </div>
              {connectData.gracePeriodUntil && new Date(connectData.gracePeriodUntil) > new Date() && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grace Period Until</span>
                  <span>{new Date(connectData.gracePeriodUntil).toLocaleString()}</span>
                </div>
              )}
              {connectData.changedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Changed By</span>
                  <span>{connectData.changedBy}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <Label className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Rotate Secret
            </Label>
            <Input
              type="password"
              value={newSecret}
              onChange={e => setNewSecret(e.target.value)}
              placeholder="New secret (min 16 chars)"
              data-testid="input-new-connect-secret"
            />
            <div className="flex gap-2 items-center">
              <Label className="text-sm whitespace-nowrap">Grace Period (min)</Label>
              <Input
                type="number"
                min="0"
                max="1440"
                value={gracePeriod}
                onChange={e => setGracePeriod(e.target.value)}
                className="w-24"
                data-testid="input-grace-period"
              />
            </div>
            <Button
              onClick={() => rotateSecretMutation.mutate({
                newSecret,
                gracePeriodMinutes: parseInt(gracePeriod) || 60,
              })}
              disabled={rotateSecretMutation.isPending || newSecret.length < 16}
              variant="destructive"
              data-testid="button-rotate-secret"
            >
              {rotateSecretMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rotate Secret
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
