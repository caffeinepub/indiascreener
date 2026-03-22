# IndiaScreener

## Current State
The app has CompanyPage with tabs: Financials, Balance Sheet, Cash Flow, Ratios, Shareholding, Health Score, Documents, Peers. exportFinancialModel.ts generates 5 sheets. No Insights tab exists.

## Requested Changes (Diff)

### Add
- `src/frontend/src/data/insightsData.ts` — operational KPI data for all 25 companies with realistic approximate values (FY2019–FY2024+TTM). Yearly data only. Sector-specific metrics per spec.
- `src/frontend/src/components/InsightsPanel.tsx` — table component showing metrics across years. No quarterly toggle (hidden). Disclaimer footer. Flag error button.
- Insights tab in CompanyPage between Ratios and Health Score.
- Sheet 6 "Operational Insights" in exportFinancialModel.ts.

### Modify
- `src/frontend/src/pages/CompanyPage.tsx` — add Insights tab trigger and content, import InsightsPanel.
- `src/frontend/src/lib/exportFinancialModel.ts` — add Sheet 6 using insightsData.

### Remove
- Nothing.

## Implementation Plan
1. Create insightsData.ts with all 25 companies, realistic approximate values, yearly periods FY2019–FY2024+TTM.
2. Create InsightsPanel.tsx component (no quarterly toggle, disclaimer footer).
3. Edit CompanyPage.tsx to add Insights tab between Ratios and Health Score.
4. Edit exportFinancialModel.ts to append Sheet 6 Operational Insights.
