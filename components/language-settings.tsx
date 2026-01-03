'use client'

/**
 * 🌍 Language Settings Component v2.8.8
 * 
 * Used in Profile/Settings screen to change language.
 * Displays current language with option to change.
 * Shows restart message after language change.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage, SupportedLanguage } from '@/lib/LanguageContext'
import { Globe, Check, ChevronRight, X, RefreshCw } from 'lucide-react'

interface LanguageSettingsProps {
  variant?: 'button' | 'inline'
}

export default function LanguageSettings({ variant = 'button' }: LanguageSettingsProps) {
  const { language, setLanguage, languageInfo, availableLanguages, t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [showRestartMessage, setShowRestartMessage] = useState(false)
  const [newLanguage, setNewLanguage] = useState<SupportedLanguage | null>(null)

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    if (lang !== language) {
      setLanguage(lang)
      setNewLanguage(lang)
      setShowRestartMessage(true)
      // Don't close modal immediately - show restart message
    } else {
      setShowModal(false)
    }
  }

  const handleRestart = () => {
    // Force reload the app
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowRestartMessage(false)
    setShowModal(false)
  }

  if (variant === 'inline') {
    // Simple inline selector
    return (
      <div className="flex items-center gap-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`
              px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300
              ${language === lang.code 
                ? 'bg-[#4ade80] text-[#0d2920]' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
              }
            `}
          >
            {lang.flag} {lang.nativeName}
          </button>
        ))}
      </div>
    )
  }

  // Button variant (for settings menu)
  return (
    <>
      {/* Settings Row Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#4ade80]" />
          </div>
          <div className="text-left">
            <div className="text-white font-medium">
              {language === 'he' ? 'שפה' : 'Language'}
            </div>
            <div className="text-white/50 text-sm">
              {languageInfo.flag} {languageInfo.nativeName}
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40" />
      </button>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gradient-to-br from-[#0d2920] to-[#051410] rounded-t-3xl sm:rounded-3xl border border-[#4ade80]/30 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative p-6 border-b border-white/10">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-[#4ade80]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Choose Language
                    </h3>
                    <p className="text-white/50 text-sm">
                      Select your preferred language
                    </p>
                  </div>
                </div>
              </div>

              {/* Language Options */}
              <div className="p-4 space-y-2">
                {!showRestartMessage ? (
                  // Language selection
                  availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`
                        w-full p-4 rounded-xl border-2 transition-all duration-300
                        flex items-center gap-4
                        ${language === lang.code 
                          ? 'bg-[#4ade80]/20 border-[#4ade80]' 
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                        }
                      `}
                    >
                      {/* Flag */}
                      <div className="text-3xl">{lang.flag}</div>
                      
                      {/* Text */}
                      <div className="flex-1 text-left">
                        <div className={`font-bold ${language === lang.code ? 'text-[#4ade80]' : 'text-white'}`}>
                          {lang.nativeName}
                        </div>
                        <div className="text-white/50 text-sm">
                          {lang.name}
                        </div>
                      </div>
                      
                      {/* Checkmark */}
                      {language === lang.code && (
                        <div className="w-8 h-8 rounded-full bg-[#4ade80] flex items-center justify-center">
                          <Check className="w-5 h-5 text-[#0d2920]" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  // Restart message
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4ade80]/20 flex items-center justify-center"
                    >
                      <RefreshCw className="w-8 h-8 text-[#4ade80]" />
                    </motion.div>
                    
                    <h4 className="text-xl font-bold text-white mb-2">
                      {newLanguage === 'he' ? '! השפה שונתה' : 'Language Changed!'}
                    </h4>
                    <p className="text-white/60 mb-6">
                      {newLanguage === 'he' 
                        ? 'יש לרענן את האפליקציה כדי להחיל את השינויים'
                        : 'Refresh the app to apply changes'}
                    </p>
                    
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRestart}
                        className="w-full py-4 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-bold rounded-xl"
                      >
                        <RefreshCw className="w-5 h-5 inline mr-2" />
                        {newLanguage === 'he' ? 'רענן עכשיו' : 'Refresh Now'}
                      </motion.button>
                      
                      <button
                        onClick={handleDismiss}
                        className="w-full py-3 text-white/50 hover:text-white/80 transition-colors"
                      >
                        {newLanguage === 'he' ? 'אחר כך' : 'Maybe Later'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer hint */}
              {!showRestartMessage && (
                <div className="p-4 pt-0">
                  <p className="text-center text-white/30 text-xs">
                    🌍 More languages coming soon!
                  </p>
                </div>
              )}

              {/* Safe area for iOS */}
              <div className="h-6 sm:h-0" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
