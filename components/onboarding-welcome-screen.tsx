"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, Sparkles, Shield, Users } from "lucide-react"
import { useState } from "react"

interface OnboardingWelcomeScreenProps {
  onContinue: () => void
}

export default function OnboardingWelcomeScreen({ onContinue }: OnboardingWelcomeScreenProps) {
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false)

  // First show welcome, then guidelines
  if (!showGuidelines) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          
          {/* Animated Iguana */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-8"
          >
            <div className="text-9xl">🦎</div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">Welcome! 👋</h1>
            <p className="text-xl text-white/80 mb-6">Good to see you!</p>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
              I4IGUANA
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/60 text-lg mb-12 max-w-md"
          >
            Let's create your profile and start meeting amazing people nearby! 💚
          </motion.p>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full max-w-md"
          >
            <Button
              onClick={() => setShowGuidelines(true)}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg shadow-[#4ade80]/30"
            >
              Let's Go!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Simple, cute guidelines screen
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        
        {/* Floating hearts animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ 
                x: Math.random() * 300 + 50, 
                y: 600,
                opacity: 0.6
              }}
              animate={{ 
                y: -100,
                opacity: [0.6, 0.8, 0]
              }}
              transition={{ 
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "linear"
              }}
            >
              {['💚', '💛', '🧡', '💜'][i % 4]}
            </motion.div>
          ))}
        </div>

        {/* Header with hearts */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
          </motion.div>
          <span className="text-5xl">🦎</span>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white text-center mb-2"
        >
          Be Kind, Have Fun! 💚
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/60 text-center mb-10"
        >
          A few quick things before we start
        </motion.p>

        {/* Simple guidelines - cards with emojis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm space-y-4 mb-10"
        >
          {/* Be Respectful */}
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-[#4ade80]/20">
            <div className="text-3xl">🤝</div>
            <div>
              <p className="text-white font-medium">Be Respectful</p>
              <p className="text-white/50 text-sm">Treat everyone with kindness</p>
            </div>
          </div>

          {/* Stay Safe */}
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-[#4ade80]/20">
            <div className="text-3xl">🛡️</div>
            <div>
              <p className="text-white font-medium">Stay Safe</p>
              <p className="text-white/50 text-sm">Meet in public places</p>
            </div>
          </div>

          {/* Have Fun */}
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-[#4ade80]/20">
            <div className="text-3xl">✨</div>
            <div>
              <p className="text-white font-medium">Have Fun!</p>
              <p className="text-white/50 text-sm">Enjoy meeting new people</p>
            </div>
          </div>
        </motion.div>

        {/* Agreement checkbox - simple and cute */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => setAgreedToGuidelines(!agreedToGuidelines)}
          className="flex items-center gap-3 mb-8"
        >
          <div className={`
            w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all
            ${agreedToGuidelines 
              ? 'bg-[#4ade80] border-[#4ade80]' 
              : 'border-white/40 hover:border-[#4ade80]'
            }
          `}>
            {agreedToGuidelines && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Heart className="w-4 h-4 text-[#0d2920] fill-[#0d2920]" />
              </motion.div>
            )}
          </div>
          <span className="text-white/70 text-sm">
            I'll be kind and respectful 💚
          </span>
        </motion.button>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-sm"
        >
          <Button
            onClick={onContinue}
            disabled={!agreedToGuidelines}
            className={`
              w-full h-14 rounded-2xl font-bold text-lg transition-all
              ${agreedToGuidelines 
                ? 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] shadow-lg shadow-[#4ade80]/30' 
                : 'bg-white/10 text-white/40 cursor-not-allowed'
              }
            `}
          >
            {agreedToGuidelines ? (
              <>
                Let's Create My Profile!
                <Sparkles className="ml-2 h-5 w-5" />
              </>
            ) : (
              'Tap the heart above 💚'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
