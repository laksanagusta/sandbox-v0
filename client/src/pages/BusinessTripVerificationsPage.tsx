import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Search,
  Plane,
  MapPin,
  Calendar,
  User,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
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

export default function BusinessTripVerificationsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<BusinessTripVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "created_at",
    sortOrder: "desc" as "asc" | "desc",
  });

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) {
        params.append("user_name", `ilike.*${filters.search}*`);
      }

      if (filters.status) {
        params.append("status", `eq.${filters.status}`);
      }

      params.append("order", `${filters.sortOrder === "desc" ? "-" : ""}${filters.sortBy}`);

      const response = await apiClient(
        `/api/v1/business-trips/verifications?${params.toString()}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const apiResponse = await response.json();
      setVerifications(apiResponse.data || []);
      setPagination({
        page: apiResponse.page || 1,
        limit: apiResponse.limit || 20,
        totalItems: apiResponse.total_items || 0,
        totalPages: apiResponse.total_pages || 1,
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [pagination.page, filters.search, filters.status, filters.sortBy, filters.sortOrder]);

  const handleSort = (field: string) => {
    if (filters.sortBy === field) {
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: "desc",
      }));
    }
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return filters.sortOrder === "desc" ? (
      <ArrowDown className="w-4 h-4" />
    ) : (
      <ArrowUp className="w-4 h-4" />
    );
  };

  const getStatusBadge = (status: VerificationStatus) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100 hover:bg-yellow-200",
        text: "text-yellow-800",
        label: "Pending",
      },
      approved: {
        bg: "bg-green-100 hover:bg-green-200",
        text: "text-green-800",
        label: "Approved",
      },
      rejected: {
        bg: "bg-red-100 hover:bg-red-200",
        text: "text-red-800",
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge
        variant="outline"
        className={`${config.bg} ${config.text} border-0`}
      >
        {config.label}
      </Badge>
    );
  };

  const handleApprove = async (verificationId: string) => {
    try {
      const response = await apiClient(
        `/api/v1/business-trips/verifications/${verificationId}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal menyetujui verifikasi: ${response.status}`);
      }

      await fetchVerifications();
      toast({
        title: "Success",
        description: "Verifikasi berhasil disetujui",
      });
    } catch (error) {
      console.error("Error approving verification:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal menyetujui verifikasi",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (verificationId: string, notes?: string) => {
    try {
      const response = await apiClient(
        `/api/v1/business-trips/verifications/${verificationId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verification_notes: notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal menolak verifikasi: ${response.status}`);
      }

      await fetchVerifications();
      toast({
        title: "Success",
        description: "Verifikasi berhasil ditolak",
      });
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal menolak verifikasi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold">Business Trip Verifications</h1>
                <p className="text-sm text-gray-500">
                  Daftar verifikasi perjalanan dinas yang perlu persetujuan
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Pencarian
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari nama atau employee number..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters(prev => ({ ...prev, search: e.target.value }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span className="ml-2">Loading...</span>
                </div>
              ) : verifications.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Tidak ada data verifikasi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">No</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort("user_name")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Nama</span>
                            {getSortIcon("user_name")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort("employee_number")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Employee Number</span>
                            {getSortIcon("employee_number")}
                          </div>
                        </TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>
                          <div className="flex items-center space-x-1">
                            <span>Trip Number</span>
                            <Plane className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead>Tujuan</TableHead>
                        <TableHead>
                          <div className="flex items-center space-x-1">
                            <span>Tanggal</span>
                            <Calendar className="w-4 h-4" />
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifications.map((verification, index) => (
                        <TableRow key={verification.id}>
                          <TableCell className="font-medium">
                            {(pagination.page - 1) * pagination.limit + index + 1}
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
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="font-mono text-sm">
                                {verification.business_trip.business_trip_number}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span>{verification.business_trip.destination_city}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {formatDate(verification.business_trip.start_date)}
                              </div>
                              <div className="text-gray-500">
                                s/d {formatDate(verification.business_trip.end_date)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(verification.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {verification.status === "pending" && (
                                <>
                                  <Button
                                    onClick={() => handleApprove(verification.id)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckSquare className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleReject(
                                        verification.id,
                                        "Verifikasi ditolak karena tidak memenuhi persyaratan"
                                      )
                                    }
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {verification.status === "approved" && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckSquare className="w-3 h-3 mr-1" />
                                  Disetujui
                                </Badge>
                              )}
                              {verification.status === "rejected" && (
                                <Badge className="bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Ditolak
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) =>
                setPagination(prev => ({ ...prev, page }))
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}