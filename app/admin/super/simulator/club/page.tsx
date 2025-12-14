"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Users, Play, Pause, RotateCcw, ArrowLeft, Heart, X, MessageSquare,
  MapPin, Smartphone, Zap, Activity, ChevronLeft, Check, Sparkles,
  Battery, Wifi, Signal, AlertTriangle, Volume2, VolumeX, Settings,
  Eye, SkipForward, Music, Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { 
  collection, getDocs, doc, setDoc, updateDoc, query, where,
  Timestamp, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { getAdminData } from '@/lib/admin-auth'

// ═══════════════════════════════════════════════════════════════════════
//                         TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════

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
  // Club position
  x?: number
  y?: number
  dancing?: boolean
}

interface LogEntry {
  id: string
  timestamp: Date
  type: 'info' | 'swipe' | 'match' | 'checkin' | 'message' | 'error' | 'warning' | 'success'
  message: string
  emoji: string
  critical?: boolean
}

interface Venue {
  id: string
  name: string
  displayName: string
}

interface TestResult {
  passed: number
  failed: number
  errors: string[]
}

// ═══════════════════════════════════════════════════════════════════════
//                         PHONE FRAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const PhoneFrame = ({ 
  children, 
  userName,
  userGender,
  isActive,
  notification
}: { 
  children: React.ReactNode
  userName: string
  userGender: 'male' | 'female'
  isActive?: boolean
  notification?: string | null
}) => {
  const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  
  return (
    <div className="relative">
      {/* Glow effect when active */}
      {isActive && (
        <motion.div
          className="absolute -inset-4 rounded-[50px] opacity-50"
          style={{
            background: `radial-gradient(circle, ${userGender === 'male' ? '#3b82f6' : '#ec4899'}40, transparent 70%)`
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Phone outer frame */}
      <div className={`w-[280px] h-[560px] bg-black rounded-[40px] p-2.5 shadow-2xl border-4 ${
        isActive ? 'border-[#4ade80]' : 'border-gray-800'
      } transition-colors duration-300`}>
        {/* Phone inner screen */}
        <div className="w-full h-full bg-gradient-to-b from-[#0d2920] to-black rounded-[32px] overflow-hidden relative">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-black/60 backdrop-blur-sm flex items-center justify-between px-5 z-50">
            <span className="text-white text-[10px] font-medium">{time}</span>
            <div className="flex items-center gap-1">
              <Signal className="h-2.5 w-2.5 text-white" />
              <Wifi className="h-2.5 w-2.5 text-white" />
              <Battery className="h-3 w-3 text-white" />
            </div>
          </div>
          
          {/* Dynamic Island */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-50"></div>
          
          {/* Notification popup */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-8 left-2 right-2 z-40 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20"
              >
                <p className="text-white text-xs text-center">{notification}</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Content */}
          <div className="pt-8 h-full">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full"></div>
        </div>
      </div>
      
      {/* User label */}
      <motion.div 
        className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${
          userGender === 'male' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
        }`}
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
      >
        {userGender === 'male' ? '👨' : '👩'} {userName}
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//                         DISCOVER SCREEN
// ═══════════════════════════════════════════════════════════════════════

const DiscoverScreen = ({
  currentUser,
  targetUser,
  onSwipeLeft,
  onSwipeRight,
  isMatched,
  swipeAnimation
}: {
  currentUser: SimUser
  targetUser: SimUser | null
  onSwipeLeft: () => void
  onSwipeRight: () => void
  isMatched: boolean
  swipeAnimation?: 'left' | 'right' | null
}) => {
  // Match celebration screen
  if (isMatched && targetUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Confetti */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#4ade80', '#ec4899', '#3b82f6', '#fbbf24'][i % 4],
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: -20, opacity: 1 }}
            animate={{ 
              y: 600, 
              opacity: 0,
              rotate: Math.random() * 720,
              x: (Math.random() - 0.5) * 100
            }}
            transition={{ 
              duration: 2 + Math.random(), 
              delay: Math.random() * 0.5,
              repeat: Infinity,
              repeatDelay: Math.random() * 2
            }}
          />
        ))}
        
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 10 }}
          className="text-center z-10"
        >
          <motion.div 
            className="text-6xl mb-3"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            🎉
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-1">IT'S A MATCH!</h2>
          <p className="text-[#4ade80] text-sm font-medium">{targetUser.name}</p>
          
          {/* Mini photos */}
          <div className="flex justify-center gap-4 mt-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#4ade80]">
              {currentUser.photos[0] ? (
                <img src={currentUser.photos[0]} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl">
                  {currentUser.gender === 'male' ? '👨' : '👩'}
                </div>
              )}
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="flex items-center text-2xl"
            >
              💚
            </motion.div>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500">
              {targetUser.photos[0] ? (
                <img src={targetUser.photos[0]} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-2xl">
                  {targetUser.gender === 'male' ? '👨' : '👩'}
                </div>
              )}
            </div>
          </div>
          
          <Button className="mt-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            שלח הודעה
          </Button>
        </motion.div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <motion.div 
          className="text-5xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🦎
        </motion.div>
        <p className="text-white/60 text-center text-sm">אין משתמשים זמינים</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#4ade80] flex items-center justify-center">
            <span className="text-sm">🦎</span>
          </div>
          <span className="text-white font-bold text-sm">Discover</span>
        </div>
        {currentUser.checkedInVenue && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#4ade80]/20 rounded-full">
            <MapPin className="h-2.5 w-2.5 text-[#4ade80]" />
            <span className="text-[#4ade80] text-[10px]">Checked-in</span>
          </div>
        )}
      </div>

      {/* Card */}
      <div className="flex-1 px-3 pb-3">
        <motion.div
          key={targetUser.uid}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            x: swipeAnimation === 'left' ? -300 : swipeAnimation === 'right' ? 300 : 0,
            rotate: swipeAnimation === 'left' ? -20 : swipeAnimation === 'right' ? 20 : 0
          }}
          transition={{ duration: 0.3 }}
          className="h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden relative"
        >
          {/* Swipe indicators */}
          <AnimatePresence>
            {swipeAnimation === 'right' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-4 z-20 px-4 py-2 border-4 border-[#4ade80] rounded-lg rotate-[-20deg]"
              >
                <span className="text-[#4ade80] font-black text-xl">LIKE</span>
              </motion.div>
            )}
            {swipeAnimation === 'left' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 right-4 z-20 px-4 py-2 border-4 border-red-500 rounded-lg rotate-[20deg]"
              >
                <span className="text-red-500 font-black text-xl">NOPE</span>
              </motion.div>
            )}
          </AnimatePresence>
          
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
                <span className="text-7xl">{targetUser.gender === 'male' ? '👨' : '👩'}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          </div>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-xl font-black text-white">
              {targetUser.name}, {targetUser.age}
            </h3>
            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
              {targetUser.bio || 'מחפש/ת הרפתקאות 🌟'}
            </p>
            
            {/* Hobbies */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(targetUser.hobbies?.length > 0 ? targetUser.hobbies : ['מוזיקה', 'יוגה', 'בישול']).slice(0, 3).map((hobby, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-white/20 rounded-full text-white text-[10px]">
                  {hobby}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-5 mt-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSwipeLeft}
                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-red-500/50"
              >
                <X className="h-6 w-6 text-red-500" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSwipeRight}
                className="w-12 h-12 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center shadow-lg shadow-[#4ade80]/30"
              >
                <Heart className="h-6 w-6 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//                         CLUB VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════

const ClubVisualization = ({
  users,
  focusedUsers,
  matches,
  isPlaying
}: {
  users: SimUser[]
  focusedUsers: [string | null, string | null]
  matches: Array<{ user1: string, user2: string }>
  isPlaying: boolean
}) => {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#061510] rounded-2xl overflow-hidden border border-[#4ade80]/20">
      {/* Club ambient lights */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Spotlight effects */}
        <motion.div
          className="absolute w-[200px] h-[400px] opacity-20"
          style={{
            background: 'linear-gradient(180deg, #4ade80 0%, transparent 100%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 300, 0],
            rotate: [0, 15, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 w-[200px] h-[400px] opacity-20"
          style={{
            background: 'linear-gradient(180deg, #ec4899 0%, transparent 100%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, -300, 0],
            rotate: [0, -15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Disco ball effect */}
        <motion.div
          className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 45}deg) translateY(-12px)`,
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
            />
          ))}
        </motion.div>
      </div>

      {/* Bar counter at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-12 bg-gradient-to-b from-amber-900/80 to-amber-950/80 rounded-b-2xl border-x border-b border-amber-700/50 flex items-center justify-center">
        <span className="text-amber-400 font-bold text-sm flex items-center gap-2">
          🍸 IGUANA BAR 🦎
        </span>
      </div>

      {/* Dance floor grid */}
      <div className="absolute inset-x-8 top-20 bottom-8 border border-[#4ade80]/10 rounded-xl">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-6">
          {[...Array(48)].map((_, i) => (
            <motion.div
              key={i}
              className="border border-[#4ade80]/5"
              animate={isPlaying ? { 
                backgroundColor: ['rgba(74, 222, 128, 0)', 'rgba(74, 222, 128, 0.05)', 'rgba(74, 222, 128, 0)']
              } : {}}
              transition={{ duration: 2, delay: Math.random() * 2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>

      {/* Users on dance floor */}
      {users.map((user) => {
        const isFocused = focusedUsers.includes(user.uid)
        const isInMatch = matches.some(m => m.user1 === user.uid || m.user2 === user.uid)
        
        return (
          <motion.div
            key={user.uid}
            className="absolute"
            style={{
              left: `${(user.x || Math.random() * 80 + 10)}%`,
              top: `${(user.y || Math.random() * 60 + 25)}%`,
            }}
            animate={isPlaying && user.dancing ? {
              y: [0, -5, 0],
              rotate: [-3, 3, -3],
            } : {}}
            transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
          >
            {/* User avatar */}
            <motion.div
              className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg cursor-pointer transition-all ${
                isFocused 
                  ? 'ring-2 ring-[#4ade80] ring-offset-2 ring-offset-[#0d2920] scale-125 z-20' 
                  : isInMatch
                    ? 'ring-2 ring-pink-500'
                    : ''
              } ${
                user.gender === 'male' 
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                  : 'bg-gradient-to-br from-pink-400 to-pink-600'
              }`}
              whileHover={{ scale: 1.2 }}
            >
              {user.photos[0] ? (
                <img src={user.photos[0]} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{user.gender === 'male' ? '👨' : '👩'}</span>
              )}
              
              {/* Check-in indicator */}
              {user.checkedInVenue && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4ade80] rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-black" />
                </div>
              )}
            </motion.div>
            
            {/* Name tooltip */}
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-black/80 rounded text-[10px] text-white whitespace-nowrap"
              >
                {user.name}
              </motion.div>
            )}
          </motion.div>
        )
      })}

      {/* Match lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {matches.map((match, i) => {
          const user1 = users.find(u => u.uid === match.user1)
          const user2 = users.find(u => u.uid === match.user2)
          if (!user1 || !user2) return null
          
          return (
            <motion.line
              key={i}
              x1={`${user1.x || 50}%`}
              y1={`${user1.y || 50}%`}
              x2={`${user2.x || 50}%`}
              y2={`${user2.y || 50}%`}
              stroke="#ec4899"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 1 }}
            />
          )
        })}
      </svg>

      {/* Stats overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-white/60">
        <span>{users.filter(u => u.checkedInVenue).length} checked-in</span>
        <span>{matches.length} matches</span>
        <span>{users.length} total</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//                         MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function ClubSimulatorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [simUsers, setSimUsers] = useState<SimUser[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  
  // Phone states
  const [leftUser, setLeftUser] = useState<SimUser | null>(null)
  const [rightUser, setRightUser] = useState<SimUser | null>(null)
  const [showLeftMatch, setShowLeftMatch] = useState(false)
  const [showRightMatch, setShowRightMatch] = useState(false)
  const [leftSwipe, setLeftSwipe] = useState<'left' | 'right' | null>(null)
  const [rightSwipe, setRightSwipe] = useState<'left' | 'right' | null>(null)
  const [leftNotification, setLeftNotification] = useState<string | null>(null)
  const [rightNotification, setRightNotification] = useState<string | null>(null)
  
  // Simulation states
  const [isPlaying, setIsPlaying] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1000) // ms between actions
  const [activeMatches, setActiveMatches] = useState<Array<{ user1: string, user2: string }>>([])
  const [testResults, setTestResults] = useState<TestResult>({ passed: 0, failed: 0, errors: [] })
  const [isPaused, setIsPaused] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  const logContainerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<NodeJS.Timeout | null>(null)

  // ═══════════════════════════════════════════════════════════════════════
  //                         LOGGING SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  const addLog = useCallback((type: LogEntry['type'], message: string, emoji: string, critical = false) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      message,
      emoji,
      critical
    }
    setLogs(prev => [entry, ...prev].slice(0, 100))
    
    // Auto-pause on critical errors
    if (critical && isPlaying) {
      setIsPaused(true)
      setTestResults(prev => ({
        ...prev,
        failed: prev.failed + 1,
        errors: [...prev.errors, message]
      }))
    }
  }, [isPlaying])

  // ═══════════════════════════════════════════════════════════════════════
  //                         DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════

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
            matches: data.matches || [],
            // Random positions in club
            x: Math.random() * 70 + 15,
            y: Math.random() * 50 + 30,
            dancing: Math.random() > 0.3
          })
        })
        setSimUsers(usersData)

        // Set default users
        const males = usersData.filter(u => u.gender === 'male')
        const females = usersData.filter(u => u.gender === 'female')
        if (males.length > 0) setLeftUser(males[0])
        if (females.length > 0) setRightUser(females[0])

        addLog('success', `🎉 נטענו ${usersData.length} משתמשים`, '📊')
        addLog('info', `📍 ${venuesData.length} מקומות זמינים`, '🏠')

      } catch (error) {
        console.error('Error:', error)
        addLog('error', 'שגיאה בטעינה', '❌', true)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, addLog])

  // ═══════════════════════════════════════════════════════════════════════
  //                         USER ACTIONS
  // ═══════════════════════════════════════════════════════════════════════

  const checkInUser = async (user: SimUser) => {
    if (!selectedVenue) {
      addLog('error', 'לא נבחר מקום', '❌', true)
      return false
    }

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

      const updatedUser = { ...user, checkedInVenue: selectedVenue.id, venueName: selectedVenue.displayName }
      setSimUsers(prev => prev.map(u => u.uid === user.uid ? updatedUser : u))
      if (leftUser?.uid === user.uid) setLeftUser(updatedUser)
      if (rightUser?.uid === user.uid) setRightUser(updatedUser)

      addLog('checkin', `${user.name} עשה Check-in`, '📍')
      setTestResults(prev => ({ ...prev, passed: prev.passed + 1 }))
      return true
    } catch (error: any) {
      addLog('error', `Check-in נכשל: ${error.message}`, '❌', true)
      return false
    }
  }

  const swipeRight = async (fromUser: SimUser, toUser: SimUser) => {
    try {
      // Validation
      if (!fromUser.checkedInVenue) {
        addLog('warning', `${fromUser.name} לא עשה Check-in - צריך לעשות Check-in קודם`, '⚠️')
        return false
      }

      await updateDoc(doc(db, 'users', fromUser.uid), {
        swipedRight: arrayUnion(toUser.uid)
      })

      const updatedFromUser = { ...fromUser, swipedRight: [...fromUser.swipedRight, toUser.uid] }
      setSimUsers(prev => prev.map(u => u.uid === fromUser.uid ? updatedFromUser : u))
      if (leftUser?.uid === fromUser.uid) setLeftUser(updatedFromUser)
      if (rightUser?.uid === fromUser.uid) setRightUser(updatedFromUser)

      addLog('swipe', `${fromUser.name} 💚 ${toUser.name}`, '💚')
      setTestResults(prev => ({ ...prev, passed: prev.passed + 1 }))

      // Check for match
      if (toUser.swipedRight.includes(fromUser.uid)) {
        await createMatch(fromUser, toUser)
      }
      return true
    } catch (error: any) {
      addLog('error', `Swipe נכשל: ${error.message}`, '❌', true)
      return false
    }
  }

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
      return true
    } catch (error: any) {
      addLog('error', `Swipe נכשל: ${error.message}`, '❌', true)
      return false
    }
  }

  const createMatch = async (user1: SimUser, user2: SimUser) => {
    const matchId = [user1.uid, user2.uid].sort().join('_')

    try {
      await setDoc(doc(db, 'matches', matchId), {
        users: [user1.uid, user2.uid],
        userDetails: {
          [user1.uid]: { name: user1.name, photo: user1.photos[0] || '' },
          [user2.uid]: { name: user2.name, photo: user2.photos[0] || '' }
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

      // Update focused users
      if (leftUser?.uid === user1.uid) {
        setLeftUser(updatedUser1)
        setShowLeftMatch(true)
        setLeftNotification(`🎉 Match עם ${user2.name}!`)
      }
      if (rightUser?.uid === user1.uid) {
        setRightUser(updatedUser1)
        setShowRightMatch(true)
        setRightNotification(`🎉 Match עם ${user2.name}!`)
      }
      if (leftUser?.uid === user2.uid) {
        setLeftUser(updatedUser2)
        setShowLeftMatch(true)
        setLeftNotification(`🎉 Match עם ${user1.name}!`)
      }
      if (rightUser?.uid === user2.uid) {
        setRightUser(updatedUser2)
        setShowRightMatch(true)
        setRightNotification(`🎉 Match עם ${user1.name}!`)
      }

      // Add to active matches for visualization
      setActiveMatches(prev => [...prev, { user1: user1.uid, user2: user2.uid }])

      addLog('match', `🎉 MATCH! ${user1.name} ↔ ${user2.name}`, '🎉')
      setTestResults(prev => ({ ...prev, passed: prev.passed + 1 }))

      // Clear notifications after 3 seconds
      setTimeout(() => {
        setLeftNotification(null)
        setRightNotification(null)
      }, 3000)

      // Clear match screen after 4 seconds
      setTimeout(() => {
        setShowLeftMatch(false)
        setShowRightMatch(false)
      }, 4000)

      return true
    } catch (error: any) {
      addLog('error', `Match נכשל: ${error.message}`, '❌', true)
      return false
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //                         SIMULATION ENGINE
  // ═══════════════════════════════════════════════════════════════════════

  const runAutoSimulation = useCallback(async () => {
    if (!leftUser || !rightUser || isPaused) return

    const actions = [
      'checkin_left',
      'checkin_right', 
      'swipe_right_left',
      'swipe_right_right'
    ]

    const action = actions[Math.floor(Math.random() * actions.length)]

    switch (action) {
      case 'checkin_left':
        if (!leftUser.checkedInVenue) {
          await checkInUser(leftUser)
        }
        break
      case 'checkin_right':
        if (!rightUser.checkedInVenue) {
          await checkInUser(rightUser)
        }
        break
      case 'swipe_right_left':
        if (leftUser.checkedInVenue && !leftUser.swipedRight.includes(rightUser.uid)) {
          setLeftSwipe('right')
          setTimeout(() => setLeftSwipe(null), 500)
          await swipeRight(leftUser, rightUser)
        }
        break
      case 'swipe_right_right':
        if (rightUser.checkedInVenue && !rightUser.swipedRight.includes(leftUser.uid)) {
          setRightSwipe('right')
          setTimeout(() => setRightSwipe(null), 500)
          await swipeRight(rightUser, leftUser)
        }
        break
    }
  }, [leftUser, rightUser, isPaused])

  // Auto simulation loop
  useEffect(() => {
    if (isPlaying && !isPaused) {
      simulationRef.current = setInterval(runAutoSimulation, simulationSpeed)
    } else {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }
    }
  }, [isPlaying, isPaused, simulationSpeed, runAutoSimulation])

  // Quick actions
  const checkBothIn = async () => {
    if (leftUser && !leftUser.checkedInVenue) await checkInUser(leftUser)
    if (rightUser && !rightUser.checkedInVenue) await checkInUser(rightUser)
  }

  const autoMatchFlow = async () => {
    if (!leftUser || !rightUser) return
    
    addLog('info', '🚀 מתחיל תרחיש Match אוטומטי...', '🤖')
    
    // Step 1: Check-in both
    if (!leftUser.checkedInVenue) {
      await checkInUser(leftUser)
      await new Promise(r => setTimeout(r, 500))
    }
    if (!rightUser.checkedInVenue) {
      await checkInUser(rightUser)
      await new Promise(r => setTimeout(r, 500))
    }
    
    // Step 2: Left swipes right
    setLeftSwipe('right')
    await new Promise(r => setTimeout(r, 300))
    await swipeRight(leftUser, rightUser)
    setLeftSwipe(null)
    await new Promise(r => setTimeout(r, 500))
    
    // Step 3: Right swipes right (creates match)
    setRightSwipe('right')
    await new Promise(r => setTimeout(r, 300))
    await swipeRight(rightUser, leftUser)
    setRightSwipe(null)
  }

  const resetSimulation = async () => {
    setIsPlaying(false)
    setIsPaused(false)
    setActiveMatches([])
    setShowLeftMatch(false)
    setShowRightMatch(false)
    setTestResults({ passed: 0, failed: 0, errors: [] })
    setLogs([])
    addLog('info', '🔄 סימולציה אופסה', '🔄')
  }

  // ═══════════════════════════════════════════════════════════════════════
  //                         RENDER
  // ═══════════════════════════════════════════════════════════════════════

  const males = simUsers.filter(u => u.gender === 'male')
  const females = simUsers.filter(u => u.gender === 'female')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-[#4ade80]" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#0a1f18] to-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#4ade80]/20">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/super/simulator')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                🎬 Club Simulator
                <span className="text-xs font-normal text-[#4ade80] bg-[#4ade80]/20 px-2 py-0.5 rounded-full">
                  HOLLYWOOD
                </span>
              </h1>
              <p className="text-white/50 text-xs">סימולציה ויזואלית - {selectedVenue?.displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Venue selector */}
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

            {/* Sound toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            {/* Speed control */}
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1.5 text-xs"
            >
              <option value={2000} className="bg-[#1a4d3e]">🐢 איטי</option>
              <option value={1000} className="bg-[#1a4d3e]">⚡ רגיל</option>
              <option value={500} className="bg-[#1a4d3e]">🚀 מהיר</option>
            </select>

            {/* Play/Pause */}
            <Button
              onClick={() => {
                if (isPlaying) {
                  setIsPaused(!isPaused)
                } else {
                  setIsPlaying(true)
                  setIsPaused(false)
                }
              }}
              className={`${isPlaying && !isPaused ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#4ade80] hover:bg-[#3bc970]'} text-black font-bold`}
            >
              {isPlaying && !isPaused ? (
                <><Pause className="h-4 w-4 mr-1" /> Pause</>
              ) : (
                <><Play className="h-4 w-4 mr-1" /> Play</>
              )}
            </Button>

            {/* Reset */}
            <Button
              variant="outline"
              onClick={resetSimulation}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-6">
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

        {/* Main Grid */}
        <div className="grid grid-cols-[280px_1fr_280px_320px] gap-6">
          
          {/* Left Phone */}
          <div className="flex flex-col items-center">
            <PhoneFrame 
              userName={leftUser?.name || 'בחר משתמש'} 
              userGender="male"
              isActive={isPlaying && !isPaused}
              notification={leftNotification}
            >
              {leftUser ? (
                <DiscoverScreen
                  currentUser={leftUser}
                  targetUser={rightUser}
                  onSwipeLeft={() => rightUser && swipeLeft(leftUser, rightUser)}
                  onSwipeRight={async () => {
                    if (rightUser) {
                      setLeftSwipe('right')
                      await swipeRight(leftUser, rightUser)
                      setTimeout(() => setLeftSwipe(null), 500)
                    }
                  }}
                  isMatched={showLeftMatch}
                  swipeAnimation={leftSwipe}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40 text-sm">בחר משתמש</p>
                </div>
              )}
            </PhoneFrame>
          </div>

          {/* Club Visualization */}
          <div className="h-[560px]">
            <ClubVisualization
              users={simUsers}
              focusedUsers={[leftUser?.uid || null, rightUser?.uid || null]}
              matches={activeMatches}
              isPlaying={isPlaying && !isPaused}
            />
          </div>

          {/* Right Phone */}
          <div className="flex flex-col items-center">
            <PhoneFrame 
              userName={rightUser?.name || 'בחר משתמש'} 
              userGender="female"
              isActive={isPlaying && !isPaused}
              notification={rightNotification}
            >
              {rightUser ? (
                <DiscoverScreen
                  currentUser={rightUser}
                  targetUser={leftUser}
                  onSwipeLeft={() => leftUser && swipeLeft(rightUser, leftUser)}
                  onSwipeRight={async () => {
                    if (leftUser) {
                      setRightSwipe('right')
                      await swipeRight(rightUser, leftUser)
                      setTimeout(() => setRightSwipe(null), 500)
                    }
                  }}
                  isMatched={showRightMatch}
                  swipeAnimation={rightSwipe}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40 text-sm">בחר משתמש</p>
                </div>
              )}
            </PhoneFrame>
          </div>

          {/* Activity Log & Controls */}
          <div className="space-y-4">
            {/* Test Results */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-400" />
                תוצאות בדיקה
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-green-400">{testResults.passed}</div>
                  <div className="text-green-400/70 text-xs">עברו</div>
                </div>
                <div className="bg-red-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-red-400">{testResults.failed}</div>
                  <div className="text-red-400/70 text-xs">נכשלו</div>
                </div>
              </div>
              {testResults.errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                  <p className="text-red-400 text-xs font-medium mb-1">שגיאות:</p>
                  {testResults.errors.slice(-3).map((err, i) => (
                    <p key={i} className="text-red-300 text-[10px]">• {err}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <h3 className="text-white font-bold mb-2 text-sm">פעולות מהירות</h3>
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
                Auto Match Flow
              </Button>
            </div>

            {/* Activity Log */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 h-[280px] flex flex-col">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-[#4ade80]" />
                Activity Log
              </h3>
              
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-1.5 pr-1"
              >
                {logs.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-2 rounded-lg text-[11px] ${
                      log.type === 'match' ? 'bg-pink-500/20 border border-pink-500/30' :
                      log.type === 'error' ? 'bg-red-500/20 border border-red-500/30' :
                      log.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                      log.type === 'success' ? 'bg-green-500/20 border border-green-500/30' :
                      log.type === 'checkin' ? 'bg-yellow-500/10' :
                      'bg-white/5'
                    }`}
                  >
                    <span className="mr-1">{log.emoji}</span>
                    <span className="text-white/90">{log.message}</span>
                    <div className="text-white/40 text-[9px] mt-0.5">
                      {log.timestamp.toLocaleTimeString('he-IL')}
                    </div>
                  </motion.div>
                ))}
                
                {logs.length === 0 && (
                  <div className="text-center py-6 text-white/30 text-xs">
                    אין פעילות עדיין
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-8 mt-6 py-4 border-t border-white/10">
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
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-500">{activeMatches.length}</div>
            <div className="text-white/50 text-xs">Matches</div>
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
