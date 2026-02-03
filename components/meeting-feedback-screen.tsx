'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Heart, Send, SkipForward, Sparkles, Star } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

/**
 * 🦎 I4IGUANA - Meeting Feedback Screen v2.8.20
 * 
 * HOLLYWOOD EDITION! ✨
 * - Iguana Green luxury theme
 * - Floating RED hearts (Hollywood style!)
 * - Glowing buttons
 * - Confetti effects
 * - Premium feel throughout
 */

interface MeetingFeedbackScreenProps {
  partnerName: string
  partnerPhoto?: string
  onSubmit: (feedback: {
    rating: 'positive' | 'negative'
    feedbackText: string
  }) => void
  onSkip: () => void
}

export default function MeetingFeedbackScreen({
  partnerName,
  partnerPhoto,
  onSubmit,
  onSkip
}: MeetingFeedbackScreenProps) {
  const { t, isRTL } = useLanguage()
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [textFieldFocused, setTextFieldFocused] = useState(false)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  // Viewport height for floating hearts
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  // ✅ v2.8.20: Hollywood red hearts - more visible!
  const [hearts] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 16 + Math.random() * 16,
      duration: 6 + Math.random() * 5,
      delay: Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.15, // 0.15-0.30 opacity
    }))
  )

  // Trigger confetti on positive rating
  useEffect(() => {
    if (rating === 'positive') {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }, [rating])

  const handleSubmit = async () => {
    if (!rating) return
    
    setIsSubmitting(true)
    await onSubmit({
      rating,
      feedbackText: feedbackText.trim() || '.'
    })
    setIsSubmitting(false)
  }

  const canSubmit = rating !== null

  return (
    <div 
      className="flex flex-col items-center justify-center p-6 relative"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        background: 'linear-gradient(160deg, #0a1f1a 0%, #0d2920 30%, #051410 70%, #030b08 100%)'
      }}
    >
      
      {/* 💕 Floating Hearts Background - STATIC to prevent flicker */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hearts.slice(0, 8).map((heart) => (
          <div
            key={`heart-${heart.id}`}
            className="absolute animate-pulse"
            style={{
              left: `${heart.x}%`,
              top: `${20 + heart.id * 10}%`,
              fontSize: heart.size,
              color: `rgba(239, 68, 68, ${heart.opacity})`,
              opacity: heart.opacity,
            }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* ✨ Sparkle Particles - STATIC */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 bg-[#4ade80]/40 rounded-full animate-pulse"
            style={{
              left: `${10 + i * 9}%`,
              top: `${15 + i * 8}%`,
            }}
          />
        ))}
      </div>

      {/* 🎊 Confetti removed - caused flickering */}

      {/* 🌟 Main Glow Effect - STATIC */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: rating === 'positive' 
            ? 'radial-gradient(circle, rgba(74,222,128,0.3) 0%, transparent 70%)'
            : rating === 'negative'
            ? 'radial-gradient(circle, rgba(251,113,133,0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(74,222,128,0.2) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      {/* 📝 Content Card - STATIC to prevent flickering */}
      <div
        className="relative z-10 w-full max-w-sm"
      >
        {/* ✨ Border Glow - STATIC */}
        <div
          className="absolute -inset-[2px] rounded-3xl opacity-60"
          style={{ 
            background: 'linear-gradient(0deg, #4ade80, #22c55e, #15803d, #4ade80)',
            filter: 'blur(8px)' 
          }}
        />
        
        {/* Main Card - Iguana Green Theme! */}
        <div 
          className="relative bg-gradient-to-b from-[#1a4d3e]/95 to-[#0d2920]/98 rounded-3xl p-6 border border-[#4ade80]/20"
          style={{
            boxShadow: '0 0 60px rgba(74,222,128,0.15), 0 20px 40px rgba(0,0,0,0.3)'
          }}
        >
          {/* 💕 Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center gap-3 mb-3">
              <motion.span 
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [-5, 5, -5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-3xl"
              >
                💕
              </motion.span>
              <motion.span 
                animate={{ 
                  scale: [1, 1.4, 1],
                  y: [0, -5, 0]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-3xl"
              >
                🦎
              </motion.span>
              <motion.span 
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [5, -5, 5]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="text-3xl"
              >
                💕
              </motion.span>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-[#4ade80] to-white bg-clip-text text-transparent mb-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('feedback.title')}
            </h1>
            
            {/* Partner Info */}
            <div className="flex items-center justify-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {partnerPhoto && (
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full opacity-50 blur-sm" />
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#4ade80]/70">
                    <img 
                      src={partnerPhoto} 
                      alt={partnerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              )}
              <p className="text-[#86efac] text-lg">
                {t('feedback.meetingWith')} <span className="font-bold text-white">{partnerName}</span>
              </p>
            </div>
          </div>

          {/* 👍👎 Rating Buttons */}
          <div className="flex gap-4 justify-center mb-6">
            {/* ✅ Positive Button - iOS compatible! */}
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onTouchStart={() => setRating('positive')}
              onClick={() => setRating('positive')}
              className="relative flex-1 overflow-hidden"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Glow effect when selected */}
              {rating === 'positive' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'radial-gradient(circle, rgba(74,222,128,0.5) 0%, transparent 70%)',
                    filter: 'blur(10px)'
                  }}
                />
              )}
              
              <div className={`relative py-5 px-6 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 ${
                rating === 'positive'
                  ? 'bg-gradient-to-br from-[#4ade80] via-[#22c55e] to-[#15803d] text-[#0d2920] shadow-xl shadow-[#4ade80]/40 border-2 border-[#86efac]/50'
                  : 'bg-[#0d2920]/50 text-white/60 hover:bg-[#1a4d3e]/50 border border-[#4ade80]/20 hover:border-[#4ade80]/40'
              }`}>
                <div>
                  <ThumbsUp className={`w-10 h-10 ${rating === 'positive' ? 'fill-[#0d2920] drop-shadow-lg' : ''}`} />
                </div>
                <span className="font-bold text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('feedback.great')}</span>
                {rating === 'positive' && (
                  <span className="text-xl">🎉</span>
                )}
              </div>
            </motion.button>

            {/* ❌ Negative Button - iOS compatible! */}
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onTouchStart={() => setRating('negative')}
              onClick={() => setRating('negative')}
              className="relative flex-1 overflow-hidden"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Glow effect when selected */}
              {rating === 'negative' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'radial-gradient(circle, rgba(251,113,133,0.4) 0%, transparent 70%)',
                    filter: 'blur(10px)'
                  }}
                />
              )}
              
              <div className={`relative py-5 px-6 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 ${
                rating === 'negative'
                  ? 'bg-gradient-to-br from-rose-400 via-red-500 to-rose-600 text-white shadow-xl shadow-rose-500/40 border-2 border-rose-300/50'
                  : 'bg-[#0d2920]/50 text-white/60 hover:bg-[#1a4d3e]/50 border border-[#4ade80]/20 hover:border-rose-400/40'
              }`}>
                <div>
                  <ThumbsDown className={`w-10 h-10 ${rating === 'negative' ? 'fill-white drop-shadow-lg' : ''}`} />
                </div>
                <span className="font-bold text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('feedback.notGreat')}</span>
                {rating === 'negative' && (
                  <span className="text-xl">😔</span>
                )}
              </div>
            </motion.button>
          </div>

          {/* 💬 Feedback Text Field */}
          <div className="mb-6">
            <label className="flex items-center justify-center gap-2 text-white/80 text-sm mb-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Sparkles className="w-4 h-4 text-[#4ade80]" />
              {t('feedback.tellUsMore')}
            </label>
            
            {/* Animated Border Text Field */}
            <div className="relative">
              {/* Animated gradient border */}
              <motion.div
                className={`absolute -inset-[2px] rounded-xl transition-opacity duration-300 ${textFieldFocused ? 'opacity-100' : 'opacity-30'}`}
                animate={{
                  background: textFieldFocused ? [
                    'linear-gradient(0deg, #4ade80, #22c55e, #86efac, #4ade80)',
                    'linear-gradient(180deg, #4ade80, #22c55e, #86efac, #4ade80)',
                    'linear-gradient(360deg, #4ade80, #22c55e, #86efac, #4ade80)',
                  ] : 'linear-gradient(0deg, #4ade8030, #4ade8030)'
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value.slice(0, 100))}
                onFocus={() => setTextFieldFocused(true)}
                onBlur={() => setTextFieldFocused(false)}
                placeholder={t('feedback.placeholder')}
                className="relative w-full h-24 px-4 py-3 rounded-xl bg-[#0d2920] text-white placeholder-white/30 focus:outline-none resize-none text-sm border border-[#4ade80]/10"
                style={{
                  boxShadow: textFieldFocused ? '0 0 20px rgba(74,222,128,0.2)' : 'none',
                  direction: isRTL ? 'rtl' : 'ltr',
                  textAlign: isRTL ? 'right' : 'left'
                }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-white/50 text-xs flex items-center gap-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('feedback.fewWords')} 
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  💚
                </motion.span>
              </span>
              <span className={`text-xs font-medium ${
                feedbackText.length >= 90 
                  ? 'text-amber-400' 
                  : feedbackText.length > 0 
                  ? 'text-[#4ade80]' 
                  : 'text-white/40'
              }`}>
                {feedbackText.length}/100
              </span>
            </div>
          </div>

          {/* 🚀 Submit Button - Iguana Green! iOS compatible! */}
          <motion.button
            whileHover={{ scale: canSubmit ? 1.03 : 1, y: canSubmit ? -2 : 0 }}
            whileTap={{ scale: canSubmit ? 0.97 : 1 }}
            onTouchStart={(e) => {
              if (!canSubmit || isSubmitting) return
              e.preventDefault()
              handleSubmit()
            }}
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="relative w-full overflow-hidden"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Animated background */}
            {canSubmit && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                  background: [
                    'linear-gradient(90deg, #4ade80, #22c55e, #4ade80)',
                    'linear-gradient(90deg, #22c55e, #4ade80, #22c55e)',
                    'linear-gradient(90deg, #4ade80, #22c55e, #4ade80)',
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
            
            <div className={`relative py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              canSubmit
                ? 'text-[#0d2920]'
                : 'bg-[#0d2920]/50 text-white/40 cursor-not-allowed border border-[#4ade80]/20'
            }`}>
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-[#0d2920]/30 border-t-[#0d2920] rounded-full"
                  />
                  {t('feedback.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t('feedback.submit')}
                  {canSubmit && <Sparkles className="w-4 h-4" />}
                </>
              )}
            </div>
          </motion.button>

          {/* ⏭️ Skip Button - iOS compatible! */}
          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onTouchStart={(e) => {
              e.preventDefault()
              onSkip()
            }}
            onClick={onSkip}
            className="w-full mt-4 py-2 text-white/40 hover:text-[#4ade80] text-sm flex items-center justify-center gap-2 transition-all group"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <SkipForward className="w-4 h-4 group-hover:text-[#4ade80] transition-colors" />
            <span>{t('feedback.skip')}</span>
          </motion.button>
        </div>

        {/* 🦎 Bottom Message - STATIC */}
        <p
          className="text-center text-white/40 text-xs mt-4 flex items-center justify-center gap-2"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {t('feedback.anonymous')}
          <span>🦎</span>
          <span>💚</span>
        </p>
      </div>
    </div>
  )
}
