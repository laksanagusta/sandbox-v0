import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Loader2, Search } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { getApiIdentityUrl } from "@/lib/env";
import { Role } from "./RoleTable";

interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
}

interface PermissionResponse {
  data: Permission[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface RoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  onSuccess: () => void;
}

export function RoleModal({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Permission Fetching State
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionPage, setPermissionPage] = useState(1);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [hasMorePermissions, setHasMorePermissions] = useState(true);
  const [permissionOpen, setPermissionOpen] = useState(false);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (permissionOpen) {
        setPermissionPage(1);
        setPermissions([]);
        setHasMorePermissions(true);
        fetchPermissions(1, permissionSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [permissionSearch]);

  // Initial load when modal opens
  useEffect(() => {
    if (open) {
      if (role) {
        setFormData({
          name: role.name,
          description: role.description,
        });
        // Assuming role.permission_ids is available, or we map from role.permissions
        const initialIds = role.permission_ids || role.permissions?.map(p => p.id) || [];
        setSelectedPermissions(initialIds);
      } else {
        setFormData({
          name: "",
          description: "",
        });
        setSelectedPermissions([]);
      }
      
      // Reset permission list
      setPermissionPage(1);
      setPermissions([]);
      setHasMorePermissions(true);
      setPermissionSearch("");
    }
  }, [open, role]);

  // Fetch permissions when dropdown opens
  useEffect(() => {
    if (open && permissionOpen && permissions.length === 0) {
      fetchPermissions(1, "");
    }
  }, [open, permissionOpen]);

  const fetchPermissions = async (page: number, search: string) => {
    try {
      setLoadingPermissions(true);
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
        `${getApiIdentityUrl()}/api/v1/permissions?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch permissions");

      const result: PermissionResponse = await response.json();
      
      setPermissions(prev => page === 1 ? result.data : [...prev, ...result.data]);
      setHasMorePermissions(page < result.total_pages);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMorePermissions && !loadingPermissions) {
      const nextPage = permissionPage + 1;
      setPermissionPage(nextPage);
      fetchPermissions(nextPage, permissionSearch);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan");
      }

      const url = role
        ? `${getApiIdentityUrl()}/api/v1/roles/${role.id}`
        : `${getApiIdentityUrl()}/api/v1/roles`;

      const method = role ? "PATCH" : "POST";

      const payload = {
        name: formData.name,
        description: formData.description,
        permission_ids: selectedPermissions,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Gagal menyimpan role: ${response.status}`);
      }

      toast({
        title: "Berhasil",
        description: `Role berhasil ${role ? "diperbarui" : "dibuat"}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving role:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id) 
        : [...prev, id]
    );
  };

  const selectedPermissionObjects = permissions.filter(p => selectedPermissions.includes(p.id));
  // Note: For selected permissions not in current list (due to pagination), we might miss their names if we rely only on 'permissions' state.
  // Ideally we would fetch selected permissions details or keep them in a separate state map.
  // For now, I'll rely on the fact that if it's Edit mode, we populate from Role data if available, but the payload requires IDs.
  // Displaying names for 'selected' items might be incomplete if they are not loaded.
  // A quick fix is to merge loaded permissions with pre-existing role permissions if provided.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {role ? "Edit Role" : "Tambah Role"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Role</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Contoh: Super Admin"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Deskripsi role..."
            />
          </div>
          
            <div className="space-y-2">
            <Label>Permissions</Label>
            <Popover open={permissionOpen} onOpenChange={setPermissionOpen}>
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "flex flex-wrap gap-1 items-center min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/10 transition-colors",
                    permissionOpen && "ring-2 ring-ring ring-offset-2"
                  )}
                  onClick={() => setPermissionOpen(true)}
                >
                    {selectedPermissions.length > 0 ? (
                      selectedPermissions.map((id) => {
                        const perm = permissions.find((p) => p.id === id) || 
                                     (role?.permissions?.find((p) => p.id === id));
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="flex items-center gap-1 bg-muted hover:bg-muted/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {perm ? perm.name : id.substring(0, 8) + "..."}
                            <div
                              className="cursor-pointer ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePermission(id);
                              }}
                            >
                                <X className="w-3 h-3" />
                            </div>
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-muted-foreground">Select permissions...</span>
                    )}
                    <div className="flex-1 min-w-[4px]" /> 
                    {/* Spacer to push chevron or ensure hit area for popover trigger fills row */}
                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[550px] p-0" align="start">
                <Command shouldFilter={false}> 
                  <CommandInput 
                    placeholder="Search permission..." 
                    value={permissionSearch}
                    onValueChange={setPermissionSearch}
                  />
                  <CommandList 
                    className="max-h-[300px] overflow-y-auto"
                    onScroll={handleScroll}
                  >
                    <CommandEmpty>
                       {loadingPermissions ? "Loading..." : "No permission found."}
                    </CommandEmpty>
                    
                    <CommandGroup>
                      {permissions.map((permission) => (
                        <CommandItem
                          key={permission.id}
                          value={permission.id}
                          onSelect={() => togglePermission(permission.id)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPermissions.includes(permission.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{permission.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {permission.resource} : {permission.action}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                      {loadingPermissions && (
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
