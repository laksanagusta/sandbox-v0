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
import WorkPaperListPage from "@/pages/WorkPaperListPage";
import WorkPaperItemsListPage from "@/pages/WorkPaperItemsListPage";
import WorkPaperItemDetailPage from "@/pages/WorkPaperItemDetailPage";
import WorkPaperDetailPage from "@/pages/WorkPaperDetailPage";
import WorkPaperSignaturesListPage from "@/pages/WorkPaperSignaturesListPage";
import OrganizationPage from "@/pages/OrganizationPage";
import OrganizationDetailPage from "@/pages/OrganizationDetailPage";
import PermissionPage from "@/pages/PermissionPage";
import PermissionDetailPage from "@/pages/PermissionDetailPage";
import UserPage from "@/pages/UserPage";
import UserDetailPage from "@/pages/UserDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import VaccinesPage from "@/pages/VaccinesPage";
import WorkPaperCreatePage from "@/pages/WorkPaperCreatePage";
import BusinessTripReportPage from "@/pages/BusinessTripReportPage";
import BusinessTripVerificationsPage from "@/pages/BusinessTripVerificationsPage";
import BusinessTripVerificatorPage from "@/pages/BusinessTripVerificatorPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-muted/20">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center h-14 px-6 bg-white border-b sticky top-0 z-40 transition-all duration-200">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="text-muted-foreground hover:text-foreground transition-colors" />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
              <Switch>
                <Route path="/kwitansi" component={KwitansiPage} />
                <Route path="/kwitansi/:id" component={KwitansiPage} />
                <Route path="/business-trips" component={BusinessTripListPage} />
                <Route path="/business-trips/report" component={BusinessTripReportPage} />
                <Route path="/business-trip-verifications" component={BusinessTripVerificatorPage} />
                <Route path="/work-papers" component={WorkPaperListPage} />
                <Route path="/work-papers/create" component={WorkPaperCreatePage} />
                <Route path="/work-papers/:id" component={WorkPaperDetailPage} />
                <Route path="/work-paper-items" component={WorkPaperItemsListPage} />
                <Route path="/work-paper-items/:id" component={WorkPaperItemDetailPage} />
                <Route path="/work-paper-signatures" component={WorkPaperSignaturesListPage} />
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
                <Route path="/profile" component={ProfilePage} />
                <Route component={NotFound} />
              </Switch>
            </div>
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
            <Route path="/profile">
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
            <Route path="/business-trips/report">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/work-papers">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/work-papers/create">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/work-papers/:id">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/work-paper-items">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/work-paper-items/:id">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/work-paper-signatures">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/vaccines">
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            </Route>
            <Route path="/business-trip-verifications">
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
