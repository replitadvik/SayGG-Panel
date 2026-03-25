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
import { Loader2, Search, Trash2, Edit, CheckCircle, XCircle, RotateCcw, Users } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

function getStatusBadge(status: number) {
  switch (status) {
    case 0: return <Badge variant="secondary" className="rounded text-[10px]" data-testid="badge-pending">Pending</Badge>;
    case 1: return <Badge variant="default" className="rounded text-[10px]" data-testid="badge-active">Active</Badge>;
    case 2: return <Badge variant="destructive" className="rounded text-[10px]" data-testid="badge-declined">Declined</Badge>;
    default: return <Badge variant="outline" className="rounded text-[10px]">Unknown</Badge>;
  }
}

function formatDate(d: string | null) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "2-digit",
  });
}

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: userList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/users/${id}/approve`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User approved" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/users/${id}/decline`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User declined" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/users/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User deleted" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const resetDeviceMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/users/${id}/reset-device`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "Device reset" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { await apiRequest("PATCH", `/api/users/${id}`, data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setEditUser(null); toast({ title: "User updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const filtered = userList.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullname?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u: any) => {
    setEditUser(u);
    setEditForm({
      fullname: u.fullname || "",
      level: u.level,
      status: u.status,
      saldo: u.saldo,
      expirationDate: u.expirationDate ? new Date(u.expirationDate).toISOString().split("T")[0] : "",
      maxKeyEdits: u.maxKeyEdits ?? 3,
      maxDevicesLimit: u.maxDevicesLimit ?? 1000,
      maxKeyExtends: u.maxKeyExtends ?? 5,
      maxKeyResets: u.maxKeyResets ?? 3,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-panel-header px-5 py-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-panel-header-foreground/70" />
        <h1 className="text-sm font-semibold text-panel-header-foreground" data-testid="text-users-title">Users</h1>
        <span className="text-xs text-panel-header-foreground/50" data-testid="text-users-count">{filtered.length} users</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 rounded bg-muted/50 border-border/60"
          data-testid="input-search-users"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id} className="rounded-lg border border-border/60 bg-card p-4 shadow-sm" data-testid={`row-user-${u.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{u.username}</span>
                      <Badge variant="outline" className="rounded text-[10px] flex-shrink-0">{u.levelName}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.fullname || u.email || "\u2014"}</p>
                  </div>
                </div>
                {getStatusBadge(u.status)}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                <div className="text-muted-foreground">Balance: <span className="text-foreground font-mono font-medium">{formatCurrency(u.saldo)}</span></div>
                <div className="text-muted-foreground">Expiry: <span className="text-foreground">{formatDate(u.expirationDate)}</span></div>
              </div>

              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40">
                {u.status === 0 && (user?.level ?? 3) <= 2 && (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 rounded gap-1 text-xs text-emerald-500" onClick={() => approveMutation.mutate(u.id)} data-testid={`button-approve-${u.id}`}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 rounded gap-1 text-xs text-red-500" onClick={() => declineMutation.mutate(u.id)} data-testid={`button-decline-${u.id}`}>
                      <XCircle className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </>
                )}
                {(user?.level ?? 3) <= 2 && (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded" onClick={() => resetDeviceMutation.mutate(u.id)} data-testid={`button-reset-device-${u.id}`}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                {user?.level === 1 && u.id !== user.id && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded text-destructive" onClick={() => deleteMutation.mutate(u.id)} data-testid={`button-delete-user-${u.id}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit User: {editUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Full Name</Label>
              <Input value={editForm.fullname || ""} onChange={e => setEditForm({ ...editForm, fullname: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-fullname" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Level</Label>
                <Select value={String(editForm.level)} onValueChange={v => setEditForm({ ...editForm, level: parseInt(v) })}>
                  <SelectTrigger data-testid="select-edit-level" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {user?.level === 1 && <SelectItem value="1">Owner</SelectItem>}
                    <SelectItem value="2">Admin</SelectItem>
                    <SelectItem value="3">Reseller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={String(editForm.status)} onValueChange={v => setEditForm({ ...editForm, status: parseInt(v) })}>
                  <SelectTrigger data-testid="select-edit-status" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pending</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="2">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Balance</Label>
                <Input type="number" value={editForm.saldo ?? ""} onChange={e => setEditForm({ ...editForm, saldo: parseInt(e.target.value) || 0 })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-saldo" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Expiration</Label>
                <Input type="date" value={editForm.expirationDate || ""} onChange={e => setEditForm({ ...editForm, expirationDate: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-expiration" />
              </div>
            </div>
            {user?.level === 1 && editUser?.level !== 1 && (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <p className="text-xs font-medium text-muted-foreground">Key Management Restrictions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Key Edits</Label>
                    <Input type="number" min="1" value={editForm.maxKeyEdits ?? 3} onChange={e => setEditForm({ ...editForm, maxKeyEdits: parseInt(e.target.value) || 3 })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-max-key-edits" />
                    <p className="text-[10px] text-muted-foreground">Max edits per key for this user</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Devices Limit</Label>
                    <Input type="number" min="1" value={editForm.maxDevicesLimit ?? 1000} onChange={e => setEditForm({ ...editForm, maxDevicesLimit: parseInt(e.target.value) || 1000 })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-max-devices-limit" />
                    <p className="text-[10px] text-muted-foreground">Max devices this user can set per key</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Key Extends</Label>
                    <Input type="number" min="1" value={editForm.maxKeyExtends ?? 5} onChange={e => setEditForm({ ...editForm, maxKeyExtends: parseInt(e.target.value) || 5 })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-max-key-extends" />
                    <p className="text-[10px] text-muted-foreground">Max extend actions per key for this user</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Key Resets</Label>
                    <Input type="number" min="1" value={editForm.maxKeyResets ?? 3} onChange={e => setEditForm({ ...editForm, maxKeyResets: parseInt(e.target.value) || 3 })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-max-key-resets" />
                    <p className="text-[10px] text-muted-foreground">Max device resets per key for this user</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditUser(null)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editUser.id, data: { ...editForm, expirationDate: editForm.expirationDate || null } })}
              disabled={updateMutation.isPending}
              className="rounded h-10"
              data-testid="button-save-user"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
