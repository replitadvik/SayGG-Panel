import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Power, RefreshCw, Copy, Eye, EyeOff, Shield, Clock, Activity,
  Search, Trash2, ChevronLeft, ChevronRight, Code, ExternalLink, Download,
  BookOpen, CheckCircle2, AlertTriangle, Lock, Terminal, Globe, Clipboard, RotateCcw,
  List, ShieldCheck, TestTube,
} from "lucide-react";

function genDefaultToken() {
  const arr = new Uint8Array(36);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(36).padStart(2, "0")).join("").slice(0, 48);
}

function genDefaultSegment() {
  const arr = new Uint8Array(5);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

export default function ApiGeneratorPage() {
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; title: string; desc: string } | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [seg1, setSeg1] = useState("");
  const [seg2, setSeg2] = useState("");
  const [seg3, setSeg3] = useState("");
  const [seg4, setSeg4] = useState("");
  const [seg5, setSeg5] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("10");
  const [registrator, setRegistrator] = useState("SayGG");
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [rateLimitWindow, setRateLimitWindow] = useState("60");
  const [rateLimitMaxReq, setRateLimitMaxReq] = useState("10");
  const [ipAllowlist, setIpAllowlist] = useState("");
  const [customDurationEnabled, setCustomDurationEnabled] = useState(false);
  const [customDurationMaxHours, setCustomDurationMaxHours] = useState("8760");

  const [logPage, setLogPage] = useState(1);
  const [logFilter, setLogFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [logSearchInput, setLogSearchInput] = useState("");

  const { data: config, isLoading } = useQuery<any>({
    queryKey: ["/api/api-generator/config"],
  });

  const { data: logsData } = useQuery<any>({
    queryKey: ["/api/api-generator/logs", logPage, logFilter, logSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(logPage), limit: "20" });
      if (logFilter !== "all") params.set("success", logFilter === "success" ? "1" : "0");
      if (logSearch) params.set("search", logSearch);
      const res = await fetch(`/api/api-generator/logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled === 1);
      setToken(config.token || "");
      setSeg1(config.segment1 || "");
      setSeg2(config.segment2 || "");
      setSeg3(config.segment3 || "");
      setSeg4(config.segment4 || "");
      setSeg5(config.segment5 || "");
      setMaxQuantity(String(config.maxQuantity || 10));
      setRegistrator(config.registrator || "SayGG");
      setRateLimitEnabled(config.rateLimitEnabled === 1);
      setRateLimitWindow(String(config.rateLimitWindow || 60));
      setRateLimitMaxReq(String(config.rateLimitMaxRequests || 10));
      setIpAllowlist(config.ipAllowlist || "");
      setCustomDurationEnabled(config.customDurationEnabled === 1);
      setCustomDurationMaxHours(String(config.customDurationMaxHours || 8760));
    } else if (config === null) {
      setToken(genDefaultToken());
      setSeg1(genDefaultSegment());
      setSeg2(genDefaultSegment());
      setSeg3(genDefaultSegment());
      setSeg4(genDefaultSegment());
      setSeg5(genDefaultSegment());
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/api-generator/config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-generator/config"] });
      toast({ title: "Settings saved", description: "API Generator settings updated." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  function applyFullConfig(data: any) {
    if (!data) return;
    setEnabled(data.enabled === 1);
    setToken(data.token || "");
    setSeg1(data.segment1 || "");
    setSeg2(data.segment2 || "");
    setSeg3(data.segment3 || "");
    setSeg4(data.segment4 || "");
    setSeg5(data.segment5 || "");
    setMaxQuantity(String(data.maxQuantity || 10));
    setRegistrator(data.registrator || "SayGG");
    setRateLimitEnabled(data.rateLimitEnabled === 1);
    setRateLimitWindow(String(data.rateLimitWindow || 60));
    setRateLimitMaxReq(String(data.rateLimitMaxRequests || 10));
    setIpAllowlist(data.ipAllowlist || "");
    setCustomDurationEnabled(data.customDurationEnabled === 1);
    setCustomDurationMaxHours(String(data.customDurationMaxHours || 8760));
  }

  const regenTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/api-generator/regenerate-token");
      return res.json();
    },
    onSuccess: (data: any) => {
      applyFullConfig(data);
      queryClient.invalidateQueries({ queryKey: ["/api/api-generator/config"] });
      toast({ title: "Token regenerated", description: "New API token is now active." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const regenSegmentsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/api-generator/regenerate-segments");
      return res.json();
    },
    onSuccess: (data: any) => {
      applyFullConfig(data);
      queryClient.invalidateQueries({ queryKey: ["/api/api-generator/config"] });
      toast({ title: "Segments regenerated", description: "New route segments are now active." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/api-generator/logs");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-generator/logs"] });
      toast({ title: "Logs cleared", description: data.message });
    },
  });

  const handleSave = useCallback(() => {
    saveMutation.mutate({
      enabled, token, segment1: seg1, segment2: seg2, segment3: seg3, segment4: seg4, segment5: seg5,
      maxQuantity: parseInt(maxQuantity), registrator, rateLimitEnabled,
      rateLimitWindow: parseInt(rateLimitWindow), rateLimitMaxRequests: parseInt(rateLimitMaxReq),
      ipAllowlist, customDurationEnabled, customDurationMaxHours: parseInt(customDurationMaxHours),
    });
  }, [enabled, token, seg1, seg2, seg3, seg4, seg5, maxQuantity, registrator, rateLimitEnabled, rateLimitWindow, rateLimitMaxReq, ipAllowlist, customDurationEnabled, customDurationMaxHours]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  }, [toast]);

  const domain = typeof window !== "undefined" ? window.location.origin : "https://saygg.shop";
  const fullPath = `/g/${seg1}/${seg2}/${seg3}/${seg4}/${seg5}`;
  const fullUrl = `${domain}${fullPath}?token=${token}&game=PUBG&max_devices=1&duration=1d&quantity=1&currency=`;
  const sampleResponse = JSON.stringify({
    success: true,
    currency: "",
    quantity: 1,
    keys: [{
      game: "PUBG",
      user_key: `${registrator || "SayGG"}_Day_A1B2C`,
      duration: 24,
      max_devices: 1,
      status: 1,
      registrator: registrator || "SayGG",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    }],
  }, null, 2);

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "regen-token") regenTokenMutation.mutate();
    if (confirmAction.type === "regen-segments") regenSegmentsMutation.mutate();
    if (confirmAction.type === "clear-logs") clearLogsMutation.mutate();
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold" data-testid="text-page-title">API Generator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage external key generation API</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="shrink-0 text-xs px-3" data-testid="button-save-config">
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Power className="h-4 w-4" /> API Status
            </CardTitle>
            <Badge variant={enabled ? "default" : "secondary"} data-testid="badge-api-status">
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable API</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Allow external key generation via API</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} data-testid="switch-api-enabled" />
          </div>
          {config?.lastUsedAt && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last used: {new Date(config.lastUsedAt).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Secure Route
            </CardTitle>
            <Button
              variant="outline" size="sm"
              onClick={() => setConfirmAction({
                type: "regen-segments",
                title: "Regenerate All Segments?",
                desc: "This will change the API route immediately. The old route will stop working.",
              })}
              disabled={regenSegmentsMutation.isPending}
              data-testid="button-regen-segments"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Regenerate All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              { label: "Seg 1", val: seg1, set: setSeg1 },
              { label: "Seg 2", val: seg2, set: setSeg2 },
              { label: "Seg 3", val: seg3, set: setSeg3 },
              { label: "Seg 4", val: seg4, set: setSeg4 },
              { label: "Seg 5", val: seg5, set: setSeg5 },
            ].map((s, i) => (
              <div key={i}>
                <Label className="text-xs text-muted-foreground">{s.label}</Label>
                <Input
                  value={s.val} onChange={e => s.set(e.target.value)}
                  className="text-xs font-mono mt-1"
                  data-testid={`input-segment-${i + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded p-3 border border-border/40">
            <Label className="text-xs text-muted-foreground">Full API Path</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono text-foreground flex-1 break-all" data-testid="text-full-path">
                {domain}/g/{seg1}/{seg2}/{seg3}/{seg4}/{seg5}
              </code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${domain}${fullPath}`, "API path")} data-testid="button-copy-path">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" /> Authentication
            </CardTitle>
            <Button
              variant="outline" size="sm"
              onClick={() => setConfirmAction({
                type: "regen-token",
                title: "Regenerate Token?",
                desc: "The current token will stop working immediately. Make sure to update any integrations.",
              })}
              disabled={regenTokenMutation.isPending}
              data-testid="button-regen-token"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">API Token</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={e => setToken(e.target.value)}
                className="font-mono text-xs"
                data-testid="input-api-token"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowToken(!showToken)} data-testid="button-toggle-token">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(token, "Token")} data-testid="button-copy-token">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {config?.lastRotatedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last rotated: {new Date(config.lastRotatedAt).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Generation Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Max Quantity Per Request</Label>
              <Input
                type="number" min="1" max="100"
                value={maxQuantity} onChange={e => setMaxQuantity(e.target.value)}
                className="mt-1" data-testid="input-max-quantity"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Registrator Name</Label>
              <Input
                value={registrator} onChange={e => setRegistrator(e.target.value)}
                className="mt-1" data-testid="input-registrator"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">Used in key prefix and response JSON</p>
            </div>
          </div>

          <div className="border-t border-border/40 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Rate Limiting</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Limit requests per IP</p>
              </div>
              <Switch checked={rateLimitEnabled} onCheckedChange={setRateLimitEnabled} data-testid="switch-rate-limit" />
            </div>
            {rateLimitEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Window (seconds)</Label>
                  <Input
                    type="number" min="1" max="3600"
                    value={rateLimitWindow} onChange={e => setRateLimitWindow(e.target.value)}
                    className="mt-1" data-testid="input-rate-window"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max Requests</Label>
                  <Input
                    type="number" min="1" max="1000"
                    value={rateLimitMaxReq} onChange={e => setRateLimitMaxReq(e.target.value)}
                    className="mt-1" data-testid="input-rate-max"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border/40 pt-4">
            <Label className="text-xs text-muted-foreground">IP Allowlist (comma-separated, empty = allow all)</Label>
            <Input
              value={ipAllowlist} onChange={e => setIpAllowlist(e.target.value)}
              placeholder="e.g. 1.2.3.4, 5.6.7.8"
              className="mt-1 font-mono text-xs" data-testid="input-ip-allowlist"
            />
          </div>

          <div className="border-t border-border/40 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Custom API Duration</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Generate keys from any valid duration in the request, without needing configured game durations</p>
              </div>
              <Switch checked={customDurationEnabled} onCheckedChange={setCustomDurationEnabled} data-testid="switch-custom-duration" />
            </div>
            {customDurationEnabled && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Max Custom Duration (hours)</Label>
                  <Input
                    type="number" min="1" max="87600"
                    value={customDurationMaxHours} onChange={e => setCustomDurationMaxHours(e.target.value)}
                    className="mt-1" data-testid="input-custom-duration-max"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Requests exceeding this limit will be rejected (default: 8760 = 1 year)</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2.5 border">
                  <p className="text-[11px] font-medium text-foreground mb-1.5">How it works:</p>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li><strong>ON:</strong> Any valid duration from the request is used directly — no configured game durations needed</li>
                    <li><strong>OFF:</strong> Only durations configured in the game settings are allowed</li>
                    <li>No new duration records are created in the game durations table</li>
                    <li>Game must still exist and be active</li>
                  </ul>
                  <p className="text-[11px] font-medium text-foreground mt-2 mb-1">Accepted formats:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["5h", "12h", "24h", "1d", "2d", "7d", "15d", "30d"].map(ex => (
                      <span key={ex} className="bg-background border rounded px-1.5 py-0.5 font-mono text-[10px]">{ex}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4" /> Example Request & Response
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Example URL</Label>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(fullUrl, "Full URL")} data-testid="button-copy-full-url">
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
            <div className="bg-muted/50 rounded p-3 mt-1 border border-border/40">
              <code className="text-[11px] font-mono break-all text-foreground" data-testid="text-example-url">
                GET {fullUrl}
              </code>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Sample Response</Label>
            <pre className="bg-muted/50 rounded p-3 mt-1 border border-border/40 text-[11px] font-mono text-foreground overflow-x-auto" data-testid="text-sample-response">
              {sampleResponse}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Request Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setConfirmAction({ type: "clear-logs", title: "Clear All Logs?", desc: "This cannot be undone." })}
                disabled={clearLogsMutation.isPending}
                data-testid="button-clear-logs"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => {
                  const rows = (logsData?.logs || []).map((l: any) =>
                    [l.createdAt, l.ip, l.success ? "OK" : "FAIL", l.game, l.duration, l.quantity, l.reason || ""].join(",")
                  );
                  const csv = "Timestamp,IP,Status,Game,Duration,Quantity,Reason\n" + rows.join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "api-generator-logs.csv";
                  a.click();
                }}
                data-testid="button-export-logs"
              >
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={logSearchInput}
                  onChange={e => setLogSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { setLogSearch(logSearchInput); setLogPage(1); } }}
                  className="pl-8 text-xs h-8"
                  data-testid="input-log-search"
                />
              </div>
            </div>
            <Select value={logFilter} onValueChange={v => { setLogFilter(v); setLogPage(1); }}>
              <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="select-log-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!logsData?.logs?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No logs yet</p>
          ) : (
            <div className="space-y-2">
              {logsData.logs.map((log: any) => (
                <div key={log.id} className="border border-border/40 rounded p-3 text-xs space-y-1.5" data-testid={`log-entry-${log.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.success ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                        {log.success ? "OK" : "FAIL"}
                      </Badge>
                      <span className="font-mono text-muted-foreground">{log.ip}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-muted-foreground">
                    {log.game && <span>Game: <span className="text-foreground">{log.game}</span></span>}
                    {log.duration && <span>Duration: <span className="text-foreground">{log.duration}</span>{log.resolvedDurationHours ? ` (${log.resolvedDurationHours}h)` : ""}</span>}
                    {log.durationSource && (
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${log.durationSource === "custom" ? "border-amber-500 text-amber-500" : log.durationSource === "configured" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}`}>
                        {log.durationSource}
                      </Badge>
                    )}
                    {log.maxDevices && <span>Devices: <span className="text-foreground">{log.maxDevices}</span></span>}
                    {log.quantity && <span>Qty: <span className="text-foreground">{log.quantity}</span></span>}
                    {log.currency && <span>Currency: <span className="text-foreground">{log.currency}</span></span>}
                  </div>
                  {log.reason && (
                    <p className="text-destructive text-[11px]">Reason: {log.reason}</p>
                  )}
                  {log.generatedKeyValues && (
                    <p className="text-[11px] font-mono text-green-600 dark:text-green-400">
                      Keys: {JSON.parse(log.generatedKeyValues).join(", ")}
                    </p>
                  )}
                  {log.userAgent && (
                    <p className="text-[10px] text-muted-foreground/60 truncate">UA: {log.userAgent}</p>
                  )}
                </div>
              ))}

              {logsData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Page {logsData.page} of {logsData.totalPages} ({logsData.total} total)
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)} data-testid="button-logs-prev">
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={logPage >= logsData.totalPages} onClick={() => setLogPage(p => p + 1)} data-testid="button-logs-next">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-setup-guide">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Setup Guide</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Step-by-step instructions for using the API Generator</p>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="multiple" className="w-full">

            <AccordionItem value="what-api-does" data-testid="guide-what-api-does">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><Globe className="h-3.5 w-3.5 shrink-0 text-blue-500" /> What This API Does</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <p>The API Generator lets you create license keys automatically through a secure URL, without logging into the panel.</p>
                <p>It uses your panel's real games, durations, and pricing settings to generate keys, and returns the result as a JSON response that any app, tool, or website can read.</p>
                <p>Use it to connect your panel with external apps, bots, websites, or any automated system that needs to generate keys on demand.</p>
                <div className="bg-muted/50 rounded-md p-2.5 border text-[11px]">
                  <p className="font-medium text-foreground mb-1">Key facts:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Generates real keys saved to your panel database</li>
                    <li>Uses your current games and duration settings</li>
                    <li>Returns structured JSON that any system can parse</li>
                    <li>Protected by token authentication and secure route segments</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="enable-api" data-testid="guide-enable-api">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><Power className="h-3.5 w-3.5 shrink-0 text-green-500" /> Step 1: Enable the API</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <p>Before the API will accept any requests, you need to turn it on.</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to the <strong className="text-foreground">API Status</strong> section at the top of this page</li>
                  <li>Toggle the switch to <strong className="text-foreground">ON</strong></li>
                  <li>Click <strong className="text-foreground">Save</strong> at the top right</li>
                </ol>
                <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2.5 border text-[11px]">
                  <span>Current status:</span>
                  {enabled
                    ? <Badge variant="default" className="bg-green-500/10 text-green-500 text-[10px] px-1.5 py-0">Enabled</Badge>
                    : <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Disabled</Badge>
                  }
                </div>
                <p className="text-amber-500 text-[11px]"><AlertTriangle className="h-3 w-3 inline mr-1" />If the API is disabled, all requests will receive an error response.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="copy-url" data-testid="guide-copy-url">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><Clipboard className="h-3.5 w-3.5 shrink-0 text-violet-500" /> Step 2: Copy the Secure API URL</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <p>Your API uses a unique 5-segment URL path that acts as an extra layer of security. Only someone with the exact URL can reach the endpoint.</p>
                <p>The full base URL is:</p>
                <div className="relative">
                  <pre className="bg-muted rounded-md p-2.5 border text-[10px] break-all whitespace-pre-wrap font-mono">{domain}/g/{seg1 || "***"}/{seg2 || "***"}/{seg3 || "***"}/{seg4 || "***"}/{seg5 || "***"}</pre>
                  <Button
                    variant="ghost" size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => copyToClipboard(`${domain}/g/${seg1}/${seg2}/${seg3}/${seg4}/${seg5}`, "Base URL")}
                    data-testid="button-guide-copy-url"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-amber-500 text-[11px]"><AlertTriangle className="h-3 w-3 inline mr-1" />Do not share this URL publicly. Treat it like a password.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="token-usage" data-testid="guide-token-usage">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" /> Step 3: Use the Token</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <p>Every request must include your secret token as a query parameter. Without it, the API will return an "Unauthorized" error.</p>
                <p>Add <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">?token=YOUR_TOKEN</code> to your URL.</p>
                <div className="bg-muted/50 rounded-md p-2.5 border text-[11px] space-y-1">
                  <p className="font-medium text-foreground">Important:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>If you send a wrong or missing token, you get a 401 Unauthorized error</li>
                    <li>After you tap "Regenerate Token," the old token stops working immediately</li>
                    <li>You must update the token in all your apps/tools after rotating</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="first-request" data-testid="guide-first-request">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><Terminal className="h-3.5 w-3.5 shrink-0 text-cyan-500" /> Step 4: Make Your First Request</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-3 text-muted-foreground">
                <p>Use any of these methods to send a GET request to your API:</p>

                <div>
                  <p className="font-medium text-foreground mb-1 text-[11px]">Browser — paste this URL in your address bar:</p>
                  <div className="relative">
                    <pre className="bg-muted rounded-md p-2.5 border text-[10px] break-all whitespace-pre-wrap font-mono">{fullUrl}</pre>
                    <Button
                      variant="ghost" size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => copyToClipboard(fullUrl, "Full URL")}
                      data-testid="button-guide-copy-full-url"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1 text-[11px]">cURL — run this in terminal:</p>
                  <div className="relative">
                    <pre className="bg-muted rounded-md p-2.5 border text-[10px] break-all whitespace-pre-wrap font-mono">{`curl "${fullUrl}"`}</pre>
                    <Button
                      variant="ghost" size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => copyToClipboard(`curl "${fullUrl}"`, "cURL command")}
                      data-testid="button-guide-copy-curl"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1 text-[11px]">Postman / API tool:</p>
                  <div className="bg-muted/50 rounded-md p-2.5 border text-[11px] space-y-0.5">
                    <p><strong>Method:</strong> GET</p>
                    <p className="break-all"><strong>URL:</strong> {domain}/g/{seg1}/{seg2}/{seg3}/{seg4}/{seg5}</p>
                    <p><strong>Params:</strong> token, game, max_devices, duration, quantity, currency</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="query-params" data-testid="guide-query-params">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><List className="h-3.5 w-3.5 shrink-0 text-indigo-500" /> Query Parameters Explained</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium text-foreground">Parameter</th>
                        <th className="text-left p-2 font-medium text-foreground">Required</th>
                        <th className="text-left p-2 font-medium text-foreground hidden sm:table-cell">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr><td className="p-2 font-mono">token</td><td className="p-2">Yes</td><td className="p-2 hidden sm:table-cell">Your secret API token</td></tr>
                      <tr><td className="p-2 font-mono">game</td><td className="p-2">Yes</td><td className="p-2 hidden sm:table-cell">Game name (must match a game in your panel)</td></tr>
                      <tr><td className="p-2 font-mono">duration</td><td className="p-2">Yes</td><td className="p-2 hidden sm:table-cell">Key duration (e.g. 1d, 3d, 7d, 12h, 24h)</td></tr>
                      <tr><td className="p-2 font-mono">max_devices</td><td className="p-2">No</td><td className="p-2 hidden sm:table-cell">Max devices per key (default: 1)</td></tr>
                      <tr><td className="p-2 font-mono">quantity</td><td className="p-2">No</td><td className="p-2 hidden sm:table-cell">Number of keys to generate (default: 1, max: {maxQuantity})</td></tr>
                      <tr><td className="p-2 font-mono">currency</td><td className="p-2">No</td><td className="p-2 hidden sm:table-cell">Currency label (optional, passed through in response)</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-muted/50 rounded-md p-2.5 border text-[11px]">
                  <p className="font-medium text-foreground mb-1">Duration examples:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span><code className="bg-muted px-1 rounded font-mono">1d</code> = 1 day (24h)</span>
                    <span><code className="bg-muted px-1 rounded font-mono">3d</code> = 3 days</span>
                    <span><code className="bg-muted px-1 rounded font-mono">7d</code> = 7 days</span>
                    <span><code className="bg-muted px-1 rounded font-mono">1w</code> = 1 week</span>
                    <span><code className="bg-muted px-1 rounded font-mono">12h</code> = 12 hours</span>
                    <span><code className="bg-muted px-1 rounded font-mono">24h</code> = 24 hours</span>
                    <span><code className="bg-muted px-1 rounded font-mono">1m</code> = 1 month</span>
                    <span><code className="bg-muted px-1 rounded font-mono">24</code> = 24 hours</span>
                  </div>
                  <p className="mt-1.5 text-amber-500"><AlertTriangle className="h-3 w-3 inline mr-1" />{customDurationEnabled ? "Configured game durations are checked first. If not found, custom duration parsing is used automatically." : "Duration must match an active duration configured in your game settings. Enable Custom API Duration in Generation Rules to allow any duration."}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="success-response" data-testid="guide-success-response">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" /> Success Response Example</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <p>When everything is correct, the API returns a JSON object like this:</p>
                <div className="relative">
                  <pre className="bg-muted rounded-md p-2.5 border text-[10px] whitespace-pre-wrap font-mono">{sampleResponse}</pre>
                  <Button
                    variant="ghost" size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => copyToClipboard(sampleResponse, "Sample response")}
                    data-testid="button-guide-copy-response"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-md p-2.5 border text-[11px]">
                  <p className="font-medium text-foreground mb-1">Fields explained:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li><code className="font-mono">success</code> — true if keys were generated</li>
                    <li><code className="font-mono">keys</code> — array of generated key objects</li>
                    <li><code className="font-mono">user_key</code> — the license key string</li>
                    <li><code className="font-mono">duration</code> — key validity in hours</li>
                    <li><code className="font-mono">registrator</code> — who created the key ({registrator || "SayGG"})</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="error-responses" data-testid="guide-error-responses">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" /> Failure Response Examples</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <p>When something goes wrong, the API returns an error with a clear message:</p>
                <div className="space-y-2">
                  {[
                    { label: "Missing or wrong token", json: '{ "success": false, "message": "Unauthorized" }' },
                    { label: "API is disabled", json: '{ "success": false, "message": "API generator is disabled" }' },
                    { label: "Invalid game name", json: '{ "success": false, "message": "Game not found: WRONGNAME" }' },
                    { label: "Invalid duration", json: '{ "success": false, "message": "Invalid or inactive duration: 999d" }' },
                    { label: "Wrong route / not found", json: '{ "success": false, "message": "Not found" }' },
                    { label: "Rate limit exceeded", json: '{ "success": false, "message": "Rate limit exceeded. Try again later." }' },
                  ].map((err) => (
                    <div key={err.label} className="bg-muted/50 rounded-md p-2 border">
                      <p className="font-medium text-foreground text-[11px] mb-1">{err.label}:</p>
                      <pre className="text-[10px] font-mono text-red-400">{err.json}</pre>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="common-mistakes" data-testid="guide-common-mistakes">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" /> Common Mistakes</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                <div className="space-y-1.5">
                  {[
                    { mistake: "Forgot to add ?token= to the URL", fix: "Add your token as a query parameter" },
                    { mistake: "Using the wrong token (old or mistyped)", fix: "Copy the current token from this page" },
                    { mistake: "Game name doesn't match exactly", fix: "Use the exact name from your Games page (case-sensitive)" },
                    { mistake: "Duration format is wrong (e.g. '1 day' instead of '1d')", fix: "Use short format: 1d, 7d, 12h, 24h, 1w, 1m" },
                    { mistake: "Duration not configured for that game", fix: "Add the duration in Game Durations settings first" },
                    { mistake: "Route changed after regeneration", fix: "Copy the new URL and update all your integrations" },
                    { mistake: "API is disabled", fix: "Turn it on from the API Status toggle and save" },
                    { mistake: "Quantity exceeds maximum ({maxQuantity})", fix: "Use a smaller number or increase max quantity in settings" },
                  ].map((item) => (
                    <div key={item.mistake} className="flex gap-2 bg-muted/50 rounded-md p-2 border text-[11px]">
                      <span className="text-red-400 shrink-0">&#10005;</span>
                      <div>
                        <p className="text-foreground font-medium">{item.mistake}</p>
                        <p className="text-muted-foreground">{item.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security-tips" data-testid="guide-security-tips">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Security Tips</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                <div className="space-y-1.5">
                  {[
                    "Never share the full API URL publicly — it includes your secure route",
                    "Never expose your token in client-side code, public repos, or screenshots",
                    "If your token is leaked, regenerate it immediately from this page",
                    "If your route URL is leaked, regenerate all segments immediately",
                    "Use the IP allowlist feature to restrict which servers can call the API",
                    "Check the Request Logs section regularly for suspicious activity",
                    "Enable rate limiting to prevent abuse",
                  ].map((tip) => (
                    <div key={tip} className="flex items-start gap-2 bg-muted/50 rounded-md p-2 border text-[11px]">
                      <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="after-rotation" data-testid="guide-after-rotation">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><RotateCcw className="h-3.5 w-3.5 shrink-0 text-purple-500" /> After Rotating Token or Route</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed space-y-2 text-muted-foreground">
                <p>When you regenerate your token or route segments, the old values stop working instantly. Here's what to do:</p>
                <div className="space-y-1.5">
                  <div className="bg-muted/50 rounded-md p-2.5 border text-[11px]">
                    <p className="font-medium text-foreground mb-1">After token rotation:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Copy the new token from the Authentication section</li>
                      <li>Update the token in every app, bot, or tool that uses this API</li>
                      <li>Old requests with the previous token will return "Unauthorized"</li>
                    </ol>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2.5 border text-[11px]">
                    <p className="font-medium text-foreground mb-1">After route regeneration:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Copy the new full URL from the Example Request section or Step 2 above</li>
                      <li>Update the URL in every integration</li>
                      <li>Old URLs will return "Not found"</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="testing-checklist" className="border-b-0" data-testid="guide-testing-checklist">
              <AccordionTrigger className="text-sm py-3 gap-2">
                <span className="flex items-center gap-2 text-left"><TestTube className="h-3.5 w-3.5 shrink-0 text-pink-500" /> Testing Checklist</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                <p className="mb-2">Before going live, verify each item:</p>
                <div className="space-y-1">
                  {[
                    { item: "API is enabled (toggle is ON and saved)", check: enabled },
                    { item: "Token is copied and saved securely", check: !!token },
                    { item: "Route URL is copied correctly", check: !!(seg1 && seg2 && seg3 && seg4 && seg5) },
                    { item: "Game name matches exactly (case-sensitive)", check: true },
                    { item: "Duration matches an active game duration", check: true },
                    { item: "Test request returns a success JSON response", check: false },
                    { item: "Request appears in the Logs section", check: false },
                  ].map((c) => (
                    <div key={c.item} className="flex items-center gap-2 bg-muted/50 rounded-md p-2 border text-[11px]">
                      <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${c.check ? "bg-green-500/20 border-green-500" : "border-muted-foreground/30"}`}>
                        {c.check && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      </div>
                      <span>{c.item}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} data-testid="button-confirm-ok">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
