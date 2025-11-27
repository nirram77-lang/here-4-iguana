"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"

interface LoginScreenProps {
  onSuccess?: () => void
  isSignUp?: boolean
}

export default function LoginScreen({ onSuccess, isSignUp = false }: LoginScreenProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { signInWithGoogle } = useAuth()

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError("")
    try {
      console.log('🔐 Starting Google authentication...')
      
      // ✅ Just sign in with Google - that's it!
      // AuthContext will update the user state
      // page.tsx useEffect will handle navigation
      await signInWithGoogle()
      
      console.log('✅ Google authentication successful')
      
      // ✅ Optional: Show success screen for 2 seconds
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (err: any) {
      console.error("❌ Auth error:", err)
      setError(err.message || "Error signing in with Google. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
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

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-6"
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
            className="text-7xl filter drop-shadow-2xl"
          >
            🦎
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10 text-center"
        >
          <h1 className="mb-2 font-serif text-4xl font-bold text-white drop-shadow-lg">
            {isSignUp ? "Create Account" : "Welcome Back!"}
          </h1>
          <p className="text-[#a8d5ba] text-base">
            {isSignUp ? "Sign up to start meeting people" : "Log in to continue"}
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 mb-4 rounded-2xl bg-red-500/20 text-red-300 text-sm text-center border border-red-500/30"
          >
            {error}
          </motion.div>
        )}

        {/* Google Login Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full space-y-4"
        >
          <Button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-16 rounded-full bg-white hover:bg-gray-100 text-gray-800 font-sans text-base font-semibold shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0d2920] px-4 text-white/40">
                Quick & Secure Login
              </span>
            </div>
          </div>
        </motion.div>

        {/* Info text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center space-y-2"
        >
          <p className="text-sm text-[#a8d5ba] px-4">
            {isSignUp 
              ? "By signing up, you agree to our Terms & Privacy Policy" 
              : "We use GPS/WiFi for live matching only"}
          </p>
          <p className="text-sm text-[#4ade80] font-semibold px-4">
            No passwords. Just quick social login! 🚀
          </p>
        </motion.div>
      </div>
    </div>
  )
}
