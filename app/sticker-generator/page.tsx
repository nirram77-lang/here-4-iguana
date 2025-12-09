'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Phone, Mail, MapPin } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// I4IGUANA - Premium Venue Sticker Generator with Business Card
// Hollywood-level design for venue partnerships
// ═══════════════════════════════════════════════════════════════════════════

export default function StickerGenerator() {
  const [venueName, setVenueName] = useState('Archie Bar - Ashkelon')
  const [venueId, setVenueId] = useState('archie-bar-ashkelon')
  const stickerRef = useRef<HTMLDivElement>(null)

  // Contact Info
  const contactInfo = {
    name: 'Nir Ram',
    title: 'Founder & CEO',
    phone: '052-265-3170',
    email: 'nir@i4iguana.com',
    website: 'i4iguana.com',
  }

  // Generate vCard data for QR code
  const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${contactInfo.name}
ORG:I4IGUANA
TITLE:${contactInfo.title}
TEL;TYPE=CELL:${contactInfo.phone}
EMAIL:${contactInfo.email}
URL:https://${contactInfo.website}
END:VCARD`

  // URLs for QR codes
  const appDownloadUrl = 'https://i4iguana.com'
  const checkInUrl = `https://i4iguana-app.vercel.app/app?venue=${venueId}&action=checkin`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Controls */}
      <div className="max-w-md mx-auto mb-8 space-y-4 print:hidden">
        <h1 className="text-2xl font-bold text-white text-center">🦎 Sticker Generator</h1>
        
        <div>
          <label className="block text-white mb-2">Venue Name:</label>
          <input
            type="text"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700"
            placeholder="Enter venue name..."
          />
        </div>
        
        <div>
          <label className="block text-white mb-2">Venue ID (for QR):</label>
          <input
            type="text"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700"
            placeholder="venue-id"
          />
        </div>
        
        <button
          onClick={handlePrint}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Print / Save as PDF
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* THE STICKER - Hollywood Premium Design */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div 
        ref={stickerRef}
        className="mx-auto bg-white print:shadow-none"
        style={{ 
          width: '500px', 
          height: '700px',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        {/* Elegant Border Frame */}
        <div 
          className="w-full h-full p-4"
          style={{
            background: 'white',
            border: '3px solid #16a34a',
            borderRadius: '16px',
            position: 'relative',
          }}
        >
          {/* Inner elegant border */}
          <div 
            className="w-full h-full flex flex-col"
            style={{
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            {/* ══════════════════════════════════════════════════════════ */}
            {/* TOP: Venue Name */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span 
                  className="text-lg font-semibold"
                  style={{ color: '#166534' }}
                >
                  {venueName}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Dating App for Real Meetings
              </div>
            </div>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent flex-1" />
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent flex-1" />
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* LOGO Section */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="flex justify-center mb-2">
              <div 
                className="w-24 h-24 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0a1f1a 0%, #166534 100%)',
                  boxShadow: '0 4px 20px rgba(22, 101, 52, 0.3)',
                }}
              >
                <img
                  src="/iguana-logo.png"
                  alt="I4IGUANA"
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            </div>

            {/* Brand Name */}
            <div className="text-center mb-1">
              <span className="text-2xl font-bold" style={{ color: '#166534' }}>
                I4
              </span>
              <span className="text-2xl font-bold text-gray-800">
                IGUANA
              </span>
            </div>

            {/* Tagline Hebrew */}
            <div className="text-center mb-1">
              <span className="text-lg font-bold text-gray-800">היא </span>
              <span className="text-lg font-bold" style={{ color: '#16a34a' }}>מחליטה </span>
              <span className="text-lg font-bold text-gray-800">ראשונה!</span>
            </div>

            {/* Subtitle */}
            <div className="text-center text-sm text-gray-600 mb-3">
              מצאו מישהו כאן, עכשיו.
            </div>

            {/* CTA Button */}
            <div className="flex justify-center mb-4">
              <div 
                className="px-4 py-1.5 rounded-full text-white text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                }}
              >
                ✨ זיווגים בזמן אמת
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* QR CODES Section */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="flex justify-center gap-6 mb-4">
              {/* QR 1: Download App */}
              <div className="text-center">
                <div 
                  className="bg-white p-2 rounded-lg relative"
                  style={{ 
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <div 
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center"
                  >
                    1
                  </div>
                  <QRCodeSVG
                    value={appDownloadUrl}
                    size={90}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  📲 הורד את האפליקציה
                </div>
              </div>

              {/* QR 2: Check In */}
              <div className="text-center">
                <div 
                  className="bg-white p-2 rounded-lg relative"
                  style={{ 
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <div 
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center"
                  >
                    2
                  </div>
                  <QRCodeSVG
                    value={checkInUrl}
                    size={90}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  📍 סרוק כאן להצטרפות
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* BUSINESS CARD Section */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div 
              className="mt-auto rounded-xl p-3"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0',
              }}
            >
              {/* Header */}
              <div className="text-center mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wider">
                  Interested in Partnership? | מעוניינים בשיתוף פעולה?
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* vCard QR Code */}
                <div className="flex-shrink-0">
                  <div 
                    className="bg-white p-1.5 rounded-lg"
                    style={{ 
                      border: '1px solid #bbf7d0',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <QRCodeSVG
                      value={vCardData}
                      size={60}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-[8px] text-gray-500">Scan to save</span>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="flex-1">
                  {/* Name & Title */}
                  <div className="mb-1">
                    <div className="text-sm font-bold text-gray-800">
                      {contactInfo.name}
                    </div>
                    <div className="text-[10px] text-green-700">
                      {contactInfo.title} • I4IGUANA
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <Phone className="w-3 h-3 text-green-600" />
                      <span>{contactInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <Mail className="w-3 h-3 text-green-600" />
                      <span>{contactInfo.email}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div 
                    className="mt-1.5 text-[9px] text-white text-center py-1 px-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #166534 0%, #16a34a 100%)',
                    }}
                  >
                    Let's Talk! | בואו נדבר!
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FOOTER */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="mt-2 text-center">
              <span 
                className="text-sm font-medium"
                style={{ color: '#16a34a' }}
              >
                {contactInfo.website}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          @page {
            size: 500px 700px;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
