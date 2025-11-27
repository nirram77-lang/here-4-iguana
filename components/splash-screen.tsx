"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
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

      {/* Main content */}
      <div className="text-center relative z-10">
        {/* Animated Iguana */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ 
            duration: 0.8, 
            type: "spring",
            bounce: 0.5 
          }}
          className="mb-8 flex items-center justify-center"
        >
          <motion.div
            animate={{ 
              rotate: [0, -5, 5, -5, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 1,
              ease: "easeInOut"
            }}
            className="text-9xl filter drop-shadow-2xl"
          >
            🦎
          </motion.div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-6 font-serif text-6xl font-bold tracking-tight text-white drop-shadow-lg"
        >
          I4IGUANA
        </motion.h1>

        {/* Tagline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="space-y-2"
        >
          <p className="font-sans text-xl text-[#a8d5ba] font-medium">
            Connecting Singles...
          </p>
          <p className="font-sans text-xl text-[#a8d5ba] font-medium">
            Here 4 Iguana!
          </p>
        </motion.div>
      </div>

      {/* Loading dots animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-20 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-3 w-3 rounded-full bg-[#4ade80]"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}