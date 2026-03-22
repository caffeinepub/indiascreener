import { cn } from "@/lib/utils";
import type { CompanyCF } from "../data/cashFlowData";

interface Props {
  data: CompanyCF;
}

function fmt(val: number): string {
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface RowDef {
  key: keyof Omit<import("../data/cashFlowData").CFPeriod, "period">;
  label: string;
  bold?: boolean;
}

const ROWS: RowDef[] = [
  { key: "cashFromOperating", label: "Cash from Operating Activity" },
  { key: "cashFromInvesting", label: "Cash from Investing Activity" },
  { key: "cashFromFinancing", label: "Cash from Financing Activity" },
  { key: "netCashFlow", label: "Net Cash Flow", bold: true },
];

export default function CashFlow({ data }: Props) {
  const periods = data.periods;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Cash Flows</h3>
          <span className="text-xs text-muted-foreground">
            Consolidated Figures in Rs. Crores
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 sticky left-0 bg-secondary/60 min-w-[220px] z-10">
                &nbsp;
              </th>
              {periods.map((p) => (
                <th
                  key={p.period}
                  className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap min-w-[90px]"
                >
                  {p.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => {
              const isTotal = row.bold;
              return (
                <tr
                  key={row.key}
                  className={cn(
                    "border-b border-border/40 transition-colors hover:bg-accent/30",
                    isTotal && "bg-secondary/30",
                    !isTotal && ri % 2 === 0
                      ? "bg-background"
                      : !isTotal
                        ? "bg-card"
                        : "",
                  )}
                >
                  <td
                    className={cn(
                      "px-4 py-2 sticky left-0 z-10 text-xs whitespace-nowrap",
                      isTotal
                        ? "bg-secondary/30 font-semibold text-foreground"
                        : ri % 2 === 0
                          ? "bg-background text-muted-foreground"
                          : "bg-card text-muted-foreground",
                    )}
                  >
                    {row.label}
                  </td>
                  {periods.map((p) => {
                    const val = p[row.key] as number;
                    const isNeg = val < 0;
                    return (
                      <td
                        key={p.period}
                        className={cn(
                          "px-4 py-2 text-right font-mono-data text-xs whitespace-nowrap",
                          isTotal
                            ? "font-semibold text-foreground"
                            : isNeg
                              ? "text-negative/80"
                              : "text-positive/80",
                        )}
                      >
                        {fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
