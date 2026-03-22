export interface RatioPeriod {
  period: string;
  debtorDays: number;
  inventoryDays: number;
  daysPayable: number;
  cashConversionCycle: number;
  workingCapitalDays: number;
  roce: number;
}

export interface CompanyRatios {
  symbol: string;
  periods: RatioPeriod[];
}

function rp(
  period: string,
  dd: number,
  inv: number,
  dp: number,
  wc: number,
  roce: number,
): RatioPeriod {
  return {
    period,
    debtorDays: dd,
    inventoryDays: inv,
    daysPayable: dp,
    cashConversionCycle: dd + inv - dp,
    workingCapitalDays: wc,
    roce,
  };
}

const ratiosMap: Record<string, CompanyRatios> = {
  RELIANCE: {
    symbol: "RELIANCE",
    periods: [
      rp("Mar 19", 32, 28, 45, 15, 18.2),
      rp("Mar 20", 34, 26, 42, 18, 16.8),
      rp("Mar 21", 28, 24, 40, 12, 14.2),
      rp("Mar 22", 31, 27, 44, 14, 15.8),
      rp("Mar 23", 35, 29, 46, 18, 17.4),
      rp("Mar 24", 38, 31, 48, 21, 18.9),
      rp("TTM", 40, 32, 50, 22, 19.2),
    ],
  },
  TCS: {
    symbol: "TCS",
    periods: [
      rp("Mar 19", 68, 0, 28, 40, 42.1),
      rp("Mar 20", 72, 0, 30, 42, 40.8),
      rp("Mar 21", 64, 0, 26, 38, 44.2),
      rp("Mar 22", 70, 0, 29, 41, 45.8),
      rp("Mar 23", 75, 0, 31, 44, 48.2),
      rp("Mar 24", 78, 0, 32, 46, 50.1),
      rp("TTM", 80, 0, 33, 47, 51.4),
    ],
  },
  HDFCBANK: {
    symbol: "HDFCBANK",
    periods: [
      rp("Mar 19", 0, 0, 0, 0, 14.8),
      rp("Mar 20", 0, 0, 0, 0, 15.2),
      rp("Mar 21", 0, 0, 0, 0, 13.8),
      rp("Mar 22", 0, 0, 0, 0, 14.4),
      rp("Mar 23", 0, 0, 0, 0, 16.2),
      rp("Mar 24", 0, 0, 0, 0, 17.8),
      rp("TTM", 0, 0, 0, 0, 18.4),
    ],
  },
  INFY: {
    symbol: "INFY",
    periods: [
      rp("Mar 19", 65, 0, 24, 41, 38.4),
      rp("Mar 20", 68, 0, 26, 42, 36.8),
      rp("Mar 21", 62, 0, 22, 40, 40.2),
      rp("Mar 22", 67, 0, 25, 42, 41.8),
      rp("Mar 23", 71, 0, 27, 44, 44.2),
      rp("Mar 24", 74, 0, 28, 46, 46.1),
      rp("TTM", 76, 0, 29, 47, 47.8),
    ],
  },
  HINDUNILVR: {
    symbol: "HINDUNILVR",
    periods: [
      rp("Mar 19", 12, 38, 42, 8, 82.4),
      rp("Mar 20", 11, 36, 40, 7, 86.2),
      rp("Mar 21", 10, 34, 38, 6, 92.1),
      rp("Mar 22", 13, 40, 44, 9, 88.4),
      rp("Mar 23", 14, 42, 46, 10, 84.2),
      rp("Mar 24", 13, 41, 45, 9, 86.8),
      rp("TTM", 12, 40, 44, 8, 88.2),
    ],
  },
  ICICIBANK: {
    symbol: "ICICIBANK",
    periods: [
      rp("Mar 19", 0, 0, 0, 0, 10.8),
      rp("Mar 20", 0, 0, 0, 0, 11.4),
      rp("Mar 21", 0, 0, 0, 0, 12.2),
      rp("Mar 22", 0, 0, 0, 0, 13.8),
      rp("Mar 23", 0, 0, 0, 0, 15.4),
      rp("Mar 24", 0, 0, 0, 0, 17.2),
      rp("TTM", 0, 0, 0, 0, 18.1),
    ],
  },
  KOTAKBANK: {
    symbol: "KOTAKBANK",
    periods: [
      rp("Mar 19", 0, 0, 0, 0, 12.4),
      rp("Mar 20", 0, 0, 0, 0, 13.2),
      rp("Mar 21", 0, 0, 0, 0, 14.8),
      rp("Mar 22", 0, 0, 0, 0, 15.6),
      rp("Mar 23", 0, 0, 0, 0, 16.8),
      rp("Mar 24", 0, 0, 0, 0, 17.4),
      rp("TTM", 0, 0, 0, 0, 18.2),
    ],
  },
  BAJFINANCE: {
    symbol: "BAJFINANCE",
    periods: [
      rp("Mar 19", 0, 0, 0, 0, 14.2),
      rp("Mar 20", 0, 0, 0, 0, 15.8),
      rp("Mar 21", 0, 0, 0, 0, 12.4),
      rp("Mar 22", 0, 0, 0, 0, 16.2),
      rp("Mar 23", 0, 0, 0, 0, 18.4),
      rp("Mar 24", 0, 0, 0, 0, 19.8),
      rp("TTM", 0, 0, 0, 0, 21.2),
    ],
  },
  BHARTIARTL: {
    symbol: "BHARTIARTL",
    periods: [
      rp("Mar 19", 18, 0, 52, -34, 8.4),
      rp("Mar 20", 21, 0, 56, -35, 9.2),
      rp("Mar 21", 19, 0, 54, -35, 10.8),
      rp("Mar 22", 22, 0, 58, -36, 11.4),
      rp("Mar 23", 24, 0, 62, -38, 12.8),
      rp("Mar 24", 26, 0, 64, -38, 14.2),
      rp("TTM", 28, 0, 66, -38, 15.4),
    ],
  },
  WIPRO: {
    symbol: "WIPRO",
    periods: [
      rp("Mar 19", 62, 0, 22, 40, 22.4),
      rp("Mar 20", 65, 0, 24, 41, 21.8),
      rp("Mar 21", 58, 0, 20, 38, 24.2),
      rp("Mar 22", 63, 0, 23, 40, 22.8),
      rp("Mar 23", 67, 0, 25, 42, 24.4),
      rp("Mar 24", 70, 0, 26, 44, 25.8),
      rp("TTM", 72, 0, 27, 45, 26.4),
    ],
  },
  HCLTECH: {
    symbol: "HCLTECH",
    periods: [
      rp("Mar 19", 58, 0, 20, 38, 28.4),
      rp("Mar 20", 62, 0, 22, 40, 27.8),
      rp("Mar 21", 55, 0, 19, 36, 30.2),
      rp("Mar 22", 60, 0, 21, 39, 29.8),
      rp("Mar 23", 64, 0, 23, 41, 32.4),
      rp("Mar 24", 67, 0, 24, 43, 34.2),
      rp("TTM", 69, 0, 25, 44, 35.8),
    ],
  },
  ASIANPAINT: {
    symbol: "ASIANPAINT",
    periods: [
      rp("Mar 19", 22, 42, 38, 26, 38.4),
      rp("Mar 20", 24, 44, 40, 28, 36.2),
      rp("Mar 21", 20, 40, 36, 24, 40.8),
      rp("Mar 22", 26, 48, 42, 32, 34.2),
      rp("Mar 23", 28, 52, 44, 36, 32.4),
      rp("Mar 24", 26, 50, 42, 34, 34.8),
      rp("TTM", 24, 48, 40, 32, 36.2),
    ],
  },
  MARUTI: {
    symbol: "MARUTI",
    periods: [
      rp("Mar 19", 8, 24, 38, -6, 18.4),
      rp("Mar 20", 9, 26, 40, -5, 16.8),
      rp("Mar 21", 7, 22, 36, -7, 15.2),
      rp("Mar 22", 10, 28, 42, -4, 17.8),
      rp("Mar 23", 12, 32, 44, 0, 20.4),
      rp("Mar 24", 14, 36, 46, 4, 22.8),
      rp("TTM", 15, 38, 48, 5, 24.2),
    ],
  },
  SUNPHARMA: {
    symbol: "SUNPHARMA",
    periods: [
      rp("Mar 19", 72, 82, 48, 106, 12.4),
      rp("Mar 20", 76, 86, 52, 110, 13.2),
      rp("Mar 21", 68, 78, 44, 102, 14.8),
      rp("Mar 22", 74, 84, 50, 108, 15.6),
      rp("Mar 23", 80, 90, 54, 116, 16.8),
      rp("Mar 24", 84, 94, 58, 120, 18.2),
      rp("TTM", 86, 96, 60, 122, 19.4),
    ],
  },
  TATAMOTORS: {
    symbol: "TATAMOTORS",
    periods: [
      rp("Mar 19", 28, 42, 56, 14, 8.4),
      rp("Mar 20", 32, 46, 60, 18, 6.8),
      rp("Mar 21", 24, 38, 52, 10, 9.2),
      rp("Mar 22", 30, 44, 58, 16, 11.8),
      rp("Mar 23", 36, 50, 64, 22, 14.4),
      rp("Mar 24", 38, 52, 66, 24, 16.8),
      rp("TTM", 40, 54, 68, 26, 18.2),
    ],
  },
  LTIM: {
    symbol: "LTIM",
    periods: [
      rp("Mar 19", 64, 0, 24, 40, 32.4),
      rp("Mar 20", 68, 0, 26, 42, 31.8),
      rp("Mar 21", 60, 0, 22, 38, 34.2),
      rp("Mar 22", 66, 0, 25, 41, 33.8),
      rp("Mar 23", 70, 0, 27, 43, 36.4),
      rp("Mar 24", 74, 0, 28, 46, 38.2),
      rp("TTM", 76, 0, 29, 47, 39.8),
    ],
  },
  AXISBANK: {
    symbol: "AXISBANK",
    periods: [
      rp("Mar 19", 0, 0, 0, 0, 9.8),
      rp("Mar 20", 0, 0, 0, 0, 10.4),
      rp("Mar 21", 0, 0, 0, 0, 11.2),
      rp("Mar 22", 0, 0, 0, 0, 12.8),
      rp("Mar 23", 0, 0, 0, 0, 14.4),
      rp("Mar 24", 0, 0, 0, 0, 15.8),
      rp("TTM", 0, 0, 0, 0, 16.4),
    ],
  },
  SBIN: {
    symbol: "SBIN",
    periods: [
      rp("Mar 19", 0, 0, 0, 0, 7.4),
      rp("Mar 20", 0, 0, 0, 0, 7.8),
      rp("Mar 21", 0, 0, 0, 0, 8.4),
      rp("Mar 22", 0, 0, 0, 0, 9.2),
      rp("Mar 23", 0, 0, 0, 0, 11.4),
      rp("Mar 24", 0, 0, 0, 0, 12.8),
      rp("TTM", 0, 0, 0, 0, 13.4),
    ],
  },
  TITAN: {
    symbol: "TITAN",
    periods: [
      rp("Mar 19", 18, 148, 62, 104, 26.4),
      rp("Mar 20", 20, 154, 66, 108, 24.8),
      rp("Mar 21", 15, 138, 58, 95, 28.2),
      rp("Mar 22", 21, 156, 68, 109, 25.8),
      rp("Mar 23", 24, 162, 72, 114, 28.4),
      rp("Mar 24", 26, 168, 74, 120, 30.2),
      rp("TTM", 28, 172, 76, 124, 31.8),
    ],
  },
  ULTRACEMCO: {
    symbol: "ULTRACEMCO",
    periods: [
      rp("Mar 19", 22, 38, 42, 18, 14.8),
      rp("Mar 20", 24, 40, 44, 20, 13.4),
      rp("Mar 21", 20, 36, 40, 16, 15.2),
      rp("Mar 22", 26, 42, 46, 22, 14.8),
      rp("Mar 23", 28, 46, 48, 26, 16.4),
      rp("Mar 24", 30, 48, 50, 28, 17.8),
      rp("TTM", 32, 50, 52, 30, 18.4),
    ],
  },
  NESTLEIND: {
    symbol: "NESTLEIND",
    periods: [
      rp("Mar 19", 8, 28, 52, -16, 98.4),
      rp("Mar 20", 9, 30, 54, -15, 102.8),
      rp("Mar 21", 7, 26, 50, -17, 112.4),
      rp("Mar 22", 10, 32, 56, -14, 108.2),
      rp("Mar 23", 11, 34, 58, -13, 114.8),
      rp("Mar 24", 12, 36, 60, -12, 118.4),
      rp("TTM", 12, 37, 61, -12, 122.8),
    ],
  },
  DRREDDY: {
    symbol: "DRREDDY",
    periods: [
      rp("Mar 19", 68, 88, 54, 102, 14.4),
      rp("Mar 20", 72, 92, 58, 106, 13.8),
      rp("Mar 21", 64, 84, 50, 98, 16.2),
      rp("Mar 22", 70, 90, 56, 104, 15.8),
      rp("Mar 23", 76, 96, 60, 112, 17.4),
      rp("Mar 24", 80, 100, 64, 116, 19.2),
      rp("TTM", 82, 102, 66, 118, 20.8),
    ],
  },
  POWERGRID: {
    symbol: "POWERGRID",
    periods: [
      rp("Mar 19", 36, 0, 48, -12, 14.2),
      rp("Mar 20", 38, 0, 50, -12, 14.8),
      rp("Mar 21", 34, 0, 46, -12, 15.4),
      rp("Mar 22", 40, 0, 52, -12, 15.8),
      rp("Mar 23", 42, 0, 54, -12, 16.4),
      rp("Mar 24", 44, 0, 56, -12, 17.2),
      rp("TTM", 46, 0, 58, -12, 17.8),
    ],
  },
  ONGC: {
    symbol: "ONGC",
    periods: [
      rp("Mar 19", 42, 32, 38, 36, 16.4),
      rp("Mar 20", 46, 34, 40, 40, 14.8),
      rp("Mar 21", 38, 28, 34, 32, 12.4),
      rp("Mar 22", 44, 32, 38, 38, 18.2),
      rp("Mar 23", 48, 36, 42, 42, 21.4),
      rp("Mar 24", 46, 34, 40, 40, 19.8),
      rp("TTM", 48, 36, 42, 42, 20.4),
    ],
  },
  NTPC: {
    symbol: "NTPC",
    periods: [
      rp("Mar 19", 28, 0, 52, -24, 12.4),
      rp("Mar 20", 30, 0, 54, -24, 12.8),
      rp("Mar 21", 26, 0, 50, -24, 13.4),
      rp("Mar 22", 32, 0, 56, -24, 13.8),
      rp("Mar 23", 34, 0, 58, -24, 14.4),
      rp("Mar 24", 36, 0, 60, -24, 15.2),
      rp("TTM", 38, 0, 62, -24, 15.8),
    ],
  },
};

export function getRatiosData(symbol: string): CompanyRatios | null {
  return ratiosMap[symbol] ?? null;
}
