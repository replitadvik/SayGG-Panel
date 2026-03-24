import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function BalancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data: userList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const topupMutation = useMutation({
    mutationFn: async (data: { userId: number; amount: number; note: string }) => {
      const res = await apiRequest("POST", "/api/users/balance", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setAmount("");
      setNote("");
      setSelectedUser("");
      toast({ title: "Success", description: data.message });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || parseInt(amount) <= 0) {
      toast({ title: "Error", description: "Select a user and enter a valid amount.", variant: "destructive" });
      return;
    }
    topupMutation.mutate({ userId: parseInt(selectedUser), amount: parseInt(amount), note });
  };

  const activeUsers = userList.filter(u => u.status === 1);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-balance-title">Balance Topup</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add balance to user accounts</p>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <Wallet className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Your Balance</p>
          <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(user?.saldo ?? 0)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Add Balance</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger data-testid="select-topup-user" className="h-11 rounded bg-muted/50 border-border/60"><SelectValue placeholder="Choose a user" /></SelectTrigger>
                  <SelectContent>
                    {activeUsers.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.username} ({u.levelName}) — {formatCurrency(u.saldo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11 rounded bg-muted/50 border-border/60"
                  data-testid="input-topup-amount"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Note (optional)</Label>
                <Input
                  placeholder="Reason for topup"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-11 rounded bg-muted/50 border-border/60"
                  data-testid="input-topup-note"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded text-sm font-semibold"
                disabled={topupMutation.isPending}
                data-testid="button-topup"
              >
                {topupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Balance
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
