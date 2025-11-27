"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

/**
 * 🦎 Iguana Animation Component
 * 
 * Hollywood-style optimistic animation shown when:
 * 1. Match partner deletes account mid-match
 * 2. Match expires naturally
 * 3. Other "searching for matches" scenarios
 * 
 * Style: Cute, optimistic, Hollywood-level polish with I4IGUANA green theme
 */

interface IguanaAnimationProps {
  message?: string
  onComplete?: () => void
  duration?: number  // How long to show before onComplete (default: 3000ms)
}

export default function IguanaAnimation({ 
  message = "The iguana is searching for new matches for you! 🦎✨",
  onComplete,
  duration = 3000
}: IguanaAnimationProps) {

  // Auto-complete after duration
  if (onComplete && duration > 0) {
    setTimeout(() => {
      onComplete()
    }, duration)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920]"
    >
      {/* Background sparkles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 3
            }}
            className="absolute text-[#4ade80]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          >
            <Sparkles size={20} />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 max-w-md">
        {/* Iguana emoji with bounce animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [-180, 0]
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
          className="mb-6"
        >
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-[180px] leading-none filter drop-shadow-2xl"
          >
            🦎
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-4"
        >
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
            Searching...
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-300 leading-relaxed px-4"
          >
            {message}
          </motion.p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-2 mt-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-3 h-3 rounded-full bg-[#4ade80]"
            />
          ))}
        </motion.div>

        {/* Decorative green glow */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-[#4ade80] rounded-full blur-[100px] -z-10"
        />
      </div>
    </motion.div>
  )
}

/**
 * 🎬 Usage Examples:
 * 
 * // Basic usage - auto-navigate after 3 seconds
 * {showIguanaAnimation && (
 *   <IguanaAnimation 
 *     onComplete={() => {
 *       setShowIguanaAnimation(false)
 *       onNavigate('home')
 *     }}
 *   />
 * )}
 * 
 * // Custom message and duration
 * {showIguanaAnimation && (
 *   <IguanaAnimation 
 *     message="Your match partner has left. Don't worry, we're finding someone new!"
 *     duration={4000}
 *     onComplete={() => setShowIguanaAnimation(false)}
 *   />
 * )}
 * 
 * // No auto-complete (manual dismiss)
 * {showIguanaAnimation && (
 *   <IguanaAnimation 
 *     duration={0}  // Disable auto-complete
 *   />
 * )}
 */
