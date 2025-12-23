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
  MessageSquare,
  Bell,
  UserCheck,
  Database,
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
  const [isGRCOpen, setIsGRCOpen] = useState(true);
  const [isWorkPaperOpen, setIsWorkPaperOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(true);

  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => role.name === "Super Admin") ?? false;

  const isActiveRoute = (path: string) => {
    return location === path || location.startsWith(path + "/");
  };

  const isInSection = (paths: string[]) => {
    return paths.some(path => location === path || location.startsWith(path + "/"));
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* Header - Linear Style Workspace Switcher */}
      <SidebarHeader className="bg-white px-3 h-12 flex items-center shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-between px-2 h-9 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-black">Orion</span>
          </div>
        </Button>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {/* GRC Dashboard */}
              {/* GRC Section */}
              <SidebarMenuItem>
                <Collapsible
                  open={isGRCOpen}
                  onOpenChange={setIsGRCOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`w-full justify-start px-3 py-2 rounded-md group transition-colors duration-150 ${
                        isInSection(['/grc'])
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                      data-testid="nav-grc"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Shield className={`w-4 h-4 ${
                          isInSection(['/grc'])
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
                        }`} />
                        <span className="text-sm font-medium">
                          GRC
                        </span>
                      </div>
                      {isGRCOpen ? (
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
                            isActiveRoute('/grc')
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-grc-dashboard"
                        >
                          <Link
                            href="/grc"
                            className="flex items-center space-x-3"
                          >
                            <BarChart3 className={`w-4 h-4 ${
                              isActiveRoute('/grc')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
                            }`} />
                            <span className="text-sm">
                              Dashboard
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* AI Assistant Section */}
              <SidebarMenuItem>
                <Collapsible
                  open={isAIAssistantOpen}
                  onOpenChange={setIsAIAssistantOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`w-full justify-start px-3 py-2 rounded-md group transition-colors duration-150 ${
                        isInSection(['/chatbot'])
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                      data-testid="nav-ai-assistant"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <MessageSquare className={`w-4 h-4 ${
                          isInSection(['/chatbot'])
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
                        }`} />
                        <span className="text-sm font-medium">
                          AI Assistant
                        </span>
                      </div>
                      {isAIAssistantOpen ? (
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
                            isActiveRoute('/chatbot') && !location.includes('/knowledge-bases')
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-chatbot-chat"
                        >
                          <Link
                            href="/chatbot"
                            className="flex items-center space-x-3"
                          >
                            <MessageSquare className={`w-4 h-4 ${
                              isActiveRoute('/chatbot') && !location.includes('/knowledge-bases')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
                            }`} />
                            <span className="text-sm">
                              Chat
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {isSuperAdmin && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            className={`px-3 py-1.5 rounded-md transition-colors duration-150 ${
                              isActiveRoute('/chatbot/knowledge-bases')
                                ? 'bg-sidebar-accent text-sidebar-primary'
                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            }`}
                            data-testid="nav-knowledge-bases"
                          >
                            <Link
                              href="/chatbot/knowledge-bases"
                              className="flex items-center space-x-3"
                            >
                              <Database className={`w-4 h-4 ${
                                isActiveRoute('/chatbot/knowledge-bases')
                                  ? 'text-sidebar-primary'
                                  : 'text-muted-foreground'
                              }`} />
                              <span className="text-sm">
                                Knowledge
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
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
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                      data-testid="nav-business-trip"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Briefcase className={`w-4 h-4 ${
                          isInSection(['/business-trips', '/kwitansi', '/business-trip-verifications'])
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-business-trip-list"
                        >
                          <Link
                            href="/business-trips"
                            className="flex items-center space-x-3"
                          >
                            <Plane className={`w-4 h-4 ${
                              isActiveRoute('/business-trips') && !location.includes('/report')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-business-trip-report"
                        >
                          <Link
                            href="/business-trips/report"
                            className="flex items-center space-x-3"
                          >
                            <BarChart3 className={`w-4 h-4 ${
                              isActiveRoute('/business-trips/report')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-business-trip-verifications"
                        >
                          <Link
                            href="/business-trip-verifications"
                            className="flex items-center space-x-3"
                          >
                            <ClipboardCheck className={`w-4 h-4 ${
                              isActiveRoute('/business-trip-verifications')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                      data-testid="nav-work-paper"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <FileText className={`w-4 h-4 ${
                          isInSection(['/work-papers', '/work-paper-items', '/work-paper-signatures'])
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-work-paper-list"
                        >
                          <Link
                            href="/work-papers"
                            className="flex items-center space-x-3"
                          >
                            <FileText className={`w-4 h-4 ${
                              isActiveRoute('/work-papers') && !location.includes('/create')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-work-paper-items"
                        >
                          <Link
                            href="/work-paper-items"
                            className="flex items-center space-x-3"
                          >
                            <FileText className={`w-4 h-4 ${
                              isActiveRoute('/work-paper-items')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-work-paper-signatures"
                        >
                          <Link
                            href="/work-paper-signatures"
                            className="flex items-center space-x-3"
                          >
                            <CheckSquare className={`w-4 h-4 ${
                              isActiveRoute('/work-paper-signatures')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                      data-testid="nav-settings"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Settings className={`w-4 h-4 ${
                          isInSection(['/organization', '/permission', '/users', '/roles'])
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground group-hover:text-sidebar-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-organization"
                        >
                          <Link
                            href="/organization"
                            className="flex items-center space-x-3"
                          >
                            <Building className={`w-4 h-4 ${
                              isActiveRoute('/organization')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-permissions"
                        >
                          <Link
                            href="/permission"
                            className="flex items-center space-x-3"
                          >
                            <Shield className={`w-4 h-4 ${
                              isActiveRoute('/permission')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-users"
                        >
                          <Link
                            href="/users"
                            className="flex items-center space-x-3"
                          >
                            <Users className={`w-4 h-4 ${
                              isActiveRoute('/users')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-pending-users"
                        >
                          <Link
                            href="/pending-users"
                            className="flex items-center space-x-3"
                          >
                            <UserCheck className={`w-4 h-4 ${
                              isActiveRoute('/pending-users')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                          data-testid="nav-roles"
                        >
                          <Link
                            href="/roles"
                            className="flex items-center space-x-3"
                          >
                            <Shield className={`w-4 h-4 ${
                              isActiveRoute('/roles')
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
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

      <SidebarFooter className="bg-white border-t border-sidebar-border p-3">
        <div className="space-y-2">
          <Link
            href="/profile"
            className="flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer group"
          >
            <div 
              className="w-8 h-8 rounded-full"
              style={{
                background: user?.avatar_gradient_start && user?.avatar_gradient_end
                  ? `linear-gradient(135deg, ${user.avatar_gradient_start} 0%, ${user.avatar_gradient_end} 100%)`
                  : 'hsl(var(--primary))'
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate group-hover:text-foreground">
                {user?.first_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.username || "username"}
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent px-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">Keluar</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
