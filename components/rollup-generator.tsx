'use client'

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Maximize2, FileCode, Building2, Palette, MessageCircle } from 'lucide-react'

/**
 * 🦎 IGUANA BAR - Hollywood Roll-Up Banner Generator v3.0
 * 85cm x 200cm promotional banner for venues
 * 
 * Features:
 * - Multiple design styles (WOW, Classic, Underground)
 * - Venue type selector with custom taglines
 * - Hebrew/English support
 * - Print mode with A3 slot
 */

const VENUES = [
  { id: 'none', name: '', nameHe: '' },
  { id: 'archie', name: 'Archie Bar', nameHe: 'ארצ\'י בר' },
  { id: 'marina', name: 'Marina Café', nameHe: 'מרינה קפה' },
  { id: 'habima', name: 'Habima Theater', nameHe: 'תיאטרון הבימה' },
  { id: 'custom', name: 'Custom...', nameHe: 'מותאם אישית...' },
]

// 🎯 Venue Types with tailored taglines
const VENUE_TYPES = [
  { 
    id: 'bar', 
    name: '🍺 בר רגיל', 
    taglineHe: 'באת לבד? תצא בזוג 💕',
    taglineEn: 'Came alone? Leave together 💕',
    vibe: 'bright'
  },
  { 
    id: 'club', 
    name: '🎉 מועדון לילה', 
    taglineHe: 'הלילה נגמר, החיבור נשאר ✨',
    taglineEn: 'Night ends, connection stays ✨',
    vibe: 'bright'
  },
  { 
    id: 'singles', 
    name: '💕 ערב פנויים', 
    taglineHe: 'מספיק לגלול. הגיע הזמן להיפגש 🎯',
    taglineEn: 'Done swiping. Time to meet 🎯',
    vibe: 'bright'
  },
  { 
    id: 'campus', 
    name: '🎓 קמפוס / אוניברסיטה', 
    taglineHe: 'לא רק ללמוד, גם להתחבר 📚',
    taglineEn: 'Not just studying, connecting 📚',
    vibe: 'bright'
  },
  { 
    id: 'show', 
    name: '🎭 מופע / סטנדאפ', 
    taglineHe: 'באת לצחוק? תישאר לאהבה 😂',
    taglineEn: 'Came to laugh? Stay for love 😂',
    vibe: 'bright'
  },
  { 
    id: 'rooftop', 
    name: '🌅 בר גג / יין', 
    taglineHe: 'הנוף יפה, החברה יותר 🍷',
    taglineEn: 'Nice view, better company 🍷',
    vibe: 'bright'
  },
  { 
    id: 'underground', 
    name: '🖤 אנדרגראונד / אלקטרוני', 
    taglineHe: 'אותו פריקוונסי. אותו רגע.',
    taglineEn: 'Same frequency. Same moment.',
    vibe: 'dark'
  },
  { 
    id: 'rave', 
    name: '⚡ רייב / טכנו', 
    taglineHe: 'הקשר כבר קיים. רק תגלה אותו.',
    taglineEn: 'Connection exists. Just find it.',
    vibe: 'dark'
  },
  { 
    id: 'custom', 
    name: '✏️ משפט מותאם...', 
    taglineHe: '',
    taglineEn: '',
    vibe: 'bright'
  },
]

type DesignStyle = 'classic' | 'wow' | 'underground' | 'universal'

