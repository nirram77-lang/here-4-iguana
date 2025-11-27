"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart } from "lucide-react"

interface SexualOrientationScreenProps {
  onContinue: (orientation: 'straight' | 'gay' | 'lesbian' | 'bisexual') => void
  userGender?: 'male' | 'female'  // To show relevant options
}

export default function SexualOrientationScreen({ 
  onContinue,
  userGender
}: SexualOrientationScreenProps) {
  const [orientation, setOrientation] = useState<'straight' | 'gay' | 'lesbian' | 'bisexual' | null>(null)

  // ✅ All 4 options for everyone - clean emojis (hearts)
  const orientations = [
    { value: 'straight' as const, label: 'Straight', emoji: '❤️', desc: 'Attracted to opposite gender' },
    { value: 'gay' as const, label: 'Gay', emoji: '💙', desc: 'Attracted to same gender' },
    { value: 'lesbian' as const, label: 'Lesbian', emoji: '💜', desc: 'Attracted to same gender' },
    { value: 'bisexual' as const, label: 'Bisexual', emoji: '💗', desc: 'Attracted to all genders' },
  ]

  const handleContinue = () => {
    if (orientation) {
      onContinue(orientation)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Heart className="w-3 h-3 text-[#4ade80]/30" />
          </motion.div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="p-4 relative z-10">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= 1 ? 'bg-[#4ade80]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ 
              rotate: [0, -5, 5, -5, 0],
              scale: [1, 1.1, 1, 1.1, 1] 
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
            className="text-7xl mb-6"
          >
            💕
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-3">
            What's your orientation?
          </h1>
          <p className="text-white/60 text-lg">
            This helps us show you the right matches
          </p>
        </motion.div>

        {/* Options */}
        <div className="w-full max-w-md space-y-4 mb-8">
          {orientations.map((option, index) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setOrientation(option.value)}
              className={`w-full p-6 rounded-2xl border-2 transition-all ${
                orientation === option.value
                  ? 'bg-[#4ade80]/20 border-[#4ade80] shadow-xl shadow-[#4ade80]/30'
                  : 'bg-white/5 border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Emoji */}
                <div className="text-4xl">
                  {option.emoji}
                </div>
                
                {/* Text */}
                <div className="flex-1 text-left">
                  <div className="text-xl font-bold text-white mb-1">
                    {option.label}
                  </div>
                  <div className="text-sm text-white/60">
                    {option.desc}
                  </div>
                </div>

                {/* Check mark */}
                {orientation === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-[#4ade80] flex items-center justify-center"
                  >
                    <span className="text-[#0d2920] text-xl">✓</span>
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Privacy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/40 text-sm text-center mb-8 max-w-md"
        >
          🔒 Your orientation is private and only used for matching
        </motion.p>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-md"
        >
          <Button
            onClick={handleContinue}
            disabled={!orientation}
            className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-[#0d2920] shadow-xl shadow-[#4ade80]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
