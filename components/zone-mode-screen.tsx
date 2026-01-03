"use client"

/**
 * 🦎 I4IGUANA - Zone Mode Screen
 * 
 * Shown when user is in an entertainment zone (within 500m)
 * Shows: Singles count, venues nearby, other zones to explore
 * 
 * This is where the magic happens! 🎉
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Navigation, 
  Users,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Map,
  Eye,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  formatDistance,
  getStatusText,
  getStatusColor,
  getVenuesByDistance
} from '@/lib/google-places-service'

// ✅ Generic interface to work with both old and new zone systems
interface ZoneModeScreenProps {
  currentZone: any  // Works with both EntertainmentZone and BoutiqueZone
  userLocation: { lat: number; lng: number }
  otherZones: any[]
  singlesCount: number
  onStartMatching: () => void
  onExploreZone: (zone: any) => void
  onBackToDiscovery: () => void
}

export default function ZoneModeScreen({
  currentZone,
  userLocation,
  otherZones,
  singlesCount,
  onStartMatching,
  onExploreZone,
  onBackToDiscovery
}: ZoneModeScreenProps) {
  const [showOtherZones, setShowOtherZones] = useState(false)
  
  // Viewport height for mobile
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  // Helper: Get status color (works with both old and new zones)
  const getZoneStatusColor = (zone: any): string => {
    // Boutique zones use 'inside' | 'preview' | 'far' or heatLevel
    if (zone.heatLevel) {
      switch (zone.heatLevel) {
        case 'hot': return '#ef4444'
        case 'active': return '#f97316'
        case 'warming': return '#eab308'
        default: return '#6b7280'
      }
    }
    // Old zones use status
    if (zone.status) {
      return getStatusColor(zone.status)
    }
    return '#6b7280'
  }
  
  // Helper: Get status text (works with both old and new zones)
  const getZoneStatusText = (zone: any): string => {
    // Boutique zones use heatLevel
    if (zone.heatLevel) {
      switch (zone.heatLevel) {
        case 'hot': return 'HOT!'
        case 'active': return 'Busy'
        case 'warming': return 'Warming'
        default: return 'Quiet'
      }
    }
    // Old zones use status
    if (zone.status) {
      return getStatusText(zone.status)
    }
    return 'Quiet'
  }
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  // Categorize venues by distance (only if venues exist - for backward compatibility)
  const venueStats = currentZone.venues ? getVenuesByDistance(
    currentZone.venues,
    userLocation.lat,
    userLocation.lng
  ) : { canCheckIn: [], walkingDistance: [] }
  
  const { canCheckIn, walkingDistance } = venueStats

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] overflow-y-auto"
      style={{ 
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%'
      }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        {/* Back Button */}
        <button
          onClick={onBackToDiscovery}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">All Zones</span>
        </button>

        {/* Zone Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[#4ade80] font-bold text-sm uppercase tracking-wide">
              You're in the zone!
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-1">
            {currentZone.name}
          </h1>
          
          <p className="text-white/60 text-sm">
            {currentZone.venueCount || currentZone.vibe || 'Entertainment zone'}
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        
        {/* Singles Count & Start Matching */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#4ade80]/20 to-[#22c55e]/10 border border-[#4ade80]/40 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#4ade80]" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Singles nearby</p>
                <p className="text-3xl font-bold text-white">
                  {singlesCount}
                </p>
              </div>
            </div>
            
            <div className="text-4xl">🦎</div>
          </div>
          
          <Button
            onClick={onStartMatching}
            className="w-full bg-[#4ade80] text-[#0d2920] hover:bg-[#4ade80]/80 font-bold py-6 rounded-xl text-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Start Matching!
          </Button>
          
          <p className="text-center text-white/40 text-xs mt-3">
            Find your match in {currentZone.name} tonight ✨
          </p>
        </motion.div>

        {/* Venues in Zone */}
        <div className="mb-6">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#4ade80]" />
            Venues around you
          </h2>
          
          {/* Can Check-In (0-100m) */}
          {canCheckIn.length > 0 && (
            <div className="mb-4">
              <p className="text-[#4ade80] text-xs font-bold uppercase tracking-wide mb-2">
                🟢 Right here (0-100m)
              </p>
              <div className="space-y-2">
                {canCheckIn.map((venue) => (
                  <div 
                    key={venue.placeId}
                    className="bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                      <span className="text-white font-medium">{venue.name}</span>
                    </div>
                    <span className="text-[#4ade80] text-sm font-medium">
                      {formatDistance(venue.distance || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Walking Distance (100-500m) */}
          {walkingDistance.length > 0 && (
            <div>
              <p className="text-[#fbbf24] text-xs font-bold uppercase tracking-wide mb-2">
                🟡 Walking distance (100-500m)
              </p>
              <div className="space-y-2">
                {walkingDistance.map((venue) => (
                  <div 
                    key={venue.placeId}
                    className="bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                      <span className="text-white font-medium">{venue.name}</span>
                    </div>
                    <span className="text-[#fbbf24] text-sm font-medium">
                      {formatDistance(venue.distance || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Explore Other Zones */}
        {otherZones.length > 0 && (
          <div>
            <button
              onClick={() => setShowOtherZones(!showOtherZones)}
              className="w-full flex items-center justify-between py-3 text-white/60 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span className="font-medium">Explore other zones</span>
              </div>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${showOtherZones ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <AnimatePresence>
              {showOtherZones && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {otherZones.map((zone) => (
                    <motion.div
                      key={zone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => onExploreZone(zone)}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getZoneStatusColor(zone) }}
                        />
                        <div>
                          <p className="text-white font-medium">{zone.name}</p>
                          <p className="text-white/40 text-xs">
                            {formatDistance(zone.distance)} • {zone.vibe || (zone.venueCount ? `${zone.venueCount} venues` : zone.city)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: `${getZoneStatusColor(zone)}20`,
                            color: getZoneStatusColor(zone)
                          }}
                        >
                          {getZoneStatusText(zone)}
                        </span>
                        <Eye className="h-4 w-4 text-white/40" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#4ade80]/20 bg-[#0d2920]/50">
        <p className="text-xs text-white/40 text-center">
          🦎 All singles within 500m of {currentZone.name}
        </p>
      </div>
    </div>
  )
}
