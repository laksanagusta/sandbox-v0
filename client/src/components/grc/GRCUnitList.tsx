import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GRCUnit } from "../../../../shared/types";
import { grcApi } from "@/services/grc-api";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

interface GRCUnitListProps {
  onUnitClick: (id: number) => void;
}

export function GRCUnitList({ onUnitClick }: GRCUnitListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("average");

  const { data, isLoading } = useQuery({
    queryKey: ["grc-units", category, sortBy],
    queryFn: () =>
      grcApi.getUnits({
        category: category === "all" ? undefined : category,
        sort_by: sortBy,
        ascending: false,
      }),
  });

  const filteredUnits = data?.data.units.filter((unit) =>
    unit.name.toLowerCase().includes(search.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    // Single color (blue), intensity varies by score
    if (score >= 90) return "bg-blue-600 text-white hover:bg-blue-700";
    if (score >= 75) return "bg-blue-500 text-white hover:bg-blue-600";
    if (score >= 60) return "bg-blue-100 text-blue-700 hover:bg-blue-200";
    return "bg-muted text-muted-foreground hover:bg-muted/80";
  };

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-card"
            />
          </div>
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Balai Besar">Balai Besar</SelectItem>
                <SelectItem value="Kelas I">Kelas I</SelectItem>
                <SelectItem value="Kelas II">Kelas II</SelectItem>
                <SelectItem value="Loka">Loka</SelectItem>
                <SelectItem value="Direktorat">Direktorat</SelectItem>
                </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="average">Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rank">Rank</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Average Score</TableHead>
                <TableHead className="text-right">Percentile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredUnits?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits?.map((unit) => (
                  <TableRow
                    key={unit.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onUnitClick(unit.id)}
                  >
                    <TableCell className="font-medium text-muted-foreground">#{unit.rank}</TableCell>
                    <TableCell className="font-medium text-foreground">{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-muted-foreground border-border">{unit.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={`${getScoreColor(unit.average)} shadow-none border-0`}>
                        {unit.average.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {unit.percentile.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  );
}
