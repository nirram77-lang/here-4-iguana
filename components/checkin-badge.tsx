"use client"

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { MapPin, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CheckInData, getTimeRemainingUntilCheckout, formatTimeRemaining } from '@/lib/checkin-service'
import { useEffect, useState, useRef, useCallback } from 'react'

interface CheckInBadgeProps {
  checkInData: CheckInData
  onCheckOut: () => void
  onClose?: () => void
  autoHide?: boolean  // ✅ NEW: Auto-hide after delay
  autoHideDelay?: number  // ✅ NEW: Delay in ms (default 5000)
}

export default function CheckInBadge({ 
  checkInData, 
  onCheckOut, 
  onClose,
  autoHide = true,  // ✅ Auto-hide by default
  autoHideDelay = 5000  // ✅ 5 seconds default
}: CheckInBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemainingUntilCheckout(checkInData))
  const [isVisible, setIsVisible] = useState(true)
  
  // ✅ Refs for stable callbacks
  const onCloseRef = useRef(onClose)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // ✅ Motion values for swipe gesture
  const y = useMotionValue(0)
  const opacity = useTransform(y, [-100, 0], [0, 1])
  
  // Update ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // ✅ Auto-hide timer
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    if (isVisible && autoHide) {
      console.log(`⏰ CheckInBadge: Starting auto-hide timer: ${autoHideDelay}ms`)
      timerRef.current = setTimeout(() => {
        console.log('⏰ CheckInBadge: Auto-hide timer fired - hiding badge')
        setIsVisible(false)
        if (onCloseRef.current) {
          onCloseRef.current()
        }
      }, autoHideDelay)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isVisible, autoHide, autoHideDelay])

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemainingUntilCheckout(checkInData)
      setTimeRemaining(remaining)
      
      // Auto-checkout if expired
      if (remaining <= 0) {
        onCheckOut()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [checkInData, onCheckOut])
  
  // ✅ Handle swipe up to dismiss
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    // If swiped up more than 50px, dismiss
    if (info.offset.y < -50 || info.velocity.y < -500) {
      console.log('👆 CheckInBadge: Swiped up - dismissing')
      setIsVisible(false)
      if (onCloseRef.current) {
        onCloseRef.current()
      }
    }
  }, [])
  
  // ✅ Handle close button
  const handleClose = useCallback(() => {
    console.log('❌ CheckInBadge: Close button clicked')
    setIsVisible(false)
    if (onClose) {
      onClose()
    }
  }, [onClose])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      drag="y"
      dragConstraints={{ top: -100, bottom: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      style={{ y, opacity }}
      className="relative cursor-grab active:cursor-grabbing touch-pan-x"
    >
      {/* Swipe indicator */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />
      
      {/* Main Badge */}
      <div className="bg-gradient-to-r from-[#4ade80] to-[#3bc970] p-4 rounded-2xl shadow-2xl border-2 border-[#4ade80]/50 mt-2">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity
            }}
            className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl"
          >
            🦎
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-[#0d2920]" />
              <p className="text-sm font-bold text-[#0d2920]">
                Checked in at
              </p>
            </div>
            <h3 className="font-black text-lg text-[#0d2920] truncate">
              {checkInData.venueDisplayName}
            </h3>
            
            {/* Timer */}
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="h-3.5 w-3.5 text-[#0d2920]/70" />
              <span className="text-xs font-semibold text-[#0d2920]/70">
                Check-in expires in: {formatTimeRemaining(timeRemaining).replace(' remaining', '')}
              </span>
            </div>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="flex-shrink-0 rounded-full bg-[#0d2920]/10 hover:bg-[#0d2920]/20 text-[#0d2920]"
            title="Hide badge"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* ✅ Progress bar for auto-hide */}
        {autoHide && (
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: autoHideDelay / 1000, ease: "linear" }}
            className="h-1 bg-[#0d2920]/30 rounded-full mt-3 origin-left"
          />
        )}
        
        {/* Swipe hint */}
        <p className="text-center text-[#0d2920]/50 text-[10px] mt-2 font-medium">
          ↑ Swipe up to dismiss
        </p>
      </div>

      {/* Pulse animation */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.2, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
        className="absolute inset-0 bg-[#4ade80] rounded-2xl -z-10 blur-xl"
      />
    </motion.div>
  )
}
