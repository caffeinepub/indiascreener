import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPLData } from "../data/plData";

function shortPeriod(period: string): string {
  // "Mar 19" -> "FY19", "TTM" -> "TTM"
  if (period === "TTM") return "TTM";
  const parts = period.split(" ");
  if (parts.length === 2) return `FY${parts[1]}`;
  return period;
}

export default function FinancialTrendChart({ symbol }: { symbol: string }) {
  const plData = getPLData(symbol);

  const chartData = useMemo(() => {
    if (!plData) return [];
    return plData.periods.map((p) => ({
      period: shortPeriod(p.period),
      Revenue: Math.round(p.sales),
      "Net Profit": Math.round(p.netProfit),
    }));
  }, [plData]);

  if (!plData || chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="text-xs text-muted-foreground mb-1">
        Revenue & Profit Trend
      </div>
      <div className="text-sm font-semibold text-foreground mb-4">
        Annual Performance (₹ Cr)
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(0)}L`;
              if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
              return String(v);
            }}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--color-foreground)",
            }}
            formatter={(val: number, name: string) => [
              `₹${val.toLocaleString("en-IN")} Cr`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            iconType="square"
            iconSize={8}
          />
          <Bar
            dataKey="Revenue"
            fill="var(--color-primary)"
            radius={[3, 3, 0, 0]}
            opacity={0.85}
          />
          <Bar
            dataKey="Net Profit"
            fill="var(--color-positive)"
            radius={[3, 3, 0, 0]}
            opacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