export default function RollUpGenerator() {
  const rollupRef = useRef<HTMLDivElement>(null)
  const [showHebrew, setShowHebrew] = useState(true)
  const [selectedVenue, setSelectedVenue] = useState('archie')
  const [customVenueName, setCustomVenueName] = useState('')
  const [printMode, setPrintMode] = useState(false)
  const [designStyle, setDesignStyle] = useState<DesignStyle>('universal') // Default to universal!
  const [venueType, setVenueType] = useState('bar')
  const [customTagline, setCustomTagline] = useState('')

  const getVenueName = () => {
    if (printMode) return ''
    if (selectedVenue === 'custom') return customVenueName
    if (selectedVenue === 'none') return ''
    const venue = VENUES.find(v => v.id === selectedVenue)
    return showHebrew ? venue?.nameHe : venue?.name
  }

  const getTagline = () => {
    if (venueType === 'custom') return customTagline
    const type = VENUE_TYPES.find(t => t.id === venueType)
    return showHebrew ? type?.taglineHe : type?.taglineEn
  }

  const isUndergroundVibe = () => {
    // Underground design always uses dark vibe
    if (designStyle === 'underground') return true
    
    // WOW and Classic always use bright vibe
    if (designStyle === 'wow' || designStyle === 'classic') return false
    
    // Universal mode: depends on venue type!
    if (designStyle === 'universal') {
      const type = VENUE_TYPES.find(t => t.id === venueType)
      return type?.vibe === 'dark' // Only dark for underground/rave venue types
    }
    
    return false
  }

  // 📦 Download Print Package with Instructions for Print Shop
  const handleDownloadPrintPackage = () => {
    const printHTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>IGUANA BAR - Roll-Up Print File | קובץ להדפסה</title>
<style>
@page { size: 85cm 200cm; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }

/* PRINT INSTRUCTIONS PAGE */
.instructions {
  max-width: 800px; margin: 40px auto; padding: 40px;
  background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.instructions h1 { color: #15803d; font-size: 28px; margin-bottom: 20px; text-align: center; }
.instructions h2 { color: #333; font-size: 20px; margin: 25px 0 15px; border-bottom: 2px solid #15803d; padding-bottom: 8px; }
.instructions ul { padding-right: 25px; line-height: 2; }
.instructions li { margin-bottom: 8px; }
.instructions .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-right: 4px solid #f59e0b; margin: 15px 0; }
.instructions .warning { background: #fee2e2; padding: 15px; border-radius: 8px; border-right: 4px solid #ef4444; margin: 15px 0; }
.instructions .specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
.instructions .spec-box { background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; }
.instructions .spec-box strong { display: block; font-size: 24px; color: #15803d; }
.instructions .spec-box span { color: #666; font-size: 14px; }

/* PAGE BREAK */
.page-break { page-break-after: always; }

/* ACTUAL BANNER */
.banner-container { 
  width: 85cm; height: 200cm; 
  display: flex; justify-content: center; align-items: center;
  background: #000; 
}
.banner {
  width: 85cm; height: 200cm;
  background: linear-gradient(180deg, #061210 0%, #0a1f1a 15%, #0d2920 40%, #1a4d3e 70%, #0d2920 100%);
  position: relative; overflow: hidden;
}
.texture {
  position: absolute; inset: 0; opacity: 0.15;
  background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='20' cy='20' rx='18' ry='12' fill='none' stroke='%234ade80' stroke-width='1.5'/%3E%3C/svg%3E");
  background-size: 80px 80px;
}
.content { position: relative; z-index: 10; padding: 5cm 4cm; height: 100%; display: flex; flex-direction: column; }

/* PREMIERE HEADER */
.premiere { text-align: center; padding: 4cm 0; position: relative; }
.premiere-glow {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 70cm; height: 40cm;
  background: radial-gradient(ellipse at center top, rgba(239,68,68,0.3), rgba(236,72,153,0.2) 30%, transparent 70%);
  filter: blur(30px); pointer-events: none;
}
.stars { font-size: 5cm; margin-bottom: 1.5cm; }
.world-premiere { font-size: 2.2cm; font-weight: bold; letter-spacing: 0.8cm; color: #fbbf24; margin-bottom: 2cm; }
.realtime { font-size: 7cm; font-weight: 900; letter-spacing: 0.3cm; background: linear-gradient(180deg, #fef3c7, #fcd34d, #fbbf24, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.dating { font-size: 9cm; font-weight: 900; letter-spacing: 0.2cm; background: linear-gradient(180deg, #fdf4ff, #f5d0fe, #f0abfc, #e879f9, #d946ef, #c026d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
.experience { font-size: 5cm; font-weight: 900; letter-spacing: 0.5cm; background: linear-gradient(180deg, #fef3c7, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 0.5cm; }
.revolutionary { font-size: 2.5cm; font-weight: bold; color: rgba(255,255,255,0.9); margin-top: 2cm; }
.red-carpet { margin: 2cm auto; width: 50cm; height: 0.8cm; border-radius: 0.4cm; background: linear-gradient(90deg, transparent, #ef4444, #fbbf24, #ef4444, transparent); }

/* IGUANAS */
.iguanas-section { text-align: center; padding: 2cm 0; position: relative; }
.connection-line { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40cm; height: 0.6cm; background: linear-gradient(90deg, transparent, #ec4899, transparent); opacity: 0.6; }
.iguanas { display: flex; justify-content: center; align-items: center; }
.iguana { font-size: 10cm; filter: drop-shadow(0 0 3cm rgba(74,222,128,0.8)); }
.iguana.flip { transform: scaleX(-1); }
.heart { font-size: 12cm; margin: 0 -2cm; filter: drop-shadow(0 0 5cm rgba(236,72,153,0.8)); }
.real-meeting { font-size: 2.2cm; color: rgba(244,114,182,0.8); letter-spacing: 0.3cm; margin-top: 1cm; }

/* IGUANA BAR */
.brand-box {
  text-align: center; padding: 1.5cm 2cm; margin: 1.5cm 4cm;
  border-radius: 2cm;
  background: linear-gradient(180deg, rgba(13,41,32,0.8), rgba(26,77,62,0.6), rgba(13,41,32,0.8));
  border: 0.4cm solid rgba(74,222,128,0.5);
}
.brand-box .iguana-emoji { font-size: 3.5cm; }
.brand-box .iguana-text { font-size: 4cm; font-weight: 900; letter-spacing: 0.3cm; background: linear-gradient(180deg, #86efac, #4ade80); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.brand-box .bar-text { font-size: 5cm; font-weight: 900; letter-spacing: 0.5cm; background: linear-gradient(180deg, #fef3c7, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* A3 SLOT - EMPTY RECTANGLE */
.a3-slot {
  text-align: center; margin: 2cm 4cm; padding: 3cm 2cm;
  border: 0.5cm dashed rgba(251,191,36,0.6);
  border-radius: 1.5cm;
  background: rgba(255,255,255,0.05);
  min-height: 20cm;
}
.a3-slot-label { font-size: 2cm; color: rgba(251,191,36,0.5); letter-spacing: 0.3cm; }
.a3-slot-text { font-size: 2.5cm; color: rgba(251,191,36,0.3); margin-top: 1cm; }
.a3-slot-dimensions { font-size: 1.5cm; color: rgba(251,191,36,0.4); margin-top: 2cm; }

/* GAME FLOW */
.game-flow {
  display: flex; justify-content: center; align-items: center; gap: 1.5cm;
  padding: 2cm; margin: 1.5cm 0;
  background: rgba(74,222,128,0.1); border-radius: 2cm;
}
.step { font-size: 6cm; }
.arrow { font-size: 4cm; color: #4ade80; }

/* TIMER */
.timer-box {
  text-align: center; padding: 2cm; margin: 1.5cm 0;
  background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05));
  border: 0.4cm solid rgba(251,191,36,0.5); border-radius: 2cm;
}
.timer-icon { font-size: 7cm; }
.timer-text { font-size: 4cm; font-weight: 900; color: #fbbf24; margin-top: 1cm; }
.timer-sub { font-size: 2cm; color: #fbbf24; opacity: 0.8; }

/* PROPS */
.props { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5cm; margin: 1.5cm 0; }
.prop { text-align: center; padding: 2cm 1cm; background: rgba(74,222,128,0.1); border-radius: 1.5cm; }
.prop-icon { font-size: 5cm; margin-bottom: 0.5cm; }
.prop-text { font-size: 2cm; font-weight: bold; color: white; }

/* QR SECTION */
.qr-section { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3cm 0; }
.qr-title { color: #4ade80; font-size: 3cm; font-weight: bold; margin-bottom: 2cm; }
.qr-box { background: white; padding: 2cm; border-radius: 2cm; box-shadow: 0 0 8cm rgba(74,222,128,0.5); }
.qr-box img { width: 18cm; height: 18cm; }
.url-badge { margin-top: 2cm; padding: 1.5cm 4cm; background: linear-gradient(135deg, #0d2920, #1a4d3e); border: 0.4cm solid #4ade80; border-radius: 4cm; }
.url-text { color: #4ade80; font-size: 2.5cm; font-weight: 900; letter-spacing: 0.2cm; }

/* BOTTOM */
.bottom { text-align: center; margin-top: auto; padding-top: 3cm; }
.bottom-tagline { font-size: 2.5cm; font-weight: bold; color: #4ade80; letter-spacing: 0.2cm; }
.bottom-iguanas { font-size: 4cm; margin-top: 1.5cm; }
.copyright { font-size: 1.5cm; color: rgba(134,239,172,0.4); margin-top: 2cm; }

@media screen {
  .banner-container { transform: scale(0.05); transform-origin: top left; margin-bottom: -190cm; }
}
@media print {
  .instructions { display: none; }
  .banner-container { transform: none; }
  body { background: none; }
}
</style>
</head>
<body>

<!-- 📋 PRINT INSTRUCTIONS (won't print) -->
<div class="instructions">
  <h1>🦎 IGUANA BAR - הנחיות הדפסה לבית דפוס</h1>
  
  <h2>📐 מפרט טכני</h2>
  <div class="specs">
    <div class="spec-box"><strong>85cm</strong><span>רוחב</span></div>
    <div class="spec-box"><strong>200cm</strong><span>גובה</span></div>
    <div class="spec-box"><strong>1:2.35</strong><span>יחס</span></div>
    <div class="spec-box"><strong>CMYK</strong><span>מרחב צבע</span></div>
  </div>
  
  <h2>🖨️ הנחיות הדפסה</h2>
  <ul>
    <li>סוג הדפסה: <strong>רול-אפ / Roll-Up Banner</strong></li>
    <li>חומר: ויניל מט או סאטן (מומלץ)</li>
    <li>רזולוציה: 150 DPI מינימום</li>
    <li>בליד: 2-3 מ"מ מכל צד</li>
    <li>מתקן: רול-אפ סטנדרטי 85cm</li>
  </ul>
  
  <div class="highlight">
    <strong>⚠️ שימו לב למלבן הריק!</strong><br>
    באמצע הבאנר יש מלבן מקווקו ריק. זה מכוון!<br>
    שם יודבק שלט A3 עם שם המועדון (מסופק בנפרד).
  </div>
  
  <h2>📄 שלט A3 (מסופק בנפרד)</h2>
  <ul>
    <li>גודל: <strong>42cm × 29.7cm (A3 לנדסקייפ)</strong></li>
    <li>הדפסה על נייר עבה / קרטון / מגנט</li>
    <li>מיועד להחלפה לפי מועדון</li>
  </ul>
  
  <div class="warning">
    <strong>🚫 אל תדפיסו טקסט במלבן הריק!</strong><br>
    המלבן נועד להיות ריק - שלט המועדון יודבק עליו.
  </div>
  
  <h2>📞 ליצירת קשר</h2>
  <p>לשאלות: ניר | I4IGUANA | i4iguana.com</p>
  
  <p style="text-align: center; margin-top: 30px; color: #666;">
    <strong>📄 הבאנר להדפסה מופיע בעמוד הבא (או בהדפסה)</strong><br>
    לחץ Ctrl+P להדפסה / שמירה כ-PDF
  </p>
</div>

<div class="page-break"></div>

<!-- 🎨 ACTUAL BANNER FOR PRINT -->
<div class="banner-container">
  <div class="banner">
    <div class="texture"></div>
    <div class="content">
      
      <!-- PREMIERE -->
      <div class="premiere">
        <div class="premiere-glow"></div>
        <div class="stars">✨ 🌟 ✨</div>
        <div class="world-premiere">${showHebrew ? '🎬 פרימיירה עולמית 🎬' : '🎬 WORLD PREMIERE 🎬'}</div>
        <div class="realtime">REAL-TIME</div>
        <div class="dating">DATING</div>
        <div class="experience">EXPERIENCE</div>
        <div class="revolutionary">${showHebrew ? '🔥 חוויית הדייטינג המהפכנית! 🔥' : '🔥 Revolutionary Dating! 🔥'}</div>
        <div class="red-carpet"></div>
      </div>
      
      <!-- IGUANAS -->
      <div class="iguanas-section">
        <div class="connection-line"></div>
        <div class="iguanas">
          <span class="iguana flip">🦎</span>
          <span class="heart">❤️</span>
          <span class="iguana">🦎</span>
        </div>
        <div class="real-meeting">${showHebrew ? 'מפגש אמיתי. עכשיו.' : 'Real Meeting. Now.'}</div>
      </div>
      
      <!-- BRAND -->
      <div class="brand-box">
        <span class="iguana-emoji">🦎</span>
        <span class="iguana-text">IGUANA </span>
        <span class="bar-text">BAR</span>
        <span class="iguana-emoji" style="transform: scaleX(-1); display: inline-block;">🦎</span>
      </div>
      
      <!-- A3 SLOT -->
      <div class="a3-slot">
        <div class="a3-slot-label">📄 ${showHebrew ? 'מקום לשלט A3' : 'A3 SIGN SLOT'}</div>
        <div class="a3-slot-text">${showHebrew ? '[ הדבק שלט מועדון כאן ]' : '[ ATTACH VENUE SIGN HERE ]'}</div>
        <div class="a3-slot-dimensions">42cm × 29.7cm</div>
      </div>
      
      <!-- GAME FLOW -->
      <div class="game-flow">
        <span class="step">📱</span>
        <span class="arrow">→</span>
        <span class="step">👀</span>
        <span class="arrow">→</span>
        <span class="step">💕</span>
        <span class="arrow">→</span>
        <span class="step">🥂</span>
      </div>
      
      <!-- TIMER -->
      <div class="timer-box">
        <div class="timer-icon">⏱️</div>
        <div class="timer-text">${showHebrew ? '10 דקות להחליט!' : '10 Minutes to Decide!'}</div>
        <div class="timer-sub">${showHebrew ? 'Match = מפגש אמיתי' : 'Match = Real Meeting'}</div>
      </div>
      
      <!-- PROPS -->
      <div class="props">
        <div class="prop"><div class="prop-icon">🎯</div><div class="prop-text">${showHebrew ? 'מרחק 0' : 'Distance 0'}</div></div>
        <div class="prop"><div class="prop-icon">👑</div><div class="prop-text">${showHebrew ? 'היא מחליטה' : 'She Decides'}</div></div>
        <div class="prop"><div class="prop-icon">🔒</div><div class="prop-text">${showHebrew ? 'בטוח 100%' : '100% Safe'}</div></div>
      </div>
      
      <!-- QR -->
      <div class="qr-section">
        <div class="qr-title">${showHebrew ? '📲 סרוק והצטרף!' : '📲 Scan & Join!'}</div>
        <div class="qr-box">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://i4iguana.com/landing" alt="QR Code">
        </div>
        <div class="url-badge">
          <span class="url-text">🦎 i4iguana.com 🦎</span>
        </div>
      </div>
      
      <!-- BOTTOM -->
      <div class="bottom">
        <div class="bottom-tagline">${showHebrew ? 'לא צ\'אט. מפגש אמיתי! 💚' : 'No Chat. Real Meeting! 💚'}</div>
        <div class="bottom-iguanas"><span style="transform: scaleX(-1); display: inline-block;">🦎</span> 💚 <span>🦎</span></div>
        <div class="copyright">© 2025 IGUANA BAR by I4IGUANA</div>
      </div>
      
    </div>
  </div>
</div>

</body>
</html>`

    const blob = new Blob([printHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IGUANA-BAR-PRINT-FILE-85x200cm.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Download A3 Sign
  const handleDownloadA3Sign = () => {
    const venueNameForSign = selectedVenue === 'custom' ? customVenueName : 
      (showHebrew ? VENUES.find(v => v.id === selectedVenue)?.nameHe : VENUES.find(v => v.id === selectedVenue)?.name)
    if (!venueNameForSign) { alert('בחר מועדון קודם!'); return }

    const a3HTML = `<!DOCTYPE html><html lang="${showHebrew ? 'he' : 'en'}" dir="${showHebrew ? 'rtl' : 'ltr'}"><head><meta charset="UTF-8"><title>A3 Sign - ${venueNameForSign}</title><style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A3 landscape;margin:0}body{width:420mm;height:297mm;display:flex;justify-content:center;align-items:center;background:#111827;font-family:'Segoe UI',sans-serif}.sign{width:380mm;height:140mm;background:linear-gradient(135deg,rgba(251,191,36,0.25),rgba(251,191,36,0.08));border:6px solid rgba(251,191,36,0.6);border-radius:30px;box-shadow:0 0 60px rgba(251,191,36,0.4);display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative}.label{font-size:28px;color:#fbbf24;letter-spacing:0.4em;margin-bottom:15px}.venue-name{font-size:90px;font-weight:900;color:#fbbf24;text-shadow:0 0 40px rgba(251,191,36,0.8)}.iguanas{font-size:50px;margin-top:20px}.flip{transform:scaleX(-1);display:inline-block}.corner{position:absolute;font-size:40px;color:rgba(251,191,36,0.4)}.corner.tl{top:25px;left:30px}.corner.tr{top:25px;right:30px}.corner.bl{bottom:25px;left:30px}.corner.br{bottom:25px;right:30px}@media print{body{background:white;-webkit-print-color-adjust:exact!important}}</style></head><body><div class="sign"><div class="corner tl">🦎</div><div class="corner tr"><span class="flip">🦎</span></div><div class="corner bl"><span class="flip">🦎</span></div><div class="corner br">🦎</div><div class="label">🎯 ${showHebrew ? 'הערב ב:' : 'Tonight at:'}</div><div class="venue-name">${venueNameForSign}</div><div class="iguanas"><span class="flip">🦎</span> 💛 <span>🦎</span></div></div></body></html>`
    
    const blob = new Blob([a3HTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `A3-Sign-${venueNameForSign.replace(/\s+/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Download HTML
  const handleDownloadHTML = () => {
    const venueName = getVenueName()
    const venueSection = printMode 
      ? `<div class="venue-section empty"><div class="venue-label" style="opacity:0.5">${showHebrew ? '📄 מקום לשלט A3' : '📄 A3 Sign Slot'}</div><div class="venue-name" style="opacity:0.3;font-size:16px">${showHebrew ? '[ הדבק שלט כאן ]' : '[ Attach Sign ]'}</div></div>`
      : venueName ? `<div class="venue-section"><div class="venue-label">${showHebrew ? '🎯 הערב ב:' : '🎯 Tonight at:'}</div><div class="venue-name">${venueName}</div></div>` : ''

    const wowHTML = `<!DOCTYPE html>
<html lang="${showHebrew ? 'he' : 'en'}" dir="${showHebrew ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>IGUANA BAR - WOW Roll-Up</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:linear-gradient(135deg,#0f172a,#1e293b);display:flex;justify-content:center;padding:20px;font-family:'Segoe UI',sans-serif}
.banner{width:425px;min-height:1000px;background:linear-gradient(180deg,#061210 0%,#0a1f1a 20%,#0d2920 50%,#1a4d3e 80%,#0d2920 100%);border-radius:16px;position:relative;overflow:hidden;box-shadow:0 25px 80px -12px rgba(74,222,128,0.4)}
.texture{position:absolute;inset:0;opacity:0.15;background-image:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='20' cy='20' rx='18' ry='12' fill='none' stroke='%234ade80' stroke-width='1.5'/%3E%3C/svg%3E");background-size:40px 40px}
.content{position:relative;z-index:10;padding:25px 20px;display:flex;flex-direction:column;min-height:1000px}
.love-section{text-align:center;padding:20px 0 25px;position:relative}
.love-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:200px;background:radial-gradient(ellipse at center,rgba(236,72,153,0.3),transparent 70%);filter:blur(20px);animation:pulseGlow 2s ease-in-out infinite}
@keyframes pulseGlow{0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
.iguanas-love{position:relative;display:flex;justify-content:center;align-items:center;margin-bottom:10px}
.iguana-left,.iguana-right{font-size:70px;filter:drop-shadow(0 0 20px rgba(74,222,128,0.8));animation:iguanaFloat 3s ease-in-out infinite}
.iguana-left{transform:scaleX(-1)}
@keyframes iguanaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.heart-container{margin:0 -15px;z-index:10}
.main-heart{font-size:80px;animation:heartBeat 1.2s ease-in-out infinite;filter:drop-shadow(0 0 30px rgba(236,72,153,0.8))}
@keyframes heartBeat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.1)}60%{transform:scale(1)}}
.mini-hearts{position:absolute;inset:0;pointer-events:none}
.mini-heart{position:absolute;animation:floatUp 3s ease-out infinite;opacity:0}
.mini-heart:nth-child(1){left:20%;font-size:20px}.mini-heart:nth-child(2){left:35%;animation-delay:0.5s;font-size:16px}.mini-heart:nth-child(3){left:50%;animation-delay:1s;font-size:24px}.mini-heart:nth-child(4){left:65%;animation-delay:1.5s;font-size:18px}.mini-heart:nth-child(5){left:80%;animation-delay:2s;font-size:22px}
@keyframes floatUp{0%{transform:translateY(0) scale(0);opacity:0}20%{opacity:1;transform:translateY(-20px) scale(1)}100%{transform:translateY(-150px) scale(0.5);opacity:0}}
.connection-line{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:4px;background:linear-gradient(90deg,transparent,#ec4899,transparent);opacity:0.6;z-index:1}
.main-headline{text-align:center;margin:10px 0 15px}
.headline-text{font-size:26px;font-weight:900;letter-spacing:0.1em;line-height:1.2;background:linear-gradient(180deg,#fdf4ff,#f0abfc,#e879f9,#d946ef,#c026d3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(217,70,239,0.5))}
.headline-sub{font-size:14px;color:#f0abfc;letter-spacing:0.2em;margin-top:8px}
.sign-box{text-align:center;padding:18px 15px;margin:12px 0;border-radius:16px;background:linear-gradient(180deg,rgba(13,41,32,0.9),rgba(26,77,62,0.8),rgba(13,41,32,0.9));border:3px solid #4ade80;box-shadow:0 0 30px rgba(74,222,128,0.3)}
.iguana-text{font-size:40px;font-weight:900;letter-spacing:0.15em;background:linear-gradient(180deg,#86efac,#4ade80,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.bar-text{font-size:50px;font-weight:900;letter-spacing:0.3em;margin-top:-5px;background:linear-gradient(180deg,#fef3c7,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.venue-section{text-align:center;margin:12px 0;padding:12px 15px;border-radius:12px;background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05));border:2px solid rgba(251,191,36,0.4)}
.venue-section.empty{background:rgba(255,255,255,0.05);border:3px dashed rgba(251,191,36,0.6);min-height:70px}
.venue-label{font-size:11px;color:#fbbf24;letter-spacing:0.2em;margin-bottom:5px}
.venue-name{font-size:24px;font-weight:900;color:#fbbf24;text-shadow:0 0 20px rgba(251,191,36,0.5)}
.game-visual{display:flex;justify-content:center;align-items:center;gap:8px;margin:15px 0;padding:12px;background:rgba(74,222,128,0.1);border-radius:12px}
.step-icon{font-size:32px}.step-arrow{font-size:20px;color:#4ade80}
.timer-highlight{text-align:center;padding:12px;margin:12px 0;background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05));border:2px solid rgba(251,191,36,0.5);border-radius:12px}
.timer-icon{font-size:36px;animation:timerPulse 1s ease-in-out infinite}
@keyframes timerPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.timer-text{font-size:22px;font-weight:900;color:#fbbf24;margin-top:5px}
.timer-sub{font-size:11px;color:#fbbf24;opacity:0.8}
.props{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
.prop{text-align:center;padding:10px 5px;background:rgba(74,222,128,0.1);border-radius:10px}
.prop-icon{font-size:26px;margin-bottom:4px}.prop-text{font-size:11px;font-weight:bold;color:white}
.qr-section{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:15px 0}
.qr-title{color:#4ade80;font-size:15px;font-weight:bold;margin-bottom:10px}
.qr-box{background:white;padding:12px;border-radius:16px;box-shadow:0 0 40px rgba(74,222,128,0.5)}
.qr-box img{width:100px;height:100px}
.url-badge{margin-top:12px;padding:8px 20px;background:linear-gradient(135deg,#0d2920,#1a4d3e);border:2px solid #4ade80;border-radius:25px}
.url-text{color:#4ade80;font-size:14px;font-weight:900;letter-spacing:0.1em}
.bottom{text-align:center;margin-top:auto;padding-top:15px}
.bottom-tagline{font-size:13px;font-weight:bold;color:#4ade80;letter-spacing:0.1em}
.bottom-iguanas{font-size:24px;margin-top:8px}
.flip{transform:scaleX(-1);display:inline-block}
.copyright{font-size:9px;color:rgba(134,239,172,0.4);margin-top:10px}
@media print{@page{size:85cm 200cm;margin:0}body{background:white;padding:0}.banner{width:85cm;min-height:200cm;border-radius:0}}
</style>
</head>
<body>
<div class="banner"><div class="texture"></div>
<div class="content">
<!-- PREMIERE HEADER -->
<div style="text-align:center;padding:20px 10px;position:relative">
<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:100%;height:100%;background:radial-gradient(ellipse at center top,rgba(239,68,68,0.3),rgba(236,72,153,0.2) 30%,transparent 70%);filter:blur(15px);pointer-events:none"></div>
<div style="font-size:24px;margin-bottom:8px">✨ 🌟 ✨</div>
<div style="font-size:11px;font-weight:bold;letter-spacing:0.4em;color:#fbbf24;margin-bottom:10px">\${showHebrew ? '🎬 פרימיירה עולמית 🎬' : '🎬 WORLD PREMIERE 🎬'}</div>
<div style="font-size:36px;font-weight:900;letter-spacing:0.1em;background:linear-gradient(180deg,#fef3c7,#fcd34d,#fbbf24,#f59e0b,#d97706);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(251,191,36,0.8))">REAL-TIME</div>
<div style="font-size:44px;font-weight:900;letter-spacing:0.05em;background:linear-gradient(180deg,#fdf4ff,#f5d0fe,#f0abfc,#e879f9,#d946ef,#c026d3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 25px rgba(217,70,239,0.8))">DATING</div>
<div style="font-size:26px;font-weight:900;letter-spacing:0.2em;background:linear-gradient(180deg,#fef3c7,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 15px rgba(251,191,36,0.6))">EXPERIENCE</div>
<div style="margin-top:12px;font-size:14px;font-weight:bold;color:rgba(255,255,255,0.9)">\${showHebrew ? '🔥 חוויית הדייטינג המהפכנית! 🔥' : '🔥 Revolutionary Dating! 🔥'}</div>
<div style="margin:12px auto;width:200px;height:4px;border-radius:4px;background:linear-gradient(90deg,transparent,#ef4444,#fbbf24,#ef4444,transparent);box-shadow:0 0 20px rgba(239,68,68,0.5)"></div>
</div>
<!-- LOVE IGUANAS -->
<div style="text-align:center;padding:10px 0;position:relative">
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:4px;background:linear-gradient(90deg,transparent,#ec4899,transparent);opacity:0.6"></div>
<div style="display:flex;justify-content:center;align-items:center"><span style="font-size:50px;transform:scaleX(-1);display:inline-block;filter:drop-shadow(0 0 15px rgba(74,222,128,0.8))">🦎</span><span style="font-size:60px;margin:0 -8px;filter:drop-shadow(0 0 25px rgba(236,72,153,0.8))">❤️</span><span style="font-size:50px;filter:drop-shadow(0 0 15px rgba(74,222,128,0.8))">🦎</span></div>
<div style="font-size:12px;color:rgba(244,114,182,0.8);letter-spacing:0.1em;margin-top:5px">\${showHebrew ? 'מפגש אמיתי. עכשיו.' : 'Real Meeting. Now.'}</div>
</div>
<!-- IGUANA BAR - SMALLER -->
<div style="text-align:center;padding:10px;margin:8px 15px;border-radius:12px;background:linear-gradient(180deg,rgba(13,41,32,0.8),rgba(26,77,62,0.6),rgba(13,41,32,0.8));border:2px solid rgba(74,222,128,0.5)">
<span style="font-size:18px">🦎</span>
<span style="font-size:22px;font-weight:900;letter-spacing:0.1em;background:linear-gradient(180deg,#86efac,#4ade80);-webkit-background-clip:text;-webkit-text-fill-color:transparent">IGUANA </span>
<span style="font-size:26px;font-weight:900;letter-spacing:0.15em;background:linear-gradient(180deg,#fef3c7,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent">BAR</span>
<span style="font-size:18px;transform:scaleX(-1);display:inline-block">🦎</span>
</div>
\${venueSection}
<div class="game-visual"><span class="step-icon">📱</span><span class="step-arrow">→</span><span class="step-icon">👀</span><span class="step-arrow">→</span><span class="step-icon">💕</span><span class="step-arrow">→</span><span class="step-icon">🥂</span></div>
<div class="timer-highlight"><div class="timer-icon">⏱️</div><div class="timer-text">${showHebrew ? '10 דקות להחליט!' : '10 Minutes to Decide!'}</div><div class="timer-sub">${showHebrew ? 'Match = מפגש אמיתי' : 'Match = Real Meeting'}</div></div>
<div class="props"><div class="prop"><div class="prop-icon">🎯</div><div class="prop-text">${showHebrew ? 'מרחק 0' : 'Distance 0'}</div></div><div class="prop"><div class="prop-icon">👑</div><div class="prop-text">${showHebrew ? 'היא מחליטה' : 'She Decides'}</div></div><div class="prop"><div class="prop-icon">🔒</div><div class="prop-text">${showHebrew ? 'בטוח 100%' : '100% Safe'}</div></div></div>
<div class="qr-section"><div class="qr-title">${showHebrew ? '📲 סרוק והצטרף!' : '📲 Scan & Join!'}</div><div class="qr-box"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://i4iguana.com/landing" alt="QR"></div><div class="url-badge"><span class="url-text">🦎 i4iguana.com 🦎</span></div></div>
<div class="bottom"><div class="bottom-tagline">${showHebrew ? 'לא צ\'אט. מפגש אמיתי! 💚' : 'No Chat. Real Meeting! 💚'}</div><div class="bottom-iguanas"><span class="flip">🦎</span> 💚 <span>🦎</span></div><div class="copyright">© 2025 IGUANA BAR by I4IGUANA</div></div>
</div></div>
</body>
</html>`

    const classicHTML = `<!DOCTYPE html>
<html lang="${showHebrew ? 'he' : 'en'}" dir="${showHebrew ? 'rtl' : 'ltr'}">
<head><meta charset="UTF-8"><title>IGUANA BAR - Classic</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#111827;min-height:100vh;display:flex;justify-content:center;padding:20px;font-family:'Segoe UI',sans-serif}
.banner{width:425px;min-height:1000px;background:linear-gradient(180deg,#061210,#0a1f1a 15%,#0d2920 40%,#1a4d3e 70%,#0d2920);border-radius:12px;position:relative;overflow:hidden}
.texture{position:absolute;inset:0;opacity:0.2;background-image:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='20' cy='20' rx='18' ry='12' fill='none' stroke='%234ade80' stroke-width='1.5'/%3E%3C/svg%3E");background-size:40px 40px}
.content{position:relative;z-index:10;padding:20px;min-height:1000px;display:flex;flex-direction:column}
.iguanas-row{display:flex;justify-content:center;gap:4px;font-size:28px;opacity:0.8;margin-bottom:8px}.flip{transform:scaleX(-1);display:inline-block}.dot{font-size:18px;color:#4ade80}
.sign-box{padding:25px 20px;margin:0 10px;border-radius:16px;background:linear-gradient(180deg,rgba(13,41,32,0.95),rgba(26,77,62,0.9),rgba(13,41,32,0.95));border:3px solid #4ade80;box-shadow:0 0 40px rgba(74,222,128,0.3);text-align:center}
.iguana-text{font-size:48px;font-weight:900;letter-spacing:0.15em;background:linear-gradient(180deg,#86efac,#4ade80,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.bar-text{font-size:60px;font-weight:900;letter-spacing:0.3em;margin-top:-5px;background:linear-gradient(180deg,#fef3c7,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.tagline{margin-top:12px;font-size:11px;font-weight:bold;letter-spacing:0.3em;color:#86efac}
.venue-section{text-align:center;margin:15px 0;padding:12px 15px;background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05));border:2px solid rgba(251,191,36,0.4);border-radius:12px}
.venue-section.empty{background:rgba(255,255,255,0.05);border:3px dashed rgba(251,191,36,0.6);min-height:80px}
.venue-label{font-size:10px;color:#fbbf24;letter-spacing:0.2em;margin-bottom:5px}.venue-name{font-size:28px;font-weight:900;color:#fbbf24}
.divider{display:flex;align-items:center;gap:10px;margin:12px 0}.divider-line{flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(74,222,128,0.5),transparent)}
.game-box{text-align:center;padding:12px;border-radius:16px;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);margin-bottom:12px}
.game-title{color:#fbbf24;font-weight:bold;font-size:14px;margin-bottom:5px}.game-headline{color:white;font-size:18px;font-weight:900}.game-headline span{color:#4ade80}
.rule{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:rgba(74,222,128,0.1);margin-bottom:6px}
.rule.timer{background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3)}
.rule-num{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;background:#4ade80;color:#0d2920}
.rule.timer .rule-num{background:#fbbf24}.rule-title{color:white;font-size:12px;font-weight:bold}.rule.timer .rule-title{color:#fbbf24}.rule-sub{color:rgba(74,222,128,0.7);font-size:10px}.rule.timer .rule-sub{color:rgba(251,191,36,0.7)}.rule-icon{color:#4ade80;font-size:16px;margin-left:auto}.rule.timer .rule-icon{color:#fbbf24}
.props{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px}.prop{padding:8px 5px;border-radius:10px;background:rgba(74,222,128,0.1);text-align:center}.prop-icon{font-size:16px;margin-bottom:3px}.prop-text{color:white;font-size:10px;font-weight:bold}
.qr-section{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 0}.qr-title{color:#4ade80;font-size:14px;font-weight:bold;margin-bottom:10px}.qr-box{background:white;padding:12px;border-radius:16px;box-shadow:0 0 30px rgba(74,222,128,0.4)}.qr-box img{width:90px;height:90px}.url-badge{margin-top:12px;padding:8px 20px;background:linear-gradient(135deg,#0d2920,#1a4d3e);border:2px solid #4ade80;border-radius:25px}.url-text{color:#4ade80;font-size:14px;font-weight:900}
.bottom{text-align:center;margin-top:auto}.bottom-tagline{color:#4ade80;font-size:11px;font-weight:bold;letter-spacing:0.15em;margin-bottom:8px}.bottom-iguanas{font-size:22px}.copyright{font-size:9px;color:rgba(134,239,172,0.4);margin-top:10px}
@media print{@page{size:85cm 200cm;margin:0}body{background:white}.banner{width:85cm;min-height:200cm}}
</style></head>
<body><div class="banner"><div class="texture"></div><div class="content">
<div class="iguanas-row">🦎<span class="dot">•</span><span class="flip">🦎</span><span class="dot">•</span>🦎<span class="dot">•</span><span class="flip">🦎</span><span class="dot">•</span>🦎</div>
<div class="sign-box"><div class="iguana-text">IGUANA</div><div class="bar-text">BAR</div><div class="tagline">REAL-TIME DATING EXPERIENCE</div></div>
<div class="iguanas-row" style="margin-top:8px"><span class="flip">🦎</span><span class="dot">•</span>🦎<span class="dot">•</span><span class="flip">🦎</span><span class="dot">•</span>🦎<span class="dot">•</span><span class="flip">🦎</span></div>
${venueSection}
<div class="divider"><div class="divider-line"></div><span style="color:#4ade80">✨</span><div class="divider-line"></div></div>
<div class="game-box"><div class="game-title">⏱️ ${showHebrew ? 'משחק הדייטינג' : 'THE DATING GAME'} ⏱️</div><div class="game-headline">${showHebrew ? 'מצאת מישהו?' : 'Found Someone?'}<br><span>${showHebrew ? '10 דקות להחליט!' : '10 Min to Decide!'}</span></div></div>
<div class="rule"><div class="rule-num">1</div><div><div class="rule-title">${showHebrew ? 'סרוק QR בכניסה' : 'Scan QR at Entry'}</div><div class="rule-sub">${showHebrew ? 'הכנס למשחק' : 'Join the game'}</div></div><span class="rule-icon">📱</span></div>
<div class="rule"><div class="rule-num">2</div><div><div class="rule-title">${showHebrew ? 'דפדף בפרופילים' : 'Swipe Profiles'}</div><div class="rule-sub">${showHebrew ? 'רק מי שכאן עכשיו!' : 'Only here NOW!'}</div></div><span class="rule-icon">👥</span></div>
<div class="rule"><div class="rule-num">3</div><div><div class="rule-title">${showHebrew ? 'Match = מפגש אמיתי' : 'Match = Real Meeting'}</div><div class="rule-sub">${showHebrew ? 'לא צ\'אט, מפגש!' : 'Not chat, meet!'}</div></div><span class="rule-icon">💕</span></div>
<div class="rule timer"><div class="rule-num">⏱️</div><div><div class="rule-title">${showHebrew ? '10 דקות להחליט!' : '10 Min to Decide!'}</div><div class="rule-sub">${showHebrew ? 'תפסו רגע או תפספסו' : 'Seize the moment!'}</div></div><span class="rule-icon">⏰</span></div>
<div class="props"><div class="prop"><div class="prop-icon">🎯</div><div class="prop-text">${showHebrew ? 'מרחק 0' : 'Distance 0'}</div></div><div class="prop"><div class="prop-icon">👑</div><div class="prop-text">${showHebrew ? 'היא מחליטה' : 'She Decides'}</div></div><div class="prop"><div class="prop-icon">🔒</div><div class="prop-text">${showHebrew ? 'בטוח 100%' : '100% Safe'}</div></div></div>
<div class="qr-section"><div class="qr-title">${showHebrew ? '📲 סרוק והצטרף למשחק' : '📲 Scan & Join the Game'}</div><div class="qr-box"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://i4iguana.com/landing" alt="QR"></div><div class="url-badge"><span class="url-text">🦎 i4iguana.com 🦎</span></div></div>
<div class="bottom"><div class="bottom-tagline">${showHebrew ? 'לא עוד צ\'אט. מפגש אמיתי.' : 'No More Chat. Real Meetings.'}</div><div class="bottom-iguanas"><span class="flip">🦎</span> 💚 🦎</div><div class="copyright">© 2025 IGUANA BAR by I4IGUANA</div></div>
</div></div></body></html>`

    const html = designStyle === 'wow' ? wowHTML : classicHTML
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IGUANA-BAR-${designStyle.toUpperCase()}-${showHebrew ? 'HE' : 'EN'}${printMode ? '-PRINT' : ''}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFullscreenPreview = () => {
    const venueName = getVenueName()
    const venueSection = printMode 
      ? `<div class="venue-section empty"><div class="venue-label" style="opacity:0.5">${showHebrew ? '📄 מקום לשלט A3' : '📄 A3 Slot'}</div><div class="venue-name" style="opacity:0.3;font-size:14px">${showHebrew ? '[ הדבק שלט ]' : '[ Attach Sign ]'}</div></div>`
      : venueName ? `<div class="venue-section"><div class="venue-label">${showHebrew ? '🎯 הערב ב:' : '🎯 Tonight at:'}</div><div class="venue-name">${venueName}</div></div>` : ''

    const html = `<!DOCTYPE html><html lang="${showHebrew ? 'he' : 'en'}" dir="${showHebrew ? 'rtl' : 'ltr'}"><head><meta charset="UTF-8"><title>IGUANA BAR - Preview</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;background:linear-gradient(135deg,#0f172a,#1e293b)}body{display:flex;justify-content:center;padding:20px;font-family:'Segoe UI',sans-serif;overflow:auto}.banner{width:min(95vw,450px);min-height:calc(min(95vw,450px)*2.35);background:linear-gradient(180deg,#061210,#0a1f1a 20%,#0d2920 50%,#1a4d3e 80%,#0d2920);border-radius:16px;position:relative;overflow:hidden;box-shadow:0 25px 80px -12px rgba(74,222,128,0.4)}.texture{position:absolute;inset:0;opacity:0.15;background-image:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='20' cy='20' rx='18' ry='12' fill='none' stroke='%234ade80' stroke-width='1.5'/%3E%3C/svg%3E");background-size:40px 40px}.content{position:relative;z-index:10;padding:5%;display:flex;flex-direction:column;min-height:100%}.venue-section{text-align:center;margin:3% 0;padding:3%;border-radius:12px;background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05));border:2px solid rgba(251,191,36,0.4)}.venue-section.empty{background:rgba(255,255,255,0.05);border:3px dashed rgba(251,191,36,0.6);min-height:60px}.venue-label{font-size:clamp(10px,2.5vw,13px);color:#fbbf24;letter-spacing:0.2em;margin-bottom:2%}.venue-name{font-size:clamp(18px,5vw,26px);font-weight:900;color:#fbbf24}.game-visual{display:flex;justify-content:center;align-items:center;gap:3%;margin:4% 0;padding:3%;background:rgba(74,222,128,0.1);border-radius:12px}.step-icon{font-size:clamp(28px,8vw,38px)}.step-arrow{font-size:clamp(18px,5vw,24px);color:#4ade80}.timer-highlight{text-align:center;padding:3%;margin:3% 0;background:linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05));border:2px solid rgba(251,191,36,0.5);border-radius:12px}.timer-icon{font-size:clamp(32px,9vw,42px)}.timer-text{font-size:clamp(18px,5vw,24px);font-weight:900;color:#fbbf24;margin-top:2%}.timer-sub{font-size:clamp(10px,2.5vw,13px);color:#fbbf24;opacity:0.8}.props{display:grid;grid-template-columns:repeat(3,1fr);gap:3%;margin:3% 0}.prop{text-align:center;padding:3%;background:rgba(74,222,128,0.1);border-radius:10px}.prop-icon{font-size:clamp(22px,6vw,30px);margin-bottom:2%}.prop-text{font-size:clamp(10px,2.5vw,13px);font-weight:bold;color:white}.qr-section{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4% 0}.qr-title{color:#4ade80;font-size:clamp(14px,3.5vw,18px);font-weight:bold;margin-bottom:3%}.qr-box{background:white;padding:3%;border-radius:16px;box-shadow:0 0 40px rgba(74,222,128,0.5)}.qr-box img{width:clamp(80px,22vw,110px);height:clamp(80px,22vw,110px)}.url-badge{margin-top:3%;padding:2% 5%;background:linear-gradient(135deg,#0d2920,#1a4d3e);border:2px solid #4ade80;border-radius:25px}.url-text{color:#4ade80;font-size:clamp(12px,3vw,16px);font-weight:900;letter-spacing:0.1em}.bottom{text-align:center;margin-top:auto;padding-top:4%}.bottom-tagline{font-size:clamp(12px,3vw,15px);font-weight:bold;color:#4ade80;letter-spacing:0.1em}.bottom-iguanas{font-size:clamp(20px,5vw,28px);margin-top:2%}.flip{transform:scaleX(-1);display:inline-block}.copyright{font-size:clamp(8px,2vw,10px);color:rgba(134,239,172,0.4);margin-top:3%}</style></head><body><div class="banner"><div class="texture"></div><div class="content"><!-- PREMIERE --><div style="text-align:center;padding:5% 3%;position:relative"><div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:100%;height:100%;background:radial-gradient(ellipse at center top,rgba(239,68,68,0.3),rgba(236,72,153,0.2) 30%,transparent 70%);filter:blur(15px);pointer-events:none"></div><div style="font-size:clamp(20px,5vw,28px);margin-bottom:2%">✨ 🌟 ✨</div><div style="font-size:clamp(10px,2.5vw,12px);font-weight:bold;letter-spacing:0.4em;color:#fbbf24;margin-bottom:3%">${showHebrew ? '🎬 פרימיירה עולמית 🎬' : '🎬 WORLD PREMIERE 🎬'}</div><div style="font-size:clamp(28px,8vw,40px);font-weight:900;letter-spacing:0.1em;background:linear-gradient(180deg,#fef3c7,#fcd34d,#fbbf24,#f59e0b,#d97706);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(251,191,36,0.8))">REAL-TIME</div><div style="font-size:clamp(36px,10vw,50px);font-weight:900;letter-spacing:0.05em;background:linear-gradient(180deg,#fdf4ff,#f5d0fe,#f0abfc,#e879f9,#d946ef,#c026d3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 25px rgba(217,70,239,0.8))">DATING</div><div style="font-size:clamp(20px,6vw,30px);font-weight:900;letter-spacing:0.2em;background:linear-gradient(180deg,#fef3c7,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 15px rgba(251,191,36,0.6))">EXPERIENCE</div><div style="margin-top:3%;font-size:clamp(12px,3vw,16px);font-weight:bold;color:rgba(255,255,255,0.9)">${showHebrew ? '🔥 חוויית הדייטינג המהפכנית! 🔥' : '🔥 Revolutionary Dating! 🔥'}</div><div style="margin:3% auto;width:60%;height:4px;border-radius:4px;background:linear-gradient(90deg,transparent,#ef4444,#fbbf24,#ef4444,transparent);box-shadow:0 0 20px rgba(239,68,68,0.5)"></div></div><!-- IGUANAS --><div style="text-align:center;padding:2% 0;position:relative"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50%;height:4px;background:linear-gradient(90deg,transparent,#ec4899,transparent);opacity:0.6"></div><div style="display:flex;justify-content:center;align-items:center"><span style="font-size:clamp(40px,12vw,60px);transform:scaleX(-1);display:inline-block;filter:drop-shadow(0 0 15px rgba(74,222,128,0.8))">🦎</span><span style="font-size:clamp(50px,14vw,70px);margin:0 -2%;filter:drop-shadow(0 0 25px rgba(236,72,153,0.8))">❤️</span><span style="font-size:clamp(40px,12vw,60px);filter:drop-shadow(0 0 15px rgba(74,222,128,0.8))">🦎</span></div><div style="font-size:clamp(10px,2.5vw,14px);color:rgba(244,114,182,0.8);letter-spacing:0.1em;margin-top:2%">${showHebrew ? 'מפגש אמיתי. עכשיו.' : 'Real Meeting. Now.'}</div></div><!-- IGUANA BAR --><div style="text-align:center;padding:2%;margin:2% 5%;border-radius:12px;background:linear-gradient(180deg,rgba(13,41,32,0.8),rgba(26,77,62,0.6),rgba(13,41,32,0.8));border:2px solid rgba(74,222,128,0.5)"><span style="font-size:clamp(14px,4vw,20px)">🦎</span><span style="font-size:clamp(18px,5vw,26px);font-weight:900;letter-spacing:0.1em;background:linear-gradient(180deg,#86efac,#4ade80);-webkit-background-clip:text;-webkit-text-fill-color:transparent">IGUANA </span><span style="font-size:clamp(22px,6vw,30px);font-weight:900;letter-spacing:0.15em;background:linear-gradient(180deg,#fef3c7,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent">BAR</span><span style="font-size:clamp(14px,4vw,20px);transform:scaleX(-1);display:inline-block">🦎</span></div>${venueSection}<div class="game-visual"><span class="step-icon">📱</span><span class="step-arrow">→</span><span class="step-icon">👀</span><span class="step-arrow">→</span><span class="step-icon">💕</span><span class="step-arrow">→</span><span class="step-icon">🥂</span></div><div class="timer-highlight"><div class="timer-icon">⏱️</div><div class="timer-text">${showHebrew ? '10 דקות להחליט!' : '10 Minutes to Decide!'}</div><div class="timer-sub">${showHebrew ? 'Match = מפגש אמיתי' : 'Match = Real Meeting'}</div></div><div class="props"><div class="prop"><div class="prop-icon">🎯</div><div class="prop-text">${showHebrew ? 'מרחק 0' : 'Distance 0'}</div></div><div class="prop"><div class="prop-icon">👑</div><div class="prop-text">${showHebrew ? 'היא מחליטה' : 'She Decides'}</div></div><div class="prop"><div class="prop-icon">🔒</div><div class="prop-text">${showHebrew ? 'בטוח 100%' : '100% Safe'}</div></div></div><div class="qr-section"><div class="qr-title">${showHebrew ? '📲 סרוק והצטרף!' : '📲 Scan & Join!'}</div><div class="qr-box"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://i4iguana.com/landing" alt="QR"></div><div class="url-badge"><span class="url-text">🦎 i4iguana.com 🦎</span></div></div><div class="bottom"><div class="bottom-tagline">${showHebrew ? 'לא צ\'אט. מפגש אמיתי! 💚' : 'No Chat. Real Meeting! 💚'}</div><div class="bottom-iguanas"><span class="flip">🦎</span> 💚 <span>🦎</span></div><div class="copyright">© 2025 IGUANA BAR by I4IGUANA</div></div></div></div></body></html>`
    
    const newWindow = window.open('', '_blank')
    if (newWindow) { newWindow.document.write(html); newWindow.document.close() }
  }

  const venueName = getVenueName()

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto mb-6 space-y-4 print:hidden">
        
        {/* 🔙 Back Button */}
        <a href="/sticker-generator" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
          <span className="text-xl">←</span>
          <span>חזרה לפאנל הראשי</span>
        </a>
        
        <h1 className="text-2xl font-bold text-white text-center">🦎 IGUANA BAR Roll-Up</h1>
        <p className="text-gray-400 text-center text-sm">85cm × 200cm | 300₪ מתקן + הדפסה</p>
        
        {/* Design Style */}
        <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-4 border border-pink-500/30">
          <label className="flex items-center gap-2 text-pink-400 font-bold mb-3">
            <Palette className="w-5 h-5" />🎨 בחר עיצוב:
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => setDesignStyle('universal')} className={`p-3 rounded-lg font-bold transition-all text-center col-span-2 ${designStyle === 'universal' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg ring-2 ring-white/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              ⚡ Universal<div className="text-xs opacity-70 mt-1">מתאים לכל מקום! מומלץ להתחלה</div>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setDesignStyle('wow')} className={`p-2 rounded-lg font-bold transition-all text-center text-sm ${designStyle === 'wow' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              ❤️ WOW<div className="text-xs opacity-70">רומנטי</div>
            </button>
            <button onClick={() => setDesignStyle('classic')} className={`p-2 rounded-lg font-bold transition-all text-center text-sm ${designStyle === 'classic' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              🦎 Classic<div className="text-xs opacity-70">כללים</div>
            </button>
            <button onClick={() => setDesignStyle('underground')} className={`p-2 rounded-lg font-bold transition-all text-center text-sm ${designStyle === 'underground' ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-lg border border-purple-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              🖤 Dark<div className="text-xs opacity-70">מינימל</div>
            </button>
          </div>
        </div>
        
        {/* Venue Type & Tagline */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-4 border border-purple-500/30">
          <label className="flex items-center gap-2 text-purple-400 font-bold mb-2">
            <MessageCircle className="w-5 h-5" />💬 סוג מקום + משפט:
          </label>
          <select 
            value={venueType} 
            onChange={(e) => setVenueType(e.target.value)} 
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-purple-500/30 font-bold mb-2"
          >
            {VENUE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          
          {venueType === 'custom' ? (
            <input 
              type="text" 
              value={customTagline} 
              onChange={(e) => setCustomTagline(e.target.value)} 
              placeholder="כתוב משפט מותאם..." 
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-purple-500/30"
            />
          ) : (
            <div className="p-3 bg-black/30 rounded-lg text-center">
              <span className="text-purple-300 text-lg font-bold">{getTagline()}</span>
            </div>
          )}
          
          {(designStyle === 'universal' || designStyle === 'underground') && (
            <div className="mt-2 p-2 bg-purple-900/30 rounded-lg text-xs text-purple-300 text-center">
              ⚡ עיצוב אוניברסלי: מינימלי, מתאים לכל סוגי המקומות
            </div>
          )}
        </div>
        
        {/* Language */}
        <div className="flex gap-2 justify-center">
          <button onClick={() => setShowHebrew(true)} className={`px-4 py-2 rounded-lg font-bold ${showHebrew ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>עברית 🇮🇱</button>
          <button onClick={() => setShowHebrew(false)} className={`px-4 py-2 rounded-lg font-bold ${!showHebrew ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>English 🇺🇸</button>
        </div>

        {/* Venue */}
        <div className="bg-gray-800 rounded-xl p-4 border border-yellow-500/30">
          <label className="flex items-center gap-2 text-yellow-400 font-bold mb-2"><Building2 className="w-5 h-5" />🎯 בחר מועדון:</label>
          <select value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)} disabled={printMode} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-yellow-500/30 font-bold">
            {VENUES.map(v => <option key={v.id} value={v.id}>{v.id === 'none' ? '-- ללא --' : v.id === 'custom' ? '✏️ מותאם...' : `${v.name} / ${v.nameHe}`}</option>)}
          </select>
          {selectedVenue === 'custom' && !printMode && <input type="text" value={customVenueName} onChange={(e) => setCustomVenueName(e.target.value)} placeholder="שם מועדון..." className="w-full mt-2 p-3 bg-gray-700 text-white rounded-lg border border-yellow-500/30" />}
          {venueName && !printMode && <div className="mt-2 text-center text-yellow-400 text-sm">✅ יופיע: <strong>{venueName}</strong></div>}
          
          <div className="mt-3 pt-3 border-t border-gray-600">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={printMode} onChange={(e) => setPrintMode(e.target.checked)} className="w-5 h-5 rounded" />
              <span className="text-orange-400 font-bold">🖨️ מצב הדפסה (מלבן ריק לשלט A3)</span>
            </label>
          </div>
        </div>
        
        {/* 📦 PRINT PACKAGE - Shows when print mode is ON */}
        {printMode && (
          <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-xl p-4 border-2 border-orange-500/50">
            <h3 className="text-orange-400 font-bold text-lg mb-3">📦 חבילת הדפסה לדפוס:</h3>
            
            <div className="space-y-2">
              <button onClick={handleDownloadPrintPackage} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg">
                <Download className="w-5 h-5" />
                📄 הורד תבנית רול-אפ לדפוס
              </button>
              
              <button onClick={handleDownloadA3Sign} className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                📄 הורד שלט A3 למועדון
              </button>
            </div>
            
            <div className="mt-3 p-3 bg-black/30 rounded-lg text-xs text-orange-200/80 space-y-1">
              <p>📐 <strong>רול-אפ:</strong> 85cm × 200cm (יחס 1:2.35)</p>
              <p>📐 <strong>שלט A3:</strong> 42cm × 29.7cm (לנדסקייפ)</p>
              <p>💡 <strong>טיפ:</strong> הדפס רול-אפ אחד + שלטי A3 לכל מועדון!</p>
            </div>
          </div>
        )}
        
        {/* A3 Sign - Shows when print mode is OFF and venue selected */}
        {!printMode && selectedVenue !== 'none' && (
          <button onClick={handleDownloadA3Sign} className="w-full py-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />📄 הורד שלט A3 למועדון (לשליחה דיגיטלית)
          </button>
        )}
        
        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <button onClick={handleFullscreenPreview} className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Maximize2 className="w-5 h-5" />👁️ תצוגה מלאה</button>
          <button onClick={handleDownloadHTML} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"><FileCode className="w-5 h-5" />📥 הורד HTML ({designStyle === 'universal' ? 'Universal' : designStyle === 'wow' ? 'WOW' : designStyle === 'underground' ? 'Dark' : 'Classic'})</button>
        </div>
        <p className="text-xs text-gray-500 text-center">💡 QR → i4iguana.com/landing</p>
      </div>

      {/* Preview */}
      <div ref={rollupRef} className="mx-auto overflow-hidden print:shadow-none" style={{ width: '340px', minHeight: '800px', direction: showHebrew ? 'rtl' : 'ltr' }}>
        <div className="w-full relative" style={{ 
          background: isUndergroundVibe() 
            ? 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 20%, #16213e 50%, #0f0f23 80%, #0a0a0a 100%)'
            : 'linear-gradient(180deg, #061210 0%, #0a1f1a 20%, #0d2920 50%, #1a4d3e 80%, #0d2920 100%)', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          minHeight: '800px' 
        }}>
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ 
            backgroundImage: isUndergroundVibe()
              ? `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='%238b5cf6'/%3E%3C/svg%3E")`
              : `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='20' cy='20' rx='18' ry='12' fill='none' stroke='%234ade80' stroke-width='1.5'/%3E%3C/svg%3E")`, 
            backgroundSize: '40px 40px' 
          }} />
          <div className="relative z-10 flex flex-col p-5" style={{ minHeight: '800px' }}>
            
            {/* ⭐ MAIN STAR - CLEAN & UNIVERSAL */}
            <div className="text-center py-3 relative">
              {/* Glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none" style={{ 
                background: isUndergroundVibe()
                  ? 'radial-gradient(ellipse at center top, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.2) 30%, transparent 70%)'
                  : 'radial-gradient(ellipse at center top, rgba(239,68,68,0.3) 0%, rgba(236,72,153,0.2) 30%, transparent 70%)', 
                filter: 'blur(15px)' 
              }} />
              
              {/* Single icon */}
              <div className="text-2xl mb-2">{isUndergroundVibe() ? '⚡' : '✨'}</div>
              
              {/* CONNECTION label */}
              <div className="text-[11px] font-bold tracking-[0.4em] mb-2 uppercase" style={{ color: isUndergroundVibe() ? '#a78bfa' : '#fbbf24' }}>
                ⚡ CONNECTION ⚡
              </div>
              
              {/* ONE glowing bar - thin but bright */}
              <div className="relative px-4">
                <div 
                  className="mx-auto h-8 rounded-lg"
                  style={{ 
                    width: '85%',
                    background: isUndergroundVibe()
                      ? 'linear-gradient(90deg, #4f46e5, #8b5cf6, #a78bfa, #8b5cf6, #4f46e5)'
                      : 'linear-gradient(90deg, #c026d3, #e879f9, #f0abfc, #e879f9, #c026d3)',
                    boxShadow: isUndergroundVibe()
                      ? '0 0 30px rgba(139,92,246,0.8), 0 0 60px rgba(139,92,246,0.4)'
                      : '0 0 30px rgba(217,70,239,0.8), 0 0 60px rgba(217,70,239,0.4)',
                  }}
                />
              </div>
              
              {/* Universal tagline - English works everywhere */}
              <div className="mt-3 text-sm font-bold text-white/90 tracking-wide">
                🖤 Same frequency. Same moment. 🖤
              </div>
            </div>
            
            {/* Love Iguanas - Clean, minimal */}
            <div className="text-center py-2 relative">
              <div className="relative flex justify-center items-center">
                <span className="text-5xl" style={{ transform: 'scaleX(-1)', filter: isUndergroundVibe() ? 'drop-shadow(0 0 15px rgba(139,92,246,0.8)) grayscale(50%)' : 'drop-shadow(0 0 15px rgba(74,222,128,0.8))' }}>🦎</span>
                <span className="text-6xl relative z-10 -mx-2" style={{ filter: isUndergroundVibe() ? 'drop-shadow(0 0 25px rgba(139,92,246,0.8))' : 'drop-shadow(0 0 25px rgba(236,72,153,0.8))' }}>
                  {isUndergroundVibe() ? '⚡' : '❤️'}
                </span>
                <span className="text-5xl" style={{ filter: isUndergroundVibe() ? 'drop-shadow(0 0 15px rgba(139,92,246,0.8)) grayscale(50%)' : 'drop-shadow(0 0 15px rgba(74,222,128,0.8))' }}>🦎</span>
              </div>
            </div>
            
            {/* 🎯 QR - RIGHT AFTER IGUANAS - THE CORE! Clean, no extra bars */}
            <div className="flex flex-col items-center justify-center py-3 mx-4 mb-2">
              <div className="text-sm font-bold mb-2" style={{ color: isUndergroundVibe() ? '#a78bfa' : '#4ade80' }}>
                📲 Scan Now!
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'white', boxShadow: isUndergroundVibe() ? '0 0 30px rgba(139,92,246,0.6)' : '0 0 30px rgba(74,222,128,0.6)' }}>
                <QRCodeSVG value="https://i4iguana.com/landing" size={90} level="H" fgColor={isUndergroundVibe() ? '#1a1a2e' : '#0d2920'} bgColor="#ffffff" />
              </div>
              <div className="mt-2 text-xs font-bold tracking-wide" style={{ color: isUndergroundVibe() ? '#a78bfa' : '#4ade80' }}>
                i4iguana.com
              </div>
            </div>
            
            {/* Venue */}
            {(venueName || printMode) && (
              <div className="text-center py-3 px-4 rounded-xl mx-2 mb-1" style={{ background: printMode ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', border: printMode ? '3px dashed rgba(251,191,36,0.6)' : '2px solid rgba(251,191,36,0.4)', minHeight: printMode ? '60px' : 'auto' }}>
                {printMode ? (<><div className="text-xs text-yellow-400/50 tracking-widest">📄 {showHebrew ? 'מקום לשלט A3' : 'A3 Slot'}</div><div className="text-base font-bold text-yellow-400/30">{showHebrew ? '[ הדבק שלט ]' : '[ Attach Sign ]'}</div></>) : (<><div className="text-xs text-yellow-400 tracking-widest mb-1">{showHebrew ? '🎯 הערב ב:' : '🎯 Tonight at:'}</div><div className="text-xl font-black text-yellow-400">{venueName}</div></>)}
              </div>
            )}
            
            {/* 💬 Custom Tagline - ALWAYS VISIBLE when venue type selected */}
            {!printMode && (
              <div className="text-center py-2 px-2 mx-2 mb-2">
                <div 
                  className="text-base font-bold py-2 px-4 rounded-xl inline-block"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(217,70,239,0.2))',
                    border: '2px solid rgba(236,72,153,0.5)',
                    color: '#fce7f3',
                    textShadow: '0 0 10px rgba(236,72,153,0.5)'
                  }}
                >
                  💬 {getTagline() || (showHebrew ? 'באת לבד? תצא בזוג 💕' : 'Came alone? Leave together 💕')}
                </div>
              </div>
            )}
            
            {/* Game Flow */}
            <div className="flex justify-center items-center gap-2 py-3 rounded-xl mx-2 mb-3" style={{ background: isUndergroundVibe() ? 'rgba(139,92,246,0.1)' : 'rgba(74,222,128,0.1)' }}>
              <span className="text-3xl">📱</span>
              <span className="text-xl" style={{ color: isUndergroundVibe() ? '#8b5cf6' : '#4ade80' }}>→</span>
              <span className="text-3xl">👀</span>
              <span className="text-xl" style={{ color: isUndergroundVibe() ? '#8b5cf6' : '#4ade80' }}>→</span>
              <span className="text-3xl">{isUndergroundVibe() ? '⚡' : '💕'}</span>
              <span className="text-xl" style={{ color: isUndergroundVibe() ? '#8b5cf6' : '#4ade80' }}>→</span>
              <span className="text-3xl">{isUndergroundVibe() ? '🤝' : '🥂'}</span>
            </div>
            
            {/* Timer */}
            <div className="text-center py-3 rounded-xl mx-2 mb-3" style={{ 
              background: isUndergroundVibe()
                ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))'
                : 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', 
              border: isUndergroundVibe() ? '2px solid rgba(139,92,246,0.5)' : '2px solid rgba(251,191,36,0.5)' 
            }}>
              <div className="text-3xl">⏱️</div>
              <div className="text-xl font-black mt-1" style={{ color: isUndergroundVibe() ? '#a78bfa' : '#fbbf24' }}>
                {showHebrew ? '10 דקות להחליט!' : '10 Minutes to Decide!'}
              </div>
              <div className="text-xs" style={{ color: isUndergroundVibe() ? 'rgba(167,139,250,0.8)' : 'rgba(251,191,36,0.8)' }}>
                {isUndergroundVibe()
                  ? (showHebrew ? 'Match = קונקשן' : 'Match = Connection')
                  : (showHebrew ? 'Match = מפגש אמיתי' : 'Match = Real Meeting')
                }
              </div>
            </div>
            
            {/* Props */}
            <div className="grid grid-cols-3 gap-2 mx-2 mb-3">
              {[
                {icon:'🎯', he:'מרחק 0', en:'Distance 0'},
                {icon:'👑', he:'היא מחליטה', en:'She Decides'},
                {icon:'🔒', he:'בטוח 100%', en:'100% Safe'}
              ].map((p,i) => (
                <div key={i} className="text-center py-2 rounded-lg" style={{ background: isUndergroundVibe() ? 'rgba(139,92,246,0.1)' : 'rgba(74,222,128,0.1)' }}>
                  <div className="text-2xl">{p.icon}</div>
                  <div className="text-xs font-bold text-white">{showHebrew ? p.he : p.en}</div>
                </div>
              ))}
            </div>
            
            {/* Bottom - Universal English */}
            <div className="text-center mt-auto pt-3">
              <div className="text-sm font-bold tracking-wide" style={{ color: isUndergroundVibe() ? '#a78bfa' : '#4ade80' }}>
                Not chat. Connection. {isUndergroundVibe() ? '🖤' : '💚'}
              </div>
              <div className="text-2xl mt-2">
                <span style={{ transform: 'scaleX(-1)', display: 'inline-block', filter: isUndergroundVibe() ? 'grayscale(50%)' : 'none' }}>🦎</span>
                <span className="mx-1">{isUndergroundVibe() ? '🖤' : '💚'}</span>
                <span style={{ filter: isUndergroundVibe() ? 'grayscale(50%)' : 'none' }}>🦎</span>
              </div>
              <div className="text-[9px] mt-2" style={{ color: isUndergroundVibe() ? 'rgba(167,139,250,0.4)' : 'rgba(134,239,172,0.4)' }}>© 2025 I4IGUANA</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print { @page { size: 85cm 200cm; margin: 0; } body { -webkit-print-color-adjust: exact !important; } .print\\:hidden { display: none !important; } }
      `}</style>
    </div>
  )
}
