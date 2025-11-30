import { useState, useEffect, useCallback } from "react";
import { Search, User, ArrowUpDown, ArrowUp, ArrowDown, Building, Shield, Phone } from "lucide-react";
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
import { Pagination } from "./Pagination";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateFormat";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  roles: Role[];
  organizations: Organization;
  created_at: string;
}

interface UserResponse {
  data: User[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface UserTableProps {
  className?: string;
}

export function UserTable({ className = "" }: UserTableProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("username");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pagination, setPagination] = useState({
    count: 0,
    total_count: 0,
    current_page: 1,
    total_page: 1,
  });

  // Debounce search term and reset page when sort changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching or sorting
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, sortField, sortOrder]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Get token from localStorage
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sort: `${sortField} ${sortOrder}`,
      });

      if (debouncedSearchTerm.trim()) {
        params.append("search", debouncedSearchTerm.trim());
      }

      const response = await fetch(
        `http://localhost:5001/api/v1/users?${params}`,
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

      const result: UserResponse = await response.json();
      setUsers(result.data);
      setPagination({
        count: result.data.length,
        total_count: result.total_items,
        current_page: result.page,
        total_page: result.total_pages,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data users",
        variant: "destructive",
      });
      setUsers([]);
      setPagination({
        count: 0,
        total_count: 0,
        current_page: 1,
        total_page: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, sortField, sortOrder, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  
  const getRoleBadge = (roles: Role[]) => {
    if (!roles || roles.length === 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          No Role
        </Badge>
      );
    }

    if (roles.length === 1) {
      return (
        <Badge className="bg-purple-100 text-purple-800 text-xs">
          {roles[0].name}
        </Badge>
      );
    }

    return (
      <div className="flex gap-1">
        {roles.slice(0, 2).map((role) => (
          <Badge key={role.id} className="bg-purple-100 text-purple-800 text-xs">
            {role.name}
          </Badge>
        ))}
        {roles.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{roles.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Box */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("username")}
                >
                  Username
                  <span className="ml-2">{getSortIcon("username")}</span>
                </Button>
              </TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Kontak</TableHead>
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
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <User className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Tidak ada data user</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => setLocation(`/users/${user.id}`)}
                      className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                    >
                      <User className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      <span>{user.username}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.roles)}</TableCell>
                  <TableCell>
                    {user.organizations ? (
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">{user.organizations.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.phone_number ? (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">{user.phone_number}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {pagination.count} dari {pagination.total_count} data
          </p>
          {pagination.total_page > 1 && (
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_page}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}