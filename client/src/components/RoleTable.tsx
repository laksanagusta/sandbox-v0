import { useState, useEffect, useCallback } from "react";
import { Search, Shield, ArrowUpDown, ArrowUp, ArrowDown, Pencil, List, Plus } from "lucide-react";
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
import { RoleModal } from "./RoleModal";

export interface Role {
  id: string;
  name: string;
  description: string;
  permission_ids?: string[];
  permissions?: { id: string; name: string }[];
  created_at: string;
  created_by: string;
}

interface RoleResponse {
  data: Role[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface RoleTableProps {
  className?: string;
  onCreate?: () => void;
}

export function RoleTable({ className = "", onCreate }: RoleTableProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [roles, setRoles] = useState<Role[]>([]);
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
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

  const fetchRoles = useCallback(async () => {
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
        `${getApiIdentityUrl()}/api/v1/roles/list?${params}`,
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

      const result: RoleResponse = await response.json();
      setRoles(result.data);
      setPagination({
        count: result.data.length,
        total_count: result.total_items,
        current_page: result.page,
        total_page: result.total_pages,
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data roles",
        variant: "destructive",
      });
      setRoles([]);
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
    fetchRoles();
  }, [fetchRoles]);

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
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
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

  return (
    <div className={`bg-white flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px]">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-gray-900">Roles</span>
          <div className="h-4 w-px bg-gray-200" />
           <div className="relative w-64">
           <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <Input
              placeholder="Search role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium" onClick={fetchRoles} disabled={loading}>
            <List className="h-3.5 w-3.5 mr-2" />
            Refresh
          </Button>
           {onCreate && (
            <Button onClick={onCreate} size="sm" className="h-8 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm text-xs font-medium">
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Role
            </Button>
          )}
           {!onCreate && (
             <div/>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="w-full flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
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
                  onClick={() => handleSort("description")}
                >
                  Deskripsi
                  <span className="ml-2">{getSortIcon("description")}</span>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  <Shield className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Tidak ada data role</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id} className="group hover:bg-gray-50/80 cursor-pointer transition-colors border-b">
                  <TableCell className="pl-6 font-medium">
                    <button
                      onClick={(e) => {
                         e.stopPropagation();
                         handleEdit(role);
                      }}
                       className="flex items-center space-x-2 hover:underline text-left"
                    >
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span>{role.name}</span>
                    </button>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDate(role.created_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="sticky bottom-0 bg-white z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4 mt-auto">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            Showing <strong>{roles.length}</strong> of <strong>{pagination.total_count}</strong> roles
          </div>
          
           <div className="flex items-center space-x-6 order-1 sm:order-2">
               <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
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

      {isEditOpen && (
        <RoleModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          role={selectedRole}
          onSuccess={fetchRoles}
        />
      )}
    </div>
  );
}
