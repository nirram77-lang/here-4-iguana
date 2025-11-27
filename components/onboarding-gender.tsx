"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface OnboardingGenderProps {
  onNext: (data: { gender: 'male' | 'female', lookingFor: 'male' | 'female' | 'both' }) => void
}

export default function OnboardingGender({ onNext }: OnboardingGenderProps) {
  const [myGender, setMyGender] = useState<'male' | 'female' | null>(null)
  const [lookingFor, setLookingFor] = useState<'male' | 'female' | 'both' | null>(null)

  const handleContinue = () => {
    if (myGender && lookingFor) {
      onNext({ gender: myGender, lookingFor })
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

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i === 0 ? 'bg-[#4ade80]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              🦎
            </motion.div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Tell us about you
            </h1>
            <p className="text-[#a8d5ba] text-base">
              This helps us find your perfect match
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-white font-bold text-lg mb-4">I am a...</h2>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMyGender('male')}
                className={`
                  h-32 rounded-3xl border-2 transition-all
                  ${myGender === 'male'
                    ? 'bg-[#4ade80] border-[#4ade80] shadow-xl shadow-[#4ade80]/30'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-5xl mb-2">♂️</span>
                  <span className={`font-bold text-lg ${myGender === 'male' ? 'text-[#0d2920]' : 'text-white'}`}>
                    Male
                  </span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMyGender('female')}
                className={`
                  h-32 rounded-3xl border-2 transition-all
                  ${myGender === 'female'
                    ? 'bg-[#4ade80] border-[#4ade80] shadow-xl shadow-[#4ade80]/30'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-5xl mb-2">♀️</span>
                  <span className={`font-bold text-lg ${myGender === 'female' ? 'text-[#0d2920]' : 'text-white'}`}>
                    Female
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-white font-bold text-lg mb-4">Looking for...</h2>
            <div className="grid grid-cols-1 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLookingFor('male')}
                className={`
                  h-16 rounded-2xl border-2 transition-all flex items-center px-6
                  ${lookingFor === 'male'
                    ? 'bg-[#4ade80] border-[#4ade80]'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <span className="text-3xl mr-4">♂️</span>
                <span className={`font-bold text-base ${lookingFor === 'male' ? 'text-[#0d2920]' : 'text-white'}`}>
                  Men
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLookingFor('female')}
                className={`
                  h-16 rounded-2xl border-2 transition-all flex items-center px-6
                  ${lookingFor === 'female'
                    ? 'bg-[#4ade80] border-[#4ade80]'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <span className="text-3xl mr-4">♀️</span>
                <span className={`font-bold text-base ${lookingFor === 'female' ? 'text-[#0d2920]' : 'text-white'}`}>
                  Women
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLookingFor('both')}
                className={`
                  h-16 rounded-2xl border-2 transition-all flex items-center px-6
                  ${lookingFor === 'both'
                    ? 'bg-[#4ade80] border-[#4ade80]'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <span className="text-3xl mr-4">👥</span>
                <span className={`font-bold text-base ${lookingFor === 'both' ? 'text-[#0d2920]' : 'text-white'}`}>
                  Everyone
                </span>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleContinue}
              disabled={!myGender || !lookingFor}
              className="w-full h-14 rounded-full bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}