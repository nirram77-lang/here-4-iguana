"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, RotateCcw, Home } from "lucide-react"

export default function PaymentCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#4ade80]/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
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
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4ade80]/5 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Cancel Icon with animations */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mb-6"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(239,68,68,0.3)",
                  "0 0 30px rgba(239,68,68,0.5)",
                  "0 0 20px rgba(239,68,68,0.3)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-red-500/20 border-4 border-red-500/50 rounded-full flex items-center justify-center mx-auto relative"
            >
              <X size={48} className="text-red-500" strokeWidth={3} />
            </motion.div>
          </motion.div>

          {/* Sad Iguana */}
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-6xl mb-4 grayscale"
          >
            🦎
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            Payment Cancelled
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 mb-6"
          >
            Your payment was cancelled. No charges were made.
          </motion.p>

          {/* Info Box */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="bg-[#1a4d3e]/50 rounded-2xl p-4 mb-6 border border-[#4ade80]/20"
          >
            <p className="text-white/60 text-sm">
              No worries! You can try again anytime or continue using the free version.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => router.push('/')}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]"
              >
                <Home className="mr-2" size={20} />
                Return to App
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full h-12 rounded-xl bg-transparent border-2 border-[#4ade80]/40 hover:bg-[#4ade80]/10 text-white font-semibold text-base"
              >
                <RotateCcw className="mr-2" size={18} />
                Try Again
              </Button>
            </motion.div>
          </div>

          {/* Support Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/40 text-xs mt-6"
          >
            Need help? Contact support@i4iguana.com
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
