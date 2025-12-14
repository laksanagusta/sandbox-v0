import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationTable } from "@/components/OrganizationTable";
import { useLocation } from "wouter";

export default function OrganizationPage() {
  const [, setLocation] = useLocation();

  const handleAddOrganization = () => {
    setLocation("/organization/new");
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold" data-testid="text-title">
                Organization Management
              </h1>
            </div>
            <Button onClick={handleAddOrganization}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Organization
            </Button>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <OrganizationTable />
          </div>
        </div>
      </div>
    </div>
  );
}