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
  List,
  Plus
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
  topic_id?: string;
  topic_name?: string;
  desk_instruction: string;
  level: number;
  sequence: number;
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
  onCreate?: () => void;
}

export function WorkPaperItemsTable({ className = "", onCreate }: WorkPaperItemsTableProps) {
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

  const fetchWorkPaperItems = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: limit,
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
  }, [currentPage, limit, debouncedSearchTerm, statusFilter, sortField, sortOrder, toast]);

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
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
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
      bg: "bg-muted",
      text: "text-foreground",
      label: `Type ${type}`
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px]">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-foreground">Work Paper Items Management</span>
          <div className="h-4 w-px bg-border" />
           <div className="relative w-64">
           <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search work paper items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm bg-muted/50 border-border focus:bg-card transition-colors"
            />
          </div>
          <div className="w-px h-4 bg-border mx-2" />
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
                value={statusFilter}
                onValueChange={(value: string) => setStatusFilter(value)}
            >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Filter Type" />
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
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">

           {onCreate && (
            <Button onClick={onCreate} variant="outline" className="h-9 gap-2">
              <Plus className="h-4 w-4" />
              Add Work Paper Item
            </Button>
          )}
           {!onCreate && (
             <div/>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-6"><div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b bg-muted/30">
              <TableHead className="pl-6">
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
                  onClick={() => handleSort("topic_id")}
                >
                  Topic
                  <span className="ml-2">{getSortIcon("topic_id")}</span>
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
                    <div className="animate-spin rounded-lg h-4 w-4 border-b-2 border-foreground"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !workPaperItems || workPaperItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p>Tidak ada data work paper items</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : workPaperItems?.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/50/80 cursor-pointer transition-colors border-b">
                <TableCell className="pl-6 font-medium">
                  <button
                    onClick={() => setLocation(`/work-paper-items/${item.id}`)}
                    className="flex items-center space-x-2 hover:text-primary transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="font-mono text-sm">
                      {item.id}
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {item.parent_id && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-sm font-medium">{item.number}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getTypeBadge(item.type)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {item.topic_name || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">Level {item.level}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.created_at)}
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
              Showing <strong>{workPaperItems.length}</strong> of <strong>{pagination.total_count}</strong> items
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