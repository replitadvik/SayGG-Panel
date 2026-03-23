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
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Total Keys", value: stats?.totalKeys ?? 0, icon: Key, color: "text-blue-500" },
    { title: "Active Keys", value: stats?.activeKeys ?? 0, icon: Shield, color: "text-green-500" },
    { title: "Expired Keys", value: stats?.expiredKeys ?? 0, icon: Clock, color: "text-red-500" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-purple-500" },
    { title: "Pending Approval", value: stats?.pendingUsers ?? 0, icon: AlertTriangle, color: "text-yellow-500" },
    { title: "Your Balance", value: formatCurrency(stats?.saldo ?? 0), icon: Wallet, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full" data-testid="text-user-level">
          {stats?.levelName}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} data-testid={`card-${card.title.toLowerCase().replace(/\s/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
