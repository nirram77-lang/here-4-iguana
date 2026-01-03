"use client"

/**
 * 🦎💚🦎 I4IGUANA - Hollywood Splash Screen
 * 
 * Two iguanas facing each other, their tails forming a HEART shape!
 * Dating app vibes with floating hearts and romantic atmosphere
 */

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface SplashScreenProps {
  onComplete: () => void
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
  const { t, isRTL } = useLanguage()
  const [showContent, setShowContent] = useState(false)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  // Generate floating hearts once
  const [hearts] = useState(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 4,
      size: 12 + Math.random() * 16,
      opacity: 0.1 + Math.random() * 0.2
    }))
  )

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    
    if (!showButtons) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1200)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateViewportHeight)
      }
    } else {
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 600)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateViewportHeight)
      }
    }
  }, [onComplete, showButtons])

  return (
    <div 
      className="flex flex-col items-center justify-center relative overflow-hidden"
      style={{ 
        minHeight: viewportHeight ? `${viewportHeight}px` : '100vh',
        background: 'linear-gradient(160deg, #1a4d3e 0%, #0d2920 40%, #0a1f18 70%, #051410 100%)'
      }}
    >
      
      {/* ✨ Floating Hearts Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="absolute text-red-500"
            style={{
              left: `${heart.x}%`,
              bottom: -50,
              fontSize: heart.size,
              opacity: heart.opacity
            }}
            animate={{
              y: [0, -(viewportHeight || 800) - 100],
              x: [0, Math.sin(heart.id) * 30],
              rotate: [0, 360],
              opacity: [heart.opacity, heart.opacity * 0.5, 0]
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            ❤️
          </motion.div>
        ))}
      </div>

      {/* 🌟 Sparkles/Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#4ade80]/60 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* 💚 Glow Effect Behind Logo */}
      <motion.div
        className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, rgba(236, 72, 153, 0.1) 50%, transparent 70%)',
          filter: 'blur(40px)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        
        {/* 🦎💚🦎 Two Iguanas with Heart Tails */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.6, 
            type: "spring",
            bounce: 0.4 
          }}
          className="relative mb-4"
        >
          {/* The Love Container */}
          <div className="relative flex items-center justify-center">
            
            {/* Left Iguana */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative"
            >
              <motion.span 
                className="text-6xl inline-block"
                style={{ transform: 'scaleX(-1)' }}
                animate={{ 
                  y: [0, -3, 0],
                  rotate: [-5, 0, -5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🦎
              </motion.span>
            </motion.div>

            {/* Heart in the Middle - Made from Tails */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
              className="relative mx-2"
            >
              {/* Big Heart */}
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <Heart 
                  className="h-16 w-16 text-pink-500 fill-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]" 
                />
                
                {/* Inner Glow */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Heart 
                    className="h-10 w-10 text-pink-300 fill-pink-300" 
                  />
                </motion.div>
              </motion.div>
              
              {/* Sparkles around heart */}
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-xs"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
                    opacity: [1, 0],
                    scale: [0.5, 1.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                >
                  ✨
                </motion.span>
              ))}
            </motion.div>

            {/* Right Iguana */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative"
            >
              <motion.span 
                className="text-6xl inline-block"
                animate={{ 
                  y: [0, -3, 0],
                  rotate: [5, 0, 5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                🦎
              </motion.span>
            </motion.div>
          </div>

          {/* Tail Lines connecting to heart - SVG */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 180 40"
            style={{ top: '70%', height: 40 }}
          >
            {/* Left tail curve */}
            <motion.path
              d="M 25 5 Q 50 25, 90 15"
              stroke="url(#tailGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />
            {/* Right tail curve */}
            <motion.path
              d="M 155 5 Q 130 25, 90 15"
              stroke="url(#tailGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />
            <defs>
              <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* App Name with Gradient */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-4xl font-black tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #4ade80 0%, #ffffff 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(74, 222, 128, 0.3)'
          }}
        >
          I4IGUANA
        </motion.h1>

        {/* Tagline with Hearts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-3 flex items-center gap-2"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          <span className="text-pink-400">💕</span>
          <p className="text-[#4ade80] text-lg font-semibold tracking-wide">
            {t('landing.tagline')}
          </p>
          <span className="text-pink-400">💕</span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-2 text-white/50 text-sm"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {t('landing.subtitle')}
        </motion.p>

        {/* Features - shown when buttons are visible - COMPACT */}
        <AnimatePresence>
          {showButtons && showContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="mt-6 space-y-2"
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4ade80]/30 to-pink-500/30 flex items-center justify-center">
                  <span className="text-lg">📍</span>
                </div>
                <p className="text-sm font-medium">{t('landing.feature1')}</p>
              </div>
              
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4ade80]/30 to-pink-500/30 flex items-center justify-center">
                  <span className="text-lg">💕</span>
                </div>
                <p className="text-sm font-medium">{t('landing.feature2')}</p>
              </div>
              
              <div className="flex items-center gap-3 text-white/80">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4ade80]/30 to-pink-500/30 flex items-center justify-center">
                  <span className="text-lg">🦎</span>
                </div>
                <p className="text-sm font-medium">{t('landing.feature3')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section - Login Buttons */}
      <AnimatePresence>
        {showButtons && showContent && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full px-6 space-y-3"
            style={{ 
              direction: isRTL ? 'rtl' : 'ltr',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
            }}
          >
            {/* Primary CTA - Get Started */}
            <Button
              onClick={onLogin}
              className="w-full h-14 rounded-full text-lg font-bold shadow-2xl shadow-[#4ade80]/30"
              style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
                color: '#0d2920'
              }}
            >
              <Heart className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5 fill-current`} />
              {t('landing.findLove')}
            </Button>

            {/* Secondary - Already have account */}
            <p className="text-center text-white/50 text-sm">
              {t('landing.alreadySearching')} 
              <button 
                onClick={onLogin}
                className={`text-[#4ade80] font-semibold ${isRTL ? 'mr-1' : 'ml-1'} hover:underline`}
              >
                {t('landing.signIn')}
              </button>
            </p>
            
            {/* Legal - with clickable links - BIGGER TEXT */}
            <p className="text-center text-white/50 text-sm leading-relaxed" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('landing.terms')}
              <a 
                href={isRTL ? '/he/terms?from=app' : '/terms?from=app'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#4ade80] hover:text-[#4ade80]/80 underline font-medium"
              >
                {t('landing.termsOfService')}
              </a>
              {t('landing.and')}
              <a 
                href={isRTL ? '/he/privacy?from=app' : '/privacy?from=app'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#4ade80] hover:text-[#4ade80]/80 underline font-medium"
              >
                {t('landing.privacyPolicy')}
              </a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator when not showing buttons */}
      {!showButtons && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-12"
        >
          <motion.div
            className="flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#4ade80]"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
