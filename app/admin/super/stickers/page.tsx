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
}

export default function StickerGeneratorPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew')
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
          })
        })
        venuesList.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
        setVenues(venuesList)
      } catch (error) {
        console.error('Error loading venues:', error)
      } finally {
        setLoading(false)
      }
    }
    loadVenues()
  }, [])

  const generateStickerHTML = (venue: Venue, lang: 'hebrew' | 'english') => {
    const venueQrUrl = `https://i4iguana-app.vercel.app/checkin/${venue.id}`
    const appQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://i4iguana-app.vercel.app&color=0d2920'
    const venueQrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(venueQrUrl)}&color=0d2920`
    const iguanaRadarImg = 'https://i4iguana-app.vercel.app/iguana-radar.jpg'
    
    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Nir Ram
ORG:I4IGUANA
TITLE:Founder & CEO
TEL:052-265-3170
EMAIL:nir@i4iguana.com
URL:https://i4iguana.com
END:VCARD`
    const vCardQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(vCardData)}&color=0d2920`

    // ═══════════════════════════════════════════════════════════════
    // HEBREW VERSION - בדיוק כמו המקור
    // ═══════════════════════════════════════════════════════════════
    if (lang === 'hebrew') {
      return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - מדבקה</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Heebo', sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px;
    }
    
    .sticker {
      width: 20cm;
      height: 20cm;
      background: white;
      border-radius: 18px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .sticker::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 4px solid #4ade80;
      border-radius: 18px;
      pointer-events: none;
    }
    
    .corner {
      position: absolute;
      width: 28px;
      height: 28px;
      border: 3px solid #4ade80;
    }
    .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; border-radius: 6px 0 0 0; }
    .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; border-radius: 0 6px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; border-radius: 0 0 0 6px; }
    .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; border-radius: 0 0 6px 0; }

    /* === TOP ROW === */
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 4px 8px;
    }
    
    /* כרטיס ביקור - שמאל (ב-RTL מופיע ימין ויזואלית) */
    .contact-card {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 2px solid #4ade80;
      border-radius: 10px;
      padding: 8px 10px;
      background: white;
    }
    
    .contact-card img {
      width: 48px;
      height: 48px;
      border-radius: 4px;
    }
    
    .contact-info {
      text-align: right;
    }
    
    .contact-name {
      font-size: 13px;
      font-weight: 700;
      color: #0d2920;
    }
    
    .contact-title {
      font-size: 10px;
      color: #4ade80;
      font-weight: 600;
    }
    
    .contact-detail {
      font-size: 9px;
      color: #555;
      line-height: 1.4;
    }
    
    .contact-hint {
      font-size: 7px;
      color: #999;
      margin-top: 2px;
    }
    
    /* תג מקום - ימין (ב-RTL מופיע שמאל ויזואלית) */
    .venue-tag {
      border: 2px solid #4ade80;
      border-radius: 18px;
      padding: 8px 14px;
      background: white;
      font-size: 13px;
      font-weight: 600;
      color: #166534;
    }

    /* === CENTER LOGO === */
    .center-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 0;
    }
    
    .logo-circle {
      width: 160px;
      height: 160px;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    
    .logo-inner {
      width: 130px;
      height: 130px;
      border-radius: 14px;
      overflow: hidden;
    }
    
    .logo-inner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .brand-name {
      font-size: 30px;
      font-weight: 900;
      color: #0d2920;
      margin-top: 6px;
      letter-spacing: 2px;
    }
    
    .brand-name span {
      color: #4ade80;
    }

    /* === TAGLINE === */
    .tagline-area {
      text-align: center;
      padding: 4px 0;
    }
    
    .main-slogan {
      font-size: 24px;
      font-weight: 900;
      color: #0d2920;
    }
    
    .main-slogan .green {
      color: #4ade80;
    }
    
    .sub-slogan {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
    
    .realtime-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 7px 18px;
      border-radius: 18px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 8px;
    }
    
    .realtime-btn .dot {
      width: 7px;
      height: 7px;
      background: #0d2920;
      border-radius: 50%;
    }

    /* === QR CODES === */
    .qr-row {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding: 8px 0;
    }
    
    .qr-box {
      text-align: center;
      background: #f8f8f8;
      padding: 10px;
      border-radius: 12px;
      border: 2px solid #eee;
    }
    
    .qr-num {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      font-size: 13px;
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -18px auto 5px;
    }
    
    .qr-box img {
      width: 110px;
      height: 110px;
      border-radius: 6px;
    }
    
    .qr-text {
      font-size: 10px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 5px;
    }

    /* === FOOTER === */
    .footer-text {
      text-align: center;
      font-size: 9px;
      color: #bbb;
      letter-spacing: 0.5px;
      padding: 4px 0;
    }

    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    
    <!-- TOP -->
    <div class="top-row">
      <div class="contact-card">
        <img src="${vCardQrUrl}" alt="QR">
        <div class="contact-info">
          <div class="contact-name">Nir Ram</div>
          <div class="contact-title">Founder & CEO</div>
          <div class="contact-detail">052-265-3170</div>
          <div class="contact-detail">nir@i4iguana.com</div>
          <div class="contact-hint">סרוק להוספת איש קשר</div>
        </div>
      </div>
      <div class="venue-tag">Archie Bar - Ashkelon 📍</div>
    </div>
    
    <!-- CENTER -->
    <div class="center-area">
      <div class="logo-circle">
        <div class="logo-inner">
          <img src="${iguanaRadarImg}" alt="I4IGUANA">
        </div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    
    <!-- TAGLINE -->
    <div class="tagline-area">
      <div class="main-slogan">היא <span class="green">מחליטה</span> ראשונה!</div>
      <div class="sub-slogan">מצאו מישהו כאן, עכשיו.</div>
      <div class="realtime-btn">✨ הכרויות בזמן אמת <div class="dot"></div></div>
    </div>
    
    <!-- QR CODES -->
    <div class="qr-row">
      <div class="qr-box">
        <div class="qr-num">1</div>
        <img src="${appQrUrl}" alt="App">
        <div class="qr-text">📱 הורד את האפליקציה</div>
      </div>
      <div class="qr-box">
        <div class="qr-num">2</div>
        <img src="${venueQrApi}" alt="Venue">
        <div class="qr-text">📍 סרוק כאן להצטרפות</div>
      </div>
    </div>
    
    <!-- FOOTER -->
    <div class="footer-text">Dating App for Real Meetings</div>
  </div>
</body>
</html>`
    }

    // ═══════════════════════════════════════════════════════════════
    // ENGLISH VERSION
    // ═══════════════════════════════════════════════════════════════
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - Sticker</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px;
    }
    
    .sticker {
      width: 20cm;
      height: 20cm;
      background: white;
      border-radius: 18px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .sticker::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 4px solid #4ade80;
      border-radius: 18px;
      pointer-events: none;
    }
    
    .corner {
      position: absolute;
      width: 28px;
      height: 28px;
      border: 3px solid #4ade80;
    }
    .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; border-radius: 6px 0 0 0; }
    .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; border-radius: 0 6px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; border-radius: 0 0 0 6px; }
    .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; border-radius: 0 0 6px 0; }

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 4px 8px;
    }
    
    .venue-tag {
      border: 2px solid #4ade80;
      border-radius: 18px;
      padding: 8px 14px;
      background: white;
      font-size: 13px;
      font-weight: 600;
      color: #166534;
    }
    
    .contact-card {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 2px solid #4ade80;
      border-radius: 10px;
      padding: 8px 10px;
      background: white;
    }
    
    .contact-card img {
      width: 48px;
      height: 48px;
      border-radius: 4px;
    }
    
    .contact-info {
      text-align: left;
    }
    
    .contact-name {
      font-size: 13px;
      font-weight: 700;
      color: #0d2920;
    }
    
    .contact-title {
      font-size: 10px;
      color: #4ade80;
      font-weight: 600;
    }
    
    .contact-detail {
      font-size: 9px;
      color: #555;
      line-height: 1.4;
    }
    
    .contact-hint {
      font-size: 7px;
      color: #999;
      margin-top: 2px;
    }

    .center-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 0;
    }
    
    .logo-circle {
      width: 160px;
      height: 160px;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    
    .logo-inner {
      width: 130px;
      height: 130px;
      border-radius: 14px;
      overflow: hidden;
    }
    
    .logo-inner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .brand-name {
      font-size: 30px;
      font-weight: 900;
      color: #0d2920;
      margin-top: 6px;
      letter-spacing: 2px;
    }
    
    .brand-name span {
      color: #4ade80;
    }

    .tagline-area {
      text-align: center;
      padding: 4px 0;
    }
    
    .main-slogan {
      font-size: 24px;
      font-weight: 900;
      color: #0d2920;
    }
    
    .main-slogan .green {
      color: #4ade80;
    }
    
    .sub-slogan {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
    
    .realtime-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 7px 18px;
      border-radius: 18px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 8px;
    }
    
    .realtime-btn .dot {
      width: 7px;
      height: 7px;
      background: #0d2920;
      border-radius: 50%;
    }

    .qr-row {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding: 8px 0;
    }
    
    .qr-box {
      text-align: center;
      background: #f8f8f8;
      padding: 10px;
      border-radius: 12px;
      border: 2px solid #eee;
    }
    
    .qr-num {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      font-size: 13px;
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -18px auto 5px;
    }
    
    .qr-box img {
      width: 110px;
      height: 110px;
      border-radius: 6px;
    }
    
    .qr-text {
      font-size: 10px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 5px;
    }

    .footer-text {
      text-align: center;
      font-size: 9px;
      color: #bbb;
      letter-spacing: 0.5px;
      padding: 4px 0;
    }

    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    
    <!-- TOP -->
    <div class="top-row">
      <div class="venue-tag">📍 ${venue.displayName || venue.name}</div>
      <div class="contact-card">
        <img src="${vCardQrUrl}" alt="QR">
        <div class="contact-info">
          <div class="contact-name">Nir Ram</div>
          <div class="contact-title">Founder & CEO</div>
          <div class="contact-detail">052-265-3170</div>
          <div class="contact-detail">nir@i4iguana.com</div>
          <div class="contact-hint">Scan to save contact</div>
        </div>
      </div>
    </div>
    
    <!-- CENTER -->
    <div class="center-area">
      <div class="logo-circle">
        <div class="logo-inner">
          <img src="${iguanaRadarImg}" alt="I4IGUANA">
        </div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    
    <!-- TAGLINE -->
    <div class="tagline-area">
      <div class="main-slogan"><span class="green">She Decides</span> First!</div>
      <div class="sub-slogan">Find someone here, right now.</div>
      <div class="realtime-btn">✨ Real-time Dating <div class="dot"></div></div>
    </div>
    
    <!-- QR CODES -->
    <div class="qr-row">
      <div class="qr-box">
        <div class="qr-num">1</div>
        <img src="${appQrUrl}" alt="App">
        <div class="qr-text">📱 Download the App</div>
      </div>
      <div class="qr-box">
        <div class="qr-num">2</div>
        <img src="${venueQrApi}" alt="Venue">
        <div class="qr-text">📍 Scan to Check In</div>
      </div>
    </div>
    
    <!-- FOOTER -->
    <div class="footer-text">Dating App for Real Meetings</div>
  </div>
</body>
</html>`
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

  const previewHTML = selectedVenueData ? generateStickerHTML(selectedVenueData, language) : ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-[#1a4d3e] p-4 md:p-8">
      <div className="max-w-6xl mx-auto mb-8">
        <Link href="/admin/super/control" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft className="w-5 h-5" /> Back to Control Panel
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#4ade80]/20 rounded-xl">
            <QrCode className="w-8 h-8 text-[#4ade80]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Sticker Generator</h1>
            <p className="text-white/60">Create printable venue stickers (20×20 cm)</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#4ade80]" /> Select Venue
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-[#4ade80] animate-spin" />
              </div>
            ) : (
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="w-full bg-[#0d2920] border border-[#4ade80]/30 rounded-xl px-4 py-3 text-white"
              >
                <option value="">Choose a venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>{venue.displayName || venue.name}</option>
                ))}
              </select>
            )}
            <p className="text-white/40 text-sm mt-2">{venues.length} venues available</p>
          </div>

          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4ade80]" /> Language
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage('hebrew')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${language === 'hebrew' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30'}`}
              >
                🇮🇱 עברית
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${language === 'english' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30'}`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                disabled={!selectedVenue}
                className="w-full flex items-center justify-center gap-2 bg-[#4ade80] hover:bg-[#3bc970] disabled:bg-gray-600 text-[#0d2920] font-bold py-3 px-4 rounded-xl"
              >
                <Printer className="w-5 h-5" /> Print Sticker
              </button>
              <button
                onClick={handleDownload}
                disabled={!selectedVenue}
                className="w-full flex items-center justify-center gap-2 bg-[#0d2920] disabled:bg-gray-600 text-white/80 font-bold py-3 px-4 rounded-xl border border-[#4ade80]/30"
              >
                <Download className="w-5 h-5" /> Download HTML
              </button>
            </div>
            <p className="text-white/40 text-sm mt-4 text-center">Sticker size: 20×20 cm</p>
          </div>
        </div>

        <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
          <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
          {selectedVenueData ? (
            <div className="bg-gray-200 rounded-xl overflow-hidden aspect-square">
              <iframe ref={iframeRef} srcDoc={previewHTML} className="w-full h-full border-0" title="Preview" />
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
