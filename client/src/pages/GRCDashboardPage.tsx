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

  const unitDetailQuery = useQuery({
    queryKey: ["grc-unit-detail", selectedUnitId],
    queryFn: () => grcApi.getUnitDetail(selectedUnitId!),
    enabled: !!selectedUnitId,
  });

  const handleUnitClick = (id: number) => {
    setSelectedUnitId(id);
    setDetailOpen(true);
  };

  const stats = overviewQuery.data?.data.statistics;
  const distribution = overviewQuery.data?.data.performance_distribution;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">GRC Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* Add date range picker or export button here if needed */}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Unit Analysis</TabsTrigger>
          {/* <TabsTrigger value="comparison">Comparison</TabsTrigger> */}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Top Level Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GRCStatisticsCard
              title="Total Units"
              value={stats?.total_units || 0}
              description="Active Satuan Kerja"
              className="border-none shadow-sm hover:shadow-md transition-shadow"
              indicatorColor="bg-blue-500"
            />
            <GRCStatisticsCard
              title="Average Score"
              value={stats?.average_score?.toFixed(2) || "0.00"}
              description="National Average"
              className="border-none shadow-sm hover:shadow-md transition-shadow"
              indicatorColor="bg-emerald-500"
            />
            <GRCStatisticsCard
              title="Median Score"
              value={stats?.median?.toFixed(2) || "0.00"}
              description="Median Performance"
              className="border-none shadow-sm hover:shadow-md transition-shadow"
              indicatorColor="bg-amber-500"
            />
            <GRCStatisticsCard
              title="Std Deviation"
              value={stats?.std_deviation?.toFixed(2) || "0.00"}
              description="Score Variation"
              className="border-none shadow-sm hover:shadow-md transition-shadow"
              indicatorColor="bg-purple-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Performance Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[380px] w-full">
                  {distribution && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                          dataKey="level"
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-lg border-none bg-white p-3 shadow-xl ring-1 ring-black/5">
                                  <div className="font-semibold text-gray-900 mb-1">{data.level}</div>
                                  <div className="text-xs text-gray-500 flex flex-col gap-1">
                                    <div className="flex justify-between gap-4">
                                        <span>Count:</span>
                                        <span className="font-bold text-gray-900">{data.count}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span>Range:</span>
                                        <span>{data.min_score} - {data.max_score}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[6, 6, 6, 6]}
                          barSize={40}
                        >
                          {/* Aesthetic colors matching the reference image vibes (Cyan, Violet, Purple, Pink) */}
                          {distribution.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={
                                 entry.level === "Excellent" ? "#06b6d4" : // Cyan
                                 entry.level === "Good" ? "#8b5cf6" :     // Violet
                                 entry.level === "Fair" ? "#f59e0b" :     // Amber
                                 "#ef4444"                                // Red
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
            <div>
                <GRCRadarAnalysisSection />
            </div>
          </div>

          {/* Weakest Components */}
          <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Areas for Improvement</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {overviewQuery.data?.data.weakest_components.map((comp) => (
                    <Card key={comp.code} className="bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                                 {comp.name}
                            </CardTitle>
                            <span className="text-xs font-bold bg-white text-red-700 px-2 py-1 rounded border border-red-100">
                                {comp.code}
                            </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-2xl font-bold text-red-800 dark:text-red-300">
                                    {comp.average.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground block">Average Score</span>
                            </div>
                            <div className="text-right">
                                 <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {comp.units_below_80}
                                 </span>
                                 <span className="text-xs text-muted-foreground block">Units &lt; 80</span>
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                 ))}
              </div>
          </div>

          {/* Category Breakdown */}
          <h3 className="text-lg font-semibold mt-6 mb-2">Category Breakdown</h3>
          {categoriesQuery.data?.data.categories && (
            <GRCCategoryBreakdown categories={categoriesQuery.data.data.categories} />
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
             <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Unit Performance List</h3>
             </div>
             <Button variant="outline" onClick={() => setHeatmapOpen(true)}>
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
  );
}
