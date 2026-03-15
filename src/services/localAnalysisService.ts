import { PlanData, PlanAnalysis } from "../types";

export function performLocalAnalysis(plan: PlanData): PlanAnalysis {
  const assetGrowth = plan.assetsBoy > 0
    ? ((plan.assets - plan.assetsBoy) / plan.assetsBoy * 100).toFixed(1)
    : "N/A";

  const growthStatus = parseFloat(assetGrowth) > 0 ? "positive" : "negative";

  return {
    identity: `${plan.planName} is a ${plan.planType} sponsored by ${plan.sponsorName}, located in ${plan.city}, ${plan.state}.`,
    status: `As of the ${plan.planYear} filing, the plan serves ${plan.participantsEoy.toLocaleString()} participants.`,
    financialPerformance: {
      assetsChange: `Net assets changed from $${(plan.assetsBoy / 1000000).toFixed(2)}M to $${(plan.assets / 1000000).toFixed(2)}M, a ${assetGrowth}% change.`,
      income: "Detailed income breakdown requires full Schedule H/I data from PDF.",
      employerContributions: "Employer contribution data is typically found in the full filing PDF.",
      expenses: "Administrative expenses and benefit payments are detailed in the full filing PDF.",
      netIncome: `The plan experienced a ${growthStatus} net asset movement of $${((plan.assets - plan.assetsBoy) / 1000000).toFixed(2)}M during the year.`
    },
    compliance: "Standard compliance markers (Fidelity Bond, late contributions) are available in the full filing PDF. This summary is based on core Form 5500 data.",
    conclusion: `The plan shows a ${growthStatus} financial trend for ${plan.planYear} with ${assetGrowth}% asset growth.`,
    narrativeReport: `**Plan Identity and Status**
${plan.planName} is a ${plan.planType} managed by ${plan.sponsorName}. The plan is currently active and filed for the ${plan.planYear} period.

**Financial Performance**
The plan started the year with $${(plan.assetsBoy / 1000000).toFixed(2)}M in net assets and ended with $${(plan.assets / 1000000).toFixed(2)}M. This represents a ${assetGrowth}% change in total asset value.

**Participant Information**
There are ${plan.participantsEoy.toLocaleString()} participants reported at the end of the plan year.

**Compliance and Risk Management**
Based on the basic filing data, the plan is maintaining its reporting requirements. A deeper dive into the PDF filing is recommended to review specific compliance schedules and audit reports.

**Overall Summary**
Overall, ${plan.planName} demonstrates a ${growthStatus} financial trajectory for the ${plan.planYear} reporting period. Further analysis of the full Schedule H or Schedule I is required for a complete picture of investment performance and expense ratios.`
  };
}
