import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, Clock } from "lucide-react";
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
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  const resetForm = () => setForm({ durationHours: "", label: "", price: "" });

  const openEdit = (d: GameDuration) => {
    setForm({ durationHours: String(d.durationHours), label: d.label, price: String(d.price) });
    setEditDur(d);
  };

  if (user?.level !== 1) {
    return <div className="text-center text-muted-foreground py-12 text-sm">Access denied</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/games">
          <button className="h-9 w-9 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" data-testid="button-back-games">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5" data-testid="text-breadcrumb">
            <Link href="/games" className="hover:text-foreground transition-colors">Games</Link>
            <span>/</span>
            <span className="text-foreground truncate">{game?.displayName || "..."}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-panel-header px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-panel-header-foreground/70" />
          <h1 className="text-sm font-semibold text-panel-header-foreground" data-testid="text-durations-title">Durations & Pricing</h1>
          <span className="text-xs text-panel-header-foreground/50" data-testid="text-durations-count">{durations.length} configured</span>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} size="sm" className="h-8 rounded text-xs bg-panel-header-foreground/10 hover:bg-panel-header-foreground/20 text-panel-header-foreground border-0" data-testid="button-add-duration">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : durations.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No durations configured</p>
          <p className="text-xs text-muted-foreground mt-1">Add a duration to set pricing for key generation</p>
        </div>
      ) : (
        <div className="space-y-2">
          {durations.map((d) => (
            <div key={d.id} className="rounded-lg border border-border/60 bg-card p-4 shadow-sm" data-testid={`row-duration-${d.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm">{d.label}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{d.durationHours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary font-mono">{formatCurrency(d.price)}</span>
                  <Switch
                    checked={d.isActive === 1}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: d.id, isActive: checked ? 1 : 0 })}
                    data-testid={`switch-duration-active-${d.id}`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border/40">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded" onClick={() => openEdit(d)} data-testid={`button-edit-duration-${d.id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded text-destructive" onClick={() => setDeleteConfirm(d)} data-testid={`button-delete-duration-${d.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base font-semibold">Add Duration for {game?.displayName || "Game"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Label</Label>
              <Input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. 1 Day" className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-duration-label" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration (hours)</Label>
              <Input type="number" min="1" value={form.durationHours} onChange={(e) => setForm(f => ({ ...f, durationHours: e.target.value }))} placeholder="e.g. 24" className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-duration-hours" />
              <p className="text-xs text-muted-foreground">Common: 1h, 24h (1 day), 168h (1 week), 720h (1 month)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price per device</Label>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 100" className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-duration-price" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ durationHours: parseInt(form.durationHours), label: form.label, price: parseInt(form.price), gameId })}
              disabled={createMutation.isPending || !form.label || !form.durationHours || !form.price}
              className="rounded h-10"
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
          <DialogHeader><DialogTitle className="text-base font-semibold">Edit Duration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Label</Label>
              <Input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-duration-label" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration (hours)</Label>
              <Input type="number" min="1" value={form.durationHours} onChange={(e) => setForm(f => ({ ...f, durationHours: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-duration-hours" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price per device</Label>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-duration-price" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDur(null)} className="rounded h-10">Cancel</Button>
            <Button
              onClick={() => editDur && updateMutation.mutate({ id: editDur.id, data: { durationHours: parseInt(form.durationHours), label: form.label, price: parseInt(form.price) } })}
              disabled={updateMutation.isPending}
              className="rounded h-10"
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
          <DialogHeader><DialogTitle className="text-base font-semibold">Delete Duration</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteConfirm?.label}</strong> ({deleteConfirm?.durationHours}h, {formatCurrency(deleteConfirm?.price ?? 0)})? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded h-10">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="rounded h-10" data-testid="button-confirm-delete-duration">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
