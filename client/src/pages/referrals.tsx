import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
  const [createForm, setCreateForm] = useState({
    level: "3",
    setSaldo: "0",
    accExpiration: "",
  });

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
      setCreateForm({ level: "3", setSaldo: "0", accExpiration: "" });
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
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-referrals-title">Referral Codes</h1>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-referral">
          <Plus className="h-4 w-4 mr-2" />
          Create Code
        </Button>
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
                    <TableHead>Code</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Start Balance</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No referral codes
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map(ref => (
                      <TableRow key={ref.id} data-testid={`row-referral-${ref.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{ref.code}</code>
                            <button onClick={() => handleCopy(ref.code)} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ref.level === 1 ? "Owner" : ref.level === 2 ? "Admin" : "Reseller"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(ref.setSaldo || 0)}</TableCell>
                        <TableCell className="text-xs">{ref.accExpiration || "30 days"}</TableCell>
                        <TableCell className="text-sm">{ref.createdBy || "—"}</TableCell>
                        <TableCell className="text-sm">{ref.usedBy || "—"}</TableCell>
                        <TableCell>
                          {ref.usedBy ? (
                            <Badge variant="secondary">Used</Badge>
                          ) : (
                            <Badge variant="default">Available</Badge>
                          )}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Create Referral Code
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>Account Level</Label>
              <Select value={createForm.level} onValueChange={v => setCreateForm({ ...createForm, level: v })}>
                <SelectTrigger data-testid="select-ref-level"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {user?.level === 1 && <SelectItem value="1">Owner</SelectItem>}
                  <SelectItem value="2">Admin</SelectItem>
                  <SelectItem value="3">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Starting Balance</Label>
              <Input
                type="number"
                min="0"
                value={createForm.setSaldo}
                onChange={e => setCreateForm({ ...createForm, setSaldo: e.target.value })}
                data-testid="input-ref-saldo"
              />
            </div>
            <div className="space-y-1">
              <Label>Account Expiration Date (optional)</Label>
              <Input
                type="date"
                value={createForm.accExpiration}
                onChange={e => setCreateForm({ ...createForm, accExpiration: e.target.value })}
                data-testid="input-ref-expiration"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-referral">
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
