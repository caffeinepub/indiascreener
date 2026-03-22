import { cn } from "@/lib/utils";
import type { CompanyPL } from "../data/plData";

interface Props {
  data: CompanyPL;
}

function fmt(val: number, decimals = 0): string {
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface RowDef {
  key: keyof Omit<import("../data/plData").PLPeriod, "period">;
  label: string;
  bold?: boolean;
  isPct?: boolean;
  highlight?: boolean;
}

const ROWS: RowDef[] = [
  { key: "sales", label: "Sales", highlight: true },
  { key: "expenses", label: "Expenses" },
  {
    key: "operatingProfit",
    label: "Operating Profit",
    bold: true,
    highlight: true,
  },
  { key: "opmPct", label: "OPM %", isPct: true },
  { key: "otherIncome", label: "Other Income" },
  { key: "interest", label: "Interest" },
  { key: "depreciation", label: "Depreciation" },
  {
    key: "profitBeforeTax",
    label: "Profit before tax",
    bold: true,
    highlight: true,
  },
  { key: "taxPct", label: "Tax %", isPct: true },
  { key: "netProfit", label: "Net Profit", bold: true, highlight: true },
  { key: "eps", label: "EPS in Rs", isPct: false },
  { key: "dividendPayoutPct", label: "Dividend Payout %", isPct: true },
];

export default function ProfitLossStatement({ data }: Props) {
  const periods = data.periods;

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-baseline gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Profit &amp; Loss
          </h3>
          <span className="text-xs text-muted-foreground">
            Standalone Figures in Rs. Crores
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="bg-secondary/60 border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 sticky left-0 bg-secondary/60 min-w-[180px] z-10">
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
                    row.highlight && "bg-secondary/20",
                    ri % 2 === 0 && !row.highlight && "bg-background",
                  )}
                >
                  <td
                    className={cn(
                      "px-4 py-2 sticky left-0 z-10 text-xs whitespace-nowrap",
                      row.highlight
                        ? "bg-secondary/20"
                        : ri % 2 === 0
                          ? "bg-background"
                          : "bg-card",
                      row.bold
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.label}
                  </td>
                  {periods.map((p) => {
                    const raw = p[row.key] as number;
                    const display = row.isPct
                      ? `${fmt(raw, 1)}%`
                      : fmt(raw, row.key === "eps" ? 1 : 0);
                    const isNegative = raw < 0;
                    return (
                      <td
                        key={p.period}
                        className={cn(
                          "px-4 py-2 text-right font-mono-data text-xs whitespace-nowrap",
                          row.bold ? "font-semibold" : "",
                          isNegative
                            ? "text-negative"
                            : row.bold
                              ? "text-foreground"
                              : "text-foreground/80",
                        )}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CAGR Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CAGRCard
          title="Compounded Sales Growth"
          rows={[
            { label: "5 Years", value: `${data.cagr.salesGrowth.y5}%` },
            { label: "3 Years", value: `${data.cagr.salesGrowth.y3}%` },
            { label: "TTM", value: `${data.cagr.salesGrowth.ttm}%` },
          ]}
        />
        <CAGRCard
          title="Compounded Profit Growth"
          rows={[
            { label: "5 Years", value: `${data.cagr.profitGrowth.y5}%` },
            { label: "3 Years", value: `${data.cagr.profitGrowth.y3}%` },
            { label: "TTM", value: `${data.cagr.profitGrowth.ttm}%` },
          ]}
        />
        <CAGRCard
          title="Stock Price CAGR"
          rows={[
            { label: "3 Years", value: `${data.cagr.stockCagr.y3}%` },
            { label: "1 Year", value: `${data.cagr.stockCagr.y1}%` },
          ]}
        />
        <CAGRCard
          title="Return on Equity"
          rows={[
            { label: "5 Years", value: `${data.cagr.roe.y5}%` },
            { label: "3 Years", value: `${data.cagr.roe.y3}%` },
            { label: "Last Year", value: `${data.cagr.roe.lastYear}%` },
          ]}
        />
      </div>
    </div>
  );
}

function CAGRCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4"
      data-ocid="company.cagr.card"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </p>
      <div className="space-y-2">
        {rows.map((r) => {
          const numericVal = Number.parseFloat(r.value);
          const isNeg = numericVal < 0;
          return (
            <div key={r.label} className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <span
                className={cn(
                  "text-sm font-semibold font-mono-data",
                  isNeg ? "text-negative" : "text-positive",
                )}
              >
                {isNeg ? "" : "+"}
                {r.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
