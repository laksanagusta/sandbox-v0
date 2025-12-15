import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkPaperItemsTable } from "@/components/WorkPaperItemsTable";
import { useLocation } from "wouter";

export default function WorkPaperItemsListPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold">
                Work Paper Items Management
              </h1>
            </div>
            <Button onClick={() => setLocation("/work-paper-items/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Work Paper Item
            </Button>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <WorkPaperItemsTable />
          </div>
        </div>
      </div>
    </div>
  );
}