// app/company/[symbol]/page.tsx
// Next.js 14 App Router — company detail page
// Run: npm install @tanstack/react-query lightweight-charts

"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ------------------------------------------------------------------
// API FETCHERS
// ------------------------------------------------------------------
async function fetchCompany(symbol: string) {
  const res = await fetch(`${API_BASE}/companies/${symbol}/`);
  if (!res.ok) throw new Error("Company not found");
  return res.json();
}

async function fetchPrices(symbol: string, range: string) {
  const res = await fetch(`${API_BASE}/companies/${symbol}/prices/?range=${range}`);
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

async function fetchFinancials(symbol: string, period: string) {
  const res = await fetch(`${API_BASE}/companies/${symbol}/financials/?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch financials");
  return res.json();
}

// ------------------------------------------------------------------
// RATIO CARD COMPONENT
// ------------------------------------------------------------------
function RatioCard({ label, value, suffix = "" }: { label: string; value: any; suffix?: string }) {
  const display = value != null ? `${Number(value).toFixed(2)}${suffix}` : "—";
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-medium text-gray-900">{display}</div>
    </div>
  );
}

// ------------------------------------------------------------------
// FINANCIALS TABLE COMPONENT
// ------------------------------------------------------------------
function FinancialsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-sm">No data available.</p>;

  const fields = [
    { key: "revenue", label: "Revenue (Cr)" },
    { key: "ebitda", label: "EBITDA (Cr)" },
    { key: "net_profit", label: "Net Profit (Cr)" },
    { key: "eps", label: "EPS (₹)" },
    { key: "operating_cash_flow", label: "Operating CF (Cr)" },
    { key: "free_cash_flow", label: "Free CF (Cr)" },
  ];

  const fmt = (v: any) =>
    v == null ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: 1 });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-4 text-gray-500 font-normal">Metric</th>
            {data.slice(0, 8).map((d) => (
              <th key={d.period_end} className="text-right py-2 px-2 text-gray-500 font-normal">
                {d.period_end}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.key} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 pr-4 text-gray-600">{f.label}</td>
              {data.slice(0, 8).map((d) => (
                <td key={d.period_end} className="text-right py-2 px-2 text-gray-900">
                  {fmt(d[f.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------
// PRICE CHART (uses TradingView Lightweight Charts via CDN)
// ------------------------------------------------------------------
function PriceChart({ symbol }: { symbol: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState("1y");
  const { data, isLoading } = useQuery({
    queryKey: ["prices", symbol, range],
    queryFn: () => fetchPrices(symbol, range),
  });

  const ranges = ["1m", "3m", "6m", "1y", "3y", "5y"];

  useEffect(() => {
    if (!chartRef.current || !data?.data?.length) return;

    // Lightweight Charts loaded via <script> in layout.tsx
    const LWC = (window as any).LightweightCharts;
    if (!LWC) return;

    chartRef.current.innerHTML = "";
    const chart = LWC.createChart(chartRef.current, {
      width: chartRef.current.offsetWidth,
      height: 300,
      layout: { background: { color: "transparent" }, textColor: "#6b7280" },
      grid: { vertLines: { color: "#f3f4f6" }, horzLines: { color: "#f3f4f6" } },
      rightPriceScale: { borderColor: "#e5e7eb" },
      timeScale: { borderColor: "#e5e7eb" },
    });

    const series = chart.addAreaSeries({
      lineColor: "#10b981",
      topColor: "rgba(16,185,129,0.2)",
      bottomColor: "rgba(16,185,129,0.01)",
      lineWidth: 2,
    });

    series.setData(
      data.data.map((d: any) => ({
        time: d.date,
        value: parseFloat(d.close),
      }))
    );

    chart.timeScale().fitContent();
    const handleResize = () => chart.applyOptions({ width: chartRef.current!.offsetWidth });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              range === r
                ? "bg-emerald-600 text-white border-emerald-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          Loading chart...
        </div>
      ) : (
        <div ref={chartRef} className="h-[300px] w-full" />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ------------------------------------------------------------------
export default function CompanyPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const [activeTab, setActiveTab] = useState("overview");
  const [finPeriod, setFinPeriod] = useState("quarterly");

  const { data: company, isLoading, error } = useQuery({
    queryKey: ["company", symbol],
    queryFn: () => fetchCompany(symbol),
  });

  const { data: financials } = useQuery({
    queryKey: ["financials", symbol, finPeriod],
    queryFn: () => fetchFinancials(symbol, finPeriod),
    enabled: activeTab === "financials",
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Company not found.</div>;

  const r = company?.latest_ratios || {};
  const tabs = ["overview", "financials", "shareholding"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{company?.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-400">{symbol}</span>
              {company?.sector && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {company.sector}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Market Cap</div>
            <div className="text-lg font-medium">
              ₹{Number(company?.market_cap || 0).toLocaleString("en-IN")} Cr
            </div>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5">
        <PriceChart symbol={symbol} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-emerald-600 text-emerald-700 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <RatioCard label="P/E" value={r.pe_ratio} />
            <RatioCard label="P/B" value={r.pb_ratio} />
            <RatioCard label="ROE" value={r.roe} suffix="%" />
            <RatioCard label="ROCE" value={r.roce} suffix="%" />
            <RatioCard label="D/E" value={r.debt_to_equity} />
            <RatioCard label="Net Margin" value={r.net_margin} suffix="%" />
            <RatioCard label="Rev Growth" value={r.revenue_growth} suffix="%" />
            <RatioCard label="Profit Growth" value={r.profit_growth} suffix="%" />
            <RatioCard label="Div Yield" value={r.dividend_yield} suffix="%" />
            <RatioCard label="EV/EBITDA" value={r.ev_ebitda} />
          </div>
        </div>
      )}

      {/* Financials Tab */}
      {activeTab === "financials" && (
        <div>
          <div className="flex gap-2 mb-4">
            {["quarterly", "annual"].map((p) => (
              <button
                key={p}
                onClick={() => setFinPeriod(p)}
                className={`text-sm px-3 py-1 rounded border transition-colors capitalize ${
                  finPeriod === p
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <FinancialsTable data={financials?.data || []} />
        </div>
      )}

      {/* Shareholding Tab — placeholder */}
      {activeTab === "shareholding" && (
        <p className="text-sm text-gray-400">Shareholding data coming soon.</p>
      )}
    </div>
  );
}
