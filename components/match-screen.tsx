"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Heart, MapPin, User as UserIcon, MessageCircle, ChevronLeft, ChevronRight, Crown, Check, Sparkles, Bell, Home, Clock } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { chatHasMessages, clearChatMessages } from "@/lib/chat-system"
import UserProfileModal from "./user-profile-modal"
import WeAreMeetingModal from "./we-are-meeting-modal"

interface MatchScreenProps {
  user: any
  onContinue: () => void
  onMeetNow: () => void
  onMarkMatchSuccessful?: () => void  // ✅ "She Decides" - Mark match as successful
  onWeAreMeetingModalClose?: () => void  // ✅ NEW: Called when she closes the celebration modal
  passesLeft: number
  onPass: () => void
  isPremium?: boolean
  timeRemaining: number
  onSkipTimer?: () => void
  onNavigate?: (screen: any) => void
  onUpgradePremium?: () => void
  onBuyOnePass?: () => void
  passResetTime?: Date
  isNewMatch?: boolean
  currentUserGender?: 'male' | 'female'  // ✅ "She Decides" - Only women can click "We're Meeting!"
}

interface UserProfile {
  name?: string           // ✅ ADDED: name from onboarding
  displayName: string
  photoURL: string
  photos?: string[]
  bio?: string
  age?: number
  hobbies?: string[]
}

