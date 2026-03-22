// app/screener/page.tsx
// The main screener page — query input + results table
// Run: npm install @tanstack/react-query

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ------------------------------------------------------------------
// EXAMPLE QUERIES (shown to new users)
// ------------------------------------------------------------------
const EXAMPLE_QUERIES = [
  { label: "Quality at Value", query: "PE < 20 AND ROE > 15 AND Debt to Equity < 1" },
  { label: "High Growth", query: "Revenue Growth > 20 AND Profit Growth > 20" },
  { label: "Dividend Stocks", query: "Dividend Yield > 3 AND PE < 25" },
  { label: "Low Debt Profitable", query: "ROE > 20 AND Debt to Equity < 0.5 AND Net Margin > 10" },
  { label: "Small Cap Value", query: "Market Cap < 500 AND PE < 15 AND ROE > 12" },
];

// ------------------------------------------------------------------
// SUPPORTED FIELDS (shown in helper tooltip)
// ------------------------------------------------------------------
const SUPPORTED_FIELDS = [
  "PE", "PB", "EV/EBITDA", "Price to Sales",
  "ROE", "ROCE", "ROA", "Net Margin", "Operating Margin",
  "Debt to Equity", "Interest Coverage", "Current Ratio",
  "Revenue Growth", "Profit Growth",
  "Dividend Yield", "Dividend Payout",
  "Market Cap",
];

// ------------------------------------------------------------------
// API CALL
// ------------------------------------------------------------------
async function runScreener(query: string, page: number, sortBy: string, sortDir: string) {
  const res = await fetch(`${API_BASE}/screener/run/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, page, sort_by: sortBy, sort_dir: sortDir, page_size: 50 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Screener error");
  return data;
}

// ------------------------------------------------------------------
// RESULT ROW
// ------------------------------------------------------------------
function ResultRow({ company, rank }: { company: any; rank: number }) {
  const fmt = (v: any, dec = 1) =>
    v == null ? "—" : Number(v).toFixed(dec);
  const fmtCr = (v: any) =>
    v == null ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <tr className="border-b border-gray-50 hover:bg-emerald-50/40 transition-colors">
      <td className="py-2.5 px-3 text-gray-400 text-xs w-8">{rank}</td>
      <td className="py-2.5 px-3">
        <Link
          href={`/company/${company.nse_symbol}`}
          className="font-medium text-gray-900 hover:text-emerald-700 text-sm"
        >
          {company.name}
        </Link>
        <div className="text-xs text-gray-400">{company.sector}</div>
      </td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{company.nse_symbol}</td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{fmtCr(company.market_cap)}</td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{fmt(company.pe_ratio)}</td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{fmt(company.pb_ratio)}</td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{fmt(company.roe)}%</td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{fmt(company.roce)}%</td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{fmt(company.debt_to_equity)}</td>
      <td className="py-2.5 px-3 text-right text-sm text-gray-700">{fmt(company.net_margin)}%</td>
    </tr>
  );
}

// ------------------------------------------------------------------
// MAIN SCREENER PAGE
// ------------------------------------------------------------------
export default function ScreenerPage() {
  const [inputQuery, setInputQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("market_cap");
  const [sortDir, setSortDir] = useState("DESC");
  const [showFields, setShowFields] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["screener", activeQuery, page, sortBy, sortDir],
    queryFn: () => runScreener(activeQuery, page, sortBy, sortDir),
    enabled: !!activeQuery,
    onError: (e: any) => setError(e.message),
    onSuccess: () => setError(""),
  });

  function handleRun() {
    if (!inputQuery.trim()) return;
    setActiveQuery(inputQuery.trim());
    setPage(1);
    setError("");
  }

  function handleExample(query: string) {
    setInputQuery(query);
    setActiveQuery(query);
    setPage(1);
    setError("");
  }

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Stock Screener</h1>
        <p className="text-sm text-gray-500">
          Filter Indian stocks by fundamental criteria. Use AND / OR between conditions.
        </p>
      </div>

      {/* Query Input */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <textarea
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRun(); }}}
          placeholder="PE < 20 AND ROE > 15 AND Market Cap > 500"
          rows={3}
          className="w-full text-sm text-gray-900 placeholder-gray-300 bg-transparent resize-none outline-none font-mono"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowFields(!showFields)}
            className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
          >
            {showFields ? "Hide" : "Show"} supported fields ↓
          </button>
          <button
            onClick={handleRun}
            disabled={!inputQuery.trim() || isLoading}
            className="px-5 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isFetching ? "Running..." : "Run Screener"}
          </button>
        </div>
        {showFields && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
            {SUPPORTED_FIELDS.map((f) => (
              <span
                key={f}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded cursor-pointer hover:bg-emerald-100 hover:text-emerald-700"
                onClick={() => setInputQuery((q) => q ? `${q} AND ${f} > ` : `${f} > `)}
              >
                {f}
              </span>
            ))}
          </div>
        )}
        {error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 rounded px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Example Queries */}
      {!activeQuery && (
        <div className="mb-6">
          <div className="text-xs text-gray-400 mb-2">Try an example:</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleExample(ex.query)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{data.total}</span> companies match
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              Sort:
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white"
              >
                <option value="market_cap">Market Cap</option>
                <option value="pe">PE Ratio</option>
                <option value="roe">ROE</option>
                <option value="roce">ROCE</option>
                <option value="revenue_growth">Revenue Growth</option>
                <option value="profit_growth">Profit Growth</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white"
              >
                <option value="DESC">High → Low</option>
                <option value="ASC">Low → High</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400 w-8">#</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-400">Company</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">Symbol</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">Mkt Cap (Cr)</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">PE</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">PB</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">ROE%</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">ROCE%</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">D/E</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-400">Net Mgn%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((co: any, i: number) => (
                    <ResultRow key={co.id} company={co} rank={(page - 1) * 50 + i + 1} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm px-3 py-1 border border-gray-200 rounded disabled:opacity-30 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm px-3 py-1 border border-gray-200 rounded disabled:opacity-30 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Running screener...
        </div>
      )}
    </div>
  );
}
