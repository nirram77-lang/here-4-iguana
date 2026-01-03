'use client'

/**
 * 🌍 I4IGUANA Language System
 * 
 * Provides multi-language support throughout the app.
 * Currently supports: English (en), Hebrew (he), Portuguese (pt)
 * 
 * Usage:
 *   const { t, language, setLanguage, isRTL } = useLanguage()
 *   <h1>{t('common.appName')}</h1>
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// Import translation files
import en from '@/locales/en.json'
import he from '@/locales/he.json'
import pt from '@/locales/pt-BR.json'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SupportedLanguage = 'en' | 'he' | 'pt'

export interface LanguageInfo {
  code: SupportedLanguage
  name: string
  nativeName: string
  flag: string
  isRTL: boolean
}

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isRTL: boolean
  languageInfo: LanguageInfo
  availableLanguages: LanguageInfo[]
  hasSelectedLanguage: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    isRTL: false
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    isRTL: true
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    isRTL: false
  }
  // Future languages:
  // { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isRTL: false },
  // { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isRTL: false },
  // { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
]

const translations: Record<SupportedLanguage, typeof en> = {
  en,
  he,
  pt
}

const STORAGE_KEY = 'i4iguana_language'
const LANGUAGE_SELECTED_KEY = 'i4iguana_language_selected'

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect user's preferred language from browser settings
 */
const detectBrowserLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en'
  const langCode = browserLang.split('-')[0].toLowerCase()
  
  // Check if browser language is supported
  const supported = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
  if (supported) {
    console.log(`🌍 Detected browser language: ${supported.name} (${langCode})`)
    return supported.code
  }
  
  // Check for Hebrew variants
  if (browserLang.toLowerCase().includes('he') || browserLang.toLowerCase().includes('iw')) {
    console.log('🌍 Detected Hebrew from browser')
    return 'he'
  }
  
  // Check for Portuguese variants (pt, pt-BR, pt-PT)
  if (browserLang.toLowerCase().includes('pt')) {
    console.log('🌍 Detected Portuguese from browser')
    return 'pt'
  }
  
  console.log(`🌍 Browser language ${browserLang} not supported, defaulting to English`)
  return 'en'
}

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, 'common.appName')
 */
const getNestedValue = (obj: any, path: string): string | undefined => {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === undefined || current === null) return undefined
    current = current[key]
  }
  
  return typeof current === 'string' ? current : undefined
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en')
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize language from localStorage or browser detection
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null
    const hasSelected = localStorage.getItem(LANGUAGE_SELECTED_KEY) === 'true'
    
    if (savedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === savedLanguage)) {
      setLanguageState(savedLanguage)
      setHasSelectedLanguage(hasSelected)
      console.log(`🌍 Loaded saved language: ${savedLanguage}`)
    } else {
      // Auto-detect from browser
      const detectedLang = detectBrowserLanguage()
      setLanguageState(detectedLang)
      setHasSelectedLanguage(false)
    }
    
    setIsInitialized(true)
  }, [])

  // ✅ v2.8.8 FIX: Only set language attribute, NOT direction!
  // Changing document.dir to RTL breaks sliders, navigation, and all UI components.
  // App layout must stay LTR. Text content handles RTL locally where needed.
  useEffect(() => {
    if (!isInitialized) return
    
    // Only set lang attribute for accessibility - DO NOT change dir!
    document.documentElement.lang = language
    console.log(`🌍 Language set to: ${language} (layout stays LTR)`)
  }, [language, isInitialized])

  // Set language and persist
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang)
    setHasSelectedLanguage(true)
    localStorage.setItem(STORAGE_KEY, lang)
    localStorage.setItem(LANGUAGE_SELECTED_KEY, 'true')
    console.log(`🌍 Language changed to: ${lang}`)
  }, [])

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key)
    
    if (!translation) {
      // Fallback to English
      const fallback = getNestedValue(translations.en, key)
      if (!fallback) {
        console.warn(`🌍 Missing translation: ${key}`)
        return key // Return key as fallback
      }
      return fallback
    }
    
    // Replace parameters if provided
    if (params) {
      let result = translation
      Object.entries(params).forEach(([paramKey, value]) => {
        result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value))
      })
      return result
    }
    
    return translation
  }, [language])

  // Get current language info
  const languageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0]
  const isRTL = languageInfo.isRTL

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
    languageInfo,
    availableLanguages: SUPPORTED_LANGUAGES,
    hasSelectedLanguage
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useLanguage() {
  const context = useContext(LanguageContext)
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  
  return context
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { translations }
