import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import type { Company } from "../data/companiesData";
import { COMPANIES } from "../data/companiesData";
import { getSHPData } from "../data/shareholdingData";

interface Dimension {
  name: string;
  verdict: string;
  score: number;
  maxScore: number;
  reason: string;
  color: string;
}

interface GradeConfig {
  grade: "A" | "B" | "C" | "D";
  label: string;
  color: string;
  bg: string;
  border: string;
}

function getGrade(total: number): GradeConfig {
  if (total >= 85)
    return {
      grade: "A",
      label: "Excellent",
      color: "text-emerald-400",
      bg: "bg-emerald-950/40",
      border: "border-emerald-500/40",
    };
  if (total >= 65)
    return {
      grade: "B",
      label: "Good",
      color: "text-blue-400",
      bg: "bg-blue-950/40",
      border: "border-blue-500/40",
    };
  if (total >= 45)
    return {
      grade: "C",
      label: "Average",
      color: "text-amber-400",
      bg: "bg-amber-950/40",
      border: "border-amber-500/40",
    };
  return {
    grade: "D",
    label: "Weak",
    color: "text-red-400",
    bg: "bg-red-950/40",
    border: "border-red-500/40",
  };
}

function verdictColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.9)
    return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  if (ratio >= 0.7)
    return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  if (ratio >= 0.4)
    return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-red-500/20 text-red-400 border border-red-500/30";
}

