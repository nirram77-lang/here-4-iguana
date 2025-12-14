"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Plus,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Heart,
  X,
  MessageSquare,
  MapPin,
  Zap,
  Activity,
  Download,
  Trash2,
  UserPlus,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  Smartphone,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  addDoc,
  onSnapshot
} from 'firebase/firestore'
import { getAdminData } from '@/lib/admin-auth'

// Dummy user data for quick creation
const MALE_NAMES = ['דני', 'יוסי', 'אבי', 'משה', 'דוד', 'אלון', 'עומר', 'נועם', 'איתי', 'רון', 'גיל', 'תום', 'ליאור', 'עידו', 'שחר']
const FEMALE_NAMES = ['מיכל', 'שירה', 'נועה', 'ליאת', 'דנה', 'יעל', 'מאיה', 'תמר', 'רונית', 'אורית', 'הילה', 'ליהי', 'שני', 'עדי', 'גל']
const HOBBIES = ['מוזיקה', 'ספורט', 'טיולים', 'בישול', 'קולנוע', 'קריאה', 'יוגה', 'ריקוד', 'אומנות', 'גיימינג']
const BIOS = [
  'אוהב/ת חיים, מחפש/ת הרפתקאות חדשות',
  'חיוך זה הדבר הכי יפה בעולם',
  'בואו נצא לשתות קפה ☕',
  'מחפש/ת מישהו לצחוק איתו',
  'אופטימי/ת לגבי הכל',
  'Let\'s have fun! 🎉'
]

// Demo photos (placeholder)
const DEMO_PHOTOS = {
  male: [
    'https://randomuser.me/api/portraits/men/1.jpg',
    'https://randomuser.me/api/portraits/men/2.jpg',
    'https://randomuser.me/api/portraits/men/3.jpg'
  ],
  female: [
    'https://randomuser.me/api/portraits/women/1.jpg',
    'https://randomuser.me/api/portraits/women/2.jpg',
    'https://randomuser.me/api/portraits/women/3.jpg'
  ]
}

interface SimUser {
  uid: string
  name: string
  gender: 'male' | 'female'
  age: number
  photos: string[]
  checkedInVenue: string | null
  venueName?: string
  isAvailable: boolean
  swipedRight: string[]
  swipedLeft: string[]
  matches: string[]
}

interface LogEntry {
  id: string
  timestamp: Date
  type: 'info' | 'action' | 'match' | 'error' | 'success'
  message: string
  userId?: string
  userName?: string
}

interface Venue {
  id: string
  name: string
  displayName: string
}

interface Scenario {
  id: string
  name: string
  description: string
  steps: string[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'basic-match',
    name: '🎯 Basic Match',
    description: 'שני משתמשים עושים Check-in ו-Match',
    steps: ['Create 2 users (M+F)', 'Check-in both', 'Swipe right both', 'Verify match']
  },
  {
    id: 'full-flow',
    name: '💫 Full Dating Flow',
    description: 'תהליך מלא: Check-in → Match → Chat',
    steps: ['Create users', 'Check-in', 'Swipe', 'Match', 'Send message']
  },
  {
    id: 'stress-test',
    name: '🔥 Stress Test (50 Users)',
    description: 'בדיקת עומסים עם 50 משתמשים',
    steps: ['Create 50 users', 'Random check-ins', 'Random swipes', 'Monitor performance']
  },
  {
    id: 'mega-test',
    name: '🚀 MEGA Test (100 Users)',
    description: 'סימולציית מועדון מלא!',
    steps: ['Create 100 users', 'All check-in', 'Mass swipes', 'Verify stability']
  }
]

