import * as XLSX from "xlsx";
import { getBSData } from "../data/balanceSheetData";
import { getCFData } from "../data/cashFlowData";
import { getCompany } from "../data/companiesData";
import { getInsightsData } from "../data/insightsData";
import { getPLData } from "../data/plData";
import { getRatiosData } from "../data/ratiosData";
import { computeFundFlow } from "./fundFlow";

// Helper: set column widths on a worksheet
function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

// Helper: freeze top row + first column
function freezePane(ws: XLSX.WorkSheet) {
  (ws as any)["!freeze"] = { xSplit: 1, ySplit: 1 };
}

// Helper: encode a cell address
function cell(r: number, c: number): string {
  return XLSX.utils.encode_cell({ r, c });
}

// Helper: apply bold style to a row in AOA sheet
function boldRow(ws: XLSX.WorkSheet, rowIdx: number, numCols: number) {
  for (let c = 0; c < numCols; c++) {
    const addr = cell(rowIdx, c);
    if (!ws[addr]) ws[addr] = { t: "s", v: "" };
    ws[addr].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E8F4FD" } },
    };
  }
}

// Helper: apply header row style (dark bg, white bold)
function styleHeaderRow(ws: XLSX.WorkSheet, rowIdx: number, numCols: number) {
  for (let c = 0; c < numCols; c++) {
    const addr = cell(rowIdx, c);
    if (!ws[addr]) ws[addr] = { t: "s", v: "" };
    ws[addr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1A1A2E" } },
    };
  }
}

