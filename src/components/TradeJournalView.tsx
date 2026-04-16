import React from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BarChart3, 
  Save, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  PenLine,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Trade } from '@/src/types';

interface TradeJournalViewProps {
  trades: Trade[];
  onBack: () => void;
  onSave: (tradeId: string, data: { notes: string; postReflection: string }) => void;
  isDarkMode?: boolean;
}

export function TradeJournalView({ trades, onBack, onSave, isDarkMode }: TradeJournalViewProps) {
  const [selectedTradeId, setSelectedTradeId] = React.useState<string | null>(trades[0]?.id || null);
  const [filter, setFilter] = React.useState<'all' | 'journaled' | 'pending' | 'learning'>('all');
  const [notes, setNotes] = React.useState('');
  const [reflection, setReflection] = React.useState('');

  const selectedTrade = trades.find(t => t.id === selectedTradeId);

  React.useEffect(() => {
    if (selectedTrade) {
      setNotes(selectedTrade.notes || '');
      setReflection(selectedTrade.postReflection || '');
    }
  }, [selectedTradeId]);

  const handleSave = () => {
    if (selectedTradeId) {
      onSave(selectedTradeId, { notes, postReflection: reflection });
    }
  };

  const filteredTrades = trades.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'journaled') return t.notes || t.postReflection;
    if (filter === 'pending') return !t.notes && !t.postReflection;
    return true;
  });

  return (
    <div className={cn(
      "flex-1 flex flex-col overflow-hidden transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A] text-slate-200" : "bg-[#F8FAFC] text-foreground"
    )}>
      {/* Header */}
      <header className={cn(
        "h-[72px] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 border-b transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full", isDarkMode ? "text-slate-400 hover:text-white" : "")}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className={cn("text-lg lg:text-xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-[#0F172A]")}>Trade Journal</h1>
            <p className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-widest">Journal / Trade Journal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          <Button variant="outline" size="sm" className={cn(
            "hidden sm:flex border gap-2 h-9 rounded-xl font-bold text-xs",
            isDarkMode ? "bg-[#334155] border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-border"
          )}>
            <Filter size={14} /> Filter
          </Button>
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] h-9 rounded-xl font-bold text-xs px-4 lg:px-6 shadow-lg shadow-blue-500/20">
            Sync Trades
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 lg:p-6 gap-4 lg:gap-6">
        {/* Left Sidebar - Trade List */}
        <div className={cn(
          "w-full lg:w-[380px] h-[350px] lg:h-auto flex flex-col rounded-2xl shadow-lg overflow-hidden shrink-0 transition-colors duration-300",
          isDarkMode ? "bg-[#1E293B] border border-slate-700/50 shadow-blue-500/5" : "bg-white border border-border shadow-blue-500/5"
        )}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-black uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-[#0F172A]")}>Trade Journal</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#10B981]/10 text-[#10B981] border-none text-[9px] font-black h-5 px-2">
                  <div className="w-1 h-1 rounded-full bg-[#10B981] mr-1.5 animate-pulse" />
                  Live
                </Badge>
                <Badge className={cn(
                  "border-none text-[9px] font-black h-5 px-2",
                  isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#3B82F6]/10 text-[#3B82F6]"
                )}>
                  {trades.length} entries
                </Badge>
              </div>
            </div>

            <div className={cn(
              "flex items-center rounded-xl p-1",
              isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
            )}>
              {['All', 'Journaled', 'Pending', 'Learning'].map((f) => {
                const count = f === 'All' ? trades.length : 
                             f === 'Journaled' ? trades.filter(t => t.notes || t.postReflection).length :
                             f === 'Pending' ? trades.filter(t => !t.notes && !t.postReflection).length : 0;
                return (
                  <button 
                    key={f}
                    onClick={() => setFilter(f.toLowerCase() as any)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5",
                      filter === f.toLowerCase() 
                        ? (isDarkMode ? "bg-[#334155] text-blue-400 shadow-sm" : "bg-white shadow-sm text-[#3B82F6]") 
                        : "text-muted-foreground hover:text-[#0F172A]"
                    )}
                  >
                    {f}
                    <span className={cn(
                      "px-1.5 rounded-md text-[8px]",
                      filter === f.toLowerCase() 
                        ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                        : (isDarkMode ? "bg-slate-800 text-slate-500" : "bg-muted text-muted-foreground")
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredTrades.map((trade) => (
              <div 
                key={trade.id}
                onClick={() => setSelectedTradeId(trade.id)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer group relative",
                  selectedTradeId === trade.id 
                    ? (isDarkMode ? "bg-blue-500/10 border-blue-500/30 shadow-md shadow-blue-500/5" : "bg-[#EFF6FF] border-[#3B82F6]/30 shadow-md shadow-blue-500/5")
                    : (isDarkMode ? "bg-[#334155]/20 border-slate-700/50 hover:border-blue-500/20 hover:bg-[#334155]/40" : "bg-white border-border hover:border-[#3B82F6]/20 hover:bg-[#F8FAFC]")
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center shadow-sm",
                      isDarkMode ? "bg-[#334155] border-slate-700" : "bg-white border-border"
                    )}>
                      <img 
                        src={`https://flagcdn.com/w40/${trade.asset.substring(0, 2).toLowerCase()}.png`} 
                        alt="" 
                        className="w-5 h-3.5 object-cover rounded-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className={cn("text-sm font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>{trade.asset}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-bold",
                          trade.side === 'Long' ? "text-blue-400" : "text-[#EF4444]"
                        )}>
                          {trade.side}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">${trade.entryPrice}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "text-xs font-black",
                      (trade.pnl || 0) >= 0 ? "text-blue-400" : "text-[#EF4444]"
                    )}>
                      {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                    </span>
                    {!trade.notes && !trade.postReflection && (
                      <Badge className={cn(
                        "border text-[8px] font-black h-4 px-1.5",
                        isDarkMode ? "bg-[#334155] text-slate-400 border-slate-700 font-black" : "bg-[#F8FAFC] text-muted-foreground border-border"
                      )}>NEW</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                  <Clock size={10} />
                  {format(new Date(trade.timestamp), 'MMM dd, yyyy, HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Journal Editor */}
        <div className={cn(
          "flex-1 flex flex-col rounded-2xl shadow-lg overflow-hidden transition-colors duration-300",
          isDarkMode ? "bg-[#1E293B] border border-slate-700/50 shadow-blue-500/5" : "bg-white border border-border shadow-blue-500/5"
        )}>
          {selectedTrade ? (
            <>
              <div className="p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm",
                    isDarkMode ? "bg-[#334155] border-slate-700" : "bg-[#F8FAFC] border-border"
                  )}>
                    <img 
                      src={`https://flagcdn.com/w40/${selectedTrade.asset.substring(0, 2).toLowerCase()}.png`} 
                      alt="" 
                      className="w-8 h-5.5 object-cover rounded-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className={cn("text-2xl font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>{selectedTrade.asset}</h2>
                      <Badge className={cn(
                        "border-none text-[10px] font-black h-5 px-2",
                        (selectedTrade.pnl || 0) >= 0 
                          ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                          : "bg-[#FFF1F2] text-[#EF4444]"
                      )}>
                        {(selectedTrade.pnl || 0) >= 0 ? 'WINNER' : 'LOSER'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
                      <span className={cn(selectedTrade.side === 'Long' ? "text-blue-400" : "text-[#EF4444]")}>
                        {selectedTrade.side}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-muted/30" />
                      <span>Entry ${selectedTrade.entryPrice}</span>
                      <div className="w-1 h-1 rounded-full bg-muted/30" />
                      <span>Size {selectedTrade.size}</span>
                      <div className="w-1 h-1 rounded-full bg-muted/30" />
                      <span>{format(new Date(selectedTrade.timestamp), 'MMM dd, yyyy, HH:mm')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className={cn(
                    "rounded-xl border h-10 w-10 transition-colors",
                    isDarkMode ? "bg-[#334155] border-slate-700 text-slate-400 hover:text-white" : "bg-white border-border text-muted-foreground hover:text-[#0F172A]"
                  )}>
                    <RotateCcw size={18} />
                  </Button>
                  <Button variant="outline" className={cn(
                    "rounded-xl border h-10 gap-2 font-bold text-xs px-4 transition-colors",
                    isDarkMode ? "bg-[#334155] border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-border"
                  )}>
                    <BarChart3 size={16} /> Analytics
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] h-10 rounded-xl font-bold text-xs px-8 shadow-lg shadow-blue-500/20 gap-2"
                  >
                    <Save size={16} /> Save
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Pre-Trade Analysis */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]"
                    )}>
                      <BookOpen size={18} />
                    </div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">PRE-TRADE ANALYSIS</h3>
                  </div>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you see? Plan, thesis, levels, risk..."
                    className={cn(
                      "min-h-[200px] border rounded-2xl p-6 text-sm font-medium focus-visible:ring-[#3B82F6]/30 resize-none transition-colors duration-300",
                      isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-200" : "bg-[#F8FAFC] border-border text-[#0F172A]"
                    )}
                  />
                </div>

                {/* Post-Trade Review */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]"
                    )}>
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">POST-TRADE REVIEW</h3>
                  </div>
                  <Textarea 
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="What happened? Execution, slippage, improvements..."
                    className={cn(
                      "min-h-[200px] border rounded-2xl p-6 text-sm font-medium focus-visible:ring-[#3B82F6]/30 resize-none transition-colors duration-300",
                      isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-200" : "bg-[#F8FAFC] border-border text-[#0F172A]"
                    )}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className={cn(
                "w-20 h-20 rounded-3xl border flex items-center justify-center text-muted-foreground/30",
                isDarkMode ? "bg-[#334155] border-slate-700" : "bg-[#F8FAFC] border-border"
              )}>
                <PenLine size={40} />
              </div>
              <div className="space-y-2">
                <h3 className={cn("text-lg font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>Select a trade to journal</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Review your performance, capture your thoughts, and improve your trading process.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
