"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Accessibility,
  X,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Link2,
  MousePointer2,
  Type,
  RotateCcw,
  Pause,
  Play,
  FileText,
  Eye
} from 'lucide-react'

interface AccessibilitySettings {
  fontSize: number // 100 = normal, 125 = large, 150 = extra large
  highContrast: boolean
  highlightLinks: boolean
  bigCursor: boolean
  pauseAnimations: boolean
  readableFont: boolean
  textSpacing: boolean
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  highlightLinks: false,
  bigCursor: false,
  pauseAnimations: false,
  readableFont: false,
  textSpacing: false
}

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [showStatement, setShowStatement] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Hide on screens smaller than 768px
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('i4iguana_accessibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
        applySettings(parsed)
      } catch (e) {
        console.error('Error loading accessibility settings:', e)
      }
    }
  }, [])

  // Don't render on mobile
  if (isMobile) {
    return null
  }

  // Apply settings to document
  const applySettings = (s: AccessibilitySettings) => {
    const root = document.documentElement
    const body = document.body

    // Font size
    root.style.fontSize = `${s.fontSize}%`

    // High contrast
    if (s.highContrast) {
      body.classList.add('high-contrast')
    } else {
      body.classList.remove('high-contrast')
    }

    // Highlight links
    if (s.highlightLinks) {
      body.classList.add('highlight-links')
    } else {
      body.classList.remove('highlight-links')
    }

    // Big cursor
    if (s.bigCursor) {
      body.classList.add('big-cursor')
    } else {
      body.classList.remove('big-cursor')
    }

    // Pause animations
    if (s.pauseAnimations) {
      body.classList.add('pause-animations')
    } else {
      body.classList.remove('pause-animations')
    }

    // Readable font
    if (s.readableFont) {
      body.classList.add('readable-font')
    } else {
      body.classList.remove('readable-font')
    }

    // Text spacing
    if (s.textSpacing) {
      body.classList.add('text-spacing')
    } else {
      body.classList.remove('text-spacing')
    }
  }

  // Save and apply settings
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('i4iguana_accessibility', JSON.stringify(updated))
    applySettings(updated)
  }

  // Reset all settings
  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('i4iguana_accessibility')
    applySettings(defaultSettings)
  }

  // Increase font size
  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      updateSettings({ fontSize: settings.fontSize + 10 })
    }
  }

  // Decrease font size
  const decreaseFontSize = () => {
    if (settings.fontSize > 80) {
      updateSettings({ fontSize: settings.fontSize - 10 })
    }
  }

  return (
    <>
      {/* Accessibility Styles - injected globally */}
      <style jsx global>{`
        /* High Contrast Mode */
        body.high-contrast {
          filter: contrast(1.4) !important;
        }
        body.high-contrast * {
          border-color: #ffffff !important;
        }

        /* Highlight Links */
        body.highlight-links a,
        body.highlight-links button {
          outline: 3px solid #ffff00 !important;
          outline-offset: 2px !important;
          background-color: rgba(255, 255, 0, 0.2) !important;
        }

        /* Big Cursor */
        body.big-cursor,
        body.big-cursor * {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='%23000' stroke='%23fff' stroke-width='1'%3E%3Cpath d='M4 4l7 19 2.5-6.5L20 14z'/%3E%3C/svg%3E") 4 4, auto !important;
        }

        /* Pause Animations */
        body.pause-animations *,
        body.pause-animations *::before,
        body.pause-animations *::after {
          animation-play-state: paused !important;
          transition: none !important;
        }

        /* Readable Font */
        body.readable-font * {
          font-family: Arial, Helvetica, sans-serif !important;
          letter-spacing: 0.05em !important;
        }

        /* Text Spacing */
        body.text-spacing * {
          line-height: 1.8 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }

        /* Accessibility button animation */
        @keyframes a11y-pulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(34, 139, 34, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3); }
          50% { box-shadow: 0 6px 25px rgba(34, 139, 34, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4); }
        }
      `}</style>

      {/* Floating Accessibility Button - Bottle Green Hollywood Style */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-[9999] w-12 h-12 rounded-full flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(145deg, #1a5c45 0%, #228B22 50%, #2e8b57 100%)',
          border: '2px solid rgba(34, 139, 34, 0.6)',
          boxShadow: '0 4px 15px rgba(34, 139, 34, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          animation: 'a11y-pulse 2s infinite'
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '0 6px 25px rgba(34, 139, 34, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        }}
        whileTap={{ scale: 0.95 }}
        aria-label="פתח תפריט נגישות"
        title="נגישות"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6">
          <circle cx="12" cy="4" r="2"/>
          <path d="M12 6v4m0 0l-4 8m4-8l4 8M6 12h12"/>
        </svg>
      </motion.button>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] z-[10000] shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#4ade80] to-[#22c55e] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Accessibility className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">נגישות</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="סגור תפריט נגישות"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Font Size */}
                <div className="bg-white/10 rounded-xl p-4">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    גודל טקסט
                  </h3>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={decreaseFontSize}
                      disabled={settings.fontSize <= 80}
                      className="p-3 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 transition-colors"
                      aria-label="הקטן טקסט"
                    >
                      <ZoomOut className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-white font-bold text-lg">
                      {settings.fontSize}%
                    </span>
                    <button
                      onClick={increaseFontSize}
                      disabled={settings.fontSize >= 150}
                      className="p-3 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 transition-colors"
                      aria-label="הגדל טקסט"
                    >
                      <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-2">
                  {/* High Contrast */}
                  <button
                    onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      settings.highContrast 
                        ? 'bg-[#4ade80]/30 border-2 border-[#4ade80]' 
                        : 'bg-white/10 border-2 border-transparent hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">ניגודיות גבוהה</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.highContrast ? 'bg-[#4ade80]' : 'bg-white/30'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${
                        settings.highContrast ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Highlight Links */}
                  <button
                    onClick={() => updateSettings({ highlightLinks: !settings.highlightLinks })}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      settings.highlightLinks 
                        ? 'bg-[#4ade80]/30 border-2 border-[#4ade80]' 
                        : 'bg-white/10 border-2 border-transparent hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Link2 className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">הדגשת קישורים</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.highlightLinks ? 'bg-[#4ade80]' : 'bg-white/30'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${
                        settings.highlightLinks ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Big Cursor */}
                  <button
                    onClick={() => updateSettings({ bigCursor: !settings.bigCursor })}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      settings.bigCursor 
                        ? 'bg-[#4ade80]/30 border-2 border-[#4ade80]' 
                        : 'bg-white/10 border-2 border-transparent hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MousePointer2 className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">סמן גדול</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.bigCursor ? 'bg-[#4ade80]' : 'bg-white/30'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${
                        settings.bigCursor ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Pause Animations */}
                  <button
                    onClick={() => updateSettings({ pauseAnimations: !settings.pauseAnimations })}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      settings.pauseAnimations 
                        ? 'bg-[#4ade80]/30 border-2 border-[#4ade80]' 
                        : 'bg-white/10 border-2 border-transparent hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {settings.pauseAnimations ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                      <span className="text-white font-medium">עצירת אנימציות</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.pauseAnimations ? 'bg-[#4ade80]' : 'bg-white/30'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${
                        settings.pauseAnimations ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Readable Font */}
                  <button
                    onClick={() => updateSettings({ readableFont: !settings.readableFont })}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      settings.readableFont 
                        ? 'bg-[#4ade80]/30 border-2 border-[#4ade80]' 
                        : 'bg-white/10 border-2 border-transparent hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">גופן קריא</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.readableFont ? 'bg-[#4ade80]' : 'bg-white/30'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${
                        settings.readableFont ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Text Spacing */}
                  <button
                    onClick={() => updateSettings({ textSpacing: !settings.textSpacing })}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      settings.textSpacing 
                        ? 'bg-[#4ade80]/30 border-2 border-[#4ade80]' 
                        : 'bg-white/10 border-2 border-transparent hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Type className="w-5 h-5 text-white" />
                      <span className="text-white font-medium">ריווח טקסט</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.textSpacing ? 'bg-[#4ade80]' : 'bg-white/30'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${
                        settings.textSpacing ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>
                </div>

                {/* Reset Button */}
                <button
                  onClick={resetSettings}
                  className="w-full p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="font-medium">איפוס הגדרות</span>
                </button>

                {/* Accessibility Statement Link */}
                <button
                  onClick={() => setShowStatement(true)}
                  className="w-full p-4 bg-white/5 border border-white/20 rounded-xl flex items-center justify-center gap-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">הצהרת נגישות</span>
                </button>

                {/* Footer */}
                <div className="text-center text-white/40 text-xs pt-4 border-t border-white/10">
                  <p>♿ אתר זה מותאם לתקן WCAG 2.1 AA</p>
                  <p className="mt-1">© I4IGUANA {new Date().getFullYear()}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Accessibility Statement Modal */}
      <AnimatePresence>
        {showStatement && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatement(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg max-h-[80vh] bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-2xl z-[10002] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">הצהרת נגישות</h2>
                <button
                  onClick={() => setShowStatement(false)}
                  className="p-2 hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] text-white/80 space-y-4 text-right" dir="rtl">
                <h3 className="text-lg font-bold text-white">מחויבות לנגישות</h3>
                <p>
                  I4IGUANA מחויבת להנגשת האתר והאפליקציה לאנשים עם מוגבלויות. 
                  אנו משקיעים משאבים רבים כדי להבטיח שהשירותים שלנו יהיו נגישים לכולם.
                </p>

                <h3 className="text-lg font-bold text-white">תקן נגישות</h3>
                <p>
                  אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות 
                  (התאמות נגישות לשירות), התשע״ג-2013, ברמת AA לפי הנחיות WCAG 2.1.
                </p>

                <h3 className="text-lg font-bold text-white">תכונות נגישות</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>התאמת גודל טקסט</li>
                  <li>מצב ניגודיות גבוהה</li>
                  <li>הדגשת קישורים</li>
                  <li>סמן מוגדל</li>
                  <li>עצירת אנימציות</li>
                  <li>גופן קריא</li>
                  <li>ריווח טקסט מוגבר</li>
                </ul>

                <h3 className="text-lg font-bold text-white">יצירת קשר</h3>
                <p>
                  נתקלתם בבעיית נגישות? אנא פנו אלינו:
                </p>
                <p className="text-[#4ade80]">
                  📧 accessibility@i4iguana.com
                </p>

                <h3 className="text-lg font-bold text-white">עדכון אחרון</h3>
                <p>הצהרת נגישות זו עודכנה לאחרונה בתאריך: דצמבר 2025</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
