"use client"

/**
 * 🦎 I4IGUANA - Discovery Screen
 * 
 * Shows entertainment zones near the user
 * Sorted by distance, colored by activity level
 * 
 * Flow: User opens app → sees zones → taps zone → navigates there → enters Zone Mode
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  ChevronRight,
  Sparkles,
  Users,
  Map,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  EntertainmentZone, 
  searchNearbyVenues, 
  clusterVenuesIntoZones,
  getCurrentZone,
  formatDistance,
  getStatusText,
  getStatusColor
} from '@/lib/google-places-service'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface DiscoveryScreenProps {
  userLocation: { lat: number; lng: number } | null
  onRequestLocation: () => Promise<{ lat: number; lng: number } | null>
  onEnterZone: (zone: EntertainmentZone) => void
  onExploreZone: (zone: EntertainmentZone) => void
  onBackToModeSelection?: () => void  // ✅ NEW: Back to mode selection
}

export default function DiscoveryScreen({
  userLocation,
  onRequestLocation,
  onEnterZone,
  onExploreZone,
  onBackToModeSelection
}: DiscoveryScreenProps) {
  const [zones, setZones] = useState<EntertainmentZone[]>([])
  const [currentZone, setCurrentZone] = useState<EntertainmentZone | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // Viewport height for mobile
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  // Load zones when location is available
  useEffect(() => {
    if (userLocation) {
      loadZones(userLocation.lat, userLocation.lng)
    }
  }, [userLocation])

  const loadZones = async (lat: number, lng: number) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Loading entertainment zones...')
      
      // 1. Search for venues within 5km (we'll show up to 2km but search wider for zone detection)
      const venues = await searchNearbyVenues(lat, lng, 5000)
      console.log(`📍 Found ${venues.length} venues`)
      
      // 2. Cluster into zones
      const entertainmentZones = clusterVenuesIntoZones(venues, lat, lng)
      
      // 3. Get active users count for each zone from Firebase
      const zonesWithActivity = await Promise.all(
        entertainmentZones.map(async (zone) => {
          try {
            // Count active check-ins in this zone (within 500m of zone center)
            const checkInsRef = collection(db, 'activeCheckIns')
            const snapshot = await getDocs(checkInsRef)
            
            let activeUsers = 0
            snapshot.forEach((doc) => {
              const data = doc.data()
              if (data.zoneId === zone.id || 
                  (data.location && 
                   Math.abs(data.location.lat - zone.center.lat) < 0.005 &&
                   Math.abs(data.location.lng - zone.center.lng) < 0.005)) {
                activeUsers++
              }
            })
            
            // Determine status based on active users
            let status: 'hot' | 'active' | 'warming' | 'quiet' = 'quiet'
            if (activeUsers >= 10) status = 'hot'
            else if (activeUsers >= 5) status = 'active'
            else if (activeUsers >= 2) status = 'warming'
            
            return { ...zone, activeUsers, status }
          } catch (err) {
            console.error(`Error getting activity for zone ${zone.id}:`, err)
            return zone
          }
        })
      )
      
      // 4. Filter to show only zones within 2km
      const nearbyZones = zonesWithActivity.filter(z => z.distance <= 2000)
      
      setZones(nearbyZones)
      
      // 5. Check if user is currently in a zone
      const current = getCurrentZone(nearbyZones, lat, lng, 500)
      setCurrentZone(current)
      
      // If user is in a zone, automatically enter it
      if (current) {
        console.log(`🎉 User is in ${current.name}! Auto-entering zone...`)
        onEnterZone(current)
      }
      
    } catch (err: any) {
      console.error('❌ Error loading zones:', err)
      setError('Could not load entertainment zones')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestLocation = async () => {
    setLocationLoading(true)
    try {
      const location = await onRequestLocation()
      if (location) {
        loadZones(location.lat, location.lng)
      }
    } finally {
      setLocationLoading(false)
    }
  }

  const handleRefresh = () => {
    if (userLocation) {
      loadZones(userLocation.lat, userLocation.lng)
    }
  }

  // Get zone color based on distance and status
  const getZoneColor = (zone: EntertainmentZone): string => {
    if (zone.distance <= 500) return '#4ade80' // Green - you're here!
    if (zone.distance <= 1000) return '#fbbf24' // Yellow - walking distance
    return '#60a5fa' // Blue - further away
  }

  // Get zone indicator dot color based on activity
  const getActivityDotColor = (status: string): string => {
    switch (status) {
      case 'hot': return '#4ade80'
      case 'active': return '#4ade80'
      case 'warming': return '#fbbf24'
      default: return '#60a5fa'
    }
  }

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden"
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
      {/* 💕 Floating Hearts Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`heart-${i}`}
            className="absolute text-pink-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: -30,
              fontSize: 12 + Math.random() * 10,
            }}
            animate={{
              y: [0, -(viewportHeight || 800) - 50],
              opacity: [0.2, 0.1, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              delay: i * 0.8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            💕
          </motion.div>
        ))}
      </div>
      
      {/* Header */}
      <div className="relative z-10 p-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {onBackToModeSelection && (
              <button
                onClick={onBackToModeSelection}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
            )}
            <div className="text-4xl">🦎</div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Explore Zones
                <span className="text-pink-400 text-lg">💕</span>
              </h1>
              <p className="text-white/60 text-sm">Find singles near you</p>
            </div>
          </div>
          
          {/* Refresh Button */}
          {userLocation && (
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/10"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6">
        
        {/* No Location State */}
        {!userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-[#4ade80]/20 flex items-center justify-center mb-6">
              <MapPin className="h-10 w-10 text-[#4ade80]" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              Enable Location
            </h2>
            <p className="text-white/60 text-center mb-6 max-w-xs">
              We need your location to show entertainment zones near you
            </p>
            
            <Button
              onClick={handleRequestLocation}
              disabled={locationLoading}
              className="bg-[#4ade80] text-[#0d2920] hover:bg-[#4ade80]/80 font-bold px-8 py-6 rounded-full"
            >
              {locationLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Getting location...
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5 mr-2" />
                  Enable Location
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Loading State */}
        {userLocation && loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-[#4ade80] animate-spin mb-4" />
            <p className="text-white/60">Finding entertainment zones...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              className="text-red-400 mt-2"
              size="sm"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Zones List */}
        {userLocation && !loading && zones.length > 0 && (
          <>
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4">
              <Map className="h-5 w-5 text-[#4ade80]" />
              <h2 className="text-lg font-bold text-white">
                Entertainment Zones
              </h2>
            </div>
            
            <p className="text-white/50 text-sm mb-6">
              Tap a zone to see what's happening there
            </p>

            {/* Zone Cards */}
            <div className="space-y-3">
              {zones.map((zone, index) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    if (zone.distance <= 500) {
                      onEnterZone(zone)
                    } else {
                      onExploreZone(zone)
                    }
                  }}
                  className={`relative rounded-2xl border p-4 cursor-pointer transition-all ${
                    zone.distance <= 500
                      ? 'bg-[#4ade80]/10 border-[#4ade80]/40 hover:border-[#4ade80]'
                      : zone.distance <= 1000
                        ? 'bg-[#fbbf24]/5 border-[#fbbf24]/30 hover:border-[#fbbf24]/60'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* You're Here Badge */}
                  {zone.distance <= 500 && (
                    <div className="absolute -top-2 -right-2 bg-[#4ade80] text-[#0d2920] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      You're Here!
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Activity Indicator */}
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          zone.status === 'hot' || zone.status === 'active' 
                            ? 'animate-pulse' 
                            : ''
                        }`}
                        style={{ backgroundColor: getActivityDotColor(zone.status) }}
                      />
                      
                      <div>
                        {/* Zone Name */}
                        <h3 className="text-white font-semibold text-lg">
                          {zone.name}
                        </h3>
                        
                        {/* Distance & Venues */}
                        <div className="flex items-center gap-3 mt-1">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: getZoneColor(zone) }}
                          >
                            {formatDistance(zone.distance)}
                          </span>
                          <span className="text-white/40 text-sm">
                            {zone.venueCount} venues
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <div 
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ 
                          backgroundColor: `${getActivityDotColor(zone.status)}20`,
                          color: getActivityDotColor(zone.status)
                        }}
                      >
                        {getStatusText(zone.status)}
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-white/40" />
                    </div>
                  </div>

                  {/* Action hint */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/40">
                      {zone.distance <= 500 
                        ? '👆 Tap to start matching!'
                        : `📍 ${formatDistance(zone.distance)} away • Tap to explore`
                      }
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* No Zones Found */}
        {userLocation && !loading && zones.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <Map className="h-10 w-10 text-white/40" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              No zones nearby
            </h2>
            <p className="text-white/60 text-center mb-4 max-w-xs">
              Zone Mode works best in entertainment districts with multiple venues.
            </p>
            
            <p className="text-sm text-white/40 mb-6">
              We show zones within 2km
            </p>
            
            {/* Fallback to Venue Mode */}
            {onBackToModeSelection && (
              <Button
                onClick={onBackToModeSelection}
                className="bg-[#4ade80] text-[#0d2920] hover:bg-[#4ade80]/80 font-bold px-8 py-6 rounded-full"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Try Venue Mode Instead
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#4ade80]/20 bg-[#0d2920]/50">
        <p className="text-xs text-white/40 text-center">
          🦎 I4IGUANA • Meet singles where you are
        </p>
      </div>
    </div>
  )
}
