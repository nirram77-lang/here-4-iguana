/**
 * 🦎 I4IGUANA - Google Places Import Service
 * 
 * Import entertainment venues from Google Places API
 * Supports any city worldwide, starting with Israel
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface GooglePlaceResult {
  place_id: string
  name: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  vicinity?: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  types: string[]
  opening_hours?: {
    open_now?: boolean
  }
  price_level?: number
  photos?: Array<{
    photo_reference: string
  }>
}

export interface ImportedVenue {
  id: string  // Google place_id
  name: string
  lat: number
  lng: number
  address: string
  rating: number
  ratingsCount: number
  types: string[]
  isOpen: boolean
  priceLevel: number
  photoRef?: string
  city: string
  country: string
  importedAt: Date
  active: boolean
}

export interface CityConfig {
  name: string
  nameHe: string
  lat: number
  lng: number
  country: string
  defaultRadius: number  // meters
}

// ═══════════════════════════════════════════════════════════════════════════
// ISRAELI CITIES DATABASE
// ═══════════════════════════════════════════════════════════════════════════

export const ISRAEL_CITIES: CityConfig[] = [
  // Major Cities
  { name: 'Tel Aviv', nameHe: 'תל אביב', lat: 32.0853, lng: 34.7818, country: 'Israel', defaultRadius: 8000 },
  { name: 'Jerusalem', nameHe: 'ירושלים', lat: 31.7683, lng: 35.2137, country: 'Israel', defaultRadius: 6000 },
  { name: 'Haifa', nameHe: 'חיפה', lat: 32.7940, lng: 34.9896, country: 'Israel', defaultRadius: 5000 },
  { name: 'Beer Sheva', nameHe: 'באר שבע', lat: 31.2530, lng: 34.7915, country: 'Israel', defaultRadius: 4000 },
  { name: 'Eilat', nameHe: 'אילת', lat: 29.5577, lng: 34.9519, country: 'Israel', defaultRadius: 5000 },
  
  // Coastal Cities
  { name: 'Netanya', nameHe: 'נתניה', lat: 32.3215, lng: 34.8532, country: 'Israel', defaultRadius: 4000 },
  { name: 'Ashdod', nameHe: 'אשדוד', lat: 31.8044, lng: 34.6553, country: 'Israel', defaultRadius: 4000 },
  { name: 'Ashkelon', nameHe: 'אשקלון', lat: 31.6688, lng: 34.5743, country: 'Israel', defaultRadius: 4000 },
  { name: 'Herzliya', nameHe: 'הרצליה', lat: 32.1663, lng: 34.8436, country: 'Israel', defaultRadius: 3000 },
  { name: 'Bat Yam', nameHe: 'בת ים', lat: 32.0231, lng: 34.7503, country: 'Israel', defaultRadius: 3000 },
  
  // Central
  { name: 'Ramat Gan', nameHe: 'רמת גן', lat: 32.0680, lng: 34.8248, country: 'Israel', defaultRadius: 3000 },
  { name: 'Petah Tikva', nameHe: 'פתח תקווה', lat: 32.0868, lng: 34.8870, country: 'Israel', defaultRadius: 4000 },
  { name: 'Rishon LeZion', nameHe: 'ראשון לציון', lat: 31.9730, lng: 34.7925, country: 'Israel', defaultRadius: 4000 },
  { name: 'Holon', nameHe: 'חולון', lat: 32.0105, lng: 34.7726, country: 'Israel', defaultRadius: 3000 },
  { name: 'Rehovot', nameHe: 'רחובות', lat: 31.8928, lng: 34.8113, country: 'Israel', defaultRadius: 3000 },
  
  // North
  { name: 'Nahariya', nameHe: 'נהריה', lat: 33.0078, lng: 35.0977, country: 'Israel', defaultRadius: 3000 },
  { name: 'Acre', nameHe: 'עכו', lat: 32.9333, lng: 35.0833, country: 'Israel', defaultRadius: 3000 },
  { name: 'Tiberias', nameHe: 'טבריה', lat: 32.7897, lng: 35.5247, country: 'Israel', defaultRadius: 3000 },
  { name: 'Nazareth', nameHe: 'נצרת', lat: 32.6996, lng: 35.3035, country: 'Israel', defaultRadius: 3000 },
  { name: 'Karmiel', nameHe: 'כרמיאל', lat: 32.9136, lng: 35.2961, country: 'Israel', defaultRadius: 3000 },
  
  // South
  { name: 'Dimona', nameHe: 'דימונה', lat: 31.0697, lng: 35.0331, country: 'Israel', defaultRadius: 3000 },
  { name: 'Arad', nameHe: 'ערד', lat: 31.2615, lng: 35.2149, country: 'Israel', defaultRadius: 3000 },
]

// ═══════════════════════════════════════════════════════════════════════════
// VENUE TYPES TO SEARCH
// ═══════════════════════════════════════════════════════════════════════════

export const VENUE_TYPES = {
  bar: { label: 'Bars', labelHe: 'ברים', icon: '🍺', googleType: 'bar' },
  night_club: { label: 'Clubs', labelHe: 'מועדונים', icon: '🎵', googleType: 'night_club' },
  restaurant: { label: 'Restaurant Bars', labelHe: 'מסעדות-בר', icon: '🍽️', googleType: 'restaurant' },
  cafe: { label: 'Cafes', labelHe: 'בתי קפה', icon: '☕', googleType: 'cafe' },
} as const

export type VenueType = keyof typeof VENUE_TYPES

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE PLACES API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''

/**
 * Search for venues near a location using Google Places API
 */
