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
  ExternalLink,
  Filter,
  Building,
} from "lucide-react";
import { useLocation } from "wouter";
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

export type WorkPaperStatus = 'ongoing' | 'completed' | 'draft';

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
}

export function WorkPaperTable({ className = "" }: WorkPaperTableProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [workPapers, setWorkPapers] = useState<WorkPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkPaperStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
        limit: "10",
        sort: `${sortField} ${sortOrder}`,
      });

      if (debouncedSearchTerm.trim()) {
        // For id search
        params.append("id", `ilike ${debouncedSearchTerm.trim()}`);
      }

      if (statusFilter !== "all") {
        params.append("status", `eq ${statusFilter}`);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/desk/work-papers?${params}`,
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
  }, [currentPage, debouncedSearchTerm, statusFilter, sortField, sortOrder, toast]);

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
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search work paper..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value: WorkPaperStatus | "all") => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={fetchWorkPapers}
          disabled={loading}
        >
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
              <TableRow key={workPaper.id}>
                <TableCell className="font-medium">
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
                  <span className="text-sm">{workPaper.year}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">{workPaper.semester}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="font-mono text-sm text-gray-500">{workPaper.organization_id}</span>
                  </div>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {pagination.count} dari {pagination.total_count} data
          </p>
          {pagination.total_page > 1 && (
            <div>
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_page}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}