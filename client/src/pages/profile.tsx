import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    mutationFn: async (username: string) => {
      await apiRequest("PATCH", "/api/profile/username", { newUsername: username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refetch();
      toast({ title: "Username updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await apiRequest("PATCH", "/api/profile/password", data);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const telegramMutation = useMutation({
    mutationFn: async (chatId: string) => {
      await apiRequest("PATCH", "/api/profile/telegram", { telegramChatId: chatId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refetch();
      toast({ title: "Telegram Chat ID updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const twofaMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("PATCH", "/api/profile/2fa", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refetch();
      toast({ title: "2FA setting updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-profile-title">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Username</span>
              <p className="font-medium" data-testid="text-profile-username">{user?.username}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Level</span>
              <p className="font-medium" data-testid="text-profile-level">{user?.level === 1 ? "Owner" : user?.level === 2 ? "Admin" : "Reseller"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email</span>
              <p className="font-medium">{user?.email || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Balance</span>
              <p className="font-medium">{formatCurrency(user?.saldo ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Change Username
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>New Username</Label>
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              data-testid="input-new-username"
            />
          </div>
          <Button
            onClick={() => usernameMutation.mutate(newUsername)}
            disabled={usernameMutation.isPending || newUsername === user?.username}
            data-testid="button-save-username"
          >
            {usernameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Username
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                data-testid="input-confirm-password"
              />
            </div>
            <Button type="submit" disabled={passwordMutation.isPending} data-testid="button-save-password">
              {passwordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Telegram Chat ID</Label>
            <Input
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="Enter Telegram Chat ID"
              data-testid="input-telegram-chatid"
            />
          </div>
          <Button
            onClick={() => telegramMutation.mutate(telegramChatId)}
            disabled={telegramMutation.isPending}
            data-testid="button-save-telegram"
          >
            {telegramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Telegram
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={user?.twofaEnabled === 1}
              onCheckedChange={(checked) => twofaMutation.mutate(checked)}
              disabled={twofaMutation.isPending || !user?.telegramChatId}
              data-testid="switch-2fa"
            />
            <div>
              <Label>{user?.twofaEnabled === 1 ? "2FA Enabled" : "2FA Disabled"}</Label>
              {!user?.telegramChatId && (
                <p className="text-xs text-muted-foreground">Add Telegram Chat ID first to enable 2FA</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
