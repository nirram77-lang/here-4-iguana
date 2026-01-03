"use client"

/**
 * 🦎 I4IGUANA - Enjoy Mode Screen
 * 
 * Shown after both users confirm they're meeting.
 * Features:
 * - 20-minute countdown (can be configured)
 * - Chat access button
 * - "Didn't work out?" early exit
 * - Beautiful animations
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Heart, Clock, X, Home, Sparkles, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/LanguageContext'

interface EnjoyModeScreenProps {
  meetingStartedAt: Date
  partnerName: string
  partnerPhoto: string
  matchId: string
  cooldownMinutes?: number  // Default: 20
  currentUserGender?: 'male' | 'female'  // ✅ v2.8.25: For gendered title
  onOpenChat: () => void
  onOpenProfile: () => void  // ✅ NEW: Open own profile
  onExit: (reason: 'timeout' | 'manual') => void
}

export default function EnjoyModeScreen({
  meetingStartedAt,
  partnerName,
  partnerPhoto,
  matchId,
  cooldownMinutes = 20,
  currentUserGender = 'male',
  onOpenChat,
  onOpenProfile,
  onExit
}: EnjoyModeScreenProps) {
  const { t, isRTL } = useLanguage()
  
  const [timeRemaining, setTimeRemaining] = useState(cooldownMinutes * 60)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [pulsePhase, setPulsePhase] = useState(0)
  const [showBlockedMessage, setShowBlockedMessage] = useState<string | null>(null)  // ✅ NEW: Show message when blocked
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)  // ✅ NEW: Real viewport height for old Android

  // ✅ NEW: Calculate real viewport height for old Android
  useEffect(() => {
    const updateViewportHeight = () => {
      // Use window.innerHeight which excludes browser chrome on mobile
      setViewportHeight(window.innerHeight)
    }
    
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
    }
  }, [])

  // ✅ v2.8.26 FIX iOS: Lock body scroll to prevent bounce
  useEffect(() => {
    // Save original styles
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalLeft = document.body.style.left
    const originalWidth = document.body.style.width
    const originalHeight = document.body.style.height
    const originalTouchAction = document.body.style.touchAction
    
    // Lock body
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = '0'
    document.body.style.left = '0'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.style.touchAction = 'none'
    
    // Also lock html element
    const htmlEl = document.documentElement
    const originalHtmlOverflow = htmlEl.style.overflow
    htmlEl.style.overflow = 'hidden'
    
    console.log('🔒 [iOS FIX] Body scroll LOCKED for Enjoy Mode')
    
    return () => {
      // Restore original styles
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.left = originalLeft
      document.body.style.width = originalWidth
      document.body.style.height = originalHeight
      document.body.style.touchAction = originalTouchAction
      htmlEl.style.overflow = originalHtmlOverflow
      console.log('🔓 [iOS FIX] Body scroll UNLOCKED')
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    const endTime = new Date(meetingStartedAt.getTime() + cooldownMinutes * 60 * 1000)
    
    const updateTimer = () => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000))
      setTimeRemaining(remaining)
      
      if (remaining <= 0) {
        console.log('⏰ Enjoy Mode timer expired')
        onExit('timeout')
      }
    }
    
    // Initial update
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [meetingStartedAt, cooldownMinutes, onExit])

  // Pulse animation phase
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle manual exit
  const handleExitClick = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = () => {
    console.log('👋 User manually exited Enjoy Mode')
    onExit('manual')
  }

  return (
    <div 
      className="bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#051410] flex flex-col overflow-hidden overscroll-none"
      style={{ 
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 20px))',
        // ✅ v2.8.26 FIX iOS: Prevent scroll/bounce completely
        touchAction: 'manipulation',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto'
      }}
    >
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FLOATING PARTICLES BACKGROUND */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-30"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
              y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800
            }}
            animate={{ 
              y: -100,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400)
            }}
            transition={{ 
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear"
            }}
          >
            {['💚', '✨', '🦎', '💫', '☕'][i % 5]}
          </motion.div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        
        {/* Partner Photo with Glow */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="relative mb-6"
        >
          {/* Pulsing glow rings */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-[#4ade80] blur-xl"
            style={{ transform: 'scale(1.5)' }}
          />
          
          {/* Photo */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#4ade80] shadow-2xl shadow-[#4ade80]/30">
            <img 
              src={partnerPhoto} 
              alt={partnerName}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Online indicator */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-1 right-1 w-6 h-6 bg-[#4ade80] rounded-full border-3 border-[#0d2920] flex items-center justify-center"
          >
            <Heart className="w-3 h-3 text-[#0d2920]" fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-black text-white mb-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {currentUserGender === 'female' ? t('enjoyMode.titleFemale') : t('enjoyMode.titleMale')}
          </h1>
          <p className="text-white/70 text-lg" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {isRTL ? (
              <>עם <span className="text-[#4ade80] font-bold">{partnerName}</span></>
            ) : (
              <>with <span className="text-[#4ade80] font-bold">{partnerName}</span></>
            )}
          </p>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-3xl px-8 py-6 mb-8 backdrop-blur-sm"
        >
          <div className={`flex items-center justify-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="w-5 h-5 text-white/60" />
            <span className="text-white/60 text-sm">{t('enjoyMode.appReturnsIn')}</span>
          </div>
          <div className="text-5xl font-black text-[#4ade80] text-center font-mono">
            {formatTime(timeRemaining)}
          </div>
        </motion.div>

        {/* Inspirational Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-[#4ade80]/10 to-[#22c55e]/10 border border-[#4ade80]/30 rounded-2xl px-6 py-4 mb-8 max-w-sm text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-4xl mb-2"
          >
            🦎
          </motion.div>
          <p className="text-white/80 text-sm leading-relaxed" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('enjoyMode.inspirationalMessage')}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full max-w-sm space-y-4"
        >
          {/* Chat Button */}
          <Button
            onClick={onOpenChat}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg shadow-[#4ade80]/30"
          >
            <MessageCircle className={`${isRTL ? 'ml-3' : 'mr-3'} h-6 w-6`} />
            {t('enjoyMode.openChat')}
          </Button>

          {/* Exit Button - Iguana Skin Style! 🦎 */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleExitClick}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#15803d] via-[#22c55e] to-[#15803d] hover:from-[#166534] hover:via-[#16a34a] hover:to-[#166534] text-white font-bold text-base shadow-xl border-2 border-[#4ade80]/40 transition-all duration-300"
              style={{
                backgroundImage: 'linear-gradient(135deg, #15803d 0%, #22c55e 25%, #4ade80 50%, #22c55e 75%, #15803d 100%)',
                boxShadow: '0 4px 20px rgba(74, 222, 128, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <span className={`text-2xl ${isRTL ? 'ml-3' : 'mr-3'}`}>🦎</span>
              {t('enjoyMode.backToGame')}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* EXIT CONFIRMATION MODAL - Iguana Style! */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-sm w-full border-2 border-[#4ade80]/30 shadow-2xl"
            >
              <div className="text-center mb-8">
                {/* Iguana Emoji with Animation */}
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  🦎
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  {t('enjoyMode.readyForNewAdventure')}
                </h3>
                <p className="text-white/70 text-base leading-relaxed" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  {t('enjoyMode.iguanaHereForYou')}
                  <br />
                  <span className="text-[#4ade80]">{t('enjoyMode.findNextMatch')}</span>
                </p>
              </div>

              <div className="space-y-4">
                {/* Back to App - Iguana Skin Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={confirmExit}
                    className="w-full h-16 rounded-2xl text-white font-bold text-lg shadow-xl border-2 border-[#4ade80]/50 transition-all duration-300"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #15803d 0%, #22c55e 25%, #4ade80 50%, #22c55e 75%, #15803d 100%)',
                      boxShadow: '0 4px 25px rgba(74, 222, 128, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                      direction: isRTL ? 'rtl' : 'ltr'
                    }}
                  >
                    <span className={`text-2xl ${isRTL ? 'ml-3' : 'mr-3'}`}>🦎</span>
                    {t('enjoyMode.yesBackToGame')}
                  </Button>
                </motion.div>
                
                {/* Stay Here Button */}
                <Button
                  onClick={() => setShowExitConfirm(false)}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-2 border-[#4ade80]/30 bg-[#0d2920]/50 hover:bg-[#1a4d3e]/50 text-white font-bold text-base backdrop-blur-sm"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  <Heart className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5 text-[#4ade80]`} />
                  {t('enjoyMode.noStayHere')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NEW: Blocked Navigation Message Toast */}
      <AnimatePresence>
        {showBlockedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-50"
          >
            <div className="bg-gradient-to-r from-pink-500/90 to-rose-500/90 backdrop-blur-md rounded-2xl p-4 border border-pink-400/50 shadow-2xl">
              <p className="text-white text-center font-medium">
                💕 {showBlockedMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NEW: Bottom Navigation Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-[#0d2920]/95 backdrop-blur-md border-t border-[#4ade80]/20 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-around items-center py-3 px-4 max-w-lg mx-auto">
          {/* Home Tab - Blocked */}
          <button
            onClick={() => {
              setShowBlockedMessage(t('nav.blockedHome'))
              setTimeout(() => setShowBlockedMessage(null), 2500)
            }}
            className="flex flex-col items-center gap-1 opacity-40"
          >
            <Home className="h-6 w-6 text-white/50" />
            <span className="text-[10px] text-white/50">{t('nav.home')}</span>
          </button>

          {/* Notifications Tab - Blocked */}
          <button
            onClick={() => {
              setShowBlockedMessage(t('nav.blockedNotifications'))
              setTimeout(() => setShowBlockedMessage(null), 2500)
            }}
            className="flex flex-col items-center gap-1 opacity-40"
          >
            <svg className="h-6 w-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px] text-white/50">{t('nav.alerts')}</span>
          </button>

          {/* Profile Tab - OPEN */}
          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center gap-1"
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center">
              <svg className="h-4 w-4 text-[#0d2920]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] text-[#4ade80] font-medium">{t('nav.profile')}</span>
          </button>
        </div>
        {/* Safe area for phones with home indicator */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>
  )
}
