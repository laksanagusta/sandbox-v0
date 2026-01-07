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
  name?: string;
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
      // if (user?.organization?.id) {
      //   params.append("organization_id", `eq ${user.organization.id}`);
      // }

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
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };



  
  const getStatusBadge = (status: WorkPaperStatus) => {
    const statusConfig = {
      ongoing: {
        classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        label: "Ongoing"
      },
      completed: {
        classes: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
        label: "Completed"
      },
      draft: {
        classes: "bg-muted text-muted-foreground border-border",
        label: "Draft"
      },
      ready_to_sign: {
        classes: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        label: "Ready to Sign"
      }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.classes}`}>
        {config.label}
      </span>
    );
  };

  const handleViewDetail = (id: string) => {
    setLocation(`/work-papers/${id}`);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-card z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Work Papers
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
              placeholder="Search work paper..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value: WorkPaperStatus | "all") => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[140px] h-9 text-sm">
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

        <div className="flex items-center gap-2">
          {onCreate && (
            <Button onClick={onCreate} variant="outline" className="h-9 gap-2">
              <Plus className="h-4 w-4" />
              Create Work Paper
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
                  className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-2"
                  onClick={() => handleSort("id")}
                >
                  Work Paper ID
                  <span>{getSortIcon("id")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-2"
                  onClick={() => handleSort("organization_id")}
                >
                  Organization
                  <span>{getSortIcon("organization_id")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-2"
                  onClick={() => handleSort("name")}
                >
                  Name
                  <span>{getSortIcon("name")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-2"
                  onClick={() => handleSort("year")}
                >
                  Tahun
                  <span>{getSortIcon("year")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-2"
                  onClick={() => handleSort("semester")}
                >
                  Semester
                  <span>{getSortIcon("semester")}</span>
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent flex items-center gap-2"
                  onClick={() => handleSort("created_at")}
                >
                  Created
                  <span>{getSortIcon("created_at")}</span>
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-lg h-4 w-4 border-b-2 border-foreground"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !workPapers || workPapers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p>Tidak ada data work paper</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : workPapers?.map((workPaper) => (
              <TableRow key={workPaper.id} className="group hover:bg-muted/50/80 cursor-pointer transition-colors border-b">
                <TableCell className="pl-6 font-medium">
                  <button
                    onClick={() => handleViewDetail(workPaper.id)}
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="font-mono text-sm">
                      {workPaper.id}
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OrganizationBadge organizationId={workPaper.organization_id} />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {workPaper.name || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{workPaper.year}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{workPaper.semester}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(workPaper.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(workPaper.created_at)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination inside border container */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing <strong>{workPapers.length}</strong> of <strong>{pagination.total_count}</strong> work papers
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
    </div>
  );
}