import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Shield, Type, Wrench, Clock, Globe } from "lucide-react";

const featureList = ["ESP", "Item", "AIM", "SilentAim", "BulletTrack", "Floating", "Memory", "Setting"] as const;

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: siteNameData, isLoading: siteNameLoading } = useQuery<any>({
    queryKey: ["/api/settings/site-name"],
  });

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

  const [siteNameVal, setSiteNameVal] = useState("");
  const [featureState, setFeatureState] = useState<Record<string, string>>({});
  const [modname, setModname] = useState("");
  const [ftextStatus, setFtextStatus] = useState("");
  const [ftextContent, setFtextContent] = useState("");
  const [maintStatus, setMaintStatus] = useState("off");
  const [maintInput, setMaintInput] = useState("");
  const [sessionNormalTtl, setSessionNormalTtl] = useState("");
  const [sessionRememberTtl, setSessionRememberTtl] = useState("");

  useEffect(() => { if (siteNameData) setSiteNameVal(siteNameData.siteName || ""); }, [siteNameData]);

  useEffect(() => {
    if (features) {
      const state: Record<string, string> = {};
      for (const f of featureList) {
        state[f] = features[f] || "off";
      }
      setFeatureState(state);
    }
  }, [features]);

  useEffect(() => { if (modnameData) setModname(modnameData.modname || ""); }, [modnameData]);
  useEffect(() => { if (ftextData) { setFtextStatus(ftextData._status || ""); setFtextContent(ftextData._ftext || ""); } }, [ftextData]);
  useEffect(() => { if (maintenanceData) { setMaintStatus(maintenanceData.status || "off"); setMaintInput(maintenanceData.myinput || ""); } }, [maintenanceData]);
  useEffect(() => { if (sessionData) { setSessionNormalTtl(sessionData.normalTtl || "30m"); setSessionRememberTtl(sessionData.rememberMeTtl || "24h"); } }, [sessionData]);

  const siteNameMutation = useMutation({
    mutationFn: async (name: string) => { await apiRequest("PATCH", "/api/settings/site-name", { siteName: name }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings/site-name"] }); toast({ title: "Site name updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const featuresMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => { await apiRequest("PATCH", "/api/settings/features", data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings/features"] }); toast({ title: "Features updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const modnameMutation = useMutation({
    mutationFn: async (name: string) => { await apiRequest("PATCH", "/api/settings/modname", { modname: name }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings/modname"] }); toast({ title: "Mod name updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const ftextMutation = useMutation({
    mutationFn: async (data: { _status: string; _ftext: string }) => { await apiRequest("PATCH", "/api/settings/ftext", data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings/ftext"] }); toast({ title: "Text settings updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const maintenanceMutation = useMutation({
    mutationFn: async (data: { status: string; myinput: string }) => { await apiRequest("PATCH", "/api/settings/maintenance", data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings/maintenance"] }); toast({ title: "Maintenance status updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const sessionMutation = useMutation({
    mutationFn: async (data: { normalTtl: string; rememberMeTtl: string }) => { await apiRequest("PATCH", "/api/settings/session", data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings/session"] }); toast({ title: "Session settings updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const sessionResetMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/settings/session/reset"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings/session"] }); toast({ title: "Session settings reset" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const isLoading = siteNameLoading || featuresLoading || modLoading || ftextLoading || maintLoading || sessionLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">System configuration</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Site Name</h2>
        </div>
        <div className="p-5 space-y-4">
          <Input
            value={siteNameVal}
            onChange={e => setSiteNameVal(e.target.value)}
            placeholder="Enter site name"
            maxLength={50}
            className="h-11 rounded bg-muted/50 border-border/60"
            data-testid="input-site-name"
          />
          <p className="text-xs text-muted-foreground">Displayed in the header, login page, and browser tab title.</p>
          <Button
            onClick={() => siteNameMutation.mutate(siteNameVal)}
            disabled={siteNameMutation.isPending || !siteNameVal.trim()}
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-site-name"
          >
            {siteNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Site Name
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Feature Toggles</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {featureList.map(f => (
              <div key={f} className="flex items-center justify-between p-3 rounded bg-muted/40">
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
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-features"
          >
            {featuresMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Features
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Settings className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Mod Name</h2>
        </div>
        <div className="p-5 space-y-4">
          <Input
            value={modname}
            onChange={e => setModname(e.target.value)}
            placeholder="Enter mod name"
            className="h-11 rounded bg-muted/50 border-border/60"
            data-testid="input-modname"
          />
          <Button
            onClick={() => modnameMutation.mutate(modname)}
            disabled={modnameMutation.isPending}
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-modname"
          >
            {modnameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Mod Name
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Type className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Floating Text</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status Text</Label>
            <Input
              value={ftextStatus}
              onChange={e => setFtextStatus(e.target.value)}
              placeholder="Status text"
              className="h-11 rounded bg-muted/50 border-border/60"
              data-testid="input-ftext-status"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Credit / Footer Text</Label>
            <Textarea
              value={ftextContent}
              onChange={e => setFtextContent(e.target.value)}
              placeholder="Credit text"
              rows={3}
              className="rounded bg-muted/50 border-border/60"
              data-testid="input-ftext-content"
            />
          </div>
          <Button
            onClick={() => ftextMutation.mutate({ _status: ftextStatus, _ftext: ftextContent })}
            disabled={ftextMutation.isPending}
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-ftext"
          >
            {ftextMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Text
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Maintenance Mode</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded bg-muted/40">
            <Label className="text-sm font-medium">{maintStatus === "on" ? "Maintenance ON" : "Maintenance OFF"}</Label>
            <Switch
              checked={maintStatus === "on"}
              onCheckedChange={(checked) => setMaintStatus(checked ? "on" : "off")}
              data-testid="switch-maintenance"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Maintenance Message</Label>
            <Textarea
              value={maintInput}
              onChange={e => setMaintInput(e.target.value)}
              placeholder="Message shown during maintenance"
              rows={2}
              className="rounded bg-muted/50 border-border/60"
              data-testid="input-maintenance-message"
            />
          </div>
          <Button
            onClick={() => maintenanceMutation.mutate({ status: maintStatus, myinput: maintInput })}
            disabled={maintenanceMutation.isPending}
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-maintenance"
          >
            {maintenanceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Maintenance
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Session Settings</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Normal Session</Label>
              <Input
                value={sessionNormalTtl}
                onChange={e => setSessionNormalTtl(e.target.value)}
                placeholder="e.g. 30m, 1h, 7d"
                className="h-11 rounded bg-muted/50 border-border/60"
                data-testid="input-session-normal-ttl"
              />
              <p className="text-xs text-muted-foreground">Default: {sessionData?.envNormalTtl || "30m"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Remember Me</Label>
              <Input
                value={sessionRememberTtl}
                onChange={e => setSessionRememberTtl(e.target.value)}
                placeholder="e.g. 24h, 7d, 30d"
                className="h-11 rounded bg-muted/50 border-border/60"
                data-testid="input-session-remember-ttl"
              />
              <p className="text-xs text-muted-foreground">Default: {sessionData?.envRememberMeTtl || "24h"}</p>
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
              onClick={() => sessionMutation.mutate({ normalTtl: sessionNormalTtl, rememberMeTtl: sessionRememberTtl })}
              disabled={sessionMutation.isPending}
              className="flex-1 h-10 rounded text-sm"
              data-testid="button-save-session"
            >
              {sessionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Session
            </Button>
            <Button
              variant="outline"
              onClick={() => sessionResetMutation.mutate()}
              disabled={sessionResetMutation.isPending}
              className="h-10 rounded text-sm"
              data-testid="button-reset-session"
            >
              {sessionResetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
