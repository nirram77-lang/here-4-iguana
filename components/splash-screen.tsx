"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface SplashScreenProps {
  onComplete: () => void
  // NEW: Optional props for showing login buttons
  showButtons?: boolean
  onLogin?: () => void
  onSignUp?: () => void
}

export default function SplashScreen({ 
  onComplete, 
  showButtons = false,
  onLogin,
  onSignUp
}: SplashScreenProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // If not showing buttons (loading mode), auto-complete after animation
    if (!showButtons) {
      const timer = setTimeout(() => {
        onComplete()
      }, 800)  // ✅ Reduced from 1500ms - HTML splash already showed
      return () => clearTimeout(timer)
    } else {
      // Show buttons after initial animation
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 500)  // ✅ Reduced from 800ms
      return () => clearTimeout(timer)
    }
  }, [onComplete, showButtons])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden">
      
      {/* Animated stars background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              repeat: Infinity,
              delay: Math.random(),
            }}
          />
        ))}
      </div>

      {/* Main content area - centered */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Iguana with Radar */}
        <div className="relative flex items-center justify-center mb-6">
          
          {/* Radar waves - Left side */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={`left-${i}`}
              className="absolute border-l-2 border-[#4ade80] rounded-l-full"
              style={{
                width: 40 + i * 25,
                height: 80 + i * 50,
                right: '50%',
                marginRight: 60 + i * 10,
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: [0, 0.8, 0],
                x: [20, 0, -10],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Radar waves - Right side */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={`right-${i}`}
              className="absolute border-r-2 border-[#4ade80] rounded-r-full"
              style={{
                width: 40 + i * 25,
                height: 80 + i * 50,
                left: '50%',
                marginLeft: 60 + i * 10,
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: [0, 0.8, 0],
                x: [-20, 0, 10],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Glow effect behind iguana */}
          <motion.div
            className="absolute w-40 h-40 bg-[#4ade80]/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Iguana Image */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.5, 
              type: "spring",
              bounce: 0.4 
            }}
            className="relative z-10"
          >
            <motion.img 
              src="/iguana-radar.jpg" 
              alt="I4IGUANA"
              className="w-64 h-44 object-cover rounded-2xl shadow-2xl shadow-[#4ade80]/40"
              animate={{
                boxShadow: [
                  "0 25px 50px -12px rgba(74, 222, 128, 0.3)",
                  "0 25px 50px -12px rgba(74, 222, 128, 0.5)",
                  "0 25px 50px -12px rgba(74, 222, 128, 0.3)",
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>

        {/* App Name */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-4xl font-bold text-white tracking-wider"
        >
          I4IGUANA
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-3 text-[#4ade80] text-lg font-medium tracking-wide"
        >
          Meet Now
        </motion.p>

        {/* Features - shown when buttons are visible */}
        <AnimatePresence>
          {showButtons && showContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-3"
            >
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-10 w-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                  <span className="text-xl">📍</span>
                </div>
                <p className="text-sm font-medium">10-500m radius matching</p>
              </div>
              
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-10 w-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
                <p className="text-sm font-medium">Instant connections</p>
              </div>
              
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-10 w-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                  <span className="text-xl">🍹</span>
                </div>
                <p className="text-sm font-medium">Meet at your favorite spots</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons Section - only when showButtons is true */}
      <AnimatePresence>
        {showButtons && showContent && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md space-y-4 px-6 pb-12 relative z-10"
          >
            {/* Sign Up Button */}
            <Button
              onClick={onSignUp}
              className="w-full h-16 rounded-full bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-sans text-lg font-bold shadow-2xl shadow-[#4ade80]/30 transition-all hover:scale-105"
            >
              Create Account
            </Button>

            {/* Login Button */}
            <Button
              onClick={onLogin}
              variant="outline"
              className="w-full h-16 rounded-full bg-transparent hover:bg-white/10 border-2 border-white/30 text-white font-sans text-lg font-semibold transition-all hover:scale-105"
            >
              I Already Have an Account
            </Button>

            {/* Terms */}
            <p className="text-center text-sm text-white/50 px-4 pt-2">
              By continuing, you agree to our{' '}
              <a href="/terms" className="underline text-[#4ade80] hover:text-white">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="underline text-[#4ade80] hover:text-white">Privacy Policy</a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator - only when NOT showing buttons */}
      {!showButtons && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-16 flex gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-[#4ade80]"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
