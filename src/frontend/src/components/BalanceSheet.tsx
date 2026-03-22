import { cn } from "@/lib/utils";
import type { CompanyBS } from "../data/balanceSheetData";

interface Props {
  data: CompanyBS;
}

function fmt(val: number): string {
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface RowDef {
  key: keyof Omit<import("../data/balanceSheetData").BSPeriod, "period">;
  label: string;
  bold?: boolean;
  section?: "liabilities" | "assets";
  sectionHeader?: boolean;
}

const ROWS: RowDef[] = [
  { key: "equityCapital", label: "Equity Capital" },
  { key: "reserves", label: "Reserves" },
  { key: "borrowings", label: "Borrowings" },
  { key: "otherLiabilities", label: "Other Liabilities" },
  {
    key: "totalLiabilities",
    label: "Total Liabilities",
    bold: true,
    section: "liabilities",
  },
  { key: "fixedAssets", label: "Fixed Assets" },
  { key: "cwip", label: "CWIP" },
  { key: "investments", label: "Investments" },
  { key: "otherAssets", label: "Other Assets" },
  { key: "totalAssets", label: "Total Assets", bold: true, section: "assets" },
];

export default function BalanceSheet({ data }: Props) {
  const periods = data.periods;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Balance Sheet
          </h3>
          <span className="text-xs text-muted-foreground">
            Consolidated Figures in Rs. Crores
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 sticky left-0 bg-secondary/60 min-w-[180px] z-10">
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
              const isTotalLiabilities = row.key === "totalLiabilities";
              const isTotalAssets = row.key === "totalAssets";
              const isTotal = isTotalLiabilities || isTotalAssets;
              const isAfterLiabilities = ri === 5; // Fixed Assets row - add separator

              return (
                <>
                  {isAfterLiabilities && (
                    <tr key={`sep-${row.key}`} className="h-0">
                      <td colSpan={periods.length + 1} className="p-0">
                        <div className="h-px bg-border/60" />
                      </td>
                    </tr>
                  )}
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
                      return (
                        <td
                          key={p.period}
                          className={cn(
                            "px-4 py-2 text-right font-mono-data text-xs whitespace-nowrap",
                            isTotal
                              ? "font-semibold text-foreground"
                              : "text-foreground/80",
                          )}
                        >
                          {fmt(val)}
                        </td>
                      );
                    })}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
