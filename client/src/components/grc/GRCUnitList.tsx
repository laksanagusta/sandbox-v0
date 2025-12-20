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
    if (score >= 90) return "bg-green-500 hover:bg-green-600";
    if (score >= 80) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Performance List</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average">Score</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="rank">Rank</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Average Score</TableHead>
                <TableHead className="text-right">Percentile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredUnits?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits?.map((unit) => (
                  <TableRow
                    key={unit.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onUnitClick(unit.id)}
                  >
                    <TableCell className="font-medium">#{unit.rank}</TableCell>
                    <TableCell>{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{unit.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={getScoreColor(unit.average)}>
                        {unit.average.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {unit.percentile.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
