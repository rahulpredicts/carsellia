// Using Google Gemini AI for vehicle analysis
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

// Initialize Gemini with standard API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const vehicleAnalysisRequestSchema = z.object({
  vin: z.string().min(1, "VIN is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().default(""),
  odometer: z.number().int().min(0),
  condition: z.string().default("Average"),
  conditionGrade: z.number().min(1).max(5).default(3),
  province: z.string().min(2).max(2).default("ON"),
  postalCode: z.string().default(""),
  reconCost: z.number().min(0).default(0),
  targetProfit: z.number().min(0).default(0),
  buyingFor: z.number().min(0),
  accidents: z.string().default("No Accidents"),
  accidentCount: z.number().default(0),
  titleStatus: z.string().default("Clean Title"),
  ownerCount: z.number().default(1),
  previousRental: z.boolean().default(false),
  previousTaxi: z.boolean().default(false),
  missingServiceRecords: z.boolean().default(false),
  outOfProvince: z.boolean().default(false),
  retailValue: z.number().default(0),
  wholesaleValue: z.number().default(0),
  comparables: z.array(z.object({
    price: z.number(),
    adjustedPrice: z.number(),
    kilometers: z.number(),
    daysOnMarket: z.number(),
    dealership: z.string(),
    city: z.string(),
    province: z.string(),
  })).default([]),
  averageMarketPrice: z.number().min(0).default(0),
  medianMarketPrice: z.number().min(0).default(0),
});

export interface VehicleAnalysisRequest {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  odometer: number;
  condition: string;
  conditionGrade: number;
  province: string;
  postalCode: string;
  reconCost: number;
  targetProfit: number;
  buyingFor: number;
  accidents: string;
  accidentCount: number;
  titleStatus: string;
  ownerCount: number;
  previousRental: boolean;
  previousTaxi: boolean;
  missingServiceRecords: boolean;
  outOfProvince: boolean;
  retailValue: number;
  wholesaleValue: number;
  comparables: {
    price: number;
    adjustedPrice: number;
    kilometers: number;
    daysOnMarket: number;
    dealership: string;
    city: string;
    province: string;
  }[];
  averageMarketPrice: number;
  medianMarketPrice: number;
}

export interface AIRecommendation {
  recommendation: "BUY" | "PASS" | "NEGOTIATE";
  confidence_score: number;
  days_to_sell: number;
  volatility: "LOW" | "MEDIUM" | "HIGH";
  max_bid: number;
  competitor_data: string;
  reasoning: string;
  searchGroundingUsed: boolean;
}

