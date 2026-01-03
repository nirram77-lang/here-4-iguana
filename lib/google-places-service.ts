/**
 * 🦎 I4IGUANA - Google Places Service
 * 
 * Fetches entertainment venues (bars, clubs, cafes) from Google Places API
 * and clusters them into Entertainment Zones
 */

// Types
export interface Venue {
  placeId: string
  name: string
  location: {
    lat: number
    lng: number
  }
  address: string
  types: string[]
  rating?: number
  isOpen?: boolean
  distance?: number  // Calculated from user location
}

export interface EntertainmentZone {
  id: string
  name: string
  center: {
    lat: number
    lng: number
  }
  venues: Venue[]
  venueCount: number
  distance: number  // From user location
  activeUsers: number  // From Firebase
  status: 'hot' | 'active' | 'warming' | 'quiet'
}

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
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
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// Get zone status based on active users
export const getZoneStatus = (activeUsers: number): 'hot' | 'active' | 'warming' | 'quiet' => {
  if (activeUsers >= 10) return 'hot'
  if (activeUsers >= 5) return 'active'
  if (activeUsers >= 2) return 'warming'
  return 'quiet'
}

// Get status display text
export const getStatusText = (status: 'hot' | 'active' | 'warming' | 'quiet'): string => {
  switch (status) {
    case 'hot': return '🔥 Buzzing!'
    case 'active': return '✨ Active'
    case 'warming': return '👥 Warming up'
    case 'quiet': return '😴 Quiet'
  }
}

// Get status color
export const getStatusColor = (status: 'hot' | 'active' | 'warming' | 'quiet'): string => {
  switch (status) {
    case 'hot': return '#4ade80'      // Green
    case 'active': return '#4ade80'   // Green
    case 'warming': return '#fbbf24'  // Yellow
    case 'quiet': return '#60a5fa'    // Blue
  }
}

/**
 * 🔍 Search for entertainment venues near a location
 * Uses Google Places API (or fallback for development)
 */
