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
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
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
    completed: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    ongoing: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    canceled: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    draft: "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
        colors[status as keyof typeof colors] || "bg-muted text-muted-foreground"
      }`}
    >
      {getStatusIcon(status)}
      <span>{getStatusText(status)}</span>
    </span>
  );
};

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
            <div className="h-8 bg-border rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-border rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-muted/30 min-h-screen">
        <div className="mx-auto px-8 py-8">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-muted-foreground">
              Unable to load business trip report data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-card z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Business Trip Report
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Action buttons if needed */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="w-full space-y-6">
          {/* Filter Card */}
          <Card className="border-border/60 shadow-xs bg-card">
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
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    Total Perjalanan Dinas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {overview.total_business_trips}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total semua perjalanan
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Sedang Berlangsung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {overview.ongoing_business_trips}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Perjalanan aktif</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    Total Peserta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {overview.total_assignees}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total pegawai yang terlibat
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Total Biaya
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(overview.total_cost)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rata-rata: {formatCurrency(overview.average_cost_per_trip)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Selesai
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {overview.completed_business_trips}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Perjalanan selesai
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Draft
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {overview.draft_business_trips}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Menunggu persetujuan
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Dibatalkan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {overview.canceled_business_trips}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Perjalanan dibatalkan
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Rencana Perjalanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {overview.upcoming_business_trps}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Akan datang</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Statistics */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
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
                        className="border-b border-border/50 pb-4 last:border-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {stat.month} {stat.year}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {stat.total_trips} perjalanan
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              {formatCurrency(stat.total_cost)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rata-rata:{" "}
                              {formatCurrency(stat.average_cost_per_trip)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-muted-foreground">
                                {stat.completed_trips} selesai
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Destinasi teratas:{" "}
                            <span className="font-medium">
                              {stat.top_destination}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Tidak ada data bulanan tersedia
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Destination Statistics */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
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
                          className="border-b border-border/50 pb-4 last:border-0"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-foreground">
                                {stat.destination}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {stat.total_trips} perjalanan
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                                {formatCurrency(stat.total_cost)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Rata-rata:{" "}
                                {formatCurrency(stat.average_cost_per_trip)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-muted-foreground">
                                {stat.completed_trips} selesai
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Terakhir: {formatDate(stat.last_trip_date)}
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
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
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-500" />
                Perjalanan Dinas Terkini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-b">
                      <TableHead className="whitespace-nowrap">Nomor</TableHead>
                      <TableHead className="whitespace-nowrap">Tujuan</TableHead>
                      <TableHead className="whitespace-nowrap">Tujuan Kegiatan</TableHead>
                      <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                      <TableHead className="whitespace-nowrap">Peserta</TableHead>
                      <TableHead className="whitespace-nowrap">Biaya</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrips.length > 0 ? (
                      recentTrips.map((trip: RecentBusinessTrip) => (
                        <TableRow
                          key={trip.id}
                          className="hover:bg-muted/50 border-b"
                        >
                          <TableCell className="font-medium text-foreground">
                            {trip.business_trip_number}
                          </TableCell>
                          <TableCell>
                            {trip.destination_city}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate" title={trip.activity_purpose}>
                            {trip.activity_purpose}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {trip.assignee_count} orang
                          </TableCell>
                          <TableCell className="font-medium text-foreground whitespace-nowrap">
                            {formatCurrency(trip.total_cost)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(trip.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Tidak ada perjalanan dinas ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
