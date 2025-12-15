import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessTripTable } from "@/components/BusinessTripTable";
import { useLocation } from "wouter";

export default function BusinessTripListPage() {
  const [, setLocation] = useLocation();

  const handleCreateBusinessTrip = () => {
    setLocation("/kwitansi");
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold" data-testid="text-title">
                Business Trip Management
              </h1>
            </div>
            <Button onClick={handleCreateBusinessTrip}>
              <Plus className="w-4 h-4" />
              Buat Business Trip
            </Button>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <BusinessTripTable />
          </div>
        </div>
      </div>
    </div>
  );
}
