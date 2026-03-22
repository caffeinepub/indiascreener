export interface InsightMetric {
  label: string;
  unit: string;
  periods: { period: string; value: number | null }[];
}

export interface CompanyInsights {
  symbol: string;
  metrics: InsightMetric[];
  note?: string;
}

const PERIODS = [
  "Mar 2019",
  "Mar 2020",
  "Mar 2021",
  "Mar 2022",
  "Mar 2023",
  "Mar 2024",
  "TTM",
];

function m(
  label: string,
  unit: string,
  values: (number | null)[],
): InsightMetric {
  return {
    label,
    unit,
    periods: PERIODS.map((period, i) => ({ period, value: values[i] ?? null })),
  };
}

const NOTE =
  "Data is approximate and for educational purposes only. Verify with official BSE/NSE filings.";

const insightsMap: CompanyInsights[] = [
  {
    symbol: "HDFCBANK",
    note: NOTE,
    metrics: [
      m("Net Interest Margin (NIM)", "%", [4.3, 4.3, 4.1, 4.2, 4.1, 3.6, 3.7]),
      m("Gross NPA Ratio", "%", [1.36, 1.26, 1.32, 1.17, 1.12, 1.24, 1.33]),
      m("Net NPA Ratio", "%", [0.39, 0.36, 0.4, 0.32, 0.27, 0.31, 0.36]),
      m("CASA Ratio", "%", [42.4, 42.2, 46.1, 47.1, 44.4, 38.2, 37.5]),
      m(
        "Capital Adequacy Ratio (CAR)",
        "%",
        [17.1, 18.9, 19.1, 18.9, 19.3, 18.8, 19.2],
      ),
      m(
        "Loan Book Size",
        "₹ Cr",
        [819401, 993703, 1132836, 1368821, 1600586, 2479290, 2630000],
      ),
      m(
        "Number of Branches",
        "Count",
        [5103, 5608, 5608, 6342, 7821, 8738, 9143],
      ),
    ],
  },
  {
    symbol: "ICICIBANK",
    note: NOTE,
    metrics: [
      m(
        "Net Interest Margin (NIM)",
        "%",
        [3.42, 3.69, 3.73, 3.96, 4.65, 4.53, 4.48],
      ),
      m("Gross NPA Ratio", "%", [6.7, 5.53, 4.96, 3.6, 2.81, 2.16, 2.05]),
      m("Net NPA Ratio", "%", [2.06, 1.54, 1.14, 0.76, 0.48, 0.42, 0.4]),
      m("CASA Ratio", "%", [49.6, 49.6, 51.4, 52.9, 45.6, 40.8, 39.7]),
      m(
        "Capital Adequacy Ratio (CAR)",
        "%",
        [16.9, 16.1, 19.1, 19.2, 18.3, 16.6, 16.9],
      ),
      m(
        "Loan Book Size",
        "₹ Cr",
        [586647, 645290, 701685, 812491, 1003975, 1203967, 1280000],
      ),
      m(
        "Number of Branches",
        "Count",
        [4882, 5324, 5266, 5418, 6044, 6523, 6751],
      ),
    ],
  },
  {
    symbol: "SBIN",
    note: NOTE,
    metrics: [
      m(
        "Net Interest Margin (NIM)",
        "%",
        [2.76, 3.01, 3.21, 3.12, 3.58, 3.28, 3.19],
      ),
      m("Gross NPA Ratio", "%", [7.53, 6.15, 4.98, 3.97, 2.78, 2.24, 2.19]),
      m("Net NPA Ratio", "%", [3.01, 2.23, 1.5, 1.02, 0.67, 0.57, 0.53]),
      m("CASA Ratio", "%", [44.8, 45.7, 46.2, 45.2, 42.7, 41.1, 40.8]),
      m(
        "Capital Adequacy Ratio (CAR)",
        "%",
        [12.7, 13.1, 13.7, 13.8, 14.7, 13.9, 14.1],
      ),
      m(
        "Loan Book Size",
        "₹ Cr",
        [2338248, 2419081, 2552822, 2701774, 3025260, 3715046, 3920000],
      ),
      m(
        "Number of Branches",
        "Count",
        [22542, 22542, 22219, 22542, 22645, 22826, 22954],
      ),
    ],
  },
  {
    symbol: "KOTAKBANK",
    note: NOTE,
    metrics: [
      m(
        "Net Interest Margin (NIM)",
        "%",
        [4.47, 4.72, 4.57, 4.62, 5.33, 5.22, 4.91],
      ),
      m("Gross NPA Ratio", "%", [2.14, 2.25, 3.25, 2.34, 1.72, 1.39, 1.49]),
      m("Net NPA Ratio", "%", [0.73, 0.71, 1.21, 0.64, 0.37, 0.34, 0.37]),
      m("CASA Ratio", "%", [52.5, 56.2, 56.9, 60.6, 52.4, 46.1, 43.4]),
      m(
        "Capital Adequacy Ratio (CAR)",
        "%",
        [17.4, 17.9, 22.3, 22.6, 21.8, 20.6, 21.1],
      ),
      m(
        "Loan Book Size",
        "₹ Cr",
        [217828, 249291, 244893, 277543, 340794, 408725, 440000],
      ),
      m(
        "Number of Branches",
        "Count",
        [1500, 1600, 1600, 1780, 1990, 2174, 2347],
      ),
    ],
  },
  {
    symbol: "AXISBANK",
    note: NOTE,
    metrics: [
      m(
        "Net Interest Margin (NIM)",
        "%",
        [3.43, 3.51, 3.46, 3.47, 4.26, 4.11, 4.05],
      ),
      m("Gross NPA Ratio", "%", [5.26, 4.86, 3.7, 2.82, 1.84, 1.43, 1.45]),
      m("Net NPA Ratio", "%", [2.04, 1.56, 1.05, 0.73, 0.39, 0.31, 0.34]),
      m("CASA Ratio", "%", [43.5, 41.8, 42.7, 47.0, 45.6, 41.7, 40.3]),
      m(
        "Capital Adequacy Ratio (CAR)",
        "%",
        [15.8, 17.5, 19.1, 18.5, 17.6, 16.6, 17.2],
      ),
      m(
        "Loan Book Size",
        "₹ Cr",
        [544037, 570036, 622432, 748282, 913273, 1051371, 1110000],
      ),
      m(
        "Number of Branches",
        "Count",
        [3883, 4094, 4528, 4595, 4760, 5127, 5375],
      ),
    ],
  },
  {
    symbol: "TCS",
    note: NOTE,
    metrics: [
      m(
        "Revenue per Employee",
        "₹ Lakhs",
        [15.2, 16.1, 17.3, 18.6, 21.4, 23.2, 24.1],
      ),
      m(
        "Headcount (Employees)",
        "Count",
        [424285, 448464, 469261, 528748, 614795, 601546, 591000],
      ),
      m("Attrition Rate", "%", [11.3, 12.1, 7.6, 17.4, 20.1, 12.5, 11.8]),
      m(
        "Utilization Rate (ex trainees)",
        "%",
        [82.5, 83.1, 82.4, 84.6, 82.3, 85.1, 86.2],
      ),
      m(
        "Deal Wins TCV",
        "$ Mn",
        [19100, 22100, 31600, 34600, 34100, 42400, 40800],
      ),
      m("EBITDA Margin", "%", [27.8, 27.6, 28.9, 28.2, 26.5, 26.0, 26.4]),
    ],
  },
  {
    symbol: "INFY",
    note: NOTE,
    metrics: [
      m(
        "Revenue per Employee",
        "₹ Lakhs",
        [13.8, 14.6, 16.1, 18.2, 20.8, 22.5, 23.1],
      ),
      m(
        "Headcount (Employees)",
        "Count",
        [228123, 243454, 259619, 314015, 343234, 317240, 310000],
      ),
      m("Attrition Rate", "%", [19.5, 21.9, 13.9, 27.7, 24.3, 12.7, 11.4]),
      m(
        "Utilization Rate (ex trainees)",
        "%",
        [81.8, 82.4, 81.5, 83.4, 79.3, 82.1, 83.5],
      ),
      m(
        "Deal Wins TCV",
        "$ Mn",
        [9080, 15200, 13840, 23370, 32720, 30082, 27600],
      ),
      m("EBITDA Margin", "%", [24.5, 24.8, 27.5, 25.6, 23.8, 23.2, 22.9]),
    ],
  },
  {
    symbol: "HCLTECH",
    note: NOTE,
    metrics: [
      m(
        "Revenue per Employee",
        "₹ Lakhs",
        [12.1, 13.2, 14.5, 16.1, 18.6, 20.3, 21.4],
      ),
      m(
        "Headcount (Employees)",
        "Count",
        [178249, 188553, 197775, 222458, 225944, 227481, 223100],
      ),
      m("Attrition Rate", "%", [13.2, 14.8, 9.4, 21.9, 23.5, 13.2, 12.1]),
      m(
        "Utilization Rate (ex trainees)",
        "%",
        [82.1, 83.6, 82.8, 84.1, 82.0, 84.3, 85.1],
      ),
      m("EBITDA Margin", "%", [23.8, 23.1, 24.6, 23.2, 22.1, 22.8, 23.1]),
    ],
  },
  {
    symbol: "WIPRO",
    note: NOTE,
    metrics: [
      m(
        "Revenue per Employee",
        "₹ Lakhs",
        [11.4, 12.2, 13.1, 15.3, 17.6, 18.9, 19.4],
      ),
      m(
        "Headcount (Employees)",
        "Count",
        [172000, 180000, 197000, 236000, 258000, 234054, 228000],
      ),
      m("Attrition Rate", "%", [15.4, 16.8, 8.7, 23.3, 21.2, 14.6, 13.4]),
      m(
        "Utilization Rate (ex trainees)",
        "%",
        [79.6, 80.1, 79.4, 82.1, 79.8, 82.4, 83.2],
      ),
      m("EBITDA Margin", "%", [22.1, 21.6, 23.4, 21.9, 20.4, 21.3, 21.7]),
    ],
  },
  {
    symbol: "TECHM",
    note: NOTE,
    metrics: [
      m(
        "Revenue per Employee",
        "₹ Lakhs",
        [10.8, 11.4, 12.2, 13.9, 16.1, 17.4, 17.9],
      ),
      m(
        "Headcount (Employees)",
        "Count",
        [113450, 123189, 124908, 158534, 163800, 146509, 141200],
      ),
      m("Attrition Rate", "%", [14.2, 15.6, 9.5, 22.7, 22.4, 15.3, 13.1]),
      m("EBITDA Margin", "%", [15.8, 15.2, 17.4, 16.1, 13.8, 10.2, 12.1]),
    ],
  },
  {
    symbol: "HINDUNILVR",
    note: NOTE,
    metrics: [
      m("Volume Growth YoY", "%", [5.1, 3.8, -2.0, 4.4, 8.2, 3.1, 1.8]),
      m(
        "Distribution Reach (Outlets)",
        "Mn",
        [7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 10.2],
      ),
      m(
        "Ad Spend % of Revenue",
        "%",
        [11.4, 11.8, 10.2, 11.1, 9.8, 10.1, 10.3],
      ),
      m("Gross Margin", "%", [50.2, 51.4, 52.6, 50.1, 47.3, 50.9, 51.4]),
      m("Number of Power Brands", "Count", [15, 16, 16, 16, 17, 17, 18]),
    ],
  },
  {
    symbol: "ITC",
    note: NOTE,
    metrics: [
      m("Volume Growth YoY", "%", [4.2, 1.4, -11.0, 16.0, 5.1, 3.3, 2.1]),
      m("Gross Margin", "%", [60.1, 61.2, 58.4, 61.3, 63.4, 62.1, 61.8]),
      m(
        "Cigarette Volume",
        "Bn sticks",
        [93.0, 85.0, 68.0, 79.0, 93.0, 97.0, 98.5],
      ),
      m(
        "Hotels Occupancy Rate",
        "%",
        [65.1, 62.4, 28.1, 48.2, 69.3, 73.1, 74.2],
      ),
      m(
        "Agri Business Revenue",
        "₹ Cr",
        [10986, 9827, 11632, 14993, 18498, 17843, 16900],
      ),
      m("Ad Spend % of Revenue", "%", [5.4, 5.1, 4.2, 5.3, 5.8, 5.4, 5.2]),
    ],
  },
  {
    symbol: "NESTLEIND",
    note: NOTE,
    metrics: [
      m("Volume Growth YoY", "%", [7.2, 5.6, -1.8, 8.9, 8.4, 4.2, 2.6]),
      m(
        "Distribution Reach (Outlets)",
        "Mn",
        [4.5, 4.8, 4.8, 5.1, 5.8, 6.5, 6.8],
      ),
      m("Ad Spend % of Revenue", "%", [7.1, 7.4, 6.9, 6.4, 5.8, 5.6, 5.8]),
      m("Gross Margin", "%", [56.2, 57.1, 56.8, 55.4, 53.6, 56.1, 57.3]),
      m("Number of Power Brands", "Count", [6, 6, 7, 7, 8, 8, 9]),
    ],
  },
  {
    symbol: "MARUTI",
    note: NOTE,
    metrics: [
      m(
        "Total Vehicles Sold",
        "Units",
        [1862449, 1563297, 1456848, 1653500, 2024954, 2135073, 2241000],
      ),
      m(
        "Domestic Sales",
        "Units",
        [1747302, 1452736, 1371498, 1553376, 1899292, 1981876, 2081000],
      ),
      m(
        "Export Sales",
        "Units",
        [115147, 110561, 85350, 100124, 125662, 153197, 160000],
      ),
      m(
        "Market Share (Passenger Vehicles)",
        "%",
        [51.0, 50.3, 47.7, 42.8, 43.4, 41.0, 40.8],
      ),
      m("CNG Vehicle Mix", "%", [7.2, 8.4, 10.2, 13.6, 18.1, 24.3, 27.1]),
      m(
        "Capacity Utilization",
        "%",
        [95.0, 80.0, 74.0, 84.0, 103.0, 110.0, 114.0],
      ),
    ],
  },
  {
    symbol: "SUNPHARMA",
    note: NOTE,
    metrics: [
      m("US Revenue", "$ Mn", [1218, 1401, 1432, 1601, 1721, 2048, 2180]),
      m(
        "India Formulations Revenue",
        "₹ Cr",
        [7821, 8632, 9145, 10342, 11945, 13821, 14900],
      ),
      m("Specialty Revenue %", "%", [8.1, 12.4, 18.2, 22.8, 29.1, 34.8, 37.2]),
      m("R&D Spend % of Revenue", "%", [8.4, 9.1, 9.6, 9.2, 8.8, 7.6, 7.4]),
      m("Number of ANDAs Filed", "Count", [412, 434, 456, 489, 521, 556, 572]),
      m(
        "Number of ANDAs Approved",
        "Count",
        [321, 348, 378, 408, 441, 476, 492],
      ),
    ],
  },
  {
    symbol: "RELIANCE",
    note: NOTE,
    metrics: [
      m(
        "Jio Subscribers",
        "Mn",
        [306.7, 388.0, 410.8, 421.2, 439.0, 478.8, 482.0],
      ),
      m(
        "Jio ARPU",
        "₹/month",
        [126.2, 130.6, 138.4, 151.6, 178.8, 181.7, 182.5],
      ),
      m(
        "Retail Stores (Reliance Retail)",
        "Count",
        [9901, 11784, 12711, 15196, 18040, 18836, 19250],
      ),
      m(
        "Refining Throughput",
        "MMT",
        [68.3, 68.1, 60.9, 65.7, 68.4, 68.2, 67.8],
      ),
      m(
        "GRM (Gross Refining Margin)",
        "$/bbl",
        [9.2, 8.9, 8.1, 11.4, 19.2, 9.8, 8.6],
      ),
      m(
        "Jio Revenue",
        "₹ Cr",
        [52000, 65100, 74956, 87124, 99152, 105685, 110200],
      ),
    ],
  },
  {
    symbol: "ONGC",
    note: NOTE,
    metrics: [
      m(
        "Crude Oil Production",
        "MMT",
        [23.3, 22.2, 20.7, 21.1, 21.8, 22.4, 22.6],
      ),
      m(
        "Natural Gas Production",
        "BCM",
        [24.1, 24.0, 22.9, 23.5, 24.0, 25.1, 25.8],
      ),
      m(
        "Crude Oil Realisation",
        "$/bbl",
        [66.2, 57.7, 44.6, 73.4, 87.2, 75.1, 72.4],
      ),
      m("Proven Reserves", "MMboe", [5804, 5748, 5697, 5712, 5743, 5789, 5821]),
      m(
        "Reserve Replacement Ratio",
        "%",
        [0.82, 0.78, 0.74, 0.79, 0.84, 0.89, 0.91],
      ),
    ],
  },
  {
    symbol: "LT",
    note: NOTE,
    metrics: [
      m(
        "Order Book",
        "₹ Cr",
        [295642, 304375, 319568, 344528, 402492, 484500, 545000],
      ),
      m(
        "Order Inflows",
        "₹ Cr",
        [143982, 155018, 142451, 179400, 223064, 268218, 290000],
      ),
      m(
        "Order Book to Revenue Ratio",
        "x",
        [2.9, 2.8, 2.9, 2.8, 2.9, 3.1, 3.2],
      ),
      m(
        "International Revenue %",
        "%",
        [24.1, 25.3, 22.8, 21.6, 24.2, 27.8, 29.1],
      ),
      m(
        "IT & Technology Services Revenue",
        "₹ Cr",
        [12432, 13842, 15426, 16238, 18432, 22431, 24800],
      ),
    ],
  },
  {
    symbol: "BAJFINANCE",
    note: NOTE,
    metrics: [
      m(
        "Assets Under Management (AUM)",
        "₹ Cr",
        [116967, 141133, 152947, 187815, 256187, 330615, 365000],
      ),
      m("AUM Growth YoY", "%", [43.8, 20.7, 8.4, 22.8, 36.4, 29.1, 10.4]),
      m("New Loans Booked", "Mn", [20.8, 21.4, 17.1, 24.6, 31.4, 35.4, 36.8]),
      m("Gross NPA", "%", [1.54, 1.61, 2.96, 1.73, 0.94, 0.85, 0.94]),
      m("Net NPA", "%", [0.63, 0.65, 1.25, 0.68, 0.34, 0.37, 0.41]),
      m("Cost of Funds", "%", [7.9, 8.0, 7.4, 6.8, 7.4, 7.8, 8.1]),
      m("Net Interest Margin", "%", [10.8, 11.1, 10.2, 10.9, 11.4, 10.9, 10.5]),
      m("Customer Count", "Mn", [34.7, 42.5, 47.1, 57.6, 69.4, 87.9, 97.2]),
    ],
  },
  {
    symbol: "BHARTIARTL",
    note: NOTE,
    metrics: [
      m(
        "India Mobile Subscribers",
        "Mn",
        [283.7, 296.4, 305.9, 336.9, 349.0, 374.2, 382.0],
      ),
      m(
        "India ARPU",
        "₹/month",
        [123.0, 133.0, 145.0, 163.0, 193.0, 208.0, 220.5],
      ),
      m("Africa Revenue", "$ Mn", [3184, 3487, 3754, 4242, 4841, 5290, 5610]),
      m(
        "4G/5G Subscribers",
        "Mn",
        [152.4, 175.2, 196.1, 222.4, 260.1, 302.8, 322.0],
      ),
      m(
        "Data Usage per Sub",
        "GB/month",
        [12.1, 14.3, 17.2, 19.8, 22.4, 25.2, 26.8],
      ),
      m("EBITDA Margin", "%", [38.4, 40.1, 44.3, 47.1, 49.8, 52.4, 53.1]),
      m("Capex", "₹ Cr", [27340, 30124, 29854, 32145, 38421, 42318, 44100]),
    ],
  },
  {
    symbol: "ASIANPAINT",
    note: NOTE,
    metrics: [
      m("Volume Growth", "%", [8.2, 5.4, -4.6, 21.8, 8.9, 2.1, 0.8]),
      m(
        "Decorative Revenue",
        "₹ Cr",
        [14872, 16321, 16184, 20547, 25641, 28432, 27800],
      ),
      m("Gross Margin", "%", [42.1, 44.2, 43.8, 40.4, 37.2, 41.8, 42.6]),
      m(
        "International Business Revenue",
        "₹ Cr",
        [2841, 3124, 2984, 3642, 4128, 4542, 4720],
      ),
      m("Stores (Beautiful Homes)", "Count", [42, 65, 74, 98, 174, 285, 360]),
    ],
  },
  {
    symbol: "TITAN",
    note: NOTE,
    metrics: [
      m(
        "Jewellery Revenue",
        "₹ Cr",
        [12462, 14198, 11842, 18146, 24843, 32451, 36200],
      ),
      m("Watches Revenue", "₹ Cr", [2154, 2341, 1642, 2241, 2984, 3218, 3380]),
      m(
        "Jewellery EBIT Margin",
        "%",
        [11.4, 12.2, 8.4, 12.1, 12.8, 12.4, 12.6],
      ),
      m("CaratLane Stores", "Count", [42, 88, 115, 140, 218, 300, 362]),
      m("Tanishq Stores", "Count", [254, 278, 280, 326, 386, 424, 449]),
      m("GHS Subscribers", "Mn", [8.4, 9.1, 8.6, 10.4, 12.8, 15.2, 16.4]),
    ],
  },
  {
    symbol: "POWERGRID",
    note: NOTE,
    metrics: [
      m(
        "Transmission Lines",
        "Circuit Km",
        [140814, 148688, 158985, 164427, 169281, 174969, 177000],
      ),
      m("Substations", "Count", [237, 248, 256, 264, 272, 282, 286]),
      m(
        "Capitalisation",
        "₹ Cr",
        [23245, 24218, 18642, 16485, 17842, 22184, 24100],
      ),
      m(
        "Regulated Equity",
        "₹ Cr",
        [74821, 83421, 90214, 98421, 108421, 116421, 121000],
      ),
      m(
        "System Availability",
        "%",
        [99.83, 99.84, 99.85, 99.86, 99.87, 99.88, 99.89],
      ),
    ],
  },
  {
    symbol: "NTPC",
    note: NOTE,
    metrics: [
      m("Installed Capacity", "GW", [55.5, 58.9, 62.9, 66.1, 70.1, 73.0, 76.4]),
      m(
        "Capacity Utilisation Factor (PLF)",
        "%",
        [73.4, 72.5, 65.3, 67.8, 71.2, 69.4, 70.1],
      ),
      m("Generation", "BU", [291.1, 302.4, 285.8, 305.1, 342.2, 365.2, 380.1]),
      m("Renewable Capacity", "GW", [0.92, 1.32, 2.11, 3.44, 5.01, 7.44, 9.12]),
      m(
        "Coal-based vs RE Mix",
        "%",
        [98.3, 97.8, 96.6, 94.8, 92.8, 89.8, 88.1],
      ),
    ],
  },
  {
    symbol: "ULTRACEMCO",
    note: NOTE,
    metrics: [
      m(
        "Installed Capacity",
        "MTPA",
        [117.35, 117.35, 119.95, 126.15, 136.25, 154.18, 159.25],
      ),
      m(
        "Production Volume",
        "MT",
        [93.82, 88.15, 84.82, 100.14, 113.63, 121.18, 124.8],
      ),
      m(
        "Capacity Utilization",
        "%",
        [79.9, 75.1, 70.7, 79.4, 83.4, 78.6, 78.4],
      ),
      m(
        "Grey Cement Revenue",
        "₹ Cr",
        [34874, 36242, 35841, 42841, 54142, 59241, 60800],
      ),
      m(
        "Realization per Tonne",
        "₹/tonne",
        [3715, 4112, 4225, 4280, 4766, 4889, 4871],
      ),
      m(
        "EBITDA per Tonne",
        "₹/tonne",
        [1041, 1124, 1198, 1214, 1284, 1098, 1142],
      ),
      m(
        "Energy Cost per Tonne",
        "₹/tonne",
        [1124, 1184, 1021, 1148, 1524, 1241, 1198],
      ),
    ],
  },
];

export function getInsightsData(symbol: string): CompanyInsights | undefined {
  return insightsMap.find((c) => c.symbol === symbol);
}
