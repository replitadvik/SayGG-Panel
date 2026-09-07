import { useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { useSiteName } from "@/hooks/use-site-name";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard, Key, Users, Settings,
  LogOut, Menu, Wallet, Link2, User, Gamepad2, Shield,
  Sun, Moon, Zap, ChevronRight, Globe,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface NavItem {
  path: string;
  label: string;
  icon: any;
  minLevel: number;
  maxLevel?: number;
  group: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, minLevel: 1, group: "main" },
  { path: "/keys", label: "Keys", icon: Key, minLevel: 1, group: "main" },
  { path: "/keys/generate", label: "Generate Key", icon: Zap, minLevel: 1, group: "main" },
  { path: "/users", label: "Users", icon: Users, minLevel: 1, maxLevel: 2, group: "manage" },
  { path: "/balance", label: "Balance", icon: Wallet, minLevel: 1, maxLevel: 2, group: "manage" },
  { path: "/referrals", label: "Referrals", icon: Link2, minLevel: 1, maxLevel: 2, group: "manage" },
  { path: "/games", label: "Games", icon: Gamepad2, minLevel: 1, maxLevel: 1, group: "system" },
  { path: "/connect-config", label: "Connect Config", icon: Shield, minLevel: 1, maxLevel: 1, group: "system" },
  { path: "/api-generator", label: "API Generator", icon: Globe, minLevel: 1, maxLevel: 1, group: "system" },
  { path: "/settings", label: "Settings", icon: Settings, minLevel: 1, maxLevel: 1, group: "system" },
  { path: "/profile", label: "Profile", icon: User, minLevel: 1, group: "account" },
];

const groupLabels: Record<string, string> = {
  main: "Navigation",
  manage: "Management",
  system: "System",
  account: "Account",
};

function getActiveNavPath(currentPath: string, items: NavItem[]): string | null {
  const pathname = currentPath.split("?")[0].split("#")[0];
  let bestMatch: string | null = null;
  let bestLength = 0;

  for (const item of items) {
    if (item.path === "/" && pathname === "/") {
      if (bestLength === 0) {
        bestMatch = "/";
        bestLength = 1;
      }
    } else if (item.path !== "/") {
      if (pathname === item.path || pathname.startsWith(item.path + "/")) {
        if (item.path.length > bestLength) {
          bestMatch = item.path;
          bestLength = item.path.length;
        }
      }
    }
  }
  return bestMatch;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { siteName } = useSiteName();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredNav = navItems.filter(item => {
    if (!user) return false;
    if (user.level > (item.maxLevel ?? 3)) return false;
    return true;
  });

  const groupedNav = filteredNav.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const groupOrder = ["main", "manage", "system", "account"];
  const activePath = getActiveNavPath(location, filteredNav);

  const handleLogout = useCallback(async () => {
    setSheetOpen(false);
    await logout();
  }, [logout]);

  const handleNavClick = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const levelLabel = user?.level === 1 ? "Owner" : user?.level === 2 ? "Admin" : "Reseller";

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
              className="h-9 w-9 flex items-center justify-center rounded text-panel-header-foreground/50 hover:text-panel-header-foreground hover:bg-panel-header-foreground/10"
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <button
              onClick={() => setSheetOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded text-panel-header-foreground/60 hover:text-panel-header-foreground hover:bg-panel-header-foreground/10"
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[280px] p-0 flex flex-col bg-card">
          <SheetHeader className="p-0 border-b border-border/60">
            <div className="bg-panel-header px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-panel-header-foreground/15 flex items-center justify-center text-sm font-bold text-panel-header-foreground">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-sm font-semibold text-left truncate text-panel-header-foreground" data-testid="text-sidebar-username">
                    {user?.username}
                  </SheetTitle>
                  <p className="text-[11px] text-panel-header-foreground/60 mt-0.5" data-testid="text-sidebar-level">{levelLabel}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between px-3 py-2 rounded bg-muted/50 border border-border/40">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Balance</span>
                <span className="text-sm font-semibold font-mono text-foreground" data-testid="text-header-saldo">
                  {formatCurrency(user?.saldo ?? 0)}
                </span>
              </div>
            </div>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {groupOrder.map(groupKey => {
              const items = groupedNav[groupKey];
              if (!items || items.length === 0) return null;
              return (
                <div key={groupKey} className="mb-1">
                  <div className="px-3 pt-3 pb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {groupLabels[groupKey]}
                    </span>
                  </div>
                  {items.map(item => {
                    const active = activePath === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium cursor-pointer mb-px ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/70 hover:bg-muted/80 hover:text-foreground active:bg-muted"
                          }`}
                          onClick={handleNavClick}
                        >
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary-foreground" : ""}`} />
                          <span className="flex-1">{item.label}</span>
                          {active && <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/70" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-border/60 p-3 mobile-safe-bottom">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 active:bg-destructive/10"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
