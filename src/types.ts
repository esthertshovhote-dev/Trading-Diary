import React from 'react';

export interface TradeRule {
  id: string;
  text: string;
  checked: boolean;
}

export interface Trade {
  id: string;
  uid: string;
  asset: string;
  side: 'Long' | 'Short';
  size: string;
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  sl?: number;
  tp?: number;
  status: 'Active' | 'Closed';
  strategy?: string;
  setupScore?: number;
  notes?: string;
  timestamp: string;
  thumbnails?: string[]; // URLs
  annotations?: Record<number, string>; // index -> fabric JSON string
  account?: string;
  tags?: string[];
  rules?: TradeRule[];
  exitPrice?: number;
  exitSize?: string;
  commission?: number;
  exitTimestamp?: string;
  isCompleted?: boolean;
  postReflection?: string;
  pulses?: { id: string; content: string; timestamp: string }[];
  session?: 'Asian' | 'London' | 'New York';
  htfBias?: 'Bullish' | 'Bearish' | 'Neutral';
  confluence?: string[];
  marketCondition?: 'Trending' | 'Ranging' | 'Volatile';
  emotions?: { before: string; during: string; after: string };
  executionRating?: number; // 1-5
  rMultiple?: number;
  pips?: number;
  duration?: string;
}

export interface MarketAsset {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: { time: string; value: number }[];
}

export interface RiskMetrics {
  accountBalance: number;
  marginUtilization: number;
  drawdown: number;
  portfolioExposure: number;
}

export interface PerformanceData {
  winRate: number;
  profitFactor: number;
  avgRR: string;
  equityCurve: { date: string; value: number }[];
  strategyPerformance: { name: string; profit: number }[];
}
