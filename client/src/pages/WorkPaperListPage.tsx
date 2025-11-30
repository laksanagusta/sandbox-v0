import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkPaperTable } from "@/components/WorkPaperTable";
import { useLocation } from "wouter";

export default function WorkPaperListPage() {
  const [, setLocation] = useLocation();

  const handleCreateWorkPaper = () => {
    setLocation("/work-papers/create");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Work Paper Management</h1>
          </div>
          <Button
            onClick={handleCreateWorkPaper}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Work Paper
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <WorkPaperTable />
      </div>
    </div>
  );
}