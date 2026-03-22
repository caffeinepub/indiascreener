import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Flame,
  Gem,
  LineChart,
  Percent,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { COMPANIES } from "../data/companiesData";

type PresetFilter = {
  minPE?: number;
  maxPE?: number;
  minROE?: number;
  minROCE?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPB?: number;
  maxPB?: number;
  maxDebtEquity?: number;
  sector?: string;
  minDividendYield?: number;
  minRevenueGrowth?: number;
  minProfitGrowth?: number;
};

type ScreenerPreset = {
  name: string;
  description: string;
  icon: React.ElementType;
  filter: PresetFilter;
  color: string;
};

const PRESETS: ScreenerPreset[] = [
  {
    name: "Magic Formula",
    description:
      "Companies with strong capital returns at fair valuations. High ROCE with reasonable PE.",
    icon: Star,
    color: "text-yellow-400",
    filter: { minROCE: 20, maxPE: 30 },
  },
  {
    name: "High ROE, Low Debt",
    description:
      "Cash-generative businesses with clean balance sheets. ROE above 20% with minimal leverage.",
    icon: Shield,
    color: "text-green-400",
    filter: { minROE: 20, maxDebtEquity: 0.5 },
  },
  {
    name: "Consistent Compounders",
    description:
      "Businesses growing consistently across all metrics — revenue, profit, and returns.",
    icon: TrendingUp,
    color: "text-blue-400",
    filter: { minRevenueGrowth: 10, minProfitGrowth: 10, minROE: 15 },
  },
  {
    name: "Undervalued Giants",
    description:
      "Large-cap companies trading at discounted valuations. Market cap above 5 lakh Cr.",
    icon: Gem,
    color: "text-purple-400",
    filter: { maxPE: 15, minMarketCap: 500000 },
  },
  {
    name: "Dividend Aristocrats",
    description:
      "Companies that consistently reward shareholders with high dividend payouts.",
    icon: Percent,
    color: "text-orange-400",
    filter: { minDividendYield: 1.2 },
  },
  {
    name: "Growth at Reasonable Price",
    description:
      "High growth companies without the premium valuation — the GARP strategy.",
    icon: LineChart,
    color: "text-cyan-400",
    filter: { minProfitGrowth: 12, maxPE: 30 },
  },
  {
    name: "PSU Value Pack",
    description:
      "State-owned enterprises at cheap valuations — Banking and Energy sectors.",
    icon: Flame,
    color: "text-red-400",
    filter: { maxPE: 14, sector: "Banking" },
  },
];

function countMatches(preset: PresetFilter): number {
  return COMPANIES.filter((c) => {
    if (preset.minPE !== undefined && c.pe < preset.minPE) return false;
    if (preset.maxPE !== undefined && c.pe > preset.maxPE) return false;
    if (preset.minROE !== undefined && c.roe < preset.minROE) return false;
    if (preset.minROCE !== undefined && c.roce < preset.minROCE) return false;
    if (preset.minMarketCap !== undefined && c.marketCap < preset.minMarketCap)
      return false;
    if (preset.maxMarketCap !== undefined && c.marketCap > preset.maxMarketCap)
      return false;
    if (preset.minPB !== undefined && c.pb < preset.minPB) return false;
    if (preset.maxPB !== undefined && c.pb > preset.maxPB) return false;
    if (
      preset.maxDebtEquity !== undefined &&
      c.debtEquity > preset.maxDebtEquity
    )
      return false;
    if (
      preset.minDividendYield !== undefined &&
      c.dividendYield < preset.minDividendYield
    )
      return false;
    if (
      preset.minRevenueGrowth !== undefined &&
      c.revenueGrowth < preset.minRevenueGrowth
    )
      return false;
    if (
      preset.minProfitGrowth !== undefined &&
      c.profitGrowth < preset.minProfitGrowth
    )
      return false;
    // PSU Value Pack: sector Banking OR Energy
    if (
      preset.sector !== undefined &&
      c.sector !== preset.sector &&
      c.sector !== "Energy"
    )
      return false;
    return true;
  }).length;
}

export default function ScreenerIdeasPage() {
  const navigate = useNavigate();

  const presetsWithCount = useMemo(
    () => PRESETS.map((p) => ({ ...p, count: countMatches(p.filter) })),
    [],
  );

  const handleRunScreen = (preset: ScreenerPreset) => {
    const filterState: Record<string, string> = {
      minPE:
        preset.filter.minPE !== undefined ? String(preset.filter.minPE) : "",
      maxPE:
        preset.filter.maxPE !== undefined ? String(preset.filter.maxPE) : "",
      minROE:
        preset.filter.minROE !== undefined ? String(preset.filter.minROE) : "",
      minROCE:
        preset.filter.minROCE !== undefined
          ? String(preset.filter.minROCE)
          : "",
      minMarketCap:
        preset.filter.minMarketCap !== undefined
          ? String(preset.filter.minMarketCap)
          : "",
      maxMarketCap:
        preset.filter.maxMarketCap !== undefined
          ? String(preset.filter.maxMarketCap)
          : "",
      minPB:
        preset.filter.minPB !== undefined ? String(preset.filter.minPB) : "",
      maxPB:
        preset.filter.maxPB !== undefined ? String(preset.filter.maxPB) : "",
      maxDebtEquity:
        preset.filter.maxDebtEquity !== undefined
          ? String(preset.filter.maxDebtEquity)
          : "",
      sector: preset.filter.sector !== undefined ? preset.filter.sector : "all",
    };
    sessionStorage.setItem(
      "screener_preset_filters",
      JSON.stringify(filterState),
    );
    navigate({ to: "/screener" });
  };

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-display text-foreground mb-1">
            Screener Ideas
          </h1>
          <p className="text-sm text-muted-foreground">
            Ready-made screens inspired by proven investment strategies. Click
            any screen to see matching stocks.
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="ideas.list"
        >
          {presetsWithCount.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <motion.div
                key={preset.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/40 hover:shadow-sm transition-all"
                data-ocid={`ideas.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${preset.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground leading-tight">
                        {preset.name}
                      </h3>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {preset.count}{" "}
                    {preset.count === 1 ? "company" : "companies"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {preset.description}
                </p>
                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => handleRunScreen(preset)}
                  data-ocid={`ideas.run.button.${idx + 1}`}
                >
                  Run Screen
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </main>
  );
}
