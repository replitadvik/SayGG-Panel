import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Clock3,
  Download,
  FileArchive,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

interface OnlineUpdatesConfig {
  version: string;
  server: boolean;
  apk_url: string;
  message: string;
  Server_Response: string;
}

interface ZipRecord {
  id: number;
  filename: string;
  size: number;
  isActive: boolean;
  uploadedBy: string | null;
  uploadedAt: string | null;
  updatedAt: string | null;
}

interface ZipListResponse {
  maxZips: number;
  activeZipId: number | null;
  zips: ZipRecord[];
}

interface HistoryEntry {
  id: number;
  changeType: string;
  zipId: number | null;
  previousValue: string | null;
  newValue: string;
  fileName: string | null;
  fileSize: number | null;
  changedBy: string | null;
  createdAt: string | null;
}

interface OnlineUpdatesHistory {
  versionChanges: HistoryEntry[];
  zipChanges: HistoryEntry[];
}

interface TokenSettings {
  expirySeconds: number;
  minSeconds: number;
  maxSeconds: number;
  changedBy: string | null;
  changedAt: string | null;
}

type TokenExpiryUnit = "seconds" | "minutes" | "hours";

export default function OnlineUpdatesPage() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<OnlineUpdatesConfig>({
    queryKey: ["/api/online-updates/config"],
  });
  const { data: zipList, isLoading: isZipLoading } = useQuery<ZipListResponse>({
    queryKey: ["/api/online-updates/zips"],
  });
  const { data: history, isLoading: isHistoryLoading } = useQuery<OnlineUpdatesHistory>({
    queryKey: ["/api/online-updates/history"],
  });
  const { data: tokenSettings, isLoading: isTokenSettingsLoading } = useQuery<TokenSettings>({
    queryKey: ["/api/online-updates/token-settings"],
  });
  const [version, setVersion] = useState("");
  const [server, setServer] = useState(false);
  const [apkUrl, setApkUrl] = useState("");
  const [message, setMessage] = useState("");
  const [serverResponse, setServerResponse] = useState("");
  const [tokenExpiryValue, setTokenExpiryValue] = useState("");
  const [tokenExpiryUnit, setTokenExpiryUnit] = useState<TokenExpiryUnit>("minutes");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [renamingZipId, setRenamingZipId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!config) return;
    setVersion(config.version);
    setServer(config.server);
    setApkUrl(config.apk_url);
    setMessage(config.message);
    setServerResponse(config.Server_Response);
  }, [config]);

  useEffect(() => {
    if (!tokenSettings) return;
    if (tokenSettings.expirySeconds % 3600 === 0) {
      setTokenExpiryValue(String(tokenSettings.expirySeconds / 3600));
      setTokenExpiryUnit("hours");
    } else if (tokenSettings.expirySeconds % 60 === 0) {
      setTokenExpiryValue(String(tokenSettings.expirySeconds / 60));
      setTokenExpiryUnit("minutes");
    } else {
      setTokenExpiryValue(String(tokenSettings.expirySeconds));
      setTokenExpiryUnit("seconds");
    }
  }, [tokenSettings]);

  const invalidateZipQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/online-updates/zips"] });
    queryClient.invalidateQueries({ queryKey: ["/api/online-updates/history"] });
  };

  const uploadZipFile = async (file: File) => {
    const response = await fetch("/api/online-updates/zips", {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/zip",
        "X-Filename": encodeURIComponent(file.name),
      },
      body: file,
      credentials: "include",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "ZIP upload failed.");
    }
    return result;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/online-updates/config", {
        version,
        server,
        apk_url: apkUrl,
        message,
        Server_Response: serverResponse,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/config"] });
      toast({ title: "Online updates saved" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const tokenSettingsMutation = useMutation({
    mutationFn: async () => {
      const value = Number(tokenExpiryValue);
      const multiplier = { seconds: 1, minutes: 60, hours: 3600 }[tokenExpiryUnit];
      const expirySeconds = value * multiplier;
      if (!Number.isInteger(value) || !Number.isInteger(expirySeconds)) {
        throw new Error("Enter a whole number and choose a duration.");
      }
      return apiRequest("PUT", "/api/online-updates/token-settings", { expirySeconds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/token-settings"] });
      toast({ title: "ZIP token expiry updated", description: "New tokens use the new expiry immediately." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!zipFile) throw new Error("Choose a ZIP file first.");
      return uploadZipFile(zipFile);
    },
    onSuccess: () => {
      setZipFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      invalidateZipQueries();
      toast({ title: "ZIP uploaded" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const zipActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "activate" | "deactivate" | "delete" }) => {
      if (action === "delete" && !window.confirm("Delete this ZIP file and its stored contents?")) {
        throw new Error("Delete cancelled.");
      }
      const method = action === "delete" ? "DELETE" : "POST";
      return apiRequest(method, `/api/online-updates/zips/${id}${action === "delete" ? "" : `/${action}`}`);
    },
    onSuccess: (_data, variables) => {
      invalidateZipQueries();
      toast({ title: variables.action === "delete" ? "ZIP deleted" : `ZIP ${variables.action}d` });
    },
    onError: (error: any) => {
      if (error.message !== "Delete cancelled.") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, filename }: { id: number; filename: string }) =>
      apiRequest("PATCH", `/api/online-updates/zips/${id}`, { filename }),
    onSuccess: () => {
      setRenamingZipId(null);
      invalidateZipQueries();
      toast({ title: "ZIP renamed" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  if (isLoading || isZipLoading || isHistoryLoading || isTokenSettingsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-online-updates-title">Online Updates</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage the online update configuration</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Update Configuration</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded bg-muted/40">
            <Label className="text-sm font-medium">{server ? "Server ON" : "Server OFF"}</Label>
            <Switch
              checked={server}
              onCheckedChange={setServer}
              data-testid="switch-online-updates-server"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-updates-version" className="text-sm font-medium">Version</Label>
            <Input
              id="online-updates-version"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="1.0.2"
              className="h-11 rounded bg-muted/50 border-border/60"
              data-testid="input-online-updates-version"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-updates-apk-url" className="text-sm font-medium">APK URL</Label>
            <Input
              id="online-updates-apk-url"
              value={apkUrl}
              onChange={e => setApkUrl(e.target.value)}
              placeholder="https://example.com/app-release.apk"
              className="h-11 rounded bg-muted/50 border-border/60"
              data-testid="input-online-updates-apk-url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-updates-message" className="text-sm font-medium">Message</Label>
            <Textarea
              id="online-updates-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Version 1.0.2 is now available."
              rows={3}
              className="rounded bg-muted/50 border-border/60"
              data-testid="input-online-updates-message"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-updates-server-response" className="text-sm font-medium">Server Response</Label>
            <Textarea
              id="online-updates-server-response"
              value={serverResponse}
              onChange={e => setServerResponse(e.target.value)}
              placeholder="Server is currently under maintenance."
              rows={3}
              className="rounded bg-muted/50 border-border/60"
              data-testid="input-online-updates-server-response"
            />
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-online-updates"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Online Updates
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">ZIP Token Expiry</h2>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Owner-only setting. Temporary ZIP download tokens expire after the selected duration.
            Changing it immediately invalidates existing tokens.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="online-updates-token-expiry">Expire Time</Label>
              <div className="flex gap-2">
                <Input
                  id="online-updates-token-expiry"
                  type="number"
                  min={1}
                  step={1}
                  value={tokenExpiryValue}
                  onChange={e => setTokenExpiryValue(e.target.value)}
                  className="h-11 rounded bg-muted/50 border-border/60"
                  data-testid="input-online-updates-token-expiry"
                />
                <Select
                  value={tokenExpiryUnit}
                  onValueChange={value => setTokenExpiryUnit(value as TokenExpiryUnit)}
                >
                  <SelectTrigger
                    aria-label="Token expiry duration"
                    className="h-11 w-32 rounded border-border/60 bg-muted/50 px-3 text-sm"
                    data-testid="select-online-updates-token-expiry-unit"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="min-w-32">
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => tokenSettingsMutation.mutate()}
              disabled={tokenSettingsMutation.isPending || !tokenExpiryValue}
              className="h-11"
              data-testid="button-save-online-updates-token-expiry"
            >
              {tokenSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Token Expiry
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Allowed range: 1 second–7 days
            {tokenSettings?.changedAt ? ` · Last changed ${new Date(tokenSettings.changedAt).toLocaleString()}` : ""}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <FileArchive className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">ZIP Updates</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded bg-muted/40 border border-border/40 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              {zipList?.zips.length || 0} of {zipList?.maxZips || 5} ZIP slots used.
              {zipList?.activeZipId ? " The active ZIP is the only one available to server authorization." : " No ZIP is active."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-updates-library-zip" className="text-sm font-medium">Add ZIP file</Label>
            <Input
              ref={fileInputRef}
              id="online-updates-library-zip"
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={e => setZipFile(e.target.files?.[0] ?? null)}
              className="h-11 rounded bg-muted/50 border-border/60 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
              data-testid="input-online-updates-library-zip"
            />
            {zipFile && (
              <p className="text-xs text-muted-foreground truncate">{zipFile.name}</p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !zipFile || (zipList?.zips.length || 0) >= (zipList?.maxZips || 5)}
            className="w-full h-10 rounded text-sm"
            data-testid="button-upload-online-updates-library"
          >
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload ZIP
          </Button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Stored ZIP files</h3>
              <span className="text-xs text-muted-foreground">One active at a time</span>
            </div>
            {zipList?.zips.length ? (
              <div className="space-y-2">
                {zipList.zips.map(zip => (
                  <div key={zip.id} className={`rounded border p-3 space-y-3 ${zip.isActive ? "border-primary/50 bg-primary/5" : "border-border/50"}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        {renamingZipId === zip.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              className="h-9 max-w-sm"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === "Enter") renameMutation.mutate({ id: zip.id, filename: renameValue.trim() });
                                if (e.key === "Escape") setRenamingZipId(null);
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => renameMutation.mutate({ id: zip.id, filename: renameValue.trim() })}
                              disabled={renameMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRenamingZipId(null)} aria-label="Cancel rename">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="font-medium truncate">{zip.filename}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {(zip.size / 1024 / 1024).toFixed(2)} MB · added {zip.uploadedAt ? new Date(zip.uploadedAt).toLocaleString() : "—"}
                        </p>
                      </div>
                      {zip.isActive ? (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(`/api/online-updates/zips/${zip.id}/download`, "_blank")}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                      </Button>
                      <Button
                        size="sm"
                        variant={zip.isActive ? "outline" : "default"}
                        onClick={() => zipActionMutation.mutate({ id: zip.id, action: zip.isActive ? "deactivate" : "activate" })}
                        disabled={zipActionMutation.isPending}
                      >
                        {zip.isActive ? <XCircle className="mr-1.5 h-3.5 w-3.5" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                        {zip.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRenamingZipId(zip.id);
                          setRenameValue(zip.filename);
                        }}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => zipActionMutation.mutate({ id: zip.id, action: "delete" })}
                        disabled={zipActionMutation.isPending}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded border border-dashed p-5 text-center text-xs text-muted-foreground">No ZIP files uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HistoryCard
          title="Version Changed History"
          icon={<Clock3 className="h-4 w-4 text-panel-header-foreground/70" />}
          entries={history?.versionChanges || []}
          emptyText="No version changes yet."
        />
        <HistoryCard
          title="ZIP Activity History"
          icon={<FileArchive className="h-4 w-4 text-panel-header-foreground/70" />}
          entries={history?.zipChanges || []}
          emptyText="No ZIP activity yet."
          showLibraryDetails
        />
      </div>
    </div>
  );
}

function HistoryCard({
  title,
  icon,
  entries,
  emptyText,
  showLibraryDetails = false,
}: {
  title: string;
  icon: React.ReactNode;
  entries: HistoryEntry[];
  emptyText: string;
  showLibraryDetails?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-panel-header-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border/40">
        {entries.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          entries.slice(0, 10).map(entry => (
            <div key={entry.id} className="p-4 space-y-1.5">
              {showLibraryDetails && entry.fileName ? (
                <p className="text-sm font-medium truncate">{entry.fileName}</p>
              ) : (
                <p className="text-sm font-medium">
                  {entry.previousValue || "—"} <span className="text-muted-foreground">→</span> {entry.newValue}
                </p>
              )}
              {showLibraryDetails && (
                <p className="text-xs text-muted-foreground">
                  {entry.changeType.replace("zip_", "").replace("_", " ")} · {entry.previousValue || "—"} → {entry.newValue}
                  {entry.fileSize ? ` · ${(entry.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {entry.changedBy || "Owner"} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Just now"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}