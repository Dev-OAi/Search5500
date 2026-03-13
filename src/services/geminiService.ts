import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzePlan(planName: string, sponsorName: string, year: string, participants: number, assets: number, assetsBoy: number) {
  const prompt = `Analyze the following Form 5500 data and provide a brief, professional summary.
  Focus strictly on data points. DO NOT include legal disclaimers or repetitive boilerplate text.
  Keep each field concise (max 2-3 sentences).
  
  Plan Name: ${planName}
  Sponsor Name: ${sponsorName}
  Plan Year: ${year}
  Participants at End of Year: ${participants}
  Net Assets at End of Year: $${assets.toLocaleString()}
  Net Assets at Beginning of Year: $${assetsBoy.toLocaleString()}
  
  Provide a structured JSON analysis covering identity, status, financial performance, compliance, and a conclusion.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a concise financial analyst. Provide professional, data-driven summaries. DO NOT include long, repetitive legal disclaimers or boilerplate text. Keep each JSON field under 150 words.",
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identity: { type: Type.STRING },
            status: { type: Type.STRING },
            financialPerformance: {
              type: Type.OBJECT,
              properties: {
                assetsChange: { type: Type.STRING },
                income: { type: Type.STRING },
                employerContributions: { type: Type.STRING },
                expenses: { type: Type.STRING },
                netIncome: { type: Type.STRING }
              }
            },
            compliance: { type: Type.STRING },
            conclusion: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text || "{}";
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI JSON response in analyzePlan:", parseError, "Response text:", text);
      return null;
    }
  } catch (error) {
    console.error("Error analyzing plan:", error);
    return null;
  }
}

export async function deepAnalyzePlan(ocrText: string) {
  // Truncate OCR text to avoid hitting token limits or causing response truncation
  const truncatedOcr = ocrText.slice(0, 30000);

  const prompt = `Extract and summarize the following key information from the Form 5500 OCR text provided below.
  Focus strictly on data points. DO NOT include legal disclaimers or repetitive boilerplate text.
  BE CONCISE. Use bullet points or short sentences. Max 500 words total.
  
  - Plan Sponsor
  - Plan Type
  - Participant Count (Start and End of Year)
  - Total Net Assets (Beginning and End of Year)
  - Total Income (including Participant Contributions and Investment Income)
  - Employer Contributions
  - Expenses and Distributions (including Benefits Paid and Administrative Fees)
  - Net Gain/Loss
  - Compliance and Protection (Fidelity Bond, Participant Loans, Operational Integrity)
  - A concise Conclusion.
  
  Provide the result as a structured JSON object.

  OCR Text:
  ${truncatedOcr}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a concise financial analyst. Provide professional, data-driven summaries. DO NOT include long, repetitive legal disclaimers or boilerplate text. Keep each JSON field under 150 words.",
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planSponsor: { type: Type.STRING },
            planType: { type: Type.STRING },
            participantCount: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER }
              }
            },
            totalNetAssets: {
              type: Type.OBJECT,
              properties: {
                boy: { type: Type.STRING },
                eoy: { type: Type.STRING }
              }
            },
            income: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.STRING },
                participantContributions: { type: Type.STRING },
                investmentIncome: { type: Type.STRING }
              }
            },
            employerContributions: { type: Type.STRING },
            expenses: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.STRING },
                benefitsPaid: { type: Type.STRING },
                adminFees: { type: Type.STRING }
              }
            },
            netGainLoss: { type: Type.STRING },
            compliance: {
              type: Type.OBJECT,
              properties: {
                fidelityBond: { type: Type.STRING },
                participantLoans: { type: Type.STRING },
                operationalIntegrity: { type: Type.STRING }
              }
            },
            conclusion: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text || "{}";
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI JSON response in deepAnalyzePlan:", parseError, "Response text:", text);
      return null;
    }
  } catch (error) {
    console.error("Error deep analyzing plan:", error);
    return null;
  }
}
