"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  MapPin, 
  Loader2, 
  CheckCircle2,
  AlertTriangle,
  Link2,
  Link2Off,
  RefreshCw,
  Building2,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Save
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { CITIES, ENTERTAINMENT_ZONES, calculateDistance } from '@/lib/entertainment-zones'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Venue {
  id: string
  displayName: string
  name: string
  address: string
  city: string
  latitude: number
  longitude: number
  linkedZoneId?: string
  active: boolean
  // Calculated
  suggestedZoneId?: string | null
  suggestedZoneName?: string
  distance?: number
  needsUpdate?: boolean
}

interface ZoneStats {
  id: string
  name: string
  icon: string
  cityHe: string
  radius: number
  vibe: string
  linkedVenues: number
  suggestedVenues: number
  center: { lat: number, lng: number }
}

// ═══════════════════════════════════════════════════════════════════════════
// CITIES LIST
// ═══════════════════════════════════════════════════════════════════════════

const CITY_OPTIONS = Object.values(CITIES)
  .filter(c => c.isActive)
  .sort((a, b) => a.nameHe.localeCompare(b.nameHe, 'he'))
  .map(c => ({
    id: c.id,
    nameHe: c.nameHe,
    name: c.name,
    icon: getIconForCity(c.id)
  }))

function getIconForCity(cityId: string): string {
  const icons: Record<string, string> = {
    'ashkelon': '🏖️', 'ashdod': '⚓', 'beer-sheva': '🏜️', 'eilat': '🌴',
    'tel-aviv': '🌆', 'jerusalem': '🏛️', 'haifa': '⛰️', 'netanya': '🏄',
    'herzliya': '💎', 'ramat-gan': '🏢', 'petah-tikva': '🌳', 'rishon-lezion': '🍷',
    'holon': '🎭', 'bat-yam': '🌊', 'rehovot': '🔬', 'modiin': '🏡',
    'kfar-saba': '🌿', 'raanana': '🌸', 'givatayim': '🏙️', 'kiryat-gat': '🏭',
    'tiberias': '🌅', 'nazareth': '⛪', 'acre': '🏰', 'nahariya': '🌊',
    'karmiel': '🏔️', 'safed': '✡️', 'kiryat-shmona': '🗻', 'afula': '🌾',
    'dimona': '☀️', 'beit-shemesh': '🌄', 'nes-ziona': '🌻'
  }
  return icons[cityId] || '📍'
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ZoneMapperPage() {
  const router = useRouter()
  
  // State
  const [selectedCity, setSelectedCity] = useState<typeof CITY_OPTIONS[0] | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([])
  const [expandedZone, setExpandedZone] = useState<string | null>(null)
  const [citylessVenues, setCitylessVenues] = useState<Venue[]>([])
  
  // Stats
  const linkedCount = venues.filter(v => v.linkedZoneId).length
  const unlinkedCount = venues.filter(v => !v.linkedZoneId).length
  const mismatchCount = venues.filter(v => v.needsUpdate).length

  // ═══════════════════════════════════════════════════════════════════════════
  // CITY DETECTION FROM NAME/ADDRESS
  // ═══════════════════════════════════════════════════════════════════════════

  const detectCityFromText = (text: string): { id: string, nameHe: string } | null => {
    const textLower = text.toLowerCase()
    
    const cityPatterns: { id: string, nameHe: string, patterns: string[] }[] = [
      { id: 'ashkelon', nameHe: 'אשקלון', patterns: ['ashkelon', 'אשקלון'] },
      { id: 'ashdod', nameHe: 'אשדוד', patterns: ['ashdod', 'אשדוד'] },
      { id: 'tel-aviv', nameHe: 'תל אביב', patterns: ['tel aviv', 'tel-aviv', 'תל אביב', 'תל-אביב'] },
      { id: 'jerusalem', nameHe: 'ירושלים', patterns: ['jerusalem', 'ירושלים'] },
      { id: 'haifa', nameHe: 'חיפה', patterns: ['haifa', 'חיפה'] },
      { id: 'beer-sheva', nameHe: 'באר שבע', patterns: ['beer sheva', 'beersheba', 'באר שבע'] },
      { id: 'eilat', nameHe: 'אילת', patterns: ['eilat', 'אילת'] },
      { id: 'netanya', nameHe: 'נתניה', patterns: ['netanya', 'נתניה'] },
      { id: 'herzliya', nameHe: 'הרצליה', patterns: ['herzliya', 'הרצליה'] },
      { id: 'ramat-gan', nameHe: 'רמת גן', patterns: ['ramat gan', 'ramat-gan', 'רמת גן'] },
      { id: 'petah-tikva', nameHe: 'פתח תקווה', patterns: ['petah tikva', 'petach tikva', 'פתח תקווה'] },
      { id: 'rishon-lezion', nameHe: 'ראשון לציון', patterns: ['rishon', 'ראשון לציון'] },
      { id: 'holon', nameHe: 'חולון', patterns: ['holon', 'חולון'] },
      { id: 'bat-yam', nameHe: 'בת ים', patterns: ['bat yam', 'bat-yam', 'בת ים'] },
      { id: 'rehovot', nameHe: 'רחובות', patterns: ['rehovot', 'רחובות'] },
      { id: 'modiin', nameHe: 'מודיעין', patterns: ['modiin', 'מודיעין'] },
      { id: 'kfar-saba', nameHe: 'כפר סבא', patterns: ['kfar saba', 'כפר סבא'] },
      { id: 'raanana', nameHe: 'רעננה', patterns: ['raanana', 'רעננה'] },
      { id: 'givatayim', nameHe: 'גבעתיים', patterns: ['givatayim', 'גבעתיים'] },
      { id: 'nes-ziona', nameHe: 'נס ציונה', patterns: ['nes ziona', 'ness ziona', 'נס ציונה'] },
      { id: 'kiryat-gat', nameHe: 'קריית גת', patterns: ['kiryat gat', 'קריית גת'] },
      { id: 'tiberias', nameHe: 'טבריה', patterns: ['tiberias', 'טבריה'] },
      { id: 'nazareth', nameHe: 'נצרת', patterns: ['nazareth', 'נצרת'] },
      { id: 'acre', nameHe: 'עכו', patterns: ['acre', 'akko', 'עכו'] },
      { id: 'nahariya', nameHe: 'נהריה', patterns: ['nahariya', 'נהריה'] },
      { id: 'karmiel', nameHe: 'כרמיאל', patterns: ['karmiel', 'כרמיאל'] },
      { id: 'safed', nameHe: 'צפת', patterns: ['safed', 'tzfat', 'צפת'] },
      { id: 'afula', nameHe: 'עפולה', patterns: ['afula', 'עפולה'] },
      { id: 'dimona', nameHe: 'דימונה', patterns: ['dimona', 'דימונה'] },
      { id: 'beit-shemesh', nameHe: 'בית שמש', patterns: ['beit shemesh', 'בית שמש'] },
      { id: 'zichron-yaakov', nameHe: 'זיכרון יעקב', patterns: ['zichron', 'zikhron', 'זיכרון יעקב', 'זיכרון'] },
    ]
    
    for (const city of cityPatterns) {
      if (city.patterns.some(p => textLower.includes(p))) {
        return { id: city.id, nameHe: city.nameHe }
      }
    }
    
    return null
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD CITYLESS VENUES
  // ═══════════════════════════════════════════════════════════════════════════

  const loadCitylessVenues = async () => {
    setLoading(true)
    
    try {
      const snapshot = await getDocs(collection(db, 'venues'))
      const cityless: Venue[] = []
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        const city = data.city || ''
        
        // Check if city is empty or not a valid Hebrew city name
        const isValidCity = Object.values(CITIES).some(c => c.nameHe === city)
        
        if (!isValidCity) {
          const venue: Venue = {
            id: docSnap.id,
            displayName: data.displayName || data.name || docSnap.id,
            name: data.name || docSnap.id,
            address: data.address || data.location?.address || '',
            city: city,
            latitude: data.latitude || data.location?.latitude || 0,
            longitude: data.longitude || data.location?.longitude || 0,
            linkedZoneId: data.linkedZoneId || '',
            active: data.active || data.isActive || false
          }
          
          // Try to detect city from name or address
          const searchText = venue.displayName + ' ' + venue.address
          const detected = detectCityFromText(searchText)
          if (detected) {
            const detectedCityName = detected.nameHe
            const detectedCityId = detected.id
            ;(venue as any).detectedCity = detectedCityName
            ;(venue as any).detectedCityId = detectedCityId
          }
          
          cityless.push(venue)
        }
      })
      
      setCitylessVenues(cityless)
      
    } catch (error) {
      console.error('Error loading cityless venues:', error)
    }
    
    setLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX VENUE CITY
  // ═══════════════════════════════════════════════════════════════════════════

  const fixVenueCity = async (venueId: string, cityNameHe: string) => {
    try {
      const venueRef = doc(db, 'venues', venueId)
      await updateDoc(venueRef, {
        city: cityNameHe,
        updatedAt: Timestamp.now()
      })
      
      setCitylessVenues(prev => prev.filter(v => v.id !== venueId))
      
    } catch (error) {
      console.error('Error fixing venue city:', error)
      alert('שגיאה בעדכון העיר')
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX ALL DETECTED CITIES
  // ═══════════════════════════════════════════════════════════════════════════

  const fixAllDetectedCities = async () => {
    const toFix = citylessVenues.filter(v => (v as any).detectedCity)
    if (toFix.length === 0) {
      alert('אין מועדונים עם עיר מזוהה לתיקון')
      return
    }
    
    if (!confirm(`לתקן ${toFix.length} מועדונים עם עיר מזוהה אוטומטית?`)) return
    
    setSaving(true)
    let successCount = 0
    
    for (const venue of toFix) {
      try {
        await fixVenueCity(venue.id, (venue as any).detectedCity)
        successCount++
      } catch (error) {
        console.error(`Error fixing ${venue.displayName}:`, error)
      }
    }
    
    setSaving(false)
    alert(`✅ תוקנו ${successCount} מועדונים!`)
    loadCitylessVenues()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYZE CITY
  // ═══════════════════════════════════════════════════════════════════════════

  const analyzeCity = async () => {
    if (!selectedCity) return
    
    setLoading(true)
    setVenues([])
    setZoneStats([])
    
    try {
      // Load all venues from Firestore
      const snapshot = await getDocs(collection(db, 'venues'))
      const allVenues: Venue[] = []
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        allVenues.push({
          id: docSnap.id,
          displayName: data.displayName || data.name || docSnap.id,
          name: data.name || docSnap.id,
          address: data.address || data.location?.address || '',
          city: data.city || '',
          latitude: data.latitude || data.location?.latitude || 0,
          longitude: data.longitude || data.location?.longitude || 0,
          linkedZoneId: data.linkedZoneId || '',
          active: data.active || data.isActive || false
        })
      })
      
      // Get city config and zones
      const cityConfig = CITIES[selectedCity.id]
      if (!cityConfig) {
        alert('עיר לא נמצאה בהגדרות')
        setLoading(false)
        return
      }
      
      const cityZones = cityConfig.zones
        .map(zoneId => ENTERTAINMENT_ZONES[zoneId])
        .filter(z => z && z.isActive)
      
      // Filter venues for this city (by city name or by proximity to city center)
      const cityVenues = allVenues.filter(venue => {
        // Check by city name
        const venueCityLower = (venue.city || '').toLowerCase()
        if (venueCityLower.includes(selectedCity.nameHe.toLowerCase()) ||
            venueCityLower.includes(selectedCity.name.toLowerCase())) {
          return true
        }
        
        // Check by address
        const addressLower = (venue.address || '').toLowerCase()
        if (addressLower.includes(selectedCity.nameHe.toLowerCase()) ||
            addressLower.includes(selectedCity.name.toLowerCase())) {
          return true
        }
        
        // Check by proximity (within 10km of city center)
        if (venue.latitude && venue.longitude) {
          const dist = calculateDistance(
            venue.latitude, venue.longitude,
            cityConfig.center.lat, cityConfig.center.lng
          )
          return dist <= 10000
        }
        
        return false
      })
      
      // Analyze each venue - find suggested zone based on location
      const analyzedVenues = cityVenues.map(venue => {
        let suggestedZoneId: string | null = null
        let suggestedZoneName = ''
        let minDistance = Infinity
        
        if (venue.latitude && venue.longitude) {
          for (const zone of cityZones) {
            const dist = calculateDistance(
              venue.latitude, venue.longitude,
              zone.center.lat, zone.center.lng
            )
            
            // Within zone radius (with some buffer)
            // ✅ v2.8.27: LINKAGE_MULTIPLIER = 2.0 (400m zone = 800m linkage range)
            if (dist <= zone.radius * 2.0 && dist < minDistance) {
              suggestedZoneId = zone.id
              suggestedZoneName = zone.name
              minDistance = dist
            }
          }
        }
        
        // Check if current link matches suggestion
        const needsUpdate = !!(suggestedZoneId && venue.linkedZoneId !== suggestedZoneId)
        
        return {
          ...venue,
          suggestedZoneId,
          suggestedZoneName,
          distance: minDistance === Infinity ? undefined : Math.round(minDistance),
          needsUpdate
        }
      })
      
      // Sort: mismatches first, then unlinked, then linked
      analyzedVenues.sort((a, b) => {
        if (a.needsUpdate && !b.needsUpdate) return -1
        if (!a.needsUpdate && b.needsUpdate) return 1
        if (!a.linkedZoneId && b.linkedZoneId) return -1
        if (a.linkedZoneId && !b.linkedZoneId) return 1
        return a.displayName.localeCompare(b.displayName, 'he')
      })
      
      setVenues(analyzedVenues)
      
      // Calculate zone stats
      const stats: ZoneStats[] = cityZones.map(zone => ({
        id: zone.id,
        name: zone.name,
        icon: zone.icon || '📍',
        cityHe: zone.cityHe || selectedCity.nameHe,
        radius: zone.radius,
        vibe: zone.vibe || '',
        center: zone.center,
        linkedVenues: analyzedVenues.filter(v => v.linkedZoneId === zone.id).length,
        suggestedVenues: analyzedVenues.filter(v => v.suggestedZoneId === zone.id).length
      }))
      
      setZoneStats(stats)
      
    } catch (error) {
      console.error('Error analyzing city:', error)
      alert('שגיאה בניתוח העיר')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE VENUE ZONE LINK
  // ═══════════════════════════════════════════════════════════════════════════

  const updateVenueZone = async (venueId: string, zoneId: string | null) => {
    try {
      const venueRef = doc(db, 'venues', venueId)
      await updateDoc(venueRef, {
        linkedZoneId: zoneId || null,
        updatedAt: Timestamp.now()
      })
      
      // Update local state
      setVenues(prev => prev.map(v => {
        if (v.id === venueId) {
          return {
            ...v,
            linkedZoneId: zoneId || '',
            needsUpdate: v.suggestedZoneId !== zoneId
          }
        }
        return v
      }))
      
      // Update zone stats
      setZoneStats(prev => prev.map(z => ({
        ...z,
        linkedVenues: venues.filter(v => 
          v.id === venueId ? zoneId === z.id : v.linkedZoneId === z.id
        ).length
      })))
      
    } catch (error) {
      console.error('Error updating venue:', error)
      alert('שגיאה בעדכון המועדון')
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LINK ALL SUGGESTED
  // ═══════════════════════════════════════════════════════════════════════════

  const linkAllSuggested = async () => {
    const toUpdate = venues.filter(v => v.needsUpdate && v.suggestedZoneId)
    if (toUpdate.length === 0) {
      alert('אין מועדונים לעדכון')
      return
    }
    
    if (!confirm(`לעדכן ${toUpdate.length} מועדונים לאזורים המומלצים?`)) return
    
    setSaving(true)
    let successCount = 0
    
    for (const venue of toUpdate) {
      try {
        await updateVenueZone(venue.id, venue.suggestedZoneId!)
        successCount++
      } catch (error) {
        console.error(`Error updating ${venue.displayName}:`, error)
      }
    }
    
    setSaving(false)
    alert(`✅ עודכנו ${successCount} מועדונים!`)
    analyzeCity()  // Refresh
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#0a1f18] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0d2920]/95 backdrop-blur-sm border-b border-[#4ade80]/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Zone Mapper
                </h1>
                <p className="text-sm text-white/60">דייק קישור מועדונים לאזורי בילוי</p>
              </div>
            </div>
            
            {mismatchCount > 0 && (
              <button
                onClick={linkAllSuggested}
                disabled={saving}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                קשר הכל ({mismatchCount})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* City Selection */}
        <div className="bg-[#0d2920]/50 border border-[#4ade80]/20 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#4ade80]" />
            בחר עיר לניתוח
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {CITY_OPTIONS.map(city => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  selectedCity?.id === city.id
                    ? 'bg-[#4ade80] text-[#0d2920] border-[#4ade80] font-bold'
                    : 'bg-[#0d2920]/50 border-[#4ade80]/20 hover:border-[#4ade80]/50'
                }`}
              >
                <span>{city.icon}</span>
                <span>{city.nameHe}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={analyzeCity}
            disabled={!selectedCity || loading}
            className="w-full py-3 bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                מנתח...
              </>
            ) : (
              <>
                <Target className="h-5 w-5" />
                נתח מועדונים ואזורי בילוי
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        {venues.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0d2920]/50 border border-[#4ade80]/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{venues.length}</div>
              <div className="text-sm text-white/60">מועדונים בעיר</div>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{linkedCount}</div>
              <div className="text-sm text-green-400/80">מקושרים לאזור</div>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{unlinkedCount}</div>
              <div className="text-sm text-red-400/80">לא מקושרים</div>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{mismatchCount}</div>
              <div className="text-sm text-yellow-400/80">צריכים עדכון</div>
            </div>
          </div>
        )}

        {/* Zone Stats */}
        {zoneStats.length > 0 && (
          <div className="bg-[#0d2920]/50 border border-[#4ade80]/20 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              אזורי בילוי ב{selectedCity?.nameHe} ({zoneStats.length})
            </h2>
            
            <div className="space-y-3">
              {zoneStats.map(zone => {
                const isExpanded = expandedZone === zone.id
                const venuesInZone = venues.filter(v => v.linkedZoneId === zone.id || v.suggestedZoneId === zone.id)
                
                return (
                  <div key={zone.id} className="border border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedZone(isExpanded ? null : zone.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{zone.icon}</span>
                        <div className="text-right">
                          <div className="font-bold">{zone.name}</div>
                          <div className="text-sm text-white/60">{zone.vibe} • {zone.radius}m</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <span className="text-green-400 font-bold">{zone.linkedVenues}</span>
                          <span className="text-white/40 text-sm"> מקושרים</span>
                          {zone.suggestedVenues > zone.linkedVenues && (
                            <span className="text-yellow-400 text-sm mr-2">
                              (+{zone.suggestedVenues - zone.linkedVenues} מומלצים)
                            </span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && venuesInZone.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10 bg-black/20"
                        >
                          <div className="p-4 space-y-2">
                            {venuesInZone.map(venue => (
                              <div 
                                key={venue.id}
                                className={`p-3 rounded-lg flex items-center justify-between ${
                                  venue.linkedZoneId === zone.id 
                                    ? 'bg-green-500/10 border border-green-500/30' 
                                    : 'bg-yellow-500/10 border border-yellow-500/30'
                                }`}
                              >
                                <div>
                                  <div className="font-medium">{venue.displayName}</div>
                                  <div className="text-xs text-white/50">{venue.address}</div>
                                  {venue.distance && (
                                    <div className="text-xs text-white/40">{venue.distance}m מהמרכז</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {venue.linkedZoneId === zone.id ? (
                                    <span className="text-green-400 text-sm flex items-center gap-1">
                                      <Link2 className="h-4 w-4" /> מקושר
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => updateVenueZone(venue.id, zone.id)}
                                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-bold rounded flex items-center gap-1"
                                    >
                                      <Link2 className="h-3 w-3" /> קשר
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Venues List */}
        {venues.length > 0 && (
          <div className="bg-[#0d2920]/50 border border-[#4ade80]/20 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#4ade80]" />
              כל המועדונים ({venues.length})
            </h2>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {venues.map(venue => (
                <div
                  key={venue.id}
                  className={`p-4 rounded-lg border ${
                    venue.needsUpdate
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : venue.linkedZoneId
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{venue.displayName}</span>
                        {venue.active && <span className="text-xs bg-green-500/30 text-green-400 px-2 py-0.5 rounded">פעיל</span>}
                      </div>
                      <div className="text-sm text-white/50">{venue.address}</div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {venue.linkedZoneId ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            מקושר: {ENTERTAINMENT_ZONES[venue.linkedZoneId]?.name || venue.linkedZoneId}
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-1">
                            <Link2Off className="h-3 w-3" />
                            לא מקושר
                          </span>
                        )}
                        
                        {venue.suggestedZoneId && venue.suggestedZoneId !== venue.linkedZoneId && (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            מומלץ: {venue.suggestedZoneName} ({venue.distance}m)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {venue.needsUpdate && venue.suggestedZoneId && (
                        <button
                          onClick={() => updateVenueZone(venue.id, venue.suggestedZoneId!)}
                          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg text-sm"
                        >
                          קשר למומלץ
                        </button>
                      )}
                      <a
                        href={`/admin/super/venue/${venue.id}`}
                        target="_blank"
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="bg-[#0d2920]/30 border border-white/10 rounded-xl p-6">
          <h3 className="font-bold mb-3">📖 איך זה עובד:</h3>
          <div className="space-y-2 text-sm text-white/70">
            <p>1️⃣ בחר עיר - הכלי טוען את כל המועדונים מהמערכת</p>
            <p>2️⃣ <span className="text-green-400">ירוק</span> = מועדון מקושר נכון לאזור בילוי</p>
            <p>3️⃣ <span className="text-yellow-400">צהוב</span> = מועדון צריך עדכון (יש אזור מומלץ לפי מיקום)</p>
            <p>4️⃣ <span className="text-red-400">אדום</span> = מועדון לא מקושר לאף אזור</p>
            <p>5️⃣ לחץ "קשר למומלץ" לעדכון בודד, או "קשר הכל" לעדכון המוני</p>
          </div>
        </div>

        {/* City Fixer Section */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              תיקון מועדונים ללא עיר ({citylessVenues.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadCitylessVenues}
                disabled={loading}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-lg flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                טען מועדונים
              </button>
              {citylessVenues.filter(v => (v as any).detectedCity).length > 0 && (
                <button
                  onClick={fixAllDetectedCities}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg flex items-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  תקן הכל ({citylessVenues.filter(v => (v as any).detectedCity).length})
                </button>
              )}
            </div>
          </div>
          
          {citylessVenues.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {citylessVenues.map(venue => {
                const detected = (venue as any).detectedCity
                
                return (
                  <div
                    key={venue.id}
                    className={`p-3 rounded-lg border ${
                      detected 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{venue.displayName}</div>
                        <div className="text-xs text-white/50">{venue.address}</div>
                        {venue.city && (
                          <div className="text-xs text-red-400">עיר נוכחית: {venue.city}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {detected ? (
                          <>
                            <span className="text-yellow-400 text-sm">זוהה: {detected}</span>
                            <button
                              onClick={() => fixVenueCity(venue.id, detected)}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-black text-sm font-bold rounded"
                            >
                              תקן
                            </button>
                          </>
                        ) : (
                          <span className="text-red-400 text-sm">לא זוהתה עיר</span>
                        )}
                        <a
                          href={`/admin/super/venue/${venue.id}`}
                          target="_blank"
                          className="p-2 hover:bg-white/10 rounded-lg"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {citylessVenues.length === 0 && !loading && (
            <p className="text-center text-white/50 py-4">לחץ "טען מועדונים" לחיפוש מועדונים ללא עיר</p>
          )}
        </div>
      </div>
    </div>
  )
}
