import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { useSiteName } from "@/hooks/use-site-name";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard, Key, Users, Settings,
  LogOut, Menu, Wallet, Link2, User, Gamepad2, Shield,
  Sun, Moon,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, minLevel: 1 },
  { path: "/keys", label: "Keys", icon: Key, minLevel: 1 },
  { path: "/keys/generate", label: "Generate", icon: Key, minLevel: 1 },
  { path: "/users", label: "Users", icon: Users, minLevel: 1 },
  { path: "/balance", label: "Balance", icon: Wallet, minLevel: 1, maxLevel: 2 },
  { path: "/referrals", label: "Referrals", icon: Link2, minLevel: 1, maxLevel: 2 },
  { path: "/games", label: "Games", icon: Gamepad2, minLevel: 1, maxLevel: 1 },
  { path: "/connect-config", label: "Connect Config", icon: Shield, minLevel: 1, maxLevel: 1 },
  { path: "/settings", label: "Settings", icon: Settings, minLevel: 1, maxLevel: 1 },
  { path: "/profile", label: "Profile", icon: User, minLevel: 1 },
];

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

  const handleLogout = async () => {
    setSheetOpen(false);
    await logout();
  };

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
              className="h-9 w-9 flex items-center justify-center rounded text-panel-header-foreground/50 hover:text-panel-header-foreground hover:bg-panel-header-foreground/10 transition-colors"
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <button
              onClick={() => setSheetOpen(true)}
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
          <SheetHeader className="p-5 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-panel-header flex items-center justify-center text-sm font-semibold text-panel-header-foreground">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-sm font-semibold text-left truncate" data-testid="text-sidebar-username">
                  {user?.username}
                </SheetTitle>
                <p className="text-xs text-muted-foreground" data-testid="text-sidebar-level">{levelLabel}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 px-3 py-2.5 rounded bg-muted/60 border border-border/40">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="text-sm font-semibold font-mono text-foreground" data-testid="text-header-saldo">
                {formatCurrency(user?.saldo ?? 0)}
              </span>
            </div>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {filteredNav.map(item => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all cursor-pointer mb-0.5 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-accent hover:text-foreground"
                    }`}
                    onClick={() => setSheetOpen(false)}
                  >
                    <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
