import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkPaperItemsTable } from "@/components/WorkPaperItemsTable";
import { useLocation } from "wouter";

export default function WorkPaperItemsListPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-background min-h-screen flex flex-col">
       <WorkPaperItemsTable 
        className="flex-1"
        onCreate={() => setLocation("/work-paper-items/new")}
       />
    </div>
  );
}