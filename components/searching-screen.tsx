"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface SearchingScreenProps {
  onComplete: () => void
}

export default function SearchingScreen({ onComplete }: SearchingScreenProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    const timer = setTimeout(() => {
      onComplete()
    }, 3500)

    return () => {
      clearInterval(dotsInterval)
      clearTimeout(timer)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl sm:text-6xl font-serif font-bold text-white mb-4"
        >
          Iguana is searching{dots}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl text-white mb-3 font-serif"
        >
          Finding nearby singles.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-white/80 mb-12 font-serif"
        >
          Get ready for real-time connections!
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md mx-auto"
        >
          <img
            src="/iguana-searching.jpeg"
            alt="Iguana Searching"
            className="w-full h-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-md mx-auto mt-12"
        >
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#4ade80]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.5, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}