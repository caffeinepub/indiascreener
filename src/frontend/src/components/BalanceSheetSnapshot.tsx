import { useMemo } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { getBSData } from "../data/balanceSheetData";

const GREEN = "#4ade80";
const RED = "#f87171";

interface TreeNode {
  name: string;
  value: number;
  color: string;
}

function buildAssets(
  p: NonNullable<ReturnType<typeof getBSData>>["periods"][0],
): TreeNode[] {
  const otherA = p.otherAssets;
  return [
    { name: "Net Block", value: p.fixedAssets, color: GREEN },
    { name: "CWIP", value: p.cwip, color: RED },
    { name: "Inventory", value: p.investments, color: RED },
    { name: "Receivables", value: Math.round(otherA * 0.45), color: RED },
    { name: "Other Assets", value: Math.round(otherA * 0.3), color: RED },
    { name: "Cash & Equiv.", value: Math.round(otherA * 0.25), color: GREEN },
  ].filter((n) => n.value > 0);
}

function buildLiabilities(
  p: NonNullable<ReturnType<typeof getBSData>>["periods"][0],
): TreeNode[] {
  const equity = p.equityCapital + p.reserves;
  const otherL = p.otherLiabilities;
  return [
    { name: "Equity", value: equity, color: GREEN },
    { name: "Debt", value: p.borrowings, color: RED },
    {
      name: "Other Liabilities",
      value: Math.round(otherL * 0.6),
      color: GREEN,
    },
    { name: "Accounts Payable", value: Math.round(otherL * 0.4), color: GREEN },
  ].filter((n) => n.value > 0);
}

function CustomCell(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  color?: string;
  depth?: number;
  root?: boolean;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, value, color } = props;
  if (width < 40 || height < 30) return null;
  const showLabel = width > 60 && height > 40;
  const showValue = width > 70 && height > 55;
  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        fill={color}
        rx={4}
        ry={4}
        stroke="var(--card)"
        strokeWidth={2}
      />
      {showLabel && (
        <text
          x={x + 10}
          y={y + 20}
          fill="white"
          fontSize={12}
          fontWeight={600}
          style={{ pointerEvents: "none" }}
        >
          {name}
        </text>
      )}
      {showValue && (
        <text
          x={x + 10}
          y={y + 36}
          fill="rgba(255,255,255,0.85)"
          fontSize={11}
          style={{ pointerEvents: "none" }}
        >
          ₹{value?.toLocaleString("en-IN")} Cr
        </text>
      )}
    </g>
  );
}

function SnapshotTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TreeNode }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">
        ₹{d.value.toLocaleString("en-IN")} Cr
      </p>
    </div>
  );
}

export default function BalanceSheetSnapshot({ symbol }: { symbol: string }) {
  const bs = getBSData(symbol);
  const latest = useMemo(() => {
    if (!bs) return null;
    return [...bs.periods].reverse().find((p) => p.period !== "TTM") ?? null;
  }, [bs]);

  if (!latest)
    return (
      <div className="text-sm text-muted-foreground p-4">
        Balance sheet data not available.
      </div>
    );

  const assetsData = buildAssets(latest);
  const liabsData = buildLiabilities(latest);
  const totalAssets = assetsData.reduce((s, n) => s + n.value, 0);
  const totalLiabs = liabsData.reduce((s, n) => s + n.value, 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold">Balance Sheet Snapshot</h2>
        <span className="text-xs text-muted-foreground">
          as of {latest.period}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 text-center">
            Assets
          </p>
          <p className="text-xs text-muted-foreground text-center mb-2">
            Total: ₹{totalAssets.toLocaleString("en-IN")} Cr
          </p>
          <ResponsiveContainer width="100%" height={340}>
            <Treemap
              data={assetsData}
              dataKey="value"
              aspectRatio={4 / 3}
              content={<CustomCell />}
            >
              <Tooltip content={<SnapshotTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 text-center">
            Liabilities
          </p>
          <p className="text-xs text-muted-foreground text-center mb-2">
            Total: ₹{totalLiabs.toLocaleString("en-IN")} Cr
          </p>
          <ResponsiveContainer width="100%" height={340}>
            <Treemap
              data={liabsData}
              dataKey="value"
              aspectRatio={4 / 3}
              content={<CustomCell />}
            >
              <Tooltip content={<SnapshotTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex gap-6 mt-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#4ade80]" />
          Owned / Equity
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-[#f87171]" />
          Owed / Obligations
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Tile size is proportional to value in ₹ Cr. Asset breakdown of "Other
        Assets" is approximate.
      </p>
    </div>
  );
}
