"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Mail, Phone } from "lucide-react"

interface WelcomeScreenProps {
  onLogin: () => void
  onSignUp: () => void
}

export default function WelcomeScreen({ onLogin, onSignUp }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 relative z-10">
        {/* Top Section - Logo & Title */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
          {/* Animated Iguana */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ 
              duration: 0.8, 
              type: "spring",
              bounce: 0.5 
            }}
            className="mb-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, -8, 8, -8, 0],
              }}
              transition={{ 
                duration: 2.5, 
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
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="mb-4 font-serif text-6xl font-bold tracking-tight text-white drop-shadow-lg">
              I4IGUANA
            </h1>
            
            <div className="space-y-2 mb-8">
              <p className="font-sans text-xl text-[#4ade80] font-semibold">
                Real-Time Dating
              </p>
              <p className="font-sans text-lg text-[#a8d5ba]">
                Meet singles nearby, right now!
              </p>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mt-8"
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
        </div>

        {/* Bottom Section - Buttons */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-md space-y-4 pb-8"
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
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
          
          {/* ✅ Contact Info - Hollywood Style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="pt-4 border-t border-white/10 text-center"
          >
            <p className="text-sm text-[#4ade80] font-semibold mb-3">
              To join the application, contact us:
            </p>
            <div className="flex flex-col items-center gap-2">
              <a 
                href="mailto:nir.ram77@gmail.com"
                className="flex items-center gap-2 text-base text-white hover:text-[#4ade80] transition-colors font-medium"
              >
                <Mail className="h-5 w-5 text-[#4ade80]" />
                nir.ram77@gmail.com
              </a>
              <a 
                href="tel:+972522653170"
                className="flex items-center gap-2 text-base text-white hover:text-[#4ade80] transition-colors font-medium"
              >
                <Phone className="h-5 w-5 text-[#4ade80]" />
                +972-52-265-3170
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}