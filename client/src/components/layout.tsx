import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Key, Users, Settings,
  LogOut, Menu, X, Wallet, Link2, User, Gamepad2, Shield,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, minLevel: 1 },
  { path: "/keys", label: "Keys", icon: Key, minLevel: 1 },
  { path: "/keys/generate", label: "Generate", icon: Key, minLevel: 1 },
  { path: "/users", label: "Users", icon: Users, minLevel: 1 },
  { path: "/balance", label: "Balance", icon: Wallet, minLevel: 1, maxLevel: 2 },
  { path: "/referrals", label: "Referrals", icon: Link2, minLevel: 1, maxLevel: 2 },
  { path: "/games", label: "Game Management", icon: Gamepad2, minLevel: 1, maxLevel: 1 },
  { path: "/connect-config", label: "Connect Config", icon: Shield, minLevel: 1, maxLevel: 1 },
  { path: "/settings", label: "Settings", icon: Settings, minLevel: 1, maxLevel: 1 },
  { path: "/profile", label: "Profile", icon: User, minLevel: 1 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter(item => {
    if (!user) return false;
    if (user.level > (item.maxLevel ?? 3)) return false;
    return true;
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-wide text-primary uppercase" data-testid="text-brand-header">
              Key-Panel
            </span>
            <span className="hidden sm:inline-block h-4 w-px bg-border" />
            <span className="hidden sm:inline text-xs text-muted-foreground" data-testid="text-header-level">
              {user?.levelName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground" data-testid="text-header-saldo">
              <span className="text-foreground font-mono font-medium">{formatCurrency(user?.saldo ?? 0)}</span>
            </span>
            <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)} data-testid="button-open-sidebar">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-60 transform bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] border-l border-[hsl(var(--sidebar-border))] transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-[hsl(var(--sidebar-border))]">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[hsl(var(--sidebar-primary))]" data-testid="text-brand">
            Navigation
          </span>
          <button className="lg:hidden text-[hsl(var(--sidebar-foreground))]" onClick={() => setSidebarOpen(false)} data-testid="button-close-sidebar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {filteredNav.map(item => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <div
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium tracking-wide transition-colors cursor-pointer border-l-2 ${
                    isActive
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] border-[hsl(var(--sidebar-primary))]"
                      : "hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] border-transparent"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-[hsl(var(--sidebar-primary))] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--sidebar-primary-foreground))]">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" data-testid="text-sidebar-username">{user?.username}</div>
              <div className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-50" data-testid="text-sidebar-level">{user?.levelName}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] text-xs h-8"
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
    </div>
  );
}
