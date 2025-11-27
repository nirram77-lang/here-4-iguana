"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"

interface LoginSuccessScreenProps {
  onComplete: () => void
}

export default function LoginSuccessScreen({ onComplete }: LoginSuccessScreenProps) {
  const { user } = useAuth()

  useEffect(() => {
    // Show success screen for 2 seconds, then navigate
    const timer = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 0.6
          }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#4ade80]/20">
            <CheckCircle2 className="w-16 h-16 text-[#4ade80]" />
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-serif text-3xl font-bold text-white mb-3">
            Successfully Logged In!
          </h1>
          
          {user?.email && (
            <p className="text-[#a8d5ba] text-base mb-6">
              Welcome, {user.email}
            </p>
          )}

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-white/60 text-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-[#4ade80] border-t-transparent rounded-full"
            />
            <span>Setting up your profile...</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
