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
            qrCodeUrl: data.qrCodeUrl || '',
            address: data.address || '',
            city: data.city || ''
          })
        })
        
        venuesList.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
        setVenues(venuesList)
      } catch (error) {
        console.error('❌ Error loading venues:', error)
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
    const iguanaImg = 'https://i4iguana-app.vercel.app/notification-icon-192.png'
    
    // vCard QR for business card
    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Nir Ram
ORG:I4IGUANA
TITLE:Founder & CEO
TEL;TYPE=CELL:052-265-3170
EMAIL:nir@i4iguana.com
URL:https://i4iguana.com
END:VCARD`
    const vCardQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vCardData)}&color=0d2920`
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HEBREW VERSION - EXACT ORIGINAL DESIGN
    // ═══════════════════════════════════════════════════════════════════════════
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
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .sticker {
      width: 15cm;
      height: 21cm;
      background: white;
      border-radius: 20px;
      padding: 0.5cm;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    
    .sticker::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border: 4px solid #4ade80;
      border-radius: 20px;
      pointer-events: none;
    }
    
    .corner {
      position: absolute;
      width: 35px;
      height: 35px;
      border: 3px solid #4ade80;
    }
    .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
    .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
    .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
    
    /* ═══ TOP SECTION ═══ */
    .top-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0.3cm 0.4cm;
      z-index: 1;
    }
    
    /* Business Card with QR - LEFT SIDE */
    .business-card {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1.5px solid #4ade80;
      border-radius: 12px;
      padding: 8px 10px;
      background: white;
    }
    
    .business-qr {
      width: 55px;
      height: 55px;
      border-radius: 6px;
    }
    
    .business-info {
      text-align: right;
    }
    
    .business-name {
      font-size: 12px;
      font-weight: 700;
      color: #0d2920;
    }
    
    .business-title {
      font-size: 9px;
      color: #4ade80;
      font-weight: 600;
    }
    
    .business-contact {
      font-size: 8px;
      color: #555;
      margin-top: 1px;
    }
    
    .business-label {
      font-size: 7px;
      color: #999;
      margin-top: 2px;
    }
    
    /* Venue Badge - RIGHT SIDE */
    .venue-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: white;
      border: 1.5px solid #4ade80;
      border-radius: 20px;
      padding: 8px 14px;
    }
    
    .venue-badge span {
      font-size: 12px;
      font-weight: 600;
      color: #166534;
    }
    
    /* ═══ LOGO SECTION ═══ */
    .logo-section {
      text-align: center;
      margin: 0.3cm 0 0.2cm;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .iguana-container {
      width: 5.5cm;
      height: 5.5cm;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      background: white;
    }
    
    .iguana-inner {
      width: 4.5cm;
      height: 4.5cm;
      border-radius: 12px;
      border: 2px solid #4ade80;
      background: linear-gradient(135deg, #0a1f18, #143028);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    .iguana-inner::before {
      content: '(((';
      position: absolute;
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
      font-weight: 300;
      color: #4ade80;
      opacity: 0.8;
      letter-spacing: -4px;
    }
    
    .iguana-inner::after {
      content: ')))';
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
      font-weight: 300;
      color: #4ade80;
      opacity: 0.8;
      letter-spacing: -4px;
    }
    
    .iguana-img {
      width: 3.2cm;
      height: 3.2cm;
      object-fit: contain;
      position: relative;
      z-index: 1;
    }
    
    .app-name {
      font-size: 28px;
      font-weight: 900;
      color: #0d2920;
      letter-spacing: 2px;
      margin-top: 0.2cm;
    }
    
    .app-name span {
      color: #4ade80;
    }
    
    /* ═══ TAGLINE SECTION ═══ */
    .tagline-section {
      text-align: center;
      margin: 0.15cm 0;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .main-tagline {
      font-size: 24px;
      font-weight: 900;
      color: #0d2920;
    }
    
    .main-tagline .highlight {
      color: #4ade80;
    }
    
    .sub-tagline {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
    
    .realtime-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 8px;
    }
    
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: #0d2920;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    
    /* ═══ QR SECTION ═══ */
    .qr-section {
      display: flex;
      justify-content: center;
      gap: 0.8cm;
      margin: 0.3cm 0;
      z-index: 1;
      flex-grow: 1;
      align-items: center;
    }
    
    .qr-box {
      text-align: center;
      background: #fafafa;
      padding: 0.3cm;
      border-radius: 14px;
      border: 1.5px solid #e5e5e5;
    }
    
    .qr-box img {
      width: 4cm;
      height: 4cm;
      border-radius: 8px;
    }
    
    .qr-label {
      font-size: 11px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 0.12cm;
    }
    
    .qr-step {
      font-size: 14px;
      font-weight: 800;
      color: white;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -0.3cm auto 0.08cm;
      box-shadow: 0 2px 8px rgba(74, 222, 128, 0.4);
    }
    
    /* ═══ FOOTER ═══ */
    .footer {
      text-align: center;
      padding: 0.15cm 0;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .footer-text {
      font-size: 10px;
      color: #aaa;
      letter-spacing: 0.5px;
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
    
    <!-- TOP: Business Card (left) + Venue (right) -->
    <div class="top-section">
      <div class="business-card">
        <img src="${vCardQrUrl}" alt="Contact QR" class="business-qr">
        <div class="business-info">
          <div class="business-name">Nir Ram</div>
          <div class="business-title">Founder & CEO</div>
          <div class="business-contact">052-265-3170</div>
          <div class="business-contact">nir@i4iguana.com</div>
          <div class="business-label">סרוק להוספת איש קשר</div>
        </div>
      </div>
      <div class="venue-badge">
        <span>Archie Bar - Ashkelon 📍</span>
      </div>
    </div>
    
    <!-- LOGO -->
    <div class="logo-section">
      <div class="iguana-container">
        <div class="iguana-inner">
          <img src="${iguanaImg}" alt="I4IGUANA" class="iguana-img">
        </div>
      </div>
      <div class="app-name"><span>I4</span>IGUANA</div>
    </div>
    
    <!-- TAGLINE -->
    <div class="tagline-section">
      <div class="main-tagline">היא <span class="highlight">מחליטה</span> ראשונה!</div>
      <div class="sub-tagline">מצאו מישהו כאן, עכשיו.</div>
      <div class="realtime-badge">
        ✨ זיווגים בזמן אמת
        <div class="pulse-dot"></div>
      </div>
    </div>
    
    <!-- QR CODES -->
    <div class="qr-section">
      <div class="qr-box">
        <div class="qr-step">1</div>
        <img src="${appQrUrl}" alt="הורד אפליקציה">
        <div class="qr-label">📱 הורד את האפליקציה</div>
      </div>
      <div class="qr-box">
        <div class="qr-step">2</div>
        <img src="${venueQrApi}" alt="צ'ק אין">
        <div class="qr-label">📍 סרוק כאן להצטרפות</div>
      </div>
    </div>
    
    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-text">Dating App for Real Meetings</div>
    </div>
  </div>
</body>
</html>`
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ENGLISH VERSION
    // ═══════════════════════════════════════════════════════════════════════════
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
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .sticker {
      width: 15cm;
      height: 21cm;
      background: white;
      border-radius: 20px;
      padding: 0.5cm;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    
    .sticker::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border: 4px solid #4ade80;
      border-radius: 20px;
      pointer-events: none;
    }
    
    .corner {
      position: absolute;
      width: 35px;
      height: 35px;
      border: 3px solid #4ade80;
    }
    .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
    .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
    .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
    
    .top-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0.3cm 0.4cm;
      z-index: 1;
    }
    
    .business-card {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1.5px solid #4ade80;
      border-radius: 12px;
      padding: 8px 10px;
      background: white;
    }
    
    .business-qr {
      width: 55px;
      height: 55px;
      border-radius: 6px;
    }
    
    .business-info {
      text-align: left;
    }
    
    .business-name {
      font-size: 12px;
      font-weight: 700;
      color: #0d2920;
    }
    
    .business-title {
      font-size: 9px;
      color: #4ade80;
      font-weight: 600;
    }
    
    .business-contact {
      font-size: 8px;
      color: #555;
      margin-top: 1px;
    }
    
    .business-label {
      font-size: 7px;
      color: #999;
      margin-top: 2px;
    }
    
    .venue-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: white;
      border: 1.5px solid #4ade80;
      border-radius: 20px;
      padding: 8px 14px;
    }
    
    .venue-badge span {
      font-size: 12px;
      font-weight: 600;
      color: #166534;
    }
    
    .logo-section {
      text-align: center;
      margin: 0.3cm 0 0.2cm;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .iguana-container {
      width: 5.5cm;
      height: 5.5cm;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      background: white;
    }
    
    .iguana-inner {
      width: 4.5cm;
      height: 4.5cm;
      border-radius: 12px;
      border: 2px solid #4ade80;
      background: linear-gradient(135deg, #0a1f18, #143028);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    .iguana-inner::before {
      content: '(((';
      position: absolute;
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
      font-weight: 300;
      color: #4ade80;
      opacity: 0.8;
      letter-spacing: -4px;
    }
    
    .iguana-inner::after {
      content: ')))';
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
      font-weight: 300;
      color: #4ade80;
      opacity: 0.8;
      letter-spacing: -4px;
    }
    
    .iguana-img {
      width: 3.2cm;
      height: 3.2cm;
      object-fit: contain;
      position: relative;
      z-index: 1;
    }
    
    .app-name {
      font-size: 28px;
      font-weight: 900;
      color: #0d2920;
      letter-spacing: 2px;
      margin-top: 0.2cm;
    }
    
    .app-name span {
      color: #4ade80;
    }
    
    .tagline-section {
      text-align: center;
      margin: 0.15cm 0;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .main-tagline {
      font-size: 24px;
      font-weight: 900;
      color: #0d2920;
    }
    
    .main-tagline .highlight {
      color: #4ade80;
    }
    
    .sub-tagline {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
    
    .realtime-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 8px;
    }
    
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: #0d2920;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    
    .qr-section {
      display: flex;
      justify-content: center;
      gap: 0.8cm;
      margin: 0.3cm 0;
      z-index: 1;
      flex-grow: 1;
      align-items: center;
    }
    
    .qr-box {
      text-align: center;
      background: #fafafa;
      padding: 0.3cm;
      border-radius: 14px;
      border: 1.5px solid #e5e5e5;
    }
    
    .qr-box img {
      width: 4cm;
      height: 4cm;
      border-radius: 8px;
    }
    
    .qr-label {
      font-size: 11px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 0.12cm;
    }
    
    .qr-step {
      font-size: 14px;
      font-weight: 800;
      color: white;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -0.3cm auto 0.08cm;
      box-shadow: 0 2px 8px rgba(74, 222, 128, 0.4);
    }
    
    .footer {
      text-align: center;
      padding: 0.15cm 0;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .footer-text {
      font-size: 10px;
      color: #aaa;
      letter-spacing: 0.5px;
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
    
    <div class="top-section">
      <div class="business-card">
        <img src="${vCardQrUrl}" alt="Contact QR" class="business-qr">
        <div class="business-info">
          <div class="business-name">Nir Ram</div>
          <div class="business-title">Founder & CEO</div>
          <div class="business-contact">052-265-3170</div>
          <div class="business-contact">nir@i4iguana.com</div>
          <div class="business-label">Scan to save contact</div>
        </div>
      </div>
      <div class="venue-badge">
        <span>📍 ${venue.displayName || venue.name}</span>
      </div>
    </div>
    
    <div class="logo-section">
      <div class="iguana-container">
        <div class="iguana-inner">
          <img src="${iguanaImg}" alt="I4IGUANA" class="iguana-img">
        </div>
      </div>
      <div class="app-name"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="tagline-section">
      <div class="main-tagline"><span class="highlight">She Decides</span> First!</div>
      <div class="sub-tagline">Find someone here, right now.</div>
      <div class="realtime-badge">
        ✨ Real-time Matching
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
    
    <div class="footer">
      <div class="footer-text">Dating App for Real Meetings</div>
    </div>
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
            <p className="text-white/60">Create printable venue stickers</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
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
            
            <p className="text-white/40 text-sm mt-2">{venues.length} venues available</p>
          </div>

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
              Sticker size: 15×21 cm (A5)
            </p>
          </div>
        </div>

        <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
          <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
          
          {selectedVenueData ? (
            <div className="bg-gray-200 rounded-xl overflow-hidden" style={{ aspectRatio: '15/21' }}>
              <iframe
                ref={iframeRef}
                srcDoc={previewHTML}
                className="w-full h-full border-0"
                title="Sticker Preview"
              />
            </div>
          ) : (
            <div className="bg-[#0d2920] rounded-xl flex items-center justify-center" style={{ aspectRatio: '15/21' }}>
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
