import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  RefreshCw,
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
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { vaccinesApi } from "@/services/vaccines-api";
import { useAuth } from "@/hooks/use-auth";
import workPaperApi from "@/services/work-paper-api";

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
        limit: "10",
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
          limit: 10,
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
  }, [currentPage, statusFilter, sortField, sortOrder, toast, user?.id]);

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
      return format(new Date(dateString), "dd MMM yyyy", { locale: id });
    } catch (error) {
      return "-";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
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
    // Navigate to work paper detail or signature page
    setLocation(`/work-papers/${signature.work_paper_id}`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or work paper ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value: SignatureStatus | "all") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={fetchSignatures} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Paper ID</TableHead>
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
                  className="text-center py-8 text-gray-500"
                >
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
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
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(signature)}
                >
                  <TableCell>
                    <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors group">
                      <FileText className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                      <span className="font-mono text-sm">
                        {signature.work_paper_id}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{signature.user_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{signature.user_email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
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
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
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
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {filteredSignatures.length} dari{" "}
            {pagination.total_count} data
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
