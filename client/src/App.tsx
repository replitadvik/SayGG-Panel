import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { useWebSocket } from "@/lib/useWebSocket";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import DeviceResetPage from "@/pages/device-reset";
import DashboardPage from "@/pages/dashboard";
import KeysPage from "@/pages/keys";
import GeneratePage from "@/pages/generate";
import UsersPage from "@/pages/users";
import BalancePage from "@/pages/balance";
import ReferralsPage from "@/pages/referrals";
import GamesPage from "@/pages/games";
import GameDurationsPage from "@/pages/game-durations";
import ConnectConfigPage from "@/pages/connect-config";
import ApiGeneratorPage from "@/pages/api-generator";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import SetupPage from "@/pages/setup";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, maxLevel }: {
  component: React.ComponentType;
  maxLevel?: number;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (maxLevel && user.level > maxLevel) {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function WebSocketManager() {
  useWebSocket();
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/setup">{() => <SetupPage />}</Route>
      <Route path="/login">{() => <AuthRoute component={LoginPage} />}</Route>
      <Route path="/register">{() => <AuthRoute component={RegisterPage} />}</Route>
      <Route path="/forgot-password">{() => <AuthRoute component={ForgotPasswordPage} />}</Route>
      <Route path="/device-reset">{() => <AuthRoute component={DeviceResetPage} />}</Route>
      <Route path="/">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/keys">{() => <ProtectedRoute component={KeysPage} />}</Route>
      <Route path="/keys/generate">{() => <ProtectedRoute component={GeneratePage} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={UsersPage} maxLevel={2} />}</Route>
      <Route path="/balance">{() => <ProtectedRoute component={BalancePage} maxLevel={2} />}</Route>
      <Route path="/referrals">{() => <ProtectedRoute component={ReferralsPage} maxLevel={2} />}</Route>
      <Route path="/prices">{() => <Redirect to="/games" />}</Route>
      <Route path="/games/:id/durations">{() => <ProtectedRoute component={GameDurationsPage} maxLevel={1} />}</Route>
      <Route path="/games">{() => <ProtectedRoute component={GamesPage} maxLevel={1} />}</Route>
      <Route path="/connect-config">{() => <ProtectedRoute component={ConnectConfigPage} maxLevel={1} />}</Route>
      <Route path="/api-generator">{() => <ProtectedRoute component={ApiGeneratorPage} maxLevel={1} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={SettingsPage} maxLevel={1} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={ProfilePage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WebSocketManager />
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
