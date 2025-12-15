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
    <div className="bg-background min-h-screen">
      <div className="w-full mx-auto px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold">Roles</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Role
              </Button>
            </div>
          </div>

          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleTable key={refreshKey} />
            </CardContent>
          </Card>

          <RoleModal
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSuccess={handleCreateSuccess}
          />
        </div>
      </div>
    </div>
  );
}
