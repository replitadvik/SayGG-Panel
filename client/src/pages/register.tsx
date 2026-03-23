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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-register-title">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input data-testid="input-email" type="email" value={form.email} onChange={handleChange("email")} required />
            </div>
            <div className="space-y-1">
              <Label>Username</Label>
              <Input data-testid="input-reg-username" value={form.username} onChange={handleChange("username")} required minLength={4} maxLength={25} />
            </div>
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input data-testid="input-fullname" value={form.fullname} onChange={handleChange("fullname")} required minLength={4} />
            </div>
            <div className="space-y-1">
              <Label>Telegram Chat ID</Label>
              <Input data-testid="input-telegram" value={form.telegramChatId} onChange={handleChange("telegramChatId")} required />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input data-testid="input-reg-password" type="password" value={form.password} onChange={handleChange("password")} required minLength={6} />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input data-testid="input-reg-password2" type="password" value={form.password2} onChange={handleChange("password2")} required minLength={6} />
            </div>
            <div className="space-y-1">
              <Label>Referral Code</Label>
              <Input data-testid="input-referral" value={form.referral} onChange={handleChange("referral")} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Register
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => setLocation("/login")} className="text-primary hover:underline" data-testid="link-login">
                Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
