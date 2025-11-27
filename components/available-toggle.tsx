"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Power, PowerOff, Shield, Eye, EyeOff } from "lucide-react"

interface AvailableToggleProps {
  isAvailable: boolean
  onToggle: (newState: boolean) => void
  disabled?: boolean
}

export default function AvailableToggle({ isAvailable, onToggle, disabled = false }: AvailableToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = async () => {
    if (disabled || isAnimating) return
    
    setIsAnimating(true)
    
    // Haptic feedback (mobile)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    // Call parent toggle
    await onToggle(!isAvailable)
    
    setTimeout(() => setIsAnimating(false), 600)
  }

  return (
    <div className="relative">
      {/* Main Toggle Button - Compact Icon Only */}
      <motion.button
        onClick={handleToggle}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        disabled={disabled || isAnimating}
        className={`
          relative overflow-hidden
          flex items-center justify-center w-8 h-8 rounded-full
          transition-all duration-300
          ${isAvailable 
            ? 'bg-gradient-to-br from-[#4ade80] to-[#22c55e] shadow-lg shadow-[#4ade80]/30' 
            : 'bg-gray-600/50 shadow-lg shadow-gray-600/20'
          }
          ${disabled || isAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95 cursor-pointer'}
        `}
        whileTap={{ scale: disabled || isAnimating ? 1 : 0.9 }}
        whileHover={{ scale: disabled || isAnimating ? 1 : 1.1 }}
      >
        {/* Animated Background Pulse */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-full"
          animate={{
            scale: isAvailable ? [1, 1.2, 1] : 1,
            opacity: isAvailable ? [0.3, 0, 0.3] : 0,
          }}
          transition={{
            duration: 2,
            repeat: isAvailable ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        {/* Icon with Animation */}
        <motion.div
          animate={{
            rotate: isAnimating ? 360 : 0,
            scale: isAnimating ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <AnimatePresence mode="wait">
            {isAvailable ? (
              <motion.div
                key="available"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Eye className="w-4 h-4 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="unavailable"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <EyeOff className="w-4 h-4 text-white/60" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Status Indicator Dot */}
        {isAvailable && (
          <motion.div
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.button>

      {/* Tooltip - Hollywood Style! */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 z-50 w-64"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10">
              {/* Arrow */}
              <div className="absolute -top-2 right-6 w-4 h-4 bg-gray-900/95 rotate-45 border-l border-t border-white/10" />
              
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold text-sm">Privacy Control</span>
                </div>
                
                {isAvailable ? (
                  <div className="space-y-1">
                    <p className="text-green-400 text-xs font-medium">✓ You're visible to others</p>
                    <p className="text-green-400 text-xs font-medium">✓ Seeing nearby matches</p>
                    <p className="text-gray-400 text-xs">Tap to hide yourself</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs font-medium">✗ Hidden from search</p>
                    <p className="text-gray-400 text-xs font-medium">✗ Not seeing new matches</p>
                    <p className="text-green-400 text-xs">Tap to become visible</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle Effect on Toggle */}
      <AnimatePresence>
        {isAnimating && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full ${
                  isAvailable ? 'bg-green-400' : 'bg-gray-400'
                }`}
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 1
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 40,
                  y: Math.sin((i * Math.PI * 2) / 8) * 40,
                  opacity: [1, 0.5, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
