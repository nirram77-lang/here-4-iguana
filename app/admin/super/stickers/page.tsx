'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Printer, Download, RefreshCw, Building2, QrCode, Sparkles, Target, Sun, Moon, Smartphone } from 'lucide-react'
import Link from 'next/link'

interface Venue {
  id: string
  name: string
  displayName?: string
}

type TemplateType = 'venue' | 'club-owners' | 'customers-dark' | 'customers-light' | 'challenge-card' | 'download-only' | 'download-only-light' | 'discreet-dating' | 'pride-edition' | 'same-connection'

export default function StickerGeneratorPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew')
  const [template, setTemplate] = useState<TemplateType>('download-only')
  const [loading, setLoading] = useState(true)
  const [challengeVariant, setChallengeVariant] = useState(0)
  const [cardStyle, setCardStyle] = useState<'light' | 'full'>('light')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // ✅ URL יחיד לכל הסטיקרים - דף הנחיתה!
  const DOWNLOAD_URL = 'https://www.i4iguana.com/download'
  const QR_API = 'https://api.qrserver.com/v1/create-qr-code/'

  useEffect(() => {
    const loadVenues = async () => {
      console.log('🔄 Loading venues...')
      try {
        const venuesSnapshot = await getDocs(collection(db, 'venues'))
        console.log('📊 Venues snapshot size:', venuesSnapshot.size)
        const venuesList: Venue[] = []
        venuesSnapshot.forEach((doc) => {
          const data = doc.data()
          console.log('📍 Venue found:', doc.id, data.name || data.displayName)
          venuesList.push({
            id: doc.id,
            name: data.name || doc.id,
            displayName: data.displayName || data.name || doc.id,
          })
        })
        venuesList.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
        setVenues(venuesList)
        console.log('✅ Venues loaded:', venuesList.length)
      } catch (error) {
        console.error('❌ Error loading venues:', error)
      } finally {
        setLoading(false)
      }
    }
    loadVenues()
  }, [])

  // ═══════════════════════════════════════════════════════════════
  // 🆕 DOWNLOAD ONLY - QR יחיד לדף הנחיתה
  // ═══════════════════════════════════════════════════════════════
  const generateDownloadOnlyHTML = () => {
    const qrUrl = `${QR_API}?size=400x400&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920&bgcolor=ffffff`
    const iguanaRadarImg = 'https://www.i4iguana.com/iguana-radar.jpg'
    const selectedVenueData = venues.find(v => v.id === selectedVenue)
    const venueName = selectedVenueData?.displayName || selectedVenueData?.name || ''

    const hebrewHTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - סרוק והתחל!</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 30px rgba(74, 222, 128, 0.3); } 50% { box-shadow: 0 0 60px rgba(74, 222, 128, 0.6); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #1a4d3e 0%, #0d2920 50%, #051410 100%);
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      border: 4px solid #4ade80;
      animation: glow 3s ease-in-out infinite;
      overflow: hidden;
    }
    /* Decorative Elements */
    .sparkle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      opacity: 0.5;
    }
    .sparkle:nth-child(1) { top: 10%; left: 15%; animation: pulse 2s infinite; }
    .sparkle:nth-child(2) { top: 20%; right: 20%; animation: pulse 2s infinite 0.3s; }
    .sparkle:nth-child(3) { bottom: 25%; left: 10%; animation: pulse 2s infinite 0.6s; }
    .sparkle:nth-child(4) { bottom: 15%; right: 15%; animation: pulse 2s infinite 0.9s; }
    
    /* Header */
    .header {
      text-align: center;
      z-index: 1;
    }
    .venue-tag {
      display: inline-block;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 10px 24px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .logo-img, .logo-container { background: linear-gradient(135deg, #0d2920, #1a4d3e); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(74, 222, 128, 0.4); } .logo-emoji { font-size: 36px; } .logo-img-old {
      width: 70px;
      height: 70px;
      border-radius: 18px;
      border: 3px solid #4ade80;
      animation: float 3s ease-in-out infinite;
    }
    .brand {
      font-size: 52px;
      font-weight: 900;
      color: white;
    }
    .brand span { color: #4ade80; }
    .tagline {
      color: rgba(255,255,255,0.8);
      font-size: 20px;
      font-weight: 500;
    }
    
    /* Main QR Section */
    .qr-section {
      text-align: center;
      z-index: 1;
    }
    .qr-title {
      font-size: 28px;
      font-weight: 800;
      color: white;
      margin-bottom: 16px;
    }
    .qr-title .emoji { font-size: 32px; }
    .qr-frame {
      background: white;
      padding: 20px;
      border-radius: 24px;
      display: inline-block;
      animation: pulse 3s ease-in-out infinite;
      box-shadow: 0 10px 40px rgba(74, 222, 128, 0.4);
    }
    .qr-img {
      width: 220px;
      height: 220px;
      border-radius: 12px;
    }
    .qr-hint {
      color: #4ade80;
      font-size: 18px;
      font-weight: 700;
      margin-top: 16px;
    }
    
    /* Features */
    .features {
      display: flex;
      gap: 20px;
      z-index: 1;
    }
    .feature {
      text-align: center;
      padding: 12px 20px;
      background: rgba(74, 222, 128, 0.1);
      border: 2px solid rgba(74, 222, 128, 0.3);
      border-radius: 16px;
    }
    .feature-emoji { font-size: 28px; margin-bottom: 6px; }
    .feature-text { color: white; font-size: 13px; font-weight: 600; }
    
    /* Footer */
    .footer {
      text-align: center;
      z-index: 1;
    }
    .footer-main {
      font-size: 26px;
      font-weight: 900;
      color: #4ade80;
    }
    .footer-sub {
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      margin-top: 4px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    
    <div class="header">
      ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
      <div class="logo-row">
        <div class="logo-container"><div class="logo-emoji">🦎</div></div>
        <div class="brand"><span>I4</span>IGUANA</div>
      </div>
      <div class="tagline">✨ הכרויות בזמן אמת ✨</div>
    </div>
    
    <div class="qr-section">
      <div class="qr-title"><span class="emoji">📱</span> סרקו והתחילו!</div>
      <div class="qr-frame">
        <img src="${qrUrl}" class="qr-img" alt="QR Code">
      </div>
      <div class="qr-hint">👆 סריקה אחת = כניסה לעולם הקסום</div>
    </div>
    
    <div class="features">
      <div class="feature">
        <div class="feature-emoji">💕</div>
        <div class="feature-text">היא מחליטה</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">📍</div>
        <div class="feature-text">פה ועכשיו</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">⏰</div>
        <div class="feature-text">10 דקות למפגש</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-main">🦎 מצא/י מישהו כאן, עכשיו!</div>
      <div class="footer-sub">i4iguana.com</div>
    </div>
  </div>
</body>
</html>`

    const englishHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - Scan & Start!</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 30px rgba(74, 222, 128, 0.3); } 50% { box-shadow: 0 0 60px rgba(74, 222, 128, 0.6); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    body {
      font-family: "Poppins", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #1a4d3e 0%, #0d2920 50%, #051410 100%);
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      border: 4px solid #4ade80;
      animation: glow 3s ease-in-out infinite;
      overflow: hidden;
    }
    .sparkle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      opacity: 0.5;
    }
    .sparkle:nth-child(1) { top: 10%; left: 15%; animation: pulse 2s infinite; }
    .sparkle:nth-child(2) { top: 20%; right: 20%; animation: pulse 2s infinite 0.3s; }
    .sparkle:nth-child(3) { bottom: 25%; left: 10%; animation: pulse 2s infinite 0.6s; }
    .sparkle:nth-child(4) { bottom: 15%; right: 15%; animation: pulse 2s infinite 0.9s; }
    
    .header { text-align: center; z-index: 1; }
    .venue-tag {
      display: inline-block;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 10px 24px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .logo-img, .logo-container { background: linear-gradient(135deg, #0d2920, #1a4d3e); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(74, 222, 128, 0.4); } .logo-emoji { font-size: 36px; } .logo-img-old {
      width: 70px;
      height: 70px;
      border-radius: 18px;
      border: 3px solid #4ade80;
      animation: float 3s ease-in-out infinite;
    }
    .brand { font-size: 52px; font-weight: 900; color: white; }
    .brand span { color: #4ade80; }
    .tagline { color: rgba(255,255,255,0.8); font-size: 20px; font-weight: 500; }
    
    .qr-section { text-align: center; z-index: 1; }
    .qr-title { font-size: 28px; font-weight: 800; color: white; margin-bottom: 16px; }
    .qr-title .emoji { font-size: 32px; }
    .qr-frame {
      background: white;
      padding: 20px;
      border-radius: 24px;
      display: inline-block;
      animation: pulse 3s ease-in-out infinite;
      box-shadow: 0 10px 40px rgba(74, 222, 128, 0.4);
    }
    .qr-img { width: 220px; height: 220px; border-radius: 12px; }
    .qr-hint { color: #4ade80; font-size: 18px; font-weight: 700; margin-top: 16px; }
    
    .features { display: flex; gap: 20px; z-index: 1; }
    .feature {
      text-align: center;
      padding: 12px 20px;
      background: rgba(74, 222, 128, 0.1);
      border: 2px solid rgba(74, 222, 128, 0.3);
      border-radius: 16px;
    }
    .feature-emoji { font-size: 28px; margin-bottom: 6px; }
    .feature-text { color: white; font-size: 13px; font-weight: 600; }
    
    .footer { text-align: center; z-index: 1; }
    .footer-main { font-size: 26px; font-weight: 900; color: #4ade80; }
    .footer-sub { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 4px; }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    
    <div class="header">
      ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
      <div class="logo-row">
        <div class="logo-container"><div class="logo-emoji">🦎</div></div>
        <div class="brand"><span>I4</span>IGUANA</div>
      </div>
      <div class="tagline">✨ Real-time Dating ✨</div>
    </div>
    
    <div class="qr-section">
      <div class="qr-title"><span class="emoji">📱</span> Scan & Start!</div>
      <div class="qr-frame">
        <img src="${qrUrl}" class="qr-img" alt="QR Code">
      </div>
      <div class="qr-hint">👆 One scan = Enter the magic!</div>
    </div>
    
    <div class="features">
      <div class="feature">
        <div class="feature-emoji">💕</div>
        <div class="feature-text">She Decides</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">📍</div>
        <div class="feature-text">Here & Now</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">⏰</div>
        <div class="feature-text">10 Min to Meet</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-main">🦎 Find Someone Here, Now!</div>
      <div class="footer-sub">i4iguana.com</div>
    </div>
  </div>
</body>
</html>`

    return language === 'hebrew' ? hebrewHTML : englishHTML
  }

  // ═══════════════════════════════════════════════════════════════
  // DOWNLOAD ONLY LIGHT - רקע לבן לחיסכון בדיו
  // ═══════════════════════════════════════════════════════════════
  const generateDownloadOnlyLightHTML = () => {
    const qrUrl = `${QR_API}?size=400x400&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920&bgcolor=ffffff`
    const selectedVenueData = venues.find(v => v.id === selectedVenue)
    const venueName = selectedVenueData?.displayName || selectedVenueData?.name || ''

    const hebrewHTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - סרוק והתחל!</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: #ffffff;
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      border: 4px solid #22c55e;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1);
    }
    
    /* Header */
    .header {
      text-align: center;
    }
    .venue-tag {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 10px 24px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .logo-container {
      width: 70px;
      height: 70px;
      border-radius: 18px;
      border: 3px solid #22c55e;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
    }
    .logo-emoji { font-size: 36px; }
    .brand {
      font-size: 52px;
      font-weight: 900;
      color: #0d2920;
    }
    .brand span { color: #22c55e; }
    .tagline {
      color: #666;
      font-size: 20px;
      font-weight: 500;
    }
    
    /* Main QR Section */
    .qr-section {
      text-align: center;
    }
    .qr-title {
      font-size: 28px;
      font-weight: 800;
      color: #0d2920;
      margin-bottom: 16px;
    }
    .qr-title .emoji { font-size: 32px; }
    .qr-frame {
      background: white;
      padding: 20px;
      border-radius: 24px;
      display: inline-block;
      box-shadow: 0 8px 30px rgba(34, 197, 94, 0.2);
      border: 3px solid #22c55e;
    }
    .qr-img {
      width: 220px;
      height: 220px;
      border-radius: 12px;
    }
    .qr-hint {
      color: #22c55e;
      font-size: 18px;
      font-weight: 700;
      margin-top: 16px;
    }
    
    /* Features */
    .features {
      display: flex;
      gap: 20px;
    }
    .feature {
      text-align: center;
      padding: 12px 20px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-radius: 16px;
      border: 2px solid #22c55e;
    }
    .feature-emoji { font-size: 28px; }
    .feature-text {
      font-size: 14px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 4px;
    }
    
    /* Footer */
    .footer {
      text-align: center;
    }
    .footer-main {
      color: #0d2920;
      font-size: 16px;
      font-weight: 700;
    }
    .footer-sub {
      color: #22c55e;
      font-size: 14px;
      font-weight: 600;
      margin-top: 4px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="header">
      ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
      <div class="logo-row">
        <div class="logo-container"><div class="logo-emoji">🦎</div></div>
        <div class="brand"><span>I4</span>IGUANA</div>
      </div>
      <div class="tagline">✨ הכרויות בזמן אמת ✨</div>
    </div>
    
    <div class="qr-section">
      <div class="qr-title"><span class="emoji">📱</span> סרקו והתחילו!</div>
      <div class="qr-frame">
        <img src="${qrUrl}" class="qr-img" alt="QR Code">
      </div>
      <div class="qr-hint">👆 סריקה אחת = כניסה לעולם הקסום</div>
    </div>
    
    <div class="features">
      <div class="feature">
        <div class="feature-emoji">💕</div>
        <div class="feature-text">היא מחליטה</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">📍</div>
        <div class="feature-text">פה ועכשיו</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">⏰</div>
        <div class="feature-text">10 דקות למפגש</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-main">🦎 מצא/י מישהו כאן, עכשיו!</div>
      <div class="footer-sub">i4iguana.com</div>
    </div>
  </div>
</body>
</html>`

    const englishHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - Scan & Start!</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Poppins", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: #ffffff;
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      border: 4px solid #22c55e;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1);
    }
    
    /* Header */
    .header {
      text-align: center;
    }
    .venue-tag {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 10px 24px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .logo-container {
      width: 70px;
      height: 70px;
      border-radius: 18px;
      border: 3px solid #22c55e;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
    }
    .logo-emoji { font-size: 36px; }
    .brand {
      font-size: 52px;
      font-weight: 900;
      color: #0d2920;
    }
    .brand span { color: #22c55e; }
    .tagline {
      color: #666;
      font-size: 20px;
      font-weight: 500;
    }
    
    /* Main QR Section */
    .qr-section {
      text-align: center;
    }
    .qr-title {
      font-size: 28px;
      font-weight: 800;
      color: #0d2920;
      margin-bottom: 16px;
    }
    .qr-title .emoji { font-size: 32px; }
    .qr-frame {
      background: white;
      padding: 20px;
      border-radius: 24px;
      display: inline-block;
      box-shadow: 0 8px 30px rgba(34, 197, 94, 0.2);
      border: 3px solid #22c55e;
    }
    .qr-img {
      width: 220px;
      height: 220px;
      border-radius: 12px;
    }
    .qr-hint {
      color: #22c55e;
      font-size: 18px;
      font-weight: 700;
      margin-top: 16px;
    }
    
    /* Features */
    .features {
      display: flex;
      gap: 20px;
    }
    .feature {
      text-align: center;
      padding: 12px 20px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-radius: 16px;
      border: 2px solid #22c55e;
    }
    .feature-emoji { font-size: 28px; }
    .feature-text {
      font-size: 14px;
      font-weight: 700;
      color: #0d2920;
      margin-top: 4px;
    }
    
    /* Footer */
    .footer {
      text-align: center;
    }
    .footer-main {
      color: #0d2920;
      font-size: 16px;
      font-weight: 700;
    }
    .footer-sub {
      color: #22c55e;
      font-size: 14px;
      font-weight: 600;
      margin-top: 4px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="header">
      ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
      <div class="logo-row">
        <div class="logo-container"><div class="logo-emoji">🦎</div></div>
        <div class="brand"><span>I4</span>IGUANA</div>
      </div>
      <div class="tagline">✨ Real-time Dating ✨</div>
    </div>
    
    <div class="qr-section">
      <div class="qr-title"><span class="emoji">📱</span> Scan & Start!</div>
      <div class="qr-frame">
        <img src="${qrUrl}" class="qr-img" alt="QR Code">
      </div>
      <div class="qr-hint">👆 One scan = Enter the magic</div>
    </div>
    
    <div class="features">
      <div class="feature">
        <div class="feature-emoji">💕</div>
        <div class="feature-text">She Decides</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">📍</div>
        <div class="feature-text">Here & Now</div>
      </div>
      <div class="feature">
        <div class="feature-emoji">⏰</div>
        <div class="feature-text">10 Min to Meet</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-main">🦎 Find Someone Here, Now!</div>
      <div class="footer-sub">i4iguana.com</div>
    </div>
  </div>
</body>
</html>`

    return language === 'hebrew' ? hebrewHTML : englishHTML
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMERS DARK STICKER (Green Background) - QR יחיד
  // ═══════════════════════════════════════════════════════════════
  const generateCustomersDarkHTML = () => {
    const qrUrl = `${QR_API}?size=250x250&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920&bgcolor=ffffff`
    const iguanaRadarImg = 'https://www.i4iguana.com/iguana-radar.jpg'
    const selectedVenueData = venues.find(v => v.id === selectedVenue)
    const venueName = selectedVenueData?.displayName || selectedVenueData?.name || ''

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - מדבקה ללקוחות</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes sparkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(74, 222, 128, 0.3); } 50% { box-shadow: 0 0 40px rgba(74, 222, 128, 0.6); } }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .venue-tag {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 14px;
      z-index: 1;
      margin-bottom: 10px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #1a4d3e 0%, #0d2920 50%, #051410 100%);
      border-radius: 24px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 28px;
      border: 3px solid #4ade80;
      animation: glow 3s ease-in-out infinite;
      overflow: hidden;
    }
    .sparkle {
      position: absolute;
      width: 6px;
      height: 6px;
      background: #4ade80;
      border-radius: 50%;
      animation: sparkle 2s ease-in-out infinite;
    }
    .sparkle:nth-child(1) { top: 8%; left: 12%; }
    .sparkle:nth-child(2) { top: 15%; right: 18%; animation-delay: 0.5s; }
    .sparkle:nth-child(3) { bottom: 20%; left: 8%; animation-delay: 1s; }
    .sparkle:nth-child(4) { bottom: 12%; right: 12%; animation-delay: 1.5s; }
    
    .hook {
      text-align: center;
      color: #4ade80;
      font-size: 22px;
      font-weight: 700;
      z-index: 1;
    }
    
    .center-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      z-index: 1;
    }
    .logo-circle {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 40px rgba(74, 222, 128, 0.4);
      border: 4px solid #4ade80;
    }
    .logo-emoji {
      font-size: 60px;
    }
    .brand-name {
      font-size: 48px;
      font-weight: 900;
      color: white;
    }
    .brand-name span { color: #4ade80; }
    
    .main-slogan {
      text-align: center;
      z-index: 1;
    }
    .slogan-text {
      font-size: 36px;
      font-weight: 900;
      color: white;
    }
    .slogan-text .highlight { color: #4ade80; }
    .sub-slogan {
      color: rgba(255,255,255,0.7);
      font-size: 18px;
      margin-top: 8px;
    }
    
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      z-index: 1;
    }
    .qr-label {
      color: white;
      font-size: 18px;
      font-weight: 700;
    }
    .qr-box {
      background: white;
      padding: 16px;
      border-radius: 20px;
      box-shadow: 0 8px 30px rgba(74, 222, 128, 0.3);
    }
    .qr-code {
      width: 180px;
      height: 180px;
      border-radius: 10px;
    }
    .qr-hint {
      color: #4ade80;
      font-size: 14px;
      font-weight: 600;
    }
    
    .footer-text {
      color: rgba(255,255,255,0.5);
      font-size: 12px;
      z-index: 1;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    
    <div class="hook">🦎 אפליקציית ההכרויות המהפכנית</div>
    
    <div class="center-section">
      ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
      <div class="logo-circle">
        <div class="logo-emoji">🦎</div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="main-slogan">
      <div class="slogan-text"><span class="highlight">היא מחליטה</span> ראשונה!</div>
      <div class="sub-slogan">✨ הכרויות בזמן אמת • פה ועכשיו ✨</div>
    </div>
    
    <div class="qr-section">
      <div class="qr-label">📱 סרקו והתחילו!</div>
      <div class="qr-box">
        <img src="${qrUrl}" class="qr-code" alt="QR Code">
      </div>
      <div class="qr-hint">סריקה אחת בלבד 👆</div>
    </div>
    
    <div class="footer-text">Dating App for Real Meetings • i4iguana.com</div>
  </div>
</body>
</html>`
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMERS LIGHT STICKER (White Background) - QR יחיד
  // ═══════════════════════════════════════════════════════════════
  const generateCustomersLightHTML = () => {
    const qrUrl = `${QR_API}?size=250x250&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920&bgcolor=ffffff`
    const iguanaRadarImg = 'https://www.i4iguana.com/iguana-radar.jpg'
    const selectedVenueData = venues.find(v => v.id === selectedVenue)
    const venueName = selectedVenueData?.displayName || selectedVenueData?.name || ''

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - מדבקה ללקוחות</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .venue-tag {
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      color: #4ade80;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #ffffff 0%, #f0fdf4 100%);
      border-radius: 24px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 28px;
      border: 3px solid #22c55e;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1);
    }
    .sticker::before {
      content: "";
      position: absolute;
      inset: 10px;
      border: 2px solid rgba(34, 197, 94, 0.5);
      border-radius: 18px;
      pointer-events: none;
    }
    
    .hook {
      text-align: center;
      color: #22c55e;
      font-size: 22px;
      font-weight: 700;
    }
    
    .center-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .logo-circle {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 40px rgba(13, 41, 32, 0.3);
      border: 4px solid #4ade80;
    }
    .logo-emoji {
      font-size: 60px;
    }
    .brand-name {
      font-size: 48px;
      font-weight: 900;
      color: #0d2920;
    }
    .brand-name span { color: #22c55e; }
    
    .main-slogan {
      text-align: center;
    }
    .slogan-text {
      font-size: 36px;
      font-weight: 900;
      color: #0d2920;
    }
    .slogan-text .highlight { color: #22c55e; }
    .sub-slogan {
      color: #666;
      font-size: 18px;
      margin-top: 8px;
    }
    
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .qr-label {
      color: #0d2920;
      font-size: 18px;
      font-weight: 700;
    }
    .qr-box {
      background: linear-gradient(135deg, #1a4d3e, #0d2920);
      padding: 10px;
      border-radius: 16px;
      border: 2px solid #4ade80;
      box-shadow: 0 4px 20px rgba(74, 222, 128, 0.2);
    }
    .qr-code {
      width: 180px;
      height: 180px;
      border-radius: 8px;
    }
    .qr-hint {
      color: #22c55e;
      font-size: 14px;
      font-weight: 600;
    }
    
    .footer-text {
      color: #aaa;
      font-size: 12px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="hook">🦎 אפליקציית ההכרויות המהפכנית</div>
    
    <div class="center-section">
      ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
      <div class="logo-circle">
        <div class="logo-emoji">🦎</div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="main-slogan">
      <div class="slogan-text"><span class="highlight">היא מחליטה</span> ראשונה!</div>
      <div class="sub-slogan">✨ הכרויות בזמן אמת • פה ועכשיו ✨</div>
    </div>
    
    <div class="qr-section">
      <div class="qr-label">📱 סרקו והתחילו!</div>
      <div class="qr-box">
        <img src="${qrUrl}" class="qr-code" alt="QR Code">
      </div>
      <div class="qr-hint">סריקה אחת בלבד 👆</div>
    </div>
    
    <div class="footer-text">Dating App for Real Meetings • i4iguana.com</div>
  </div>
</body>
</html>`
  }

  // ═══════════════════════════════════════════════════════════════
  // VENUE STICKER - למועדון ספציפי עם QR יחיד
  // ═══════════════════════════════════════════════════════════════
  const generateVenueStickerHTML = (venue: Venue) => {
    const qrUrl = `${QR_API}?size=200x200&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920`
    const iguanaRadarImg = 'https://www.i4iguana.com/iguana-radar.jpg'
    const vCardData = 'BEGIN:VCARD\\nVERSION:3.0\\nN:Ram;Nir\\nFN:Nir Ram\\nTITLE:Founder & CEO\\nORG:I4IGUANA\\nTEL:+972522653170\\nEMAIL:nir@i4iguana.com\\nURL:https://i4iguana.com\\nEND:VCARD'
    const vCardQrUrl = `${QR_API}?size=100x100&data=${encodeURIComponent(vCardData)}&color=0d2920`

    if (language === 'hebrew') {
      return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - ${venue.displayName || venue.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: white;
      border-radius: 18px;
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 16px 18px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .sticker::before {
      content: "";
      position: absolute;
      inset: 6px;
      border: 3px solid #4ade80;
      border-radius: 14px;
      pointer-events: none;
    }
    .corner {
      position: absolute;
      width: 30px;
      height: 30px;
    }
    .corner-tl { top: 4px; left: 4px; border-top: 4px solid #0d2920; border-left: 4px solid #0d2920; border-radius: 12px 0 0 0; }
    .corner-tr { top: 4px; right: 4px; border-top: 4px solid #0d2920; border-right: 4px solid #0d2920; border-radius: 0 12px 0 0; }
    .corner-bl { bottom: 4px; left: 4px; border-bottom: 4px solid #0d2920; border-left: 4px solid #0d2920; border-radius: 0 0 0 12px; }
    .corner-br { bottom: 4px; right: 4px; border-bottom: 4px solid #0d2920; border-right: 4px solid #0d2920; border-radius: 0 0 12px 0; }
    
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0 10px;
      margin-bottom: 10px;
    }
    .contact-card {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8f8f8;
      padding: 6px 10px;
      border-radius: 10px;
      border: 1px solid #eee;
    }
    .contact-card img {
      width: 50px;
      height: 50px;
      border-radius: 6px;
    }
    .contact-info { text-align: left; }
    .contact-name { font-size: 11px; font-weight: 700; color: #0d2920; }
    .contact-title { font-size: 9px; color: #22c55e; font-weight: 600; }
    .contact-detail { font-size: 8px; color: #666; }
    .contact-hint { font-size: 7px; color: #aaa; margin-top: 2px; }
    .venue-tag {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 16px;
    }
    
    .center-area { text-align: center; padding: 12px 0; }
    .logo-circle {
      width: 130px;
      height: 130px;
      margin: 0 auto;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 30px rgba(13,41,32,0.4);
      border: 4px solid #4ade80;
    }
    .logo-inner {
      width: 110px;
      height: 110px;
      border-radius: 20px;
      overflow: hidden;
    }
    .logo-inner img { width: 100%; height: 100%; object-fit: cover; }
    .brand-name {
      font-size: 42px;
      font-weight: 900;
      color: #0d2920;
      margin-top: 10px;
      letter-spacing: 2px;
    }
    .brand-name span { color: #22c55e; }
    
    .tagline-area { text-align: center; padding: 8px 0; }
    .main-slogan { font-size: 32px; font-weight: 900; color: #0d2920; }
    .main-slogan .green { color: #22c55e; }
    .sub-slogan { font-size: 16px; color: #666; margin-top: 4px; }
    .realtime-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      color: white;
      padding: 10px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 10px;
    }
    .realtime-btn .dot {
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    
    .qr-section {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }
    .qr-box {
      text-align: center;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      padding: 16px 30px;
      border-radius: 18px;
    }
    .qr-label {
      font-size: 16px;
      font-weight: 700;
      color: white;
      margin-bottom: 10px;
    }
    .qr-frame {
      background: white;
      padding: 10px;
      border-radius: 12px;
      display: inline-block;
    }
    .qr-frame img {
      width: 150px;
      height: 150px;
      border-radius: 6px;
    }
    .qr-hint {
      font-size: 12px;
      color: #4ade80;
      margin-top: 8px;
    }
    
    .footer-text {
      text-align: center;
      font-size: 10px;
      color: #bbb;
      letter-spacing: 0.5px;
      padding: 6px 0;
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
    
    <div class="top-row">
      <div class="contact-card">
        <img src="${vCardQrUrl}" alt="QR">
        <div class="contact-info">
          <div class="contact-name">Nir Ram</div>
          <div class="contact-title">Founder & CEO</div>
          <div class="contact-detail">052-265-3170</div>
          <div class="contact-detail">nir@i4iguana.com</div>
          <div class="contact-hint">סרוק לשמירת איש קשר</div>
        </div>
      </div>
      <div class="venue-tag">${venue.displayName || venue.name} 📍</div>
    </div>
    
    <div class="center-area">
      <div class="logo-circle">
        <div class="logo-inner">
          <div class="logo-emoji">🦎</div>
        </div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="tagline-area">
      <div class="main-slogan"><span class="green">היא מחליטה</span> ראשונה!</div>
      <div class="sub-slogan">מצא/י מישהו כאן, עכשיו.</div>
      <div class="realtime-btn">✨ הכרויות בזמן אמת <div class="dot"></div></div>
    </div>
    
    <div class="qr-section">
      <div class="qr-box">
        <div class="qr-label">📱 סרקו והתחילו!</div>
        <div class="qr-frame">
          <img src="${qrUrl}" alt="QR Code">
        </div>
        <div class="qr-hint">סריקה אחת בלבד 👆</div>
      </div>
    </div>
    
    <div class="footer-text">Dating App for Real Meetings • i4iguana.com</div>
  </div>
</body>
</html>`
    } else {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - ${venue.displayName || venue.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    body {
      font-family: "Poppins", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: white;
      border-radius: 18px;
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 16px 18px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .sticker::before {
      content: "";
      position: absolute;
      inset: 6px;
      border: 3px solid #4ade80;
      border-radius: 14px;
      pointer-events: none;
    }
    .corner { position: absolute; width: 30px; height: 30px; }
    .corner-tl { top: 4px; left: 4px; border-top: 4px solid #0d2920; border-left: 4px solid #0d2920; border-radius: 12px 0 0 0; }
    .corner-tr { top: 4px; right: 4px; border-top: 4px solid #0d2920; border-right: 4px solid #0d2920; border-radius: 0 12px 0 0; }
    .corner-bl { bottom: 4px; left: 4px; border-bottom: 4px solid #0d2920; border-left: 4px solid #0d2920; border-radius: 0 0 0 12px; }
    .corner-br { bottom: 4px; right: 4px; border-bottom: 4px solid #0d2920; border-right: 4px solid #0d2920; border-radius: 0 0 12px 0; }
    
    .top-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 10px; margin-bottom: 10px; }
    .contact-card { display: flex; align-items: center; gap: 8px; background: #f8f8f8; padding: 6px 10px; border-radius: 10px; border: 1px solid #eee; }
    .contact-card img { width: 50px; height: 50px; border-radius: 6px; }
    .contact-info { text-align: left; }
    .contact-name { font-size: 11px; font-weight: 700; color: #0d2920; }
    .contact-title { font-size: 9px; color: #22c55e; font-weight: 600; }
    .contact-detail { font-size: 8px; color: #666; }
    .contact-hint { font-size: 7px; color: #aaa; margin-top: 2px; }
    .venue-tag { background: linear-gradient(135deg, #4ade80, #22c55e); color: #0d2920; padding: 10px 20px; border-radius: 20px; font-weight: 800; font-size: 16px; }
    
    .center-area { text-align: center; padding: 12px 0; }
    .logo-circle { width: 130px; height: 130px; margin: 0 auto; background: linear-gradient(135deg, #0d2920, #1a4d3e); border-radius: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 30px rgba(13,41,32,0.4); border: 4px solid #4ade80; }
    .logo-inner { width: 110px; height: 110px; border-radius: 20px; overflow: hidden; }
    .logo-inner img { width: 100%; height: 100%; object-fit: cover; }
    .brand-name { font-size: 42px; font-weight: 900; color: #0d2920; margin-top: 10px; letter-spacing: 2px; }
    .brand-name span { color: #22c55e; }
    
    .tagline-area { text-align: center; padding: 8px 0; }
    .main-slogan { font-size: 32px; font-weight: 900; color: #0d2920; }
    .main-slogan .green { color: #22c55e; }
    .sub-slogan { font-size: 16px; color: #666; margin-top: 4px; }
    .realtime-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #0d2920, #1a4d3e); color: white; padding: 10px 24px; border-radius: 25px; font-size: 14px; font-weight: 700; margin-top: 10px; }
    .realtime-btn .dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; animation: pulse 1.5s infinite; }
    
    .qr-section { display: flex; justify-content: center; padding: 16px 0; }
    .qr-box { text-align: center; background: linear-gradient(135deg, #0d2920, #1a4d3e); padding: 16px 30px; border-radius: 18px; }
    .qr-label { font-size: 16px; font-weight: 700; color: white; margin-bottom: 10px; }
    .qr-frame { background: white; padding: 10px; border-radius: 12px; display: inline-block; }
    .qr-frame img { width: 150px; height: 150px; border-radius: 6px; }
    .qr-hint { font-size: 12px; color: #4ade80; margin-top: 8px; }
    
    .footer-text { text-align: center; font-size: 10px; color: #bbb; letter-spacing: 0.5px; padding: 6px 0; }
    
    @media print { body { background: white; padding: 0; } .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    
    <div class="top-row">
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
      <div class="venue-tag">${venue.displayName || venue.name} 📍</div>
    </div>
    
    <div class="center-area">
      <div class="logo-circle">
        <div class="logo-inner">
          <div class="logo-emoji">🦎</div>
        </div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="tagline-area">
      <div class="main-slogan"><span class="green">She Decides</span> First!</div>
      <div class="sub-slogan">Find someone here, right now.</div>
      <div class="realtime-btn">✨ Real-time Dating <div class="dot"></div></div>
    </div>
    
    <div class="qr-section">
      <div class="qr-box">
        <div class="qr-label">📱 Scan & Start!</div>
        <div class="qr-frame">
          <img src="${qrUrl}" alt="QR Code">
        </div>
        <div class="qr-hint">Just one scan! 👆</div>
      </div>
    </div>
    
    <div class="footer-text">Dating App for Real Meetings • i4iguana.com</div>
  </div>
</body>
</html>`
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CLUB OWNERS STICKER - הצעה לבעלי מקומות בילוי
  // ═══════════════════════════════════════════════════════════════
  const generateClubOwnersHTML = () => {
    const websiteUrl = 'https://i4iguana.com'
    const iguanaRadarImg = 'https://www.i4iguana.com/iguana-radar.jpg'
    const websiteQrUrl = `${QR_API}?size=200x200&data=${encodeURIComponent(websiteUrl)}&color=0d2920`
    const vCardData = 'BEGIN:VCARD\\nVERSION:3.0\\nN:Ram;Nir\\nFN:Nir Ram\\nTITLE:Founder & CEO\\nORG:I4IGUANA\\nTEL:+972522653170\\nEMAIL:nir@i4iguana.com\\nURL:https://i4iguana.com\\nEND:VCARD'
    const vCardQrUrl = `${QR_API}?size=180x180&data=${encodeURIComponent(vCardData)}&color=0d2920`

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - הצעה לבעלי מקומות בילוי</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #ffffff 0%, #f0fdf4 100%);
      border-radius: 24px;
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 20px 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1);
      border: 4px solid #22c55e;
    }
    .badge {
      position: absolute;
      top: -12px;
      right: 30px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
      color: white;
      padding: 8px 24px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(255,107,107,0.4);
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-top: 8px;
    }
    .hook {
      color: #22c55e;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .main-title {
      font-size: 36px;
      font-weight: 900;
      color: #0d2920;
      line-height: 1.2;
    }
    .main-title span { color: #22c55e; }
    .subtitle {
      color: #666;
      font-size: 16px;
      margin-top: 6px;
    }
    .content-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }
    .benefits-section { flex: 1; }
    .benefits-title {
      font-size: 18px;
      font-weight: 800;
      color: #0d2920;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .benefit-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: white;
      border-radius: 12px;
      margin-bottom: 8px;
      border: 2px solid #e0e0e0;
    }
    .benefit-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .benefit-text {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    .logo-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }
    .logo-img, .logo-container { background: linear-gradient(135deg, #0d2920, #1a4d3e); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(74, 222, 128, 0.4); } .logo-emoji { font-size: 36px; } .logo-img-old {
      width: 100px;
      height: 100px;
      border-radius: 24px;
      border: 4px solid #22c55e;
      box-shadow: 0 8px 30px rgba(34,197,94,0.3);
      margin-bottom: 10px;
      object-fit: cover;
    }
    .brand-name {
      font-size: 28px;
      font-weight: 900;
      color: #0d2920;
    }
    .brand-name span { color: #22c55e; }
    .brand-sub {
      font-size: 12px;
      color: #666;
    }
    .bottom-section {
      display: flex;
      gap: 16px;
      align-items: stretch;
    }
    .contact-card {
      flex: 1;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .contact-qr {
      width: 100px;
      height: 100px;
      background: white;
      border-radius: 10px;
      padding: 6px;
    }
    .contact-qr img { width: 100%; height: 100%; }
    .contact-info { color: white; }
    .contact-name { font-size: 18px; font-weight: 800; }
    .contact-title { font-size: 12px; color: #4ade80; font-weight: 600; }
    .contact-detail { font-size: 13px; color: rgba(255,255,255,0.8); margin-top: 4px; }
    .contact-hint { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 6px; }
    .website-card {
      flex: 1;
      background: white;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 3px solid #22c55e;
    }
    .website-qr { width: 100px; height: 100px; }
    .website-qr img { width: 100%; height: 100%; border-radius: 8px; }
    .website-title { font-size: 16px; font-weight: 800; color: #0d2920; }
    .website-url { font-size: 20px; font-weight: 900; color: #22c55e; margin-top: 4px; }
    .website-hint { font-size: 11px; color: #888; margin-top: 6px; }
    .footer {
      text-align: center;
      margin-top: 14px;
      padding: 10px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 12px;
    }
    .footer-text {
      color: white;
      font-size: 18px;
      font-weight: 800;
    }
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="badge">🔥 הצטרפו עכשיו!</div>
    <div class="header">
      <div class="hook">🦎 אפליקציית ההכרויות החדשה</div>
      <div class="main-title">הפכו את <span>המקום שלכם</span><br>לנקודת מפגש!</div>
      <div class="subtitle">I4IGUANA מביאה לכם קהל חדש ואיכותי</div>
    </div>
    <div class="content-row">
      <div class="benefits-section">
        <div class="benefits-title">💎 למה להצטרף?</div>
        <div class="benefit-item">
          <div class="benefit-icon">👥</div>
          <div class="benefit-text">משיכת קהל רווקים איכותי</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">📈</div>
          <div class="benefit-text">הגדלת תנועה ומכירות</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">🎯</div>
          <div class="benefit-text">שיווק ממוקד ואפקטיבי</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">💰</div>
          <div class="benefit-text">ללא עלות - שותפות WIN-WIN</div>
        </div>
      </div>
      <div class="logo-section">
        <div class="logo-container"><div class="logo-emoji">🦎</div></div>
        <div class="brand-name"><span>I4</span>IGUANA</div>
        <div class="brand-sub">Dating App for Real Meetings</div>
      </div>
    </div>
    <div class="bottom-section">
      <div class="contact-card">
        <div class="contact-qr">
          <img src="${vCardQrUrl}" alt="Contact QR">
        </div>
        <div class="contact-info">
          <div class="contact-name">Nir Ram</div>
          <div class="contact-title">Founder & CEO</div>
          <div class="contact-detail">📱 052-265-3170</div>
          <div class="contact-detail">✉️ nir@i4iguana.com</div>
          <div class="contact-hint">📲 סרקו לשמירת איש קשר</div>
        </div>
      </div>
      <div class="website-card">
        <div class="website-qr">
          <img src="${websiteQrUrl}" alt="Website QR">
        </div>
        <div class="website-info">
          <div class="website-title">🌐 בקרו באתר שלנו</div>
          <div class="website-url">i4iguana.com</div>
          <div class="website-hint">סרקו לכניסה לאתר</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">🤝 בואו נעשה היסטוריה ביחד!</div>
    </div>
  </div>
</body>
</html>`
  }

  // ═══════════════════════════════════════════════════════════════
  // CHALLENGE CARD - כרטיס אתגר עם QR יחיד
  // ═══════════════════════════════════════════════════════════════
  const challengeSets = {
    en: [
      [
        { emoji: '🎂', text: 'Find someone with your birthday month' },
        { emoji: '🎬', text: 'Find someone who saw the same movie last week' },
      ],
      [
        { emoji: '🍕', text: 'Discover their secret guilty pleasure food' },
        { emoji: '🎤', text: 'Get them to sing their shower song' },
      ],
      [
        { emoji: '✈️', text: 'Plan a spontaneous trip in 60 seconds' },
        { emoji: '🔮', text: 'Predict their zodiac sign correctly' },
      ],
      [
        { emoji: '📱', text: 'Show each other your most used emoji' },
        { emoji: '🎭', text: 'Do your best celebrity impression' },
      ],
      [
        { emoji: '🌅', text: 'Describe your perfect first date' },
        { emoji: '🎵', text: 'Find a song you both know by heart' },
      ],
      [
        { emoji: '🤫', text: 'Share an embarrassing childhood story' },
        { emoji: '🏆', text: 'Challenge them to thumb wrestling' },
      ],
      [
        { emoji: '📺', text: 'Find a TV show you both binge-watched' },
        { emoji: '🌍', text: 'Discover a country you both want to visit' },
      ],
      [
        { emoji: '🎪', text: 'Create an inside joke in 2 minutes' },
        { emoji: '💭', text: 'Guess their biggest dream' },
      ],
      [
        { emoji: '🍿', text: 'Debate: sweet or salty popcorn?' },
        { emoji: '🐕', text: 'Find out if they\'re a dog or cat person' },
      ],
      [
        { emoji: '⏰', text: 'Find someone who wakes up at the same time' },
        { emoji: '🎮', text: 'Discover their hidden gaming talent' },
      ],
    ],
    he: [
      [
        { emoji: '🎂', text: 'מצא/י מישהו עם אותו חודש לידה' },
        { emoji: '🎬', text: 'מצא/י מישהו שראה אותו סרט בשבוע שעבר' },
      ],
      [
        { emoji: '🍕', text: 'גלה/י את האוכל הסודי שלהם' },
        { emoji: '🎤', text: 'תגרום/י להם לשיר שיר מקלחת' },
      ],
      [
        { emoji: '✈️', text: 'תכננ/י טיול ספונטני ב-60 שניות' },
        { emoji: '🔮', text: 'נחש/י נכון את המזל שלהם' },
      ],
      [
        { emoji: '📱', text: 'הראו אחד לשני את האימוג׳י הכי בשימוש' },
        { emoji: '🎭', text: 'עשה/י חיקוי של סלבריטי' },
      ],
      [
        { emoji: '🌅', text: 'תאר/י את הדייט המושלם שלך' },
        { emoji: '🎵', text: 'מצא/י שיר ששניכם יודעים בעל פה' },
      ],
      [
        { emoji: '🤫', text: 'שתפ/י סיפור מביך מהילדות' },
        { emoji: '🏆', text: 'אתגר/י אותם להיאבקות אגודלים' },
      ],
      [
        { emoji: '📺', text: 'מצא/י סדרה ששניכם בינג׳יתם' },
        { emoji: '🌍', text: 'גלה/י מדינה ששניכם חולמים לבקר' },
      ],
      [
        { emoji: '🎪', text: 'צר/י בדיחה פנימית בתוך 2 דקות' },
        { emoji: '💭', text: 'נחש/י את החלום הכי גדול שלהם' },
      ],
      [
        { emoji: '🍿', text: 'דיון: פופקורן מתוק או מלוח?' },
        { emoji: '🐕', text: 'גלה/י אם הם אנשי כלב או חתול' },
      ],
      [
        { emoji: '⏰', text: 'מצא/י מישהו שקם באותה שעה' },
        { emoji: '🎮', text: 'גלה/י את הכישרון הגיימינג הנסתר' },
      ],
    ]
  }

  const generateChallengeCardHTML = () => {
    const qrUrl = `${QR_API}?size=200x200&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920&bgcolor=ffffff`
    const variantIndex = challengeVariant % 10
    const challenges = language === 'hebrew' ? challengeSets.he[variantIndex] : challengeSets.en[variantIndex]
    const selectedVenueData = venues.find(v => v.id === selectedVenue)
    const venueName = selectedVenueData?.displayName || selectedVenueData?.name || ''

    if (language === 'hebrew') {
      return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - כרטיס אתגר</title>
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
      padding: 20px;
    }
    .card {
      width: 15cm;
      height: 15cm;
      background: #ffffff;
      border-radius: 24px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1);
      border: 4px solid #22c55e;
    }
    
    /* Venue Tag */
    .venue-tag {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 6px 18px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 13px;
      margin-bottom: 10px;
    }
    
    /* Top Tag */
    .top-tag {
      background: linear-gradient(135deg, #ec4899, #f472b6);
      color: white;
      padding: 6px 20px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 10px;
      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
    }
    
    /* Logo Section - Compact */
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .logo-box {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #22c55e;
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
    }
    .logo-emoji { font-size: 28px; }
    .brand { font-size: 26px; font-weight: 900; color: #0d2920; }
    .brand span { color: #22c55e; }
    
    /* Challenge Section - Compact */
    .challenge-section {
      width: 100%;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-radius: 14px;
      padding: 12px 16px;
      border: 2px solid #22c55e;
      margin-bottom: 12px;
    }
    .challenge-header {
      text-align: center;
      font-size: 18px;
      font-weight: 900;
      color: #0d2920;
      margin-bottom: 10px;
    }
    .challenge-header .green { color: #22c55e; }
    .challenges { display: flex; flex-direction: column; gap: 8px; }
    .challenge-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: white;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
    .challenge-emoji { font-size: 22px; flex-shrink: 0; }
    
    /* QR Section - Compact */
    .qr-section {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 10px;
    }
    .qr-frame {
      background: white;
      padding: 6px;
      border-radius: 10px;
      border: 3px solid #22c55e;
    }
    .qr-img { width: 90px; height: 90px; display: block; }
    .qr-text {
      text-align: right;
    }
    .qr-title { font-size: 16px; font-weight: 800; color: #0d2920; }
    .qr-hint { font-size: 12px; color: #22c55e; font-weight: 600; margin-top: 4px; }
    
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 6px;
      border-top: 2px dashed #e5e7eb;
      width: 100%;
    }
    .reward { font-size: 13px; font-weight: 700; color: #0d2920; }
    .footer-sub { font-size: 10px; color: #999; margin-top: 4px; }
    .reward-icon { color: #22c55e; }
    
    @media print { 
      body { background: white; padding: 0; } 
      .card { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
    }
  </style>
</head>
<body>
  <div class="card">
    ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
    <div class="top-tag">💕 מצא/י את ההתאמה שלך כאן 💕</div>
    
    <div class="logo-section">
      <div class="logo-box">
        <div class="logo-emoji">🦎</div>
      </div>
      <div class="brand"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="challenge-section">
      <div class="challenge-header">🎯 <span class="green">אתגר</span> הערב!</div>
      <div class="challenges">
        ${challenges.map(c => `
        <div class="challenge-item">
          <span class="challenge-emoji">${c.emoji}</span>
          <span>${c.text}</span>
        </div>`).join('')}
      </div>
    </div>
    
    <div class="qr-section">
      <div class="qr-frame">
        <img src="${qrUrl}" class="qr-img" alt="QR Code">
      </div>
      <div class="qr-text">
        <div class="qr-title">📱 סרקו והתחילו!</div>
        <div class="qr-hint">סריקה אחת בלבד 👆</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="reward"><span class="reward-icon">🏆</span> השלמת אתגר = שתייה חינם! <span class="reward-icon">🍹</span></div>
      <div class="footer-sub">Dating App for Real Meetings • i4iguana.com</div>
    </div>
  </div>
</body>
</html>`
    } else {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - Challenge Card</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Poppins', sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .card {
      width: 15cm;
      height: 15cm;
      background: #ffffff;
      border-radius: 24px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1);
      border: 4px solid #22c55e;
    }
    
    /* Venue Tag */
    .venue-tag {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 6px 18px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 13px;
      margin-bottom: 10px;
    }
    
    /* Top Tag */
    .top-tag {
      background: linear-gradient(135deg, #ec4899, #f472b6);
      color: white;
      padding: 6px 20px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 10px;
      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
    }
    
    /* Logo Section - Compact */
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .logo-box {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #22c55e;
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
    }
    .logo-emoji { font-size: 28px; }
    .brand { font-size: 26px; font-weight: 900; color: #0d2920; }
    .brand span { color: #22c55e; }
    
    /* Challenge Section - Compact */
    .challenge-section {
      width: 100%;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-radius: 14px;
      padding: 12px 16px;
      border: 2px solid #22c55e;
      margin-bottom: 12px;
    }
    .challenge-header {
      text-align: center;
      font-size: 18px;
      font-weight: 900;
      color: #0d2920;
      margin-bottom: 10px;
    }
    .challenge-header .green { color: #22c55e; }
    .challenges { display: flex; flex-direction: column; gap: 8px; }
    .challenge-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: white;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }
    .challenge-emoji { font-size: 22px; flex-shrink: 0; }
    
    /* QR Section - Compact */
    .qr-section {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 10px;
    }
    .qr-frame {
      background: white;
      padding: 6px;
      border-radius: 10px;
      border: 3px solid #22c55e;
    }
    .qr-img { width: 90px; height: 90px; display: block; }
    .qr-text {
      text-align: left;
    }
    .qr-title { font-size: 16px; font-weight: 800; color: #0d2920; }
    .qr-hint { font-size: 12px; color: #22c55e; font-weight: 600; margin-top: 4px; }
    
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 6px;
      border-top: 2px dashed #e5e7eb;
      width: 100%;
    }
    .reward { font-size: 13px; font-weight: 700; color: #0d2920; }
    .reward-icon { color: #22c55e; }
    .footer-sub { font-size: 10px; color: #999; margin-top: 4px; }
    
    @media print { 
      body { background: white; padding: 0; } 
      .card { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
    }
  </style>
</head>
<body>
  <div class="card">
    ${venueName ? `<div class="venue-tag">📍 ${venueName}</div>` : ''}
    <div class="top-tag">💕 Find Your Match Here 💕</div>
    
    <div class="logo-section">
      <div class="logo-box">
        <div class="logo-emoji">🦎</div>
      </div>
      <div class="brand"><span>I4</span>IGUANA</div>
    </div>
    
    <div class="challenge-section">
      <div class="challenge-header">🎯 <span class="green">Tonight's</span> Challenge!</div>
      <div class="challenges">
        ${challenges.map(c => `
        <div class="challenge-item">
          <span class="challenge-emoji">${c.emoji}</span>
          <span>${c.text}</span>
        </div>`).join('')}
      </div>
    </div>
    
    <div class="qr-section">
      <div class="qr-frame">
        <img src="${qrUrl}" class="qr-img" alt="QR Code">
      </div>
      <div class="qr-text">
        <div class="qr-title">📱 Scan & Start!</div>
        <div class="qr-hint">Just one scan 👆</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="reward"><span class="reward-icon">🏆</span> Complete challenge = Free drink! <span class="reward-icon">🍹</span></div>
      <div class="footer-sub">Dating App for Real Meetings • i4iguana.com</div>
    </div>
  </div>
</body>
</html>`
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🔒 DISCREET DATING TEMPLATE - דייטינג בדיסקרטיות (20x20cm)
  // ═══════════════════════════════════════════════════════════════════════════════
  const generateDiscreetDatingHTML = () => {
    const qrUrl = `${QR_API}?size=300x300&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920&bgcolor=ffffff`
    
    const hebrewHTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>I4IGUANA - דייטינג בדיסקרטיות</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: #ffffff;
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 25px;
      border: 4px solid #0d2920;
      overflow: hidden;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #0d2920, #22c55e, #0d2920);
    }
    .lock-icon {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 45px;
      box-shadow: 0 8px 25px rgba(13, 41, 32, 0.3);
      margin-top: 15px;
    }
    .title-section { text-align: center; }
    .title-heb {
      font-size: 36px;
      font-weight: 900;
      color: #0d2920;
      margin-bottom: 5px;
    }
    .subtitle-heb {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    .title-eng {
      font-size: 24px;
      font-weight: 800;
      color: #22c55e;
      letter-spacing: 2px;
    }
    .subtitle-eng {
      font-size: 12px;
      color: #888;
      letter-spacing: 1px;
    }
    .divider {
      width: 150px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #22c55e, transparent);
      margin: 10px 0;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      max-width: 90%;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: #f5f5f5;
      border-radius: 20px;
      border-right: 3px solid #0d2920;
    }
    .feature-icon { font-size: 18px; }
    .feature-text { font-size: 12px; color: #333; font-weight: 600; }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .qr-box {
      padding: 12px;
      background: white;
      border-radius: 15px;
      border: 3px solid #22c55e;
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
    }
    .qr-box img { display: block; width: 110px; height: 110px; }
    .scan-text {
      font-size: 14px;
      color: #0d2920;
      font-weight: 700;
    }
    .brand {
      font-size: 28px;
      font-weight: 900;
      color: #0d2920;
    }
    .brand-url {
      font-size: 11px;
      color: #22c55e;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="top-bar"></div>
    <div class="lock-icon">🔒</div>
    <div class="title-section">
      <div class="title-heb">דייטינג בדיסקרטיות</div>
      <div class="subtitle-heb">הפרטיות שלך. הכללים שלך.</div>
      <div class="title-eng">DISCREET DATING</div>
      <div class="subtitle-eng">Your Privacy. Your Rules.</div>
    </div>
    <div class="divider"></div>
    <div class="features">
      <div class="feature"><span class="feature-icon">🔒</span><span class="feature-text">ללא תמונה חובה</span></div>
      <div class="feature"><span class="feature-icon">👁️</span><span class="feature-text">תמונות נעלמות</span></div>
      <div class="feature"><span class="feature-icon">📍</span><span class="feature-text">מפגשים קרובים</span></div>
      <div class="feature"><span class="feature-icon">🛡️</span><span class="feature-text">פרטיות מלאה</span></div>
    </div>
    <div class="qr-section">
      <div class="scan-text">סרקו והתחברו בדיסקרטיות 👇</div>
      <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
    </div>
    <div class="brand">🦎 I4IGUANA</div>
    <div class="brand-url">i4iguana.com</div>
  </div>
</body>
</html>`

    const englishHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>I4IGUANA - Discreet Dating</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Poppins", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: #ffffff;
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 25px;
      border: 4px solid #0d2920;
      overflow: hidden;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #0d2920, #22c55e, #0d2920);
    }
    .lock-icon {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #0d2920, #1a4d3e);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 45px;
      box-shadow: 0 8px 25px rgba(13, 41, 32, 0.3);
      margin-top: 15px;
    }
    .title-section { text-align: center; }
    .title-eng {
      font-size: 36px;
      font-weight: 900;
      color: #0d2920;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    .subtitle-eng {
      font-size: 16px;
      color: #666;
    }
    .divider {
      width: 150px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #22c55e, transparent);
      margin: 15px 0;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      max-width: 90%;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #f5f5f5;
      border-radius: 20px;
      border-left: 3px solid #0d2920;
    }
    .feature-icon { font-size: 20px; }
    .feature-text { font-size: 13px; color: #333; font-weight: 600; }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .qr-box {
      padding: 12px;
      background: white;
      border-radius: 15px;
      border: 3px solid #22c55e;
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
    }
    .qr-box img { display: block; width: 120px; height: 120px; }
    .scan-text {
      font-size: 15px;
      color: #0d2920;
      font-weight: 700;
    }
    .brand {
      font-size: 28px;
      font-weight: 900;
      color: #0d2920;
    }
    .brand-url {
      font-size: 11px;
      color: #22c55e;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="top-bar"></div>
    <div class="lock-icon">🔒</div>
    <div class="title-section">
      <div class="title-eng">DISCREET DATING</div>
      <div class="subtitle-eng">Your Privacy. Your Rules.</div>
    </div>
    <div class="divider"></div>
    <div class="features">
      <div class="feature"><span class="feature-icon">🔒</span><span class="feature-text">No Photo Required</span></div>
      <div class="feature"><span class="feature-icon">👁️</span><span class="feature-text">View-Once Photos</span></div>
      <div class="feature"><span class="feature-icon">📍</span><span class="feature-text">Meet Nearby</span></div>
      <div class="feature"><span class="feature-icon">🛡️</span><span class="feature-text">Full Privacy</span></div>
    </div>
    <div class="qr-section">
      <div class="scan-text">Scan & Connect Privately 👇</div>
      <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
    </div>
    <div class="brand">🦎 I4IGUANA</div>
    <div class="brand-url">i4iguana.com</div>
  </div>
</body>
</html>`

    return language === 'hebrew' ? hebrewHTML : englishHTML
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🏳️‍🌈 PRIDE EDITION TEMPLATE - לתוך בר להט"ב (20x20cm)
  // ═══════════════════════════════════════════════════════════════════════════════
  const generatePrideEditionHTML = () => {
    const qrUrl = `${QR_API}?size=300x300&data=${encodeURIComponent(DOWNLOAD_URL)}&color=732982&bgcolor=ffffff`
    
    const hebrewHTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>I4IGUANA - Pride Edition</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: #ffffff;
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border: 4px solid #22c55e;
      overflow: hidden;
    }
    .rainbow-top, .rainbow-bottom {
      position: absolute;
      left: 0;
      right: 0;
      height: 20px;
      display: flex;
    }
    .rainbow-top { top: 0; border-radius: 24px 24px 0 0; }
    .rainbow-bottom { bottom: 0; border-radius: 0 0 24px 24px; }
    .stripe { flex: 1; }
    .red { background: #E40303; }
    .orange { background: #FF8C00; }
    .yellow { background: #FFED00; }
    .green { background: #008026; }
    .blue { background: #24408E; }
    .purple { background: #732982; }
    .heart-icon {
      font-size: 70px;
      margin-top: 25px;
    }
    .title-section { text-align: center; }
    .title-eng {
      font-size: 38px;
      font-weight: 900;
      background: linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .pride-badge {
      display: inline-block;
      background: linear-gradient(90deg, #732982, #24408E, #008026, #FFED00, #FF8C00, #E40303);
      padding: 6px 20px;
      border-radius: 20px;
      margin: 8px 0;
    }
    .pride-badge span {
      font-size: 14px;
      font-weight: 700;
      color: white;
      letter-spacing: 1px;
    }
    .title-heb {
      font-size: 28px;
      font-weight: 900;
      color: #0d2920;
    }
    .subtitle-heb {
      font-size: 14px;
      color: #666;
    }
    .rainbow-divider {
      display: flex;
      border-radius: 5px;
      overflow: hidden;
      margin: 8px 0;
    }
    .divider-stripe { width: 25px; height: 5px; }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      max-width: 95%;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #f8f8f8;
      border-radius: 15px;
    }
    .feature:nth-child(1) { border-right: 3px solid #E40303; }
    .feature:nth-child(2) { border-right: 3px solid #FF8C00; }
    .feature:nth-child(3) { border-right: 3px solid #008026; }
    .feature:nth-child(4) { border-right: 3px solid #24408E; }
    .feature-icon { font-size: 16px; }
    .feature-text { font-size: 11px; color: #333; font-weight: 600; }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .cta-box {
      background: linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982);
      padding: 10px 25px;
      border-radius: 15px;
    }
    .cta-text {
      font-size: 16px;
      font-weight: 800;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .qr-box {
      padding: 10px;
      background: white;
      border-radius: 12px;
      border: 3px solid #22c55e;
    }
    .qr-box img { display: block; width: 100px; height: 100px; }
    .brand {
      font-size: 24px;
      font-weight: 900;
      color: #0d2920;
      margin-bottom: 5px;
    }
    .website {
      font-size: 16px;
      font-weight: 700;
      color: #732982;
      text-shadow: 0 0 10px rgba(115, 41, 130, 0.5), 0 0 20px rgba(115, 41, 130, 0.3);
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .stripe, .divider-stripe, .pride-badge, .cta-box, .feature { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="rainbow-top">
      <div class="stripe red"></div>
      <div class="stripe orange"></div>
      <div class="stripe yellow"></div>
      <div class="stripe green"></div>
      <div class="stripe blue"></div>
      <div class="stripe purple"></div>
    </div>
    <div class="heart-icon">❤️</div>
    <div class="title-section">
      <div class="title-eng">LOVE IS LOVE</div>
      <div class="pride-badge"><span>🏳️‍🌈 PRIDE EDITION 🏳️‍🌈</span></div>
      <div class="title-heb">אהבה היא אהבה</div>
      <div class="subtitle-heb">מרחב בטוח לכל הקשת 🌈</div>
    </div>
    <div class="rainbow-divider">
      <div class="divider-stripe red"></div>
      <div class="divider-stripe orange"></div>
      <div class="divider-stripe yellow"></div>
      <div class="divider-stripe green"></div>
      <div class="divider-stripe blue"></div>
      <div class="divider-stripe purple"></div>
    </div>
    <div class="features">
      <div class="feature"><span class="feature-icon">🏳️‍🌈</span><span class="feature-text">התאמות לכל הקשת</span></div>
      <div class="feature"><span class="feature-icon">💚</span><span class="feature-text">שניכם יוזמים</span></div>
      <div class="feature"><span class="feature-icon">🛡️</span><span class="feature-text">מרחב בטוח</span></div>
      <div class="feature"><span class="feature-icon">📍</span><span class="feature-text">חיבורים קרובים</span></div>
    </div>
    <div class="qr-section">
      <div class="cta-box"><span class="cta-text">הצטרפו לקהילה! 🦎</span></div>
      <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
    </div>
    <div class="brand">🦎 I4IGUANA</div>
    <div class="website">www.i4iguana.com</div>
    <div class="rainbow-bottom">
      <div class="stripe purple"></div>
      <div class="stripe blue"></div>
      <div class="stripe green"></div>
      <div class="stripe yellow"></div>
      <div class="stripe orange"></div>
      <div class="stripe red"></div>
    </div>
  </div>
</body>
</html>`

    const englishHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>I4IGUANA - Pride Edition</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body {
      font-family: "Poppins", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: #ffffff;
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border: 4px solid #22c55e;
      overflow: hidden;
    }
    .rainbow-top, .rainbow-bottom {
      position: absolute;
      left: 0;
      right: 0;
      height: 20px;
      display: flex;
    }
    .rainbow-top { top: 0; border-radius: 24px 24px 0 0; }
    .rainbow-bottom { bottom: 0; border-radius: 0 0 24px 24px; }
    .stripe { flex: 1; }
    .red { background: #E40303; }
    .orange { background: #FF8C00; }
    .yellow { background: #FFED00; }
    .green { background: #008026; }
    .blue { background: #24408E; }
    .purple { background: #732982; }
    .heart-icon {
      font-size: 70px;
      margin-top: 25px;
    }
    .title-section { text-align: center; }
    .title-eng {
      font-size: 42px;
      font-weight: 900;
      background: linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .pride-badge {
      display: inline-block;
      background: linear-gradient(90deg, #732982, #24408E, #008026, #FFED00, #FF8C00, #E40303);
      padding: 8px 25px;
      border-radius: 25px;
      margin: 10px 0;
    }
    .pride-badge span {
      font-size: 16px;
      font-weight: 700;
      color: white;
      letter-spacing: 2px;
    }
    .subtitle-eng {
      font-size: 16px;
      color: #666;
    }
    .rainbow-divider {
      display: flex;
      border-radius: 5px;
      overflow: hidden;
      margin: 10px 0;
    }
    .divider-stripe { width: 30px; height: 6px; }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      max-width: 95%;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 15px;
      background: #f8f8f8;
      border-radius: 15px;
    }
    .feature:nth-child(1) { border-left: 3px solid #E40303; }
    .feature:nth-child(2) { border-left: 3px solid #FF8C00; }
    .feature:nth-child(3) { border-left: 3px solid #008026; }
    .feature:nth-child(4) { border-left: 3px solid #24408E; }
    .feature-icon { font-size: 18px; }
    .feature-text { font-size: 12px; color: #333; font-weight: 600; }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .cta-box {
      background: linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982);
      padding: 12px 30px;
      border-radius: 20px;
    }
    .cta-text {
      font-size: 18px;
      font-weight: 800;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .qr-box {
      padding: 10px;
      background: white;
      border-radius: 12px;
      border: 3px solid #22c55e;
    }
    .qr-box img { display: block; width: 110px; height: 110px; }
    .brand {
      font-size: 26px;
      font-weight: 900;
      color: #0d2920;
      margin-bottom: 5px;
    }
    .website {
      font-size: 16px;
      font-weight: 700;
      color: #732982;
      text-shadow: 0 0 10px rgba(115, 41, 130, 0.5), 0 0 20px rgba(115, 41, 130, 0.3);
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .stripe, .divider-stripe, .pride-badge, .cta-box, .feature { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="rainbow-top">
      <div class="stripe red"></div>
      <div class="stripe orange"></div>
      <div class="stripe yellow"></div>
      <div class="stripe green"></div>
      <div class="stripe blue"></div>
      <div class="stripe purple"></div>
    </div>
    <div class="heart-icon">❤️</div>
    <div class="title-section">
      <div class="title-eng">LOVE IS LOVE</div>
      <div class="pride-badge"><span>🏳️‍🌈 PRIDE EDITION 🏳️‍🌈</span></div>
      <div class="subtitle-eng">A Safe Space for Everyone 🌈</div>
    </div>
    <div class="rainbow-divider">
      <div class="divider-stripe red"></div>
      <div class="divider-stripe orange"></div>
      <div class="divider-stripe yellow"></div>
      <div class="divider-stripe green"></div>
      <div class="divider-stripe blue"></div>
      <div class="divider-stripe purple"></div>
    </div>
    <div class="features">
      <div class="feature"><span class="feature-icon">🏳️‍🌈</span><span class="feature-text">All Orientations</span></div>
      <div class="feature"><span class="feature-icon">💚</span><span class="feature-text">Both Initiate</span></div>
      <div class="feature"><span class="feature-icon">🛡️</span><span class="feature-text">Safe Space</span></div>
      <div class="feature"><span class="feature-icon">📍</span><span class="feature-text">Meet Nearby</span></div>
    </div>
    <div class="qr-section">
      <div class="cta-box"><span class="cta-text">Join the Community! 🦎</span></div>
      <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
    </div>
    <div class="brand">🦎 I4IGUANA</div>
    <div class="website">www.i4iguana.com</div>
    <div class="rainbow-bottom">
      <div class="stripe purple"></div>
      <div class="stripe blue"></div>
      <div class="stripe green"></div>
      <div class="stripe yellow"></div>
      <div class="stripe orange"></div>
      <div class="stripe red"></div>
    </div>
  </div>
</body>
</html>`

    return language === 'hebrew' ? hebrewHTML : englishHTML
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 💚 SAME CONNECTION TEMPLATE - כללי, לתליה בחוץ (20x20cm)
  // בלי דגלי גאווה - פשוט מסקרן על חיבור בין אותם המינים
  // ═══════════════════════════════════════════════════════════════════════════════
  const generateSameConnectionHTML = () => {
    const qrUrl = `${QR_API}?size=300x300&data=${encodeURIComponent(DOWNLOAD_URL)}&color=0d2920&bgcolor=ffffff`
    
    const hebrewHTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>I4IGUANA - Connect Your Way</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Heebo", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #1a4d3e 0%, #0d2920 50%, #051410 100%);
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 25px;
      border: 4px solid #4ade80;
      overflow: hidden;
    }
    .sparkle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      opacity: 0.4;
    }
    .sparkle:nth-child(1) { top: 12%; left: 15%; }
    .sparkle:nth-child(2) { top: 18%; right: 18%; }
    .sparkle:nth-child(3) { bottom: 22%; left: 12%; }
    .sparkle:nth-child(4) { bottom: 18%; right: 15%; }
    .hearts-icon {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    .heart { font-size: 50px; }
    .heart-green { filter: hue-rotate(90deg); }
    .title-section { text-align: center; }
    .title-heb {
      font-size: 34px;
      font-weight: 900;
      color: white;
      margin-bottom: 5px;
    }
    .subtitle-heb {
      font-size: 16px;
      color: #4ade80;
      margin-bottom: 12px;
    }
    .title-eng {
      font-size: 26px;
      font-weight: 800;
      color: #4ade80;
      letter-spacing: 2px;
    }
    .subtitle-eng {
      font-size: 13px;
      color: white;
      opacity: 0.7;
    }
    .tagline {
      background: rgba(74, 222, 128, 0.15);
      border: 2px solid #4ade80;
      border-radius: 20px;
      padding: 10px 25px;
      margin: 10px 0;
    }
    .tagline-text {
      font-size: 15px;
      font-weight: 700;
      color: #4ade80;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      max-width: 95%;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.08);
      border-radius: 15px;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    .feature-icon { font-size: 18px; }
    .feature-text { font-size: 12px; color: white; font-weight: 600; }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .scan-text {
      font-size: 15px;
      color: #4ade80;
      font-weight: 700;
    }
    .qr-box {
      padding: 12px;
      background: white;
      border-radius: 15px;
      border: 3px solid #4ade80;
    }
    .qr-box img { display: block; width: 110px; height: 110px; }
    .brand {
      font-size: 28px;
      font-weight: 900;
      color: white;
    }
    .brand-url {
      font-size: 11px;
      color: #4ade80;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="hearts-icon">
      <span class="heart">💚</span>
      <span class="heart">💚</span>
    </div>
    <div class="title-section">
      <div class="title-heb">התחברו בדרך שלכם</div>
      <div class="subtitle-heb">מי שמתאים לך - קרוב אליך</div>
      <div class="title-eng">CONNECT YOUR WAY</div>
      <div class="subtitle-eng">Your Match. Your Choice.</div>
    </div>
    <div class="tagline">
      <span class="tagline-text">✨ כל החיבורים. בלי גבולות. ✨</span>
    </div>
    <div class="features">
      <div class="feature"><span class="feature-icon">💚</span><span class="feature-text">שניכם יוזמים</span></div>
      <div class="feature"><span class="feature-icon">🎯</span><span class="feature-text">התאמות מדויקות</span></div>
      <div class="feature"><span class="feature-icon">📍</span><span class="feature-text">קרובים אליך</span></div>
      <div class="feature"><span class="feature-icon">🛡️</span><span class="feature-text">מרחב בטוח</span></div>
    </div>
    <div class="qr-section">
      <div class="scan-text">סרקו והתחילו להכיר 👇</div>
      <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
    </div>
    <div class="brand">🦎 I4IGUANA</div>
    <div class="brand-url">i4iguana.com</div>
  </div>
</body>
</html>`

    const englishHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>I4IGUANA - Connect Your Way</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Poppins", sans-serif;
      background: #e0e0e0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #1a4d3e 0%, #0d2920 50%, #051410 100%);
      border-radius: 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 25px;
      border: 4px solid #4ade80;
      overflow: hidden;
    }
    .sparkle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      opacity: 0.4;
    }
    .sparkle:nth-child(1) { top: 12%; left: 15%; }
    .sparkle:nth-child(2) { top: 18%; right: 18%; }
    .sparkle:nth-child(3) { bottom: 22%; left: 12%; }
    .sparkle:nth-child(4) { bottom: 18%; right: 15%; }
    .hearts-icon {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    .heart { font-size: 50px; }
    .title-section { text-align: center; }
    .title-eng {
      font-size: 36px;
      font-weight: 900;
      color: white;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    .subtitle-eng {
      font-size: 16px;
      color: #4ade80;
    }
    .tagline {
      background: rgba(74, 222, 128, 0.15);
      border: 2px solid #4ade80;
      border-radius: 20px;
      padding: 12px 30px;
      margin: 12px 0;
    }
    .tagline-text {
      font-size: 16px;
      font-weight: 700;
      color: #4ade80;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      max-width: 95%;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(255,255,255,0.08);
      border-radius: 15px;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    .feature-icon { font-size: 18px; }
    .feature-text { font-size: 13px; color: white; font-weight: 600; }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .scan-text {
      font-size: 16px;
      color: #4ade80;
      font-weight: 700;
    }
    .qr-box {
      padding: 12px;
      background: white;
      border-radius: 15px;
      border: 3px solid #4ade80;
    }
    .qr-box img { display: block; width: 120px; height: 120px; }
    .brand {
      font-size: 28px;
      font-weight: 900;
      color: white;
    }
    .brand-url {
      font-size: 11px;
      color: #4ade80;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="hearts-icon">
      <span class="heart">💚</span>
      <span class="heart">💚</span>
    </div>
    <div class="title-section">
      <div class="title-eng">CONNECT YOUR WAY</div>
      <div class="subtitle-eng">Your Match. Your Choice.</div>
    </div>
    <div class="tagline">
      <span class="tagline-text">✨ All Connections. No Limits. ✨</span>
    </div>
    <div class="features">
      <div class="feature"><span class="feature-icon">💚</span><span class="feature-text">Both Initiate</span></div>
      <div class="feature"><span class="feature-icon">🎯</span><span class="feature-text">Perfect Match</span></div>
      <div class="feature"><span class="feature-icon">📍</span><span class="feature-text">Nearby</span></div>
      <div class="feature"><span class="feature-icon">🛡️</span><span class="feature-text">Safe Space</span></div>
    </div>
    <div class="qr-section">
      <div class="scan-text">Scan & Start Meeting 👇</div>
      <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
    </div>
    <div class="brand">🦎 I4IGUANA</div>
    <div class="brand-url">i4iguana.com</div>
  </div>
</body>
</html>`

    return language === 'hebrew' ? hebrewHTML : englishHTML
  }

  // Get current HTML based on template selection
  const getCurrentHTML = () => {
    switch (template) {
      case 'download-only':
        return generateDownloadOnlyHTML()
      case 'download-only-light':
        return generateDownloadOnlyLightHTML()
      case 'customers-dark':
        return generateCustomersDarkHTML()
      case 'customers-light':
        return generateCustomersLightHTML()
      case 'venue':
        const venue = venues.find(v => v.id === selectedVenue)
        return venue ? generateVenueStickerHTML(venue) : generateDownloadOnlyHTML()
      case 'club-owners':
        return generateClubOwnersHTML()
      case 'challenge-card':
        return generateChallengeCardHTML()
      case 'discreet-dating':
        return generateDiscreetDatingHTML()
      case 'pride-edition':
        return generatePrideEditionHTML()
      case 'same-connection':
        return generateSameConnectionHTML()
      default:
        return generateDownloadOnlyHTML()
    }
  }

  // Refresh preview
  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = getCurrentHTML()
    }
  }

  useEffect(() => {
    refreshPreview()
  }, [template, selectedVenue, language, challengeVariant, cardStyle])

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(getCurrentHTML())
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  // Download function
  const handleDownload = () => {
    const html = getCurrentHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `i4iguana-sticker-${template}-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-[#051410] p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/super"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-[#4ade80]" />
                מחולל סטיקרים V2
              </h1>
              <p className="text-white/60 mt-1">🎯 QR יחיד לדף הנחיתה החדש!</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={refreshPreview}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              רענן
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              הורד HTML
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-semibold transition-colors"
            >
              <Printer className="h-4 w-4" />
              הדפס
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Selection */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#4ade80]" />
              בחר תבנית
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setTemplate('download-only')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'download-only' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">📱 סרוק והתחל (מומלץ!)</div>
                    <div className="text-xs opacity-70">QR יחיד לדף הנחיתה</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('download-only-light')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'download-only-light' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">📱 סרוק והתחל (LIGHT)</div>
                    <div className="text-xs opacity-70">רקע לבן - חיסכון בדיו</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('customers-dark')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'customers-dark' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">🌙 רקע כהה</div>
                    <div className="text-xs opacity-70">לברים ומועדונים</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('customers-light')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'customers-light' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">☀️ רקע בהיר</div>
                    <div className="text-xs opacity-70">לבתי קפה ומסעדות</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('venue')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'venue' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">🏢 למועדון ספציפי</div>
                    <div className="text-xs opacity-70">עם שם המועדון</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('challenge-card')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'challenge-card' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">🎯 כרטיס אתגר</div>
                    <div className="text-xs opacity-70">15x15 ס"מ לשולחנות</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('club-owners')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'club-owners' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">💼 לבעלי מקומות</div>
                    <div className="text-xs opacity-70">הצעת שיתוף פעולה</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('discreet-dating')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'discreet-dating' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">🔒 דייטינג דיסקרטי</div>
                    <div className="text-xs opacity-70">פרטיות מלאה (20x20)</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('pride-edition')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'pride-edition' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">🏳️‍🌈 Pride Edition</div>
                    <div className="text-xs opacity-70">לתוך בר להט"ב (20x20)</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTemplate('same-connection')}
                className={`w-full text-right p-3 rounded-lg transition-all ${
                  template === 'same-connection' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">💚 Connect Your Way</div>
                    <div className="text-xs opacity-70">כללי, לתליה בחוץ (20x20)</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Venue Selection - ALWAYS VISIBLE */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#4ade80]" />
              📍 בחר מועדון
              {loading && <span className="text-xs text-yellow-400">(טוען...)</span>}
              {!loading && <span className="text-xs text-white/50">({venues.length} מועדונים)</span>}
            </h3>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none"
              style={{ colorScheme: 'dark' }}
              disabled={loading}
            >
              <option value="" className="bg-[#0d2920] text-white">ללא מועדון (כללי)</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id} className="bg-[#0d2920] text-white">
                  {venue.displayName || venue.name}
                </option>
              ))}
            </select>
            {selectedVenue && (
              <p className="text-[#4ade80] text-sm mt-2">
                ✅ שם המועדון יופיע בסטיקר
              </p>
            )}
            {!loading && venues.length === 0 && (
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ לא נמצאו מועדונים - בדוק את ה-Console לשגיאות
              </p>
            )}
          </div>

          {/* Language Selection */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4">🌐 שפה</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('hebrew')}
                className={`flex-1 p-3 rounded-lg transition-all ${
                  language === 'hebrew' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                🇮🇱 עברית
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`flex-1 p-3 rounded-lg transition-all ${
                  language === 'english' 
                    ? 'bg-[#4ade80] text-[#0d2920]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Challenge Variant Selection - Only show for challenge-card */}
          {template === 'challenge-card' && (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">🎲 בחר סט אתגרים</h3>
              <div className="grid grid-cols-5 gap-2">
                {[...Array(10)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setChallengeVariant(i)}
                    className={`p-3 rounded-lg transition-all text-center font-bold ${
                      challengeVariant === i 
                        ? 'bg-[#4ade80] text-[#0d2920]' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="text-white/50 text-xs mt-3 text-center">
                🎯 10 סטים שונים של אתגרים למשחק
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-[#4ade80]/10 rounded-xl p-6 border border-[#4ade80]/30">
            <h3 className="text-[#4ade80] font-semibold mb-2">✨ חדש! QR יחיד</h3>
            <p className="text-white/70 text-sm">
              כל הסטיקרים עכשיו עם QR אחד בלבד שמפנה לדף הנחיתה החדש. 
              המשתמש סורק → נכנס לדף מדהים → מתקין את האפליקציה!
            </p>
            <div className="mt-3 p-3 bg-white/10 rounded-lg">
              <code className="text-xs text-[#4ade80]">https://www.i4iguana.com/download</code>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 h-full">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#4ade80]" />
              תצוגה מקדימה
            </h3>
            <div className="bg-gray-200 rounded-lg overflow-hidden" style={{ height: 'calc(100% - 40px)', minHeight: '600px' }}>
              <iframe
                ref={iframeRef}
                srcDoc={getCurrentHTML()}
                className="w-full h-full border-0"
                title="Sticker Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
