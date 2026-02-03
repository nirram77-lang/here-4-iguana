/**
 * 🦎 I4IGUANA - Entertainment Zones (Boutique Edition)
 * 
 * HOLLYWOOD LEVEL! 🎬
 * 
 * Predefined entertainment zones with full control.
 * Each zone is a radius around a central point.
 * 
 * User enters zone at 500m → "Almost there!"
 * User enters zone at 0m → Full access to singles!
 * 
 * Expansion: We control which cities get zones.
 * This creates exclusivity and FOMO!
 */

export interface EntertainmentZone {
  id: string
  name: string
  city: string
  cityHe?: string  // Hebrew name for display
  center: {
    lat: number
    lng: number
  }
  radius: number  // in meters - users inside this see each other
  previewRadius: number  // in meters - "Almost there!" range
  vibe?: string  // Description of the area
  peakHours?: string  // When it's busiest
  icon?: string  // Emoji for the zone
  isActive: boolean  // Can disable zones
}

export interface City {
  id: string
  name: string
  nameHe: string
  center: {
    lat: number
    lng: number
  }
  isActive: boolean
  launchDate?: string
  zones: string[]  // Zone IDs in this city
}

// ═══════════════════════════════════════════════════════════
// 🏙️ CITIES - NATIONAL COVERAGE! 🇮🇱
// ═══════════════════════════════════════════════════════════

