import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Copy, Link2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function ReferralsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ level: "3", setSaldo: "0", accExpiration: "", maxKeyEdits: "3", maxDevicesLimit: "1000", maxKeyExtends: "5", maxKeyResets: "3" });

  const { data: referrals = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/referrals"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/referrals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      setShowCreate(false);
      setCreateForm({ level: "3", setSaldo: "0", accExpiration: "", maxKeyEdits: "3", maxDevicesLimit: "1000", maxKeyExtends: "5", maxKeyResets: "3" });
      toast({ title: "Referral code created" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      level: parseInt(createForm.level),
      setSaldo: parseInt(createForm.setSaldo) || 0,
      accExpiration: createForm.accExpiration || undefined,
      maxKeyEdits: parseInt(createForm.maxKeyEdits) || 3,
      maxDevicesLimit: parseInt(createForm.maxDevicesLimit) || 1000,
      maxKeyExtends: parseInt(createForm.maxKeyExtends) || 5,
      maxKeyResets: parseInt(createForm.maxKeyResets) || 3,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-panel-header px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-panel-header-foreground/70" />
          <h1 className="text-sm font-semibold text-panel-header-foreground" data-testid="text-referrals-title">Referral Codes</h1>
          <span className="text-xs text-panel-header-foreground/50" data-testid="text-referrals-scope">
            {user?.level === 1 ? "All referral history" : "Your referral history"}
          </span>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="h-8 rounded text-xs bg-panel-header-foreground/10 hover:bg-panel-header-foreground/20 text-panel-header-foreground border-0" data-testid="button-create-referral">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Create
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-16">
          <Link2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No referral codes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {referrals.map(ref => (
            <div key={ref.id} className="rounded-lg border border-border/60 bg-card p-4 shadow-sm" data-testid={`row-referral-${ref.id}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted/60 px-2.5 py-1 rounded font-mono">{ref.code}</code>
                  <button onClick={() => handleCopy(ref.code)} className="text-muted-foreground hover:text-primary" data-testid={`button-copy-referral-${ref.id}`}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {ref.usedBy ? (
                  <Badge variant="secondary" className="rounded text-[10px]">Used</Badge>
                ) : (
                  <Badge variant="default" className="rounded text-[10px]">Available</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="text-muted-foreground">Level: <span className="text-foreground">{ref.level === 1 ? "Owner" : ref.level === 2 ? "Admin" : "Reseller"}</span></div>
                <div className="text-muted-foreground">Balance: <span className="text-foreground font-mono">{formatCurrency(ref.setSaldo || 0)}</span></div>
                <div className="text-muted-foreground">Created: <span className="text-foreground">{ref.createdBy || "\u2014"}</span></div>
                <div className="text-muted-foreground">Used by: <span className="text-foreground">{ref.usedBy || "\u2014"}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Create Referral
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Level</Label>
              <Select value={createForm.level} onValueChange={v => setCreateForm({ ...createForm, level: v })}>
                <SelectTrigger data-testid="select-ref-level" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {user?.level === 1 && <SelectItem value="1">Owner</SelectItem>}
                  <SelectItem value="2">Admin</SelectItem>
                  <SelectItem value="3">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Starting Balance</Label>
              <Input type="number" min="0" value={createForm.setSaldo} onChange={e => setCreateForm({ ...createForm, setSaldo: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-ref-saldo" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Expiration Date (optional)</Label>
              <Input type="date" value={createForm.accExpiration} onChange={e => setCreateForm({ ...createForm, accExpiration: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-ref-expiration" />
            </div>
            <div className="space-y-3 pt-2 border-t border-border/40">
              <p className="text-xs font-medium text-muted-foreground">Key Management Restrictions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Key Edits</Label>
                  <Input type="number" min="1" value={createForm.maxKeyEdits} onChange={e => setCreateForm({ ...createForm, maxKeyEdits: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-ref-max-key-edits" />
                  <p className="text-[10px] text-muted-foreground">Edit limit per key for this account</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Devices Limit</Label>
                  <Input type="number" min="1" value={createForm.maxDevicesLimit} onChange={e => setCreateForm({ ...createForm, maxDevicesLimit: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-ref-max-devices-limit" />
                  <p className="text-[10px] text-muted-foreground">Max devices this account can set per key</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Key Extends</Label>
                  <Input type="number" min="1" value={createForm.maxKeyExtends} onChange={e => setCreateForm({ ...createForm, maxKeyExtends: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-ref-max-key-extends" />
                  <p className="text-[10px] text-muted-foreground">Max extend actions per key for this account</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Key Resets</Label>
                  <Input type="number" min="1" value={createForm.maxKeyResets} onChange={e => setCreateForm({ ...createForm, maxKeyResets: e.target.value })} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-ref-max-key-resets" />
                  <p className="text-[10px] text-muted-foreground">Max device resets per key for this account</p>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)} className="rounded h-10">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded h-10" data-testid="button-submit-referral">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
