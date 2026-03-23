import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Loader2, Plus, Trash2, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

function getDurationLabel(hours: number) {
  if (hours === 1) return "1 Hour Trial";
  if (hours === 2) return "2 Hours Trial";
  if (hours < 24) return `${hours} Hours`;
  if (hours === 24) return "1 Day";
  if (hours === 168) return "1 Week";
  if (hours === 720) return "1 Month";
  if (hours === 1440) return "2 Months";
  if (hours % 720 === 0) return `${hours / 720} Month(s)`;
  if (hours % 24 === 0) return `${hours / 24} Day(s)`;
  return `${hours} Hours`;
}

export default function PricesPage() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newDuration, setNewDuration] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const { data: prices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/prices/all"],
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: { duration: number; price: number }) => {
      await apiRequest("POST", "/api/prices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prices/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
      setShowAdd(false);
      setNewDuration("");
      setNewPrice("");
      toast({ title: "Price saved" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (duration: number) => {
      await apiRequest("DELETE", `/api/prices/${duration}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prices/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
      toast({ title: "Price removed" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const dur = parseInt(newDuration);
    const pr = parseInt(newPrice);
    if (!dur || dur <= 0 || !pr || pr <= 0) {
      toast({ title: "Error", description: "Enter valid duration and price.", variant: "destructive" });
      return;
    }
    upsertMutation.mutate({ duration: dur, price: pr });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-prices-title">Price Configuration</h1>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-price">
          <Plus className="h-4 w-4 mr-2" />
          Add Price
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
                    <TableHead>Duration (hours)</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Price per Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No prices configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    prices.map(p => (
                      <TableRow key={p.duration} data-testid={`row-price-${p.duration}`}>
                        <TableCell className="font-medium">{p.duration}h</TableCell>
                        <TableCell>{getDurationLabel(p.duration)}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">{formatCurrency(p.price)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.isActive === 1 ? "default" : "secondary"}>
                            {p.isActive === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(p.duration)}
                            data-testid={`button-delete-price-${p.duration}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Add / Update Price
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1">
              <Label>Duration (in hours)</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 24 for 1 day, 720 for 1 month"
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
                data-testid="input-new-duration"
              />
              <p className="text-xs text-muted-foreground">
                Common: 1h, 2h, 24h (1d), 168h (1w), 720h (1m)
              </p>
            </div>
            <div className="space-y-1">
              <Label>Price per Device</Label>
              <Input
                type="number"
                min="1"
                placeholder="Price amount"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                data-testid="input-new-price"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={upsertMutation.isPending} data-testid="button-save-price">
                {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
