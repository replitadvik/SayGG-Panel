import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, User } from "lucide-react";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      setOtpHint(data.otp_hint || "");
      toast({ title: "OTP Sent", description: data.message });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp, newPassword, confirmPassword }),
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-10 h-10 bg-primary flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight" data-testid="text-page-title">
              {otpSent ? "Reset Password" : "Forgot Password"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">
              {otpSent ? "Enter OTP & new password" : "Account recovery"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    data-testid="input-username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 h-9 bg-muted border-border"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-9 text-xs font-semibold uppercase tracking-wider" disabled={loading} data-testid="button-send-otp">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send OTP
              </Button>
              <div className="text-center text-xs text-muted-foreground border-t border-border pt-3">
                <button type="button" onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium" data-testid="link-login">
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {otpHint && (
                <div className="p-3 bg-muted border border-border text-sm text-center">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">OTP Code: </span>
                  <span className="font-mono font-bold text-primary">{otpHint}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">OTP Code</Label>
                <Input
                  id="otp"
                  data-testid="input-otp"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="h-9 bg-muted border-border"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
                <Input
                  id="newPassword"
                  data-testid="input-new-password"
                  type="password"
                  placeholder="New password (6-45 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 bg-muted border-border"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  data-testid="input-confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 bg-muted border-border"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-9 text-xs font-semibold uppercase tracking-wider" disabled={loading} data-testid="button-reset-password">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
              <div className="text-center text-xs text-muted-foreground border-t border-border pt-3">
                <button type="button" onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium" data-testid="link-login">
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
