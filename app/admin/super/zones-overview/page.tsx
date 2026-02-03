"use client"

/**
 * 🗺️ I4IGUANA - Zones Overview
 * 
 * BIRD'S EYE VIEW - See Everything! 🦅
 * 
 * Shows:
 * - All cities with their entertainment zones
 * - Venues linked to each zone
 * - Unlinked venues (orphans)
 * 
 * v1.0.0
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Link2,
  Unlink,
  Building2,
  Map,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { CITIES, ENTERTAINMENT_ZONES, calculateDistance } from '@/lib/entertainment-zones'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CITIES
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
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Venue {
  id: string
  displayName: string
  city: string
  address?: string
  latitude?: number
  longitude?: number
  linkedZoneId?: string
  isActive: boolean
}

interface ZoneData {
  id: string
  name: string
  icon: string
  vibe: string
  radius: number
  venues: Venue[]
  dummyCount: number  // ✅ NEW: Track dummies per zone
}

interface CityData {
  id: string
  nameHe: string
  icon: string
  zones: ZoneData[]
  unlinkedVenues: Venue[]
  totalVenues: number
  linkedVenues: number
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ZonesOverviewPage() {
  const router = useRouter()
  
  const [citiesData, setCitiesData] = useState<CityData[]>([])
  const [orphanVenues, setOrphanVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set())
  
  // Stats
  const [totalVenues, setTotalVenues] = useState(0)
  const [totalLinked, setTotalLinked] = useState(0)
  const [totalZones, setTotalZones] = useState(0)
  const [totalDummies, setTotalDummies] = useState(0)

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load all venues
      const venuesSnapshot = await getDocs(collection(db, 'venues'))
      const allVenues: Venue[] = []
      
      venuesSnapshot.forEach(doc => {
        const data = doc.data()
        allVenues.push({
          id: doc.id,
          displayName: data.displayName || data.name || doc.id,
          city: data.city || '',
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          linkedZoneId: data.linkedZoneId,
          isActive: data.active === true || data.isActive === true  // ✅ FIX: Check both fields
        })
      })
      
      // ✅ Load dummy users and count by zone
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const dummyCountByZone: Record<string, number> = {}
      let totalDummies = 0
      
      usersSnapshot.forEach(doc => {
        const data = doc.data()
        if (data.isDummy) {
          totalDummies++
          const zone = data.dummyZone || 'unknown'
          dummyCountByZone[zone] = (dummyCountByZone[zone] || 0) + 1
        }
      })
      
      setTotalVenues(allVenues.length)
      setTotalLinked(allVenues.filter(v => v.linkedZoneId).length)
      
      // Build cities data
      const cities: CityData[] = []
      const processedVenueIds = new Set<string>()
      let zonesCount = 0
      
      for (const mainCity of MAIN_CITIES) {
        const cityConfig = CITIES[mainCity.id]
        if (!cityConfig) continue
        
        const cityVenues = allVenues.filter(v => v.city === mainCity.nameHe)
        const zones: ZoneData[] = []
        const linkedInCity = new Set<string>()
        
        // Process zones
        for (const zoneId of cityConfig.zones) {
          const zone = ENTERTAINMENT_ZONES[zoneId]
          if (!zone || !zone.isActive) continue
          
          zonesCount++
          
          // Find venues linked to this zone
          const zoneVenues = cityVenues.filter(v => v.linkedZoneId === zone.id)
          zoneVenues.forEach(v => {
            linkedInCity.add(v.id)
            processedVenueIds.add(v.id)
          })
          
          zones.push({
            id: zone.id,
            name: zone.name,
            icon: zone.icon || '📍',
            vibe: zone.vibe || '',
            radius: zone.radius,
            venues: zoneVenues,
            dummyCount: dummyCountByZone[zone.id] || 0  // ✅ Add dummy count
          })
        }
        
        // Find unlinked venues in this city
        const unlinked = cityVenues.filter(v => !linkedInCity.has(v.id))
        unlinked.forEach(v => processedVenueIds.add(v.id))
        
        cities.push({
          id: mainCity.id,
          nameHe: mainCity.nameHe,
          icon: mainCity.icon,
          zones,
          unlinkedVenues: unlinked,
          totalVenues: cityVenues.length,
          linkedVenues: linkedInCity.size
        })
      }
      
      // Find orphan venues (not in any main city)
      const orphans = allVenues.filter(v => !processedVenueIds.has(v.id))
      
      setTotalZones(zonesCount)
      setTotalDummies(totalDummies)
      setCitiesData(cities)
      setOrphanVenues(orphans)
      
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleCity = (cityId: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev)
      if (next.has(cityId)) {
        next.delete(cityId)
      } else {
        next.add(cityId)
      }
      return next
    })
  }

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev)
      if (next.has(zoneId)) {
        next.delete(zoneId)
      } else {
        next.add(zoneId)
      }
      return next
    })
  }

  const expandAll = () => {
    const allCities = new Set(citiesData.map(c => c.id))
    const allZones = new Set(citiesData.flatMap(c => c.zones.map(z => z.id)))
    setExpandedCities(allCities)
    setExpandedZones(allZones)
  }

  const collapseAll = () => {
    setExpandedCities(new Set())
    setExpandedZones(new Set())
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-blue-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                🗺️
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-400">Zones Overview</h1>
                <p className="text-xs text-gray-400">מפת על - אזורי בילוי ומועדונים</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm">
                <div className="text-center px-3 py-1 bg-blue-500/10 rounded-lg">
                  <div className="font-bold text-blue-400">{totalZones}</div>
                  <div className="text-xs text-gray-500">אזורים</div>
                </div>
                <div className="text-center px-3 py-1 bg-green-500/10 rounded-lg">
                  <div className="font-bold text-green-400">{totalVenues}</div>
                  <div className="text-xs text-gray-500">מקומות</div>
                </div>
                <div className="text-center px-3 py-1 bg-cyan-500/10 rounded-lg">
                  <div className="font-bold text-cyan-400">{totalLinked}</div>
                  <div className="text-xs text-gray-500">מקושרים</div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/super/venues')}
                className="border-orange-500/30 text-orange-400"
              >
                <Building2 className="w-4 h-4 mr-1" />
                Venues
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/super/places-import')}
                className="border-green-500/30 text-green-400"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Import
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/super')}
                className="border-gray-500/30 text-gray-400"
              >
                Panel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-400" />
            ערים ואזורי בילוי
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/admin/super/zone-mapper')} 
              className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Zone Mapper
            </Button>
            <Button variant="ghost" size="sm" onClick={expandAll} className="text-gray-400">
              פתח הכל
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll} className="text-gray-400">
              סגור הכל
            </Button>
            <Button variant="ghost" size="sm" onClick={loadData} className="text-gray-400">
              <RefreshCw className="w-4 h-4 mr-1" />
              רענן
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cities */}
            {citiesData.map(city => (
              <div key={city.id} className="rounded-xl border border-white/10 overflow-hidden">
                {/* City Header */}
                <button
                  onClick={() => toggleCity(city.id)}
                  className="w-full p-4 bg-[#111] hover:bg-[#161616] transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{city.icon}</span>
                    <div className="text-right">
                      <h3 className="font-bold text-white">{city.nameHe}</h3>
                      <div className="text-xs text-gray-400">
                        {city.zones.length} אזורים • {city.totalVenues} מקומות
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* City Stats */}
                    <div className="flex items-center gap-2 text-sm">
                      {city.linkedVenues === city.totalVenues && city.totalVenues > 0 ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          100% מקושר
                        </span>
                      ) : city.totalVenues > 0 ? (
                        <span className="text-yellow-400">
                          {city.linkedVenues}/{city.totalVenues} מקושרים
                        </span>
                      ) : (
                        <span className="text-gray-500">אין מקומות</span>
                      )}
                    </div>
                    
                    {expandedCities.has(city.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {/* City Content */}
                {expandedCities.has(city.id) && (
                  <div className="p-4 bg-[#0d0d0d] space-y-3">
                    {/* Zones */}
                    {city.zones.map(zone => (
                      <div key={zone.id} className="rounded-lg border border-white/5 overflow-hidden">
                        {/* Zone Header */}
                        <button
                          onClick={() => toggleZone(zone.id)}
                          className="w-full p-3 bg-[#151515] hover:bg-[#1a1a1a] transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{zone.icon}</span>
                            <div className="text-right">
                              <h4 className="font-medium text-white text-sm">{zone.name}</h4>
                              <div className="text-xs text-gray-500">{zone.vibe} • {zone.radius}m</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${zone.venues.length > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                              <Link2 className="w-3 h-3 inline mr-1" />
                              {zone.venues.length} מקומות
                            </span>
                            
                            {/* ✅ Dummy count indicator */}
                            <span className={`text-sm ${zone.dummyCount > 0 ? 'text-pink-400' : 'text-gray-600'}`}>
                              👥 {zone.dummyCount}
                            </span>
                            
                            {expandedZones.has(zone.id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {/* Zone Venues */}
                        {expandedZones.has(zone.id) && zone.venues.length > 0 && (
                          <div className="p-3 bg-[#0f0f0f] space-y-1">
                            {zone.venues.map(venue => (
                              <div key={venue.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-green-500/5">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                <span className="text-gray-300">{venue.displayName}</span>
                                {venue.isActive && (
                                  <span className="text-xs text-green-500 bg-green-500/10 px-1 rounded">פעיל</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {expandedZones.has(zone.id) && zone.venues.length === 0 && (
                          <div className="p-3 bg-[#0f0f0f] text-center text-sm text-gray-500">
                            אין מקומות מקושרים לאזור זה
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Unlinked Venues in City */}
                    {city.unlinkedVenues.length > 0 && (
                      <div className="rounded-lg border border-yellow-500/20 overflow-hidden">
                        <div className="p-3 bg-yellow-500/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Unlink className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium text-yellow-400 text-sm">
                              מקומות לא מקושרים ({city.unlinkedVenues.length})
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-[#0f0f0f] space-y-1 max-h-[200px] overflow-y-auto">
                          {city.unlinkedVenues.map(venue => (
                            <div key={venue.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-yellow-500/5">
                              <AlertCircle className="w-3 h-3 text-yellow-400" />
                              <span className="text-gray-300">{venue.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {city.zones.length === 0 && city.unlinkedVenues.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        אין אזורי בילוי או מקומות בעיר זו
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Orphan Venues (not in any main city) */}
            {orphanVenues.length > 0 && (
              <div className="rounded-xl border border-red-500/20 overflow-hidden">
                <div className="p-4 bg-red-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏚️</span>
                    <div>
                      <h3 className="font-bold text-red-400">מקומות ללא עיר</h3>
                      <div className="text-xs text-gray-400">
                        מקומות שלא משויכים לאף עיר מרכזית
                      </div>
                    </div>
                  </div>
                  <span className="text-red-400 font-bold">{orphanVenues.length}</span>
                </div>
                <div className="p-4 bg-[#0d0d0d] space-y-1 max-h-[300px] overflow-y-auto">
                  {orphanVenues.map(venue => (
                    <div key={venue.id} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-red-500/5">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span className="text-gray-300">{venue.displayName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{venue.city || 'ללא עיר'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 p-4 bg-[#111] rounded-xl border border-white/10">
          <h3 className="font-bold mb-3">📊 סיכום:</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{totalZones}</div>
              <div className="text-gray-400">אזורי בילוי</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{totalVenues}</div>
              <div className="text-gray-400">סה"כ מקומות</div>
            </div>
            <div className="text-center p-3 bg-cyan-500/10 rounded-lg">
              <div className="text-2xl font-bold text-cyan-400">{totalLinked}</div>
              <div className="text-gray-400">מקושרים</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{totalVenues - totalLinked}</div>
              <div className="text-gray-400">לא מקושרים</div>
            </div>
            <div className="text-center p-3 bg-pink-500/10 rounded-lg">
              <div className="text-2xl font-bold text-pink-400">{totalDummies}</div>
              <div className="text-gray-400">👥 דמות</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-[#111] rounded-xl border border-white/10">
          <h3 className="font-bold mb-3">🔍 מקרא:</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">מקום מקושר לאזור</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400">מקום בעיר, לא מקושר</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-400">מקום ללא עיר</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-pink-400">👥</span>
              <span className="text-gray-400">מספר דמות באזור</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
