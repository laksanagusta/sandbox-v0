import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Filter,
  Building,
  User,
  ChevronRight,
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
import { apiClient } from "@/lib/api-client";

interface WorkPaperItem {
  id: string;
  type: string;
  number: string;
  statement: string;
  explanation: string;
  filling_guide: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface WorkPaperItemResponse {
  data: WorkPaperItem[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface WorkPaperItemsTableProps {
  className?: string;
}

export function WorkPaperItemsTable({ className = "" }: WorkPaperItemsTableProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [workPaperItems, setWorkPaperItems] = useState<WorkPaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  const fetchWorkPaperItems = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      if (statusFilter !== "all") {
        params.type = statusFilter;
      }

      if (sortField && sortOrder) {
        params.sort = `${sortField} ${sortOrder}`;
      }

      const response = await apiClient.getWorkPaperItems(params);

      // Handle the response structure
      const items = response.data || [];
      setWorkPaperItems(items);

      // Map API response to expected format
      setPagination({
        count: items.length,
        total_count: response.total_items || 0,
        current_page: response.page || currentPage,
        total_page: response.total_pages || 1,
      });
    } catch (error) {
      console.error("Error fetching work paper items:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data items",
        variant: "destructive",
      });
      setWorkPaperItems([]);
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
    fetchWorkPaperItems();
  }, [fetchWorkPaperItems]);

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

  
  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
      A: {
        bg: "bg-blue-50 border-blue-200",
        text: "text-blue-700",
        label: "Type A"
      },
      B: {
        bg: "bg-green-50 border-green-200",
        text: "text-green-700",
        label: "Type B"
      },
      C: {
        bg: "bg-purple-50 border-purple-200",
        text: "text-purple-700",
        label: "Type C"
      },
      Q: {
        bg: "bg-orange-50 border-orange-200",
        text: "text-orange-700",
        label: "Type Q"
      }
    };

    const config = typeConfig[type] || {
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-700",
      label: `Type ${type}`
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search work paper items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value: string) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="A">Type A</SelectItem>
              <SelectItem value="B">Type B</SelectItem>
              <SelectItem value="C">Type C</SelectItem>
              <SelectItem value="Q">Type Q</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={fetchWorkPaperItems}
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
              <TableHead
                className="font-medium text-muted-foreground py-3 px-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  {getSortIcon("id")}
                </div>
              </TableHead>
              <TableHead
                className="font-medium text-muted-foreground py-3 px-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("number")}
              >
                <div className="flex items-center space-x-1">
                  <span>No</span>
                  {getSortIcon("number")}
                </div>
              </TableHead>
              <TableHead
                className="font-medium text-muted-foreground py-3 px-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center space-x-1">
                  <span>Type</span>
                  {getSortIcon("type")}
                </div>
              </TableHead>
              <TableHead
                className="font-medium text-muted-foreground py-3 px-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("statement")}
              >
                <div className="flex items-center space-x-1">
                  <span>Statement</span>
                  {getSortIcon("statement")}
                </div>
              </TableHead>
              <TableHead
                className="font-medium text-muted-foreground py-3 px-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("level")}
              >
                <div className="flex items-center space-x-1">
                  <span>Level</span>
                  {getSortIcon("level")}
                </div>
              </TableHead>
              <TableHead
                className="font-medium text-muted-foreground py-3 px-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {getSortIcon("created_at")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !workPaperItems || workPaperItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-16"
                >
                  <div className="flex flex-col items-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm mb-1">Tidak ada data work paper items</p>
                    {debouncedSearchTerm && (
                      <p className="text-xs text-muted-foreground/60">Coba kata kunci pencarian lain</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : workPaperItems?.map((item) => (
              <TableRow key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                <TableCell className="py-3 px-4">
                  <button
                    onClick={() => setLocation(`/work-paper-items/${item.id}`)}
                    className="flex items-start space-x-3 hover:text-primary transition-colors group text-left"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="break-words font-mono text-sm">
                      {item.id}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    {item.parent_id && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-sm font-medium">{item.number}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  {getTypeBadge(item.type)}
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm break-words max-w-xs">
                      {item.statement}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <span className="text-sm">Level {item.level}</span>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-start space-x-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground/60">
                      {formatDateTime(item.created_at)}
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