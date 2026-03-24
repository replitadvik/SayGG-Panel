import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
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
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, maxLevel }: {
  component: React.ComponentType;
  maxLevel?: number;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">{() => <AuthRoute component={LoginPage} />}</Route>
      <Route path="/register">{() => <AuthRoute component={RegisterPage} />}</Route>
      <Route path="/forgot-password">{() => <AuthRoute component={ForgotPasswordPage} />}</Route>
      <Route path="/device-reset">{() => <AuthRoute component={DeviceResetPage} />}</Route>
      <Route path="/">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/keys">{() => <ProtectedRoute component={KeysPage} />}</Route>
      <Route path="/keys/generate">{() => <ProtectedRoute component={GeneratePage} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={UsersPage} />}</Route>
      <Route path="/balance">{() => <ProtectedRoute component={BalancePage} maxLevel={2} />}</Route>
      <Route path="/referrals">{() => <ProtectedRoute component={ReferralsPage} maxLevel={2} />}</Route>
      <Route path="/prices">{() => <Redirect to="/games" />}</Route>
      <Route path="/games/:id/durations">{() => <ProtectedRoute component={GameDurationsPage} maxLevel={1} />}</Route>
      <Route path="/games">{() => <ProtectedRoute component={GamesPage} maxLevel={1} />}</Route>
      <Route path="/connect-config">{() => <ProtectedRoute component={ConnectConfigPage} maxLevel={1} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={SettingsPage} maxLevel={1} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={ProfilePage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
