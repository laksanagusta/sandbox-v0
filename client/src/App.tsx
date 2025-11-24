import { Switch, Route } from "wouter";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import KwitansiPage from "@/pages/KwitansiPage";
import BusinessTripListPage from "@/pages/BusinessTripListPage";
import OrganizationPage from "@/pages/OrganizationPage";
import OrganizationDetailPage from "@/pages/OrganizationDetailPage";
import PermissionPage from "@/pages/PermissionPage";
import PermissionDetailPage from "@/pages/PermissionDetailPage";
import UserPage from "@/pages/UserPage";
import UserDetailPage from "@/pages/UserDetailPage";
import VaccinesPage from "@/pages/VaccinesPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center h-16 px-4 border-b bg-card sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/kwitansi" component={KwitansiPage} />
              <Route path="/kwitansi/:id" component={KwitansiPage} />
              <Route path="/business-trips" component={BusinessTripListPage} />
              <Route path="/vaccines" component={VaccinesPage} />
              <Route
                path="/organization/:id"
                component={OrganizationDetailPage}
              />
              <Route path="/organization" component={OrganizationPage} />
              <Route path="/permission/:id" component={PermissionDetailPage} />
              <Route path="/permission" component={PermissionPage} />
              <Route path="/users/:id" component={UserDetailPage} />
              <Route path="/users" component={UserPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/kwitansi">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/organization/:id">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/organization">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/permission/:id">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/permission">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/users/:id">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/users">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/kwitansi/:id">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/business-trips">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/vaccines">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
