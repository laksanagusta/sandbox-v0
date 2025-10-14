import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 p-8">
          <h2 className="text-lg font-semibold mb-4">Main Content Area</h2>
          <p className="text-muted-foreground">This is where the main content would appear.</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
