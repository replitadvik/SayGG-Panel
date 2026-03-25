import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, User, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery<{ needsSetup: boolean }>({
    queryKey: ["/api/setup/status"],
    retry: false,
    staleTime: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/setup/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, fullname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      toast({ title: "Owner account created", description: "You can now log in." });
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (status && !status.needsSetup) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-5">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-lg bg-panel-header flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-panel-header-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Setup Complete</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This system is already initialized. Setup is no longer available.
          </p>
          <Button
            className="w-full h-11 rounded text-sm font-semibold"
            onClick={() => setLocation("/login")}
            data-testid="button-go-to-login"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-5">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-lg bg-panel-header flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-panel-header-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Setup Complete</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Owner account <span className="font-semibold text-foreground">@{username}</span> has been created.
            You can now log in and start using the system.
          </p>
          <Button
            className="w-full h-11 rounded text-sm font-semibold"
            onClick={() => setLocation("/login")}
            data-testid="button-go-to-login-after-setup"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-5">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          data-testid="button-setup-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-lg bg-panel-header flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-panel-header-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-setup-title">
            First-Time Setup
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Create the first Owner account to get started
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Username</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-setup-username"
                  placeholder="alphanumeric, 4–25 chars"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 rounded bg-muted/50 border-border/60"
                  required
                  minLength={4}
                  maxLength={25}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Full Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-setup-fullname"
                  placeholder="Display name"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="pl-10 h-11 rounded bg-muted/50 border-border/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-setup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded bg-muted/50 border-border/60"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-setup-password2"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="pl-10 h-11 rounded bg-muted/50 border-border/60"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="rounded bg-muted/50 border border-border/60 px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">This form is only available once.</p>
              <p>After the first Owner account is created, this setup page will be permanently disabled.</p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded text-sm font-semibold"
              disabled={loading}
              data-testid="button-setup-submit"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Owner Account
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="text-primary hover:underline font-medium"
            data-testid="link-setup-to-login"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
