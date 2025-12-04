"use client"

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Share2, Copy, Check, Smartphone, QrCode, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VenueQRTemplateProps {
  venue: {
    id: string
    displayName: string
    qrCodeData?: string
  }
  isOpen: boolean
  onClose: () => void
}

export default function VenueQRTemplate({ venue, isOpen, onClose }: VenueQRTemplateProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)
  
  // URLs
  const appDownloadUrl = 'https://i4iguana-app.vercel.app'
  const venueCheckInUrl = venue.qrCodeData || `https://i4iguana-app.vercel.app/checkin/${venue.id}`
  
  // Copy venue link
  const copyVenueLink = async () => {
    await navigator.clipboard.writeText(venueCheckInUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Download template as image
  const downloadTemplate = async () => {
    if (!templateRef.current) return
    setDownloading(true)
    
    try {
      // Use html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(templateRef.current, {
        backgroundColor: '#0d2920',
        scale: 2, // Higher quality
        useCORS: true,
        logging: false
      })
      
      // Download
      const link = document.createElement('a')
      link.download = `I4IGUANA-${venue.displayName.replace(/\s+/g, '-')}-QR.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('שגיאה בהורדה. נסה שוב.')
    } finally {
      setDownloading(false)
    }
  }
  
  // Share via Web Share API
  const shareTemplate = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I4IGUANA - ${venue.displayName}`,
          text: `סרקו את הקוד להורדת האפליקציה והתחברות ל-${venue.displayName}!`,
          url: venueCheckInUrl
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      copyVenueLink()
    }
  }
  
  if (!isOpen) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        {/* Template Preview */}
        <div
          ref={templateRef}
          className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-6 shadow-2xl border-2 border-[#4ade80]/30"
        >
          {/* Header with Iguana */}
          <div className="text-center mb-6">
            {/* Cute Iguana */}
            <div className="relative inline-block mb-3">
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                  rotate: [-2, 2, -2]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-7xl"
              >
                🦎
              </motion.div>
              {/* Sparkles around iguana */}
              <motion.span
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-2 -right-2 text-xl"
              >
                ✨
              </motion.span>
              <motion.span
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-1 -left-2 text-lg"
              >
                💚
              </motion.span>
            </div>
            
            {/* App Name */}
            <h1 className="text-3xl font-black text-white tracking-tight">
              I<span className="text-[#4ade80]">4</span>IGUANA
            </h1>
            <p className="text-[#4ade80] text-sm font-medium mt-1">
              Scan & Match! 💚
            </p>
          </div>
          
          {/* Venue Name */}
          <div className="text-center mb-6">
            <div className="inline-block bg-[#4ade80]/20 rounded-xl px-4 py-2 border border-[#4ade80]/30">
              <p className="text-white/70 text-xs mb-1">Welcome to</p>
              <h2 className="text-xl font-bold text-white">{venue.displayName}</h2>
            </div>
          </div>
          
          {/* QR Codes Container */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* QR 1: Download App */}
            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Smartphone className="w-4 h-4 text-[#0d2920]" />
                <span className="text-xs font-bold text-[#0d2920]">STEP 1</span>
              </div>
              <QRCodeSVG
                value={appDownloadUrl}
                size={120}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0d2920"
              />
              <p className="text-[#0d2920] text-xs font-bold mt-2">
                הורד את האפליקציה
              </p>
              <p className="text-[#0d2920]/60 text-[10px]">
                Download App
              </p>
            </div>
            
            {/* QR 2: Check-in to Venue */}
            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                <QrCode className="w-4 h-4 text-[#4ade80]" />
                <span className="text-xs font-bold text-[#4ade80]">STEP 2</span>
              </div>
              <QRCodeSVG
                value={venueCheckInUrl}
                size={120}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1a4d3e"
              />
              <p className="text-[#1a4d3e] text-xs font-bold mt-2">
                התחבר למקום
              </p>
              <p className="text-[#1a4d3e]/60 text-[10px]">
                Check-in Here
              </p>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-[#0d2920]/50 rounded-xl p-4 border border-[#4ade80]/20">
            <h3 className="text-[#4ade80] text-sm font-bold mb-2 text-center">
              ⚡ איך זה עובד?
            </h3>
            <div className="space-y-2 text-xs text-white/80">
              <div className="flex items-start gap-2">
                <span className="bg-[#4ade80] text-[#0d2920] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>סרקו את הקוד השמאלי להורדת האפליקציה</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-[#4ade80] text-[#0d2920] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>הירשמו עם חשבון Google או אימייל</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-[#4ade80] text-[#0d2920] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>סרקו את הקוד הימני להתחברות למקום</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-[#4ade80] text-[#0d2920] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                <span>מצאו Match ותהנו! 🎉</span>
              </div>
            </div>
          </div>
          
          {/* Footer with Contact & Teaser */}
          <div className="mt-6 pt-4 border-t border-[#4ade80]/20">
            {/* Teaser */}
            <div className="text-center mb-4">
              <p className="text-[#4ade80] text-sm font-bold mb-1">
                🔥 רוצים גם במקום שלכם?
              </p>
              <p className="text-white/60 text-xs">
                הצטרפו למהפכת ההיכרויות החדשה!
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="bg-[#0d2920]/50 rounded-xl p-3 border border-[#4ade80]/20">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a 
                  href="tel:+972522653170" 
                  className="flex items-center gap-2 text-white/80 hover:text-[#4ade80] transition-colors"
                >
                  <span className="text-lg">📱</span>
                  <span className="text-sm font-medium">052-265-3170</span>
                </a>
                <span className="text-white/30">|</span>
                <a 
                  href="mailto:nir.ram77@gmail.com" 
                  className="flex items-center gap-2 text-white/80 hover:text-[#4ade80] transition-colors"
                >
                  <span className="text-lg">✉️</span>
                  <span className="text-sm font-medium">nir.ram77@gmail.com</span>
                </a>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-center text-white/30 text-[10px] mt-3">
              © I4IGUANA • Dating Made Simple • 2025
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            onClick={downloadTemplate}
            disabled={downloading}
            className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-[#0d2920] font-bold py-3 rounded-xl"
          >
            {downloading ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⏳
                </motion.div>
                מוריד...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                הורד תמונה
              </span>
            )}
          </Button>
          
          <Button
            onClick={shareTemplate}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl border border-white/20"
          >
            <span className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              שתף
            </span>
          </Button>
        </div>
        
        {/* Copy Link */}
        <Button
          onClick={copyVenueLink}
          className="w-full mt-2 bg-transparent hover:bg-white/5 text-white/60 hover:text-white font-medium py-2 rounded-xl border border-white/10"
        >
          <span className="flex items-center gap-2 justify-center">
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#4ade80]" />
                <span className="text-[#4ade80]">הקישור הועתק!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                העתק קישור למקום
              </>
            )}
          </span>
        </Button>
      </motion.div>
    </motion.div>
  )
}
