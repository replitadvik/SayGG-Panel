import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useSiteName } from "@/hooks/use-site-name";
import { Link } from "wouter";
import {
  Key, Users, Shield, Wallet, Clock, Gamepad2, Link2,
  AlertTriangle, Ban, UserCheck, UserPlus, Settings,
  ArrowRight, Plus, Eye, Timer,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";

function useSessionCountdown(expiresAt: number | null) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }

    function compute() {
      const diff = expiresAt! - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setRemaining(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    }

    compute();
    const interval = setInterval(compute, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}

function StatCard({ title, value, icon: Icon, color, testId }: {
  title: string; value: string | number; icon: any; color: string; testId: string;
}) {
  return (
    <div className="rounded border border-border/60 bg-card p-4" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-lg font-bold tracking-tight font-mono mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, testId }: {
  href: string; icon: any; label: string; testId: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded border border-border/60 bg-card active:bg-muted/60"
      data-testid={testId}
    >
      <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium flex-1">{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon, testId }: {
  label: string; value: string | number; icon?: any; testId: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1" data-testid={testId}>
      {Icon && (
        <div className="w-7 h-7 rounded flex items-center justify-center bg-muted/60 flex-shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { siteName } = useSiteName();
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const sessionRemaining = useSessionCountdown(stats?.sessionExpiresAt);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  const level = stats?.level ?? user?.level ?? 3;
  const levelName = stats?.levelName ?? "User";
  const username = stats?.username ?? user?.username ?? "";
  const displayName = stats?.fullname || username;

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-panel-header p-5 border border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-panel-header-foreground/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-panel-header-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-panel-header-foreground truncate" data-testid="text-welcome">
              Welcome, {displayName}
            </h1>
            <p className="text-xs text-panel-header-foreground/50 mt-0.5" data-testid="text-welcome-sub">
              {siteName || "Dashboard"}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-panel-header-foreground/10 text-panel-header-foreground border border-panel-header-foreground/10 flex-shrink-0" data-testid="text-role-badge">
            {levelName}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded bg-panel-header-foreground/5 px-3 py-2.5 border border-panel-header-foreground/10">
            <p className="text-[10px] uppercase tracking-wider text-panel-header-foreground/40">Balance</p>
            <p className="text-sm font-bold font-mono text-panel-header-foreground mt-0.5" data-testid="info-balance">
              {formatCurrency(stats?.saldo ?? 0)}
            </p>
          </div>
          <div className="rounded bg-panel-header-foreground/5 px-3 py-2.5 border border-panel-header-foreground/10">
            <p className="text-[10px] uppercase tracking-wider text-panel-header-foreground/40">Role</p>
            <p className="text-sm font-bold text-panel-header-foreground mt-0.5" data-testid="info-role">
              {levelName}
            </p>
          </div>
          {sessionRemaining && (
            <div className="rounded bg-panel-header-foreground/5 px-3 py-2.5 border border-panel-header-foreground/10">
              <p className="text-[10px] uppercase tracking-wider text-panel-header-foreground/40">Session</p>
              <p className="text-sm font-bold text-panel-header-foreground mt-0.5" data-testid="info-session">
                {sessionRemaining}
              </p>
            </div>
          )}
        </div>
      </div>

      {level === 1 && <OwnerStats stats={stats} />}
      {level === 2 && <AdminStats stats={stats} />}
      {level === 3 && <ResellerStats stats={stats} />}

      <div>
        <SectionTitle icon={ArrowRight} title="Quick Actions" />
        <div className="space-y-2">
          {level === 1 && (
            <>
              <QuickAction href="/keys/generate" icon={Plus} label="Generate Key" testId="action-generate-key" />
              <QuickAction href="/users" icon={Users} label="Manage Users" testId="action-manage-users" />
              <QuickAction href="/games" icon={Gamepad2} label="Manage Games" testId="action-manage-games" />
              <QuickAction href="/settings" icon={Settings} label="Settings" testId="action-settings" />
            </>
          )}
          {level === 2 && (
            <>
              <QuickAction href="/keys/generate" icon={Plus} label="Generate Key" testId="action-generate-key" />
              <QuickAction href="/referrals" icon={Link2} label="Create Referral" testId="action-referrals" />
              <QuickAction href="/users" icon={Users} label="Manage Users" testId="action-manage-users" />
              <QuickAction href="/keys" icon={Eye} label="View Keys" testId="action-view-keys" />
            </>
          )}
          {level === 3 && (
            <>
              <QuickAction href="/keys/generate" icon={Plus} label="Generate Key" testId="action-generate-key" />
              <QuickAction href="/keys" icon={Eye} label="View Keys" testId="action-view-keys" />
              <QuickAction href="/balance" icon={Wallet} label="View Balance" testId="action-view-balance" />
            </>
          )}
        </div>
      </div>

      {stats?.createdAt && (
        <p className="text-xs text-muted-foreground text-center pt-2" data-testid="info-member-since">
          Member since {new Date(stats.createdAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function OwnerStats({ stats }: { stats: any }) {
  return (
    <>
      <div>
        <SectionTitle icon={Key} title="Keys" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <StatCard title="Total Keys" value={stats?.totalKeys ?? 0} icon={Key} color="bg-amber-500/10 text-amber-500 dark:text-amber-400" testId="card-total-keys" />
          <StatCard title="Active" value={stats?.activeKeys ?? 0} icon={Shield} color="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" testId="card-active-keys" />
          <StatCard title="Expired" value={stats?.expiredKeys ?? 0} icon={Clock} color="bg-red-500/10 text-red-500 dark:text-red-400" testId="card-expired-keys" />
          <StatCard title="Blocked" value={stats?.blockedKeys ?? 0} icon={Ban} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-blocked-keys" />
        </div>
      </div>

      <div>
        <SectionTitle icon={Users} title="Users" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="bg-violet-500/10 text-violet-500 dark:text-violet-400" testId="card-total-users" />
          <StatCard title="Pending" value={stats?.pendingUsers ?? 0} icon={AlertTriangle} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-pending-users" />
          <StatCard title="Admins" value={stats?.totalAdmins ?? 0} icon={UserCheck} color="bg-blue-500/10 text-blue-500 dark:text-blue-400" testId="card-total-admins" />
          <StatCard title="Resellers" value={stats?.totalResellers ?? 0} icon={UserPlus} color="bg-cyan-500/10 text-cyan-500 dark:text-cyan-400" testId="card-total-resellers" />
        </div>
      </div>

      <div className="rounded border border-border/60 bg-card overflow-hidden">
        <div className="bg-panel-header px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-panel-header-foreground/70" />
            <h2 className="text-sm font-semibold text-panel-header-foreground">System</h2>
          </div>
        </div>
        <div className="px-4 py-1 divide-y divide-border/40">
          <DetailRow label="Games" value={stats?.totalGames ?? 0} icon={Gamepad2} testId="info-total-games" />
          <DetailRow label="Referrals" value={stats?.totalReferrals ?? 0} icon={Link2} testId="info-total-referrals" />
        </div>
      </div>
    </>
  );
}

function AdminStats({ stats }: { stats: any }) {
  return (
    <>
      <div>
        <SectionTitle icon={Key} title="Keys" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <StatCard title="Total Keys" value={stats?.totalKeys ?? 0} icon={Key} color="bg-amber-500/10 text-amber-500 dark:text-amber-400" testId="card-total-keys" />
          <StatCard title="Active" value={stats?.activeKeys ?? 0} icon={Shield} color="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" testId="card-active-keys" />
          <StatCard title="Expired" value={stats?.expiredKeys ?? 0} icon={Clock} color="bg-red-500/10 text-red-500 dark:text-red-400" testId="card-expired-keys" />
          <StatCard title="Blocked" value={stats?.blockedKeys ?? 0} icon={Ban} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-blocked-keys" />
        </div>
      </div>

      <div className="rounded border border-border/60 bg-card overflow-hidden">
        <div className="bg-panel-header px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-panel-header-foreground/70" />
            <h2 className="text-sm font-semibold text-panel-header-foreground">Scope Overview</h2>
          </div>
        </div>
        <div className="px-4 py-1 divide-y divide-border/40">
          <DetailRow label="Users Under You" value={stats?.totalUsers ?? 0} icon={Users} testId="info-total-users" />
          <DetailRow label="Pending Approvals" value={stats?.pendingUsers ?? 0} icon={AlertTriangle} testId="info-pending-users" />
          <DetailRow label="Referrals Created" value={stats?.totalReferrals ?? 0} icon={Link2} testId="info-total-referrals" />
        </div>
      </div>
    </>
  );
}

function ResellerStats({ stats }: { stats: any }) {
  return (
    <div>
      <SectionTitle icon={Key} title="Keys" />
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <StatCard title="Total Keys" value={stats?.totalKeys ?? 0} icon={Key} color="bg-amber-500/10 text-amber-500 dark:text-amber-400" testId="card-total-keys" />
        <StatCard title="Active" value={stats?.activeKeys ?? 0} icon={Shield} color="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" testId="card-active-keys" />
        <StatCard title="Expired" value={stats?.expiredKeys ?? 0} icon={Clock} color="bg-red-500/10 text-red-500 dark:text-red-400" testId="card-expired-keys" />
        <StatCard title="Blocked" value={stats?.blockedKeys ?? 0} icon={Ban} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-blocked-keys" />
      </div>
    </div>
  );
}
