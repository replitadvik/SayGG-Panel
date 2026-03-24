import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, MessageCircle, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telegramChatId, setTelegramChatId] = useState(user?.telegramChatId || "");

  const usernameMutation = useMutation({
    mutationFn: async (username: string) => { await apiRequest("PATCH", "/api/profile/username", { newUsername: username }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); refetch(); toast({ title: "Username updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => { await apiRequest("PATCH", "/api/profile/password", data); },
    onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); toast({ title: "Password updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const telegramMutation = useMutation({
    mutationFn: async (chatId: string) => { await apiRequest("PATCH", "/api/profile/telegram", { telegramChatId: chatId }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); refetch(); toast({ title: "Telegram Chat ID updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const twofaMutation = useMutation({
    mutationFn: async (enabled: boolean) => { await apiRequest("PATCH", "/api/profile/2fa", { enabled }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); refetch(); toast({ title: "2FA setting updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const levelLabel = user?.level === 1 ? "Owner" : user?.level === 2 ? "Admin" : "Reseller";

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-profile-title">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Account settings</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <User className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Account Info</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-panel-header flex items-center justify-center text-lg font-bold text-panel-header-foreground">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold" data-testid="text-profile-username">{user?.username}</p>
              <p className="text-xs text-muted-foreground" data-testid="text-profile-level">{levelLabel}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-muted/40">
              <span className="text-muted-foreground block mb-0.5">Email</span>
              <span className="font-medium text-foreground">{user?.email || "\u2014"}</span>
            </div>
            <div className="p-3 rounded bg-muted/40">
              <span className="text-muted-foreground block mb-0.5">Balance</span>
              <span className="font-bold text-foreground font-mono">{formatCurrency(user?.saldo ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <User className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Change Username</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Username</Label>
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              className="h-11 rounded bg-muted/50 border-border/60"
              data-testid="input-new-username"
            />
          </div>
          <Button
            onClick={() => usernameMutation.mutate(newUsername)}
            disabled={usernameMutation.isPending || newUsername === user?.username}
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-username"
          >
            {usernameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Username
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Change Password</h2>
        </div>
        <div className="p-5 space-y-4">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Password</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">New Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-new-password" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} className="h-11 rounded bg-muted/50 border-border/60" data-testid="input-confirm-password" />
            </div>
            <Button type="submit" disabled={passwordMutation.isPending} className="w-full h-10 rounded text-sm" data-testid="button-save-password">
              {passwordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </form>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Telegram</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Telegram Chat ID</Label>
            <Input
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="Enter Telegram Chat ID"
              className="h-11 rounded bg-muted/50 border-border/60"
              data-testid="input-telegram-chatid"
            />
          </div>
          <Button
            onClick={() => telegramMutation.mutate(telegramChatId)}
            disabled={telegramMutation.isPending}
            className="w-full h-10 rounded text-sm"
            data-testid="button-save-telegram"
          >
            {telegramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Telegram
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-panel-header-foreground/70" />
          <h2 className="text-sm font-semibold text-panel-header-foreground">Two-Factor Authentication</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded bg-muted/40">
            <div>
              <Label className="text-sm font-medium">{user?.twofaEnabled === 1 ? "2FA Enabled" : "2FA Disabled"}</Label>
              {!user?.telegramChatId && (
                <p className="text-xs text-muted-foreground mt-0.5">Add Telegram Chat ID first</p>
              )}
            </div>
            <Switch
              checked={user?.twofaEnabled === 1}
              onCheckedChange={(checked) => twofaMutation.mutate(checked)}
              disabled={twofaMutation.isPending || !user?.telegramChatId}
              data-testid="switch-2fa"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
