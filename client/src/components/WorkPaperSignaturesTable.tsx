import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  List,
  Filter,
} from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDateTime, getSignedAtTimestamp } from "@/utils/dateFormat";
import { vaccinesApi } from "@/services/vaccines-api";
import { useAuth } from "@/hooks/use-auth";
import workPaperApi from "@/services/work-paper-api";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export type SignatureStatus = "pending" | "signed" | "rejected";
export type SignatureType = "digital" | "manual";

interface WorkPaperSignature {
  id: string;
  work_paper_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  signature_type: SignatureType;
  status: SignatureStatus;
  created_at: string;
  updated_at: string;
}

interface WorkPaperSignaturesResponse {
  data: WorkPaperSignature[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface WorkPaperSignaturesTableProps {
  className?: string;
}

export function WorkPaperSignaturesTable({
  className = "",
}: WorkPaperSignaturesTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [signatures, setSignatures] = useState<WorkPaperSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SignatureStatus | "all">(
    "all"
  );
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

  const fetchSignatures = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      // Filter by current user's ID
      if (user?.id) {
        params.append("user_id", `eq ${user.id}`);
      }

      if (statusFilter !== "all") {
        params.append("status", `eq ${statusFilter}`);
      }

      // Use vaccinesApi work-paper-signatures endpoint
      const result: WorkPaperSignaturesResponse =
        await workPaperApi.getWorkPaperSignatures({
          page: currentPage,
          limit: limit,
          user_id: user?.id,
        });

      setSignatures(result.data || []);

      // Map API response to expected format
      setPagination({
        count: result.data?.length || 0,
        total_count: result.total_items || 0,
        current_page: result.page || 1,
        total_page: result.total_pages || 1,
      });
    } catch (error) {
      console.error("Error fetching work paper signatures:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data signature",
        variant: "destructive",
      });
      setSignatures([]);
      setPagination({
        count: 0,
        total_count: 0,
        current_page: 1,
        total_page: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter, sortField, sortOrder, toast, user?.id]);

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

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
      return format(new Date(dateString), "dd MMM yyyy", { locale: id });
    } catch (error) {
      return "-";
    }
  };

  
  const getStatusBadge = (status: SignatureStatus) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      signed: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Signed",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getSignatureTypeBadge = (type: SignatureType) => {
    const typeConfig = {
      digital: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Digital",
      },
      manual: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Manual",
      },
    };

    const config = typeConfig[type] || typeConfig.digital;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  // Filter signatures based on search term
  const filteredSignatures = signatures.filter(
    (signature) =>
      signature.user_name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      signature.user_email
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      signature.work_paper_id
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
  );

  const handleRowClick = (signature: WorkPaperSignature) => {
    // Navigate to work paper detail with action=sign query param
    setLocation(`/work-papers/${signature.work_paper_id}?action=sign`);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-card z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">

            <span className="text-sm font-semibold text-foreground">
              Need to Sign
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
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <Select
                value={statusFilter}
                onValueChange={(value: SignatureStatus | "all") => setStatusFilter(value)}
            >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-6">
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b bg-muted/30">
              <TableHead className="pl-6">Work Paper ID</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("user_name")}
                >
                  User
                  <span className="ml-2">{getSortIcon("user_name")}</span>
                </Button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("signature_type")}
                >
                  Type
                  <span className="ml-2">{getSortIcon("signature_type")}</span>
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
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !filteredSignatures || filteredSignatures.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p>Tidak ada data signature</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredSignatures?.map((signature) => (
                <TableRow
                  key={signature.id}
                  className="cursor-pointer hover:bg-muted/50 border-b"
                  onClick={() => handleRowClick(signature)}
                >
                  <TableCell className="pl-6">
                    <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors group">
                      <FileText className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors flex-shrink-0" />
                      <span className="font-mono text-sm">
                        {signature.work_paper_id}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{signature.user_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{signature.user_email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {signature.user_role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getSignatureTypeBadge(signature.signature_type)}
                  </TableCell>
                  <TableCell>{getStatusBadge(signature.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(signature.created_at)}
                        </span>
                      </div>
                    </div>
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
              Showing <strong>{filteredSignatures.length}</strong> of <strong>{pagination.total_count}</strong> signatures
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
