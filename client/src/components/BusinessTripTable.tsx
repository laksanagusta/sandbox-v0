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
  Building2,
  ExternalLink,
  Filter,
  Trash2,
  Plus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Car,
  FileEdit,
  PlayCircle,
  FileCheck,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/api-client";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "./Pagination";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import { getApiBaseUrl } from "@/lib/env";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type BusinessTripStatus = 'draft' | 'ongoing' | 'ready_to_verify' | 'completed' | 'canceled';

interface BusinessTrip {
  id: string;
  business_trip_number: string;
  assignment_letter_number?: string;
  start_date: string;
  end_date: string;
  activity_purpose: string;
  destination_city: string;
  spd_date: string;
  departure_date: string;
  return_date: string;
  receipt_signature_date: string;
  total_cost?: number;
  status: BusinessTripStatus;
  document_link?: string;
  created_at: string;
  updated_at: string;
}

interface BusinessTripResponse {
  data: BusinessTrip[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BusinessTripTableProps {
  className?: string;
  onCreate?: () => void;
}

export function BusinessTripTable({ className = "", onCreate }: BusinessTripTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [businessTrips, setBusinessTrips] = useState<BusinessTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BusinessTripStatus | "all">("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState({
    count: 0,
    total_count: 0,
    current_page: 1,
    total_page: 1,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync tab with filter
  useEffect(() => {
    if (activeTab === "all") {
      setStatusFilter("all");
    } else {
      setStatusFilter(activeTab as BusinessTripStatus);
    }
    setCurrentPage(1);
  }, [activeTab]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBusinessTrips = useCallback(async () => {
    try {
      setLoading(true);

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
        params.append("activity_purpose", `eq ${debouncedSearchTerm.trim()}`);
      }

      if (statusFilter !== "all") {
        params.append("status", `eq ${statusFilter}`);
      }

      if (user?.organization?.id) {
        params.append("organization_id", `eq ${user.organization.id}`);
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/business-trips?${params}`,
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
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const result: any = await response.json();
      setBusinessTrips(result.data || []);

      setPagination({
        count: result.data?.length || 0,
        total_count: result.total_items || 0,
        current_page: result.page || 1,
        total_page: result.total_pages || 1,
      });
    } catch (error) {
      console.error("Error fetching business trips:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data business trip",
        variant: "destructive",
      });
      setBusinessTrips([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearchTerm, statusFilter, sortField, sortOrder, toast, user?.organization?.id]);

  useEffect(() => {
    fetchBusinessTrips();
  }, [fetchBusinessTrips]);

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

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getStatusBadge = (status: BusinessTripStatus) => {
    const statusConfig = {
      draft: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Draft"
      },
      ongoing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Ongoing"
      },
      ready_to_verify: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Ready to Verify"
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Completed"
      },
      canceled: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Canceled"
      }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await apiClient.deleteBusinessTrip(deleteId);
      toast({
        title: "Berhasil",
        description: "Business trip berhasil dihapus",
      });
      fetchBusinessTrips();
    } catch (error) {
      console.error("Error deleting business trip:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus business trip",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className={cn("bg-white flex flex-col flex-1 h-full", className)}>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px]">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-900">Business Trips</span>
            <div className="h-4 w-px bg-gray-200" />
            <TabsList className="bg-transparent p-0 h-auto space-x-1">
              <TabsTrigger 
                value="draft"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileEdit className="w-3.5 h-3.5" />
                Draft
              </TabsTrigger>
              <TabsTrigger 
                value="ongoing"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Ongoing
              </TabsTrigger>
              <TabsTrigger 
                value="ready_to_verify"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Ready to Verify
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </TabsTrigger>
              <TabsTrigger 
                value="canceled"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                Canceled
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {onCreate && (
              <Button onClick={onCreate} size="sm" className="h-8 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm text-xs font-medium">
                <Plus className="h-3.5 w-3.5" />
                New Business Trip
              </Button>
            )}
          </div>
        </div>

        <div className="w-full flex-1">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="pl-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("business_trip_number")}
                  >
                    No. Business Trip
                    <span className="ml-2">
                      {getSortIcon("business_trip_number")}
                    </span>
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("assignment_letter_number")}
                  >
                    No. Surat Tugas
                    <span className="ml-2">
                      {getSortIcon("assignment_letter_number")}
                    </span>
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("destination_city")}
                  >
                    Tujuan
                    <span className="ml-2">
                      {getSortIcon("destination_city")}
                    </span>
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("start_date")}
                  >
                    Tanggal
                    <span className="ml-2">{getSortIcon("start_date")}</span>
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Total Biaya</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("created_at")}
                  >
                    Dibuat
                    <span className="ml-2">{getSortIcon("created_at")}</span>
                  </Button>
                </TableHead>
                <TableHead className="w-[50px] pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex items-center justify-center space-x-2">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                       <span>Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !businessTrips || businessTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                    No business trips found.
                  </TableCell>
                </TableRow>
              ) : (
                businessTrips.map((trip) => (
                  <TableRow 
                    key={trip.id} 
                    className="group hover:bg-gray-50/80 cursor-pointer transition-colors border-b"
                  >
                    <TableCell className="pl-6 font-medium">
                      <button
                        onClick={() => setLocation(`/kwitansi/${trip.id}`)}
                        className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                      >
                        <FileText className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                        <span className="font-mono text-sm">
                          {trip.business_trip_number}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {trip.assignment_letter_number || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{trip.destination_city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          SPD: {formatDate(trip.spd_date)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(trip.status)}
                    </TableCell>
                    <TableCell>
                      {trip.document_link ? (
                        <a
                          href={trip.document_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="text-sm">View</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No doc</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        {formatCurrency(trip.total_cost)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {formatDateTime(trip.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(trip.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && (
          <div className="sticky bottom-0 bg-white z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4 mt-auto">
            <div className="text-xs text-muted-foreground order-2 sm:order-1">
              Showing <strong>{businessTrips?.length || 0}</strong> of <strong>{pagination.total_count}</strong> trips
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
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the business trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
