"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface NameEntryScreenProps {
  defaultName?: string  // Google name as placeholder
  onContinue: (name: string) => void
}

export default function NameEntryScreen({ 
  defaultName = "",
  onContinue 
}: NameEntryScreenProps) {
  // ✅ v2.8.23: Language support
  const { t, isRTL } = useLanguage()
  
  // ✅ Initialize with defaultName if available
  const [name, setName] = useState(defaultName || "")
  const [error, setError] = useState("")
  const [hasUserEdited, setHasUserEdited] = useState(false)

  // ✅ Update name when defaultName (Google name) becomes available
  // Only if user hasn't manually edited the field
  useEffect(() => {
    // ✅ CRITICAL: Also check localStorage directly as fallback
    const storedGoogleName = typeof window !== 'undefined' ? localStorage.getItem('googleDisplayName') : null
    const nameToUse = defaultName || storedGoogleName || ''
    
    console.log('🔍 NameEntryScreen - defaultName:', defaultName, 'storedGoogleName:', storedGoogleName, 'current name:', name, 'hasUserEdited:', hasUserEdited)
    
    if (nameToUse && !hasUserEdited && !name) {
      console.log('✅ Setting name from Google/localStorage:', nameToUse)
      setName(nameToUse)
    }
  }, [defaultName, hasUserEdited, name])

  const handleContinue = () => {
    // Validation
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      setError("Please enter your name")
      return
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters")
      return
    }

    if (trimmedName.length > 50) {
      setError("Name must be less than 50 characters")
      return
    }

    // Valid name
    onContinue(trimmedName)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setHasUserEdited(true)  // ✅ Mark that user has edited
    setError("")  // Clear error on change
  }

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]"
      style={{ 
        minHeight: '100dvh', 
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        overflowX: 'hidden',
        touchAction: 'pan-y',
        overscrollBehaviorX: 'none'
      }}
    >
      {/* Progress indicator */}
      <div className="p-4">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i === 0 ? 'bg-[#4ade80]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        
        {/* Iguana emoji */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-7xl mb-8"
        >
          🦎
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-white text-center mb-4"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {t('onboarding.name.title')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-center mb-8 max-w-sm"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {t('onboarding.name.subtitle')}
        </motion.p>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm mb-12"
        >
          <Input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={defaultName || t('onboarding.name.placeholder')}
            className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#4ade80] focus:ring-[#4ade80]"
            autoFocus
            maxLength={50}
          />
          
          {/* Character count */}
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${error ? 'text-red-400' : 'text-white/40'}`}>
              {error || t('onboarding.name.notGoogleName')}
            </span>
            <span className="text-sm text-white/40">
              {name.length}/50
            </span>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          <Button
            onClick={handleContinue}
            disabled={!name.trim()}
            className="w-full h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-[#0d2920] shadow-xl shadow-[#4ade80]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.continue')}
            <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} h-6 w-6`} />
          </Button>
        </motion.div>

        {/* Example names */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex gap-2 flex-wrap justify-center max-w-sm"
        >
          {['Alex', 'Sam', 'Jordan', 'Taylor'].map((exampleName) => (
            <button
              key={exampleName}
              onClick={() => handleNameChange(exampleName)}
              className="px-4 py-2 rounded-full bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-colors"
            >
              {exampleName}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
