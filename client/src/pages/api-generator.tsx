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
  Power, RefreshCw, Copy, Eye, EyeOff, Shield, Clock, Activity,
  Search, Trash2, ChevronLeft, ChevronRight, Code, ExternalLink, Download,
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
      ipAllowlist,
    });
  }, [enabled, token, seg1, seg2, seg3, seg4, seg5, maxQuantity, registrator, rateLimitEnabled, rateLimitWindow, rateLimitMaxReq, ipAllowlist]);

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
                    {log.duration && <span>Duration: <span className="text-foreground">{log.duration}</span></span>}
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
