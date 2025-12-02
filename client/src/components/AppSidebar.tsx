import {
  Plane,
  LogOut,
  User,
  Settings,
  Building,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Activity,
  FileText,
  PenTool,
  CheckSquare,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { canAccessBusinessTripVerifications } from "@/utils/permissions";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBusinessTripOpen, setIsBusinessTripOpen] = useState(false);
  const [isWorkPaperOpen, setIsWorkPaperOpen] = useState(false);

  return (
    <Sidebar className="border-r">
      {/* Header dengan logo yang sederhana */}
      <SidebarHeader className="bg-white p-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">The Core</h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup className="px-4 py-6">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
              General
            </h3>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <Collapsible
                  open={isBusinessTripOpen}
                  onOpenChange={setIsBusinessTripOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-start hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-3 rounded-lg group"
                      data-testid="nav-business-trip"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <span className="text-sidebar-foreground font-medium group-hover:text-foreground transition-colors">
                          Business Trip
                        </span>
                      </div>
                      {isBusinessTripOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-business-trip-list"
                        >
                          <Link
                            href="/business-trips"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <Plane className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Business Trip
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-business-trip-report"
                        >
                          <Link
                            href="/business-trips/report"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Report
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                            data-testid="nav-business-trip-verifications"
                          >
                            <Link
                              href="/business-trip-verifications"
                              className="flex items-center space-x-3"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <ClipboardCheck className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                              </div>
                              <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                                Verify
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible
                  open={isWorkPaperOpen}
                  onOpenChange={setIsWorkPaperOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-start hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-3 rounded-lg group"
                      data-testid="nav-work-paper"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <span className="text-sidebar-foreground font-medium group-hover:text-foreground transition-colors">
                          Work Paper
                        </span>
                      </div>
                      {isWorkPaperOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-work-paper-list"
                        >
                          <Link
                            href="/work-papers"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Work Paper
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-work-paper-items"
                        >
                          <Link
                            href="/work-paper-items"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Items
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-work-paper-signatures"
                        >
                          <Link
                            href="/work-paper-signatures"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <CheckSquare className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Sign
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-3 rounded-lg group"
                  data-testid="nav-vaccines"
                >
                  <Link
                    href="/vaccines"
                    className="flex items-center space-x-3"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <span className="text-sidebar-foreground font-medium group-hover:text-foreground transition-colors">
                      Vaccine Recommendations
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible
                  open={isSettingsOpen}
                  onOpenChange={setIsSettingsOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-start hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-3 rounded-lg group"
                      data-testid="nav-settings"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <span className="text-sidebar-foreground font-medium group-hover:text-foreground transition-colors">
                          Settings
                        </span>
                      </div>
                      {isSettingsOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-organization"
                        >
                          <Link
                            href="/organization"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <Building className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Organization
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-permissions"
                        >
                          <Link
                            href="/permission"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Permissions
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-sidebar-accent hover:shadow-sm transition-all duration-200 px-4 py-2 rounded-lg group"
                          data-testid="nav-users"
                        >
                          <Link
                            href="/users"
                            className="flex items-center space-x-3"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <Users className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                            </div>
                            <span className="text-muted-foreground group-hover:text-sidebar-foreground transition-colors text-sm">
                              Users
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-white p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 px-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <Link
              href="/profile"
              className="flex-1 min-w-0 cursor-pointer hover:bg-sidebar-accent rounded px-2 py-1 transition-colors"
            >
              <p className="text-sm font-medium text-foreground truncate">
                {user?.first_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.username || "username"}
              </p>
            </Link>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent px-3"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
