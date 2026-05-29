import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, ArrowUpDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

interface ScanRecord {
  id: string;
  file_name: string;
  document_type: string | null;
  summary: string | null;
  risk_score: number | null;
  clauses: Json | null;
  created_at: string;
}

type SortField = "date" | "risk_score" | "file_name";
type SortDir = "asc" | "desc";

interface ScanFiltersProps {
  scans: ScanRecord[];
  children: (filtered: ScanRecord[]) => React.ReactNode;
}

const ScanFilters = ({ scans, children }: ScanFiltersProps) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const docTypes = useMemo(() => {
    const types = new Set<string>();
    scans.forEach((s) => {
      if (s.document_type) types.add(s.document_type);
    });
    return Array.from(types).sort();
  }, [scans]);

  const hasActiveFilters = dateFrom || dateTo || riskFilter !== "all" || docTypeFilter !== "all";

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setRiskFilter("all");
    setDocTypeFilter("all");
  };

  const filtered = useMemo(() => {
    let result = [...scans];

    if (dateFrom) {
      result = result.filter((s) => new Date(s.created_at) >= dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      result = result.filter((s) => new Date(s.created_at) <= end);
    }
    if (riskFilter === "high") {
      result = result.filter((s) => s.risk_score !== null && s.risk_score < 40);
    } else if (riskFilter === "medium") {
      result = result.filter((s) => s.risk_score !== null && s.risk_score >= 40 && s.risk_score < 70);
    } else if (riskFilter === "low") {
      result = result.filter((s) => s.risk_score !== null && s.risk_score >= 70);
    }
    if (docTypeFilter !== "all") {
      result = result.filter((s) => s.document_type === docTypeFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "risk_score") {
        cmp = (a.risk_score ?? 0) - (b.risk_score ?? 0);
      } else {
        cmp = a.file_name.localeCompare(b.file_name);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [scans, dateFrom, dateTo, riskFilter, docTypeFilter, sortField, sortDir]);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-3 h-3" />
              {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-3 h-3" />
              {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Risk Filter */}
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="high">High Risk (&lt;40)</SelectItem>
            <SelectItem value="medium">Medium (40–69)</SelectItem>
            <SelectItem value="low">Low Risk (70+)</SelectItem>
          </SelectContent>
        </Select>

        {/* Document Type Filter */}
        {docTypes.length > 0 && (
          <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Doc Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {docTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select value={`${sortField}-${sortDir}`} onValueChange={(v) => {
          const [f, d] = v.split("-") as [SortField, SortDir];
          setSortField(f);
          setSortDir(d);
        }}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="risk_score-asc">Riskiest First</SelectItem>
            <SelectItem value="risk_score-desc">Safest First</SelectItem>
            <SelectItem value="file_name-asc">Name A–Z</SelectItem>
            <SelectItem value="file_name-desc">Name Z–A</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {scans.length} scans
        </span>
      </div>

      {children(filtered)}
    </div>
  );
};

export default ScanFilters;
