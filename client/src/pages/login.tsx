import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { getDeviceId } from "@/lib/device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, User, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useSiteName } from "@/hooks/use-site-name";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { siteName } = useSiteName();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login({ username, password, rememberMe, deviceId: getDeviceId() });
      if (result.requires2fa) {
        setShow2FA(true);
        setOtpHint(result.otp_hint || "");
        toast({ title: "2FA Required", description: "Enter the OTP code." });
      } else {
        setLocation("/");
      }
    } catch (e: any) {
      toast({ title: "Login Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.href = "/";
    } catch (e: any) {
      toast({ title: "OTP Failed", description: e.message, variant: "destructive" });
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
          data-testid="button-auth-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-lg bg-panel-header flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-panel-header-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-page-title">
            {show2FA ? "Verify OTP" : siteName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {show2FA ? "Two-Factor Authentication" : "Sign in to your account"}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
          {!show2FA ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Username</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    data-testid="input-username"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11 rounded bg-muted/50 border-border/60"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded bg-muted/50 border-border/60"
                    required
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
              <div className="flex items-center space-x-2.5">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  data-testid="checkbox-remember-me"
                  className="rounded"
                />
                <Label htmlFor="rememberMe" className="text-sm cursor-pointer text-muted-foreground" data-testid="label-remember-me">
                  Remember me
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded text-sm font-semibold"
                disabled={loading}
                data-testid="button-login"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
              <div className="flex justify-between text-sm pt-1">
                <button type="button" onClick={() => setLocation("/forgot-password")} className="text-primary hover:underline" data-testid="link-forgot-password">
                  Forgot password?
                </button>
                <button type="button" onClick={() => setLocation("/device-reset")} className="text-primary hover:underline" data-testid="link-device-reset">
                  Reset device
                </button>
              </div>
              <div className="text-center text-sm text-muted-foreground border-t border-border/60 pt-4 mt-4">
                Don't have an account?{" "}
                <button type="button" onClick={() => setLocation("/register")} className="text-primary hover:underline font-medium" data-testid="link-register">
                  Register
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {otpHint && (
                <div className="p-4 rounded bg-muted/60 border border-border/60 text-center">
                  <span className="text-xs text-muted-foreground block mb-1">OTP Code</span>
                  <span className="font-mono font-bold text-lg text-primary tracking-widest">{otpHint}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">OTP Code</Label>
                <Input
                  id="otp"
                  data-testid="input-otp"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="h-12 rounded bg-muted/50 border-border/60 font-mono text-center text-xl tracking-[0.5em]"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded text-sm font-semibold"
                disabled={loading}
                data-testid="button-verify-otp"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify OTP
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
