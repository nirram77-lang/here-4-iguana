"use client"

import { motion } from "framer-motion"
import { EyeOff, Shield, Zap } from "lucide-react"

interface HiddenStateProps {
  onBecomeAvailable: () => void
}

export default function HiddenState({ onBecomeAvailable }: HiddenStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12">
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
        className="mb-8"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 blur-2xl bg-gray-500/30 rounded-full scale-150" />
          
          {/* Icon */}
          <div className="relative bg-gradient-to-br from-gray-600 to-gray-800 p-8 rounded-full shadow-2xl">
            <EyeOff className="w-16 h-16 text-gray-300" />
          </div>
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-gray-200 mb-4 text-center"
      >
        You're Hidden
      </motion.h2>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3 mb-8 text-center max-w-md"
      >
        <p className="text-gray-400 text-base">
          Your privacy is protected. You're not visible to anyone right now.
        </p>
        
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Private</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">Safe</span>
          </div>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBecomeAvailable}
        className="relative overflow-hidden px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-2xl shadow-green-500/50"
      >
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: [-200, 200],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <span className="relative z-10 flex items-center gap-2">
          Become Available
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            →
          </motion.span>
        </span>
      </motion.button>

      {/* Info Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-gray-500 text-sm mt-6 text-center max-w-sm"
      >
        Tap to start seeing nearby matches and become visible to others
      </motion.p>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gray-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}
