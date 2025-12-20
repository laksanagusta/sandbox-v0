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
    <div className="bg-background min-h-screen flex flex-col">
      <OrganizationTable className="flex-1" onCreate={handleAddOrganization} />
    </div>
  );
}