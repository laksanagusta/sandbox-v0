import { Plane } from "lucide-react";
import { Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
      {/* Header dengan logo yang sederhana */}
      <SidebarHeader className="bg-gray-100 border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">The Core</h1>
            <p className="text-xs text-gray-500">v0</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation yang seragam */}
      <SidebarContent className="bg-gray-100">
        <SidebarGroup className="px-4 py-6">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
              General
            </h3>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="w-full justify-start hover:bg-white hover:shadow-sm transition-all duration-200 px-4 py-3 rounded-lg group"
                  data-testid="nav-kwitansi"
                >
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Plane className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                      Perjadin
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
