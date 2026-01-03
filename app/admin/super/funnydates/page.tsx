"use client"

/**
 * 💔 FunnyDates - Quotes Manager (HOLLYWOOD EDITION!)
 * 
 * מנהל ציטוטים לאתר funnydates101.co.il
 * - ניהול ציטוטים דינאמיים לטיקר באתר
 * - תעדוף, הפעלה/כיבוי, עריכה
 * - עיצוב הוליווד 🎬
 * 
 * v1.0.0
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Heart,
  Quote,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  GripVertical,
  RefreshCw,
  Copy,
  Check,
  Star,
  BookOpen,
  MessageCircle,
  Flame,
  Zap,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  RotateCcw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface QuoteItem {
  id: string
  text: string
  source?: string
  emoji?: string
  isActive: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
  views?: number
  category?: 'romantic' | 'funny' | 'awkward' | 'dramatic' | 'philosophical'
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT QUOTES FROM THE BOOK
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_QUOTES: Omit<QuoteItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    text: "עלתה לאוטו עם שלושה סלים – הבנתי שאני לא בדייט, אני בשליחות",
    source: "דייט עם סבתא... ועם שלושה סלים",
    emoji: "🧺",
    isActive: true,
    priority: 1,
    category: 'funny'
  },
  {
    text: "שבע כוסות יין ופתאום אנחנו זוג ותיק",
    source: "נפגשנו לפני רבע שעה",
    emoji: "🍷",
    isActive: true,
    priority: 2,
    category: 'funny'
  },
  {
    text: "לפעמים צריך לבלוע את הצפרדע – עניתי: אני בולע רק סטייקים",
    source: "הצפרדע, המפתחות ומרינה",
    emoji: "🐸",
    isActive: true,
    priority: 3,
    category: 'funny'
  },
  {
    text: "יש לך שיניים יפות. וזהו. זה כל מה שנשאר מהדייט",
    source: "יש לך שיניים יפות (וזהו)",
    emoji: "😬",
    isActive: true,
    priority: 4,
    category: 'awkward'
  },
  {
    text: "היא התחילה לדבר על ילדים – קצת גבוה בשביל מישהו שכרגע ירד מכרית",
    source: "אהבה בקומה 42",
    emoji: "🏢",
    isActive: true,
    priority: 5,
    category: 'dramatic'
  },
  {
    text: "קובעים לסרט – מגיעים כשכבר מתחיל הסרט הבא",
    source: "בין קבלה לאיחור",
    emoji: "🎬",
    isActive: true,
    priority: 6,
    category: 'funny'
  },
  {
    text: "בדיוק כשהתחיל השיר של הטיטאניק – נכנסה לאוטו. לא רוז.",
    source: "הטיטאניק שלי טבעה בחניה",
    emoji: "🚢",
    isActive: true,
    priority: 7,
    category: 'romantic'
  },
  {
    text: "היא נעלמה כמו עשן של סיגריה – ריח חזק, בלי סימן לאן הלכה",
    source: "אהבה, ניקוטין והאלמנה השחורה",
    emoji: "💨",
    isActive: true,
    priority: 8,
    category: 'dramatic'
  },
  {
    text: "בדייטים, כמו באפליקציות – תמיד יש באג שלא סיפרו לך עליו",
    source: "הספר",
    emoji: "🐛",
    isActive: true,
    priority: 9,
    category: 'philosophical'
  },
  {
    text: "גוגל טרנסלייט שווה זהב, אבל אין לו קסם להפוך דייט למערכת יחסים",
    source: "אהבה בשפה זרה",
    emoji: "🌍",
    isActive: false,
    priority: 10,
    category: 'philosophical'
  },
  {
    text: "ריקוד של דקה שווה הרבה יותר מדייט של שעתיים",
    source: "רוח סערה מרחוב הארבעה",
    emoji: "💃",
    isActive: false,
    priority: 11,
    category: 'romantic'
  },
  {
    text: "כשהמזגן התפוצץ – משהו בה נכבה",
    source: "דייט לוהט מדי",
    emoji: "🔥",
    isActive: false,
    priority: 12,
    category: 'dramatic'
  },
  {
    text: "היא אמרה שמבינה הכל. אבל להבין זה לא מספיק – צריך גם לדבר",
    source: "אני מבינה הכל",
    emoji: "🤫",
    isActive: false,
    priority: 13,
    category: 'philosophical'
  },
  {
    text: "המיטה הייתה ענקית, אבל החום האנושי נשאר בדיוטי פרי",
    source: "כבר אמרתי פולניה?",
    emoji: "🛏️",
    isActive: false,
    priority: 14,
    category: 'funny'
  },
  {
    text: "דייט בחשיכה – לא זיהיתי אפילו את עצמי",
    source: "דייט בחשיכה",
    emoji: "🌑",
    isActive: false,
    priority: 15,
    category: 'awkward'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIES = {
  romantic: { label: '💕 רומנטי', color: 'from-pink-500 to-rose-500' },
  funny: { label: '😂 מצחיק', color: 'from-yellow-500 to-orange-500' },
  awkward: { label: '😅 מביך', color: 'from-purple-500 to-indigo-500' },
  dramatic: { label: '🎭 דרמטי', color: 'from-red-500 to-rose-600' },
  philosophical: { label: '🤔 פילוסופי', color: 'from-blue-500 to-cyan-500' }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function FunnyDatesQuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<QuoteItem>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuote, setNewQuote] = useState<Partial<QuoteItem>>({
    text: '',
    source: '',
    emoji: '💔',
    isActive: true,
    category: 'funny'
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [hasChanges, setHasChanges] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const loadQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const quotesRef = collection(db, 'funnydates_quotes')
      const q = query(quotesRef, orderBy('priority', 'asc'))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        // Initialize with default quotes
        console.log('📚 Initializing with default quotes...')
        const batch = writeBatch(db)
        const now = new Date()
        
        DEFAULT_QUOTES.forEach((quote, index) => {
          const docRef = doc(collection(db, 'funnydates_quotes'))
          batch.set(docRef, {
            ...quote,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            views: 0
          })
        })
        
        await batch.commit()
        // Reload after initialization
        const newSnapshot = await getDocs(q)
        const loadedQuotes = newSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || now,
          updatedAt: doc.data().updatedAt?.toDate() || now
        })) as QuoteItem[]
        
        setQuotes(loadedQuotes.sort((a, b) => a.priority - b.priority))
      } else {
        const loadedQuotes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as QuoteItem[]
        
        setQuotes(loadedQuotes.sort((a, b) => a.priority - b.priority))
      }
    } catch (error) {
      console.error('Error loading quotes:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addQuote = async () => {
    if (!newQuote.text?.trim()) return
    setSaving(true)
    
    try {
      const docRef = doc(collection(db, 'funnydates_quotes'))
      const now = new Date()
      
      await setDoc(docRef, {
        text: newQuote.text,
        source: newQuote.source || '',
        emoji: newQuote.emoji || '💔',
        isActive: newQuote.isActive ?? true,
        category: newQuote.category || 'funny',
        priority: quotes.length + 1,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        views: 0
      })
      
      setNewQuote({ text: '', source: '', emoji: '💔', isActive: true, category: 'funny' })
      setShowAddForm(false)
      loadQuotes()
    } catch (error) {
      console.error('Error adding quote:', error)
    }
    setSaving(false)
  }

  const updateQuote = async (id: string, updates: Partial<QuoteItem>) => {
    setSaving(true)
    try {
      const docRef = doc(db, 'funnydates_quotes', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      })
      loadQuotes()
      setEditingId(null)
      setEditForm({})
    } catch (error) {
      console.error('Error updating quote:', error)
    }
    setSaving(false)
  }

  const deleteQuote = async (id: string) => {
    if (!confirm('למחוק את הציטוט?')) return
    setSaving(true)
    try {
      await deleteDoc(doc(db, 'funnydates_quotes', id))
      loadQuotes()
    } catch (error) {
      console.error('Error deleting quote:', error)
    }
    setSaving(false)
  }

  const toggleActive = async (quote: QuoteItem) => {
    await updateQuote(quote.id, { isActive: !quote.isActive })
  }

  const movePriority = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = quotes.findIndex(q => q.id === id)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === quotes.length - 1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const swapQuote = quotes[newIndex]
    
    const batch = writeBatch(db)
    batch.update(doc(db, 'funnydates_quotes', id), { 
      priority: swapQuote.priority,
      updatedAt: Timestamp.fromDate(new Date())
    })
    batch.update(doc(db, 'funnydates_quotes', swapQuote.id), { 
      priority: quotes[currentIndex].priority,
      updatedAt: Timestamp.fromDate(new Date())
    })
    
    await batch.commit()
    loadQuotes()
  }

  const copyQuote = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERED QUOTES
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredQuotes = quotes.filter(q => {
    if (filter === 'active') return q.isActive
    if (filter === 'inactive') return !q.isActive
    return true
  })

  const activeCount = quotes.filter(q => q.isActive).length

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Floating Hearts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: '100vh',
              opacity: 0 
            }}
            animate={{ 
              y: '-10vh',
              opacity: [0, 0.3, 0.1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 2,
              ease: 'linear'
            }}
          >
            {['💔', '❤️', '💕', '💖'][i % 4]}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-red-500/20"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Back & Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/super')}
                className="text-gray-400 hover:text-white hover:bg-red-500/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BookOpen className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
                    FunnyDates Quotes
                  </h1>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">ניהול ציטוטים לאתר</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-red-400">{activeCount} פעילים</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadQuotes}
                disabled={loading}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
                רענן
              </Button>
              
              <a 
                href="https://funnydates101.co.il" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  <ExternalLink className="w-4 h-4 ml-1" />
                  צפה באתר
                </Button>
              </a>
              
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30"
              >
                <Plus className="w-4 h-4 ml-1" />
                ציטוט חדש
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { icon: Quote, label: 'סה״כ ציטוטים', value: quotes.length, color: 'from-red-500 to-rose-500' },
            { icon: Eye, label: 'פעילים', value: activeCount, color: 'from-green-500 to-emerald-500' },
            { icon: EyeOff, label: 'מוסתרים', value: quotes.length - activeCount, color: 'from-gray-500 to-gray-600' },
            { icon: Flame, label: 'הכי פופולרי', value: '💔', color: 'from-orange-500 to-amber-500' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-[#111]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-4 hover:border-red-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6"
        >
          {[
            { key: 'all', label: 'הכל', count: quotes.length },
            { key: 'active', label: 'פעילים', count: activeCount },
            { key: 'inactive', label: 'מוסתרים', count: quotes.length - activeCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                  : 'bg-[#111] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </motion.div>

        {/* Quotes List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <AnimatePresence>
            {filteredQuotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-[#111]/80 backdrop-blur-sm rounded-2xl border transition-all ${
                  quote.isActive 
                    ? 'border-red-500/30 hover:border-red-500/50' 
                    : 'border-white/5 hover:border-white/10 opacity-60'
                }`}
              >
                {editingId === quote.id ? (
                  // Edit Mode
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400 font-medium">עריכת ציטוט</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">טקסט הציטוט</label>
                        <textarea
                          value={editForm.text || quote.text}
                          onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-red-500/30 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-red-500 resize-none"
                          rows={2}
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">מקור (פרק)</label>
                          <Input
                            value={editForm.source ?? quote.source}
                            onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                            className="bg-[#0a0a0a] border-red-500/30 focus:border-red-500"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">אימוג׳י</label>
                          <Input
                            value={editForm.emoji ?? quote.emoji}
                            onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                            className="bg-[#0a0a0a] border-red-500/30 focus:border-red-500 text-center text-2xl"
                            maxLength={2}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">קטגוריה</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(CATEGORIES).map(([key, cat]) => (
                            <button
                              key={key}
                              onClick={() => setEditForm({ ...editForm, category: key as QuoteItem['category'] })}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                (editForm.category || quote.category) === key
                                  ? `bg-gradient-to-r ${cat.color} text-white`
                                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingId(null); setEditForm({}) }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4 ml-1" />
                        ביטול
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateQuote(quote.id, editForm)}
                        disabled={saving}
                        className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                      >
                        <Save className="w-4 h-4 ml-1" />
                        שמור
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Priority & Drag */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => movePriority(quote.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-sm font-bold text-red-400">
                          {quote.priority}
                        </div>
                        <button
                          onClick={() => movePriority(quote.id, 'down')}
                          disabled={index === filteredQuotes.length - 1}
                          className="p-1 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Emoji */}
                      <div className="text-4xl">{quote.emoji}</div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-lg text-white leading-relaxed mb-2">
                          "{quote.text}"
                        </p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-red-400">— {quote.source || 'הספר'}</span>
                          {quote.category && (
                            <span className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${CATEGORIES[quote.category]?.color} text-white`}>
                              {CATEGORIES[quote.category]?.label}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyQuote(quote.text, quote.id)}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="העתק"
                        >
                          {copiedId === quote.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => toggleActive(quote)}
                          className={`p-2 rounded-lg transition-all ${
                            quote.isActive 
                              ? 'text-green-400 hover:bg-green-500/10' 
                              : 'text-gray-500 hover:bg-white/5'
                          }`}
                          title={quote.isActive ? 'הסתר' : 'הפעל'}
                        >
                          {quote.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => { setEditingId(quote.id); setEditForm({}) }}
                          className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="ערוך"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteQuote(quote.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {!loading && filteredQuotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Quote className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">אין ציטוטים</h3>
            <p className="text-sm text-gray-500">הוסף ציטוט חדש כדי להתחיל</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        )}
      </main>

      {/* Add Quote Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#111] rounded-2xl border border-red-500/30 overflow-hidden shadow-2xl shadow-red-500/20"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Plus className="w-6 h-6" />
                    <h2 className="text-lg font-bold">ציטוט חדש</h2>
                  </div>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 space-y-4" dir="rtl">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">טקסט הציטוט *</label>
                  <textarea
                    value={newQuote.text}
                    onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
                    placeholder='למשל: "עלתה לאוטו עם שלושה סלים..."'
                    className="w-full bg-[#0a0a0a] border border-red-500/30 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-red-500 resize-none placeholder:text-gray-600"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">מקור (פרק)</label>
                    <Input
                      value={newQuote.source}
                      onChange={(e) => setNewQuote({ ...newQuote, source: e.target.value })}
                      placeholder="שם הפרק..."
                      className="bg-[#0a0a0a] border-red-500/30 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">אימוג׳י</label>
                    <Input
                      value={newQuote.emoji}
                      onChange={(e) => setNewQuote({ ...newQuote, emoji: e.target.value })}
                      className="bg-[#0a0a0a] border-red-500/30 focus:border-red-500 text-center text-2xl"
                      maxLength={2}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">קטגוריה</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setNewQuote({ ...newQuote, category: key as QuoteItem['category'] })}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          newQuote.category === key
                            ? `bg-gradient-to-r ${cat.color} text-white`
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl">
                  <button
                    onClick={() => setNewQuote({ ...newQuote, isActive: !newQuote.isActive })}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      newQuote.isActive ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      newQuote.isActive ? 'right-0.5' : 'right-6'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-400">
                    {newQuote.isActive ? 'פעיל - יופיע באתר' : 'מוסתר - לא יופיע באתר'}
                  </span>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ביטול
                </Button>
                <Button
                  onClick={addQuote}
                  disabled={!newQuote.text?.trim() || saving}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 ml-2" />
                  )}
                  הוסף ציטוט
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 left-6 bg-[#111] border border-red-500/30 rounded-2xl p-4 shadow-xl shadow-black/50 max-w-sm"
      >
        <div className="flex items-center gap-2 mb-2 text-sm text-red-400">
          <Sparkles className="w-4 h-4" />
          <span>תצוגה מקדימה</span>
        </div>
        <div className="text-sm text-gray-300">
          {quotes.filter(q => q.isActive)[0]?.emoji} "{quotes.filter(q => q.isActive)[0]?.text?.slice(0, 50)}..."
        </div>
      </motion.div>
    </div>
  )
}