export default function HealthScore({ company }: { company: Company }) {
  const dimensions = useMemo<Dimension[]>(() => {
    const dims: Dimension[] = [];

    // 1. Debt/Equity Rating
    const de = company.debtEquity;
    let deVerdict: string;
    let deScore: number;
    let deReason: string;
    if (de < 0.3) {
      deVerdict = "Excellent";
      deScore = 20;
      deReason = `D/E of ${de.toFixed(2)}x is very low — minimal financial leverage.`;
    } else if (de < 0.7) {
      deVerdict = "Good";
      deScore = 15;
      deReason = `D/E of ${de.toFixed(2)}x shows manageable debt with healthy equity buffer.`;
    } else if (de < 1.5) {
      deVerdict = "Moderate";
      deScore = 8;
      deReason = `D/E of ${de.toFixed(2)}x suggests moderate leverage — watch for rate sensitivity.`;
    } else {
      deVerdict = "High Risk";
      deScore = 3;
      deReason = `D/E of ${de.toFixed(2)}x indicates elevated debt burden relative to equity.`;
    }
    dims.push({
      name: "Debt / Equity",
      verdict: deVerdict,
      score: deScore,
      maxScore: 20,
      reason: deReason,
      color: verdictColor(deScore, 20),
    });

    // 2. ROE vs Sector Median
    const sectorPeers = COMPANIES.filter((c) => c.sector === company.sector);
    const sectorROEs = sectorPeers.map((c) => c.roe).sort((a, b) => a - b);
    const mid = Math.floor(sectorROEs.length / 2);
    const sectorMedianROE =
      sectorROEs.length % 2 === 0
        ? (sectorROEs[mid - 1] + sectorROEs[mid]) / 2
        : sectorROEs[mid];
    const roe = company.roe;
    let roeVerdict: string;
    let roeScore: number;
    let roeReason: string;
    if (roe < 10) {
      roeVerdict = "Weak";
      roeScore = 3;
      roeReason = `ROE of ${roe.toFixed(1)}% is below the 10% minimum threshold for quality compounders.`;
    } else if (roe > sectorMedianROE + 5) {
      roeVerdict = "Above Average";
      roeScore = 20;
      roeReason = `ROE of ${roe.toFixed(1)}% is ${(roe - sectorMedianROE).toFixed(1)}pp above sector median (${sectorMedianROE.toFixed(1)}%).`;
    } else if (roe >= sectorMedianROE) {
      roeVerdict = "At Median";
      roeScore = 15;
      roeReason = `ROE of ${roe.toFixed(1)}% is at par with sector median of ${sectorMedianROE.toFixed(1)}%.`;
    } else {
      roeVerdict = "Below Median";
      roeScore = 8;
      roeReason = `ROE of ${roe.toFixed(1)}% lags sector median of ${sectorMedianROE.toFixed(1)}% — room to improve capital efficiency.`;
    }
    dims.push({
      name: "ROE vs Sector",
      verdict: roeVerdict,
      score: roeScore,
      maxScore: 20,
      reason: roeReason,
      color: verdictColor(roeScore, 20),
    });

    // 3. Revenue Growth Trend
    const rg = company.revenueGrowth;
    let rgVerdict: string;
    let rgScore: number;
    let rgReason: string;
    if (rg > 15) {
      rgVerdict = "Strong Growth";
      rgScore = 20;
      rgReason = `Revenue growing at ${rg.toFixed(1)}% YoY — well above inflation and sector norms.`;
    } else if (rg >= 8) {
      rgVerdict = "Steady Growth";
      rgScore = 15;
      rgReason = `Revenue growing at ${rg.toFixed(1)}% YoY — healthy expansion in line with sector trends.`;
    } else if (rg >= 0) {
      rgVerdict = "Slow Growth";
      rgScore = 8;
      rgReason = `Revenue growth of ${rg.toFixed(1)}% is sluggish — monitor for business cycle headwinds.`;
    } else {
      rgVerdict = "Declining";
      rgScore = 3;
      rgReason = `Revenue declining ${Math.abs(rg).toFixed(1)}% YoY — requires investigation into competitive dynamics.`;
    }
    dims.push({
      name: "Revenue Growth",
      verdict: rgVerdict,
      score: rgScore,
      maxScore: 20,
      reason: rgReason,
      color: verdictColor(rgScore, 20),
    });

    // 4. Interest Coverage (proxy)
    const ebitdaEst =
      company.netProfit > 0 ? company.netProfit * 1.3 : company.netProfit;
    const interestEst = company.debtEquity * company.price * 0.08;
    const coverage = interestEst > 0 ? ebitdaEst / interestEst : 99;
    let icVerdict: string;
    let icScore: number;
    let icReason: string;
    if (coverage > 5) {
      icVerdict = "Very Safe";
      icScore = 20;
      icReason = `Estimated interest coverage of ${coverage.toFixed(1)}x provides strong debt servicing comfort.`;
    } else if (coverage >= 3) {
      icVerdict = "Safe";
      icScore = 15;
      icReason = `Estimated interest coverage of ${coverage.toFixed(1)}x is adequate for current debt levels.`;
    } else if (coverage >= 1) {
      icVerdict = "Watch";
      icScore = 8;
      icReason = `Estimated interest coverage of ${coverage.toFixed(1)}x is thin — higher rates could stress cash flows.`;
    } else {
      icVerdict = "Risky";
      icScore = 3;
      icReason =
        "Estimated interest coverage below 1x — earnings may not cover interest obligations.";
    }
    dims.push({
      name: "Interest Coverage",
      verdict: icVerdict,
      score: icScore,
      maxScore: 20,
      reason: icReason,
      color: verdictColor(icScore, 20),
    });

    // 5. Promoter Holding Stability
    const shpData = getSHPData(company.symbol);
    let phVerdict: string;
    let phScore: number;
    let phReason: string;
    if (shpData && shpData.quarterly.length >= 2) {
      const quarters = shpData.quarterly;
      const latest = quarters[quarters.length - 1];
      const oldest = quarters[Math.max(0, quarters.length - 4)];
      const latestPH = latest.promoters;
      const change = latestPH - oldest.promoters;
      if (latestPH > 55 && Math.abs(change) < 1) {
        phVerdict = "Strong Conviction";
        phScore = 20;
        phReason = `Promoters hold ${latestPH.toFixed(1)}% with stable ownership (${change >= 0 ? "+" : ""}${change.toFixed(1)}% over 4 qtrs).`;
      } else if (latestPH > 45) {
        phVerdict = "Moderate";
        phScore = 15;
        phReason = `Promoter holding at ${latestPH.toFixed(1)}% — reasonable but not majority-conviction territory.`;
      } else if (latestPH > 35) {
        phVerdict = "Low";
        phScore = 8;
        phReason = `Promoter holding at ${latestPH.toFixed(1)}% — below majority. Watch for further dilution.`;
      } else if (change < -3) {
        phVerdict = "Weak";
        phScore = 3;
        phReason = `Promoter stake dropped ${Math.abs(change).toFixed(1)}pp in 4 quarters — significant insider selling signal.`;
      } else {
        phVerdict = "Weak";
        phScore = 3;
        phReason = `Promoter holding at ${latestPH.toFixed(1)}% — low skin-in-the-game for long-term conviction.`;
      }
    } else {
      phVerdict = "No Data";
      phScore = 10;
      phReason =
        "Insufficient shareholding history to assess promoter conviction.";
    }
    dims.push({
      name: "Promoter Holding",
      verdict: phVerdict,
      score: phScore,
      maxScore: 20,
      reason: phReason,
      color: verdictColor(phScore, 20),
    });

    return dims;
  }, [company]);

  const totalScore = dimensions.reduce((s, d) => s + d.score, 0);
  const grade = getGrade(totalScore);

  return (
    <div className="space-y-4">
      {/* Grade Card */}
      <div
        className={`rounded-xl border p-6 flex items-center gap-6 ${grade.bg} ${grade.border}`}
      >
        <div className={`text-7xl font-bold font-display ${grade.color}`}>
          {grade.grade}
        </div>
        <div>
          <div className={`text-2xl font-semibold ${grade.color}`}>
            {grade.label} Financial Health
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Overall score: {totalScore} / 100
          </div>
          <div className="mt-2 w-64">
            <Progress value={totalScore} className="h-2" />
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Scoring Breakdown</h3>
        </div>
        <div className="divide-y divide-border">
          {dimensions.map((dim) => (
            <div key={dim.name} className="px-4 py-3 flex items-start gap-4">
              <div className="w-36 shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {dim.name}
                </p>
              </div>
              <div className="flex-1">
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold mb-1 ${dim.color}`}
                >
                  {dim.verdict}
                </span>
                <p className="text-xs text-muted-foreground">{dim.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold font-mono-data">
                  {dim.score}
                </span>
                <span className="text-xs text-muted-foreground">
                  /{dim.maxScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        ⚠ Rule-based analysis from static financial data. Not investment advice.
      </p>
    </div>
  );
}
