import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookmarkPlus,
  Download,
  GitCompare,
  Loader2,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import BalanceSheet from "../components/BalanceSheet";
import CashFlow from "../components/CashFlow";
import DocumentsSection from "../components/DocumentsSection";
import FinancialTrendChart from "../components/FinancialTrendChart";
import HealthScore from "../components/HealthScore";
import PriceChart from "../components/PriceChart";
import ProfitLossStatement from "../components/ProfitLossStatement";
import RatioCard from "../components/RatioCard";
import RatiosTable from "../components/RatiosTable";
import ShareholdingPattern from "../components/ShareholdingPattern";
import TickerBadge from "../components/TickerBadge";
import { useCompare } from "../context/CompareContext";
import { getBSData } from "../data/balanceSheetData";
import { getCFData } from "../data/cashFlowData";
import { getPLData } from "../data/plData";
import { getRatiosData } from "../data/ratiosData";
import { getSHPData } from "../data/shareholdingData";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddToWatchlist,
  useCompaniesBySector,
  useCompany,
  useCreateWatchlist,
  useFinancials,
  useUserWatchlists,
} from "../hooks/useQueries";
import { exportFinancialModel } from "../lib/exportFinancialModel";
import {
  formatCurrency,
  formatMarketCap,
  formatNumber,
  formatRatio,
} from "../lib/formatters";

function FinancialSkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <TableRow key={i} data-ocid="company.financials.loading_state">
          {Array.from({ length: 8 }, (__, j) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function PeerSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <TableRow key={i} data-ocid="company.peers.loading_state">
          {Array.from({ length: 7 }, (__, j) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function CompanyPage() {
  const { symbol } = useParams({ from: "/company/$symbol" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const [periodType, setPeriodType] = useState<"Q" | "A">("A");
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");

  const { data: company, isLoading: companyLoading } = useCompany(symbol);
  const { data: financials = [], isLoading: financialsLoading } = useFinancials(
    company?.id,
  );
  const { data: peers = [], isLoading: peersLoading } = useCompaniesBySector(
    company?.sector ?? "",
  );
  const { data: watchlists = [] } = useUserWatchlists();

  const createWatchlist = useCreateWatchlist();
  const addToWatchlist = useAddToWatchlist();

  const filteredFinancials = financials.filter(
    (f) => f.periodType === periodType,
  );

  const plData = getPLData(symbol);
  const bsData = getBSData(symbol);
  const cfData = getCFData(symbol);
  const ratiosData = getRatiosData(symbol);
  const shpData = getSHPData(symbol);

  const handleAddToWatchlist = async (watchlistId: bigint) => {
    try {
      await addToWatchlist.mutateAsync({ watchlistId, symbol });
      toast.success(`Added ${symbol} to watchlist`);
      setWatchlistOpen(false);
    } catch {
      toast.error("Failed to add to watchlist");
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newWatchlistName.trim()) return;
    try {
      const id = await createWatchlist.mutateAsync(newWatchlistName.trim());
      await addToWatchlist.mutateAsync({ watchlistId: id, symbol });
      toast.success(
        `Created watchlist "${newWatchlistName}" and added ${symbol}`,
      );
      setNewWatchlistName("");
      setWatchlistOpen(false);
    } catch {
      toast.error("Failed to create watchlist");
    }
  };

  const handleCompareToggle = () => {
    if (isInCompare(symbol)) {
      removeFromCompare(symbol);
      toast.success(`Removed ${symbol} from comparison`);
    } else {
      const added = addToCompare(symbol);
      if (added) {
        toast.success(`Added ${symbol} to comparison`);
      } else {
        toast.error("You can compare up to 3 companies at a time");
      }
    }
  };

  if (companyLoading) {
    return (
      <main
        className="max-w-screen-xl mx-auto px-4 py-6"
        data-ocid="company.loading_state"
      >
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-24 w-full mb-6" />
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="text-center py-20" data-ocid="company.error_state">
          <p className="text-muted-foreground">Company not found.</p>
          <Button variant="link" onClick={() => navigate({ to: "/screener" })}>
            Go back to screener
          </Button>
        </div>
      </main>
    );
  }

  const priceChangePct =
    ((company.price - company.low52w) / company.low52w) * 100;
  const inCompare = isInCompare(symbol);

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/screener" })}
          data-ocid="company.back.button"
          className="mb-4 -ml-1 text-muted-foreground h-7"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Screener
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-display text-foreground">
                {company.name}
              </h1>
              <TickerBadge symbol={company.symbol} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{company.sector}</Badge>
              <span>·</span>
              <span>{company.industry}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-3xl font-semibold font-mono-data text-foreground">
              {formatCurrency(company.price)}
            </span>
            <span
              className={`text-sm font-mono-data ${
                priceChangePct >= 0 ? "text-positive" : "text-negative"
              }`}
            >
              {priceChangePct >= 0 ? "+" : ""}
              {priceChangePct.toFixed(2)}% from 52w Low
            </span>
            <span className="text-xs text-muted-foreground">
              52w: {formatCurrency(company.low52w)} –{" "}
              {formatCurrency(company.high52w)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <Button
            variant={inCompare ? "default" : "outline"}
            size="sm"
            onClick={handleCompareToggle}
            data-ocid="company.compare.button"
            className="h-8 text-sm"
          >
            <GitCompare className="w-3.5 h-3.5 mr-1.5" />
            {inCompare ? "Remove from Compare" : "Add to Compare"}
          </Button>

          {isAuthenticated && (
            <Dialog open={watchlistOpen} onOpenChange={setWatchlistOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="company.watchlist.open_modal_button"
                  className="h-8 text-sm"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />
                  Add to Watchlist
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="company.watchlist.dialog">
                <DialogHeader>
                  <DialogTitle>Add {symbol} to Watchlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  {watchlists.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Choose existing watchlist:
                      </p>
                      <div className="space-y-1">
                        {watchlists.map((wl) => (
                          <Button
                            key={wl.id.toString()}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-sm"
                            onClick={() => handleAddToWatchlist(wl.id)}
                            disabled={addToWatchlist.isPending}
                            data-ocid="company.watchlist.secondary_button"
                          >
                            {wl.name}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {wl.symbols.length} stocks
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      Or create a new watchlist:
                    </p>
                    <div className="flex gap-2">
                      <Input
                        data-ocid="company.watchlist.input"
                        placeholder="Watchlist name…"
                        value={newWatchlistName}
                        onChange={(e) => setNewWatchlistName(e.target.value)}
                        className="h-8 text-sm"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCreateAndAdd()
                        }
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateAndAdd}
                        disabled={
                          createWatchlist.isPending || !newWatchlistName.trim()
                        }
                        data-ocid="company.watchlist.submit_button"
                        className="h-8"
                      >
                        {createWatchlist.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportFinancialModel(symbol)}
            data-ocid="company.export.financial_model"
            className="h-8 text-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Financial Model
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          <RatioCard label="PE Ratio" value={formatRatio(company.pe)} />
          <RatioCard label="PB Ratio" value={formatRatio(company.pb)} />
          <RatioCard
            label="ROE"
            value={`${company.roe.toFixed(1)}%`}
            highlight={company.roe >= 15 ? "positive" : "neutral"}
          />
          <RatioCard
            label="ROCE"
            value={`${company.roce.toFixed(1)}%`}
            highlight={company.roce >= 15 ? "positive" : "neutral"}
          />
          <RatioCard
            label="D/E Ratio"
            value={formatRatio(company.debtEquity)}
            highlight={company.debtEquity > 1 ? "negative" : "positive"}
          />
          <RatioCard label="EPS" value={formatCurrency(company.eps)} />
          <RatioCard
            label="Div Yield"
            value={`${company.dividendYield.toFixed(2)}%`}
          />
          <RatioCard
            label="Mkt Cap"
            value={formatMarketCap(company.marketCap)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
          <RatioCard
            label="Revenue"
            value={formatMarketCap(company.revenue / 10000000)}
            sub="in Cr"
          />
          <RatioCard
            label="Net Profit"
            value={formatMarketCap(company.netProfit / 10000000)}
            sub="in Cr"
            highlight={company.netProfit > 0 ? "positive" : "negative"}
          />
          <RatioCard
            label="Revenue Growth"
            value={`${company.revenueGrowth >= 0 ? "+" : ""}${company.revenueGrowth.toFixed(1)}%`}
            highlight={company.revenueGrowth > 0 ? "positive" : "negative"}
          />
        </div>

        {/* Price Chart */}
        <PriceChart symbol={symbol} />

        <Tabs defaultValue="financials">
          <TabsList className="mb-4">
            <TabsTrigger value="financials" data-ocid="company.financials.tab">
              Financials
            </TabsTrigger>
            <TabsTrigger
              value="balance-sheet"
              data-ocid="company.balance_sheet.tab"
            >
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="cash-flow" data-ocid="company.cash_flow.tab">
              Cash Flow
            </TabsTrigger>
            <TabsTrigger value="ratios" data-ocid="company.ratios.tab">
              Ratios
            </TabsTrigger>
            <TabsTrigger
              value="shareholding"
              data-ocid="company.shareholding.tab"
            >
              Shareholding
            </TabsTrigger>
            <TabsTrigger value="health" data-ocid="company.health.tab">
              Health Score
            </TabsTrigger>
            <TabsTrigger value="documents" data-ocid="company.documents.tab">
              Documents
            </TabsTrigger>
            <TabsTrigger value="peers" data-ocid="company.peers.tab">
              Peer Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financials">
            {/* Financial Trend Chart */}
            <FinancialTrendChart symbol={symbol} />

            <div className="flex items-center justify-between mb-4">
              <div />
              <ToggleGroup
                type="single"
                value={periodType}
                onValueChange={(v) => v && setPeriodType(v as "Q" | "A")}
                data-ocid="company.period.toggle"
              >
                <ToggleGroupItem
                  value="Q"
                  className="text-xs h-7 px-3"
                  data-ocid="company.quarterly.toggle"
                >
                  Quarterly
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="A"
                  className="text-xs h-7 px-3"
                  data-ocid="company.annual.toggle"
                >
                  Annual
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {periodType === "A" && plData ? (
              <ProfitLossStatement data={plData} />
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">
                    {periodType === "Q" ? "Quarterly" : "Annual"} Financial
                    Statements
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Period
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Revenue
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Net Profit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        EBITDA
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        EPS
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Total Assets
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Total Debt
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">
                        Cash from Ops
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialsLoading ? (
                      <FinancialSkeletonRows />
                    ) : filteredFinancials.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground text-sm"
                          data-ocid="company.financials.empty_state"
                        >
                          No {periodType === "Q" ? "quarterly" : "annual"} data
                          available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFinancials.map((f, idx) => (
                        <TableRow
                          key={f.period}
                          className="border-b border-border/50"
                          data-ocid={`company.financials.item.${idx + 1}`}
                        >
                          <TableCell className="text-sm font-medium py-2">
                            {f.period}
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatNumber(f.revenue / 10000000)} Cr
                          </TableCell>
                          <TableCell
                            className={`text-sm font-mono-data py-2 ${f.netProfit >= 0 ? "text-positive" : "text-negative"}`}
                          >
                            {formatNumber(f.netProfit / 10000000)} Cr
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatNumber(f.ebitda / 10000000)} Cr
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatCurrency(f.eps)}
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatNumber(f.totalAssets / 10000000)} Cr
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatNumber(f.totalDebt / 10000000)} Cr
                          </TableCell>
                          <TableCell
                            className={`text-sm font-mono-data py-2 ${f.cashFromOperations >= 0 ? "text-positive" : "text-negative"}`}
                          >
                            {formatNumber(f.cashFromOperations / 10000000)} Cr
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="balance-sheet">
            {bsData ? (
              <BalanceSheet data={bsData} />
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No balance sheet data available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="cash-flow">
            {cfData ? (
              <CashFlow data={cfData} />
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No cash flow data available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="ratios">
            {ratiosData ? (
              <RatiosTable data={ratiosData} />
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No ratios data available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="shareholding">
            {shpData ? (
              <ShareholdingPattern data={shpData} />
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No shareholding data available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="health">
            {company && <HealthScore company={company} />}
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsSection symbol={symbol} />
          </TabsContent>

          <TabsContent value="peers">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">
                  Peers in {company.sector}
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Symbol
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Market Cap
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      PE
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      PB
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      ROE%
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      ROCE%
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {peersLoading ? (
                    <PeerSkeletonRows />
                  ) : (
                    peers
                      .filter((p) => p.symbol !== symbol)
                      .slice(0, 10)
                      .map((peer, idx) => (
                        <TableRow
                          key={peer.symbol}
                          className="table-row-hover border-b border-border/50"
                          data-ocid={`company.peers.item.${idx + 1}`}
                          onClick={() =>
                            navigate({
                              to: "/company/$symbol",
                              params: { symbol: peer.symbol },
                            })
                          }
                        >
                          <TableCell className="py-2">
                            <TickerBadge symbol={peer.symbol} />
                          </TableCell>
                          <TableCell className="text-sm font-medium py-2">
                            {peer.name}
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatMarketCap(peer.marketCap)}
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatRatio(peer.pe)}
                          </TableCell>
                          <TableCell className="text-sm font-mono-data py-2">
                            {formatRatio(peer.pb)}
                          </TableCell>
                          <TableCell
                            className={`text-sm font-mono-data py-2 ${peer.roe >= 15 ? "text-positive" : ""}`}
                          >
                            {peer.roe.toFixed(1)}%
                          </TableCell>
                          <TableCell
                            className={`text-sm font-mono-data py-2 ${peer.roce >= 15 ? "text-positive" : ""}`}
                          >
                            {peer.roce.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}
