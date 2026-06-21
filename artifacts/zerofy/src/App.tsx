import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import CalculatorPage from "@/pages/calculator";
import SimulatorPage from "@/pages/simulator";
import GoalsPage from "@/pages/goals";
import CommunityPage from "@/pages/community";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  return (
    <Route
      {...rest}
      component={(props: any) => {
        if (isLoading) return null;
        if (!user) return <Redirect to="/login" />;
        return <Component {...props} />;
      }}
    />
  );
}

// Guest route wrapper (redirects to dashboard if logged in)
function GuestRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  return (
    <Route
      {...rest}
      component={(props: any) => {
        if (isLoading) return null;
        if (user) return <Redirect to="/dashboard" />;
        return <Component {...props} />;
      }}
    />
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <GuestRoute path="/login" component={LoginPage} />
      <GuestRoute path="/register" component={RegisterPage} />
      
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/calculator" component={CalculatorPage} />
      <ProtectedRoute path="/simulator" component={SimulatorPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/community" component={CommunityPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
