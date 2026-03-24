import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Gamepad2, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@shared/schema";

export default function GamesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Game | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", displayName: "", description: "" });

  const { data: games = [], isLoading } = useQuery<Game[]>({
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
    return <div className="text-center text-muted-foreground py-12">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-games-title">Games</h1>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} data-testid="button-add-game">
          <Plus className="h-4 w-4 mr-2" />
          Add Game
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : games.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No games configured</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Durations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((g) => (
                  <TableRow key={g.id} data-testid={`row-game-${g.id}`}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{g.slug}</code></TableCell>
                    <TableCell>{g.displayName}</TableCell>
                    <TableCell>
                      <Switch
                        checked={g.isActive === 1}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: g.id, isActive: checked ? 1 : 0 })}
                        data-testid={`switch-game-active-${g.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/games/${g.id}/durations`}>
                        <Button variant="outline" size="sm" data-testid={`button-durations-${g.id}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          Durations
                        </Button>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(g)} data-testid={`button-edit-game-${g.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(g)} data-testid={`button-delete-game-${g.id}`}>
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
          <DialogHeader><DialogTitle>Add Game</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. PUBG" data-testid="input-game-name" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. pubg" data-testid="input-game-slug" />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. PUBG Mobile" data-testid="input-game-display" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} data-testid="input-game-desc" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name || !form.slug || !form.displayName} data-testid="button-save-game">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editGame} onOpenChange={() => setEditGame(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Game</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-edit-game-name" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} data-testid="input-edit-game-slug" />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))} data-testid="input-edit-game-display" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} data-testid="input-edit-game-desc" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGame(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-update-game">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Game</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.
            Games with existing keys cannot be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
