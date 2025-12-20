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
    <div className="bg-background min-h-screen flex flex-col">
      <BusinessTripTable onCreate={handleCreateBusinessTrip} className="flex-1" />
    </div>
  );
}
