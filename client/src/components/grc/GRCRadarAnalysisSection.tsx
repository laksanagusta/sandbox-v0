import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SearchableSelect } from "@/components/SearchableSelect";
import { GRCUnitDetailData } from "../../../../shared/types";
import { GRCRadarChart } from "./GRCRadarChart";
import { grcApi } from "@/services/grc-api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function GRCRadarAnalysisSection() {
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all units for the dropdown (limit 100 to cover 57 units)
  const { data: unitsData, isLoading: isLoadingUnits } = useQuery({
    queryKey: ["grc-units-all"],
    queryFn: () => grcApi.getUnits({ limit: 100 }),
  });

  // Set default unit when data is loaded
  useEffect(() => {
    if (unitsData?.data.units && unitsData.data.units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(unitsData.data.units[0].id.toString());
    }
  }, [unitsData, selectedUnitId]);

  // Fetch details for the selected unit
  const { data: unitDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["grc-unit-detail", selectedUnitId],
    queryFn: () => grcApi.getUnitDetail(selectedUnitId),
    enabled: !!selectedUnitId,
  });

  const options = useMemo(() => {
    if (!unitsData?.data.units) return [];
    return unitsData.data.units
      .filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((u) => ({
        value: u.id.toString(),
        label: u.name,
        subtitle: `${u.category} - Rank #${u.rank}`,
      }));
  }, [unitsData, searchTerm]);

  // Transform data for Radar Chart
  const radarChartData = useMemo(() => {
    if (!unitDetail?.data) return [];
    const { radar_data } = unitDetail.data;
    return radar_data.labels.map((label, index) => ({
      subject: label,
      value: radar_data.values[index],
      average: radar_data.average_values[index],
      fullMark: 100,
    }));
  }, [unitDetail]);

  const chartKeys = useMemo(() => {
    if (!unitDetail?.data) return [];
    return [
      { key: "value", label: unitDetail.data.unit.name.length > 20 ? unitDetail.data.unit.name.substring(0, 20) + '...' : unitDetail.data.unit.name, color: "hsl(var(--primary))" },
      { key: "average", label: "Nat. Avg", color: "hsl(var(--muted-foreground))" },
    ];
  }, [unitDetail]);

  return (
    <Card className="col-span-1 shadow-none border border-gray-200 h-[570px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-base font-medium">Deep Dive Analysis</CardTitle>
                <CardDescription className="text-gray-500">Analyze component performance vs national average</CardDescription>
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                         <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Select a unit to view its detailed component scores</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <div className="mt-4">
          <SearchableSelect
            value={selectedUnitId}
            onValueChange={setSelectedUnitId}
            options={options}
            onSearch={setSearchTerm}
            placeholder="Select a Work Unit..."
            searchPlaceholder="Search unit name..."
            loading={isLoadingUnits}
            className="w-full"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoadingDetail ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : selectedUnitId && unitDetail?.data ? (
          <div className="space-y-6">
            <div className="relative h-[300px] flex items-center justify-center">
                <GRCRadarChart data={radarChartData} keys={chartKeys} className="w-full h-full" />
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
                 <div className="p-3 bg-white rounded border border-gray-100 shadow-sm">
                     <span className="text-gray-500 text-xs block mb-1">Strongest Component</span>
                     <div className="font-semibold text-gray-900 flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-emerald-500" />
                        <span className="truncate">{unitDetail.data.strength.component}</span>
                     </div>
                     <span className="text-xs text-emerald-600 font-medium">
                        {unitDetail.data.strength.value} (+{unitDetail.data.strength.gap_from_average.toFixed(1)})
                     </span>
                 </div>
                 <div className="p-3 bg-white rounded border border-gray-100 shadow-sm">
                     <span className="text-gray-500 text-xs block mb-1">Weakest Component</span>
                     <div className="font-semibold text-gray-900 flex items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-red-500" />
                        <span className="truncate">{unitDetail.data.weakness.component}</span>
                     </div>
                     <span className="text-xs text-red-600 font-medium">
                        {unitDetail.data.weakness.value} ({unitDetail.data.weakness.gap_from_average.toFixed(1)})
                     </span>
                 </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-md border border-dashed border-gray-200">
            <p className="text-center text-sm">Select a unit above to view the analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
