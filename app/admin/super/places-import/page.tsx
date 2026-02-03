"use client"

/**
 * 🦎 I4IGUANA - Places Import Tool v3.1
 * 
 * SIMPLIFIED EDITION - Clean & Easy! 🎬
 * 
 * WORKFLOW:
 * 1. Select city from main screen
 * 2. Search & import venues (Google Places)
 * 3. Auto-link to zones happens in background
 * 
 * v3.1.0 - Simplified Edition
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MapPin, 
  Search, 
  Coffee, 
  Wine, 
  Music2, 
  UtensilsCrossed,
  Import,
  Check,
  Loader2,
  Plus,
  Star,
  RefreshCw,
  ArrowLeft,
  Link2,
  CheckCircle2,
  Layers
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, getDocs, updateDoc, Timestamp } from 'firebase/firestore'
import { generateVenueQRCode } from '@/lib/qr-service'
import { encodeGeohash } from '@/lib/location-service'
import { CITIES, ENTERTAINMENT_ZONES, calculateDistance } from '@/lib/entertainment-zones'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CITIES - הערים המרכזיות
// ═══════════════════════════════════════════════════════════════════════════

const MAIN_CITIES = [
  // ══════════════ מרכז ══════════════
  { id: 'tel-aviv', nameHe: 'תל אביב', icon: '🌆' },
  { id: 'jerusalem', nameHe: 'ירושלים', icon: '🏛️' },
  { id: 'ramat-gan', nameHe: 'רמת גן', icon: '🏢' },
  { id: 'petah-tikva', nameHe: 'פתח תקווה', icon: '🌳' },
  { id: 'rishon-lezion', nameHe: 'ראשון לציון', icon: '🏙️' },
  { id: 'holon', nameHe: 'חולון', icon: '🎭' },
  { id: 'bat-yam', nameHe: 'בת ים', icon: '🏖️' },
  { id: 'givatayim', nameHe: 'גבעתיים', icon: '🏘️' },
  { id: 'rehovot', nameHe: 'רחובות', icon: '🌾' },
  { id: 'modiin', nameHe: 'מודיעין', icon: '🏗️' },
  { id: 'herzliya', nameHe: 'הרצליה', icon: '💎' },
  { id: 'raanana', nameHe: 'רעננה', icon: '🌿' },
  { id: 'kfar-saba', nameHe: 'כפר סבא', icon: '🌲' },
  { id: 'netanya', nameHe: 'נתניה', icon: '🌅' },
  { id: 'nes-ziona', nameHe: 'נס ציונה', icon: '🌻' },
  // ══════════════ צפון ══════════════
  { id: 'haifa', nameHe: 'חיפה', icon: '⛰️' },
  { id: 'zichron-yaakov', nameHe: 'זיכרון יעקב', icon: '🍷' },
  { id: 'acre', nameHe: 'עכו', icon: '🏰' },
  { id: 'nahariya', nameHe: 'נהריה', icon: '🌊' },
  { id: 'karmiel', nameHe: 'כרמיאל', icon: '🏔️' },
  { id: 'safed', nameHe: 'צפת', icon: '✡️' },
  { id: 'tiberias', nameHe: 'טבריה', icon: '🌊' },
  { id: 'afula', nameHe: 'עפולה', icon: '🌾' },
  { id: 'nazareth', nameHe: 'נצרת', icon: '⛪' },
  { id: 'kiryat-shmona', nameHe: 'קריית שמונה', icon: '🗻' },
  // ══════════════ דרום ══════════════
  { id: 'beer-sheva', nameHe: 'באר שבע', icon: '🏜️' },
  { id: 'ashdod', nameHe: 'אשדוד', icon: '🚢' },
  { id: 'ashkelon', nameHe: 'אשקלון', icon: '🏖️' },
  { id: 'eilat', nameHe: 'אילת', icon: '🏝️' },
  { id: 'kiryat-gat', nameHe: 'קריית גת', icon: '🏘️' },
  { id: 'dimona', nameHe: 'דימונה', icon: '☀️' },
  { id: 'beit-shemesh', nameHe: 'בית שמש', icon: '🌄' },
]

// ═══════════════════════════════════════════════════════════════════════════
// VENUE TYPES
// ═══════════════════════════════════════════════════════════════════════════

const VENUE_TYPES = {
  bar: { label: 'ברים', icon: Wine, keywords: 'bar pub' },
  club: { label: 'מועדונים', icon: Music2, keywords: 'club nightclub' },
  cafe: { label: 'בתי קפה', icon: Coffee, keywords: 'cafe coffee' },
  restaurant: { label: 'מסעדות', icon: UtensilsCrossed, keywords: 'restaurant' },
  lounge: { label: 'לאונג\'ים', icon: Wine, keywords: 'lounge' }
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface VenueToImport {
  id: string
  name: string
  displayName: string
  address: string
  latitude: number
  longitude: number
  type: string
  rating?: number
  ratingsCount?: number
  selected: boolean
  imported: boolean
  existsInDb: boolean
}

interface CityStats {
  id: string
  nameHe: string
  icon: string
  venueCount: number
  linkedCount: number
  zonesCount: number
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PlacesImportPage() {
  const router = useRouter()
  
  // View state
  const [selectedCity, setSelectedCity] = useState<typeof MAIN_CITIES[0] | null>(null)
  
  // Data
  const [cityStats, setCityStats] = useState<CityStats[]>([])
  const [existingVenueNames, setExistingVenueNames] = useState<Set<string>>(new Set())
  const [totalVenues, setTotalVenues] = useState(0)
  const [totalLinked, setTotalLinked] = useState(0)
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['bar', 'club', 'cafe', 'lounge'])
  const [places, setPlaces] = useState<VenueToImport[]>([])
  
  // Loading
  const [loadingStats, setLoadingStats] = useState(true)
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [autoLinking, setAutoLinking] = useState(false)
  const [autoLinkProgress, setAutoLinkProgress] = useState({ current: 0, total: 0, linked: 0 })

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD STATS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const venuesSnapshot = await getDocs(collection(db, 'venues'))
      const venueNames = new Set<string>()
      const venuesByCity: Record<string, { total: number, linked: number }> = {}
      
      let total = 0
      let linked = 0
      
      venuesSnapshot.forEach(doc => {
        const data = doc.data()
        total++
        
        // Track names for duplicate detection
        if (data.displayName) {
          venueNames.add(data.displayName.toLowerCase())
        }
        
        // Count by city
        const cityName = data.city || ''
        if (!venuesByCity[cityName]) {
          venuesByCity[cityName] = { total: 0, linked: 0 }
        }
        venuesByCity[cityName].total++
        
        if (data.linkedZoneId) {
          venuesByCity[cityName].linked++
          linked++
        }
      })
      
      setExistingVenueNames(venueNames)
      setTotalVenues(total)
      setTotalLinked(linked)
      
      // Build city stats
      const stats: CityStats[] = MAIN_CITIES.map(city => {
        const cityData = CITIES[city.id]
        const statsForCity = venuesByCity[city.nameHe] || { total: 0, linked: 0 }
        
        return {
          id: city.id,
          nameHe: city.nameHe,
          icon: city.icon,
          venueCount: statsForCity.total,
          linkedCount: statsForCity.linked,
          zonesCount: cityData?.zones?.length || 0
        }
      })
      
      setCityStats(stats)
      
    } catch (error) {
      console.error('Error loading stats:', error)
    }
    setLoadingStats(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-LINK ALL VENUES
  // ═══════════════════════════════════════════════════════════════════════════

  const autoLinkAll = async () => {
    const venuesSnapshot = await getDocs(collection(db, 'venues'))
    const unlinkedVenues: { id: string, lat: number, lng: number, city: string }[] = []
    
    venuesSnapshot.forEach(doc => {
      const data = doc.data()
      if (!data.linkedZoneId && data.latitude && data.longitude) {
        unlinkedVenues.push({
          id: doc.id,
          lat: data.latitude,
          lng: data.longitude,
          city: data.city || ''
        })
      }
    })
    
    if (unlinkedVenues.length === 0) {
      alert('✅ כל המקומות כבר מקושרים!')
      return
    }
    
    if (!confirm(`נמצאו ${unlinkedVenues.length} מקומות לא מקושרים.\nלקשר אותם אוטומטית לאזורי הבילוי?`)) {
      return
    }
    
    setAutoLinking(true)
    setAutoLinkProgress({ current: 0, total: unlinkedVenues.length, linked: 0 })
    
    let linkedCount = 0
    
    for (let i = 0; i < unlinkedVenues.length; i++) {
      const venue = unlinkedVenues[i]
      setAutoLinkProgress({ current: i + 1, total: unlinkedVenues.length, linked: linkedCount })
      
      // Find nearest zone
      let nearestZoneId: string | null = null
      let minDistance = Infinity
      
      for (const zone of Object.values(ENTERTAINMENT_ZONES)) {
        if (!zone.isActive) continue
        
        const distance = calculateDistance(venue.lat, venue.lng, zone.center.lat, zone.center.lng)
        
        if (distance < minDistance && distance <= zone.radius * 3) {
          minDistance = distance
          nearestZoneId = zone.id
        }
      }
      
      if (nearestZoneId) {
        try {
          await updateDoc(doc(db, 'venues', venue.id), {
            linkedZoneId: nearestZoneId,
            updatedAt: Timestamp.now()
          })
          linkedCount++
        } catch (error) {
          console.error(`Failed to link ${venue.id}:`, error)
        }
      }
      
      await new Promise(r => setTimeout(r, 50))
    }
    
    setAutoLinking(false)
    alert(`✅ קושרו ${linkedCount} מקומות בהצלחה!`)
    loadStats()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH PLACES
  // ═══════════════════════════════════════════════════════════════════════════

  const searchPlaces = async () => {
    if (!selectedCity) return
    
    setSearching(true)
    setPlaces([])
    
    try {
      const cityData = CITIES[selectedCity.id]
      const results: VenueToImport[] = []
      
      for (const type of selectedTypes) {
        const config = VENUE_TYPES[type as keyof typeof VENUE_TYPES]
        
        const queryText = searchQuery || `${config.keywords} ${selectedCity.nameHe}`
        const location = `${cityData.center.lat},${cityData.center.lng}`
        
        const url = `/api/google-places/search?query=${encodeURIComponent(queryText)}&location=${location}&radius=5000&type=${type === 'lounge' ? 'bar' : type}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.results) {
          for (const place of data.results) {
            if (results.find(r => r.id === place.place_id)) continue
            
            // ✅ FIX v4: Simpler city filter - explicit mapping for problematic cities
            const address = place.formatted_address || place.vicinity || ''
            const addressLower = address.toLowerCase()
            const placeName = place.name?.toLowerCase() || ''
            
            // Explicit spelling variations for cities with known Google differences
            const CITY_VARIATIONS: Record<string, string[]> = {
              'nes-ziona': ['ness ziona', 'nes ziona', 'nes-ziona', 'נס ציונה', 'נס-ציונה'],
              'kiryat-shmona': ['kiryat shmona', 'qiryat shmona', 'kiryat shemona', 'קריית שמונה', 'קרית שמונה'],
              'beer-sheva': ['beer sheva', 'beersheba', 'beer-sheva', 'באר שבע'],
              'tel-aviv': ['tel aviv', 'tel-aviv', 'תל אביב', 'תל-אביב', 'tel aviv-yafo', 'תל אביב-יפו'],
              'petah-tikva': ['petah tikva', 'petach tikva', 'פתח תקווה', 'פתח-תקווה'],
              'rishon-lezion': ['rishon lezion', 'rishon letsiyon', 'ראשון לציון', 'rishon le-zion', 'rishon letsion'],
              'ramat-gan': ['ramat gan', 'ramat-gan', 'רמת גן'],
              'kfar-saba': ['kfar saba', 'kefar sava', 'כפר סבא', 'kefar saba'],
              'kiryat-gat': ['kiryat gat', 'qiryat gat', 'קריית גת', 'קרית גת'],
              'beit-shemesh': ['beit shemesh', 'bet shemesh', 'בית שמש'],
              'givatayim': ['givatayim', 'givatayim', 'givataim', 'גבעתיים'],
              'herzliya': ['herzliya', 'hertsliya', 'הרצליה'],
              'raanana': ['raanana', 'raanana', 'רעננה'],
              'holon': ['holon', 'חולון'],
              'bat-yam': ['bat yam', 'bat-yam', 'בת ים'],
              'netanya': ['netanya', 'netania', 'נתניה'],
              'rehovot': ['rehovot', 'rechovot', 'רחובות'],
              'ashdod': ['ashdod', 'אשדוד'],
              'ashkelon': ['ashkelon', 'ashqelon', 'אשקלון'],
              'haifa': ['haifa', 'hefa', 'חיפה'],
              'jerusalem': ['jerusalem', 'yerushalayim', 'ירושלים'],
              'nazareth': ['nazareth', 'natsrat', 'נצרת', 'nazerat'],
              'tiberias': ['tiberias', 'tverya', 'טבריה', 'tveria'],
              'safed': ['safed', 'tzfat', 'צפת', 'sfat', 'zefat'],
              'acre': ['acre', 'akko', 'עכו', 'acco'],
              'eilat': ['eilat', 'elat', 'אילת'],
              'modiin': ['modiin', 'modiin', 'מודיעין', 'modiin-maccabim-reut'],
              'afula': ['afula', 'עפולה'],
            }
            
            // Get city config for English name
            const cityConfig = CITIES[selectedCity.id]
            
            // Build list of valid city names
            const validNames = [
              selectedCity.nameHe,                              // Hebrew name
              selectedCity.id.replace(/-/g, ' '),               // From ID
              cityConfig?.name || '',                           // English from config
              ...(CITY_VARIATIONS[selectedCity.id] || [])       // Explicit variations
            ].filter(Boolean).map(n => n.toLowerCase())
            
            // Check if address OR place name contains any valid city name
            const textToSearch = addressLower + ' ' + placeName
            const isInCity = validNames.some(name => textToSearch.includes(name))
            
            if (!isInCity) {
              console.log(`⚠️ Filtered out: ${place.name} (${address}) - not in ${selectedCity.nameHe}`)
              continue
            }
            
            const existsInDb = existingVenueNames.has(place.name?.toLowerCase())
            
            results.push({
              id: place.place_id,
              name: place.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              displayName: place.name,
              address: address,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              type,
              rating: place.rating,
              ratingsCount: place.user_ratings_total,
              selected: false,
              imported: false,
              existsInDb
            })
          }
        }
      }
      
      setPlaces(results)
      
    } catch (error) {
      console.error('Search error:', error)
    }
    
    setSearching(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORT VENUES
  // ═══════════════════════════════════════════════════════════════════════════

  const importSelected = async () => {
    if (!selectedCity) return
    
    const toImport = places.filter(v => v.selected && !v.imported && !v.existsInDb)
    if (toImport.length === 0) return
    
    setImporting(true)
    setImportProgress({ current: 0, total: toImport.length })
    
    const cityData = CITIES[selectedCity.id]
    let successCount = 0
    
    for (let i = 0; i < toImport.length; i++) {
      const venue = toImport[i]
      setImportProgress({ current: i + 1, total: toImport.length })
      
      try {
        const venueId = venue.name || venue.id
        const geohash = encodeGeohash(venue.latitude, venue.longitude)
        const qrCode = await generateVenueQRCode(venueId, venue.displayName)
        
        // Find nearest zone for auto-linking
        let linkedZoneId = ''
        let minDistance = Infinity
        
        for (const zoneId of cityData.zones) {
          const zone = ENTERTAINMENT_ZONES[zoneId]
          if (!zone || !zone.isActive) continue
          
          const distance = calculateDistance(venue.latitude, venue.longitude, zone.center.lat, zone.center.lng)
          if (distance < minDistance && distance <= zone.radius * 3) {
            minDistance = distance
            linkedZoneId = zone.id
          }
        }
        
        await setDoc(doc(db, 'venues', venueId), {
          id: venueId,
          name: venueId,
          displayName: venue.displayName,
          description: `${venue.displayName} - ${venue.type}`,
          address: venue.address,
          city: selectedCity.nameHe,
          latitude: venue.latitude,
          longitude: venue.longitude,
          geohash,
          type: venue.type,
          rating: venue.rating || 0,
          ratingsCount: venue.ratingsCount || 0,
          active: false,  // ✅ FIX: This is what Venues page uses
          isActive: false,
          isPilot: false,
          linkedZoneId,
          qrCode,
          importedFrom: 'google-places',
          googlePlaceId: venue.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
        
        successCount++
        setPlaces(prev => prev.map(v => v.id === venue.id ? { ...v, imported: true, selected: false } : v))
        
      } catch (error) {
        console.error(`Failed to import ${venue.displayName}:`, error)
      }
      
      await new Promise(r => setTimeout(r, 300))
    }
    
    setImporting(false)
    alert(`✅ יובאו ${successCount} מקומות ל${selectedCity.nameHe}!`)
    loadStats()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleSelect = (id: string) => {
    setPlaces(prev => prev.map(v => v.id === id ? { ...v, selected: !v.selected } : v))
  }

  const selectAll = () => {
    setPlaces(prev => prev.map(v => ({ ...v, selected: !v.imported && !v.existsInDb })))
  }

  const deselectAll = () => {
    setPlaces(prev => prev.map(v => ({ ...v, selected: false })))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Auto-link Progress Overlay */}
      {autoLinking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] p-8 rounded-2xl border border-green-500/30 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">מקשר מקומות...</h3>
            <div className="text-3xl font-bold text-green-400">{autoLinkProgress.current} / {autoLinkProgress.total}</div>
            <div className="text-sm text-gray-400 mt-2">קושרו {autoLinkProgress.linked} מקומות</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-green-500/20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedCity && (
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCity(null); setPlaces([]) }}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                🦎
              </div>
              <div>
                <h1 className="text-lg font-bold text-green-400">Places Import Tool</h1>
                <p className="text-xs text-gray-400">
                  {selectedCity ? `${selectedCity.icon} ${selectedCity.nameHe}` : 'בחר עיר להוספת מקומות'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{totalVenues}</div>
                <div className="text-xs text-gray-500">מקומות</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-cyan-400">{totalLinked}</div>
                <div className="text-xs text-gray-500">מקושרים</div>
              </div>
              
              {!selectedCity && totalVenues > totalLinked && (
                <Button onClick={autoLinkAll} className="bg-purple-600 hover:bg-purple-700">
                  <Link2 className="w-4 h-4 mr-2" />
                  קשר הכל
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/super/zones-overview')}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <Layers className="w-4 h-4 mr-1" />
                מפת על
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/super')}
                className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
              >
                Panel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CITIES VIEW */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        
        {!selectedCity && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">🏙️ ערים מרכזיות</h2>
              <Button variant="ghost" size="sm" onClick={loadStats}>
                <RefreshCw className="w-4 h-4 mr-2" />רענן
              </Button>
            </div>
            
            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cityStats.map(city => (
                  <motion.button
                    key={city.id}
                    onClick={() => setSelectedCity(MAIN_CITIES.find(c => c.id === city.id)!)}
                    className="p-4 rounded-xl bg-[#111] border-2 border-white/10 hover:border-green-500/50 transition-all text-center"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-3xl mb-2">{city.icon}</div>
                    <h3 className="font-bold text-white mb-2">{city.nameHe}</h3>
                    
                    <div className="flex justify-center gap-4 text-sm">
                      <div>
                        <div className="text-lg font-bold text-green-400">{city.venueCount}</div>
                        <div className="text-xs text-gray-500">מקומות</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-400">{city.zonesCount}</div>
                        <div className="text-xs text-gray-500">אזורים</div>
                      </div>
                    </div>
                    
                    {city.venueCount > 0 && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                        {city.linkedCount === city.venueCount ? (
                          <span className="text-green-400"><CheckCircle2 className="w-3 h-3 inline mr-1" />מקושר</span>
                        ) : (
                          <span className="text-yellow-400">{city.linkedCount}/{city.venueCount} מקושרים</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
            
            {/* Instructions */}
            <div className="mt-8 p-4 bg-[#111] rounded-xl border border-white/10">
              <h3 className="font-bold mb-3">📋 הוראות שימוש:</h3>
              <ol className="space-y-2 text-sm text-gray-400">
                <li><strong className="text-white">1.</strong> בחר עיר מהרשימה</li>
                <li><strong className="text-white">2.</strong> חפש מקומות בילוי (Google Places)</li>
                <li><strong className="text-white">3.</strong> סמן ✓ את המקומות לייבוא</li>
                <li><strong className="text-white">4.</strong> לחץ "ייבא" - המקומות מתקשרים אוטומטית לאזורי הבילוי!</li>
                <li><strong className="text-white">5.</strong> לחץ "קשר הכל" (סגול) לקישור מקומות קיימים</li>
              </ol>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CITY SEARCH VIEW */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        
        {selectedCity && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Search Box */}
            <div className="mb-6 p-4 bg-[#111] rounded-xl border border-white/10">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-green-400" />
                חיפוש מקומות ב{selectedCity.nameHe}
              </h3>
              
              <Input
                placeholder={`ברים, מועדונים, בתי קפה ב${selectedCity.nameHe}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1a1a1a] border-white/10 mb-4"
              />
              
              {/* Type Filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(VENUE_TYPES).map(([type, config]) => {
                  const Icon = config.icon
                  const isSelected = selectedTypes.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedTypes(prev => 
                        isSelected ? prev.filter(t => t !== type) : [...prev, type]
                      )}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 border transition-all ${
                        isSelected ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-[#1a1a1a] border-transparent text-gray-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />{config.label}
                    </button>
                  )
                })}
              </div>
              
              <Button onClick={searchPlaces} disabled={searching} className="w-full bg-green-600 hover:bg-green-700">
                {searching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />מחפש...</> : <><Search className="w-4 h-4 mr-2" />חפש מקומות</>}
              </Button>
            </div>

            {/* Results */}
            {places.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">
                    📍 תוצאות ({places.length})
                    <span className="text-sm font-normal text-gray-500 mr-2">
                      • {places.filter(p => p.existsInDb).length} כבר במערכת
                    </span>
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll} className="border-green-500/30 text-green-400">
                      בחר הכל
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll} className="border-gray-500/30 text-gray-400">
                      נקה
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {places.map(venue => {
                    const config = VENUE_TYPES[venue.type as keyof typeof VENUE_TYPES]
                    const Icon = config?.icon || MapPin
                    
                    return (
                      <div
                        key={venue.id}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          venue.existsInDb ? 'bg-gray-500/10 border-gray-500/30 opacity-60'
                          : venue.imported ? 'bg-green-500/10 border-green-500/50'
                          : venue.selected ? 'bg-blue-500/10 border-blue-500/50'
                          : 'bg-[#111] border-white/10 hover:border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSelect(venue.id)}
                            disabled={venue.imported || venue.existsInDb}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              venue.existsInDb ? 'bg-gray-500 border-gray-500'
                              : venue.imported ? 'bg-green-500 border-green-500'
                              : venue.selected ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-600'
                            }`}
                          >
                            {(venue.selected || venue.imported || venue.existsInDb) && <Check className="w-4 h-4" />}
                          </button>
                          
                          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-green-400" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate">{venue.displayName}</h4>
                            <p className="text-xs text-gray-400 truncate">{venue.address}</p>
                          </div>
                          
                          {venue.rating && (
                            <span className="text-xs text-yellow-400 flex items-center gap-1 flex-shrink-0">
                              <Star className="w-3 h-3 fill-yellow-400" />{venue.rating}
                            </span>
                          )}
                          
                          {venue.existsInDb && <span className="text-xs text-gray-400">✓ קיים</span>}
                          {venue.imported && <span className="text-xs text-green-400">✅</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Import Button */}
                <Button
                  onClick={importSelected}
                  disabled={importing || !places.some(v => v.selected && !v.imported && !v.existsInDb)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-4"
                >
                  {importing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />מייבא {importProgress.current}/{importProgress.total}...</>
                  ) : (
                    <><Import className="w-5 h-5 mr-2" />ייבא {places.filter(v => v.selected && !v.imported && !v.existsInDb).length} מקומות</>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
