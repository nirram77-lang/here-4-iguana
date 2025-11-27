"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QRScanner from './qr-scanner'
import { QRData } from '@/lib/qr-service'
import { performCheckIn, CheckInData } from '@/lib/checkin-service'
import { getVenue } from '@/lib/venue-service'
import { getCurrentLocation } from '@/lib/location-service'
import { auth } from '@/lib/firebase'

interface ScanScreenProps {
  onNavigate: (screen: "home" | "scan") => void
  onCheckInSuccess: (checkInData: CheckInData) => void
}

export default function ScanScreen({ onNavigate, onCheckInSuccess }: ScanScreenProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScanSuccess = async (qrData: QRData) => {
    try {
      setLoading(true)
      setError(null)
      console.log('🎯 QR scan successful:', qrData)

      const user = auth.currentUser
      if (!user) {
        throw new Error('Please login first')
      }

      // Get current location
      console.log('📍 Getting current location...')
      const location = await getCurrentLocation()
      console.log('✅ Location obtained:', location)
      console.log(`📍 GPS Accuracy: ${location.accuracy}m`)

      // Perform check-in (with GPS accuracy for grace margin)
      console.log('✅ Checking in to venue...')
      const checkInData = await performCheckIn(
        user.uid,
        qrData.venueId,
        location.latitude,
        location.longitude,
        location.accuracy  // ✅ NEW: Pass GPS accuracy for better distance check
      )

      console.log('🎉 Check-in successful!', checkInData)

      // Show success and navigate
      setTimeout(() => {
        onCheckInSuccess(checkInData)
        onNavigate('home')
      }, 1000)

    } catch (error: any) {
      console.error('❌ Check-in error:', error)
      setError(error.message || 'Failed to check in')
      setLoading(false)
      setShowScanner(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      {/* Header */}
      <div className="relative flex items-center gap-4 p-4 bg-gradient-to-b from-[#0d2920] to-[#0d2920]/80 border-b border-[#4ade80]/30 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#4ade80]/5 via-transparent to-[#4ade80]/5 blur-xl" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onNavigate("home")} 
          className="relative z-10 rounded-full text-white hover:bg-white/10 transition-all hover:scale-110"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="relative z-10 flex-1">
          <h1 className="font-sans text-3xl font-black text-white tracking-tight">
            Check In
          </h1>
          <p className="text-[#4ade80] text-sm font-semibold mt-0.5">
            Scan QR code to start matching
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Main Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-3xl p-8 shadow-2xl"
          >
            {/* Iguana Icon */}
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
              <div className="text-8xl filter drop-shadow-2xl inline-block">
                🦎
              </div>
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl font-black text-white text-center mb-4">
              Welcome to<br/>IGUANA BAR!
            </h2>
            
            <p className="text-white/70 text-center mb-8">
              Scan the QR code at the venue entrance to check in and start meeting people nearby
            </p>

            {/* Scan Button */}
            <Button
              onClick={() => setShowScanner(true)}
              disabled={loading}
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] rounded-2xl shadow-lg shadow-[#4ade80]/30"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  🔄
                </motion.div>
              ) : (
                <>
                  <span className="text-2xl mr-3">📷</span>
                  Scan QR Code
                </>
              )}
            </Button>

            {/* Features */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Location-Based</h4>
                  <p className="text-white/50 text-xs">Match with people at the same venue</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Meet Instantly</h4>
                  <p className="text-white/50 text-xs">Connect and meet in person right away</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Auto Check-out</h4>
                  <p className="text-white/50 text-xs">4 hours of matching, then auto check-out</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Instructions */}
          <div className="text-center text-white/50 text-sm">
            <p>Look for the Iguana Bar QR code poster</p>
            <p className="mt-1">at the venue entrance or on tables</p>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
