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
  Menu,
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
  Star,
  BarChart2,
  Fingerprint,
  Brain,
  Layers,
  FolderPlus,
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
  Users,
  Edit3,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMultipleQuotes, MarketQuote } from '../services/marketService';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PerformanceView } from './PerformanceView';
import { TradeJournalView } from './TradeJournalView';
import { AdvancedSelfReviewView } from './AdvancedSelfReview.tsx';
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
  deleteDoc,
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
  const [view, setView] = React.useState<'dashboard' | 'trade-form' | 'trade-log' | 'daily-journal' | 'performance' | 'trade-analysis' | 'trade-journal' | 'market' | 'settings' | 'risk-calculator' | 'ai-agent' | 'strategies' | 'advanced-self-review'>('dashboard');
  const [journalEntries, setJournalEntries] = React.useState<{id: string, date: string, content: string, type: 'free' | 'structured'}[]>([]);
  const [pulses, setPulses] = React.useState<{id: string, timestamp: string, mood: string, note: string}[]>([]);
  const [selectedTradeForEdit, setSelectedTradeForEdit] = React.useState<Trade | undefined>(undefined);
  const [selectedTradeId, setSelectedTradeId] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [marketQuotes, setMarketQuotes] = React.useState<MarketQuote[]>([]);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [timeFormat, setTimeFormat] = React.useState<'HH:mm:ss a' | 'HH:mm' | 'MMM dd, HH:mm'>('HH:mm:ss a');
  const [isQuickTradeOpen, setIsQuickTradeOpen] = React.useState(false);
  const [dashboardTab, setDashboardTab] = React.useState<'overview' | 'calendar'>('overview');
  const [userStrategies, setUserStrategies] = React.useState<any[]>([]);
  const [preTradeRules, setPreTradeRules] = React.useState<any[]>([
    { id: '1', text: 'HTF Trend Alignment', checked: false },
    { id: '2', text: 'Key Level Interaction', checked: false },
    { id: '3', text: 'Volume Confirmation', checked: false }
  ]);

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
        userStrategies={userStrategies}
      />
    );
  }

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden relative transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A] text-slate-200" : "bg-[#F8FAFC] text-foreground"
    )}>
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
          "fixed inset-y-0 left-0 z-50 lg:relative flex flex-col transition-transform duration-300 lg:translate-x-0 border-r",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border/50"
        )}
      >
        <div className="py-8 px-4 overflow-hidden flex items-center justify-between">
          <div className={cn(
            "flex items-center transition-all duration-300",
            isSidebarCollapsed ? "justify-center" : "justify-start px-2"
          )}>
            <span className={cn(
              "text-xl font-black tracking-tighter whitespace-nowrap transition-colors",
              isDarkMode ? "text-white" : "text-[#0F172A]"
            )}>
              {isSidebarCollapsed ? "TD" : "Trading Diary"}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("lg:hidden rounded-full h-8 w-8", isDarkMode && "text-slate-400 hover:text-white")}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "absolute -right-3 top-10 w-6 h-6 border rounded-full flex items-center justify-center transition-all shadow-sm z-[60]",
            isDarkMode 
              ? "bg-[#1E293B] border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 hover:bg-slate-800" 
              : "bg-white border-border text-muted-foreground hover:text-[#0F172A] hover:border-[#3B82F6] hover:bg-blue-50"
          )}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-4">
            <SidebarItem 
              icon={<LayoutGrid size={20} />} 
              label="Dashboard" 
              active={view === 'dashboard'} 
              collapsed={isSidebarCollapsed} 
              onClick={() => setView('dashboard')}
              isDarkMode={isDarkMode}
            />
            <SidebarItem 
              icon={<Wallet size={20} />} 
              label="Trades" 
              active={view === 'trade-log'}
              collapsed={isSidebarCollapsed} 
              onClick={() => setView('trade-log')}
              isDarkMode={isDarkMode}
            />
            <SidebarItem 
              icon={<Book size={20} />} 
              label="Journal" 
              active={view === 'daily-journal' || view === 'trade-journal' || view === 'advanced-self-review'}
              collapsed={isSidebarCollapsed} 
              hasDropdown
              isDarkMode={isDarkMode}
            >
              {!isSidebarCollapsed && (
                <div className="ml-9 mt-1 space-y-1">
                  <button 
                    onClick={() => setView('daily-journal')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'daily-journal' 
                        ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                        : (isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]")
                    )}
                  >
                    Daily Journal
                  </button>
                  <button 
                    onClick={() => setView('trade-journal')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'trade-journal' 
                        ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                        : (isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]")
                    )}
                  >
                    Trade Journal
                  </button>
                  <button 
                    onClick={() => setView('advanced-self-review')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'advanced-self-review' 
                        ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                        : (isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]")
                    )}
                  >
                    Advanced Self Review
                  </button>
                  <button 
                    onClick={() => setView('strategies')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'strategies' 
                        ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                        : (isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]")
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
              isDarkMode={isDarkMode}
            >
              {!isSidebarCollapsed && (
                <div className="ml-9 mt-1 space-y-1">
                  <button 
                    onClick={() => setView('performance')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'performance' 
                        ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                        : (isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]")
                    )}
                  >
                    Performance
                  </button>
                  <button 
                    onClick={() => setView('trade-analysis')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      view === 'trade-analysis' 
                        ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]") 
                        : (isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground hover:text-[#0F172A] hover:bg-[#F8FAFC]")
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
              isDarkMode={isDarkMode}
            />
            <SidebarItem 
              icon={<Sparkles size={20} />} 
              label="AI Agent" 
              collapsed={isSidebarCollapsed} 
              active={view === 'ai-agent'}
              onClick={() => setView('ai-agent')}
              isDarkMode={isDarkMode}
            />
            <SidebarItem icon={<Zap size={20} />} label="Backtesting" collapsed={isSidebarCollapsed} isDarkMode={isDarkMode} />
            <SidebarItem icon={<Users size={20} />} label="Traders Lounge" collapsed={isSidebarCollapsed} isDarkMode={isDarkMode} />
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Tools" 
              collapsed={isSidebarCollapsed} 
              active={view === 'risk-calculator'}
              onClick={() => setView('risk-calculator')}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="mt-8 space-y-4">
            <SidebarCategory label="SUPPORT" collapsed={isSidebarCollapsed} isDarkMode={isDarkMode}>
              <SidebarItem 
                icon={<Settings size={20} />} 
                label="Settings" 
                collapsed={isSidebarCollapsed} 
                active={view === 'settings'}
                onClick={() => setView('settings')}
                isDarkMode={isDarkMode}
              />
              <SidebarItem icon={<HelpCircle size={20} />} label="Help & Support" collapsed={isSidebarCollapsed} isDarkMode={isDarkMode} />
              <SidebarItem icon={<CreditCard size={20} />} label="Subscription" collapsed={isSidebarCollapsed} isDarkMode={isDarkMode} />
            </SidebarCategory>
          </div>
        </ScrollArea>

        <div className="mt-auto p-3 space-y-2">
          <SidebarItem 
            icon={isDarkMode ? <Sun size={20} /> : <Moon size={20} />} 
            label={isDarkMode ? "Light Mode" : "Dark Mode"} 
            collapsed={isSidebarCollapsed} 
            onClick={() => setIsDarkMode(!isDarkMode)}
            isDarkMode={isDarkMode}
          />
          {user && (
            <SidebarItem 
              icon={<LogOut size={20} />} 
              label="Logout" 
              collapsed={isSidebarCollapsed} 
              onClick={handleLogout} 
              isDarkMode={isDarkMode}
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
            isDarkMode={isDarkMode}
            preTradeRules={preTradeRules}
            setPreTradeRules={setPreTradeRules}
          />
        ) : view === 'trade-analysis' ? (
          <TradeAnalysisView trades={trades} onBack={() => setView('dashboard')} isDarkMode={isDarkMode} />
        ) : view === 'daily-journal' ? (
          <DailyJournalView 
            onBack={() => setView('dashboard')} 
            entries={journalEntries}
            pulses={pulses}
            onAddEntry={(entry) => setJournalEntries(prev => [entry, ...prev])}
            onAddPulse={(pulse) => setPulses(prev => [pulse, ...prev])}
            isDarkMode={isDarkMode}
          />
        ) : view === 'trade-journal' ? (
          <TradeJournalView 
            trades={trades} 
            onBack={() => setView('dashboard')} 
            onSave={handleSaveJournal}
            isDarkMode={isDarkMode}
          />
        ) : view === 'market' ? (
          <MarketView onBack={() => setView('dashboard')} isDarkMode={isDarkMode} />
        ) : view === 'performance' ? (
          <PerformanceView trades={trades} onBack={() => setView('dashboard')} isDarkMode={isDarkMode} />
        ) : view === 'settings' ? (
          <SettingsView onBack={() => setView('dashboard')} isDarkMode={isDarkMode} />
        ) : view === 'risk-calculator' ? (
          <RiskCalculator onBack={() => setView('dashboard')} isDarkMode={isDarkMode} />
        ) : view === 'ai-agent' ? (
          <AIAgentView trades={trades} onBack={() => setView('dashboard')} isDarkMode={isDarkMode} />
        ) : view === 'strategies' ? (
          <StrategyView 
            trades={trades} 
            onBack={() => setView('dashboard')} 
            isDarkMode={isDarkMode}
            userStrategies={userStrategies}
          />
        ) : view === 'advanced-self-review' ? (
          <AdvancedSelfReviewView onBack={() => setView('dashboard')} isDarkMode={isDarkMode} />
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
            <header className={cn(
              "h-[72px] flex items-center justify-between px-4 lg:px-8 z-10 border-b transition-colors duration-300",
              isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-border/50"
            )}>
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("lg:hidden rounded-xl h-10 w-10", isDarkMode && "text-slate-400 hover:text-white")}
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={24} />
                </Button>

                <div 
                  className={cn(
                    "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border h-10 cursor-pointer transition-colors",
                    isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-[#F8FAFC] border-border text-[#0F172A] hover:bg-muted"
                  )}
                  onClick={iterateTimeFormat}
                  title="Click to cycle time format"
                >
                  <Clock size={16} className="text-muted-foreground" />
                  <span className={cn("text-sm font-bold", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{format(currentTime, timeFormat)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={cn(
                    "p-2 sm:p-2.5 border rounded-xl transition-colors h-10 w-10 flex items-center justify-center",
                    isDarkMode ? "bg-[#0F172A] border-slate-700 text-[#F59E0B] hover:bg-slate-800" : "bg-[#F8FAFC] border-border text-[#F59E0B] hover:bg-muted"
                  )}
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <Button 
                  onClick={() => setIsQuickTradeOpen(true)}
                  variant="outline"
                  className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10 font-bold rounded-xl px-3 sm:px-6 h-10 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Quick Entry</span>
                  <Zap size={16} className="sm:hidden" />
                </Button>

                <Button 
                  onClick={() => setView('trade-form')}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl px-3 sm:px-6 h-10 shadow-lg shadow-blue-500/20 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Add Trade</span>
                  <Plus size={16} className="sm:hidden" />
                </Button>
              </div>
            </header>

        {/* Dashboard Grid */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 sm:p-8 transition-colors duration-300",
          isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
        )}>
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Dashboard Tabs Toggle */}
            <div className="flex justify-start">
              <div className={cn(
                "inline-flex p-1 rounded-2xl border shadow-sm transition-colors",
                isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-[#F1F5F9] border-slate-200"
              )}>
                <button
                  onClick={() => setDashboardTab('overview')}
                  className={cn(
                    "px-10 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                    dashboardTab === 'overview' 
                      ? (isDarkMode ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-white text-[#0F172A] shadow-sm ring-1 ring-slate-200") 
                      : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setDashboardTab('calendar')}
                  className={cn(
                    "px-10 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                    dashboardTab === 'calendar' 
                      ? (isDarkMode ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-white text-[#0F172A] shadow-sm ring-1 ring-slate-200") 
                      : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-900")
                  )}
                >
                  Calendar
                </button>
              </div>
            </div>

            {dashboardTab === 'overview' ? (
              <>
                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <MetricCard 
                title="TOTAL P&L" 
                value={`${metrics.totalPnl >= 0 ? '+' : ''}$${metrics.totalPnl.toLocaleString()}`} 
                subtext={`${metrics.totalTrades} trades`} 
                icon={<DollarSign size={20} />} 
                variant="blue"
                tag="TOTAL"
                isDarkMode={isDarkMode}
              />
              <MetricCard 
                title="UNREALIZED" 
                value={`${metrics.unrealizedPnl >= 0 ? '+' : ''}$${metrics.unrealizedPnl.toLocaleString()}`} 
                subtext={`${metrics.openTrades} open`} 
                icon={<Clock size={20} />} 
                variant="yellow"
                isDarkMode={isDarkMode}
              />
              <MetricCard 
                title="REALIZED" 
                value={`${metrics.realizedPnl >= 0 ? '+' : ''}$${metrics.realizedPnl.toLocaleString()}`} 
                subtext={`${metrics.closedTrades} closed`} 
                icon={<CheckCircle2 size={20} />} 
                variant="blue-light"
                isDarkMode={isDarkMode}
              />
              <MetricCard 
                title="WIN RATE" 
                value={`${metrics.winRate.toFixed(1)}%`} 
                icon={<Target size={20} />} 
                variant="purple"
                showProgress
                progress={metrics.winRate}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Performance Row */}
            <div className={cn(
              "border rounded-2xl p-5 sm:p-6 shadow-lg shadow-blue-500/5 transition-all duration-300",
              isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-[#3B82F6]/20"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600"
                  )}>
                    <BarChart2 size={18} />
                  </div>
                  <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>PERFORMANCE</h3>
                </div>
                <div className={cn(
                  "flex items-center p-1 rounded-xl border transition-colors w-fit self-end sm:self-auto",
                  isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border"
                )}>
                  {['1D', '1W', '1M', '3M', 'ALL'].map((tf) => (
                    <button 
                      key={tf}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all",
                        tf === '1W' 
                          ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20" 
                          : (isDarkMode ? "text-slate-500 hover:text-white" : "text-muted-foreground hover:text-[#0F172A]")
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-3xl font-black",
                    metrics.totalPnl >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                  )}>
                    {metrics.totalPnl >= 0 ? '+' : ''}${Math.abs(metrics.totalPnl).toLocaleString()}
                  </span>
                  <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-none font-bold text-xs">+12.4%</Badge>
                </div>
              </div>
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.equityCurve}>
                    <defs>
                      <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
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
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1E293B' : '#fff', 
                        borderRadius: '12px', 
                        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        color: isDarkMode ? '#fff' : '#0F172A'
                      }}
                      itemStyle={{ color: isDarkMode ? '#3B82F6' : '#3B82F6' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: isDarkMode ? '#94a3b8' : '#64748B' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
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
              <div className={cn(
                "border rounded-2xl p-6 shadow-lg shadow-blue-500/5 min-h-[320px] flex flex-col transition-all duration-300",
                isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-[#3B82F6]/20"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={cn("text-sm font-bold", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>Recent Activity</h3>
                  <span className="text-xs text-muted-foreground font-medium">0 trades</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center border transition-colors",
                    isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border"
                  )}>
                    <CalendarIcon size={32} className="opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No recent activity</p>
                </div>
              </div>

              <div className={cn(
                "border rounded-2xl p-6 shadow-lg shadow-blue-500/5 min-h-[320px] flex flex-col transition-all duration-300",
                isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-[#3B82F6]/20"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={cn("text-sm font-bold", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>Monthly P&L</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground font-medium">Monthly: <span className="text-[#10B981]">+$0.00</span></span>
                    <span className={cn("text-xs font-bold", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>April 2026</span>
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
          </>
        ) : (
          <TradingCalendar trades={trades} />
        )}
            </div>
          </div>
        </>
      )}

      {/* Floating Chat Button */}
      <button className="fixed bottom-24 lg:bottom-8 right-6 w-14 h-14 bg-[#0077B6] rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50 shadow-blue-500/20">
        <MessageSquare size={28} />
      </button>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex items-center justify-around px-2 z-[60] lg:hidden">
        <BottomNavItem icon={<LayoutGrid size={22} />} label="HOME" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <BottomNavItem icon={<Wallet size={22} />} label="TRADES" active={view === 'trade-log'} onClick={() => setView('trade-log')} />
        <BottomNavItem icon={<Book size={22} />} label="JOURNAL" active={view === 'daily-journal'} onClick={() => setView('daily-journal')} />
        <BottomNavItem icon={<BarChart4 size={22} />} label="ANALYSIS" active={view === 'performance'} onClick={() => setView('performance')} />
        <BottomNavItem icon={<Users size={22} />} label="LOUNGE" active={false} />
        <BottomNavItem icon={<Menu size={22} />} label="MORE" active={false} onClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </main>
  </div>
);
}

function BottomNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-w-[60px] relative h-full transition-all",
        active ? "text-[#3B82F6]" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className={cn("transition-transform", active && "scale-110")}>
        {icon}
      </div>
      <span className={cn("text-[9px] font-black tracking-widest transition-opacity", active ? "opacity-100" : "opacity-60")}>{label}</span>
    </button>
  );
}

function TradingCalendar({ trades }: { trades: Trade[] }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = format(currentMonth, 'MMMM yyyy');

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  // Calculate daily P&L
  const dailyPnl = React.useMemo(() => {
    const pnlMap: Record<string, number> = {};
    trades.forEach(t => {
      const dateKey = format(new Date(t.timestamp), 'yyyy-MM-dd');
      pnlMap[dateKey] = (pnlMap[dateKey] || 0) + (t.pnl || 0);
    });
    return pnlMap;
  }, [trades]);

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-[#0F172A]">{monthName}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-xl">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-xl">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-[#F8FAFC] py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[120px] p-2" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const dateKey = format(date, 'yyyy-MM-dd');
          const pnl = dailyPnl[dateKey];
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;

          return (
            <div key={day} className={cn(
              "bg-white min-h-[120px] p-2 border-t border-l border-border transition-colors hover:bg-[#F8FAFC] flex flex-col",
              isToday && "bg-blue-50/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-xs font-bold",
                  isToday ? "text-[#3B82F6] w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center" : "text-[#0F172A]"
                )}>
                  {day}
                </span>
              </div>
              {pnl !== undefined && (
                <div className={cn(
                  "mt-auto p-2 rounded-lg text-center",
                  pnl >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  <p className="text-[10px] font-black leading-none mb-1">
                    {pnl >= 0 ? 'PROFIT' : 'LOSS'}
                  </p>
                  <p className="text-xs font-bold">
                    {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#F8FAFC] border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">MONTHLY P&L</p>
          <p className={cn(
            "text-xl font-black",
            Object.values(dailyPnl).reduce((a, b) => a + b, 0) >= 0 ? "text-emerald-600" : "text-rose-600"
          )}>
            {Object.values(dailyPnl).reduce((a, b) => a + b, 0) >= 0 ? '+' : '-'}${Math.abs(Object.values(dailyPnl).reduce((a, b) => a + b, 0)).toLocaleString()}
          </p>
        </div>
        <div className="bg-[#F8FAFC] border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">WINNING DAYS</p>
          <p className="text-xl font-black text-[#0F172A]">
            {Object.values(dailyPnl).filter(v => v > 0).length}
          </p>
        </div>
        <div className="bg-[#F8FAFC] border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">LOSING DAYS</p>
          <p className="text-xl font-black text-[#0F172A]">
            {Object.values(dailyPnl).filter(v => v < 0).length}
          </p>
        </div>
      </div>
    </div>
  );
}

function DailyJournalView({ 
  onBack, 
  entries, 
  pulses, 
  onAddEntry, 
  onAddPulse,
  isDarkMode
}: { 
  onBack: () => void,
  entries: any[],
  pulses: any[],
  onAddEntry: (entry: any) => void,
  onAddPulse: (pulse: any) => void,
  isDarkMode?: boolean
}) {
  const [filter, setFilter] = React.useState<'all' | 'free' | 'structured'>('all');
  const [isAddingPulse, setIsAddingPulse] = React.useState(false);
  const [pulseNote, setPulseNote] = React.useState('');

  return (
    <div className={cn(
      "flex flex-col h-screen w-full overflow-hidden relative transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A] text-slate-200" : "bg-[#F8FAFC] text-foreground"
    )}>
      <header className={cn(
        "h-[72px] flex items-center justify-between px-8 border-b sticky top-0 z-10 transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full", isDarkMode ? "text-slate-400 hover:text-white" : "")}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Daily Journal</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => onAddEntry({ id: Date.now().toString(), date: new Date().toISOString(), content: 'New entry...', type: 'free' })}
            className="bg-[#3B82F6] hover:bg-[#2563EB] rounded-xl gap-2 shadow-lg shadow-blue-500/20"
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
          <div className={cn(
            "border rounded-2xl p-8 space-y-8 min-h-[280px] flex flex-col shadow-sm transition-colors duration-300",
            isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]"
                )}>
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Today's Pulses</h3>
                  <p className="text-xs text-muted-foreground/80">Quick snapshots of your trading state</p>
                </div>
              </div>
              <button className={cn(
                "h-9 px-4 rounded-lg border text-xs font-bold transition-colors flex items-center gap-2",
                isDarkMode 
                  ? "border-slate-700 text-blue-400 hover:bg-slate-800" 
                  : "border-border text-[#3B82F6] hover:bg-[#F8FAFC]"
              )}>
                <Plus size={14} /> Add Pulse
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center border",
                isDarkMode ? "bg-[#334155] border-slate-700" : "bg-[#F8FAFC] border-border"
              )}>
                <Zap size={32} className="text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-1">
                <p className={cn("text-sm font-bold", isDarkMode ? "text-slate-300" : "text-[#0F172A]")}>No pulses recorded today</p>
                <p className="text-xs text-muted-foreground">Press <kbd className={cn(
                  "px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold",
                  isDarkMode ? "bg-[#334155] border-slate-700 text-slate-400" : "bg-[#F8FAFC] border-border"
                )}>P</kbd> to add one</p>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-6">
            {/* This Week */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center",
                  isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
                )}>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">THIS WEEK</h4>
                <Badge className={cn(
                  "border text-[10px] h-5 px-2 font-bold",
                  isDarkMode ? "bg-[#334155] text-slate-400 border-slate-700" : "bg-[#F8FAFC] text-muted-foreground border-border"
                )}>2 ENTRIES</Badge>
                <div className={cn("h-px flex-1", isDarkMode ? "bg-slate-800" : "bg-border/50")} />
              </div>
              
              <div className="space-y-3">
                {/* Entry 1 */}
                <div className={cn(
                  "border rounded-2xl p-5 flex items-center justify-between group transition-all cursor-pointer shadow-sm",
                  isDarkMode 
                    ? "bg-[#1E293B] border-slate-700/50 hover:border-blue-500/50" 
                    : "bg-white border-border hover:border-[#3B82F6]/30"
                )}>
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl border flex flex-col items-center justify-center",
                      isDarkMode ? "bg-[#334155] border-slate-700" : "bg-[#F8FAFC] border-border"
                    )}>
                      <span className="text-[10px] font-bold text-muted-foreground leading-none">APR</span>
                      <span className={cn("text-sm font-black leading-none mt-1", isDarkMode ? "text-white" : "text-[#0F172A]")}>15</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Wednesday, April 15</span>
                        <Badge className="bg-[#10B981]/10 text-[#10B981] border-none text-[9px] h-4 px-1.5 font-black">TODAY</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <PenLine size={12} /> Free Write
                        </div>
                        <div className="w-1 h-1 rounded-full bg-muted/30" />
                        <span className="text-xs text-muted-foreground font-medium italic">"Focused on high probability setups..."</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {/* Entry 2 */}
                <div className={cn(
                  "border rounded-2xl p-5 flex items-center justify-between group transition-all cursor-pointer shadow-sm",
                  isDarkMode 
                    ? "bg-[#1E293B] border-slate-700/50 hover:border-blue-500/50" 
                    : "bg-white border-border hover:border-[#3B82F6]/30"
                )}>
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl border flex flex-col items-center justify-center",
                      isDarkMode ? "bg-[#334155] border-slate-700" : "bg-[#F8FAFC] border-border"
                    )}>
                      <span className="text-[10px] font-bold text-muted-foreground leading-none">APR</span>
                      <span className={cn("text-sm font-black leading-none mt-1", isDarkMode ? "text-white" : "text-[#0F172A]")}>14</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Tuesday, April 14</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <PenLine size={12} /> Free Write
                        </div>
                        <div className="w-1 h-1 rounded-full bg-muted/30" />
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
                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center",
                  isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
                )}>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">EARLIER</h4>
                <Badge className={cn(
                  "border text-[10px] h-5 px-2 font-bold",
                  isDarkMode ? "bg-[#334155] text-slate-400 border-slate-700" : "bg-[#F8FAFC] text-muted-foreground border-border"
                )}>1 ENTRY</Badge>
                <div className={cn("h-px flex-1", isDarkMode ? "bg-slate-800" : "bg-border/50")} />
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
      <div className={cn(
        "fixed right-0 top-1/2 -translate-y-1/2 border border-r-0 rounded-l-xl p-2 cursor-pointer transition-colors z-40 group shadow-sm",
        isDarkMode ? "bg-[#1E293B] border-slate-700 hover:bg-[#334155]" : "bg-white border-border hover:bg-[#F8FAFC]"
      )}>
        <div className="[writing-mode:vertical-rl] flex items-center gap-2 py-2">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest transition-colors",
            isDarkMode ? "text-slate-400 group-hover:text-blue-400" : "text-muted-foreground group-hover:text-[#3B82F6]"
          )}>Check-In</span>
        </div>
      </div>
    </div>
  );
}

function SidebarCategory({ label, children, collapsed, isDarkMode }: { label: string; children: React.ReactNode; collapsed: boolean; isDarkMode?: boolean }) {
  if (collapsed) return <div className="flex flex-col gap-2">{children}</div>;
  return (
    <div className="space-y-2">
      <p className={cn(
        "px-3 text-[10px] font-bold tracking-widest uppercase transition-colors",
        isDarkMode ? "text-slate-500" : "text-muted-foreground"
      )}>{label}</p>
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
  children,
  isDarkMode
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
  isDarkMode?: boolean;
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
            ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" 
            : (isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]")
        )}
      >
        <div className={cn("flex-shrink-0 transition-colors", active ? "text-white" : (isDarkMode ? "group-hover:text-white" : "group-hover:text-[#0F172A]"))}>
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
                  tag === 'PRO' 
                    ? (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#3B82F6]/10 text-[#3B82F6]") 
                    : (isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-[#A855F7]/10 text-[#A855F7]")
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

function NewsItem({ country, title, time, isDarkMode }: { country: string; title: string; time: string; isDarkMode?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-4 h-3 rounded-sm overflow-hidden flex items-center justify-center text-[8px] font-bold border transition-colors",
        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-muted border-border text-muted-foreground"
      )}>
        {country}
      </div>
      <span className={cn("text-[11px] font-bold transition-colors", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{title}</span>
      <span className="text-[11px] text-muted-foreground">{time}</span>
      <div className={cn("w-1 h-1 rounded-full mx-2 transition-colors", isDarkMode ? "bg-slate-700" : "bg-muted")} />
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
  showProgress = false,
  progress = 0,
  isDarkMode
}: { 
  title: string; 
  value: string; 
  subtext?: string; 
  icon: React.ReactNode; 
  variant?: 'white' | 'blue' | 'yellow' | 'purple' | 'blue-light';
  tag?: string;
  showProgress?: boolean;
  progress?: number;
  isDarkMode?: boolean;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group hover:shadow-xl",
      variant === 'blue' 
        ? (isDarkMode ? "bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5" : "bg-[#EFF6FF] border-[#3B82F6]/20 shadow-lg shadow-blue-500/5") 
        : variant === 'yellow'
        ? (isDarkMode ? "bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5" : "bg-amber-50 border-amber-200 shadow-lg shadow-amber-500/5")
        : variant === 'purple'
        ? (isDarkMode ? "bg-purple-500/10 border-purple-500/20 shadow-lg shadow-purple-500/5" : "bg-purple-50 border-purple-200 shadow-lg shadow-purple-500/5")
        : variant === 'blue-light'
        ? (isDarkMode ? "bg-sky-500/10 border-sky-500/20 shadow-lg shadow-sky-500/5" : "bg-sky-50 border-sky-200 shadow-lg shadow-sky-500/5")
        : (isDarkMode ? "bg-[#1E293B] border-slate-700/50 shadow-lg shadow-blue-500/5 hover:border-blue-500/30" : "bg-white border-[#3B82F6]/20 shadow-lg shadow-blue-500/5")
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          variant === 'blue' 
            ? "bg-[#3B82F6] text-white" 
            : variant === 'yellow'
            ? "bg-amber-500 text-white"
            : variant === 'purple'
            ? "bg-purple-500 text-white"
            : variant === 'blue-light'
            ? "bg-sky-500 text-white"
            : (isDarkMode ? "bg-[#0F172A] text-blue-400 border border-slate-700" : "bg-[#F8FAFC] text-[#3B82F6] border border-border")
        )}>
          {icon}
        </div>
        {tag && (
          <Badge className={cn(
            "border-none text-[10px] font-black h-5 px-2",
            isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#3B82F6]/10 text-[#3B82F6]"
          )}>
            {tag}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{title}</p>
        <p className={cn(
          "text-2xl sm:text-3xl font-black tracking-tight transition-colors",
          variant === 'blue' ? (isDarkMode ? "text-blue-400" : "text-[#3B82F6]") : (isDarkMode ? "text-white" : "text-[#0F172A]")
        )}>
          {value}
        </p>
        {subtext && (
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground overflow-hidden">
            <span className={cn("text-[10px] font-bold uppercase truncate", isDarkMode ? "text-slate-400" : "text-muted-foreground/70")}>{subtext}</span>
          </div>
        )}
        {showProgress && (
          <div className={cn("mt-4 h-1 w-full rounded-full overflow-hidden transition-colors", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {variant === 'blue' && (
        <div className={cn(
          "absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl transition-colors",
          isDarkMode ? "bg-blue-500/10" : "bg-[#3B82F6]/5"
        )} />
      )}
    </div>
  );
}

function TradeLogView({ 
  trades, 
  onBack, 
  onEditTrade,
  isDarkMode,
  preTradeRules,
  setPreTradeRules
}: { 
  trades: Trade[]; 
  onBack: () => void; 
  onEditTrade: (trade: Trade) => void;
  isDarkMode?: boolean;
  preTradeRules: any[];
  setPreTradeRules: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [ruleInput, setRuleInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'All' | 'Active' | 'Closed'>('All');
  const [sortConfig, setSortConfig] = React.useState<{ key: 'pnl' | 'timestamp'; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({});

  const filteredTrades = React.useMemo(() => {
    let result = trades.filter(t => {
      const matchesSearch = t.asset.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.strategy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      
      let matchesDate = true;
      if (dateRange.from) {
        matchesDate = matchesDate && new Date(t.timestamp) >= dateRange.from;
      }
      if (dateRange.to) {
        // End of day for the "to" date
        const endOfToDay = new Date(dateRange.to);
        endOfToDay.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(t.timestamp) <= endOfToDay;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sorting
    result.sort((a, b) => {
      const valA = sortConfig.key === 'pnl' ? (a.pnl || 0) : new Date(a.timestamp).getTime();
      const valB = sortConfig.key === 'pnl' ? (b.pnl || 0) : new Date(b.timestamp).getTime();
      
      if (sortConfig.direction === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });

    return result;
  }, [trades, searchQuery, statusFilter, sortConfig, dateRange]);

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
    <div className={cn(
      "flex flex-col h-screen w-full text-foreground overflow-hidden transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A] dark" : "bg-background"
    )}>
      {/* Header */}
      <header className={cn(
        "py-4 px-6 border-b transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-border shadow-sm"
      )}>
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-4 mr-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-8 w-8 shrink-0">
                <ArrowLeft size={18} />
              </Button>
              <h1 className="text-2xl font-black tracking-tight leading-none">Trade Log</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="bg-muted/50 border-border gap-2 font-bold text-xs h-9">
                <Star size={14} className="text-muted-foreground" /> Starred
              </Button>

              <Popover>
                <PopoverTrigger className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "bg-muted/50 border-border gap-2 font-bold text-xs h-9",
                  (statusFilter !== 'All' || sortConfig.key !== 'timestamp' || dateRange.from || dateRange.to) && "border-amber-500/50 text-amber-500"
                )}>
                  <Filter size={14} className="text-muted-foreground" /> Filter & Order
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-card border-border p-4 shadow-2xl z-50">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black mb-3 border-b border-border pb-1">Sort By</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant={sortConfig.key === 'timestamp' ? 'default' : 'outline'} 
                          size="sm" 
                          onClick={() => setSortConfig(prev => ({ key: 'timestamp', direction: prev.key === 'timestamp' ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc' }))}
                          className="text-[11px] font-bold h-8"
                        >
                          Date {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button 
                          variant={sortConfig.key === 'pnl' ? 'default' : 'outline'} 
                          size="sm" 
                          onClick={() => setSortConfig(prev => ({ key: 'pnl', direction: prev.key === 'pnl' ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc' }))}
                          className="text-[11px] font-bold h-8"
                        >
                          P&L {sortConfig.key === 'pnl' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black mb-3 border-b border-border pb-1">Status</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['All', 'Active', 'Closed'].map((s) => (
                          <Button 
                            key={s}
                            variant={statusFilter === s ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => setStatusFilter(s as any)}
                            className="text-[11px] font-bold h-8"
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black mb-3 border-b border-border pb-1">Date Range</h4>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">From</Label>
                          <Popover>
                            <PopoverTrigger className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "h-8 text-[11px] font-medium justify-start border-border w-full"
                            )}>
                              {dateRange.from ? format(dateRange.from, 'PP') : "Pick a date"}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[60]" align="start">
                              <Calendar
                                mode="single"
                                selected={dateRange.from}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">To</Label>
                          <Popover>
                            <PopoverTrigger className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "h-8 text-[11px] font-medium justify-start border-border w-full"
                            )}>
                              {dateRange.to ? format(dateRange.to, 'PP') : "Pick a date"}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[60]" align="start">
                              <Calendar
                                mode="single"
                                selected={dateRange.to}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-rose-500 hover:text-rose-600 font-bold text-[10px] h-7"
                          onClick={() => setDateRange({})}
                        >
                          Clear Date Range
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="sm" className="bg-muted/50 border-border gap-2 font-bold text-xs h-9">
                <BarChart2 size={14} className="text-muted-foreground" /> 
                Stats 
                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">14</span>
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-black ml-1 uppercase">Pro</span>
              </Button>

              <Button variant="outline" size="sm" className="bg-muted/50 border-border gap-2 font-bold text-xs h-9">
                <Fingerprint size={14} className="text-muted-foreground" /> Pattern Recognition
              </Button>

              <Button variant="outline" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none gap-2 font-black text-xs h-9 shadow-lg shadow-amber-500/20">
                <Brain size={14} /> Edge Intelligence
              </Button>

              <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border h-9">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'grid' ? "bg-card shadow-sm text-amber-500" : "text-muted-foreground"
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'list' ? "bg-card shadow-sm text-amber-500" : "text-muted-foreground"
                  )}
                >
                  <List size={14} />
                </button>
              </div>

              <Button variant="outline" size="sm" className="bg-muted/50 border-border gap-2 font-bold text-xs h-9">
                <Layers size={14} className="text-muted-foreground" /> Group
              </Button>

              <Button variant="outline" size="icon" className="bg-muted/50 border-border h-9 w-9">
                <MoreHorizontal size={16} className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" className="bg-muted/50 border-border gap-2 font-bold text-[11px] h-8 rounded-lg group">
              <FolderPlus size={14} className="text-muted-foreground group-hover:text-amber-500 transition-colors" /> New Folder
            </Button>
            
            <div className="hidden sm:flex items-center gap-4">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <Input 
                  placeholder="Quick search..." 
                  className="pl-8 h-8 bg-muted/30 border-border text-[11px] rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 h-8 font-black text-[11px] px-4 rounded-lg shadow-lg shadow-amber-500/10">
                Add Trade
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Pre-Trade Checklist */}
          <section className={cn(
            "border rounded-2xl p-6 shadow-lg shadow-blue-500/5 transition-colors duration-300",
            isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-[#3B82F6]/20 shadow-sm"
          )}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                )}>
                  <ListTodo size={20} />
                </div>
                <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>Pre-Trade Checklist</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-muted-foreground/20">
                {preTradeRules.filter(r => r.checked).length} / {preTradeRules.length} Completed
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {preTradeRules.map((rule) => (
                <div 
                  key={rule.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all group",
                    rule.checked 
                      ? (isDarkMode ? "bg-blue-500/10 border-blue-500/30" : "bg-[#EFF6FF] border-[#3B82F6]/30")
                      : (isDarkMode ? "bg-[#0F172A] border-slate-700/50" : "bg-[#F8FAFC] border-border")
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setPreTradeRules(prev => prev.map(r => r.id === rule.id ? { ...r, checked: !r.checked } : r))}
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-sm",
                        rule.checked 
                          ? "bg-[#3B82F6] border-[#3B82F6] text-white" 
                          : "border-muted-foreground/30 hover:border-[#3B82F6] bg-white"
                      )}
                    >
                      {rule.checked && <CheckCircle2 size={14} />}
                    </button>
                    <span className={cn(
                      "text-xs font-bold transition-colors",
                      rule.checked 
                        ? (isDarkMode ? "text-blue-400" : "text-[#3B82F6]") 
                        : (isDarkMode ? "text-slate-400" : "text-muted-foreground")
                    )}>
                      {rule.text}
                    </span>
                  </div>
                  <button 
                    onClick={() => setPreTradeRules(prev => prev.filter(r => r.id !== rule.id))}
                    className="text-rose-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className={cn(
                "flex items-center p-1 rounded-xl border border-dashed transition-all",
                isDarkMode ? "border-slate-700 bg-slate-800/20" : "border-border bg-slate-50/50"
              )}>
                <input 
                  type="text"
                  placeholder="Add new rule..."
                  className="bg-transparent border-none focus:ring-0 text-xs font-bold px-3 w-full placeholder:text-muted-foreground/50"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && ruleInput.trim()) {
                      setPreTradeRules(prev => [...prev, { id: Date.now().toString(), text: ruleInput.trim(), checked: false }]);
                      setRuleInput('');
                    }
                  }}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-lg shrink-0"
                  onClick={() => {
                    if (ruleInput.trim()) {
                      setPreTradeRules(prev => [...prev, { id: Date.now().toString(), text: ruleInput.trim(), checked: false }]);
                      setRuleInput('');
                    }
                  }}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </section>

          <div className={cn(
            "p-3 rounded-xl border flex items-center justify-between",
            isDarkMode ? "bg-[#1E293B]/50 border-slate-700/50" : "bg-white border-border shadow-sm"
          )}>
            <h3 className="font-black text-xs uppercase tracking-wider text-muted-foreground">All Trades ({filteredTrades.length})</h3>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-border gap-2 h-8 text-[11px] font-bold">
                <Download size={12} /> Export CSV
              </Button>
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

function RiskCalculator({ onBack, isDarkMode }: { onBack: () => void, isDarkMode?: boolean }) {
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
    <div className={cn(
      "flex-1 flex flex-col overflow-y-auto transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
    )}>
      <header className={cn(
        "h-[72px] flex items-center justify-between px-8 border-b sticky top-0 z-10 transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full", isDarkMode && "text-slate-400 hover:text-white hover:bg-slate-800")}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Trading Tools</h2>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <div className={cn(
          "flex gap-1 p-1 rounded-xl border w-fit transition-colors",
          isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
        )}>
          {[
            { id: 'risk', label: 'Risk Calculator' },
            { id: 'drawdown', label: 'Drawdown Recovery' },
            { id: 'compounding', label: 'Compounding' }
          ].map((tool) => (
            <button 
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeTool === tool.id 
                  ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" 
                  : (isDarkMode ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-[#0F172A]")
              )}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {activeTool === 'risk' && (
          <div className={cn(
            "rounded-2xl p-8 shadow-sm space-y-6 transition-all border",
            isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
          )}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Account Balance ($)", value: balance, onChange: setBalance },
                { label: "Risk Percentage (%)", value: riskPercent, onChange: setRiskPercent },
                { label: "Stop Loss (Pips/Points)", value: stopLossPips, onChange: setStopLossPips },
                { label: "Pip Value ($ per lot)", value: pipValue, onChange: setPipValue }
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">{field.label}</Label>
                  <Input 
                    type="number" 
                    value={field.value} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className={cn(
                      "h-12 rounded-xl transition-all",
                      isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border"
                    )}
                  />
                </div>
              ))}
            </div>

            <div className={cn("pt-6 border-t space-y-4", isDarkMode ? "border-slate-700" : "border-border")}>
              <div className={cn(
                "flex justify-between items-center p-4 rounded-xl border transition-all",
                isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-[#EFF6FF] border-[#3B82F6]/20"
              )}>
                <span className={cn("text-sm font-bold", isDarkMode ? "text-blue-400" : "text-[#1E40AF]")}>Risk Amount</span>
                <span className={cn("text-xl font-black", isDarkMode ? "text-blue-400" : "text-[#1E40AF]")}>${riskAmount.toLocaleString()}</span>
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
          <div className={cn(
            "rounded-2xl p-8 shadow-sm space-y-6 transition-all border",
            isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
          )}>
            <div className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Current Drawdown (%)</Label>
              <Input 
                type="number" 
                value={drawdownPercent} 
                onChange={(e) => setDrawdownPercent(parseFloat(e.target.value))}
                className={cn(
                  "h-12 rounded-xl transition-all",
                  isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border"
                )}
              />
              <div className={cn("h-2 w-full rounded-full overflow-hidden", isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]")}>
                <div className="h-full bg-red-500" style={{ width: `${drawdownPercent}%` }} />
              </div>
            </div>

            <div className={cn("pt-6 border-t", isDarkMode ? "border-slate-700" : "border-border")}>
              <div className={cn(
                "p-8 rounded-2xl border text-center space-y-2",
                isDarkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100"
              )}>
                <p className={cn("text-sm font-bold uppercase tracking-widest", isDarkMode ? "text-red-400" : "text-red-800")}>Recovery Needed</p>
                <h3 className={cn("text-4xl font-black", isDarkMode ? "text-red-400" : "text-red-600")}>{recoveryNeeded.toFixed(1)}%</h3>
                <p className={cn("text-xs max-w-[240px] mx-auto", isDarkMode ? "text-red-400/70" : "text-red-700/70")}>
                  You need a {recoveryNeeded.toFixed(1)}% gain to return to your initial balance.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'compounding' && (
          <div className={cn(
            "rounded-2xl p-8 shadow-sm space-y-6 transition-all border",
            isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
          )}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Initial Balance ($)", value: balance, onChange: setBalance },
                { label: "Monthly Return (%)", value: monthlyReturn, onChange: setMonthlyReturn },
                { label: "Months", value: months, onChange: setMonths }
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">{field.label}</Label>
                  <Input 
                    type="number" 
                    value={field.value} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className={cn(
                      "h-12 rounded-xl transition-all",
                      isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border"
                    )}
                  />
                </div>
              ))}
            </div>

            <div className={cn("pt-6 border-t", isDarkMode ? "border-slate-700" : "border-border")}>
              <div className={cn(
                "p-8 rounded-2xl border text-center space-y-2",
                isDarkMode ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-100"
              )}>
                <p className={cn("text-sm font-bold uppercase tracking-widest", isDarkMode ? "text-green-400" : "text-green-800")}>Projected Balance</p>
                <h3 className={cn("text-4xl font-black", isDarkMode ? "text-green-400" : "text-green-600")}>${compoundedBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
                <p className={cn("text-xs", isDarkMode ? "text-green-400/70" : "text-green-700/70")}>
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
function SettingsView({ onBack, isDarkMode }: { onBack: () => void, isDarkMode?: boolean }) {
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
    <div className={cn(
      "flex-1 flex flex-col overflow-y-auto transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
    )}>
      <header className={cn(
        "h-[72px] flex items-center justify-between px-8 border-b sticky top-0 z-10 transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full", isDarkMode && "text-slate-400 hover:text-white hover:bg-slate-800")}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Settings</h2>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Tabs */}
        <div className={cn(
          "flex gap-1 p-1 rounded-xl border w-fit transition-colors",
          isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
        )}>
          {[
            { id: 'accounts', label: 'Trading Accounts' },
            { id: 'integrations', label: 'Integrations' },
            { id: 'rules', label: 'Trading Rules' },
            { id: 'profile', label: 'Profile' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" 
                  : (isDarkMode ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-[#0F172A]")
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className={cn(
              "rounded-2xl p-6 shadow-sm transition-all border",
              isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
            )}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Connected Accounts</h3>
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
                  <div key={account.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border group transition-colors",
                    isDarkMode 
                      ? "bg-[#0F172A] border-slate-700 hover:border-blue-500/30" 
                      : "bg-[#F8FAFC] border-border hover:border-[#3B82F6]/30"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold border transition-colors",
                        isDarkMode ? "bg-[#1E293B] border-slate-700 text-blue-400" : "bg-white border-border text-[#3B82F6]"
                      )}>
                        {account.version}
                      </div>
                      <div>
                        <h4 className={cn("font-bold", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{account.name}</h4>
                        <p className="text-xs text-muted-foreground">{account.broker} • {account.balance}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold uppercase transition-colors",
                        account.status === 'Connected' 
                          ? (isDarkMode ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-green-500/10 text-green-600 border-green-200") 
                          : (isDarkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-blue-500/10 text-blue-600 border-blue-200")
                      )}>
                        {account.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className={cn("rounded-lg opacity-0 group-hover:opacity-100 transition-opacity", isDarkMode && "hover:bg-slate-800")}>
                        <Settings size={18} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(
              "rounded-2xl p-6 transition-all border",
              isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-[#EFF6FF] border-[#3B82F6]/20"
            )}>
              <div className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#3B82F6] text-white"
                )}>
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className={cn("font-bold", isDarkMode ? "text-blue-400" : "text-[#1E40AF]")}>Auto-Sync Analytics</h4>
                  <p className={cn("text-sm mt-1", isDarkMode ? "text-blue-300/80" : "text-[#1E40AF]/80")}>
                    Connected accounts automatically feed into your Journal, Performance, and P&L analytics. No manual entry required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className={cn(
              "rounded-2xl p-8 shadow-sm transition-all border",
              isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
            )}>
              <div className="max-w-md mx-auto text-center space-y-6">
                <div className="flex justify-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl border transition-colors",
                    isDarkMode ? "bg-[#0F172A] border-slate-700 text-blue-400" : "bg-[#F8FAFC] border-border text-[#3B82F6]"
                  )}>
                    MT4
                  </div>
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl border transition-colors",
                    isDarkMode ? "bg-[#0F172A] border-slate-700 text-blue-400" : "bg-[#F8FAFC] border-border text-[#3B82F6]"
                  )}>
                    MT5
                  </div>
                </div>
                <div>
                  <h3 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>MetaTrader Integration</h3>
                  <p className="text-muted-foreground mt-2">Connect your MetaTrader 4 or 5 account for real-time data synchronization.</p>
                </div>

                <div className={cn(
                  "grid grid-cols-2 gap-3 p-1 rounded-xl border transition-colors",
                  isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border"
                )}>
                  <button 
                    onClick={() => setMtVersion('MT4')}
                    className={cn(
                      "py-2 rounded-lg text-sm font-bold transition-all",
                      mtVersion === 'MT4' 
                        ? (isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-[#3B82F6] shadow-sm") 
                        : "text-muted-foreground"
                    )}
                  >
                    MT4
                  </button>
                  <button 
                    onClick={() => setMtVersion('MT5')}
                    className={cn(
                      "py-2 rounded-lg text-sm font-bold transition-all",
                      mtVersion === 'MT5' 
                        ? (isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-[#3B82F6] shadow-sm") 
                        : "text-muted-foreground"
                    )}
                  >
                    MT5
                  </button>
                </div>

                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Server Name</label>
                    <Input 
                      placeholder="e.g. ICMarkets-Live01" 
                      className={cn(
                        "h-12 rounded-xl transition-all",
                        isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border"
                      )} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Login ID</label>
                    <Input 
                      placeholder="Account Number" 
                      className={cn(
                        "h-12 rounded-xl transition-all",
                        isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border"
                      )} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Investor Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className={cn(
                        "h-12 rounded-xl transition-all",
                        isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border"
                      )} 
                    />
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
            <div className={cn(
              "rounded-2xl p-8 shadow-sm space-y-6 transition-all border",
              isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]"
                )}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Discipline & Rules</h3>
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
                    className={cn(
                      "h-12 rounded-xl transition-all",
                      isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC] border-border"
                    )}
                  />
                  <Button onClick={addRule} className="bg-[#3B82F6] hover:bg-[#2563EB] h-12 px-6 rounded-xl font-bold">
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-2">
                  {tradingRules.map((rule, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-4 rounded-xl border group transition-colors",
                      isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                          isDarkMode ? "bg-[#1E293B] border-slate-700 text-blue-400" : "bg-white border-border text-[#3B82F6]"
                        )}>
                          {i + 1}
                        </div>
                        <span className={cn("text-sm font-medium", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{rule}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeRule(i)}
                        className={cn("opacity-0 group-hover:opacity-100 transition-all", isDarkMode ? "text-slate-500 hover:text-red-400 hover:bg-slate-800" : "text-muted-foreground hover:text-red-500")}
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={cn(
              "rounded-2xl p-6 transition-all border",
              isDarkMode ? "bg-green-500/10 border-green-500/20" : "bg-[#F0FDF4] border-green-200"
            )}>
              <div className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-500 text-white"
                )}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className={cn("font-bold", isDarkMode ? "text-green-400" : "text-green-800")}>Rule Enforcement Active</h4>
                  <p className={cn("text-sm mt-1", isDarkMode ? "text-green-300/80" : "text-green-700/80")}>
                    The AI Agent will track your discipline score based on how well you follow these rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className={cn(
              "rounded-2xl p-8 shadow-sm transition-all border",
              isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
            )}>
              <div className="flex items-center gap-6 mb-8">
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black border transition-colors",
                  isDarkMode ? "bg-[#0F172A] border-slate-700 text-blue-400" : "bg-[#F8FAFC] border-border text-[#3B82F6]"
                )}>
                  JD
                </div>
                <div>
                  <h3 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>John Doe</h3>
                  <p className="text-muted-foreground">Pro Trader • est. 2024</p>
                </div>
                <Button variant="outline" className={cn("ml-auto rounded-xl", isDarkMode && "border-slate-700 text-slate-300 hover:bg-slate-800")}>Edit Profile</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Email Address", value: "john.doe@example.com" },
                  { label: "Phone Number", value: "+1 (555) 000-0000" },
                  { label: "Trading Style", value: "Price Action / ICT" },
                  { label: "Experience", value: "4 Years" }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                    <p className={cn("font-medium", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(
              "rounded-2xl p-8 shadow-sm transition-all border",
              isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
            )}>
              <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-white" : "text-[#0F172A]")}>Subscription</h3>
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between transition-colors",
                isDarkMode ? "bg-[#0F172A] border-blue-500/20" : "bg-[#EFF6FF] border-[#3B82F6]/20"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#3B82F6] text-white"
                  )}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className={cn("font-bold", isDarkMode ? "text-blue-400" : "text-[#1E40AF]")}>Pro Plan (Annual)</h4>
                    <p className={cn("text-xs", isDarkMode ? "text-blue-300/80" : "text-[#1E40AF]/80")}>Next billing: April 2027</p>
                  </div>
                </div>
                <Button variant="ghost" className={cn("text-xs font-bold", isDarkMode ? "text-blue-400 hover:bg-blue-500/10" : "text-[#3B82F6] hover:bg-white")}>Manage</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyView({ trades, onBack, isDarkMode, userStrategies }: { trades: Trade[], onBack: () => void, isDarkMode?: boolean, userStrategies: any[] }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingStrategyId, setEditingStrategyId] = React.useState<string | null>(null);
  const [newStrategy, setNewStrategy] = React.useState({
    name: '',
    direction: 'Both',
    timeFrame: '1H',
    executionTimeFrame: '5m',
    confluences: ''
  });

  const handleAddStrategy = async () => {
    if (!newStrategy.name || !auth.currentUser) return;
    try {
      if (editingStrategyId) {
        await updateDoc(doc(db, 'strategies', editingStrategyId), {
          ...newStrategy,
          confluences: newStrategy.confluences.split(',').map(s => s.trim()).filter(Boolean),
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'strategies'), {
          uid: auth.currentUser.uid,
          ...newStrategy,
          confluences: newStrategy.confluences.split(',').map(s => s.trim()).filter(Boolean),
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingStrategyId(null);
      setNewStrategy({ name: '', direction: 'Both', timeFrame: '1H', executionTimeFrame: '5m', confluences: '' });
    } catch (e) {
      console.error("Error saving strategy:", e);
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this strategy? This will not affect logged trades.")) return;
    try {
      await deleteDoc(doc(db, 'strategies', id));
    } catch (e) {
      console.error("Error deleting strategy:", e);
    }
  };

  const handleEditStrategy = (strat: any) => {
    setEditingStrategyId(strat.id);
    setNewStrategy({
      name: strat.name,
      direction: strat.direction || 'Both',
      timeFrame: strat.timeFrame || '1H',
      executionTimeFrame: strat.executionTimeFrame || '5m',
      confluences: Array.isArray(strat.confluences) ? strat.confluences.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const allStrategyNames = Array.from(new Set([
    ...userStrategies.map(s => s.name),
    ...trades.map(t => t.strategy).filter(Boolean) as string[]
  ]));
  
  return (
    <div className={cn(
      "flex-1 flex flex-col overflow-y-auto transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
    )}>
      <header className={cn(
        "h-[72px] flex items-center justify-between px-8 border-b sticky top-0 z-10 transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full", isDarkMode && "text-slate-400 hover:text-white hover:bg-slate-800")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>Strategy Management</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Track & Optimize your edges</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 gap-2">
          <Plus size={16} />
          New Strategy
        </Button>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allStrategyNames.map(stratName => {
            const stratTrades = trades.filter(t => (t.strategy || 'None') === stratName);
            const pnl = stratTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
            const winRate = stratTrades.length > 0 ? (stratTrades.filter(t => (t.pnl || 0) > 0).length / stratTrades.length) * 100 : 0;
            const details = userStrategies.find(s => s.name === stratName);
            
            return (
              <div key={stratName} className={cn(
                "rounded-2xl p-6 shadow-sm space-y-6 group transition-all border",
                isDarkMode ? "bg-[#1E293B] border-blue-500/20 shadow-blue-500/5 hover:border-blue-500/40" : "bg-white border-border hover:border-[#3B82F6]/30"
              )}>
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300",
                    isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]"
                  )}>
                    <LayoutTemplate size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    {details && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditStrategy(details)}
                          className="h-8 w-8 rounded-full hover:bg-blue-500/10 hover:text-blue-500"
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteStrategy(details.id)}
                          className="h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                    <Badge className={cn(
                      "text-[10px] font-bold uppercase",
                      pnl >= 0 ? 
                        (isDarkMode ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-500/10 text-green-600 border-green-200") : 
                        (isDarkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-500/10 text-red-600 border-red-200")
                    )}>
                      {pnl >= 0 ? 'Profitable' : 'Losing'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className={cn("text-lg font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>{stratName}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{stratTrades.length} trades logged</p>
                </div>

                {details && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <div className="bg-slate-500/5 p-2 rounded-lg border border-slate-500/10">
                        <span className="block opacity-60 mb-0.5">Direction</span>
                        <span className={isDarkMode ? "text-slate-200" : "text-[#0F172A]"}>{details.direction}</span>
                      </div>
                      <div className="bg-slate-500/5 p-2 rounded-lg border border-slate-500/10">
                        <span className="block opacity-60 mb-0.5">HTF</span>
                        <span className={isDarkMode ? "text-slate-200" : "text-[#0F172A]"}>{details.timeFrame}</span>
                      </div>
                      <div className="bg-slate-500/5 p-2 rounded-lg border border-slate-500/10">
                        <span className="block opacity-60 mb-0.5">Execution</span>
                        <span className={isDarkMode ? "text-slate-200" : "text-[#0F172A]"}>{details.executionTimeFrame}</span>
                      </div>
                    </div>
                    
                    {details.confluences && details.confluences.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Key Confluences</p>
                        <div className="flex flex-wrap gap-1.5">
                          {details.confluences.map((conf: string, i: number) => (
                            <Badge key={i} variant="outline" className={cn(
                              "text-[9px] py-0 px-2 h-5 border-blue-500/10",
                              isDarkMode ? "bg-blue-500/5 text-blue-300" : "bg-blue-50 text-blue-600"
                            )}>
                              {conf}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={cn("grid grid-cols-2 gap-4 pt-4 border-t", isDarkMode ? "border-slate-700" : "border-border")}>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">WIN RATE</p>
                    <p className={cn("text-sm font-black", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>{winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">TOTAL P&L</p>
                    <p className={cn("text-sm font-black", pnl >= 0 ? "text-blue-400" : "text-[#EF4444]")}>
                      ${pnl.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Button variant="outline" className={cn(
                  "w-full text-xs font-bold h-10 transition-all",
                  isDarkMode ? "border-slate-700 text-slate-300 hover:bg-[#3B82F6] hover:text-white" : "border-border text-xs font-bold h-10 group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-[#3B82F6]"
                )}>
                  View Detailed Stats
                </Button>
              </div>
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border",
                isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
              )}
            >
              <div className={cn("p-6 border-b flex items-center justify-between", isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-[#F8FAFC] border-border")}>
                <div>
                  <h3 className={cn("text-lg font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>
                    {editingStrategyId ? 'Edit Strategy' : 'Create New Strategy'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Define your trading edge</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setIsModalOpen(false); setEditingStrategyId(null); setNewStrategy({ name: '', direction: 'Both', timeFrame: '1H', executionTimeFrame: '5m', confluences: '' }); }} className="rounded-full">
                  <X size={20} />
                </Button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Strategy Name</Label>
                  <Input 
                    value={newStrategy.name}
                    onChange={e => setNewStrategy({...newStrategy, name: e.target.value})}
                    placeholder="e.g. ICT Silver Bullet"
                    className={cn(isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC]")}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Direction</Label>
                    <Select value={newStrategy.direction} onValueChange={v => setNewStrategy({...newStrategy, direction: v})}>
                      <SelectTrigger className={cn(isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC]")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Long">Long Only</SelectItem>
                        <SelectItem value="Short">Short Only</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Frame</Label>
                    <Input 
                      value={newStrategy.timeFrame}
                      onChange={e => setNewStrategy({...newStrategy, timeFrame: e.target.value})}
                      placeholder="e.g. 1H / 4H"
                      className={cn(isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC]")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Execution TF</Label>
                    <Input 
                      value={newStrategy.executionTimeFrame}
                      onChange={e => setNewStrategy({...newStrategy, executionTimeFrame: e.target.value})}
                      placeholder="e.g. 1m / 5m"
                      className={cn(isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC]")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confluences (Comma separated)</Label>
                  <Textarea 
                    value={newStrategy.confluences}
                    onChange={e => setNewStrategy({...newStrategy, confluences: e.target.value})}
                    placeholder="e.g. Fair Value Gap, Liquidity Sweep, Market Structure Shift"
                    className={cn("min-h-[100px]", isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-[#F8FAFC]")}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" onClick={() => { setIsModalOpen(false); setEditingStrategyId(null); setNewStrategy({ name: '', direction: 'Both', timeFrame: '1H', executionTimeFrame: '5m', confluences: '' }); }} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
                  <Button onClick={handleAddStrategy} className="flex-1 h-12 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold">
                    {editingStrategyId ? 'Update Strategy' : 'Save Strategy'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIAgentView({ trades, onBack, isDarkMode }: { trades: Trade[], onBack: () => void, isDarkMode?: boolean }) {
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
    <div className={cn(
      "flex-1 flex flex-col overflow-hidden transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
    )}>
      <header className={cn(
        "h-[72px] flex items-center justify-between px-8 border-b sticky top-0 z-10 transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full", isDarkMode && "text-slate-400 hover:text-white hover:bg-slate-800")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>AI Trading Agent</h1>
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

      <main className={cn(
        "flex-1 overflow-y-auto p-8 custom-scrollbar",
        isDarkMode ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
      )}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Analysis Section */}
          <div className={cn(
            "rounded-2xl p-8 shadow-lg space-y-6 transition-all border duration-300",
            isDarkMode ? "bg-[#1E293B] border-blue-500/20 shadow-blue-500/5" : "bg-white border-[#3B82F6]/20 shadow-blue-500/5"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300",
                isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-[#EFF6FF] text-[#3B82F6]"
              )}>
                <Sparkles size={24} />
              </div>
              <h2 className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>Performance Insights</h2>
            </div>
            
            {analysis ? (
              <div className={cn("prose max-w-none transition-colors", isDarkMode ? "prose-invert" : "prose-slate")}>
                <div className={cn(
                  "p-6 rounded-xl border whitespace-pre-wrap text-sm leading-relaxed",
                  isDarkMode ? "bg-[#0F172A] border-slate-700 text-slate-300" : "bg-[#F8FAFC] border-border text-[#0F172A]"
                )}>
                  {analysis}
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Sparkles size={48} className="text-muted-foreground" />
                <p className={cn("text-sm font-medium max-w-[280px]", isDarkMode ? "text-slate-400" : "text-muted-foreground")}>
                  Click "Generate New Analysis" to let the AI analyze your trading patterns.
                </p>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className={cn(
            "rounded-2xl flex flex-col h-[500px] shadow-sm transition-all border duration-300",
            isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-border"
          )}>
            <div className={cn("p-6 border-b flex items-center gap-3", isDarkMode ? "border-slate-700" : "border-border")}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isDarkMode ? "bg-[#0F172A] text-slate-400" : "bg-[#F8FAFC] text-muted-foreground"
              )}>
                <MessageSquare size={18} />
              </div>
              <h3 className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Psychology Coach</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <MessageSquare size={48} className="text-muted-foreground" />
                  <p className={cn("text-xs font-medium", isDarkMode ? "text-slate-400" : "text-muted-foreground")}>Ask me anything about your trading psychology or strategy.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col max-w-[80%] space-y-1",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm transition-all",
                    msg.role === 'user' 
                      ? "bg-[#3B82F6] text-white rounded-tr-none" 
                      : (isDarkMode ? "bg-[#0F172A] border border-slate-700 text-slate-200 rounded-tl-none" : "bg-[#F8FAFC] border border-border text-[#0F172A] rounded-tl-none")
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

            <form onSubmit={handleChat} className={cn("p-4 border-t flex gap-2", isDarkMode ? "border-slate-700" : "border-border")}>
              <Input 
                placeholder="Type your question..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className={cn(
                  "h-12 rounded-xl transition-all",
                  isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder:text-slate-500" : "bg-[#F8FAFC] border-border"
                )}
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

function TradeAnalysisView({ trades, onBack, isDarkMode }: { trades: Trade[], onBack: () => void, isDarkMode?: boolean }) {
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
    <div className={cn(
      "flex-1 flex flex-col overflow-y-auto transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A] text-slate-200" : "bg-[#F8FAFC] text-foreground"
    )}>
      <header className={cn(
        "h-[72px] flex items-center justify-between px-8 border-b sticky top-0 z-10 transition-colors duration-300",
        isDarkMode ? "bg-[#1E293B] border-slate-700/50" : "bg-white border-border/50"
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className={cn("rounded-full", isDarkMode ? "text-slate-400 hover:text-white" : "")}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>Trade Analysis</h2>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asset Performance */}
          <div className={cn(
            "rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-300 border",
            isDarkMode ? "bg-[#1E293B] border-slate-700/50 shadow-blue-500/5" : "bg-white border-border shadow-sm"
          )}>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-muted-foreground" />
              <h3 className={cn("text-sm font-bold", isDarkMode ? "text-slate-300" : "text-[#0F172A]")}>Asset Performance</h3>
            </div>
            <div className="space-y-4">
              {assetPerformance.map((item) => (
                <div key={item.asset} className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-colors duration-300",
                  isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border"
                )}>
                  <div>
                    <p className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>{item.asset}</p>
                    <p className="text-[10px] text-muted-foreground">{item.trades} trades • {item.winRate.toFixed(1)}% win rate</p>
                  </div>
                  <span className={cn("font-bold", item.pnl >= 0 ? "text-blue-400" : "text-[#EF4444]")}>
                    ${item.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
              {assetPerformance.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No data available</p>}
            </div>
          </div>

          {/* Strategy Performance */}
          <div className={cn(
            "rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-300 border",
            isDarkMode ? "bg-[#1E293B] border-slate-700/50 shadow-blue-500/5" : "bg-white border-border shadow-sm"
          )}>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-muted-foreground" />
              <h3 className={cn("text-sm font-bold", isDarkMode ? "text-slate-300" : "text-[#0F172A]")}>Strategy Performance</h3>
            </div>
            <div className="space-y-4">
              {strategyPerformance.map((item) => (
                <div key={item.strategy} className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-colors duration-300",
                  isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F8FAFC] border-border"
                )}>
                  <div>
                    <p className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>{item.strategy}</p>
                    <p className="text-[10px] text-muted-foreground">{item.trades} trades • {item.winRate.toFixed(1)}% win rate</p>
                  </div>
                  <span className={cn("font-bold", item.pnl >= 0 ? "text-blue-400" : "text-[#EF4444]")}>
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
