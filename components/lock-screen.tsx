"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { formatTime } from "@/lib/lock-system"
import { PREMIUM_PRICING } from "@/lib/constants"
import { Lock, Crown, Zap, Timer, Sparkles } from "lucide-react"

interface LockScreenProps {
  remainingTime: number // milliseconds
  onUpgrade: () => void
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
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
        className="w-full max-w-md relative z-10"
      >
        {/* Glowing Lock Icon */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-center mb-6 relative"
        >
          <div className="absolute inset-0 blur-3xl bg-[#4ade80]/30 rounded-full" />
          <Lock className="h-24 w-24 text-[#4ade80] mx-auto relative drop-shadow-[0_0_25px_rgba(74,222,128,0.5)]" />
        </motion.div>

        {/* Main Card */}
        <motion.div 
          className="bg-[#0d2920]/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-[#4ade80]/30 shadow-2xl relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Animated Border Glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
              opacity: 0.3,
            }}
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Title with Iguana Emoji */}
          <div className="text-center mb-6 relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-6xl mb-3"
            >
              🦎
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Out of Passes!
            </h1>
            <p className="text-white/80">
              You've had {matchesCount} matches today
            </p>
          </div>

          {/* Timer Display */}
          <motion.div 
            className="bg-gradient-to-r from-[#1a4d3e] to-[#0d2920] rounded-2xl p-6 mb-6 border-2 border-[#4ade80]/40 relative overflow-hidden"
            animate={{
              boxShadow: [
                "0 0 20px rgba(74,222,128,0.3)",
                "0 0 40px rgba(74,222,128,0.5)",
                "0 0 20px rgba(74,222,128,0.3)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Timer className="h-5 w-5 text-[#4ade80]" />
              <p className="text-white/90 text-sm font-semibold">
                Next pass available in:
              </p>
            </div>
            <motion.div
              key={formattedTime}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold text-[#4ade80] font-mono text-center drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]"
            >
              {formattedTime}
            </motion.div>
            
            {/* Pulse Effect */}
            <motion.div
              className="absolute inset-0 bg-[#4ade80]/10 rounded-2xl"
              animate={{
                opacity: [0, 0.3, 0],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </motion.div>

          {/* Premium Upgrade Section */}
          <motion.div 
            className="bg-gradient-to-br from-[#4ade80]/20 to-[#22c55e]/20 rounded-2xl p-6 mb-4 border-2 border-[#4ade80]/50 relative overflow-hidden"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Sparkle Effects */}
            <motion.div
              className="absolute top-2 right-2"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            >
              <Sparkles className="h-6 w-6 text-[#4ade80]" />
            </motion.div>

            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown className="h-6 w-6 text-[#4ade80]" />
              <h2 className="text-2xl font-bold text-white">
                Upgrade to Premium
              </h2>
            </div>
            
            <p className="text-white/90 text-center mb-4">
              Unlimited matches instantly!
            </p>

            <div className="space-y-2 mb-4">
              <motion.div 
                className="bg-[#0d2920]/50 rounded-xl p-3 flex justify-between items-center border border-[#4ade80]/30"
                whileHover={{ x: 5 }}
              >
                <span className="text-white font-semibold">📅 Weekly</span>
                <span className="text-[#4ade80] font-bold">{PREMIUM_PRICING.WEEKLY.displayPrice}/week</span>
              </motion.div>
              <motion.div 
                className="bg-[#0d2920]/50 rounded-xl p-3 flex justify-between items-center border-2 border-[#4ade80]"
                whileHover={{ x: 5 }}
              >
                <span className="text-white font-semibold">🎯 Monthly</span>
                <div className="text-right">
                  <span className="text-[#4ade80] font-bold">{PREMIUM_PRICING.MONTHLY.displayPrice}/month</span>
                  <div className="text-xs text-[#4ade80]/80">BEST VALUE!</div>
                </div>
              </motion.div>
            </div>

            <Button
              onClick={onUpgrade}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]"
            >
              <Crown className="mr-2 h-5 w-5" />
              Upgrade Now
            </Button>
          </motion.div>

          {/* Skip Timer Section */}
          <motion.div 
            className="bg-gradient-to-br from-[#4ade80]/10 to-[#22c55e]/10 rounded-2xl p-6 border-2 border-[#4ade80]/30 relative overflow-hidden"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Lightning Animation */}
            <motion.div
              className="absolute top-2 right-2"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Zap className="h-6 w-6 text-[#4ade80]" fill="currentColor" />
            </motion.div>

            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-[#4ade80]" />
              <h3 className="text-xl font-bold text-white">
                Skip 2-Hour Wait
              </h3>
            </div>

            <p className="text-white/90 text-center mb-4">
              Get 1 pass instantly!
            </p>

            <div className="bg-[#0d2920]/50 rounded-xl p-3 text-center mb-4 border border-[#4ade80]/30">
              <span className="text-[#4ade80] font-bold text-2xl">
                {PREMIUM_PRICING.SKIP_TIMER.displayPrice}
              </span>
              <span className="text-white/70 text-sm ml-2">one-time</span>
            </div>

            <Button
              onClick={onSkipTimer}
              className="w-full h-14 rounded-xl bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] font-bold text-lg border-2 border-[#4ade80] shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(74,222,128,0.3)]"
            >
              <Zap className="mr-2 h-5 w-5" fill="currentColor" />
              Skip Timer
            </Button>
          </motion.div>

          {/* Info Text */}
          <p className="text-white/50 text-center text-sm mt-6">
            Or wait for the timer to reset...
          </p>
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-3 bg-[#0d2920]/50 rounded-2xl p-6 border border-[#4ade80]/20"
        >
          {[
            { icon: "👑", text: "Premium: No waiting, unlimited matches" },
            { icon: "⚡", text: "Skip Timer: Instant unlock, one pass" },
            { icon: "🦎", text: "Free: 2 matches every 2 hours" }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center text-white/80 text-sm"
            >
              <span className="text-2xl mr-3">{item.icon}</span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
