"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, PartyPopper } from 'lucide-react'

interface WeAreMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  partnerName?: string
  partnerPhoto?: string
}

export default function WeAreMeetingModal({
  isOpen,
  onClose,
  partnerName,
  partnerPhoto
}: WeAreMeetingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-4 border-[#4ade80] p-8 max-w-sm w-full shadow-2xl overflow-hidden"
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  initial={{ 
                    x: Math.random() * 300, 
                    y: 400,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 1, 0],
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                >
                  {['💚', '✨', '🦎', '💫', '🎉'][i % 5]}
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Animated Iguana */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [-5, 5, -5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-7xl mb-4"
              >
                🦎
              </motion.div>

              {/* Celebration Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-black text-white mb-2">
                  Amazing! 🎉
                </h2>
                <p className="text-[#4ade80] text-xl font-bold mb-4">
                  You're Meeting Up!
                </p>
              </motion.div>

              {/* Partner info if available */}
              {partnerName && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  {partnerPhoto && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-[#4ade80] shadow-lg shadow-[#4ade80]/30">
                      <img 
                        src={partnerPhoto} 
                        alt={partnerName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-white/60 text-sm">Meeting with</p>
                    <p className="text-white font-bold text-lg">{partnerName}</p>
                  </div>
                </motion.div>
              )}

              {/* Hearts animation */}
              <motion.div
                className="flex justify-center gap-2 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                >
                  <Heart className="h-8 w-8 text-red-400 fill-red-400" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                >
                  <Heart className="h-10 w-10 text-[#4ade80] fill-[#4ade80]" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                >
                  <Heart className="h-8 w-8 text-red-400 fill-red-400" />
                </motion.div>
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/80 text-sm mb-6"
              >
                The timer has paused. Enjoy your connection! 💚
              </motion.p>

              {/* Close button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-black text-lg shadow-lg shadow-[#4ade80]/30"
              >
                Awesome! 🦎
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
