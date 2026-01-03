'use client'

/**
 * 🌍 I4IGUANA - Language Selection Screen
 * 
 * Beautiful, Hollywood-style language picker that appears on first launch.
 * Features: Animated hearts, smooth transitions, flag icons
 * 
 * Supports: English, Hebrew, Portuguese (Brazil)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage, SupportedLanguage, LanguageInfo } from '@/lib/LanguageContext'
import { Check, Globe } from 'lucide-react'

interface LanguageSelectionScreenProps {
  onComplete: () => void
}

export default function LanguageSelectionScreen({ onComplete }: LanguageSelectionScreenProps) {
  const { language, setLanguage, availableLanguages, t } = useLanguage()
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(language)
  const [mounted, setMounted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setSelectedLang(lang)
    // Preview the language immediately
    setLanguage(lang)
  }

  const handleContinue = () => {
    setIsTransitioning(true)
    setLanguage(selectedLang)
    
    // Small delay for nice transition
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  // Get transition message based on language
  const getTransitionMessage = () => {
    switch (selectedLang) {
      case 'he':
        return '!יאללה'
      case 'pt':
        return 'Vamos Lá!'
      default:
        return "Let's Go!"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f1a] via-[#0d2920] to-[#051410] text-white overflow-hidden relative">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ANIMATED BACKGROUND */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating hearts */}
        {mounted && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-pink-400/30"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50
            }}
            animate={{ 
              y: -50,
              x: `calc(${Math.random() * 100}vw)`
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          >
            <span className="text-xl" style={{ fontSize: `${12 + Math.random() * 16}px` }}>
              {['💕', '💖', '✨', '💚', '💗'][Math.floor(Math.random() * 5)]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isTransitioning && (
          <motion.div 
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <span className="text-6xl">🦎</span>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl sm:text-4xl font-black mb-2">
                <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
                  I4IGUANA
                </span>
              </h1>
              
              {/* Globe icon with text */}
              <div className="flex items-center justify-center gap-2 text-white/60 mb-4">
                <Globe className="w-5 h-5 text-green-400" />
                <span className="text-base" style={{ direction: selectedLang === 'he' ? 'rtl' : 'ltr' }}>{t('languageSelection.chooseLanguage')}</span>
              </div>
              
              <p className="text-white/50 text-sm" style={{ direction: selectedLang === 'he' ? 'rtl' : 'ltr' }}>
                {t('languageSelection.selectLanguage')}
              </p>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* LANGUAGE OPTIONS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-sm space-y-3 mb-10"
            >
              {availableLanguages.map((langInfo, index) => (
                <LanguageOption
                  key={langInfo.code}
                  langInfo={langInfo}
                  isSelected={selectedLang === langInfo.code}
                  onSelect={() => handleSelectLanguage(langInfo.code)}
                  index={index}
                />
              ))}
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CONTINUE BUTTON */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="w-full max-w-sm"
            >
              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] hover:shadow-[#4ade80]/30 hover:shadow-xl active:scale-[0.98]"
              >
                {t('languageSelection.continue')} →
              </button>
            </motion.div>

            {/* Footer hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-white/30 text-xs mt-8 text-center"
              style={{ direction: selectedLang === 'he' ? 'rtl' : 'ltr' }}
            >
              💡 {t('languageSelection.canChange')}
            </motion.p>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TRANSITION ANIMATION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#0a1f1a] to-[#051410]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="text-7xl mb-4 animate-bounce">🦎</div>
              <div className="text-2xl font-bold text-green-400">
                {getTransitionMessage()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float-heart {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE OPTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LanguageOptionProps {
  langInfo: LanguageInfo
  isSelected: boolean
  onSelect: () => void
  index: number
}

function LanguageOption({ langInfo, isSelected, onSelect, index }: LanguageOptionProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: langInfo.isRTL ? 30 : -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
      onClick={onSelect}
      className={`
        w-full p-4 rounded-2xl border-2 transition-all duration-300
        flex items-center gap-4
        ${isSelected 
          ? 'bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/20 border-[#4ade80] shadow-lg shadow-[#4ade80]/20' 
          : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
        }
      `}
      style={{ direction: 'ltr' }} // Always LTR for consistent layout
    >
      {/* Flag */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center text-3xl
        ${isSelected ? 'bg-[#4ade80]/20' : 'bg-white/10'}
        transition-all duration-300
      `}>
        {langInfo.flag}
      </div>
      
      {/* Text */}
      <div className="flex-1 text-left">
        <div className={`font-bold text-lg ${isSelected ? 'text-[#4ade80]' : 'text-white'}`}>
          {langInfo.nativeName}
        </div>
        <div className="text-white/50 text-sm">
          {langInfo.name}
        </div>
      </div>
      
      {/* Checkmark */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
        ${isSelected 
          ? 'bg-[#4ade80] text-[#0d2920] scale-100' 
          : 'bg-white/10 text-white/30 scale-90'
        }
      `}>
        {isSelected ? (
          <Check className="w-5 h-5" strokeWidth={3} />
        ) : (
          <div className="w-3 h-3 rounded-full bg-white/20" />
        )}
      </div>
    </motion.button>
  )
}
