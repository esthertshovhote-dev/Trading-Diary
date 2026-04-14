import { Trade, MarketAsset, RiskMetrics, PerformanceData } from './types';

export const MOCK_TRADES: Trade[] = [];

export const MOCK_MARKET_ASSETS: MarketAsset[] = [];

export const MOCK_RISK: RiskMetrics = {
  accountBalance: 0,
  marginUtilization: 0,
  drawdown: 0,
  portfolioExposure: 0
};

export const MOCK_PERFORMANCE: PerformanceData = {
  winRate: 0,
  profitFactor: 0,
  avgRR: '0:0',
  equityCurve: [],
  strategyPerformance: []
};
