import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { AppProvider } from "@/store/AppStore";
import Dashboard from "@/pages/Dashboard";
import Installations from "@/pages/Installations";
import InstallationDetail from "@/pages/InstallationDetail";
import Materials from "@/pages/Materials";
import MaterialDetail from "@/pages/MaterialDetail";
import Operations from "@/pages/Operations";
import FirmwareSettings from "@/pages/FirmwareSettings";
import NewInstallation from "@/pages/NewInstallation";
import Templates from "@/pages/Templates";
import FleetOverview from "@/pages/FleetOverview";
import UserManagement from "@/pages/UserManagement";
import AuditLog from "@/pages/AuditLog";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/installations" element={<Installations />} />
            <Route path="/installations/new" element={<NewInstallation />} />
            <Route path="/installations/:id" element={<InstallationDetail />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/materials/:id" element={<MaterialDetail />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/firmware" element={<FirmwareSettings />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/fleet" element={<FleetOverview />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/audit" element={<AuditLog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ErrorBoundary>
            <AuthGate />
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
