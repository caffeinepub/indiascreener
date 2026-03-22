import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPriceHistory } from "../data/priceHistoryData";

const RANGES = [
  { label: "1W", days: 5 },
  { label: "1M", days: 22 },
  { label: "3M", days: 66 },
  { label: "1Y", days: 252 },
  { label: "5Y", days: 1260 },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

function formatXLabel(dateStr: string, range: RangeLabel): string {
  const d = new Date(dateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (range === "1W" || range === "1M") {
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  if (range === "3M") {
    return `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  }
  return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

export default function PriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<RangeLabel>("1Y");
  const allData = getPriceHistory(symbol);

  const { data, currentPrice, pctChange, isPositive } = useMemo(() => {
    const days = RANGES.find((r) => r.label === range)?.days ?? 252;
    const sliced = allData.slice(-days);
    const cp = sliced[sliced.length - 1]?.close ?? 0;
    const sp = sliced[0]?.close ?? cp;
    const pct = sp > 0 ? ((cp - sp) / sp) * 100 : 0;
    return {
      data: sliced,
      currentPrice: cp,
      pctChange: pct,
      isPositive: pct >= 0,
    };
  }, [allData, range]);

  const strokeColor = isPositive
    ? "var(--color-positive)"
    : "var(--color-negative)";
  const gradientId = `price-grad-${symbol}`;

  // Thin out data for display (max ~120 points)
  const displayData = useMemo(() => {
    if (data.length <= 120) return data;
    const step = Math.ceil(data.length / 120);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [data]);

  const minPrice = useMemo(
    () => Math.min(...displayData.map((d) => d.close)),
    [displayData],
  );
  const maxPrice = useMemo(
    () => Math.max(...displayData.map((d) => d.close)),
    [displayData],
  );
  const padding = (maxPrice - minPrice) * 0.05;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">
            Price Chart
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono-data text-foreground">
              ₹{currentPrice.toFixed(2)}
            </span>
            <span
              className={`text-sm font-medium ${isPositive ? "text-positive" : "text-negative"}`}
            >
              {isPositive ? "+" : ""}
              {pctChange.toFixed(2)}%
            </span>
            <span className="text-xs text-muted-foreground">({range})</span>
          </div>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              type="button"
              key={r.label}
              onClick={() => setRange(r.label)}
              data-ocid="company.price_chart.toggle"
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                range === r.label
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={displayData}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v) => formatXLabel(v, range)}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
            domain={[minPrice - padding, maxPrice + padding]}
            width={72}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--color-foreground)",
            }}
            formatter={(val: number) => [`₹${val.toFixed(2)}`, "Price"]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
            }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: strokeColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
