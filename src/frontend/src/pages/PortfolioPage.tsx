import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Briefcase,
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import LoginPrompt from "../components/LoginPrompt";
import RatioCard from "../components/RatioCard";
import TickerBadge from "../components/TickerBadge";
import { COMPANIES } from "../data/companiesData";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddPortfolioEntry,
  useAllCompanies,
  useRemovePortfolioEntry,
  useUserPortfolio,
} from "../hooks/useQueries";
import { formatCurrency, formatMarketCap } from "../lib/formatters";

// Newton-Raphson XIRR
function xirr(cashflows: { amount: number; date: Date }[]): number {
  if (cashflows.length < 2) return 0;
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let f = 0;
    let df = 0;
    const t0 = cashflows[0].date.getTime();
    for (const cf of cashflows) {
      const t = (cf.date.getTime() - t0) / (365.25 * 24 * 3600 * 1000);
      const denom = (1 + rate) ** t;
      f += cf.amount / denom;
      df += (-t * cf.amount) / (denom * (1 + rate));
    }
    if (Math.abs(df) < 1e-10) break;
    const newRate = rate - f / df;
    if (Math.abs(newRate - rate) < 1e-8) return newRate;
    rate = newRate;
  }
  return rate;
}

const PIE_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

const EMPTY_FORM = {
  symbol: "",
  companyName: "",
  quantity: "",
  avgCost: "",
  buyDate: "",
};

