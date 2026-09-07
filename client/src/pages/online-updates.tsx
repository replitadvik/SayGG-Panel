import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock3, FileArchive, Loader2, RefreshCw, Upload } from "lucide-react";

interface OnlineUpdatesConfig {
  version: string;
  server: boolean;
  apk_url: string;
  message: string;
  Server_Response: string;
  LibVersion: string;
}

interface LibraryStatus {
  LibVersion: string;
  filename: string | null;
  size: number;
  uploadedAt: string | null;
}

interface HistoryEntry {
  id: number;
  previousValue: string | null;
  newValue: string;
  fileName: string | null;
  fileSize: number | null;
  changedBy: string | null;
  createdAt: string | null;
}

interface OnlineUpdatesHistory {
  versionChanges: HistoryEntry[];
  libraryChanges: HistoryEntry[];
}

export default function OnlineUpdatesPage() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<OnlineUpdatesConfig>({
    queryKey: ["/api/online-updates/config"],
  });
  const { data: libraryStatus, isLoading: isLibraryLoading } = useQuery<LibraryStatus>({
    queryKey: ["/api/online-updates/library"],
  });
  const { data: history, isLoading: isHistoryLoading } = useQuery<OnlineUpdatesHistory>({
    queryKey: ["/api/online-updates/history"],
  });
  const [version, setVersion] = useState("");
  const [server, setServer] = useState(false);
  const [apkUrl, setApkUrl] = useState("");
  const [message, setMessage] = useState("");
  const [serverResponse, setServerResponse] = useState("");
  const [libVersion, setLibVersion] = useState("");
  const [libraryFile, setLibraryFile] = useState<File | null>(null);
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
    if (libraryStatus) {
      setLibVersion(libraryStatus.LibVersion);
    } else if (config) {
      setLibVersion(config.LibVersion);
    }
  }, [config, libraryStatus]);

  const currentLibraryVersion = libraryStatus?.LibVersion || config?.LibVersion || "";
  const libraryVersionChanged = libVersion.trim() !== currentLibraryVersion;

  const uploadLibraryFile = async (file: File, requestedVersion: string) => {
    const response = await fetch("/api/online-updates/library", {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/zip",
        "X-Filename": encodeURIComponent(file.name),
        "X-Library-Version": requestedVersion.trim(),
      },
      body: file,
      credentials: "include",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Library ZIP upload failed.");
    }
    return result;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (libraryFile) {
        await uploadLibraryFile(libraryFile, libVersion);
      }
      await apiRequest("PUT", "/api/online-updates/config", {
        version,
        server,
        apk_url: apkUrl,
        message,
        Server_Response: serverResponse,
      });
    },
    onSuccess: () => {
      setLibraryFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/history"] });
      toast({ title: "Online updates saved" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!libraryFile) throw new Error("Choose a library ZIP file first.");
      return uploadLibraryFile(libraryFile, libVersion);
    },
    onSuccess: () => {
      setLibraryFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/online-updates/history"] });
      toast({ title: "Library ZIP uploaded" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || isLibraryLoading || isHistoryLoading) {
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
            disabled={saveMutation.isPending || (libraryVersionChanged && !libraryFile)}
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
          <FileArchive className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Library Updates</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded bg-muted/40 border border-border/40 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              Current ZIP: <span className="font-medium text-foreground">{libraryStatus?.filename || "No ZIP uploaded"}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Current LibVersion: <span className="font-medium text-foreground">{currentLibraryVersion || "—"}</span>
            </p>
            {libraryStatus?.size ? (
              <p className="text-xs text-muted-foreground">
                Size: <span className="font-medium text-foreground">{(libraryStatus.size / 1024 / 1024).toFixed(2)} MB</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-updates-lib-version" className="text-sm font-medium">LibVersion</Label>
            <Input
              id="online-updates-lib-version"
              value={libVersion}
              onChange={e => setLibVersion(e.target.value)}
              placeholder="1.0.0"
              className="h-11 rounded bg-muted/50 border-border/60"
              data-testid="input-online-updates-lib-version"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="online-updates-library-zip" className="text-sm font-medium">New Library ZIP</Label>
            <Input
              ref={fileInputRef}
              id="online-updates-library-zip"
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={e => setLibraryFile(e.target.files?.[0] ?? null)}
              className="h-11 rounded bg-muted/50 border-border/60 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
              data-testid="input-online-updates-library-zip"
            />
            {libraryFile && (
              <p className="text-xs text-muted-foreground truncate">{libraryFile.name}</p>
            )}
          </div>

          {libraryVersionChanged && !libraryFile && (
            <p className="text-xs text-destructive">
              Upload a new ZIP before saving a changed LibVersion.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !libraryFile || !libVersion.trim()}
            className="w-full h-10 rounded text-sm"
            data-testid="button-upload-online-updates-library"
          >
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload Library ZIP &amp; Save
          </Button>
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
          title="Lib Changed History"
          icon={<FileArchive className="h-4 w-4 text-panel-header-foreground/70" />}
          entries={history?.libraryChanges || []}
          emptyText="No library changes yet."
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
                  LibVersion: {entry.previousValue || "—"} → {entry.newValue}
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