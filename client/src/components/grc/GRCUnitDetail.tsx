import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GRCUnitDetailData } from "../../../../shared/types";
import { GRCRadarChart } from "./GRCRadarChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon, Trophy, AlertTriangle } from "lucide-react";

interface GRCUnitDetailProps {
  data: GRCUnitDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GRCUnitDetail({ data, open, onOpenChange }: GRCUnitDetailProps) {
  if (!data) return null;

  const radarData = data.radar_data.labels.map((label, index) => ({
    subject: label,
    value: data.radar_data.values[index],
    average: data.radar_data.average_values[index],
  }));

  const chartKeys = [
    { key: "value", label: data.unit.name, color: "hsl(var(--chart-1))" },
    { key: "average", label: "National Average", color: "hsl(var(--muted-foreground))" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pr-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{data.unit.category}</Badge>
            <span className="text-sm font-medium text-muted-foreground">
              Rank #{data.unit.rank}
            </span>
          </div>
          <SheetTitle className="text-xl">{data.unit.name}</SheetTitle>
          <SheetDescription>
            Performance Overview and Gap Analysis
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-sm text-muted-foreground">Average Score</div>
              <div className="text-2xl font-bold">{data.unit.average.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-sm text-muted-foreground">Percentile</div>
              <div className="text-2xl font-bold">
                {data.unit.percentile.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div>
            <h3 className="mb-4 text-sm font-medium">Performance Radar</h3>
            <GRCRadarChart data={radarData} keys={chartKeys} />
          </div>

          {/* Weakness & Strength */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Trophy className="h-4 w-4" />
                <h4 className="font-semibold">Top Strength</h4>
              </div>
              <div className="mt-2 text-lg font-bold">
                {data.strength.component}
              </div>
              <div className="text-sm text-green-600 dark:text-green-500">
                Score: {data.strength.value} (+{data.strength.gap_from_average.toFixed(2)})
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="font-semibold">Main Weakness</h4>
              </div>
              <div className="mt-2 text-lg font-bold">
                {data.weakness.component}
              </div>
              <div className="text-sm text-red-600 dark:text-red-500">
                Score: {data.weakness.value} ({data.weakness.gap_from_average.toFixed(2)})
              </div>
            </div>
          </div>

          {/* Gap Analysis Table */}
          <div>
            <h3 className="mb-4 text-sm font-medium">Gap Analysis</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.gap_analysis.map((item) => (
                    <TableRow key={item.component}>
                      <TableCell className="font-medium">{item.component}</TableCell>
                      <TableCell className="text-right font-bold">
                        {item.value}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.average}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            item.gap >= 0
                              ? "flex items-center justify-end gap-1 text-green-600"
                              : "flex items-center justify-end gap-1 text-red-600"
                          }
                        >
                          {item.gap > 0 ? (
                            <ArrowUpIcon className="h-3 w-3" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3" />
                          )}
                          {Math.abs(item.gap).toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            Compared to {data.category_comparison.category_name} Average:{" "}
            <span className={data.category_comparison.gap_to_category >= 0 ? "text-green-600" : "text-red-600"}>
               {data.category_comparison.gap_to_category > 0 ? "+" : ""}
               {data.category_comparison.gap_to_category.toFixed(2)}
            </span>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