export function exportFinancialModel(symbol: string): void {
  const company = getCompany(symbol);
  if (!company) {
    console.error(`Company not found: ${symbol}`);
    return;
  }

  const pl = getPLData(symbol);
  const bs = getBSData(symbol);
  const cf = getCFData(symbol);
  const ratios = getRatiosData(symbol);

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Company Overview ─────────────────────────────────────────────
  const overviewData: (string | number)[][] = [
    ["Company Financial Model", ""],
    ["IndiaScreener — Analyst Grade Export", ""],
    ["", ""],
    ["COMPANY OVERVIEW", ""],
    ["Field", "Value"],
    ["Company Name", company.name],
    ["NSE Symbol", company.symbol],
    ["Sector", company.sector],
    ["Industry", company.industry],
    ["Market Cap (₹ Cr)", company.marketCap],
    ["Current Price (₹)", company.price],
    ["52W High / Low", `${company.high52w} / ${company.low52w}`],
    ["P/E Ratio", `${company.pe}x`],
    ["P/B Ratio", `${company.pb}x`],
    ["ROE", `${company.roe}%`],
    ["ROCE", `${company.roce}%`],
    ["Debt / Equity", `${company.debtEquity}x`],
    ["Dividend Yield", `${company.dividendYield}%`],
    ["EPS (₹)", company.eps],
    ["Revenue (₹ Cr)", company.revenue],
    ["Net Profit (₹ Cr)", company.netProfit],
    ["Revenue Growth YoY", `${company.revenueGrowth}%`],
    ["Profit Growth YoY", `${company.profitGrowth}%`],
    ["Data as of", "March 2026 (IndiaScreener)"],
    ["", ""],
  ];

  // CAGR block
  const cagr = pl?.cagr;
  if (cagr) {
    overviewData.push(["CAGR SUMMARY", ""]);
    overviewData.push(["Metric", "5Y", "3Y", "TTM / 1Y"]);
    overviewData.push([
      "Sales Growth CAGR",
      cagr.salesGrowth?.y5 != null ? `${cagr.salesGrowth.y5}%` : "—",
      cagr.salesGrowth?.y3 != null ? `${cagr.salesGrowth.y3}%` : "—",
      cagr.salesGrowth?.ttm != null ? `${cagr.salesGrowth.ttm}%` : "—",
    ]);
    overviewData.push([
      "Profit Growth CAGR",
      cagr.profitGrowth?.y5 != null ? `${cagr.profitGrowth.y5}%` : "—",
      cagr.profitGrowth?.y3 != null ? `${cagr.profitGrowth.y3}%` : "—",
      cagr.profitGrowth?.ttm != null ? `${cagr.profitGrowth.ttm}%` : "—",
    ]);
    overviewData.push([
      "Stock CAGR",
      "—",
      cagr.stockCagr?.y3 != null ? `${cagr.stockCagr.y3}%` : "—",
      cagr.stockCagr?.y1 != null ? `${cagr.stockCagr.y1}%` : "—",
    ]);
    overviewData.push([
      "Return on Equity",
      cagr.roe?.y5 != null ? `${cagr.roe.y5}%` : "—",
      cagr.roe?.y3 != null ? `${cagr.roe.y3}%` : "—",
      cagr.roe?.lastYear != null ? `${cagr.roe.lastYear}%` : "—",
    ]);
  }

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  setColWidths(wsOverview, [32, 24, 14, 14]);
  XLSX.utils.book_append_sheet(wb, wsOverview, "Company Overview");

  // ── Sheet 2: Profit & Loss ───────────────────────────────────────────────
  if (pl?.periods?.length) {
    const periods = pl.periods;
    const plHeader = ["", ...periods.map((p) => p.period)];
    const numCols = plHeader.length;

    const plRows: (string | number)[][] = [
      plHeader,
      ["Revenue (₹ Cr)", ...periods.map((p) => p.sales)],
      ["Expenses", ...periods.map((p) => p.expenses)],
      ["Operating Profit", ...periods.map((p) => p.operatingProfit)],
      ["OPM %", ...periods.map((p) => p.opmPct)],
      ["Other Income", ...periods.map((p) => p.otherIncome)],
      ["Interest", ...periods.map((p) => p.interest)],
      ["Depreciation", ...periods.map((p) => p.depreciation)],
      ["Profit Before Tax", ...periods.map((p) => p.profitBeforeTax)],
      ["Tax Rate %", ...periods.map((p) => p.taxPct)],
      ["Net Profit", ...periods.map((p) => p.netProfit)],
      ["EPS (₹)", ...periods.map((p) => p.eps)],
      ["Dividend Payout %", ...periods.map((p) => p.dividendPayoutPct)],
    ];

    const wsPL = XLSX.utils.aoa_to_sheet(plRows);
    styleHeaderRow(wsPL, 0, numCols);
    boldRow(wsPL, 1, numCols); // Revenue
    boldRow(wsPL, 3, numCols); // Operating Profit
    boldRow(wsPL, 8, numCols); // Profit Before Tax
    boldRow(wsPL, 10, numCols); // Net Profit

    setColWidths(wsPL, [28, ...Array(periods.length).fill(14)]);
    freezePane(wsPL);
    XLSX.utils.book_append_sheet(wb, wsPL, "Profit & Loss");
  }

  // ── Sheet 3: Balance Sheet ───────────────────────────────────────────────
  if (bs?.periods?.length) {
    const periods = bs.periods;
    const bsHeader = ["", ...periods.map((p) => p.period)];
    const numCols = bsHeader.length;

    const latestPeriod = bs.periods.filter((p) => p.period !== "TTM").at(-1);
    const snapshotRows: (string | number)[][] = [];
    if (latestPeriod) {
      snapshotRows.push(
        ["BALANCE SHEET SNAPSHOT", `as of ${latestPeriod.period}`, "", ""],
        ["", "", "", ""],
        ["ASSETS", "Value (₹ Cr)", "LIABILITIES", "Value (₹ Cr)"],
        [
          "Net Block",
          latestPeriod.fixedAssets,
          "Equity",
          latestPeriod.equityCapital + latestPeriod.reserves,
        ],
        [
          "CWIP",
          latestPeriod.cwip,
          "Debt (Borrowings)",
          latestPeriod.borrowings,
        ],
        [
          "Investments",
          latestPeriod.investments,
          "Other Liabilities",
          latestPeriod.otherLiabilities,
        ],
        ["Other Assets", latestPeriod.otherAssets, "", ""],
        [
          "Total Assets",
          latestPeriod.totalAssets,
          "Total Liabilities",
          latestPeriod.totalLiabilities,
        ],
        ["", "", "", ""],
      );
    }

    const bsRows: (string | number)[][] = [
      ...snapshotRows,
      bsHeader,
      ["LIABILITIES", ...periods.map(() => "")],
      ["Equity Capital", ...periods.map((p) => p.equityCapital)],
      ["Reserves", ...periods.map((p) => p.reserves)],
      ["Borrowings", ...periods.map((p) => p.borrowings)],
      ["Other Liabilities", ...periods.map((p) => p.otherLiabilities)],
      ["Total Liabilities", ...periods.map((p) => p.totalLiabilities)],
      ["ASSETS", ...periods.map(() => "")],
      ["Fixed Assets", ...periods.map((p) => p.fixedAssets)],
      ["CWIP", ...periods.map((p) => p.cwip)],
      ["Investments", ...periods.map((p) => p.investments)],
      ["Other Assets", ...periods.map((p) => p.otherAssets)],
      ["Total Assets", ...periods.map((p) => p.totalAssets)],
    ];

    const wsBS = XLSX.utils.aoa_to_sheet(bsRows);
    styleHeaderRow(wsBS, 0, numCols);
    boldRow(wsBS, 1, numCols); // LIABILITIES
    boldRow(wsBS, 6, numCols); // Total Liabilities
    boldRow(wsBS, 7, numCols); // ASSETS
    boldRow(wsBS, 12, numCols); // Total Assets

    setColWidths(wsBS, [28, ...Array(periods.length).fill(14)]);
    freezePane(wsBS);
    XLSX.utils.book_append_sheet(wb, wsBS, "Balance Sheet");
  }

  // ── Sheet 4: Cash Flow ───────────────────────────────────────────────────
  if (cf?.periods?.length) {
    const periods = cf.periods;
    const cfHeader = ["", ...periods.map((p) => p.period)];
    const numCols = cfHeader.length;

    const cfRows: (string | number)[][] = [
      cfHeader,
      ["Cash from Operating", ...periods.map((p) => p.cashFromOperating)],
      ["Cash from Investing", ...periods.map((p) => p.cashFromInvesting)],
      ["Cash from Financing", ...periods.map((p) => p.cashFromFinancing)],
      ["Net Cash Flow", ...periods.map((p) => p.netCashFlow)],
    ];

    const wsCF = XLSX.utils.aoa_to_sheet(cfRows);
    styleHeaderRow(wsCF, 0, numCols);
    boldRow(wsCF, 4, numCols); // Net Cash Flow

    setColWidths(wsCF, [28, ...Array(periods.length).fill(14)]);
    freezePane(wsCF);
    XLSX.utils.book_append_sheet(wb, wsCF, "Cash Flow");
  }

  // ── Sheet 5: Key Ratios ──────────────────────────────────────────────────────
  if (ratios?.periods?.length) {
    const periods = ratios.periods;
    const ratHeader = ["", ...periods.map((p) => p.period)];
    const numCols = ratHeader.length;

    const ratRows: (string | number)[][] = [
      ratHeader,
      ["Debtor Days", ...periods.map((p) => p.debtorDays)],
      ["Inventory Days", ...periods.map((p) => p.inventoryDays)],
      ["Days Payable", ...periods.map((p) => p.daysPayable)],
      ["Cash Conversion Cycle", ...periods.map((p) => p.cashConversionCycle)],
      ["Working Capital Days", ...periods.map((p) => p.workingCapitalDays)],
      ["ROCE %", ...periods.map((p) => p.roce)],
    ];

    const wsRat = XLSX.utils.aoa_to_sheet(ratRows);
    styleHeaderRow(wsRat, 0, numCols);

    setColWidths(wsRat, [28, ...Array(periods.length).fill(14)]);
    freezePane(wsRat);
    XLSX.utils.book_append_sheet(wb, wsRat, "Key Ratios");
  }

  // ── Sheet 6: Operational Insights ──────────────────────────────────────────────
  const insights = getInsightsData(symbol);
  if (insights?.metrics?.length) {
    const allPeriods = [
      ...new Set(
        insights.metrics.flatMap((metric) =>
          metric.periods.map((p) => p.period),
        ),
      ),
    ];
    const insHeader = ["Metric", "Unit", ...allPeriods];
    const insRows: (string | number | null)[][] = [insHeader];
    for (const metric of insights.metrics) {
      const valueMap = Object.fromEntries(
        metric.periods.map((p) => [p.period, p.value]),
      );
      insRows.push([
        metric.label,
        metric.unit,
        ...allPeriods.map((p) => valueMap[p] ?? null),
      ]);
    }
    const wsIns = XLSX.utils.aoa_to_sheet(insRows);
    styleHeaderRow(wsIns, 0, insHeader.length);
    setColWidths(wsIns, [32, 12, ...Array(allPeriods.length).fill(14)]);
    freezePane(wsIns);
    XLSX.utils.book_append_sheet(wb, wsIns, "Operational Insights");
  }

  // ── Sheet 7: Fund Flow ──────────────────────────────────────────────────────
  const ffRanges = ["1Y", "3Y", "5Y"] as const;
  const ffRows: unknown[][] = [["Period", "Item", "Side", "Value (₹ Cr)"]];
  for (const r of ffRanges) {
    const ff = computeFundFlow(symbol, r);
    if (!ff) continue;
    for (const s of ff.sources) {
      ffRows.push([ff.periodLabel, s.label, "Source", s.value]);
    }
    for (const u of ff.uses) {
      ffRows.push([ff.periodLabel, u.label, "Use", u.value]);
    }
  }
  const ffSheet = XLSX.utils.aoa_to_sheet(ffRows);
  styleHeaderRow(ffSheet, 0, 4);
  setColWidths(ffSheet, [28, 32, 10, 16]);
  XLSX.utils.book_append_sheet(wb, ffSheet, "Fund Flow");

  // ── Write file ─────────────────────────────────────────────────────────────────────
  XLSX.writeFile(wb, `${symbol}_FinancialModel_IndiaScreener.xlsx`);
}
