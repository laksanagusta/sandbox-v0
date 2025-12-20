import { useState } from "react";
import { Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleTable } from "@/components/RoleTable";
import { RoleModal } from "@/components/RoleModal";

export default function RolePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <RoleTable 
        key={refreshKey} 
        className="flex-1" 
        onCreate={() => setIsCreateOpen(true)}
      />

      <RoleModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
