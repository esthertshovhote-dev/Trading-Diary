import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeTradingPerformance(trades: Trade[]) {
  const closedTrades = trades.filter(t => t.status === 'Closed');
  
  if (closedTrades.length === 0) {
    return "No closed trades to analyze yet. Start logging your trades to get AI insights!";
  }

  const tradeData = closedTrades.map(t => ({
    asset: t.asset,
    side: t.side,
    pnl: t.pnl,
    pnlPercent: t.pnlPercent,
    strategy: t.strategy,
    session: t.session,
    notes: t.notes,
    timestamp: t.timestamp,
    setupScore: t.setupScore
  }));

  const prompt = `
    Analyze the following trading data and provide actionable feedback for the trader.
    Focus on:
    1. Performance patterns (best/worst assets, strategies, sessions).
    2. Behavioral insights (correlate notes/emotions if available with outcomes).
    3. Discipline and consistency.
    4. Clear recommendations for improvement.

    Trading Data:
    ${JSON.stringify(tradeData, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert trading coach and psychologist. Your goal is to help traders achieve consistency and discipline. Be direct, analytical, and supportive.",
      },
    });

    return response.text || "I couldn't generate an analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI analysis. Please check your connection and try again.";
  }
}

export async function getTradingPsychologyAdvice(question: string, trades: Trade[]) {
  const prompt = `
    The trader is asking: "${question}"
    
    Context (Recent Trades):
    ${JSON.stringify(trades.slice(-5), null, 2)}

    Provide psychological advice and coaching based on this question and their recent performance.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class trading psychologist. You help traders overcome emotional biases like FOMO, revenge trading, and hesitation.",
      },
    });

    return response.text || "I'm here to help, but I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error getting advice. Please try again.";
  }
}
