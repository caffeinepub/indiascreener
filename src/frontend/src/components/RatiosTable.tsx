import { cn } from "@/lib/utils";
import type { CompanyRatios } from "../data/ratiosData";

interface Props {
  data: CompanyRatios;
}

type RatioKey = keyof Omit<import("../data/ratiosData").RatioPeriod, "period">;

interface RowDef {
  key: RatioKey;
  label: string;
  bold?: boolean;
  suffix?: string;
}

const ROWS: RowDef[] = [
  { key: "debtorDays", label: "Debtor Days" },
  { key: "inventoryDays", label: "Inventory Days" },
  { key: "daysPayable", label: "Days Payable" },
  { key: "cashConversionCycle", label: "Cash Conversion Cycle", bold: true },
  { key: "workingCapitalDays", label: "Working Capital Days" },
  { key: "roce", label: "ROCE %", bold: true, suffix: "%" },
];

export default function RatiosTable({ data }: Props) {
  const periods = data.periods;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ratios</h3>
          <span className="text-xs text-muted-foreground">
            Consolidated Figures in Rs. Crores
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 sticky left-0 bg-secondary/60 min-w-[200px] z-10">
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
              const isHighlight = row.bold;
              return (
                <tr
                  key={row.key}
                  className={cn(
                    "border-b border-border/40 transition-colors hover:bg-accent/30",
                    isHighlight && "bg-secondary/30",
                    !isHighlight && ri % 2 === 0
                      ? "bg-background"
                      : !isHighlight
                        ? "bg-card"
                        : "",
                  )}
                >
                  <td
                    className={cn(
                      "px-4 py-2 sticky left-0 z-10 text-xs whitespace-nowrap",
                      isHighlight
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
                    const display = row.suffix
                      ? `${val.toFixed(1)}${row.suffix}`
                      : String(val);
                    return (
                      <td
                        key={p.period}
                        className={cn(
                          "px-4 py-2 text-right font-mono-data text-xs whitespace-nowrap",
                          isHighlight
                            ? "font-semibold text-foreground"
                            : "text-foreground/80",
                        )}
                      >
                        {display}
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
