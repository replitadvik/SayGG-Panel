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
import { Loader2, Search, Trash2, Edit, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

function getStatusBadge(status: number) {
  switch (status) {
    case 0: return <Badge variant="secondary" data-testid="badge-pending">Pending</Badge>;
    case 1: return <Badge variant="default" data-testid="badge-active">Active</Badge>;
    case 2: return <Badge variant="destructive" data-testid="badge-declined">Declined</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
}

function formatDate(d: string | null) {
  if (!d) return "—";
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
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/users/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User approved" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/users/${id}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User declined" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const resetDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/users/${id}/reset-device`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Device reset" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditUser(null);
      toast({ title: "User updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
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
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" data-testid="text-users-title">Users</h1>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-users"
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
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(u => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.fullname || "—"}</TableCell>
                        <TableCell className="text-sm">{u.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.levelName}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(u.saldo)}</TableCell>
                        <TableCell>{getStatusBadge(u.status)}</TableCell>
                        <TableCell className="text-xs">{formatDate(u.expirationDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {u.status === 0 && (user?.level ?? 3) <= 2 && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => approveMutation.mutate(u.id)} data-testid={`button-approve-${u.id}`}>
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => declineMutation.mutate(u.id)} data-testid={`button-decline-${u.id}`}>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            {(user?.level ?? 3) <= 2 && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => resetDeviceMutation.mutate(u.id)} data-testid={`button-reset-device-${u.id}`}>
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {user?.level === 1 && u.id !== user.id && (
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(u.id)} data-testid={`button-delete-user-${u.id}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
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

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {editUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={editForm.fullname || ""} onChange={e => setEditForm({ ...editForm, fullname: e.target.value })} data-testid="input-edit-fullname" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Level</Label>
                <Select value={String(editForm.level)} onValueChange={v => setEditForm({ ...editForm, level: parseInt(v) })}>
                  <SelectTrigger data-testid="select-edit-level"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {user?.level === 1 && <SelectItem value="1">Owner</SelectItem>}
                    <SelectItem value="2">Admin</SelectItem>
                    <SelectItem value="3">Reseller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={String(editForm.status)} onValueChange={v => setEditForm({ ...editForm, status: parseInt(v) })}>
                  <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pending</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="2">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Balance</Label>
                <Input type="number" value={editForm.saldo ?? ""} onChange={e => setEditForm({ ...editForm, saldo: parseInt(e.target.value) || 0 })} data-testid="input-edit-saldo" />
              </div>
              <div className="space-y-1">
                <Label>Expiration</Label>
                <Input type="date" value={editForm.expirationDate || ""} onChange={e => setEditForm({ ...editForm, expirationDate: e.target.value })} data-testid="input-edit-expiration" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({
                id: editUser.id,
                data: {
                  ...editForm,
                  expirationDate: editForm.expirationDate || null,
                },
              })}
              disabled={updateMutation.isPending}
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
