import React from 'react';

export interface Trade {
  id: string;
  uid: string;
  asset: string;
  side: 'Buy' | 'Sell';
  size: string;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  sl: number;
  tp: number;
  status: 'Active' | 'Closed';
  strategy?: string;
  setupScore?: number;
  notes?: string;
  timestamp: string;
  thumbnails?: string[]; // URLs or base64
  annotations?: Record<number, string>; // index -> fabric JSON string
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
