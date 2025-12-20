import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GRCStatisticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  indicatorColor?: string;
}

export function GRCStatisticsCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  indicatorColor,
}: GRCStatisticsCardProps) {
  return (
    <Card className={cn("overflow-hidden relative", className)}>
       {indicatorColor && (
          <div className={cn("absolute left-0 top-0 bottom-0 w-1", indicatorColor)} />
       )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
            {indicatorColor && !Icon && (
                <div className={cn("h-8 w-1 rounded-full", indicatorColor)} />
            )}
            <div className="text-3xl font-bold tracking-tight">{value}</div>
        </div>
        
        {description && (
          <p className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
             {/* Simulating 'up' trend or just description */}
             {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
