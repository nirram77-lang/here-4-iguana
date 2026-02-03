"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/LanguageContext"

interface OnboardingHobbiesProps {
  onNext: (data: { hobbies: string[] }) => void
  onBack: () => void
  // ✅ NEW: Initial hobbies to preserve on back navigation
  initialHobbies?: string[]
}

const availableHobbies = [
  "🕺 Dancing", "🎧 DJ", "🍹 Cocktails", "🎵 House Music", 
  "🎶 Techno", "⚡ EDM", "🎤 Live Music", "🎙️ Karaoke",
  "🎱 Pool", "🎯 Darts", "🍷 Wine Tasting", "🍺 Craft Beer",
  "🌆 Rooftop Bars", "🌙 Late Nights", "🎤 Hip Hop", "🎺 Jazz",
  "🎸 Rock", "💃 Salsa", "🕺 Bachata", "🎪 Festivals",
  "✨ VIP Lounges", "⚽ Sports Bars", "🎮 Gaming", "🧠 Trivia Nights",
  "😂 Stand-up Comedy", "🏖️ Beach Bars", "🍕 Food Tours", "🎬 Movies"
]

// ✅ v2.8.25: Hebrew translations for hobbies
const hobbiesHebrew: Record<string, string> = {
  "🕺 Dancing": "🕺 ריקודים",
  "🎧 DJ": "🎧 DJ",
  "🍹 Cocktails": "🍹 קוקטיילים",
  "🎵 House Music": "🎵 האוס",
  "🎶 Techno": "🎶 טכנו",
  "⚡ EDM": "⚡ EDM",
  "🎤 Live Music": "🎤 מוזיקה חיה",
  "🎙️ Karaoke": "🎙️ קריוקי",
  "🎱 Pool": "🎱 ביליארד",
  "🎯 Darts": "🎯 חצים",
  "🍷 Wine Tasting": "🍷 טעימות יין",
  "🍺 Craft Beer": "🍺 בירה בוטיק",
  "🌆 Rooftop Bars": "🌆 בארים על גגות",
  "🌙 Late Nights": "🌙 לילות ארוכים",
  "🎤 Hip Hop": "🎤 היפ הופ",
  "🎺 Jazz": "🎺 ג'אז",
  "🎸 Rock": "🎸 רוק",
  "💃 Salsa": "💃 סלסה",
  "🕺 Bachata": "🕺 בצ'טה",
  "🎪 Festivals": "🎪 פסטיבלים",
  "✨ VIP Lounges": "✨ טרקלינים VIP",
  "⚽ Sports Bars": "⚽ פאבים ספורט",
  "🎮 Gaming": "🎮 גיימינג",
  "🧠 Trivia Nights": "🧠 ערבי טריוויה",
  "😂 Stand-up Comedy": "😂 סטנדאפ",
  "🏖️ Beach Bars": "🏖️ בארים בחוף",
  "🍕 Food Tours": "🍕 סיורי אוכל",
  "🎬 Movies": "🎬 סרטים"
}

// ✅ v2.8.25: Portuguese translations for hobbies
const hobbiesPortuguese: Record<string, string> = {
  "🕺 Dancing": "🕺 Dançar",
  "🎧 DJ": "🎧 DJ",
  "🍹 Cocktails": "🍹 Coquetéis",
  "🎵 House Music": "🎵 House",
  "🎶 Techno": "🎶 Techno",
  "⚡ EDM": "⚡ EDM",
  "🎤 Live Music": "🎤 Música ao Vivo",
  "🎙️ Karaoke": "🎙️ Karaokê",
  "🎱 Pool": "🎱 Sinuca",
  "🎯 Darts": "🎯 Dardos",
  "🍷 Wine Tasting": "🍷 Degustação de Vinhos",
  "🍺 Craft Beer": "🍺 Cerveja Artesanal",
  "🌆 Rooftop Bars": "🌆 Rooftops",
  "🌙 Late Nights": "🌙 Noitadas",
  "🎤 Hip Hop": "🎤 Hip Hop",
  "🎺 Jazz": "🎺 Jazz",
  "🎸 Rock": "🎸 Rock",
  "💃 Salsa": "💃 Salsa",
  "🕺 Bachata": "🕺 Bachata",
  "🎪 Festivals": "🎪 Festivais",
  "✨ VIP Lounges": "✨ Lounges VIP",
  "⚽ Sports Bars": "⚽ Bares de Esportes",
  "🎮 Gaming": "🎮 Games",
  "🧠 Trivia Nights": "🧠 Noites de Trivia",
  "😂 Stand-up Comedy": "😂 Stand-up",
  "🏖️ Beach Bars": "🏖️ Bares na Praia",
  "🍕 Food Tours": "🍕 Tours Gastronômicos",
  "🎬 Movies": "🎬 Cinema"
}

