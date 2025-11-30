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
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: id as any });
    } catch (error) {
      return "-";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id as any });
    } catch (error) {
      return "-";
    }
  };

  const getStatusBadge = (status: WorkPaperStatus) => {
    const statusConfig = {
      ongoing: {
        bg: "bg-blue-50 border-blue-200",
        text: "text-blue-700",
        label: "Ongoing"
      },
      completed: {
        bg: "bg-green-50 border-green-200",
        text: "text-green-700",
        label: "Completed"
      },
      draft: {
        bg: "bg-gray-50 border-gray-200",
        text: "text-gray-700",
        label: "Draft"
      }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleViewDetail = (id: string) => {
    setLocation(`/work-papers/${id}`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search work paper..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value: WorkPaperStatus | "all") => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40 h-10">
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
          className="h-10"
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="font-medium text-muted-foreground py-3 px-4">
                Work Paper ID
              </TableHead>
              <TableHead className="font-medium text-muted-foreground py-3 px-4">
                Tahun
              </TableHead>
              <TableHead className="font-medium text-muted-foreground py-3 px-4">
                Semester
              </TableHead>
              <TableHead className="font-medium text-muted-foreground py-3 px-4">
                Organization
              </TableHead>
              <TableHead className="font-medium text-muted-foreground py-3 px-4">
                Status
              </TableHead>
              <TableHead className="font-medium text-muted-foreground py-3 px-4">
                Created
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !workPapers || workPapers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-16"
                >
                  <div className="flex flex-col items-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm mb-1">Tidak ada data work paper</p>
                    {debouncedSearchTerm && (
                      <p className="text-xs text-muted-foreground/60">Coba kata kunci pencarian lain</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : workPapers?.map((workPaper) => (
              <TableRow key={workPaper.id} className="border-b hover:bg-muted/50 transition-colors">
                <TableCell className="py-3 px-4">
                  <button
                    onClick={() => handleViewDetail(workPaper.id)}
                    className="flex items-start space-x-3 hover:text-primary transition-colors group text-left"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="break-words font-mono text-sm">
                      {workPaper.id}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <span className="text-sm">{workPaper.year}</span>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <span className="text-sm text-muted-foreground">{workPaper.semester}</span>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-start space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="break-words font-mono text-sm text-muted-foreground">{workPaper.organization_id}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  {getStatusBadge(workPaper.status)}
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground/60">
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
          <p className="text-sm text-muted-foreground">
            Menampilkan <span className="font-medium">{pagination.count}</span> dari <span className="font-medium">{pagination.total_count}</span> data
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