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
  FileText,
  CheckSquare,
  BarChart3,
  ClipboardCheck,
  Home,

  Bell,
  UserCheck,
} from "lucide-react";
import { Link, useLocation } from "wouter";
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
import { canAccessBusinessTripVerifications, hasAnyAccess, hasAccess } from "@/utils/permissions";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBusinessTripOpen, setIsBusinessTripOpen] = useState(true);
  const [isWorkPaperOpen, setIsWorkPaperOpen] = useState(false);

  const isActiveRoute = (path: string) => {
    return location === path || location.startsWith(path + "/");
  };

  const isInSection = (paths: string[]) => {
    return paths.some(path => location === path || location.startsWith(path + "/"));
  };

  return (
    <Sidebar className="border-r border-gray-200">
      {/* Header - ClickUp Style */}
      <SidebarHeader className="bg-white px-4 h-16 border-b border-gray-100 flex items-center shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900">The Core</h1>
            </div>
          </div>

        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {/* GRC Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={`w-full justify-start px-3 py-2 rounded-md group transition-colors duration-150 ${
                    isActiveRoute('/grc')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  data-testid="nav-grc"
                >
                  <Link href="/grc" className="flex items-center space-x-3 flex-1">
                    <BarChart3 className={`w-4 h-4 ${
                      isActiveRoute('/grc')
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span className="text-sm font-medium">GRC Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Business Trip Section */}
              <SidebarMenuItem>
                <Collapsible
                  open={isBusinessTripOpen}
                  onOpenChange={setIsBusinessTripOpen}
                  defaultOpen={true}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`w-full justify-start px-3 py-2 rounded-md group transition-colors duration-150 ${
                        isInSection(['/business-trips', '/kwitansi', '/business-trip-verifications'])
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      data-testid="nav-business-trip"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Briefcase className={`w-4 h-4 ${
                          isInSection(['/business-trips', '/kwitansi', '/business-trip-verifications'])
                            ? 'text-blue-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        <span className="text-sm font-medium">
                          Business Trip
                        </span>
                      </div>
                      {isBusinessTripOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-4 mt-1 border-l-0 pl-4">
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/business-trips') && !location.includes('/report')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-business-trip-list"
                        >
                          <Link
                            href="/business-trips"
                            className="flex items-center space-x-3"
                          >
                            <Plane className={`w-4 h-4 ${
                              isActiveRoute('/business-trips') && !location.includes('/report')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Business Trip
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/business-trips/report')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-business-trip-report"
                        >
                          <Link
                            href="/business-trips/report"
                            className="flex items-center space-x-3"
                          >
                            <BarChart3 className={`w-4 h-4 ${
                              isActiveRoute('/business-trips/report')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Report
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/business-trip-verifications')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-business-trip-verifications"
                        >
                          <Link
                            href="/business-trip-verifications"
                            className="flex items-center space-x-3"
                          >
                            <ClipboardCheck className={`w-4 h-4 ${
                              isActiveRoute('/business-trip-verifications')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Verify
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Work Paper Section */}
              {hasAnyAccess(user, ["work-paper:read", "work-paper:write", "work-paper:update", "work-paper:delete"]) && (
              <SidebarMenuItem>
                <Collapsible
                  open={isWorkPaperOpen}
                  onOpenChange={setIsWorkPaperOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`w-full justify-start px-3 py-2 rounded-md group transition-colors duration-150 ${
                        isInSection(['/work-papers', '/work-paper-items', '/work-paper-signatures'])
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      data-testid="nav-work-paper"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <FileText className={`w-4 h-4 ${
                          isInSection(['/work-papers', '/work-paper-items', '/work-paper-signatures'])
                            ? 'text-blue-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        <span className="text-sm font-medium">
                          Work Paper
                        </span>
                      </div>
                      {isWorkPaperOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-4 mt-1 border-l-0 pl-4">
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/work-papers') && !location.includes('/create')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-work-paper-list"
                        >
                          <Link
                            href="/work-papers"
                            className="flex items-center space-x-3"
                          >
                            <FileText className={`w-4 h-4 ${
                              isActiveRoute('/work-papers') && !location.includes('/create')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Work Paper
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/work-paper-items')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-work-paper-items"
                        >
                          <Link
                            href="/work-paper-items"
                            className="flex items-center space-x-3"
                          >
                            <FileText className={`w-4 h-4 ${
                              isActiveRoute('/work-paper-items')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Items
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/work-paper-signatures')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-work-paper-signatures"
                        >
                          <Link
                            href="/work-paper-signatures"
                            className="flex items-center space-x-3"
                          >
                            <CheckSquare className={`w-4 h-4 ${
                              isActiveRoute('/work-paper-signatures')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Sign
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
              )}

              {/* Settings Section */}
              {hasAccess(user, "setting:read") && (
              <SidebarMenuItem>
                <Collapsible
                  open={isSettingsOpen}
                  onOpenChange={setIsSettingsOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`w-full justify-start px-3 py-2 rounded-md group transition-colors duration-150 ${
                        isInSection(['/organization', '/permission', '/users', '/roles', '/pending-users'])
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      data-testid="nav-settings"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Settings className={`w-4 h-4 ${
                          isInSection(['/organization', '/permission', '/users', '/roles'])
                            ? 'text-blue-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        <span className="text-sm font-medium">
                          Settings
                        </span>
                      </div>
                      {isSettingsOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-4 mt-1 border-l-0 pl-4">
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/organization')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-organization"
                        >
                          <Link
                            href="/organization"
                            className="flex items-center space-x-3"
                          >
                            <Building className={`w-4 h-4 ${
                              isActiveRoute('/organization')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Organization
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/permission')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-permissions"
                        >
                          <Link
                            href="/permission"
                            className="flex items-center space-x-3"
                          >
                            <Shield className={`w-4 h-4 ${
                              isActiveRoute('/permission')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Permissions
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/users')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-users"
                        >
                          <Link
                            href="/users"
                            className="flex items-center space-x-3"
                          >
                            <Users className={`w-4 h-4 ${
                              isActiveRoute('/users')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Users
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/pending-users')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-pending-users"
                        >
                          <Link
                            href="/pending-users"
                            className="flex items-center space-x-3"
                          >
                            <UserCheck className={`w-4 h-4 ${
                              isActiveRoute('/pending-users')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Pending Users
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            isActiveRoute('/roles')
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          data-testid="nav-roles"
                        >
                          <Link
                            href="/roles"
                            className="flex items-center space-x-3"
                          >
                            <Shield className={`w-4 h-4 ${
                              isActiveRoute('/roles')
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              Roles
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-white border-t border-gray-100 p-3">
        <div className="space-y-2">
          <Link
            href="/profile"
            className="flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.first_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">
                {user?.first_name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.username || "username"}
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">Keluar</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
