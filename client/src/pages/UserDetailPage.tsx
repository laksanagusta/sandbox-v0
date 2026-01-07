import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { User, ArrowLeft, Save, Building, Shield, Phone, Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getApiIdentityUrl } from "@/lib/env";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Role {
  uuid: string;
  name: string;
  description?: string;
}

interface Organization {
  uuid: string;
  name: string;
}

interface UserData {
  id: string;
  employee_id?: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: Role[];
  organization: Organization;
  created_at: string;
}

// Role from list API uses 'id'
interface RoleListItem {
  id: string;
  name: string;
  description: string;
}

interface RoleResponse {
  data: RoleListItem[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface OrganizationListItem {
  id: string;
  name: string;
}

interface OrganizationResponse {
  data: OrganizationListItem[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Role Selection State
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [rolePage, setRolePage] = useState(1);
  const [roleSearch, setRoleSearch] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [hasMoreRoles, setHasMoreRoles] = useState(true);
  const [roleOpen, setRoleOpen] = useState(false);

  // Organization Selection State
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [orgPage, setOrgPage] = useState(1);
  const [orgSearch, setOrgSearch] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [hasMoreOrgs, setHasMoreOrgs] = useState(true);
  const [orgOpen, setOrgOpen] = useState(false);

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
      // Initialize selectedRoleIds from user's roles
      if (data.data.role) {
        setSelectedRoleIds(data.data.role.map((r: Role) => r.uuid));
      }
      // Initialize selectedOrgId from user's organization
      if (data.data.organization) {
        setSelectedOrgId(data.data.organization.uuid);
      }
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

  const fetchRoles = async (page: number, search: string) => {
    try {
      setLoadingRoles(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sort: "name asc",
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/roles/list?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch roles");

      const result: RoleResponse = await response.json();
      
      setRoles(prev => page === 1 ? result.data : [...prev, ...result.data]);
      setHasMoreRoles(page < result.total_pages);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchOrgs = async (page: number, search: string) => {
    try {
      setLoadingOrgs(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sort: "name asc",
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/organizations?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch organizations");

      const result: OrganizationResponse = await response.json();
      
      setOrgs(prev => page === 1 ? result.data : [...prev, ...result.data]);
      setHasMoreOrgs(page < result.total_pages);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleRoleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMoreRoles && !loadingRoles) {
      const nextPage = rolePage + 1;
      setRolePage(nextPage);
      fetchRoles(nextPage, roleSearch);
    }
  };

  const handleOrgScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMoreOrgs && !loadingOrgs) {
      const nextPage = orgPage + 1;
      setOrgPage(nextPage);
      fetchOrgs(nextPage, orgSearch);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId) 
        : [...prev, roleId]
    );
  };

  // Debounce role search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (roleOpen) {
        setRolePage(1);
        setRoles([]);
        setHasMoreRoles(true);
        fetchRoles(1, roleSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [roleSearch]);

  // Debounce org search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (orgOpen) {
        setOrgPage(1);
        setOrgs([]);
        setHasMoreOrgs(true);
        fetchOrgs(1, orgSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [orgSearch]);

  // Fetch roles when dropdown opens
  useEffect(() => {
    if (roleOpen && roles.length === 0) {
      fetchRoles(1, "");
    }
  }, [roleOpen]);

  // Fetch orgs when dropdown opens
  useEffect(() => {
    if (orgOpen && orgs.length === 0) {
      fetchOrgs(1, "");
    }
  }, [orgOpen]);

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

      const payload = {
        ...formData,
        role_ids: selectedRoleIds,
        organization_id: selectedOrgId,
      };

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/users/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
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
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleDateString("id-ID", { month: "short" });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      return `${day} ${month} ${year}, ${hours}:${minutes}`;
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
              <div className="animate-spin rounded-lg h-6 w-6 border-b-2 border-foreground"></div>
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
        <div className="w-full mx-auto px-8 py-8">
          <div className="text-center">
            <User className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">User tidak ditemukan</h2>
            <p className="text-muted-foreground mb-4">User yang Anda cari tidak ditemukan atau telah dihapus</p>
            <Button onClick={() => setLocation("/users")}>
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-card z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/users")}
            className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-foreground">
              Detail User
            </span>
          </div>

          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {user.username}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            form="user-form"
            variant="default"
            disabled={isSaving || !user}
            size="sm"
            className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="w-full space-y-6">
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

                
                {/* Organization Selector */}
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={orgOpen}
                        className="w-full justify-between font-normal"
                      >
                        {selectedOrgId ? (
                          (() => {
                            const org = orgs.find((o) => o.id === selectedOrgId) || 
                                        (user?.organization.uuid === selectedOrgId ? user?.organization : null);
                            return org ? org.name : "Select organization...";
                          })()
                        ) : (
                          <span className="text-muted-foreground">Select organization...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[550px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search organization..." 
                          value={orgSearch}
                          onValueChange={setOrgSearch}
                        />
                        <CommandList 
                          className="max-h-[300px] overflow-y-auto"
                          onScroll={handleOrgScroll}
                        >
                          <CommandEmpty>
                            {loadingOrgs ? "Loading..." : "No organization found."}
                          </CommandEmpty>
                          
                          <CommandGroup>
                            {orgs.map((org) => (
                              <CommandItem
                                key={org.id}
                                value={org.id}
                                onSelect={() => {
                                  setSelectedOrgId(org.id);
                                  setOrgOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedOrgId === org.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{org.name}</span>
                                </div>
                              </CommandItem>
                            ))}
                            {loadingOrgs && (
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

                {/* Roles Multi-Select */}
                <div className="space-y-2">
                  <Label>Roles</Label>
                  <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "flex flex-wrap gap-1 items-center min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/10 transition-colors",
                          roleOpen && "ring-2 ring-ring ring-offset-2"
                        )}
                        onClick={() => setRoleOpen(true)}
                      >
                        {selectedRoleIds.length > 0 ? (
                          selectedRoleIds.map((roleId) => {
                            const role = roles.find((r) => r.id === roleId) || 
                                         user?.role?.find((r: Role) => r.uuid === roleId);
                            return (
                              <Badge
                                key={roleId}
                                variant="secondary"
                                className="flex items-center gap-1 bg-card hover:bg-muted border"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {role ? role.name : roleId.substring(0, 8) + "..."}
                                <div
                                  className="cursor-pointer ml-1 rounded-lg hover:bg-destructive hover:text-destructive-foreground p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRole(roleId);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </div>
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground">Select roles...</span>
                        )}
                        <div className="flex-1 min-w-[4px]" />
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[550px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search role..." 
                          value={roleSearch}
                          onValueChange={setRoleSearch}
                        />
                        <CommandList 
                          className="max-h-[300px] overflow-y-auto"
                          onScroll={handleRoleScroll}
                        >
                          <CommandEmpty>
                            {loadingRoles ? "Loading..." : "No role found."}
                          </CommandEmpty>
                          
                          <CommandGroup>
                            {roles.map((role) => (
                              <CommandItem
                                key={role.id}
                                value={role.id}
                                onSelect={() => toggleRole(role.id)}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedRoleIds.includes(role.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{role.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {role.description}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                            {loadingRoles && (
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
          </form>
        </div>
      </div>
    </div>
  );
}