"use client"

/**
 * 🦎 I4IGUANA - Global News Ticker (HOLLYWOOD EDITION!)
 * 
 * Premium bottom ticker for global website
 * Matches the venue ticker style - elegant, classy, animated
 * 
 * Features:
 * - Smooth up/down animations
 * - Auto-rotation every 5 seconds
 * - Manual navigation dots
 * - Premium glassmorphism design
 * - Responsive for all devices
 * 
 * v2.0.0 - Hollywood Style
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, 
  Globe,
  Sparkles,
  TrendingUp,
  PartyPopper,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'

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
  link?: string
}

interface GlobalNewsTickerProps {
  lang?: 'en' | 'pt'
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const TRANSLATIONS = {
  en: {
    header: 'HOLIDAY MAGIC',
    items: [
      { type: 'announcement', message: "This holiday, don't go home alone", icon: '🎄', priority: 1 },
      { type: 'milestone', message: 'New Year, New Connections', icon: '✨', priority: 2 },
      { type: 'stat', message: "Someone's waiting 10m away", icon: '🎁', priority: 3 },
      { type: 'pilot_active', message: 'Holiday Magic • LIVE in Israel', icon: '❄️', country: 'Israel', countryFlag: '🇮🇱', priority: 4 },
      { type: 'announcement', message: 'Skip the mistletoe • Meet for real', icon: '💕', priority: 5 },
      { type: 'milestone', message: 'Best gift? A real connection', icon: '🎅', priority: 6 }
    ]
  },
  pt: {
    header: 'MAGIA DE VERÃO',
    items: [
      { type: 'announcement', message: 'Neste verão, não fique sozinho', icon: '☀️', priority: 1 },
      { type: 'milestone', message: 'Ano Novo, Novas Conexões', icon: '✨', priority: 2 },
      { type: 'stat', message: 'Alguém espera a 10m de você', icon: '🎁', priority: 3 },
      { type: 'pilot_active', message: 'Em breve no Brasil!', icon: '🇧🇷', country: 'Brasil', countryFlag: '🇧🇷', priority: 4 },
      { type: 'announcement', message: 'Chega de apps • Encontro real', icon: '💕', priority: 5 },
      { type: 'milestone', message: 'Melhor presente? Conexão real', icon: '🎉', priority: 6 }
    ]
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT TICKER ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_TICKER_ITEMS: Omit<TickerItem, 'id'>[] = [
  {
    type: 'announcement',
    message: "This holiday, don't go home alone",
    icon: '🎄',
    isActive: true,
    priority: 1
  },
  {
    type: 'milestone',
    message: 'New Year, New Connections',
    icon: '✨',
    isActive: true,
    priority: 2
  },
  {
    type: 'stat',
    message: "Someone's waiting 10m away",
    icon: '🎁',
    isActive: true,
    priority: 3
  },
  {
    type: 'pilot_active',
    message: 'Holiday Magic • LIVE in Israel',
    icon: '❄️',
    country: 'Israel',
    countryFlag: '🇮🇱',
    isActive: true,
    priority: 4
  },
  {
    type: 'announcement',
    message: 'Skip the mistletoe • Meet for real',
    icon: '💕',
    isActive: true,
    priority: 5
  },
  {
    type: 'milestone',
    message: 'Best gift? A real connection',
    icon: '🎅',
    isActive: true,
    priority: 6
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// TYPE CONFIG - Holiday Edition
// ═══════════════════════════════════════════════════════════════════════════

const TYPE_CONFIG = {
  pilot_active: { 
    label: '🔴 LIVE', 
    color: 'bg-gradient-to-r from-red-500 to-red-600',
    textColor: 'text-red-400',
    glow: 'shadow-red-500/50'
  },
  pilot_coming: { 
    label: 'COMING SOON', 
    color: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    textColor: 'text-cyan-400',
    glow: 'shadow-cyan-500/50'
  },
  milestone: { 
    label: '✨ HOLIDAY', 
    color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    textColor: 'text-yellow-400',
    glow: 'shadow-yellow-500/50'
  },
  announcement: { 
    label: '🎄 SPECIAL', 
    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    textColor: 'text-green-400',
    glow: 'shadow-green-500/50'
  },
  stat: { 
    label: '🎁 GIFT', 
    color: 'bg-gradient-to-r from-pink-500 to-rose-500',
    textColor: 'text-pink-400',
    glow: 'shadow-pink-500/50'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT - Hollywood Style Bottom Ticker
// ═══════════════════════════════════════════════════════════════════════════

export default function GlobalNewsTicker({ lang = 'en' }: GlobalNewsTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en

  // Load ticker items from Firebase or use translated defaults
  useEffect(() => {
    const tickerRef = collection(db, 'global_ticker')
    const q = query(
      tickerRef, 
      where('isActive', '==', true),
      orderBy('priority', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Use translated items based on lang
        const translatedItems = t.items.map((item, i) => ({ 
          ...item, 
          id: `default-${i}`,
          isActive: true 
        })) as TickerItem[]
        setItems(translatedItems)
      } else {
        const loadedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TickerItem[]
        setItems(loadedItems)
      }
    }, (error) => {
      console.error('Error loading ticker:', error)
      const translatedItems = t.items.map((item, i) => ({ 
        ...item, 
        id: `default-${i}`,
        isActive: true 
      })) as TickerItem[]
      setItems(translatedItems)
    })

    return () => unsubscribe()
  }, [lang, t.items])

  // Auto-rotate
  useEffect(() => {
    if (items.length === 0 || isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [items.length, isHovered])

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % items.length)
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)

  if (items.length === 0) return null

  const currentItem = items[currentIndex]
  const config = TYPE_CONFIG[currentItem.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Ticker Card */}
      <motion.div
        layout
        className={`
          relative overflow-hidden
          bg-gradient-to-br from-[#1a0505]/95 via-[#0d1f15]/95 to-[#1a0505]/95
          backdrop-blur-xl
          border border-red-500/40
          rounded-2xl
          shadow-2xl shadow-red-900/30
          ${isExpanded ? 'w-80' : 'w-72'}
        `}
      >
        {/* Header with Badge */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-red-500/20">
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-xl"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎄
            </motion.span>
            <span className="text-xs font-bold bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent tracking-wider">
              {t.header}
            </span>
          </div>
          
          {/* Live/Status Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold
              ${config.color} text-white shadow-lg ${config.glow}
            `}
          >
            {currentItem.type === 'pilot_active' && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
            {config.label}
          </motion.div>
        </div>

        {/* Content Area */}
        <div className="px-4 py-4 min-h-[80px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex items-start gap-3"
            >
              {/* Icon/Flag */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl flex-shrink-0"
              >
                {currentItem.icon}
              </motion.div>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                {/* Country Name (if applicable) */}
                {currentItem.country && (
                  <div className={`text-sm font-bold ${config.textColor} mb-0.5`}>
                    {currentItem.country}
                  </div>
                )}
                
                {/* Main Message */}
                <div className="text-white font-medium text-base leading-tight">
                  {currentItem.message}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="px-4 pb-3 flex items-center justify-between">
          {/* Dots Navigation - Holiday Style */}
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${i === currentIndex 
                    ? 'w-6 bg-gradient-to-r from-red-400 to-green-400' 
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }
                `}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Glow Effect - Holiday Colors */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-500/15 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl" />
        </div>
      </motion.div>

      {/* Floating Holiday Icons */}
      <div className="absolute -top-4 -right-2 pointer-events-none">
        <motion.span
          animate={{ y: [-5, 5, -5], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-lg"
        >
          ❄️
        </motion.span>
      </div>
      <div className="absolute -bottom-2 -right-4 pointer-events-none">
        <motion.span
          animate={{ y: [5, -5, 5], scale: [1, 1.2, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          className="text-sm"
        >
          💕
        </motion.span>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MINIMAL VERSION - For Hero Section Integration
// ═══════════════════════════════════════════════════════════════════════════

export function GlobalNewsTickerMinimal() {
  const [items, setItems] = useState<TickerItem[]>(
    DEFAULT_TICKER_ITEMS.map((item, i) => ({ ...item, id: `default-${i}` }))
  )
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) return null
  const currentItem = items[currentIndex]
  const config = TYPE_CONFIG[currentItem.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#0d2920]/80 border border-green-500/30 rounded-full backdrop-blur-xl"
    >
      {/* Live Dot */}
      {currentItem.type === 'pilot_active' && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
      )}
      
      {/* Icon */}
      <span className="text-lg">{currentItem.icon}</span>
      
      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-sm font-medium text-white/90"
        >
          {currentItem.country && <span className={config.textColor}>{currentItem.country}</span>}
          {currentItem.country && ' • '}
          {currentItem.message}
        </motion.span>
      </AnimatePresence>
      
      {/* Badge */}
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color} text-white`}>
        {config.label}
      </span>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE VERSION - For Navigation Bar
// ═══════════════════════════════════════════════════════════════════════════

export function GlobalNewsTickerInline() {
  const [items, setItems] = useState<TickerItem[]>(
    DEFAULT_TICKER_ITEMS.filter(i => i.type === 'pilot_active' || i.type === 'pilot_coming')
      .map((item, i) => ({ ...item, id: `default-${i}` }))
  )
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) return null
  const currentItem = items[currentIndex]

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="text-green-400 font-medium"
        >
          {currentItem.icon} {currentItem.country || currentItem.message}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
