import { COMPANIES } from "../data/companiesData";
import { useMarketData } from "../lib/yahooFinance";

const FRESHNESS_CONFIG = {
  live: { dot: "bg-emerald-400", label: "LIVE", text: "text-emerald-400" },
  cached: { dot: "bg-yellow-400", label: "CACHED", text: "text-yellow-400" },
  offline: { dot: "bg-red-400", label: "OFFLINE", text: "text-red-400" },
};

export default function TickerStrip() {
  const { quotes, freshness } = useMarketData();
  const cfg = FRESHNESS_CONFIG[freshness];

  // Build ticker items: indices first, then companies sorted by |changePercent|
  const indexItems: Array<{
    symbol: string;
    label: string;
    price?: number;
    changePercent?: number;
    change?: number;
  }> = [];

  const nsei = quotes.get("^NSEI");
  const bsesn = quotes.get("^BSESN");

  if (nsei) indexItems.push({ label: "NIFTY 50", ...nsei });
  if (bsesn) indexItems.push({ label: "SENSEX", ...bsesn });

  const companyItems = COMPANIES.map((c) => {
    const q = quotes.get(c.symbol);
    return {
      symbol: c.symbol,
      label: c.symbol,
      price: q?.price ?? c.price,
      changePercent: q?.changePercent ?? 0,
      change: q?.change ?? 0,
    };
  }).sort(
    (a, b) => Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0),
  );

  const allItems = [...indexItems, ...companyItems];
  // Duplicate for seamless loop
  const tickerItems = [...allItems, ...allItems];

  return (
    <div className="ticker-strip-bar w-full bg-[oklch(0.14_0.02_240)] border-b border-white/10 h-8 flex items-center overflow-hidden relative z-50">
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          white-space: nowrap;
          animation: ticker-scroll 60s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-track">
        {tickerItems.map((item, idx) => {
          const pct = item.changePercent ?? 0;
          const isPos = pct >= 0;
          const arrow = isPos ? "▲" : "▼";
          const colorCls = isPos ? "text-emerald-400" : "text-red-400";
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: ticker duplicates intentional
              key={idx}
              className="inline-flex items-center gap-1 px-4 text-xs font-mono"
            >
              <span className="text-white/60 font-semibold tracking-wide">
                {item.label}
              </span>
              <span className="text-white">
                {item.price
                  ? `₹${item.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                  : "—"}
              </span>
              <span className={colorCls}>
                {arrow} {Math.abs(pct).toFixed(2)}%
              </span>
              <span className="text-white/20 ml-2">|</span>
            </span>
          );
        })}
      </div>

      {/* Freshness badge */}
      <div className="absolute right-3 top-0 bottom-0 flex items-center gap-1.5 bg-[oklch(0.14_0.02_240)] pl-3">
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
        <span className={`text-[10px] font-bold tracking-widest ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
