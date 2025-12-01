"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface OnboardingHobbiesProps {
  onNext: (data: { hobbies: string[] }) => void
  onBack: () => void
  // ✅ NEW: Initial hobbies to preserve on back navigation
  initialHobbies?: string[]
}

const availableHobbies = [
  "🕺 Dancing", "🎧 DJ", "🍹 Cocktails", "🎵 House Music", 
  "🎶 Techno", "⚡ EDM", "🎤 Live Music", "🎙️ Karaoke",
  "🎱 Pool", "🎯 Darts", "🍷 Wine Tasting", "🍺 Craft Beer",
  "🌆 Rooftop Bars", "🌙 Late Nights", "🎤 Hip Hop", "🎺 Jazz",
  "🎸 Rock", "💃 Salsa", "🕺 Bachata", "🎪 Festivals",
  "✨ VIP Lounges", "⚽ Sports Bars", "🎮 Gaming", "🧠 Trivia Nights",
  "😂 Stand-up Comedy", "🏖️ Beach Bars", "🍕 Food Tours", "🎬 Movies"
]

export default function OnboardingHobbies({ 
  onNext, 
  onBack,
  initialHobbies = []  // ✅ FIX: Default to empty array, use initial if provided
}: OnboardingHobbiesProps) {
  // ✅ FIX: Use initialHobbies to preserve selections on back navigation
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(initialHobbies)

  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby))
    } else if (selectedHobbies.length < 8) {
      setSelectedHobbies([...selectedHobbies, hobby])
    }
  }

  const handleContinue = () => {
    if (selectedHobbies.length >= 3) {
      onNext({ hobbies: selectedHobbies })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden">
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

      <div className="flex-1 flex flex-col items-center p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-6 sticky top-0 bg-gradient-to-b from-[#051410] to-transparent pt-2 pb-4 z-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= 2 ? 'bg-[#4ade80]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              🎯
            </motion.div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Your Interests
            </h1>
            <p className="text-[#a8d5ba] text-base mb-2">
              Choose at least 3, up to 8
            </p>
            <div className="text-[#4ade80] text-xl font-bold">
              {selectedHobbies.length}/8 selected
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-3 justify-center">
              {availableHobbies.map((hobby, index) => (
                <motion.button
                  key={hobby}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleHobby(hobby)}
                  disabled={!selectedHobbies.includes(hobby) && selectedHobbies.length >= 8}
                  className={`
                    px-4 py-3 rounded-full font-sans text-sm font-medium transition-all
                    ${selectedHobbies.includes(hobby)
                      ? 'bg-[#4ade80] text-[#0d2920] border-2 border-[#4ade80] shadow-lg scale-105'
                      : 'bg-[#1a4d3e]/50 text-white/80 border border-[#4ade80]/20 hover:border-[#4ade80]/50'
                    }
                    disabled:opacity-30 disabled:cursor-not-allowed
                  `}
                >
                  {hobby}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <div className="flex gap-3 sticky bottom-0 bg-gradient-to-t from-[#051410] to-transparent pt-4 pb-2">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-14 rounded-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10"
            >
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={selectedHobbies.length < 3}
              className="flex-1 h-14 rounded-full bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold disabled:opacity-50"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
