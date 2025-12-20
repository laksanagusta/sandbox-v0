import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { grcApi } from "@/services/grc-api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GRCHeatmapSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GRCHeatmapSection({ open, onOpenChange }: GRCHeatmapSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["grc-units-heatmap"],
    queryFn: () => grcApi.getUnits({ limit: 100 }),
    enabled: open, // Only fetch when open to save resources
  });

  const units = useMemo(() => {
    if (!data?.data.units) return [];

    const sorted = [...data.data.units];
    // Always sort by rank
    sorted.sort((a, b) => a.rank - b.rank);
    return sorted;
  }, [data]);

  const scoreKeys = useMemo(() => {
    if (!units.length) return [];
    
    // Default standard keys if available, otherwise fallback
    // We prefer a specific order if possible
    const preferredOrder = ["pski", "pspip", "pmri", "piepk", "pwbkrb", "psakip"];
    
    const allKeys = new Set<string>();
    units.forEach(u => {
      if (u.scores) {
        Object.keys(u.scores).forEach(k => allKeys.add(k));
      }
    });

    if (allKeys.size === 0) return preferredOrder;

    const keys = Array.from(allKeys);
    // Sort keys based on preferred order, then alphabetical for others
    keys.sort((a, b) => {
        const idxA = preferredOrder.indexOf(a);
        const idxB = preferredOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    return keys;
  }, [units]);

  const getCellColor = (score: number | undefined) => {
    if (score === undefined || score === null) return "bg-gray-100";
    if (score === 0) return "bg-gray-100"; // No activity/score
    
    // Scale for performance scores (typically 0-100)
    // Darker blue = Higher score (Linear-like theme)
    if (score >= 90) return "bg-blue-800"; // Excellent
    if (score >= 75) return "bg-blue-600"; // Good
    if (score >= 60) return "bg-blue-400"; // Average
    if (score > 0) return "bg-blue-200";   // Low
    
    return "bg-gray-100";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-fit sm:max-w-none overflow-y-auto bg-white p-6 sm:p-8">
        <SheetHeader className="mb-6 space-y-4">
          <div className="flex items-center justify-between gap-8">
            <div>
                <SheetTitle className="text-xl font-bold text-gray-900">Activity Heatmap</SheetTitle>
                <SheetDescription className="text-gray-500">Unit Performance Overview across all components</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : units.length === 0 ? (
          <p className="text-center py-10 text-gray-500">
            No data available
          </p>
        ) : (
          <div className="flex flex-col mt-4">
             {/* Header Row (Score Keys) */}
             <div className="flex ml-[220px] gap-[3px] mb-2">
                {scoreKeys.map((key) => (
                    <div key={key} className="w-4 flex justify-center">
                        <span className="text-[10px] text-gray-400 font-medium uppercase rotate-0 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
                            {key}
                        </span>
                    </div>
                ))}
             </div>

             {/* The Heatmap Rows */}
             <ScrollArea className="flex-1 w-full h-[calc(100vh-200px)] pr-4">
                <div className="flex flex-col gap-[3px]">
                    {units.map((unit) => (
                        <div key={unit.id} className="flex items-center group">
                            {/* Unit Label (Left) */}
                            <div className="w-[220px] pr-4 text-xs font-medium text-gray-500 group-hover:text-gray-900 transition-colors text-right truncate" title={unit.name}>
                                {formatUnitName(unit.name)}
                            </div>
                            
                            {/* Cells */}
                            <div className="flex gap-[3px]">
                                {scoreKeys.map((key) => {
                                    const score = unit.scores ? unit.scores[key] : 0;
                                    const colorClass = getCellColor(score);
                                    return (
                                        <HoverCard key={`${unit.id}-${key}`} openDelay={0} closeDelay={0}>
                                            <HoverCardTrigger asChild>
                                                <div
                                                    className={`w-4 h-4 rounded-[2px] cursor-pointer transition-colors ${colorClass} hover:opacity-80`}
                                                />
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-auto p-3 z-50 border-gray-200 shadow-lg">
                                                <div className="font-bold mb-1 text-sm text-gray-900">{unit.name}</div>
                                                <div className="text-xs text-gray-500 mb-2">Rank #{unit.rank}</div>
                                                <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-2">
                                                    <span className="uppercase text-xs font-medium text-gray-500">{key}</span>
                                                    <span className="font-bold text-base text-gray-900">{score}</span>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="vertical" />
             </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
