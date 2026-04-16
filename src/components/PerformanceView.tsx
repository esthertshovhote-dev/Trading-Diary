import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Wallet, 
  Shield, 
  BarChart3, 
  LineChart, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Globe,
  Zap,
  CheckCircle2,
  XCircle,
  Info,
  LayoutGrid
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trade } from '@/src/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays } from 'date-fns';

interface PerformanceViewProps {
  trades: Trade[];
  onBack: () => void;
}

export function PerformanceView({ trades, onBack }: PerformanceViewProps) {
  const [timePeriod, setTimePeriod] = React.useState('30 Days');
  const [filterBy, setFilterBy] = React.useState('All Trades');

  // Calculations
  const closedTrades = trades.filter(t => t.status === 'Closed');
  const totalPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  const grossProfit = winningTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + (t.pnl || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;
  
  const expectancy = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;
  
  const avgWinner = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoser = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  
  const bestTrade = Math.max(...closedTrades.map(t => t.pnl || 0), 0);
  const worstTrade = Math.min(...closedTrades.map(t => t.pnl || 0), 0);

  // Equity Curve Data
  const equityCurveData = closedTrades
    .sort((a, b) => new Date(a.exitTimestamp || a.timestamp).getTime() - new Date(b.exitTimestamp || b.timestamp).getTime())
    .reduce((acc: any[], trade, index) => {
      const prevValue = index > 0 ? acc[index - 1].value : 0;
      acc.push({
        date: format(new Date(trade.exitTimestamp || trade.timestamp), 'MMM dd'),
        value: prevValue + (trade.pnl || 0)
      });
      return acc;
    }, []);

  // Day Performance Data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayPerformance = days.map(day => {
    const dayTrades = closedTrades.filter(t => format(new Date(t.exitTimestamp || t.timestamp), 'EEE') === day);
    const pnl = dayTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    return { name: day, pnl };
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 custom-scrollbar">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                <LineChart size={24} />
              </div>
              <h1 className="text-2xl font-black text-[#0F172A]">Performance Analytics</h1>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Analyze your trading patterns and improve your strategy</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-white p-1 rounded-xl border border-border shadow-sm">
              {['Today', '7 Days', '30 Days', '3 Months', '1 Year', 'All Time'].map((p) => (
                <button 
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={cn(
                    "px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all",
                    timePeriod === p ? "bg-[#3B82F6] text-white shadow-md" : "text-muted-foreground hover:text-[#0F172A]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-white p-1 rounded-xl border border-border shadow-sm">
              {['All Trades', 'Winners', 'Losers'].map((f) => (
                <button 
                  key={f}
                  onClick={() => setFilterBy(f)}
                  className={cn(
                    "px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2",
                    filterBy === f ? "bg-[#3B82F6] text-white shadow-md" : "text-muted-foreground hover:text-[#0F172A]"
                  )}
                >
                  {f === 'Winners' && <CheckCircle2 size={12} />}
                  {f === 'Losers' && <XCircle size={12} />}
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="TOTAL P&L" 
            value={`$${totalPnl.toFixed(2)}`} 
            subtext={`From ${closedTrades.length} closed trades`}
            icon={<Wallet size={20} />}
            trend={totalPnl >= 0 ? 'up' : 'down'}
            description="Your net profit/loss for the selected period"
          />
          <MetricCard 
            title="WIN RATE" 
            value={`${winRate.toFixed(1)}%`} 
            subtext={`${winningTrades.length} wins • ${losingTrades.length} losses`}
            icon={<Target size={20} />}
            progress={winRate}
            description="Percentage of profitable trades"
          />
          <MetricCard 
            title="PROFIT FACTOR" 
            value={profitFactor === Infinity ? 'Infinity' : profitFactor.toFixed(2)} 
            subtext={profitFactor >= 1.5 ? 'Excellent' : profitFactor >= 1 ? 'Good' : 'Needs Work'}
            icon={<BarChart3 size={20} />}
            description="Gross profit ÷ Gross loss (above 1.5 is good)"
          />
          <MetricCard 
            title="EXPECTANCY" 
            value={`$${expectancy.toFixed(2)}`} 
            subtext="Average per trade"
            icon={<Zap size={20} />}
            description="Expected profit per trade based on your stats"
          />
        </div>

        {/* Quick Stats & Equity Curve Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid size={18} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-[#0F172A]">Quick Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatBox label="AVG WINNER" value={`$${avgWinner.toFixed(2)}`} color="green" />
              <StatBox label="AVG LOSER" value={`-$${avgLoser.toFixed(2)}`} color="red" />
              <StatBox label="BEST TRADE" value={`$${bestTrade.toFixed(2)}`} color="blue" />
              <StatBox label="WORST TRADE" value={`$${worstTrade.toFixed(2)}`} color="red" />
              <StatBox label="WIN STREAK" value="1 trades" />
              <StatBox label="LOSS STREAK" value="0 trades" />
              <StatBox label="RISK:REWARD" value="1:0.00" color="red" />
              <StatBox label="OPEN TRADES" value="0" />
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <LineChart size={18} className="text-muted-foreground" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Equity Curve</h3>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Cumulative P&L progression</p>
              </div>
              <div className="flex items-center bg-[#F8FAFC] p-1 rounded-lg border border-border">
                <button className="px-3 py-1 text-[10px] font-bold rounded-md bg-[#3B82F6] text-white shadow-sm">Equity</button>
                <button className="px-3 py-1 text-[10px] font-bold text-muted-foreground hover:text-[#0F172A]">Drawdown</button>
              </div>
            </div>
            <div className="flex-1 min-h-[300px]">
              {equityCurveData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurveData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <LineChart size={48} className="text-muted-foreground" />
                  <p className="text-sm font-medium">Close more trades to see your equity curve</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Long vs Short & Day Performance Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-muted-foreground" />
                <h3 className="text-sm font-bold text-[#0F172A]">Long vs Short</h3>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Performance by trade direction</p>
            </div>
            <div className="space-y-4">
              <DirectionCard 
                type="Long" 
                trades={closedTrades.filter(t => t.side === 'Long').length}
                pnl={closedTrades.filter(t => t.side === 'Long').reduce((acc, t) => acc + (t.pnl || 0), 0)}
                winRate={closedTrades.filter(t => t.side === 'Long').length > 0 ? (closedTrades.filter(t => t.side === 'Long' && (t.pnl || 0) > 0).length / closedTrades.filter(t => t.side === 'Long').length) * 100 : 0}
              />
              <DirectionCard 
                type="Short" 
                trades={closedTrades.filter(t => t.side === 'Short').length}
                pnl={closedTrades.filter(t => t.side === 'Short').reduce((acc, t) => acc + (t.pnl || 0), 0)}
                winRate={closedTrades.filter(t => t.side === 'Short').length > 0 ? (closedTrades.filter(t => t.side === 'Short' && (t.pnl || 0) > 0).length / closedTrades.filter(t => t.side === 'Short').length) * 100 : 0}
              />
            </div>
          </div>

          <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-muted-foreground" />
                <h3 className="text-sm font-bold text-[#0F172A]">Day Performance</h3>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Find your best trading days</p>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayPerformance} layout="vertical" margin={{ left: 0, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 'bold', fill: '#0F172A' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={12}>
                    {dayPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#3B82F6' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Symbols */}
        <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-[#0F172A]">Top Symbols</h3>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Best performing assets</p>
          </div>
          <div className="space-y-2">
            {Array.from(new Set(closedTrades.map(t => t.asset))).slice(0, 5).map((asset, i) => {
              const assetTrades = closedTrades.filter(t => t.asset === asset);
              const pnl = assetTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
              const wr = (assetTrades.filter(t => (t.pnl || 0) > 0).length / assetTrades.length) * 100;
              return (
                <div key={asset} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-border group hover:border-[#3B82F6]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[10px] font-black text-[#3B82F6]">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#0F172A]">{asset}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{assetTrades.length} trades • {wr.toFixed(0)}% win</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-black", pnl >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
                    ${pnl.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session Performance */}
        <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-[#0F172A]">Session Performance</h3>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Breakdown by trading session — Asian, London & New York</p>
          </div>
          
          <div className="relative h-12 bg-[#F8FAFC] rounded-xl border border-border overflow-hidden flex mb-8">
            <SessionSegment label="ASIAN" color="#F59E0B" start="00:00" end="08:00" />
            <SessionSegment label="LONDON" color="#3B82F6" start="08:00" end="13:00" />
            <SessionSegment label="NEW YORK" color="#10B981" start="13:00" end="22:00" />
            <SessionSegment label="" color="#F59E0B" start="22:00" end="24:00" />
            
            <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
              {['00:00', '08:00', '13:00', '22:00'].map(t => (
                <span key={t} className="text-[9px] font-bold text-muted-foreground mt-8">{t}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SessionCard 
              name="Asian" 
              time="22:00 — 08:00 UTC" 
              icon={<Zap size={16} />} 
              color="gold"
              pnl={0}
              trades={0}
              winRate={0}
            />
            <SessionCard 
              name="London" 
              time="08:00 — 13:00 UTC" 
              icon={<Shield size={16} />} 
              color="blue"
              pnl={totalPnl}
              trades={closedTrades.length}
              winRate={winRate}
              avgTrade={expectancy}
            />
            <SessionCard 
              name="New York" 
              time="13:00 — 22:00 UTC" 
              icon={<Globe size={16} />} 
              color="green"
              pnl={0}
              trades={0}
              winRate={0}
            />
          </div>
        </div>

        {/* Trading Calendar */}
        <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-muted-foreground" />
                <h3 className="text-sm font-bold text-[#0F172A]">Trading Calendar</h3>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Daily P&L heatmap - Click on days to see trades</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[#F8FAFC] p-1 rounded-lg border border-border">
                <button className="p-1.5 hover:bg-white rounded-md transition-all"><ChevronLeft size={14} /></button>
                <span className="px-4 text-xs font-bold text-[#0F172A]">April 2026</span>
                <button className="p-1.5 hover:bg-white rounded-md transition-all"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-8 gap-2">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'WEEKLY'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-muted-foreground tracking-widest">{d}</div>
                ))}
                {/* Simplified Calendar Grid */}
                {Array.from({ length: 30 }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === 15;
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-xl border border-border p-2 flex flex-col justify-between transition-all cursor-pointer hover:border-[#3B82F6]/50",
                        isToday ? "bg-[#EFF6FF] border-[#3B82F6]/30" : "bg-[#F8FAFC]"
                      )}
                    >
                      <span className="text-[10px] font-bold text-muted-foreground">{day}</span>
                      {isToday && (
                        <div className="text-center">
                          <p className="text-[10px] font-black text-[#3B82F6]">${totalPnl.toFixed(2)}</p>
                          <p className="text-[8px] font-bold text-muted-foreground">{closedTrades.length} trade</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Weekly stats column placeholder */}
                <div className="col-start-8 row-start-2 row-span-5 space-y-2">
                  {[0, 0, totalPnl, 0, 0].map((val, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-[#EFF6FF]/50 border border-[#3B82F6]/10 flex flex-col items-center justify-center text-center p-2">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">WEEKLY</p>
                      <p className={cn("text-[10px] font-black", val >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
                        {val >= 0 ? '+' : ''}${val.toFixed(0)}
                      </p>
                      <p className="text-[7px] font-bold text-muted-foreground">Traded Days {val !== 0 ? 1 : 0}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 pt-4">
                <LegendItem color="#3B82F6" label="Profitable Day" />
                <LegendItem color="#EF4444" label="Losing Day" />
                <LegendItem color="#94A3B8" label="No Trades" />
              </div>
            </div>

            <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                  <ArrowUpRight size={18} />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Day Trades</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <CalendarIcon size={48} className="text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground max-w-[160px]">Click on a day with trades to view details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Win/Loss Distribution & Recent Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-muted-foreground" />
                <h3 className="text-sm font-bold text-[#0F172A]">Win/Loss Distribution</h3>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-12 w-full bg-[#F8FAFC] rounded-xl border border-border overflow-hidden flex">
                <div className="h-full bg-[#3B82F6]" style={{ width: `${(grossProfit / (grossProfit + grossLoss || 1)) * 100}%` }} />
                <div className="h-full bg-[#EF4444]" style={{ width: `${(grossLoss / (grossProfit + grossLoss || 1)) * 100}%` }} />
              </div>
              <div className="space-y-3">
                <DistributionRow label="Gross Profit" value={`$${grossProfit.toFixed(2)}`} color="#3B82F6" />
                <DistributionRow label="Gross Loss" value={`-$${grossLoss.toFixed(2)}`} color="#EF4444" />
                <DistributionRow label="Net Result" value={`$${totalPnl.toFixed(2)}`} color="#3B82F6" isTotal />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-muted-foreground" />
                <h3 className="text-sm font-bold text-[#0F172A]">Recent Trades</h3>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Your last 10 trades</p>
            </div>
            <div className="space-y-2">
              {closedTrades.slice(0, 5).map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-border hover:border-[#3B82F6]/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-[#3B82F6]">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#0F172A]">{trade.asset}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{format(new Date(trade.exitTimestamp || trade.timestamp), 'MMM dd')}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-black", (trade.pnl || 0) >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
                    ${(trade.pnl || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Stats Table */}
        <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-8 shadow-lg shadow-blue-500/5 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#0F172A]">Your Stats</h2>
            <Badge className="bg-[#F8FAFC] text-muted-foreground border border-border text-[10px] h-6 px-3 font-bold">30 DAYS</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatSummaryCard label="BEST MONTH" value={`$${totalPnl.toFixed(2)}`} subtext="Apr 2026" />
            <StatSummaryCard label="WORST MONTH" value={`$${totalPnl.toFixed(2)}`} subtext="Apr 2026" />
            <StatSummaryCard label="AVERAGE" value={`$${totalPnl.toFixed(2)}`} subtext="per Month" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-border">
            <DetailedStatRow label="Total P&L" value={`$${totalPnl.toFixed(2)}`} isBlue />
            <DetailedStatRow label="Open trades" value="0" />
            <DetailedStatRow label="Average daily volume" value="1.00" />
            <DetailedStatRow label="Total trading days" value="1" />
            <DetailedStatRow label="Average winning trade" value={`$${avgWinner.toFixed(2)}`} isBlue />
            <DetailedStatRow label="Winning days" value="1" isBlue />
            <DetailedStatRow label="Average losing trade" value={`-$${avgLoser.toFixed(2)}`} isRed />
            <DetailedStatRow label="Losing days" value="0" isRed />
            <DetailedStatRow label="Total number of trades" value={closedTrades.length.toString()} />
            <DetailedStatRow label="Breakeven days" value="0" />
            <DetailedStatRow label="Number of winning trades" value={winningTrades.length.toString()} isBlue />
            <DetailedStatRow label="Max consecutive winning days" value="1" isBlue />
            <DetailedStatRow label="Number of losing trades" value={losingTrades.length.toString()} isRed />
            <DetailedStatRow label="Max consecutive losing days" value="0" isRed />
            <DetailedStatRow label="Number of break even trades" value="0" />
            <DetailedStatRow label="Average daily P&L" value={`$${totalPnl.toFixed(2)}`} isBlue />
            <DetailedStatRow label="Max consecutive wins" value="1" isBlue />
            <DetailedStatRow label="Average winning day P&L" value={`$${totalPnl.toFixed(2)}`} isBlue />
            <DetailedStatRow label="Max consecutive losses" value="0" isRed />
            <DetailedStatRow label="Average losing day P&L" value="$0.00" isRed />
            <DetailedStatRow label="Total commissions" value="$0.00" />
            <DetailedStatRow label="Largest profitable day" value={`$${totalPnl.toFixed(2)}`} isBlue />
            <DetailedStatRow label="Total swap" value="$0.00" />
            <DetailedStatRow label="Largest losing day" value="$0.00" isRed />
            <DetailedStatRow label="Largest profit" value={`$${bestTrade.toFixed(2)}`} isBlue />
            <DetailedStatRow label="Trade expectancy" value={`$${expectancy.toFixed(2)}`} isBlue />
            <DetailedStatRow label="Largest loss" value={`$${worstTrade.toFixed(2)}`} isRed />
            <DetailedStatRow label="Max drawdown" value="$0.00" isRed />
            <DetailedStatRow label="Avg hold time (All)" value="2h 4m" />
            <DetailedStatRow label="Max drawdown %" value="0%" isRed />
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, subtext, icon, trend, progress, description }: any) {
  return (
    <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-4 group hover:border-[#3B82F6]/30 transition-all">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-muted-foreground group-hover:text-[#3B82F6] transition-colors">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black",
            trend === 'up' ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#EF4444]/10 text-[#EF4444]"
          )}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend === 'up' ? '+12.5%' : '-4.2%'}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-[#0F172A]">{value}</h3>
        <p className="text-xs text-muted-foreground font-medium">{subtext}</p>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full bg-[#F8FAFC] rounded-full overflow-hidden">
          <div className="h-full bg-[#3B82F6]" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="pt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
        <Info size={12} />
        {description}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: any) {
  return (
    <div className="bg-[#F8FAFC] border border-border rounded-xl p-4 space-y-1 group hover:border-[#3B82F6]/20 transition-all">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn(
        "text-sm font-black",
        color === 'green' ? "text-[#10B981]" : 
        color === 'red' ? "text-[#EF4444]" : 
        color === 'blue' ? "text-[#3B82F6]" : "text-[#0F172A]"
      )}>
        {value}
      </p>
    </div>
  );
}

function DirectionCard({ type, trades, pnl, winRate }: any) {
  return (
    <div className="p-4 bg-[#F8FAFC] border border-border rounded-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          type === 'Long' ? "bg-[#EFF6FF] text-[#3B82F6]" : "bg-[#FFF1F2] text-[#EF4444]"
        )}>
          {type === 'Long' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </div>
        <span className="text-sm font-black text-[#0F172A]">{type}</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">TRADES</p>
          <p className="text-xs font-black text-[#0F172A]">{trades}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">P&L</p>
          <p className={cn("text-xs font-black", pnl >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
            ${pnl.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">WIN %</p>
          <p className="text-xs font-black text-[#0F172A]">{winRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

function SessionSegment({ label, color, start, end }: any) {
  return (
    <div 
      className="h-full flex items-center justify-center text-[9px] font-black text-white relative group"
      style={{ backgroundColor: color, flex: (parseInt(end) - parseInt(start)) / 24 }}
    >
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
    </div>
  );
}

function SessionCard({ name, time, icon, color, pnl, trades, winRate, avgTrade }: any) {
  const colorClass = color === 'gold' ? 'text-[#F59E0B]' : color === 'blue' ? 'text-[#3B82F6]' : 'text-[#10B981]';
  const bgColorClass = color === 'gold' ? 'bg-[#FFFBEB]' : color === 'blue' ? 'bg-[#EFF6FF]' : 'bg-[#F0FDF4]';
  
  return (
    <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 space-y-6 shadow-lg shadow-blue-500/5 group hover:border-[#3B82F6]/30 transition-all">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColorClass, colorClass)}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-[#0F172A]">{name}</h4>
          <p className="text-[10px] text-muted-foreground font-bold">{time}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={cn("text-lg font-black", pnl >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
            ${pnl.toFixed(2)}
          </span>
          <div className="h-1.5 w-24 bg-[#F8FAFC] rounded-full overflow-hidden">
            <div className={cn("h-full", pnl >= 0 ? "bg-[#3B82F6]" : "bg-[#EF4444]")} style={{ width: pnl !== 0 ? '100%' : '0%' }} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4">
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">TRADES</p>
            <p className="text-xs font-black text-[#0F172A]">{trades}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">WIN RATE</p>
            <p className="text-xs font-black text-[#0F172A]">{winRate > 0 ? `${winRate.toFixed(1)}%` : '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">AVG TRADE</p>
            <p className={cn("text-xs font-black", (avgTrade || 0) >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
              {avgTrade !== undefined ? `$${avgTrade.toFixed(2)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">VOLUME</p>
            <p className="text-xs font-black text-[#0F172A]">{trades > 0 ? '100%' : '0%'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}

function DistributionRow({ label, value, color, isTotal }: any) {
  return (
    <div className={cn("flex items-center justify-between", isTotal && "pt-3 border-t border-border")}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className={cn("text-xs font-bold", isTotal ? "text-[#0F172A]" : "text-muted-foreground")}>{label}</span>
      </div>
      <span className={cn("text-xs font-black", isTotal ? "text-[#3B82F6]" : "text-[#0F172A]")}>{value}</span>
    </div>
  );
}

function StatSummaryCard({ label, value, subtext }: any) {
  return (
    <div className="bg-[#F8FAFC] border border-border rounded-xl p-6 space-y-1 group hover:border-[#3B82F6]/20 transition-all">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-[#3B82F6]">{value}</p>
      <p className="text-[10px] text-muted-foreground font-bold">{subtext}</p>
    </div>
  );
}

function DetailedStatRow({ label, value, isBlue, isRed }: any) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn(
        "text-xs font-black",
        isBlue ? "text-[#3B82F6]" : isRed ? "text-[#EF4444]" : "text-[#0F172A]"
      )}>
        {value}
      </span>
    </div>
  );
}
