# IndiaScreener

## Current State
CompanyPage has a Balance Sheet tab rendering the `<BalanceSheet>` table component. The `balanceSheetData.ts` file already contains all needed BS fields. `exportFinancialModel.ts` has Sheet 3 for Balance Sheet with a year-wise table.

## Requested Changes (Diff)

### Add
- `src/frontend/src/components/BalanceSheetSnapshot.tsx` — treemap visualization component showing Assets and Liabilities side by side using Recharts Treemap

### Modify
- `src/frontend/src/pages/CompanyPage.tsx` — add `<BalanceSheetSnapshot>` above `<BalanceSheet>` inside the existing `balance-sheet` TabsContent
- `src/frontend/src/lib/exportFinancialModel.ts` — prepend a snapshot summary block (4-column: Assets | Value | Liabilities | Value) to Sheet 3 before the period table

### Remove
- Nothing removed

## Implementation Plan
1. Create `BalanceSheetSnapshot.tsx` with:
   - `buildAssets()` mapping fixedAssets, cwip, investments, otherAssets splits to TreeNodes with green/red colors
   - `buildLiabilities()` mapping equity, borrowings, otherLiabilities splits to TreeNodes
   - `CustomCell` SVG renderer for treemap tiles with label/value text
   - `SnapshotTooltip` for hover details
   - Two side-by-side `<Treemap>` panels inside `<ResponsiveContainer>`
   - Legend and disclaimer footnote
2. Edit `CompanyPage.tsx` to import and render `<BalanceSheetSnapshot symbol={symbol} />` above `<BalanceSheet>` in the balance-sheet tab
3. Edit `exportFinancialModel.ts` Sheet 3 to prepend 9-row snapshot summary block using latest non-TTM period before the existing year-wise rows
