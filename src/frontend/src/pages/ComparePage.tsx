import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, GitCompare, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useCompare } from "../context/CompareContext";
import { COMPANIES } from "../data/companiesData";
import { formatMarketCap, formatRatio } from "../lib/formatters";

type MetricRow = {
  label: string;
  key: keyof (typeof COMPANIES)[0];
  format: (v: number) => string;
  bestIsHigh: boolean;
  unit?: string;
};

const METRICS: MetricRow[] = [
  {
    label: "Market Cap",
    key: "marketCap",
    format: (v) => formatMarketCap(v),
    bestIsHigh: true,
  },
  {
    label: "Price (₹)",
    key: "price",
    format: (v) => `₹${v.toLocaleString("en-IN")}`,
    bestIsHigh: true,
  },
  {
    label: "PE Ratio",
    key: "pe",
    format: (v) => formatRatio(v),
    bestIsHigh: false,
  },
  {
    label: "PB Ratio",
    key: "pb",
    format: (v) => formatRatio(v),
    bestIsHigh: false,
  },
  {
    label: "ROE (%)",
    key: "roe",
    format: (v) => `${v.toFixed(1)}%`,
    bestIsHigh: true,
  },
  {
    label: "ROCE (%)",
    key: "roce",
    format: (v) => `${v.toFixed(1)}%`,
    bestIsHigh: true,
  },
  {
    label: "Revenue Growth (%)",
    key: "revenueGrowth",
    format: (v) => `${v.toFixed(1)}%`,
    bestIsHigh: true,
  },
  {
    label: "Profit Growth (%)",
    key: "profitGrowth",
    format: (v) => `${v.toFixed(1)}%`,
    bestIsHigh: true,
  },
  {
    label: "Debt / Equity",
    key: "debtEquity",
    format: (v) => formatRatio(v),
    bestIsHigh: false,
  },
  {
    label: "Dividend Yield (%)",
    key: "dividendYield",
    format: (v) => `${v.toFixed(2)}%`,
    bestIsHigh: true,
  },
];

export default function ComparePage() {
  const { compareList, addToCompare, removeFromCompare } = useCompare();
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const companies = useMemo(
    () =>
      compareList
        .map((sym) => COMPANIES.find((c) => c.symbol === sym))
        .filter(Boolean) as (typeof COMPANIES)[0][],
    [compareList],
  );

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return COMPANIES.filter(
      (c) =>
        !compareList.includes(c.symbol) &&
        (c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)),
    ).slice(0, 8);
  }, [search, compareList]);

  const handleAdd = (symbol: string) => {
    addToCompare(symbol);
    setSearch("");
    setDropdownOpen(false);
  };

  const getBestWorst = (
    metricKey: keyof (typeof COMPANIES)[0],
    bestIsHigh: boolean,
  ) => {
    if (companies.length < 2) return { best: "", worst: "" };
    const vals = companies.map((c) => ({
      sym: c.symbol,
      val: c[metricKey] as number,
    }));
    const sorted = [...vals].sort((a, b) =>
      bestIsHigh ? b.val - a.val : a.val - b.val,
    );
    return { best: sorted[0].sym, worst: sorted[sorted.length - 1].sym };
  };

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Link to="/screener">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-1 text-muted-foreground h-7"
              data-ocid="compare.back.button"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              Compare Companies
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Side-by-side comparison of key metrics
            </p>
          </div>
        </div>

        {/* Add company search */}
        {compareList.length < 3 && (
          <div className="relative mb-6 max-w-sm">
            <Input
              placeholder="Search company to add..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              data-ocid="compare.search_input"
              className="h-9"
            />
            {dropdownOpen && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                {suggestions.map((c) => (
                  <button
                    type="button"
                    key={c.symbol}
                    onMouseDown={() => handleAdd(c.symbol)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                    data-ocid="compare.suggestion.button"
                  >
                    <span className="font-medium text-foreground">
                      {c.symbol}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {companies.length === 0 ? (
          <div className="text-center py-20" data-ocid="compare.empty_state">
            <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No companies selected
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Search above or use the ⊕ Compare button on any stock in the
              screener.
            </p>
            <Link to="/screener">
              <Button data-ocid="compare.go_screener.button">
                Browse Screener
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-40">
                    Metric
                  </th>
                  {companies.map((c) => (
                    <th
                      key={c.symbol}
                      className="px-4 py-3 text-center min-w-36"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {c.symbol}
                          </div>
                          <div className="text-xs text-muted-foreground font-normal truncate max-w-32">
                            {c.name}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(c.symbol)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                          data-ocid="compare.remove.button"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                  {companies.length < 3 && (
                    <th className="px-4 py-3 text-center text-xs text-muted-foreground">
                      <span className="opacity-40">+ Add company</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric, mIdx) => {
                  const { best, worst } = getBestWorst(
                    metric.key,
                    metric.bestIsHigh,
                  );
                  return (
                    <tr
                      key={metric.key}
                      className={`border-t border-border ${mIdx % 2 === 0 ? "" : "bg-secondary/20"}`}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        {metric.label}
                      </td>
                      {companies.map((c) => {
                        const val = c[metric.key] as number;
                        const isBest = c.symbol === best;
                        const isWorst =
                          c.symbol === worst && companies.length > 1;
                        return (
                          <td
                            key={c.symbol}
                            className={`px-4 py-3 text-center text-sm font-mono-data font-medium ${
                              isBest
                                ? "text-positive"
                                : isWorst
                                  ? "text-negative"
                                  : "text-foreground"
                            }`}
                          >
                            {metric.format(val)}
                            {isBest && companies.length > 1 && (
                              <span className="ml-1 text-xs text-positive">
                                ★
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {companies.length < 3 && <td />}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Navigate to company pages */}
        {companies.length > 0 && (
          <div className="flex gap-3 mt-4 flex-wrap">
            {companies.map((c) => (
              <Link
                key={c.symbol}
                to="/company/$symbol"
                params={{ symbol: c.symbol }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary transition-colors py-1 px-3"
                >
                  View {c.symbol} Details →
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </main>
  );
}
