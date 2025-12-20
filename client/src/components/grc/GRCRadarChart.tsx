import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface GRCRadarChartProps {
  data: any[];
  keys: { key: string; label: string; color: string }[];
  className?: string;
}

export function GRCRadarChart({ data, keys, className }: GRCRadarChartProps) {
  const chartConfig: ChartConfig = keys.reduce((acc, curr) => {
    acc[curr.key] = {
      label: curr.label,
      color: curr.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer
      config={chartConfig}
      className={`mx-auto aspect-square ${className}`}
    >
      <RadarChart data={data}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <PolarGrid gridType="polygon" className="stroke-gray-200 dark:stroke-gray-700" />
        <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        {keys.map((k, i) => (
          <Radar
            key={k.key}
            name={k.label}
            dataKey={k.key}
            stroke={i === 0 ? "#3b82f6" : "#ec4899"} // Blue for Unit, Pink for Avg
            fill={i === 0 ? "#3b82f6" : "#ec4899"}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        ))}
        <ChartLegend className="mt-8" content={<ChartLegendContent />} />
      </RadarChart>
    </ChartContainer>
  );
}