export const searchNearbyVenues = async (
  lat: number,
  lng: number,
  radiusMeters: number = 2000
): Promise<Venue[]> => {
  console.log(`🔍 Searching venues near ${lat}, ${lng} within ${radiusMeters}m`)
  
  // TODO: Replace with actual Google Places API call
  // For now, return mock data for development
  
  // In production:
  // const response = await fetch(
  //   `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
  //   `location=${lat},${lng}` +
  //   `&radius=${radiusMeters}` +
  //   `&type=bar|night_club|cafe` +
  //   `&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`
  // )
  // const data = await response.json()
  // return data.results.map(transformGooglePlace)
  
  // Mock data for Florentin area (Tel Aviv)
  const mockVenues: Venue[] = [
    {
      placeId: 'kuli_alma',
      name: 'Kuli Alma',
      location: { lat: 32.0615, lng: 34.7720 },
      address: 'Mikveh Israel St 10, Tel Aviv',
      types: ['bar', 'night_club'],
      rating: 4.5,
      isOpen: true
    },
    {
      placeId: 'sputnik',
      name: 'Sputnik Bar',
      location: { lat: 32.0620, lng: 34.7725 },
      address: 'Florentin St 25, Tel Aviv',
      types: ['bar'],
      rating: 4.3,
      isOpen: true
    },
    {
      placeId: 'the_block',
      name: 'The Block',
      location: { lat: 32.0608, lng: 34.7715 },
      address: 'Salame St 157, Tel Aviv',
      types: ['night_club'],
      rating: 4.4,
      isOpen: true
    },
    {
      placeId: 'lima_lima',
      name: 'Lima Lima',
      location: { lat: 32.0625, lng: 34.7735 },
      address: 'Florentin St 42, Tel Aviv',
      types: ['bar', 'cafe'],
      rating: 4.2,
      isOpen: true
    },
    {
      placeId: 'alphabet',
      name: 'Alphabet Club',
      location: { lat: 32.0630, lng: 34.7740 },
      address: 'Florentin St 58, Tel Aviv',
      types: ['night_club'],
      rating: 4.6,
      isOpen: true
    },
    // Rothschild area
    {
      placeId: 'bellboy',
      name: 'Bellboy Bar',
      location: { lat: 32.0650, lng: 34.7780 },
      address: 'Rothschild Blvd 14, Tel Aviv',
      types: ['bar'],
      rating: 4.4,
      isOpen: true
    },
    {
      placeId: 'spicehaus',
      name: 'Spicehaus',
      location: { lat: 32.0655, lng: 34.7785 },
      address: 'Rothschild Blvd 22, Tel Aviv',
      types: ['bar', 'restaurant'],
      rating: 4.3,
      isOpen: true
    },
    {
      placeId: 'hotel_montefiore',
      name: 'Hotel Montefiore',
      location: { lat: 32.0660, lng: 34.7790 },
      address: 'Montefiore St 36, Tel Aviv',
      types: ['bar', 'hotel'],
      rating: 4.5,
      isOpen: true
    },
    // TLV Port area
    {
      placeId: 'clara',
      name: 'Clara',
      location: { lat: 32.0970, lng: 34.7720 },
      address: 'Hangar 22, TLV Port',
      types: ['night_club', 'bar'],
      rating: 4.7,
      isOpen: true
    },
    {
      placeId: 'shpagat',
      name: 'Shpagat',
      location: { lat: 32.0975, lng: 34.7725 },
      address: 'Hangar 28, TLV Port',
      types: ['bar', 'restaurant'],
      rating: 4.2,
      isOpen: true
    },
    // Ashkelon Marina
    {
      placeId: 'archie_bar',
      name: 'Archie Bar',
      location: { lat: 31.6697, lng: 34.5565 },
      address: 'Marina, Ashkelon',
      types: ['bar'],
      rating: 4.5,
      isOpen: true
    },
    {
      placeId: 'marina_cafe',
      name: 'Marina Café',
      location: { lat: 31.6700, lng: 34.5560 },
      address: 'Marina, Ashkelon',
      types: ['cafe', 'restaurant'],
      rating: 4.3,
      isOpen: true
    },
    {
      placeId: 'delmare',
      name: 'Delmare',
      location: { lat: 31.6695, lng: 34.5570 },
      address: 'Marina, Ashkelon',
      types: ['bar', 'restaurant'],
      rating: 4.4,
      isOpen: true
    },
    {
      placeId: 'yacht_bar',
      name: 'Yacht Bar',
      location: { lat: 31.6693, lng: 34.5568 },
      address: 'Marina, Ashkelon',
      types: ['bar'],
      rating: 4.2,
      isOpen: true
    },
    // Ashkelon Downtown
    {
      placeId: 'hanasi_cafe',
      name: 'Café HaNasi',
      location: { lat: 31.6688, lng: 34.5743 },
      address: 'HaNasi St, Ashkelon',
      types: ['cafe'],
      rating: 4.1,
      isOpen: true
    },
    {
      placeId: 'bar_central',
      name: 'Bar Central',
      location: { lat: 31.6690, lng: 34.5740 },
      address: 'HaNasi St, Ashkelon',
      types: ['bar'],
      rating: 4.0,
      isOpen: true
    },
    {
      placeId: 'golden_beach',
      name: 'Golden Beach Pub',
      location: { lat: 31.6685, lng: 34.5745 },
      address: 'HaNasi St, Ashkelon',
      types: ['bar', 'pub'],
      rating: 4.2,
      isOpen: true
    },
    // Ashkelon Beach
    {
      placeId: 'ashkelon_beach_bar',
      name: 'Beach Bar Ashkelon',
      location: { lat: 31.6650, lng: 34.5450 },
      address: 'Delila Beach, Ashkelon',
      types: ['bar'],
      rating: 4.3,
      isOpen: true
    }
  ]
  
  // Calculate distances and filter by radius
  const venuesWithDistance = mockVenues.map(venue => ({
    ...venue,
    distance: calculateDistance(lat, lng, venue.location.lat, venue.location.lng)
  }))
  
  return venuesWithDistance
    .filter(v => v.distance! <= radiusMeters)
    .sort((a, b) => a.distance! - b.distance!)
}

/**
 * 🗺️ Cluster venues into Entertainment Zones
 * A zone is created when there are 3+ venues within 500m of each other
 */