function buildAnalysisPrompt(request: VehicleAnalysisRequest): string {
  const totalCost = request.buyingFor + request.reconCost;
  const targetSellPrice = totalCost + request.targetProfit;
  
  const NEIGHBORING_PROVINCES: Record<string, string[]> = {
    'ON': ['QC', 'MB'],
    'QC': ['ON', 'NB'],
    'BC': ['AB'],
    'AB': ['BC', 'SK'],
    'SK': ['AB', 'MB'],
    'MB': ['SK', 'ON'],
    'NB': ['QC', 'NS', 'PE'],
    'NS': ['NB', 'PE'],
    'PE': ['NB', 'NS'],
    'NL': [],
    'YT': ['BC', 'NT'],
    'NT': ['YT', 'NU', 'AB', 'SK', 'BC'],
    'NU': ['NT', 'MB']
  };
  
  const neighboringProvinces = NEIGHBORING_PROVINCES[request.province] || [];
  const localComparables = request.comparables.filter(c => c.province === request.province);
  const nearbyComparables = request.comparables.filter(c => neighboringProvinces.includes(c.province));
  
  const localComparablesText = localComparables.length > 0 
    ? localComparables.slice(0, 5).map((c, i) => 
        `${i + 1}. $${c.price.toLocaleString()} | ${c.kilometers.toLocaleString()} km | ${c.daysOnMarket} days listed | ${c.dealership} (${c.city}, ${c.province}) [LOCAL]`
      ).join('\n')
    : 'No local market vehicles found';
    
  const nearbyComparablesText = nearbyComparables.length > 0 
    ? nearbyComparables.slice(0, 3).map((c, i) => 
        `${i + 1}. $${c.price.toLocaleString()} | ${c.kilometers.toLocaleString()} km | ${c.daysOnMarket} days listed | ${c.dealership} (${c.city}, ${c.province})`
      ).join('\n')
    : 'No nearby province vehicles found';
    
  const comparablesText = request.comparables.length > 0 
    ? request.comparables.slice(0, 5).map((c, i) => 
        `${i + 1}. $${c.price.toLocaleString()} | ${c.kilometers.toLocaleString()} km | ${c.daysOnMarket} days on market | ${c.dealership} (${c.province})`
      ).join('\n')
    : 'No internal comparables available';

  const marginPercent = request.averageMarketPrice > 0 
    ? ((request.averageMarketPrice - targetSellPrice) / request.averageMarketPrice * 100).toFixed(1)
    : "N/A";

  const historyFlags: string[] = [];
  if (request.accidentCount > 0) historyFlags.push(`${request.accidentCount} accident(s) reported`);
  if (request.titleStatus !== "Clean Title") historyFlags.push(`Title: ${request.titleStatus}`);
  if (request.ownerCount > 2) historyFlags.push(`${request.ownerCount} previous owners`);
  if (request.previousRental) historyFlags.push("Former rental vehicle");
  if (request.previousTaxi) historyFlags.push("Former taxi/commercial use");
  if (request.missingServiceRecords) historyFlags.push("Missing service records");
  if (request.outOfProvince) historyFlags.push("Out-of-province vehicle");
  
  const historyText = historyFlags.length > 0 ? historyFlags.join(", ") : "Clean history, no issues";

  const conditionLabels: Record<number, string> = {
    5: "Excellent (Like new)",
    4: "Good (Minor wear)",
    3: "Fair (Normal wear)",
    2: "Poor (Visible damage)",
    1: "Very Poor (Major issues)"
  };

  return `You are an expert Canadian automotive market analyst specializing in used car valuations and dealer profitability.

VEHICLE BEING APPRAISED:
- VIN: ${request.vin}
- Year: ${request.year}
- Make: ${request.make}
- Model: ${request.model}
- Trim: ${request.trim || 'Base'}
- Odometer: ${request.odometer.toLocaleString()} km
- Location: ${request.postalCode || ''} ${request.province}, Canada

CONDITION ASSESSMENT:
- Grade: ${request.conditionGrade}/5 - ${conditionLabels[request.conditionGrade] || request.condition}
- Vehicle History: ${historyText}
- Accidents: ${request.accidents}
- Title Status: ${request.titleStatus}
- Owner Count: ${request.ownerCount}

CALCULATED VALUES:
- Estimated Retail Value: $${request.retailValue.toLocaleString()} CAD
- Estimated Wholesale Value: $${request.wholesaleValue.toLocaleString()} CAD

DEALER'S PROPOSED DEAL:
- Buying Price: $${request.buyingFor.toLocaleString()} CAD
- Reconditioning Cost: $${request.reconCost.toLocaleString()} CAD
- Total Investment: $${totalCost.toLocaleString()} CAD
- Target Profit: $${request.targetProfit.toLocaleString()} CAD
- Target Sell Price: $${targetSellPrice.toLocaleString()} CAD
- Margin vs Market Average: ${marginPercent}%

INTERNAL INVENTORY DATABASE - LOCAL MARKET (${request.province} Province):
${localComparablesText}
Total local comparables: ${localComparables.length}

INTERNAL INVENTORY DATABASE - NEARBY PROVINCES:
${nearbyComparablesText}
Total nearby comparables: ${nearbyComparables.length}

OVERALL MARKET STATISTICS (From Internal Database):
- Average Market Price: $${request.averageMarketPrice.toLocaleString()} CAD
- Median Market Price: $${request.medianMarketPrice.toLocaleString()} CAD
- Total Comparables Analyzed: ${request.comparables.length}
- Local Market Saturation: ${localComparables.length > 5 ? "HIGH" : localComparables.length > 2 ? "MODERATE" : "LOW"}

ANALYSIS REQUIRED:
Based on ALL the data above including the vehicle's condition, history, location (${request.province}), postal code area (${request.postalCode || 'N/A'}), odometer (${request.odometer.toLocaleString()} km), and INTERNAL DATABASE market comparables, provide a comprehensive buying recommendation.

IMPORTANT: Base your analysis primarily on LOCAL MARKET data from our internal inventory database above. These are real competitor vehicles currently listed in the same province/region.

Consider:
1. LOCAL MARKET COMPETITION: How does this vehicle compare to similar vehicles in ${request.province}?
2. Impact of vehicle history (accidents, title, previous use) on resale value in this local market
3. How condition grade affects buyer demand and pricing in this postal code area
4. Regional market demand for this ${request.make} ${request.model} in ${request.province}
5. Time to sell based on mileage, condition, and local market saturation
6. Maximum safe buying price considering all risk factors and local competition

You must respond with a valid JSON object with these exact fields:
- recommendation: must be exactly "BUY", "PASS", or "NEGOTIATE"
- confidence_score: integer from 0 to 100
- days_to_sell: estimated days to sell as integer
- volatility: must be exactly "LOW", "MEDIUM", or "HIGH"
- max_bid: maximum safe buying price as integer
- competitor_data: analysis of market demand and comparable vehicles as string
- reasoning: 2-3 sentence explanation including key factors affecting the decision

DECISION CRITERIA:
- BUY: Good margin potential (>15% below market), clean history, reasonable sell time (<45 days), stable demand
- NEGOTIATE: Marginal deal, minor history issues, suggest lower bid to account for risks
- PASS: Poor margin, significant history issues, high days on market, or damaged title`;
}

