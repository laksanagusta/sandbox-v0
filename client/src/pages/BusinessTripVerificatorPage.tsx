import { CheckSquare } from "lucide-react";
import { BusinessTripVerificationTable } from "@/components/BusinessTripVerificationTable";

export default function BusinessTripVerificatorPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <BusinessTripVerificationTable className="flex-1" />
    </div>
  );
}