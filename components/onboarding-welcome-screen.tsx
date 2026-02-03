"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, Sparkles, Shield, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/LanguageContext"

interface OnboardingWelcomeScreenProps {
  onContinue: () => void
}

export default function OnboardingWelcomeScreen({ onContinue }: OnboardingWelcomeScreenProps) {
  const { t, isRTL } = useLanguage()
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false)

  // ✅ NEW: Real viewport height for old Android/iOS
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  // First show welcome, then guidelines
  if (!showGuidelines) {
    return (
      <div 
        className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]"
        style={{ 
          minHeight: viewportHeight ? `${viewportHeight}px` : '100vh',
          paddingBottom: '40px'
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          
          {/* Animated Hearts - Dating Style */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-8 relative"
          >
            <div className="text-8xl">💚</div>
            <motion.div 
              className="absolute -top-2 -right-4 text-4xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ✨
            </motion.div>
            <motion.div 
              className="absolute -bottom-2 -left-4 text-3xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            >
              💫
            </motion.div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">{t('welcome.title')} 👋</h1>
            <p className="text-xl text-white/80 mb-6">{t('welcome.subtitle')}</p>
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
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            {t('welcome.tagline')}
          </motion.p>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full max-w-md"
          >
            <Button
              onClick={() => setShowGuidelines(true)}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg shadow-[#4ade80]/30"
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              {t('welcome.letsGo')}
              <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} h-5 w-5`} />
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Simple, cute guidelines screen
  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]"
      style={{ 
        minHeight: viewportHeight ? `${viewportHeight}px` : '100vh',
        paddingBottom: '40px'
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        
        {/* Floating hearts animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ 
                x: Math.random() * 300 + 50, 
                y: 600,
                opacity: 0.6
              }}
              animate={{ 
                y: -100,
                opacity: [0.6, 0.8, 0]
              }}
              transition={{ 
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "linear"
              }}
            >
              {['💚', '💛', '🧡', '💜'][i % 4]}
            </motion.div>
          ))}
        </div>

        {/* Header with hearts */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
          </motion.div>
          <span className="text-5xl">💚</span>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white text-center mb-2"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {t('guidelines.title')}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/60 text-center mb-10"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {t('guidelines.subtitle')}
        </motion.p>

        {/* Simple guidelines - cards with emojis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm space-y-4 mb-10"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {/* Be Respectful */}
          <div className={`flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-[#4ade80]/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="text-3xl">🤝</div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-white font-medium">{t('guidelines.beRespectful')}</p>
              <p className="text-white/50 text-sm">{t('guidelines.beRespectfulDesc')}</p>
            </div>
          </div>

          {/* Stay Safe */}
          <div className={`flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-[#4ade80]/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="text-3xl">🛡️</div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-white font-medium">{t('guidelines.staySafe')}</p>
              <p className="text-white/50 text-sm">{t('guidelines.staySafeDesc')}</p>
            </div>
          </div>

          {/* Have Fun */}
          <div className={`flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-[#4ade80]/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="text-3xl">✨</div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-white font-medium">{t('guidelines.haveFun')}</p>
              <p className="text-white/50 text-sm">{t('guidelines.haveFunDesc')}</p>
            </div>
          </div>
        </motion.div>

        {/* Agreement checkbox - simple and cute */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => setAgreedToGuidelines(!agreedToGuidelines)}
          className="flex items-center gap-3 mb-8"
        >
          <div className={`
            w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all
            ${agreedToGuidelines 
              ? 'bg-[#4ade80] border-[#4ade80]' 
              : 'border-white/40 hover:border-[#4ade80]'
            }
          `}>
            {agreedToGuidelines && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Heart className="w-4 h-4 text-[#0d2920] fill-[#0d2920]" />
              </motion.div>
            )}
          </div>
          <span className="text-white/70 text-sm" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('guidelines.agreement')}
          </span>
        </motion.button>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-sm"
        >
          <Button
            onClick={onContinue}
            disabled={!agreedToGuidelines}
            className={`
              w-full h-14 rounded-2xl font-bold text-lg transition-all
              ${agreedToGuidelines 
                ? 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] shadow-lg shadow-[#4ade80]/30' 
                : 'bg-white/10 text-white/40 cursor-not-allowed'
              }
            `}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            {agreedToGuidelines ? (
              <>
                {t('guidelines.createProfile')}
                <Sparkles className={`${isRTL ? 'mr-2' : 'ml-2'} h-5 w-5`} />
              </>
            ) : (
              t('guidelines.tapHeart')
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