export default function MatchScreen({
  user,
  onContinue,
  onMeetNow,
  onMarkMatchSuccessful,  // ✅ "She Decides" - Only women click this
  onWeAreMeetingModalClose,  // ✅ NEW: Close modal → return to home
  passesLeft,
  onPass,
  isPremium = false,
  timeRemaining,
  onSkipTimer,
  onNavigate,
  onUpgradePremium,
  onBuyOnePass,
  passResetTime,
  isNewMatch = false,
  currentUserGender = 'male'  // ✅ "She Decides" - Default to male (button disabled)
}: MatchScreenProps) {
  const [showPremiumOffer, setShowPremiumOffer] = useState(false)
  const [premiumOfferShownAt, setPremiumOfferShownAt] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [matchedUserProfile, setMatchedUserProfile] = useState<UserProfile | null>(null)
  const [showProfile, setShowProfile] = useState<'none' | 'current' | 'matched'>('none')
  const [showSendMessageConfirm, setShowSendMessageConfirm] = useState(false)
  const [loadedMatchedUserId, setLoadedMatchedUserId] = useState<string | null>(null)
  const [hasActiveChat, setHasActiveChat] = useState(false)
  const [showWeAreMeetingModal, setShowWeAreMeetingModal] = useState(false)
  
  // ✅ "She Decides" - Only women can initiate meeting
  const canInitiateMeeting = currentUserGender === 'female'
  
  // ✅ NEW: Track time until next pass
  const [timeUntilNextPass, setTimeUntilNextPass] = useState<number>(0)

  // 🔊 SOUND: Match celebration sound effect
  const matchSoundRef = useRef<HTMLAudioElement | null>(null)
  
  // 🔒 SCREEN WAKE LOCK: Keep screen on during match (10 minutes)
  const wakeLockRef = useRef<any>(null)
  const noSleepRef = useRef<any>(null)  // ✅ NEW: Fallback for browsers without Wake Lock API
  
  useEffect(() => {
    // ✅ IMPROVED: Multiple strategies to keep screen awake
    const requestWakeLock = async () => {
      try {
        // Strategy 1: Wake Lock API (Chrome, Edge, Safari 16.4+)
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
          console.log('🔒 Screen wake lock activated - screen will stay on')
          
          // Re-request wake lock when screen becomes visible (after app was minimized)
          document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && wakeLockRef.current === null) {
              try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
                console.log('🔒 Wake lock re-acquired after visibility change')
              } catch (err) {
                console.warn('⚠️ Failed to re-acquire wake lock:', err)
              }
            }
          })
        } 
        // Strategy 2: NoSleep.js (fallback for older browsers)
        else {
          console.log('⚠️ Wake Lock API not supported, using video playback fallback')
          
          // Create a hidden looping video to prevent screen sleep
          const video = document.createElement('video')
          video.setAttribute('playsinline', '')
          video.setAttribute('muted', '')
          video.setAttribute('loop', '')
          video.style.position = 'fixed'
          video.style.top = '-100px'
          video.style.left = '-100px'
          video.style.width = '1px'
          video.style.height = '1px'
          video.style.opacity = '0.01'
          
          // Create a minimal WebM video (1x1 pixel, 1 second)
          const blob = new Blob([
            new Uint8Array([
              0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f, 0x42, 0x86, 0x81, 0x01,
              0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77,
              0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85, 0x81, 0x02, 0x18, 0x53, 0x80, 0x67, 0x01,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2f, 0x15, 0x49, 0xa9, 0x66, 0x01, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x0e, 0xae, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0xd7, 0x81, 0x01, 0x83,
              0x81, 0x01, 0x86, 0x81, 0x01, 0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40, 0x4d, 0x80, 0x86, 0x56,
              0x50, 0x38, 0x30, 0x00, 0x00, 0x1f, 0x43, 0xb6, 0x75, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x0c, 0xe7, 0x81, 0x00, 0xe0, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xb0, 0x81, 0x01,
              0xba, 0x81, 0x01, 0x1c, 0x53, 0xbb, 0x6b, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0xa3,
              0x81, 0x00, 0x00, 0x88, 0x42, 0x88, 0x81, 0x00
            ])
          ], { type: 'video/webm' })
          
          video.src = URL.createObjectURL(blob)
          document.body.appendChild(video)
          noSleepRef.current = video
          
          try {
            await video.play()
            console.log('🎥 Video playback fallback activated - screen will stay on')
          } catch (err) {
            console.warn('⚠️ Video playback fallback failed:', err)
          }
        }
      } catch (err) {
        console.error('❌ Failed to acquire wake lock:', err)
      }
    }
    
    requestWakeLock()
    
    // Release wake lock on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        console.log('🔓 Screen wake lock released')
        wakeLockRef.current = null
      }
      
      if (noSleepRef.current) {
        noSleepRef.current.pause()
        noSleepRef.current.remove()
        console.log('🎥 Video playback fallback stopped')
        noSleepRef.current = null
      }
    }
  }, [])

  // 🔊 Play match sound ONLY for NEW matches (not when returning from chat)
  useEffect(() => {
    // ✅ CRITICAL FIX #1: Only play if this is a NEW match
    if (!isNewMatch) {
      console.log('🔇 Not a new match - skipping sound')
      return
    }
    
    // ✅ CRITICAL FIX #2: Use localStorage with timestamp to detect app restarts
    // This allows sound to play again after:
    // 1. Logout → Login
    // 2. App removed from memory → Reopened
    // But NOT when navigating within the app (e.g., match → chat → back to match)
    const userId = user?.uid || user?.id
    const storageKey = `match_sound_played_${userId}`
    const lastPlayed = localStorage.getItem(storageKey)
    
    // Check if sound was played in the last 5 minutes
    // If yes, it means user is still in the same app session (just navigating)
    if (lastPlayed) {
      const timeSinceLastPlayed = Date.now() - parseInt(lastPlayed)
      if (timeSinceLastPlayed < 5 * 60 * 1000) {  // 5 minutes
        console.log('🔇 Sound already played recently (navigating within app) - skipping')
        return
      }
    }
    
    const playMatchSound = () => {
      try {
        if (matchSoundRef.current) {
          matchSoundRef.current.volume = 0.7
          matchSoundRef.current.play()
            .then(() => {
              console.log('🔊 Match sound played successfully (NEW match or app restart)')
              // ✅ Store current timestamp in localStorage
              localStorage.setItem(storageKey, Date.now().toString())
            })
            .catch(err => {
              console.log('🔇 Match sound autoplay blocked:', err.message)
            })
        }
      } catch (error) {
        console.error('❌ Error playing match sound:', error)
      }
    }

    // Play after a small delay to ensure DOM is ready
    const timer = setTimeout(playMatchSound, 500)
    return () => clearTimeout(timer)
  }, [isNewMatch, user?.uid, user?.id])  // ✅ Added userId dependencies

  // ✅ FIXED: Load current user with REAL-TIME updates
  useEffect(() => {
    const authUser = auth.currentUser
    if (!authUser) return
    
    console.log(`📸 Setting up real-time listener for current user: ${authUser.uid}`)
    
    // Real-time listener for current user profile
    const unsubscribe = onSnapshot(
      doc(db, 'users', authUser.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data() as UserProfile
          setCurrentUser(userData)
          console.log('✅ Current user profile updated (real-time)')
        }
      },
      (error) => {
        console.error('❌ Error in current user listener:', error)
      }
    )
    
    // Cleanup listener on unmount
    return () => {
      console.log('🔇 Unsubscribing from current user listener')
      unsubscribe()
    }
  }, [])

  // ✅ FIXED: Load matched user with REAL-TIME updates (onSnapshot)
  useEffect(() => {
    const userId = user?.uid || user?.id
    
    if (!userId || userId === loadedMatchedUserId) {
      return
    }
    
    console.log(`📸 Setting up real-time listener for user: ${userId}`)
    
    // Real-time listener for matched user profile
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data() as UserProfile
          setMatchedUserProfile(userData)
          setLoadedMatchedUserId(userId)
          console.log('✅ Matched user profile updated (real-time)')
        }
      },
      (error) => {
        console.error('❌ Error in matched user listener:', error)
      }
    )
    
    // Cleanup listener on unmount
    return () => {
      console.log('🔇 Unsubscribing from matched user listener')
      unsubscribe()
    }
  }, [user?.uid, user?.id, loadedMatchedUserId])

