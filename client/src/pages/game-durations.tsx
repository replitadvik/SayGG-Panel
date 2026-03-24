import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { formatCurrency } from "@/lib/currency";
import type { Game, GameDuration } from "@shared/schema";

export default function GameDurationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const gameId = parseInt(params.id || "0");
  const [showAdd, setShowAdd] = useState(false);
  const [editDur, setEditDur] = useState<GameDuration | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<GameDuration | null>(null);
  const [form, setForm] = useState({ durationHours: "", label: "", price: "" });

  const { data: game } = useQuery<Game>({
    queryKey: ["/api/games", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Game not found");
      return res.json();
    },
    enabled: !!gameId,
  });

  const { data: durations = [], isLoading } = useQuery<GameDuration[]>({
    queryKey: ["/api/games", gameId, "durations"],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/durations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load durations");
      return res.json();
    },
    enabled: !!gameId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/durations`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "durations"] });
      setShowAdd(false);
      resetForm();
      toast({ title: "Duration added" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/games/${gameId}/durations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "durations"] });
      setEditDur(null);
      resetForm();
      toast({ title: "Duration updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/games/${gameId}/durations/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "durations"] });
      setDeleteConfirm(null);
      toast({ title: "Duration deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setDeleteConfirm(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: number }) => {
      const res = await apiRequest("PATCH", `/api/games/${gameId}/durations/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "durations"] });
    },
  });

  const resetForm = () => setForm({ durationHours: "", label: "", price: "" });

  const openEdit = (d: GameDuration) => {
    setForm({ durationHours: String(d.durationHours), label: d.label, price: String(d.price) });
    setEditDur(d);
  };

  if (user?.level !== 1) {
    return <div className="text-center text-muted-foreground py-12">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/games">
          <Button variant="ghost" size="icon" data-testid="button-back-games">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" data-testid="text-durations-title">
            {game?.displayName || "Game"} — Durations
          </h1>
          <p className="text-sm text-muted-foreground">Manage pricing durations for this game</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} data-testid="button-add-duration">
          <Plus className="h-4 w-4 mr-2" />
          Add Duration
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : durations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No durations configured for this game</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {durations.map((d) => (
                  <TableRow key={d.id} data-testid={`row-duration-${d.id}`}>
                    <TableCell className="font-medium">{d.label}</TableCell>
                    <TableCell>{d.durationHours}h</TableCell>
                    <TableCell>{formatCurrency(d.price)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={d.isActive === 1}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: d.id, isActive: checked ? 1 : 0 })}
                        data-testid={`switch-duration-active-${d.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)} data-testid={`button-edit-duration-${d.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(d)} data-testid={`button-delete-duration-${d.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Duration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. 1 Day" data-testid="input-duration-label" />
            </div>
            <div className="space-y-2">
              <Label>Duration (hours)</Label>
              <Input type="number" min="1" value={form.durationHours} onChange={(e) => setForm(f => ({ ...f, durationHours: e.target.value }))} placeholder="e.g. 24" data-testid="input-duration-hours" />
            </div>
            <div className="space-y-2">
              <Label>Price per device</Label>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 100" data-testid="input-duration-price" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ durationHours: parseInt(form.durationHours), label: form.label, price: parseInt(form.price), gameId })}
              disabled={createMutation.isPending || !form.label || !form.durationHours || !form.price}
              data-testid="button-save-duration"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDur} onOpenChange={() => setEditDur(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Duration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} data-testid="input-edit-duration-label" />
            </div>
            <div className="space-y-2">
              <Label>Duration (hours)</Label>
              <Input type="number" min="1" value={form.durationHours} onChange={(e) => setForm(f => ({ ...f, durationHours: e.target.value }))} data-testid="input-edit-duration-hours" />
            </div>
            <div className="space-y-2">
              <Label>Price per device</Label>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} data-testid="input-edit-duration-price" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDur(null)}>Cancel</Button>
            <Button
              onClick={() => editDur && updateMutation.mutate({ id: editDur.id, data: { durationHours: parseInt(form.durationHours), label: form.label, price: parseInt(form.price) } })}
              disabled={updateMutation.isPending}
              data-testid="button-update-duration"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Duration</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteConfirm?.label}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-duration">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
