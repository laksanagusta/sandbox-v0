import { useState, useEffect } from "react";
import {
  User,
  ArrowLeft,
  Save,
  Shield,
  Phone,
  Mail,
  Calendar,
  Building,
  Lock,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getApiIdentityUrl } from "@/lib/env";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  uuid: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

interface Organization {
  uuid: string;
  name: string;
}

interface UserProfile {
  id: string;
  employee_id?: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  avatar_gradient_start?: string;
  avatar_gradient_end?: string;
  role: Role[];  // API returns 'role' not 'roles'
  organization: Organization;  // API returns 'organization' not 'organizations'
  created_at: string;
  updated_at?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      // Gunakan user ID dari auth context
      const userId = user?.id;
      if (!userId) {
        throw new Error("User ID tidak ditemukan.");
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/users/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        if (response.status === 404) {
          throw new Error("Profile tidak ditemukan");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: FormData) => {
    if (!profile) return;

    try {
      setIsSaving(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const updateData = {
        username: formData.get("username") as string,
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        phone_number: formData.get("phone_number") as string,
      };

      // Validasi sederhana
      if (!updateData.username || updateData.username.length < 3) {
        throw new Error("Username minimal 3 karakter");
      }
      if (!updateData.first_name || !updateData.last_name) {
        throw new Error("Nama depan dan belakang wajib diisi");
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/users/${profile.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Data yang dimasukkan tidak valid"
          );
        }
        throw new Error(`Gagal update data: ${response.status}`);
      }

      // Refresh data setelah successful update
      await fetchProfile();
      setIsEditing(false);

      toast({
        title: "Berhasil!",
        description: "Profile berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal memperbarui profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile) return;

    try {
      setIsChangingPassword(true);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      // Validasi password
      if (!oldPassword || oldPassword.length < 1) {
        throw new Error("Password lama wajib diisi");
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password baru minimal 6 karakter");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Password baru dan konfirmasi password tidak cocok");
      }

      const passwordData = {
        old_password: oldPassword,
        new_password: newPassword,
      };

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/users/${profile.id}/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(passwordData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Data password tidak valid"
          );
        }
        if (response.status === 403) {
          throw new Error("Password lama tidak sesuai");
        }
        throw new Error(`Gagal mengubah password: ${response.status}`);
      }

      // Reset form dan tutup modal
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);

      toast({
        title: "Berhasil!",
        description: "Password berhasil diubah",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengubah password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
        <div className="w-full mx-auto px-8 py-8">
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

  if (!profile) {
    return (
      <div className="bg-background min-h-screen">
        <div className="w-full mx-auto px-8 py-8">
          <div className="text-center">
            <User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Profile tidak ditemukan
            </h2>
            <p className="text-gray-500 mb-4">
              Profile Anda tidak dapat dimuat
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleSave(formData);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="w-full mx-auto px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-gray-600" />
              <h1 className="text-2xl font-semibold">Profile Saya</h1>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  variant="default"
                >
                  <Save className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form to original values
                      fetchProfile();
                    }}
                    variant="outline"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    form="profile-form"
                    variant="default"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form
            id="profile-form"
            onSubmit={handleFormSubmit}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informasi Pribadi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={profile?.username || ""}
                      placeholder="Masukkan username"
                      className="mt-1"
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_number">Nomor Telepon</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      defaultValue={profile?.phone_number || ""}
                      placeholder="Masukkan nomor telepon"
                      className="mt-1"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nama Depan</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      defaultValue={profile?.first_name || ""}
                      placeholder="Masukkan nama depan"
                      className="mt-1"
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="last_name">Nama Belakang</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      defaultValue={profile?.last_name || ""}
                      placeholder="Masukkan nama belakang"
                      className="mt-1"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      defaultValue={profile?.email || ""}
                      placeholder="Email tidak tersedia"
                      className="mt-1"
                      disabled
                      type="email"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email tidak dapat diubah
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="display_name">Nama Lengkap</Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      value={`${profile?.first_name || ""} ${
                        profile?.last_name || ""
                      }`}
                      className="mt-1"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Hasil dari nama depan + belakang
                    </p>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Keamanan</h4>
                      <p className="text-sm text-gray-500">Kelola password Anda</p>
                    </div>
                    <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                      <DialogTrigger asChild>
                        <Button variant="outline" type="button">
                          <Key className="w-4 h-4" />
                          Ganti Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Lock className="w-5 h-5" />
                            <span>Ganti Password</span>
                          </DialogTitle>
                          <DialogDescription>
                            Masukkan password lama dan password baru Anda untuk mengubah password.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="old_password">Password Lama</Label>
                            <div className="relative">
                              <Input
                                id="old_password"
                                type={showPasswords.old ? "text" : "password"}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Masukkan password lama"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() =>
                                  setShowPasswords(prev => ({ ...prev, old: !prev.old }))
                                }
                              >
                                {showPasswords.old ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="new_password">Password Baru</Label>
                            <div className="relative">
                              <Input
                                id="new_password"
                                type={showPasswords.new ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Masukkan password baru (min. 6 karakter)"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() =>
                                  setShowPasswords(prev => ({ ...prev, new: !prev.new }))
                                }
                              >
                                {showPasswords.new ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
                            <div className="relative">
                              <Input
                                id="confirm_password"
                                type={showPasswords.confirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Masukkan kembali password baru"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() =>
                                  setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))
                                }
                              >
                                {showPasswords.confirm ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                              <p className="text-sm text-red-600">
                                Password baru tidak cocok
                              </p>
                            )}
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowChangePassword(false);
                              setOldPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                          >
                            Batal
                          </Button>
                          <Button
                            type="button"
                            onClick={handleChangePassword}
                            disabled={
                              !oldPassword ||
                              !newPassword ||
                              newPassword.length < 6 ||
                              newPassword !== confirmPassword ||
                              isChangingPassword
                            }
                          >
                            <Key className="w-4 h-4" />
                            {isChangingPassword ? "Mengubah..." : "Ubah Password"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Role and Organization Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Roles & Permissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.role && profile.role.length > 0 ? (
                  <div className="space-y-4">
                    {profile.role.map((role: Role) => (
                      <div key={role.uuid} className="space-y-3 border rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              {role.name}
                            </Badge>
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-600">
                              {role.description}
                            </p>
                          )}
                        </div>
                        
                        {role.permissions && role.permissions.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-xs font-medium text-gray-500 mb-2">Permissions:</p>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions.map((permission: Permission) => (
                                <Badge 
                                  key={permission.id} 
                                  variant="outline" 
                                  className="text-xs"
                                  title={permission.description}
                                >
                                  {permission.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">
                      Tidak ada role yang ditetapkan
                    </p>
                  </div>
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
                {profile.organization ? (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <p className="font-medium">
                      {profile.organization.name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Building className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">
                      Tidak ada organisasi yang ditetapkan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
