import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart2,
  BookMarked,
  Filter,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { COMPANIES } from "../data/companiesData";

// Simulated daily change per company
function getDayChange(id: number): number {
  return Math.sin(id * 13.7) * 2.5;
}

// Market index simulation
function getIndexChange(seed: number): number {
  const dayFraction = Date.now() / 86400000;
  return Math.sin(dayFraction * 0.7 + seed) * 0.5;
}

const sensexBase = 73458;
const niftyBase = 22302;
const sensexChange = getIndexChange(1.2);
const niftyChange = getIndexChange(2.4);

export default function LandingPage() {
  const companiesWithChange = useMemo(
    () =>
      COMPANIES.map((c) => ({
        ...c,
        dayChange: getDayChange(c.id),
      })),
    [],
  );

  const gainers = useMemo(
    () =>
      [...companiesWithChange]
        .sort((a, b) => b.dayChange - a.dayChange)
        .slice(0, 4),
    [companiesWithChange],
  );

  const losers = useMemo(
    () =>
      [...companiesWithChange]
        .sort((a, b) => a.dayChange - b.dayChange)
        .slice(0, 4),
    [companiesWithChange],
  );

  const stripStocks = companiesWithChange.slice(0, 6);

  const sensexVal = (sensexBase * (1 + sensexChange / 100)).toFixed(0);
  const niftyVal = (niftyBase * (1 + niftyChange / 100)).toFixed(0);

  return (
    <div>
      {/* Market Overview Strip */}
      <div className="bg-secondary/50 border-b border-border overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center gap-6 py-2 overflow-x-auto scrollbar-none text-xs font-mono-data">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-muted-foreground font-sans">SENSEX</span>
              <span className="text-foreground font-semibold">
                {Number(sensexVal).toLocaleString("en-IN")}
              </span>
              <span
                className={
                  sensexChange >= 0 ? "text-positive" : "text-negative"
                }
              >
                {sensexChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 inline" />
                ) : (
                  <TrendingDown className="w-3 h-3 inline" />
                )}{" "}
                {sensexChange >= 0 ? "+" : ""}
                {sensexChange.toFixed(2)}%
              </span>
            </div>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-muted-foreground font-sans">NIFTY 50</span>
              <span className="text-foreground font-semibold">
                {Number(niftyVal).toLocaleString("en-IN")}
              </span>
              <span
                className={niftyChange >= 0 ? "text-positive" : "text-negative"}
              >
                {niftyChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 inline" />
                ) : (
                  <TrendingDown className="w-3 h-3 inline" />
                )}{" "}
                {niftyChange >= 0 ? "+" : ""}
                {niftyChange.toFixed(2)}%
              </span>
            </div>
            <div className="w-px h-4 bg-border shrink-0" />
            {stripStocks.map((s, i) => (
              <div
                key={s.symbol}
                className="flex items-center gap-1.5 shrink-0"
              >
                {i > 0 && <div className="w-px h-4 bg-border" />}
                <span className="text-muted-foreground font-sans">
                  {s.symbol}
                </span>
                <span className="text-foreground">
                  ₹{s.price.toLocaleString("en-IN")}
                </span>
                <span
                  className={
                    s.dayChange >= 0 ? "text-positive" : "text-negative"
                  }
                >
                  {s.dayChange >= 0 ? "+" : ""}
                  {s.dayChange.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <BarChart2 className="w-3.5 h-3.5" />
            NSE Blue-chip Stock Screener
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
            Screen, Analyse & <span className="text-primary">Invest</span>{" "}
            <br className="hidden sm:block" />
            in India's Best Stocks
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Professional-grade tools for Indian retail investors. Screen 25 NSE
            blue-chip stocks with 15+ financial filters, deep-dive company
            financials, track your portfolio, and build watchlists.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/screener">
              <Button
                size="lg"
                className="gap-2"
                data-ocid="landing.screener.primary_button"
              >
                Screen Stocks
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/screener">
              <Button
                size="lg"
                variant="outline"
                data-ocid="landing.companies.secondary_button"
              >
                View All Companies
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {[
            { icon: Filter, label: "15+ Screener Filters" },
            { icon: BarChart2, label: "Price & Financial Charts" },
            { icon: BookMarked, label: "Watchlists & Portfolio" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm text-muted-foreground"
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Top Gainers & Losers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gainers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-positive" />
                <h2 className="text-base font-semibold text-foreground">
                  Top Gainers
                </h2>
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {gainers.map((c, i) => (
                  <Link
                    key={c.symbol}
                    to="/company/$symbol"
                    params={{ symbol: c.symbol }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="bg-card border border-border rounded-lg p-3 hover:border-positive/50 hover:bg-positive/5 transition-all cursor-pointer"
                      data-ocid={`landing.gainer.card.${i + 1}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">
                          {c.symbol}
                        </span>
                        <Badge className="text-xs bg-positive/15 text-positive border-0 px-1.5 py-0">
                          +{c.dayChange.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mb-1">
                        {c.name}
                      </div>
                      <div className="text-sm font-semibold font-mono-data text-foreground">
                        ₹{c.price.toLocaleString("en-IN")}
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-negative" />
                <h2 className="text-base font-semibold text-foreground">
                  Top Losers
                </h2>
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {losers.map((c, i) => (
                  <Link
                    key={c.symbol}
                    to="/company/$symbol"
                    params={{ symbol: c.symbol }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="bg-card border border-border rounded-lg p-3 hover:border-negative/50 hover:bg-negative/5 transition-all cursor-pointer"
                      data-ocid={`landing.loser.card.${i + 1}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">
                          {c.symbol}
                        </span>
                        <Badge className="text-xs bg-negative/15 text-negative border-0 px-1.5 py-0">
                          {c.dayChange.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mb-1">
                        {c.name}
                      </div>
                      <div className="text-sm font-semibold font-mono-data text-foreground">
                        ₹{c.price.toLocaleString("en-IN")}
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA to screener */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-8 text-center"
        >
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            Explore All 25 NSE Blue-chip Stocks
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Filter by PE, PB, ROE, ROCE, Market Cap, Debt/Equity and more.
            Export results to CSV.
          </p>
          <Link to="/screener">
            <Button size="lg" data-ocid="landing.explore.button">
              Open Stock Screener
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
