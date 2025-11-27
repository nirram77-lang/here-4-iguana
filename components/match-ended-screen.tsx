"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface MatchEndedScreenProps {
  isVisible: boolean
  onComplete: () => void
  duration?: number // in milliseconds, default 5000
  reason?: 'deleted' | 'expired' | 'cancelled' | 'unknown'  // ✅ NEW: Reason for match ending
  matchName?: string  // ✅ NEW: Name of the match who left
}

export default function MatchEndedScreen({
  isVisible,
  onComplete,
  duration = 5000,  // ✅ 5 seconds for better UX
  reason = 'unknown',
  matchName
}: MatchEndedScreenProps) {
  const [countdown, setCountdown] = useState(5)
  const [phase, setPhase] = useState<'sad' | 'searching'>('sad')
  const onCompleteRef = useRef(onComplete)
  const hasCompletedRef = useRef(false)
  
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isVisible) {
      hasCompletedRef.current = false
      setPhase('sad')
      return
    }

    hasCompletedRef.current = false
    const seconds = Math.ceil(duration / 1000)
    setCountdown(seconds)

    // Switch to searching phase after 2 seconds
    const phaseTimer = setTimeout(() => {
      setPhase('searching')
    }, 2000)

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 0 : prev - 1)
    }, 1000)

    // Auto-complete
    const timer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        console.log('✅ MatchEndedScreen: Completing after', duration, 'ms')
        onCompleteRef.current()
      }
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(phaseTimer)
      clearInterval(countdownInterval)
    }
  }, [isVisible, duration])

  // Get message based on reason
  const getMessage = () => {
    switch (reason) {
      case 'deleted':
        return {
          title: matchName ? `${matchName} left` : 'Match Unavailable',
          subtitle: 'They deleted their account',
          icon: '💔'
        }
      case 'expired':
        return {
          title: 'Time\'s Up!',
          subtitle: 'The match timer expired',
          icon: '⏰'
        }
      case 'cancelled':
        return {
          title: 'Match Cancelled',
          subtitle: 'The match was ended',
          icon: '👋'
        }
      default:
        return {
          title: 'Match Ended',
          subtitle: 'Time to find someone new!',
          icon: '💫'
        }
    }
  }

  const message = getMessage()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${phase === 'sad' ? 'bg-pink-500/30' : 'bg-[#4ade80]/30'}`}
                initial={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [null, `${Math.random() * -50}%`],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="relative flex flex-col items-center justify-center px-6">
            
            <AnimatePresence mode="wait">
              {phase === 'sad' ? (
                /* ============= PHASE 1: SAD (0-2 seconds) ============= */
                <motion.div
                  key="sad"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  {/* Broken Heart Animation */}
                  <motion.div
                    className="relative mb-6"
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 blur-2xl bg-pink-500/30 rounded-full scale-150" />
                    
                    {/* Icon container */}
                    <motion.div
                      className="relative w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 border-4 border-pink-500/50 flex items-center justify-center shadow-2xl shadow-pink-500/30"
                      animate={{
                        boxShadow: [
                          '0 0 30px rgba(236, 72, 153, 0.3)',
                          '0 0 60px rgba(236, 72, 153, 0.5)',
                          '0 0 30px rgba(236, 72, 153, 0.3)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <span className="text-6xl">{message.icon}</span>
                    </motion.div>
                  </motion.div>

                  {/* Sad Message */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black text-white mb-2 text-center"
                  >
                    {message.title}
                  </motion.h2>
                  
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-pink-400 text-lg text-center mb-4"
                  >
                    {message.subtitle}
                  </motion.p>

                  {/* Sad iguana */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="text-4xl"
                  >
                    😢🦎
                  </motion.div>
                </motion.div>
              ) : (
                /* ============= PHASE 2: SEARCHING (2-5 seconds) ============= */
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="flex flex-col items-center"
                >
                  {/* Sonar Rings */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full border-2 border-[#4ade80]"
                          initial={{ width: 80, height: 80, opacity: 0.8 }}
                          animate={{
                            width: [80, 250],
                            height: [80, 250],
                            opacity: [0.6, 0],
                          }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            delay: i * 0.45,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                    </div>

                    {/* Center Circle with Searching Iguana */}
                    <motion.div
                      className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#4ade80]/30 to-[#22c55e]/20 border-4 border-[#4ade80] flex items-center justify-center shadow-2xl shadow-[#4ade80]/30"
                      animate={{
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          '0 0 30px rgba(74, 222, 128, 0.3)',
                          '0 0 60px rgba(74, 222, 128, 0.5)',
                          '0 0 30px rgba(74, 222, 128, 0.3)',
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <motion.div
                        className="text-6xl"
                        animate={{
                          rotate: [-10, 10, -10],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        🦎
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Searching Message */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-black text-white mb-2 text-center"
                  >
                    Don't worry! 💚
                  </motion.h2>
                  
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-[#4ade80] text-lg text-center mb-2"
                  >
                    Finding new matches for you...
                  </motion.p>

                  {/* Sparkles */}
                  <motion.div 
                    className="flex gap-3 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [-5, 5, -5],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      >
                        <Sparkles className="h-5 w-5 text-[#4ade80]" />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown - Always visible */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <motion.div
                className={`w-14 h-14 rounded-full ${phase === 'sad' ? 'bg-pink-500/20 border-pink-500/50' : 'bg-[#4ade80]/20 border-[#4ade80]/50'} border-2 flex items-center justify-center`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <span className={`text-2xl font-bold ${phase === 'sad' ? 'text-pink-400' : 'text-[#4ade80]'}`}>
                  {countdown}
                </span>
              </motion.div>
            </motion.div>

            {/* Loading dots */}
            <motion.div className="flex gap-2 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full ${phase === 'sad' ? 'bg-pink-500' : 'bg-[#4ade80]'}`}
                  animate={{
                    y: [-4, 4, -4],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 text-white/50 text-sm text-center px-6"
          >
            {phase === 'sad' 
              ? "It happens... let's find you someone better!"
              : "Your perfect match is waiting! 💚"
            }
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
