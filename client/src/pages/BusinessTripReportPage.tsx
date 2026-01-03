import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface DashboardOverview {
  total_business_trips: number;
  draft_business_trips: number;
  ongoing_business_trips: number;
  completed_business_trips: number;
  canceled_business_trips: number;
  upcoming_business_trps: number;
  total_assignees: number;
  total_transactions: number;
  total_cost: number;
  average_cost_per_trip: number;
}

interface MonthlyStat {
  month: string;
  year: number;
  total_trips: number;
  completed_trips: number;
  total_cost: number;
  average_cost_per_trip: number;
  top_destination: string;
}

interface DestinationStat {
  destination: string;
  total_trips: number;
  completed_trips: number;
  total_cost: number;
  average_cost_per_trip: number;
  last_trip_date: string;
}

interface RecentBusinessTrip {
  id: string;
  business_trip_number: string;
  activity_purpose: string;
  destination_city: string;
  start_date: string;
  end_date: string;
  status: string;
  assignee_count: number;
  total_cost: number;
}

interface DashboardResponse {
  data: {
    overview: DashboardOverview;
    monthly_stats: MonthlyStat[];
    destination_stats: DestinationStat[];
    transaction_type_stats: any;
    recent_business_trips: RecentBusinessTrip[];
  };
  success: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "ongoing":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "canceled":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "draft":
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Selesai";
    case "ongoing":
      return "Berlangsung";
    case "canceled":
      return "Dibatalkan";
    case "draft":
      return "Draft";
    default:
      return status;
  }
};

const getStatusBadge = (status: string) => {
  const colors = {
    completed: "bg-green-100 text-green-800",
    ongoing: "bg-blue-100 text-blue-800",
    canceled: "bg-red-100 text-red-800",
    draft: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
      }`}
    >
      {getStatusIcon(status)}
      <span>{getStatusText(status)}</span>
    </span>
  );
};

export default function BusinessTripReportPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState("");

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<DashboardResponse>({
    queryKey: [
      "business-trips-dashboard",
      startDate,
      endDate,
      destination,
      status,
    ],
    queryFn: async (): Promise<DashboardResponse> => {
      const params = {
        start_date: startDate,
        end_date: endDate,
        ...(destination && { destination }),
        ...(status && { status }),
      };

      return (await apiClient.getBusinessTripDashboard(params)) as DashboardResponse;
    },
  });

  const overview = dashboardData?.data?.overview;
  const monthlyStats = dashboardData?.data?.monthly_stats || [];
  const destinationStats = dashboardData?.data?.destination_stats || [];
  const recentTrips = dashboardData?.data?.recent_business_trips || [];

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50/50 min-h-screen">
        <div className="mx-auto px-8 py-8">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600">
              Unable to load business trip report data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              Business Trip Report
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Action buttons if needed */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
        <div className="w-full space-y-6">
          {/* Filter Card */}
          <Card className="border-border/60 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Rentang Tanggal</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-9 h-9 bg-background"
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">-</span>
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-9 h-9 bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Destinasi</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-9 bg-background"
                      placeholder="Filter destinasi..."
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ongoing">Berlangsung</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="canceled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    Total Perjalanan Dinas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {overview.total_business_trips}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Total semua perjalanan
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Sedang Berlangsung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {overview.ongoing_business_trips}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Perjalanan aktif</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    Total Peserta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {overview.total_assignees}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Total pegawai yang terlibat
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Total Biaya
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(overview.total_cost)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Rata-rata: {formatCurrency(overview.average_cost_per_trip)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Selesai
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {overview.completed_business_trips}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Perjalanan selesai
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Draft
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {overview.draft_business_trips}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Menunggu persetujuan
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Dibatalkan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {overview.canceled_business_trips}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Perjalanan dibatalkan
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Rencana Perjalanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {overview.upcoming_business_trps}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Akan datang</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Statistics */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Statistik Bulanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyStats.length > 0 ? (
                    monthlyStats.map((stat: MonthlyStat, index: number) => (
                      <div
                        key={index}
                        className="border-b border-gray-100 pb-4 last:border-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {stat.month} {stat.year}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {stat.total_trips} perjalanan
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(stat.total_cost)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Rata-rata:{" "}
                              {formatCurrency(stat.average_cost_per_trip)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-600">
                                {stat.completed_trips} selesai
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Destinasi teratas:{" "}
                            <span className="font-medium">
                              {stat.top_destination}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Tidak ada data bulanan tersedia
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Destination Statistics */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-500" />
                  Statistik Destinasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {destinationStats.length > 0 ? (
                    destinationStats.map(
                      (stat: DestinationStat, index: number) => (
                        <div
                          key={index}
                          className="border-b border-gray-100 pb-4 last:border-0"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {stat.destination}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {stat.total_trips} perjalanan
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(stat.total_cost)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Rata-rata:{" "}
                                {formatCurrency(stat.average_cost_per_trip)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-600">
                                {stat.completed_trips} selesai
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Terakhir: {formatDate(stat.last_trip_date)}
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Tidak ada data destinasi tersedia
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Business Trips */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-500" />
                Perjalanan Dinas Terkini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Nomor
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Tujuan
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Tujuan Kegiatan
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Tanggal
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Peserta
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Biaya
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.length > 0 ? (
                      recentTrips.map((trip: RecentBusinessTrip) => (
                        <tr
                          key={trip.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                            {trip.business_trip_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {trip.destination_city}
                          </td>
                          <td
                            className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate"
                            title={trip.activity_purpose}
                          >
                            {trip.activity_purpose}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(trip.start_date)} -{" "}
                            {formatDate(trip.end_date)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {trip.assignee_count} orang
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                            {formatCurrency(trip.total_cost)}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(trip.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-gray-500"
                        >
                          Tidak ada perjalanan dinas ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
