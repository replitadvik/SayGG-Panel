import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <h1 className="text-2xl font-bold" data-testid="text-keys-title">Keys</h1>
        {selectedKeys.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkDeleteMutation.mutate(selectedKeys)}
            disabled={bulkDeleteMutation.isPending}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedKeys.length})
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search keys..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-keys"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedKeys.length === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Game</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registrator</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No keys found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(key => (
                      <TableRow key={key.id} data-testid={`row-key-${key.id}`}>
                        <TableCell>
                          <Checkbox
                            checked={selectedKeys.includes(key.id)}
                            onCheckedChange={() => toggleSelect(key.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{key.game}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{key.userKey}</code>
                            <button onClick={() => handleCopy(key.userKey)} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>{formatDuration(key.duration)}</TableCell>
                        <TableCell>{countDevices(key.devices)}/{key.maxDevices}</TableCell>
                        <TableCell className="text-xs">{formatDate(key.expiredDate)}</TableCell>
                        <TableCell>
                          <Badge variant={key.status === 1 ? "default" : "destructive"}>
                            {key.status === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{key.registrator}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(key)} data-testid={`button-edit-key-${key.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {(user?.level === 1 || user?.level === 2) && (
                              <Button variant="ghost" size="icon" onClick={() => { setExtendKey(key); setExtendDuration(""); }} data-testid={`button-extend-key-${key.id}`}>
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => resetDeviceMutation.mutate(key.id)} data-testid={`button-reset-key-${key.id}`}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(key.id)} data-testid={`button-delete-key-${key.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
            <DialogTitle>Edit Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(user?.level === 1 || user?.level === 2) && (
              <>
                <div className="space-y-1">
                  <Label>Game</Label>
                  <Input value={editForm.game || ""} onChange={e => setEditForm({...editForm, game: e.target.value})} data-testid="input-edit-game" />
                </div>
                <div className="space-y-1">
                  <Label>Key</Label>
                  <Input value={editForm.userKey || ""} onChange={e => setEditForm({...editForm, userKey: e.target.value})} data-testid="input-edit-key" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Duration (hours)</Label>
                    <Input type="number" value={editForm.duration || ""} onChange={e => setEditForm({...editForm, duration: parseInt(e.target.value)})} data-testid="input-edit-duration" />
                  </div>
                  <div className="space-y-1">
                    <Label>Max Devices</Label>
                    <Input type="number" value={editForm.maxDevices || ""} onChange={e => setEditForm({...editForm, maxDevices: parseInt(e.target.value)})} data-testid="input-edit-max-devices" />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={String(editForm.status)} onValueChange={v => setEditForm({...editForm, status: parseInt(v)})}>
                <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKey(null)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editKey.id, data: editForm })}
              disabled={updateMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendKey} onOpenChange={() => setExtendKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-md text-sm space-y-1">
              <div><span className="text-muted-foreground">Key: </span><code>{extendKey?.userKey}</code></div>
              <div><span className="text-muted-foreground">Current Duration: </span>{extendKey ? formatDuration(extendKey.duration) : ""}</div>
              <div><span className="text-muted-foreground">Expiry: </span>{extendKey ? formatDate(extendKey.expiredDate) : ""}</div>
            </div>
            <div className="space-y-1">
              <Label>Extension Duration</Label>
              <Input
                value={extendDuration}
                onChange={e => setExtendDuration(e.target.value.toUpperCase())}
                placeholder="e.g. 30D, 12H, 7D"
                data-testid="input-extend-duration"
              />
              <p className="text-xs text-muted-foreground">Format: number + D (days) or H (hours). Example: 30D = 30 days, 12H = 12 hours</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendKey(null)}>Cancel</Button>
            <Button
              onClick={() => extendMutation.mutate({ id: extendKey.id, duration: extendDuration })}
              disabled={extendMutation.isPending || !extendDuration}
              data-testid="button-extend-save"
            >
              {extendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
