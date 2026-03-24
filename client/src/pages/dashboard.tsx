import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Users, AlertTriangle, Wallet, Clock, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-bold tracking-tight uppercase" data-testid="text-dashboard-title">Dashboard</h1>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Total Keys", value: stats?.totalKeys ?? 0, icon: Key, accent: "text-primary" },
    { title: "Active Keys", value: stats?.activeKeys ?? 0, icon: Shield, accent: "text-emerald-400" },
    { title: "Expired Keys", value: stats?.expiredKeys ?? 0, icon: Clock, accent: "text-red-400" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, accent: "text-violet-400" },
    { title: "Pending Approval", value: stats?.pendingUsers ?? 0, icon: AlertTriangle, accent: "text-amber-400" },
    { title: "Your Balance", value: formatCurrency(stats?.saldo ?? 0), icon: Wallet, accent: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight uppercase" data-testid="text-dashboard-title">Dashboard</h1>
        <span className="text-xs text-muted-foreground px-3 py-1 bg-muted border border-border font-medium uppercase tracking-wider" data-testid="text-user-level">
          {stats?.levelName}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="border-border" data-testid={`card-${card.title.toLowerCase().replace(/\s/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.accent}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
