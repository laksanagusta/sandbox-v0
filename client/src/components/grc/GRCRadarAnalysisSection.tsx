import { useState, useMemo } from "react";
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
    <Card className="col-span-1 border-blue-200 dark:border-blue-900 bg-blue-50/10">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Deep Dive Analysis</CardTitle>
                <CardDescription>Analyze component performance regarding national average</CardDescription>
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                         <HelpCircle className="h-4 w-4 text-muted-foreground" />
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
      <CardContent>
        {isLoadingDetail ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : selectedUnitId && unitDetail?.data ? (
          <div className="space-y-4">
            <div className="relative -mt-4 h-[250px] flex items-center justify-center">
                <GRCRadarChart data={radarChartData} keys={chartKeys} className="w-full h-full" />
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
                 <div className="p-3 bg-card rounded border">
                     <span className="text-muted-foreground text-xs block">Strongest Component</span>
                     <div className="font-semibold text-green-600 flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        {unitDetail.data.strength.component}
                     </div>
                     <span className="text-xs text-muted-foreground">
                        {unitDetail.data.strength.value} (+{unitDetail.data.strength.gap_from_average.toFixed(1)})
                     </span>
                 </div>
                 <div className="p-3 bg-card rounded border">
                     <span className="text-muted-foreground text-xs block">Weakest Component</span>
                     <div className="font-semibold text-red-500 flex items-center gap-1">
                        <ArrowDown className="h-3 w-3" />
                        {unitDetail.data.weakness.component}
                     </div>
                     <span className="text-xs text-muted-foreground">
                        {unitDetail.data.weakness.value} ({unitDetail.data.weakness.gap_from_average.toFixed(1)})
                     </span>
                 </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[340px] flex-col items-center justify-center text-muted-foreground">
            <p className="text-center text-sm">Select a unit above to view the analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
