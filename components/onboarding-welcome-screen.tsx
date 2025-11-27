"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface OnboardingWelcomeScreenProps {
  onContinue: () => void
}

export default function OnboardingWelcomeScreen({ onContinue }: OnboardingWelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        
        {/* Animated Iguana */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1 
          }}
          className="mb-8"
        >
          <div className="text-9xl">
            🦎
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome! 👋
          </h1>
          <p className="text-xl text-white/80 mb-6">
            Good to see you and nice that you joined
          </p>
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
          Let's create your profile so you can start meeting amazing people nearby! 💚
        </motion.p>

        {/* Animated dots */}
        <motion.div 
          className="flex gap-2 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-[#4ade80]"
              animate={{
                y: [-5, 5, -5],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="w-full max-w-sm"
        >
          <Button
            onClick={onContinue}
            className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-[#0d2920] shadow-xl shadow-[#4ade80]/30 transition-all"
          >
            Get Started
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-white/40 text-sm text-center"
        >
          Ready to meet your match? 🦎💚
        </motion.p>
      </div>
    </div>
  )
}
