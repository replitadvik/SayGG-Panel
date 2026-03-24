import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Trash2, RotateCcw, Edit, Copy, Clock, Key } from "lucide-react";

function formatDuration(hours: number) {
  if (hours === 1) return "1 Hour";
  if (hours < 24) return `${hours} Hours`;
  if (hours === 24) return "1 Day";
  return `${(hours / 24).toFixed(0)} Days`;
}

function formatDate(d: string | null) {
  if (!d) return "Not activated";
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function countDevices(devices: string | null) {
  if (!devices) return 0;
  return devices.split(",").filter(Boolean).length;
}

export default function KeysPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [editKey, setEditKey] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [extendKey, setExtendKey] = useState<any>(null);
  const [extendDuration, setExtendDuration] = useState("");

  const { data: keys = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/keys"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "Key deleted" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", "/api/keys/bulk-delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setSelectedKeys([]);
      toast({ title: "Keys deleted" });
    },
  });

  const resetDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/keys/${id}/reset-device`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "Devices reset" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/keys/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setEditKey(null);
      toast({ title: "Key updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const extendMutation = useMutation({
    mutationFn: async ({ id, duration }: { id: number; duration: string }) => {
      await apiRequest("POST", `/api/keys/${id}/extend`, { duration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setExtendKey(null);
      setExtendDuration("");
      toast({ title: "Duration extended" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = keys.filter(k =>
    k.userKey?.toLowerCase().includes(search.toLowerCase()) ||
    k.game?.toLowerCase().includes(search.toLowerCase()) ||
    k.registrator?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedKeys(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedKeys.length === filtered.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filtered.map(k => k.id));
    }
  };

  const openEdit = (key: any) => {
    setEditKey(key);
    setEditForm({
      game: key.game,
      userKey: key.userKey,
      duration: key.duration,
      maxDevices: key.maxDevices,
      status: key.status,
      registrator: key.registrator,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-panel-header px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-panel-header-foreground/70" />
          <h1 className="text-sm font-semibold text-panel-header-foreground" data-testid="text-keys-title">Keys</h1>
          <span className="text-xs text-panel-header-foreground/50" data-testid="text-keys-count">{filtered.length} total</span>
        </div>
        {selectedKeys.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkDeleteMutation.mutate(selectedKeys)}
            disabled={bulkDeleteMutation.isPending}
            className="h-8 rounded text-xs"
            data-testid="button-bulk-delete"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete ({selectedKeys.length})
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded bg-muted/50 border-border/60"
            data-testid="input-search-keys"
          />
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border/60 bg-card">
            <Checkbox
              checked={selectedKeys.length === filtered.length && filtered.length > 0}
              onCheckedChange={toggleAll}
              data-testid="checkbox-select-all"
              className="rounded"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">All</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No keys found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(key => (
            <div
              key={key.id}
              className="rounded-lg border border-border/60 bg-card p-4 shadow-sm"
              data-testid={`row-key-${key.id}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedKeys.includes(key.id)}
                  onCheckedChange={() => toggleSelect(key.id)}
                  className="mt-1 rounded"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="text-xs bg-muted/60 px-2 py-1 rounded-md font-mono truncate max-w-[180px]">{key.userKey}</code>
                      <button onClick={() => handleCopy(key.userKey)} className="text-muted-foreground hover:text-primary flex-shrink-0" data-testid={`button-copy-key-${key.id}`}>
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Badge variant={key.status === 1 ? "default" : "destructive"} className="text-[10px] rounded flex-shrink-0">
                      {key.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="text-muted-foreground">Game: <span className="text-foreground font-medium">{key.game}</span></div>
                    <div className="text-muted-foreground">Duration: <span className="text-foreground font-medium">{formatDuration(key.duration)}</span></div>
                    <div className="text-muted-foreground">Devices: <span className="text-foreground font-mono">{countDevices(key.devices)}/{key.maxDevices}</span></div>
                    <div className="text-muted-foreground">By: <span className="text-foreground">{key.registrator}</span></div>
                  </div>

                  <div className="text-[11px] text-muted-foreground">{formatDate(key.expiredDate)}</div>

                  <div className="flex items-center gap-1 pt-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded" onClick={() => openEdit(key)} data-testid={`button-edit-key-${key.id}`}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {(user?.level === 1 || user?.level === 2) && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded" onClick={() => { setExtendKey(key); setExtendDuration(""); }} data-testid={`button-extend-key-${key.id}`}>
                        <Clock className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded" onClick={() => resetDeviceMutation.mutate(key.id)} data-testid={`button-reset-key-${key.id}`}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded text-destructive" onClick={() => deleteMutation.mutate(key.id)} data-testid={`button-delete-key-${key.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editKey} onOpenChange={() => setEditKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(user?.level === 1 || user?.level === 2) && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Game</Label>
                  <Input value={editForm.game || ""} onChange={e => setEditForm({...editForm, game: e.target.value})} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-game" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Key</Label>
                  <Input value={editForm.userKey || ""} onChange={e => setEditForm({...editForm, userKey: e.target.value})} className="h-11 rounded bg-muted/50 border-border/60 font-mono" data-testid="input-edit-key" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Duration (hrs)</Label>
                    <Input type="number" value={editForm.duration || ""} onChange={e => setEditForm({...editForm, duration: parseInt(e.target.value)})} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-duration" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Devices</Label>
                    <Input type="number" value={editForm.maxDevices || ""} onChange={e => setEditForm({...editForm, maxDevices: parseInt(e.target.value)})} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-max-devices" />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={String(editForm.status)} onValueChange={v => setEditForm({...editForm, status: parseInt(v)})}>
                <SelectTrigger data-testid="select-edit-status" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditKey(null)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editKey.id, data: editForm })}
              disabled={updateMutation.isPending}
              className="rounded h-10"
              data-testid="button-save-edit"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendKey} onOpenChange={() => setExtendKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Extend Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded bg-muted/60 border border-border/60 text-sm space-y-1.5">
              <div className="text-muted-foreground">Key: <code className="font-mono text-foreground">{extendKey?.userKey}</code></div>
              <div className="text-muted-foreground">Current: <span className="text-foreground">{extendKey ? formatDuration(extendKey.duration) : ""}</span></div>
              <div className="text-muted-foreground">Expiry: <span className="text-foreground">{extendKey ? formatDate(extendKey.expiredDate) : ""}</span></div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Extension Duration</Label>
              <Input
                value={extendDuration}
                onChange={e => setExtendDuration(e.target.value.toUpperCase())}
                placeholder="e.g. 30D, 12H, 7D"
                className="h-11 rounded bg-muted/50 border-border/60 font-mono"
                data-testid="input-extend-duration"
              />
              <p className="text-xs text-muted-foreground">Format: number + D (days) or H (hours)</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExtendKey(null)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => extendMutation.mutate({ id: extendKey.id, duration: extendDuration })}
              disabled={extendMutation.isPending || !extendDuration}
              className="rounded h-10"
              data-testid="button-extend-save"
            >
              {extendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
