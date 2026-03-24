import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Sun, Moon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useSiteName } from "@/hooks/use-site-name";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { siteName } = useSiteName();
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

  const fields = [
    { key: "email", label: "Email", type: "email", placeholder: "your@email.com" },
    { key: "username", label: "Username", type: "text", placeholder: "Choose a username" },
    { key: "fullname", label: "Full Name", type: "text", placeholder: "Your full name" },
    { key: "telegramChatId", label: "Telegram Chat ID", type: "text", placeholder: "Your Telegram Chat ID" },
    { key: "password", label: "Password", type: "password", placeholder: "Min 6 characters" },
    { key: "password2", label: "Confirm Password", type: "password", placeholder: "Confirm password" },
    { key: "referral", label: "Referral Code", type: "text", placeholder: "Enter referral code" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-5 py-10">
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
            <UserPlus className="w-6 h-6 text-panel-header-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-register-title">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Register for {siteName} access</p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.key} className="space-y-2">
                <Label className="text-sm font-medium">{f.label}</Label>
                <Input
                  data-testid={`input-${f.key === "email" ? "email" : f.key === "username" ? "reg-username" : f.key === "password" ? "reg-password" : f.key === "password2" ? "reg-password2" : f.key === "telegramChatId" ? "telegram" : f.key === "fullname" ? "fullname" : "referral"}`}
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={handleChange(f.key)}
                  required
                  placeholder={f.placeholder}
                  className="h-11 rounded bg-muted/50 border-border/60"
                  minLength={f.key === "password" || f.key === "password2" ? 6 : f.key === "username" ? 4 : undefined}
                  maxLength={f.key === "username" ? 25 : undefined}
                />
              </div>
            ))}
            <Button
              type="submit"
              className="w-full h-11 rounded text-sm font-semibold"
              disabled={loading}
              data-testid="button-register"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
            <div className="text-center text-sm text-muted-foreground border-t border-border/60 pt-4 mt-4">
              Already have an account?{" "}
              <button type="button" onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium" data-testid="link-login">
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
