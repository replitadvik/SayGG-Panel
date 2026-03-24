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
import { Loader2, Settings, Shield, Type, Wrench, Clock } from "lucide-react";

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

  const { data: sessionData, isLoading: sessionLoading } = useQuery<any>({
    queryKey: ["/api/settings/session"],
  });

  const [featureState, setFeatureState] = useState<Record<string, string>>({});
  const [modname, setModname] = useState("");
  const [ftextStatus, setFtextStatus] = useState("");
  const [ftextContent, setFtextContent] = useState("");
  const [maintStatus, setMaintStatus] = useState("off");
  const [maintInput, setMaintInput] = useState("");
  const [sessionNormalTtl, setSessionNormalTtl] = useState("");
  const [sessionRememberTtl, setSessionRememberTtl] = useState("");

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
    if (sessionData) {
      setSessionNormalTtl(sessionData.normalTtl || "30m");
      setSessionRememberTtl(sessionData.rememberMeTtl || "24h");
    }
  }, [sessionData]);

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

  const sessionMutation = useMutation({
    mutationFn: async (data: { normalTtl: string; rememberMeTtl: string }) => {
      await apiRequest("PATCH", "/api/settings/session", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/session"] });
      toast({ title: "Session settings updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const sessionResetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/settings/session/reset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/session"] });
      toast({ title: "Session settings reset to defaults" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const isLoading = featuresLoading || modLoading || ftextLoading || maintLoading || sessionLoading;

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
            <Clock className="h-5 w-5" />
            Session Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Normal Session Duration</Label>
              <Input
                value={sessionNormalTtl}
                onChange={e => setSessionNormalTtl(e.target.value)}
                placeholder="e.g. 30m, 1h, 7d"
                data-testid="input-session-normal-ttl"
              />
              <p className="text-xs text-muted-foreground">
                Default: {sessionData?.envNormalTtl || "30m"}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Remember Me Duration</Label>
              <Input
                value={sessionRememberTtl}
                onChange={e => setSessionRememberTtl(e.target.value)}
                placeholder="e.g. 24h, 7d, 30d"
                data-testid="input-session-remember-ttl"
              />
              <p className="text-xs text-muted-foreground">
                Default: {sessionData?.envRememberMeTtl || "24h"}
              </p>
            </div>
          </div>
          {sessionData?.isCustom && sessionData?.changedBy && (
            <p className="text-xs text-muted-foreground" data-testid="text-session-changed-by">
              Last changed by {sessionData.changedBy}
              {sessionData.changedAt && ` on ${new Date(sessionData.changedAt).toLocaleString()}`}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => sessionMutation.mutate({
                normalTtl: sessionNormalTtl,
                rememberMeTtl: sessionRememberTtl,
              })}
              disabled={sessionMutation.isPending}
              data-testid="button-save-session"
            >
              {sessionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Session Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => sessionResetMutation.mutate()}
              disabled={sessionResetMutation.isPending}
              data-testid="button-reset-session"
            >
              {sessionResetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
