"use client"

/**
 * 🦎🎬 I4IGUANA - HOLLYWOOD DUMMY CONTROL CENTER
 * 
 * Comprehensive control panel for managing dummy users across Israel
 * 
 * Features:
 * - Visual overview of all dummies by city
 * - Photo gallery with edit capabilities
 * - Check-in/out to venues
 * - Bulk actions
 * - Real-time stats
 * - Map visualization
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Users, MapPin, Building2, Plus, Trash2, Edit3, 
  CheckCircle, XCircle, Filter, Search, RefreshCw, Eye, 
  ChevronDown, ChevronRight, Sparkles, Zap, Globe, Heart,
  UserPlus, LogIn, LogOut, Map, Grid, List, Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, 
  query, where, setDoc, Timestamp, writeBatch 
} from "firebase/firestore"

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DummyUser {
  id: string
  oderId?: string
  name: string
  age: number
  gender: 'male' | 'female'
  photos: string[]
  bio: string
  hobbies: string[]
  city?: string
  dummyZone?: string
  checkedInVenue?: string
  checkedInVenueName?: string
  isAvailable: boolean
  isDummy: boolean
  createdAt?: any
}

interface Venue {
  id: string
  name: string
  city: string
  dummyCount?: number
}

interface CityStats {
  name: string
  icon: string
  gradient: string
  totalDummies: number
  checkedIn: number
  zones: string[]
}

// ═══════════════════════════════════════════════════════════════════════════
// CITY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CITIES: Record<string, CityStats> = {
  'ashkelon': {
    name: 'אשקלון',
    icon: '🏖️',
    gradient: 'from-cyan-500 to-blue-600',
    totalDummies: 0,
    checkedIn: 0,
    zones: ['ashkelon-marina', 'nir-home', 'ashkelon-delila', 'ashkelon-barnea', 'ashkelon-city-center', 'ashkelon-hanasi']
  },
  'tel-aviv': {
    name: 'תל אביב',
    icon: '🌆',
    gradient: 'from-pink-500 to-purple-600',
    totalDummies: 0,
    checkedIn: 0,
    zones: ['tlv-florentin', 'tlv-rothschild', 'tlv-port', 'tlv-dizengoff', 'tlv-neve-tzedek', 'tlv-arbaa']
  },
  'rehovot': {
    name: 'רחובות',
    icon: '🍊',
    gradient: 'from-orange-500 to-amber-600',
    totalDummies: 0,
    checkedIn: 0,
    zones: ['rehovot-science', 'rehovot-science-park', 'rehovot-herzl']
  }
}

const VENUES_LIST = [
  { id: 'archie-bar', name: 'ארצ\'י בר', city: 'ashkelon' },
  { id: 'iguana-test-nir', name: 'iguana-test-nir', city: 'ashkelon' },
  { id: 'sheffield', name: 'שפילד', city: 'tel-aviv' },
  { id: 'shpiegel', name: 'שפיגל', city: 'tel-aviv' },
  { id: 'singles-club', name: 'מועדון פנויים פנויות', city: 'tel-aviv' }
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DummyControlCenter() {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(true)
  const [dummies, setDummies] = useState<DummyUser[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [cityStats, setCityStats] = useState<Record<string, CityStats>>(CITIES)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)  // ✅ v2.8.6: Zone filter
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDummies, setSelectedDummies] = useState<Set<string>>(new Set())
  const [editingDummy, setEditingDummy] = useState<DummyUser | null>(null)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    checkedIn: 0,
    available: 0
  })

  // ✅ v2.8.5: Helper functions for city normalization
  const detectCityFromZone = (zone?: string): string => {
    if (!zone) return 'ashkelon'
    const z = zone.toLowerCase()
    if (z.includes('tlv') || z.includes('florentin') || z.includes('rothschild') || z === 'tel aviv' || z === 'tel-aviv') return 'tel-aviv'
    if (z.includes('rehovot')) return 'rehovot'
    return 'ashkelon'
  }
  
  const normalizeCity = (city?: string): string => {
    if (!city) return 'ashkelon'
    const c = city.toLowerCase().trim()
    if (c === 'tel aviv' || c === 'tel-aviv' || c === 'telaviv') return 'tel-aviv'
    if (c === 'rehovot') return 'rehovot'
    if (c === 'ashkelon' || c === 'אשקלון') return 'ashkelon'
    return 'ashkelon'
  }

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load dummies from dummyUsers collection
      const dummySnapshot = await getDocs(collection(db, 'dummyUsers'))
      const dummyList: DummyUser[] = []
      
      dummySnapshot.forEach((doc) => {
        const data = doc.data()
        dummyList.push({
          id: doc.id,
          oderId: data.oderId || doc.id,
          name: data.name || 'Unknown',
          age: data.age || 25,
          gender: data.gender || 'female',
          photos: data.photos || [],
          bio: data.bio || '',
          hobbies: data.hobbies || [],
          city: normalizeCity(data.city) || detectCityFromZone(data.dummyZone),
          dummyZone: data.dummyZone || '',
          checkedInVenue: data.checkedInVenue || null,
          checkedInVenueName: data.checkedInVenueName || null,
          isAvailable: data.isAvailable !== false,
          isDummy: true,
          createdAt: data.createdAt
        })
      })
      
      setDummies(dummyList)
      
      // Calculate stats
      const newStats = {
        total: dummyList.length,
        male: dummyList.filter(d => d.gender === 'male').length,
        female: dummyList.filter(d => d.gender === 'female').length,
        checkedIn: dummyList.filter(d => d.checkedInVenue).length,
        available: dummyList.filter(d => d.isAvailable).length
      }
      setStats(newStats)
      
      // Calculate city stats - DEEP COPY to avoid accumulation bug!
      const newCityStats: Record<string, CityStats> = {}
      Object.entries(CITIES).forEach(([key, city]) => {
        newCityStats[key] = {
          ...city,
          totalDummies: 0,  // Reset counts!
          checkedIn: 0
        }
      })
      
      dummyList.forEach(d => {
        // Determine city from zone or city field
        const zone = d.dummyZone?.toLowerCase() || ''
        let city = d.city || 'ashkelon'
        
        // Override city based on zone
        if (zone.includes('tlv') || zone.includes('florentin') || zone.includes('rothschild')) {
          city = 'tel-aviv'
        } else if (zone.includes('rehovot')) {
          city = 'rehovot'
        } else {
          city = 'ashkelon'
        }
        
        if (newCityStats[city]) {
          newCityStats[city].totalDummies++
          if (d.checkedInVenue) {
            newCityStats[city].checkedIn++
          }
        }
      })
      setCityStats(newCityStats)
      
      // Load venues
      const venueSnapshot = await getDocs(collection(db, 'venues'))
      const venueList: Venue[] = []
      venueSnapshot.forEach((doc) => {
        const data = doc.data()
        venueList.push({
          id: doc.id,
          name: data.name || doc.id,
          city: data.location?.city || 'Unknown',
          dummyCount: 0
        })
      })
      setVenues(venueList)
      
      console.log(`✅ Loaded ${dummyList.length} dummy users, ${venueList.length} venues`)
      
    } catch (error) {
      console.error('❌ Error loading data:', error)
    }
    setLoading(false)
  }

  // Filter dummies
  const filteredDummies = dummies.filter(d => {
    if (selectedCity && d.city !== selectedCity) return false
    if (selectedVenue && d.checkedInVenue !== selectedVenue) return false
    if (selectedZone && d.dummyZone !== selectedZone) return false  // ✅ Zone filter
    if (genderFilter !== 'all' && d.gender !== genderFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return d.name.toLowerCase().includes(q) || d.bio?.toLowerCase().includes(q)
    }
    return true
  })

  // Bulk check-in
  const bulkCheckIn = async (venueId: string, venueName: string) => {
    if (selectedDummies.size === 0) {
      alert('בחר משתמשים קודם!')
      return
    }
    
    setProcessing(true)
    try {
      const batch = writeBatch(db)
      
      selectedDummies.forEach(dummyId => {
        const ref = doc(db, 'dummyUsers', dummyId)
        batch.update(ref, {
          checkedInVenue: venueId,
          checkedInVenueName: venueName,
          checkedInAt: Timestamp.now()
        })
      })
      
      await batch.commit()
      console.log(`✅ Checked in ${selectedDummies.size} dummies to ${venueName}`)
      
      setSelectedDummies(new Set())
      setShowCheckinModal(false)
      await loadData()
      
    } catch (error) {
      console.error('❌ Error checking in:', error)
      alert('שגיאה בביצוע צ\'ק-אין')
    }
    setProcessing(false)
  }

  // Bulk check-out
  const bulkCheckOut = async () => {
    if (selectedDummies.size === 0) {
      alert('בחר משתמשים קודם!')
      return
    }
    
    setProcessing(true)
    try {
      const batch = writeBatch(db)
      
      selectedDummies.forEach(dummyId => {
        const ref = doc(db, 'dummyUsers', dummyId)
        batch.update(ref, {
          checkedInVenue: null,
          checkedInVenueName: null,
          checkedInAt: null
        })
      })
      
      await batch.commit()
      console.log(`✅ Checked out ${selectedDummies.size} dummies`)
      
      setSelectedDummies(new Set())
      await loadData()
      
    } catch (error) {
      console.error('❌ Error checking out:', error)
      alert('שגיאה בביצוע צ\'ק-אאוט')
    }
    setProcessing(false)
  }

  // Single check-in
  const checkInDummy = async (dummyId: string, venueId: string, venueName: string) => {
    try {
      await updateDoc(doc(db, 'dummyUsers', dummyId), {
        checkedInVenue: venueId,
        checkedInVenueName: venueName,
        checkedInAt: Timestamp.now()
      })
      await loadData()
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  // Single check-out
  const checkOutDummy = async (dummyId: string) => {
    try {
      await updateDoc(doc(db, 'dummyUsers', dummyId), {
        checkedInVenue: null,
        checkedInVenueName: null,
        checkedInAt: null
      })
      await loadData()
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  // Delete dummy
  const deleteDummy = async (dummyId: string) => {
    if (!confirm('למחוק את המשתמש הזה?')) return
    
    try {
      await deleteDoc(doc(db, 'dummyUsers', dummyId))
      await loadData()
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  // ✅ v2.8.5: Delete ALL dummies
  const deleteAllDummies = async () => {
    if (!confirm(`למחוק את כל ${dummies.length} משתמשי הדמה? פעולה זו לא ניתנת לביטול!`)) return
    
    setProcessing(true)
    try {
      const batch = writeBatch(db)
      dummies.forEach(d => {
        batch.delete(doc(db, 'dummyUsers', d.id))
      })
      await batch.commit()
      alert(`✅ נמחקו ${dummies.length} משתמשי דמה!`)
      await loadData()
    } catch (error) {
      console.error('❌ Error:', error)
      alert('שגיאה במחיקה')
    } finally {
      setProcessing(false)
    }
  }

  // ✅ v2.8.5: Delete dummies by zone
  const deleteByZone = async (zoneId: string, zoneName: string) => {
    const zoneDummies = dummies.filter(d => d.dummyZone === zoneId)
    
    if (zoneDummies.length === 0) {
      alert(`אין משתמשי דמה באזור ${zoneName}`)
      return
    }
    
    if (!confirm(`למחוק ${zoneDummies.length} משתמשי דמה מאזור ${zoneName}?`)) return
    
    setProcessing(true)
    try {
      const batch = writeBatch(db)
      zoneDummies.forEach(d => {
        batch.delete(doc(db, 'dummyUsers', d.id))
      })
      await batch.commit()
      alert(`✅ נמחקו ${zoneDummies.length} משתמשי דמה מאזור ${zoneName}!`)
      await loadData()
    } catch (error) {
      console.error('❌ Error:', error)
      alert('שגיאה במחיקה')
    } finally {
      setProcessing(false)
    }
  }

  // ✅ v2.8.5: Migrate dummies from one zone to another
  const migrateZone = async (fromZone: string, toZone: string, toZoneName: string) => {
    const zoneDummies = dummies.filter(d => d.dummyZone === fromZone)
    
    if (zoneDummies.length === 0) {
      alert(`אין משתמשי דמה באזור המקור`)
      return
    }
    
    if (!confirm(`להעביר ${zoneDummies.length} משתמשי דמה לאזור ${toZoneName}?`)) return
    
    setProcessing(true)
    try {
      const batch = writeBatch(db)
      zoneDummies.forEach(d => {
        batch.update(doc(db, 'dummyUsers', d.id), {
          dummyZone: toZone
        })
      })
      await batch.commit()
      alert(`✅ הועברו ${zoneDummies.length} משתמשי דמה לאזור ${toZoneName}!`)
      await loadData()
    } catch (error) {
      console.error('❌ Error:', error)
      alert('שגיאה בהעברה')
    } finally {
      setProcessing(false)
    }
  }

  // Get count by zone
  const getZoneCount = (zoneId: string) => {
    return dummies.filter(d => d.dummyZone === zoneId).length
  }

  // Toggle selection
  const toggleSelection = (dummyId: string) => {
    const newSelection = new Set(selectedDummies)
    if (newSelection.has(dummyId)) {
      newSelection.delete(dummyId)
    } else {
      newSelection.add(dummyId)
    }
    setSelectedDummies(newSelection)
  }

  // Select all filtered
  const selectAllFiltered = () => {
    const newSelection = new Set(filteredDummies.map(d => d.id))
    setSelectedDummies(newSelection)
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedDummies(new Set())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f18] via-[#0d2920] to-[#0a1f18]">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4ade80]/20 via-[#22c55e]/10 to-[#4ade80]/20 animate-pulse" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4ade80]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#22c55e]/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <div className="relative px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => router.push('/admin/super')}
              variant="ghost"
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              חזרה
            </Button>
            
            <div className="flex items-center gap-2">
              {/* ✅ v2.8.6: Navigate to Initialize Dummies page */}
              <Button
                onClick={() => router.push('/admin/dummies')}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Initialize Zones
              </Button>
              
              <Button
                onClick={loadData}
                variant="ghost"
                className="text-white/70 hover:text-white"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                רענן
              </Button>
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 mb-4"
            >
              <span className="text-5xl">🎬</span>
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#15803d] bg-clip-text text-transparent">
                DUMMY CONTROL CENTER
              </h1>
              <span className="text-5xl">🦎</span>
            </motion.div>
            <p className="text-white/60">מרכז שליטה למשתמשי דמה | Hollywood Level</p>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'סה"כ', value: stats.total, icon: Users, color: 'text-white' },
              { label: 'גברים', value: stats.male, icon: Users, color: 'text-blue-400' },
              { label: 'נשים', value: stats.female, icon: Users, color: 'text-pink-400' },
              { label: 'מחוברים', value: stats.checkedIn, icon: CheckCircle, color: 'text-green-400' },
              { label: 'זמינים', value: stats.available, icon: Heart, color: 'text-red-400' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CITY CARDS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-[#4ade80]" />
          ערים פעילות
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(cityStats).map(([cityId, city]) => (
            <motion.button
              key={cityId}
              onClick={() => setSelectedCity(selectedCity === cityId ? null : cityId)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all ${
                selectedCity === cityId 
                  ? 'ring-2 ring-[#4ade80] ring-offset-2 ring-offset-[#0d2920]' 
                  : ''
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} opacity-80`} />
              
              {/* Content */}
              <div className="relative">
                <div className="text-4xl mb-2">{city.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{city.name}</div>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {city.totalDummies}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {city.checkedIn}
                  </span>
                </div>
              </div>
              
              {/* Selected indicator */}
              {selectedCity === cityId && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ZONE FILTER - Filter by zone (v2.8.6) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-4 border-y border-[#4ade80]/20 bg-[#0d2920]/30">
        <h3 className="text-lg font-bold text-[#4ade80] mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          סינון לפי אזור בילוי
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {/* All zones button */}
          <Button
            onClick={() => setSelectedZone(null)}
            className={`${
              selectedZone === null 
                ? 'bg-[#4ade80] text-black hover:bg-[#22c55e]' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            🦎 הכל ({dummies.length})
          </Button>
          
          {/* Ashkelon Zones */}
          <Button
            onClick={() => setSelectedZone('ashkelon-marina')}
            className={`${
              selectedZone === 'ashkelon-marina' 
                ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
            }`}
          >
            🏖️ Marina ({getZoneCount('ashkelon-marina')})
          </Button>
          
          <Button
            onClick={() => setSelectedZone('nir-home')}
            className={`${
              selectedZone === 'nir-home' 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            🌴 Barnea North ({getZoneCount('nir-home')})
          </Button>
          
          <Button
            onClick={() => setSelectedZone('ashkelon-delila')}
            className={`${
              selectedZone === 'ashkelon-delila' 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            🌊 Delila ({getZoneCount('ashkelon-delila')})
          </Button>
          
          <Button
            onClick={() => setSelectedZone('ashkelon-barnea')}
            className={`${
              selectedZone === 'ashkelon-barnea' 
                ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
            }`}
          >
            🏘️ Barnea ({getZoneCount('ashkelon-barnea')})
          </Button>
          
          <Button
            onClick={() => setSelectedZone('ashkelon-city-center')}
            className={`${
              selectedZone === 'ashkelon-city-center' 
                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
            }`}
          >
            🏛️ City Center ({getZoneCount('ashkelon-city-center')})
          </Button>
          
          {/* Tel Aviv Zones */}
          <Button
            onClick={() => setSelectedZone('tlv-florentin')}
            className={`${
              selectedZone === 'tlv-florentin' 
                ? 'bg-pink-500 text-white hover:bg-pink-600' 
                : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
            }`}
          >
            🌆 Florentin ({getZoneCount('tlv-florentin')})
          </Button>
          
          <Button
            onClick={() => setSelectedZone('tlv-rothschild')}
            className={`${
              selectedZone === 'tlv-rothschild' 
                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
            }`}
          >
            🎭 Rothschild ({getZoneCount('tlv-rothschild')})
          </Button>
        </div>
        
        {/* Current filter indicator */}
        {selectedZone && (
          <div className="mt-3 flex items-center gap-2 text-white/60 text-sm">
            <Filter className="w-4 h-4" />
            <span>מציג {filteredDummies.length} משתמשים מאזור {selectedZone}</span>
            <Button
              onClick={() => setSelectedZone(null)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white h-6 px-2"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ZONE MANAGEMENT - Delete & Migrate */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-4 bg-red-900/20 border-y border-red-500/30">
        <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          ניהול אזורים - מחיקה והעברה
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {/* Delete All */}
          <Button
            onClick={deleteAllDummies}
            disabled={processing || dummies.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            מחק הכל ({dummies.length})
          </Button>
          
          {/* Delete by Zone - Ashkelon */}
          <Button
            onClick={() => deleteByZone('ashkelon-marina', 'Marina')}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            🗑️ Marina ({getZoneCount('ashkelon-marina')})
          </Button>
          
          <Button
            onClick={() => deleteByZone('nir-home', 'Barnea North')}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            🗑️ Barnea North ({getZoneCount('nir-home')})
          </Button>
          
          <Button
            onClick={() => deleteByZone('ashkelon-delila', 'Delila Beach')}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            🗑️ Delila ({getZoneCount('ashkelon-delila')})
          </Button>
          
          <Button
            onClick={() => deleteByZone('ashkelon-barnea', 'Barnea')}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            🗑️ Barnea ({getZoneCount('ashkelon-barnea')})
          </Button>
          
          <Button
            onClick={() => deleteByZone('ashkelon-city-center', 'City Center')}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            🗑️ City Center ({getZoneCount('ashkelon-city-center')})
          </Button>
          
          {/* Delete old test zone */}
          <Button
            onClick={() => deleteByZone('ashkelon-test-zone', 'Test Zone (Old)')}
            disabled={processing}
            variant="outline"
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
          >
            🗑️ Test Zone OLD ({getZoneCount('ashkelon-test-zone')})
          </Button>
          
          {/* Tel Aviv zones */}
          <Button
            onClick={() => deleteByZone('tlv-florentin', 'Florentin')}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            🗑️ Florentin ({getZoneCount('tlv-florentin')})
          </Button>
          
          <Button
            onClick={() => deleteByZone('tlv-rothschild', 'Rothschild')}
            disabled={processing}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            🗑️ Rothschild ({getZoneCount('tlv-rothschild')})
          </Button>
        </div>
        
        {/* Migration option */}
        {getZoneCount('ashkelon-test-zone') > 0 && (
          <div className="mt-4 p-3 bg-green-900/30 rounded-xl border border-green-500/30">
            <p className="text-green-400 text-sm mb-2">
              💡 נמצאו {getZoneCount('ashkelon-test-zone')} דמה באזור Test Zone הישן - אפשר להעביר ל-Barnea North:
            </p>
            <Button
              onClick={() => migrateZone('ashkelon-test-zone', 'nir-home', 'Barnea North')}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              ✨ העבר ל-Barnea North
            </Button>
          </div>
        )}
        
        {/* Migration for rehovot-science to rehovot-science-park */}
        {getZoneCount('rehovot-science') > 0 && (
          <div className="mt-4 p-3 bg-orange-900/30 rounded-xl border border-orange-500/30">
            <p className="text-orange-400 text-sm mb-2">
              🔬 נמצאו {getZoneCount('rehovot-science')} דמה באזור rehovot-science (ID ישן) - אפשר להעביר ל-Science Park:
            </p>
            <Button
              onClick={() => migrateZone('rehovot-science', 'rehovot-science-park', 'Science Park')}
              disabled={processing}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              ✨ העבר ל-Science Park
            </Button>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* FILTERS & ACTIONS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-4 border-y border-white/10 bg-black/20">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="חיפוש לפי שם..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white"
            />
          </div>
          
          {/* Gender Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'הכל' },
              { value: 'male', label: '👨 גברים' },
              { value: 'female', label: '👩 נשים' }
            ].map(({ value, label }) => (
              <Button
                key={value}
                onClick={() => setGenderFilter(value as any)}
                variant={genderFilter === value ? 'default' : 'outline'}
                size="sm"
                className={genderFilter === value 
                  ? 'bg-[#4ade80] text-black hover:bg-[#22c55e]' 
                  : 'border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/20'
                }
              >
                {label}
              </Button>
            ))}
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <Button
              onClick={() => setViewMode('grid')}
              variant="ghost"
              size="sm"
              className={viewMode === 'grid' ? 'bg-[#4ade80]/30 text-[#4ade80]' : 'text-white/70 hover:text-white'}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant="ghost"
              size="sm"
              className={viewMode === 'list' ? 'bg-[#4ade80]/30 text-[#4ade80]' : 'text-white/70 hover:text-white'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Bulk Actions */}
          {selectedDummies.size > 0 && (
            <div className="flex items-center gap-2 bg-[#4ade80]/20 px-4 py-2 rounded-xl">
              <span className="text-[#4ade80] font-bold">{selectedDummies.size} נבחרו</span>
              <Button
                onClick={() => setShowCheckinModal(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Check-In
              </Button>
              <Button
                onClick={bulkCheckOut}
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Check-Out
              </Button>
              <Button
                onClick={clearSelection}
                size="sm"
                variant="ghost"
                className="text-white/50 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Select All */}
          <Button
            onClick={selectAllFiltered}
            variant="outline"
            size="sm"
            className="border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/20"
          >
            בחר הכל ({filteredDummies.length})
          </Button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* USERS GRID */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            משתמשי דמה ({filteredDummies.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4ade80] border-t-transparent" />
          </div>
        ) : filteredDummies.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">אין משתמשי דמה</p>
            <p className="text-sm mt-2">לך ל-/admin/dummies ליצירת משתמשים</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3' 
            : 'space-y-2'
          }>
            {filteredDummies.map((dummy, index) => (
              <motion.div
                key={dummy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`relative group ${
                  viewMode === 'grid'
                    ? 'bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#4ade80]/50 transition-all'
                    : 'bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/10'
                }`}
              >
                {/* Selection checkbox */}
                <button
                  onClick={() => toggleSelection(dummy.id)}
                  className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedDummies.has(dummy.id)
                      ? 'bg-[#4ade80] border-[#4ade80]'
                      : 'bg-black/50 border-white/30 group-hover:border-white/60'
                  }`}
                >
                  {selectedDummies.has(dummy.id) && (
                    <CheckCircle className="w-4 h-4 text-black" />
                  )}
                </button>
                
                {viewMode === 'grid' ? (
                  <>
                    {/* Photo - Compact square */}
                    <div className="aspect-square relative">
                      {dummy.photos && dummy.photos[0] ? (
                        <img
                          src={dummy.photos[0]}
                          alt={dummy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Dummy badge */}
                      <div className="absolute top-1 right-1 bg-yellow-500/90 text-black px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                        🤖
                      </div>
                      
                      {/* Check-in status */}
                      {dummy.checkedInVenue && (
                        <div className="absolute top-1 left-1 bg-green-500/90 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />
                          IN
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-white font-bold text-sm">{dummy.name}, {dummy.age}</div>
                        <div className="text-white/60 text-[10px] flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {dummy.city || 'Unknown'}
                        </div>
                        {dummy.checkedInVenueName && (
                          <div className="text-green-400 text-[10px] flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5" />
                            {dummy.checkedInVenueName}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions - More compact */}
                    <div className="p-1.5 flex gap-1">
                      {dummy.checkedInVenue ? (
                        <Button
                          onClick={() => checkOutDummy(dummy.id)}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-[10px] h-7 border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <LogOut className="w-3 h-3 mr-0.5" />
                          Out
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedDummies(new Set([dummy.id]))
                            setShowCheckinModal(true)
                          }}
                          size="sm"
                          className="flex-1 text-[10px] h-7 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <LogIn className="w-3 h-3 mr-0.5" />
                          In
                        </Button>
                      )}
                      <Button
                        onClick={() => setEditingDummy(dummy)}
                        size="sm"
                        variant="ghost"
                        className="text-white/50 hover:text-white h-7 w-7 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => deleteDummy(dummy.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400/50 hover:text-red-400 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                ) : (
                  /* List view */
                  <>
                    <img
                      src={dummy.photos?.[0] || '/placeholder.jpg'}
                      alt={dummy.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{dummy.name}, {dummy.age}</span>
                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">🤖 DUMMY</span>
                        {dummy.checkedInVenue && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">✓ Checked In</span>
                        )}
                      </div>
                      <div className="text-white/50 text-sm">{dummy.city} • {dummy.gender === 'male' ? '👨' : '👩'}</div>
                      {dummy.checkedInVenueName && (
                        <div className="text-green-400 text-xs">{dummy.checkedInVenueName}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {dummy.checkedInVenue ? (
                        <Button onClick={() => checkOutDummy(dummy.id)} size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                          Check-Out
                        </Button>
                      ) : (
                        <Button onClick={() => { setSelectedDummies(new Set([dummy.id])); setShowCheckinModal(true) }} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          Check-In
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CHECK-IN MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCheckinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCheckinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d2920] rounded-2xl p-6 max-w-md w-full border border-[#4ade80]/30"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-[#4ade80]" />
                Check-In ל-{selectedDummies.size} משתמשים
              </h3>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {venues.map(venue => (
                  <button
                    key={venue.id}
                    onClick={() => bulkCheckIn(venue.id, venue.name)}
                    disabled={processing}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-all border border-white/10 hover:border-[#4ade80]/50"
                  >
                    <div className="font-bold text-white">{venue.name}</div>
                    <div className="text-white/50 text-sm">{venue.city}</div>
                  </button>
                ))}
                
                {/* Quick venue options */}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <p className="text-white/40 text-xs mb-2">מועדונים מומלצים:</p>
                  {VENUES_LIST.map(venue => (
                    <button
                      key={venue.id}
                      onClick={() => bulkCheckIn(venue.id, venue.name)}
                      disabled={processing}
                      className="w-full p-3 bg-[#4ade80]/10 hover:bg-[#4ade80]/20 rounded-xl text-left transition-all mb-2"
                    >
                      <div className="font-bold text-[#4ade80]">{venue.name}</div>
                      <div className="text-white/50 text-xs">{CITIES[venue.city]?.name || venue.city}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={() => setShowCheckinModal(false)}
                variant="ghost"
                className="w-full mt-4 text-white/50"
              >
                ביטול
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EDIT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingDummy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingDummy(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d2920] rounded-2xl p-6 max-w-lg w-full border border-[#4ade80]/30 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#4ade80]" />
                עריכת משתמש
              </h3>
              
              {/* Photo */}
              <div className="flex justify-center mb-4">
                <img
                  src={editingDummy.photos?.[0] || '/placeholder.jpg'}
                  alt={editingDummy.name}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              </div>
              
              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm">שם</label>
                  <Input
                    value={editingDummy.name}
                    onChange={(e) => setEditingDummy({...editingDummy, name: e.target.value})}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm">גיל</label>
                    <Input
                      type="number"
                      value={editingDummy.age}
                      onChange={(e) => setEditingDummy({...editingDummy, age: parseInt(e.target.value)})}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">עיר</label>
                    <select
                      value={editingDummy.city || 'ashkelon'}
                      onChange={(e) => setEditingDummy({...editingDummy, city: e.target.value})}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    >
                      <option value="ashkelon">אשקלון</option>
                      <option value="tel-aviv">תל אביב</option>
                      <option value="rehovot">רחובות</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-white/60 text-sm">ביו</label>
                  <textarea
                    value={editingDummy.bio}
                    onChange={(e) => setEditingDummy({...editingDummy, bio: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white min-h-[100px]"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'dummyUsers', editingDummy.id), {
                        name: editingDummy.name,
                        age: editingDummy.age,
                        city: editingDummy.city,
                        bio: editingDummy.bio
                      })
                      setEditingDummy(null)
                      await loadData()
                    } catch (error) {
                      console.error('Error updating:', error)
                    }
                  }}
                  className="flex-1 bg-[#4ade80] text-black hover:bg-[#22c55e]"
                >
                  שמור שינויים
                </Button>
                <Button
                  onClick={() => setEditingDummy(null)}
                  variant="outline"
                  className="border-white/20 text-white/70"
                >
                  ביטול
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
