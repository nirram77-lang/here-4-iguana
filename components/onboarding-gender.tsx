"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ChevronLeft, User, Users } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface OnboardingGenderProps {
  onNext: (data: { gender: 'male' | 'female', lookingFor: 'male' | 'female' | 'both' }) => void
  onBack?: () => void  // ✅ NEW: Back button support
  // ✅ NEW: Initial data to preserve selections on back navigation
  initialGender?: 'male' | 'female' | null
  initialLookingFor?: 'male' | 'female' | 'both' | null
}

export default function OnboardingGender({ 
  onNext, 
  onBack,
  initialGender = null,
  initialLookingFor = null 
}: OnboardingGenderProps) {
  const { t, isRTL } = useLanguage()
  
  // ✅ FIX: Use initial values if provided (for back navigation)
  const [myGender, setMyGender] = useState<'male' | 'female' | null>(initialGender)
  const [lookingFor, setLookingFor] = useState<'male' | 'female' | 'both' | null>(initialLookingFor)

  // ✅ NEW: Real viewport height for old Android/iOS
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  const handleContinue = () => {
    if (myGender && lookingFor) {
      onNext({ gender: myGender, lookingFor })
    }
  }

  // ✅ FIX: SVG icons that work on ALL browsers including iOS Safari
  const MaleIcon = ({ selected }: { selected: boolean }) => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={selected ? "#0d2920" : "#4ade80"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5"/>
      <path d="M19 5l-5.4 5.4"/>
      <path d="M15 5h4v4"/>
    </svg>
  )

  const FemaleIcon = ({ selected }: { selected: boolean }) => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={selected ? "#0d2920" : "#ec4899"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5"/>
      <path d="M12 13v8"/>
      <path d="M9 18h6"/>
    </svg>
  )

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-y-auto overflow-x-hidden"
      style={{ 
        minHeight: viewportHeight ? `${viewportHeight}px` : '100vh',
        paddingBottom: '100px'
      }}
    >
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
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

      {/* ✅ NEW: Header with back button */}
      {onBack && (
        <div className="flex items-center p-4 relative z-10">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i === 0 ? 'bg-[#4ade80]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              🦎
            </motion.div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              {t('onboarding.gender.title')}
            </h1>
            <p className="text-[#a8d5ba] text-base">
              {t('onboarding.gender.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <h2 className="text-white font-bold text-lg mb-4">{t('onboarding.gender.iAm')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMyGender('male')}
                className={`
                  h-32 rounded-3xl border-2 transition-all
                  ${myGender === 'male'
                    ? 'bg-[#4ade80] border-[#4ade80] shadow-xl shadow-[#4ade80]/30'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <MaleIcon selected={myGender === 'male'} />
                  <span className={`font-bold text-lg mt-2 ${myGender === 'male' ? 'text-[#0d2920]' : 'text-white'}`}>
                    {t('onboarding.gender.male')}
                  </span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMyGender('female')}
                className={`
                  h-32 rounded-3xl border-2 transition-all
                  ${myGender === 'female'
                    ? 'bg-[#4ade80] border-[#4ade80] shadow-xl shadow-[#4ade80]/30'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <FemaleIcon selected={myGender === 'female'} />
                  <span className={`font-bold text-lg mt-2 ${myGender === 'female' ? 'text-[#0d2920]' : 'text-white'}`}>
                    {t('onboarding.gender.female')}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <h2 className="text-white font-bold text-lg mb-4">{t('onboarding.gender.lookingFor')}</h2>
            <div className="grid grid-cols-1 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLookingFor('male')}
                className={`
                  h-16 rounded-2xl border-2 transition-all flex items-center px-6
                  ${lookingFor === 'male'
                    ? 'bg-[#4ade80] border-[#4ade80]'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={lookingFor === 'male' ? "#0d2920" : "#4ade80"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="14" r="5"/>
                    <path d="M19 5l-5.4 5.4"/>
                    <path d="M15 5h4v4"/>
                  </svg>
                </div>
                <span className={`font-bold text-base ${isRTL ? 'mr-3' : 'ml-3'} ${lookingFor === 'male' ? 'text-[#0d2920]' : 'text-white'}`}>
                  {t('onboarding.gender.men')}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLookingFor('female')}
                className={`
                  h-16 rounded-2xl border-2 transition-all flex items-center px-6
                  ${lookingFor === 'female'
                    ? 'bg-[#4ade80] border-[#4ade80]'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={lookingFor === 'female' ? "#0d2920" : "#ec4899"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M12 13v8"/>
                    <path d="M9 18h6"/>
                  </svg>
                </div>
                <span className={`font-bold text-base ${isRTL ? 'mr-3' : 'ml-3'} ${lookingFor === 'female' ? 'text-[#0d2920]' : 'text-white'}`}>
                  {t('onboarding.gender.women')}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLookingFor('both')}
                className={`
                  h-16 rounded-2xl border-2 transition-all flex items-center px-6
                  ${lookingFor === 'both'
                    ? 'bg-[#4ade80] border-[#4ade80]'
                    : 'bg-[#1a4d3e]/50 border-[#4ade80]/20 hover:border-[#4ade80]/40'
                  }
                `}
              >
                <Users className={`w-7 h-7 ${lookingFor === 'both' ? 'text-[#0d2920]' : 'text-white/70'}`} />
                <span className={`font-bold text-base ${isRTL ? 'mr-4' : 'ml-4'} ${lookingFor === 'both' ? 'text-[#0d2920]' : 'text-white'}`}>
                  {t('onboarding.gender.everyone')}
                </span>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleContinue}
              disabled={!myGender || !lookingFor}
              className="w-full h-14 rounded-full bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.continue')}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
