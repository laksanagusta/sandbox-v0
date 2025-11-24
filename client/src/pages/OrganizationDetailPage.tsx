import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Building, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TreeNode } from "@/components/OrganizationTreeNode";

interface Organization {
  id: string;
  name: string;
  address: string | null;
  type: string;
  organizations: Organization[] | null;
  created_at: string;
  created_by: string;
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const organizationTypes = [
    { value: "directorate", label: "Directorate" },
    { value: "division", label: "Division" },
    { value: "department", label: "Department" },
    { value: "unit", label: "Unit" },
  ];

  const fetchOrganizationDetail = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `http://localhost:5001/api/v1/organizations/${id}`,
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
          throw new Error("Organization tidak ditemukan");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const data = await response.json();
      setOrganization(data.data);
    } catch (error) {
      console.error("Error fetching organization detail:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data organization",
        variant: "destructive",
      });
      // Redirect back to list after error
      setTimeout(() => setLocation("/organization"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: { name: string; address: string; type: string }) => {
    if (!organization) return;

    try {
      setIsSaving(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `http://localhost:5001/api/v1/organizations/${id}`,
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
      await fetchOrganizationDetail();

      toast({
        title: "Berhasil!",
        description: "Organization berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui organization",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (id) {
      fetchOrganizationDetail();
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

  if (!organization) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Building className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Organization tidak ditemukan</h2>
            <p className="text-gray-500 mb-4">Organization yang Anda cari tidak ditemukan atau telah dihapus</p>
            <Button onClick={() => setLocation("/organization")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold">Detail Organization</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                form="organization-form"
                variant="default"
                disabled={isSaving || !organization}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>

          {/* Organization Form */}
          <form
            id="organization-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave({
                name: formData.get("name") as string,
                address: formData.get("address") as string,
                type: formData.get("type") as string,
              });
            }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Informasi Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Organization</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={organization?.name || ""}
                    placeholder="Masukkan nama organization"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipe Organization</Label>
                  <Select
                    name="type"
                    defaultValue={organization?.type || ""}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih tipe organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    name="address"
                    defaultValue={organization?.address || ""}
                    placeholder="Masukkan alamat organization"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Organization Tree */}
            {organization && organization.organizations && organization.organizations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Struktur Organization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <TreeNode
                      organization={organization}
                      level={0}
                      expandedNodes={expandedNodes}
                      onToggleNode={toggleNode}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}