import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Building, ArrowLeft, Save, Check, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TreeNode } from "@/components/OrganizationTreeNode";
import { apiClient } from "@/lib/api-client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ParentOrganization {
  id: string;
  name: string;
  code: string;
  address: string | null;
  type: string;
}

interface Organization {
  id: string;
  name: string;
  code: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  type: string;
  parent?: ParentOrganization;
  parent_id?: string;
  organizations: Organization[] | null;
  created_at: string;
  created_by: string;
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = id === "new";
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [parentOrganizations, setParentOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [parentOrgPage, setParentOrgPage] = useState(1);
  const [hasMoreParentOrgs, setHasMoreParentOrgs] = useState(true);
  const [loadingParentOrgs, setLoadingParentOrgs] = useState(false);
  const [isOpenParentSelect, setIsOpenParentSelect] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>("none");
  const [selectedParentName, setSelectedParentName] = useState<string>("");
  const [parentOrgSearch, setParentOrgSearch] = useState("");

  const organizationTypes = [
    { value: "eselon_1", label: "Eselon 1" },
    { value: "eselon_2", label: "Eselon 2" },
    { value: "timker", label: "Tim Kerja" },
  ];

  const fetchOrganizationDetail = async () => {
    if (isNew) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.getOrganization(id!) as { data: Organization };
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

  const fetchParentOrganizations = async (page: number = 1, search: string = "") => {
    try {
      setLoadingParentOrgs(true);
      const data = await apiClient.getOrganizations({
        page,
        limit: 10,
        search,
      }) as {
        data: Organization[];
        metadata: {
          total_count: number;
          total_page: number;
          current_page: number;
        };
      };

      if (page === 1) {
        setParentOrganizations(data.data || []);
      } else {
        setParentOrganizations(prev => [...prev, ...(data.data || [])]);
      }

      setParentOrgPage(page);
      setHasMoreParentOrgs(data.metadata?.current_page < data.metadata?.total_page);
    } catch (error) {
      console.error("Error fetching parent organizations:", error);
    } finally {
      setLoadingParentOrgs(false);
    }
  };

  const handleScrollParentSelect = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMoreParentOrgs && !loadingParentOrgs) {
      const nextPage = parentOrgPage + 1;
      setParentOrgPage(nextPage);
      fetchParentOrganizations(nextPage, parentOrgSearch);
    }
  };

  // Debounce parent org search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpenParentSelect) {
        setParentOrgPage(1);
        setParentOrganizations([]);
        setHasMoreParentOrgs(true);
        fetchParentOrganizations(1, parentOrgSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [parentOrgSearch]);

  // Fetch parent orgs when dropdown opens
  useEffect(() => {
    if (isOpenParentSelect && parentOrganizations.length === 0) {
      fetchParentOrganizations(1, "");
    }
  }, [isOpenParentSelect]);

  const handleSave = async (formData: {
    name: string;
    code: string;
    address: string;
    latitude: string;
    longitude: string;
    type: string;
    parent_id?: string;
  }) => {
    try {
      setIsSaving(true);

      if (isNew) {
        // Create new organization
        const payload = {
          name: formData.name,
          code: formData.code || "",
          address: formData.address || "123 Main Street",
          latitude: formData.latitude || "-6.200000",
          longitude: formData.longitude || "106.816666",
          type: formData.type,
          parent_id: formData.parent_id && formData.parent_id !== "none" ? formData.parent_id : undefined,
        };

        await apiClient.createOrganization(payload);

        toast({
          title: "Berhasil!",
          description: "Organization berhasil dibuat",
        });

        // Redirect to organization list
        setTimeout(() => setLocation("/organization"), 1500);
      } else {
        // Update existing organization
        if (!organization) return;

        await apiClient.updateOrganization(id!, formData);

        // Refresh data setelah successful update
        await fetchOrganizationDetail();

        toast({
          title: "Berhasil!",
          description: "Organization berhasil diperbarui",
        });
      }
    } catch (error) {
      console.error("Error saving organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Gagal ${isNew ? "membuat" : "memperbarui"} organization`,
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
      fetchParentOrganizations(1, "");
    }
  }, [id]);

