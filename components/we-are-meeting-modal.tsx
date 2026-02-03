"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, PartyPopper } from 'lucide-react'
import DebugPanel from './debug-panel'
import { useLanguage } from '@/lib/LanguageContext'

interface WeAreMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  partnerName?: string
  partnerPhoto?: string
}

export default function WeAreMeetingModal({
  isOpen,
  onClose,
  partnerName,
  partnerPhoto
}: WeAreMeetingModalProps) {
  const { t, isRTL } = useLanguage()
  
  // ✅ v2.8.18: Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const isLongPressingRef = useRef(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  // ✅ v2.8.20: Prevent double-trigger with better tracking
  const isClosingRef = useRef(false)
  const hasClosedRef = useRef(false)
  
  // ✅ v2.8.26 FIX iOS: Track when modal opened to prevent auto-close
  const modalOpenedAtRef = useRef<number>(0)
  const MINIMUM_DISPLAY_TIME = 1500  // Must show for at least 1.5 seconds!
  
  // ✅ v2.8.26 FIX iOS: Delay button activation to prevent auto-trigger during animation
  const [buttonEnabled, setButtonEnabled] = useState(false)
  
  // ✅ v2.8.20: Reset refs when modal opens
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false
      hasClosedRef.current = false
      setButtonEnabled(false)  // ✅ Reset button state
      modalOpenedAtRef.current = Date.now()  // ✅ Track open time
      console.log('🎉 WeAreMeetingModal OPENED - refs reset, button disabled, timestamp:', modalOpenedAtRef.current)
      
      // ✅ v2.8.26 FIX iOS: Enable button after 1.5 second delay
      // This prevents accidental triggers during modal animation
      const enableTimer = setTimeout(() => {
        setButtonEnabled(true)
        console.log('🎉 Button ENABLED after 1.5 second delay')
      }, MINIMUM_DISPLAY_TIME)
      
      return () => clearTimeout(enableTimer)
    }
  }, [isOpen])
  
  const handleLongPressStart = () => {
    isLongPressingRef.current = true
    longPressTimerRef.current = setTimeout(() => {
      if (isLongPressingRef.current) {
        console.log('🐛 Debug Panel activated in WeAreMeetingModal!')
        setShowDebugPanel(true)
        if (navigator.vibrate) navigator.vibrate(100)
      }
    }, 3000)
  }
  
  const handleLongPressEnd = () => {
    isLongPressingRef.current = false
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // ✅ v2.8.20: BULLETPROOF close handler for iOS 12!
  const handleAwesomeClose = useCallback(() => {
    console.log('🎉 handleAwesomeClose called!')
    console.log('   isClosingRef:', isClosingRef.current)
    console.log('   hasClosedRef:', hasClosedRef.current)
    console.log('   buttonEnabled:', buttonEnabled)
    
    // ✅ v2.8.26 FIX iOS: Double-check minimum display time
    const timeSinceOpen = Date.now() - modalOpenedAtRef.current
    console.log('   Time since modal opened:', timeSinceOpen, 'ms')
    
    if (timeSinceOpen < MINIMUM_DISPLAY_TIME) {
      console.log('🚫 BLOCKED: Modal opened too recently! Must wait', MINIMUM_DISPLAY_TIME - timeSinceOpen, 'ms more')
      return
    }
    
    if (!buttonEnabled) {
      console.log('🚫 BLOCKED: Button not enabled yet!')
      return
    }
    
    if (hasClosedRef.current) {
      console.log('🎉 Already closed permanently, skip')
      return
    }
    if (isClosingRef.current) {
      console.log('🎉 Already closing, skip duplicate')
      return
    }
    
    isClosingRef.current = true
    hasClosedRef.current = true
    console.log('🎉 Awesome button - EXECUTING onClose() NOW!')
    
    // ✅ Call onClose immediately
    try {
      onClose()
      console.log('🎉 onClose() executed successfully!')
    } catch (err) {
      console.error('🎉 onClose() error:', err)
    }
  }, [onClose, buttonEnabled])

  // ✅ v2.8.25: Simple click handler - fixes iPhone auto-trigger bug
  const handleButtonPress = useCallback((e: React.MouseEvent) => {
    console.log('🔘 Button CLICKED! Event type:', e.type)
    console.log('   buttonEnabled:', buttonEnabled)
    
    // ✅ v2.8.26 FIX iOS: Ignore clicks if button not enabled yet
    if (!buttonEnabled) {
      console.log('🚫 Button not enabled yet - ignoring click')
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    handleAwesomeClose()
  }, [handleAwesomeClose, buttonEnabled])

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          // ✅ v2.8.20: NO onClick on backdrop - only button should close!
          style={{ touchAction: 'manipulation' }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            // ✅ v2.8.20: NO onClick/onTouchEnd here - let events bubble to button!
            className="relative bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-4 border-[#4ade80] p-8 max-w-sm w-full shadow-2xl overflow-hidden"
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl pointer-events-none"
                  initial={{ 
                    x: Math.random() * 300, 
                    y: 400,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 1, 0],
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                >
                  {['💚', '✨', '🦎', '💫', '🎉'][i % 5]}
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative text-center" style={{ zIndex: 10 }}>
              {/* Animated Iguana */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [-5, 5, -5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-7xl mb-4 pointer-events-none"
              >
                🦎
              </motion.div>

              {/* Celebration Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="pointer-events-none"
              >
                <h2 
                  className="text-3xl font-black text-white mb-2 pointer-events-auto"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                  onTouchStart={handleLongPressStart}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                  onMouseDown={handleLongPressStart}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  {t('meetingModal.amazing')}
                </h2>
                <p className="text-[#4ade80] text-xl font-bold mb-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  {t('meetingModal.youreMeetingUp')}
                </p>
              </motion.div>

              {/* Partner info if available */}
              {partnerName && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-3 mb-6 pointer-events-none"
                >
                  {partnerPhoto && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-[#4ade80] shadow-lg shadow-[#4ade80]/30">
                      <img 
                        src={partnerPhoto} 
                        alt={partnerName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-white/60 text-sm">{t('meetingModal.meetingWith')}</p>
                    <p className="text-white font-bold text-lg">{partnerName}</p>
                  </div>
                </motion.div>
              )}

              {/* Hearts animation */}
              <motion.div
                className="flex justify-center gap-2 mb-6 pointer-events-none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                >
                  <Heart className="h-8 w-8 text-red-400 fill-red-400" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                >
                  <Heart className="h-10 w-10 text-[#4ade80] fill-[#4ade80]" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                >
                  <Heart className="h-8 w-8 text-red-400 fill-red-400" />
                </motion.div>
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/80 text-sm mb-6 pointer-events-none"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              >
                {t('meetingModal.timerPaused')}
              </motion.p>

              {/* ✅ v2.8.27 FIX Android: Simplified button handler */}
              <button
                type="button"
                onClick={(e) => {
                  console.log('🔘 Button CLICKED!')
                  e.preventDefault()
                  e.stopPropagation()
                  
                  if (!buttonEnabled) {
                    console.log('🚫 Button not enabled yet')
                    return
                  }
                  
                  handleAwesomeClose()
                }}
                onTouchEnd={(e) => {
                  console.log('👆 Button TOUCH END!')
                  e.preventDefault()
                  e.stopPropagation()
                  
                  if (!buttonEnabled) {
                    console.log('🚫 Button not enabled yet (touch)')
                    return
                  }
                  
                  handleAwesomeClose()
                }}
                disabled={!buttonEnabled}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all ${
                  buttonEnabled 
                    ? 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] shadow-[#4ade80]/30 active:scale-95 hover:from-[#3bc970] hover:to-[#16a34a] cursor-pointer' 
                    : 'bg-gradient-to-r from-[#4ade80]/50 to-[#22c55e]/50 text-[#0d2920]/50 cursor-not-allowed'
                }`}
                style={{ 
                  touchAction: 'manipulation', 
                  WebkitTapHighlightColor: 'transparent', 
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  position: 'relative',
                  zIndex: 100,
                  pointerEvents: 'auto',
                  cursor: buttonEnabled ? 'pointer' : 'not-allowed',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
              >
                {buttonEnabled ? t('meetingModal.awesome') : '✨'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* ✅ v2.8.18: Debug Panel - Long press on "Amazing!" to open */}
    <DebugPanel
      isOpen={showDebugPanel}
      onClose={() => setShowDebugPanel(false)}
    />
    </>
  )
}
