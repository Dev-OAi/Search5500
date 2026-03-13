import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Attempts to repair a potentially truncated JSON string by adding missing closing braces/brackets.
 */
function repairJson(jsonStr: string): string {
  jsonStr = jsonStr.trim();
  if (!jsonStr) return "{}";
  
  // If it already looks complete, return it
  if (jsonStr.endsWith("}") || jsonStr.endsWith("]")) {
    try {
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (e) {
      // Fall through to repair logic
    }
  }

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") openBraces++;
      if (char === "}") openBraces--;
      if (char === "[") openBrackets++;
      if (char === "]") openBrackets--;
    }
  }

  let repaired = jsonStr;
  
  // Handle trailing escape character - if the string was truncated at a backslash
  if (escaped) {
    repaired = repaired.slice(0, -1);
  }

  if (inString) repaired += '"';
  
  // Close open structures in reverse order
  // This is a simple heuristic and might not always work for complex truncation
  while (openBraces > 0 || openBrackets > 0) {
    if (openBraces > 0) {
      repaired += "}";
      openBraces--;
    } else if (openBrackets > 0) {
      repaired += "]";
      openBrackets--;
    }
  }

  return repaired;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED";
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

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
  Also include a "narrativeReport" field which is a detailed, professional narrative summary of the plan's status and performance. 
  
  CRITICAL FORMATTING RULES for "narrativeReport":
  - DO NOT use markdown headers (e.g., no ### or ##).
  - Use BOLD text for section titles (e.g., **Plan Identity and Status**).
  - Use clear paragraph breaks between sections.
  - Ensure text is written clearly and formatted correctly for readability.
  - Include the following sections using bold titles:
    - **Plan Identity and Status**
    - **Financial Performance** (Asset Growth, Income, Contributions, Expenses)
    - **Participant Information**
    - **Compliance and Risk Management**
    - **Overall Summary**
`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a concise financial analyst. Provide professional, data-driven summaries. DO NOT include long, repetitive legal disclaimers or boilerplate text. Keep each JSON field under 150 words. DO NOT output excessive whitespace or repeated characters.",
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
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
            conclusion: { type: Type.STRING },
            narrativeReport: { type: Type.STRING }
          }
        }
      }
    }));

    let text = response.text || "{}";
    // Clean up excessive repeated newlines (literal \n) that can cause truncation issues
    text = text.replace(/(\\n){10,}/g, "\\n\\n");

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting repair. Response text:", text);
      const repairedText = repairJson(text);
      try {
        return JSON.parse(repairedText);
      } catch (secondParseError) {
        console.error("Failed to parse repaired AI JSON response:", secondParseError, "Repaired text:", repairedText);
        return null;
      }
    }
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.error("Gemini API Quota Exceeded. Please try again in a few minutes.");
    } else {
      console.error("Error analyzing plan:", error);
    }
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
  - A detailed "narrativeReport" which is a professional narrative summary of the plan's status and performance.
  
  CRITICAL FORMATTING RULES for "narrativeReport":
  - DO NOT use markdown headers (e.g., no ### or ##).
  - Use BOLD text for section titles (e.g., **Plan Identity and Status**).
  - Use clear paragraph breaks between sections.
  - Ensure text is written clearly and formatted correctly for readability.
  - Include the following sections using bold titles:
    - **Plan Identity and Status**
    - **Financial Performance** (Asset Growth, Income, Contributions, Expenses)
    - **Participant Information**
    - **Compliance and Risk Management**
    - **Overall Summary**
  
  Provide the result as a structured JSON object.

  OCR Text:
  ${truncatedOcr}
`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a concise financial analyst. Provide professional, data-driven summaries. DO NOT include long, repetitive legal disclaimers or boilerplate text. Keep each JSON field under 150 words. DO NOT output excessive whitespace or repeated characters.",
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
            conclusion: { type: Type.STRING },
            narrativeReport: { type: Type.STRING }
          }
        }
      }
    }));

    let text = response.text || "{}";
    // Clean up excessive repeated newlines (literal \n) that can cause truncation issues
    text = text.replace(/(\\n){10,}/g, "\\n\\n");

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting repair. Response text:", text);
      const repairedText = repairJson(text);
      try {
        return JSON.parse(repairedText);
      } catch (secondParseError) {
        console.error("Failed to parse repaired AI JSON response:", secondParseError, "Repaired text:", repairedText);
        return null;
      }
    }
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.error("Gemini API Quota Exceeded. Please try again in a few minutes.");
    } else {
      console.error("Error deep analyzing plan:", error);
    }
    return null;
  }
}
