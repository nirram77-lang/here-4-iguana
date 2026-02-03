"use client"

/**
 * 🦎 I4IGUANA - Action Tonight Screen
 * 
 * HOLLYWOOD LEVEL! 🎬
 * 
 * Premium dating app feel:
 * - Floating hearts animation
 * - Smooth entrance animations
 * - Elegant gradients
 * - Mature, classy design
 * 
 * Now using BOUTIQUE ZONES! 🎯
 * Predefined entertainment zones with full control.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Users,
  Map,
  RefreshCw,
  Flame,
  Search,
  Building2,
  Home,
  User,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
// ✅ NEW: Use boutique zones instead of Google Places
import { 
  EntertainmentZone as BoutiqueZone,
  getZonesNearLocation,
  getCurrentZone as getBoutiqueCurrentZone,
  getNearbyZone,
  formatDistance,
  getActiveCities,
  CITIES
} from '@/lib/entertainment-zones'
import { collection, getDocs, doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Types
interface SpecialEvent {
  id: string
  name: string
  venueName: string
  venueId: string
  description?: string
  date: Date
  time: string
  plannedCount: number
  perks?: string[]
  image?: string
  location: { lat: number; lng: number }
}

// ✅ Enhanced zone with activity data
interface EnhancedZone extends BoutiqueZone {
  distance: number
  status: 'inside' | 'preview' | 'far'
  plannedCount: number
  activeCount: number
  heatLevel: 'hot' | 'active' | 'warming' | 'quiet'
  venueCount: number  // For display
}

// ✅ Generic zone interface for callbacks (works with both old and new systems)
interface ZoneCallbackData {
  id: string
  name: string
  center: { lat: number; lng: number }
  distance: number
  [key: string]: any  // Allow additional properties
}

interface ActionTonightScreenProps {
  userLocation: { lat: number; lng: number } | null
  userId?: string
  userName?: string
  onRequestLocation: () => Promise<{ lat: number; lng: number } | null>
  onJoinEvent: (event: SpecialEvent) => void
  onEnterZone: (zone: ZoneCallbackData) => void
  onExploreZone: (zone: ZoneCallbackData) => void
  onBackToModeSelection?: () => void
  onSearchCity?: (city: string) => void
  onSelectVenue?: () => void
  // Navigation
  onNavigateToProfile?: () => void
  onNavigateToNotifications?: () => void
}

export default function ActionTonightScreen({
  userLocation,
  userId,
  userName = 'there',
  onRequestLocation,
  onJoinEvent,
  onEnterZone,
  onExploreZone,
  onSearchCity,
  onSelectVenue,
  onNavigateToProfile,
  onNavigateToNotifications,
  onBackToModeSelection
}: ActionTonightScreenProps) {
  // State
  const [zones, setZones] = useState<EnhancedZone[]>([])
  const [currentZone, setCurrentZone] = useState<EnhancedZone | null>(null)
  const [nearbyZone, setNearbyZone] = useState<EnhancedZone | null>(null) // 500m-1km away
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [showCitySearch, setShowCitySearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const autoLocationTriedRef = useRef(false)  // ✅ v2.8.6: Track if we've tried auto-location
  
  // Viewport height for mobile
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  // Generate floating particles once
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5
    }))
  )
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setTimeout(() => setIsLoaded(true), 50)
    })
    
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  // Load data when location available
  useEffect(() => {
    if (userLocation) {
      loadZones(userLocation.lat, userLocation.lng)
    } else {
      setLoading(false)
      
      // ✅ v2.8.6: Auto-request location on mount if not available (only once)
      if (!autoLocationTriedRef.current) {
        autoLocationTriedRef.current = true
        
        const autoRequestLocation = async () => {
          console.log('📍 Auto-requesting location on mount...')
          setLocationLoading(true)
          try {
            const location = await onRequestLocation()
            if (location) {
              console.log('✅ Auto-location successful!')
              loadZones(location.lat, location.lng)
            } else {
              console.log('⚠️ Auto-location returned null - user needs to click button')
            }
          } catch (err) {
            console.log('⚠️ Auto-location failed - user needs to click button')
          } finally {
            setLocationLoading(false)
          }
        }
        
        // Small delay to let the screen render first
        setTimeout(autoRequestLocation, 500)
      }
    }
  }, [userLocation])

  // 🆕 AUTO-REFRESH: Update location every 30 seconds while screen is active
  // This ensures distance updates as user walks/drives toward zones
  useEffect(() => {
    if (!userLocation) return
    
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing location...')
      try {
        const location = await onRequestLocation()
        if (location) {
          console.log(`📍 New location: ${location.lat}, ${location.lng}`)
          loadZones(location.lat, location.lng)
        }
      } catch (err) {
        console.log('⚠️ Auto-refresh failed, will retry in 30s')
      }
    }, 30000) // Every 30 seconds
    
    return () => {
      console.log('🛑 Stopping auto-refresh')
      clearInterval(refreshInterval)
    }
  }, [userLocation, onRequestLocation])

  // ✅ v2.8.3: REAL-TIME listener for "I'm Going" counts
  // This ensures all devices see the same count instantly!
  const zoneIdsRef = useRef<string[]>([])
  
  useEffect(() => {
    if (zones.length === 0) return
    
    // Get current zone IDs
    const currentZoneIds = zones.map(z => z.id).sort().join(',')
    const prevZoneIds = zoneIdsRef.current.sort().join(',')
    
    // Only setup listeners if zone IDs actually changed
    if (currentZoneIds === prevZoneIds && prevZoneIds !== '') {
      return
    }
    
    zoneIdsRef.current = zones.map(z => z.id)
    console.log('👂 Setting up real-time listener for zone planned counts...')
    
    // Listen to zonePlanned collection for real-time updates
    const unsubscribes: (() => void)[] = []
    
    zones.forEach(zone => {
      const plannedRef = doc(db, 'zonePlanned', zone.id)
      const unsub = onSnapshot(plannedRef, (docSnap) => {
        if (docSnap.exists()) {
          const newCount = docSnap.data()?.count || 0
          console.log(`🔄 Real-time update: ${zone.name} now has ${newCount} planned`)
          
          setZones(prev => prev.map(z => 
            z.id === zone.id ? { ...z, plannedCount: newCount } : z
          ))
        }
      }, (error) => {
        console.log(`⚠️ Listener error for ${zone.id}:`, error)
      })
      
      unsubscribes.push(unsub)
    })
    
    return () => {
      console.log('🛑 Cleaning up zone planned listeners')
      unsubscribes.forEach(unsub => unsub())
    }
  }, [zones])

  const loadZones = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      console.log('🗺️ Loading boutique zones near:', lat, lng)
      
      // ✅ Get predefined boutique zones near user
      const nearbyZones = getZonesNearLocation(lat, lng, 30000) // 30km radius
      console.log(`📍 Found ${nearbyZones.length} boutique zones`)
      
      // Enhance with Firebase activity data
      const enhancedZones: EnhancedZone[] = await Promise.all(
        nearbyZones.map(async (zone) => {
          try {
            // Get active check-ins in this zone
            const checkInsRef = collection(db, 'activeCheckIns')
            const snapshot = await getDocs(checkInsRef)
            
            let activeCount = 0
            snapshot.forEach((docSnap) => {
              const data = docSnap.data()
              if (data.zoneId === zone.id || 
                  (data.location && 
                   calculateDistanceLocal(data.location.lat, data.location.lng, zone.center.lat, zone.center.lng) <= zone.radius)) {
                activeCount++
              }
            })
            
            // Get planned count
            const plannedDoc = await getDoc(doc(db, 'zonePlanned', zone.id))
            const plannedCount = plannedDoc.exists() 
              ? plannedDoc.data()?.count || 0 
              : Math.floor(Math.random() * 20) + 5  // Demo data
            
            // Calculate heat level
            const totalActivity = activeCount + (plannedCount * 0.5)
            let heatLevel: 'hot' | 'active' | 'warming' | 'quiet'
            if (totalActivity >= 15) heatLevel = 'hot'
            else if (totalActivity >= 8) heatLevel = 'active'
            else if (totalActivity >= 3) heatLevel = 'warming'
            else heatLevel = 'quiet'
            
            return { 
              ...zone, 
              activeCount, 
              plannedCount, 
              heatLevel,
              venueCount: Math.floor(zone.radius / 100)  // Estimate based on radius
            }
          } catch (err) {
            return {
              ...zone,
              activeCount: 0,
              plannedCount: Math.floor(Math.random() * 15) + 3,
              heatLevel: 'quiet' as const,
              venueCount: Math.floor(zone.radius / 100)
            }
          }
        })
      )
      
      // ✅ v2.8.5: Sort by DISTANCE first, then by heat
      // Closest zones appear first - more intuitive!
      enhancedZones.sort((a, b) => {
        // 1. Inside zones always first
        const statusOrder = { inside: 0, preview: 1, far: 2 }
        const statusCompare = statusOrder[a.status] - statusOrder[b.status]
        if (statusCompare !== 0) return statusCompare
        
        // 2. Then by distance (closest first!)
        const distanceCompare = a.distance - b.distance
        if (Math.abs(distanceCompare) > 100) return distanceCompare  // Only if >100m difference
        
        // 3. If similar distance, sort by heat
        const heatOrder = { hot: 0, active: 1, warming: 2, quiet: 3 }
        return heatOrder[a.heatLevel] - heatOrder[b.heatLevel]
      })
      
      setZones(enhancedZones)
      
      // Check if user is IN a zone
      const current = enhancedZones.find(z => z.status === 'inside')
      if (current) {
        setCurrentZone(current)
        setNearbyZone(null)
        console.log(`💚 User is INSIDE: ${current.name}`)
      } else {
        setCurrentZone(null)
        // Check if user is in PREVIEW range
        const nearby = enhancedZones.find(z => z.status === 'preview')
        setNearbyZone(nearby || null)
        if (nearby) {
          console.log(`🚶 User is NEAR: ${nearby.name} (${Math.round(nearby.distance)}m)`)
        }
      }
    } catch (err: any) {
      console.error('❌ Error loading zones:', err)
    } finally {
      setLoading(false)
    }
  }

  // Helper: Calculate distance in meters
  const calculateDistanceLocal = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleRequestLocation = async () => {
    setLocationLoading(true)
    try {
      const location = await onRequestLocation()
      if (location) {
        loadZones(location.lat, location.lng)
      } else {
        // ✅ v2.8.6: Show error if location failed
        console.warn('⚠️ Location request returned null')
        alert('לא הצלחנו לקבל את המיקום שלך. נסה שוב או וודא שהפעלת שירותי מיקום.')
      }
    } catch (error) {
      // ✅ v2.8.6: Show error message
      console.error('❌ Location error:', error)
      alert('שגיאה בקבלת מיקום. אנא בדוק שהרשאות המיקום מופעלות.')
    } finally {
      setLocationLoading(false)
    }
  }

  const handleRefresh = () => {
    if (userLocation) {
      loadZones(userLocation.lat, userLocation.lng)
    }
  }

  const handleImComing = async (zone: EnhancedZone) => {
    // ✅ v2.8.3: Update Firebase + local state for real-time sync!
    try {
      console.log(`🙋 User is going to: ${zone.name}`)
      
      // ✅ Update local state immediately for responsive UI
      setZones(prev => prev.map(z => 
        z.id === zone.id ? { ...z, plannedCount: z.plannedCount + 1 } : z
      ))
      
      // ✅ Update Firebase for cross-device sync
      const plannedRef = doc(db, 'zonePlanned', zone.id)
      const plannedDoc = await getDoc(plannedRef)
      
      if (plannedDoc.exists()) {
        // Increment existing count
        const currentCount = plannedDoc.data()?.count || 0
        await setDoc(plannedRef, { 
          count: currentCount + 1,
          zoneId: zone.id,
          zoneName: zone.name,
          lastUpdated: Timestamp.now()
        }, { merge: true })
      } else {
        // Create new document
        await setDoc(plannedRef, { 
          count: 1,
          zoneId: zone.id,
          zoneName: zone.name,
          lastUpdated: Timestamp.now()
        })
      }
      
      console.log(`✅ "I'm Going" saved to Firebase for ${zone.name}`)
      
    } catch (error) {
      console.error('❌ Error saving "I\'m Going":', error)
      // Still keep local update for good UX
    }
  }

  // Helpers
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getHeatColor = (level: string): string => {
    switch (level) {
      case 'hot': return '#ef4444'
      case 'active': return '#f97316'
      case 'warming': return '#eab308'
      default: return '#6b7280'
    }
  }

  const getHeatEmoji = (level: string): string => {
    switch (level) {
      case 'hot': return '🔥'
      case 'active': return '🟠'
      case 'warming': return '🟡'
      default: return '😴'
    }
  }

  return (
    <div 
      className="relative flex flex-col overflow-y-auto"
      style={{ 
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        background: 'linear-gradient(160deg, #0a1f1a 0%, #0d2920 30%, #051410 70%, #030b08 100%)'
      }}
    >
      {/* 💕 Floating Hearts Background - Dating App Feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`heart-${i}`}
            className="absolute text-pink-400/50"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: -30,
              fontSize: 14 + Math.random() * 12,
            }}
            animate={{
              y: [0, -(viewportHeight || 800) - 50],
              x: [0, Math.sin(i) * 20],
              rotate: [0, 360],
              opacity: [0.5, 0.25, 0]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            💕
          </motion.div>
        ))}
      </div>

      {/* ✨ Subtle Green Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-[#4ade80]/20"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* 🌟 Glowing Orb Background */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, rgba(236, 72, 153, 0.04) 50%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header - with iOS safe area padding */}
      <motion.div 
        className="relative z-10 p-6"
        style={{ paddingTop: 'max(2.5rem, calc(env(safe-area-inset-top, 0px) + 1.5rem))' }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -30 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo with Glow */}
        <motion.div
          className="relative flex justify-center mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: isLoaded ? 1 : 0, rotate: isLoaded ? 0 : -180 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="absolute inset-0 blur-2xl bg-[#4ade80]/30 rounded-full scale-150" />
          <span className="relative text-5xl drop-shadow-[0_0_25px_rgba(74,222,128,0.5)]">🦎</span>
        </motion.div>
        
        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-2">
            <span>Where's the</span>
            <motion.span 
              className="bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#15803d] bg-clip-text text-transparent"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Action
            </motion.span>
            <span>?</span>
          </h1>
          
          <motion.p
            className="text-white/60 text-sm flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <span>Hey {userName}!</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              💚
            </motion.span>
            <span>Find your perfect spot</span>
          </motion.p>
        </motion.div>
        
        {/* 🔙 Back Button - Top Left */}
        {onBackToModeSelection && (
          <motion.div 
            className="absolute top-10 left-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={onBackToModeSelection}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-white/10 p-0 hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </Button>
          </motion.div>
        )}
        
        {/* Refresh Button */}
        {userLocation && (
          <motion.div 
            className="absolute top-10 right-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-white/10 p-0 hover:bg-white/20"
            >
              <RefreshCw className={`h-5 w-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content - Scrollable */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-32 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* No Location State */}
        {!userLocation && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div 
              className="relative w-24 h-24 mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="absolute inset-0 blur-xl bg-[#4ade80]/30 rounded-full" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#4ade80]/20 to-[#22c55e]/10 flex items-center justify-center border border-[#4ade80]/30">
                <MapPin className="h-10 w-10 text-[#4ade80]" />
              </div>
            </motion.div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              Where are you?
            </h2>
            <p className="text-white/50 text-center mb-6 max-w-xs text-sm">
              Enable location to discover singles at nearby bars & clubs
            </p>
            
            <Button
              onClick={handleRequestLocation}
              disabled={locationLoading}
              className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:opacity-90 text-[#0d2920] font-bold px-8 py-6 rounded-full text-lg shadow-lg shadow-[#4ade80]/30"
            >
              {locationLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Finding you...
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
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-10 w-10 text-[#4ade80]" />
            </motion.div>
            <p className="text-white/50 mt-4 text-sm">Finding the action...</p>
          </div>
        )}

        {/* Content when loaded */}
        {userLocation && !loading && (
          <>
            {/* 🏢 Join a Venue Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -50 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectVenue?.()}
              className="relative mb-5 rounded-3xl overflow-hidden cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(13,41,32,0.9) 50%, rgba(5,20,16,0.95) 100%)',
                border: '1px solid rgba(74,222,128,0.3)',
              }}
            >
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(74,222,128,0.1) 50%, transparent 60%)',
                }}
              />
              
              <div className="relative p-5">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ade80]/30 to-[#4ade80]/10 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Building2 className="h-7 w-7 text-[#4ade80]" />
                  </motion.div>
                  
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">Join a Venue</h2>
                    <p className="text-white/50 text-sm">Pick a bar or club nearby</p>
                  </div>
                  
                  <ChevronRight className="h-6 w-6 text-[#4ade80]" />
                </div>
                
                <div className="mt-4 pt-4 border-t border-[#4ade80]/20">
                  <p className="text-xs text-white/40">
                    💡 See only singles who are there right now
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Divider */}
            <motion.div 
              className="flex items-center gap-4 my-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="text-white/30 text-xs">or explore</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </motion.div>

            {/* 🔥 Hot Spots Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Flame className="h-5 w-5 text-[#f97316]" />
                  </motion.div>
                  <h2 className="text-lg font-bold text-white">Hot Spots</h2>
                </div>
                
                <button
                  onClick={() => setShowCitySearch(!showCitySearch)}
                  className="flex items-center gap-1 text-white/50 text-xs hover:text-white/80 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>Search city</span>
                </button>
              </div>

              {/* City Search */}
              <AnimatePresence>
                {showCitySearch && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#4ade80]/50 text-sm"
                      />
                      <Button
                        onClick={() => onSearchCity?.(searchQuery)}
                        className="bg-[#4ade80] text-[#0d2920] rounded-xl px-4"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {['Ashkelon', 'Tel Aviv', 'Jerusalem', 'Haifa'].map(city => (
                        <button
                          key={city}
                          onClick={() => onSearchCity?.(city)}
                          className="px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* You're Here Notice */}
              {currentZone && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/10 border border-[#4ade80]/40"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-10 h-10 rounded-full bg-[#4ade80] flex items-center justify-center"
                    >
                      <Sparkles className="h-5 w-5 text-[#0d2920]" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-[#4ade80] font-bold text-sm">You're at {currentZone.name}!</p>
                      <p className="text-white/50 text-xs">{currentZone.activeCount} singles here now</p>
                    </div>
                    <Button
                      onClick={() => onEnterZone(currentZone)}
                      className="bg-[#4ade80] text-[#0d2920] rounded-xl font-bold text-sm px-4"
                    >
                      Start! 💚
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* 🚶 Almost There Notice - 500m to 1km away */}
              {!currentZone && nearbyZone && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-[#f97316]/20 to-[#eab308]/10 border border-[#f97316]/40"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-10 h-10 rounded-full bg-[#f97316]/20 flex items-center justify-center"
                    >
                      <span className="text-xl">🚶</span>
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-[#f97316] font-bold text-sm">Almost there!</p>
                      <p className="text-white/50 text-xs">
                        {formatDistance(nearbyZone.distance)} to {nearbyZone.name} • {nearbyZone.plannedCount + nearbyZone.activeCount} singles waiting!
                      </p>
                    </div>
                    <Button
                      onClick={() => onExploreZone(nearbyZone)}
                      variant="outline"
                      className="border-[#f97316]/50 text-[#f97316] rounded-xl font-bold text-sm px-4 hover:bg-[#f97316]/10"
                    >
                      Preview 👀
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Zones List */}
              <div className="space-y-3">
                {zones.map((zone, index) => {
                  const isHere = zone.status === 'inside'
                  const isNear = zone.status === 'preview'
                  
                  return (
                    <motion.div
                      key={zone.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => isHere ? onEnterZone(zone) : onExploreZone(zone)}
                      className={`relative rounded-2xl p-4 cursor-pointer transition-all ${
                        isHere
                          ? 'bg-[#4ade80]/10 border-2 border-[#4ade80]/50'
                          : isNear
                            ? 'bg-[#f97316]/5 border border-[#f97316]/30'
                            : 'bg-white/5 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {/* Zone Icon */}
                      {zone.icon && (
                        <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-[#0d2920] border border-white/20 flex items-center justify-center text-sm">
                          {zone.icon}
                        </div>
                      )}
                      
                      {/* Heat Badge */}
                      <div 
                        className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                        style={{
                          backgroundColor: `${getHeatColor(zone.heatLevel)}20`,
                          color: getHeatColor(zone.heatLevel),
                          border: `1px solid ${getHeatColor(zone.heatLevel)}40`
                        }}
                      >
                        {getHeatEmoji(zone.heatLevel)}
                        {zone.heatLevel === 'hot' && 'HOT!'}
                        {zone.heatLevel === 'active' && 'Busy'}
                        {zone.heatLevel === 'warming' && 'Warming'}
                        {zone.heatLevel === 'quiet' && 'Quiet'}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getHeatColor(zone.heatLevel) }}
                            animate={zone.heatLevel === 'hot' || zone.heatLevel === 'active' 
                              ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } 
                              : {}
                            }
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          
                          <div>
                            <h3 className="text-white font-semibold">{zone.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-white/40 text-xs">
                                {formatDistance(zone.distance)}
                              </span>
                              <span className="text-white/20">•</span>
                              <span className="text-white/40 text-xs">
                                {zone.city === 'tel-aviv' ? 'Tel Aviv' : 
                                 zone.city === 'ashkelon' ? 'Ashkelon' :
                                 zone.city === 'jerusalem' ? 'Jerusalem' :
                                 zone.city === 'haifa' ? 'Haifa' : zone.city}
                              </span>
                            </div>
                            {zone.vibe && (
                              <p className="text-white/30 text-xs mt-1 truncate max-w-[180px]">
                                {zone.vibe}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-[#4ade80]" />
                              <span className="text-[#4ade80] font-bold text-sm">{zone.plannedCount + zone.activeCount}</span>
                            </div>
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-white/30" />
                        </div>
                      </div>

                      {/* Action hint */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <p className="text-xs text-white/40">
                          {zone.distance <= 100 
                            ? '🟢 You\'re here! Tap to connect'
                            : zone.distance <= 500
                              ? `🚶 Almost there! ${formatDistance(zone.distance)}`
                              : `📍 ${formatDistance(zone.distance)} away`
                          }
                        </p>
                        
                        {/* ✅ v2.8.28: Connect (≤100m) / Almost (100-500m) / Navigate (>500m) */}
                        {zone.distance <= 100 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEnterZone(zone)
                            }}
                            className="text-xs text-[#0d2920] bg-[#4ade80] px-5 py-2 rounded-full font-bold transition-all duration-150 active:scale-95 active:bg-[#22c55e] hover:bg-[#22c55e] shadow-lg shadow-[#4ade80]/30"
                            style={{ minHeight: '44px', minWidth: '100px' }}
                          >
                            Connect! 🟢
                          </button>
                        ) : zone.distance <= 500 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Open Google Maps navigation for short distance
                              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${zone.center.lat},${zone.center.lng}&travelmode=walking`
                              window.open(mapsUrl, '_blank')
                            }}
                            className="text-xs text-[#0d2920] bg-[#f97316] px-5 py-2 rounded-full font-bold transition-all duration-150 active:scale-95 active:bg-[#ea580c] hover:bg-[#ea580c] shadow-lg shadow-[#f97316]/30"
                            style={{ minHeight: '44px', minWidth: '100px' }}
                          >
                            Almost! 🚶
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Open Google Maps navigation
                              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${zone.center.lat},${zone.center.lng}&travelmode=driving`
                              window.open(mapsUrl, '_blank')
                            }}
                            className="text-xs text-white bg-[#3b82f6] px-4 py-1.5 rounded-full font-bold hover:bg-[#2563eb] transition-colors flex items-center gap-1"
                          >
                            <Navigation className="h-3 w-3" />
                            Navigate
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* No Zones */}
              {zones.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Map className="h-8 w-8 text-white/40" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2">
                    It's quiet here
                  </h3>
                  <p className="text-white/50 text-center mb-4 text-sm max-w-xs">
                    No hot spots nearby. Try another city!
                  </p>
                  
                  <Button
                    onClick={() => setShowCitySearch(true)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search city
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-t from-[#030b08] via-[#030b08] to-transparent pt-4">
          <div className="bg-[#0d2920] backdrop-blur-lg border-t border-[#4ade80]/20 px-6 py-3 pb-6">
            <div className="flex items-center justify-around">
              {/* Home - Current Screen */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#4ade80]/20 flex items-center justify-center">
                  <Home className="h-6 w-6 text-[#4ade80]" />
                </div>
                <span className="text-[#4ade80] text-xs font-medium">Home</span>
              </motion.button>
              
              {/* Notifications */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onNavigateToNotifications}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="h-6 w-6 text-white/60" />
                </div>
                <span className="text-white/40 text-xs">Alerts</span>
              </motion.button>
              
              {/* Profile */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onNavigateToProfile}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <User className="h-6 w-6 text-white/60" />
                </div>
                <span className="text-white/40 text-xs">Profile</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
