import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Filter,
  Building,
  List,
  Plus
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatDateTime } from "@/utils/dateFormat";
import { OrganizationBadge } from "@/components/OrganizationBadge";
import { getApiBaseUrl } from "@/lib/env";

export type WorkPaperStatus = 'ongoing' | 'completed' | 'draft' | 'ready_to_sign';

interface WorkPaper {
  id: string;
  organization_id: string;
  year: number;
  semester: number;
  status: WorkPaperStatus;
  created_at: string;
  updated_at: string;
}

interface WorkPaperResponse {
  data: WorkPaper[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface WorkPaperTableProps {
  className?: string;
  onCreate?: () => void;
}

export function WorkPaperTable({ className = "", onCreate }: WorkPaperTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [workPapers, setWorkPapers] = useState<WorkPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkPaperStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({
    count: 0,
    total_count: 0,
    current_page: 1,
    total_page: 1,
  });

  // Debounce search term and reset page when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching or filtering
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, sortField, sortOrder]);

  const fetchWorkPapers = useCallback(async () => {
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
        // For id search
        params.append("id", `ilike ${debouncedSearchTerm.trim()}`);
      }

      if (statusFilter !== "all") {
        params.append("status", `eq ${statusFilter}`);
      }

      // Add organization_id filter
      if (user?.organization?.id) {
        params.append("organization_id", `eq ${user.organization.id}`);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/desk/work-papers?${params}`,
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
          // Token expired atau invalid
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const result: WorkPaperResponse = await response.json();
      setWorkPapers(result.data);

      // Map API response to expected format
      setPagination({
        count: result.data?.length || 0,
        total_count: result.total_items || 0,
        current_page: result.page || 1,
        total_page: result.total_pages || 1,
      });
    } catch (error) {
      console.error("Error fetching work papers:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data work paper",
        variant: "destructive",
        duration: 3000,
      });
      setWorkPapers([]);
      setPagination({
        count: 0,
        total_count: 0,
        current_page: 1,
        total_page: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearchTerm, statusFilter, sortField, sortOrder, toast, user]);

  useEffect(() => {
    fetchWorkPapers();
  }, [fetchWorkPapers]);

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



  
  const getStatusBadge = (status: WorkPaperStatus) => {
    const statusConfig = {
      ongoing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Ongoing"
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Completed"
      },
      draft: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Draft"
      },
      ready_to_sign: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Ready to Sign"
      }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleViewDetail = (id: string) => {
    setLocation(`/work-papers/${id}`);
  };

  return (
    <div className={`bg-white flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px]">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-gray-900">Work Paper Management</span>
          <div className="h-4 w-px bg-gray-200" />
           <div className="relative w-64">
           <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <Input
              placeholder="Search work paper..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          <div className="w-px h-4 bg-gray-200 mx-2" />
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <Select
                value={statusFilter}
                onValueChange={(value: WorkPaperStatus | "all") => setStatusFilter(value)}
            >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="ready_to_sign">Ready to Sign</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium" onClick={fetchWorkPapers} disabled={loading}>
            <List className="h-3.5 w-3.5 mr-2" />
            Refresh
          </Button>
           {onCreate && (
            <Button onClick={onCreate} size="sm" className="h-8 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm text-xs font-medium">
              <Plus className="h-3.5 w-3.5 mr-2" />
              Create Work Paper
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
                  onClick={() => handleSort("id")}
                >
                  Work Paper ID
                  <span className="ml-2">{getSortIcon("id")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("organization_id")}
                >
                  Organization
                  <span className="ml-2">{getSortIcon("organization_id")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("year")}
                >
                  Tahun
                  <span className="ml-2">{getSortIcon("year")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("semester")}
                >
                  Semester
                  <span className="ml-2">{getSortIcon("semester")}</span>
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("created_at")}
                >
                  Created
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
            ) : !workPapers || workPapers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Tidak ada data work paper</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : workPapers?.map((workPaper) => (
              <TableRow key={workPaper.id} className="group hover:bg-gray-50/80 cursor-pointer transition-colors border-b">
                <TableCell className="pl-6 font-medium">
                  <button
                    onClick={() => handleViewDetail(workPaper.id)}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    <span className="font-mono text-sm">
                      {workPaper.id}
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <OrganizationBadge organizationId={workPaper.organization_id} />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{workPaper.year}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">{workPaper.semester}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(workPaper.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {formatDateTime(workPaper.created_at)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="sticky bottom-0 bg-white z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4 mt-auto">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            Showing <strong>{workPapers.length}</strong> of <strong>{pagination.total_count}</strong> work papers
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
    </div>
  );
}