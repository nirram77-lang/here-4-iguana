"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Crown } from "lucide-react"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      setTimeout(() => setLoading(false), 2000)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background */}
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
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <div className="text-center relative z-10">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl mb-6"
          >
            🦎
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#4ade80] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#4ade80]/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-[#0d2920]/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-[#4ade80]/30 text-center relative overflow-hidden">
          {/* Animated Glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4ade80]/10 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Success Icon with animations */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mb-6"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(74,222,128,0.3)",
                  "0 0 40px rgba(74,222,128,0.6)",
                  "0 0 20px rgba(74,222,128,0.3)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center mx-auto relative"
            >
              <Check size={48} className="text-[#0d2920]" strokeWidth={3} />
              
              {/* Sparkles around check */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${i * 25}%`,
                    top: `${(i % 2) * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                >
                  <Sparkles className="h-4 w-4 text-[#4ade80]" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Iguana celebration */}
          <motion.div
            animate={{
              rotate: [0, -15, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-6xl mb-4"
          >
            🦎
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            Payment Successful!
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 mb-6"
          >
            Your purchase has been completed successfully.
          </motion.p>

          {/* Premium Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/20 rounded-2xl p-4 mb-6 border border-[#4ade80]/40"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-[#4ade80]" />
              <span className="text-[#4ade80] font-bold">Premium Activated!</span>
            </div>
            <p className="text-white/60 text-sm">
              Enjoy unlimited matches instantly
            </p>
          </motion.div>

          {/* Order ID */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-[#1a4d3e]/50 rounded-2xl p-4 mb-6 border border-[#4ade80]/20"
          >
            <p className="text-white/60 text-sm mb-2">Order ID</p>
            <p className="text-[#4ade80] text-xs font-mono break-all">{sessionId}</p>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => router.push('/')}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]"
            >
              Continue to App
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
