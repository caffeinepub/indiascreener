export type PricePoint = { date: string; close: number };

// Sector-based annual drift rates
const DRIFT: Record<string, number> = {
  RELIANCE: 0.08,
  TCS: 0.15,
  HDFCBANK: 0.08,
  INFY: 0.15,
  ICICIBANK: 0.08,
  HINDUNILVR: 0.03,
  ITC: 0.03,
  SBIN: 0.05,
  BAJFINANCE: 0.08,
  KOTAKBANK: 0.08,
  LT: 0.08,
  SUNPHARMA: 0.2,
  MARUTI: 0.18,
  HCLTECH: 0.15,
  WIPRO: 0.15,
  BHARTIARTL: 0.08,
  ASIANPAINT: 0.08,
  TITAN: 0.08,
  POWERGRID: 0.05,
  NTPC: 0.05,
  ONGC: 0.05,
  AXISBANK: 0.08,
  NESTLEIND: 0.03,
  ULTRACEMCO: 0.08,
  TECHM: 0.15,
};

// Current prices (March 2026)
const CURRENT_PRICES: Record<string, number> = {
  RELIANCE: 2850,
  TCS: 3780,
  HDFCBANK: 1605,
  INFY: 1495,
  ICICIBANK: 1270,
  HINDUNILVR: 2318,
  ITC: 440,
  SBIN: 824,
  BAJFINANCE: 7120,
  KOTAKBANK: 1912,
  LT: 3708,
  SUNPHARMA: 1648,
  MARUTI: 12180,
  HCLTECH: 1638,
  WIPRO: 540,
  BHARTIARTL: 1498,
  ASIANPAINT: 2560,
  TITAN: 3264,
  POWERGRID: 298,
  NTPC: 366,
  ONGC: 240,
  AXISBANK: 1208,
  NESTLEIND: 2230,
  ULTRACEMCO: 10540,
  TECHM: 1448,
};

function generatePriceHistory(symbol: string): PricePoint[] {
  const currentPrice = CURRENT_PRICES[symbol] ?? 1000;
  const annualDrift = DRIFT[symbol] ?? 0.08;
  const dailyDrift = annualDrift / 252;
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  // Generate 5 years = ~1825 calendar days, ~1260 trading days
  const totalDays = 1260;
  const prices: number[] = new Array(totalDays);
  prices[totalDays - 1] = currentPrice;

  // Walk backwards
  for (let i = totalDays - 2; i >= 0; i--) {
    const noise = Math.sin(seed * (i + 1) * 7.3 + seed) * 0.012;
    prices[i] = prices[i + 1] / (1 + dailyDrift + noise);
  }

  // Generate dates (5 years back from March 2026, skip weekends)
  const endDate = new Date(2026, 2, 21); // March 21, 2026
  const points: PricePoint[] = [];
  const datePtr = new Date(endDate);
  // Go back to find start date
  datePtr.setFullYear(datePtr.getFullYear() - 5);

  const allDates: Date[] = [];
  const cur = new Date(datePtr);
  while (cur <= endDate) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      allDates.push(new Date(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Use last totalDays trading days
  const useDates = allDates.slice(-totalDays);

  for (let i = 0; i < useDates.length && i < totalDays; i++) {
    const d = useDates[i];
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    points.push({
      date: dateStr,
      close: Math.max(1, Math.round(prices[i] * 100) / 100),
    });
  }

  return points;
}

// Lazy-generate and cache
const cache: Record<string, PricePoint[]> = {};

export function getPriceHistory(symbol: string): PricePoint[] {
  if (!cache[symbol]) {
    cache[symbol] = generatePriceHistory(symbol);
  }
  return cache[symbol];
}

export const priceHistory: Record<string, PricePoint[]> = new Proxy(
  {} as Record<string, PricePoint[]>,
  {
    get(_, sym: string) {
      return getPriceHistory(sym);
    },
  },
);
