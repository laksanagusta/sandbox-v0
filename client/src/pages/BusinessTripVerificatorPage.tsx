import { CheckSquare } from "lucide-react";
import { BusinessTripVerificationTable } from "@/components/BusinessTripVerificationTable";

export default function BusinessTripVerificatorPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold" data-testid="text-title">
                Business Trip Verifications
              </h1>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <BusinessTripVerificationTable />
          </div>
        </div>
      </div>
    </div>
  );
}