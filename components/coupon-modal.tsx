"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Crown, Sparkles, Check, AlertCircle } from 'lucide-react'
import { redeemCoupon, CouponResult } from '@/lib/coupon-service'

interface CouponModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
  type: 'premium' | 'pass'  // Which button was clicked
  onSuccess?: (result: CouponResult) => void
}

export default function CouponModal({
  isOpen,
  onClose,
  phoneNumber,
  type,
  onSuccess
}: CouponModalProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CouponResult | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCouponCode('')
      setResult(null)
      setShowSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!couponCode.trim()) return
    
    setIsLoading(true)
    setResult(null)
    
    try {
      const redeemResult = await redeemCoupon(phoneNumber, couponCode)
      setResult(redeemResult)
      
      if (redeemResult.success) {
        setShowSuccess(true)
        
        // Call success callback after animation
        setTimeout(() => {
          onSuccess?.(redeemResult)
        }, 2000)
        
        // Close modal after celebration
        setTimeout(() => {
          onClose()
        }, 3500)
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Something went wrong. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isPremium = type === 'premium'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl overflow-hidden border-2 border-[#4ade80]/50 shadow-2xl shadow-[#4ade80]/20"
          >
            {/* Success Celebration Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]"
                >
                  {/* Confetti particles */}
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 0,
                        y: 0,
                        x: 0,
                        scale: 0
                      }}
                      animate={{ 
                        opacity: [0, 1, 1, 0],
                        y: [-20, -150 - Math.random() * 100],
                        x: (Math.random() - 0.5) * 200,
                        scale: [0, 1, 1, 0.5],
                        rotate: Math.random() * 360
                      }}
                      transition={{ 
                        duration: 2,
                        delay: Math.random() * 0.5,
                        ease: "easeOut"
                      }}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                        width: '12px',
                        height: '12px',
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        background: ['#4ade80', '#22c55e', '#86efac', '#fbbf24', '#f472b6'][Math.floor(Math.random() * 5)]
                      }}
                    />
                  ))}

                  {/* Success Iguana Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: [0, 1.2, 1],
                      rotate: [180, -10, 0]
                    }}
                    transition={{ duration: 0.8, ease: "backOut" }}
                    className="text-8xl mb-6"
                  >
                    🦎
                  </motion.div>

                  {/* Sparkles around iguana */}
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-2xl"
                        style={{
                          transform: `rotate(${i * 45}deg) translateY(-80px)`
                        }}
                      >
                        ✨
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Success Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center px-6"
                  >
                    <h2 className="text-3xl font-black text-[#4ade80] mb-2">
                      {isPremium ? '👑 Welcome to Premium!' : '🎁 Bonus Received!'}
                    </h2>
                    <p className="text-white/80 text-lg">
                      {result?.reward}
                    </p>
                  </motion.div>

                  {/* Dancing iguana at bottom */}
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [-5, 5, -5]
                    }}
                    transition={{ 
                      duration: 0.5,
                      repeat: Infinity
                    }}
                    className="absolute bottom-8 text-4xl"
                  >
                    💚
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>

            {/* Header with Animated Iguana */}
            <div className="pt-8 pb-4 px-6 text-center">
              {/* Cute animated iguana */}
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [-3, 3, -3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block mb-4"
              >
                <div className="relative">
                  {/* Iguana body */}
                  <motion.span 
                    className="text-7xl block"
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity
                    }}
                  >
                    🦎
                  </motion.span>
                  
                  {/* Floating hearts/sparkles */}
                  <motion.span
                    animate={{ 
                      y: [-10, -30],
                      opacity: [0, 1, 0],
                      x: [0, 10]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute -top-2 -right-2 text-2xl"
                  >
                    {isPremium ? '👑' : '🎁'}
                  </motion.span>

                  <motion.span
                    animate={{ 
                      y: [-10, -25],
                      opacity: [0, 1, 0],
                      x: [0, -10]
                    }}
                    transition={{ 
                      duration: 1.8,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      delay: 0.5
                    }}
                    className="absolute -top-2 -left-2 text-xl"
                  >
                    ✨
                  </motion.span>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-black text-white mb-2"
              >
                {isPremium ? (
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="h-6 w-6 text-yellow-400" />
                    Unlock Premium
                    <Crown className="h-6 w-6 text-yellow-400" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Gift className="h-6 w-6 text-[#4ade80]" />
                    Get Bonus Pass
                    <Gift className="h-6 w-6 text-[#4ade80]" />
                  </span>
                )}
              </motion.h2>

              <p className="text-white/60 text-sm">
                Enter your promotional code below
              </p>
            </div>

            {/* Input Section */}
            <div className="px-6 pb-6">
              {/* Coupon Input */}
              <div className="mb-4">
                <motion.div
                  animate={result?.success === false ? {
                    x: [-5, 5, -5, 5, 0]
                  } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={isPremium ? "e.g. PILOT2026" : "e.g. PASS2026"}
                    className={`
                      w-full px-4 py-4 rounded-xl
                      bg-white/10 border-2 
                      ${result?.success === false 
                        ? 'border-red-500/50 focus:border-red-500' 
                        : 'border-white/20 focus:border-[#4ade80]'
                      }
                      text-white text-center text-xl font-bold tracking-widest
                      placeholder-white/30
                      focus:outline-none focus:ring-2 focus:ring-[#4ade80]/30
                      transition-all duration-300
                    `}
                    disabled={isLoading || showSuccess}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  
                  {/* Glowing border effect when typing */}
                  {couponCode && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 rounded-xl border-2 border-[#4ade80] pointer-events-none"
                      style={{
                        boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)'
                      }}
                    />
                  )}
                </motion.div>
              </div>

              {/* Error/Result Message */}
              <AnimatePresence>
                {result && !result.success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{result.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!couponCode.trim() || isLoading || showSuccess}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg
                  flex items-center justify-center gap-2
                  transition-all duration-300
                  ${!couponCode.trim() || isLoading || showSuccess
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : isPremium
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-[#0d2920]'
                      : 'bg-[#4ade80] hover:bg-[#22c55e] text-[#0d2920]'
                  }
                `}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    🦎
                  </motion.div>
                ) : (
                  <>
                    {isPremium ? <Crown className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                    Redeem Code
                    <Sparkles className="h-5 w-5" />
                  </>
                )}
              </motion.button>

              {/* Hint text */}
              <p className="text-center text-white/40 text-xs mt-4">
                {isPremium 
                  ? '💡 Premium gives you 3 daily passes + unlimited matches!'
                  : '💡 Each pass lets you swipe on one more person today!'
                }
              </p>
            </div>

            {/* Bottom decoration */}
            <div className="h-2 bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#4ade80]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
