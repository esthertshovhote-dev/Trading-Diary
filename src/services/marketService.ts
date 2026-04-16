const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export interface MarketQuote {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
}

export async function fetchMarketQuote(symbol: string): Promise<MarketQuote | null> {
  if (!API_KEY) {
    console.warn('Alpha Vantage API key is missing');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
    const data = await response.json();
    
    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      return null;
    }

    return {
      symbol: quote['01. symbol'],
      price: quote['05. price'],
      change: quote['09. change'],
      changePercent: quote['10. change percent'],
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

export interface EconomicEvent {
  date: string;
  time: string;
  event: string;
  country: string;
  impact: 'High' | 'Medium' | 'Low';
}

export async function fetchEconomicCalendar(): Promise<EconomicEvent[]> {
  if (!API_KEY) return [];

  try {
    // Alpha Vantage ECONOMIC_CALENDAR returns CSV by default
    const response = await fetch(`${BASE_URL}?function=ECONOMIC_CALENDAR&apikey=${API_KEY}`);
    const csvText = await response.text();
    
    // Simple CSV parser for this specific format
    const lines = csvText.split('\n');
    const events: EconomicEvent[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [date, time, event, country, impact] = line.split(',');
      events.push({
        date,
        time,
        event: event?.replace(/"/g, ''),
        country,
        impact: (impact as any) || 'Medium'
      });
    }
    
    return events.slice(0, 50); // Return top 50 events
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    return [];
  }
}

export const INSTRUMENT_METADATA: Record<string, { name: string, description: string, category: string }> = {
  'AAPL': { name: 'Apple Inc.', description: 'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.', category: 'Tech' },
  'MSFT': { name: 'Microsoft Corp.', description: 'Develops, licenses, and supports software, services, devices, and solutions worldwide.', category: 'Tech' },
  'TSLA': { name: 'Tesla, Inc.', description: 'Designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.', category: 'Tech' },
  'NVDA': { name: 'NVIDIA Corp.', description: 'Provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.', category: 'Tech' },
  'BTCUSD': { name: 'Bitcoin', description: 'A decentralized digital currency, without a central bank or single administrator.', category: 'Crypto' },
  'ETHUSD': { name: 'Ethereum', description: 'A decentralized, open-source blockchain with smart contract functionality.', category: 'Crypto' },
  'EURUSD': { name: 'EUR/USD', description: 'The currency pair for the Euro against the US Dollar. The most traded pair in the world.', category: 'Forex' },
  'GBPUSD': { name: 'GBP/USD', description: 'The currency pair for the British Pound Sterling against the US Dollar.', category: 'Forex' },
  'GOLD': { name: 'Gold', description: 'A precious metal used as a store of value and hedge against inflation.', category: 'Commodities' },
  'OIL': { name: 'Crude Oil', description: 'A naturally occurring, unrefined petroleum product composed of hydrocarbon deposits.', category: 'Commodities' }
};

export async function fetchMultipleQuotes(symbols: string[]): Promise<MarketQuote[]> {
  const quotes = await Promise.all(symbols.map(symbol => fetchMarketQuote(symbol)));
  return quotes.filter((q): q is MarketQuote => q !== null);
}
