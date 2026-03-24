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
import { Loader2, Plus, Pencil, Trash2, Clock, ChevronRight, Gamepad2 } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@shared/schema";

type GameWithCount = Game & { durationCount: number };

export default function GamesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Game | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", displayName: "", description: "" });

  const { data: games = [], isLoading } = useQuery<GameWithCount[]>({
    queryKey: ["/api/games"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/games", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowAdd(false);
      resetForm();
      toast({ title: "Game created" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/games/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setEditGame(null);
      resetForm();
      toast({ title: "Game updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/games/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setDeleteConfirm(null);
      toast({ title: "Game deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setDeleteConfirm(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: number }) => {
      const res = await apiRequest("PATCH", `/api/games/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  const resetForm = () => setForm({ name: "", slug: "", displayName: "", description: "" });

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setForm(f => ({ ...f, name, slug, displayName: f.displayName || name }));
  };

  const openEdit = (g: Game) => {
    setForm({ name: g.name, slug: g.slug, displayName: g.displayName, description: g.description || "" });
    setEditGame(g);
  };

  const handleCreate = () => {
    createMutation.mutate(form);
  };

  const handleUpdate = () => {
    if (!editGame) return;
    updateMutation.mutate({ id: editGame.id, data: form });
  };

  if (user?.level !== 1) {
    return <div className="text-center text-muted-foreground py-12 text-sm">Access denied</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-panel-header px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-panel-header-foreground/70" />
          <h1 className="text-sm font-semibold text-panel-header-foreground" data-testid="text-games-title">Games</h1>
          <span className="text-xs text-panel-header-foreground/50" data-testid="text-games-count">{games.length} configured</span>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} size="sm" className="h-8 rounded text-xs bg-panel-header-foreground/10 hover:bg-panel-header-foreground/20 text-panel-header-foreground border-0" data-testid="button-add-game">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Game
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No games configured yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add a game to start managing durations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map((g) => (
            <div key={g.id} className="rounded-lg border border-border/60 bg-card p-4 shadow-sm" data-testid={`row-game-${g.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{g.displayName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{g.slug}</p>
                    {g.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={g.isActive === 1}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: g.id, isActive: checked ? 1 : 0 })}
                    data-testid={`switch-game-active-${g.id}`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40">
                <Link href={`/games/${g.id}/durations`}>
                  <Button variant="ghost" size="sm" className="h-8 rounded gap-1.5 text-xs" data-testid={`button-durations-${g.id}`}>
                    <Clock className="h-3.5 w-3.5" />
                    {g.durationCount} {g.durationCount === 1 ? "duration" : "durations"}
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded" onClick={() => openEdit(g)} data-testid={`button-edit-game-${g.id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded text-destructive" onClick={() => setDeleteConfirm(g)} data-testid={`button-delete-game-${g.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base font-semibold">Add Game</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. PUBG" className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-game-name" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. pubg" className="h-11 rounded bg-muted/50 border-border/60 font-mono" data-testid="input-game-slug" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Display Name</Label>
              <Input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. PUBG Mobile" className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-game-display" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description (optional)</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-game-desc" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded h-10">Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name || !form.slug || !form.displayName} className="rounded h-10" data-testid="button-save-game">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editGame} onOpenChange={() => setEditGame(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base font-semibold">Edit Game</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-game-name" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60 font-mono" data-testid="input-edit-game-slug" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Display Name</Label>
              <Input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-game-display" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-edit-game-desc" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditGame(null)} className="rounded h-10">Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="rounded h-10" data-testid="button-update-game">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base font-semibold">Delete Game</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteConfirm?.displayName}</strong>? This cannot be undone. Games with existing keys cannot be deleted.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded h-10">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} className="rounded h-10" data-testid="button-confirm-delete">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
