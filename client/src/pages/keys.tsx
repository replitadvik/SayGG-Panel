import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Trash2, RotateCcw, Edit, Copy, Clock } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight uppercase" data-testid="text-keys-title">Keys</h1>
        {selectedKeys.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkDeleteMutation.mutate(selectedKeys)}
            disabled={bulkDeleteMutation.isPending}
            className="h-8 text-xs uppercase tracking-wider"
            data-testid="button-bulk-delete"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete ({selectedKeys.length})
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search keys..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 bg-muted border-border"
          data-testid="input-search-keys"
        />
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedKeys.length === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Game</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Key</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Duration</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Devices</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Expiry</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Status</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Registrator</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8 text-xs">
                        No keys found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(key => (
                      <TableRow key={key.id} className="border-border" data-testid={`row-key-${key.id}`}>
                        <TableCell>
                          <Checkbox
                            checked={selectedKeys.includes(key.id)}
                            onCheckedChange={() => toggleSelect(key.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs">{key.game}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-[11px] bg-muted px-1.5 py-0.5 border border-border font-mono">{key.userKey}</code>
                            <button onClick={() => handleCopy(key.userKey)} className="text-muted-foreground hover:text-primary">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{formatDuration(key.duration)}</TableCell>
                        <TableCell className="text-xs font-mono">{countDevices(key.devices)}/{key.maxDevices}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">{formatDate(key.expiredDate)}</TableCell>
                        <TableCell>
                          <Badge variant={key.status === 1 ? "default" : "destructive"} className="text-[10px] uppercase tracking-wider">
                            {key.status === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{key.registrator}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(key)} data-testid={`button-edit-key-${key.id}`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {(user?.level === 1 || user?.level === 2) && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setExtendKey(key); setExtendDuration(""); }} data-testid={`button-extend-key-${key.id}`}>
                                <Clock className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resetDeviceMutation.mutate(key.id)} data-testid={`button-reset-key-${key.id}`}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(key.id)} data-testid={`button-delete-key-${key.id}`}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editKey} onOpenChange={() => setEditKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">Edit Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(user?.level === 1 || user?.level === 2) && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Game</Label>
                  <Input value={editForm.game || ""} onChange={e => setEditForm({...editForm, game: e.target.value})} className="h-9 bg-muted border-border" data-testid="input-edit-game" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Key</Label>
                  <Input value={editForm.userKey || ""} onChange={e => setEditForm({...editForm, userKey: e.target.value})} className="h-9 bg-muted border-border font-mono" data-testid="input-edit-key" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration (hours)</Label>
                    <Input type="number" value={editForm.duration || ""} onChange={e => setEditForm({...editForm, duration: parseInt(e.target.value)})} className="h-9 bg-muted border-border" data-testid="input-edit-duration" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max Devices</Label>
                    <Input type="number" value={editForm.maxDevices || ""} onChange={e => setEditForm({...editForm, maxDevices: parseInt(e.target.value)})} className="h-9 bg-muted border-border" data-testid="input-edit-max-devices" />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={String(editForm.status)} onValueChange={v => setEditForm({...editForm, status: parseInt(v)})}>
                <SelectTrigger data-testid="select-edit-status" className="h-9 bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditKey(null)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => updateMutation.mutate({ id: editKey.id, data: editForm })}
              disabled={updateMutation.isPending}
              className="text-xs uppercase tracking-wider"
              data-testid="button-save-edit"
            >
              {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendKey} onOpenChange={() => setExtendKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">Extend Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-muted border border-border text-xs space-y-1">
              <div><span className="text-muted-foreground uppercase tracking-wider">Key: </span><code className="font-mono">{extendKey?.userKey}</code></div>
              <div><span className="text-muted-foreground uppercase tracking-wider">Current: </span>{extendKey ? formatDuration(extendKey.duration) : ""}</div>
              <div><span className="text-muted-foreground uppercase tracking-wider">Expiry: </span>{extendKey ? formatDate(extendKey.expiredDate) : ""}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Extension Duration</Label>
              <Input
                value={extendDuration}
                onChange={e => setExtendDuration(e.target.value.toUpperCase())}
                placeholder="e.g. 30D, 12H, 7D"
                className="h-9 bg-muted border-border font-mono"
                data-testid="input-extend-duration"
              />
              <p className="text-[10px] text-muted-foreground">Format: number + D (days) or H (hours). Example: 30D = 30 days, 12H = 12 hours</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExtendKey(null)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => extendMutation.mutate({ id: extendKey.id, duration: extendDuration })}
              disabled={extendMutation.isPending || !extendDuration}
              className="text-xs uppercase tracking-wider"
              data-testid="button-extend-save"
            >
              {extendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
