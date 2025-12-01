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
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold">
                Work Paper Management
              </h1>
            </div>
            <Button onClick={handleCreateWorkPaper}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Work Paper
            </Button>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <WorkPaperTable />
          </div>
        </div>
      </div>
    </div>
  );
}