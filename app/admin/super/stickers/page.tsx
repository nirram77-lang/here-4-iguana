'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Printer, Download, RefreshCw, Building2, QrCode, Sparkles, Target } from 'lucide-react'
import Link from 'next/link'

interface Venue {
  id: string
  name: string
  displayName?: string
}

type TemplateType = 'venue' | 'club-owners' | 'customers'

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
  // VENUE STICKER
  // ═══════════════════════════════════════════════════════════════
  const generateVenueStickerHTML = (venue: Venue, lang: 'hebrew' | 'english') => {
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
      padding: 12px 14px;
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
      padding: 8px 10px;
      margin-top: 6px;
    }
    .contact-card {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 2px solid #4ade80;
      border-radius: 10px;
      padding: 6px 8px;
      background: white;
    }
    .contact-card img {
      width: 52px;
      height: 52px;
      border-radius: 4px;
    }
    .contact-info { text-align: right; }
    .contact-name { font-size: 13px; font-weight: 700; color: #0d2920; }
    .contact-title { font-size: 10px; color: #4ade80; font-weight: 600; }
    .contact-detail { font-size: 9px; color: #555; line-height: 1.3; }
    .contact-hint { font-size: 7px; color: #999; margin-top: 1px; }
    .venue-tag {
      border: 2px solid #4ade80;
      border-radius: 18px;
      padding: 8px 14px;
      background: white;
      font-size: 13px;
      font-weight: 600;
      color: #166534;
    }
    .center-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5px 0;
    }
    .logo-circle {
      width: 210px;
      height: 210px;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    .logo-inner {
      width: 175px;
      height: 175px;
      border-radius: 16px;
      overflow: hidden;
    }
    .logo-inner img { width: 100%; height: 100%; object-fit: cover; }
    .brand-name {
      font-size: 34px;
      font-weight: 900;
      color: #0d2920;
      margin-top: 8px;
      letter-spacing: 2px;
    }
    .brand-name span { color: #4ade80; }
    .tagline-area { text-align: center; padding: 5px 0; }
    .main-slogan { font-size: 28px; font-weight: 900; color: #0d2920; }
    .main-slogan .green { color: #4ade80; }
    .sub-slogan { font-size: 14px; color: #666; margin-top: 2px; }
    .realtime-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 8px;
    }
    .realtime-btn .dot { width: 8px; height: 8px; background: #0d2920; border-radius: 50%; }
    .qr-row { display: flex; justify-content: center; gap: 24px; padding: 10px 0; }
    .qr-box {
      text-align: center;
      background: #f8f8f8;
      padding: 12px;
      border-radius: 14px;
      border: 2px solid #eee;
    }
    .qr-num {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      font-size: 14px;
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -20px auto 6px;
    }
    .qr-box img { width: 120px; height: 120px; border-radius: 6px; }
    .qr-text { font-size: 11px; font-weight: 700; color: #0d2920; margin-top: 6px; }
    .footer-text { text-align: center; font-size: 10px; color: #bbb; letter-spacing: 0.5px; padding: 4px 0; }
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
      <div class="venue-tag">${venue.displayName || venue.name} 📍</div>
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
    </div>
    <div class="center-area">
      <div class="logo-circle">
        <div class="logo-inner">
          <img src="${iguanaRadarImg}" alt="I4IGUANA">
        </div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    <div class="tagline-area">
      <div class="main-slogan">היא <span class="green">מחליטה</span> ראשונה!</div>
      <div class="sub-slogan">מצאו מישהו כאן, עכשיו.</div>
      <div class="realtime-btn">✨ הכרויות בזמן אמת <div class="dot"></div></div>
    </div>
    <div class="qr-row">
      <div class="qr-box">
        <div class="qr-num">2</div>
        <img src="${venueQrApi}" alt="Venue">
        <div class="qr-text">📍 סרוק כאן להצטרפות</div>
      </div>
      <div class="qr-box">
        <div class="qr-num">1</div>
        <img src="${appQrUrl}" alt="App">
        <div class="qr-text">📱 הורד את האפליקציה</div>
      </div>
    </div>
    <div class="footer-text">Dating App for Real Meetings</div>
  </div>
</body>
</html>`
    }

    // ENGLISH
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
      padding: 12px 14px;
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
      padding: 8px 10px;
      margin-top: 6px;
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
      padding: 6px 8px;
      background: white;
    }
    .contact-card img { width: 52px; height: 52px; border-radius: 4px; }
    .contact-info { text-align: left; }
    .contact-name { font-size: 13px; font-weight: 700; color: #0d2920; }
    .contact-title { font-size: 10px; color: #4ade80; font-weight: 600; }
    .contact-detail { font-size: 9px; color: #555; line-height: 1.3; }
    .contact-hint { font-size: 7px; color: #999; margin-top: 1px; }
    .center-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5px 0;
    }
    .logo-circle {
      width: 210px;
      height: 210px;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    .logo-inner { width: 175px; height: 175px; border-radius: 16px; overflow: hidden; }
    .logo-inner img { width: 100%; height: 100%; object-fit: cover; }
    .brand-name { font-size: 34px; font-weight: 900; color: #0d2920; margin-top: 8px; letter-spacing: 2px; }
    .brand-name span { color: #4ade80; }
    .tagline-area { text-align: center; padding: 5px 0; }
    .main-slogan { font-size: 28px; font-weight: 900; color: #0d2920; }
    .main-slogan .green { color: #4ade80; }
    .sub-slogan { font-size: 14px; color: #666; margin-top: 2px; }
    .realtime-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 8px;
    }
    .realtime-btn .dot { width: 8px; height: 8px; background: #0d2920; border-radius: 50%; }
    .qr-row { display: flex; justify-content: center; gap: 24px; padding: 10px 0; }
    .qr-box {
      text-align: center;
      background: #f8f8f8;
      padding: 12px;
      border-radius: 14px;
      border: 2px solid #eee;
    }
    .qr-num {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      font-size: 14px;
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -20px auto 6px;
    }
    .qr-box img { width: 120px; height: 120px; border-radius: 6px; }
    .qr-text { font-size: 11px; font-weight: 700; color: #0d2920; margin-top: 6px; }
    .footer-text { text-align: center; font-size: 10px; color: #bbb; letter-spacing: 0.5px; padding: 4px 0; }
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
          <div class="contact-hint">Scan to save contact</div>
        </div>
      </div>
      <div class="venue-tag">${venue.displayName || venue.name} 📍</div>
    </div>
    <div class="center-area">
      <div class="logo-circle">
        <div class="logo-inner">
          <img src="${iguanaRadarImg}" alt="I4IGUANA">
        </div>
      </div>
      <div class="brand-name"><span>I4</span>IGUANA</div>
    </div>
    <div class="tagline-area">
      <div class="main-slogan"><span class="green">She Decides</span> First!</div>
      <div class="sub-slogan">Find someone here, right now.</div>
      <div class="realtime-btn">✨ Real-time Dating <div class="dot"></div></div>
    </div>
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
    <div class="footer-text">Dating App for Real Meetings</div>
  </div>
</body>
</html>`
  }

  // ═══════════════════════════════════════════════════════════════
  // CLUB OWNERS PROMOTIONAL STICKER
  // ═══════════════════════════════════════════════════════════════
  const generateClubOwnersStickerHTML = () => {
    const websiteUrl = 'https://i4iguana.com'
    const websiteQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl)}&color=0d2920`
    
    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Nir Ram
ORG:I4IGUANA
TITLE:Founder & CEO
TEL:052-265-3170
EMAIL:nir@i4iguana.com
URL:https://i4iguana.com
END:VCARD`
    const vCardQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(vCardData)}&color=0d2920`
    const iguanaRadarImg = 'https://i4iguana-app.vercel.app/iguana-radar.jpg'

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - לבעלי מועדונים</title>
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
      padding: 10px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(145deg, #ffffff 0%, #f8fff8 50%, #ffffff 100%);
      border-radius: 18px;
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 16px 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .sticker::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 10% 20%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 90% 15%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 25% 80%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 75% 85%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 50% 10%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 15% 50%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 85% 55%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 40% 95%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 60% 5%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 5% 90%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 95% 40%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 30% 30%, #4ade80 0.5px, transparent 0.5px),
        radial-gradient(circle at 70% 70%, #4ade80 0.5px, transparent 0.5px);
      opacity: 0.4;
      pointer-events: none;
    }
    .sticker::after {
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
      z-index: 2;
    }
    .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; border-radius: 6px 0 0 0; }
    .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; border-radius: 0 6px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; border-radius: 0 0 0 6px; }
    .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; border-radius: 0 0 6px 0; }
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .header { text-align: center; padding: 8px 0; }
    .hook { font-size: 22px; font-weight: 900; color: #0d2920; margin-bottom: 4px; }
    .hook .highlight { color: #4ade80; }
    .sub-hook { font-size: 13px; color: #555; }
    .main-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 10px 0;
      flex: 1;
    }
    .logo-side { display: flex; flex-direction: column; align-items: center; }
    .logo-circle {
      width: 140px;
      height: 140px;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    .logo-inner { width: 115px; height: 115px; border-radius: 14px; overflow: hidden; }
    .logo-inner img { width: 100%; height: 100%; object-fit: cover; }
    .brand-name { font-size: 24px; font-weight: 900; color: #0d2920; margin-top: 6px; letter-spacing: 1px; }
    .brand-name span { color: #4ade80; }
    .tagline { font-size: 11px; color: #666; margin-top: 2px; }
    .info-side { max-width: 280px; }
    .concept-title { font-size: 20px; font-weight: 900; color: #0d2920; margin-bottom: 8px; }
    .concept-title .green { color: #4ade80; }
    .concept-desc { font-size: 12px; color: #444; line-height: 1.5; margin-bottom: 10px; }
    .benefits { display: flex; flex-direction: column; gap: 6px; }
    .benefit { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #0d2920; font-weight: 600; }
    .benefit-icon {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      flex-shrink: 0;
    }
    .divider { height: 2px; background: linear-gradient(90deg, transparent, #4ade80, transparent); margin: 8px 40px; }
    .bottom-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
    }
    .business-card {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 2px solid #4ade80;
      border-radius: 12px;
      padding: 10px 14px;
      background: white;
    }
    .business-card .qr { width: 70px; height: 70px; border-radius: 6px; }
    .business-card .info { text-align: right; }
    .business-card .name { font-size: 16px; font-weight: 800; color: #0d2920; }
    .business-card .title { font-size: 11px; color: #4ade80; font-weight: 600; }
    .business-card .email { font-size: 11px; color: #555; margin-top: 4px; }
    .business-card .hint { font-size: 9px; color: #999; margin-top: 4px; }
    .website-qr { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .website-qr img { width: 80px; height: 80px; border-radius: 8px; border: 2px solid #4ade80; }
    .website-qr .label { font-size: 10px; font-weight: 700; color: #0d2920; margin-top: 4px; }
    .website-qr .url { font-size: 9px; color: #4ade80; font-weight: 600; }
    .footer { text-align: center; padding: 6px 0; }
    .cta { font-size: 14px; font-weight: 800; color: #0d2920; }
    .cta .green { color: #4ade80; }
    .free-badge {
      display: inline-block;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 4px 16px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
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
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    <div class="content">
      <div class="header">
        <div class="hook">רוצה להפוך את <span class="highlight">המועדון שלך</span> למגנט?</div>
        <div class="sub-hook">אפליקציית הכרויות שמביאה לקוחות חדשים - ישירות אליך</div>
      </div>
      <div class="main-section">
        <div class="info-side">
          <div class="concept-title">היא <span class="green">מחליטה</span> ראשונה!</div>
          <div class="concept-desc">
            אפליקציה שמחברת בין אנשים באותו מקום, באותו רגע.
            הלקוחות סורקים QR בכניסה - ומתחילים להכיר אחד את השני.
            יותר אינטראקציה = יותר זמן במקום = יותר מכירות.
          </div>
          <div class="benefits">
            <div class="benefit">
              <div class="benefit-icon">🎯</div>
              לקוחות רווקים שמגיעים לבד - קהל יעד מושלם
            </div>
            <div class="benefit">
              <div class="benefit-icon">🍹</div>
              פאנל לבעלי מועדון - הגדלת מכירות דרינקים
            </div>
            <div class="benefit">
              <div class="benefit-icon">💰</div>
              בחינם לחלוטין - רק שיתוף פעולה
            </div>
          </div>
        </div>
        <div class="logo-side">
          <div class="logo-circle">
            <div class="logo-inner">
              <img src="${iguanaRadarImg}" alt="I4IGUANA">
            </div>
          </div>
          <div class="brand-name"><span>I4</span>IGUANA</div>
          <div class="tagline">Dating App for Real Meetings</div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="bottom-section">
        <div class="business-card">
          <img src="${vCardQrUrl}" class="qr" alt="QR">
          <div class="info">
            <div class="name">Nir Ram</div>
            <div class="title">Founder & CEO</div>
            <div class="email">nir@i4iguana.com</div>
            <div class="hint">📱 סרוק ליצירת קשר</div>
          </div>
        </div>
        <div class="website-qr">
          <img src="${websiteQrUrl}" alt="Website QR">
          <div class="label">סרוק לאתר</div>
          <div class="url">i4iguana.com</div>
        </div>
      </div>
      <div class="footer">
        <div class="cta">5 דקות שיחה - <span class="green">יכולות לשנות את העסק שלך</span></div>
        <div class="free-badge">✨ חינם לבעלי מועדונים</div>
      </div>
    </div>
  </div>
</body>
</html>\`
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMERS PROMOTIONAL STICKER - WOW FACTOR!
  // ═══════════════════════════════════════════════════════════════
  const generateCustomersStickerHTML = () => {
    const websiteUrl = 'https://i4iguana.com'
    const websiteQrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(websiteUrl)}&color=0d2920\`
    const iguanaRadarImg = 'https://i4iguana-app.vercel.app/iguana-radar.jpg'

    return \`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I4IGUANA - מצא את האחד/ת</title>
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
      padding: 10px;
    }
    .sticker {
      width: 20cm;
      height: 20cm;
      background: linear-gradient(160deg, #0d2920 0%, #1a4d3e 40%, #0d2920 100%);
      border-radius: 20px;
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    /* Animated glow effect */
    .sticker::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 50%);
      animation: pulse 4s ease-in-out infinite;
      pointer-events: none;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    /* Sparkles */
    .sticker::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 15% 15%, #4ade80 2px, transparent 2px),
        radial-gradient(circle at 85% 20%, #4ade80 1.5px, transparent 1.5px),
        radial-gradient(circle at 10% 80%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 90% 85%, #4ade80 2px, transparent 2px),
        radial-gradient(circle at 50% 5%, #4ade80 1.5px, transparent 1.5px),
        radial-gradient(circle at 5% 50%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 95% 45%, #4ade80 1.5px, transparent 1.5px),
        radial-gradient(circle at 30% 95%, #4ade80 1px, transparent 1px),
        radial-gradient(circle at 70% 3%, #4ade80 1px, transparent 1px);
      opacity: 0.6;
      pointer-events: none;
    }
    
    /* Green border glow */
    .border-glow {
      position: absolute;
      inset: 8px;
      border: 3px solid #4ade80;
      border-radius: 16px;
      box-shadow: 0 0 20px rgba(74, 222, 128, 0.3), inset 0 0 20px rgba(74, 222, 128, 0.1);
      pointer-events: none;
    }
    
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      align-items: center;
      text-align: center;
    }
    
    /* Hook - Top */
    .hook {
      margin-top: 15px;
      margin-bottom: 10px;
    }
    
    .hook-text {
      font-size: 18px;
      color: #4ade80;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    /* Main Title */
    .main-title {
      font-size: 42px;
      font-weight: 900;
      color: white;
      margin-bottom: 5px;
      text-shadow: 0 2px 20px rgba(74, 222, 128, 0.5);
    }
    
    .main-title .green {
      color: #4ade80;
    }
    
    .subtitle {
      font-size: 16px;
      color: rgba(255,255,255,0.7);
      margin-bottom: 15px;
    }
    
    /* Logo Section */
    .logo-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 15px 0;
    }
    
    .logo-circle {
      width: 130px;
      height: 130px;
      border: 3px solid #4ade80;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.3);
      box-shadow: 0 0 30px rgba(74, 222, 128, 0.4);
    }
    
    .logo-inner {
      width: 105px;
      height: 105px;
      border-radius: 14px;
      overflow: hidden;
    }
    
    .logo-inner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .brand-text {
      text-align: right;
    }
    
    .brand-name {
      font-size: 36px;
      font-weight: 900;
      color: white;
      letter-spacing: 1px;
    }
    
    .brand-name span {
      color: #4ade80;
    }
    
    .brand-tagline {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      margin-top: 2px;
    }
    
    /* Features */
    .features {
      display: flex;
      gap: 30px;
      margin: 20px 0;
    }
    
    .feature {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    
    .feature-icon {
      width: 45px;
      height: 45px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    }
    
    .feature-text {
      font-size: 11px;
      color: white;
      font-weight: 600;
      max-width: 80px;
    }
    
    /* QR Section */
    .qr-section {
      background: rgba(255,255,255,0.95);
      border-radius: 20px;
      padding: 20px 30px;
      margin: 15px 0;
      display: flex;
      align-items: center;
      gap: 25px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    }
    
    .qr-code {
      width: 110px;
      height: 110px;
      border-radius: 12px;
      border: 3px solid #4ade80;
    }
    
    .qr-info {
      text-align: right;
    }
    
    .qr-title {
      font-size: 18px;
      font-weight: 800;
      color: #0d2920;
      margin-bottom: 5px;
    }
    
    .qr-desc {
      font-size: 12px;
      color: #555;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    
    .qr-url {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    
    /* Contact */
    .contact {
      margin-top: auto;
      padding-top: 10px;
    }
    
    .contact-line {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
    }
    
    .contact-line a {
      color: #4ade80;
      text-decoration: none;
      font-weight: 600;
    }
    
    /* CTA */
    .cta-badge {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0d2920;
      padding: 10px 30px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 800;
      margin-top: 10px;
      box-shadow: 0 4px 20px rgba(74, 222, 128, 0.5);
    }
    
    @media print {
      body { background: white; padding: 0; }
      .sticker { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="border-glow"></div>
    
    <div class="content">
      <!-- Hook -->
      <div class="hook">
        <div class="hook-text">✨ הכרויות בזמן אמת ✨</div>
      </div>
      
      <!-- Main Title -->
      <h1 class="main-title">היא <span class="green">מחליטה</span> ראשונה!</h1>
      <p class="subtitle">מצא/י את האחד/ת - כאן ועכשיו</p>
      
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="brand-text">
          <div class="brand-name"><span>I4</span>IGUANA</div>
          <div class="brand-tagline">Dating App for Real Meetings</div>
        </div>
        <div class="logo-circle">
          <div class="logo-inner">
            <img src="\${iguanaRadarImg}" alt="I4IGUANA">
          </div>
        </div>
      </div>
      
      <!-- Features -->
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📍</div>
          <div class="feature-text">אנשים באותו מקום</div>
        </div>
        <div class="feature">
          <div class="feature-icon">⚡</div>
          <div class="feature-text">התאמה מיידית</div>
        </div>
        <div class="feature">
          <div class="feature-icon">💬</div>
          <div class="feature-text">צ'אט פרטי</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🎯</div>
          <div class="feature-text">מפגש אמיתי</div>
        </div>
      </div>
      
      <!-- QR Section -->
      <div class="qr-section">
        <div class="qr-info">
          <div class="qr-title">סרוק והתחל עכשיו!</div>
          <div class="qr-desc">
            האפליקציה שמחברת בין אנשים<br>
            באותו מקום, באותו רגע
          </div>
          <div class="qr-url">🌐 i4iguana.com</div>
        </div>
        <img src="\${websiteQrUrl}" class="qr-code" alt="QR Code">
      </div>
      
      <!-- Contact -->
      <div class="contact">
        <div class="contact-line">
          שאלות? <a href="mailto:nir@i4iguana.com">nir@i4iguana.com</a>
        </div>
      </div>
      
      <!-- CTA -->
      <div class="cta-badge">🦎 הצטרף/י לאלפי רווקים!</div>
    </div>
  </div>
</body>
</html>\`
  }

  const selectedVenueData = venues.find(v => v.id === selectedVenue)

  const handlePrint = () => {
    let html = ''
    if (template === 'venue' && selectedVenueData) {
      html = generateVenueStickerHTML(selectedVenueData, language)
    } else if (template === 'club-owners') {
      html = generateClubOwnersStickerHTML()
    } else if (template === 'customers') {
      html = generateCustomersStickerHTML()
    }
    if (!html) return
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const handleDownload = () => {
    let html = ''
    let filename = ''
    if (template === 'venue' && selectedVenueData) {
      html = generateVenueStickerHTML(selectedVenueData, language)
      filename = `sticker-${selectedVenueData.name}-${language}.html`
    } else if (template === 'club-owners') {
      html = generateClubOwnersStickerHTML()
      filename = 'sticker-club-owners.html'
    } else if (template === 'customers') {
      html = generateCustomersStickerHTML()
      filename = 'sticker-customers.html'
    }
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPreviewHTML = () => {
    if (template === 'venue' && selectedVenueData) {
      return generateVenueStickerHTML(selectedVenueData, language)
    } else if (template === 'club-owners') {
      return generateClubOwnersStickerHTML()
    } else if (template === 'customers') {
      return generateCustomersStickerHTML()
    }
    return ''
  }

  const canAction = template === 'club-owners' || template === 'customers' || (template === 'venue' && selectedVenueData)

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
            <p className="text-white/60">Create printable stickers (20×20 cm)</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4ade80]" /> סוג תבנית
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setTemplate('venue')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-right ${template === 'venue' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30'}`}
              >
                <Building2 className="w-5 h-5" />
                <div>
                  <div>🏪 מדבקת Venue</div>
                  <div className="text-xs opacity-70">מדבקה למועדון ספציפי</div>
                </div>
              </button>
              <button
                onClick={() => setTemplate('club-owners')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-right ${template === 'club-owners' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30'}`}
              >
                <Target className="w-5 h-5" />
                <div>
                  <div>🎯 מודעה לבעלי מועדונים</div>
                  <div className="text-xs opacity-70">מדבקה שיווקית כללית</div>
                </div>
              </button>
              <button
                onClick={() => setTemplate('customers')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-right ${template === 'customers' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-[#0d2920] text-white/60 border border-[#4ade80]/30'}`}
              >
                <Sparkles className="w-5 h-5" />
                <div>
                  <div>💚 מודעה ללקוחות</div>
                  <div className="text-xs opacity-70">WOW - היא מחליטה ראשונה!</div>
                </div>
              </button>
            </div>
          </div>

          {/* Venue Selection - only for venue template */}
          {template === 'venue' && (
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
          )}

          {/* Language Selection - only for venue template */}
          {template === 'venue' && (
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
          )}

          {/* Actions */}
          <div className="bg-[#1a4d3e]/50 rounded-2xl p-6 border border-[#4ade80]/20">
            <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                disabled={!canAction}
                className="w-full flex items-center justify-center gap-2 bg-[#4ade80] hover:bg-[#3bc970] disabled:bg-gray-600 text-[#0d2920] font-bold py-3 px-4 rounded-xl"
              >
                <Printer className="w-5 h-5" /> Print Sticker
              </button>
              <button
                onClick={handleDownload}
                disabled={!canAction}
                className="w-full flex items-center justify-center gap-2 bg-[#0d2920] disabled:bg-gray-600 text-white/80 font-bold py-3 px-4 rounded-xl border border-[#4ade80]/30"
              >
                <Download className="w-5 h-5" /> Download HTML
              </button>
            </div>
            <p className="text-white/40 text-sm mt-4 text-center">Sticker size: 20×20 cm</p>
          </div>
        </div>

        {/* Preview */}
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
