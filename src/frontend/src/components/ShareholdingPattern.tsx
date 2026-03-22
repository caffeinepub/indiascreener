import { cn } from "@/lib/utils";
import { useState } from "react";
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
import type { CompanySHP } from "../data/shareholdingData";

interface Props {
  data: CompanySHP;
}

interface RowDef {
  key: keyof Omit<
    import("../data/shareholdingData").SHPeriod,
    "period" | "noOfShareholders"
  >;
  label: string;
  color: string;
}

const ROWS: RowDef[] = [
  { key: "promoters", label: "Promoters", color: "#4f8ef7" },
  { key: "fiis", label: "FIIs", color: "#34c784" },
  { key: "diis", label: "DIIs", color: "#f97316" },
  { key: "government", label: "Government", color: "#a855f7" },
  { key: "public", label: "Public", color: "#94a3b8" },
];

function fmtPct(val: number): string {
  return `${val.toFixed(2)}%`;
}

function fmtCount(val: number): string {
  return val.toLocaleString("en-IN");
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-md p-3 shadow-lg text-xs min-w-[160px]">
      <p className="text-muted-foreground font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4 mb-1">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-foreground font-mono">
            {entry.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ShareholdingPattern({ data }: Props) {
  const [view, setView] = useState<"yearly" | "quarterly">("yearly");
  const periods = view === "yearly" ? data.yearly : data.quarterly;

  const chartData = periods.map((p) => ({
    period: p.period,
    Promoters: p.promoters,
    FIIs: p.fiis,
    DIIs: p.diis,
    Government: p.government,
    Public: p.public,
  }));

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Shareholding Pattern
          </h3>
          <span className="text-xs text-muted-foreground">
            Numbers in percentages
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("quarterly")}
            className={cn(
              "text-xs px-3 py-1 rounded border transition-colors",
              view === "quarterly"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
            )}
          >
            Quarterly
          </button>
          <button
            type="button"
            onClick={() => setView("yearly")}
            className={cn(
              "text-xs px-3 py-1 rounded border transition-colors",
              view === "yearly"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
            )}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 sticky left-0 bg-secondary/60 min-w-[160px] z-10">
                &nbsp;
              </th>
              {periods.map((p) => (
                <th
                  key={p.period}
                  className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap min-w-[100px]"
                >
                  {p.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr
                key={row.key}
                className={cn(
                  "border-b border-border/40 transition-colors hover:bg-accent/30",
                  ri % 2 === 0 ? "bg-background" : "bg-card",
                )}
              >
                <td
                  className={cn(
                    "px-4 py-2.5 sticky left-0 z-10 text-xs font-medium whitespace-nowrap",
                    ri % 2 === 0 ? "bg-background" : "bg-card",
                  )}
                >
                  {row.label}
                </td>
                {periods.map((p) => (
                  <td
                    key={p.period}
                    className="px-4 py-2.5 text-right font-mono-data text-xs whitespace-nowrap text-foreground"
                  >
                    {fmtPct(p[row.key] as number)}
                  </td>
                ))}
              </tr>
            ))}
            {/* Shareholder count row */}
            <tr className="border-b border-border/40 bg-secondary/20 hover:bg-accent/30 transition-colors">
              <td className="px-4 py-2.5 sticky left-0 z-10 text-xs text-muted-foreground whitespace-nowrap bg-secondary/20">
                No. of Shareholders
              </td>
              {periods.map((p) => (
                <td
                  key={p.period}
                  className="px-4 py-2.5 text-right font-mono-data text-xs whitespace-nowrap text-muted-foreground"
                >
                  {fmtCount(p.noOfShareholders)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stacked Bar Chart */}
      <div className="px-4 pt-4 pb-2 border-t border-border/60">
        <p className="text-xs font-semibold text-muted-foreground mb-3">
          Shareholding Trend (%)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="square"
              iconSize={10}
            />
            {ROWS.map((row) => (
              <Bar
                key={row.key}
                dataKey={row.label}
                stackId="shp"
                fill={row.color}
                radius={row.key === "public" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-4 py-2.5 border-t border-border/40">
        <p className="text-xs text-muted-foreground">
          * The classifications might have changed from Sep&apos;2022 onwards.
        </p>
      </div>
    </div>
  );
}
