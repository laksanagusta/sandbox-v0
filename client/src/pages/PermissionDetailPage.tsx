import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Shield, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getApiIdentityUrl } from "@/lib/env";

interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
  created_at: string;
  created_by: string;
}

export default function PermissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const actionTypes = [
    { value: "read", label: "Read" },
    { value: "write", label: "Write" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
  ];

  const fetchPermissionDetail = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/permissions/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      // Handle response - http.StatusOK (200) dari Golang akan masuk ke sini
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        if (response.status === 404) {
          throw new Error("Permission tidak ditemukan");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const data = await response.json();
      setPermission(data.data);
    } catch (error) {
      console.error("Error fetching permission detail:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data permission",
        variant: "destructive",
      });
      // Redirect back to list after error
      setTimeout(() => setLocation("/permission"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: { name: string; action: string; resource: string }) => {
    if (!permission) return;

    try {
      setIsSaving(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/permissions/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      // Handle response - http.StatusOK (200) dari Golang akan masuk ke sini
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        throw new Error(`Gagal update data: ${response.status}`);
      }

      // Backend mengembalikan http.StatusOK ("OK"), bukan JSON
      // Refresh data setelah successful update
      await fetchPermissionDetail();

      toast({
        title: "Berhasil!",
        description: "Permission berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating permission:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui permission",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPermissionDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!permission) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Permission tidak ditemukan</h2>
            <p className="text-gray-500 mb-4">Permission yang Anda cari tidak ditemukan atau telah dihapus</p>
            <Button onClick={() => setLocation("/permission")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      read: "bg-blue-100 text-blue-800",
      write: "bg-green-100 text-green-800",
      update: "bg-yellow-100 text-yellow-800",
      delete: "bg-red-100 text-red-800",
    };

    const colorClass = colors[action] || "bg-gray-100 text-gray-800";
    return (
      <Badge className={colorClass}>
        {action}
      </Badge>
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold">Detail Permission</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                form="permission-form"
                variant="default"
                disabled={isSaving || !permission}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>

          {/* Permission Form */}
          <form
            id="permission-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave({
                name: formData.get("name") as string,
                action: formData.get("action") as string,
                resource: formData.get("resource") as string,
              });
            }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Informasi Permission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Permission</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={permission?.name || ""}
                    placeholder="Masukkan nama permission"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select
                    name="action"
                    defaultValue={permission?.action || ""}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih action" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resource">Resource</Label>
                  <Input
                    id="resource"
                    name="resource"
                    defaultValue={permission?.resource || ""}
                    placeholder="Masukkan resource (contoh: user, organization, workflow)"
                    className="mt-1"
                    required
                  />
                </div>

                {/* Display Current Action Badge */}
                <div>
                  <Label className="text-sm text-gray-600">Current Action</Label>
                  <div className="mt-1">
                    {getActionBadge(permission.action)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}