export async function analyzeVehicleDeal(request: VehicleAnalysisRequest): Promise<AIRecommendation> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured. Please add it to environment variables.");
  }

  try {
    const prompt = buildAnalysisPrompt(request);

    console.log("[AI Service] Sending request to Gemini via Replit AI Integrations...");
    console.log("[AI Service] Vehicle:", request.year, request.make, request.model);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { 
              type: Type.STRING,
            },
            confidence_score: { type: Type.INTEGER },
            days_to_sell: { type: Type.INTEGER },
            volatility: { 
              type: Type.STRING,
            },
            max_bid: { type: Type.INTEGER },
            competitor_data: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["recommendation", "confidence_score", "days_to_sell", "volatility", "max_bid", "competitor_data", "reasoning"]
        }
      }
    });

    let text = response.text;
    
    if (!text) {
      const candidate = response.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      text = (part as any)?.text || "";
    }

    console.log("[AI Service] Gemini response received, length:", text?.length || 0);

    if (!text) {
      console.error("[AI Service] No text in Gemini response");
      return getDefaultRecommendation(request);
    }

    let parsedResponse: any;
    try {
      let jsonText = text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```json?\s*/i, "").replace(/\s*```$/, "");
      }
      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("[AI Service] Failed to parse Gemini response:", text.substring(0, 500));
      return getDefaultRecommendation(request);
    }

    const recommendation = (parsedResponse.recommendation || "NEGOTIATE").toUpperCase();
    const validRecommendation = ["BUY", "PASS", "NEGOTIATE"].includes(recommendation) 
      ? recommendation as "BUY" | "PASS" | "NEGOTIATE"
      : "NEGOTIATE";

    const volatility = (parsedResponse.volatility || "MEDIUM").toUpperCase();
    const validVolatility = ["LOW", "MEDIUM", "HIGH"].includes(volatility)
      ? volatility as "LOW" | "MEDIUM" | "HIGH"
      : "MEDIUM";

    console.log("[AI Service] Recommendation:", validRecommendation, "Confidence:", parsedResponse.confidence_score);

    return {
      recommendation: validRecommendation,
      confidence_score: Math.min(100, Math.max(0, Number(parsedResponse.confidence_score) || 50)),
      days_to_sell: Number(parsedResponse.days_to_sell) || 45,
      volatility: validVolatility,
      max_bid: Number(parsedResponse.max_bid) || Math.round(request.averageMarketPrice * 0.78 - request.reconCost),
      competitor_data: parsedResponse.competitor_data || "Analysis based on internal database comparables",
      reasoning: parsedResponse.reasoning || "Analysis based on available market data",
      searchGroundingUsed: false,
    };
  } catch (error: any) {
    console.error("[AI Service] Gemini API error:", error?.message || error);
    console.error("[AI Service] Error details:", JSON.stringify({
      name: error?.name,
      code: error?.code,
      status: error?.status,
      response: error?.response?.data || error?.response,
    }, null, 2));
    
    if (error.message?.includes("API key") || error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      throw new Error("Replit AI Integrations authentication failed. Please check your Replit subscription.");
    }
    
    if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("rate")) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    
    throw new Error(`AI analysis failed: ${error?.message || 'Unknown error'}`);
  }
}

function getDefaultRecommendation(request: VehicleAnalysisRequest): AIRecommendation {
  const totalCost = request.buyingFor + request.reconCost;
  const targetSellPrice = totalCost + request.targetProfit;
  const margin = request.averageMarketPrice > 0 
    ? (request.averageMarketPrice - targetSellPrice) / request.averageMarketPrice
    : 0;

  let recommendation: "BUY" | "PASS" | "NEGOTIATE" = "NEGOTIATE";
  let confidence = 40;

  if (margin > 0.15) {
    recommendation = "BUY";
    confidence = 55;
  } else if (margin < 0.05) {
    recommendation = "PASS";
    confidence = 50;
  }

  const maxBid = Math.round(request.averageMarketPrice * 0.78 - request.reconCost);

  return {
    recommendation,
    confidence_score: confidence,
    days_to_sell: 45,
    volatility: "MEDIUM",
    max_bid: maxBid > 0 ? maxBid : Math.round(request.buyingFor * 0.9),
    competitor_data: `Based on ${request.comparables.length} internal comparables. Average market price: $${request.averageMarketPrice.toLocaleString()} CAD.`,
    reasoning: `Based on internal comparables: ${margin > 0 ? `${(margin * 100).toFixed(1)}% potential margin` : "Insufficient margin"}. Using inventory data for analysis.`,
    searchGroundingUsed: false,
  };
}

export function isAIServiceAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
