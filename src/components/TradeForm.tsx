import React, { useState } from 'react';
import { 
  ChevronLeft, 
  UploadCloud, 
  TrendingUp, 
  Info, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Heart,
  X,
  CheckCircle2,
  LayoutTemplate,
  ChevronDown as ChevronDownIcon,
  Zap,
  DollarSign,
  BookOpen,
  FileText,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Trade } from '@/src/types';
import { Badge } from '@/components/ui/badge';

interface TradeFormProps {
  onBack: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'uid'>) => void;
  initialData?: Trade;
}

export function TradeForm({ onBack, onSave, initialData }: TradeFormProps) {
  const [formData, setFormData] = useState<Omit<Trade, 'id' | 'uid'>>({
    asset: initialData?.asset || 'EURUSD',
    side: initialData?.side || 'Long',
    size: initialData?.size || '2',
    entryPrice: initialData?.entryPrice || 0,
    sl: initialData?.sl || 0,
    tp: initialData?.tp || 0,
    status: initialData?.status || 'Active',
    strategy: initialData?.strategy || 'None',
    notes: initialData?.notes || '',
    timestamp: initialData?.timestamp || new Date().toISOString(),
    account: initialData?.account || '',
    tags: initialData?.tags || [],
    rules: initialData?.rules || [],
    thumbnails: initialData?.thumbnails || [],
    annotations: initialData?.annotations || {},
    exitPrice: initialData?.exitPrice || 0,
    exitSize: initialData?.exitSize || initialData?.size || '0',
    commission: initialData?.commission || 0,
    exitTimestamp: initialData?.exitTimestamp || new Date().toISOString(),
    isCompleted: initialData?.isCompleted || false,
    postReflection: initialData?.postReflection || '',
    pulses: initialData?.pulses || [],
    session: initialData?.session || 'London',
    htfBias: initialData?.htfBias || 'Neutral',
    confluence: initialData?.confluence || [],
    marketCondition: initialData?.marketCondition || 'Trending',
    emotions: initialData?.emotions || { before: '', during: '', after: '' },
    executionRating: initialData?.executionRating || 5
  });

  const [date, setDate] = useState<Date>(new Date(formData.timestamp));
  const [time, setTime] = useState<string>(format(new Date(formData.timestamp), 'HH:mm'));
  const [exitDate, setExitDate] = useState<Date>(new Date(formData.exitTimestamp || Date.now()));
  const [exitTime, setExitTime] = useState<string>(format(new Date(formData.exitTimestamp || Date.now()), 'HH:mm'));
  const [tagInput, setTagInput] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const [showPostPrompts, setShowPostPrompts] = useState(false);

  const handleSave = () => {
    const combinedTimestamp = new Date(date);
    const [hours, minutes] = time.split(':');
    combinedTimestamp.setHours(parseInt(hours), parseInt(minutes));

    const combinedExitTimestamp = new Date(exitDate);
    const [eHours, eMinutes] = exitTime.split(':');
    combinedExitTimestamp.setHours(parseInt(eHours), parseInt(eMinutes));

    // Calculate P&L, Pips, R-Multiple
    let pnl = 0;
    let pips = 0;
    let rMultiple = 0;
    const sizeNum = parseFloat(formData.size) || 0;

    if (formData.exitPrice && formData.entryPrice) {
      const diff = formData.side === 'Long' 
        ? formData.exitPrice - formData.entryPrice 
        : formData.entryPrice - formData.exitPrice;
      
      pnl = diff * sizeNum * 100000; // Assuming standard lots for simplicity, adjust as needed
      pips = diff * 10000; // Standard forex pips
      
      if (formData.sl && formData.entryPrice) {
        const risk = Math.abs(formData.entryPrice - formData.sl);
        if (risk > 0) {
          rMultiple = diff / risk;
        }
      }
    }
    
    onSave({
      ...formData,
      pnl,
      pips,
      rMultiple,
      timestamp: combinedTimestamp.toISOString(),
      exitTimestamp: combinedExitTimestamp.toISOString()
    });
  };

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag)
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0B0E] text-foreground overflow-y-auto custom-scrollbar dark">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-[#0A0B0E]/80 backdrop-blur-md z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight">
            {initialData ? 'Edit Trade' : 'New Trade'}
          </h2>
          <div className="flex items-center gap-1.5 text-bento-green text-xs font-medium bg-bento-green/10 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} />
            Saved
          </div>
        </div>
        <div className="w-16" /> {/* Spacer for symmetry */}
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-12 pb-24">
        {/* Attachments Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bento-accent/10 rounded-lg flex items-center justify-center">
              <UploadCloud className="text-bento-accent w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Attachments</h3>
          </div>
          
          <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center gap-4 bg-card/30 hover:bg-card/50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="text-muted-foreground w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                <span className="text-bento-accent">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF (max. 5MB each) • 0/8 files
              </p>
            </div>
          </div>
        </section>

        {/* Entry Details Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bento-accent/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-bento-accent w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Entry Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  Instrument / Pair *
                  <Info size={14} className="text-muted-foreground" />
                </Label>
                <Select 
                  value={formData.asset} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, asset: v }))}
                >
                  <SelectTrigger className="bg-card border-border h-12">
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="EURUSD">EURUSD</SelectItem>
                    <SelectItem value="GBPUSD">GBPUSD</SelectItem>
                    <SelectItem value="BTCUSD">BTCUSD</SelectItem>
                    <SelectItem value="NQ100">NQ100</SelectItem>
                    <SelectItem value="ES500">ES500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Position Size (Lots) *</Label>
                <Input 
                  type="text" 
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="bg-card border-border h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Date *</Label>
                <Popover>
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal bg-card border-border",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className="bg-card"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center justify-between">
                  <span>Entry Time (Optional)</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input 
                      type="text" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-card border-border h-12 pl-4"
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  </div>
                  <Button 
                    variant="ghost" 
                    className="h-12 text-muted-foreground hover:text-foreground"
                    onClick={() => setTime(format(new Date(), 'HH:mm'))}
                  >
                    Use now
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-12 text-muted-foreground hover:text-foreground"
                    onClick={() => setTime('')}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Session *</Label>
                <Select 
                  value={formData.session} 
                  onValueChange={(v: any) => setFormData(prev => ({ ...prev, session: v }))}
                >
                  <SelectTrigger className="bg-card border-border h-12">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Asian">Asian</SelectItem>
                    <SelectItem value="London">London</SelectItem>
                    <SelectItem value="New York">New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">HTF Bias *</Label>
                <Select 
                  value={formData.htfBias} 
                  onValueChange={(v: any) => setFormData(prev => ({ ...prev, htfBias: v }))}
                >
                  <SelectTrigger className="bg-card border-border h-12">
                    <SelectValue placeholder="Select bias" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Bullish">Bullish</SelectItem>
                    <SelectItem value="Bearish">Bearish</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Market Condition *</Label>
                <Select 
                  value={formData.marketCondition} 
                  onValueChange={(v: any) => setFormData(prev => ({ ...prev, marketCondition: v }))}
                >
                  <SelectTrigger className="bg-card border-border h-12">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Trending">Trending</SelectItem>
                    <SelectItem value="Ranging">Ranging</SelectItem>
                    <SelectItem value="Volatile">Volatile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Entry Price *</Label>
                <Input 
                  type="number" 
                  value={formData.entryPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) }))}
                  className="bg-card border-border h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Stop Loss (Optional)</Label>
                <Input 
                  type="number" 
                  value={formData.sl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sl: parseFloat(e.target.value) }))}
                  className="bg-card border-border h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  Strategy
                  <Info size={14} className="text-muted-foreground" />
                </Label>
                <Select 
                  value={formData.strategy} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, strategy: v }))}
                >
                  <SelectTrigger className="bg-card border-border h-12">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Breakout">Breakout</SelectItem>
                    <SelectItem value="Mean Reversion">Mean Reversion</SelectItem>
                    <SelectItem value="Trend Following">Trend Following</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold">Accounts *</Label>
                <Select 
                  value={formData.account} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, account: v }))}
                >
                  <SelectTrigger className="bg-card border-border h-12">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate size={16} className="text-bento-accent" />
                      <SelectValue placeholder="Select accounts" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Main Account">Main Account</SelectItem>
                    <SelectItem value="Prop Firm 1">Prop Firm 1</SelectItem>
                    <SelectItem value="Demo Account">Demo Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Trade Type *</Label>
                <Select 
                  value={formData.side} 
                  onValueChange={(v: any) => setFormData(prev => ({ ...prev, side: v }))}
                >
                  <SelectTrigger className="bg-card border-border h-12">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Long">Long</SelectItem>
                    <SelectItem value="Short">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  Tags
                  <Info size={14} className="text-muted-foreground" />
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-muted text-xs py-1 pl-2 pr-1 flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="relative">
                  <Input 
                    placeholder="Add tags..." 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    className="bg-card border-border h-12 pl-10"
                  />
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Take Profit (Optional)</Label>
                <Input 
                  type="number" 
                  value={formData.tp}
                  onChange={(e) => setFormData(prev => ({ ...prev, tp: parseFloat(e.target.value) }))}
                  className="bg-card border-border h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  Rules Checklist
                  <Info size={14} className="text-muted-foreground" />
                </Label>
                <Select>
                  <SelectTrigger className="bg-card border-border h-12">
                    <SelectValue placeholder="Rules" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="rule1">Rule 1: Trend Confirmed</SelectItem>
                    <SelectItem value="rule2">Rule 2: Volume Spiked</SelectItem>
                    <SelectItem value="rule3">Rule 3: RSI Divergence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Emotional State & Execution Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bento-accent/10 rounded-lg flex items-center justify-center">
              <Heart className="text-bento-accent w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Psychology & Execution</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Emotion (Before)</Label>
              <Input 
                placeholder="e.g. Calm, Excited" 
                value={formData.emotions?.before}
                onChange={(e) => setFormData(prev => ({ ...prev, emotions: { ...prev.emotions!, before: e.target.value } }))}
                className="bg-card border-border h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">Emotion (During)</Label>
              <Input 
                placeholder="e.g. Anxious, Focused" 
                value={formData.emotions?.during}
                onChange={(e) => setFormData(prev => ({ ...prev, emotions: { ...prev.emotions!, during: e.target.value } }))}
                className="bg-card border-border h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">Emotion (After)</Label>
              <Input 
                placeholder="e.g. Relieved, Frustrated" 
                value={formData.emotions?.after}
                onChange={(e) => setFormData(prev => ({ ...prev, emotions: { ...prev.emotions!, after: e.target.value } }))}
                className="bg-card border-border h-12"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-bold">Execution Rating (1-5)</Label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFormData(prev => ({ ...prev, executionRating: rating }))}
                  className={cn(
                    "w-12 h-12 rounded-xl border-2 transition-all font-bold",
                    formData.executionRating === rating 
                      ? "bg-bento-accent border-bento-accent text-background" 
                      : "border-border hover:border-bento-accent/50"
                  )}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Pre-Trade Outlook Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">Pre-Trade Outlook</h3>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <LayoutTemplate size={16} />
              Templates
              <ChevronDown size={14} />
            </Button>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => setShowPrompts(!showPrompts)}
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
            >
              What should I write?
              <ChevronDownIcon size={12} className={cn("transition-transform duration-200", showPrompts && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showPrompts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card/30 border border-border rounded-lg p-4 space-y-4 text-xs sm:text-sm mb-2">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">Market Bias</p>
                      <p className="text-muted-foreground">What's your directional bias and why?</p>
                      <ul className="list-disc list-inside text-muted-foreground pl-2 space-y-0.5 opacity-80">
                        <li>HTF trend (D / 4H)</li>
                        <li>Liquidity targets</li>
                        <li>Key levels (PDH/PDL, range high/low)</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">Session & Context</p>
                      <p className="text-muted-foreground">What session are you trading and what's the context?</p>
                      <ul className="list-disc list-inside text-muted-foreground pl-2 space-y-0.5 opacity-80">
                        <li>London / NY / Asia</li>
                        <li>News risk?</li>
                        <li>Range vs expansion environment</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">Mental State</p>
                      <p className="text-muted-foreground">How do you feel right now?</p>
                      <ul className="list-disc list-inside text-muted-foreground pl-2 space-y-0.5 opacity-80">
                        <li>Calm / rushed / impatient</li>
                        <li>Any external distractions?</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Textarea 
              placeholder="Start blank or with a template"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-card border-border min-h-[200px] resize-none focus-visible:ring-bento-accent/50"
            />
          </div>
        </section>

        {/* Pulses Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-bento-accent/10 rounded-lg flex items-center justify-center">
                <Zap className="text-bento-accent fill-bento-accent w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold tracking-tight">Pulses</h3>
                <Info size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-border gap-2">
              <Zap size={14} /> Add Pulse
            </Button>
          </div>
          
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              No pulses linked yet. Add a pulse to capture your intraday thoughts.
            </p>
          </div>
          <div className="border-t border-border/50" />
        </section>

        {/* Exit Details Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bento-accent/10 rounded-lg flex items-center justify-center">
              <DollarSign className="text-bento-accent w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Exit Details</h3>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFormData(prev => ({ ...prev, isCompleted: !prev.isCompleted }))}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center transition-colors",
                formData.isCompleted ? "bg-bento-accent text-background" : "border border-border"
              )}
            >
              {formData.isCompleted && <CheckCircle size={14} />}
            </button>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <CheckCircle size={14} className={formData.isCompleted ? "text-bento-accent" : "text-muted-foreground"} />
              Trade is completed
            </div>
          </div>

          <div className="bg-card/30 border border-border rounded-xl p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold">Exit Price *</Label>
                <Input 
                  type="number" 
                  value={formData.exitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitPrice: parseFloat(e.target.value) }))}
                  className="bg-card border-border h-12"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold">Exit Size</Label>
                <Input 
                  type="text" 
                  value={formData.exitSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitSize: e.target.value }))}
                  className="bg-card border-border h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold">Commission Fee</Label>
                <div className="space-y-1">
                  <Input 
                    type="number" 
                    value={formData.commission}
                    onChange={(e) => setFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) }))}
                    className="bg-card border-border h-12"
                    placeholder="e.g. 5.00"
                  />
                  <p className="text-[10px] text-muted-foreground">Enter as positive number (auto-deducted)</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold">P&L</Label>
                  <button className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground">
                    <RefreshCw size={10} /> Recalculate
                  </button>
                </div>
                <div className="bg-card border border-border h-12 rounded-lg flex items-center px-4 font-mono text-sm">
                  0.00
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center justify-between">
                  <span>Exit Date</span>
                  <ChevronDownIcon size={14} className="text-muted-foreground" />
                </Label>
                <div className="flex gap-3">
                  <Popover>
                    <PopoverTrigger className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full h-12 justify-start text-left font-normal bg-card border-border"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {exitDate ? format(exitDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={exitDate}
                        onSelect={(d) => d && setExitDate(d)}
                        initialFocus
                        className="bg-card"
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    variant="ghost" 
                    className="h-12 text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setExitDate(new Date())}
                  >
                    Use now
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-12 text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setExitDate(new Date())}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center justify-between">
                  <span>Exit Time</span>
                  <ChevronDownIcon size={14} className="text-muted-foreground" />
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input 
                      type="text" 
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="bg-card border-border h-12 pl-4"
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  </div>
                  <Button 
                    variant="ghost" 
                    className="h-12 text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setExitTime(format(new Date(), 'HH:mm'))}
                  >
                    Use now
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-12 text-muted-foreground hover:text-foreground px-2"
                    onClick={() => setExitTime('')}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="border-border gap-2 h-10">
            <Plus size={16} /> Add Partial Exit
          </Button>
        </section>

        {/* Post-Trade Reflection Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-bento-accent/10 rounded-lg flex items-center justify-center">
                <BookOpen className="text-bento-accent w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Post-Trade Reflection</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <LayoutTemplate size={16} />
              Templates
              <ChevronDownIcon size={14} />
            </Button>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => setShowPostPrompts(!showPostPrompts)}
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
            >
              What should I write?
              <ChevronDownIcon size={12} className={cn("transition-transform duration-200", showPostPrompts && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showPostPrompts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card/30 border border-border rounded-lg p-4 space-y-4 text-xs sm:text-sm mb-2">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">Execution</p>
                      <p className="text-muted-foreground">Did I follow my plan?</p>
                      <ul className="list-disc list-inside text-muted-foreground pl-2 space-y-0.5 opacity-80">
                        <li>Entry quality</li>
                        <li>SL/TP placement</li>
                        <li>Rules broken (if any)</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">Outcome & Learning</p>
                      <p className="text-muted-foreground">What caused the result?</p>
                      <ul className="list-disc list-inside text-muted-foreground pl-2 space-y-0.5 opacity-80">
                        <li>Setup validity vs randomness</li>
                        <li>What I'd repeat/avoid</li>
                        <li>1 takeaway</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">Emotional / Process</p>
                      <p className="text-muted-foreground">How did I manage myself?</p>
                      <ul className="list-disc list-inside text-muted-foreground pl-2 space-y-0.5 opacity-80">
                        <li>Patience, impulse control, confidence</li>
                        <li>What triggered mistakes</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Textarea 
              placeholder="Start blank or with a template"
              value={formData.postReflection}
              onChange={(e) => setFormData(prev => ({ ...prev, postReflection: e.target.value }))}
              className="bg-card border-border min-h-[200px] resize-none focus-visible:ring-bento-accent/50"
            />
          </div>
        </section>

        {/* Additional Notes Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bento-accent/10 rounded-lg flex items-center justify-center">
              <FileText className="text-bento-accent w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold tracking-tight">Additional Notes</h3>
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </div>
          </div>
          
          <Button variant="outline" className="border-border gap-2 h-10">
            <Plus size={16} /> Add Section
          </Button>
          <div className="border-t border-border/50" />
        </section>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button 
            onClick={handleSave}
            className="flex-1 bg-bento-accent text-background hover:bg-bento-accent/90 h-14 text-lg font-bold rounded-xl shadow-lg shadow-bento-accent/20"
          >
            {initialData ? 'Update Trade' : 'Save Trade'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex-1 border-border h-14 text-lg font-bold rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChevronDown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
