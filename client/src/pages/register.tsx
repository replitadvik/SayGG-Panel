import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", username: "", fullname: "", telegramChatId: "",
    password: "", password2: "", referral: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", form);
      const data = await res.json();
      toast({ title: "Success", description: data.message });
      setLocation("/login");
    } catch (e: any) {
      toast({ title: "Registration Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-10 h-10 bg-primary flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight" data-testid="text-register-title">Register</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">Create Account</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input data-testid="input-email" type="email" value={form.email} onChange={handleChange("email")} required className="h-9 bg-muted border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
              <Input data-testid="input-reg-username" value={form.username} onChange={handleChange("username")} required minLength={4} maxLength={25} className="h-9 bg-muted border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input data-testid="input-fullname" value={form.fullname} onChange={handleChange("fullname")} required minLength={4} className="h-9 bg-muted border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Telegram Chat ID</Label>
              <Input data-testid="input-telegram" value={form.telegramChatId} onChange={handleChange("telegramChatId")} required className="h-9 bg-muted border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input data-testid="input-reg-password" type="password" value={form.password} onChange={handleChange("password")} required minLength={6} className="h-9 bg-muted border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
              <Input data-testid="input-reg-password2" type="password" value={form.password2} onChange={handleChange("password2")} required minLength={6} className="h-9 bg-muted border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Referral Code</Label>
              <Input data-testid="input-referral" value={form.referral} onChange={handleChange("referral")} required minLength={6} className="h-9 bg-muted border-border" />
            </div>
            <Button type="submit" className="w-full h-9 text-xs font-semibold uppercase tracking-wider" disabled={loading} data-testid="button-register">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Register
            </Button>
            <div className="text-center text-xs text-muted-foreground border-t border-border pt-3">
              Already have an account?{" "}
              <button type="button" onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium" data-testid="link-login">
                Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
