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
}

export function TradeJournalView({ trades, onBack, onSave }: TradeJournalViewProps) {
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Header */}
      <header className="h-[72px] bg-white flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg lg:text-xl font-bold tracking-tight text-[#0F172A]">Trade Journal</h1>
            <p className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-widest">Journal / Trade Journal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex border-border gap-2 h-9 rounded-xl font-bold text-xs">
            <Filter size={14} /> Filter
          </Button>
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] h-9 rounded-xl font-bold text-xs px-4 lg:px-6 shadow-lg shadow-blue-500/20">
            Sync Trades
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 lg:p-6 gap-4 lg:gap-6">
        {/* Left Sidebar - Trade List */}
        <div className="w-full lg:w-[380px] h-[350px] lg:h-auto flex flex-col bg-white rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden shrink-0">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Trade Journal</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#10B981]/10 text-[#10B981] border-none text-[9px] font-black h-5 px-2">
                  <div className="w-1 h-1 rounded-full bg-[#10B981] mr-1.5 animate-pulse" />
                  Live
                </Badge>
                <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-none text-[9px] font-black h-5 px-2">
                  {trades.length} entries
                </Badge>
              </div>
            </div>

            <div className="flex items-center bg-[#F8FAFC] rounded-xl p-1">
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
                      filter === f.toLowerCase() ? "bg-white shadow-sm text-[#3B82F6]" : "text-muted-foreground hover:text-[#0F172A]"
                    )}
                  >
                    {f}
                    <span className={cn(
                      "px-1.5 rounded-md text-[8px]",
                      filter === f.toLowerCase() ? "bg-[#EFF6FF] text-[#3B82F6]" : "bg-muted text-muted-foreground"
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
                    ? "bg-[#EFF6FF] border-[#3B82F6]/30 shadow-md shadow-blue-500/5" 
                    : "bg-white border-border hover:border-[#3B82F6]/20 hover:bg-[#F8FAFC]"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shadow-sm">
                      <img 
                        src={`https://flagcdn.com/w40/${trade.asset.substring(0, 2).toLowerCase()}.png`} 
                        alt="" 
                        className="w-5 h-3.5 object-cover rounded-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#0F172A]">{trade.asset}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-bold",
                          trade.side === 'Long' ? "text-[#3B82F6]" : "text-[#EF4444]"
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
                      (trade.pnl || 0) >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]"
                    )}>
                      {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                    </span>
                    {!trade.notes && !trade.postReflection && (
                      <Badge className="bg-[#F8FAFC] text-muted-foreground border border-border text-[8px] font-black h-4 px-1.5">NEW</Badge>
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
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden">
          {selectedTrade ? (
            <>
              <div className="p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-border flex items-center justify-center shadow-sm">
                    <img 
                      src={`https://flagcdn.com/w40/${selectedTrade.asset.substring(0, 2).toLowerCase()}.png`} 
                      alt="" 
                      className="w-8 h-5.5 object-cover rounded-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-[#0F172A]">{selectedTrade.asset}</h2>
                      <Badge className={cn(
                        "border-none text-[10px] font-black h-5 px-2",
                        (selectedTrade.pnl || 0) >= 0 ? "bg-[#EFF6FF] text-[#3B82F6]" : "bg-[#FFF1F2] text-[#EF4444]"
                      )}>
                        {(selectedTrade.pnl || 0) >= 0 ? 'WINNER' : 'LOSER'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
                      <span className={cn(selectedTrade.side === 'Long' ? "text-[#3B82F6]" : "text-[#EF4444]")}>
                        {selectedTrade.side}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-muted" />
                      <span>Entry ${selectedTrade.entryPrice}</span>
                      <div className="w-1 h-1 rounded-full bg-muted" />
                      <span>Size {selectedTrade.size}</span>
                      <div className="w-1 h-1 rounded-full bg-muted" />
                      <span>{format(new Date(selectedTrade.timestamp), 'MMM dd, yyyy, HH:mm')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="rounded-xl border-border h-10 w-10 text-muted-foreground hover:text-[#0F172A]">
                    <RotateCcw size={18} />
                  </Button>
                  <Button variant="outline" className="rounded-xl border-border h-10 gap-2 font-bold text-xs px-4">
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
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                      <BookOpen size={18} />
                    </div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">PRE-TRADE ANALYSIS</h3>
                  </div>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you see? Plan, thesis, levels, risk..."
                    className="min-h-[200px] bg-[#F8FAFC] border-border rounded-2xl p-6 text-sm font-medium focus-visible:ring-[#3B82F6]/30 resize-none"
                  />
                </div>

                {/* Post-Trade Review */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">POST-TRADE REVIEW</h3>
                  </div>
                  <Textarea 
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="What happened? Execution, slippage, improvements..."
                    className="min-h-[200px] bg-[#F8FAFC] border-border rounded-2xl p-6 text-sm font-medium focus-visible:ring-[#3B82F6]/30 resize-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-[#F8FAFC] border border-border flex items-center justify-center text-muted-foreground/30">
                <PenLine size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-[#0F172A]">Select a trade to journal</h3>
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