export const searchGooglePlaces = async (
  lat: number,
  lng: number,
  radius: number,
  types: VenueType[]
): Promise<GooglePlaceResult[]> => {
  console.log(`🔍 Searching Google Places: ${lat}, ${lng}, radius: ${radius}m, types: ${types.join(', ')}`)
  
  if (!GOOGLE_API_KEY) {
    console.error('❌ Google Places API key not configured')
    throw new Error('Google Places API key not configured')
  }
  
  const allResults: GooglePlaceResult[] = []
  const seenIds = new Set<string>()
  
  // Search for each type separately (Google API limitation)
  for (const type of types) {
    try {
      const googleType = VENUE_TYPES[type].googleType
      
      // Use Next.js API route to avoid CORS
      const response = await fetch('/api/google-places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          radius,
          type: googleType
        })
      })
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to search for ${type}:`, response.status)
        continue
      }
      
      const data = await response.json()
      
      if (data.results) {
        for (const place of data.results) {
          // Avoid duplicates
          if (!seenIds.has(place.place_id)) {
            seenIds.add(place.place_id)
            allResults.push(place)
          }
        }
      }
      
      console.log(`✅ Found ${data.results?.length || 0} ${type}s`)
      
    } catch (err) {
      console.error(`❌ Error searching for ${type}:`, err)
    }
  }
  
  console.log(`📍 Total unique venues found: ${allResults.length}`)
  return allResults
}

/**
 * Convert Google Place result to our venue format
 */
export const convertGooglePlaceToVenue = (
  place: GooglePlaceResult,
  city: string,
  country: string
): ImportedVenue => {
  return {
    id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    address: place.vicinity || place.formatted_address || '',
    rating: place.rating || 0,
    ratingsCount: place.user_ratings_total || 0,
    types: place.types || [],
    isOpen: place.opening_hours?.open_now ?? true,
    priceLevel: place.price_level || 2,
    photoRef: place.photos?.[0]?.photo_reference,
    city,
    country,
    importedAt: new Date(),
    active: true
  }
}

/**
 * Get venue type label from Google types array
 */
export const getVenueTypeLabel = (types: string[]): { label: string, icon: string } => {
  if (types.includes('night_club')) return { label: 'Club', icon: '🎵' }
  if (types.includes('bar')) return { label: 'Bar', icon: '🍺' }
  if (types.includes('cafe')) return { label: 'Cafe', icon: '☕' }
  if (types.includes('restaurant')) return { label: 'Restaurant', icon: '🍽️' }
  return { label: 'Venue', icon: '📍' }
}

/**
 * Save imported venues to Firebase
 */
export const saveVenuesToFirebase = async (venues: ImportedVenue[]): Promise<number> => {
  const { doc, setDoc, Timestamp } = await import('firebase/firestore')
  const { db } = await import('@/lib/firebase')
  
  let saved = 0
  
  for (const venue of venues) {
    try {
      // Convert to Firebase venue format
      const firebaseVenue = {
        id: venue.id,
        name: venue.name,
        displayName: venue.name,
        location: {
          latitude: venue.lat,
          longitude: venue.lng,
          address: venue.address
        },
        radius: 500, // Default check-in radius
        active: venue.active,
        rating: venue.rating,
        ratingsCount: venue.ratingsCount,
        types: venue.types,
        priceLevel: venue.priceLevel,
        city: venue.city,
        country: venue.country,
        source: 'google_places',
        importedAt: Timestamp.fromDate(venue.importedAt),
        checkedInUsers: [],
        stats: { activeNow: 0, totalCheckIns: 0 }
      }
      
      await setDoc(doc(db, 'venues', venue.id), firebaseVenue, { merge: true })
      saved++
      
    } catch (err) {
      console.error(`❌ Failed to save venue ${venue.name}:`, err)
    }
  }
  
  console.log(`✅ Saved ${saved}/${venues.length} venues to Firebase`)
  return saved
}

/**
 * Get all imported venues from Firebase for a city
 */
export const getImportedVenues = async (city?: string): Promise<ImportedVenue[]> => {
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const { db } = await import('@/lib/firebase')
  
  let q = query(collection(db, 'venues'), where('source', '==', 'google_places'))
  
  if (city) {
    q = query(
      collection(db, 'venues'),
      where('source', '==', 'google_places'),
      where('city', '==', city)
    )
  }
  
  const snapshot = await getDocs(q)
  const venues: ImportedVenue[] = []
  
  snapshot.forEach(doc => {
    const data = doc.data()
    venues.push({
      id: doc.id,
      name: data.name,
      lat: data.location?.latitude || 0,
      lng: data.location?.longitude || 0,
      address: data.location?.address || '',
      rating: data.rating || 0,
      ratingsCount: data.ratingsCount || 0,
      types: data.types || [],
      isOpen: true,
      priceLevel: data.priceLevel || 2,
      city: data.city || '',
      country: data.country || '',
      importedAt: data.importedAt?.toDate() || new Date(),
      active: data.active ?? true
    })
  })
  
  return venues
}

/**
 * Toggle venue active status
 */
export const toggleVenueActive = async (venueId: string, active: boolean): Promise<void> => {
  const { doc, updateDoc } = await import('firebase/firestore')
  const { db } = await import('@/lib/firebase')
  
  await updateDoc(doc(db, 'venues', venueId), { active })
  console.log(`✅ Venue ${venueId} set to ${active ? 'active' : 'inactive'}`)
}

/**
 * Delete venue from Firebase
 */
export const deleteVenue = async (venueId: string): Promise<void> => {
  const { doc, deleteDoc } = await import('firebase/firestore')
  const { db } = await import('@/lib/firebase')
  
  await deleteDoc(doc(db, 'venues', venueId))
  console.log(`🗑️ Venue ${venueId} deleted`)
}

/**
 * Get statistics about imported venues
 */
export const getImportStats = async (): Promise<{
  total: number
  active: number
  byCity: Record<string, number>
  byType: Record<string, number>
}> => {
  const venues = await getImportedVenues()
  
  const byCity: Record<string, number> = {}
  const byType: Record<string, number> = {}
  let active = 0
  
  for (const venue of venues) {
    // Count by city
    byCity[venue.city] = (byCity[venue.city] || 0) + 1
    
    // Count active
    if (venue.active) active++
    
    // Count by type
    const typeInfo = getVenueTypeLabel(venue.types)
    byType[typeInfo.label] = (byType[typeInfo.label] || 0) + 1
  }
  
  return {
    total: venues.length,
    active,
    byCity,
    byType
  }
}