  const fetchParentName = async (parentId: string) => {
    try {
      const parentData = await apiClient.getOrganization(parentId) as { data: Organization };
      setSelectedParentName(parentData.data.name || "");
    } catch (error) {
      console.error("Error fetching parent name:", error);
      setSelectedParentName("");
    }
  };

  useEffect(() => {
    if (organization?.parent) {
      // Use parent data from API response
      setSelectedParentId(organization.parent.id);
      setSelectedParentName(organization.parent.name);
    } else if (organization?.parent_id) {
      // Fallback for backward compatibility
      setSelectedParentId(organization.parent_id);
      setSelectedParentName(""); // Reset first

      // Try to find parent in loaded list
      const parentInList = parentOrganizations.find(org => org.id === organization.parent_id);
      if (parentInList) {
        setSelectedParentName(parentInList.name);
      } else {
        // Fetch parent name if not in list
        fetchParentName(organization.parent_id);
      }
    } else if (!isNew) {
      setSelectedParentId("none");
      setSelectedParentName("");
    }
  }, [organization?.parent, organization?.parent_id, organization?.name, isNew, parentOrganizations]);

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

  if (!organization && !isNew) {
    return (
      <div className="bg-background min-h-screen">
        <div className="w-full mx-auto px-8 py-8">
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
    <div className="bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-white z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/organization")}
            className="p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back</span>
          </Button>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              {isNew ? "Tambah Organization" : "Detail Organization"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            form="organization-form"
            variant="default"
            disabled={isSaving}
            size="sm"
            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-3.5 h-3.5 mr-2" />
            {isSaving ? "Menyimpan..." : (isNew ? "Buat" : "Simpan")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
        <div className="w-full space-y-6">
          {/* Organization Form */}
          <form
            id="organization-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const submitData = {
                name: formData.get("name") as string,
                code: formData.get("code") as string,
                address: formData.get("address") as string,
                latitude: formData.get("latitude") as string,
                longitude: formData.get("longitude") as string,
                type: formData.get("type") as string,
                parent_id: selectedParentId && selectedParentId !== "none" ? selectedParentId : undefined,
              };
              handleSave(submitData);
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
                  <Label htmlFor="code">Kode Organization</Label>
                  <Input
                    id="code"
                    name="code"
                    defaultValue={organization?.code || ""}
                    placeholder="Masukkan kode organization"
                    className="mt-1"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      defaultValue={organization?.latitude || ""}
                      placeholder="Contoh: -6.200000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      defaultValue={organization?.longitude || ""}
                      placeholder="Contoh: 106.816666"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="parent_id">Parent Organization</Label>
                  <input
                    type="hidden"
                    name="parent_id"
                    value={selectedParentId}
                  />
                  <Popover open={isOpenParentSelect} onOpenChange={setIsOpenParentSelect}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between mt-1"
                      >
                        {selectedParentId === "none"
                          ? "Pilih parent organization (opsional)"
                          : parentOrganizations.find(org => org.id === selectedParentId)?.name ||
                            selectedParentName ||
                            selectedParentId ||
                            "Loading parent..."
                        }
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Cari parent organization..." 
                          value={parentOrgSearch}
                          onValueChange={setParentOrgSearch}
                        />
                        <CommandList 
                          className="max-h-[300px] overflow-y-auto" 
                          onScroll={handleScrollParentSelect}
                        >
                          <CommandEmpty>
                            {loadingParentOrgs ? "Loading..." : "Tidak ada parent organization."}
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => {
                                setSelectedParentId("none");
                                setSelectedParentName("");
                                setIsOpenParentSelect(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedParentId === "none" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Tidak ada parent
                            </CommandItem>
                            {parentOrganizations
                              .filter(org => {
                                if (isNew) return true;
                                return org.id !== organization?.id;
                              })
                              .map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.id}
                                  onSelect={() => {
                                    setSelectedParentId(org.id);
                                    setSelectedParentName(org.name);
                                    setIsOpenParentSelect(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedParentId === org.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {org.name}
                                </CommandItem>
                              ))}
                            {loadingParentOrgs && (
                              <div className="p-2 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Organization Tree - Only show for existing organizations */}
            {!isNew && organization && organization.organizations && organization.organizations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Struktur Organization</CardTitle>
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