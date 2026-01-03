import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Plus,
  X,
  User,
  Mail,
  Briefcase,
  Save,
  Loader2,
  FileText,
} from "lucide-react";
import { TopicSelector } from "@/components/TopicSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

interface Organization {
  id: string;
  name: string;
  code?: string;
}

interface User {
  id: string;
  employee_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  roles: {
    id: string;
    name: string;
    description: string;
  }[];
  organizations: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface Signer {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  signature_type: "digital" | "manual" | "approval";
}

interface NewWorkPaper {
  organization_id: string;
  name?: string;
  year: number;
  semester: number;
  signers: Signer[];
  topic_ids?: string[];
}

export default function WorkPaperCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [organizationId, setOrganizationId] = useState("");
  const [workPaperName, setWorkPaperName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState(1);
  const [signers, setSigners] = useState<Signer[]>([]);

  // Topic states
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Search states for dropdowns
  const [orgSearch, setOrgSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");

  // Get current user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setOrganizationId(user.organization_id || "");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Debounce user search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [userSearch]);

  // Load users when debounced search term changes
  useEffect(() => {
    loadUsers(debouncedUserSearch);
  }, [debouncedUserSearch]);

  // Don't load organizations/users on mount anymore - load when dropdown opens

  const loadOrganizations = async (searchTerm?: string) => {
    try {
      setIsLoadingOrgs(true);
      const params: any = {
        page: 1,
        limit: 50,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = (await apiClient.getOrganizations(params)) as any;
      setOrganizations(response.data || []);
    } catch (error) {
      console.error("Error loading organizations:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data organisasi",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrgs(false);
    }
  };



  const loadUsers = async (searchTerm?: string) => {
    try {
      setIsLoadingUsers(true);
      const params: any = {
        page: 1,
        limit: 50,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = (await apiClient.getUsers(params)) as any;
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Create a debounced version of loadUsers for SearchableSelect
  const loadUsersDebounced = (searchTerm: string) => {
    setUserSearch(searchTerm);
  };

  const updateSigner = (signerId: string, updates: Partial<Signer>) => {
    setSigners(
      signers.map((signer) =>
        signer.id === signerId ? { ...signer, ...updates } : signer
      )
    );
  };

  const addNewSigner = () => {
    const newSigner: Signer = {
      id: Date.now().toString(),
      user_id: "",
      user_name: "",
      user_email: "",
      user_role: "",
      signature_type: "digital",
    };
    setSigners([...signers, newSigner]);
  };

  const removeSigner = (id: string) => {
    setSigners(signers.filter((signer) => signer.id !== id));
  };

  const handleCreateWorkPaper = async () => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization harus dipilih",
        variant: "destructive",
      });
      return;
    }

    if (signers.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada satu signer",
        variant: "destructive",
      });
      return;
    }



    if (!selectedTopicId) {
      toast({
        title: "Error",
        description: "Pilih topik work paper terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Validate all signers have required data
    const invalidSigner = signers.find(
      (s) => !s.user_name || !s.user_email || !s.user_role
    );
    if (invalidSigner) {
      toast({
        title: "Error",
        description:
          "Semua signer harus memiliki nama, email, dan role yang lengkap",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);

      const workPaperData: NewWorkPaper = {
        organization_id: organizationId,
        name: workPaperName.trim() || undefined,
        year: year,
        semester: semester,
        signers: signers.map((signer) => ({
          id: signer.id,
          user_id: signer.user_id,
          user_name: signer.user_name,
          user_email: signer.user_email,
          user_role: signer.user_role,
          signature_type: signer.signature_type,
        })),
        topic_ids: [selectedTopicId],
      };

      const response = (await apiClient.createWorkPaper(workPaperData)) as any;

      toast({
        title: "Success",
        description: "Work Paper berhasil dibuat",
      });

      // Redirect to work paper list
      setLocation("/work-papers");
    } catch (error) {
      console.error("Error creating work paper:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal membuat work paper",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const signatureTypeLabels = {
    digital: "Digital Signature",
    manual: "Manual Signature",
    approval: "Approval Only",
  };

  const signatureTypeColors = {
    digital: "bg-blue-100 text-blue-800",
    manual: "bg-orange-100 text-orange-800",
    approval: "bg-green-100 text-green-800",
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/work-papers")}
                className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </Button>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-gray-600" />
                <div>
                  <h1 className="text-2xl font-semibold">
                    Buat Work Paper Baru
                  </h1>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateWorkPaper}
                disabled={
                  isCreating ||
                  !organizationId ||
                  !organizationId ||
                  signers.length === 0 ||
                  !selectedTopicId
                }
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Membuat...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Buat Work Paper</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Card: Lingkup Kerja */}
          <Card>
            <CardHeader>
              <CardTitle>Lingkup Kerja</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tentukan topik dan organisasi untuk work paper ini
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Topik
                  </Label>
                  <div className="mt-1">
                    <TopicSelector
                      value={selectedTopicId}
                      onValueChange={setSelectedTopicId}
                      placeholder="Pilih topik work paper..."
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Work paper notes akan dibuat otomatis berdasarkan items
                      dari topik yang dipilih.
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Organisasi
                  </Label>
                  <SearchableSelect
                    value={organizationId}
                    onValueChange={setOrganizationId}
                    placeholder="Pilih organisasi"
                    disabled={isLoadingOrgs}
                    loading={isLoadingOrgs}
                    options={organizations.map((org) => ({
                      value: org.id,
                      label: org.name,
                      subtitle: org.code,
                    }))}
                    onSearch={loadOrganizations}
                    searchPlaceholder="Cari organisasi..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Periode & Identitas */}
          <Card>
            <CardHeader>
              <CardTitle>Periode & Identitas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Lengkapi informasi periode audit
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Tahun
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) =>
                      setYear(
                        parseInt(e.target.value) ||
                          new Date().getFullYear()
                      )
                    }
                    min="2020"
                    max="2030"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Semester
                  </Label>
                  <Select
                    value={semester.toString()}
                    onValueChange={(value) =>
                      setSemester(parseInt(value))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"1"}>Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Nama (Optional)
                  </Label>
                  <Input
                    id="name"
                    value={workPaperName}
                    onChange={(e) => setWorkPaperName(e.target.value)}
                    placeholder={`Work Paper ${year} S${semester}`}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signers Management Card */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Signers</CardTitle>
              <p className="text-sm text-muted-foreground">
                Atur pihak yang terlibat dalam persetujuan
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Signer Rows */}
              {signers.map((signer, index) => (
                <div
                  key={signer.id}
                  className="border rounded-lg p-4 space-y-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Penandatangan #{index + 1}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSigner(signer.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Pilih User
                      </Label>
                      <SearchableSelect
                        value={signer.user_id}
                        onValueChange={(value) => {
                          const selectedUser = users.find(
                            (user) => user.id === value
                          );
                          if (selectedUser) {
                            updateSigner(signer.id, {
                              user_id: selectedUser.id,
                              user_name: `${selectedUser.first_name} ${selectedUser.last_name}`,
                              user_email: selectedUser.phone_number,
                              user_role: selectedUser.roles[0]?.name || "Staff",
                            });
                          }
                        }}
                        placeholder="Pilih user"
                        disabled={isLoadingUsers}
                        loading={isLoadingUsers}
                        options={users.map((user) => ({
                          value: user.id,
                          label: `${user.first_name} ${user.last_name}`,
                          subtitle: user.username,
                        }))}
                        onSearch={loadUsersDebounced}
                        searchPlaceholder="Cari user..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Nama Lengkap
                      </Label>
                      <Input
                        value={signer.user_name}
                        onChange={(e) =>
                          updateSigner(signer.id, { user_name: e.target.value })
                        }
                        placeholder="Masukkan nama"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={signer.user_email}
                        onChange={(e) =>
                          updateSigner(signer.id, {
                            user_email: e.target.value,
                          })
                        }
                        placeholder="email@example.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Role/Jabatan
                      </Label>
                      <Input
                        value={signer.user_role}
                        onChange={(e) =>
                          updateSigner(signer.id, { user_role: e.target.value })
                        }
                        placeholder="Manager, Auditor, dll"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Tipe Tanda Tangan
                      </Label>
                      <Select
                        value={signer.signature_type}
                        onValueChange={(
                          value: "digital" | "manual" | "approval"
                        ) => {
                          updateSigner(signer.id, { signature_type: value });
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">
                            Digital Signature
                          </SelectItem>
                          <SelectItem value="manual">
                            Manual Signature
                          </SelectItem>
                          <SelectItem value="approval">
                            Approval Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          signatureTypeColors[signer.signature_type]
                        }`}
                      >
                        {signatureTypeLabels[signer.signature_type]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Signer Button */}
              <div className="pt-4">
                <Button
                  onClick={addNewSigner}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Signer Baru</span>
                </Button>
              </div>

              {/* Signers Summary */}
              {signers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Ringkasan Signers
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Total {signers.length} signer akan ditambahkan ke work
                        paper ini
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(
                          signers.reduce((acc, signer) => {
                            acc[signer.signature_type] =
                              (acc[signer.signature_type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <span
                            key={type}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              signatureTypeColors[
                                type as keyof typeof signatureTypeColors
                              ]
                            }`}
                          >
                            {
                              signatureTypeLabels[
                                type as keyof typeof signatureTypeLabels
                              ]
                            }
                            : {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