export default function OnboardingHobbies({ 
  onNext, 
  onBack,
  initialHobbies = []  // ✅ FIX: Default to empty array, use initial if provided
}: OnboardingHobbiesProps) {
  const { t, isRTL, language } = useLanguage()
  
  // ✅ FIX: Use initialHobbies to preserve selections on back navigation
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(initialHobbies)

  // ✅ NEW: Real viewport height for old Android/iOS
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby))
    } else if (selectedHobbies.length < 8) {
      setSelectedHobbies([...selectedHobbies, hobby])
    }
  }

  const handleContinue = () => {
    if (selectedHobbies.length >= 3) {
      onNext({ hobbies: selectedHobbies })
    }
  }

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'none',
        paddingBottom: '100px'
      }}
    >
      {/* Static sparkles - no animation to prevent flickering */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${10 + i * 9}%`,
              top: `${5 + i * 9}%`,
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-6 sticky top-0 bg-gradient-to-b from-[#051410] to-transparent pt-2 pb-4 z-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= 2 ? 'bg-[#4ade80]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <div
            className="text-center mb-8"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            {/* Static emoji - no animation */}
            <div className="text-6xl mb-4">
              🎯
            </div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              {t('onboarding.hobbies.title')}
            </h1>
            <p className="text-[#a8d5ba] text-base mb-2">
              {t('onboarding.hobbies.subtitle')}
            </p>
            <div className="text-[#4ade80] text-xl font-bold">
              {t('onboarding.hobbies.selected', { count: selectedHobbies.length })}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {availableHobbies.map((hobby) => (
                <button
                  key={hobby}
                  onClick={() => toggleHobby(hobby)}
                  disabled={!selectedHobbies.includes(hobby) && selectedHobbies.length >= 8}
                  className={`
                    px-4 py-3 rounded-full font-sans text-sm font-medium transition-colors duration-150
                    ${selectedHobbies.includes(hobby)
                      ? 'bg-[#4ade80] text-[#0d2920] border-2 border-[#4ade80] shadow-lg'
                      : 'bg-[#1a4d3e]/50 text-white/80 border border-[#4ade80]/20'
                    }
                    disabled:opacity-30 disabled:cursor-not-allowed
                    active:scale-95
                  `}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {language === 'he' ? (hobbiesHebrew[hobby] || hobby) : 
                   language === 'pt' ? (hobbiesPortuguese[hobby] || hobby) : hobby}
                </button>
              ))}
            </div>
          </div>

          {/* Spacer to ensure content doesn't hide behind fixed buttons */}
          <div className="h-24"></div>
        </div>
      </div>
      
      {/* Fixed bottom buttons - solid background */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-4"
        style={{ 
          background: 'linear-gradient(to top, #051410 70%, transparent)',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
        }}
      >
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 h-14 rounded-full bg-[#1a4d3e] border-2 border-white/30 text-white hover:bg-[#245a4a]"
          >
            {t('onboarding.back')}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedHobbies.length < 3}
            className="flex-1 h-14 rounded-full bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold disabled:opacity-50"
          >
            {t('common.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
