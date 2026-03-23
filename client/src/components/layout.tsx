import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Key, Users, DollarSign, Settings,
  LogOut, Menu, X, ChevronDown, Wallet, Link2, User,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, minLevel: 1 },
  { path: "/keys", label: "Keys", icon: Key, minLevel: 1 },
  { path: "/keys/generate", label: "Generate", icon: Key, minLevel: 1 },
  { path: "/users", label: "Users", icon: Users, minLevel: 1 },
  { path: "/balance", label: "Balance", icon: Wallet, minLevel: 1, maxLevel: 2 },
  { path: "/referrals", label: "Referrals", icon: Link2, minLevel: 1, maxLevel: 2 },
  { path: "/prices", label: "Prices", icon: DollarSign, minLevel: 1, maxLevel: 1 },
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
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-[hsl(var(--sidebar-border))]">
          <span className="text-lg font-bold text-[hsl(var(--sidebar-primary))]" data-testid="text-brand">
            Key-Panel
          </span>
          <button className="lg:hidden text-[hsl(var(--sidebar-foreground))]" onClick={() => setSidebarOpen(false)} data-testid="button-close-sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map(item => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <div
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                      : "hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[hsl(var(--sidebar-border))] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center text-xs font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" data-testid="text-sidebar-username">{user?.username}</div>
              <div className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-60" data-testid="text-sidebar-level">{user?.levelName}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-4 bg-card">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} data-testid="button-open-sidebar">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground" data-testid="text-header-saldo">
              Balance: <span className="font-semibold text-foreground">{formatCurrency(user?.saldo ?? 0)}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
