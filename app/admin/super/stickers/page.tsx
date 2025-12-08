'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Printer, Download, RefreshCw, Building2, QrCode, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Venue {
  id: string
  name: string
  displayName?: string
  qrCodeUrl?: string
  address?: string
  city?: string
}

export default function StickerGeneratorPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load venues from Firestore
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const venuesSnapshot = await getDocs(collection(db, 'venues'))
        const venuesList: Venue[] = []
        
        venuesSnapshot.forEach((doc) => {
          const data = doc.data()
          venuesList.push({
            id: doc.id,
            name: data.name || doc.id,
            displayName: data.displayName || data.name || doc.id,
            qrCodeUrl: data.qrCodeUrl || '',
            address: data.address || '',
            city: data.city || ''
          })
        })
        
        // Sort by name
        venuesList.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
        
        setVenues(venuesList)
        console.log(`✅ Loaded ${venuesList.length} venues`)
      } catch (error) {
        console.error('❌ Error loading venues:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVenues()
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: WHITE BACKGROUND STICKER - MINIMAL INK, HOLLYWOOD QUALITY!
  // ═══════════════════════════════════════════════════════════════════════════
  
  const generateStickerHTML = (venue: Venue, lang: 'hebrew' | 'english') => {
    const venueQrUrl = `https://i4iguana.com/checkin/${venue.id}`
    const appQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://i4iguana.com/app&color=0d2920'
    const venueQrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(venueQrUrl)}&color=0d2920`
    
    // Iguana with radar image
    const iguanaImg = 'https://i4iguana.com/notification-icon-192.png'
    
    if (lang === 'hebrew') {
      return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - ${venue.displayName || venue.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Heebo', sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    /* ✅ WHITE BACKGROUND STICKER - SAVES INK! */
    .sticker {
      width: 20cm;
      height: 20cm;
      background: white;
      border-radius: 20px;
      padding: 0.8cm;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    
    /* ✅ GLOWING GREEN BORDER */
    .sticker::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 4px solid #4ade80;
      border-radius: 20px;
      box-shadow: 
        inset 0 0 20px rgba(74, 222, 128, 0.15),
        0 0 30px rgba(74, 222, 128, 0.3);
      pointer-events: none;
    }
    
    /* ✅ CORNER DECORATIONS */
    .corner {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 3px solid #4ade80;
    }
    .corner-tl { top: 15px; left: 15px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
    .corner-tr { top: 15px; right: 15px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
    .corner-bl { bottom: 15px; left: 15px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
    .corner-br { bottom: 15px; right: 15px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
    
    /* ✅ LOGO SECTION */
    .logo-section {
      text-align: center;
      margin-bottom: 0.3cm;
      z-index: 1;
    }
    
    .iguana-container {
      width: 5cm;
      height: 5cm;
      background: linear-gradient(135deg, #0d2920 0%, #1a4d3e 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(13, 41, 32, 0.3);
      margin: 0 auto;
    }
    
    .iguana-img {
      width: 4cm;
      height: auto;
      filter: drop-shadow(0 5px 15px rgba(74, 222, 128, 0.5));
    }
    
    .app-name {
      font-size: 26px;
      font-weight: 900;
      color: #0d2920;
      letter-spacing: 3px;
      margin-top: 0.3cm;
    }
    
    .app-name span {
      color: #4ade80;
    }
    
    /* ✅ TAGLINE SECTION */
    .tagline-section {
      text-align: center;
      margin-bottom: 0.4cm;
      z-index: 1;
    }
    
    .main-tagline {
      font-size: 32px;
      font-weight: 800;
      color: #0d2920;
    }
    
    .highlight { 
      color: #4ade80;
      position: relative;
    }
    
    .sub-tagline {
      font-size: 16px;
      color: #666;
      margin-top: 0.1cm;
      font-weight: 500;
    }
    
    /* ✅ REALTIME BADGE */
    .realtime-badge {
      display: inline-flex;
      align-items: center;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      padding: 6px 18px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 0.25cm;
      box-shadow: 0 4px 12px rgba(74, 222, 128, 0.35);
    }
    
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      margin-left: 8px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.4); }
    }
    
    /* ✅ QR SECTION */
    .qr-section {
      display: flex;
      flex-direction: row-reverse;
      gap: 1cm;
      margin: 0.4cm 0;
      z-index: 1;
    }
    
    .qr-box {
      text-align: center;
      background: #f8f8f8;
      padding: 0.4cm;
      border-radius: 16px;
      border: 2px solid #e0e0e0;
    }
    
    .qr-box img {
      width: 4cm;
      height: 4cm;
      border-radius: 8px;
    }
    
    .qr-label {
      font-size: 12px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 0.15cm;
    }
    
    .qr-step {
      font-size: 18px;
      font-weight: 800;
      color: white;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -0.3cm auto 0.15cm;
      box-shadow: 0 3px 10px rgba(74, 222, 128, 0.4);
    }
    
    /* ✅ VENUE NAME */
    .venue-name {
      font-size: 13px;
      color: #888;
      margin-top: 0.2cm;
      z-index: 1;
    }
    
    /* ✅ FOOTER */
    .footer {
      position: absolute;
      bottom: 0.5cm;
      text-align: center;
      z-index: 1;
    }
    
    .footer-text {
      font-size: 11px;
      color: #999;
      letter-spacing: 1px;
    }
    
    .footer-link {
      font-size: 12px;
      color: #4ade80;
      font-weight: 600;
      margin-top: 2px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { 
        box-shadow: none; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    
    <div class="logo-section">
      <div class="iguana-container">
        <img src="${iguanaImg}" alt="I4IGUANA" class="iguana-img">
      </div>
      <div class="app-name"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="tagline-section">
      <div class="main-tagline"><span class="highlight">היא מחליטה</span> ראשונה!</div>
      <div class="sub-tagline">מצאו מישהו כאן, עכשיו.</div>
      <div class="realtime-badge">
        ⚡ זיווגים בזמן אמת
        <div class="pulse-dot"></div>
      </div>
    </div>
    
    <div class="qr-section">
      <div class="qr-box">
        <div class="qr-step">1</div>
        <img src="${appQrUrl}" alt="Download App">
        <div class="qr-label">📱 הורד את האפליקציה</div>
      </div>
      <div class="qr-box">
        <div class="qr-step">2</div>
        <img src="${venueQrApi}" alt="Check-in">
        <div class="qr-label">📍 סרוק כאן להצטרפות</div>
      </div>
    </div>
    
    <div class="venue-name">📍 ${venue.displayName || venue.name}</div>
    
    <div class="footer">
      <div class="footer-text">Dating App for Real Meetings</div>
      <div class="footer-link">i4iguana.com</div>
    </div>
  </div>
</body>
</html>`
    } else {
      // English version
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - ${venue.displayName || venue.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    /* ✅ WHITE BACKGROUND STICKER - SAVES INK! */
    .sticker {
      width: 20cm;
      height: 20cm;
      background: white;
      border-radius: 20px;
      padding: 0.8cm;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    
    /* ✅ GLOWING GREEN BORDER */
    .sticker::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 4px solid #4ade80;
      border-radius: 20px;
      box-shadow: 
        inset 0 0 20px rgba(74, 222, 128, 0.15),
        0 0 30px rgba(74, 222, 128, 0.3);
      pointer-events: none;
    }
    
    /* ✅ CORNER DECORATIONS */
    .corner {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 3px solid #4ade80;
    }
    .corner-tl { top: 15px; left: 15px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
    .corner-tr { top: 15px; right: 15px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
    .corner-bl { bottom: 15px; left: 15px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
    .corner-br { bottom: 15px; right: 15px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
    
    /* ✅ LOGO SECTION */
    .logo-section {
      text-align: center;
      margin-bottom: 0.3cm;
      z-index: 1;
    }
    
    .iguana-container {
      width: 5cm;
      height: 5cm;
      background: linear-gradient(135deg, #0d2920 0%, #1a4d3e 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(13, 41, 32, 0.3);
      margin: 0 auto;
    }
    
    .iguana-img {
      width: 4cm;
      height: auto;
      filter: drop-shadow(0 5px 15px rgba(74, 222, 128, 0.5));
    }
    
    .app-name {
      font-size: 26px;
      font-weight: 900;
      color: #0d2920;
      letter-spacing: 3px;
      margin-top: 0.3cm;
    }
    
    .app-name span {
      color: #4ade80;
    }
    
    /* ✅ TAGLINE SECTION */
    .tagline-section {
      text-align: center;
      margin-bottom: 0.4cm;
      z-index: 1;
    }
    
    .main-tagline {
      font-size: 30px;
      font-weight: 800;
      color: #0d2920;
    }
    
    .highlight { 
      color: #4ade80;
      position: relative;
    }
    
    .sub-tagline {
      font-size: 16px;
      color: #666;
      margin-top: 0.1cm;
      font-weight: 500;
    }
    
    /* ✅ REALTIME BADGE */
    .realtime-badge {
      display: inline-flex;
      align-items: center;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      padding: 6px 18px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 0.25cm;
      box-shadow: 0 4px 12px rgba(74, 222, 128, 0.35);
    }
    
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      margin-left: 8px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.4); }
    }
    
    /* ✅ QR SECTION */
    .qr-section {
      display: flex;
      flex-direction: row;
      gap: 1cm;
      margin: 0.4cm 0;
      z-index: 1;
    }
    
    .qr-box {
      text-align: center;
      background: #f8f8f8;
      padding: 0.4cm;
      border-radius: 16px;
      border: 2px solid #e0e0e0;
    }
    
    .qr-box img {
      width: 4cm;
      height: 4cm;
      border-radius: 8px;
    }
    
    .qr-label {
      font-size: 12px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 0.15cm;
    }
    
    .qr-step {
      font-size: 18px;
      font-weight: 800;
      color: white;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -0.3cm auto 0.15cm;
      box-shadow: 0 3px 10px rgba(74, 222, 128, 0.4);
    }
    
    /* ✅ VENUE NAME */
    .venue-name {
      font-size: 13px;
      color: #888;
      margin-top: 0.2cm;
      z-index: 1;
    }
    
    /* ✅ FOOTER */
    .footer {
      position: absolute;
      bottom: 0.5cm;
      text-align: center;
      z-index: 1;
    }
    
    .footer-text {
      font-size: 11px;
      color: #999;
      letter-spacing: 1px;
    }
    
    .footer-link {
      font-size: 12px;
      color: #4ade80;
      font-weight: 600;
      margin-top: 2px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { 
        box-shadow: none; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    
    <div class="logo-section">
      <div class="iguana-container">
        <img src="${iguanaImg}" alt="I4IGUANA" class="iguana-img">
      </div>
      <div class="app-name"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="tagline-section">
      <div class="main-tagline"><span class="highlight">She Decides</span> First!</div>
      <div class="sub-tagline">Find someone here, right now.</div>
      <div class="realtime-badge">
        ⚡ Real-time Matching
        <div class="pulse-dot"></div>
      </div>
    </div>
    
    <div class="qr-section">
      <div class="qr-box">
        <div class="qr-step">1</div>
        <img src="${appQrUrl}" alt="Download App">
        <div class="qr-label">📱 Download the App</div>
      </div>
      <div class="qr-box">
        <div class="qr-step">2</div>
        <img src="${venueQrApi}" alt="Check-in">
        <div class="qr-label">📍 Scan to Check In</div>
      </div>
    </div>
    
    <div class="venue-name">📍 ${venue.displayName || venue.name}</div>
    
    <div class="footer">
      <div class="footer-text">Dating App for Real Meetings</div>
      <div class="footer-link">i4iguana.com</div>
    </div>
  </div>
</body>
</html>`
    }
  }

  const selectedVenueData = venues.find(v => v.id === selectedVenue)

  const handlePrint = () => {
    if (!selectedVenueData) return
    
    const html = generateStickerHTML(selectedVenueData, language)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const handleDownload = () => {
    if (!selectedVenueData) return
    
    const html = generateStickerHTML(selectedVenueData, language)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sticker-${selectedVenueData.name}-${language}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Preview HTML
  const previewHTML = selectedVenueData 
    ? generateStickerHTML(selectedVenueData, language)
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-[#1a4d3e] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link 
          href="/admin/super/control"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Control Panel
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#4ade80]/20 rounded-xl">
            <QrCode className="w-8 h-8 text-[#4ade80]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Sticker Generator</h1>
            <p className="text-white/60">Create printable venue stickers • White background saves ink!</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          {/* Venue Selection */}
          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#4ade80]" />
              Select Venue
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-[#4ade80] animate-spin" />
              </div>
            ) : (
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="w-full bg-[#0d2920] border border-[#4ade80]/30 rounded-xl px-4 py-3 text-white focus:border-[#4ade80] focus:outline-none"
              >
                <option value="">Choose a venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.displayName || venue.name}
                  </option>
                ))}
              </select>
            )}
            
            <p className="text-white/40 text-sm mt-2">
              {venues.length} venues available
            </p>
          </div>

          {/* Language Selection */}
          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4ade80]" />
              Language
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage('hebrew')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  language === 'hebrew'
                    ? 'bg-[#4ade80] text-[#0d2920]'
                    : 'bg-[#0d2920] text-white/60 hover:text-white border border-[#4ade80]/30'
                }`}
              >
                🇮🇱 עברית
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  language === 'english'
                    ? 'bg-[#4ade80] text-[#0d2920]'
                    : 'bg-[#0d2920] text-white/60 hover:text-white border border-[#4ade80]/30'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                disabled={!selectedVenue}
                className="w-full flex items-center justify-center gap-2 bg-[#4ade80] hover:bg-[#3bc970] disabled:bg-gray-600 disabled:cursor-not-allowed text-[#0d2920] font-bold py-3 px-4 rounded-xl transition-all"
              >
                <Printer className="w-5 h-5" />
                Print Sticker
              </button>
              
              <button
                onClick={handleDownload}
                disabled={!selectedVenue}
                className="w-full flex items-center justify-center gap-2 bg-[#0d2920] hover:bg-[#0d2920]/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white/80 font-bold py-3 px-4 rounded-xl border border-[#4ade80]/30 transition-all"
              >
                <Download className="w-5 h-5" />
                Download HTML
              </button>
            </div>
            
            <p className="text-white/40 text-sm mt-4 text-center">
              Sticker size: 20×20 cm • Print on A4 sticker paper
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
          <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
          
          {selectedVenueData ? (
            <div className="bg-gray-200 rounded-xl overflow-hidden aspect-square">
              <iframe
                ref={iframeRef}
                srcDoc={previewHTML}
                className="w-full h-full border-0"
                title="Sticker Preview"
              />
            </div>
          ) : (
            <div className="bg-[#0d2920] rounded-xl aspect-square flex items-center justify-center">
              <div className="text-center text-white/40">
                <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a venue to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
