import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plane,
  MapPin,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  X,
  Check,
  List,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import { apiClient } from "@/lib/api-client";
import { Pagination } from "@/components/Pagination";

export type VerificationStatus = "pending" | "approved" | "rejected";

interface BusinessTripVerification {
  id: string;
  business_trip_id: string;
  user_id: string;
  user_name: string;
  employee_number: string;
  position: string;
  status: VerificationStatus;
  verification_notes?: string;
  business_trip: {
    id: string;
    business_trip_number: string;
    activity_purpose: string;
    destination_city: string;
    start_date: string;
    end_date: string;
    spd_date: string;
    departure_date: string;
    return_date: string;
    status: string;
  };
  created_at: string;
  updated_at: string;
}

interface BusinessTripVerificationTableProps {
  className?: string;
}

export function BusinessTripVerificationTable({
  className = "",
}: BusinessTripVerificationTableProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [verifications, setVerifications] = useState<BusinessTripVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">("all");
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
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [selectedBusinessTripId, setSelectedBusinessTripId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  // Debounce search term and reset page when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, sortField, sortOrder]);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sort: `${sortField} ${sortOrder}`,
      });

      if (debouncedSearchTerm.trim()) {
        params.append("user_name", `ilike.*${debouncedSearchTerm}*`);
      }

      if (statusFilter !== "all") {
        params.append("status", `eq ${statusFilter}`);
      }

      const apiResponse = await apiClient.get<any>(
        `/api/v1/business-trips/verificators?${params.toString()}`
      );

      setVerifications(apiResponse.data || []);
      setPagination({
        count: apiResponse.data?.length || 0,
        total_count: apiResponse.total_items || 0,
        current_page: apiResponse.page || 1,
        total_page: apiResponse.total_pages || 1,
      });
    } catch (error) {
      console.error("Error fetching verifications:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data verifikasi",
        variant: "destructive",
      });
      setVerifications([]);
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
    fetchVerifications();
  }, [fetchVerifications]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
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

  const getStatusBadge = (status: VerificationStatus) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Approved",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const openVerificationDialog = (businessTripId: string, type: "approve" | "reject") => {
    setSelectedBusinessTripId(businessTripId);
    setActionType(type);
    setVerificationNotes("");
    setIsDialogOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedBusinessTripId) return;
    
    if (!verificationNotes.trim()) {
      toast({
        title: "Error",
        description: "Verification notes harus diisi",
        variant: "destructive",
      });
      return;
    }

    console.log("BusinessTripVerificationTable - Initiating verification:", {
      selectedBusinessTripId,
      actionType,
      notesLength: verificationNotes.length,
    });

    try {
      console.log("BusinessTripVerificationTable - Calling apiClient.post...");
      const response = await apiClient.post(
        `/api/v1/business-trips/${selectedBusinessTripId}/verify`,
        {
          status: actionType === "approve" ? "approved" : "rejected",
          verification_notes: verificationNotes,
        }
      );
      console.log("BusinessTripVerificationTable - API call successful:", response);

      setIsDialogOpen(false);
      setVerificationNotes("");
      setSelectedBusinessTripId(null);
      
      await fetchVerifications();
      toast({
        title: "Success",
        description: `Verifikasi berhasil ${actionType === "approve" ? "disetujui" : "ditolak"}`,
      });
    } catch (error) {
      console.error("Error verifying business trip:", error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes("Sesi Anda telah berakhir")) {
        // ApiClient already handled the redirect, just show the error
        return;
      }
      
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Gagal ${actionType === "approve" ? "menyetujui" : "menolak"} verifikasi`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`bg-white flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px]">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-gray-900">Business Trip Verifications</span>
          <div className="h-4 w-px bg-gray-200" />
           <div className="relative w-64">
           <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <Input
              placeholder="Search by name..."
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
                onValueChange={(value: VerificationStatus | "all") => setStatusFilter(value)}
            >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">

        </div>
      </div>

      {/* Table */}
      <div className="w-full flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="pl-6">Trip Number</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("user_name")}
                >
                  Nama
                  <span className="ml-2">
                    {getSortIcon("user_name")}
                  </span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("employee_number")}
                >
                  Employee Number
                  <span className="ml-2">
                    {getSortIcon("employee_number")}
                  </span>
                </Button>
              </TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Tujuan</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("created_at")}
                >
                  Tanggal
                  <span className="ml-2">{getSortIcon("created_at")}</span>
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !verifications || verifications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-500"
                >
                  <CheckSquare className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Tidak ada data verifikasi</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : verifications?.map((verification) => (
              <TableRow key={verification.id} className="group hover:bg-gray-50/80 cursor-pointer transition-colors border-b">
                <TableCell className="pl-6">
                  <button
                    onClick={() => setLocation(`/kwitansi/${verification.business_trip_id}?action=verify`)}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    <span className="font-mono text-sm">
                      {verification.business_trip.business_trip_number}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <p>{verification.user_name}</p>
                    <p className="text-xs text-gray-500">
                      {verification.position}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{verification.employee_number}</TableCell>
                <TableCell>{verification.position}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{verification.business_trip.destination_city}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <Calendar className="inline h-3 w-3" />
                      {formatDate(verification.business_trip.start_date)} -{" "}
                      {formatDate(verification.business_trip.end_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      SPD: {formatDate(verification.business_trip.spd_date)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(verification.status)}
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
            Showing <strong>{verifications.length}</strong> of <strong>{pagination.total_count}</strong> veriications
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

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Business Trip Verification
            </DialogTitle>
            <DialogDescription>
              Silakan masukkan catatan verifikasi sebelum {actionType === "approve" ? "menyetujui" : "menolak"} business trip ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Verification Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="notes"
                placeholder="Masukkan catatan verifikasi..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Catatan ini wajib diisi dan akan tersimpan dalam sistem.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setVerificationNotes("");
                setSelectedBusinessTripId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmVerification}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? (
                <>
                  <Check className="h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
