"use client"

/**
 * 🦎 I4IGUANA - World Selection Screen
 * 
 * HOLLYWOOD LEVEL! 🎬
 * 
 * The main junction between two worlds:
 * 1. Entertainment Zones - Where the action is! Meet people nearby
 * 2. Venues - Join a specific bar or club
 * 
 * Simple, clear, beautiful.
 * 
 * v2.8.6: Added bottom navigation for Profile/Notifications
 * v2.8.31: Added venue tooltip when user is not in entertainment area
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Building2,
  Heart,
  Sparkles,
  ChevronRight,
  Users,
  Zap,
  Navigation,
  Home,
  Bell,
  User,
  Globe,
  X
} from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

// ✅ v2.8.31: Distance threshold for showing venue tooltip (500 meters)
const VENUE_TOOLTIP_DISTANCE_THRESHOLD = 500

interface WorldSelectionScreenProps {
  onSelectZones: () => void
  onSelectVenues: () => void
  userName?: string
  nearestZoneDistance?: number | null  // Distance in meters to nearest zone
  nearestZoneName?: string | null
  onNavigateToProfile?: () => void  // ✅ v2.8.6
  onNavigateToNotifications?: () => void  // ✅ v2.8.6
}

export default function WorldSelectionScreen({
  onSelectZones,
  onSelectVenues,
  userName = 'there',
  nearestZoneDistance = null,
  nearestZoneName = null,
  onNavigateToProfile,
  onNavigateToNotifications
}: WorldSelectionScreenProps) {
  const { t, isRTL, language } = useLanguage()
  
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [selectedWorld, setSelectedWorld] = useState<'zones' | 'venues' | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // ✅ v2.8.31: Venue tooltip state
  const [showVenueTooltip, setShowVenueTooltip] = useState(false)
  
  // Floating hearts animation
  const [hearts] = useState(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 20 + 12,
      duration: Math.random() * 8 + 12,
      delay: Math.random() * 5
    }))
  )
  
  // ✅ v2.8.31: Show venue tooltip when user is NOT in an entertainment area
  // Only show ONCE per session, and again after 1 hour
  useEffect(() => {
    // Check if user is NOT near any entertainment zone
    const isNotInVenueArea = nearestZoneDistance === null || nearestZoneDistance > VENUE_TOOLTIP_DISTANCE_THRESHOLD
    
    if (isNotInVenueArea && isLoaded) {
      // Check if we already showed the tooltip in this session
      const sessionShown = sessionStorage.getItem('venueTooltipShown')
      const lastShownTime = localStorage.getItem('venueTooltipLastShown')
      const oneHourAgo = Date.now() - (60 * 60 * 1000) // 1 hour in milliseconds
      
      // Don't show if already shown in this session
      if (sessionShown === 'true') {
        console.log('📍 Tooltip already shown this session - skipping')
        return
      }
      
      // Don't show if shown less than 1 hour ago (across sessions)
      if (lastShownTime && parseInt(lastShownTime) > oneHourAgo) {
        console.log('📍 Tooltip shown less than 1 hour ago - skipping')
        return
      }
      
      // Show tooltip after a short delay (let the screen load first)
      const showTimer = setTimeout(() => {
        setShowVenueTooltip(true)
        // Mark as shown for this session
        sessionStorage.setItem('venueTooltipShown', 'true')
        // Save timestamp for cross-session tracking
        localStorage.setItem('venueTooltipLastShown', Date.now().toString())
        console.log('📍 Showing venue tooltip - user is not in entertainment area')
      }, 800)
      
      // Auto-hide after 4 seconds (Hollywood dramatic timing!)
      const hideTimer = setTimeout(() => {
        setShowVenueTooltip(false)
        console.log('📍 Hiding venue tooltip')
      }, 4800) // 800ms delay + 4000ms display = 4800ms total
      
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [nearestZoneDistance, isLoaded])
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setTimeout(() => setIsLoaded(true), 50)
    })
    
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  const handleSelectZones = () => {
    setSelectedWorld('zones')
    setTimeout(() => onSelectZones(), 400)
  }

  const handleSelectVenues = () => {
    setSelectedWorld('venues')
    setTimeout(() => onSelectVenues(), 400)
  }

  // Format distance nicely
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`
    }
    return `${(meters / 1000).toFixed(1)}km away`
  }

  return (
    <div 
      className="relative flex flex-col overflow-hidden"
      style={{ 
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        maxWidth: '100vw',
        overflowX: 'hidden',
        overflowY: 'hidden',
        background: 'linear-gradient(160deg, #0a1f1a 0%, #0d2920 30%, #051410 70%, #030b08 100%)'
      }}
    >
      {/* 💕 Floating Hearts Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hearts.map((heart) => (
          <motion.div
            key={`heart-${heart.id}`}
            className="absolute text-pink-400/20"
            style={{
              left: `${heart.x}%`,
              bottom: -30,
              fontSize: heart.size,
            }}
            animate={{
              y: [0, -(viewportHeight || 800) - 100],
              opacity: [0, 0.6, 0.6, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: heart.duration,
              repeat: Infinity,
              delay: heart.delay,
              ease: "linear"
            }}
          >
            ❤️
          </motion.div>
        ))}
      </div>

      {/* ✨ Sparkle Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 bg-[#4ade80]/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 pb-28"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo & Welcome */}
        <motion.div
          className="text-center mb-10"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: isLoaded ? 0 : -30, opacity: isLoaded ? 1 : 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Iguana Logo */}
          <motion.div
            className="text-7xl mb-4"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🦎
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('worldSelection.greeting', { name: userName })} 💕
          </h1>
          
          <p className="text-white/60 text-lg" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('worldSelection.whereToMeet')}
          </p>
        </motion.div>

        {/* Two Worlds Buttons */}
        <div className="w-full max-w-sm space-y-5">
          
          {/* 🌆 ENTERTAINMENT ZONES - Primary Button */}
          <motion.button
            onClick={handleSelectZones}
            disabled={selectedWorld !== null}
            className={`
              w-full relative overflow-hidden rounded-3xl p-1
              ${selectedWorld === 'zones' ? 'scale-95 opacity-80' : ''}
              ${selectedWorld === 'venues' ? 'opacity-50' : ''}
            `}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: isLoaded ? 0 : -50, opacity: isLoaded ? 1 : 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: selectedWorld ? 1 : 1.02 }}
            whileTap={{ scale: selectedWorld ? 1 : 0.98 }}
          >
            {/* Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-[#4ade80] to-pink-500 rounded-3xl animate-pulse" />
            
            {/* Button Content */}
            <div className="relative bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-[22px] p-5">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/30 to-[#4ade80]/30 flex items-center justify-center border border-pink-400/30">
                  <MapPin className="w-8 h-8 text-pink-400" />
                </div>
                
                {/* Text */}
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h3 className="text-xl font-bold text-white">{t('worldSelection.hotZones')}</h3>
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🔥
                    </motion.span>
                  </div>
                  <p className="text-white/60 text-sm">
                    {t('worldSelection.hotZonesDesc')}
                  </p>
                  
                  {/* Distance indicator */}
                  {nearestZoneDistance !== null && nearestZoneName && (
                    <motion.div 
                      className="flex items-center gap-1 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Navigation className="w-3 h-3 text-[#4ade80]" />
                      <span className="text-[#4ade80] text-xs font-medium">
                        {nearestZoneName}: {formatDistance(nearestZoneDistance)}
                      </span>
                    </motion.div>
                  )}
                </div>
                
                {/* Arrow */}
                <ChevronRight className="w-6 h-6 text-white/40" />
              </div>
              
              {/* Live indicator */}
              <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} flex items-center gap-1`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                <span className="text-pink-400 text-xs font-medium">{t('worldSelection.live')}</span>
              </div>
            </div>
          </motion.button>

          {/* OR Divider */}
          <motion.div 
            className="flex items-center gap-4 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-white/40 text-sm">{t('worldSelection.or')}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>

          {/* 🍸 VENUES - Secondary Button */}
          <motion.button
            onClick={handleSelectVenues}
            disabled={selectedWorld !== null}
            className={`
              w-full relative overflow-hidden rounded-3xl
              ${selectedWorld === 'venues' ? 'scale-95 opacity-80' : ''}
              ${selectedWorld === 'zones' ? 'opacity-50' : ''}
            `}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: isLoaded ? 0 : 50, opacity: isLoaded ? 1 : 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: selectedWorld ? 1 : 1.02 }}
            whileTap={{ scale: selectedWorld ? 1 : 0.98 }}
          >
            {/* Button Content */}
            <div className="bg-gradient-to-br from-[#1a4d3e]/80 to-[#0d2920]/80 rounded-3xl p-5 border border-[#4ade80]/20">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#4ade80]/10 flex items-center justify-center border border-[#4ade80]/20">
                  <Building2 className="w-7 h-7 text-[#4ade80]" />
                </div>
                
                {/* Text */}
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-lg font-bold text-white mb-1">{t('worldSelection.joinVenue')}</h3>
                  <p className="text-white/50 text-sm">
                    {t('worldSelection.joinVenueDesc')}
                  </p>
                </div>
                
                {/* Arrow */}
                <ChevronRight className={`w-5 h-5 text-white/30 ${isRTL ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Bottom Tagline */}
        <motion.div
          className="mt-10 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isLoaded ? 0 : 20, opacity: isLoaded ? 1 : 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 text-white/40" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-sm">{t('worldSelection.findLove')}</span>
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
        </motion.div>
      </motion.div>

      {/* Loading overlay when transitioning */}
      <AnimatePresence>
        {selectedWorld && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0d2920]/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-6xl"
            >
              🦎
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ v2.8.7: Bottom Navigation - Fixed with higher z-index */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-t from-[#030b08] via-[#030b08] to-transparent pt-4">
          <div className="bg-[#0d2920] backdrop-blur-lg border-t border-[#4ade80]/20 px-6 py-3 pb-6">
            <div className="flex items-center justify-around">
              {/* Home - Current Screen */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#4ade80]/20 flex items-center justify-center">
                  <Home className="h-6 w-6 text-[#4ade80]" />
                </div>
                <span className="text-[#4ade80] text-xs font-medium">{t('navigation.home')}</span>
              </motion.button>
              
              {/* Notifications */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onNavigateToNotifications}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="h-6 w-6 text-white/60" />
                </div>
                <span className="text-white/40 text-xs">{t('navigation.alerts')}</span>
              </motion.button>
              
              {/* Profile */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onNavigateToProfile}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <User className="h-6 w-6 text-white/60" />
                </div>
                <span className="text-white/40 text-xs">{t('navigation.profile')}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* ✅ v2.8.31: HOLLYWOOD VENUE TOOLTIP - Shows when user is NOT in entertainment area */}
      <AnimatePresence>
        {showVenueTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.5 
            }}
            className="absolute bottom-32 left-4 right-4 z-[9999] pointer-events-auto"
          >
            <div 
              className="relative overflow-hidden rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(5, 150, 105, 0.15) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(74, 222, 128, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              {/* Animated glow border */}
              <div 
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(74, 222, 128, 0.4) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear',
                  opacity: 0.5
                }}
              />
              
              {/* Content */}
              <div className={`relative p-5 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Close button */}
                <button
                  onClick={() => setShowVenueTooltip(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
                
                {/* Icon with glow */}
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center flex-shrink-0"
                    style={{
                      boxShadow: '0 0 20px rgba(74, 222, 128, 0.4), 0 4px 15px rgba(0,0,0,0.3)'
                    }}
                  >
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 pt-1">
                    {/* Title */}
                    <h3 className="text-white font-bold text-lg mb-1">
                      {language === 'he' ? '📍 לא באזור בילוי?' : 
                       language === 'pt' ? '📍 Não está em área de lazer?' :
                       '📍 Not in an entertainment area?'}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-white/70 text-sm leading-relaxed mb-3">
                      {language === 'he' ? 'האפליקציה פועלת במקומות בילוי נבחרים. גלה את כל המקומות בפריסה ארצית!' : 
                       language === 'pt' ? 'O app funciona em locais de entretenimento. Descubra todos os locais!' :
                       'The app works at selected entertainment venues. Discover all locations nationwide!'}
                    </p>
                    
                    {/* CTA Button */}
                    <a
                      href={language === 'he' ? 'https://i4iguana.com/he' : 
                            language === 'pt' ? 'https://i4iguana.com/br' :
                            'https://i4iguana.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        boxShadow: '0 4px 15px rgba(74, 222, 128, 0.3)'
                      }}
                    >
                      <Globe className="w-4 h-4" />
                      {language === 'he' ? 'לצפייה במפת המקומות' : 
                       language === 'pt' ? 'Ver mapa de locais' :
                       'View Venues Map'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Shimmer animation for tooltip */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
