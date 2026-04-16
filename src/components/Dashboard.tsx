import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { 
  MessageSquare,
  Send,
  LayoutTemplate,
  X,
  Zap,
  Globe,
  Info,
  Lock,
  PenLine,
  ListTodo,
  LayoutGrid, 
  Ticket, 
  FileText, 
  LineChart, 
  Blocks, 
  Shield, 
  BarChart4,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Filter,
  Download,
  List,
  LogIn,
  Book,
  Heart,
  Newspaper,
  Sparkles,
  BarChart3,
  FlaskConical,
  Layout,
  Target,
  Wallet,
  BookOpen,
  Settings,
  HelpCircle,
  CreditCard,
  Sun,
  Moon,
  DollarSign,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMultipleQuotes, MarketQuote } from '../services/marketService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PerformanceView } from './PerformanceView';
import { TradeJournalView } from './TradeJournalView';
import MarketView from './MarketView';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { MOCK_TRADES, MOCK_MARKET_ASSETS, MOCK_RISK, MOCK_PERFORMANCE } from '@/src/constants';
import { cn } from '@/lib/utils';
import { AnnotationEditor } from './AnnotationEditor';
import { TradeForm } from './TradeForm';
import { Trade } from '@/src/types';
import { analyzeTradingPerformance, getTradingPsychologyAdvice } from '../services/geminiService';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  db,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  handleFirestoreError,
  OperationType
} from '@/src/firebase';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date(2023, 9, 15));
  const [trades, setTrades] = React.useState<Trade[]>(MOCK_TRADES);
  const [editingThumbnail, setEditingThumbnail] = React.useState<{ tradeId: string; index: number } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [view, setView] = React.useState<'dashboard' | 'trade-form' | 'trade-log' | 'daily-journal' | 'performance' | 'trade-analysis' | 'trade-journal' | 'market' | 'settings' | 'risk-calculator' | 'ai-agent' | 'strategies'>('dashboard');
  const [journalEntries, setJournalEntries] = React.useState<{id: string, date: string, content: string, type: 'free' | 'structured'}[]>([]);
  const [pulses, setPulses] = React.useState<{id: string, timestamp: string, mood: string, note: string}[]>([]);
  const [selectedTradeForEdit, setSelectedTradeForEdit] = React.useState<Trade | undefined>(undefined);
  const [selectedTradeId, setSelectedTradeId] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [marketQuotes, setMarketQuotes] = React.useState<MarketQuote[]>([]);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [timeFormat, setTimeFormat] = React.useState<'HH:mm:ss a' | 'HH:mm' | 'MMM dd, HH:mm'>('HH:mm:ss a');
  const [isQuickTradeOpen, setIsQuickTradeOpen] = React.useState(false);

  const metrics = React.useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'Closed');
    const openTrades = trades.filter(t => t.status === 'Active');
    
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const realizedPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const unrealizedPnl = openTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    
    // Equity Curve calculation
    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let runningPnl = 0;
    const equityCurve = sortedTrades.map(t => {
      runningPnl += (t.pnl || 0);
      return {
        date: format(new Date(t.timestamp), 'MMM dd'),
        value: runningPnl
      };
    });

    return {
      totalPnl,
      realizedPnl,
      unrealizedPnl,
      winRate,
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      equityCurve: equityCurve.length > 0 ? equityCurve : MOCK_PERFORMANCE.equityCurve
    };
  }, [trades]);

  const iterateTimeFormat = () => {
    const formats: ('HH:mm:ss a' | 'HH:mm' | 'MMM dd, HH:mm')[] = ['HH:mm:ss a', 'HH:mm', 'MMM dd, HH:mm'];
    const currentIndex = formats.indexOf(timeFormat);
    setTimeFormat(formats[(currentIndex + 1) % formats.length]);
  };

  const iterateView = () => {
    const views: ('dashboard' | 'trade-log' | 'market' | 'performance')[] = ['dashboard', 'trade-log', 'market', 'performance'];
    const currentIndex = views.indexOf(view as any);
    if (currentIndex !== -1) {
      setView(views[(currentIndex + 1) % views.length]);
    } else {
      setView('dashboard');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchMarketData = async () => {
      const symbols = ['AAPL', 'TSLA', 'BTCUSD', 'EURUSD'];
      const quotes = await fetchMultipleQuotes(symbols);
      setMarketQuotes(quotes);
    };

    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Sync user profile
        const userRef = doc(db, 'users', u.uid);
        setDoc(userRef, {
          uid: u.uid,
          displayName: u.displayName || 'Anonymous',
          photoURL: u.photoURL || '',
          email: u.email || ''
        }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${u.uid}`));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTrades([]);
      return;
    }

    const q = query(collection(db, 'trades'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[];
      setTrades(tradesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trades');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAddTrade = () => {
    setSelectedTradeForEdit(undefined);
    setView('trade-form');
  };

  const handleEditTrade = (trade: Trade) => {
    setSelectedTradeId(trade.id);
    setSelectedTradeForEdit(trade);
    setView('trade-form');
  };

  const handleSaveTrade = async (tradeData: Omit<Trade, 'id' | 'uid'>) => {
    if (!user) return;

    try {
      if (selectedTradeForEdit) {
        const tradeRef = doc(db, 'trades', selectedTradeForEdit.id);
        await updateDoc(tradeRef, {
          ...tradeData,
          uid: user.uid
        });
      } else {
        const tradesRef = collection(db, 'trades');
        await addDoc(tradesRef, {
          ...tradeData,
          uid: user.uid
        });
      }
      setView('dashboard');
    } catch (error) {
      handleFirestoreError(error, selectedTradeForEdit ? OperationType.UPDATE : OperationType.CREATE, 'trades');
    }
  };

  const handleSaveAnnotation = (data: string) => {
    if (!editingThumbnail) return;
    
    setTrades(prev => prev.map(t => {
      if (t.id === editingThumbnail.tradeId) {
        return {
          ...t,
          annotations: {
            ...(t.annotations || {}),
            [editingThumbnail.index]: data
          }
        };
      }
      return t;
    }));
  };

  const handleSaveJournal = async (tradeId: string, data: { notes: string; postReflection: string }) => {
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      await updateDoc(tradeRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trades/${tradeId}`);
    }
  };

  const currentTrade = trades.find(t => t.id === selectedTradeId) || trades[0];
  const editingTrade = editingThumbnail ? trades.find(t => t.id === editingThumbnail.tradeId) : null;

  if (view === 'trade-form') {
    return (
      <TradeForm 
        onBack={() => setView('dashboard')} 
        onSave={handleSaveTrade}
        initialData={selectedTradeForEdit}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-foreground overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? '72px' : '260px',
          x: isMobileMenuOpen ? 0 : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative flex flex-col bg-white transition-transform duration-300 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="py-8 px-4 overflow-hidden">
          <div className={cn(
            "flex items-center transition-all duration-300",
            isSidebarCollapsed ? "justify-center" : "justify-start px-2"
          )}>
            <span className="text-xl font-black text-[#0F172A] tracking-tighter whitespace-nowrap">
              {isSidebarCollapsed ? "TD" : "Trading Diary"}
            </span>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-[#0F172A] hover:border-[#3B82F6] hover:bg-blue-50 shadow-sm z-[60] transition-all"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-2">
            <SidebarItem 
              icon={<LayoutGrid size={20} />} 
              label="Dashboard" 
              active={view === 'dashboard'} 
              collapsed={isSidebarCollapsed} 
              onClick={() => setView('dashboard')}
            />
            <SidebarItem 
              icon={<Wallet size={20} />} 
              label="Trades" 
              active={view === 'trade-log'}
              collapsed={isSidebarCollapsed} 
              onClick={() => setView('trade-log')}
            />
            <SidebarItem 
              icon={<Book size={20} />} 
              label="Journal" 
              active={view === 'daily-journal' || view === 'trade-journal'}
              collapsed={isSidebarCollapsed} 
              hasDropdown
            >
              {!isSidebarCollapsed && (
                <div className="ml-9 mt-1 space-y-1">
                  <button 
                    onClick={() => setView('daily-journal')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'daily-journal' ? "bg-[#EFF6FF] text-[#3B82F6]" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    Daily Journal
                  </button>
                  <button 
                    onClick={() => setView('trade-journal')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'trade-journal' ? "bg-[#EFF6FF] text-[#3B82F6]" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    Trade Journal
                  </button>
                  <button 
                    onClick={() => setView('strategies')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'strategies' ? "bg-[#EFF6FF] text-[#3B82F6]" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    Strategies
                  </button>
                </div>
              )}
            </SidebarItem>
            <SidebarItem 
              icon={<BarChart4 size={20} />} 
              label="Analysis" 
              collapsed={isSidebarCollapsed} 
              hasDropdown 
              active={view === 'performance' || view === 'trade-analysis'}
            >
              {!isSidebarCollapsed && (
                <div className="ml-9 mt-1 space-y-1">
                  <button 
                    onClick={() => setView('performance')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'performance' ? "bg-[#EFF6FF] text-[#3B82F6]" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    Performance
                  </button>
                  <button 
                    onClick={() => setView('trade-analysis')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'trade-analysis' ? "bg-[#EFF6FF] text-[#3B82F6]" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    Trade Analysis
                  </button>
                </div>
              )}
            </SidebarItem>
            <SidebarItem 
              icon={<TrendingUp size={20} />} 
              label="Market" 
              collapsed={isSidebarCollapsed}
              active={view === 'market'}
              onClick={() => setView('market')}
            />
            <SidebarItem 
              icon={<Sparkles size={20} />} 
              label="AI Agent" 
              collapsed={isSidebarCollapsed} 
              active={view === 'ai-agent'}
              onClick={() => setView('ai-agent')}
            />
            <SidebarItem icon={<Zap size={20} />} label="Backtesting" collapsed={isSidebarCollapsed} />
            <SidebarItem icon={<Users size={20} />} label="Traders Lounge" collapsed={isSidebarCollapsed} />
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Tools" 
              collapsed={isSidebarCollapsed} 
              active={view === 'risk-calculator'}
              onClick={() => setView('risk-calculator')}
            />
          </div>

          <div className="mt-8 space-y-4">
            <SidebarCategory label="SUPPORT" collapsed={isSidebarCollapsed}>
              <SidebarItem 
                icon={<Settings size={20} />} 
                label="Settings" 
                collapsed={isSidebarCollapsed} 
                active={view === 'settings'}
                onClick={() => setView('settings')}
              />
              <SidebarItem icon={<HelpCircle size={20} />} label="Help & Support" collapsed={isSidebarCollapsed} />
              <SidebarItem icon={<CreditCard size={20} />} label="Subscription" collapsed={isSidebarCollapsed} />
            </SidebarCategory>
          </div>
        </ScrollArea>

        <div className="mt-auto p-3">
          {user && (
            <SidebarItem 
              icon={<LogOut size={20} />} 
              label="Logout" 
              collapsed={isSidebarCollapsed} 
              onClick={handleLogout} 
            />
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {view === 'trade-log' ? (
          <TradeLogView 
            trades={trades} 
            onBack={() => setView('dashboard')} 
            onEditTrade={handleEditTrade}
          />
        ) : view === 'trade-analysis' ? (
          <TradeAnalysisView trades={trades} onBack={() => setView('dashboard')} />
        ) : view === 'daily-journal' ? (
          <DailyJournalView 
            onBack={() => setView('dashboard')} 
            entries={journalEntries}
            pulses={pulses}
            onAddEntry={(entry) => setJournalEntries(prev => [entry, ...prev])}
            onAddPulse={(pulse) => setPulses(prev => [pulse, ...prev])}
          />
        ) : view === 'trade-journal' ? (
          <TradeJournalView 
            trades={trades} 
            onBack={() => setView('dashboard')} 
            onSave={handleSaveJournal}
          />
        ) : view === 'market' ? (
          <MarketView onBack={() => setView('dashboard')} />
        ) : view === 'performance' ? (
          <PerformanceView trades={trades} onBack={() => setView('dashboard')} />
        ) : view === 'settings' ? (
          <SettingsView onBack={() => setView('dashboard')} />
        ) : view === 'risk-calculator' ? (
          <RiskCalculator onBack={() => setView('dashboard')} />
        ) : view === 'ai-agent' ? (
          <AIAgentView trades={trades} onBack={() => setView('dashboard')} />
        ) : view === 'strategies' ? (
          <StrategyView trades={trades} onBack={() => setView('dashboard')} />
        ) : (
          <>
            <QuickTradeModal 
              isOpen={isQuickTradeOpen} 
              onClose={() => setIsQuickTradeOpen(false)}
              onSave={(newTrade) => {
                const trade: Trade = {
                  id: Math.random().toString(36).substr(2, 9),
                  status: 'Active',
                  pnl: 0,
                  pnlPercent: 0,
                  ...newTrade
                } as Trade;
                
                // Calculate P&L if exit price is provided
                if (trade.exitPrice && trade.entryPrice) {
                  const diff = trade.side === 'Long' 
                    ? trade.exitPrice - trade.entryPrice 
                    : trade.entryPrice - trade.exitPrice;
                  
                  const sizeNum = parseFloat(trade.size) || 0;
                  trade.pnl = diff * sizeNum * 100000; // Standard lots
                  trade.status = 'Closed';
                }

                setTrades(prev => [trade, ...prev]);
              }}
            />
            {/* Header */}
            <header className="h-[72px] bg-white flex items-center justify-between px-4 lg:px-8 z-10">
              <div 
                className="flex items-center gap-2 bg-[#F8FAFC] px-4 py-2 rounded-xl border border-border h-10 cursor-pointer hover:bg-muted transition-colors"
                onClick={iterateTimeFormat}
                title="Click to cycle time format"
              >
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-sm font-bold text-[#0F172A]">{format(currentTime, timeFormat)}</span>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2.5 bg-[#F8FAFC] border border-border rounded-xl text-[#F59E0B] hover:bg-muted transition-colors"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <Button 
                  onClick={() => setIsQuickTradeOpen(true)}
                  variant="outline"
                  className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10 font-bold rounded-xl px-6 h-10"
                >
                  Quick Entry
                </Button>

                <Button 
                  onClick={() => setView('trade-form')}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl px-6 h-10 shadow-lg shadow-blue-500/20"
                >
                  Add Trade
                </Button>
              </div>
            </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="TOTAL P&L" 
                value={`${metrics.totalPnl >= 0 ? '+' : ''}$${metrics.totalPnl.toLocaleString()}`} 
                subtext={`${metrics.totalTrades} trades`} 
                icon={<DollarSign size={24} />} 
                variant="blue"
                tag="TOTAL"
              />
              <MetricCard 
                title="UNREALIZED" 
                value={`${metrics.unrealizedPnl >= 0 ? '+' : ''}$${metrics.unrealizedPnl.toLocaleString()}`} 
                subtext={`${metrics.openTrades} open positions`} 
                icon={<Clock size={24} />} 
              />
              <MetricCard 
                title="REALIZED" 
                value={`${metrics.realizedPnl >= 0 ? '+' : ''}$${metrics.realizedPnl.toLocaleString()}`} 
                subtext={`${metrics.closedTrades} closed trades`} 
                icon={<CheckCircle2 size={24} />} 
              />
              <MetricCard 
                title="WIN RATE" 
                value={`${metrics.winRate.toFixed(1)}%`} 
                icon={<Target size={24} />} 
                showProgress
              />
            </div>

            {/* Performance Row */}
            <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <LineChart size={20} className="text-muted-foreground" />
                  <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">PERFORMANCE</h3>
                </div>
                <div className="flex items-center bg-[#F8FAFC] p-1 rounded-lg border border-border">
                  {['1D', '1W', '1M', '3M', 'ALL'].map((tf) => (
                    <button 
                      key={tf}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-bold rounded-md transition-all",
                        tf === '1W' ? "bg-[#3B82F6] text-white shadow-md" : "text-muted-foreground hover:text-[#0F172A]"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.equityCurve}>
                    <defs>
                      <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="pnl" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPnl)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity & Monthly P&L Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 min-h-[320px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-[#0F172A]">Recent Activity</h3>
                  <span className="text-xs text-muted-foreground font-medium">0 trades</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-border">
                    <CalendarIcon size={32} className="opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No recent activity</p>
                </div>
              </div>

              <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 min-h-[320px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-[#0F172A]">Monthly P&L</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground font-medium">Monthly: <span className="text-[#10B981]">+$0.00</span></span>
                    <span className="text-xs font-bold text-[#0F172A]">April 2026</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-[1fr_120px] gap-6">
                  <div className="grid grid-cols-7 gap-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                      <div key={`${day}-${idx}`} className="text-center text-[10px] font-bold text-muted-foreground mb-2">{day}</div>
                    ))}
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-[#F8FAFC] border border-border rounded-lg flex items-center justify-center text-[10px] font-medium text-muted-foreground/50">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#F8FAFC] border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">WEEKLY</p>
                    <p className="text-lg font-black text-[#0F172A]">$0</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Traded Days 0</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                    <span className="text-[10px] font-bold text-muted-foreground">Profit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span className="text-[10px] font-bold text-muted-foreground">Loss</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5 min-h-[240px] flex flex-col">
              <h3 className="text-sm font-bold text-[#0F172A] mb-6">Top Performers</h3>
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm font-medium">No trading data yet</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A]">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] border border-[#3B82F6]/20 rounded-xl p-6 flex flex-col gap-1 shadow-lg shadow-blue-500/5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AVG WIN</span>
                  <span className="text-xl font-black text-[#0F172A]">+$0.00</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#3B82F6]/20 rounded-xl p-6 flex flex-col gap-1 shadow-lg shadow-blue-500/5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AVG LOSS</span>
                  <span className="text-xl font-black text-[#0F172A]">+$0.00</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#3B82F6]/20 rounded-xl p-6 flex flex-col gap-1 shadow-lg shadow-blue-500/5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BEST TRADE</span>
                  <span className="text-xl font-black text-[#0F172A]">+$0.00</span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#3B82F6]/20 rounded-xl p-6 flex flex-col gap-1 shadow-lg shadow-blue-500/5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">WORST TRADE</span>
                  <span className="text-xl font-black text-[#0F172A]">+$0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Chat Button */}
        <button className="fixed bottom-20 right-6 w-14 h-14 bg-[#0077B6] rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </>
    )}
  </main>
</div>
);
}

function DailyJournalView({ 
  onBack, 
  entries, 
  pulses, 
  onAddEntry, 
  onAddPulse 
}: { 
  onBack: () => void,
  entries: any[],
  pulses: any[],
  onAddEntry: (entry: any) => void,
  onAddPulse: (pulse: any) => void
}) {
  const [filter, setFilter] = React.useState<'all' | 'free' | 'structured'>('all');
  const [isAddingPulse, setIsAddingPulse] = React.useState(false);
  const [pulseNote, setPulseNote] = React.useState('');

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] text-foreground overflow-hidden relative">
      <header className="h-[72px] bg-white flex items-center justify-between px-8 border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-[#0F172A]">Daily Journal</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => onAddEntry({ id: Date.now().toString(), date: new Date().toISOString(), content: 'New entry...', type: 'free' })}
            className="bg-[#3B82F6] hover:bg-[#2563EB] rounded-xl gap-2"
          >
            <Plus size={18} />
            Add Entry
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6 lg:y-8">
          
          {/* Today's Pulses Section */}
          <div className="bg-white border border-border rounded-2xl p-8 space-y-8 min-h-[280px] flex flex-col shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A]">Today's Pulses</h3>
                  <p className="text-xs text-muted-foreground">Quick snapshots of your trading state</p>
                </div>
              </div>
              <button className="h-9 px-4 rounded-lg border border-border text-xs font-bold text-[#3B82F6] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2">
                <Plus size={14} /> Add Pulse
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-border">
                <Zap size={32} className="text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#0F172A]">No pulses recorded today</p>
                <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-border text-[10px] font-mono font-bold">P</kbd> to add one</p>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-6">
            {/* This Week */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center">
                  <ChevronDown size={14} className="text-muted-foreground" />
                </div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">THIS WEEK</h4>
                <Badge className="bg-[#F8FAFC] text-muted-foreground border border-border text-[10px] h-5 px-2 font-bold">2 ENTRIES</Badge>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              
              <div className="space-y-3">
                {/* Entry 1 */}
                <div className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between group hover:border-[#3B82F6]/30 transition-all cursor-pointer shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-border flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-muted-foreground leading-none">APR</span>
                      <span className="text-sm font-black text-[#0F172A] leading-none mt-1">15</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#0F172A]">Wednesday, April 15</span>
                        <Badge className="bg-[#10B981]/10 text-[#10B981] border-none text-[9px] h-4 px-1.5 font-black">TODAY</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <PenLine size={12} /> Free Write
                        </div>
                        <div className="w-1 h-1 rounded-full bg-muted" />
                        <span className="text-xs text-muted-foreground font-medium italic">"Focused on high probability setups..."</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {/* Entry 2 */}
                <div className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between group hover:border-[#3B82F6]/30 transition-all cursor-pointer shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-border flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-muted-foreground leading-none">APR</span>
                      <span className="text-sm font-black text-[#0F172A] leading-none mt-1">14</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#0F172A]">Tuesday, April 14</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <PenLine size={12} /> Free Write
                        </div>
                        <div className="w-1 h-1 rounded-full bg-muted" />
                        <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-bold">
                          <TrendingUp size={12} /> 1 trade
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Earlier */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center">
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">EARLIER</h4>
                <Badge className="bg-[#F8FAFC] text-muted-foreground border border-border text-[10px] h-5 px-2 font-bold">1 ENTRY</Badge>
                <div className="h-px flex-1 bg-border/50" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#3B82F6] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 shadow-blue-500/40">
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Check-In Tab */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-border border-r-0 rounded-l-xl p-2 cursor-pointer hover:bg-[#F8FAFC] transition-colors z-40 group shadow-sm">
        <div className="[writing-mode:vertical-rl] flex items-center gap-2 py-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-[#3B82F6] transition-colors">Check-In</span>
        </div>
      </div>
    </div>
  );
}

function SidebarCategory({ label, children, collapsed }: { label: string; children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="flex flex-col gap-2">{children}</div>;
  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{label}</p>
      <div className="flex flex-col gap-1">
        {children}
      </div>
    </div>
  );
}

function SidebarItem({ 
  icon, 
  label, 
  active = false, 
  collapsed = false, 
  hasDropdown = false,
  tag,
  indicator = false,
  onClick,
  children
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  collapsed?: boolean; 
  hasDropdown?: boolean;
  tag?: string;
  indicator?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(active);

  return (
    <div className="w-full">
      <button 
        onClick={() => {
          if (hasDropdown) setIsOpen(!isOpen);
          if (onClick) onClick();
        }}
        className={cn(
          "w-full h-11 rounded-xl flex items-center transition-all duration-200 px-3 relative group",
          active && !hasDropdown
            ? "bg-[#EFF6FF] text-[#3B82F6]" 
            : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
        )}
      >
        <div className={cn("flex-shrink-0 transition-colors", active ? "text-[#3B82F6]" : "group-hover:text-[#0F172A]")}>
          {icon}
        </div>
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-3 flex-1 flex items-center justify-between overflow-hidden"
          >
            <span className="text-sm font-bold whitespace-nowrap">{label}</span>
            <div className="flex items-center gap-2">
              {tag && (
                <Badge className={cn(
                  "text-[9px] h-4 px-1 border-none font-black",
                  tag === 'PRO' ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "bg-[#A855F7]/10 text-[#A855F7]"
                )}>
                  {tag}
                </Badge>
              )}
              {hasDropdown && (
                <ChevronDown size={14} className={cn("opacity-40 transition-transform", isOpen ? "rotate-180" : "")} />
              )}
              {active && indicator && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </div>
          </motion.div>
        )}
      </button>
      {isOpen && !collapsed && children}
    </div>
  );
}


function NewsItem({ country, title, time }: { country: string; title: string; time: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-3 bg-muted rounded-sm overflow-hidden flex items-center justify-center text-[8px] font-bold text-muted-foreground border border-border">
        {country}
      </div>
      <span className="text-[11px] font-bold text-[#0F172A]">{title}</span>
      <span className="text-[11px] text-muted-foreground">{time}</span>
      <div className="w-1 h-1 rounded-full bg-muted mx-2" />
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtext, 
  icon, 
  variant = 'white',
  tag,
  showProgress = false
}: { 
  title: string; 
  value: string; 
  subtext?: string; 
  icon: React.ReactNode; 
  variant?: 'white' | 'blue';
  tag?: string;
  showProgress?: boolean;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 group hover:shadow-xl",
      variant === 'blue' 
        ? "bg-[#EFF6FF] border-[#3B82F6]/20 shadow-lg shadow-blue-500/5" 
        : "bg-white border-[#3B82F6]/20 shadow-lg shadow-blue-500/5"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          variant === 'blue' ? "bg-[#3B82F6] text-white" : "bg-[#F8FAFC] text-[#3B82F6] border border-border"
        )}>
          {icon}
        </div>
        {tag && (
          <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-none text-[10px] font-black h-5 px-2">
            {tag}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <p className={cn(
          "text-3xl font-black tracking-tight",
          variant === 'blue' ? "text-[#3B82F6]" : "text-[#0F172A]"
        )}>
          {value}
        </p>
        {subtext && (
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <ChevronRight size={12} className="text-[#3B82F6]" />
            <span className="text-xs font-medium">{subtext}</span>
          </div>
        )}
        {showProgress && (
          <div className="mt-6 h-1.5 w-full bg-[#F8FAFC] rounded-full overflow-hidden">
            <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: '100%' }} />
          </div>
        )}
      </div>
      {variant === 'blue' && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#3B82F6]/5 rounded-full blur-2xl" />
      )}
    </div>
  );
}

function TradeLogView({ 
  trades, 
  onBack, 
  onEditTrade 
}: { 
  trades: Trade[]; 
  onBack: () => void; 
  onEditTrade: (trade: Trade) => void;
}) {
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'All' | 'Active' | 'Closed'>('All');

  const filteredTrades = React.useMemo(() => {
    return trades.filter(t => {
      const matchesSearch = t.asset.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.strategy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trades, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Asset', 'Side', 'Size', 'Entry', 'Exit', 'PnL', 'PnL %', 'Strategy', 'Status'];
    const rows = filteredTrades.map(t => [
      format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm'),
      t.asset,
      t.side,
      t.size,
      t.entryPrice,
      t.exitPrice || '',
      t.pnl || 0,
      t.pnlPercent || 0,
      t.strategy || '',
      t.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trading_journal_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden dark">
      {/* Header */}
      <header className="h-16 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Trade Log</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Journal / Trade Log</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? "bg-background shadow-sm text-bento-accent" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid' ? "bg-background shadow-sm text-bento-accent" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[120px] h-9 bg-card border-border text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-border gap-2">
            <Download size={14} /> Export
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">All Trades ({filteredTrades.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search assets, strategies..." 
                className="pl-9 h-9 bg-card border-border text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/10">
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Date</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Asset</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Side</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Account</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Strategy</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Entry</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Exit</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">TP/SL</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">PnL ($)</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">PnL (%)</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Score</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Notes</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredTrades.map((trade) => (
                      <tr 
                        key={trade.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => onEditTrade(trade)}
                      >
                        <td className="py-4 px-4 text-xs whitespace-nowrap">
                          <div className="font-medium">{format(new Date(trade.timestamp), 'MMM dd, yyyy')}</div>
                          <div className="text-[10px] text-muted-foreground">{format(new Date(trade.timestamp), 'HH:mm:ss')}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-sm">{trade.asset}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            trade.side === 'Long' ? "bg-bento-green/10 text-bento-green" : "bg-bento-red/10 text-bento-red"
                          )}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">{trade.account || '—'}</td>
                        <td className="py-4 px-4 text-xs font-medium">{trade.strategy || '—'}</td>
                        <td className="py-4 px-4 text-right font-mono text-xs">{trade.entryPrice.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-mono text-xs">{trade.exitPrice?.toLocaleString() || '—'}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="text-[10px] font-mono opacity-60">
                            {trade.tp ? (trade.tp/1000).toFixed(1) + 'k' : '—'} / {trade.sl ? (trade.sl/1000).toFixed(1) + 'k' : '—'}
                          </div>
                        </td>
                        <td className={cn(
                          "py-4 px-4 text-right font-bold font-mono text-sm",
                          (trade.pnl || 0) >= 0 ? "text-bento-green" : "text-bento-red"
                        )}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toLocaleString()}
                        </td>
                        <td className={cn(
                          "py-4 px-4 text-right font-medium font-mono text-xs",
                          (trade.pnlPercent || 0) >= 0 ? "text-bento-green" : "text-bento-red"
                        )}>
                          {(trade.pnlPercent || 0) >= 0 ? '+' : ''}{(trade.pnlPercent || 0).toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-xs font-bold text-bento-accent">{trade.setupScore || '0'}/10</span>
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                          {trade.notes || '—'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-2 py-0.5 border-none",
                            trade.status === 'Active' ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground"
                          )}>
                            {trade.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTrades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  onClick={() => onEditTrade(trade)}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-lg cursor-pointer group hover:border-bento-accent/50 transition-all"
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {trade.thumbnails && trade.thumbnails.length > 0 ? (
                      <img 
                        src={trade.thumbnails[0]} 
                        alt={trade.asset} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <LayoutGrid size={48} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className={cn(
                        "text-[9px] px-1.5 py-0 border-none backdrop-blur-md",
                        trade.status === 'Active' ? "bg-blue-500/20 text-blue-400" : "bg-black/40 text-white/70"
                      )}>
                        {trade.status}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-md",
                        trade.side === 'Long' ? "bg-bento-green/20 text-bento-green" : "bg-bento-red/20 text-bento-red"
                      )}>
                        {trade.side}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg leading-none">{trade.asset}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(trade.timestamp), 'MMM dd, yyyy • HH:mm')}</p>
                      </div>
                      <div className={cn(
                        "text-right font-bold font-mono",
                        (trade.pnl || 0) >= 0 ? "text-bento-green" : "text-bento-red"
                      )}>
                        <div className="text-sm">{(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toLocaleString()}</div>
                        <div className="text-[10px]">{(trade.pnl || 0) >= 0 ? '+' : ''}{(trade.pnlPercent || 0).toFixed(2)}%</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Strategy</p>
                        <p className="text-xs font-medium truncate">{trade.strategy || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</p>
                        <p className="text-xs font-bold text-bento-accent">{trade.setupScore || '0'}/10</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        {trade.notes ? `"${trade.notes}"` : 'No notes available.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {trades.length === 0 && (
            <div className="py-20 text-center bg-card border border-border rounded-xl">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Book size={40} className="opacity-20" />
                <p className="text-sm">No trades found in your log.</p>
                <Button variant="link" onClick={onBack} className="text-bento-accent">Go back to dashboard</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RiskCalculator({ onBack }: { onBack: () => void }) {
  const [activeTool, setActiveTool] = React.useState<'risk' | 'drawdown' | 'compounding'>('risk');
  const [balance, setBalance] = React.useState(10000);
  const [riskPercent, setRiskPercent] = React.useState(1);
  const [stopLossPips, setStopLossPips] = React.useState(20);
  const [pipValue, setPipValue] = React.useState(10);

  // Drawdown Recovery state
  const [drawdownPercent, setDrawdownPercent] = React.useState(10);
  const recoveryNeeded = (100 / (100 - drawdownPercent) - 1) * 100;

  // Compounding state
  const [monthlyReturn, setMonthlyReturn] = React.useState(5);
  const [months, setMonths] = React.useState(12);
  const compoundedBalance = balance * Math.pow(1 + monthlyReturn / 100, months);

  const riskAmount = (balance * riskPercent) / 100;
  const positionSize = riskAmount / (stopLossPips * pipValue);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
      <header className="h-[72px] bg-white flex items-center justify-between px-8 border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-[#0F172A]">Trading Tools</h2>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-border w-fit">
          <button 
            onClick={() => setActiveTool('risk')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTool === 'risk' ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-[#0F172A]"
            )}
          >
            Risk Calculator
          </button>
          <button 
            onClick={() => setActiveTool('drawdown')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTool === 'drawdown' ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-[#0F172A]"
            )}
          >
            Drawdown Recovery
          </button>
          <button 
            onClick={() => setActiveTool('compounding')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTool === 'compounding' ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-[#0F172A]"
            )}
          >
            Compounding
          </button>
        </div>

        {activeTool === 'risk' && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Account Balance ($)</Label>
                <Input 
                  type="number" 
                  value={balance} 
                  onChange={(e) => setBalance(parseFloat(e.target.value))}
                  className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Risk Percentage (%)</Label>
                <Input 
                  type="number" 
                  value={riskPercent} 
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                  className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Stop Loss (Pips/Points)</Label>
                <Input 
                  type="number" 
                  value={stopLossPips} 
                  onChange={(e) => setStopLossPips(parseFloat(e.target.value))}
                  className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Pip Value ($ per lot)</Label>
                <Input 
                  type="number" 
                  value={pipValue} 
                  onChange={(e) => setPipValue(parseFloat(e.target.value))}
                  className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex justify-between items-center p-4 bg-[#EFF6FF] rounded-xl border border-[#3B82F6]/20">
                <span className="text-sm font-bold text-[#1E40AF]">Risk Amount</span>
                <span className="text-xl font-black text-[#1E40AF]">${riskAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-6 bg-[#3B82F6] rounded-xl text-white shadow-lg shadow-blue-500/20">
                <div className="space-y-1">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Recommended Position Size</span>
                  <p className="text-sm opacity-90">Standard Lots</p>
                </div>
                <span className="text-3xl font-black">{positionSize.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'drawdown' && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
            <div className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Current Drawdown (%)</Label>
              <Input 
                type="number" 
                value={drawdownPercent} 
                onChange={(e) => setDrawdownPercent(parseFloat(e.target.value))}
                className="h-12 rounded-xl border-border bg-[#F8FAFC]"
              />
              <div className="h-2 w-full bg-[#F8FAFC] rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${drawdownPercent}%` }} />
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="p-8 bg-red-50 rounded-2xl border border-red-100 text-center space-y-2">
                <p className="text-sm font-bold text-red-800 uppercase tracking-widest">Recovery Needed</p>
                <h3 className="text-4xl font-black text-red-600">{recoveryNeeded.toFixed(1)}%</h3>
                <p className="text-xs text-red-700/70 max-w-[240px] mx-auto">
                  You need a {recoveryNeeded.toFixed(1)}% gain to return to your initial balance.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'compounding' && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Initial Balance ($)</Label>
                <Input 
                  type="number" 
                  value={balance} 
                  onChange={(e) => setBalance(parseFloat(e.target.value))}
                  className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Monthly Return (%)</Label>
                <Input 
                  type="number" 
                  value={monthlyReturn} 
                  onChange={(e) => setMonthlyReturn(parseFloat(e.target.value))}
                  className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Months</Label>
                <Input 
                  type="number" 
                  value={months} 
                  onChange={(e) => setMonths(parseFloat(e.target.value))}
                  className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="p-8 bg-green-50 rounded-2xl border border-green-100 text-center space-y-2">
                <p className="text-sm font-bold text-green-800 uppercase tracking-widest">Projected Balance</p>
                <h3 className="text-4xl font-black text-green-600">${compoundedBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
                <p className="text-xs text-green-700/70">
                  Total Profit: ${(compoundedBalance - balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function SettingsView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = React.useState<'accounts' | 'integrations' | 'rules' | 'profile'>('accounts');
  const [mtVersion, setMtVersion] = React.useState<'MT4' | 'MT5'>('MT5');
  const [tradingRules, setTradingRules] = React.useState<string[]>([
    "Only trade London & NY sessions",
    "Max risk 1% per trade",
    "Wait for 3 confluences",
    "No revenge trading"
  ]);
  const [newRule, setNewRule] = React.useState('');

  const addRule = () => {
    if (newRule.trim()) {
      setTradingRules([...tradingRules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setTradingRules(tradingRules.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
      <header className="h-[72px] bg-white flex items-center justify-between px-8 border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-[#0F172A]">Settings</h2>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-border w-fit">
          <button 
            onClick={() => setActiveTab('accounts')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'accounts' ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-[#0F172A]"
            )}
          >
            Trading Accounts
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'integrations' ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-[#0F172A]"
            )}
          >
            Integrations
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'rules' ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-[#0F172A]"
            )}
          >
            Trading Rules
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'profile' ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-[#0F172A]"
            )}
          >
            Profile
          </button>
        </div>

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Connected Accounts</h3>
                  <p className="text-sm text-muted-foreground">Manage your trading accounts and sync data.</p>
                </div>
                <Button className="bg-[#3B82F6] hover:bg-[#2563EB] rounded-xl gap-2">
                  <Plus size={18} />
                  Add Account
                </Button>
              </div>

              <div className="space-y-4">
                {[
                  { id: 1, name: 'Main MT5 Live', broker: 'IC Markets', balance: '$12,450.00', status: 'Connected', version: 'MT5' },
                  { id: 2, name: 'Prop Firm Challenge', broker: 'FTMO', balance: '$100,000.00', status: 'Syncing', version: 'MT4' }
                ].map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-border group hover:border-[#3B82F6]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center text-[#3B82F6] font-bold">
                        {account.version}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0F172A]">{account.name}</h4>
                        <p className="text-xs text-muted-foreground">{account.broker} • {account.balance}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold uppercase",
                        account.status === 'Connected' ? "bg-green-500/10 text-green-600 border-green-200" : "bg-blue-500/10 text-blue-600 border-blue-200"
                      )}>
                        {account.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings size={18} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#EFF6FF] border border-[#3B82F6]/20 rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E40AF]">Auto-Sync Analytics</h4>
                  <p className="text-sm text-[#1E40AF]/80 mt-1">
                    Connected accounts automatically feed into your Journal, Performance, and P&L analytics. No manual entry required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              <div className="max-w-md mx-auto text-center space-y-6">
                <div className="flex justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-border flex items-center justify-center text-[#3B82F6] font-black text-xl">
                    MT4
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-border flex items-center justify-center text-[#3B82F6] font-black text-xl">
                    MT5
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#0F172A]">MetaTrader Integration</h3>
                  <p className="text-muted-foreground mt-2">Connect your MetaTrader 4 or 5 account for real-time data synchronization.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-1 bg-[#F8FAFC] rounded-xl border border-border">
                  <button 
                    onClick={() => setMtVersion('MT4')}
                    className={cn(
                      "py-2 rounded-lg text-sm font-bold transition-all",
                      mtVersion === 'MT4' ? "bg-white text-[#3B82F6] shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    MT4
                  </button>
                  <button 
                    onClick={() => setMtVersion('MT5')}
                    className={cn(
                      "py-2 rounded-lg text-sm font-bold transition-all",
                      mtVersion === 'MT5' ? "bg-white text-[#3B82F6] shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    MT5
                  </button>
                </div>

                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Server Name</label>
                    <Input placeholder="e.g. ICMarkets-Live01" className="h-12 rounded-xl border-border bg-[#F8FAFC]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Login ID</label>
                    <Input placeholder="Account Number" className="h-12 rounded-xl border-border bg-[#F8FAFC]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Investor Password</label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-border bg-[#F8FAFC]" />
                  </div>
                </div>

                <Button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] h-12 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20">
                  Connect {mtVersion} Account
                </Button>

                <p className="text-[10px] text-muted-foreground">
                  By connecting, you agree to our data sync terms. We use read-only investor access to protect your account.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">Discipline & Rules</h3>
                  <p className="text-sm text-muted-foreground">Define your trading rules. Every trade will be checked against these.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a new rule (e.g. Max 2 trades per day)" 
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRule()}
                    className="h-12 rounded-xl border-border bg-[#F8FAFC]"
                  />
                  <Button onClick={addRule} className="bg-[#3B82F6] hover:bg-[#2563EB] h-12 px-6 rounded-xl font-bold">
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-2">
                  {tradingRules.map((rule, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-border group">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center text-[10px] font-bold text-[#3B82F6]">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-[#0F172A]">{rule}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeRule(i)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#F0FDF4] border border-green-200 rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-green-800">Rule Enforcement Active</h4>
                  <p className="text-sm text-green-700/80 mt-1">
                    The AI Agent will track your discipline score based on how well you follow these rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyView({ trades, onBack }: { trades: Trade[], onBack: () => void }) {
  const strategies = Array.from(new Set(trades.map(t => t.strategy || 'None')));
  
  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
      <header className="h-[72px] bg-white flex items-center justify-between px-8 border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-black text-[#0F172A]">Strategy Management</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Track & Optimize your edges</p>
          </div>
        </div>
        <Button className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 gap-2">
          <Plus size={16} />
          New Strategy
        </Button>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map(strat => {
            const stratTrades = trades.filter(t => (t.strategy || 'None') === strat);
            const pnl = stratTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
            const winRate = stratTrades.length > 0 ? (stratTrades.filter(t => (t.pnl || 0) > 0).length / stratTrades.length) * 100 : 0;
            
            return (
              <div key={strat} className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6 group hover:border-[#3B82F6]/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                    <LayoutTemplate size={20} />
                  </div>
                  <Badge className={cn(
                    "text-[10px] font-bold uppercase",
                    pnl >= 0 ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"
                  )}>
                    {pnl >= 0 ? 'Profitable' : 'Losing'}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#0F172A]">{strat}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{stratTrades.length} trades logged</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">WIN RATE</p>
                    <p className="text-sm font-black text-[#0F172A]">{winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">TOTAL P&L</p>
                    <p className={cn("text-sm font-black", pnl >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
                      ${pnl.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-border text-xs font-bold h-10 group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-[#3B82F6] transition-all">
                  View Detailed Stats
                </Button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function AIAgentView({ trades, onBack }: { trades: Trade[], onBack: () => void }) {
  const [analysis, setAnalysis] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'ai', content: string }[]>([]);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeTradingPerformance(trades);
    setAnalysis(result);
    setLoading(false);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setLoading(true);
    const aiMsg = await getTradingPsychologyAdvice(userMsg, trades);
    setChatHistory(prev => [...prev, { role: 'ai', content: aiMsg }]);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
      <header className="h-[72px] bg-white flex items-center justify-between px-8 border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-black text-[#0F172A]">AI Trading Agent</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Coaching & Performance Analysis</p>
          </div>
        </div>
        <Button 
          onClick={handleAnalyze} 
          disabled={loading}
          className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 gap-2"
        >
          <Sparkles size={16} />
          {loading ? 'Analyzing...' : 'Generate New Analysis'}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Analysis Section */}
          <div className="bg-white border border-[#3B82F6]/20 rounded-2xl p-8 shadow-lg shadow-blue-500/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl font-black text-[#0F172A]">Performance Insights</h2>
            </div>
            
            {analysis ? (
              <div className="prose prose-slate max-w-none">
                <div className="bg-[#F8FAFC] p-6 rounded-xl border border-border whitespace-pre-wrap text-sm leading-relaxed text-[#0F172A]">
                  {analysis}
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Sparkles size={48} className="text-muted-foreground" />
                <p className="text-sm font-medium max-w-[280px]">
                  Click "Generate New Analysis" to let the AI analyze your trading patterns.
                </p>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="bg-white border border-border rounded-2xl flex flex-col h-[500px] shadow-sm">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-muted-foreground">
                <MessageSquare size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Psychology Coach</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <MessageSquare size={48} className="text-muted-foreground" />
                  <p className="text-xs font-medium">Ask me anything about your trading psychology or strategy.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col max-w-[80%] space-y-1",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm",
                    msg.role === 'user' ? "bg-[#3B82F6] text-white rounded-tr-none" : "bg-[#F8FAFC] border border-border text-[#0F172A] rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">
                    {msg.role === 'user' ? 'You' : 'AI Coach'}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-border flex gap-2">
              <Input 
                placeholder="Type your question..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="bg-[#F8FAFC] border-border h-12"
              />
              <Button type="submit" size="icon" className="h-12 w-12 bg-[#3B82F6] text-white">
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickTradeModal({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (trade: Partial<Trade>) => void;
}) {
  const [asset, setAsset] = React.useState('EUR/USD');
  const [side, setSide] = React.useState<'Long' | 'Short'>('Long');
  const [entryPrice, setEntryPrice] = React.useState('');
  const [exitPrice, setExitPrice] = React.useState('');
  const [size, setSize] = React.useState('0.1');

  if (!isOpen) return null;

  const handleSave = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const sizeNum = parseFloat(size);

    if (isNaN(entry) || isNaN(sizeNum)) return;

    onSave({
      asset,
      side,
      entryPrice: entry,
      exitPrice: isNaN(exit) ? undefined : exit,
      size,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
        >
          <div className="p-6 border-b border-border flex items-center justify-between bg-[#F8FAFC]">
            <div>
              <h3 className="text-lg font-black text-[#0F172A]">Quick Trade Entry</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Fast execution log</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
              <X size={20} />
            </Button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset</Label>
                <Input 
                  value={asset} 
                  onChange={(e) => setAsset(e.target.value)}
                  placeholder="e.g. GBP/USD"
                  className="h-11 rounded-xl border-border bg-[#F8FAFC] font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Side</Label>
                <Select value={side} onValueChange={(v: any) => setSide(v)}>
                  <SelectTrigger className="h-11 rounded-xl border-border bg-[#F8FAFC] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Long" className="font-bold text-blue-600">Long</SelectItem>
                    <SelectItem value="Short" className="font-bold text-red-600">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Entry Price</Label>
                <Input 
                  type="number"
                  step="0.00001"
                  value={entryPrice} 
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="0.0000"
                  className="h-11 rounded-xl border-border bg-[#F8FAFC] font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Exit Price (Optional)</Label>
                <Input 
                  type="number"
                  step="0.00001"
                  value={exitPrice} 
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="0.0000"
                  className="h-11 rounded-xl border-border bg-[#F8FAFC] font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Position Size (Lots)</Label>
              <Input 
                type="number"
                step="0.01"
                value={size} 
                onChange={(e) => setSize(e.target.value)}
                placeholder="0.10"
                className="h-11 rounded-xl border-border bg-[#F8FAFC] font-bold"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:text-[#0F172A]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="flex-1 h-12 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                Save Trade
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TradeAnalysisView({ trades, onBack }: { trades: Trade[], onBack: () => void }) {
  const closedTrades = trades.filter(t => t.status === 'Closed');
  
  const assetPerformance = React.useMemo(() => {
    const map = new Map<string, { pnl: number, trades: number, wins: number }>();
    closedTrades.forEach(t => {
      const current = map.get(t.asset) || { pnl: 0, trades: 0, wins: 0 };
      map.set(t.asset, {
        pnl: current.pnl + (t.pnl || 0),
        trades: current.trades + 1,
        wins: current.wins + ((t.pnl || 0) > 0 ? 1 : 0)
      });
    });
    return Array.from(map.entries()).map(([asset, stats]) => ({
      asset,
      ...stats,
      winRate: (stats.wins / stats.trades) * 100
    })).sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  const strategyPerformance = React.useMemo(() => {
    const map = new Map<string, { pnl: number, trades: number, wins: number }>();
    closedTrades.forEach(t => {
      const strategy = t.strategy || 'None';
      const current = map.get(strategy) || { pnl: 0, trades: 0, wins: 0 };
      map.set(strategy, {
        pnl: current.pnl + (t.pnl || 0),
        trades: current.trades + 1,
        wins: current.wins + ((t.pnl || 0) > 0 ? 1 : 0)
      });
    });
    return Array.from(map.entries()).map(([strategy, stats]) => ({
      strategy,
      ...stats,
      winRate: (stats.wins / stats.trades) * 100
    })).sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
      <header className="h-[72px] bg-white flex items-center justify-between px-8 border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-[#0F172A]">Trade Analysis</h2>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asset Performance */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-[#0F172A]">Asset Performance</h3>
            </div>
            <div className="space-y-4">
              {assetPerformance.map((item) => (
                <div key={item.asset} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-border">
                  <div>
                    <p className="font-bold text-[#0F172A]">{item.asset}</p>
                    <p className="text-[10px] text-muted-foreground">{item.trades} trades • {item.winRate.toFixed(1)}% win rate</p>
                  </div>
                  <span className={cn("font-bold", item.pnl >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
                    ${item.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
              {assetPerformance.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No data available</p>}
            </div>
          </div>

          {/* Strategy Performance */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-[#0F172A]">Strategy Performance</h3>
            </div>
            <div className="space-y-4">
              {strategyPerformance.map((item) => (
                <div key={item.strategy} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-border">
                  <div>
                    <p className="font-bold text-[#0F172A]">{item.strategy}</p>
                    <p className="text-[10px] text-muted-foreground">{item.trades} trades • {item.winRate.toFixed(1)}% win rate</p>
                  </div>
                  <span className={cn("font-bold", item.pnl >= 0 ? "text-[#3B82F6]" : "text-[#EF4444]")}>
                    ${item.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
              {strategyPerformance.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No data available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
