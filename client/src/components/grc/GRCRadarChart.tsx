import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface GRCRadarChartProps {
  data: any[];
  keys: { key: string; label: string; color: string }[];
  className?: string;
}

// Custom tick component to position labels further from the chart
const CustomTick = ({ payload, x, y, cx, cy, ...rest }: any) => {
  // Calculate angle and add offset to push labels further out
  const offsetMultiplier = 1.10; // Push labels 25% further from center
  const newX = cx + (x - cx) * offsetMultiplier;
  const newY = cy + (y - cy) * offsetMultiplier;
  
  return (
    <text
      {...rest}
      x={newX}
      y={newY}
      fill="hsl(var(--muted-foreground))"
      fontSize={10}
      textAnchor="middle"
      dominantBaseline="middle"
    >
      {payload.value}
    </text>
  );
};

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
      className={`mx-auto ${className}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          data={data} 
          cx="50%" 
          cy="50%" 
          outerRadius="75%"
        >
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <PolarGrid gridType="polygon" className="stroke-gray-200 dark:stroke-gray-700" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={<CustomTick />}
            tickLine={false}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          {[...keys].reverse().map((k, i) => (
            <Radar
              key={k.key}
              name={k.label}
              dataKey={k.key}
              stroke={i === 0 ? "#f97316" : "#3b82f6"}
              fill={i === 0 ? "#f97316" : "#3b82f6"}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
          <ChartLegend className="mt-4" content={<ChartLegendContent />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
