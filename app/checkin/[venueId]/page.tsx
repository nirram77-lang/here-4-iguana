"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getVenue, Venue } from '@/lib/venue-service'
import { Smartphone, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CheckInLandingPage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.venueId as string
  
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVenue = async () => {
      try {
        console.log('🏢 Loading venue:', venueId)
        
        const venueData = await getVenue(venueId)
        
        if (!venueData) {
          setError('Venue not found')
          return
        }
        
        setVenue(venueData)
        console.log('✅ Venue loaded:', venueData.displayName)
        
        // ✅ Try to open the app (deep link)
        tryOpenApp(venueId)
        
      } catch (error) {
        console.error('❌ Error loading venue:', error)
        setError('Failed to load venue')
      } finally {
        setLoading(false)
      }
    }

    if (venueId) {
      loadVenue()
    }
  }, [venueId])

  const tryOpenApp = (venueId: string) => {
    // ✅ Try to open the app with deep link
    const deepLink = `i4iguana://checkin/${venueId}`
    
    // For iOS
    window.location.href = deepLink
    
    // Fallback after 2 seconds if app didn't open
    setTimeout(() => {
      // App didn't open, user doesn't have it installed
      console.log('📱 App not installed, showing download options')
    }, 2000)
  }

  const handleOpenInApp = () => {
    // Store venue ID in localStorage for after app opens
    localStorage.setItem('pendingCheckIn', venueId)
    
    // Navigate to home (which will handle the check-in)
    router.push(`/?checkin=${venueId}`)
  }

  const handleDownloadApp = () => {
    // Detect device
    const userAgent = navigator.userAgent || navigator.vendor
    
    if (/android/i.test(userAgent)) {
      // Android
      window.location.href = 'https://play.google.com/store/apps/details?id=com.i4iguana'
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      // iOS
      window.location.href = 'https://apps.apple.com/app/i4iguana/id123456789'
    } else {
      // Desktop - redirect to home
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-8xl"
        >
          🦎
        </motion.div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {error || 'Venue Not Found'}
          </h1>
          <p className="text-white/60">
            Please check the QR code and try again
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] p-4 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2
          }}
          className="text-center mb-6"
        >
          <div className="text-8xl">🦎</div>
        </motion.div>

        {/* Card */}
        <div className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-3xl p-8 shadow-2xl">
          
          {/* Title */}
          <h1 className="text-3xl font-black text-white text-center mb-2">
            Welcome to
          </h1>
          <h2 className="text-4xl font-black text-[#4ade80] text-center mb-6">
            {venue.displayName}
          </h2>

          {/* Address */}
          <div className="flex items-center justify-center gap-2 text-white/60 mb-8">
            <span>📍</span>
            <span className="text-sm">{venue.location.address}</span>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                <span className="text-[#4ade80] font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-semibold">Download I4IGUANA</p>
                <p className="text-white/60 text-sm">Get the app from App Store or Google Play</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                <span className="text-[#4ade80] font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-semibold">Check In</p>
                <p className="text-white/60 text-sm">Scan the QR code to check in at this venue</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                <span className="text-[#4ade80] font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-semibold">Start Matching</p>
                <p className="text-white/60 text-sm">Meet people at the venue right now!</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {/* Already Have App */}
            <Button
              onClick={handleOpenInApp}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] rounded-2xl"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Open in I4IGUANA App
            </Button>

            {/* Download App */}
            <Button
              onClick={handleDownloadApp}
              variant="outline"
              className="w-full h-14 text-lg font-bold border-2 border-[#4ade80]/30 hover:bg-[#4ade80]/10 text-white rounded-2xl"
            >
              <Download className="mr-2 h-5 w-5" />
              Download App
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs">
              🦎 I4IGUANA - Meet people nearby, instantly
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