export const CITIES: Record<string, City> = {
  
  // ══════════════════════════════════════════════════════════
  // 🏖️ SOUTH - דרום
  // ══════════════════════════════════════════════════════════
  
  'ashkelon': {
    id: 'ashkelon',
    name: 'Ashkelon',
    nameHe: 'אשקלון',
    center: { lat: 31.6688, lng: 34.5743 },
    isActive: true,
    launchDate: '2024-01-01',
    zones: ['ashkelon-marina', 'nir-home', 'ashkelon-delila', 'ashkelon-barnea', 'ashkelon-city-center']
  },
  'ashdod': {
    id: 'ashdod',
    name: 'Ashdod',
    nameHe: 'אשדוד',
    center: { lat: 31.8044, lng: 34.6553 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['ashdod-city', 'ashdod-marina', 'ashdod-rova-vav']
  },
  'beer-sheva': {
    id: 'beer-sheva',
    name: 'Beer Sheva',
    nameHe: 'באר שבע',
    center: { lat: 31.2530, lng: 34.7915 },
    isActive: true,  // ✅ Now active!
    launchDate: '2025-01-01',
    zones: ['bsheva-old-city', 'bsheva-big', 'bsheva-rager']
  },
  'eilat': {
    id: 'eilat',
    name: 'Eilat',
    nameHe: 'אילת',
    center: { lat: 29.5577, lng: 34.9519 },
    isActive: true,  // ✅ Now active!
    launchDate: '2025-01-01',
    zones: ['eilat-promenade', 'eilat-hotel-strip', 'eilat-north-beach']
  },
  'kiryat-gat': {
    id: 'kiryat-gat',
    name: 'Kiryat Gat',
    nameHe: 'קריית גת',
    center: { lat: 31.6100, lng: 34.7642 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['kiryat-gat-center']
  },
  'dimona': {
    id: 'dimona',
    name: 'Dimona',
    nameHe: 'דימונה',
    center: { lat: 31.0697, lng: 35.0328 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['dimona-center']
  },
  
  // ══════════════════════════════════════════════════════════
  // 🌆 CENTER - מרכז
  // ══════════════════════════════════════════════════════════
  
  'tel-aviv': {
    id: 'tel-aviv',
    name: 'Tel Aviv',
    nameHe: 'תל אביב',
    center: { lat: 32.0853, lng: 34.7818 },
    isActive: true,
    launchDate: '2024-01-01',
    zones: ['tlv-rothschild', 'tlv-florentin', 'tlv-arbaa', 'tlv-port', 'tlv-station', 'tlv-dizengoff', 'tlv-allenby', 'tlv-neve-tzedek']
  },
  'ramat-gan': {
    id: 'ramat-gan',
    name: 'Ramat Gan',
    nameHe: 'רמת גן',
    center: { lat: 32.0680, lng: 34.8248 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['rg-bursa', 'rg-ayalon', 'rg-city-center']
  },
  'givatayim': {
    id: 'givatayim',
    name: 'Givatayim',
    nameHe: 'גבעתיים',
    center: { lat: 32.0719, lng: 34.8119 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['givatayim-center']
  },
  'herzliya': {
    id: 'herzliya',
    name: 'Herzliya',
    nameHe: 'הרצליה',
    center: { lat: 32.1663, lng: 34.8442 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['herzliya-pituach', 'herzliya-marina', 'herzliya-arena']
  },
  'netanya': {
    id: 'netanya',
    name: 'Netanya',
    nameHe: 'נתניה',
    center: { lat: 32.3215, lng: 34.8532 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['netanya-promenade', 'netanya-city-center', 'netanya-poleg']
  },
  'raanana': {
    id: 'raanana',
    name: 'Raanana',
    nameHe: 'רעננה',
    center: { lat: 32.1836, lng: 34.8706 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['raanana-ahuza', 'raanana-park']
  },
  'kfar-saba': {
    id: 'kfar-saba',
    name: 'Kfar Saba',
    nameHe: 'כפר סבא',
    center: { lat: 32.1780, lng: 34.9066 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['kfar-saba-weizmann', 'kfar-saba-center']
  },
  'petah-tikva': {
    id: 'petah-tikva',
    name: 'Petah Tikva',
    nameHe: 'פתח תקווה',
    center: { lat: 32.0841, lng: 34.8878 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['pt-rothschild', 'pt-em-hamoshavot', 'pt-big', 'pt-hashaham']  // ✅ Added HaShaham
  },
  'rishon-lezion': {
    id: 'rishon-lezion',
    name: 'Rishon LeZion',
    nameHe: 'ראשון לציון',
    center: { lat: 31.9730, lng: 34.7925 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['rishon-rothschild', 'rishon-rishonim', 'rishon-west']
  },
  'holon': {
    id: 'holon',
    name: 'Holon',
    nameHe: 'חולון',
    center: { lat: 32.0110, lng: 34.7748 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['holon-sokolov', 'holon-center']
  },
  'bat-yam': {
    id: 'bat-yam',
    name: 'Bat Yam',
    nameHe: 'בת ים',
    center: { lat: 32.0171, lng: 34.7510 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['bat-yam-beach', 'bat-yam-center']
  },
  'rehovot': {
    id: 'rehovot',
    name: 'Rehovot',
    nameHe: 'רחובות',
    center: { lat: 31.91277, lng: 34.804205 },
    isActive: true,
    launchDate: '2024-01-01',
    zones: ['rehovot-science-park', 'rehovot-herzl']
  },
  'nes-ziona': {
    id: 'nes-ziona',
    name: 'Nes Ziona',
    nameHe: 'נס ציונה',
    center: { lat: 31.9293, lng: 34.7985 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['nes-ziona-center']
  },
  'modiin': {
    id: 'modiin',
    name: 'Modiin',
    nameHe: 'מודיעין',
    center: { lat: 31.8969, lng: 35.0104 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['modiin-azrieli', 'modiin-ligad']
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏛️ JERUSALEM - ירושלים
  // ══════════════════════════════════════════════════════════
  
  'jerusalem': {
    id: 'jerusalem',
    name: 'Jerusalem',
    nameHe: 'ירושלים',
    center: { lat: 31.7683, lng: 35.2137 },
    isActive: true,
    launchDate: '2024-02-01',
    zones: ['jlm-mahane-yehuda', 'jlm-german-colony', 'jlm-first-station', 'jlm-nahalat-shiva', 'jlm-talbiya', 'jlm-emek-refaim']
  },
  'beit-shemesh': {
    id: 'beit-shemesh',
    name: 'Beit Shemesh',
    nameHe: 'בית שמש',
    center: { lat: 31.7513, lng: 34.9877 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['beit-shemesh-center']
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏔️ NORTH - צפון
  // ══════════════════════════════════════════════════════════
  
  'haifa': {
    id: 'haifa',
    name: 'Haifa',
    nameHe: 'חיפה',
    center: { lat: 32.7940, lng: 34.9896 },
    isActive: true,
    launchDate: '2024-02-01',
    zones: ['haifa-downtown', 'haifa-carmel', 'haifa-german-colony', 'haifa-masada', 'haifa-bat-galim']
  },
  'zichron-yaakov': {
    id: 'zichron-yaakov',
    name: 'Zichron Yaakov',
    nameHe: 'זיכרון יעקב',
    center: { lat: 32.5714, lng: 34.9544 },
    isActive: true,
    launchDate: '2025-01-11',
    zones: ['zichron-midrahov', 'zichron-wineries']
  },
  'nahariya': {
    id: 'nahariya',
    name: 'Nahariya',
    nameHe: 'נהריה',
    center: { lat: 33.0057, lng: 35.0978 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['nahariya-gaaton', 'nahariya-beach']
  },
  'acre': {
    id: 'acre',
    name: 'Acre',
    nameHe: 'עכו',
    center: { lat: 32.9272, lng: 35.0764 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['acre-old-city', 'acre-beach']
  },
  'kiryat-shmona': {
    id: 'kiryat-shmona',
    name: 'Kiryat Shmona',
    nameHe: 'קריית שמונה',
    center: { lat: 33.2075, lng: 35.5697 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['kiryat-shmona-center']
  },
  'tiberias': {
    id: 'tiberias',
    name: 'Tiberias',
    nameHe: 'טבריה',
    center: { lat: 32.7957, lng: 35.5320 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['tiberias-promenade', 'tiberias-center']
  },
  'safed': {
    id: 'safed',
    name: 'Safed',
    nameHe: 'צפת',
    center: { lat: 32.9646, lng: 35.4962 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['safed-old-city', 'safed-artists']
  },
  'karmiel': {
    id: 'karmiel',
    name: 'Karmiel',
    nameHe: 'כרמיאל',
    center: { lat: 32.9193, lng: 35.2961 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['karmiel-center']
  },
  'nazareth': {
    id: 'nazareth',
    name: 'Nazareth',
    nameHe: 'נצרת',
    center: { lat: 32.6996, lng: 35.3035 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['nazareth-old-city', 'nazareth-center']
  },
  'afula': {
    id: 'afula',
    name: 'Afula',
    nameHe: 'עפולה',
    center: { lat: 32.6100, lng: 35.2903 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['afula-center', 'afula-yula-bar']  // ✅ Added Yula Bar
  },
  
  // ✅ NEW: Tel Adashim - Jezreel Valley
  'tel-adashim': {
    id: 'tel-adashim',
    name: 'Tel Adashim',
    nameHe: 'תל עדשים',
    center: { lat: 32.5971, lng: 35.1967 },
    isActive: true,
    launchDate: '2025-01-01',
    zones: ['tel-adashim-kachol-yarok']
  }
}

// ═══════════════════════════════════════════════════════════
// 📍 ENTERTAINMENT ZONES - The magic happens here!
// ═══════════════════════════════════════════════════════════

export const ENTERTAINMENT_ZONES: Record<string, EntertainmentZone> = {
  
  // ══════════════════════════════════════════════════════════
  // 🏖️ ASHKELON - Pilot City!
  // ══════════════════════════════════════════════════════════
  
  'ashkelon-marina': {
    id: 'ashkelon-marina',
    name: 'Marina',
    city: 'ashkelon',
    cityHe: 'אשקלון',
    // 🔧 FIXED: Corrected to actual Marina center (verified via GPS coordinates)
    center: { lat: 31.682, lng: 34.555 },
    radius: 500,        // Inside zone = can see singles
    previewRadius: 1000, // "Almost there!" range
    vibe: 'Beachfront bars & restaurants',
    peakHours: 'Thu-Sat 21:00-02:00',
    icon: '⛵',
    isActive: true
  },
  
  // ✅ v2.8.7: Barnea North - Ashkelon (renamed from Nir Home Dev)
  'nir-home': {
    id: 'nir-home',
    name: 'Barnea North',
    city: 'ashkelon',
    cityHe: 'אשקלון',
    center: { lat: 31.6969951, lng: 34.5778336 },
    radius: 300,
    previewRadius: 500,
    vibe: 'North Barnea neighborhood',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🌴',
    isActive: true
  },
  
  'ashkelon-delila': {
    id: 'ashkelon-delila',
    name: 'Delila Beach',
    city: 'ashkelon',
    cityHe: 'אשקלון',
    center: { lat: 31.6654, lng: 34.5489 },
    radius: 600,
    previewRadius: 1000,
    vibe: 'Beach clubs & sunset vibes',
    peakHours: 'Fri-Sat 18:00-23:00',
    icon: '🏖️',
    isActive: true
  },
  
  'ashkelon-barnea': {
    id: 'ashkelon-barnea',
    name: 'Barnea',
    city: 'ashkelon',
    cityHe: 'אשקלון',
    center: { lat: 31.6612, lng: 34.5678 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local pubs & cafes',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🍺',
    isActive: true
  },
  
  'ashkelon-city-center': {
    id: 'ashkelon-city-center',
    name: 'City Center',
    city: 'ashkelon',
    cityHe: 'אשקלון',
    center: { lat: 31.6688, lng: 34.5743 },
    radius: 500,
    previewRadius: 1000,
    vibe: 'Restaurants & nightlife',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🌃',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🌆 TEL AVIV - The Big One!
  // ══════════════════════════════════════════════════════════
  
  'tlv-rothschild': {
    id: 'tlv-rothschild',
    name: 'Rothschild',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0636, lng: 34.7731 },
    radius: 800,  // Long boulevard!
    previewRadius: 1200,
    vibe: 'Cocktail bars & upscale nightlife',
    peakHours: 'Thu-Sat 22:00-03:00',
    icon: '🍸',
    isActive: true
  },
  
  'tlv-florentin': {
    id: 'tlv-florentin',
    name: 'Florentin',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0544, lng: 34.7678 },
    radius: 600,
    previewRadius: 1000,
    vibe: 'Hipster bars & underground vibes',
    peakHours: 'Thu-Sat 23:00-04:00',
    icon: '🎨',
    isActive: true
  },
  
  // ✅ v2.8.6: HaArbaa Street - Premium nightlife hub!
  'tlv-arbaa': {
    id: 'tlv-arbaa',
    name: 'HaArbaa St.',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0703, lng: 34.7856 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Premium clubs & upscale bars - Capella, Mass, Tapeo',
    peakHours: 'Thu-Sat 22:00-04:00',
    icon: '🍸',
    isActive: true
  },
  
  'tlv-port': {
    id: 'tlv-port',
    name: 'Tel Aviv Port',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0972, lng: 34.7747 },
    radius: 700,
    previewRadius: 1100,
    vibe: 'Beachfront clubs & restaurants',
    peakHours: 'Fri-Sat 21:00-04:00',
    icon: '🚢',
    isActive: true
  },
  
  'tlv-station': {
    id: 'tlv-station',
    name: 'The Station',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0561, lng: 34.7567 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Upscale dining & wine bars',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🚂',
    isActive: true
  },
  
  'tlv-dizengoff': {
    id: 'tlv-dizengoff',
    name: 'Dizengoff',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0778, lng: 34.7744 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Mixed crowd, cafes & bars',
    peakHours: 'Daily 18:00-02:00',
    icon: '☕',
    isActive: true
  },
  
  'tlv-allenby': {
    id: 'tlv-allenby',
    name: 'Allenby',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0667, lng: 34.7694 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Clubs & late night scene',
    peakHours: 'Thu-Sat 00:00-05:00',
    icon: '🎵',
    isActive: true
  },
  
  'tlv-neve-tzedek': {
    id: 'tlv-neve-tzedek',
    name: 'Neve Tzedek',
    city: 'tel-aviv',
    cityHe: 'תל אביב',
    center: { lat: 32.0589, lng: 34.7650 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Boutique bars & romantic spots',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '💕',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🕌 JERUSALEM
  // ══════════════════════════════════════════════════════════
  
  'jlm-mahane-yehuda': {
    id: 'jlm-mahane-yehuda',
    name: 'Mahane Yehuda',
    city: 'jerusalem',
    cityHe: 'ירושלים',
    center: { lat: 31.7847, lng: 35.2124 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Market transforms into nightlife',
    peakHours: 'Thu-Sat 21:00-02:00',
    icon: '🏪',
    isActive: true
  },
  
  'jlm-german-colony': {
    id: 'jlm-german-colony',
    name: 'German Colony',
    city: 'jerusalem',
    cityHe: 'ירושלים',
    center: { lat: 31.7589, lng: 35.2219 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Upscale restaurants & wine bars',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🍷',
    isActive: true
  },
  
  'jlm-first-station': {
    id: 'jlm-first-station',
    name: 'First Station',
    city: 'jerusalem',
    cityHe: 'ירושלים',
    center: { lat: 31.7583, lng: 35.2236 },
    radius: 300,
    previewRadius: 700,
    vibe: 'Cultural events & dining',
    peakHours: 'Thu-Sat 18:00-00:00',
    icon: '🎭',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // ⛰️ HAIFA
  // ══════════════════════════════════════════════════════════
  
  'haifa-downtown': {
    id: 'haifa-downtown',
    name: 'Downtown',
    city: 'haifa',
    cityHe: 'חיפה',
    center: { lat: 32.8191, lng: 34.9983 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Pubs & local hangouts',
    peakHours: 'Thu-Sat 21:00-02:00',
    icon: '🍻',
    isActive: true
  },
  
  'haifa-carmel': {
    id: 'haifa-carmel',
    name: 'Carmel Center',
    city: 'haifa',
    cityHe: 'חיפה',
    center: { lat: 32.7940, lng: 34.9896 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Cafes & restaurants with views',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🏔️',
    isActive: true
  },
  
  'haifa-german-colony': {
    id: 'haifa-german-colony',
    name: 'German Colony',
    city: 'haifa',
    cityHe: 'חיפה',
    center: { lat: 32.8225, lng: 34.9867 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Ben Gurion street nightlife',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🌴',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏜️ BEER SHEVA - Capital of the Negev!
  // ══════════════════════════════════════════════════════════
  
  'bsheva-old-city': {
    id: 'bsheva-old-city',
    name: 'Old City',
    city: 'beer-sheva',
    cityHe: 'באר שבע',
    center: { lat: 31.2431, lng: 34.7994 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Restored old city nightlife',
    peakHours: 'Thu-Sat 21:00-02:00',
    icon: '🏛️',
    isActive: true  // ✅ Now active!
  },
  
  'bsheva-big': {
    id: 'bsheva-big',
    name: 'BIG Center',
    city: 'beer-sheva',
    cityHe: 'באר שבע',
    center: { lat: 31.2644, lng: 34.8097 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Mall area bars & cinema',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🛒',
    isActive: true  // ✅ Now active!
  },
  
  // ══════════════════════════════════════════════════════════
  // 🔬 REHOVOT - Science City Nightlife!
  // ══════════════════════════════════════════════════════════
  
  'rehovot-science-park': {
    id: 'rehovot-science-park',
    name: 'Science Park',
    city: 'rehovot',
    cityHe: 'רחובות',
    center: { lat: 31.91277, lng: 34.804205 },  // ✅ Shpigel, Sheffield location
    radius: 400,  // Near train station, restaurants, bars
    previewRadius: 800,
    vibe: 'Hi-tech hub - Shpigel, Sheffield & more',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🔬',
    isActive: true  // ✅ v2.8.6: Active for pilot!
  },
  
  'rehovot-herzl': {
    id: 'rehovot-herzl',
    name: 'Herzl Downtown',
    city: 'rehovot',
    cityHe: 'רחובות',
    center: { lat: 31.897, lng: 34.807 },
    radius: 350,  // Main commercial street - cafes, bars, outdoor seating
    previewRadius: 700,
    vibe: 'Main street - Herzl Bar, cafes, outdoor seating',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '☕',
    isActive: true  // ✅ v2.8.6: Active for pilot!
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏝️ EILAT - Party City!
  // ══════════════════════════════════════════════════════════
  
  'eilat-promenade': {
    id: 'eilat-promenade',
    name: 'Promenade',
    city: 'eilat',
    cityHe: 'אילת',
    center: { lat: 29.5517, lng: 34.9508 },
    radius: 600,
    previewRadius: 1000,
    vibe: 'Beach bars & tourist nightlife',
    peakHours: 'Daily 20:00-03:00',
    icon: '🌅',
    isActive: true  // ✅ Now active!
  },
  
  'eilat-hotel-strip': {
    id: 'eilat-hotel-strip',
    name: 'Hotel Strip',
    city: 'eilat',
    cityHe: 'אילת',
    center: { lat: 29.5450, lng: 34.9480 },
    radius: 800,
    previewRadius: 1200,
    vibe: 'Hotel bars & clubs',
    peakHours: 'Daily 22:00-04:00',
    icon: '🏨',
    isActive: true  // ✅ Now active!
  },
  
  'eilat-north-beach': {
    id: 'eilat-north-beach',
    name: 'North Beach',
    city: 'eilat',
    cityHe: 'אילת',
    center: { lat: 29.5577, lng: 34.9519 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Beach parties & water sports',
    peakHours: 'Daily 16:00-02:00',
    icon: '🏖️',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🌊 ASHDOD - Port City!
  // ══════════════════════════════════════════════════════════
  
  'ashdod-city': {
    id: 'ashdod-city',
    name: 'City Center',
    city: 'ashdod',
    cityHe: 'אשדוד',
    center: { lat: 31.8044, lng: 34.6553 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Main entertainment area',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🌃',
    isActive: true
  },
  
  'ashdod-marina': {
    id: 'ashdod-marina',
    name: 'Marina',
    city: 'ashdod',
    cityHe: 'אשדוד',
    center: { lat: 31.8218, lng: 34.6382 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Waterfront restaurants & bars',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '⚓',
    isActive: true
  },
  
  'ashdod-rova-vav': {
    id: 'ashdod-rova-vav',
    name: 'Rova Vav',
    city: 'ashdod',
    cityHe: 'אשדוד',
    center: { lat: 31.7897, lng: 34.6489 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local pubs & restaurants',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🍺',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏜️ BEER SHEVA - Capital of the Negev!
  // ══════════════════════════════════════════════════════════
  
  'bsheva-rager': {
    id: 'bsheva-rager',
    name: 'Rager Boulevard',
    city: 'beer-sheva',
    cityHe: 'באר שבע',
    center: { lat: 31.2520, lng: 34.7830 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Main nightlife strip',
    peakHours: 'Thu-Sat 21:00-03:00',
    icon: '🎉',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏙️ RAMAT GAN - Diamond District!
  // ══════════════════════════════════════════════════════════
  
  'rg-bursa': {
    id: 'rg-bursa',
    name: 'Bursa',
    city: 'ramat-gan',
    cityHe: 'רמת גן',
    center: { lat: 32.0845, lng: 34.8088 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Diamond exchange area nightlife',
    peakHours: 'Thu-Sat 21:00-03:00',
    icon: '💎',
    isActive: true
  },
  
  'rg-ayalon': {
    id: 'rg-ayalon',
    name: 'Ayalon Mall Area',
    city: 'ramat-gan',
    cityHe: 'רמת גן',
    center: { lat: 32.0680, lng: 34.8248 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Mall area restaurants & bars',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🛍️',
    isActive: true
  },
  
  'rg-city-center': {
    id: 'rg-city-center',
    name: 'City Center',
    city: 'ramat-gan',
    cityHe: 'רמת גן',
    center: { lat: 32.0719, lng: 34.8160 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local bars & restaurants',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🌆',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏡 GIVATAYIM
  // ══════════════════════════════════════════════════════════
  
  'givatayim-center': {
    id: 'givatayim-center',
    name: 'City Center',
    city: 'givatayim',
    cityHe: 'גבעתיים',
    center: { lat: 32.0719, lng: 34.8119 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local pubs & cafes',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '☕',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏖️ HERZLIYA - Hi-Tech & Beach!
  // ══════════════════════════════════════════════════════════
  
  'herzliya-pituach': {
    id: 'herzliya-pituach',
    name: 'Herzliya Pituach',
    city: 'herzliya',
    cityHe: 'הרצליה',
    center: { lat: 32.1663, lng: 34.8088 },
    radius: 600,
    previewRadius: 1000,
    vibe: 'Hi-tech hub & upscale bars',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '💻',
    isActive: true
  },
  
  'herzliya-marina': {
    id: 'herzliya-marina',
    name: 'Marina',
    city: 'herzliya',
    cityHe: 'הרצליה',
    center: { lat: 32.1617, lng: 34.7967 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Yacht clubs & waterfront dining',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '⛵',
    isActive: true
  },
  
  'herzliya-arena': {
    id: 'herzliya-arena',
    name: 'Arena',
    city: 'herzliya',
    cityHe: 'הרצליה',
    center: { lat: 32.1580, lng: 34.8050 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Entertainment complex',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🎭',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🌊 NETANYA - Beach City!
  // ══════════════════════════════════════════════════════════
  
  'netanya-promenade': {
    id: 'netanya-promenade',
    name: 'Promenade',
    city: 'netanya',
    cityHe: 'נתניה',
    center: { lat: 32.3290, lng: 34.8510 },
    radius: 600,
    previewRadius: 1000,
    vibe: 'Beachfront bars & restaurants',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🌊',
    isActive: true
  },
  
  'netanya-city-center': {
    id: 'netanya-city-center',
    name: 'City Center',
    city: 'netanya',
    cityHe: 'נתניה',
    center: { lat: 32.3215, lng: 34.8532 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Main square & nightlife',
    peakHours: 'Thu-Sat 21:00-03:00',
    icon: '🌃',
    isActive: true
  },
  
  'netanya-poleg': {
    id: 'netanya-poleg',
    name: 'Poleg',
    city: 'netanya',
    cityHe: 'נתניה',
    center: { lat: 32.2850, lng: 34.8350 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Beach clubs & cafes',
    peakHours: 'Fri-Sat 18:00-01:00',
    icon: '🏖️',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🌳 RAANANA - Family & Fun!
  // ══════════════════════════════════════════════════════════
  
  'raanana-ahuza': {
    id: 'raanana-ahuza',
    name: 'Ahuza Street',
    city: 'raanana',
    cityHe: 'רעננה',
    center: { lat: 32.1836, lng: 34.8706 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Upscale cafes & restaurants',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🍷',
    isActive: true
  },
  
  'raanana-park': {
    id: 'raanana-park',
    name: 'Park Area',
    city: 'raanana',
    cityHe: 'רעננה',
    center: { lat: 32.1900, lng: 34.8750 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Park cafes & family spots',
    peakHours: 'Daily 17:00-23:00',
    icon: '🌳',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏘️ KFAR SABA
  // ══════════════════════════════════════════════════════════
  
  'kfar-saba-weizmann': {
    id: 'kfar-saba-weizmann',
    name: 'Weizmann Street',
    city: 'kfar-saba',
    cityHe: 'כפר סבא',
    center: { lat: 32.1780, lng: 34.9066 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Main bar & restaurant strip',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🍺',
    isActive: true
  },
  
  'kfar-saba-center': {
    id: 'kfar-saba-center',
    name: 'City Center',
    city: 'kfar-saba',
    cityHe: 'כפר סבא',
    center: { lat: 32.1750, lng: 34.9100 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local nightlife',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🌙',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏙️ PETAH TIKVA - Gateway City!
  // ══════════════════════════════════════════════════════════
  
  'pt-rothschild': {
    id: 'pt-rothschild',
    name: 'Rothschild',
    city: 'petah-tikva',
    cityHe: 'פתח תקווה',
    center: { lat: 32.0900, lng: 34.8850 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Main entertainment street',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🎉',
    isActive: true
  },
  
  'pt-em-hamoshavot': {
    id: 'pt-em-hamoshavot',
    name: 'Em HaMoshavot',
    city: 'petah-tikva',
    cityHe: 'פתח תקווה',
    center: { lat: 32.0841, lng: 34.8878 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Historic area bars & cafes',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '☕',
    isActive: true
  },
  
  'pt-big': {
    id: 'pt-big',
    name: 'Big Fashion',
    city: 'petah-tikva',
    cityHe: 'פתח תקווה',
    center: { lat: 32.1000, lng: 34.8700 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Mall area entertainment',
    peakHours: 'Daily 18:00-00:00',
    icon: '🛍️',
    isActive: true
  },
  
  'pt-hashaham': {
    id: 'pt-hashaham',
    name: 'HaShaham',
    city: 'petah-tikva',
    cityHe: 'פתח תקווה',
    center: { lat: 32.0920, lng: 34.8730 },  // רחוב השחם - ליד אוסקר ווילד
    radius: 500,
    previewRadius: 900,
    vibe: 'Bars & pubs district',
    peakHours: 'Thu-Sat 21:00-03:00',
    icon: '🍺',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🌆 RISHON LEZION
  // ══════════════════════════════════════════════════════════
  
  'rishon-rothschild': {
    id: 'rishon-rothschild',
    name: 'Rothschild',
    city: 'rishon-lezion',
    cityHe: 'ראשון לציון',
    center: { lat: 31.9650, lng: 34.8050 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Historic area & wine bars',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🍷',
    isActive: true
  },
  
  'rishon-rishonim': {
    id: 'rishon-rishonim',
    name: 'Rishonim',
    city: 'rishon-lezion',
    cityHe: 'ראשון לציון',
    center: { lat: 31.9730, lng: 34.7925 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Main entertainment complex',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🎬',
    isActive: true
  },
  
  'rishon-west': {
    id: 'rishon-west',
    name: 'West Rishon',
    city: 'rishon-lezion',
    cityHe: 'ראשון לציון',
    center: { lat: 31.9800, lng: 34.7700 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Beach area & new restaurants',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🌅',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏡 HOLON
  // ══════════════════════════════════════════════════════════
  
  'holon-sokolov': {
    id: 'holon-sokolov',
    name: 'Sokolov Street',
    city: 'holon',
    cityHe: 'חולון',
    center: { lat: 32.0110, lng: 34.7748 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Main entertainment strip',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🎭',
    isActive: true
  },
  
  'holon-center': {
    id: 'holon-center',
    name: 'City Center',
    city: 'holon',
    cityHe: 'חולון',
    center: { lat: 32.0150, lng: 34.7800 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local bars & restaurants',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🍺',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏖️ BAT YAM
  // ══════════════════════════════════════════════════════════
  
  'bat-yam-beach': {
    id: 'bat-yam-beach',
    name: 'Beach Promenade',
    city: 'bat-yam',
    cityHe: 'בת ים',
    center: { lat: 32.0171, lng: 34.7420 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Beachfront bars & restaurants',
    peakHours: 'Thu-Sat 19:00-02:00',
    icon: '🏖️',
    isActive: true
  },
  
  'bat-yam-center': {
    id: 'bat-yam-center',
    name: 'City Center',
    city: 'bat-yam',
    cityHe: 'בת ים',
    center: { lat: 32.0200, lng: 34.7510 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local entertainment',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🌙',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏘️ NES ZIONA
  // ══════════════════════════════════════════════════════════
  
  'nes-ziona-center': {
    id: 'nes-ziona-center',
    name: 'City Center',
    city: 'nes-ziona',
    cityHe: 'נס ציונה',
    center: { lat: 31.9293, lng: 34.7985 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local bars & restaurants',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🍺',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏙️ MODIIN
  // ══════════════════════════════════════════════════════════
  
  'modiin-azrieli': {
    id: 'modiin-azrieli',
    name: 'Azrieli Mall',
    city: 'modiin',
    cityHe: 'מודיעין',
    center: { lat: 31.8969, lng: 35.0104 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Mall area entertainment',
    peakHours: 'Thu-Sat 19:00-00:00',
    icon: '🛍️',
    isActive: true
  },
  
  'modiin-ligad': {
    id: 'modiin-ligad',
    name: 'Ligad Center',
    city: 'modiin',
    cityHe: 'מודיעין',
    center: { lat: 31.9100, lng: 35.0050 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Entertainment complex',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🎬',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏛️ JERUSALEM - Additional Zones
  // ══════════════════════════════════════════════════════════
  
  'jlm-nahalat-shiva': {
    id: 'jlm-nahalat-shiva',
    name: 'Nahalat Shiva',
    city: 'jerusalem',
    cityHe: 'ירושלים',
    center: { lat: 31.7805, lng: 35.2210 },
    radius: 300,
    previewRadius: 700,
    vibe: 'Trendy bars & cafes in historic lanes',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🎸',
    isActive: true
  },
  
  'jlm-talbiya': {
    id: 'jlm-talbiya',
    name: 'Talbiya',
    city: 'jerusalem',
    cityHe: 'ירושלים',
    center: { lat: 31.7650, lng: 35.2150 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Upscale neighborhood dining',
    peakHours: 'Thu-Sat 19:00-00:00',
    icon: '🍷',
    isActive: true
  },
  
  'jlm-emek-refaim': {
    id: 'jlm-emek-refaim',
    name: 'Emek Refaim',
    city: 'jerusalem',
    cityHe: 'ירושלים',
    center: { lat: 31.7600, lng: 35.2200 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Bohemian cafes & wine bars',
    peakHours: 'Daily 18:00-01:00',
    icon: '☕',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏛️ BEIT SHEMESH
  // ══════════════════════════════════════════════════════════
  
  'beit-shemesh-center': {
    id: 'beit-shemesh-center',
    name: 'City Center',
    city: 'beit-shemesh',
    cityHe: 'בית שמש',
    center: { lat: 31.7513, lng: 34.9877 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local restaurants & cafes',
    peakHours: 'Thu-Sat 19:00-00:00',
    icon: '🌆',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // ⛰️ HAIFA - Additional Zones
  // ══════════════════════════════════════════════════════════
  
  'haifa-masada': {
    id: 'haifa-masada',
    name: 'Masada Street',
    city: 'haifa',
    cityHe: 'חיפה',
    center: { lat: 32.8090, lng: 34.9920 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Student bars & live music',
    peakHours: 'Thu-Sat 21:00-03:00',
    icon: '🎵',
    isActive: true
  },
  
  'haifa-bat-galim': {
    id: 'haifa-bat-galim',
    name: 'Bat Galim',
    city: 'haifa',
    cityHe: 'חיפה',
    center: { lat: 32.8300, lng: 34.9600 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Beach bars & seafood restaurants',
    peakHours: 'Thu-Sat 18:00-01:00',
    icon: '🌊',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🍷 ZICHRON YAAKOV - Wine Country!
  // ══════════════════════════════════════════════════════════
  
  'zichron-midrahov': {
    id: 'zichron-midrahov',
    name: 'Midrahov HaMeyasdim',
    city: 'zichron-yaakov',
    cityHe: 'זיכרון יעקב',
    center: { lat: 32.5714, lng: 34.9544 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Historic pedestrian street - cafes, wine bars & boutiques',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🍷',
    isActive: true
  },
  
  'zichron-wineries': {
    id: 'zichron-wineries',
    name: 'Wineries District',
    city: 'zichron-yaakov',
    cityHe: 'זיכרון יעקב',
    center: { lat: 32.5680, lng: 34.9510 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Wine tasting & gourmet restaurants',
    peakHours: 'Thu-Sat 18:00-23:00',
    icon: '🏰',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏔️ NORTH - New Cities!
  // ══════════════════════════════════════════════════════════
  
  'nahariya-gaaton': {
    id: 'nahariya-gaaton',
    name: 'Gaaton Boulevard',
    city: 'nahariya',
    cityHe: 'נהריה',
    center: { lat: 33.0057, lng: 35.0978 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Main street cafes & bars',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🌴',
    isActive: true
  },
  
  'nahariya-beach': {
    id: 'nahariya-beach',
    name: 'Beach',
    city: 'nahariya',
    cityHe: 'נהריה',
    center: { lat: 33.0100, lng: 35.0900 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Beach bars & summer vibes',
    peakHours: 'Thu-Sat 18:00-01:00',
    icon: '🏖️',
    isActive: true
  },
  
  'acre-old-city': {
    id: 'acre-old-city',
    name: 'Old City',
    city: 'acre',
    cityHe: 'עכו',
    center: { lat: 32.9272, lng: 35.0764 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Historic bars & restaurants',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🏛️',
    isActive: true
  },
  
  'acre-beach': {
    id: 'acre-beach',
    name: 'Beach',
    city: 'acre',
    cityHe: 'עכו',
    center: { lat: 32.9300, lng: 35.0700 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Seaside dining',
    peakHours: 'Thu-Sat 18:00-00:00',
    icon: '🌅',
    isActive: true
  },
  
  'kiryat-shmona-center': {
    id: 'kiryat-shmona-center',
    name: 'City Center',
    city: 'kiryat-shmona',
    cityHe: 'קריית שמונה',
    center: { lat: 33.2075, lng: 35.5697 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Northern nightlife hub',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🏔️',
    isActive: true
  },
  
  'tiberias-promenade': {
    id: 'tiberias-promenade',
    name: 'Promenade',
    city: 'tiberias',
    cityHe: 'טבריה',
    center: { lat: 32.7900, lng: 35.5380 },
    radius: 500,
    previewRadius: 900,
    vibe: 'Lakefront bars & restaurants',
    peakHours: 'Thu-Sat 19:00-01:00',
    icon: '🌊',
    isActive: true
  },
  
  'tiberias-center': {
    id: 'tiberias-center',
    name: 'City Center',
    city: 'tiberias',
    cityHe: 'טבריה',
    center: { lat: 32.7957, lng: 35.5320 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local entertainment',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🌙',
    isActive: true
  },
  
  'safed-old-city': {
    id: 'safed-old-city',
    name: 'Old City',
    city: 'safed',
    cityHe: 'צפת',
    center: { lat: 32.9646, lng: 35.4962 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Mystical cafes & wine bars',
    peakHours: 'Thu-Sat 19:00-00:00',
    icon: '✨',
    isActive: true
  },
  
  'safed-artists': {
    id: 'safed-artists',
    name: 'Artists Quarter',
    city: 'safed',
    cityHe: 'צפת',
    center: { lat: 32.9670, lng: 35.4980 },
    radius: 300,
    previewRadius: 700,
    vibe: 'Bohemian galleries & cafes',
    peakHours: 'Daily 17:00-23:00',
    icon: '🎨',
    isActive: true
  },
  
  'karmiel-center': {
    id: 'karmiel-center',
    name: 'City Center',
    city: 'karmiel',
    cityHe: 'כרמיאל',
    center: { lat: 32.9193, lng: 35.2961 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local bars & restaurants',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🍺',
    isActive: true
  },
  
  'nazareth-old-city': {
    id: 'nazareth-old-city',
    name: 'Old City',
    city: 'nazareth',
    cityHe: 'נצרת',
    center: { lat: 32.7000, lng: 35.2970 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Historic restaurants & cafes',
    peakHours: 'Thu-Sat 19:00-00:00',
    icon: '🏛️',
    isActive: true
  },
  
  'nazareth-center': {
    id: 'nazareth-center',
    name: 'City Center',
    city: 'nazareth',
    cityHe: 'נצרת',
    center: { lat: 32.6996, lng: 35.3035 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Modern nightlife',
    peakHours: 'Thu-Sat 20:00-02:00',
    icon: '🌃',
    isActive: true
  },
  
  'afula-center': {
    id: 'afula-center',
    name: 'City Center',
    city: 'afula',
    cityHe: 'עפולה',
    center: { lat: 32.6100, lng: 35.2903 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Yehoshua Hankin street nightlife',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🎉',
    isActive: true
  },
  
  // ✅ NEW: Yula Bar - עפולה
  'afula-yula-bar': {
    id: 'afula-yula-bar',
    name: 'Yula Bar',
    city: 'afula',
    cityHe: 'עפולה',
    center: { lat: 32.6096, lng: 35.2897 },
    radius: 200,
    previewRadius: 500,
    vibe: 'Popular bar & restaurant in industrial area - HaHashmal 3',
    peakHours: 'Sun-Thu 21:00-02:00, Sat 21:00-02:00',
    icon: '🍺',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🌳 TEL ADASHIM - Jezreel Valley
  // ══════════════════════════════════════════════════════════
  
  // ✅ NEW: Kachol VeYarok - כחול וירוק גן אירועים
  'tel-adashim-kachol-yarok': {
    id: 'tel-adashim-kachol-yarok',
    name: 'Kachol VeYarok Events',
    city: 'tel-adashim',
    cityHe: 'תל עדשים',
    center: { lat: 32.5971, lng: 35.1967 },
    radius: 300,
    previewRadius: 600,
    vibe: 'Beautiful outdoor event venue in Jezreel Valley fields',
    peakHours: 'Events: Thu-Sat evenings',
    icon: '💚',
    isActive: true
  },
  
  // ══════════════════════════════════════════════════════════
  // 🏜️ SOUTH - Additional Zones
  // ══════════════════════════════════════════════════════════
  
  'kiryat-gat-center': {
    id: 'kiryat-gat-center',
    name: 'City Center',
    city: 'kiryat-gat',
    cityHe: 'קריית גת',
    center: { lat: 31.6100, lng: 34.7642 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Local entertainment',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🌙',
    isActive: true
  },
  
  'dimona-center': {
    id: 'dimona-center',
    name: 'City Center',
    city: 'dimona',
    cityHe: 'דימונה',
    center: { lat: 31.0697, lng: 35.0328 },
    radius: 400,
    previewRadius: 800,
    vibe: 'Desert nightlife',
    peakHours: 'Thu-Sat 20:00-01:00',
    icon: '🏜️',
    isActive: true
  }
}

// ═══════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Calculate distance between two points in meters
 */
export const calculateDistance = (
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Get user's current zone (if inside one)
 */
export const getCurrentZone = (
  lat: number, 
  lng: number
): EntertainmentZone | null => {
  for (const zone of Object.values(ENTERTAINMENT_ZONES)) {
    if (!zone.isActive) continue
    
    const distance = calculateDistance(lat, lng, zone.center.lat, zone.center.lng)
    if (distance <= zone.radius) {
      return zone
    }
  }
  return null
}

/**
 * Get nearby zone (in preview range - "Almost there!")
 */
export const getNearbyZone = (
  lat: number, 
  lng: number
): { zone: EntertainmentZone; distance: number } | null => {
  let closest: { zone: EntertainmentZone; distance: number } | null = null
  
  for (const zone of Object.values(ENTERTAINMENT_ZONES)) {
    if (!zone.isActive) continue
    
    const distance = calculateDistance(lat, lng, zone.center.lat, zone.center.lng)
    
    // In preview range but not inside
    if (distance > zone.radius && distance <= zone.previewRadius) {
      if (!closest || distance < closest.distance) {
        closest = { zone, distance }
      }
    }
  }
  
  return closest
}

/**
 * Get all zones near a location (sorted by distance)
 */
export const getZonesNearLocation = (
  lat: number, 
  lng: number,
  maxDistance: number = 50000  // 50km default
): Array<EntertainmentZone & { distance: number; status: 'inside' | 'preview' | 'far' }> => {
  const results: Array<EntertainmentZone & { distance: number; status: 'inside' | 'preview' | 'far' }> = []
  
  for (const zone of Object.values(ENTERTAINMENT_ZONES)) {
    if (!zone.isActive) continue
    
    const distance = calculateDistance(lat, lng, zone.center.lat, zone.center.lng)
    
    if (distance <= maxDistance) {
      let status: 'inside' | 'preview' | 'far'
      if (distance <= zone.radius) {
        status = 'inside'
      } else if (distance <= zone.previewRadius) {
        status = 'preview'
      } else {
        status = 'far'
      }
      
      results.push({ ...zone, distance, status })
    }
  }
  
  // Sort: inside first, then preview, then by distance
  return results.sort((a, b) => {
    const statusOrder = { inside: 0, preview: 1, far: 2 }
    const statusCompare = statusOrder[a.status] - statusOrder[b.status]
    if (statusCompare !== 0) return statusCompare
    return a.distance - b.distance
  })
}

/**
 * Get all active zones in a city
 */
export const getZonesInCity = (cityId: string): EntertainmentZone[] => {
  const city = CITIES[cityId]
  if (!city || !city.isActive) return []
  
  return city.zones
    .map(zoneId => ENTERTAINMENT_ZONES[zoneId])
    .filter(zone => zone && zone.isActive)
}

/**
 * Get all active cities
 */
export const getActiveCities = (): City[] => {
  return Object.values(CITIES).filter(city => city.isActive)
}

/**
 * Check if a city is active
 */
export const isCityActive = (cityId: string): boolean => {
  return CITIES[cityId]?.isActive || false
}

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Get zone status text
 */
export const getZoneStatusText = (
  zone: EntertainmentZone, 
  distance: number
): { text: string; emoji: string; color: string } => {
  if (distance <= zone.radius) {
    return { text: "You're here!", emoji: '💚', color: '#4ade80' }
  }
  if (distance <= zone.previewRadius) {
    return { text: 'Almost there!', emoji: '🚶', color: '#f97316' }
  }
  return { text: formatDistance(distance), emoji: '📍', color: '#6b7280' }
}
