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

      const response = (await apiClient.getWorkPaperItems(params)) as WorkPaperItemResponse;

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



  
  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
      A: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Type A"
      },
      B: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Type B"
      },
      C: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Type C"
      },
      Q: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Type Q"
      }
    };

    const config = typeConfig[type] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: `Type ${type}`
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search work paper items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value: string) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40">
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
                  ID
                  <span className="ml-2">{getSortIcon("id")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("number")}
                >
                  No
                  <span className="ml-2">{getSortIcon("number")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("type")}
                >
                  Type
                  <span className="ml-2">{getSortIcon("type")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("statement")}
                >
                  Statement
                  <span className="ml-2">{getSortIcon("statement")}</span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("level")}
                >
                  Level
                  <span className="ml-2">{getSortIcon("level")}</span>
                </Button>
              </TableHead>
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
            ) : !workPaperItems || workPaperItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Tidak ada data work paper items</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : workPaperItems?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <button
                    onClick={() => setLocation(`/work-paper-items/${item.id}`)}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    <span className="font-mono text-sm">
                      {item.id}
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {item.parent_id && <ChevronRight className="h-3 w-3 text-gray-400" />}
                    <span className="text-sm font-medium">{item.number}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getTypeBadge(item.type)}
                </TableCell>
                <TableCell>
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm break-words max-w-xs">
                      {item.statement}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">Level {item.level}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">
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