export default function SimulatorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [simUsers, setSimUsers] = useState<SimUser[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [createCount, setCreateCount] = useState(2)
  const [createGender, setCreateGender] = useState<'male' | 'female' | 'mixed'>('mixed')
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Add log entry
  const addLog = (type: LogEntry['type'], message: string, userId?: string, userName?: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      userId,
      userName
    }
    setLogs(prev => [entry, ...prev].slice(0, 200)) // Keep last 200 logs
    
    // Auto-scroll to latest
    setTimeout(() => {
      logContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  // Load venues and sim users
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/admin/login')
          return
        }

        // Verify super admin
        const adminData = await getAdminData(user.uid)
        if (!adminData || adminData.role !== 'super') {
          router.push('/admin/login')
          return
        }

        // Load venues
        const venuesSnapshot = await getDocs(collection(db, 'venues'))
        const venuesData: Venue[] = []
        venuesSnapshot.forEach(doc => {
          const data = doc.data()
          venuesData.push({
            id: doc.id,
            name: data.name,
            displayName: data.displayName || data.name
          })
        })
        setVenues(venuesData)
        if (venuesData.length > 0) {
          setSelectedVenue(venuesData[0].id)
        }

        // Load dummy/test users
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), where('isDummy', '==', true))
        )
        const usersData: SimUser[] = []
        usersSnapshot.forEach(doc => {
          const data = doc.data()
          usersData.push({
            uid: doc.id,
            name: data.name || 'Unknown',
            gender: data.gender || 'male',
            age: data.age || 25,
            photos: data.photos || [],
            checkedInVenue: data.checkedInVenue || null,
            isAvailable: data.isAvailable !== false,
            swipedRight: data.swipedRight || [],
            swipedLeft: data.swipedLeft || [],
            matches: data.matches || []
          })
        })
        setSimUsers(usersData)
        
        addLog('info', `📊 נטענו ${venuesData.length} מקומות ו-${usersData.length} משתמשי בדיקה`)

      } catch (error) {
        console.error('Error loading data:', error)
        addLog('error', 'שגיאה בטעינת נתונים')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Create dummy users
  const createDummyUsers = async () => {
    addLog('info', `🔨 יוצר ${createCount} משתמשי בדיקה...`)
    
    const created: SimUser[] = []
    
    for (let i = 0; i < createCount; i++) {
      const gender = createGender === 'mixed' 
        ? (i % 2 === 0 ? 'male' : 'female')
        : createGender
      
      const names = gender === 'male' ? MALE_NAMES : FEMALE_NAMES
      const name = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 1000)
      const age = 21 + Math.floor(Math.random() * 15)
      const uid = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const userData = {
        uid,
        email: `${uid}@test.i4iguana.com`,
        name,
        displayName: name,
        gender,
        age,
        photos: gender === 'male' 
          ? [DEMO_PHOTOS.male[Math.floor(Math.random() * DEMO_PHOTOS.male.length)]]
          : [DEMO_PHOTOS.female[Math.floor(Math.random() * DEMO_PHOTOS.female.length)]],
        hobbies: HOBBIES.sort(() => Math.random() - 0.5).slice(0, 3),
        bio: BIOS[Math.floor(Math.random() * BIOS.length)],
        onboardingComplete: true,
        isAvailable: true,
        isDummy: true, // Mark as test user
        checkedInVenue: null,
        swipedRight: [],
        swipedLeft: [],
        matches: [],
        preferences: {
          lookingFor: gender === 'male' ? 'female' : 'male',
          ageRange: [18, 40]
        },
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now()
      }

      try {
        await setDoc(doc(db, 'users', uid), userData)
        
        const simUser: SimUser = {
          uid,
          name,
          gender,
          age,
          photos: userData.photos,
          checkedInVenue: null,
          isAvailable: true,
          swipedRight: [],
          swipedLeft: [],
          matches: []
        }
        created.push(simUser)
        
        addLog('success', `✅ נוצר: ${name} (${gender === 'male' ? '👨' : '👩'} ${age})`, uid, name)
      } catch (error) {
        addLog('error', `❌ שגיאה ביצירת ${name}`)
      }
    }
    
    setSimUsers(prev => [...prev, ...created])
    setShowCreatePanel(false)
    addLog('success', `🎉 נוצרו ${created.length} משתמשים בהצלחה!`)
  }

  // Check-in user to venue
  const checkInUser = async (userId: string, venueId: string) => {
    const user = simUsers.find(u => u.uid === userId)
    if (!user) return

    const venue = venues.find(v => v.id === venueId)
    if (!venue) return

    try {
      await updateDoc(doc(db, 'users', userId), {
        checkedInVenue: venueId,
        checkInData: {
          venueId,
          venueName: venue.displayName,
          checkedInAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
        },
        lastActive: Timestamp.now()
      })

      setSimUsers(prev => prev.map(u => 
        u.uid === userId ? { ...u, checkedInVenue: venueId, venueName: venue.displayName } : u
      ))

      addLog('action', `📍 ${user.name} עשה Check-in ל-${venue.displayName}`, userId, user.name)
    } catch (error) {
      addLog('error', `❌ שגיאה ב-Check-in: ${user.name}`)
    }
  }

  // Check-out user
  const checkOutUser = async (userId: string) => {
    const user = simUsers.find(u => u.uid === userId)
    if (!user) return

    try {
      await updateDoc(doc(db, 'users', userId), {
        checkedInVenue: null,
        checkInData: null,
        lastActive: Timestamp.now()
      })

      setSimUsers(prev => prev.map(u => 
        u.uid === userId ? { ...u, checkedInVenue: null, venueName: undefined } : u
      ))

      addLog('action', `🚪 ${user.name} עשה Check-out`, userId, user.name)
    } catch (error) {
      addLog('error', `❌ שגיאה ב-Check-out: ${user.name}`)
    }
  }

  // Swipe right
  const swipeRight = async (fromUserId: string, toUserId: string) => {
    const fromUser = simUsers.find(u => u.uid === fromUserId)
    const toUser = simUsers.find(u => u.uid === toUserId)
    if (!fromUser || !toUser) return

    try {
      // Update swipedRight
      await updateDoc(doc(db, 'users', fromUserId), {
        swipedRight: [...(fromUser.swipedRight || []), toUserId],
        lastActive: Timestamp.now()
      })

      setSimUsers(prev => prev.map(u => 
        u.uid === fromUserId ? { ...u, swipedRight: [...u.swipedRight, toUserId] } : u
      ))

      addLog('action', `💚 ${fromUser.name} עשה Swipe Right על ${toUser.name}`, fromUserId, fromUser.name)

      // Check for match
      if (toUser.swipedRight.includes(fromUserId)) {
        await createMatch(fromUserId, toUserId)
      }
    } catch (error) {
      addLog('error', `❌ שגיאה ב-Swipe`)
    }
  }

  // Create match
  const createMatch = async (userId1: string, userId2: string) => {
    const user1 = simUsers.find(u => u.uid === userId1)
    const user2 = simUsers.find(u => u.uid === userId2)
    if (!user1 || !user2) return

    const matchId = [userId1, userId2].sort().join('_')

    try {
      await setDoc(doc(db, 'matches', matchId), {
        users: [userId1, userId2],
        userDetails: {
          [userId1]: { name: user1.name, photo: user1.photos[0] },
          [userId2]: { name: user2.name, photo: user2.photos[0] }
        },
        status: 'active',
        createdAt: Timestamp.now(),
        lastActivity: Timestamp.now()
      })

      // Update both users
      await updateDoc(doc(db, 'users', userId1), {
        matches: [...(user1.matches || []), userId2]
      })
      await updateDoc(doc(db, 'users', userId2), {
        matches: [...(user2.matches || []), userId1]
      })

      setSimUsers(prev => prev.map(u => {
        if (u.uid === userId1) return { ...u, matches: [...u.matches, userId2] }
        if (u.uid === userId2) return { ...u, matches: [...u.matches, userId1] }
        return u
      }))

      addLog('match', `🎉 MATCH! ${user1.name} ↔ ${user2.name}`, undefined, undefined)
    } catch (error) {
      addLog('error', `❌ שגיאה ביצירת Match`)
    }
  }

  // Send message
  const sendMessage = async (fromUserId: string, toUserId: string, message: string) => {
    const fromUser = simUsers.find(u => u.uid === fromUserId)
    const toUser = simUsers.find(u => u.uid === toUserId)
    if (!fromUser || !toUser) return

    const chatId = [fromUserId, toUserId].sort().join('_')

    try {
      // Create/update chat
      await setDoc(doc(db, 'chats', chatId), {
        participants: [fromUserId, toUserId],
        lastMessage: message,
        lastMessageBy: fromUserId,
        updatedAt: Timestamp.now()
      }, { merge: true })

      // Add message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: fromUserId,
        text: message,
        timestamp: Timestamp.now(),
        read: false
      })

      addLog('action', `💬 ${fromUser.name} → ${toUser.name}: "${message}"`, fromUserId, fromUser.name)
    } catch (error) {
      addLog('error', `❌ שגיאה בשליחת הודעה`)
    }
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    const user = simUsers.find(u => u.uid === userId)
    if (!user) return

    try {
      await deleteDoc(doc(db, 'users', userId))
      setSimUsers(prev => prev.filter(u => u.uid !== userId))
      addLog('info', `🗑️ נמחק: ${user.name}`, userId, user.name)
    } catch (error) {
      addLog('error', `❌ שגיאה במחיקת ${user.name}`)
    }
  }

  // Delete all sim users
  const deleteAllSimUsers = async () => {
    if (!confirm('למחוק את כל משתמשי הבדיקה?')) return

    addLog('info', `🗑️ מוחק ${simUsers.length} משתמשי בדיקה...`)

    for (const user of simUsers) {
      try {
        await deleteDoc(doc(db, 'users', user.uid))
      } catch (error) {
        console.error('Error deleting:', user.uid)
      }
    }

    setSimUsers([])
    addLog('success', '✅ כל משתמשי הבדיקה נמחקו')
  }

  // Run scenario
  const runScenario = async (scenarioId: string) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) return

    setIsRunning(true)
    addLog('info', `🎬 מתחיל תרחיש: ${scenario.name}`)

    try {
      switch (scenarioId) {
        case 'basic-match':
          await runBasicMatchScenario()
          break
        case 'full-flow':
          await runFullFlowScenario()
          break
        case 'stress-test':
          await runStressTest(50)
          break
        case 'mega-test':
          await runStressTest(100)
          break
      }
      addLog('success', `✅ תרחיש "${scenario.name}" הושלם!`)
    } catch (error) {
      addLog('error', `❌ תרחיש נכשל: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  // Basic match scenario
  const runBasicMatchScenario = async () => {
    // Create 2 users
    setCreateCount(2)
    setCreateGender('mixed')
    await createDummyUsers()
    
    await new Promise(r => setTimeout(r, 1000))

    // Get the two newest users
    const males = simUsers.filter(u => u.gender === 'male').slice(-1)
    const females = simUsers.filter(u => u.gender === 'female').slice(-1)
    
    if (males.length > 0 && females.length > 0 && selectedVenue) {
      // Check-in both
      await checkInUser(males[0].uid, selectedVenue)
      await checkInUser(females[0].uid, selectedVenue)
      
      await new Promise(r => setTimeout(r, 500))
      
      // Swipe right both
      await swipeRight(males[0].uid, females[0].uid)
      await swipeRight(females[0].uid, males[0].uid)
    }
  }

  // Full flow scenario
  const runFullFlowScenario = async () => {
    await runBasicMatchScenario()
    
    await new Promise(r => setTimeout(r, 1000))
    
    // Send messages
    const males = simUsers.filter(u => u.gender === 'male').slice(-1)
    const females = simUsers.filter(u => u.gender === 'female').slice(-1)
    
    if (males.length > 0 && females.length > 0) {
      await sendMessage(males[0].uid, females[0].uid, 'היי! מה נשמע? 😊')
      await new Promise(r => setTimeout(r, 500))
      await sendMessage(females[0].uid, males[0].uid, 'הכל טוב! איזה יופי שנפגשנו 🎉')
    }
  }

  // Stress test
  const runStressTest = async (count: number) => {
    addLog('info', `🔥 מתחיל בדיקת עומסים עם ${count} משתמשים...`)

    // Create users in batches
    const batchSize = 10
    for (let i = 0; i < count; i += batchSize) {
      setCreateCount(Math.min(batchSize, count - i))
      setCreateGender('mixed')
      await createDummyUsers()
      await new Promise(r => setTimeout(r, 200))
    }

    addLog('info', '📍 מבצע Check-in לכולם...')
    
    // Check-in all to selected venue
    if (selectedVenue) {
      for (const user of simUsers.slice(-count)) {
        await checkInUser(user.uid, selectedVenue)
        await new Promise(r => setTimeout(r, 50))
      }
    }

    addLog('info', '💚 מבצע Swipes אקראיים...')
    
    // Random swipes
    const recentUsers = simUsers.slice(-count)
    const males = recentUsers.filter(u => u.gender === 'male')
    const females = recentUsers.filter(u => u.gender === 'female')

    for (const male of males.slice(0, 10)) {
      for (const female of females.slice(0, 10)) {
        if (Math.random() > 0.5) {
          await swipeRight(male.uid, female.uid)
        }
        if (Math.random() > 0.5) {
          await swipeRight(female.uid, male.uid)
        }
        await new Promise(r => setTimeout(r, 30))
      }
    }

    addLog('success', `🎉 בדיקת עומסים הושלמה!`)
  }

  // Export logs
  const exportLogs = () => {
    const logText = logs.map(l => 
      `[${l.timestamp.toLocaleTimeString()}] ${l.type.toUpperCase()}: ${l.message}`
    ).join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulator-log-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d2920] via-[#1a4d3e] to-[#0d2920] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">טוען סימולטור...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-[#4ade80]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super')}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  🧪 Test Simulator
                </h1>
                <p className="text-white/50 text-sm">סימולציה ובדיקות מקיפות</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Venue Selector */}
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
              >
                {venues.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#1a4d3e]">
                    {v.displayName}
                  </option>
                ))}
              </select>

              <Button
                onClick={() => router.push('/admin/super/simulator/visual')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                📱 Visual Mode
              </Button>

              <Button
                onClick={() => router.push('/admin/super/simulator/club')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold"
              >
                <Zap className="h-4 w-4 mr-2" />
                🎬 Club Simulator
              </Button>

              <Button
                onClick={() => setShowCreatePanel(true)}
                className="bg-[#4ade80] hover:bg-[#3bc970] text-black font-bold"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                צור משתמשים
              </Button>

              <Button
                onClick={deleteAllSimUsers}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                מחק הכל
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Panel - Users */}
          <div className="col-span-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Users className="h-6 w-6 text-[#4ade80] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{simUsers.length}</div>
                <div className="text-white/50 text-xs">משתמשי בדיקה</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <MapPin className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {simUsers.filter(u => u.checkedInVenue).length}
                </div>
                <div className="text-white/50 text-xs">Checked-in</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Heart className="h-6 w-6 text-pink-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {simUsers.reduce((sum, u) => sum + u.matches.length, 0) / 2}
                </div>
                <div className="text-white/50 text-xs">Matches</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Activity className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{logs.length}</div>
                <div className="text-white/50 text-xs">פעולות</div>
              </div>
            </div>

            {/* Users Grid */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[#4ade80]" />
                משתמשי בדיקה ({simUsers.length})
              </h2>

              {simUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">אין משתמשי בדיקה</p>
                  <p className="text-white/30 text-sm">לחץ "צור משתמשים" להתחיל</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
                  {simUsers.map(user => (
                    <motion.div
                      key={user.uid}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`bg-gradient-to-br ${
                        user.gender === 'male' 
                          ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30' 
                          : 'from-pink-500/20 to-pink-600/10 border-pink-500/30'
                      } border rounded-xl p-3 relative group`}
                    >
                      {/* User Avatar */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                          {user.photos[0] ? (
                            <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-500 flex items-center justify-center text-white text-lg">
                              {user.gender === 'male' ? '👨' : '👩'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm truncate">{user.name}</div>
                          <div className="text-white/50 text-xs">{user.age} שנים</div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-1 mb-2">
                        {user.checkedInVenue ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Checked-in
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                            Available
                          </span>
                        )}
                        {user.matches.length > 0 && (
                          <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded-full">
                            {user.matches.length} 💕
                          </span>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-1">
                        {!user.checkedInVenue ? (
                          <Button
                            size="sm"
                            onClick={() => checkInUser(user.uid, selectedVenue)}
                            className="h-6 px-2 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400"
                          >
                            📍 In
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => checkOutUser(user.uid)}
                            className="h-6 px-2 text-xs bg-orange-500/20 hover:bg-orange-500/40 text-orange-400"
                          >
                            🚪 Out
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => deleteUser(user.uid)}
                          className="h-6 px-2 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400"
                        >
                          🗑️
                        </Button>
                      </div>

                      {/* Swipe buttons - show other gender users */}
                      {user.checkedInVenue && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="text-white/40 text-xs mb-1">Swipe על:</div>
                          <div className="flex flex-wrap gap-1">
                            {simUsers
                              .filter(u => u.gender !== user.gender && u.checkedInVenue && !user.swipedRight.includes(u.uid))
                              .slice(0, 3)
                              .map(target => (
                                <Button
                                  key={target.uid}
                                  size="sm"
                                  onClick={() => swipeRight(user.uid, target.uid)}
                                  className="h-6 px-2 text-xs bg-pink-500/20 hover:bg-pink-500/40 text-pink-400"
                                >
                                  💚 {target.name.split('_')[0]}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Logs & Scenarios */}
          <div className="col-span-4 space-y-4">
            {/* Scenarios */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                תרחישים אוטומטיים
              </h2>
              
              <div className="space-y-2">
                {SCENARIOS.map(scenario => (
                  <Button
                    key={scenario.id}
                    onClick={() => runScenario(scenario.id)}
                    disabled={isRunning}
                    className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  >
                    <span className="mr-2">{scenario.name}</span>
                    {isRunning && <div className="ml-auto w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  </Button>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#4ade80]" />
                  Activity Log
                </h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setLogs([])}
                    variant="ghost"
                    className="text-white/50 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportLogs}
                    variant="ghost"
                    className="text-white/50 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div 
                ref={logContainerRef}
                className="h-[400px] overflow-y-auto space-y-1 font-mono text-xs"
              >
                {logs.length === 0 ? (
                  <div className="text-center text-white/30 py-8">
                    אין פעולות עדיין...
                  </div>
                ) : (
                  logs.map(log => (
                    <div
                      key={log.id}
                      className={`px-2 py-1 rounded ${
                        log.type === 'error' ? 'bg-red-500/20 text-red-300' :
                        log.type === 'success' ? 'bg-green-500/20 text-green-300' :
                        log.type === 'match' ? 'bg-pink-500/20 text-pink-300' :
                        log.type === 'action' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-white/5 text-white/60'
                      }`}
                    >
                      <span className="text-white/40">[{log.timestamp.toLocaleTimeString('he-IL')}]</span>{' '}
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Users Modal */}
      <AnimatePresence>
        {showCreatePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreatePanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] border-2 border-[#4ade80]/30 rounded-2xl p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-bold text-white mb-4">צור משתמשי בדיקה</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm block mb-2">כמות</label>
                  <div className="flex gap-2">
                    {[2, 5, 10, 20, 50].map(n => (
                      <Button
                        key={n}
                        onClick={() => setCreateCount(n)}
                        className={`flex-1 ${
                          createCount === n 
                            ? 'bg-[#4ade80] text-black' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm block mb-2">מגדר</label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCreateGender('mixed')}
                      className={`flex-1 ${
                        createGender === 'mixed' 
                          ? 'bg-[#4ade80] text-black' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      👫 מעורב
                    </Button>
                    <Button
                      onClick={() => setCreateGender('male')}
                      className={`flex-1 ${
                        createGender === 'male' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      👨 גברים
                    </Button>
                    <Button
                      onClick={() => setCreateGender('female')}
                      className={`flex-1 ${
                        createGender === 'female' 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      👩 נשים
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={createDummyUsers}
                  className="w-full bg-gradient-to-r from-[#4ade80] to-[#3bc970] text-black font-bold py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  צור {createCount} משתמשים
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
