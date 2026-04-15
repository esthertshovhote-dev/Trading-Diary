import React, { useEffect } from 'react';
import { 
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
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Trade } from '@/src/types';
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
  handleFirestoreError,
  OperationType
} from '@/src/firebase';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date(2023, 9, 15));
  const [trades, setTrades] = React.useState<Trade[]>(MOCK_TRADES);
  const [editingThumbnail, setEditingThumbnail] = React.useState<{ tradeId: string; index: number } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);

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

  const handleAddTrade = async () => {
    if (!user) return;
    
    const newTrade: Omit<Trade, 'id'> = {
      uid: user.uid,
      asset: 'NQ100',
      side: 'Buy',
      size: '1 Lot',
      entryPrice: 15000,
      currentPrice: 15100,
      pnl: 100,
      pnlPercent: 0.67,
      sl: 14900,
      tp: 15300,
      status: 'Active',
      strategy: 'Breakout',
      setupScore: 8,
      notes: 'Test trade from Firestore integration',
      timestamp: new Date().toISOString(),
      thumbnails: [],
      annotations: {}
    };

    try {
      const tradesRef = collection(db, 'trades');
      await addDoc(tradesRef, newTrade);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trades');
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

  const currentTrade = trades.find(t => t.asset === 'TSLA') || trades[0];
  const editingTrade = editingThumbnail ? trades.find(t => t.id === editingThumbnail.tradeId) : null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden dark relative">
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
          width: isSidebarCollapsed ? '64px' : '240px',
          x: isMobileMenuOpen ? 0 : 0 // x is handled by CSS classes for mobile
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative flex flex-col border-r border-border bg-card overflow-hidden transition-transform duration-300 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 mb-2 flex items-center justify-between">
          <SidebarItem 
            icon={<TrendingUp size={20} />} 
            label="Dashboard" 
            active 
            collapsed={isSidebarCollapsed} 
            hasDropdown
          />
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-muted rounded-lg lg:hidden text-muted-foreground"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-6 py-2">
            <SidebarCategory label="JOURNAL" collapsed={isSidebarCollapsed}>
              <SidebarItem icon={<Book size={18} />} label="Trade Log" collapsed={isSidebarCollapsed} />
              <SidebarItem icon={<Heart size={18} />} label="Daily Journal" collapsed={isSidebarCollapsed} hasDropdown />
              <SidebarItem icon={<Newspaper size={18} />} label="Analysis" collapsed={isSidebarCollapsed} />
              <SidebarItem icon={<Sparkles size={18} />} label="Reflections" collapsed={isSidebarCollapsed} />
            </SidebarCategory>

            <SidebarCategory label="TOOLS" collapsed={isSidebarCollapsed}>
              <SidebarItem icon={<BarChart3 size={18} />} label="Analytics" collapsed={isSidebarCollapsed} hasDropdown />
              <SidebarItem icon={<FlaskConical size={18} />} label="Trading Lab" collapsed={isSidebarCollapsed} hasDropdown />
              <SidebarItem icon={<Layout size={18} />} label="Templates" collapsed={isSidebarCollapsed} />
              <SidebarItem icon={<Target size={18} />} label="Goals" collapsed={isSidebarCollapsed} />
              <SidebarItem icon={<Wallet size={18} />} label="Accounts" collapsed={isSidebarCollapsed} />
            </SidebarCategory>

            <SidebarCategory label="SUPPORT" collapsed={isSidebarCollapsed}>
              <SidebarItem icon={<Settings size={18} />} label="Settings" collapsed={isSidebarCollapsed} hasDropdown />
              <SidebarItem icon={<BookOpen size={18} />} label="Playbook" collapsed={isSidebarCollapsed} hasDropdown />
            </SidebarCategory>
          </div>
        </ScrollArea>

        <div className="mt-auto p-3 border-t border-border">
          <SidebarItem 
            icon={isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />} 
            label="Collapse" 
            collapsed={isSidebarCollapsed} 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          {user && (
            <SidebarItem 
              icon={<LogOut size={18} />} 
              label="Logout" 
              collapsed={isSidebarCollapsed} 
              onClick={handleLogout} 
            />
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-5 z-10">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-muted rounded-lg lg:hidden text-muted-foreground"
            >
              <LayoutGrid size={20} />
            </button>
            <h1 className="text-base lg:text-lg font-bold tracking-tighter text-bento-accent flex items-center gap-2">
              <TrendingUp size={20} strokeWidth={3} className="hidden sm:block" /> 
              <span className="whitespace-nowrap">Trading Diary</span>
            </h1>
            <div className="relative ml-2 lg:ml-8 w-40 sm:w-60 lg:w-72 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <Input 
                placeholder="Search..." 
                className="h-8 pl-9 bg-background border-border text-xs focus-visible:ring-bento-accent/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {user && (
              <Button size="sm" onClick={handleAddTrade} className="h-8 px-2 sm:px-3 gap-1 sm:gap-2 bg-bento-accent text-background hover:bg-bento-accent/90">
                <Plus size={14} /> <span className="hidden xs:block">Add Trade</span>
              </Button>
            )}
            {user ? (
              <div className="flex items-center gap-2 lg:gap-3 pr-2 lg:pr-4 border-r border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium truncate max-w-[100px]">{user.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">Pro Trader</p>
                </div>
                <Avatar className="w-7 h-7 border border-border">
                  <AvatarImage src={user.photoURL || ''} />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={handleLogin} className="h-8 gap-2">
                <LogIn size={14} /> <span className="hidden sm:block">Sign In</span>
              </Button>
            )}
            <button className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[240px_1fr_280px] gap-3 h-full auto-rows-max lg:auto-rows-auto">
            
            {/* Column 1: Market Context & Planning */}
            <div className="flex flex-col gap-3">
              {/* Daily Performance */}
              <div className="bento-card h-[240px]">
                <div className="bento-title">Daily Performance</div>
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Today's PnL</p>
                    <p className="text-2xl font-bold text-bento-green">$0.00</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Daily Goal</span>
                      <span>$0.00</span>
                    </div>
                    <Progress value={0} className="h-1.5 bg-muted" />
                  </div>
                </div>
                <div className="mt-auto h-16 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]}>
                      <Bar dataKey="value" fill="#2DD4BF" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Active Calendar */}
              <div className="bento-card flex-1 overflow-hidden">
                <div className="bento-title">
                  Active Calendar <span>Oct 2023</span>
                </div>
                <div className="flex justify-center scale-90 origin-top">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border-none bg-transparent p-0"
                    classNames={{
                      day_selected: "bg-bento-accent text-background hover:bg-bento-accent hover:text-background focus:bg-bento-accent focus:text-background",
                      day_today: "bg-muted text-foreground",
                      head_cell: "text-muted-foreground font-normal text-[10px] w-8",
                      cell: "h-8 w-8 text-center text-[10px] p-0 relative",
                      day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                    }}
                  />
                </div>
                <div className="mt-4 text-[10px] text-bento-accent font-medium">
                  No upcoming events
                </div>
              </div>
            </div>

            {/* Column 2: Trade Recording and Analysis */}
            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">
              {/* Live Trade Log */}
              <div className="bento-card min-h-[200px] lg:h-[200px]">
                <div className="bento-title">Live Trade Log</div>
                <div className="overflow-auto flex-1">
                  <table className="bento-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Side</th>
                        <th>Entry</th>
                        <th>PnL</th>
                        <th>TP/SL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.slice(0, 3).map((trade) => (
                        <tr key={trade.id}>
                          <td className="font-bold">{trade.asset}</td>
                          <td>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                              trade.side === 'Buy' ? "bg-bento-green/10 text-bento-green" : "bg-bento-red/10 text-bento-red"
                            )}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="font-mono">{trade.entryPrice.toLocaleString()}</td>
                          <td className={cn("font-bold font-mono", trade.pnl >= 0 ? "text-bento-green" : "text-bento-red")}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString()}
                          </td>
                          <td className="text-[10px] opacity-60 font-mono">
                            {(trade.tp/1000).toFixed(1)}k/{(trade.sl/1000).toFixed(1)}k
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trade Journal */}
              <div className="bento-card flex-1 min-h-[300px]">
                <div className="bento-title">
                  Trade Journal <span>{currentTrade?.asset || 'No Active Trade'} ({currentTrade?.status || 'N/A'})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-3 h-full">
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-[10px] opacity-60 uppercase">Strategy</div>
                      <div className="text-[11px] font-medium">{currentTrade?.strategy || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] opacity-60 uppercase">Setup Score</div>
                      <div className="text-lg font-bold text-bento-accent">{currentTrade?.setupScore || '0'}/10</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-background p-2 rounded-lg text-[11px] text-muted-foreground leading-relaxed border border-border h-16 overflow-auto">
                      {currentTrade?.notes || 'No notes available for this trade.'}
                    </div>
                    <div className="flex gap-2">
                      {(currentTrade?.thumbnails || []).map((thumb, idx) => (
                        <div 
                          key={idx} 
                          className="flex-1 aspect-video bg-black rounded border border-border overflow-hidden relative group cursor-pointer"
                          onClick={() => currentTrade && setEditingThumbnail({ tradeId: currentTrade.id, index: idx })}
                        >
                          <img 
                            src={thumb} 
                            alt={`Thumbnail ${idx + 1}`} 
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <Badge variant="outline" className="text-[10px] border-bento-accent text-bento-accent bg-background/80">
                              {currentTrade?.annotations?.[idx] ? 'Edit Annotations' : 'Annotate'}
                            </Badge>
                          </div>
                          {currentTrade?.annotations?.[idx] && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-bento-accent rounded-full shadow-[0_0_5px_#2DD4BF]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {editingTrade && editingThumbnail && (
                <AnnotationEditor
                  isOpen={!!editingThumbnail}
                  onClose={() => setEditingThumbnail(null)}
                  imageUrl={editingTrade.thumbnails?.[editingThumbnail.index] || ''}
                  initialData={editingTrade.annotations?.[editingThumbnail.index]}
                  onSave={handleSaveAnnotation}
                />
              )}

              {/* Risk Dashboard */}
              <div className="bento-card h-[140px]">
                <div className="bento-title">Risk Dashboard</div>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">Account Balance</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">Margin Util.</span>
                    <span className="font-mono text-bento-red">0%</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">Max Drawdown</span>
                    <span className="font-mono text-bento-red">0.00%</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">Exposure</span>
                    <span className="font-mono">0.00%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Performance & Strategy Analytics */}
            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">
              {/* Performance Analytics */}
              <div className="bento-card h-[200px]">
                <div className="bento-title">Performance Analytics</div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_PERFORMANCE.equityCurve}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#2DD4BF" 
                        fill="none" 
                        strokeWidth={3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>Oct 2</span>
                  <span>Oct 22</span>
                </div>
              </div>

              {/* Core Metrics */}
              <div className="bento-card h-[180px]">
                <div className="bento-title">Core Metrics</div>
                <div className="flex items-center justify-around flex-1">
                  <div className="w-16 h-16 rounded-full border-[6px] border-border border-t-bento-accent rotate-45 flex items-center justify-center -rotate-45">
                    <span className="text-[12px] font-bold text-foreground">0%</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-[11px]">Profit Factor: <span className="text-bento-accent font-bold">0.0</span></div>
                    <div className="text-[11px]">Avg R:R: <span className="text-bento-accent font-bold">0:0</span></div>
                  </div>
                </div>
              </div>

              {/* Strategy Performance */}
              <div className="bento-card flex-1 overflow-hidden">
                <div className="bento-title">Strategy Performance</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] mb-1">No strategies tracked yet</div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-bento-accent" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
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
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  collapsed?: boolean; 
  hasDropdown?: boolean;
  onClick?: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full h-10 rounded-lg flex items-center transition-all duration-200 px-3 group",
        active 
          ? "bg-bento-gold text-white shadow-lg shadow-bento-gold/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <div className={cn("flex-shrink-0", active ? "text-white" : "group-hover:text-foreground")}>
        {icon}
      </div>
      {!collapsed && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-3 flex-1 flex items-center justify-between"
        >
          <span className="text-sm font-medium whitespace-nowrap">{label}</span>
          {hasDropdown && (
            <ChevronDown size={14} className={cn("opacity-50", active ? "text-white" : "")} />
          )}
        </motion.div>
      )}
    </button>
  );
}


function RiskMetric({ label, value, subtext, negative = false, warning = false }: { label: string; value: string; subtext?: string; negative?: boolean; warning?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn(
        "text-lg font-bold font-mono",
        negative ? "text-bento-red" : warning ? "text-orange-400" : "text-foreground"
      )}>
        {value}
      </p>
      {subtext && <p className="text-[10px] text-muted-foreground">{subtext}</p>}
    </div>
  );
}
