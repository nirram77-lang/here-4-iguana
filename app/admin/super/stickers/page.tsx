'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Printer, Download, RefreshCw, Building2, QrCode, Sparkles, Target, Sun, Moon } from 'lucide-react'
import Link from 'next/link'

interface Venue {
  id: string
  name: string
  displayName?: string
}

type TemplateType = 'venue' | 'club-owners' | 'customers-dark' | 'customers-light'

export default function StickerGeneratorPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew')
  const [template, setTemplate] = useState<TemplateType>('venue')
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

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMERS DARK STICKER (Green Background)
  // ═══════════════════════════════════════════════════════════════
  const generateCustomersDarkHTML = () => {
    const websiteUrl = 'https://i4iguana.com'
    const websiteQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(websiteUrl) + '&color=0d2920&bgcolor=ffffff'
    const iguanaRadarImg = 'https://i4iguana-app.vercel.app/iguana-radar.jpg'

    return '<!DOCTYPE html>' +
'<html lang="he" dir="rtl">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>I4IGUANA - מדבקה ללקוחות</title>' +
'  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'    @keyframes sparkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }' +
'    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(74, 222, 128, 0.3); } 50% { box-shadow: 0 0 40px rgba(74, 222, 128, 0.6); } }' +
'    body {' +
'      font-family: "Heebo", sans-serif;' +
'      background: #e0e0e0;' +
'      min-height: 100vh;' +
'      display: flex;' +
'      justify-content: center;' +
'      align-items: center;' +
'      padding: 10px;' +
'    }' +
'    .sticker {' +
'      width: 20cm;' +
'      height: 20cm;' +
'      background: linear-gradient(160deg, #1a4d3e 0%, #0d2920 50%, #051410 100%);' +
'      border-radius: 24px;' +
'      position: relative;' +
'      display: flex;' +
'      flex-direction: column;' +
'      padding: 20px 24px;' +
'      border: 3px solid #4ade80;' +
'      animation: glow 3s ease-in-out infinite;' +
'      overflow: hidden;' +
'    }' +
'    .sparkle {' +
'      position: absolute;' +
'      width: 6px;' +
'      height: 6px;' +
'      background: #4ade80;' +
'      border-radius: 50%;' +
'      animation: sparkle 2s ease-in-out infinite;' +
'    }' +
'    .hook {' +
'      text-align: center;' +
'      font-size: 22px;' +
'      color: #4ade80;' +
'      font-weight: 600;' +
'      margin-bottom: 8px;' +
'      text-shadow: 0 0 20px rgba(74, 222, 128, 0.5);' +
'    }' +
'    .main-title {' +
'      text-align: center;' +
'      font-size: 48px;' +
'      font-weight: 900;' +
'      color: white;' +
'      margin-bottom: 4px;' +
'    }' +
'    .main-title span { color: #4ade80; }' +
'    .subtitle {' +
'      text-align: center;' +
'      font-size: 16px;' +
'      color: rgba(255,255,255,0.7);' +
'      margin-bottom: 16px;' +
'    }' +
'    .logo-section {' +
'      display: flex;' +
'      align-items: center;' +
'      justify-content: center;' +
'      gap: 16px;' +
'      margin-bottom: 12px;' +
'    }' +
'    .logo-img {' +
'      width: 80px;' +
'      height: 80px;' +
'      border-radius: 20px;' +
'      border: 3px solid #4ade80;' +
'      object-fit: cover;' +
'    }' +
'    .logo-text {' +
'      font-size: 36px;' +
'      font-weight: 900;' +
'      color: white;' +
'    }' +
'    .logo-text span { color: #4ade80; }' +
'    .logo-sub {' +
'      font-size: 13px;' +
'      color: rgba(255,255,255,0.6);' +
'    }' +
'    .features {' +
'      display: flex;' +
'      justify-content: center;' +
'      gap: 12px;' +
'      margin-bottom: 16px;' +
'      flex-wrap: wrap;' +
'    }' +
'    .feature {' +
'      background: rgba(74, 222, 128, 0.15);' +
'      border: 1px solid rgba(74, 222, 128, 0.3);' +
'      padding: 8px 14px;' +
'      border-radius: 20px;' +
'      font-size: 13px;' +
'      color: white;' +
'      font-weight: 600;' +
'    }' +
'    .qr-section {' +
'      background: white;' +
'      border-radius: 20px;' +
'      padding: 20px;' +
'      margin: 0 20px;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 20px;' +
'    }' +
'    .qr-code {' +
'      width: 180px;' +
'      height: 180px;' +
'      border-radius: 12px;' +
'    }' +
'    .qr-text h3 {' +
'      font-size: 22px;' +
'      font-weight: 800;' +
'      color: #0d2920;' +
'      margin-bottom: 8px;' +
'    }' +
'    .qr-text p {' +
'      font-size: 14px;' +
'      color: #666;' +
'      line-height: 1.5;' +
'    }' +
'    .website-btn {' +
'      display: inline-flex;' +
'      align-items: center;' +
'      gap: 6px;' +
'      background: linear-gradient(135deg, #4ade80, #22c55e);' +
'      color: #0d2920;' +
'      padding: 8px 16px;' +
'      border-radius: 20px;' +
'      font-weight: 700;' +
'      font-size: 14px;' +
'      margin-top: 10px;' +
'    }' +
'    .contact {' +
'      text-align: center;' +
'      margin-top: 14px;' +
'      font-size: 14px;' +
'      color: rgba(255,255,255,0.5);' +
'    }' +
'    .contact a { color: #4ade80; text-decoration: none; }' +
'    .cta-btn {' +
'      display: block;' +
'      margin: 14px auto 0;' +
'      background: linear-gradient(135deg, #4ade80, #22c55e);' +
'      color: #0d2920;' +
'      padding: 14px 40px;' +
'      border-radius: 30px;' +
'      font-weight: 800;' +
'      font-size: 18px;' +
'      text-align: center;' +
'      max-width: 320px;' +
'    }' +
'    .free-badge {' +
'      background: #ff6b6b;' +
'      color: white;' +
'      padding: 4px 12px;' +
'      border-radius: 12px;' +
'      font-size: 12px;' +
'      font-weight: 700;' +
'      margin-right: 8px;' +
'    }' +
'    @media print {' +
'      body { background: white; padding: 0; }' +
'      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="sticker">' +
'    <div class="sparkle" style="top: 10%; left: 5%;"></div>' +
'    <div class="sparkle" style="top: 15%; right: 8%; animation-delay: 0.5s;"></div>' +
'    <div class="sparkle" style="top: 40%; left: 3%; animation-delay: 1s;"></div>' +
'    <div class="sparkle" style="top: 60%; right: 5%; animation-delay: 1.5s;"></div>' +
'    <div class="sparkle" style="bottom: 20%; left: 10%; animation-delay: 0.3s;"></div>' +
'    <div class="sparkle" style="bottom: 15%; right: 12%; animation-delay: 0.8s;"></div>' +
'    <div class="hook">✨ הכרויות בזמן אמת ✨</div>' +
'    <div class="main-title"><span>היא מחליטה</span> ראשונה!</div>' +
'    <div class="subtitle">מצא/י את האחד/ת - כאן ועכשיו</div>' +
'    <div class="logo-section">' +
'      <img src="' + iguanaRadarImg + '" class="logo-img" alt="I4IGUANA">' +
'      <div>' +
'        <div class="logo-text"><span>I4</span>IGUANA</div>' +
'        <div class="logo-sub">Dating App for Real Meetings</div>' +
'      </div>' +
'    </div>' +
'    <div class="features">' +
'      <div class="feature">📍 אנשים באותו מקום</div>' +
'      <div class="feature">⚡ התאמה מיידית</div>' +
'      <div class="feature">💬 צ׳אט פרטי</div>' +
'      <div class="feature">🎯 מפגש אמיתי</div>' +
'    </div>' +
'    <div class="qr-section">' +
'      <img src="' + websiteQrUrl + '" class="qr-code" alt="QR Code">' +
'      <div class="qr-text">' +
'        <h3>סרוק והתחל עכשיו!</h3>' +
'        <p>האפליקציה שמחברת בין אנשים<br>באותו מקום, באותו רגע</p>' +
'        <div class="website-btn">i4iguana.com 🦎</div>' +
'      </div>' +
'    </div>' +
'    <div class="contact">שאלות? <a href="mailto:nir@i4iguana.com">nir@i4iguana.com</a></div>' +
'    <div class="cta-btn"><span class="free-badge">חינם!</span> 🦎 הצטרף/י עכשיו!</div>' +
'  </div>' +
'</body>' +
'</html>'
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMERS LIGHT STICKER (White Background with Green Sparkles)
  // ═══════════════════════════════════════════════════════════════
  const generateCustomersLightHTML = () => {
    const websiteUrl = 'https://i4iguana.com'
    const websiteQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(websiteUrl) + '&color=0d2920&bgcolor=ffffff'
    const iguanaRadarImg = 'https://i4iguana-app.vercel.app/iguana-radar.jpg'

    return '<!DOCTYPE html>' +
'<html lang="he" dir="rtl">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>I4IGUANA - מדבקה ללקוחות (בהיר)</title>' +
'  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'    @keyframes sparkle { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }' +
'    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }' +
'    body {' +
'      font-family: "Heebo", sans-serif;' +
'      background: #e0e0e0;' +
'      min-height: 100vh;' +
'      display: flex;' +
'      justify-content: center;' +
'      align-items: center;' +
'      padding: 10px;' +
'    }' +
'    .sticker {' +
'      width: 20cm;' +
'      height: 20cm;' +
'      background: linear-gradient(160deg, #ffffff 0%, #f8fdf9 50%, #f0fdf4 100%);' +
'      border-radius: 24px;' +
'      position: relative;' +
'      display: flex;' +
'      flex-direction: column;' +
'      padding: 20px 24px;' +
'      border: 4px solid #22c55e;' +
'      box-shadow: 0 0 40px rgba(34, 197, 94, 0.3), inset 0 0 60px rgba(74, 222, 128, 0.05);' +
'      overflow: hidden;' +
'    }' +
'    .sparkle {' +
'      position: absolute;' +
'      width: 8px;' +
'      height: 8px;' +
'      background: radial-gradient(circle, #4ade80 0%, #22c55e 50%, transparent 70%);' +
'      border-radius: 50%;' +
'      animation: sparkle 2s ease-in-out infinite;' +
'      box-shadow: 0 0 10px #4ade80;' +
'    }' +
'    .sparkle-large {' +
'      width: 12px;' +
'      height: 12px;' +
'      background: radial-gradient(circle, #4ade80 0%, transparent 70%);' +
'    }' +
'    .hook {' +
'      text-align: center;' +
'      font-size: 22px;' +
'      color: #16a34a;' +
'      font-weight: 700;' +
'      margin-bottom: 8px;' +
'      text-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);' +
'    }' +
'    .main-title {' +
'      text-align: center;' +
'      font-size: 48px;' +
'      font-weight: 900;' +
'      color: #0d2920;' +
'      margin-bottom: 4px;' +
'    }' +
'    .main-title span {' +
'      background: linear-gradient(135deg, #22c55e, #16a34a);' +
'      -webkit-background-clip: text;' +
'      -webkit-text-fill-color: transparent;' +
'      background-clip: text;' +
'    }' +
'    .subtitle {' +
'      text-align: center;' +
'      font-size: 16px;' +
'      color: #555;' +
'      margin-bottom: 16px;' +
'    }' +
'    .logo-section {' +
'      display: flex;' +
'      align-items: center;' +
'      justify-content: center;' +
'      gap: 16px;' +
'      margin-bottom: 12px;' +
'    }' +
'    .logo-img {' +
'      width: 80px;' +
'      height: 80px;' +
'      border-radius: 20px;' +
'      border: 3px solid #22c55e;' +
'      object-fit: cover;' +
'      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);' +
'    }' +
'    .logo-text {' +
'      font-size: 36px;' +
'      font-weight: 900;' +
'      color: #0d2920;' +
'    }' +
'    .logo-text span {' +
'      background: linear-gradient(135deg, #22c55e, #16a34a);' +
'      -webkit-background-clip: text;' +
'      -webkit-text-fill-color: transparent;' +
'      background-clip: text;' +
'    }' +
'    .logo-sub {' +
'      font-size: 13px;' +
'      color: #666;' +
'    }' +
'    .features {' +
'      display: flex;' +
'      justify-content: center;' +
'      gap: 12px;' +
'      margin-bottom: 16px;' +
'      flex-wrap: wrap;' +
'    }' +
'    .feature {' +
'      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(74, 222, 128, 0.1));' +
'      border: 2px solid #22c55e;' +
'      padding: 8px 14px;' +
'      border-radius: 20px;' +
'      font-size: 13px;' +
'      color: #0d2920;' +
'      font-weight: 700;' +
'    }' +
'    .qr-section {' +
'      background: linear-gradient(135deg, #0d2920, #1a4d3e);' +
'      border-radius: 20px;' +
'      padding: 20px;' +
'      margin: 0 20px;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 20px;' +
'      border: 2px solid #4ade80;' +
'    }' +
'    .qr-code {' +
'      width: 180px;' +
'      height: 180px;' +
'      border-radius: 12px;' +
'      background: white;' +
'      padding: 8px;' +
'    }' +
'    .qr-text h3 {' +
'      font-size: 22px;' +
'      font-weight: 800;' +
'      color: white;' +
'      margin-bottom: 8px;' +
'    }' +
'    .qr-text p {' +
'      font-size: 14px;' +
'      color: rgba(255,255,255,0.8);' +
'      line-height: 1.5;' +
'    }' +
'    .website-btn {' +
'      display: inline-flex;' +
'      align-items: center;' +
'      gap: 6px;' +
'      background: linear-gradient(135deg, #4ade80, #22c55e);' +
'      color: #0d2920;' +
'      padding: 8px 16px;' +
'      border-radius: 20px;' +
'      font-weight: 700;' +
'      font-size: 14px;' +
'      margin-top: 10px;' +
'    }' +
'    .contact {' +
'      text-align: center;' +
'      margin-top: 14px;' +
'      font-size: 14px;' +
'      color: #666;' +
'    }' +
'    .contact a { color: #16a34a; text-decoration: none; font-weight: 600; }' +
'    .cta-btn {' +
'      display: block;' +
'      margin: 14px auto 0;' +
'      background: linear-gradient(135deg, #22c55e, #16a34a);' +
'      color: white;' +
'      padding: 14px 40px;' +
'      border-radius: 30px;' +
'      font-weight: 800;' +
'      font-size: 18px;' +
'      text-align: center;' +
'      max-width: 320px;' +
'      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);' +
'    }' +
'    .free-badge {' +
'      background: #ff6b6b;' +
'      color: white;' +
'      padding: 4px 12px;' +
'      border-radius: 12px;' +
'      font-size: 12px;' +
'      font-weight: 700;' +
'      margin-right: 8px;' +
'      box-shadow: 0 2px 10px rgba(255, 107, 107, 0.4);' +
'    }' +
'    @media print {' +
'      body { background: white; padding: 0; }' +
'      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="sticker">' +
'    <div class="sparkle" style="top: 5%; left: 5%;"></div>' +
'    <div class="sparkle" style="top: 8%; left: 20%; animation-delay: 0.3s;"></div>' +
'    <div class="sparkle sparkle-large" style="top: 3%; right: 15%; animation-delay: 0.7s;"></div>' +
'    <div class="sparkle" style="top: 12%; right: 8%; animation-delay: 0.5s;"></div>' +
'    <div class="sparkle" style="top: 25%; left: 3%; animation-delay: 1s;"></div>' +
'    <div class="sparkle sparkle-large" style="top: 35%; right: 4%; animation-delay: 1.2s;"></div>' +
'    <div class="sparkle" style="top: 50%; left: 5%; animation-delay: 0.4s;"></div>' +
'    <div class="sparkle" style="top: 60%; right: 6%; animation-delay: 1.5s;"></div>' +
'    <div class="sparkle sparkle-large" style="bottom: 30%; left: 8%; animation-delay: 0.8s;"></div>' +
'    <div class="sparkle" style="bottom: 20%; right: 10%; animation-delay: 0.2s;"></div>' +
'    <div class="sparkle" style="bottom: 10%; left: 15%; animation-delay: 1.3s;"></div>' +
'    <div class="sparkle" style="bottom: 5%; right: 20%; animation-delay: 0.6s;"></div>' +
'    <div class="hook">✨ הכרויות בזמן אמת ✨</div>' +
'    <div class="main-title"><span>היא מחליטה</span> ראשונה!</div>' +
'    <div class="subtitle">מצא/י את האחד/ת - כאן ועכשיו</div>' +
'    <div class="logo-section">' +
'      <img src="' + iguanaRadarImg + '" class="logo-img" alt="I4IGUANA">' +
'      <div>' +
'        <div class="logo-text"><span>I4</span>IGUANA</div>' +
'        <div class="logo-sub">Dating App for Real Meetings</div>' +
'      </div>' +
'    </div>' +
'    <div class="features">' +
'      <div class="feature">📍 אנשים באותו מקום</div>' +
'      <div class="feature">⚡ התאמה מיידית</div>' +
'      <div class="feature">💬 צ׳אט פרטי</div>' +
'      <div class="feature">🎯 מפגש אמיתי</div>' +
'    </div>' +
'    <div class="qr-section">' +
'      <img src="' + websiteQrUrl + '" class="qr-code" alt="QR Code">' +
'      <div class="qr-text">' +
'        <h3>סרוק והתחל עכשיו!</h3>' +
'        <p>האפליקציה שמחברת בין אנשים<br>באותו מקום, באותו רגע</p>' +
'        <div class="website-btn">i4iguana.com 🦎</div>' +
'      </div>' +
'    </div>' +
'    <div class="contact">שאלות? <a href="mailto:nir@i4iguana.com">nir@i4iguana.com</a></div>' +
'    <div class="cta-btn"><span class="free-badge">חינם!</span> 🦎 הצטרף/י עכשיו!</div>' +
'  </div>' +
'</body>' +
'</html>'
  }

  // ═══════════════════════════════════════════════════════════════
  // VENUE STICKER
  // ═══════════════════════════════════════════════════════════════
  const generateVenueStickerHTML = (venue: Venue, lang: 'hebrew' | 'english') => {
    const venueQrUrl = 'https://i4iguana-app.vercel.app/checkin/' + venue.id
    const appQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://i4iguana-app.vercel.app&color=0d2920'
    const venueQrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(venueQrUrl) + '&color=0d2920'
    const iguanaRadarImg = 'https://i4iguana-app.vercel.app/iguana-radar.jpg'
    
    const vCardData = 'BEGIN:VCARD\nVERSION:3.0\nFN:Nir Ram\nORG:I4IGUANA\nTITLE:Founder & CEO\nTEL:052-265-3170\nEMAIL:nir@i4iguana.com\nURL:https://i4iguana.com\nEND:VCARD'
    const vCardQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(vCardData) + '&color=0d2920'

    if (lang === 'hebrew') {
      return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>I4IGUANA - מדבקה</title><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Heebo",sans-serif;background:#e0e0e0;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:10px}.sticker{width:20cm;height:20cm;background:white;border-radius:18px;position:relative;display:flex;flex-direction:column;padding:12px 14px;box-shadow:0 4px 20px rgba(0,0,0,0.1)}.sticker::before{content:"";position:absolute;inset:6px;border:3px solid #4ade80;border-radius:14px;pointer-events:none}.corner{position:absolute;width:30px;height:30px}.corner-tl{top:4px;left:4px;border-top:4px solid #0d2920;border-left:4px solid #0d2920;border-radius:12px 0 0 0}.corner-tr{top:4px;right:4px;border-top:4px solid #0d2920;border-right:4px solid #0d2920;border-radius:0 12px 0 0}.corner-bl{bottom:4px;left:4px;border-bottom:4px solid #0d2920;border-left:4px solid #0d2920;border-radius:0 0 0 12px}.corner-br{bottom:4px;right:4px;border-bottom:4px solid #0d2920;border-right:4px solid #0d2920;border-radius:0 0 12px 0}.top-row{display:flex;justify-content:space-between;align-items:flex-start;padding:0 10px;margin-bottom:8px}.contact-card{display:flex;align-items:center;gap:8px;background:#f8f8f8;padding:6px 10px;border-radius:10px;border:1px solid #eee}.contact-card img{width:50px;height:50px;border-radius:6px}.contact-info{text-align:left}.contact-name{font-size:11px;font-weight:700;color:#0d2920}.contact-title{font-size:9px;color:#22c55e;font-weight:600}.contact-detail{font-size:8px;color:#666}.contact-hint{font-size:7px;color:#aaa;margin-top:2px}.venue-tag{background:linear-gradient(135deg,#4ade80,#22c55e);color:#0d2920;padding:8px 16px;border-radius:20px;font-weight:800;font-size:14px}.center-area{text-align:center;padding:10px 0 6px}.logo-circle{width:140px;height:140px;margin:0 auto;background:linear-gradient(135deg,#0d2920,#1a4d3e);border-radius:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(13,41,32,0.4);border:4px solid #4ade80}.logo-inner{width:120px;height:120px;border-radius:20px;overflow:hidden}.logo-inner img{width:100%;height:100%;object-fit:cover}.brand-name{font-size:42px;font-weight:900;color:#0d2920;margin-top:10px;letter-spacing:2px}.brand-name span{color:#22c55e}.tagline-area{text-align:center;padding:6px 0}.main-slogan{font-size:32px;font-weight:900;color:#0d2920}.main-slogan .green{color:#22c55e}.sub-slogan{font-size:16px;color:#666;margin-top:2px}.realtime-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0d2920,#1a4d3e);color:white;padding:8px 20px;border-radius:25px;font-size:14px;font-weight:700;margin-top:8px}.realtime-btn .dot{width:8px;height:8px;background:#4ade80;border-radius:50%;animation:pulse 1.5s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.qr-row{display:flex;justify-content:center;gap:24px;padding:10px 0}.qr-box{text-align:center;background:#f8f8f8;padding:12px;border-radius:14px;border:2px solid #eee}.qr-num{width:24px;height:24px;background:linear-gradient(135deg,#4ade80,#22c55e);color:white;font-size:14px;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:-20px auto 6px}.qr-box img{width:120px;height:120px;border-radius:6px}.qr-text{font-size:11px;font-weight:700;color:#0d2920;margin-top:6px}.footer-text{text-align:center;font-size:10px;color:#bbb;letter-spacing:0.5px;padding:4px 0}@media print{body{background:white;padding:0}.sticker{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="sticker"><div class="corner corner-tl"></div><div class="corner corner-tr"></div><div class="corner corner-bl"></div><div class="corner corner-br"></div><div class="top-row"><div class="contact-card"><img src="' + vCardQrUrl + '" alt="QR"><div class="contact-info"><div class="contact-name">Nir Ram</div><div class="contact-title">Founder & CEO</div><div class="contact-detail">052-265-3170</div><div class="contact-detail">nir@i4iguana.com</div><div class="contact-hint">סרוק לשמירת איש קשר</div></div></div><div class="venue-tag">' + (venue.displayName || venue.name) + ' 📍</div></div><div class="center-area"><div class="logo-circle"><div class="logo-inner"><img src="' + iguanaRadarImg + '" alt="I4IGUANA"></div></div><div class="brand-name"><span>I4</span>IGUANA</div></div><div class="tagline-area"><div class="main-slogan"><span class="green">היא מחליטה</span> ראשונה!</div><div class="sub-slogan">מצא/י מישהו כאן, עכשיו.</div><div class="realtime-btn">✨ הכרויות בזמן אמת <div class="dot"></div></div></div><div class="qr-row"><div class="qr-box"><div class="qr-num">1</div><img src="' + appQrUrl + '" alt="App"><div class="qr-text">📱 הורד את האפליקציה</div></div><div class="qr-box"><div class="qr-num">2</div><img src="' + venueQrApi + '" alt="Venue"><div class="qr-text">📍 סרוק לצ׳ק-אין</div></div></div><div class="footer-text">Dating App for Real Meetings • i4iguana.com</div></div></body></html>'
    } else {
      return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>I4IGUANA - Sticker</title><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Poppins",sans-serif;background:#e0e0e0;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:10px}.sticker{width:20cm;height:20cm;background:white;border-radius:18px;position:relative;display:flex;flex-direction:column;padding:12px 14px;box-shadow:0 4px 20px rgba(0,0,0,0.1)}.sticker::before{content:"";position:absolute;inset:6px;border:3px solid #4ade80;border-radius:14px;pointer-events:none}.corner{position:absolute;width:30px;height:30px}.corner-tl{top:4px;left:4px;border-top:4px solid #0d2920;border-left:4px solid #0d2920;border-radius:12px 0 0 0}.corner-tr{top:4px;right:4px;border-top:4px solid #0d2920;border-right:4px solid #0d2920;border-radius:0 12px 0 0}.corner-bl{bottom:4px;left:4px;border-bottom:4px solid #0d2920;border-left:4px solid #0d2920;border-radius:0 0 0 12px}.corner-br{bottom:4px;right:4px;border-bottom:4px solid #0d2920;border-right:4px solid #0d2920;border-radius:0 0 12px 0}.top-row{display:flex;justify-content:space-between;align-items:flex-start;padding:0 10px;margin-bottom:8px}.contact-card{display:flex;align-items:center;gap:8px;background:#f8f8f8;padding:6px 10px;border-radius:10px;border:1px solid #eee}.contact-card img{width:50px;height:50px;border-radius:6px}.contact-info{text-align:left}.contact-name{font-size:11px;font-weight:700;color:#0d2920}.contact-title{font-size:9px;color:#22c55e;font-weight:600}.contact-detail{font-size:8px;color:#666}.contact-hint{font-size:7px;color:#aaa;margin-top:2px}.venue-tag{background:linear-gradient(135deg,#4ade80,#22c55e);color:#0d2920;padding:8px 16px;border-radius:20px;font-weight:800;font-size:14px}.center-area{text-align:center;padding:10px 0 6px}.logo-circle{width:140px;height:140px;margin:0 auto;background:linear-gradient(135deg,#0d2920,#1a4d3e);border-radius:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(13,41,32,0.4);border:4px solid #4ade80}.logo-inner{width:120px;height:120px;border-radius:20px;overflow:hidden}.logo-inner img{width:100%;height:100%;object-fit:cover}.brand-name{font-size:42px;font-weight:900;color:#0d2920;margin-top:10px;letter-spacing:2px}.brand-name span{color:#22c55e}.tagline-area{text-align:center;padding:6px 0}.main-slogan{font-size:32px;font-weight:900;color:#0d2920}.main-slogan .green{color:#22c55e}.sub-slogan{font-size:16px;color:#666;margin-top:2px}.realtime-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0d2920,#1a4d3e);color:white;padding:8px 20px;border-radius:25px;font-size:14px;font-weight:700;margin-top:8px}.realtime-btn .dot{width:8px;height:8px;background:#4ade80;border-radius:50%;animation:pulse 1.5s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.qr-row{display:flex;justify-content:center;gap:24px;padding:10px 0}.qr-box{text-align:center;background:#f8f8f8;padding:12px;border-radius:14px;border:2px solid #eee}.qr-num{width:24px;height:24px;background:linear-gradient(135deg,#4ade80,#22c55e);color:white;font-size:14px;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:-20px auto 6px}.qr-box img{width:120px;height:120px;border-radius:6px}.qr-text{font-size:11px;font-weight:700;color:#0d2920;margin-top:6px}.footer-text{text-align:center;font-size:10px;color:#bbb;letter-spacing:0.5px;padding:4px 0}@media print{body{background:white;padding:0}.sticker{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="sticker"><div class="corner corner-tl"></div><div class="corner corner-tr"></div><div class="corner corner-bl"></div><div class="corner corner-br"></div><div class="top-row"><div class="contact-card"><img src="' + vCardQrUrl + '" alt="QR"><div class="contact-info"><div class="contact-name">Nir Ram</div><div class="contact-title">Founder & CEO</div><div class="contact-detail">052-265-3170</div><div class="contact-detail">nir@i4iguana.com</div><div class="contact-hint">Scan to save contact</div></div></div><div class="venue-tag">' + (venue.displayName || venue.name) + ' 📍</div></div><div class="center-area"><div class="logo-circle"><div class="logo-inner"><img src="' + iguanaRadarImg + '" alt="I4IGUANA"></div></div><div class="brand-name"><span>I4</span>IGUANA</div></div><div class="tagline-area"><div class="main-slogan"><span class="green">She Decides</span> First!</div><div class="sub-slogan">Find someone here, right now.</div><div class="realtime-btn">✨ Real-time Dating <div class="dot"></div></div></div><div class="qr-row"><div class="qr-box"><div class="qr-num">1</div><img src="' + appQrUrl + '" alt="App"><div class="qr-text">📱 Download the App</div></div><div class="qr-box"><div class="qr-num">2</div><img src="' + venueQrApi + '" alt="Venue"><div class="qr-text">📍 Scan to Check In</div></div></div><div class="footer-text">Dating App for Real Meetings • i4iguana.com</div></div></body></html>'
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CLUB OWNERS PROMOTIONAL STICKER
  // ═══════════════════════════════════════════════════════════════
  const generateClubOwnersStickerHTML = () => {
    const websiteUrl = 'https://i4iguana.com'
    const websiteQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(websiteUrl) + '&color=0d2920'
    
    const vCardData = 'BEGIN:VCARD\nVERSION:3.0\nFN:Nir Ram\nORG:I4IGUANA\nTITLE:Founder & CEO\nTEL:052-265-3170\nEMAIL:nir@i4iguana.com\nURL:https://i4iguana.com\nEND:VCARD'
    const vCardQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(vCardData) + '&color=0d2920'
    const iguanaRadarImg = 'https://i4iguana-app.vercel.app/iguana-radar.jpg'

    return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>I4IGUANA - הצעה לבעלי מקומות בילוי</title><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Heebo",sans-serif;background:#e0e0e0;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:10px}.sticker{width:20cm;height:20cm;background:linear-gradient(160deg,#ffffff 0%,#f0fdf4 100%);border-radius:24px;position:relative;display:flex;flex-direction:column;padding:20px 24px;box-shadow:0 8px 40px rgba(0,0,0,0.1);border:4px solid #22c55e}.badge{position:absolute;top:-12px;right:30px;background:linear-gradient(135deg,#ff6b6b,#ee5a5a);color:white;padding:8px 24px;border-radius:20px;font-weight:800;font-size:16px;box-shadow:0 4px 15px rgba(255,107,107,0.4)}.header{text-align:center;margin-bottom:16px;padding-top:8px}.hook{color:#22c55e;font-size:20px;font-weight:700;margin-bottom:4px}.main-title{font-size:38px;font-weight:900;color:#0d2920;line-height:1.2}.main-title span{color:#22c55e}.subtitle{color:#666;font-size:16px;margin-top:6px}.content-row{display:flex;gap:20px;margin-bottom:16px}.benefits-section{flex:1}.benefits-title{font-size:18px;font-weight:800;color:#0d2920;margin-bottom:10px;display:flex;align-items:center;gap:8px}.benefit-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:white;border-radius:12px;margin-bottom:8px;border:2px solid #e0e0e0}.benefit-icon{width:36px;height:36px;background:linear-gradient(135deg,#4ade80,#22c55e);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}.benefit-text{font-size:14px;font-weight:600;color:#333}.logo-section{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px}.logo-img{width:100px;height:100px;border-radius:24px;border:4px solid #22c55e;box-shadow:0 8px 30px rgba(34,197,94,0.3);margin-bottom:10px;object-fit:cover}.brand-name{font-size:28px;font-weight:900;color:#0d2920}.brand-name span{color:#22c55e}.brand-sub{font-size:12px;color:#666}.bottom-section{display:flex;gap:16px;align-items:stretch}.contact-card{flex:1;background:linear-gradient(135deg,#0d2920,#1a4d3e);border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px}.contact-qr{width:100px;height:100px;background:white;border-radius:10px;padding:6px}.contact-qr img{width:100%;height:100%}.contact-info{color:white}.contact-name{font-size:18px;font-weight:800}.contact-title{font-size:12px;color:#4ade80;font-weight:600}.contact-detail{font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px}.contact-hint{font-size:10px;color:rgba(255,255,255,0.5);margin-top:6px}.website-card{flex:1;background:white;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;border:3px solid #22c55e}.website-qr{width:100px;height:100px}.website-qr img{width:100%;height:100%;border-radius:8px}.website-title{font-size:16px;font-weight:800;color:#0d2920}.website-url{font-size:20px;font-weight:900;color:#22c55e;margin-top:4px}.website-hint{font-size:11px;color:#888;margin-top:6px}.footer{text-align:center;margin-top:14px;padding:10px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:12px}.footer-text{color:white;font-size:18px;font-weight:800}@media print{body{background:white;padding:0}.sticker{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="sticker"><div class="badge">🔥 הצטרפו עכשיו!</div><div class="header"><div class="hook">🦎 אפליקציית ההכרויות החדשה</div><div class="main-title">הפכו את <span>המקום שלכם</span><br>לנקודת מפגש!</div><div class="subtitle">I4IGUANA מביאה לכם קהל חדש ואיכותי</div></div><div class="content-row"><div class="benefits-section"><div class="benefits-title">💎 למה להצטרף?</div><div class="benefit-item"><div class="benefit-icon">👥</div><div class="benefit-text">משיכת קהל רווקים איכותי</div></div><div class="benefit-item"><div class="benefit-icon">📈</div><div class="benefit-text">הגדלת תנועה ומכירות</div></div><div class="benefit-item"><div class="benefit-icon">🎯</div><div class="benefit-text">שיווק ממוקד ואפקטיבי</div></div><div class="benefit-item"><div class="benefit-icon">💰</div><div class="benefit-text">ללא עלות - שותפות WIN-WIN</div></div></div><div class="logo-section"><img src="' + iguanaRadarImg + '" class="logo-img" alt="I4IGUANA"><div class="brand-name"><span>I4</span>IGUANA</div><div class="brand-sub">Dating App for Real Meetings</div></div></div><div class="bottom-section"><div class="contact-card"><div class="contact-qr"><img src="' + vCardQrUrl + '" alt="Contact QR"></div><div class="contact-info"><div class="contact-name">Nir Ram</div><div class="contact-title">Founder & CEO</div><div class="contact-detail">📱 052-265-3170</div><div class="contact-detail">✉️ nir@i4iguana.com</div><div class="contact-hint">📲 סרקו לשמירת איש קשר</div></div></div><div class="website-card"><div class="website-qr"><img src="' + websiteQrUrl + '" alt="Website QR"></div><div class="website-info"><div class="website-title">🌐 בקרו באתר שלנו</div><div class="website-url">i4iguana.com</div><div class="website-hint">סרקו לכניסה לאתר</div></div></div></div><div class="footer"><div class="footer-text">🤝 בואו נעשה היסטוריה ביחד!</div></div></div></body></html>'
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  const getPreviewHTML = () => {
    if (template === 'venue') {
      const venue = venues.find(v => v.id === selectedVenue)
      if (!venue) return ''
      return generateVenueStickerHTML(venue, language)
    } else if (template === 'club-owners') {
      return generateClubOwnersStickerHTML()
    } else if (template === 'customers-dark') {
      return generateCustomersDarkHTML()
    } else if (template === 'customers-light') {
      return generateCustomersLightHTML()
    }
    return ''
  }

  const handlePrint = () => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print()
    }
  }

  const handleDownload = () => {
    const html = getPreviewHTML()
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    if (template === 'venue') {
      const venue = venues.find(v => v.id === selectedVenue)
      a.download = 'i4iguana-sticker-' + (venue?.id || 'venue') + '-' + language + '.html'
    } else {
      a.download = 'i4iguana-' + template + '-sticker.html'
    }
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const canAction = template === 'venue' ? !!selectedVenue : true

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] p-6">
      <div className="max-w-6xl mx-auto mb-8">
        <Link href="/admin/super" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft className="w-5 h-5" /> Back to Super Admin
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <QrCode className="w-8 h-8 text-[#4ade80]" />
          Sticker Generator
        </h1>
        <p className="text-white/60 mt-2">Create professional stickers for venues and promotions</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4ade80]" /> Template
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTemplate('venue')} className={'px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 justify-center ' + (template === 'venue' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30')}>
                <Building2 className="w-4 h-4" /> Venue
              </button>
              <button onClick={() => setTemplate('club-owners')} className={'px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 justify-center ' + (template === 'club-owners' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30')}>
                <Sparkles className="w-4 h-4" /> Club Owners
              </button>
              <button onClick={() => setTemplate('customers-dark')} className={'px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 justify-center ' + (template === 'customers-dark' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30')}>
                <Moon className="w-4 h-4" /> Customers 🌙
              </button>
              <button onClick={() => setTemplate('customers-light')} className={'px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 justify-center ' + (template === 'customers-light' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30')}>
                <Sun className="w-4 h-4" /> Customers ☀️
              </button>
            </div>
          </div>

          {template === 'venue' && (
            <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#4ade80]" /> Venue
              </h2>
              {loading ? (
                <div className="flex items-center gap-2 text-white/60">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading venues...
                </div>
              ) : (
                <select value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)} className="w-full bg-[#0d2920] text-white border border-[#4ade80]/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4ade80]">
                  <option value="">Choose a venue...</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>{venue.displayName || venue.name}</option>
                  ))}
                </select>
              )}
              <p className="text-white/40 text-sm mt-2">{venues.length} venues available</p>
            </div>
          )}

          {template === 'venue' && (
            <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4ade80]" /> Language
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setLanguage('hebrew')} className={'px-4 py-3 rounded-xl font-bold transition-all ' + (language === 'hebrew' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30')}>
                  🇮🇱 עברית
                </button>
                <button onClick={() => setLanguage('english')} className={'px-4 py-3 rounded-xl font-bold transition-all ' + (language === 'english' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30')}>
                  🇺🇸 English
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              <button onClick={handlePrint} disabled={!canAction} className="w-full flex items-center justify-center gap-2 bg-[#4ade80] hover:bg-[#3bc970] disabled:bg-gray-600 text-[#0d2920] font-bold py-3 px-4 rounded-xl">
                <Printer className="w-5 h-5" /> Print Sticker
              </button>
              <button onClick={handleDownload} disabled={!canAction} className="w-full flex items-center justify-center gap-2 bg-[#0d2920] disabled:bg-gray-600 text-white/80 font-bold py-3 px-4 rounded-xl border border-[#4ade80]/30">
                <Download className="w-5 h-5" /> Download HTML
              </button>
            </div>
            <p className="text-white/40 text-sm mt-4 text-center">Sticker size: 20×20 cm</p>
          </div>
        </div>

        <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
          <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
          {canAction ? (
            <div className="bg-gray-200 rounded-xl overflow-hidden aspect-square">
              <iframe ref={iframeRef} srcDoc={getPreviewHTML()} className="w-full h-full border-0" title="Preview" />
            </div>
          ) : (
            <div className="bg-[#0d2920] rounded-xl aspect-square flex items-center justify-center">
              <div className="text-center text-white/40">
                <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{template === 'venue' ? 'Select a venue to preview' : 'Select a template'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