export const clusterVenuesIntoZones = (
  venues: Venue[],
  userLat: number,
  userLng: number,
  clusterRadius: number = 500
): EntertainmentZone[] => {
  console.log(`🗺️ Clustering ${venues.length} venues into zones`)
  
  const zones: EntertainmentZone[] = []
  const assignedVenues = new Set<string>()
  
  // Known zone names (for better UX)
  const knownZones: { [key: string]: { lat: number, lng: number, name: string } } = {
    // Tel Aviv
    'florentin': { lat: 32.0620, lng: 34.7725, name: 'Florentin' },
    'rothschild': { lat: 32.0655, lng: 34.7785, name: 'Rothschild' },
    'tlv_port': { lat: 32.0970, lng: 34.7720, name: 'TLV Port' },
    'dizengoff': { lat: 32.0780, lng: 34.7740, name: 'Dizengoff' },
    'neve_tzedek': { lat: 32.0580, lng: 34.7650, name: 'Neve Tzedek' },
    // Ashkelon
    'ashkelon_marina': { lat: 31.6697, lng: 34.5565, name: 'Ashkelon Marina' },
    'ashkelon_downtown': { lat: 31.6688, lng: 34.5743, name: 'Ashkelon Downtown' },
    'ashkelon_beach': { lat: 31.6650, lng: 34.5450, name: 'Ashkelon Beach' },
  }
  
  // Try to match venues to known zones first
  for (const [zoneId, zoneInfo] of Object.entries(knownZones)) {
    const venuesInZone = venues.filter(v => {
      if (assignedVenues.has(v.placeId)) return false
      const distanceToZone = calculateDistance(
        v.location.lat, v.location.lng,
        zoneInfo.lat, zoneInfo.lng
      )
      return distanceToZone <= clusterRadius
    })
    
    if (venuesInZone.length >= 3) {
      // Calculate center of venues
      const centerLat = venuesInZone.reduce((sum, v) => sum + v.location.lat, 0) / venuesInZone.length
      const centerLng = venuesInZone.reduce((sum, v) => sum + v.location.lng, 0) / venuesInZone.length
      
      // Calculate distance from user
      const distanceFromUser = calculateDistance(userLat, userLng, centerLat, centerLng)
      
      zones.push({
        id: zoneId,
        name: zoneInfo.name,
        center: { lat: centerLat, lng: centerLng },
        venues: venuesInZone,
        venueCount: venuesInZone.length,
        distance: distanceFromUser,
        activeUsers: 0,  // Will be updated from Firebase
        status: 'quiet'  // Will be updated based on activeUsers
      })
      
      // Mark venues as assigned
      venuesInZone.forEach(v => assignedVenues.add(v.placeId))
    }
  }
  
  // Sort by distance from user
  zones.sort((a, b) => a.distance - b.distance)
  
  console.log(`✅ Created ${zones.length} entertainment zones`)
  return zones
}

/**
 * 🔥 Check if user is currently in an entertainment zone
 * Returns the zone if within 500m of zone center, null otherwise
 */
export const getCurrentZone = (
  zones: EntertainmentZone[],
  userLat: number,
  userLng: number,
  maxDistance: number = 500
): EntertainmentZone | null => {
  for (const zone of zones) {
    const distance = calculateDistance(
      userLat, userLng,
      zone.center.lat, zone.center.lng
    )
    if (distance <= maxDistance) {
      console.log(`📍 User is in zone: ${zone.name}`)
      return { ...zone, distance }
    }
  }
  console.log('📍 User is not in any entertainment zone')
  return null
}

/**
 * 🎯 Get venues near user within a zone
 * Categorized by distance: green (0-100m), yellow (100-500m)
 */
export const getVenuesByDistance = (
  venues: Venue[],
  userLat: number,
  userLng: number
): {
  canCheckIn: Venue[]    // 0-100m (green)
  walkingDistance: Venue[] // 100-500m (yellow)
} => {
  const venuesWithDistance = venues.map(v => ({
    ...v,
    distance: calculateDistance(userLat, userLng, v.location.lat, v.location.lng)
  }))
  
  return {
    canCheckIn: venuesWithDistance.filter(v => v.distance! <= 100).sort((a, b) => a.distance! - b.distance!),
    walkingDistance: venuesWithDistance.filter(v => v.distance! > 100 && v.distance! <= 500).sort((a, b) => a.distance! - b.distance!)
  }
}
