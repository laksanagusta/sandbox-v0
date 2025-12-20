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
    <div className="bg-background min-h-screen flex flex-col">
       <WorkPaperTable 
        className="flex-1"
        onCreate={handleCreateWorkPaper}
       />
    </div>
  );
}