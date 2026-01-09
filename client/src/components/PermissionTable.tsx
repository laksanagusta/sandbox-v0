import { useState, useEffect, useCallback } from "react";
import { Search, Shield, ArrowUpDown, ArrowUp, ArrowDown, Pencil, List, Plus } from "lucide-react";
import { PermissionModal } from "./PermissionModal";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "./Pagination";
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

interface PermissionResponse {
  data: Permission[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface PermissionTableProps {
  className?: string;
  onCreate?: () => void;
}

export function PermissionTable({ className = "", onCreate }: PermissionTableProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState({
    count: 0,
    total_count: 0,
    current_page: 1,
    total_page: 1,
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsEditOpen(true);
  };

  // Debounce search term and reset page when sort changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching or sorting
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, sortField, sortOrder]);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);

      // Get token from localStorage
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sort: `${sortField} ${sortOrder}`,
      });

      if (debouncedSearchTerm.trim()) {
        params.append("search", debouncedSearchTerm.trim());
      }

      const response = await fetch(
        `${getApiIdentityUrl()}/api/v1/permissions?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired atau invalid
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const result: PermissionResponse = await response.json();
      setPermissions(result.data);
      setPagination({
        count: result.data.length,
        total_count: result.total_items,
        current_page: result.page,
        total_page: result.total_pages,
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data permissions",
        variant: "destructive",
      });
      setPermissions([]);
      setPagination({
        count: 0,
        total_count: 0,
        current_page: 1,
        total_page: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearchTerm, sortField, sortOrder, toast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to asc
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

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

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      read: "bg-blue-100 text-blue-800",
      write: "bg-green-100 text-green-800",
      update: "bg-yellow-100 text-yellow-800",
      delete: "bg-red-100 text-red-800",
    };

    const colorClass = colors[action] || "bg-gray-100 text-gray-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {action}
      </span>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-card z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Permissions
            </span>
          </div>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search permission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCreate && (
            <Button onClick={onCreate} variant="outline" className="h-9 gap-2">
              <Plus className="h-4 w-4" />
              Add Permission
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-6">
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b bg-muted/30">
                <TableHead className="pl-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("name")}
                >
                  Nama
                  <span className="ml-2">{getSortIcon("name")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("action")}
                >
                  Action
                  <span className="ml-2">{getSortIcon("action")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("resource")}
                >
                  Resource
                  <span className="ml-2">{getSortIcon("resource")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("created_by")}
                >
                  Dibuat oleh
                  <span className="ml-2">{getSortIcon("created_by")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("created_at")}
                >
                  Tanggal Dibuat
                  <span className="ml-2">{getSortIcon("created_at")}</span>
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Opsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p>Tidak ada data permission</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((permission) => (
                <TableRow key={permission.id} className="group hover:bg-muted/50 cursor-pointer transition-colors border-b">
                  <TableCell className="pl-6 font-medium">
                    <button
                      onClick={() => setLocation(`/permission/${permission.id}`)}
                      className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                    >
                      <Shield className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                      <span>{permission.name}</span>
                    </button>
                  </TableCell>
                  <TableCell>{getActionBadge(permission.action)}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {permission.resource}
                    </span>
                  </TableCell>
                  <TableCell>{permission.created_by}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(permission.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(permission);
                      }}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Pagination inside border container */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing <strong>{permissions.length}</strong> of <strong>{pagination.total_count}</strong> permissions
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[60px] text-xs">
                    <SelectValue placeholder={limit.toString()} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[20, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pagination.total_page > 1 && (
                <Pagination
                  currentPage={pagination.current_page}
                  totalPages={pagination.total_page}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {isEditOpen && (
        <PermissionModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          permission={selectedPermission}
          onSuccess={fetchPermissions}
        />
      )}
    </div>
  );
}