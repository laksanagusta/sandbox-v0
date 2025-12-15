import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTable } from "@/components/UserTable";

export default function UserPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="w-full mx-auto px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold" data-testid="text-title">
                User Management
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Users</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}