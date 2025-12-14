"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, Monitor, Smartphone, Download, CheckCircle, ExternalLink, Home, X } from 'lucide-react'

type InstallState = 'idle' | 'prompting' | 'installing' | 'installed' | 'dismissed'

export default function DownloadPage() {
  const [isPressed, setIsPressed] = useState(false)
  const [radarAngle, setRadarAngle] = useState(0)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installState, setInstallState] = useState<InstallState>('idle')
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)

  // Detect platform on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase()
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('ios')
      } else if (/android/.test(ua)) {
        setPlatform('android')
      } else {
        setPlatform('desktop')
      }
      
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setAlreadyInstalled(true)
        console.log('✅ Already installed as PWA - redirecting to app')
        // Auto-redirect to app if already installed
        setTimeout(() => {
          window.location.href = '/app'
        }, 1500)
      }
    }
  }, [])

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      console.log('✅ PWA Install prompt captured')
    }
    
    // ✅ CRITICAL: Listen for actual installation complete
    const handleAppInstalled = () => {
      console.log('🎉 PWA Installation COMPLETE!')
      setInstallState('installed')
      setInstallPrompt(null)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Radar animation - SLOWER (100ms instead of 50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 1.5) % 360)  // Slower rotation
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Handle install button press
  const handleInstall = async () => {
    if (platform === 'desktop') return
    
    setIsPressed(true)

    // For iOS - show instructions
    if (platform === 'ios') {
      setInstallState('prompting')
      return
    }

    // Try PWA install if available (Android/Chrome)
    if (installPrompt) {
      try {
        setInstallState('prompting')
        console.log('📱 Showing install prompt...')
        
        const result = await installPrompt.prompt()
        console.log('Install prompt result:', result)
        
        if (result.outcome === 'accepted') {
          console.log('✅ User accepted install - waiting for installation...')
          setInstallState('installing')
          // appinstalled event will trigger 'installed' state
          
          // Fallback timeout - if appinstalled doesn't fire within 10 seconds
          setTimeout(() => {
            if (installState === 'installing') {
              console.log('⏱️ Fallback: assuming installed')
              setInstallState('installed')
            }
          }, 10000)
        } else {
          console.log('❌ User dismissed install prompt')
          setInstallState('dismissed')
          setTimeout(() => setInstallState('idle'), 2000)
        }
      } catch (e) {
        console.log('Install prompt error:', e)
        setInstallState('idle')
      }
    } else {
      // No install prompt available - show manual instructions
      setInstallState('prompting')
    }
  }

  // Close the browser tab and go to icon
  const handleGoToIcon = () => {
    // Show message to close browser
    alert('סגור את הדפדפן ופתח את האפליקציה מהאייקון על מסך הבית! 🦎')
    // Try to close the tab (may not work on all browsers)
    window.close()
  }

  // Continue in browser (for users who prefer)
  const handleContinueInBrowser = () => {
    window.location.href = '/app'
  }

  // QR Code for desktop users
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://www.i4iguana.com/download')}&color=0d2920&bgcolor=ffffff`

  // Already installed - show redirect message
  if (alreadyInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#051410] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-[#4ade80]/30 border-t-[#4ade80] rounded-full"
          />
          <p className="text-white text-xl font-medium mb-2">האפליקציה כבר מותקנת!</p>
          <p className="text-white/60">מעביר אותך לאפליקציה...</p>
          <p className="text-6xl mt-6">🦎</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#051410] overflow-hidden relative">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* BACKGROUND STARS - CLEAN & SLOW (reduced from 50 to 20) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/60 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-8">
        
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#4ade80] mb-2">
            I4IGUANA
          </h1>
          <p className="text-white/70 text-lg">
            הקסם מתחיל כאן
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DESKTOP MESSAGE */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {platform === 'desktop' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#1a4d3e]/90 to-[#0d2920]/90 border-2 border-[#4ade80]/40 rounded-3xl p-8 mb-8 max-w-md text-center backdrop-blur-sm"
            dir="rtl"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Monitor className="w-6 h-6 text-[#4ade80]" />
              <span className="text-xl font-bold text-white">גולש ממחשב?</span>
            </div>
            
            <p className="text-white/80 mb-6">
              📱 I4IGUANA היא אפליקציית מובייל!<br/>
              סרוק את הקוד מהטלפון שלך:
            </p>

            {/* QR Code */}
            <motion.div
              className="bg-white p-4 rounded-2xl inline-block mb-4"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(74, 222, 128, 0.2)',
                  '0 0 30px rgba(74, 222, 128, 0.4)',
                  '0 0 20px rgba(74, 222, 128, 0.2)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
            </motion.div>

            <div className="flex items-center justify-center gap-2 text-[#4ade80] text-sm">
              <Smartphone className="w-4 h-4" />
              <span>או פתח את הדף הזה מהטלפון</span>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RADAR CIRCLE WITH IGUANA - CLEAN & ELEGANT */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`relative ${platform === 'desktop' ? 'w-48 h-48' : 'w-72 h-72'} mb-6`}
        >
          {/* Outer Glow - Subtle */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 40px rgba(74, 222, 128, 0.2)',
                '0 0 60px rgba(74, 222, 128, 0.3)',
                '0 0 40px rgba(74, 222, 128, 0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Radar Background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#1a4d3e]/80 to-[#0d2920]/90 border-2 border-[#4ade80]/40">
            {/* Radar Circles - Clean */}
            <div className="absolute inset-6 rounded-full border border-[#4ade80]/15" />
            <div className="absolute inset-14 rounded-full border border-[#4ade80]/20" />
            {platform !== 'desktop' && (
              <div className="absolute inset-24 rounded-full border border-[#4ade80]/25" />
            )}
          </div>

          {/* Radar Sweep - Elegant & Slow */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ transform: `rotate(${radarAngle}deg)` }}
          >
            <div 
              className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
              style={{
                background: 'linear-gradient(90deg, rgba(74, 222, 128, 0.7), transparent)',
              }}
            />
            {/* Sweep Trail - Subtle */}
            <div 
              className="absolute top-0 left-1/2 w-1/2 h-full origin-left"
              style={{
                background: 'conic-gradient(from -90deg, rgba(74, 222, 128, 0.15), transparent 45deg)',
                transform: 'rotate(-20deg)',
              }}
            />
          </motion.div>

          {/* Hearts - Only on mobile, fewer */}
          {platform !== 'desktop' && (
            <>
              <motion.div
                className="absolute top-10 right-14"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
              >
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              </motion.div>
              <motion.div
                className="absolute bottom-20 left-12"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
              >
                <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
              </motion.div>
            </>
          )}

          {/* Center Iguana */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: isPressed ? [1, 1.3, 0.9] : [1, 1.03, 1],
              }}
              transition={{ 
                duration: isPressed ? 0.5 : 3,
                repeat: isPressed ? 0 : Infinity,
              }}
              className={platform === 'desktop' ? 'text-5xl' : 'text-6xl'}
            >
              🦎
            </motion.div>
          </div>

          {/* Install Button Overlay (mobile only) */}
          {platform !== 'desktop' && installState === "idle" && (
            <motion.button
              onClick={handleInstall}
              disabled={isPressed || installState !== "idle"}
              className="absolute inset-6 rounded-full bg-transparent cursor-pointer focus:outline-none"
              whileTap={{ scale: 0.98 }}
            >
              {/* Button Ring - Elegant */}
              <motion.div
                className="absolute inset-0 rounded-full border-3 border-[#4ade80]"
                style={{ borderWidth: '3px' }}
                animate={{
                  boxShadow: [
                    'inset 0 0 20px rgba(74, 222, 128, 0.2), 0 0 20px rgba(74, 222, 128, 0.2)',
                    'inset 0 0 30px rgba(74, 222, 128, 0.3), 0 0 30px rgba(74, 222, 128, 0.3)',
                    'inset 0 0 20px rgba(74, 222, 128, 0.2), 0 0 20px rgba(74, 222, 128, 0.2)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.button>
          )}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CALL TO ACTION (mobile only) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {platform !== 'desktop' && installState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-6"
          >
            <motion.p
              className="text-2xl font-bold text-white mb-1"
              animate={{ 
                textShadow: [
                  '0 0 8px rgba(74, 222, 128, 0.4)',
                  '0 0 15px rgba(74, 222, 128, 0.6)',
                  '0 0 8px rgba(74, 222, 128, 0.4)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              👆 לחצו להתחיל
            </motion.p>
            <p className="text-white/60 text-sm">
              Dating App - Real-Time Meetings
            </p>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FEATURE TAGS - CLEAN */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {installState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
            dir="rtl"
          >
            <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-4 py-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-white/80 text-sm">היא מחליטה</span>
            </div>
            <div className="flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-full px-4 py-2">
              <MapPin className="w-4 h-4 text-[#4ade80]" />
              <span className="text-white/80 text-sm">מפגשים פה ועכשיו</span>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* WEBSITE LINK - BOTTOM */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <motion.a
          href="https://www.i4iguana.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center gap-2 text-white/40 hover:text-[#4ade80] transition-colors text-sm mt-auto pt-4"
        >
          <ExternalLink className="w-3 h-3" />
          <span>www.i4iguana.com</span>
        </motion.a>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* INSTALLING OVERLAY - Shows while installation in progress */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {installState === 'installing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#051410]"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center px-8"
            >
              {/* Pulsing Iguana */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                🦎
              </motion.div>
              
              {/* Progress Bar */}
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-4 mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 8, ease: 'easeInOut' }}
                />
              </div>
              
              <motion.p
                className="text-white text-xl font-bold mb-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⏳ מתקין את האפליקציה...
              </motion.p>
              <p className="text-white/50 text-sm" dir="rtl">
                האייקון יופיע על מסך הבית שלך
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SUCCESS SCREEN - Installation Complete! */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {installState === 'installed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#051410]"
          >
            {/* Celebration particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  initial={{ 
                    x: '50vw', 
                    y: '50vh',
                    scale: 0 
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}vw`,
                    y: `${Math.random() * 100}vh`,
                    scale: [0, 1, 0],
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: 'easeOut'
                  }}
                >
                  {['🎉', '✨', '💚', '🦎', '🎊'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>

            {/* Background glow */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-80 h-80 rounded-full bg-[#4ade80]/30 blur-3xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
              className="relative z-10 text-center px-8 max-w-sm"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
                className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-2xl shadow-[#4ade80]/50"
              >
                <CheckCircle className="w-14 h-14 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-black text-white mb-3"
              >
                🎉 ההתקנה הושלמה!
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-white/80 text-lg mb-2"
                dir="rtl"
              >
                האייקון נוסף למסך הבית שלך
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/10 rounded-2xl p-4 mb-6 border border-[#4ade80]/30"
                dir="rtl"
              >
                <div className="flex items-center justify-center gap-3">
                  <Home className="w-6 h-6 text-[#4ade80]" />
                  <span className="text-white font-medium">
                    עכשיו תוכל/י לפתוח את I4IGUANA בכל עת!
                  </span>
                </div>
              </motion.div>

              {/* Iguana */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="text-7xl mb-6"
              >
                🦎
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-3"
              >
                <button
                  onClick={handleGoToIcon}
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full text-[#0d2920] font-bold text-lg shadow-lg shadow-[#4ade80]/30 hover:shadow-[#4ade80]/50 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  <span>עבור לאייקון על מסך הבית</span>
                </button>
                
                <button
                  onClick={handleContinueInBrowser}
                  className="w-full px-6 py-3 text-white/60 hover:text-white text-sm font-medium transition-colors"
                >
                  או המשך כאן בדפדפן
                </button>
              </motion.div>

              {/* Hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-white/40 text-xs mt-6"
                dir="rtl"
              >
                💡 טיפ: לחוויה הטובה ביותר, פתח תמיד מהאייקון
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* iOS INSTRUCTIONS - Manual install */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {installState === 'prompting' && platform === 'ios' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl p-6 mx-6 max-w-sm border-2 border-[#4ade80]/40"
              dir="rtl"
            >
              <button
                onClick={() => setInstallState('idle')}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📱</div>
                <h3 className="text-xl font-bold text-white mb-2">התקנה באייפון</h3>
                <p className="text-white/60 text-sm">3 צעדים פשוטים:</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <p className="text-white font-medium">לחץ על כפתור השיתוף</p>
                    <p className="text-white/50 text-sm">הריבוע עם החץ למעלה ⬆️</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <p className="text-white font-medium">גלול ולחץ "Add to Home Screen"</p>
                    <p className="text-white/50 text-sm">הוסף למסך הבית ➕</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <p className="text-white font-medium">לחץ "Add" בפינה</p>
                    <p className="text-white/50 text-sm">וזהו! האייקון יופיע 🦎</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInstallState('idle')}
                className="w-full py-3 bg-[#4ade80] rounded-xl text-[#0d2920] font-bold"
              >
                הבנתי!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DISMISSED MESSAGE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {installState === 'dismissed' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-4 right-4 z-50"
          >
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-4 text-center backdrop-blur-sm">
              <p className="text-yellow-300 font-medium" dir="rtl">
                😅 לחצת ביטול? לחץ שוב על האיגואנה להתקנה
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#051410] to-transparent pointer-events-none" />
    </div>
  )
}
