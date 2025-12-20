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
    <Card className={cn("overflow-hidden relative bg-white hover:border-gray-300 transition-colors", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">{value}</div>
        </div>
        
        {description && (
          <div className="flex items-center gap-2 mt-1">
             {indicatorColor && (
                <div className={cn("h-1.5 w-1.5 rounded-full", indicatorColor)} />
             )}
             <p className="text-xs text-gray-500 font-medium">
                {description}
             </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