export default function PortfolioPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [form, setForm] = useState(EMPTY_FORM);
  const [symbolSuggestions, setSymbolSuggestions] = useState<
    Array<{ symbol: string; name: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: portfolio = [], isLoading } = useUserPortfolio();
  const { data: companies = [] } = useAllCompanies();
  const addEntry = useAddPortfolioEntry();
  const removeEntry = useRemovePortfolioEntry();

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.symbol, c])),
    [companies],
  );

  // Full company data map for sector lookup
  const fullCompanyMap = useMemo(
    () => Object.fromEntries(COMPANIES.map((c) => [c.symbol, c])),
    [],
  );

  const { summary, holdings, portfolioXirr, sectorAllocation } = useMemo(() => {
    let invested = 0;
    let currentValue = 0;
    const today = new Date();

    const allCashflows: { amount: number; date: Date }[] = [];

    const holdings = portfolio.map((entry) => {
      const co = companyMap[entry.symbol];
      const currentPrice = co?.price ?? entry.avgCost;
      const entryInvested = entry.avgCost * entry.quantity;
      const entryValue = currentPrice * entry.quantity;
      const pnl = entryValue - entryInvested;
      const pnlPct = (pnl / entryInvested) * 100;

      const buyDate = new Date(entry.buyDate);

      // Per-holding XIRR
      let holdingXirr: number | null = null;
      if (entry.buyDate && !Number.isNaN(buyDate.getTime())) {
        const cfs = [
          { amount: -entryInvested, date: buyDate },
          { amount: entryValue, date: today },
        ];
        try {
          holdingXirr = xirr(cfs);
        } catch {
          holdingXirr = null;
        }
      }

      if (entry.buyDate && !Number.isNaN(buyDate.getTime())) {
        allCashflows.push({ amount: -entryInvested, date: buyDate });
      }
      invested += entryInvested;
      currentValue += entryValue;

      return {
        ...entry,
        currentPrice,
        entryInvested,
        entryValue,
        pnl,
        pnlPct,
        holdingXirr,
      };
    });

    // Overall XIRR
    let portfolioXirr: number | null = null;
    if (allCashflows.length > 0 && currentValue > 0) {
      allCashflows.push({ amount: currentValue, date: today });
      try {
        portfolioXirr = xirr(allCashflows);
      } catch {
        portfolioXirr = null;
      }
    }

    const pnl = currentValue - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

    // Sector allocation
    const sectorMap: Record<string, number> = {};
    for (const h of holdings) {
      const sector = fullCompanyMap[h.symbol]?.sector ?? "Other";
      sectorMap[sector] = (sectorMap[sector] ?? 0) + h.entryValue;
    }
    const sectorAllocation = Object.entries(sectorMap).map(([name, value]) => ({
      name,
      value: Math.round(value),
      pct: currentValue > 0 ? ((value / currentValue) * 100).toFixed(1) : "0",
    }));

    return {
      summary: { invested, currentValue, pnl, pnlPct },
      holdings,
      portfolioXirr,
      sectorAllocation,
    };
  }, [portfolio, companyMap, fullCompanyMap]);

  if (!isAuthenticated) {
    return (
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <LoginPrompt
          title="Portfolio Tracker"
          description="Sign in to track your investment portfolio."
        />
      </main>
    );
  }

  const handleSymbolInput = (val: string) => {
    setForm((p) => ({ ...p, symbol: val.toUpperCase() }));
    if (val.length >= 1) {
      const q = val.toUpperCase();
      const matches = companies
        .filter(
          (c) => c.symbol.startsWith(q) || c.name.toUpperCase().includes(q),
        )
        .slice(0, 6)
        .map((c) => ({ symbol: c.symbol, name: c.name }));
      setSymbolSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (symbol: string, name: string) => {
    setForm((p) => ({ ...p, symbol, companyName: name }));
    setShowSuggestions(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number.parseFloat(form.quantity);
    const cost = Number.parseFloat(form.avgCost);
    if (
      !form.symbol ||
      Number.isNaN(qty) ||
      Number.isNaN(cost) ||
      !form.buyDate
    ) {
      toast.error("Please fill all fields correctly");
      return;
    }
    try {
      await addEntry.mutateAsync({
        symbol: form.symbol,
        companyName: form.companyName || form.symbol,
        quantity: qty,
        avgCost: cost,
        buyDate: form.buyDate,
      });
      toast.success(`Added ${form.symbol} to portfolio`);
      setForm(EMPTY_FORM);
    } catch {
      toast.error("Failed to add entry");
    }
  };

  const formatXirr = (rate: number | null) => {
    if (rate === null || !Number.isFinite(rate)) return "N/A";
    return `${rate >= 0 ? "+" : ""}${(rate * 100).toFixed(1)}%`;
  };

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-display">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your investments and P&L
          </p>
        </div>

        {portfolio.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <RatioCard
              label="Total Invested"
              value={formatMarketCap(summary.invested / 10000000)}
            />
            <RatioCard
              label="Current Value"
              value={formatMarketCap(summary.currentValue / 10000000)}
            />
            <RatioCard
              label="Total P&L"
              value={`${summary.pnl >= 0 ? "+" : ""}${formatMarketCap(Math.abs(summary.pnl) / 10000000)}`}
              highlight={summary.pnl >= 0 ? "positive" : "negative"}
            />
            <RatioCard
              label="P&L %"
              value={`${summary.pnlPct >= 0 ? "+" : ""}${summary.pnlPct.toFixed(2)}%`}
              highlight={summary.pnlPct >= 0 ? "positive" : "negative"}
            />
            <RatioCard
              label="Portfolio XIRR"
              value={formatXirr(portfolioXirr)}
              highlight={
                portfolioXirr === null
                  ? "neutral"
                  : portfolioXirr >= 0
                    ? "positive"
                    : "negative"
              }
            />
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Add Trade</span>
          </div>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
              <div className="space-y-1 relative">
                <Label className="text-xs text-muted-foreground">Symbol</Label>
                <Input
                  data-ocid="portfolio.symbol.input"
                  placeholder="e.g. RELIANCE"
                  value={form.symbol}
                  onChange={(e) => handleSymbolInput(e.target.value)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  className="h-8 text-sm uppercase"
                  autoComplete="off"
                />
                {showSuggestions && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-md overflow-hidden">
                    {symbolSuggestions.map((s) => (
                      <button
                        key={s.symbol}
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
                        onMouseDown={() => selectSuggestion(s.symbol, s.name)}
                      >
                        <TickerBadge symbol={s.symbol} />
                        <span className="text-xs text-muted-foreground truncate">
                          {s.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Company Name
                </Label>
                <Input
                  data-ocid="portfolio.company.input"
                  placeholder="Company name"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, companyName: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Quantity
                </Label>
                <Input
                  data-ocid="portfolio.quantity.input"
                  type="number"
                  placeholder="e.g. 10"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  className="h-8 text-sm"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Avg Buy Price (₹)
                </Label>
                <Input
                  data-ocid="portfolio.avgcost.input"
                  type="number"
                  placeholder="e.g. 2500"
                  value={form.avgCost}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, avgCost: e.target.value }))
                  }
                  className="h-8 text-sm"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Buy Date
                </Label>
                <Input
                  data-ocid="portfolio.date.input"
                  type="date"
                  value={form.buyDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, buyDate: e.target.value }))
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={addEntry.isPending}
              data-ocid="portfolio.add.submit_button"
              className="h-8 px-5 text-sm"
            >
              {addEntry.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Plus className="w-3.5 h-3.5 mr-1.5" />
              )}
              Add to Portfolio
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div data-ocid="portfolio.loading_state">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : portfolio.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-3"
            data-ocid="portfolio.empty_state"
          >
            <Briefcase className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No holdings yet.</p>
            <p className="text-xs text-muted-foreground">
              Add your first trade above.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs mb-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Symbol
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Company
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Qty
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Avg Cost
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      CMP
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Curr Value
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      P&L
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      P&L%
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      XIRR
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Buy Date
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((entry, idx) => (
                    <TableRow
                      key={entry.id.toString()}
                      className="border-b border-border/50"
                      data-ocid={`portfolio.item.${idx + 1}`}
                    >
                      <TableCell className="py-2">
                        <TickerBadge symbol={entry.symbol} />
                      </TableCell>
                      <TableCell className="text-sm py-2 max-w-[160px] truncate">
                        {entry.companyName}
                      </TableCell>
                      <TableCell className="text-sm font-mono-data py-2">
                        {entry.quantity}
                      </TableCell>
                      <TableCell className="text-sm font-mono-data py-2">
                        {formatCurrency(entry.avgCost)}
                      </TableCell>
                      <TableCell className="text-sm font-mono-data py-2">
                        {formatCurrency(entry.currentPrice)}
                      </TableCell>
                      <TableCell className="text-sm font-mono-data py-2">
                        {formatCurrency(entry.entryValue)}
                      </TableCell>
                      <TableCell
                        className={`text-sm font-mono-data py-2 font-semibold ${
                          entry.pnl >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        <span className="flex items-center gap-0.5">
                          {entry.pnl >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {entry.pnl >= 0 ? "+" : ""}
                          {formatCurrency(entry.pnl)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-sm font-mono-data py-2 ${
                          entry.pnlPct >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {entry.pnlPct >= 0 ? "+" : ""}
                        {entry.pnlPct.toFixed(2)}%
                      </TableCell>
                      <TableCell
                        className={`text-sm font-mono-data py-2 ${
                          entry.holdingXirr === null ||
                          !Number.isFinite(entry.holdingXirr)
                            ? "text-muted-foreground"
                            : entry.holdingXirr >= 0
                              ? "text-positive"
                              : "text-negative"
                        }`}
                      >
                        {formatXirr(entry.holdingXirr)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-2">
                        {entry.buyDate}
                      </TableCell>
                      <TableCell className="py-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-negative"
                              data-ocid={`portfolio.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="portfolio.delete.dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {entry.symbol} ({entry.quantity} shares)
                                from your portfolio?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="portfolio.delete.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeEntry.mutate(entry.id)}
                                data-ocid="portfolio.delete.confirm_button"
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Sector Allocation Pie Chart */}
            {sectorAllocation.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-4">
                  Sector Allocation
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={sectorAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, pct }) => `${name} ${pct}%`}
                      labelLine={false}
                    >
                      {sectorAllocation.map((_, i) => (
                        <Cell
                          // biome-ignore lint/suspicious/noArrayIndexKey: static sector list
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `₹${value.toLocaleString("en-IN")}`,
                        "Value",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </motion.div>
    </main>
  );
}
