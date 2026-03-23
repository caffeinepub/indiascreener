import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type FundFlowRange, computeFundFlow } from "../lib/fundFlow";

const COLOR_INCREASE = "#4ade80";
const COLOR_DECREASE = "#f87171";
const COLOR_TOTAL = "#3b82f6";

const RANGES: FundFlowRange[] = ["1Y", "3Y", "5Y", "10Y"];

function fmtY(val: number): string {
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return String(val);
}

function FundFlowChart({
  data,
  title,
}: {
  data: { label: string; value: number; type: string }[];
  title: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold tracking-widest text-center text-muted-foreground mb-4 uppercase">
        {title}
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={data}
          margin={{ top: 30, right: 20, left: 10, bottom: 80 }}
          barCategoryGap="25%"
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--border)"
          />
          <XAxis
            dataKey="label"
            angle={-45}
            textAnchor="end"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval={0}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={fmtY}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [
              `₹${value.toLocaleString("en-IN")} Cr`,
              "",
            ]}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={60}>
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={
                  entry.type === "total"
                    ? COLOR_TOTAL
                    : entry.type === "increase"
                      ? COLOR_INCREASE
                      : COLOR_DECREASE
                }
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: number) => `${v.toLocaleString("en-IN")} Cr`}
              style={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function FundFlowAnalysis({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<FundFlowRange>("5Y");

  const result = useMemo(() => computeFundFlow(symbol, range), [symbol, range]);

  if (!result) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Not enough balance sheet data to compute fund flow.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Fund Flow Analysis</h2>
      </div>

      <div className="flex gap-4 mb-4 border-b border-border pb-3">
        {RANGES.map((r) => (
          <button
            type="button"
            key={r}
            onClick={() => setRange(r)}
            data-ocid={`company.fund_flow.${r.toLowerCase()}.toggle`}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              range === r
                ? "border-yellow-400 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="flex gap-6 mb-6 text-sm">
        <span className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: COLOR_INCREASE }}
          />
          Increase
        </span>
        <span className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: COLOR_DECREASE }}
          />
          Decrease
        </span>
        <span className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: COLOR_TOTAL }}
          />
          Total
        </span>
      </div>

      <div className="flex gap-8">
        <FundFlowChart data={result.sources} title="Sources of Funds" />
        <div className="w-px bg-border" />
        <FundFlowChart data={result.uses} title="Uses of Funds" />
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Period: {result.periodLabel}. All values in ₹ Cr. Computed from Balance
        Sheet changes.
      </p>
    </div>
  );
}