// Check if there are existing messages
useEffect(() => {
  // ✅ FIX: Reset hasActiveChat when user changes
  setHasActiveChat(false)
  
  // ✅ CRITICAL FIX: If this is a NEW match, always show "Send Message" not "Continue Chatting"
  // This ensures fresh start for new matches even if there was previous chat history
  if (isNewMatch) {
    console.log('🆕 New match detected - showing Send Message (not Continue Chatting)')
    setHasActiveChat(false)
    
    // ✅ CRITICAL: Clear old chat messages for fresh start
    const clearOldChat = async () => {
      const currentUserId = auth.currentUser?.uid
      const matchedUserId = user?.uid || user?.id
      
      if (currentUserId && matchedUserId) {
        const matchId = [currentUserId, matchedUserId].sort().join('_')
        try {
          await clearChatMessages(matchId)
          console.log('🧹 Old chat messages cleared for new match')
        } catch (error) {
          console.error('⚠️ Error clearing old messages:', error)
          // Don't fail - just continue
        }
      }
    }
    
    clearOldChat()
    return
  }
  
  const checkMessages = async () => {
    const currentUserId = auth.currentUser?.uid
    const matchedUserId = user?.uid || user?.id
    
    if (!currentUserId || !matchedUserId) {
      setHasActiveChat(false)
      return
    }
    
    const matchId = [currentUserId, matchedUserId].sort().join('_')
    console.log(`🔍 Checking messages for matchId: ${matchId}`)
    
    try {
      const hasMessages = await chatHasMessages(matchId)
      setHasActiveChat(hasMessages)
      console.log(`💬 Chat has messages: ${hasMessages}`)
    } catch (error) {
      console.error('❌ Error checking messages:', error)
      setHasActiveChat(false)
    }
  }
  
  checkMessages()
}, [user?.uid, user?.id, isNewMatch])  // ✅ Added isNewMatch dependency

  // ✅ NEW: Countdown timer for next pass (runs in background)
  useEffect(() => {
    if (isPremium || !passResetTime) {
      setTimeUntilNextPass(0)
      return
    }
    
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const resetTime = new Date(passResetTime).getTime()
      const diff = Math.max(0, Math.floor((resetTime - now) / 1000))
      setTimeUntilNextPass(diff)
    }
    
    // Calculate immediately
    calculateTimeRemaining()
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)
    
    return () => clearInterval(interval)
  }, [isPremium, passResetTime, passesLeft])

  const handleSendMessageClick = useCallback(() => {
    setShowSendMessageConfirm(true)
  }, [])

  const confirmSendMessage = useCallback(() => {
    setShowSendMessageConfirm(false)
    onMeetNow()
  }, [onMeetNow])

  const handlePassClick = () => {
    if (passesLeft > 0 || isPremium) {
      onPass()
    } else {
      setShowPremiumOffer(true)
      setPremiumOfferShownAt(Date.now())
    }
  }

  const getTimerColor = () => {
    if (timeRemaining <= 60) return "text-red-400"
    if (timeRemaining <= 180) return "text-orange-400"
    return "text-[#4ade80]"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ✅ NEW: Format time until next pass (HH:MM:SS)
  const formatPassResetTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return '0m'
    if (distance < 1000) return `${Math.round(distance)}m`
    return `${(distance / 1000).toFixed(1)}km`
  }

  const matchedUserName = useMemo(() => 
    matchedUserProfile?.name || matchedUserProfile?.displayName || user?.name || 'Unknown',  // ✅ FIXED: name (onboarding) before displayName (Google)
    [matchedUserProfile?.name, matchedUserProfile?.displayName, user?.name]
  )
  
  const matchedUserAge = useMemo(() => 
    matchedUserProfile?.age || user?.age || '??',
    [matchedUserProfile?.age, user?.age]
  )
  
  // ✅ FIX: Take profile photo FIRST, then Google photo as fallback
  const matchedUserPhoto = useMemo(() => {
    // Priority order:
    // 1. FIRST photo from photos array (profile photo from onboarding)
    // 2. photoURL (Google photo - FALLBACK ONLY!)
    // 3. Fallback to user props
    const profilePhoto = matchedUserProfile?.photos?.[0]  // ← Profile photo first!
    const userProfilePhoto = user?.photos?.[0]
    
    return profilePhoto || 
           userProfilePhoto || 
           user?.image || 
           matchedUserProfile?.photoURL ||  // ← Google photo LAST
           user?.photoURL
  }, [matchedUserProfile?.photos, matchedUserProfile?.photoURL, user?.photos, user?.image, user?.photoURL])
  
  // ✅ FIX: Take profile photo FIRST, then Google photo as fallback
  const currentUserPhoto = useMemo(() => {
    // Priority order:
    // 1. FIRST photo from photos array (profile photo from onboarding)
    // 2. photoURL (Google photo - FALLBACK ONLY!)
    const profilePhoto = currentUser?.photos?.[0]  // ← Profile photo first!
    
    return profilePhoto || currentUser?.photoURL
  }, [currentUser?.photos, currentUser?.photoURL])

  const closeProfile = () => setShowProfile('none')

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden flex flex-col">
      {/* 🔊 Match Celebration Sound - Hidden */}
      <audio
        ref={matchSoundRef}
        src="/sounds/match-celebration.mp3"
        preload="auto"
        style={{ display: 'none' }}
      />

      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="text-center mb-8"
        >
          <motion.h1
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="text-5xl font-serif font-bold text-white mb-2 drop-shadow-2xl"
          >
            It's a Match! 🎉
          </motion.h1>
          <p className="text-[#a8d5ba] text-lg font-medium">
            You both liked each other
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 12 }}
          className="flex items-center justify-center gap-8 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            onClick={() => setShowProfile('current')}
            className="cursor-pointer"
          >
            <div className="relative">
              <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-[#4ade80] shadow-2xl shadow-[#4ade80]/50">
                <img 
                  src={currentUserPhoto || '/placeholder.svg'} 
                  alt="You" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0d2920] px-3 py-1 rounded-full border-2 border-[#4ade80]">
                <span className="text-white font-semibold text-sm">You</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-pink-500/50">
              <Heart className="h-10 w-10 text-white" fill="white" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            onClick={() => setShowProfile('matched')}
            className="cursor-pointer"
          >
            <div className="relative">
              <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-pink-400 shadow-2xl shadow-pink-400/50">
                <img 
                  src={matchedUserPhoto || '/placeholder.svg'} 
                  alt={matchedUserName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0d2920] px-3 py-1 rounded-full border-2 border-pink-400">
                <span className="text-white font-semibold text-sm">{matchedUserName}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-b from-[#1a4d3e]/80 to-[#0d2920]/80 backdrop-blur-xl rounded-2xl p-3 w-full max-w-sm border border-[#4ade80]/30 shadow-2xl mb-3"
        >
          <div className="text-center mb-2">
            <h2 className="text-white text-xl font-bold mb-0.5">
              {matchedUserName}, {matchedUserAge}
            </h2>
            <div className="flex items-center justify-center gap-2 text-[#a8d5ba] text-xs">
              <MapPin className="h-3 w-3" />
              <span>{formatDistance(user?.distance)} away</span>
            </div>
          </div>

          <div className="bg-[#0d2920]/50 rounded-xl p-2 mb-2 border border-[#4ade80]/20">
            <div className="text-center mb-1">
              <p className="text-white/60 text-xs mb-0.5">Decide in:</p>
              <div className={`text-4xl font-bold font-mono ${getTimerColor()}`}>
                {formatTime(timeRemaining)}
              </div>
              {timeRemaining <= 60 && (
                <p className="text-red-400 text-[10px] mt-0.5 font-semibold animate-pulse">
                  ⏱️ Less than a minute!
                </p>
              )}
            </div>
            <p className="text-white/50 text-xs text-center font-semibold">
              🔒 Can't swipe until you decide
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-sm space-y-2"
        >
          {/* ✅ Send Message Button */}
          <Button
            onClick={handleSendMessageClick}
            disabled={timeRemaining <= 0}
            className={`w-full h-12 rounded-xl font-bold text-base shadow-lg transition-all ${
              timeRemaining <= 0
                ? 'bg-gray-500/50 cursor-not-allowed text-gray-300'
                : 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920]'
            }`}
          >
            <Heart className="mr-2 h-6 w-6" fill={timeRemaining > 0 ? "currentColor" : "none"} />
            {timeRemaining <= 0 
              ? '⏰ Time Expired - No Messages'
              : (hasActiveChat ? 'Continue Chatting' : 'Send Message')
            }
          </Button>

          {/* ✅ "She Decides" - Only women can click "We're Meeting!" */}
          {timeRemaining > 0 && onMarkMatchSuccessful && (
            canInitiateMeeting ? (
              // ✅ WOMAN - Active button, she decides!
              <Button
                onClick={async () => {
                  // ✅ CRITICAL: Mark match as successful IMMEDIATELY (sends notification to him!)
                  // This way HE gets the notification RIGHT NOW, not after she clicks OK
                  console.log('💕 She clicked We\'re Meeting! Sending notification immediately...')
                  onMarkMatchSuccessful()  // ← Sends notification to HIM right now!
                  
                  // Play celebration sound! 🔔
                  try {
                    const audio = new Audio('/match-sound.mp3')
                    audio.volume = 0.8
                    await audio.play()
                    console.log('🔊 Celebration sound played!')
                  } catch (err) {
                    console.warn('Could not play sound:', err)
                  }
                  
                  // Show celebration modal for HER
                  setShowWeAreMeetingModal(true)
                }}
                className="w-full h-14 rounded-xl font-bold text-lg shadow-lg transition-all bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white animate-pulse hover:animate-none"
              >
                <Heart className="mr-2 h-6 w-6" />
                💕 We're Meeting!
              </Button>
            ) : (
              // ✅ MAN - Disabled button with explanation
              <div className="w-full space-y-2">
                <Button
                  disabled
                  className="w-full h-12 rounded-xl font-bold text-lg shadow-lg bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed opacity-70"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  💚 We're Meeting
                </Button>
                <p className="text-center text-sm text-white/60 px-4">
                  ✨ <span className="text-pink-400">She decides</span> when you meet!<br/>
                  <span className="text-white/40 text-xs">Impress her in the chat 💬</span>
                </p>
              </div>
            )
          )}
          
          {/* ✅ FIXED: Pass Button - Shows correct state WITH DYNAMIC COUNTDOWN */}
          <Button
            onClick={handlePassClick}
            disabled={!isPremium && passesLeft === 0}
            variant="outline"
            className={`w-full h-12 rounded-xl font-bold text-lg transition-all ${
              isPremium
                ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-400/50 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20'
                : passesLeft > 0
                ? 'bg-transparent hover:bg-[#4ade80]/10 border-2 border-[#4ade80]/50 text-[#4ade80] hover:border-[#4ade80]'
                : 'bg-white/5 border-2 border-white/20 text-white/40 cursor-not-allowed'
            }`}
          >
            {isPremium ? (
              <>
                <Crown className="mr-2 h-6 w-6" />
                Use Like (Unlimited)
              </>
            ) : passesLeft > 0 ? (
              <>
                <Check className="mr-2 h-6 w-6" />
                Use Like ({passesLeft} left)
              </>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Next Like Available In
                </div>
                <div className="text-2xl font-mono mt-1">
                  {timeUntilNextPass > 0 ? formatPassResetTime(timeUntilNextPass) : 'Refreshing...'}
                </div>
              </div>
            )}
          </Button>

          {/* ✅ Skip Timer Button */}
          {onSkipTimer && (
            <Button
              onClick={onSkipTimer}
              variant="outline"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/20 hover:from-[#4ade80]/30 hover:to-[#22c55e]/30 border-2 border-[#4ade80] text-[#4ade80] font-semibold transition-all"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Skip Timer ($2.99)
            </Button>
          )}

          <p className="text-center text-white/40 text-xs mt-4">
            Choose wisely - this match expires in {formatTime(timeRemaining)}!
          </p>
        </motion.div>
      </div>

      {/* Send Message Confirmation */}
      <AnimatePresence>
        {showSendMessageConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-md w-full border-2 border-[#4ade80]/30"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {hasActiveChat ? `Continue chatting with ${matchedUserName}?` : `Send Message to ${matchedUserName}?`}
                </h2>
                <p className="text-white/60 text-sm">
                  {hasActiveChat ? 'Return to your conversation' : 'This will open a chat with your match'}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={confirmSendMessage}
                  className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-bold text-lg rounded-xl"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {hasActiveChat ? 'Continue Chatting' : 'Yes, Start Chat'}
                </Button>
                <Button
                  onClick={() => setShowSendMessageConfirm(false)}
                  variant="outline"
                  className="w-full h-12 bg-transparent border-2 border-white/20 text-white hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM MODAL */}
      <AnimatePresence>
        {showPremiumOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 max-w-md w-full border border-amber-500/30 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity,
                    ease: "linear" 
                  }}
                  className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-3xl"
                />
              </div>

              <div className="relative z-10">
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="inline-block text-7xl mb-4"
                  >
                    👑
                  </motion.div>
                  <h2 className="text-3xl font-black text-white mb-2">
                    Out of Likes!
                  </h2>
                  <p className="text-gray-300 text-base leading-relaxed">
                    Upgrade to <span className="text-amber-400 font-bold">Premium</span> for unlimited passes!
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 mb-6 border border-amber-500/30">
                  <div className="space-y-3">
                    {[
                      'Unlimited likes daily',
                      'Priority matching',
                      'See who liked you',
                      'Unlimited rewinds'
                    ].map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-white font-medium">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* 👑 PREMIUM UPGRADE BUTTON - Hollywood Level */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => {
                        setShowPremiumOffer(false)
                        if (onUpgradePremium) onUpgradePremium()
                      }}
                      className="w-full h-16 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-gray-900 font-bold text-xl rounded-xl shadow-2xl relative overflow-hidden group"
                    >
                      <Crown className="mr-3 h-6 w-6" />
                      Upgrade to Premium
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </Button>
                  </motion.div>

                  {/* 🎫 BUY ONE PASS BUTTON - Hollywood Level */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => {
                        setShowPremiumOffer(false)
                        if (onBuyOnePass) onBuyOnePass()
                      }}
                      className="w-full h-16 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-xl rounded-xl shadow-2xl relative overflow-hidden group"
                    >
                      <Sparkles className="mr-3 h-6 w-6" />
                      Buy 1 Like - $2.99
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </Button>
                  </motion.div>

                  {/* MAYBE LATER BUTTON */}
                  <Button
                    onClick={() => setShowPremiumOffer(false)}
                    variant="outline"
                    className="w-full h-12 bg-transparent border-2 border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl"
                  >
                    Maybe Later
                  </Button>
                </div>

                {/* ⏰ TIMER DISPLAY - Shows countdown to next free pass */}
                {timeUntilNextPass > 0 && (
                  <div className="text-center mt-6 p-4 bg-gradient-to-r from-[#4ade80]/10 to-[#22c55e]/10 rounded-xl border border-[#4ade80]/30">
                    <p className="text-gray-400 text-sm mb-2">
                      Next free like available in:
                    </p>
                    <div className="text-3xl font-mono font-bold text-[#4ade80]">
                      {formatPassResetTime(timeUntilNextPass)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modals */}
      <UserProfileModal
        isOpen={showProfile === 'current'}
        onClose={closeProfile}
        user={currentUser}
        isCurrentUser={true}
      />

      <UserProfileModal
        isOpen={showProfile === 'matched'}
        onClose={closeProfile}
        user={{
          ...matchedUserProfile,
          distance: user?.distance,
          name: matchedUserName
        }}
        isCurrentUser={false}
      />

      {/* ✅ FIXED: Bottom Navigation - Back to Swiping DISABLED during active match */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-[#0d2920]/90 backdrop-blur-xl border-t-2 border-[#4ade80]/30 z-40"
      >
        <div className="flex justify-around items-center py-4 px-6 max-w-md mx-auto">
          {/* ✅ FIX #1: Back to Swiping Button - DISABLED during active match */}
          <motion.button
            whileHover={timeRemaining > 0 ? {} : { scale: 1.1 }}
            whileTap={timeRemaining > 0 ? {} : { scale: 0.95 }}
            onClick={timeRemaining > 0 ? undefined : onContinue}
            disabled={timeRemaining > 0}
            className={`flex flex-col items-center gap-1 transition-colors ${
              timeRemaining > 0 
                ? 'text-white/30 cursor-not-allowed' 
                : 'text-[#4ade80] hover:text-[#3bc970] cursor-pointer'
            }`}
            title={timeRemaining > 0 ? '🔒 Locked during match' : 'Return to swiping'}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-semibold">
              {timeRemaining > 0 ? '🔒 Locked' : 'Back to Swiping'}
            </span>
          </motion.button>

          {onNavigate && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('notifications')}
                className="flex flex-col items-center gap-1 text-white/60 hover:text-[#4ade80] transition-colors"
              >
                <Bell className="h-6 w-6" />
                <span className="text-xs">Notifications</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('profile')}
                className="flex flex-col items-center gap-1 text-white/60 hover:text-[#4ade80] transition-colors"
              >
                <UserIcon className="h-6 w-6" />
                <span className="text-xs">Profile</span>
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
      
      {/* ✅ We Are Meeting Modal */}
      <WeAreMeetingModal
        isOpen={showWeAreMeetingModal}
        onClose={() => {
          // ✅ Close the modal and navigate to home
          setShowWeAreMeetingModal(false)
          if (onWeAreMeetingModalClose) {
            onWeAreMeetingModalClose()  // → Returns to home screen
          }
        }}
        partnerName={matchedUserName}
        partnerPhoto={matchedUserPhoto}
      />
    </div>
  )
}
