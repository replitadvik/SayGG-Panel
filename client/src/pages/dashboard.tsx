import { useQuery } from "@tanstack/react-query";
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
        <div>
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-4 w-48 rounded mt-2" />
        </div>
        <div className="grid gap-3 grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Total Keys", value: stats?.totalKeys ?? 0, icon: Key, color: "bg-amber-500/10 text-amber-500 dark:text-amber-400" },
    { title: "Active Keys", value: stats?.activeKeys ?? 0, icon: Shield, color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" },
    { title: "Expired Keys", value: stats?.expiredKeys ?? 0, icon: Clock, color: "bg-red-500/10 text-red-500 dark:text-red-400" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-violet-500/10 text-violet-500 dark:text-violet-400" },
    { title: "Pending", value: stats?.pendingUsers ?? 0, icon: AlertTriangle, color: "bg-orange-500/10 text-orange-500 dark:text-orange-400" },
    { title: "Balance", value: formatCurrency(stats?.saldo ?? 0), icon: Wallet, color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your panel</p>
        </div>
        <span className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-primary/10 text-primary" data-testid="text-user-level">
          {stats?.levelName}
        </span>
      </div>

      <div className="grid gap-3 grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-border/60 bg-card p-4 shadow-sm"
            data-testid={`card-${card.title.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <div className={`w-8 h-8 rounded flex items-center justify-center ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight font-mono">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
