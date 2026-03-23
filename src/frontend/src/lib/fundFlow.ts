import { getBSData } from "../data/balanceSheetData";

export interface FundFlowBar {
  label: string;
  value: number;
  type: "increase" | "decrease" | "total";
}

export interface FundFlowResult {
  sources: FundFlowBar[];
  uses: FundFlowBar[];
  periodLabel: string;
}

export type FundFlowRange = "1Y" | "3Y" | "5Y" | "10Y";

function barType(val: number): "increase" | "decrease" {
  return val >= 0 ? "increase" : "decrease";
}

export function computeFundFlow(
  symbol: string,
  range: FundFlowRange,
): FundFlowResult | null {
  const bs = getBSData(symbol);
  if (!bs || bs.periods.length < 2) return null;

  const periods = bs.periods.filter((p) => p.period !== "TTM");
  const end = periods[periods.length - 1];

  const yearsBack =
    range === "1Y" ? 1 : range === "3Y" ? 3 : range === "5Y" ? 5 : 10;
  const startIdx = Math.max(0, periods.length - 1 - yearsBack);
  const start = periods[startIdx];

  const periodLabel = `${start.period} \u2192 ${end.period} (${range})`;

  const d = (endVal: number, startVal: number) => Math.round(endVal - startVal);

  const shareCapitalDelta = d(end.equityCapital, start.equityCapital);
  const reservesDelta = d(end.reserves, start.reserves);
  const loansDelta = d(end.borrowings, start.borrowings);
  const otherLiabDelta = d(end.otherLiabilities, start.otherLiabilities);
  const accountsPayable = Math.round(otherLiabDelta * 0.6);
  const shortTermLoans = Math.round(otherLiabDelta * 0.4);
  const totalInflow =
    shareCapitalDelta +
    reservesDelta +
    loansDelta +
    accountsPayable +
    shortTermLoans;

  const allSources: FundFlowBar[] = [
    {
      label: "Share Capital",
      value: shareCapitalDelta,
      type: barType(shareCapitalDelta),
    },
    { label: "Reserves", value: reservesDelta, type: barType(reservesDelta) },
    { label: "Loans", value: loansDelta, type: barType(loansDelta) },
    {
      label: "Accounts Payable",
      value: accountsPayable,
      type: barType(accountsPayable),
    },
    {
      label: "Short Term Loans",
      value: shortTermLoans,
      type: barType(shortTermLoans),
    },
    { label: "Other Sources of Funds", value: 0, type: "increase" },
    { label: "Total Inflow of Funds", value: totalInflow, type: "total" },
  ];
  const sources = allSources.filter((b) => b.value !== 0 || b.type === "total");

  const netBlockDelta = d(end.fixedAssets, start.fixedAssets);
  const cwipDelta = d(end.cwip, start.cwip);
  const inventoryDelta = d(end.investments, start.investments);
  const otherAssetsDelta = d(end.otherAssets, start.otherAssets);
  const accountsRec = Math.round(otherAssetsDelta * 0.5);
  const cashAndST = Math.round(otherAssetsDelta * 0.3);
  const otherUses = Math.round(otherAssetsDelta * 0.2);
  const totalOutflow =
    netBlockDelta +
    cwipDelta +
    inventoryDelta +
    accountsRec +
    cashAndST +
    otherUses;

  const allUses: FundFlowBar[] = [
    { label: "Net Block", value: netBlockDelta, type: barType(netBlockDelta) },
    {
      label: "Capital Work in Progress",
      value: cwipDelta,
      type: barType(cwipDelta),
    },
    {
      label: "Inventory",
      value: inventoryDelta,
      type: barType(inventoryDelta),
    },
    {
      label: "Accounts Receivable",
      value: accountsRec,
      type: barType(accountsRec),
    },
    {
      label: "Cash & Short Term Investments",
      value: cashAndST,
      type: barType(cashAndST),
    },
    { label: "Short Term Loans & Advances", value: 0, type: "increase" },
    {
      label: "Other Uses Of Funds",
      value: otherUses,
      type: barType(otherUses),
    },
    { label: "Total Outflow of Funds", value: totalOutflow, type: "total" },
  ];
  const uses = allUses.filter((b) => b.value !== 0 || b.type === "total");

  return { sources, uses, periodLabel };
}
