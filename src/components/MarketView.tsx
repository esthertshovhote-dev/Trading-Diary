import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ExternalLink,
  Globe,
  Coins,
  BarChart3,
  Calendar as CalendarIcon,
  Info,
  AlertCircle,
  Clock,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { 
  fetchMultipleQuotes, 
  MarketQuote, 
  fetchMarketQuote, 
  fetchEconomicCalendar, 
  EconomicEvent,
  INSTRUMENT_METADATA 
} from '../services/marketService';

const DEFAULT_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', // Tech
  'BTCUSD', 'ETHUSD', 'SOLUSD', // Crypto
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', // Forex
  'GOLD', 'OIL' // Commodities
];

type TabType = 'watchlist' | 'info' | 'calendar';

export default function MarketView({ onBack, isDarkMode }: { onBack: () => void, isDarkMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabType>('watchlist');
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    if (activeTab === 'watchlist') {
      const data = await fetchMultipleQuotes(DEFAULT_SYMBOLS);
      setQuotes(data);
    } else if (activeTab === 'calendar') {
      const data = await fetchEconomicCalendar();
      setCalendarEvents(data);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    const quote = await fetchMarketQuote(searchQuery.toUpperCase());
    if (quote) {
      setQuotes(prev => {
        const exists = prev.find(q => q.symbol === quote.symbol);
        if (exists) return prev;
        return [quote, ...prev];
      });
      setActiveTab('watchlist');
    }
    setLoading(false);
  };

  const filteredQuotes = quotes.filter(q => 
    q.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn(
      "flex flex-col h-screen w-full text-foreground overflow-hidden relative transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
    )}>
      {/* Header */}
      <header className={cn(
        "min-h-[72px] py-2 flex items-center justify-between px-4 lg:px-8 border-b sticky top-0 z-10 transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full h-10 w-10 shrink-0", isDarkMode && "text-slate-400 hover:text-white hover:bg-slate-800")}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col overflow-hidden">
            <h1 className={cn("text-lg sm:text-xl font-bold tracking-tight truncate", isDarkMode ? "text-white" : "text-[#0F172A]")}>Market Hub</h1>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest truncate">Real-time Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData} 
            disabled={isRefreshing}
            className={cn(
              "rounded-xl gap-2 h-9 sm:h-10 font-bold text-xs shrink-0 transition-colors",
              isDarkMode ? "border-slate-700 bg-[#334155] text-white hover:bg-[#475569]" : "border-border"
            )}
          >
            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className={cn(
        "px-4 lg:px-8 border-b transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-4 sm:gap-8 max-w-6xl mx-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
          {[
            { id: 'watchlist', label: 'Watchlist', icon: <TrendingUp size={16} /> },
            { id: 'info', label: 'Instruments Info', icon: <Info size={16} /> },
            { id: 'calendar', label: 'Economic Calendar', icon: <CalendarIcon size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 py-4 text-sm font-bold transition-all relative",
                activeTab === tab.id ? "text-[#3B82F6]" : (isDarkMode ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-[#0F172A]")
              )}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {activeTab === 'watchlist' && (
            <div className="space-y-6">
              {/* Market Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: <Globe size={24} />, title: "Stocks", desc: "Global Equity Markets", color: "blue" },
                  { icon: <Coins size={24} />, title: "Crypto", desc: "Digital Asset Prices", color: "orange" },
                  { icon: <BarChart3 size={24} />, title: "Forex", desc: "Currency Exchange Rates", color: "green" }
                ].map((cat, i) => (
                  <div key={i} className={cn(
                    "rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all border duration-300",
                    isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      cat.color === "blue" ? (isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600") :
                      cat.color === "orange" ? (isDarkMode ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600") :
                      (isDarkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600")
                    )}>
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>{cat.title}</h3>
                      <p className="text-xs text-muted-foreground">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quotes Table */}
              <div className={cn(
                "rounded-2xl shadow-sm overflow-hidden transition-all border duration-300",
                isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
              )}>
                <div className={cn("p-6 border-b flex items-center justify-between", isDarkMode ? "border-slate-700" : "border-border")}>
                  <h2 className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Live Watchlist</h2>
                  <Badge variant="outline" className={cn("border-border text-muted-foreground font-bold", isDarkMode && "border-slate-700")}>
                    {filteredQuotes.length} Active Quotes
                  </Badge>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={cn("border-b transition-colors", isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border")}>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Symbol</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Change</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Change %</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y transition-colors", isDarkMode ? "divide-slate-700" : "divide-border")}>
                      {loading && quotes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <RefreshCw size={24} className="text-blue-500 animate-spin" />
                              <p className="text-sm text-muted-foreground font-medium">Fetching market data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredQuotes.map((quote) => {
                          const isPositive = parseFloat(quote.change) >= 0;
                          return (
                            <tr key={quote.symbol} className={cn("transition-colors group", isDarkMode ? "hover:bg-slate-800" : "hover:bg-[#F8FAFC]")}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-colors border",
                                    isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border text-[#0F172A]"
                                  )}>
                                    {quote.symbol.substring(0, 2)}
                                  </div>
                                  <span className={cn("font-bold", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{quote.symbol}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn("font-mono font-bold", isDarkMode ? "text-slate-300" : "text-[#0F172A]")}>
                                  ${parseFloat(quote.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </span>
                              </td>
                              <td className={cn("px-6 py-4 font-bold", isPositive ? (isDarkMode ? "text-green-400" : "text-[#10B981]") : (isDarkMode ? "text-red-400" : "text-[#EF4444]"))}>
                                {isPositive ? '+' : ''}{parseFloat(quote.change).toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={cn(
                                  "border-none font-black text-[10px] h-6 px-2",
                                  isPositive ? 
                                    (isDarkMode ? "bg-green-500/10 text-green-400" : "bg-[#10B981]/10 text-[#10B981]") : 
                                    (isDarkMode ? "bg-red-500/10 text-red-400" : "bg-[#EF4444]/10 text-[#EF4444]")
                                )}>
                                  {isPositive ? '+' : ''}{quote.changePercent}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {isPositive ? (
                                    <TrendingUp size={16} className={cn(isDarkMode ? "text-green-400" : "text-[#10B981]")} />
                                  ) : (
                                    <TrendingDown size={16} className={cn(isDarkMode ? "text-red-400" : "text-[#EF4444]")} />
                                  )}
                                  <span className="text-xs text-muted-foreground font-medium">Live</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(INSTRUMENT_METADATA).map(([symbol, info]) => (
                <div key={symbol} className={cn(
                  "rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border group duration-300",
                  isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-colors border",
                        isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border text-[#0F172A]"
                      )}>
                        {symbol.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>{info.name}</h3>
                        <Badge variant="secondary" className={cn(
                          "font-bold text-[10px]",
                          isDarkMode ? "bg-[#0F172A] text-slate-400" : "bg-[#F8FAFC] text-muted-foreground"
                        )}>
                          {info.category}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className={cn("rounded-full opacity-0 group-hover:opacity-100 transition-opacity", isDarkMode && "hover:bg-slate-800")}>
                      <PlusCircle size={20} className="text-[#3B82F6]" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {info.description}
                  </p>
                  <div className={cn("mt-6 pt-6 border-t flex items-center justify-between", isDarkMode ? "border-slate-700" : "border-border")}>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Symbol: {symbol}</span>
                    <button className="text-xs font-bold text-[#3B82F6] flex items-center gap-1 hover:underline">
                      Full Analysis <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className={cn(
              "rounded-2xl shadow-sm overflow-hidden transition-all border duration-300",
              isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
            )}>
              <div className={cn("p-6 border-b flex items-center justify-between", isDarkMode ? "border-slate-700" : "border-border")}>
                <div>
                  <h2 className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Economic Calendar</h2>
                  <p className="text-xs text-muted-foreground">Upcoming global economic events and indicators</p>
                </div>
                <Badge className={cn(
                  "font-bold transition-colors",
                  isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  {calendarEvents.length} Events
                </Badge>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={cn("border-b transition-colors", isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border")}>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Event</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Country</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Impact</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y transition-colors", isDarkMode ? "divide-slate-700" : "divide-border")}>
                    {loading && calendarEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw size={24} className="text-blue-500 animate-spin" />
                            <p className="text-sm text-muted-foreground font-medium">Loading calendar events...</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      calendarEvents.map((event, idx) => (
                        <tr key={idx} className={cn("transition-colors", isDarkMode ? "hover:bg-slate-800" : "hover:bg-[#F8FAFC]")}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>{event.date}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock size={10} /> {event.time || 'All Day'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("text-sm font-medium", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{event.event}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-6 h-4 border rounded-sm flex items-center justify-center text-[8px] font-bold transition-colors",
                                isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border"
                              )}>
                                {event.country}
                              </div>
                              <span className={cn("text-xs font-medium", isDarkMode ? "text-slate-400" : "text-muted-foreground")}>{event.country}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={cn(
                              "border-none font-black text-[10px] h-6 px-2",
                              event.impact === 'High' ? (isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600") :
                              event.impact === 'Medium' ? (isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-orange-600") :
                              (isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-50 text-green-600")
                            )}>
                              {event.impact}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rate Limit Info */}
          <div className={cn(
            "rounded-2xl p-6 flex items-start gap-4 border transition-all duration-300",
            isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
            )}>
              <AlertCircle size={20} />
            </div>
            <div className="space-y-1">
              <h4 className={cn("font-bold", isDarkMode ? "text-blue-400" : "text-blue-900")}>Data Source Information</h4>
              <p className={cn("text-sm", isDarkMode ? "text-blue-300/80" : "text-blue-700")}>
                Market data and economic calendar are powered by Alpha Vantage. 
                Free tier accounts are limited to 5 requests per minute. 
                If data fails to load, please wait 60 seconds and refresh.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
