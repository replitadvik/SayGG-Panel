import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { useSiteName } from "@/hooks/use-site-name";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Key, Users, Settings,
  LogOut, Menu, Wallet, Link2, User, Gamepad2, Shield,
  Sun, Moon, X, Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, minLevel: 1, group: "main" },
  { path: "/keys", label: "Keys", icon: Key, minLevel: 1, group: "keys" },
  { path: "/keys/generate", label: "Generate Key", icon: Plus, minLevel: 1, group: "keys" },
  { path: "/users", label: "Users", icon: Users, minLevel: 1, group: "manage" },
  { path: "/balance", label: "Balance", icon: Wallet, minLevel: 1, maxLevel: 2, group: "manage" },
  { path: "/referrals", label: "Referrals", icon: Link2, minLevel: 1, maxLevel: 2, group: "manage" },
  { path: "/games", label: "Games", icon: Gamepad2, minLevel: 1, maxLevel: 1, group: "system" },
  { path: "/connect-config", label: "Connect Config", icon: Shield, minLevel: 1, maxLevel: 1, group: "system" },
  { path: "/settings", label: "Settings", icon: Settings, minLevel: 1, maxLevel: 1, group: "system" },
  { path: "/profile", label: "Profile", icon: User, minLevel: 1, group: "account" },
];

const allNavPaths = navItems.map(i => i.path);

function isRouteActive(currentPath: string, itemPath: string): boolean {
  if (itemPath === "/") return currentPath === "/";
  if (currentPath === itemPath) return true;
  const hasMoreSpecificMatch = allNavPaths.some(
    p => p !== itemPath && p.startsWith(itemPath + "/") && currentPath.startsWith(p)
  );
  if (hasMoreSpecificMatch) return false;
  if (itemPath !== "/" && currentPath.startsWith(itemPath + "/")) return true;
  return false;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteName } = useSiteName();
  const [navOpen, setNavOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navOpen) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [navOpen]);

  const filteredNav = navItems.filter(item => {
    if (!user) return false;
    if (user.level > (item.maxLevel ?? 3)) return false;
    return true;
  });

  const handleLogout = async () => {
    setNavOpen(false);
    await logout();
  };

  const levelLabel = user?.level === 1 ? "Owner" : user?.level === 2 ? "Admin" : "Reseller";

  const groupOrder = ["main", "keys", "manage", "system", "account"];
  const groupedNav: { group: string; items: typeof filteredNav }[] = [];
  for (const g of groupOrder) {
    const items = filteredNav.filter(i => i.group === g);
    if (items.length > 0) groupedNav.push({ group: g, items });
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-panel-header border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="text-base font-semibold tracking-tight text-panel-header-foreground hover:text-panel-header-foreground/80 transition-colors" data-testid="text-brand-header">
              {siteName}
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-panel-header-foreground/10 text-panel-header-foreground/80 border border-panel-header-foreground/10">
              {levelLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-panel-header-foreground/50 mr-1 hidden sm:block" data-testid="text-header-saldo">
              <span className="font-medium font-mono text-panel-header-foreground/90">{formatCurrency(user?.saldo ?? 0)}</span>
            </span>

            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded text-panel-header-foreground/50 hover:text-panel-header-foreground hover:bg-panel-header-foreground/10 transition-colors"
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <button
              onClick={() => setNavOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded text-panel-header-foreground/60 hover:text-panel-header-foreground hover:bg-panel-header-foreground/10 transition-colors"
              data-testid="button-open-sidebar"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="p-4 pb-8 max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {navOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setNavOpen(false)}
            data-testid="nav-overlay"
          />

          <div ref={panelRef} tabIndex={-1} className="relative w-[280px] h-full bg-background border-l border-border/60 flex flex-col shadow-xl outline-none">
            <div className="p-5 pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-panel-header flex items-center justify-center text-sm font-semibold text-panel-header-foreground">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" data-testid="text-sidebar-username">
                    {user?.username}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-sidebar-level">{levelLabel}</p>
                </div>
                <button
                  onClick={() => setNavOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  aria-label="Close menu"
                  data-testid="button-close-sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 px-3 py-2.5 rounded bg-muted/60 border border-border/40">
                <span className="text-xs text-muted-foreground">Balance</span>
                <span className="text-sm font-semibold font-mono text-foreground" data-testid="text-sidebar-saldo">
                  {formatCurrency(user?.saldo ?? 0)}
                </span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-2 px-2" data-testid="nav-menu">
              {groupedNav.map((group, gi) => (
                <div key={group.group}>
                  {gi > 0 && <div className="h-px bg-border/40 mx-2 my-1.5" />}
                  {group.items.map(item => {
                    const active = isRouteActive(location, item.path);
                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium cursor-pointer mb-0.5 ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/70 active:bg-accent"
                          }`}
                          onClick={() => setNavOpen(false)}
                        >
                          <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                          {item.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="border-t border-border/60 p-3 mobile-safe-bottom">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-sm font-medium text-muted-foreground hover:text-destructive h-11 rounded"
                data-testid="button-logout"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
