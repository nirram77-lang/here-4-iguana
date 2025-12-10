"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Play,
  RotateCcw,
  ArrowLeft,
  Heart,
  X,
  MessageSquare,
  MapPin,
  Smartphone,
  Zap,
  Activity,
  ChevronLeft,
  ChevronRight,
  Send,
  Check,
  Sparkles,
  Volume2,
  Battery,
  Wifi,
  Signal
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  addDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { getAdminData } from '@/lib/admin-auth'

interface SimUser {
  uid: string
  name: string
  gender: 'male' | 'female'
  age: number
  photos: string[]
  bio: string
  hobbies: string[]
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
  type: 'info' | 'swipe' | 'match' | 'checkin' | 'message' | 'error'
  message: string
  emoji: string
}

interface Venue {
  id: string
  name: string
  displayName: string
}

// Phone Frame Component
const PhoneFrame = ({ 
  children, 
  userName,
  userGender 
}: { 
  children: React.ReactNode
  userName: string
  userGender: 'male' | 'female'
}) => {
  const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  
  return (
    <div className="relative">
      {/* Phone outer frame */}
      <div className="w-[320px] h-[640px] bg-black rounded-[45px] p-3 shadow-2xl border-4 border-gray-800">
        {/* Phone inner screen */}
        <div className="w-full h-full bg-gradient-to-b from-[#0d2920] to-black rounded-[35px] overflow-hidden relative">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 backdrop-blur-sm flex items-center justify-between px-6 z-50">
            <span className="text-white text-xs font-medium">{time}</span>
            <div className="flex items-center gap-1">
              <Signal className="h-3 w-3 text-white" />
              <Wifi className="h-3 w-3 text-white" />
              <Battery className="h-4 w-4 text-white" />
            </div>
          </div>
          
          {/* Dynamic Island / Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50"></div>
          
          {/* Content */}
          <div className="pt-10 h-full">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
        </div>
      </div>
      
      {/* User label */}
      <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold ${
        userGender === 'male' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
      }`}>
        {userGender === 'male' ? '👨' : '👩'} {userName}
      </div>
    </div>
  )
}

// Discover Screen (Swipe Cards)
const DiscoverScreen = ({
  currentUser,
  targetUser,
  onSwipeLeft,
  onSwipeRight,
  isMatched
}: {
  currentUser: SimUser
  targetUser: SimUser | null
  onSwipeLeft: () => void
  onSwipeRight: () => void
  isMatched: boolean
}) => {
  if (isMatched) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">IT'S A MATCH!</h2>
          <p className="text-white/60 text-sm">התחילו לדבר עכשיו</p>
          <Button className="mt-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            <MessageSquare className="mr-2 h-4 w-4" />
            שלח הודעה
          </Button>
        </motion.div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-4xl mb-4">🦎</div>
        <p className="text-white/60 text-center">אין משתמשים זמינים כרגע</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#4ade80] flex items-center justify-center">
            <span className="text-lg">🦎</span>
          </div>
          <span className="text-white font-bold">Discover</span>
        </div>
        {currentUser.checkedInVenue && (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#4ade80]/20 rounded-full">
            <MapPin className="h-3 w-3 text-[#4ade80]" />
            <span className="text-[#4ade80] text-xs">Checked-in</span>
          </div>
        )}
      </div>

      {/* Card */}
      <div className="flex-1 px-4 pb-4">
        <motion.div
          key={targetUser.uid}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl overflow-hidden relative"
        >
          {/* Photo */}
          <div className="absolute inset-0">
            {targetUser.photos[0] ? (
              <img 
                src={targetUser.photos[0]} 
                alt={targetUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <span className="text-8xl">{targetUser.gender === 'male' ? '👨' : '👩'}</span>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          </div>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-2xl font-black text-white">
              {targetUser.name}, {targetUser.age}
            </h3>
            <p className="text-white/70 text-sm mt-1">{targetUser.bio || 'מחפש/ת הרפתקאות 🌟'}</p>
            
            {/* Hobbies */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(targetUser.hobbies || ['🎵', '🍺', '✈️']).slice(0, 3).map((hobby, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/20 rounded-full text-white text-xs">
                  {hobby}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSwipeLeft}
                className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-red-500/50"
              >
                <X className="h-8 w-8 text-red-500" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSwipeRight}
                className="w-16 h-16 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center shadow-lg shadow-[#4ade80]/30"
              >
                <Heart className="h-8 w-8 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Check-in Screen
const CheckInScreen = ({
  user,
  venue,
  onCheckIn,
  onCheckOut
}: {
  user: SimUser
  venue: Venue | null
  onCheckIn: () => void
  onCheckOut: () => void
}) => {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-[#4ade80] flex items-center justify-center">
          <MapPin className="h-4 w-4 text-black" />
        </div>
        <span className="text-white font-bold">Check-in</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {user.checkedInVenue ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-[#4ade80]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-12 w-12 text-[#4ade80]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Checked In!</h3>
            <p className="text-[#4ade80] text-sm">{venue?.displayName}</p>
            <Button
              onClick={onCheckOut}
              variant="outline"
              className="mt-6 border-red-500/50 text-red-400"
            >
              Check Out
            </Button>
          </motion.div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-12 w-12 text-white/40" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Ready to Check-in?</h3>
            <p className="text-white/60 text-sm mb-6">{venue?.displayName}</p>
            <Button
              onClick={onCheckIn}
              className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-black font-bold"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Check In Now
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VisualSimulatorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [simUsers, setSimUsers] = useState<SimUser[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  
  // Two phone states
  const [leftUser, setLeftUser] = useState<SimUser | null>(null)
  const [rightUser, setRightUser] = useState<SimUser | null>(null)
  const [leftScreen, setLeftScreen] = useState<'discover' | 'checkin'>('discover')
  const [rightScreen, setRightScreen] = useState<'discover' | 'checkin'>('discover')
  const [showMatch, setShowMatch] = useState<'left' | 'right' | null>(null)
  
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Add log
  const addLog = (type: LogEntry['type'], message: string, emoji: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      type,
      message,
      emoji
    }
    setLogs(prev => [entry, ...prev].slice(0, 50))
  }

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/admin/login')
          return
        }

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
          setSelectedVenue(venuesData[0])
        }

        // Load test users
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), where('isDummy', '==', true))
        )
        const usersData: SimUser[] = []
        usersSnapshot.forEach(doc => {
          const data = doc.data()
          usersData.push({
            uid: doc.id,
            name: data.name || 'Test User',
            gender: data.gender || 'male',
            age: data.age || 25,
            photos: data.photos || [],
            bio: data.bio || '',
            hobbies: data.hobbies || [],
            checkedInVenue: data.checkedInVenue || null,
            isAvailable: data.isAvailable !== false,
            swipedRight: data.swipedRight || [],
            swipedLeft: data.swipedLeft || [],
            matches: data.matches || []
          })
        })
        setSimUsers(usersData)

        // Set default users
        const males = usersData.filter(u => u.gender === 'male')
        const females = usersData.filter(u => u.gender === 'female')
        if (males.length > 0) setLeftUser(males[0])
        if (females.length > 0) setRightUser(females[0])

        addLog('info', `נטענו ${usersData.length} משתמשים`, '📊')

      } catch (error) {
        console.error('Error:', error)
        addLog('error', 'שגיאה בטעינה', '❌')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Check-in user
  const checkInUser = async (user: SimUser) => {
    if (!selectedVenue) return

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        checkedInVenue: selectedVenue.id,
        checkInData: {
          venueId: selectedVenue.id,
          venueName: selectedVenue.displayName,
          checkedInAt: Timestamp.now()
        }
      })

      await updateDoc(doc(db, 'venues', selectedVenue.id), {
        checkedInUsers: arrayUnion(user.uid)
      })

      // Update local state
      const updatedUser = { ...user, checkedInVenue: selectedVenue.id, venueName: selectedVenue.displayName }
      setSimUsers(prev => prev.map(u => u.uid === user.uid ? updatedUser : u))
      if (leftUser?.uid === user.uid) setLeftUser(updatedUser)
      if (rightUser?.uid === user.uid) setRightUser(updatedUser)

      addLog('checkin', `${user.name} עשה Check-in`, '📍')
    } catch (error) {
      addLog('error', 'שגיאה ב-Check-in', '❌')
    }
  }

  // Check-out user
  const checkOutUser = async (user: SimUser) => {
    if (!user.checkedInVenue) return

    try {
      const venueId = user.checkedInVenue
      
      await updateDoc(doc(db, 'users', user.uid), {
        checkedInVenue: null,
        checkInData: null
      })

      await updateDoc(doc(db, 'venues', venueId), {
        checkedInUsers: arrayRemove(user.uid)
      })

      const updatedUser = { ...user, checkedInVenue: null, venueName: undefined }
      setSimUsers(prev => prev.map(u => u.uid === user.uid ? updatedUser : u))
      if (leftUser?.uid === user.uid) setLeftUser(updatedUser)
      if (rightUser?.uid === user.uid) setRightUser(updatedUser)

      addLog('info', `${user.name} עשה Check-out`, '👋')
    } catch (error) {
      addLog('error', 'שגיאה ב-Check-out', '❌')
    }
  }

  // Swipe right
  const swipeRight = async (fromUser: SimUser, toUser: SimUser) => {
    try {
      await updateDoc(doc(db, 'users', fromUser.uid), {
        swipedRight: arrayUnion(toUser.uid)
      })

      const updatedFromUser = { ...fromUser, swipedRight: [...fromUser.swipedRight, toUser.uid] }
      setSimUsers(prev => prev.map(u => u.uid === fromUser.uid ? updatedFromUser : u))
      if (leftUser?.uid === fromUser.uid) setLeftUser(updatedFromUser)
      if (rightUser?.uid === fromUser.uid) setRightUser(updatedFromUser)

      addLog('swipe', `${fromUser.name} 💚 ${toUser.name}`, '💚')

      // Check for match
      if (toUser.swipedRight.includes(fromUser.uid)) {
        await createMatch(fromUser, toUser)
      }
    } catch (error) {
      addLog('error', 'שגיאה ב-Swipe', '❌')
    }
  }

  // Swipe left
  const swipeLeft = async (fromUser: SimUser, toUser: SimUser) => {
    try {
      await updateDoc(doc(db, 'users', fromUser.uid), {
        swipedLeft: arrayUnion(toUser.uid)
      })

      const updatedFromUser = { ...fromUser, swipedLeft: [...fromUser.swipedLeft, toUser.uid] }
      setSimUsers(prev => prev.map(u => u.uid === fromUser.uid ? updatedFromUser : u))
      if (leftUser?.uid === fromUser.uid) setLeftUser(updatedFromUser)
      if (rightUser?.uid === fromUser.uid) setRightUser(updatedFromUser)

      addLog('swipe', `${fromUser.name} ❌ ${toUser.name}`, '❌')
    } catch (error) {
      addLog('error', 'שגיאה ב-Swipe', '❌')
    }
  }

  // Create match
  const createMatch = async (user1: SimUser, user2: SimUser) => {
    const matchId = [user1.uid, user2.uid].sort().join('_')

    try {
      await setDoc(doc(db, 'matches', matchId), {
        users: [user1.uid, user2.uid],
        userDetails: {
          [user1.uid]: { name: user1.name, photo: user1.photos[0] },
          [user2.uid]: { name: user2.name, photo: user2.photos[0] }
        },
        status: 'active',
        createdAt: Timestamp.now()
      })

      await updateDoc(doc(db, 'users', user1.uid), {
        matches: arrayUnion(user2.uid)
      })
      await updateDoc(doc(db, 'users', user2.uid), {
        matches: arrayUnion(user1.uid)
      })

      // Update local state
      const updatedUser1 = { ...user1, matches: [...user1.matches, user2.uid] }
      const updatedUser2 = { ...user2, matches: [...user2.matches, user1.uid] }
      
      setSimUsers(prev => prev.map(u => {
        if (u.uid === user1.uid) return updatedUser1
        if (u.uid === user2.uid) return updatedUser2
        return u
      }))

      if (leftUser?.uid === user1.uid) setLeftUser(updatedUser1)
      if (leftUser?.uid === user2.uid) setLeftUser(updatedUser2)
      if (rightUser?.uid === user1.uid) setRightUser(updatedUser1)
      if (rightUser?.uid === user2.uid) setRightUser(updatedUser2)

      // Show match animation
      setShowMatch('left')
      setTimeout(() => setShowMatch('right'), 300)
      setTimeout(() => setShowMatch(null), 3000)

      addLog('match', `🎉 MATCH! ${user1.name} ↔ ${user2.name}`, '🎉')
    } catch (error) {
      addLog('error', 'שגיאה ביצירת Match', '❌')
    }
  }

  // Get target user for discover
  const getTargetForUser = (user: SimUser): SimUser | null => {
    if (!user) return null
    const oppositeGender = user.gender === 'male' ? 'female' : 'male'
    const targets = simUsers.filter(u => 
      u.gender === oppositeGender &&
      u.uid !== user.uid &&
      !user.swipedRight.includes(u.uid) &&
      !user.swipedLeft.includes(u.uid)
    )
    return targets.length > 0 ? targets[0] : null
  }

  // Check both in
  const checkBothIn = async () => {
    if (leftUser) await checkInUser(leftUser)
    if (rightUser) await checkInUser(rightUser)
  }

  // Auto match flow
  const autoMatchFlow = async () => {
    if (!leftUser || !rightUser) return

    addLog('info', '🎬 מתחיל Auto Match...', '🎬')

    // Check both in
    if (!leftUser.checkedInVenue) await checkInUser(leftUser)
    await new Promise(r => setTimeout(r, 500))
    if (!rightUser.checkedInVenue) await checkInUser(rightUser)
    await new Promise(r => setTimeout(r, 500))

    // Swipe right from both sides
    await swipeRight(leftUser, rightUser)
    await new Promise(r => setTimeout(r, 1000))
    await swipeRight(rightUser, leftUser)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4ade80] border-t-transparent mx-auto mb-4"></div>
          <p className="text-white/60">טוען סימולטור...</p>
        </div>
      </div>
    )
  }

  const males = simUsers.filter(u => u.gender === 'male')
  const females = simUsers.filter(u => u.gender === 'female')

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#0a1f18] to-black">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-[#4ade80]/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super/simulator')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[#4ade80]" />
                  Visual Simulator
                </h1>
                <p className="text-white/50 text-xs">סימולציה ויזואלית - שני מובייל</p>
              </div>
            </div>

            {/* Venue Selector */}
            <select
              value={selectedVenue?.id || ''}
              onChange={(e) => setSelectedVenue(venues.find(v => v.id === e.target.value) || null)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm"
            >
              {venues.map(v => (
                <option key={v.id} value={v.id} className="bg-[#1a4d3e]">
                  {v.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* User Selectors */}
        <div className="flex justify-center gap-8 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">טלפון שמאל:</span>
            <select
              value={leftUser?.uid || ''}
              onChange={(e) => setLeftUser(simUsers.find(u => u.uid === e.target.value) || null)}
              className="bg-white/10 border border-blue-500/50 text-white rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="" className="bg-[#1a4d3e]">בחר משתמש</option>
              {males.map(u => (
                <option key={u.uid} value={u.uid} className="bg-[#1a4d3e]">
                  👨 {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">טלפון ימין:</span>
            <select
              value={rightUser?.uid || ''}
              onChange={(e) => setRightUser(simUsers.find(u => u.uid === e.target.value) || null)}
              className="bg-white/10 border border-pink-500/50 text-white rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="" className="bg-[#1a4d3e]">בחר משתמש</option>
              {females.map(u => (
                <option key={u.uid} value={u.uid} className="bg-[#1a4d3e]">
                  👩 {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Phones + Activity Log */}
        <div className="flex justify-center items-start gap-8">
          
          {/* Left Phone */}
          <div className="flex flex-col items-center">
            <PhoneFrame userName={leftUser?.name || 'בחר משתמש'} userGender="male">
              {leftUser ? (
                leftScreen === 'discover' ? (
                  <DiscoverScreen
                    currentUser={leftUser}
                    targetUser={rightUser}
                    onSwipeLeft={() => rightUser && swipeLeft(leftUser, rightUser)}
                    onSwipeRight={() => rightUser && swipeRight(leftUser, rightUser)}
                    isMatched={showMatch === 'left'}
                  />
                ) : (
                  <CheckInScreen
                    user={leftUser}
                    venue={selectedVenue}
                    onCheckIn={() => checkInUser(leftUser)}
                    onCheckOut={() => checkOutUser(leftUser)}
                  />
                )
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40">בחר משתמש</p>
                </div>
              )}
            </PhoneFrame>
            
            {/* Screen Toggle */}
            <div className="flex gap-2 mt-12">
              <Button
                size="sm"
                variant={leftScreen === 'discover' ? 'default' : 'outline'}
                onClick={() => setLeftScreen('discover')}
                className={leftScreen === 'discover' ? 'bg-[#4ade80] text-black' : 'border-white/30 text-white'}
              >
                <Heart className="h-4 w-4 mr-1" />
                Discover
              </Button>
              <Button
                size="sm"
                variant={leftScreen === 'checkin' ? 'default' : 'outline'}
                onClick={() => setLeftScreen('checkin')}
                className={leftScreen === 'checkin' ? 'bg-[#4ade80] text-black' : 'border-white/30 text-white'}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Check-in
              </Button>
            </div>
          </div>

          {/* Activity Log - Center */}
          <div className="w-64">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 h-[640px] flex flex-col">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#4ade80]" />
                Activity Log
              </h3>
              
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-2"
              >
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg text-xs ${
                      log.type === 'match' ? 'bg-pink-500/20 border border-pink-500/30' :
                      log.type === 'error' ? 'bg-red-500/20' :
                      log.type === 'checkin' ? 'bg-yellow-500/10' :
                      'bg-white/5'
                    }`}
                  >
                    <span className="mr-1">{log.emoji}</span>
                    <span className="text-white/90">{log.message}</span>
                    <div className="text-white/40 text-[10px] mt-0.5">
                      {log.timestamp.toLocaleTimeString('he-IL')}
                    </div>
                  </div>
                ))}
                
                {logs.length === 0 && (
                  <div className="text-center py-8 text-white/30 text-sm">
                    אין פעילות עדיין
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <Button
                  onClick={checkBothIn}
                  size="sm"
                  className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                  disabled={!leftUser || !rightUser}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Check-in Both
                </Button>
                <Button
                  onClick={autoMatchFlow}
                  size="sm"
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  disabled={!leftUser || !rightUser}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Auto Match
                </Button>
              </div>
            </div>
          </div>

          {/* Right Phone */}
          <div className="flex flex-col items-center">
            <PhoneFrame userName={rightUser?.name || 'בחר משתמש'} userGender="female">
              {rightUser ? (
                rightScreen === 'discover' ? (
                  <DiscoverScreen
                    currentUser={rightUser}
                    targetUser={leftUser}
                    onSwipeLeft={() => leftUser && swipeLeft(rightUser, leftUser)}
                    onSwipeRight={() => leftUser && swipeRight(rightUser, leftUser)}
                    isMatched={showMatch === 'right'}
                  />
                ) : (
                  <CheckInScreen
                    user={rightUser}
                    venue={selectedVenue}
                    onCheckIn={() => checkInUser(rightUser)}
                    onCheckOut={() => checkOutUser(rightUser)}
                  />
                )
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40">בחר משתמש</p>
                </div>
              )}
            </PhoneFrame>
            
            {/* Screen Toggle */}
            <div className="flex gap-2 mt-12">
              <Button
                size="sm"
                variant={rightScreen === 'discover' ? 'default' : 'outline'}
                onClick={() => setRightScreen('discover')}
                className={rightScreen === 'discover' ? 'bg-[#4ade80] text-black' : 'border-white/30 text-white'}
              >
                <Heart className="h-4 w-4 mr-1" />
                Discover
              </Button>
              <Button
                size="sm"
                variant={rightScreen === 'checkin' ? 'default' : 'outline'}
                onClick={() => setRightScreen('checkin')}
                className={rightScreen === 'checkin' ? 'bg-[#4ade80] text-black' : 'border-white/30 text-white'}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Check-in
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{simUsers.length}</div>
            <div className="text-white/50 text-xs">משתמשי בדיקה</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{males.length}</div>
            <div className="text-white/50 text-xs">👨 גברים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400">{females.length}</div>
            <div className="text-white/50 text-xs">👩 נשים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4ade80]">
              {simUsers.filter(u => u.checkedInVenue).length}
            </div>
            <div className="text-white/50 text-xs">Checked-in</div>
          </div>
        </div>

        {/* No users message */}
        {simUsers.length === 0 && (
          <div className="text-center py-8 mt-4">
            <p className="text-white/60 mb-4">אין משתמשי בדיקה. צור קודם בסימולטור הרגיל.</p>
            <Button
              onClick={() => router.push('/admin/super/simulator')}
              className="bg-[#4ade80] text-black"
            >
              <Users className="mr-2 h-4 w-4" />
              לך לסימולטור
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
