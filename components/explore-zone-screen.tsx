"use client"

/**
 * 🦎 I4IGUANA - Explore Zone Screen
 * 
 * Preview mode - user is looking at a zone they're NOT in
 * Shows what's happening there, encourages them to go!
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Navigation, 
  Users,
  ArrowLeft,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  formatDistance,
  getStatusText,
  getStatusColor
} from '@/lib/google-places-service'

// ✅ Generic interface to work with both old and new zone systems
interface ExploreZoneScreenProps {
  zone: any  // Works with both EntertainmentZone and BoutiqueZone
  userLocation: { lat: number; lng: number }
  onBack: () => void
  onNavigate: (zone: any) => void
}

export default function ExploreZoneScreen({
  zone,
  userLocation,
  onBack,
  onNavigate
}: ExploreZoneScreenProps) {
  // Viewport height for mobile
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  // Open Google Maps for navigation
  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${zone.center.lat},${zone.center.lng}&travelmode=walking`
    window.open(url, '_blank')
    onNavigate(zone)
  }

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]"
      style={{ 
        minHeight: viewportHeight ? `${viewportHeight}px` : '100vh',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Zone Preview Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor(zone.status) }}
            />
            <span 
              className="font-bold text-sm uppercase tracking-wide"
              style={{ color: getStatusColor(zone.status) }}
            >
              {getStatusText(zone.status)}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-1">
            {zone.name}
          </h1>
          
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {formatDistance(zone.distance)} away
            </span>
            <span>•</span>
            <span>{zone.venueCount || zone.vibe || 'Entertainment zone'}</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        
        {/* "Go There" CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 mb-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Navigation className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            Want to join the action?
          </h2>
          
          <p className="text-white/60 mb-6">
            Head to {zone.name} to start matching with singles there!
          </p>
          
          <Button
            onClick={handleNavigate}
            className="w-full bg-white text-[#0d2920] hover:bg-white/90 font-bold py-6 rounded-xl text-lg"
          >
            <Navigation className="h-5 w-5 mr-2" />
            Navigate to {zone.name}
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          
          <p className="text-white/40 text-xs mt-3">
            ~{Math.round(zone.distance / 80)} min walk • Opens in Google Maps
          </p>
        </motion.div>

        {/* Zone Info - Show vibe for boutique zones, venues for old system */}
        <div className="mb-6">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#4ade80]" />
            What's there
          </h2>
          
          {/* Boutique Zone Info */}
          {zone.vibe && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className="text-white/80">{zone.vibe}</p>
              {zone.peakHours && (
                <p className="text-white/40 text-sm mt-2">
                  🕐 Peak hours: {zone.peakHours}
                </p>
              )}
              {zone.icon && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl">{zone.icon}</span>
                  <span className="text-white/50 text-sm">{zone.city === 'tel-aviv' ? 'Tel Aviv' : zone.city === 'ashkelon' ? 'Ashkelon' : zone.city}</span>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Legacy: Venues List (if available) */}
          {zone.venues && zone.venues.length > 0 && (
            <div className="space-y-2">
              {zone.venues.slice(0, 5).map((venue: any, index: number) => (
                <motion.div 
                  key={venue.placeId || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                    <span className="text-white/80 font-medium">{venue.name}</span>
                  </div>
                  {venue.types && venue.types[0] && (
                    <span className="text-white/40 text-xs capitalize">
                      {venue.types[0].replace('_', ' ')}
                    </span>
                  )}
                </motion.div>
              ))}
              
              {zone.venues.length > 5 && (
                <p className="text-white/40 text-sm text-center py-2">
                  +{zone.venues.length - 5} more venues
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-white font-medium mb-1">How it works</p>
              <p className="text-white/60 text-sm">
                When you arrive at {zone.name}, the app will automatically detect you're there and show you all the singles in the area!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-6 py-4 border-t border-[#4ade80]/20 bg-[#0d2920]/50"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
      >
        <p className="text-xs text-white/40 text-center">
          🦎 Go there to start matching!
        </p>
      </div>
    </div>
  )
}
