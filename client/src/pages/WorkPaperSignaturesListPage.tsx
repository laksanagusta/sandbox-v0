import { FileText, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkPaperSignaturesTable } from "@/components/WorkPaperSignaturesTable";

export default function WorkPaperSignaturesListPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <PenTool className="w-8 h-8 text-gray-600" />
            <h1 className="text-2xl font-semibold" data-testid="text-title">
              Need to Sign
            </h1>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <WorkPaperSignaturesTable />
          </div>
        </div>
      </div>
    </div>
  );
}
