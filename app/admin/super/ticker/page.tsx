"use client"

/**
 * 🦎 I4IGUANA - Global Ticker Manager
 * 
 * Manage ticker items for the global website:
 * - Active pilots
 * - Coming soon locations
 * - Milestones & achievements
 * - Announcements
 * 
 * HOLLYWOOD EDITION! 🎬
 * 
 * v1.0.0
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Globe,
  Zap,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  RefreshCw,
  Copy,
  Check,
  Flame,
  Sparkles,
  TrendingUp,
  PartyPopper,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Flag,
  MapPin,
  MessageSquare
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
  query,
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TickerItem {
  id: string
  type: 'pilot_active' | 'pilot_coming' | 'milestone' | 'announcement' | 'stat'
  message: string
  icon: string
  country?: string
  countryFlag?: string
  isActive: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const ITEM_TYPES = {
  pilot_active: { 
    label: '🔴 Active Pilot', 
    color: 'from-green-500 to-emerald-600',
    description: 'Currently live pilot locations'
  },
  pilot_coming: { 
    label: '🔜 Coming Soon', 
    color: 'from-cyan-500 to-blue-600',
    description: 'Upcoming pilot locations'
  },
  milestone: { 
    label: '🎉 Milestone', 
    color: 'from-yellow-500 to-orange-600',
    description: 'Achievements and celebrations'
  },
  announcement: { 
    label: '✨ Announcement', 
    color: 'from-purple-500 to-violet-600',
    description: 'News and updates'
  },
  stat: { 
    label: '📊 Statistic', 
    color: 'from-emerald-500 to-teal-600',
    description: 'App statistics and facts'
  }
}

const COUNTRY_FLAGS = [
  { code: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: 'US', flag: '🇺🇸', name: 'USA' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'GB', flag: '🇬🇧', name: 'UK' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina' }
]

const COMMON_ICONS = ['🔴', '🔜', '🎉', '✨', '📊', '🚀', '💚', '🦎', '📍', '❤️', '🔥', '⚡', '🌟', '🎯', '💪']

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_ITEMS: Omit<TickerItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'pilot_active',
    message: '🇮🇱 Israel Pilot LIVE — Archie Bar, Jack Bar, Marina TLV',
    icon: '🔴',
    country: 'Israel',
    countryFlag: '🇮🇱',
    isActive: true,
    priority: 1
  },
  {
    type: 'pilot_coming',
    message: '🇧🇷 Brazil — São Paulo pilot coming Q2 2025',
    icon: '🔜',
    country: 'Brazil',
    countryFlag: '🇧🇷',
    isActive: true,
    priority: 2
  },
  {
    type: 'pilot_coming',
    message: '🇺🇸 USA — Miami Beach pilot in planning',
    icon: '🔜',
    country: 'USA',
    countryFlag: '🇺🇸',
    isActive: true,
    priority: 3
  },
  {
    type: 'milestone',
    message: '🎉 500+ real connections made in Tel Aviv!',
    icon: '🎉',
    isActive: true,
    priority: 4
  },
  {
    type: 'announcement',
    message: '✨ New feature: She Decides — Women control the match',
    icon: '✨',
    isActive: true,
    priority: 5
  },
  {
    type: 'stat',
    message: '📍 10-500 meters — Meet people right next to you',
    icon: '📍',
    isActive: true,
    priority: 6
  },
  {
    type: 'pilot_active',
    message: '🦎 Trinity Club — Launching Jan 31st!',
    icon: '🚀',
    country: 'Israel',
    countryFlag: '🇮🇱',
    isActive: true,
    priority: 7
  },
  {
    type: 'announcement',
    message: '💚 Join as a Venue Partner — Get exclusive benefits',
    icon: '💚',
    isActive: true,
    priority: 8
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function GlobalTickerAdminPage() {
  const router = useRouter()
  const [items, setItems] = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<TickerItem>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<TickerItem>>({
    type: 'announcement',
    message: '',
    icon: '✨',
    isActive: true
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | TickerItem['type']>('all')

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const tickerRef = collection(db, 'global_ticker')
      const q = query(tickerRef, orderBy('priority', 'asc'))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        // Initialize with default items
        console.log('🌍 Initializing global ticker with defaults...')
        const batch = writeBatch(db)
        const now = new Date()
        
        DEFAULT_ITEMS.forEach((item) => {
          const docRef = doc(collection(db, 'global_ticker'))
          batch.set(docRef, {
            ...item,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
          })
        })
        
        await batch.commit()
        
        // Reload
        const newSnapshot = await getDocs(q)
        const loadedItems = newSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || now,
          updatedAt: doc.data().updatedAt?.toDate() || now
        })) as TickerItem[]
        
        setItems(loadedItems.sort((a, b) => a.priority - b.priority))
      } else {
        const loadedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as TickerItem[]
        
        setItems(loadedItems.sort((a, b) => a.priority - b.priority))
      }
    } catch (error) {
      console.error('Error loading ticker items:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addItem = async () => {
    if (!newItem.message?.trim()) return
    setSaving(true)
    
    try {
      const docRef = doc(collection(db, 'global_ticker'))
      const now = new Date()
      
      await setDoc(docRef, {
        type: newItem.type,
        message: newItem.message,
        icon: newItem.icon || '✨',
        country: newItem.country || '',
        countryFlag: newItem.countryFlag || '',
        isActive: newItem.isActive ?? true,
        priority: items.length + 1,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      })
      
      setNewItem({ type: 'announcement', message: '', icon: '✨', isActive: true })
      setShowAddForm(false)
      loadItems()
    } catch (error) {
      console.error('Error adding item:', error)
    }
    setSaving(false)
  }

  const updateItem = async (id: string, updates: Partial<TickerItem>) => {
    setSaving(true)
    try {
      const docRef = doc(db, 'global_ticker', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      })
      loadItems()
      setEditingId(null)
      setEditForm({})
    } catch (error) {
      console.error('Error updating item:', error)
    }
    setSaving(false)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this ticker item?')) return
    setSaving(true)
    try {
      await deleteDoc(doc(db, 'global_ticker', id))
      loadItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
    setSaving(false)
  }

  const toggleActive = async (item: TickerItem) => {
    await updateItem(item.id, { isActive: !item.isActive })
  }

  const movePriority = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => i.id === id)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === items.length - 1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const swapItem = items[newIndex]
    
    const batch = writeBatch(db)
    batch.update(doc(db, 'global_ticker', id), { 
      priority: swapItem.priority,
      updatedAt: Timestamp.fromDate(new Date())
    })
    batch.update(doc(db, 'global_ticker', swapItem.id), { 
      priority: items[currentIndex].priority,
      updatedAt: Timestamp.fromDate(new Date())
    })
    
    await batch.commit()
    loadItems()
  }

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERED ITEMS
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredItems = items.filter(i => {
    if (filter === 'all') return true
    return i.type === filter
  })

  const activeCount = items.filter(i => i.isActive).length

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-green-500/20"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Back & Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/super')}
                className="text-gray-400 hover:text-white hover:bg-green-500/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-green-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Globe className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    Global Ticker
                  </h1>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Website announcements</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-green-400">{activeCount} active</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadItems}
                disabled={loading}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <a 
                href="https://i4iguana.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Site
                </Button>
              </a>
              
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
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
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
        >
          {Object.entries(ITEM_TYPES).map(([key, config], i) => {
            const count = items.filter(item => item.type === key).length
            const activeInType = items.filter(item => item.type === key && item.isActive).length
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => setFilter(filter === key ? 'all' : key as TickerItem['type'])}
                className={`bg-[#111]/80 backdrop-blur-sm rounded-2xl border p-4 transition-all text-left ${
                  filter === key 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-white/5 hover:border-green-500/30'
                }`}
              >
                <div className="text-2xl mb-1">{config.label.split(' ')[0]}</div>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-gray-500">{activeInType} active</div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Filter Info */}
        {filter !== 'all' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 flex items-center gap-2"
          >
            <span className="text-sm text-gray-400">
              Showing: <span className="text-green-400">{ITEM_TYPES[filter].label}</span>
            </span>
            <button
              onClick={() => setFilter('all')}
              className="text-xs text-gray-500 hover:text-white"
            >
              (Clear filter)
            </button>
          </motion.div>
        )}

        {/* Items List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-[#111]/80 backdrop-blur-sm rounded-2xl border transition-all ${
                  item.isActive 
                    ? 'border-green-500/30 hover:border-green-500/50' 
                    : 'border-white/5 hover:border-white/10 opacity-60'
                }`}
              >
                {editingId === item.id ? (
                  // Edit Mode
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 font-medium">Edit Ticker Item</span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Type Selection */}
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">Type</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ITEM_TYPES).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => setEditForm({ ...editForm, type: key as TickerItem['type'] })}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                (editForm.type || item.type) === key
                                  ? `bg-gradient-to-r ${config.color} text-white`
                                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                              }`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Message</label>
                        <textarea
                          value={editForm.message ?? item.message}
                          onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                          className="w-full bg-[#0a0a0a] border border-green-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 resize-none"
                          rows={2}
                        />
                      </div>
                      
                      {/* Icon & Country */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Icon</label>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {COMMON_ICONS.map(icon => (
                              <button
                                key={icon}
                                onClick={() => setEditForm({ ...editForm, icon })}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                                  (editForm.icon || item.icon) === icon
                                    ? 'bg-green-500/30 border border-green-500'
                                    : 'bg-[#1a1a1a] hover:bg-[#222]'
                                }`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Country (optional)</label>
                          <div className="flex flex-wrap gap-1">
                            {COUNTRY_FLAGS.slice(0, 8).map(c => (
                              <button
                                key={c.code}
                                onClick={() => setEditForm({ 
                                  ...editForm, 
                                  country: c.name, 
                                  countryFlag: c.flag 
                                })}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                                  (editForm.countryFlag || item.countryFlag) === c.flag
                                    ? 'bg-green-500/30 border border-green-500'
                                    : 'bg-[#1a1a1a] hover:bg-[#222]'
                                }`}
                                title={c.name}
                              >
                                {c.flag}
                              </button>
                            ))}
                          </div>
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
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateItem(item.id, editForm)}
                        disabled={saving}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Priority Controls */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => movePriority(item.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-sm font-bold text-green-400">
                          {item.priority}
                        </div>
                        <button
                          onClick={() => movePriority(item.id, 'down')}
                          disabled={index === filteredItems.length - 1}
                          className="p-1 text-gray-500 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Icon */}
                      <div className="text-3xl">{item.icon}</div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white leading-relaxed mb-1">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${ITEM_TYPES[item.type]?.color} text-white`}>
                            {ITEM_TYPES[item.type]?.label}
                          </span>
                          {item.countryFlag && (
                            <span className="text-gray-400">
                              {item.countryFlag} {item.country}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyMessage(item.message, item.id)}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="Copy"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => toggleActive(item)}
                          className={`p-2 rounded-lg transition-all ${
                            item.isActive 
                              ? 'text-green-400 hover:bg-green-500/10' 
                              : 'text-gray-500 hover:bg-white/5'
                          }`}
                          title={item.isActive ? 'Hide' : 'Show'}
                        >
                          {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => { setEditingId(item.id); setEditForm({}) }}
                          className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
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
        {!loading && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Globe className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No ticker items</h3>
            <p className="text-sm text-gray-500">Add items to show on the website</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        )}
      </main>

      {/* Add Item Modal */}
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
              className="w-full max-w-lg bg-[#111] rounded-2xl border border-green-500/30 overflow-hidden shadow-2xl shadow-green-500/20"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Plus className="w-6 h-6" />
                    <h2 className="text-lg font-bold">New Ticker Item</h2>
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
              <div className="p-6 space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ITEM_TYPES).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setNewItem({ ...newItem, type: key as TickerItem['type'] })}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          newItem.type === key
                            ? `bg-gradient-to-r ${config.color} text-white`
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Message *</label>
                  <textarea
                    value={newItem.message}
                    onChange={(e) => setNewItem({ ...newItem, message: e.target.value })}
                    placeholder='e.g., "🇧🇷 Brazil — São Paulo pilot coming Q2 2025"'
                    className="w-full bg-[#0a0a0a] border border-green-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 resize-none placeholder:text-gray-600"
                    rows={2}
                  />
                </div>
                
                {/* Icon & Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Icon</label>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_ICONS.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setNewItem({ ...newItem, icon })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                            newItem.icon === icon
                              ? 'bg-green-500/30 border border-green-500'
                              : 'bg-[#1a1a1a] hover:bg-[#222]'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Country (optional)</label>
                    <div className="flex flex-wrap gap-1">
                      {COUNTRY_FLAGS.slice(0, 10).map(c => (
                        <button
                          key={c.code}
                          onClick={() => setNewItem({ 
                            ...newItem, 
                            country: c.name, 
                            countryFlag: c.flag 
                          })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                            newItem.countryFlag === c.flag
                              ? 'bg-green-500/30 border border-green-500'
                              : 'bg-[#1a1a1a] hover:bg-[#222]'
                          }`}
                          title={c.name}
                        >
                          {c.flag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl">
                  <button
                    onClick={() => setNewItem({ ...newItem, isActive: !newItem.isActive })}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      newItem.isActive ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      newItem.isActive ? 'left-6' : 'left-0.5'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-400">
                    {newItem.isActive ? 'Active — Will show on website' : 'Hidden — Won\'t show on website'}
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
                  Cancel
                </Button>
                <Button
                  onClick={addItem}
                  disabled={!newItem.message?.trim() || saving}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Item
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
        className="fixed bottom-6 right-6 bg-[#111] border border-green-500/30 rounded-2xl p-4 shadow-xl shadow-black/50 max-w-sm"
      >
        <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
          <Zap className="w-4 h-4" />
          <span>Preview</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          {items.filter(i => i.isActive)[0]?.message?.slice(0, 40)}...
        </div>
      </motion.div>
    </div>
  )
}
