'use client'

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Printer, Globe } from 'lucide-react'

/**
 * 🦎 I4IGUANA - Marketing Sticker Generator
 * 15x15cm (566x566px at 96dpi, or use CSS cm)
 * 
 * 4 Versions:
 * 1. Dark + Hebrew
 * 2. Dark + English
 * 3. Light + Hebrew
 * 4. Light + English
 */

interface MarketingStickerProps {
  theme: 'dark' | 'light'
  language: 'he' | 'en'
  showQR?: boolean
}

// Content translations
const content = {
  he: {
    tagline: 'באת לבד? תצא בזוג',
    timer: '10 דקות להחליט!',
    matchMeaning: 'Match = מפגש אמיתי',
    stat1: 'מרחק 0',
    stat2: 'היא מחליטה',
    stat3: '100% בטוח',
    slogan: 'Not chat. Connection.',
    cta: 'סרקו והתחברו',
  },
  en: {
    tagline: 'Came alone? Leave together',
    timer: '10 minutes to decide!',
    matchMeaning: 'Match = Real Meeting',
    stat1: 'Distance 0',
    stat2: 'She Decides',
    stat3: '100% Safe',
    slogan: 'Not chat. Connection.',
    cta: 'Scan & Connect',
  }
}

// Single Sticker Component
function MarketingSticker({ theme, language, showQR = true }: MarketingStickerProps) {
  const t = content[language]
  const isDark = theme === 'dark'
  const isHebrew = language === 'he'
  
  // Colors based on theme
  const colors = isDark ? {
    bg: 'linear-gradient(145deg, #0a1f18 0%, #0d2920 50%, #051410 100%)',
    primary: '#4ade80',
    secondary: '#22c55e',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.7)',
    accent: '#ec4899',
    border: 'rgba(74, 222, 128, 0.3)',
  } : {
    bg: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)',
    primary: '#166534',
    secondary: '#15803d',
    text: '#0f172a',
    textMuted: 'rgba(15,23,42,0.7)',
    accent: '#ec4899',
    border: 'rgba(22, 163, 74, 0.3)',
  }

  return (
    <div 
      className="relative overflow-hidden"
      style={{ 
        width: '15cm',
        height: '15cm',
        background: colors.bg,
        borderRadius: '16px',
        border: `3px solid ${colors.border}`,
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        direction: isHebrew ? 'rtl' : 'ltr',
      }}
    >
      {/* Background Pattern - Subtle dots */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(${colors.primary} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between p-6">
        
        {/* TOP: Tagline with heart */}
        <div className="text-center">
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
            style={{ 
              background: isDark 
                ? 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(74,222,128,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(22,163,74,0.1) 100%)',
              border: `1px solid ${colors.accent}40`,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>💕</span>
            <span 
              className="font-bold"
              style={{ 
                fontSize: '1.3rem',
                color: colors.text,
              }}
            >
              {t.tagline}
            </span>
            <span style={{ fontSize: '1.1rem' }}>💕</span>
          </div>
        </div>

        {/* MIDDLE: Icons Flow */}
        <div className="flex items-center justify-center gap-3" style={{ direction: 'ltr' }}>
          <span style={{ fontSize: '2rem' }}>🥂</span>
          <span style={{ color: colors.primary, fontSize: '1.2rem' }}>→</span>
          <span style={{ fontSize: '2rem' }}>💕</span>
          <span style={{ color: colors.primary, fontSize: '1.2rem' }}>→</span>
          <span style={{ fontSize: '2rem' }}>👟</span>
          <span style={{ color: colors.primary, fontSize: '1.2rem' }}>→</span>
          <span style={{ fontSize: '2rem' }}>📅</span>
        </div>

        {/* Timer Section */}
        <div className="text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>⏱️</div>
          <div 
            className="font-black"
            style={{ 
              fontSize: '1.8rem',
              background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t.timer}
          </div>
          <div 
            style={{ 
              fontSize: '1rem',
              color: colors.textMuted,
              marginTop: '4px',
            }}
          >
            {t.matchMeaning}
          </div>
        </div>

        {/* Stats Row */}
        <div 
          className="flex items-center justify-center gap-6"
          style={{ direction: isHebrew ? 'rtl' : 'ltr' }}
        >
          {/* Stat 1 */}
          <div className="text-center">
            <div style={{ fontSize: '1.5rem', marginBottom: '2px' }}>📍</div>
            <div style={{ fontSize: '0.85rem', color: colors.text, fontWeight: 600 }}>{t.stat1}</div>
          </div>
          
          {/* Stat 2 */}
          <div className="text-center">
            <div style={{ fontSize: '1.5rem', marginBottom: '2px' }}>🎯</div>
            <div style={{ fontSize: '0.85rem', color: colors.text, fontWeight: 600 }}>{t.stat2}</div>
          </div>
          
          {/* Stat 3 */}
          <div className="text-center">
            <div style={{ fontSize: '1.5rem', marginBottom: '2px' }}>🔒</div>
            <div style={{ fontSize: '0.85rem', color: colors.text, fontWeight: 600 }}>{t.stat3}</div>
          </div>
        </div>

        {/* Slogan */}
        <div 
          className="font-semibold flex items-center gap-2"
          style={{ 
            fontSize: '1.1rem',
            color: colors.primary,
            direction: 'ltr',
          }}
        >
          <span style={{ color: colors.accent }}>💚</span>
          {t.slogan}
        </div>

        {/* QR Code Section */}
        {showQR && (
          <div className="text-center">
            <div 
              className="inline-block p-2 rounded-xl"
              style={{ 
                background: '#ffffff',
                boxShadow: isDark 
                  ? '0 4px 20px rgba(74,222,128,0.2)'
                  : '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              <QRCodeSVG 
                value="https://i4iguana.com"
                size={80}
                level="M"
                fgColor="#0d2920"
                bgColor="#ffffff"
              />
            </div>
            <div 
              style={{ 
                fontSize: '0.75rem',
                color: colors.textMuted,
                marginTop: '4px',
              }}
            >
              {t.cta}
            </div>
          </div>
        )}

        {/* BOTTOM: Logo & Branding */}
        <div className="flex items-center justify-center gap-3">
          <span style={{ fontSize: '1.5rem' }}>🦎</span>
          <span 
            className="font-black tracking-wide"
            style={{ 
              fontSize: '1.3rem',
              color: colors.primary,
            }}
          >
            I4IGUANA
          </span>
          <span style={{ fontSize: '1.5rem' }}>🦎</span>
        </div>
        
        {/* Website */}
        <div 
          style={{ 
            fontSize: '0.7rem',
            color: colors.textMuted,
            letterSpacing: '1px',
          }}
        >
          www.i4iguana.com
        </div>
      </div>
    </div>
  )
}

// Main Generator Component
export default function MarketingStickerGenerator() {
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark')
  const [selectedLanguage, setSelectedLanguage] = useState<'he' | 'en'>('he')
  const [showAllVersions, setShowAllVersions] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 print:bg-white print:p-0">
      {/* Controls */}
      <div className="max-w-md mx-auto mb-8 space-y-4 print:hidden">
        <h1 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
          🦎 Marketing Sticker 15x15cm
        </h1>
        
        {/* Theme Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTheme('dark')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              selectedTheme === 'dark' 
                ? 'bg-gray-800 text-white border-2 border-green-500' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            🌙 Dark
          </button>
          <button
            onClick={() => setSelectedTheme('light')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              selectedTheme === 'light' 
                ? 'bg-white text-gray-800 border-2 border-green-500' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            ☀️ Light
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLanguage('he')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              selectedLanguage === 'he' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            🇮🇱 עברית
          </button>
          <button
            onClick={() => setSelectedLanguage('en')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              selectedLanguage === 'en' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            🇺🇸 English
          </button>
        </div>

        {/* Show All Versions Toggle */}
        <button
          onClick={() => setShowAllVersions(!showAllVersions)}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
        >
          {showAllVersions ? '📄 Show Single' : '📋 Show All 4 Versions'}
        </button>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print / Save as PDF
        </button>

        {/* Size Info */}
        <div className="text-center text-gray-400 text-sm">
          📐 Size: 15 × 15 cm (ideal for wall stickers)
        </div>
      </div>

      {/* Sticker Preview */}
      {showAllVersions ? (
        // All 4 versions grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto print:grid-cols-2 print:gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-white font-bold print:text-black">🌙 Dark + עברית</span>
            <MarketingSticker theme="dark" language="he" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-white font-bold print:text-black">🌙 Dark + English</span>
            <MarketingSticker theme="dark" language="en" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-white font-bold print:text-black">☀️ Light + עברית</span>
            <MarketingSticker theme="light" language="he" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-white font-bold print:text-black">☀️ Light + English</span>
            <MarketingSticker theme="light" language="en" />
          </div>
        </div>
      ) : (
        // Single selected version
        <div className="flex justify-center">
          <MarketingSticker theme={selectedTheme} language={selectedLanguage} />
        </div>
      )}
    </div>
  )
}
