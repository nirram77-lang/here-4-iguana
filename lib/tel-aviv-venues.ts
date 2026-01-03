/**
 * 🦎 I4IGUANA - Tel Aviv Venues Database
 * 
 * Comprehensive list of entertainment venues in Tel Aviv
 * Organized by area for easy maintenance
 * 
 * To expand to other cities:
 * 1. Add new area arrays (e.g., jerusalemVenues, haifaVenues)
 * 2. Update getVenuesForLocation() to return correct city venues
 */

export interface VenueData {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  type: 'bar' | 'club' | 'pub' | 'lounge' | 'restaurant_bar' | 'rooftop' | 'beach_bar' | 'cafe'
  area: string
  rating?: number
  priceLevel?: 1 | 2 | 3 | 4  // 1=cheap, 4=expensive
  tags?: string[]
}

// ═══════════════════════════════════════════════════════════════════════════
// 🍸 FLORENTIN - Hipster bars, underground clubs
// ═══════════════════════════════════════════════════════════════════════════
const florentinVenues: VenueData[] = [
  { id: 'kuli_alma', name: 'Kuli Alma', lat: 32.0615, lng: 34.7720, address: 'Mikveh Israel St 10', type: 'club', area: 'Florentin', rating: 4.5, tags: ['underground', 'techno', 'late_night'] },
  { id: 'sputnik', name: 'Sputnik Bar', lat: 32.0620, lng: 34.7725, address: 'Florentin St 25', type: 'bar', area: 'Florentin', rating: 4.3, tags: ['hipster', 'cheap_drinks'] },
  { id: 'the_block', name: 'The Block', lat: 32.0608, lng: 34.7715, address: 'Salame St 157', type: 'club', area: 'Florentin', rating: 4.4, tags: ['techno', 'house', 'late_night'] },
  { id: 'lima_lima', name: 'Lima Lima', lat: 32.0625, lng: 34.7735, address: 'Florentin St 42', type: 'bar', area: 'Florentin', rating: 4.2 },
  { id: 'alphabet', name: 'Alphabet Club', lat: 32.0630, lng: 34.7740, address: 'Florentin St 58', type: 'club', area: 'Florentin', rating: 4.6, tags: ['lgbtq', 'dancing'] },
  { id: 'radio_epgb', name: 'Radio EPGB', lat: 32.0618, lng: 34.7728, address: 'Shalma Rd 7', type: 'club', area: 'Florentin', rating: 4.3, tags: ['live_music', 'alternative'] },
  { id: 'pasaz', name: 'Pasáž', lat: 32.0622, lng: 34.7732, address: 'Florentin St 36', type: 'bar', area: 'Florentin', rating: 4.4, tags: ['cocktails', 'cozy'] },
  { id: 'ha_minzar', name: 'HaMinzar', lat: 32.0612, lng: 34.7718, address: 'Abarbanel St 60', type: 'bar', area: 'Florentin', rating: 4.5, tags: ['beer', 'alternative'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🥂 ROTHSCHILD - Upscale bars, cocktail lounges
// ═══════════════════════════════════════════════════════════════════════════
const rothschildVenues: VenueData[] = [
  { id: 'bellboy', name: 'Bellboy Bar', lat: 32.0650, lng: 34.7780, address: 'Rothschild Blvd 14', type: 'lounge', area: 'Rothschild', rating: 4.4, priceLevel: 3, tags: ['cocktails', 'upscale'] },
  { id: 'spicehaus', name: 'Spicehaus', lat: 32.0655, lng: 34.7785, address: 'Rothschild Blvd 22', type: 'restaurant_bar', area: 'Rothschild', rating: 4.3, priceLevel: 3 },
  { id: 'hotel_montefiore', name: 'Hotel Montefiore Bar', lat: 32.0660, lng: 34.7790, address: 'Montefiore St 36', type: 'lounge', area: 'Rothschild', rating: 4.5, priceLevel: 4 },
  { id: 'teder_fm', name: 'Teder.fm', lat: 32.0648, lng: 34.7772, address: 'Derech Jaffa 9', type: 'bar', area: 'Rothschild', rating: 4.6, tags: ['outdoor', 'live_dj'] },
  { id: 'imperial', name: 'Imperial Craft', lat: 32.0658, lng: 34.7788, address: 'Rothschild Blvd 66', type: 'lounge', area: 'Rothschild', rating: 4.5, priceLevel: 3, tags: ['cocktails', 'speakeasy'] },
  { id: 'bicicletta', name: 'Bicicletta', lat: 32.0652, lng: 34.7778, address: 'Rothschild Blvd 44', type: 'bar', area: 'Rothschild', rating: 4.3 },
  { id: 'kanta', name: 'Kanta', lat: 32.0646, lng: 34.7776, address: 'Rothschild Blvd 12', type: 'restaurant_bar', area: 'Rothschild', rating: 4.4 },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🌊 TLV PORT - Waterfront bars, clubs
// ═══════════════════════════════════════════════════════════════════════════
const portVenues: VenueData[] = [
  { id: 'clara', name: 'Clara', lat: 32.0970, lng: 34.7720, address: 'Hangar 22, TLV Port', type: 'club', area: 'TLV Port', rating: 4.7, priceLevel: 3, tags: ['dancing', 'house', 'views'] },
  { id: 'shpagat', name: 'Shpagat', lat: 32.0975, lng: 34.7725, address: 'Hangar 28, TLV Port', type: 'restaurant_bar', area: 'TLV Port', rating: 4.2 },
  { id: 'cuckoos_nest', name: "Cuckoo's Nest", lat: 32.0972, lng: 34.7718, address: 'Hangar 20, TLV Port', type: 'bar', area: 'TLV Port', rating: 4.4, tags: ['dancing', 'lgbtq'] },
  { id: 'abrage', name: 'Abraaj', lat: 32.0978, lng: 34.7728, address: 'TLV Port', type: 'lounge', area: 'TLV Port', rating: 4.3, tags: ['hookah', 'lounge'] },
  { id: 'port_market', name: 'Port Market Bar', lat: 32.0968, lng: 34.7715, address: 'TLV Port Market', type: 'bar', area: 'TLV Port', rating: 4.1 },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🏖️ BEACH / PROMENADE - Beach bars, sunset spots
// ═══════════════════════════════════════════════════════════════════════════
const beachVenues: VenueData[] = [
  { id: 'gordon_beach_bar', name: 'Beach Bar Gordon', lat: 32.0820, lng: 34.7650, address: 'Gordon Beach', type: 'beach_bar', area: 'Beach', rating: 4.2, tags: ['sunset', 'casual'] },
  { id: 'banana_beach', name: 'Banana Beach', lat: 32.0750, lng: 34.7640, address: 'Banana Beach', type: 'beach_bar', area: 'Beach', rating: 4.3, tags: ['sunset', 'music'] },
  { id: 'hilton_beach_bar', name: 'Hilton Beach Bar', lat: 32.0880, lng: 34.7680, address: 'Hilton Beach', type: 'beach_bar', area: 'Beach', rating: 4.1, tags: ['lgbtq_friendly', 'sunset'] },
  { id: 'frishman_beach', name: 'Frishman Beach Bar', lat: 32.0800, lng: 34.7655, address: 'Frishman Beach', type: 'beach_bar', area: 'Beach', rating: 4.0 },
  { id: 'manta_ray', name: 'Manta Ray', lat: 32.0700, lng: 34.7630, address: 'Alma Beach', type: 'restaurant_bar', area: 'Beach', rating: 4.5, priceLevel: 3 },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🛍️ DIZENGOFF - Classic TLV nightlife
// ═══════════════════════════════════════════════════════════════════════════
const dizengoffVenues: VenueData[] = [
  { id: 'abraxas', name: 'Abraxas North', lat: 32.0785, lng: 34.7745, address: 'Dizengoff St 40', type: 'bar', area: 'Dizengoff', rating: 4.3, tags: ['cocktails'] },
  { id: 'gordon_bar', name: 'Gordon Bar', lat: 32.0810, lng: 34.7700, address: 'Gordon St 2', type: 'bar', area: 'Dizengoff', rating: 4.4, tags: ['classic'] },
  { id: 'shesek', name: 'Shesek', lat: 32.0788, lng: 34.7738, address: 'Dizengoff St 60', type: 'bar', area: 'Dizengoff', rating: 4.2 },
  { id: 'dizengoff_99', name: 'Dizengoff 99', lat: 32.0792, lng: 34.7742, address: 'Dizengoff St 99', type: 'pub', area: 'Dizengoff', rating: 4.1, tags: ['sports', 'beer'] },
  { id: 'breakfast_club', name: 'Breakfast Club', lat: 32.0795, lng: 34.7740, address: 'Dizengoff St 88', type: 'lounge', area: 'Dizengoff', rating: 4.4, tags: ['brunch', 'cocktails'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🏠 NEVE TZEDEK - Trendy, boutique bars
// ═══════════════════════════════════════════════════════════════════════════
const neveTzedekVenues: VenueData[] = [
  { id: 'suzana', name: 'Suzana', lat: 32.0580, lng: 34.7650, address: 'Shabazi St 9', type: 'restaurant_bar', area: 'Neve Tzedek', rating: 4.5, priceLevel: 3 },
  { id: 'dallal', name: 'Dallal', lat: 32.0585, lng: 34.7655, address: 'Shabazi St 10', type: 'restaurant_bar', area: 'Neve Tzedek', rating: 4.4, priceLevel: 3 },
  { id: 'bellini', name: 'Bellini', lat: 32.0578, lng: 34.7648, address: 'Yehieli St 6', type: 'lounge', area: 'Neve Tzedek', rating: 4.3 },
  { id: 'nt_wine_bar', name: 'NT Wine Bar', lat: 32.0582, lng: 34.7652, address: 'Shabazi St 15', type: 'bar', area: 'Neve Tzedek', rating: 4.6, tags: ['wine', 'upscale'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🎭 SARONA / AZRIELI - Modern entertainment
// ═══════════════════════════════════════════════════════════════════════════
const saronaVenues: VenueData[] = [
  { id: 'sarona_beer_garden', name: 'Beer Garden Sarona', lat: 32.0720, lng: 34.7870, address: 'Sarona Market', type: 'bar', area: 'Sarona', rating: 4.2, tags: ['outdoor', 'beer'] },
  { id: 'ouzeria', name: 'Ouzeria Sarona', lat: 32.0722, lng: 34.7875, address: 'Sarona Market', type: 'restaurant_bar', area: 'Sarona', rating: 4.3 },
  { id: 'whiskey_bar', name: 'Whiskey Bar & Museum', lat: 32.0725, lng: 34.7868, address: 'Sarona', type: 'lounge', area: 'Sarona', rating: 4.5, priceLevel: 3, tags: ['whiskey', 'upscale'] },
  { id: 'porter_sons', name: 'Porter & Sons', lat: 32.0718, lng: 34.7872, address: 'Sarona Market', type: 'pub', area: 'Sarona', rating: 4.4, tags: ['british', 'beer'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🌙 ALLENBY / NACHALAT BINYAMIN - Downtown vibes
// ═══════════════════════════════════════════════════════════════════════════
const allenbyVenues: VenueData[] = [
  { id: 'hudna', name: 'Hudna', lat: 32.0680, lng: 34.7730, address: 'Yavne St 9', type: 'bar', area: 'Allenby', rating: 4.3, tags: ['local', 'cheap_drinks'] },
  { id: 'romano', name: 'Romano', lat: 32.0685, lng: 34.7725, address: 'Allenby St 45', type: 'club', area: 'Allenby', rating: 4.2, tags: ['live_music'] },
  { id: 'polly', name: 'Polly', lat: 32.0678, lng: 34.7728, address: 'Allenby St 23', type: 'bar', area: 'Allenby', rating: 4.4, tags: ['lgbtq', 'dancing'] },
  { id: 'jimmy_who', name: 'Jimmy Who', lat: 32.0682, lng: 34.7732, address: 'Allenby St 55', type: 'club', area: 'Allenby', rating: 4.5, tags: ['dancing', 'cocktails'] },
  { id: 'betty_ford', name: 'Betty Ford', lat: 32.0688, lng: 34.7720, address: 'Allenby St 78', type: 'bar', area: 'Allenby', rating: 4.1 },
  { id: 'hoodna', name: 'Hoodna Bar', lat: 32.0675, lng: 34.7735, address: 'Nachalat Binyamin St 12', type: 'bar', area: 'Allenby', rating: 4.2, tags: ['cheap_drinks', 'local'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🎪 JAFFA - Eclectic bars, historic vibes
// ═══════════════════════════════════════════════════════════════════════════
const jaffaVenues: VenueData[] = [
  { id: 'anna_loulou', name: 'Anna Loulou', lat: 32.0520, lng: 34.7540, address: 'Shivtey Israel St 2, Jaffa', type: 'bar', area: 'Jaffa', rating: 4.5, tags: ['live_music', 'eclectic'] },
  { id: 'container', name: 'Container', lat: 32.0530, lng: 34.7530, address: 'Warehouse 2, Jaffa Port', type: 'bar', area: 'Jaffa', rating: 4.3, tags: ['alternative', 'live_music'] },
  { id: 'casino_san_remo', name: 'Casino San Remo', lat: 32.0525, lng: 34.7545, address: 'Jaffa Clock Tower', type: 'bar', area: 'Jaffa', rating: 4.4, tags: ['rooftop', 'views'] },
  { id: 'jaffa_bar', name: 'Jaffa Bar', lat: 32.0515, lng: 34.7535, address: 'Yefet St 30, Jaffa', type: 'pub', area: 'Jaffa', rating: 4.2 },
  { id: 'puaa', name: 'Puaa', lat: 32.0528, lng: 34.7542, address: 'Rabbi Yochanan St 2, Jaffa', type: 'restaurant_bar', area: 'Jaffa', rating: 4.6, tags: ['brunch', 'hipster'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🏢 RAMAT GAN / BIG AREA
// ═══════════════════════════════════════════════════════════════════════════
const ramatGanVenues: VenueData[] = [
  { id: 'ozen_bar_rg', name: 'Ozen Bar', lat: 32.0830, lng: 34.8120, address: 'Bialik St 70, Ramat Gan', type: 'bar', area: 'Ramat Gan', rating: 4.3 },
  { id: 'murphy_rg', name: "Murphy's", lat: 32.0835, lng: 34.8115, address: 'Bialik St 85, Ramat Gan', type: 'pub', area: 'Ramat Gan', rating: 4.2, tags: ['irish', 'beer'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🍺 ADDITIONAL POPULAR VENUES (Various areas)
// ═══════════════════════════════════════════════════════════════════════════
const additionalVenues: VenueData[] = [
  // Kikar Rabin area
  { id: 'bar_giora', name: 'Bar Giora', lat: 32.0870, lng: 34.7810, address: 'Ibn Gvirol St 69', type: 'bar', area: 'Ibn Gvirol', rating: 4.1 },
  { id: 'mike_place_rn', name: "Mike's Place Rabin", lat: 32.0875, lng: 34.7815, address: 'Rabin Square', type: 'pub', area: 'Ibn Gvirol', rating: 4.2, tags: ['live_music', 'american'] },
  
  // Hamedina Square
  { id: 'kikar_bar', name: 'Kikar Bar', lat: 32.0920, lng: 34.7920, address: 'Kikar Hamedina', type: 'lounge', area: 'Hamedina', rating: 4.4, priceLevel: 3 },
  
  // Carmel Market area
  { id: 'shuk_bar', name: 'Shuk Bar', lat: 32.0680, lng: 34.7690, address: 'Carmel Market', type: 'bar', area: 'Carmel', rating: 4.3, tags: ['local', 'cheap_drinks'] },
  { id: 'levontin_7', name: 'Levontin 7', lat: 32.0660, lng: 34.7700, address: 'Levontin St 7', type: 'club', area: 'Carmel', rating: 4.5, tags: ['live_music', 'alternative'] },
]

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 EXPORT ALL VENUES
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 🏖️ ASHKELON - Coastal city entertainment
// ═══════════════════════════════════════════════════════════════════════════
const ashkelonVenues: VenueData[] = [
  // Marina Area - Main entertainment hub
  { id: 'archie_bar', name: 'Archie Bar', lat: 31.6697, lng: 34.5565, address: 'Marina, Ashkelon', type: 'bar', area: 'Ashkelon Marina', rating: 4.5, tags: ['marina', 'nightlife', 'popular'] },
  { id: 'marina_cafe', name: 'Marina Café', lat: 31.6700, lng: 34.5560, address: 'Marina, Ashkelon', type: 'restaurant_bar', area: 'Ashkelon Marina', rating: 4.3 },
  { id: 'delmare', name: 'Delmare', lat: 31.6695, lng: 34.5570, address: 'Marina, Ashkelon', type: 'restaurant_bar', area: 'Ashkelon Marina', rating: 4.4, tags: ['seafood', 'view'] },
  { id: 'yacht_bar', name: 'Yacht Bar', lat: 31.6693, lng: 34.5568, address: 'Marina, Ashkelon', type: 'bar', area: 'Ashkelon Marina', rating: 4.2 },
  
  // Rechov HaNasi - Downtown cafes and bars
  { id: 'hanasi_cafe', name: 'Café HaNasi', lat: 31.6688, lng: 34.5743, address: 'HaNasi St, Ashkelon', type: 'cafe', area: 'Ashkelon Downtown', rating: 4.1 },
  { id: 'bar_central', name: 'Bar Central', lat: 31.6690, lng: 34.5740, address: 'HaNasi St, Ashkelon', type: 'bar', area: 'Ashkelon Downtown', rating: 4.0 },
  { id: 'golden_beach', name: 'Golden Beach Pub', lat: 31.6685, lng: 34.5745, address: 'HaNasi St, Ashkelon', type: 'pub', area: 'Ashkelon Downtown', rating: 4.2, tags: ['sports', 'beer'] },
  
  // Beach Area
  { id: 'ashkelon_beach_bar', name: 'Beach Bar Ashkelon', lat: 31.6650, lng: 34.5450, address: 'Delila Beach, Ashkelon', type: 'beach_bar', area: 'Ashkelon Beach', rating: 4.3, tags: ['sunset', 'beach'] },
  { id: 'delila_cafe', name: 'Delila Beach Café', lat: 31.6655, lng: 34.5455, address: 'Delila Beach, Ashkelon', type: 'cafe', area: 'Ashkelon Beach', rating: 4.0 },
]

export const TEL_AVIV_VENUES: VenueData[] = [
  ...florentinVenues,
  ...rothschildVenues,
  ...portVenues,
  ...beachVenues,
  ...dizengoffVenues,
  ...neveTzedekVenues,
  ...saronaVenues,
  ...allenbyVenues,
  ...jaffaVenues,
  ...ramatGanVenues,
  ...additionalVenues,
]

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 ALL VENUES (Israel-wide)
// ═══════════════════════════════════════════════════════════════════════════
export const ALL_VENUES: VenueData[] = [
  ...TEL_AVIV_VENUES,
  ...ashkelonVenues,
]

// Get venues by area
export const getVenuesByArea = (area: string): VenueData[] => {
  return ALL_VENUES.filter(v => v.area.toLowerCase() === area.toLowerCase())
}

// Get all unique areas
export const getAllAreas = (): string[] => {
  return [...new Set(ALL_VENUES.map(v => v.area))]
}

// Check if location is in Tel Aviv area (approx bounding box)
export const isInTelAviv = (lat: number, lng: number): boolean => {
  return lat >= 32.02 && lat <= 32.15 && lng >= 34.73 && lng <= 34.85
}

// Check if location is in Ashkelon area
export const isInAshkelon = (lat: number, lng: number): boolean => {
  return lat >= 31.64 && lat <= 31.70 && lng >= 34.53 && lng <= 34.60
}

// Get venues near a location (from ALL venues, not just Tel Aviv)
export const getVenuesNearLocation = (
  lat: number, 
  lng: number, 
  radiusMeters: number = 5000
): VenueData[] => {
  // Calculate distance for each venue
  const venuesWithDistance = ALL_VENUES.map(venue => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (venue.lat - lat) * Math.PI / 180
    const dLng = (venue.lng - lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(venue.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return { ...venue, distance }
  })
  
  // Filter by radius and sort by distance
  return venuesWithDistance
    .filter(v => v.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
}

console.log(`🦎 Loaded ${ALL_VENUES.length} venues across ${getAllAreas().length} areas (Tel Aviv + Ashkelon)`)
