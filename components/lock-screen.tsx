"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { formatTime } from "@/lib/lock-system"
import { PREMIUM_PRICING } from "@/lib/constants"
import { Lock, Crown, Zap, Timer, Sparkles, Star, Rocket, Check } from "lucide-react"

interface LockScreenProps {
  remainingTime: number // milliseconds
  onUpgrade: (plan: 'weekly' | 'monthly') => void
  onSkipTimer: () => void
  matchesCount: number
}

export default function LockScreen({ 
  remainingTime: initialRemainingTime, 
  onUpgrade, 
  onSkipTimer,
  matchesCount 
}: LockScreenProps) {
  const [remainingTime, setRemainingTime] = useState(initialRemainingTime)
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly')

  useEffect(() => {
    setRemainingTime(initialRemainingTime)
  }, [initialRemainingTime])

  useEffect(() => {
    if (remainingTime <= 0) return

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1000
        return newTime > 0 ? newTime : 0
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingTime])

  const formattedTime = formatTime(remainingTime)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] flex items-center justify-center p-4 relative overflow-y-auto">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#4ade80]/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-md relative z-10 my-4"
      >
        {/* 🚀 Launch Price Banner */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4"
        >
          <motion.div
            className="bg-gradient-to-r from-[#f59e0b] via-[#eab308] to-[#f59e0b] rounded-2xl p-3 text-center relative overflow-hidden"
            animate={{
              boxShadow: [
                "0 0 20px rgba(245,158,11,0.4)",
                "0 0 40px rgba(245,158,11,0.6)",
                "0 0 20px rgba(245,158,11,0.4)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative flex items-center justify-center gap-2">
              <Rocket className="h-5 w-5 text-[#0d2920]" />
              <span className="font-bold text-[#0d2920] text-lg">
                🎉 Launch Price - Limited Time!
              </span>
              <Rocket className="h-5 w-5 text-[#0d2920]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          className="bg-[#0d2920]/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#4ade80]/30 shadow-2xl relative overflow-hidden"
        >
          {/* Animated Border Glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
              opacity: 0.3,
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Title with Iguana */}
          <div className="text-center mb-4 relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-5xl mb-2"
            >
              🦎
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Out of Passes!
            </h1>
            <p className="text-white/70 text-sm">
              You've had {matchesCount} matches today
            </p>
          </div>

          {/* Timer Display - FLASHING! Hollywood Style 🎬 */}
          <motion.div 
            className="bg-gradient-to-r from-[#1a4d3e] to-[#0d2920] rounded-xl p-4 mb-5 border-2 border-[#4ade80]/60"
            animate={{
              boxShadow: [
                "0 0 15px rgba(74,222,128,0.3)",
                "0 0 35px rgba(74,222,128,0.6)",
                "0 0 15px rgba(74,222,128,0.3)",
              ],
              borderColor: [
                "rgba(74,222,128,0.4)",
                "rgba(74,222,128,0.8)",
                "rgba(74,222,128,0.4)",
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Timer className="h-5 w-5 text-[#4ade80]" />
                </motion.div>
                <span className="text-white/90 text-sm font-medium">Next <span className="text-[#4ade80] font-bold">FREE</span> pass in:</span>
              </div>
              <motion.span
                key={formattedTime}
                initial={{ scale: 1.2, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-[#4ade80] font-mono"
              >
                {formattedTime}
              </motion.span>
            </div>
            <p className="text-white/50 text-xs text-center mt-2">⏳ Wait 1 hour or upgrade now for unlimited matches</p>
          </motion.div>

          {/* Premium Plans Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-[#4ade80]" />
              <h2 className="text-xl font-bold text-white">Choose Your Plan</h2>
            </div>

            <div className="space-y-2">
              {/* Weekly Plan */}
              <motion.div
                onClick={() => setSelectedPlan('weekly')}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlan === 'weekly'
                    ? 'bg-[#4ade80]/20 border-2 border-[#4ade80]'
                    : 'bg-[#0d2920]/50 border border-[#4ade80]/30 hover:border-[#4ade80]/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'weekly' ? 'border-[#4ade80] bg-[#4ade80]' : 'border-white/40'
                    }`}>
                      {selectedPlan === 'weekly' && <Check className="h-3 w-3 text-[#0d2920]" />}
                    </div>
                    <div>
                      <span className="text-white font-semibold">Weekly Premium</span>
                      <p className="text-white/60 text-xs">7 days of unlimited matches</p>
                    </div>
                  </div>
                  <span className="text-[#4ade80] font-bold text-lg">{PREMIUM_PRICING.WEEKLY.displayPrice}</span>
                </div>
              </motion.div>

              {/* Monthly Plan - Best Value */}
              <motion.div
                onClick={() => setSelectedPlan('monthly')}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#4ade80]/20 border-2 border-[#4ade80]'
                    : 'bg-[#0d2920]/50 border border-[#4ade80]/30 hover:border-[#4ade80]/50'
                }`}
              >
                {/* Best Value Badge */}
                <div className="absolute -top-2 right-3 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" fill="currentColor" />
                  BEST VALUE
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'monthly' ? 'border-[#4ade80] bg-[#4ade80]' : 'border-white/40'
                    }`}>
                      {selectedPlan === 'monthly' && <Check className="h-3 w-3 text-[#0d2920]" />}
                    </div>
                    <div>
                      <span className="text-white font-semibold">Monthly Premium</span>
                      <p className="text-white/60 text-xs">30 days • Save 50%!</p>
                    </div>
                  </div>
                  <span className="text-[#4ade80] font-bold text-lg">{PREMIUM_PRICING.MONTHLY.displayPrice}</span>
                </div>
              </motion.div>
            </div>

            {/* Upgrade Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
              <Button
                onClick={() => onUpgrade(selectedPlan)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]"
              >
                <Crown className="mr-2 h-5 w-5" />
                Upgrade to {selectedPlan === 'weekly' ? 'Weekly' : 'Monthly'}
              </Button>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Skip Timer - Compact */}
          <motion.div 
            className="bg-[#0d2920]/50 rounded-xl p-4 border border-[#4ade80]/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#4ade80]" fill="currentColor" />
                <span className="text-white font-semibold">Skip Timer</span>
              </div>
              <span className="text-[#4ade80] font-bold">{PREMIUM_PRICING.SKIP_TIMER.displayPrice}</span>
            </div>
            <p className="text-white/60 text-xs mb-3">Get 1 pass instantly • One-time purchase</p>
            <Button
              onClick={onSkipTimer}
              className="w-full h-10 rounded-xl bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] font-semibold border border-[#4ade80]/50"
            >
              <Zap className="mr-2 h-4 w-4" fill="currentColor" />
              Get 1 Pass Now
            </Button>
          </motion.div>

          {/* Info Text */}
          <p className="text-white/40 text-center text-xs mt-4">
            🔒 Secure payment via Stripe • Cancel anytime
          </p>
        </motion.div>

        {/* Features List - Compact */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-[#0d2920]/50 rounded-xl p-4 border border-[#4ade80]/20"
        >
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-2xl">👑</span>
              <p className="text-white/70 text-xs mt-1">Unlimited</p>
            </div>
            <div>
              <span className="text-2xl">⚡</span>
              <p className="text-white/70 text-xs mt-1">1 Pass</p>
            </div>
            <div>
              <span className="text-2xl">🦎</span>
              <p className="text-white/70 text-xs mt-1">Wait 1h</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
