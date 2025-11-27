"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { X } from 'lucide-react'

interface InAppNotificationProps {
  isVisible: boolean
  message: string
  senderName?: string
  senderPhoto?: string
  onClose: () => void
  onClick?: () => void
  type?: 'message' | 'match' | 'meeting' | 'info'
  autoHide?: boolean
  autoHideDelay?: number
}

export default function InAppNotification({
  isVisible,
  message,
  senderName,
  senderPhoto,
  onClose,
  onClick,
  type = 'message',
  autoHide = true,
  autoHideDelay = 3000
}: InAppNotificationProps) {
  
  // ✅ Refs for stable callbacks and timer management
  const onCloseRef = useRef(onClose)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // ✅ Motion values for swipe gesture
  const y = useMotionValue(0)
  const opacity = useTransform(y, [-100, 0], [0, 1])
  
  // Update ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  
  // ✅ Auto-hide with stable timer that doesn't reset on re-renders
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    if (isVisible && autoHide) {
      console.log(`⏰ InAppNotification: Starting auto-hide timer: ${autoHideDelay}ms`)
      timerRef.current = setTimeout(() => {
        console.log('⏰ InAppNotification: Auto-hide timer fired - closing notification')
        onCloseRef.current()
      }, autoHideDelay)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isVisible, autoHide, autoHideDelay]) // ✅ Removed onClose from deps!
  
  // ✅ Handle swipe up to dismiss
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    // If swiped up more than 50px or fast velocity upward, dismiss
    if (info.offset.y < -50 || info.velocity.y < -500) {
      console.log('👆 InAppNotification: Swiped up - dismissing')
      onCloseRef.current()
    }
  }, [])

  // Get icon and colors based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'message':
        return {
          icon: '💬',
          bgColor: 'from-[#1a4d3e] to-[#0d2920]',
          borderColor: 'border-[#4ade80]',
          accentColor: 'text-[#4ade80]'
        }
      case 'match':
        return {
          icon: '💚',
          bgColor: 'from-[#22c55e]/20 to-[#1a4d3e]',
          borderColor: 'border-[#4ade80]',
          accentColor: 'text-[#4ade80]'
        }
      case 'meeting':
        return {
          icon: '🎉',
          bgColor: 'from-[#4ade80]/30 to-[#1a4d3e]',
          borderColor: 'border-[#4ade80]',
          accentColor: 'text-[#4ade80]'
        }
      default:
        return {
          icon: '🦎',
          bgColor: 'from-[#1a4d3e] to-[#0d2920]',
          borderColor: 'border-[#4ade80]/50',
          accentColor: 'text-[#4ade80]'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          drag="y"
          dragConstraints={{ top: -100, bottom: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          style={{ y, opacity }}
          className="fixed top-0 left-0 right-0 z-[9999] p-3 pt-safe cursor-grab active:cursor-grabbing"
        >
          {/* Swipe indicator */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full z-10" />
          
          <motion.div
            onClick={onClick}
            className={`
              mx-auto max-w-md mt-2
              bg-gradient-to-r ${styles.bgColor}
              border-2 ${styles.borderColor}
              rounded-2xl shadow-2xl shadow-black/50
              backdrop-blur-xl
              cursor-pointer
              overflow-hidden
            `}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 p-4">
              {/* Animated Iguana */}
              <motion.div
                animate={{ 
                  x: [-3, 3, -3],
                  rotate: [-5, 5, -5]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-3xl flex-shrink-0"
              >
                🦎
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {senderName && (
                  <p className={`text-sm font-bold ${styles.accentColor} truncate`}>
                    {senderName}
                  </p>
                )}
                <p className="text-white font-medium text-sm truncate">
                  {message}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  Tap to view • Swipe up to dismiss
                </p>
              </div>

              {/* Sender Photo or Icon */}
              {senderPhoto && senderPhoto.startsWith('http') ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#4ade80]/50 flex-shrink-0">
                  <img 
                    src={senderPhoto} 
                    alt={senderName || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#4ade80]/20 flex items-center justify-center flex-shrink-0 border-2 border-[#4ade80]/50">
                  <span className="text-2xl">{styles.icon}</span>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* Progress bar for auto-hide */}
            {autoHide && (
              <motion.div
                key={`progress-${message}`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: autoHideDelay / 1000, ease: "linear" }}
                className="h-1 bg-[#4ade80] origin-left"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
