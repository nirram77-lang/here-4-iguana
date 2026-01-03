"use client"

/**
 * 🦎 I4IGUANA - Live Activity Dashboard
 * 
 * HOLLYWOOD LEVEL! 🎬
 * 
 * Real-time monitoring of all app activity:
 * - Users online in zones and venues
 * - Active matches
 * - Meetings in progress
 * - Heat map by zone
 * - Live feed of events
 * - 🆕 Click on zone/venue → Side panel with all users
 * - 🆕 Full user profiles with photos, bio, hobbies
 * - 🆕 Edit capabilities for all fields
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Users,
  Heart,
  MapPin,
  Flame,
  Activity,
  RefreshCw,
  Zap,
  MessageCircle,
  Clock,
  TrendingUp,
  Building2,
  X,
  Edit3,
  Save,
  Camera,
  ChevronRight,
  UserPlus,
  LogIn,
  LogOut,
  Trash2,
  Eye
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'
import { ENTERTAINMENT_ZONES, CITIES } from '@/lib/entertainment-zones'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface LiveStats {
  onlineUsers: number
  activeMatches: number
  meetingsToday: number
  activeZones: number
  activeVenues: number
  totalDummies: number
}

interface ZoneActivity {
  id: string
  name: string
  city: string
  icon: string
  userCount: number
  dummyCount: number
  matchCount: number
  heatLevel: 'hot' | 'warm' | 'cool' | 'cold'
}

interface VenueActivity {
  id: string
  name: string
  city: string
  userCount: number
  dummyCount: number
  checkInTime: Date | null
}

interface LiveEvent {
  id: string
  type: 'checkin' | 'match' | 'meeting' | 'chat' | 'zone_enter'
  message: string
  timestamp: Date
  zone?: string
  venue?: string
}

interface DummyUser {
  id: string
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
  height?: number
  occupation?: string
  education?: string
  drinking?: string
  smoking?: string
  lookingFor?: string
  createdAt?: any
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LiveDashboardPage() {
  const router = useRouter()
  
  // State
  const [stats, setStats] = useState<LiveStats>({
    onlineUsers: 0,
    activeMatches: 0,
    meetingsToday: 0,
    activeZones: 0,
    activeVenues: 0,
    totalDummies: 0
  })
  const [zoneActivities, setZoneActivities] = useState<ZoneActivity[]>([])
  const [venueActivities, setVenueActivities] = useState<VenueActivity[]>([])
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // 🆕 Dummy users state
  const [allDummies, setAllDummies] = useState<DummyUser[]>([])
  const [dummyUsersByVenue, setDummyUsersByVenue] = useState<Record<string, DummyUser[]>>({})
  const [dummyUsersByZone, setDummyUsersByZone] = useState<Record<string, DummyUser[]>>({})
  
  // ✅ v2.8.18: Real users checked into venues
  const [realUsersByVenue, setRealUsersByVenue] = useState<Record<string, any[]>>({})
  // ✅ v2.8.5 FIX: Use ref to track dummy counts for real-time updates
  const dummyCountsByZoneRef = useRef<Record<string, number>>({})
  const dummyCountsByVenueRef = useRef<Record<string, number>>({})
  // ✅ v2.8.20 FIX: Use ref to track real user counts (avoid double counting!)
  const realUserCountsByVenueRef = useRef<Record<string, number>>({})
  
  // 🆕 Side panel state
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<DummyUser | null>(null)
  const [editingUser, setEditingUser] = useState<DummyUser | null>(null)
  const [saving, setSaving] = useState(false)
  
  // ✅ v2.8.18: Stats detail modals
  const [activeModal, setActiveModal] = useState<'online' | 'matches' | 'meetings' | 'zones' | 'venues' | 'dummies' | null>(null)
  
  // ✅ v2.8.29: Filter and grouping state for Hollywood-level control center
  const [zoneFilter, setZoneFilter] = useState<string>('')
  const [venueFilter, setVenueFilter] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'south' | 'center' | 'jerusalem' | 'north'>('all')
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  
  // ✅ v2.8.19: Hot Zones Control for website banner (3 zones!)
  const [hotZonesSettings, setHotZonesSettings] = useState({
    zones: [
      {
        zoneName: 'Florentin',
        zoneNameHe: 'פלורנטין',
        city: 'Tel Aviv',
        cityHe: 'תל אביב',
        icon: '🔥',
        usersOnline: 19,
        schedule: 'חמישי-שבת 21:00-01:00'
      },
      {
        zoneName: 'Science Park',
        zoneNameHe: 'פארק המדע',
        city: 'Rehovot',
        cityHe: 'רחובות',
        icon: '🔬',
        usersOnline: 14,
        schedule: 'חמישי-שישי 18:30-23:00'
      },
      {
        zoneName: 'Delila Beach',
        zoneNameHe: 'חוף דלילה',
        city: 'Ashkelon',
        cityHe: 'אשקלון',
        icon: '🏖️',
        usersOnline: 17,
        schedule: 'חמישי-שבת 20:00-00:00'
      }
    ],
    rotationSeconds: 5
  })
  
  // Refs for cleanup
  const unsubscribersRef = useRef<(() => void)[]>([])

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DUMMY USERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const loadDummyUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'dummyUsers'))
      const dummies: DummyUser[] = []
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        dummies.push({
          id: docSnap.id,
          name: data.name || 'Unknown',
          age: data.age || 25,
          gender: data.gender || 'female',
          photos: data.photos || [],
          bio: data.bio || '',
          hobbies: data.hobbies || [],
          city: data.city || detectCityFromZone(data.dummyZone),
          dummyZone: data.dummyZone || '',
          checkedInVenue: data.checkedInVenue || null,
          checkedInVenueName: data.checkedInVenueName || null,
          isAvailable: data.isAvailable !== false,
          isDummy: true,
          height: data.height,
          occupation: data.occupation,
          education: data.education,
          drinking: data.drinking,
          smoking: data.smoking,
          lookingFor: data.lookingFor,
          createdAt: data.createdAt
        })
      })
      
      setAllDummies(dummies)
      
      // Group by venue
      const byVenue: Record<string, DummyUser[]> = {}
      const byZone: Record<string, DummyUser[]> = {}
      
      dummies.forEach(d => {
        if (d.checkedInVenue) {
          if (!byVenue[d.checkedInVenue]) byVenue[d.checkedInVenue] = []
          byVenue[d.checkedInVenue].push(d)
        }
        if (d.dummyZone) {
          if (!byZone[d.dummyZone]) byZone[d.dummyZone] = []
          byZone[d.dummyZone].push(d)
        }
      })
      
      setDummyUsersByVenue(byVenue)
      setDummyUsersByZone(byZone)
      
      // ✅ v2.8.5 FIX: Update refs for real-time access in listeners
      const zoneCountsRef: Record<string, number> = {}
      const venueCountsRef: Record<string, number> = {}
      
      Object.entries(byZone).forEach(([zone, users]) => {
        zoneCountsRef[zone] = users.length
      })
      Object.entries(byVenue).forEach(([venue, users]) => {
        venueCountsRef[venue] = users.length
      })
      
      dummyCountsByZoneRef.current = zoneCountsRef
      dummyCountsByVenueRef.current = venueCountsRef
      
      console.log('🤖 Dummy counts by zone:', zoneCountsRef)
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalDummies: dummies.length
      }))
      
      console.log(`🤖 Loaded ${dummies.length} dummy users`)
      
    } catch (error) {
      console.error('❌ Error loading dummy users:', error)
    }
  }

  const detectCityFromZone = (zone?: string): string => {
    if (!zone) return 'ashkelon'
    if (zone.includes('tlv') || zone.includes('florentin') || zone.includes('rothschild')) return 'tel-aviv'
    if (zone.includes('rehovot')) return 'rehovot'
    return 'ashkelon'
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ v2.8.18: LOAD REAL USERS CHECKED INTO VENUES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const loadRealUsersInVenues = async () => {
    try {
      console.log('👥 Loading real users in venues...')
      
      // Query users with checkedInVenue
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('checkedInVenue', '!=', null))
      const snapshot = await getDocs(q)
      
      const byVenue: Record<string, any[]> = {}
      const countsByVenue: Record<string, number> = {}  // ✅ v2.8.20: Track counts
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const venueId = data.checkedInVenue
        
        if (venueId) {
          if (!byVenue[venueId]) byVenue[venueId] = []
          byVenue[venueId].push({
            id: docSnap.id,
            uid: docSnap.id,
            name: data.name || data.displayName || 'Anonymous',
            age: data.age || 0,
            gender: data.gender || 'unknown',
            photos: data.photos || [data.photoURL] || [],
            bio: data.bio || '',
            city: data.city || '',
            checkedInVenue: venueId,
            checkedInVenueName: data.checkedInVenueName || data.checkInData?.venueName || venueId,
            checkedInAt: data.checkInData?.checkedInAt || data.checkedInAt,
            email: data.email,
            phone: data.phoneNumber,
            isReal: true
          })
        }
      })
      
      // ✅ v2.8.20 FIX: Update counts ref for venue listener
      Object.entries(byVenue).forEach(([venueId, users]) => {
        countsByVenue[venueId] = users.length
      })
      realUserCountsByVenueRef.current = countsByVenue
      
      setRealUsersByVenue(byVenue)
      
      const totalReal = Object.values(byVenue).reduce((sum, users) => sum + users.length, 0)
      console.log(`👥 Loaded ${totalReal} real users in ${Object.keys(byVenue).length} venues`)
      console.log('👥 Real user counts by venue:', countsByVenue)
      
    } catch (error) {
      console.error('❌ Error loading real users:', error)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIMULATED LIVE ACTIVITY (v2.8.6)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const generateSimulatedActivity = () => {
    const dummies = allDummies
    if (dummies.length === 0) return
    
    // Pick a random zone with dummies
    const zonesWithDummies = Object.entries(dummyUsersByZone).filter(([_, users]) => users.length > 0)
    if (zonesWithDummies.length === 0) return
    
    const [zoneId, zoneDummies] = zonesWithDummies[Math.floor(Math.random() * zonesWithDummies.length)]
    const zoneName = ENTERTAINMENT_ZONES[zoneId]?.name || zoneId
    
    // Pick a random dummy from this zone
    const dummy = zoneDummies[Math.floor(Math.random() * zoneDummies.length)]
    
    // Generate a random activity type
    const activityTypes: LiveEvent['type'][] = ['checkin', 'zone_enter', 'chat']
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)]
    
    // Create the event message
    let message = ''
    switch (activityType) {
      case 'checkin':
        message = `${dummy.name} (${dummy.age}) צ'ק-אין לאזור`
        break
      case 'zone_enter':
        message = `${dummy.name} (${dummy.age}) נכנס/ה לאזור`
        break
      case 'chat':
        // Pick another random dummy for chat
        if (zoneDummies.length > 1) {
          const otherDummy = zoneDummies.filter(d => d.id !== dummy.id)[Math.floor(Math.random() * (zoneDummies.length - 1))]
          if (otherDummy) {
            message = `${dummy.name} ↔ ${otherDummy.name} מתחילים צ'אט`
          } else {
            message = `${dummy.name} (${dummy.age}) מחפש/ת התאמה`
          }
        } else {
          message = `${dummy.name} (${dummy.age}) מחפש/ת התאמה`
        }
        break
      default:
        message = `${dummy.name} פעיל/ה באזור`
    }
    
    const event: LiveEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: activityType,
      message,
      zone: zoneName,
      timestamp: new Date()
    }
    
    setLiveEvents(prev => [event, ...prev].slice(0, 50))
    console.log(`📢 Live event: ${message} @ ${zoneName}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    console.log('🔴 Starting Live Dashboard...')
    
    // Load dummy users first
    loadDummyUsers()
    
    // ✅ v2.8.18: Load real users in venues
    loadRealUsersInVenues()
    
    // ✅ v2.8.19: Load Hot Zones settings from Firestore (3 zones!)
    const loadHotZones = async () => {
      try {
        const hotZonesDoc = await getDoc(doc(db, 'settings', 'hotZones'))
        if (hotZonesDoc.exists()) {
          const data = hotZonesDoc.data()
          if (data.zones && data.zones.length > 0) {
            setHotZonesSettings({
              zones: data.zones,
              rotationSeconds: data.rotationSeconds || 5
            })
            console.log('🔥 Hot Zones loaded:', data.zones.length, 'zones')
          }
        }
      } catch (err) {
        console.log('📍 Using default hot zones settings')
      }
    }
    loadHotZones()
    
    // 1. Listen to active check-ins (zones)
    const zoneCheckInsQuery = query(collection(db, 'activeCheckIns'))
    const unsubZones = onSnapshot(zoneCheckInsQuery, (snapshot) => {
      console.log(`📍 Zone check-ins updated: ${snapshot.size}`)
      
      // Count users per zone
      const zoneCounts: Record<string, { users: number, matches: number }> = {}
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const zoneId = data.zoneId
        if (zoneId) {
          if (!zoneCounts[zoneId]) {
            zoneCounts[zoneId] = { users: 0, matches: 0 }
          }
          zoneCounts[zoneId].users++
        }
      })
      
      // Build zone activities with dummy counts
      // ✅ v2.8.20: City priority for smart sorting (bigger cities first when equal activity)
      const cityPriority: Record<string, number> = {
        'tel-aviv': 100,    // 🔥 Main nightlife hub
        'rehovot': 80,      // 🔬 Growing tech hub
        'ashkelon': 60,     // 🏖️ Pilot city
        'jerusalem': 50,
        'haifa': 40,
        'eilat': 30,
      }
      
      const getCityPriority = (city: string) => cityPriority[city] || 10
      
      const activities: ZoneActivity[] = Object.entries(ENTERTAINMENT_ZONES)
        .filter(([_, zone]) => zone.isActive)
        .map(([id, zone]) => {
          const realCount = zoneCounts[id]?.users || 0
          const dummyCount = dummyCountsByZoneRef.current[id] || 0  // ✅ Use ref!
          const totalCount = realCount + dummyCount
          
          // ✅ v2.8.20: Heat level based on REAL users (not dummies!)
          let heatLevel: 'hot' | 'warm' | 'cool' | 'cold' = 'cold'
          if (realCount >= 5) heatLevel = 'hot'        // 5+ real = HOT 🔥
          else if (realCount >= 2) heatLevel = 'warm'  // 2-4 real = warm
          else if (realCount >= 1) heatLevel = 'cool'  // 1 real = cool
          else if (dummyCount >= 100) heatLevel = 'cool' // Has dummies = at least cool
          
          return {
            id,
            name: zone.name,
            city: zone.city,
            icon: zone.icon || '📍',
            userCount: realCount,
            dummyCount,
            matchCount: zoneCounts[id]?.matches || 0,
            heatLevel
          }
        })
        // ✅ v2.8.20: SMART SORTING - Real users FIRST, then city priority, then dummies
        .sort((a, b) => {
          // 1. Real users first (most important!)
          if (b.userCount !== a.userCount) {
            return b.userCount - a.userCount
          }
          
          // 2. If equal real users, sort by city priority
          const priorityDiff = getCityPriority(b.city) - getCityPriority(a.city)
          if (priorityDiff !== 0) {
            return priorityDiff
          }
          
          // 3. If still equal, sort by dummies
          return b.dummyCount - a.dummyCount
        })
      
      setZoneActivities(activities)
      
      // ✅ Calculate total users including dummies
      const totalDummiesInZones = Object.values(dummyCountsByZoneRef.current).reduce((sum, count) => sum + count, 0)
      
      // Update stats
      setStats(prev => ({
        ...prev,
        onlineUsers: snapshot.size + totalDummiesInZones,  // ✅ Include dummies!
        activeZones: activities.filter(z => z.userCount > 0 || z.dummyCount > 0).length
      }))
      
      setLastUpdate(new Date())
    })
    unsubscribersRef.current.push(unsubZones)
    
    // 2. Listen to venues - ✅ v2.8.20: Show ALL venues, active ones at top with green light!
    const venuesQuery = query(collection(db, 'venues'))
    const unsubVenues = onSnapshot(venuesQuery, (snapshot) => {
      console.log(`🏪 Venues updated: ${snapshot.size}`)
      
      const activities: VenueActivity[] = []
      let activeVenueCount = 0
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        // ✅ v2.8.20 FIX: Use ref for real user count instead of checkedInUsers array!
        // This prevents double counting (checkedInUsers + realUsersByVenue)
        const userCount = realUserCountsByVenueRef.current[docSnap.id] || 0
        const dummyCount = dummyCountsByVenueRef.current[docSnap.id] || 0
        const totalCount = userCount + dummyCount
        
        if (totalCount > 0) {
          activeVenueCount++
        }
        
        // ✅ v2.8.20: Show ALL venues, not just active ones!
        activities.push({
          id: docSnap.id,
          name: data.name || 'Unknown Venue',
          city: data.location?.city || 'Unknown',
          userCount,
          dummyCount,
          checkInTime: data.lastCheckIn?.toDate() || null
        })
      })
      
      // ✅ v2.8.20: Sort - active venues first (with users), then inactive
      setVenueActivities(activities.sort((a, b) => {
        const aTotal = a.userCount + a.dummyCount
        const bTotal = b.userCount + b.dummyCount
        // First sort by active (has users) vs inactive
        if (aTotal > 0 && bTotal === 0) return -1
        if (aTotal === 0 && bTotal > 0) return 1
        // Then sort active venues by user count
        return bTotal - aTotal
      }))
      
      // Update stats - only count ACTIVE venues
      setStats(prev => ({
        ...prev,
        activeVenues: activeVenueCount
      }))
    })
    unsubscribersRef.current.push(unsubVenues)
    
    // 3. Listen to dummy users (for real-time updates)
    const dummyUsersQuery = query(collection(db, 'dummyUsers'))
    const unsubDummies = onSnapshot(dummyUsersQuery, () => {
      console.log(`🤖 Dummy users updated`)
      loadDummyUsers() // Reload all dummy users
    })
    unsubscribersRef.current.push(unsubDummies)
    
    // ✅ v2.8.18: Listen to real users with venue check-ins
    const realUsersQuery = query(
      collection(db, 'users'),
      where('checkedInVenue', '!=', null)
    )
    const unsubRealUsers = onSnapshot(realUsersQuery, () => {
      console.log(`👥 Real users in venues updated`)
      loadRealUsersInVenues() // Reload real users
    })
    unsubscribersRef.current.push(unsubRealUsers)
    
    // 4. Listen to active matches
    const matchesQuery = query(
      collection(db, 'matches'),
      where('status', '==', 'active')
    )
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      console.log(`💕 Active matches: ${snapshot.size}`)
      
      setStats(prev => ({
        ...prev,
        activeMatches: snapshot.size
      }))
      
      // Add to live feed
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          addLiveEvent({
            type: 'match',
            message: `💕 New match created!`,
            zone: data.zoneName || data.venueName
          })
        }
      })
    })
    unsubscribersRef.current.push(unsubMatches)
    
    setLoading(false)
    
    // Cleanup
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub())
      unsubscribersRef.current = []
    }
  }, [])

  // ✅ v2.8.5 FIX: Rebuild zone activities when dummy data is loaded
  useEffect(() => {
    if (allDummies.length > 0) {
      console.log('🔄 Rebuilding zone activities with dummy data...')
      
      // ✅ v2.8.20: City priority for smart sorting
      const cityPriority: Record<string, number> = {
        'tel-aviv': 100,
        'rehovot': 80,
        'ashkelon': 60,
        'jerusalem': 50,
        'haifa': 40,
        'eilat': 30,
      }
      const getCityPriority = (city: string) => cityPriority[city] || 10
      
      // Get existing zone activities to preserve real user counts
      const existingActivities = new Map(zoneActivities.map(z => [z.id, z]))
      
      // Rebuild zone activities with current dummy counts
      const activities: ZoneActivity[] = Object.entries(ENTERTAINMENT_ZONES)
        .filter(([_, zone]) => zone.isActive)
        .map(([id, zone]) => {
          const existing = existingActivities.get(id)
          const dummyCount = dummyCountsByZoneRef.current[id] || 0
          const realCount = existing?.userCount || 0
          
          // ✅ v2.8.20: Heat level based on REAL users
          let heatLevel: 'hot' | 'warm' | 'cool' | 'cold' = 'cold'
          if (realCount >= 5) heatLevel = 'hot'
          else if (realCount >= 2) heatLevel = 'warm'
          else if (realCount >= 1) heatLevel = 'cool'
          else if (dummyCount >= 100) heatLevel = 'cool'
          
          return {
            id,
            name: zone.name,
            city: zone.city,
            icon: zone.icon || '📍',
            userCount: realCount,
            dummyCount,
            matchCount: existing?.matchCount || 0,
            heatLevel
          }
        })
        // ✅ v2.8.20: SMART SORTING
        .sort((a, b) => {
          if (b.userCount !== a.userCount) return b.userCount - a.userCount
          const priorityDiff = getCityPriority(b.city) - getCityPriority(a.city)
          if (priorityDiff !== 0) return priorityDiff
          return b.dummyCount - a.dummyCount
        })
      
      setZoneActivities(activities)
      
      // Update active zones count
      setStats(prev => ({
        ...prev,
        activeZones: activities.filter(z => z.dummyCount > 0 || z.userCount > 0).length
      }))
      
      console.log(`✅ Zone activities rebuilt: ${activities.filter(z => z.dummyCount > 0).length} zones with dummies`)
    }
  }, [allDummies])

  // ✅ v2.8.20 FIX: Rebuild venue activities when real user data changes
  useEffect(() => {
    const realUserCount = Object.values(realUsersByVenue).reduce((sum, users) => sum + users.length, 0)
    if (realUserCount > 0 || Object.keys(realUserCountsByVenueRef.current).length > 0) {
      console.log('🔄 Rebuilding venue activities with real user data...')
      
      // Trigger venue listener to re-read the ref
      setVenueActivities(prev => {
        return prev.map(venue => ({
          ...venue,
          userCount: realUserCountsByVenueRef.current[venue.id] || 0
        })).sort((a, b) => {
          const aTotal = a.userCount + a.dummyCount
          const bTotal = b.userCount + b.dummyCount
          if (aTotal > 0 && bTotal === 0) return -1
          if (aTotal === 0 && bTotal > 0) return 1
          return bTotal - aTotal
        })
      })
      
      // Update active venues count
      const activeCount = Object.values(realUserCountsByVenueRef.current).filter(c => c > 0).length +
                         Object.entries(dummyCountsByVenueRef.current).filter(([id, c]) => 
                           c > 0 && !realUserCountsByVenueRef.current[id]
                         ).length
      
      setStats(prev => ({
        ...prev,
        activeVenues: activeCount
      }))
      
      console.log(`✅ Venue activities rebuilt: ${realUserCount} real users`)
    }
  }, [realUsersByVenue])

  // ✅ v2.8.6: Start simulated live activity when dummies are loaded
  useEffect(() => {
    if (allDummies.length === 0 || Object.keys(dummyUsersByZone).length === 0) return
    
    console.log('🎬 Starting simulated live activity...')
    
    // Generate simulated activity with current data
    const generateActivity = () => {
      const zonesWithDummies = Object.entries(dummyUsersByZone).filter(([_, users]) => users.length > 0)
      if (zonesWithDummies.length === 0) return
      
      const [zoneId, zoneDummies] = zonesWithDummies[Math.floor(Math.random() * zonesWithDummies.length)]
      const zoneName = ENTERTAINMENT_ZONES[zoneId]?.name || zoneId
      const dummy = zoneDummies[Math.floor(Math.random() * zoneDummies.length)]
      
      const activityTypes: LiveEvent['type'][] = ['checkin', 'zone_enter', 'chat']
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)]
      
      let message = ''
      switch (activityType) {
        case 'checkin':
          message = `${dummy.name} (${dummy.age}) צ'ק-אין לאזור`
          break
        case 'zone_enter':
          message = `${dummy.name} (${dummy.age}) נכנס/ה לאזור`
          break
        case 'chat':
          if (zoneDummies.length > 1) {
            const otherDummies = zoneDummies.filter(d => d.id !== dummy.id)
            const otherDummy = otherDummies[Math.floor(Math.random() * otherDummies.length)]
            if (otherDummy) {
              message = `${dummy.name} ↔ ${otherDummy.name} מתחילים צ'אט`
            } else {
              message = `${dummy.name} (${dummy.age}) מחפש/ת התאמה`
            }
          } else {
            message = `${dummy.name} (${dummy.age}) מחפש/ת התאמה`
          }
          break
        default:
          message = `${dummy.name} פעיל/ה באזור`
      }
      
      setLiveEvents(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        type: activityType,
        message,
        zone: zoneName,
        timestamp: new Date()
      }, ...prev].slice(0, 50))
    }
    
    // Generate initial activity immediately
    generateActivity()
    
    // Then every 5-15 seconds randomly
    const interval = setInterval(() => {
      generateActivity()
    }, 5000 + Math.random() * 10000)  // Random between 5-15 seconds
    
    return () => {
      clearInterval(interval)
    }
  }, [allDummies, dummyUsersByZone])

  // Add live event helper
  const addLiveEvent = (event: Omit<LiveEvent, 'id' | 'timestamp'>) => {
    const newEvent: LiveEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    
    setLiveEvents(prev => [newEvent, ...prev].slice(0, 50))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const saveUserChanges = async () => {
    if (!editingUser) return
    
    setSaving(true)
    try {
      await updateDoc(doc(db, 'dummyUsers', editingUser.id), {
        name: editingUser.name,
        age: editingUser.age,
        bio: editingUser.bio,
        hobbies: editingUser.hobbies,
        city: editingUser.city,
        height: editingUser.height || null,
        occupation: editingUser.occupation || null,
        education: editingUser.education || null,
        drinking: editingUser.drinking || null,
        smoking: editingUser.smoking || null,
        lookingFor: editingUser.lookingFor || null
      })
      
      console.log('✅ User saved:', editingUser.name)
      setEditingUser(null)
      await loadDummyUsers()
      
    } catch (error) {
      console.error('❌ Error saving:', error)
      alert('שגיאה בשמירה')
    }
    setSaving(false)
  }

  const checkOutUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'dummyUsers', userId), {
        checkedInVenue: null,
        checkedInVenueName: null,
        checkedInAt: null
      })
      await loadDummyUsers()
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('למחוק את המשתמש הזה?')) return
    
    try {
      await deleteDoc(doc(db, 'dummyUsers', userId))
      setSelectedUser(null)
      await loadDummyUsers()
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  // Get users for selected zone/venue - ✅ v2.8.18: Include REAL users!
  const getSelectedUsers = (): any[] => {
    if (selectedVenue) {
      const dummies = dummyUsersByVenue[selectedVenue] || []
      const realUsers = realUsersByVenue[selectedVenue] || []
      // Real users first, then dummies
      return [...realUsers, ...dummies]
    }
    if (selectedZone) {
      return dummyUsersByZone[selectedZone] || []
    }
    return []
  }
  
  // ✅ v2.8.18: Get counts for side panel
  const getSelectedRealCount = (): number => {
    if (selectedVenue) {
      return (realUsersByVenue[selectedVenue] || []).length
    }
    return 0
  }
  
  const getSelectedDummyCount = (): number => {
    if (selectedVenue) {
      return (dummyUsersByVenue[selectedVenue] || []).length
    }
    if (selectedZone) {
      return (dummyUsersByZone[selectedZone] || []).length
    }
    return 0
  }

  const getSelectedTitle = (): string => {
    if (selectedVenue) {
      const venue = venueActivities.find(v => v.id === selectedVenue)
      return venue?.name || selectedVenue
    }
    if (selectedZone) {
      const zone = zoneActivities.find(z => z.id === selectedZone)
      return zone?.name || selectedZone
    }
    return ''
  }

  // ✅ v2.8.29: Region filtering for Hollywood control center
  const REGION_CITIES: Record<string, string[]> = {
    south: ['ashkelon', 'ashdod', 'beer-sheva', 'eilat', 'kiryat-gat', 'dimona', 'rehovot', 'nes-ziona'],
    center: ['tel-aviv', 'ramat-gan', 'givatayim', 'herzliya', 'netanya', 'raanana', 'kfar-saba', 'petah-tikva', 'rishon-lezion', 'holon', 'bat-yam', 'modiin'],
    jerusalem: ['jerusalem', 'beit-shemesh'],
    north: ['haifa', 'nahariya', 'acre', 'kiryat-shmona', 'tiberias', 'safed', 'karmiel', 'nazareth', 'afula', 'tel-adashim']
  }

  const getFilteredZones = () => {
    let filtered = zoneActivities
    
    // Filter by region
    if (selectedRegion !== 'all') {
      const regionCities = REGION_CITIES[selectedRegion] || []
      filtered = filtered.filter(z => regionCities.some(city => z.city.toLowerCase().includes(city.replace('-', ''))))
    }
    
    // Filter by search term
    if (zoneFilter) {
      const term = zoneFilter.toLowerCase()
      filtered = filtered.filter(z => 
        z.name.toLowerCase().includes(term) || 
        z.city.toLowerCase().includes(term)
      )
    }
    
    // Filter active only
    if (showOnlyActive) {
      filtered = filtered.filter(z => z.userCount + z.dummyCount > 0)
    }
    
    return filtered
  }

  const getFilteredVenues = () => {
    let filtered = venueActivities
    
    // Filter by search term
    if (venueFilter) {
      const term = venueFilter.toLowerCase()
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(term) || 
        v.city.toLowerCase().includes(term)
      )
    }
    
    // Filter active only
    if (showOnlyActive) {
      filtered = filtered.filter(v => v.userCount + v.dummyCount > 0)
    }
    
    return filtered
  }

  // Group zones by city for organized display
  const getZonesGroupedByCity = () => {
    const filtered = getFilteredZones()
    const grouped: Record<string, ZoneActivity[]> = {}
    
    filtered.forEach(zone => {
      const city = zone.city || 'Unknown'
      if (!grouped[city]) grouped[city] = []
      grouped[city].push(zone)
    })
    
    return grouped
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a14] via-[#0d2920] to-[#0a1a14] relative">
      {/* ✨ Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ade80]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#4ade80]/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header - Hollywood Style */}
      <header className="sticky top-0 z-40 px-6 py-4 bg-gradient-to-r from-[#0a1a14]/98 via-[#0d2920]/98 to-[#0a1a14]/98 backdrop-blur-xl border-b border-[#4ade80]/30 shadow-2xl">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin/super')}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              {/* Logo with glow */}
              <motion.div 
                animate={{ boxShadow: ['0 0 20px rgba(74,222,128,0.3)', '0 0 40px rgba(74,222,128,0.5)', '0 0 20px rgba(74,222,128,0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4ade80] via-[#22c55e] to-[#15803d] flex items-center justify-center"
              >
                <Activity className="w-7 h-7 text-black" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#4ade80] to-white">
                  Live Activity Dashboard
                </h1>
                <div className="flex items-center gap-3 text-sm">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" 
                  />
                  <span className="text-[#4ade80] font-bold tracking-wider">LIVE</span>
                  <span className="text-white/50">• Updated {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/admin/super/dummies')}
              variant="outline"
              size="sm"
              className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
            >
              🎬 Dummy Control
            </Button>
            <Button
              onClick={() => {
                loadDummyUsers()
                loadRealUsersInVenues()
              }}
              variant="ghost"
              size="sm"
              className="text-white/70"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 p-6 transition-all max-w-[1800px] mx-auto ${(selectedZone || selectedVenue) ? 'mr-[420px]' : ''}`}>
          {/* Stats Cards - Hollywood Style ✅ v2.8.18: Interactive! */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            {[
              { key: 'online', label: 'Online Now', value: stats.onlineUsers, icon: Users, gradient: 'from-blue-500 via-cyan-500 to-blue-400', glow: 'rgba(59,130,246,0.5)' },
              { key: 'matches', label: 'Active Matches', value: stats.activeMatches, icon: Heart, gradient: 'from-pink-500 via-rose-500 to-pink-400', glow: 'rgba(236,72,153,0.5)' },
              { key: 'meetings', label: 'Meetings Today', value: stats.meetingsToday, icon: Zap, gradient: 'from-yellow-500 via-orange-500 to-amber-400', glow: 'rgba(234,179,8,0.5)' },
              { key: 'zones', label: 'Active Zones', value: stats.activeZones, icon: MapPin, gradient: 'from-green-500 via-emerald-500 to-green-400', glow: 'rgba(34,197,94,0.5)' },
              { key: 'venues', label: 'Active Venues', value: stats.activeVenues, icon: Building2, gradient: 'from-purple-500 via-violet-500 to-purple-400', glow: 'rgba(168,85,247,0.5)' },
              { key: 'dummies', label: 'Total Dummies', value: stats.totalDummies, icon: Users, gradient: 'from-yellow-600 via-amber-600 to-yellow-500', glow: 'rgba(217,119,6,0.5)' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setActiveModal(stat.key as any)}
                className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group"
                style={{ boxShadow: `0 10px 40px -10px ${stat.glow}` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                <div className="absolute inset-[1px] rounded-2xl border border-white/10" />
                {/* ✅ v2.8.18: Click indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4 text-white/50" />
                </div>
                <div className="relative">
                  <stat.icon className="w-8 h-8 text-white/70 mb-3 group-hover:scale-110 transition-transform" />
                  <motion.div 
                    className="text-4xl font-black text-white mb-1"
                    key={stat.value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {stat.value.toLocaleString()}
                  </motion.div>
                  <div className="text-sm text-white/60 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* 🔥 HOT ZONE CONTROL - Website Banner Management */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* ✅ v2.8.20: Removed Hot Zones Control - managed via code/ticker only */}

          <div className="grid grid-cols-2 gap-6">
            {/* Zone Activity - Hollywood Style with Regions! */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-[#4ade80]/30 overflow-hidden backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(74,222,128,0.2)]"
            >
              <div className="px-5 py-4 border-b border-[#4ade80]/20 bg-gradient-to-r from-[#4ade80]/10 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Zone Activity</h2>
                    <span className="text-xs text-[#4ade80]/70">Entertainment Zones</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-[#4ade80]">{getFilteredZones().length} / {zoneActivities.length}</span>
                    <div className="px-3 py-1 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/30">
                      <span className="text-sm font-bold text-[#4ade80]">{zoneActivities.length} Zones</span>
                    </div>
                  </div>
                </div>
                
                {/* 🌍 Region Tabs - Hollywood Style! */}
                <div className="flex gap-2 mb-3">
                  {[
                    { id: 'all', label: '🌍 All', labelHe: 'הכל' },
                    { id: 'south', label: '🏖️ South', labelHe: 'דרום' },
                    { id: 'center', label: '🏙️ Center', labelHe: 'מרכז' },
                    { id: 'jerusalem', label: '🏛️ Jerusalem', labelHe: 'י-ם' },
                    { id: 'north', label: '⛰️ North', labelHe: 'צפון' }
                  ].map(region => (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegion(region.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedRegion === region.id
                          ? 'bg-[#4ade80] text-black shadow-lg'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
                
                {/* 🔍 Search & Filter */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="🔍 Search zones..."
                      value={zoneFilter}
                      onChange={(e) => setZoneFilter(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 focus:border-[#4ade80]/50 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setShowOnlyActive(!showOnlyActive)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      showOnlyActive
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {showOnlyActive ? '🟢 Active' : '👁️ All'}
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar">
                {getFilteredZones().map((zone, index) => {
                  const totalCount = zone.userCount + zone.dummyCount
                  
                  return (
                    <motion.button
                      key={zone.id}
                      onClick={() => {
                        setSelectedVenue(null)
                        setSelectedZone(selectedZone === zone.id ? null : zone.id)
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        selectedZone === zone.id
                          ? 'border-[#4ade80] bg-gradient-to-r from-[#4ade80]/30 to-[#4ade80]/10 shadow-[0_0_30px_rgba(74,222,128,0.3)]'
                          : 'border-[#4ade80]/20 bg-[#4ade80]/5 hover:border-[#4ade80]/50 hover:bg-[#4ade80]/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{zone.icon}</span>
                        <div className="text-left">
                          <div className="font-bold text-white text-lg">{zone.name}</div>
                          <div className="text-sm text-[#4ade80]/70">{zone.city}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-white font-bold">
                            <Users className="w-4 h-4" />
                            {totalCount}
                          </div>
                          {zone.dummyCount > 0 && (
                            <div className="text-xs text-yellow-400">
                              {zone.userCount} real + {zone.dummyCount} 🤖
                            </div>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${selectedZone === zone.id ? 'rotate-90' : ''}`} />
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* Venue Activity - Hollywood Style */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-blue-500/30 overflow-hidden backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(59,130,246,0.2)]"
            >
              <div className="px-5 py-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Venue Activity</h2>
                    <span className="text-xs text-blue-400/70">Clubs & Bars</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {/* Active venues count */}
                    <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                      <span className="text-sm font-bold text-green-400">
                        🟢 {venueActivities.filter(v => v.userCount + v.dummyCount > 0).length} Active
                      </span>
                    </div>
                    {/* Total venues count */}
                    <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                      <span className="text-sm font-bold text-blue-400">{venueActivities.length} Venues</span>
                    </div>
                  </div>
                </div>
                
                {/* 🔍 Venue Search */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="🔍 Search venues..."
                    value={venueFilter}
                    onChange={(e) => setVenueFilter(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar">
                {getFilteredVenues().length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No venues found</p>
                    <p className="text-sm text-white/30 mt-1">Add venues in Firebase</p>
                  </div>
                ) : (
                  getFilteredVenues().map((venue, index) => {
                    const totalCount = venue.userCount + venue.dummyCount
                    const isActive = totalCount > 0
                    
                    return (
                      <motion.button
                        key={venue.id}
                        onClick={() => {
                          setSelectedZone(null)
                          setSelectedVenue(selectedVenue === venue.id ? null : venue.id)
                        }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.02, x: -5 }}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          selectedVenue === venue.id
                            ? 'border-blue-500 bg-gradient-to-r from-blue-500/30 to-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                            : isActive
                              ? 'border-green-500/50 bg-green-500/10 hover:border-green-500/70 hover:bg-green-500/15'
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* ✅ v2.8.20: Green light for active venues */}
                          <div className="relative">
                            <span className="text-3xl">🍺</span>
                            {isActive && (
                              <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                              />
                            )}
                          </div>
                          <div className="text-left">
                            <div className={`font-bold text-lg ${isActive ? 'text-white' : 'text-white/60'}`}>{venue.name}</div>
                            <div className={`text-sm ${isActive ? 'text-blue-400/70' : 'text-white/40'}`}>{venue.city}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {isActive ? (
                              <>
                                <div className="flex items-center gap-2 justify-end">
                                  <Users className="w-5 h-5 text-green-400" />
                                  <span className="text-2xl font-black text-white">{totalCount}</span>
                                </div>
                                {venue.dummyCount > 0 && (
                                  <div className="text-sm text-yellow-400/80 mt-1">
                                    {venue.userCount} real + {venue.dummyCount} 🤖
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-white/30 text-sm">No activity</span>
                            )}
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-transform ${
                            selectedVenue === venue.id ? 'rotate-90 text-white' : isActive ? 'text-white/40' : 'text-white/20'
                          }`} />
                        </div>
                      </motion.button>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Live Feed - Hollywood Style with Chat Messages! */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-[#4ade80]/30 overflow-hidden backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(74,222,128,0.15)]"
          >
            <div className="px-5 py-4 border-b border-[#4ade80]/20 flex items-center justify-between bg-gradient-to-r from-[#4ade80]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Live Feed</h2>
                  <span className="text-xs text-[#4ade80]/70">Real-time activity from all zones & venues</span>
                </div>
                <motion.span 
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)]" 
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/30">
                  <span className="text-sm font-bold text-[#4ade80]">📍 {stats.activeZones} Zones</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                  <span className="text-sm font-bold text-blue-400">🍺 {stats.activeVenues} Venues</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <span className="text-sm font-bold text-purple-400">{liveEvents.length} Events</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 h-[300px] overflow-y-auto custom-scrollbar">
              {liveEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Activity className="w-16 h-16 mb-4 text-[#4ade80]/30" />
                  </motion.div>
                  <p className="text-lg font-medium">Waiting for activity...</p>
                  <p className="text-sm text-white/30">Events will appear here in real-time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveEvents.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -30, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        event.type === 'chat' 
                          ? 'bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50' 
                          : event.type === 'match'
                          ? 'bg-gradient-to-r from-pink-500/10 to-pink-500/5 border-pink-500/30 hover:border-pink-500/50'
                          : 'bg-gradient-to-r from-white/5 to-white/[0.02] border-white/10 hover:border-[#4ade80]/30'
                      }`}
                    >
                      {/* Event Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        event.type === 'chat' ? 'bg-purple-500/20' :
                        event.type === 'match' ? 'bg-pink-500/20' :
                        'bg-[#4ade80]/20'
                      }`}>
                        {event.type === 'match' && '💕'}
                        {event.type === 'checkin' && '📍'}
                        {event.type === 'meeting' && '☕'}
                        {event.type === 'chat' && '💬'}
                        {event.type === 'zone_enter' && '🎯'}
                      </div>
                      
                      {/* Event Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-lg">{event.message}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Source Badge - Zone or Venue */}
                          {event.zone && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4ade80]/20 text-[#4ade80] text-xs font-bold">
                              📍 {event.zone}
                            </span>
                          )}
                          {event.venue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                              🍺 {event.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="text-white/40 text-sm font-mono bg-black/30 px-3 py-1.5 rounded-lg">
                        {event.timestamp.toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </main>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SIDE PANEL - USER LIST */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {(selectedZone || selectedVenue) && (
            <motion.aside
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-[420px] bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#0a1a14] border-l-2 border-[#4ade80]/40 z-50 overflow-hidden flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
            >
              {/* Panel Header - Hollywood Style */}
              <div className="p-5 border-b border-[#4ade80]/30 bg-gradient-to-r from-[#4ade80]/15 via-[#4ade80]/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#4ade80]">
                      {getSelectedTitle()}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-[#4ade80]" />
                      <p className="text-sm text-[#4ade80]/80 font-medium">
                        {getSelectedRealCount() > 0 && (
                          <span className="text-blue-400">{getSelectedRealCount()} אמיתיים</span>
                        )}
                        {getSelectedRealCount() > 0 && getSelectedDummyCount() > 0 && ' + '}
                        {getSelectedDummyCount() > 0 && (
                          <span className="text-yellow-400">{getSelectedDummyCount()} דמה</span>
                        )}
                        {getSelectedRealCount() === 0 && getSelectedDummyCount() === 0 && 'אין משתמשים'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedZone(null)
                      setSelectedVenue(null)
                    }}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/50 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </motion.button>
                </div>
              </div>
              
              {/* User List - Hollywood Style */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {getSelectedUsers().length === 0 ? (
                  <div className="text-center py-16 text-white/40">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Users className="w-20 h-20 mx-auto mb-4 text-[#4ade80]/20" />
                    </motion.div>
                    <p className="text-xl font-medium text-white/50">אין משתמשים כאן</p>
                    <p className="text-sm mt-2 text-white/30">עבור ל-Dummy Control להוספת משתמשים</p>
                    <Button
                      onClick={() => router.push('/admin/super/dummies')}
                      className="mt-6 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-black font-bold px-6 py-3 rounded-xl shadow-lg shadow-[#4ade80]/30"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      הוסף דמה
                    </Button>
                  </div>
                ) : (
                  getSelectedUsers().map((user, idx) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl overflow-hidden border-2 border-white/10 hover:border-[#4ade80]/50 transition-all shadow-lg"
                    >
                      {/* User Card */}
                      <div className="relative">
                        {/* Photo */}
                        <div className="aspect-[4/3] relative">
                          {user.photos?.[0] ? (
                            <img
                              src={user.photos[0]}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                              <Camera className="w-12 h-12 text-white/20" />
                            </div>
                          )}
                          
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          
                          {/* User badge - Real or Dummy */}
                          {user.isReal ? (
                            <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              ✓ REAL USER
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 bg-yellow-500/90 text-black px-2 py-1 rounded-full text-xs font-bold">
                              🤖 DUMMY
                            </div>
                          )}
                          
                          {/* Basic info */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="text-white font-bold text-xl">{user.name}, {user.age}</div>
                            <div className="text-white/70 text-sm flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {user.city || 'Unknown'}
                              <span className="mx-1">•</span>
                              {user.gender === 'male' ? '👨' : '👩'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Details */}
                        <div className="p-3 space-y-2">
                          {/* Bio */}
                          {user.bio && (
                            <div className="text-white/70 text-sm line-clamp-2">
                              &quot;{user.bio}&quot;
                            </div>
                          )}
                          
                          {/* Hobbies */}
                          {user.hobbies?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.hobbies.slice(0, 4).map((hobby: string, i: number) => (
                                <span key={i} className="bg-[#4ade80]/20 text-[#4ade80] px-2 py-0.5 rounded-full text-xs">
                                  {hobby}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Extra info */}
                          <div className="flex flex-wrap gap-2 text-xs text-white/50">
                            {user.occupation && <span>💼 {user.occupation}</span>}
                            {user.height && <span>📏 {user.height} ס&quot;מ</span>}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => setEditingUser(user)}
                              size="sm"
                              variant="outline"
                              className="flex-1 border-white/20 text-white/70 hover:text-white"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              ערוך
                            </Button>
                            <Button
                              onClick={() => setSelectedUser(user)}
                              size="sm"
                              variant="outline"
                              className="border-[#4ade80]/50 text-[#4ade80]"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              פרטים
                            </Button>
                            {user.checkedInVenue && (
                              <Button
                                onClick={() => checkOutUser(user.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400"
                              >
                                <LogOut className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* EDIT USER MODAL */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {editingUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              onClick={() => setEditingUser(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0d2920] rounded-2xl p-6 max-w-2xl w-full border border-[#4ade80]/30 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Edit3 className="w-6 h-6 text-[#4ade80]" />
                  עריכת פרופיל - {editingUser.name}
                </h3>
                
                {/* Photo */}
                <div className="flex justify-center mb-6">
                  <img
                    src={editingUser.photos?.[0] || '/placeholder.jpg'}
                    alt={editingUser.name}
                    className="w-40 h-40 rounded-2xl object-cover border-4 border-[#4ade80]/30"
                  />
                </div>
                
                {/* Form Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">שם</label>
                    <Input
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  
                  {/* Age */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">גיל</label>
                    <Input
                      type="number"
                      value={editingUser.age}
                      onChange={(e) => setEditingUser({...editingUser, age: parseInt(e.target.value)})}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  
                  {/* City */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">עיר</label>
                    <select
                      value={editingUser.city || 'ashkelon'}
                      onChange={(e) => setEditingUser({...editingUser, city: e.target.value})}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    >
                      <option value="ashkelon">אשקלון</option>
                      <option value="tel-aviv">תל אביב</option>
                      <option value="rehovot">רחובות</option>
                    </select>
                  </div>
                  
                  {/* Height */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">גובה (ס&quot;מ)</label>
                    <Input
                      type="number"
                      value={editingUser.height || ''}
                      onChange={(e) => setEditingUser({...editingUser, height: parseInt(e.target.value) || undefined})}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="170"
                    />
                  </div>
                  
                  {/* Occupation */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">מקצוע</label>
                    <Input
                      value={editingUser.occupation || ''}
                      onChange={(e) => setEditingUser({...editingUser, occupation: e.target.value})}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="מהנדס תוכנה"
                    />
                  </div>
                  
                  {/* Education */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">השכלה</label>
                    <select
                      value={editingUser.education || ''}
                      onChange={(e) => setEditingUser({...editingUser, education: e.target.value})}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    >
                      <option value="">לא צוין</option>
                      <option value="high_school">תיכונית</option>
                      <option value="bachelor">תואר ראשון</option>
                      <option value="master">תואר שני</option>
                      <option value="phd">דוקטורט</option>
                    </select>
                  </div>
                  
                  {/* Drinking */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">שתייה</label>
                    <select
                      value={editingUser.drinking || ''}
                      onChange={(e) => setEditingUser({...editingUser, drinking: e.target.value})}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    >
                      <option value="">לא צוין</option>
                      <option value="never">לא שותה</option>
                      <option value="socially">חברתית</option>
                      <option value="regularly">באופן קבוע</option>
                    </select>
                  </div>
                  
                  {/* Smoking */}
                  <div>
                    <label className="text-white/60 text-sm block mb-1">עישון</label>
                    <select
                      value={editingUser.smoking || ''}
                      onChange={(e) => setEditingUser({...editingUser, smoking: e.target.value})}
                      className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    >
                      <option value="">לא צוין</option>
                      <option value="never">לא מעשן</option>
                      <option value="socially">חברתית</option>
                      <option value="regularly">באופן קבוע</option>
                    </select>
                  </div>
                </div>
                
                {/* Bio - Full width */}
                <div className="mt-4">
                  <label className="text-white/60 text-sm block mb-1">ביו (על עצמי)</label>
                  <textarea
                    value={editingUser.bio}
                    onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white min-h-[100px]"
                    placeholder="ספר/י על עצמך בצורה אמיתית ומעניינת..."
                  />
                </div>
                
                {/* Hobbies */}
                <div className="mt-4">
                  <label className="text-white/60 text-sm block mb-1">תחביבים (מופרדים בפסיק)</label>
                  <Input
                    value={editingUser.hobbies?.join(', ') || ''}
                    onChange={(e) => setEditingUser({...editingUser, hobbies: e.target.value.split(',').map(h => h.trim()).filter(h => h)})}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="טיולים, בישול, ספורט"
                  />
                </div>
                
                {/* Looking For */}
                <div className="mt-4">
                  <label className="text-white/60 text-sm block mb-1">מה אני מחפש/ת</label>
                  <select
                    value={editingUser.lookingFor || ''}
                    onChange={(e) => setEditingUser({...editingUser, lookingFor: e.target.value})}
                    className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="">לא צוין</option>
                    <option value="relationship">קשר רציני</option>
                    <option value="casual">קשר לא מחייב</option>
                    <option value="friendship">חברות</option>
                    <option value="not_sure">עדיין לא בטוח/ה</option>
                  </select>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-3 mt-8">
                  <Button
                    onClick={saveUserChanges}
                    disabled={saving}
                    className="flex-1 bg-[#4ade80] text-black hover:bg-[#22c55e] h-12 text-lg font-bold"
                  >
                    {saving ? (
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    שמור שינויים
                  </Button>
                  <Button
                    onClick={() => deleteUser(editingUser.id)}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => setEditingUser(null)}
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

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* USER DETAIL MODAL */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              onClick={() => setSelectedUser(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0d2920] rounded-2xl overflow-hidden max-w-md w-full border border-[#4ade80]/30"
                onClick={e => e.stopPropagation()}
              >
                {/* Large Photo */}
                <div className="aspect-[3/4] relative">
                  <img
                    src={selectedUser.photos?.[0] || '/placeholder.jpg'}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  <Button
                    onClick={() => setSelectedUser(null)}
                    variant="ghost"
                    className="absolute top-4 right-4 text-white"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="text-white font-bold text-3xl">{selectedUser.name}, {selectedUser.age}</div>
                    <div className="text-white/70 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {selectedUser.city}
                      <span className="mx-1">•</span>
                      {selectedUser.gender === 'male' ? '👨 גבר' : '👩 אישה'}
                    </div>
                    
                    {selectedUser.occupation && (
                      <div className="text-white/60 mt-2">💼 {selectedUser.occupation}</div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Bio */}
                  {selectedUser.bio && (
                    <div>
                      <h4 className="text-[#4ade80] font-bold mb-1">על עצמי</h4>
                      <p className="text-white/80">{selectedUser.bio}</p>
                    </div>
                  )}
                  
                  {/* Hobbies */}
                  {selectedUser.hobbies?.length > 0 && (
                    <div>
                      <h4 className="text-[#4ade80] font-bold mb-2">תחביבים</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.hobbies.map((hobby: string, i: number) => (
                          <span key={i} className="bg-[#4ade80]/20 text-[#4ade80] px-3 py-1 rounded-full text-sm">
                            {hobby}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedUser.height && (
                      <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-white/40">גובה</div>
                        <div className="text-white font-bold">{selectedUser.height} ס&quot;מ</div>
                      </div>
                    )}
                    {selectedUser.education && (
                      <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-white/40">השכלה</div>
                        <div className="text-white font-bold">
                          {selectedUser.education === 'bachelor' ? 'תואר ראשון' :
                           selectedUser.education === 'master' ? 'תואר שני' :
                           selectedUser.education === 'phd' ? 'דוקטורט' : selectedUser.education}
                        </div>
                      </div>
                    )}
                    {selectedUser.drinking && (
                      <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-white/40">שתייה</div>
                        <div className="text-white font-bold">
                          {selectedUser.drinking === 'never' ? 'לא שותה' :
                           selectedUser.drinking === 'socially' ? 'חברתית' :
                           selectedUser.drinking === 'regularly' ? 'קבוע' : selectedUser.drinking}
                        </div>
                      </div>
                    )}
                    {selectedUser.smoking && (
                      <div className="bg-white/5 p-3 rounded-xl">
                        <div className="text-white/40">עישון</div>
                        <div className="text-white font-bold">
                          {selectedUser.smoking === 'never' ? 'לא מעשן' :
                           selectedUser.smoking === 'socially' ? 'חברתית' :
                           selectedUser.smoking === 'regularly' ? 'קבוע' : selectedUser.smoking}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        setSelectedUser(null)
                        setEditingUser(selectedUser)
                      }}
                      className="flex-1 bg-[#4ade80] text-black"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      ערוך פרופיל
                    </Button>
                    <Button
                      onClick={() => setSelectedUser(null)}
                      variant="outline"
                      className="border-white/20 text-white/70"
                    >
                      סגור
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ✅ v2.8.18: STATS DETAIL MODALS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {activeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
              onClick={() => setActiveModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-gradient-to-br from-[#0d2920] to-[#0a1a14] rounded-3xl overflow-hidden max-w-2xl w-full border border-[#4ade80]/30 shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 px-6 py-4 border-b border-[#4ade80]/20 bg-[#0d2920]/95 backdrop-blur-sm flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {activeModal === 'online' && <><Users className="w-6 h-6 text-blue-400" /> משתמשים אונליין</>}
                    {activeModal === 'matches' && <><Heart className="w-6 h-6 text-pink-400" /> מאצ'ים פעילים</>}
                    {activeModal === 'meetings' && <><Zap className="w-6 h-6 text-yellow-400" /> פגישות היום</>}
                    {activeModal === 'zones' && <><MapPin className="w-6 h-6 text-green-400" /> אזורים פעילים</>}
                    {activeModal === 'venues' && <><Building2 className="w-6 h-6 text-purple-400" /> מועדונים פעילים</>}
                    {activeModal === 'dummies' && <><Users className="w-6 h-6 text-amber-400" /> כל ה-Dummies</>}
                  </h2>
                  <Button
                    onClick={() => setActiveModal(null)}
                    variant="ghost"
                    className="text-white/70 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Online Users */}
                  {activeModal === 'online' && (
                    <div className="space-y-4">
                      <p className="text-white/60 mb-4">
                        סה"כ {stats.onlineUsers} משתמשים מחוברים (כולל dummies)
                      </p>
                      <div className="grid gap-3">
                        {allDummies.filter(d => d.isAvailable).slice(0, 20).map(user => (
                          <div key={user.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                            <img src={user.photos?.[0] || '/placeholder.jpg'} className="w-12 h-12 rounded-full object-cover" />
                            <div className="flex-1">
                              <div className="font-bold text-white">{user.name}, {user.age}</div>
                              <div className="text-sm text-white/50">{user.dummyZone || user.checkedInVenueName || 'Unknown'}</div>
                            </div>
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Online" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Matches */}
                  {activeModal === 'matches' && (
                    <div className="space-y-4">
                      <p className="text-white/60 mb-4">
                        {stats.activeMatches === 0 
                          ? 'אין מאצ\'ים פעילים כרגע' 
                          : `${stats.activeMatches} מאצ'ים פעילים`}
                      </p>
                      {stats.activeMatches === 0 ? (
                        <div className="text-center py-10 text-white/40">
                          <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p>אין מאצ'ים פעילים כרגע</p>
                        </div>
                      ) : (
                        <p className="text-white/50">פרטי מאצ'ים זמינים בדשבורד המאצ'ים</p>
                      )}
                    </div>
                  )}

                  {/* Meetings Today */}
                  {activeModal === 'meetings' && (
                    <div className="space-y-4">
                      <p className="text-white/60 mb-4">
                        {stats.meetingsToday === 0 
                          ? 'אין פגישות היום' 
                          : `${stats.meetingsToday} פגישות היום`}
                      </p>
                      {stats.meetingsToday === 0 ? (
                        <div className="text-center py-10 text-white/40">
                          <Zap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p>אין פגישות היום עדיין</p>
                          <p className="text-sm mt-2">המספר יעלה כשמשתמשים ילחצו "We're Meeting!"</p>
                        </div>
                      ) : (
                        <p className="text-white/50">פרטי פגישות זמינים בדשבורד המאצ'ים</p>
                      )}
                    </div>
                  )}

                  {/* Active Zones */}
                  {activeModal === 'zones' && (
                    <div className="space-y-3">
                      <p className="text-white/60 mb-4">
                        {stats.activeZones} אזורים עם משתמשים פעילים
                      </p>
                      {zoneActivities.filter(z => z.userCount + z.dummyCount > 0).map(zone => (
                        <div 
                          key={zone.id} 
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-[#4ade80]/20 hover:border-[#4ade80]/50 cursor-pointer transition-all"
                          onClick={() => {
                            setActiveModal(null)
                            setSelectedVenue(null)
                            setSelectedZone(zone.id)
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{zone.icon}</span>
                            <div>
                              <div className="font-bold text-white">{zone.name}</div>
                              <div className="text-sm text-[#4ade80]/70">{zone.city}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold text-xl">{zone.userCount + zone.dummyCount}</div>
                            <div className="text-xs text-white/50">
                              {zone.userCount} real + {zone.dummyCount} 🤖
                            </div>
                          </div>
                        </div>
                      ))}
                      {zoneActivities.filter(z => z.userCount + z.dummyCount > 0).length === 0 && (
                        <div className="text-center py-10 text-white/40">
                          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p>אין אזורים פעילים כרגע</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Venues */}
                  {activeModal === 'venues' && (
                    <div className="space-y-3">
                      <p className="text-white/60 mb-4">
                        {stats.activeVenues} מועדונים עם משתמשים
                      </p>
                      {venueActivities.filter(v => v.userCount + v.dummyCount > 0).map(venue => (
                        <div 
                          key={venue.id} 
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-purple-500/20 hover:border-purple-500/50 cursor-pointer transition-all"
                          onClick={() => {
                            setActiveModal(null)
                            setSelectedZone(null)
                            setSelectedVenue(venue.id)
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-white">{venue.name}</div>
                              <div className="text-sm text-purple-400/70">{venue.city}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold text-xl">{venue.userCount + venue.dummyCount}</div>
                            <div className="text-xs text-white/50">משתמשים</div>
                          </div>
                        </div>
                      ))}
                      {venueActivities.filter(v => v.userCount + v.dummyCount > 0).length === 0 && (
                        <div className="text-center py-10 text-white/40">
                          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p>אין מועדונים פעילים כרגע</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Dummies */}
                  {activeModal === 'dummies' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-white/60">
                          סה"כ {stats.totalDummies} פרופילי dummy
                        </p>
                        <Button
                          onClick={() => {
                            setActiveModal(null)
                            router.push('/admin/super/dummies')
                          }}
                          size="sm"
                          className="bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        >
                          🎬 Dummy Control
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
                        {allDummies.slice(0, 50).map(dummy => (
                          <div 
                            key={dummy.id} 
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-amber-500/20 hover:border-amber-500/50 cursor-pointer transition-all"
                            onClick={() => {
                              setActiveModal(null)
                              setSelectedUser(dummy)
                            }}
                          >
                            <img src={dummy.photos?.[0] || '/placeholder.jpg'} className="w-12 h-12 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-white truncate">{dummy.name}, {dummy.age}</div>
                              <div className="text-xs text-white/50 truncate">
                                {dummy.gender === 'male' ? '👨' : '👩'} {dummy.dummyZone || dummy.city || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {stats.totalDummies > 50 && (
                        <p className="text-center text-white/40 text-sm mt-4">
                          מציג 50 מתוך {stats.totalDummies}. לכניסה לדף ניהול Dummies לחץ למעלה.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
