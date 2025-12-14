import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { User, ArrowLeft, Save, Building, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getApiIdentityUrl } from "@/lib/env";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Organization {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  roles: Role[];
  organizations: Organization;
  created_at: string;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/users/${id}`,
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
          throw new Error("User tidak ditemukan");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      console.error("Error fetching user detail:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data user",
        variant: "destructive",
      });
      // Redirect back to list after error
      setTimeout(() => setLocation("/users"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: {
    username: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  }) => {
    if (!user) return;

    try {
      setIsSaving(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/users/${id}`,
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
      await fetchUserDetail();

      toast({
        title: "Berhasil!",
        description: "User berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui user",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

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

  if (!user) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">User tidak ditemukan</h2>
            <p className="text-gray-500 mb-4">User yang Anda cari tidak ditemukan atau telah dihapus</p>
            <Button onClick={() => setLocation("/users")}>
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
              <User className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold">Detail User</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                form="user-form"
                variant="default"
                disabled={isSaving || !user}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>

          {/* User Form */}
          <form
            id="user-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave({
                username: formData.get("username") as string,
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                phone_number: formData.get("phone_number") as string,
              });
            }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Informasi User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={user?.username || ""}
                      placeholder="Masukkan username"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_number">Nomor Telepon</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      defaultValue={user?.phone_number || ""}
                      placeholder="Masukkan nomor telepon"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nama Depan</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      defaultValue={user?.first_name || ""}
                      placeholder="Masukkan nama depan"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="last_name">Nama Belakang</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      defaultValue={user?.last_name || ""}
                      placeholder="Masukkan nama belakang"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Additional Information Cards */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Roles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.roles && user.roles.length > 0 ? (
                  <div className="space-y-2">
                    {user.roles.map((role) => (
                      <div key={role.id} className="space-y-1">
                        <Badge className="bg-purple-100 text-purple-800">
                          {role.name}
                        </Badge>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No roles assigned</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Organization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.organizations ? (
                  <div className="space-y-1">
                    <p className="font-medium">{user.organizations.name}</p>
                    <p className="text-sm text-gray-600">ID: {user.organizations.id}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No organization assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Sistem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">User ID</p>
                  <p className="text-gray-600 font-mono">{user.id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Tanggal Dibuat</p>
                  <p className="text-gray-600">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}