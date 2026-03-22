import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  GitCompare,
  Play,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import TickerBadge from "../components/TickerBadge";
import { useCompare } from "../context/CompareContext";
import type { Company } from "../data/companiesData";
import {
  useAllCompanies,
  useScreenStocks,
  useSectors,
} from "../hooks/useQueries";
import {
  formatCurrency,
  formatMarketCap,
  formatRatio,
} from "../lib/formatters";

type SortKey = keyof Company;
type SortDir = "asc" | "desc";

const DEFAULT_PARAMS = {
  minPE: "",
  maxPE: "",
  minROE: "",
  minROCE: "",
  minMarketCap: "",
  maxMarketCap: "",
  minPB: "",
  maxPB: "",
  maxDebtEquity: "",
  sector: "all",
};

function toNum(v: string): number | null {
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

export default function ScreenerPage() {
  const navigate = useNavigate();
  const { compareList, addToCompare, isInCompare } = useCompare();
  const [filters, setFilters] = useState(DEFAULT_PARAMS);
  const [runParams, setRunParams] = useState<typeof DEFAULT_PARAMS | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Load preset filters from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("screener_preset_filters");
    if (stored) {
      try {
        const preset = JSON.parse(stored) as typeof DEFAULT_PARAMS;
        sessionStorage.removeItem("screener_preset_filters");
        const merged = { ...DEFAULT_PARAMS, ...preset };
        setFilters(merged);
        setRunParams(merged);
      } catch {
        // ignore
      }
    }
  }, []);

  const { data: sectors = [] } = useSectors();
  const { data: allCompanies = [], isLoading: companiesLoading } =
    useAllCompanies();

  const screenEnabled = runParams !== null;
  const { data: screenerResults, isLoading: screenerLoading } = useScreenStocks(
    {
      minPE: runParams ? toNum(runParams.minPE) : null,
      maxPE: runParams ? toNum(runParams.maxPE) : null,
      minROE: runParams ? toNum(runParams.minROE) : null,
      minROCE: runParams ? toNum(runParams.minROCE) : null,
      minMarketCap: runParams ? toNum(runParams.minMarketCap) : null,
      maxMarketCap: runParams ? toNum(runParams.maxMarketCap) : null,
      minPB: runParams ? toNum(runParams.minPB) : null,
      maxPB: runParams ? toNum(runParams.maxPB) : null,
      maxDebtEquity: runParams ? toNum(runParams.maxDebtEquity) : null,
      sector: runParams?.sector === "all" ? null : (runParams?.sector ?? null),
    },
    screenEnabled,
  );

  const displayData = runParams ? (screenerResults ?? []) : allCompanies;
  const isLoading = runParams ? screenerLoading : companiesLoading;

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return displayData;
    const q = search.toLowerCase();
    return displayData.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [displayData, search]);

  const sorted = useMemo(() => {
    return [...filteredBySearch].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return 0;
    });
  }, [filteredBySearch, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ChevronDown className="w-3 h-3 opacity-30 inline ml-0.5" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5 text-primary" />
    );
  };

  const handleExport = () => {
    const rows = sorted.map((c) => ({
      Symbol: c.symbol,
      Name: c.name,
      Sector: c.sector,
      "Market Cap (Cr)": c.marketCap,
      "Price (₹)": c.price,
      PE: c.pe,
      PB: c.pb,
      "ROE (%)": c.roe,
      "ROCE (%)": c.roce,
      "D/E": c.debtEquity,
      "Div Yield (%)": c.dividendYield,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Screener Results");
    XLSX.writeFile(wb, "IndiaScreener_Results.xlsx");
  };

  const handleCompareClick = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (isInCompare(symbol)) {
      toast.info(`${symbol} is already in comparison`);
      return;
    }
    const added = addToCompare(symbol);
    if (added) {
      toast.success(`Added ${symbol} to comparison`);
    } else {
      toast.error("You can compare up to 3 companies. Remove one first.");
    }
  };

  const set =
    (key: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFilters((p) => ({ ...p, [key]: e.target.value }));

  const COLS: [SortKey, string][] = [
    ["symbol", "Symbol"],
    ["name", "Company"],
    ["sector", "Sector"],
    ["marketCap", "Mkt Cap"],
    ["price", "Price"],
    ["pe", "PE"],
    ["pb", "PB"],
    ["roe", "ROE%"],
    ["roce", "ROCE%"],
    ["debtEquity", "D/E"],
    ["dividendYield", "Div%"],
  ];

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-display text-foreground">
            Stock Screener
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filter {allCompanies.length} Indian stocks by fundamental ratios
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 mb-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Filters
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min PE</Label>
              <Input
                data-ocid="screener.min_pe.input"
                placeholder="e.g. 5"
                value={filters.minPE}
                onChange={set("minPE")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max PE</Label>
              <Input
                data-ocid="screener.max_pe.input"
                placeholder="e.g. 30"
                value={filters.maxPE}
                onChange={set("maxPE")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Min ROE (%)
              </Label>
              <Input
                data-ocid="screener.min_roe.input"
                placeholder="e.g. 15"
                value={filters.minROE}
                onChange={set("minROE")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Min ROCE (%)
              </Label>
              <Input
                data-ocid="screener.min_roce.input"
                placeholder="e.g. 15"
                value={filters.minROCE}
                onChange={set("minROCE")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max D/E</Label>
              <Input
                data-ocid="screener.max_de.input"
                placeholder="e.g. 1"
                value={filters.maxDebtEquity}
                onChange={set("maxDebtEquity")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min PB</Label>
              <Input
                data-ocid="screener.min_pb.input"
                placeholder="e.g. 1"
                value={filters.minPB}
                onChange={set("minPB")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max PB</Label>
              <Input
                data-ocid="screener.max_pb.input"
                placeholder="e.g. 10"
                value={filters.maxPB}
                onChange={set("maxPB")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Min Market Cap (Cr)
              </Label>
              <Input
                data-ocid="screener.min_mcap.input"
                placeholder="e.g. 500"
                value={filters.minMarketCap}
                onChange={set("minMarketCap")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Max Market Cap (Cr)
              </Label>
              <Input
                data-ocid="screener.max_mcap.input"
                placeholder="e.g. 50000"
                value={filters.maxMarketCap}
                onChange={set("maxMarketCap")}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sector</Label>
              <Select
                value={filters.sector}
                onValueChange={(v) => setFilters((p) => ({ ...p, sector: v }))}
              >
                <SelectTrigger
                  data-ocid="screener.sector.select"
                  className="h-8 text-sm"
                >
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-ocid="screener.run.primary_button"
              onClick={() => setRunParams({ ...filters })}
              className="h-8 px-5 text-sm"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Run Screener
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-ocid="screener.reset.button"
              onClick={() => {
                setFilters(DEFAULT_PARAMS);
                setRunParams(null);
              }}
              className="h-8 text-xs text-muted-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              data-ocid="screener.search.search_input"
              placeholder="Search by name or symbol…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {sorted.length} result{sorted.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={sorted.length === 0}
              data-ocid="screener.export.button"
              className="h-8 text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                {COLS.map(([key, label]) => (
                  <TableHead
                    key={key}
                    className="text-xs font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap py-2.5"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} />
                  </TableHead>
                ))}
                <TableHead className="text-xs font-semibold text-muted-foreground py-2.5 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                  <TableRow key={i} data-ocid="screener.loading_state">
                    {Array.from({ length: 12 }).map((__, j) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="screener.empty_state"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-30" />
                      <p className="text-sm">No stocks match your filters.</p>
                      <p className="text-xs">
                        Try adjusting your screener criteria.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((company, idx) => (
                  <TableRow
                    key={company.symbol}
                    className="table-row-hover border-b border-border/50 group"
                    data-ocid={`screener.item.${idx + 1}`}
                    onClick={() =>
                      navigate({
                        to: "/company/$symbol",
                        params: { symbol: company.symbol },
                      })
                    }
                  >
                    <TableCell className="py-2">
                      <TickerBadge symbol={company.symbol} />
                    </TableCell>
                    <TableCell className="text-sm font-medium py-2 max-w-[200px] truncate">
                      {company.name}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {company.sector}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono-data py-2">
                      {formatMarketCap(company.marketCap)}
                    </TableCell>
                    <TableCell className="text-sm font-mono-data py-2">
                      {formatCurrency(company.price)}
                    </TableCell>
                    <TableCell className="text-sm font-mono-data py-2">
                      {formatRatio(company.pe)}
                    </TableCell>
                    <TableCell className="text-sm font-mono-data py-2">
                      {formatRatio(company.pb)}
                    </TableCell>
                    <TableCell
                      className={`text-sm font-mono-data py-2 ${
                        company.roe >= 15 ? "text-positive" : ""
                      }`}
                    >
                      {company.roe.toFixed(1)}%
                    </TableCell>
                    <TableCell
                      className={`text-sm font-mono-data py-2 ${
                        company.roce >= 15 ? "text-positive" : ""
                      }`}
                    >
                      {company.roce.toFixed(1)}%
                    </TableCell>
                    <TableCell
                      className={`text-sm font-mono-data py-2 ${
                        company.debtEquity > 1 ? "text-negative" : ""
                      }`}
                    >
                      {formatRatio(company.debtEquity)}
                    </TableCell>
                    <TableCell className="text-sm font-mono-data py-2">
                      {company.dividendYield.toFixed(2)}%
                    </TableCell>
                    <TableCell className="py-2">
                      <button
                        type="button"
                        onClick={(e) => handleCompareClick(e, company.symbol)}
                        data-ocid="screener.compare.button"
                        title="Add to Compare"
                        className={`p-1 rounded transition-colors ${
                          isInCompare(company.symbol)
                            ? "text-primary"
                            : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Sticky Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Comparing {compareList.length}{" "}
                {compareList.length === 1 ? "company" : "companies"}:
              </span>
              <div className="flex gap-1.5">
                {compareList.map((sym) => (
                  <Badge key={sym} variant="secondary" className="text-xs">
                    {sym}
                  </Badge>
                ))}
              </div>
            </div>
            <Link to="/compare">
              <Button size="sm" data-ocid="screener.compare_bar.button">
                View Comparison →
              </Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
