import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GRCCategoryBreakdown as CategoryType } from "../../../../shared/types";
import { Progress } from "@/components/ui/progress";

interface GRCCategoryBreakdownProps {
  categories: CategoryType[];
}

export function GRCCategoryBreakdown({ categories }: GRCCategoryBreakdownProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <Card key={cat.name}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {cat.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cat.average.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mb-4">
              {cat.count} Units · Avg Range: {cat.min.toFixed(1)} - {cat.max.toFixed(1)}
            </div>
            
            <div className="space-y-3">
               <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-600 font-medium">Top: {cat.top_unit.name}</span>
                    <span>{cat.top_unit.average.toFixed(2)}</span>
                  </div>
                  <Progress value={(cat.top_unit.average / 100) * 100} className="h-1" />
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-500 font-medium">Low: {cat.bottom_unit.name}</span>
                    <span>{cat.bottom_unit.average.toFixed(2)}</span>
                  </div>
                  <Progress value={(cat.bottom_unit.average / 100) * 100} className="h-1 bg-secondary" />
               </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
