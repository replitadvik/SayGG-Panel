import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, User, Lock, Sun, Moon } from "lucide-react";

export default function DeviceResetPage() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/device-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Success", description: data.message });
      setLocation("/login");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-5">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-lg bg-panel-header flex items-center justify-center mb-4">
            <Smartphone className="w-6 h-6 text-panel-header-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Reset Device</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Reset your device binding</p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" data-testid="input-username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 h-11 rounded bg-muted/50 border-border/60" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" data-testid="input-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11 rounded bg-muted/50 border-border/60" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 rounded text-sm font-semibold" disabled={loading} data-testid="button-reset-device">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset Device
            </Button>
            <div className="text-center text-sm text-muted-foreground border-t border-border/60 pt-4 mt-4">
              <button type="button" onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium" data-testid="link-login">
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
