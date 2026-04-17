import React from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  ChevronRight, 
  Clock, 
  FileText,
  Search,
  Filter,
  Save,
  X,
  Trash2,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  auth,
  doc,
  updateDoc,
  deleteDoc
} from '@/src/firebase';

type ReviewPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface SelfReview {
  id: string;
  uid: string;
  period: ReviewPeriod;
  date: string;
  content: string;
  createdAt: string;
}

export function AdvancedSelfReviewView({ onBack, isDarkMode }: { onBack: () => void, isDarkMode?: boolean }) {
  const [period, setPeriod] = React.useState<ReviewPeriod>('day');
  const [reviews, setReviews] = React.useState<SelfReview[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingReview, setEditingReview] = React.useState<SelfReview | null>(null);
  const [newContent, setNewContent] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'selfReviews'),
      where('uid', '==', auth.currentUser.uid),
      where('period', '==', period)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SelfReview[];
      setReviews(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });

    return () => unsubscribe();
  }, [period]);

  const handleSave = async () => {
    if (!newContent.trim() || !auth.currentUser) return;

    setIsLoading(true);
    try {
      if (editingReview) {
        await updateDoc(doc(db, 'selfReviews', editingReview.id), {
          content: newContent,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'selfReviews'), {
          uid: auth.currentUser.uid,
          period,
          date: new Date().toISOString(),
          content: newContent,
          createdAt: new Date().toISOString()
        });
      }
      setNewContent('');
      setIsAdding(false);
      setEditingReview(null);
    } catch (error) {
      console.error("Error saving review:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review note?")) return;
    try {
      await deleteDoc(doc(db, 'selfReviews', id));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleEdit = (review: SelfReview) => {
    setEditingReview(review);
    setNewContent(review.content);
    setIsAdding(true);
  };

  const periodConfig: Record<ReviewPeriod, { label: string, icon: React.ReactNode }> = {
    day: { label: 'Daily', icon: <Clock size={16} /> },
    week: { label: 'Weekly', icon: <Calendar size={16} /> },
    month: { label: 'Monthly', icon: <Calendar size={16} /> },
    quarter: { label: 'Quarterly', icon: <Calendar size={16} /> },
    year: { label: 'Yearly', icon: <Calendar size={16} /> }
  };

  return (
    <div className={cn(
      "flex-1 flex flex-col overflow-hidden transition-colors duration-300",
      isDarkMode ? "bg-[#0F172A] text-slate-200" : "bg-[#F8FAFC] text-foreground"
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
            <h1 className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>Advanced Self Review</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Performance evaluation & growth notes</p>
          </div>
        </div>
        
        <div className={cn(
          "flex items-center p-1 rounded-xl border transition-colors",
          isDarkMode ? "bg-[#0F172A] border-slate-700" : "bg-[#F1F5F9] border-slate-200"
        )}>
          {(Object.keys(periodConfig) as ReviewPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                period === p 
                  ? (isDarkMode ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white text-[#0F172A] shadow-sm") 
                  : "text-muted-foreground hover:text-[#0F172A]"
              )}
            >
              {periodConfig[p].icon}
              {periodConfig[p].label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className={cn("text-lg font-black uppercase tracking-tight", isDarkMode ? "text-slate-200" : "text-[#0F172A]")}>
                {periodConfig[period].label} Reviews
              </h2>
              <p className="text-xs text-muted-foreground">Historical records of your self-evaluations</p>
            </div>
            {!isAdding && (
              <Button 
                onClick={() => setIsAdding(true)}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl gap-2"
              >
                <Plus size={16} />
                New {periodConfig[period].label} Note
              </Button>
            )}
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "rounded-2xl p-6 border shadow-xl space-y-4 transition-colors",
                  isDarkMode ? "bg-[#1E293B] border-slate-700" : "bg-white border-[#3B82F6]/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    <h3 className={cn("font-bold", isDarkMode ? "text-white" : "text-[#0F172A]")}>
                      {editingReview ? `Editing ${periodConfig[period].label} Review` : `Writing ${periodConfig[period].label} Review`}
                    </h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingReview(null); setNewContent(''); }} className="rounded-full">
                    <X size={18} />
                  </Button>
                </div>
                <Textarea 
                  placeholder="What went well? What could be improved? Specific lessons learned..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className={cn(
                    "min-h-[200px] rounded-xl transition-all p-4 resize-none",
                    isDarkMode ? "bg-[#0F172A] border-slate-700 text-white placeholder:text-slate-600" : "bg-[#F8FAFC] border-border"
                  )}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingReview(null); setNewContent(''); }} className="rounded-xl font-bold">Cancel</Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading || !newContent.trim()}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl gap-2 px-6"
                  >
                    <Save size={16} />
                    {isLoading ? 'Saving...' : (editingReview ? 'Update Review' : 'Save Review')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div 
                key={review.id}
                className={cn(
                  "rounded-2xl p-6 border transition-all group hover:shadow-lg",
                  isDarkMode ? "bg-[#1E293B] border-slate-700/50 hover:border-slate-600" : "bg-white border-border/50 hover:border-[#3B82F6]/30"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      isDarkMode ? "bg-[#0F172A] text-blue-400" : "bg-[#F8FAFC] text-[#3B82F6]"
                    )}>
                      {periodConfig[review.period].icon}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold text-muted-foreground uppercase tracking-widest")}>
                        {format(new Date(review.date), 'MMMM dd, yyyy')}
                      </p>
                      <h4 className={cn("font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>
                         {periodConfig[review.period].label} Summary
                      </h4>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "rounded-full text-[10px] font-bold px-3 transition-colors",
                    isDarkMode ? "border-slate-700 text-slate-400" : "border-border text-muted-foreground"
                  )}>
                    {review.period.toUpperCase()}
                  </Badge>
                </div>
                <div className={cn(
                  "text-sm leading-relaxed whitespace-pre-wrap transition-colors",
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                )}>
                  {review.content}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700/30 flex items-center justify-between transition-opacity">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                    {review.createdAt ? `POSTED ${format(new Date(review.createdAt), 'HH:mm')}` : 'POSTED RECENTLY'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(review)}
                      className="text-xs font-bold text-[#3B82F6] hover:bg-[#3B82F6]/10 h-8 gap-1.5"
                    >
                      <Edit3 size={14} />
                      Edit Note
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(review.id)}
                      className="text-xs font-bold text-red-400 hover:bg-red-400/10 h-8 gap-1.5"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {reviews.length === 0 && !isAdding && (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <FileText size={64} className="text-muted-foreground" />
                <div className="space-y-1">
                  <p className={cn("text-lg font-black", isDarkMode ? "text-white" : "text-[#0F172A]")}>No {period === 'day' ? 'Daily' : periodConfig[period].label} Reviews Yet</p>
                  <p className="text-sm font-medium max-w-[300px]">Start building your professional edge by reviewing your performance consistently.</p>
                </div>
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl mt-4"
                >
                  Create First Record
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
