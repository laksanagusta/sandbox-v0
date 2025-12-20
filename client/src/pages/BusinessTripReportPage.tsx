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
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
      }`}
    >
      {getStatusIcon(status)}
      <span className="ml-1">{getStatusText(status)}</span>
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
      <div className="bg-background min-h-screen">
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
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Business Trip Report
                </h1>
                <p className="text-gray-600">
                  Dashboard analisis perjalanan dinas
                </p>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destinasi
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Cari destinasi..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="ongoing">Berlangsung</option>
                  <option value="completed">Selesai</option>
                  <option value="canceled">Dibatalkan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
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

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
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

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-500" />
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

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
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

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
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

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
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

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <XCircle className="w-5 h-5 mr-2 text-red-500" />
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

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
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
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-500" />
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
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
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
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-500" />
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
