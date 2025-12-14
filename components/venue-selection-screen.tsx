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
    return `${Math.round(meters)} מ'`
  }
  return `${(meters / 1000).toFixed(1)} ק"מ`
}

export default function VenueSelectionScreen({
  isOpen,
  onClose,
  onSelectVenue,
  userLocation,
  onRequestLocation
}: VenueSelectionScreenProps) {
  const [venues, setVenues] = useState<VenueWithDistance[]>([])
  const [filteredVenues, setFilteredVenues] = useState<VenueWithDistance[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingVenue, setLoadingVenue] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(userLocation)

  // Load venues on mount
  useEffect(() => {
    if (isOpen) {
      loadVenues()
    }
  }, [isOpen, currentLocation])

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

  // Load active venues from Firestore
  const loadVenues = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      // Query only active venues
      const q = query(
        collection(db, 'venues'),
        where('active', '==', true)
      )
      
      const snapshot = await getDocs(q)
      const venuesList: Venue[] = []
      
      snapshot.forEach(doc => {
        venuesList.push({ ...doc.data(), id: doc.id } as Venue)
      })
      
      console.log(`🏢 Loaded ${venuesList.length} active venues`)
      
      // Calculate distances and sort by distance
      const venuesWithDistance = venuesList.map(venue => {
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
          formattedDistance: currentLocation ? formatDistance(distance) : 'לא ידוע',
          activeUsers: venue.stats?.activeNow || venue.checkedInUsers?.length || 0,
          isNearby: distance <= (venue.radius || 500) // Default 500m radius
        }
      })
      
      // Sort by distance (nearest first)
      venuesWithDistance.sort((a, b) => a.distance - b.distance)
      
      setVenues(venuesWithDistance)
      setFilteredVenues(venuesWithDistance)
      
    } catch (err: any) {
      console.error('❌ Error loading venues:', err)
      setError('שגיאה בטעינת המועדונים')
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
        setError('נדרשת גישה למיקום כדי להיכנס למועדון')
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
        setError(`אתה רחוק מדי מ-${venue.displayName}. קרב למועדון כדי להיכנס.`)
        return
      }
    }
    
    // Check if within radius
    if (currentLocation && !venue.isNearby) {
      setError(`אתה רחוק מדי מ-${venue.displayName} (${venue.formattedDistance}). קרב למועדון כדי להיכנס.`)
      return
    }
    
    setLoadingVenue(venue.id)
    setError(null)
    
    try {
      await onSelectVenue(venue)
    } catch (err: any) {
      setError(err.message || 'שגיאה בכניסה למועדון')
    } finally {
      setLoadingVenue(null)
    }
  }

  // Request location
  const handleRequestLocation = async () => {
    setLocationLoading(true)
    setError(null)
    
    try {
      const loc = await onRequestLocation()
      if (loc) {
        setCurrentLocation(loc)
        loadVenues() // Reload with new location
      } else {
        setError('לא הצלחנו לקבל את המיקום שלך')
      }
    } catch (err: any) {
      setError('שגיאה בקבלת המיקום')
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
          className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[#4ade80]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-[#0d2920]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">בחר מועדון</h2>
                  <p className="text-sm text-white/60">היכנס למועדון כדי להתחיל</p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="חפש מועדון..."
                className="pr-10 bg-[#0d2920]/50 border-[#4ade80]/30 text-white placeholder:text-white/40"
                dir="rtl"
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
                    <span>📍 הפעל מיקום לראות מרחקים</span>
                  </div>
                </motion.button>
                
                {/* Helper Text */}
                <p className="text-center text-xs text-[#4ade80]/70 mt-2">
                  👆 לחץ כאן כדי לראות איזה מועדונים קרובים אליך
                </p>
              </motion.div>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300" dir="rtl">{error}</p>
            </div>
          )}
          
          {/* Venues List */}
          <div className="overflow-y-auto max-h-[60vh] p-6 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#4ade80] animate-spin mb-4" />
                <p className="text-white/60">טוען מועדונים...</p>
              </div>
            ) : filteredVenues.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">לא נמצאו מועדונים</p>
                {searchQuery && (
                  <p className="text-sm text-white/40">
                    נסה לחפש שם אחר
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Nearby Section */}
                {filteredVenues.some(v => v.isNearby) && (
                  <div className="mb-2">
                    <p className="text-xs text-[#4ade80] font-medium mb-2 flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      מועדונים בקרבתך
                    </p>
                  </div>
                )}
                
                {filteredVenues.map((venue, index) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
                      venue.isNearby 
                        ? 'bg-[#4ade80]/10 border-[#4ade80]/40 hover:border-[#4ade80]' 
                        : 'bg-[#0d2920]/50 border-white/10 hover:border-white/30'
                    }`}
                    onClick={() => handleSelectVenue(venue)}
                  >
                    {/* Nearby Badge */}
                    {venue.isNearby && (
                      <div className="absolute -top-2 -right-2 bg-[#4ade80] text-[#0d2920] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        בטווח
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Venue Name */}
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            venue.isNearby ? 'bg-[#4ade80]' : 'bg-blue-400'
                          }`} />
                          <h3 className="text-white font-semibold truncate">
                            {venue.displayName}
                          </h3>
                        </div>
                        
                        {/* Distance & Users */}
                        <div className="flex items-center gap-4 mt-2">
                          {currentLocation && (
                            <div className="flex items-center gap-1 text-white/60">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="text-sm">{venue.formattedDistance}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-white/60">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-sm">{venue.activeUsers} פעילים</span>
                          </div>
                        </div>
                        
                        {/* Address */}
                        {venue.location.address && (
                          <p className="text-xs text-white/40 mt-1 truncate">
                            {venue.location.address}
                          </p>
                        )}
                      </div>
                      
                      {/* Enter Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectVenue(venue)
                        }}
                        disabled={loadingVenue === venue.id}
                        className={`shrink-0 ${
                          venue.isNearby
                            ? 'bg-[#4ade80] text-[#0d2920] hover:bg-[#4ade80]/80'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        size="sm"
                      >
                        {loadingVenue === venue.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'היכנס'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#4ade80]/20 bg-[#0d2920]/50">
            <p className="text-xs text-white/40 text-center">
              🦎 I4IGUANA - היכנס למועדון כדי למצוא התאמות
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
