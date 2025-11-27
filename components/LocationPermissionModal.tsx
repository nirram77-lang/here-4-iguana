"use client"

import { useState } from "react"
import { MapPin, X } from "lucide-react"

interface LocationPermissionModalProps {
  onPermissionGranted: () => void
  onPermissionDenied: () => void
}

export default function LocationPermissionModal({ 
  onPermissionGranted, 
  onPermissionDenied 
}: LocationPermissionModalProps) {
  const [isVisible] = useState(true) // Always show when component mounts

  const handleAllow = async () => {
    try {
      // Request permission - Chrome will show its native dialog
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })
      
      console.log('✅ Location permission granted:', position.coords)
      onPermissionGranted()
    } catch (error: any) {
      console.error('❌ Location permission denied:', error)
      
      // Only show instructions if explicitly denied (not timeout)
      if (error.code === 1) { // PERMISSION_DENIED
        // User explicitly denied - close modal and notify parent
        onPermissionDenied()
      } else {
        // Other error (timeout, unavailable) - try again
        onPermissionDenied()
      }
    }
  }

  const handleDeny = () => {
    onPermissionDenied()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-green-500/30 rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
        {/* Close button - optional */}
        <button
          onClick={handleDeny}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse">
            <MapPin className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text">
          📍 Location Access Required
        </h2>

        {/* Description */}
        <p className="text-zinc-300 text-center mb-6 leading-relaxed">
          I4IGUANA needs your location to find nearby matches and show you people around you.
        </p>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-6">
          <p className="text-sm text-zinc-400 text-center">
            ✨ We respect your privacy<br/>
            🔒 Your exact location is never shared<br/>
            📍 Only used to find nearby matches
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAllow}
            className="w-full bg-gradient-to-r from-green-400 to-green-600 text-black font-bold py-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/50"
          >
            ✅ Allow Location Access
          </button>
          
          <button
            onClick={handleDeny}
            className="w-full bg-zinc-800 text-zinc-300 font-semibold py-4 rounded-full hover:bg-zinc-700 active:scale-95 transition-all"
          >
            ❌ Not Now
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-zinc-500 text-center mt-6">
          You can change this setting anytime in your browser settings
        </p>
      </div>
    </div>
  )
}
