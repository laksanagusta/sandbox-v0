import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { grcApi } from "@/services/grc-api";
import { GRCUnitList } from "@/components/grc/GRCUnitList";
import { GRCUnitDetail } from "@/components/grc/GRCUnitDetail";
import { GRCStatisticsCard } from "@/components/grc/GRCStatisticsCard";
import { GRCCategoryBreakdown } from "@/components/grc/GRCCategoryBreakdown";
import { GRCRadarAnalysisSection } from "@/components/grc/GRCRadarAnalysisSection";
import { GRCHeatmapSection } from "@/components/grc/GRCHeatmapSection";
import {
  Building2,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Cell,
} from "recharts";

export default function GRCDashboardPage() {
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [heatmapOpen, setHeatmapOpen] = useState(false);

  // Queries
  const overviewQuery = useQuery({
    queryKey: ["grc-overview"],
    queryFn: grcApi.getOverview,
  });

  const categoriesQuery = useQuery({
    queryKey: ["grc-categories"],
    queryFn: grcApi.getCategories,
  });

  const allUnitsQuery = useQuery({
    queryKey: ["grc-units-all"],
    queryFn: () => grcApi.getUnits({ limit: 100, sort_by: "average", ascending: false }),
  });

  const unitDetailQuery = useQuery({
    queryKey: ["grc-unit-detail", selectedUnitId],
    queryFn: () => grcApi.getUnitDetail(selectedUnitId!),
    enabled: !!selectedUnitId,
  });

  const handleUnitClick = (id: number) => {
    setSelectedUnitId(id);
    setDetailOpen(true);
  };

  const formatUnitName = (name: string) => {
    let formatted = name;
    formatted = formatted.replace(/Balai Besar Kekarantinaan Kesehatan/g, "BBKK");
    formatted = formatted.replace(/Balai Kekarantinaan Kesehatan/g, "BKK");
    formatted = formatted.replace(/Loka Kekarantinaan Kesehatan/g, "LOKA");
    formatted = formatted.replace(/Direktorat/g, "Dit");
    formatted = formatted.replace(/Sekretariat Jenderal Penanggulangan Penyakit/g, "Setditjen");
    
    // Remove Kelas I & Kelas II
    formatted = formatted.replace(/ Kelas I/g, "");
    formatted = formatted.replace(/ Kelas II/g, "");
    
    return formatted;
  };

  const stats = overviewQuery.data?.data.statistics;
  const distribution = overviewQuery.data?.data.performance_distribution;

  return (
    <div className="bg-white flex flex-col h-screen overflow-hidden">
       {/* Header */}
       <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-white z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              GRC Dashboard
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            {/* Action buttons if needed */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
        <div className="w-full space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-white border p-1 rounded-md mb-2">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="units"
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500"
              >
                Unit Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Top Level Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <GRCStatisticsCard
                  title="Total Units"
                  value={stats?.total_units || 0}
                  description="Active Satuan Kerja"
                  className="shadow-none border border-gray-200"
                  indicatorColor="bg-blue-600"
                />
                <GRCStatisticsCard
                  title="Average Score"
                  value={stats?.average_score?.toFixed(2) || "0.00"}
                  description="National Average"
                  className="shadow-none border border-gray-200"
                  indicatorColor="bg-blue-600"
                />
                <GRCStatisticsCard
                  title="Median Score"
                  value={stats?.median?.toFixed(2) || "0.00"}
                  description="Median Performance"
                  className="shadow-none border border-gray-200"
                  indicatorColor="bg-blue-600"
                />
                <GRCStatisticsCard
                  title="Std Deviation"
                  value={stats?.std_deviation?.toFixed(2) || "0.00"}
                  description="Score Variation"
                  className="shadow-none border border-gray-200"
                  indicatorColor="bg-purple-600"
                />
              </div>

              {/* Average Score All Units */}
              <Card className="shadow-none border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Average Score by Unit</CardTitle>
                </CardHeader>
                <CardContent className="pl-0">
                  <div className="h-[500px] w-full">
                    {allUnitsQuery.data?.data.units && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[...allUnitsQuery.data.data.units]
                            .map(u => ({ ...u, formattedName: formatUnitName(u.name) }))
                            .sort((a, b) => b.average - a.average)} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis
                            dataKey="formattedName"
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={150}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            formatter={(value: number) => [Number(value).toFixed(2), "Score"]}
                            contentStyle={{
                              backgroundColor: '#fff',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px'
                            }}
                          />
                          <Bar
                            dataKey="average"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                            name="Score"
                          >
                             {[...allUnitsQuery.data.data.units].sort((a, b) => b.average - a.average).map((entry, index) => {
                                let color = "#e5e7eb"; // Default gray
                                if (entry.average >= 90) color = "#2563eb"; // Blue 600
                                else if (entry.average >= 75) color = "#60a5fa"; // Blue 400
                                else if (entry.average >= 60) color = "#93c5fd"; // Blue 300
                                else color = "#fbbf24"; // Amber/Yellow
                                return <Cell key={`cell-${index}`} fill={color} />;
                             })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Performance Distribution Chart */}
                <Card className="shadow-none border border-gray-200 h-[520px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Performance Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-0 flex-1">
                    <div className="h-full w-full">
                      {distribution && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barGap={2} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                              dataKey="level"
                              stroke="#9ca3af"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={10}
                            />
                            <YAxis
                              stroke="#9ca3af"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                              tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  borderRadius: '6px',
                                  border: '1px solid #e5e7eb',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                  fontSize: '12px'
                                }}
                            />
                            <Bar
                              dataKey="count"
                              radius={[4, 4, 0, 0]}
                              barSize={48}
                            >
                              {distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={
                                    entry.level === "Excellent" ? "#2563eb" : // Blue 600
                                    entry.level === "Good" ? "#60a5fa" :     // Blue 400
                                    entry.level === "Fair" ? "#93c5fd" :     // Blue 300
                                    "#fbbf24"                                // Amber
                                } />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Radar Analysis Spotlight */}
                <div className="h-full">
                    <GRCRadarAnalysisSection />
                </div>
              </div>

              {/* Weakest Components */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Areas for Improvement</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {overviewQuery.data?.data.weakest_components.map((comp) => (
                        <Card key={comp.code} className="shadow-none border border-gray-200 bg-white hover:border-gray-300 transition-colors">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                     {comp.name}
                                </CardTitle>
                                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                    {comp.code}
                                </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-end mt-2">
                                <div>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {comp.average.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-500 block">Avg Score</span>
                                </div>
                                <div className="text-right">
                                     <span className="text-base font-semibold text-red-600">
                                        {comp.units_below_80}
                                     </span>
                                     <span className="text-xs text-gray-500 block">Units &lt; 80</span>
                                </div>
                            </div>
                          </CardContent>
                        </Card>
                     ))}
                  </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
                {categoriesQuery.data?.data.categories && (
                  <GRCCategoryBreakdown categories={categoriesQuery.data.data.categories} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="units" className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-none">
                 <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-md">
                        <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Unit Performance List</h3>
                        <p className="text-sm text-gray-500">View and analyze individual unit performance</p>
                    </div>
                 </div>
                 <Button 
                    variant="outline" 
                    onClick={() => setHeatmapOpen(true)}
                    className="border-gray-200 hover:bg-gray-50 text-gray-700"
                 >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Heatmap
                 </Button>
              </div>
              <GRCUnitList onUnitClick={handleUnitClick} />
            </TabsContent>
          </Tabs>

          {/* Unit Detail Sheet */}
          <GRCUnitDetail
            data={unitDetailQuery.data?.data || null}
            open={detailOpen}
            onOpenChange={setDetailOpen}
          />
          
          {/* Heatmap Sheet */}
          <GRCHeatmapSection 
            open={heatmapOpen}
            onOpenChange={setHeatmapOpen}
          />
        </div>
      </div>
    </div>
  );
}
