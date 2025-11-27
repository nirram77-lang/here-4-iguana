"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

interface IguanaSearchingModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export default function IguanaSearchingModal({
  isOpen,
  onClose,
  message = "Iguana is searching for a new match for you..."
}: IguanaSearchingModalProps) {
  const [dots, setDots] = useState("")

  // Animated dots effect
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isOpen])

  // Auto-close after 5 seconds
  useEffect(() => {
    if (!isOpen) return

    const timeout = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timeout)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 100 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300
            }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative bg-gradient-to-br from-[#1a4d3e] via-[#0d2920] to-[#1a4d3e] rounded-3xl p-10 max-w-md w-full border-2 border-[#4ade80]/30 shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sparkle effects in background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ 
                      x: Math.random() * 100 + "%", 
                      y: Math.random() * 100 + "%",
                      opacity: 0 
                    }}
                    animate={{
                      y: [null, "-100%"],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  >
                    <Sparkles className="text-[#4ade80]/40" size={20} />
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Animated Iguana */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, -5, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-8xl mb-6 inline-block"
                >
                  🦎
                </motion.div>

                {/* Searching rings */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <motion.div
                    animate={{
                      scale: [1, 2, 2],
                      opacity: [0.5, 0.2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-4 border-[#4ade80]"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 2, 2],
                      opacity: [0.5, 0.2, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-4 border-[#4ade80]"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 2, 2],
                      opacity: [0.5, 0.2, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: 1,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-4 border-[#4ade80]"
                  />
                </div>

                {/* Message */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-4"
                >
                  Match Ended
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[#4ade80] text-lg font-medium mb-2"
                >
                  {message}
                  <span className="inline-block w-8 text-left">{dots}</span>
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white/60 text-sm"
                >
                  Your match partner has left
                </motion.p>

                {/* Progress bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#4ade80] origin-left"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
