import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkPaperItemsTable } from "@/components/WorkPaperItemsTable";
import { useLocation } from "wouter";

export default function WorkPaperItemsListPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Work Paper Items Management</h1>
          </div>
          <Button
            onClick={() => setLocation("/work-paper-items/new")}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Work Paper Item</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <WorkPaperItemsTable />
      </div>
    </div>
  );
}