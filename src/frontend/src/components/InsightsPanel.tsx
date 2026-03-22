import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Flag } from "lucide-react";
import { getInsightsData } from "../data/insightsData";

interface Props {
  symbol: string;
}

export default function InsightsPanel({ symbol }: Props) {
  const data = getInsightsData(symbol);

  if (!data || data.metrics.length === 0) {
    return (
      <div className="text-muted-foreground text-sm p-4">
        No operational insights available for this company yet.
      </div>
    );
  }

  const allPeriods = [
    ...new Set(data.metrics.flatMap((m) => m.periods.map((p) => p.period))),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Insights</h2>
        <Badge variant="outline" className="text-xs">
          In beta
        </Badge>
        <button
          type="button"
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Flag className="w-3 h-3" /> Flag error
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[260px] sticky left-0 bg-card z-10">
                Metric
              </TableHead>
              {allPeriods.map((p) => (
                <TableHead key={p} className="text-right min-w-[100px]">
                  {p}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.metrics.map((metric) => {
              const valueMap = Object.fromEntries(
                metric.periods.map((p) => [p.period, p.value]),
              );
              return (
                <TableRow key={metric.label}>
                  <TableCell className="sticky left-0 bg-card z-10">
                    <div className="font-medium text-sm">{metric.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {metric.unit}
                    </div>
                  </TableCell>
                  {allPeriods.map((p) => (
                    <TableCell key={p} className="text-right text-sm">
                      {valueMap[p] != null ? (
                        valueMap[p]!.toLocaleString("en-IN")
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground mt-3">
        {data.note ??
          "Data is approximate and for educational purposes only. Verify with official BSE/NSE filings."}
      </p>
    </div>
  );
}
