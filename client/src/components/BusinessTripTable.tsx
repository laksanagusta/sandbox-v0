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
import { formatDate, formatDateTime } from "@/utils/dateFormat";

export type BusinessTripStatus = 'draft' | 'ongoing' | 'completed' | 'canceled';

interface BusinessTrip {
  id: string;
  business_trip_number: string;
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
}

interface BusinessTripTableProps {
  className?: string;
}

export function BusinessTripTable({ className = "" }: BusinessTripTableProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [businessTrips, setBusinessTrips] = useState<BusinessTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BusinessTripStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("start_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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

  const fetchBusinessTrips = useCallback(async () => {
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
        // For activity purpose search, use the API pattern provided
        params.append("activity_purpose", `eq ${debouncedSearchTerm.trim()}`);
      }

      if (statusFilter !== "all") {
        params.append("status", `eq ${statusFilter}`);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/business-trips?${params}`,
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

      const result: any = await response.json();
      setBusinessTrips(result.data);

      // Map API response to expected format
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
    fetchBusinessTrips();
  }, [fetchBusinessTrips]);

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

  
  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by activity purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value: BusinessTripStatus | "all") => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={fetchBusinessTrips}
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
            ) : !businessTrips || businessTrips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Tidak ada data business trip</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : businessTrips?.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">
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
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{trip.destination_city}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {formatDate(trip.start_date)} -{" "}
                        {formatDate(trip.end_date)}
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
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm">View Document</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No document</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      {formatCurrency(trip.total_cost)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {formatDateTime(trip.created_at)}
                        </span>
                      </div>
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
