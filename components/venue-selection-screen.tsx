"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MapPin, 
  Search, 
  Users, 
  Navigation, 
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Venue {
  id: string
  name: string
  displayName: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  radius: number
  active: boolean
  checkedInUsers?: string[]
  stats?: {
    activeNow: number
  }
}

interface VenueWithDistance extends Venue {
  distance: number // in meters
  formattedDistance: string
  activeUsers: number
  isNearby: boolean // within check-in radius
}

interface VenueSelectionScreenProps {
  isOpen: boolean
  onClose: () => void
  onSelectVenue: (venue: Venue) => Promise<void>
  userLocation: { lat: number; lng: number } | null
  onRequestLocation: () => Promise<{ lat: number; lng: number } | null>
}

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Format distance for display
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

export default function VenueSelectionScreen({
  isOpen,
  onClose,
  onSelectVenue,
  userLocation,
  onRequestLocation
}: VenueSelectionScreenProps) {
  const { t, isRTL } = useLanguage()
  
  const [venues, setVenues] = useState<VenueWithDistance[]>([])
  const [filteredVenues, setFilteredVenues] = useState<VenueWithDistance[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingVenue, setLoadingVenue] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationTimestamp, setLocationTimestamp] = useState<number>(0)
  const [viewportHeight, setViewportHeight] = useState<number>(800)

  // ❤️ Floating hearts animation - Hollywood style!
  const [hearts] = useState(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 14 + 16,
      duration: Math.random() * 8 + 18,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.25 + 0.15
    }))
  )

  // Track viewport height for hearts animation
  useEffect(() => {
    const updateHeight = () => setViewportHeight(window.innerHeight)
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // ✅ v2.8.7 FIX: CLEAR state when modal CLOSES to prevent stale data!
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setCurrentLocation(null)
      setVenues([])
      setFilteredVenues([])
      setSearchQuery('')
      setError(null)
      setLoading(true)
      console.log('🧹 Venue modal closed - cleared all state')
    }
  }, [isOpen])

  // ✅ v2.8.7 FIX: Always fetch FRESH location when modal opens!
  // This prevents showing old venues from previous location (e.g., Yes Planet when at home)
  useEffect(() => {
    const fetchFreshLocation = async () => {
      if (!isOpen) return
      
      console.log('🔄 Venue modal opened - fetching FRESH location...')
      setLocationLoading(true)
      setLoading(true)  // Show loading while getting location
      setError(null)
      setVenues([])  // Clear old venues IMMEDIATELY
      setFilteredVenues([])
      
      try {
        // Always request fresh location from GPS
        const freshLocation = await onRequestLocation()
        
        if (freshLocation) {
          console.log(`📍 Fresh location: ${freshLocation.lat.toFixed(4)}, ${freshLocation.lng.toFixed(4)}`)
          setCurrentLocation(freshLocation)
          setLocationTimestamp(Date.now())
        } else if (userLocation) {
          // Fallback to prop if GPS fails
          console.log('⚠️ GPS failed, using prop location')
          setCurrentLocation(userLocation)
        } else {
          console.log('❌ No location available')
          setError('Location access required to find nearby places')
          setLoading(false)
        }
      } catch (err) {
        console.error('❌ Error getting location:', err)
        // Fallback to prop
        if (userLocation) {
          setCurrentLocation(userLocation)
        } else {
          setError('Could not get your location')
          setLoading(false)
        }
      } finally {
        setLocationLoading(false)
      }
    }
    
    fetchFreshLocation()
  }, [isOpen]) // Only depends on isOpen - fresh fetch every time modal opens!

  // Load venues when location is available
  useEffect(() => {
    if (isOpen && currentLocation && !locationLoading) {
      console.log(`🏢 Loading venues for location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`)
      loadVenues()
    }
  }, [isOpen, currentLocation, locationLoading])

  // Filter venues by search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVenues(venues)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = venues.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.displayName.toLowerCase().includes(query) ||
        v.location.address?.toLowerCase().includes(query)
      )
      setFilteredVenues(filtered)
      
      // Log failed search if no results
      if (filtered.length === 0 && searchQuery.length >= 3) {
        logFailedSearch(searchQuery)
      }
    }
  }, [searchQuery, venues])

  // Load venues from database + Firebase featured venues
  const loadVenues = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // ✅ STEP 1: Load venues from local database (Tel Aviv)
      const { ALL_VENUES } = await import('@/lib/tel-aviv-venues')
      
      console.log(`🦎 Loaded ${ALL_VENUES.length} venues from database`)
      
      // Convert to Venue format
      let allVenues: Venue[] = ALL_VENUES.map(v => ({
        id: v.id,
        name: v.name,
        displayName: v.name,
        location: {
          latitude: v.lat,
          longitude: v.lng,
          address: v.address
        },
        radius: 500, // Default 500m check-in radius
        active: true,
        checkedInUsers: [],
        stats: { activeNow: 0 }
      }))
      
      // ✅ STEP 2: Load featured/partner venues from Firebase (Archie Bar, etc.)
      try {
        const { collection, getDocs, query, where } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        const q = query(
          collection(db, 'venues'),
          where('active', '==', true)
        )
        
        const snapshot = await getDocs(q)
        const firebaseVenues: Venue[] = []
        
        snapshot.forEach(doc => {
          firebaseVenues.push({ ...doc.data(), id: doc.id } as Venue)
        })
        
        console.log(`🔥 Loaded ${firebaseVenues.length} featured venues from Firebase`)
        
        // Merge Firebase venues (overwrite if same ID, add if new)
        const dbIds = new Set(allVenues.map(v => v.id))
        firebaseVenues.forEach(fbVenue => {
          if (dbIds.has(fbVenue.id)) {
            // Replace with Firebase version (has real stats)
            const idx = allVenues.findIndex(v => v.id === fbVenue.id)
            if (idx !== -1) allVenues[idx] = fbVenue
          } else {
            // Add new venue from Firebase
            allVenues.push(fbVenue)
          }
        })
        
      } catch (fbErr) {
        console.warn('⚠️ Could not load Firebase venues, using local database only:', fbErr)
      }
      
      console.log(`📍 Total venues: ${allVenues.length}`)
      
      // ✅ STEP 3: Calculate distances and sort
      const venuesWithDistance = allVenues.map(venue => {
        const distance = currentLocation 
          ? calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              venue.location.latitude,
              venue.location.longitude
            )
          : Infinity
        
        return {
          ...venue,
          distance,
          formattedDistance: currentLocation ? formatDistance(distance) : 'Unknown',
          // ✅ v2.8.13 FIX: Prioritize checkedInUsers.length (actual count) over stats.activeNow (may be stale)
          activeUsers: venue.checkedInUsers?.length || venue.stats?.activeNow || 0,
          isNearby: distance <= (venue.radius || 500) // Default 500m radius
        }
      })
      
      // ✅ Filter: Only show venues within 10km (10000 meters)
      const filteredByDistance = venuesWithDistance.filter(v => v.distance <= 10000)
      
      // Sort by distance (nearest first)
      filteredByDistance.sort((a, b) => a.distance - b.distance)
      
      setVenues(filteredByDistance)
      setFilteredVenues(filteredByDistance)
      
      console.log(`✅ Showing ${filteredByDistance.length} venues within 10km`)
      
    } catch (err: any) {
      console.error('❌ Error loading venues:', err)
      setError('Error loading places')
    } finally {
      setLoading(false)
    }
  }

  // Log failed search to Firestore
  const logFailedSearch = async (query: string) => {
    try {
      const { doc, setDoc, getDoc, Timestamp, increment } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      const searchId = query.toLowerCase().replace(/\s+/g, '-')
      const searchRef = doc(db, 'venueSearches', searchId)
      const searchDoc = await getDoc(searchRef)
      
      if (searchDoc.exists()) {
        // Increment count
        await setDoc(searchRef, {
          count: increment(1),
          lastSearched: Timestamp.now()
        }, { merge: true })
      } else {
        // Create new
        await setDoc(searchRef, {
          searchTerm: query,
          count: 1,
          firstSearched: Timestamp.now(),
          lastSearched: Timestamp.now(),
          location: currentLocation || null
        })
      }
      
      console.log(`📝 Logged failed search: "${query}"`)
    } catch (err) {
      console.error('Error logging search:', err)
    }
  }

  // Handle venue selection
  const handleSelectVenue = async (venue: VenueWithDistance) => {
    if (!currentLocation) {
      // Request location first
      setLocationLoading(true)
      const loc = await onRequestLocation()
      setLocationLoading(false)
      
      if (!loc) {
        setError('Location access required to check in')
        return
      }
      setCurrentLocation(loc)
      
      // Recalculate distance
      const distance = calculateDistance(
        loc.lat,
        loc.lng,
        venue.location.latitude,
        venue.location.longitude
      )
      
      if (distance > (venue.radius || 500)) {
        setError(`You're too far from ${venue.displayName}. Get closer to check in.`)
        return
      }
    }
    
    // Check if within radius
    if (currentLocation && !venue.isNearby) {
      setError(`You're too far from ${venue.displayName} (${venue.formattedDistance}). Get closer to check in.`)
      return
    }
    
    setLoadingVenue(venue.id)
    setError(null)
    
    try {
      await onSelectVenue(venue)
    } catch (err: any) {
      setError(err.message || 'Error checking in')
    } finally {
      setLoadingVenue(null)
    }
  }

  // Request location - ✅ v2.8.7: Full refresh with new location
  const handleRequestLocation = async () => {
    console.log('🔄 Manual refresh - getting fresh location...')
    setLocationLoading(true)
    setLoading(true)
    setError(null)
    setVenues([])  // Clear old venues immediately
    setFilteredVenues([])
    
    try {
      const loc = await onRequestLocation()
      if (loc) {
        console.log(`📍 New location: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`)
        setCurrentLocation(loc)
        setLocationTimestamp(Date.now())
        // loadVenues will be called automatically by useEffect
      } else {
        setError('Could not get your location')
        setLoading(false)
      }
    } catch (err: any) {
      setError('Error getting location')
      setLoading(false)
    } finally {
      setLocationLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden relative"
        >
          {/* ❤️ Floating Hearts Background - Hollywood! */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {hearts.map((heart) => (
              <motion.div
                key={`heart-${heart.id}`}
                className="absolute select-none"
                style={{
                  left: `${heart.x}%`,
                  bottom: -40,
                  fontSize: heart.size,
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                }}
                animate={{
                  y: [0, -viewportHeight - 100],
                  opacity: [0, heart.opacity, heart.opacity, 0],
                }}
                transition={{
                  duration: heart.duration,
                  repeat: Infinity,
                  delay: heart.delay,
                  ease: "linear"
                }}
              >
                ❤️
              </motion.div>
            ))}
          </div>

          {/* Header - with iOS safe area padding */}
          <div className="px-6 pt-6 pb-4 border-b border-[#4ade80]/20 relative z-10" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-[#0d2920]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('venueSelection.title')}</h2>
                  <p className="text-sm text-white/60" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('venueSelection.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* ✅ v2.8.7: Refresh button to get fresh location */}
                <Button
                  onClick={handleRequestLocation}
                  disabled={locationLoading || loading}
                  variant="ghost"
                  className="text-white/60 hover:text-[#4ade80] hover:bg-[#4ade80]/10 rounded-full p-2"
                  title="Refresh location"
                >
                  <RefreshCw className={`h-5 w-5 ${(locationLoading || loading) ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('venueSelection.searchPlaceholder')}
                className="pl-10 bg-[#0d2920]/50 border-[#4ade80]/30 text-white placeholder:text-white/40"
              />
            </div>
            
            {/* Location Status - Hollywood Style Button! */}
            {!currentLocation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4"
              >
                <motion.button
                  onClick={handleRequestLocation}
                  disabled={locationLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full overflow-hidden rounded-xl p-4 bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#4ade80] text-[#0d2920] font-bold text-lg shadow-lg shadow-[#4ade80]/30"
                >
                  {/* Animated Glow Background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Pulse Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-white/50"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Button Content */}
                  <div className="relative flex items-center justify-center gap-3">
                    {locationLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <motion.div
                        animate={{
                          y: [0, -3, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Navigation className="h-6 w-6" />
                      </motion.div>
                    )}
                    <span>📍 Enable location to see distances</span>
                  </div>
                </motion.button>
                
                {/* Helper Text */}
                <p className="text-center text-xs text-[#4ade80]/70 mt-2">
                  👆 Tap here to see which places are near you
                </p>
              </motion.div>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          {/* Venues List */}
          <div className="overflow-y-auto max-h-[60vh] p-6 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#4ade80] animate-spin mb-4" />
                <p className="text-white/60">
                  {locationLoading ? '📍 Getting your location...' : '🔍 Loading nearby places...'}
                </p>
                {locationLoading && (
                  <p className="text-xs text-white/40 mt-2">Finding venues near you</p>
                )}
              </div>
            ) : filteredVenues.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No places found</p>
                {searchQuery && (
                  <p className="text-sm text-white/40">
                    Try a different search
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* ✅ CAN CHECK-IN NOW - Venues within 500m (Green) */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {filteredVenues.some(v => v.isNearby) && (
                  <>
                    <div className="mb-3 mt-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-base">📍</span>
                        <div className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse" />
                        <p className="text-sm text-[#4ade80] font-bold uppercase tracking-wide" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('venueSelection.canCheckIn')}
                        </p>
                      </div>
                      <div className="h-px bg-[#4ade80]/30 mt-2" />
                    </div>
                    
                    {filteredVenues.filter(v => v.isNearby).map((venue, index) => (
                      <motion.div
                        key={venue.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative rounded-xl border p-4 transition-all cursor-pointer bg-[#4ade80]/10 border-[#4ade80]/40 hover:border-[#4ade80] mb-3"
                        onClick={() => handleSelectVenue(venue)}
                      >
                        {/* In Range Badge */}
                        <div className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} bg-[#4ade80] text-[#0d2920] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          <CheckCircle className="h-3 w-3" />
                          {t('venueSelection.inRange')}
                        </div>
                        
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Venue Name */}
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
                              <h3 className="text-white font-semibold truncate">
                                {venue.displayName}
                              </h3>
                            </div>
                            
                            {/* Distance & Users */}
                            <div className="flex items-center gap-4 mt-2">
                              {currentLocation && (
                                <div className="flex items-center gap-1.5 text-[#4ade80] font-medium">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-base">{venue.formattedDistance}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-white/60">
                                <Users className="h-3.5 w-3.5" />
                                <span className="text-sm">{venue.activeUsers} {t('venueSelection.active')}</span>
                              </div>
                            </div>
                            
                            {/* Address */}
                            {venue.location.address && (
                              <p className="text-xs text-white/40 mt-1 truncate">
                                {venue.location.address}
                              </p>
                            )}
                          </div>
                          
                          {/* Enter Button - Active */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectVenue(venue)
                            }}
                            disabled={loadingVenue === venue.id}
                            className="shrink-0 bg-[#4ade80] text-[#0d2920] hover:bg-[#4ade80]/80 font-bold"
                            size="sm"
                          >
                            {loadingVenue === venue.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                {t('venueSelection.enter')}
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
                
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* 🔵 NEARBY - Venues beyond 500m but within 10km (Blue) */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {filteredVenues.some(v => !v.isNearby) && (
                  <>
                    <div className="mb-3 mt-6">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-base">📍</span>
                        <div className="h-2 w-2 rounded-full bg-blue-400" />
                        <p className="text-sm text-blue-400 font-bold uppercase tracking-wide" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('venueSelection.nearby')}
                        </p>
                      </div>
                      <div className="h-px bg-blue-400/30 mt-2" />
                    </div>
                    
                    {filteredVenues.filter(v => !v.isNearby).map((venue, index) => (
                      <motion.div
                        key={venue.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="relative rounded-xl border p-4 transition-all bg-[#0d2920]/50 border-white/10 opacity-70 mb-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Venue Name */}
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                              <h3 className="text-white font-semibold truncate">
                                {venue.displayName}
                              </h3>
                            </div>
                            
                            {/* Distance & Users */}
                            <div className="flex items-center gap-4 mt-2">
                              {currentLocation && (
                                <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-base">{venue.formattedDistance}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-white/50">
                                <Users className="h-3.5 w-3.5" />
                                <span className="text-sm">{venue.activeUsers} {t('venueSelection.active')}</span>
                              </div>
                            </div>
                            
                            {/* Address */}
                            {venue.location.address && (
                              <p className="text-xs text-white/30 mt-1 truncate">
                                {venue.location.address}
                              </p>
                            )}
                          </div>
                          
                          {/* Too Far Button - Disabled */}
                          <Button
                            disabled={true}
                            className="shrink-0 bg-white/5 text-white/40 cursor-not-allowed"
                            size="sm"
                          >
                            <Navigation className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {t('venueSelection.tooFar')}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
                
                {/* No nearby venues message */}
                {!filteredVenues.some(v => v.isNearby) && filteredVenues.length > 0 && (
                  <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4 mb-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="flex items-center gap-2 text-[#4ade80]">
                      <Navigation className="h-5 w-5" />
                      <p className="text-sm font-medium">{t('venueSelection.walkCloser')}</p>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      {t('venueSelection.getWithin')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#4ade80]/20 bg-[#0d2920]/50">
            <p className="text-xs text-white/40 text-center" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('venueSelection.checkInToFind')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
