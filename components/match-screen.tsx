"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Heart, MapPin, User as UserIcon, MessageCircle, ChevronLeft, ChevronRight, Crown, Check, Sparkles, Bell, Home, Clock, XCircle } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore"
import { chatHasMessages, clearChatMessages } from "@/lib/chat-system"
import UserProfileModal from "./user-profile-modal"
import WeAreMeetingModal from "./we-are-meeting-modal"
import DebugPanel from "./debug-panel"  // ✅ v2.8.18: Debug panel for match screen
import { useLanguage } from "@/lib/LanguageContext"

interface MatchScreenProps {
  user: any
  onContinue: () => void
  onMeetNow: () => void
  onMarkMatchSuccessful?: () => void  // ✅ "She Decides" - Mark match as successful
  onWeAreMeetingModalClose?: () => void  // ✅ NEW: Called when she closes the celebration modal
  passesLeft: number
  onPass: () => void
  onNotInterested?: () => void  // ✅ NEW: Exit match without using pass (when no passes left)
  onOpenChat?: () => void       // ✅ v2.8.16: Open chat WITHOUT locking phone
  isPremium?: boolean
  timeRemaining: number
  onSkipTimer?: () => void
  onNavigate?: (screen: any) => void
  onUpgradePremium?: () => void
  onBuyOnePass?: () => void
  passResetTime?: Date
  isNewMatch?: boolean
  currentUserGender?: 'male' | 'female'  // ✅ "She Decides" - Only women can click "We're Meeting!"
  matchedUserGender?: 'male' | 'female'  // ✅ NEW: For same-sex matching logic
  isMatchLocked?: boolean  // ✅ NEW: Whether this match is locked (second match for free users)
  onUnlockMatch?: () => void  // ✅ NEW: Callback to show premium paywall
  hasBidirectionalChat?: boolean  // ✅ NEW: Both users must send at least 1 message before meeting
  isInEnjoyModeSession?: boolean  // ✅ NEW: Are we viewing profile during enjoy mode?
  onBackToEnjoyMode?: () => void  // ✅ NEW: Go back to enjoy mode screen
  isPartnerReadyToMeet?: boolean  // ✅ NEW: Partner already clicked "We're Meeting"
  isReadOnlyProfile?: boolean     // ✅ NEW: Just viewing profile from expired chat
  onBackToChat?: () => void       // ✅ NEW: Go back to chat (for read-only profile view)
  matchCreatedAt?: Date | null    // ✅ v2.8.4: When match was created (for filtering messages)
}

interface UserProfile {
  name?: string           // ✅ ADDED: name from onboarding
  displayName: string
  photoURL: string
  photos?: string[]
  bio?: string
  age?: number
  hobbies?: string[]
  city?: string           // ✅ NEW: City
  occupation?: string     // ✅ NEW: Occupation
  languages?: string[]    // ✅ NEW: Languages
}

export default function MatchScreen({
  user,
  onContinue,
  onMeetNow,
  onOpenChat,              // ✅ v2.8.16: Open chat WITHOUT locking phone
  onMarkMatchSuccessful,  // ✅ "She Decides" - Only women click this
  onWeAreMeetingModalClose,  // ✅ NEW: Close modal → return to home
  passesLeft,
  onPass,
  onNotInterested,  // ✅ NEW: Exit match without pass
  isPremium = false,
  timeRemaining,
  onSkipTimer,
  onNavigate,
  onUpgradePremium,
  onBuyOnePass,
  passResetTime,
  isNewMatch = false,
  currentUserGender = 'male',  // ✅ "She Decides" - Default to male (button disabled)
  matchedUserGender,  // ✅ NEW: For same-sex matching logic
  isMatchLocked = false,  // ✅ NEW: Whether this match is locked
  onUnlockMatch,  // ✅ NEW: Callback to show premium paywall
  hasBidirectionalChat = false,  // ✅ NEW: Must chat before meeting!
  isInEnjoyModeSession = false,  // ✅ NEW: Are we viewing profile during enjoy mode?
  onBackToEnjoyMode,  // ✅ NEW: Go back to enjoy mode screen
  isPartnerReadyToMeet = false,  // ✅ NEW: Partner already clicked "We're Meeting"
  isReadOnlyProfile = false,     // ✅ NEW: Just viewing profile from expired chat
  onBackToChat,                  // ✅ NEW: Go back to chat
  matchCreatedAt                 // ✅ v2.8.4: When match was created
}: MatchScreenProps) {
  const { t, isRTL } = useLanguage()
  
  const [showPremiumOffer, setShowPremiumOffer] = useState(false)
  const [premiumOfferShownAt, setPremiumOfferShownAt] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [matchedUserProfile, setMatchedUserProfile] = useState<UserProfile | null>(null)
  const [showProfile, setShowProfile] = useState<'none' | 'current' | 'matched'>('none')
  const [showSendMessageConfirm, setShowSendMessageConfirm] = useState(false)
  const [loadedMatchedUserId, setLoadedMatchedUserId] = useState<string | null>(null)
  const [hasActiveChat, setHasActiveChat] = useState(false)
  const [showWeAreMeetingModal, setShowWeAreMeetingModal] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)  // ✅ v2.8.18: Debug panel
  
  // ✅ v2.8.18: Long press for debug panel
  const isLongPressingRef = useRef(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleLongPressStart = () => {
    isLongPressingRef.current = true
    longPressTimerRef.current = setTimeout(() => {
      if (isLongPressingRef.current) {
        console.log('🐛 Debug Panel activated in Match Screen!')
        setShowDebugPanel(true)
        if (navigator.vibrate) navigator.vibrate(100)
      }
    }, 3000)
  }
  
  const handleLongPressEnd = () => {
    isLongPressingRef.current = false
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }
  
  // ✅ NEW: Real-time lock state from Firestore (more reliable than React state)
  const [isLockedFromFirestore, setIsLockedFromFirestore] = useState<boolean | null>(null)  // null = loading
  const effectiveIsLocked = isLockedFromFirestore !== null ? isLockedFromFirestore : isMatchLocked
  
  // ✅ NEW: Listen to activeMatch for real-time lock updates
  useEffect(() => {
    const currentUserId = auth.currentUser?.uid
    const matchedUserId = user?.uid
    
    if (!currentUserId || !matchedUserId) {
      console.log('🔒 No user IDs for lock check')
      setIsLockedFromFirestore(isMatchLocked)  // Fall back to prop
      return
    }
    
    // Create match ID (same as used elsewhere)
    const matchId = [currentUserId, matchedUserId].sort().join('_')
    console.log('🔒 Setting up real-time lock listener for match:', matchId)
    
    // Listen to activeMatch document for real-time updates
    const unsubscribe = onSnapshot(
      doc(db, 'activeMatches', matchId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          const lockedForUsers = data.lockedForUsers || []
          const userIsLocked = lockedForUsers.includes(currentUserId)
          console.log(`🔒 Real-time lock check: userIsLocked=${userIsLocked}, lockedForUsers=`, lockedForUsers)
          setIsLockedFromFirestore(userIsLocked)
        } else {
          console.log('🔒 No active match document found')
          setIsLockedFromFirestore(false)
        }
      },
      (error) => {
        console.error('🔒 Error listening to lock status:', error)
        setIsLockedFromFirestore(isMatchLocked)  // Fall back to prop on error
      }
    )
    
    return () => unsubscribe()
  }, [user?.uid, isMatchLocked])
  
  // ✅ "She Decides" - BUT also support same-sex couples!
  // Logic:
  // - Hetero couples (male + female): Only the woman can click
  // - Same-sex couples (male + male OR female + female): BOTH can click
  // ✅ v2.8.18 FIX: Handle undefined genders properly!
  const hasValidGenders = currentUserGender && matchedUserGender
  const isSameSexCouple = hasValidGenders && currentUserGender === matchedUserGender
  
  // ✅ v2.8.18: Only allow meeting button if:
  // 1. User is female (She Decides)
  // 2. OR both are same gender AND genders are known
  const genderAllowsMeeting = currentUserGender === 'female' || (isSameSexCouple && hasValidGenders)
  
  // ✅ NEW: Must have bidirectional chat before meeting!
  // Both users must send at least one message
  const canInitiateMeeting = genderAllowsMeeting && hasBidirectionalChat && !isPartnerReadyToMeet
  
  // ✅ NEW: Track time until next pass
  const [timeUntilNextPass, setTimeUntilNextPass] = useState<number>(0)

  // 🔊 SOUND: Match celebration sound effect
  const matchSoundRef = useRef<HTMLAudioElement | null>(null)
  
  // 🔊 SOUND: "We're Meeting!" celebration sound effect
  const meetingSoundRef = useRef<HTMLAudioElement | null>(null)
  
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

// Check if there are existing messages (only from CURRENT match)
useEffect(() => {
  // ✅ FIX: Reset hasActiveChat when user changes
  setHasActiveChat(false)
  
  // ✅ v2.8.4: Check for messages only from CURRENT match (after matchCreatedAt)
  const checkMessages = async () => {
    const currentUserId = auth.currentUser?.uid
    const matchedUserId = user?.uid || user?.id
    
    if (!currentUserId || !matchedUserId) {
      setHasActiveChat(false)
      return
    }
    
    const matchId = [currentUserId, matchedUserId].sort().join('_')
    console.log(`🔍 Checking messages for matchId: ${matchId}`)
    if (matchCreatedAt) {
      console.log(`   Only counting messages after: ${matchCreatedAt.toLocaleString()}`)
    }
    
    try {
      // ✅ v2.8.4: Count only messages AFTER matchCreatedAt
      if (matchCreatedAt) {
        // ✅ v2.8.5 FIX: Messages are stored in 'matches' collection, not 'chats'!
        const messagesRef = collection(db, 'matches', matchId, 'messages')
        const { getDocs } = await import('firebase/firestore')
        const messagesSnap = await getDocs(messagesRef)
        
        let relevantMessageCount = 0
        messagesSnap.docs.forEach(doc => {
          const data = doc.data()
          const messageTime = data.timestamp?.toDate ? data.timestamp.toDate() : 
                              data.createdAt?.toDate ? data.createdAt.toDate() : null
          
          if (messageTime && messageTime >= matchCreatedAt) {
            relevantMessageCount++
          }
        })
        
        const hasRelevantMessages = relevantMessageCount > 0
        setHasActiveChat(hasRelevantMessages)
        console.log(`💬 Relevant messages (this match): ${relevantMessageCount} → ${hasRelevantMessages ? 'Continue Chatting' : 'Send Message'}`)
      } else {
        // Fallback to old behavior if no matchCreatedAt
        const hasMessages = await chatHasMessages(matchId)
        setHasActiveChat(hasMessages)
        console.log(`💬 Chat has messages: ${hasMessages}`)
      }
    } catch (error) {
      console.error('❌ Error checking messages:', error)
      setHasActiveChat(false)
    }
  }
  
  checkMessages()
}, [user?.uid, user?.id, isNewMatch, matchCreatedAt])  // ✅ Added matchCreatedAt dependency

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

  // ✅ v2.8.16: Open chat WITHOUT locking phone (separate from "We're Meeting!")
  const confirmSendMessage = useCallback(() => {
    setShowSendMessageConfirm(false)
    // ✅ FIX: Use onOpenChat (just opens chat) NOT onMeetNow (locks phone!)
    if (onOpenChat) {
      onOpenChat()
    } else {
      // Fallback to old behavior if onOpenChat not provided
      onMeetNow()
    }
  }, [onOpenChat, onMeetNow])

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

  // ✅ NEW: Handle "Not Interested" - Exit match without using pass
  const handleNotInterested = () => {
    console.log('🚫 Not Interested clicked - exiting match')
    if (onNotInterested) {
      onNotInterested()
    } else {
      // Fallback to onContinue if onNotInterested not provided
      onContinue()
    }
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
    <div 
      className="bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-y-auto flex flex-col"
      style={{ 
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        paddingBottom: 'max(env(safe-area-inset-bottom), 96px)'
      }}
    >
      {/* ✅ HERMETIC: Back to Enjoy Mode header when viewing profile during meeting */}
      {isInEnjoyModeSession && onBackToEnjoyMode && (
        <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0d2920] to-transparent pt-4 pb-8 px-4">
          <button
            onClick={onBackToEnjoyMode}
            className="flex items-center gap-2 text-[#4ade80] hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="font-bold">Back to Meeting</span>
          </button>
        </div>
      )}
      
      {/* ✅ NEW: Back to Chat header when viewing profile from expired chat */}
      {isReadOnlyProfile && onBackToChat && (
        <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0d2920] to-transparent pt-4 pb-8 px-4">
          <button
            onClick={onBackToChat}
            className="flex items-center gap-2 text-[#4ade80] hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="font-bold">Back to Chat</span>
          </button>
        </div>
      )}
      
      {/* 🔊 Match Celebration Sound - Hidden */}
      <audio
        ref={matchSoundRef}
        src="/sounds/match-celebration.mp3"
        preload="auto"
        style={{ display: 'none' }}
      />
      
      {/* 🔊 "We're Meeting!" Celebration Sound - Hidden */}
      <audio
        ref={meetingSoundRef}
        src="/sounds/meeting-celebration.wav"
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

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start p-4 pt-6 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="text-center mb-4"
        >
          {isInEnjoyModeSession ? (
            // ✅ During enjoy mode - show profile view header
            <>
              <motion.h1
                className="text-3xl font-serif font-bold text-white mb-1 drop-shadow-2xl"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              >
                {t('match.yourDatesProfile')}
              </motion.h1>
              <p className="text-pink-300 text-base font-medium" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('match.currentlyMeeting')}
              </p>
            </>
          ) : (
            // ✅ Normal match view
            <>
              <motion.h1
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="text-4xl font-serif font-bold text-white mb-1 drop-shadow-2xl"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
                {t('match.title')}
              </motion.h1>
              <p className="text-[#a8d5ba] text-base font-medium" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('match.subtitle')}
              </p>
              
              {/* ✅ NEW: Proximity excitement banner */}
              {user?.distance && user.distance <= 500 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 bg-[#4ade80]/20 border border-[#4ade80]/40 rounded-xl px-4 py-2"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  <p className="text-[#4ade80] text-sm font-semibold">
                    📍 {t('match.isOnlyAway', { name: matchedUserName, distance: formatDistance(user.distance) })}
                  </p>
                  <p className="text-[#4ade80]/80 text-xs">
                    {t('match.minWalk', { minutes: Math.max(1, Math.round(user.distance / 80)) })}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 12 }}
          className="flex items-center justify-center gap-6 mb-4"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            onClick={() => setShowProfile('current')}
            className="cursor-pointer"
          >
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-[#4ade80] shadow-2xl shadow-[#4ade80]/50">
                <img 
                  src={currentUserPhoto || '/placeholder.svg'} 
                  alt="You" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0d2920] px-3 py-1 rounded-full border-2 border-[#4ade80]">
                <span className="text-white font-semibold text-sm">{t('match.you')}</span>
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-pink-500/50">
              <Heart className="h-8 w-8 text-white" fill="white" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            onClick={() => setShowProfile('matched')}
            className="cursor-pointer"
          >
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-pink-400 shadow-2xl shadow-pink-400/50">
                <img 
                  src={matchedUserPhoto || '/placeholder.svg'} 
                  alt={matchedUserName}
                  className={`h-full w-full object-cover transition-all ${effectiveIsLocked ? 'blur-lg' : ''}`}
                />
                {/* 🔒 Lock overlay when match is locked */}
                {effectiveIsLocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                )}
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
          className="bg-gradient-to-b from-[#1a4d3e]/80 to-[#0d2920]/80 backdrop-blur-xl rounded-2xl p-3 w-full max-w-sm border border-[#4ade80]/30 shadow-2xl mb-2"
        >
          <div className="text-center mb-2">
            <h2 className="text-white text-xl font-bold mb-0.5">
              {matchedUserName}, {matchedUserAge}
            </h2>
            <div className="flex items-center justify-center gap-2 text-[#4ade80] text-sm font-medium">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {formatDistance(user?.distance)} away
                {user?.venueName && ` (${user.venueName})`}
              </span>
            </div>
            {/* ✅ NEW: Walking time estimate */}
            {user?.distance && user.distance <= 500 && (
              <p className="text-white/60 text-xs mt-1">
                🚶 ~{Math.max(1, Math.round(user.distance / 80))} min walk
              </p>
            )}
            
            {/* ✅ NEW: Additional Profile Details */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {/* City */}
              {(matchedUserProfile?.city || user?.city) && (
                <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  📍 {(matchedUserProfile?.city || user?.city)?.split(' - ')[0]}
                </span>
              )}
              {/* Occupation */}
              {(matchedUserProfile?.occupation || user?.occupation) && (
                <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  💼 {matchedUserProfile?.occupation || user?.occupation}
                </span>
              )}
              {/* Languages */}
              {(matchedUserProfile?.languages || user?.languages) && (matchedUserProfile?.languages || user?.languages)!.length > 0 && (
                <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  🌍 {(matchedUserProfile?.languages || user?.languages)!.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* ✅ Only show timer when NOT in enjoy mode session and NOT in read-only profile */}
          {!isInEnjoyModeSession && !isReadOnlyProfile && (
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
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-sm space-y-2"
        >
          {/* ✅ HERMETIC: During enjoy mode session, show simple back button */}
          {isInEnjoyModeSession && onBackToEnjoyMode ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-xl p-4 border border-pink-500/40 text-center">
                <span className="text-3xl block mb-2">💕</span>
                <h3 className="text-white font-bold text-lg mb-1">You're Meeting!</h3>
                <p className="text-pink-200/80 text-sm">
                  Enjoy your time together. This is your match's profile.
                </p>
              </div>
              
              <Button
                onClick={onBackToEnjoyMode}
                className="w-full h-12 rounded-xl font-bold text-base shadow-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              >
                <Heart className="mr-2 h-5 w-5" />
                ← Back to Meeting
              </Button>
            </div>
          ) : isReadOnlyProfile && onBackToChat ? (
            /* ✅ NEW: Read-only profile view from expired chat */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/40 text-center">
                <span className="text-3xl block mb-2">👤</span>
                <h3 className="text-white font-bold text-lg mb-1">Profile View</h3>
                <p className="text-blue-200/80 text-sm">
                  Viewing {matchedUserName}'s profile
                </p>
              </div>
              
              <Button
                onClick={onBackToChat}
                className="w-full h-12 rounded-xl font-bold text-base shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                ← Back to Chat
              </Button>
            </div>
          ) : effectiveIsLocked ? (
            <div className="space-y-3">
              {/* Lock Message */}
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/40 text-center">
                <span className="text-3xl block mb-2">🔒</span>
                <h3 className="text-white font-bold text-lg mb-1">Match Locked!</h3>
                <p className="text-amber-200/80 text-sm">
                  Upgrade to Premium to unlock this match and start chatting
                </p>
              </div>
              
              {/* Unlock Button 1 - Premium */}
              <Button
                onClick={onUnlockMatch}
                className="w-full h-12 rounded-xl font-bold text-base shadow-lg bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-gray-900"
              >
                <Crown className="mr-2 h-5 w-5" />
                👑 Unlock with Premium
              </Button>
              
              {/* Unlock Button 2 - Single Pass */}
              <Button
                onClick={onUnlockMatch}
                className="w-full h-11 rounded-xl font-bold text-sm shadow-lg bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/20 hover:from-[#4ade80]/30 hover:to-[#22c55e]/30 border-2 border-[#4ade80] text-[#4ade80]"
              >
                🎫 Get 1 Pass - $2.90
              </Button>
              
              {/* View Profile (allowed even when locked) */}
              <p className="text-center text-white/50 text-xs">
                You can still view profile details (except photos)
              </p>
            </div>
          ) : (
            <>
              {/* ✅ Send Message Button - UNLOCKED */}
              <Button
                onClick={handleSendMessageClick}
                disabled={timeRemaining <= 0}
                className={`w-full h-11 rounded-xl font-bold text-sm shadow-lg transition-all ${
                  timeRemaining <= 0
                    ? 'bg-gray-500/50 cursor-not-allowed text-gray-300'
                    : 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920]'
                }`}
              >
                <Heart className="mr-2 h-5 w-5" fill={timeRemaining > 0 ? "currentColor" : "none"} />
                {timeRemaining <= 0 
                  ? '⏰ Time Expired'
                  : (hasActiveChat ? 'Continue Chatting' : 'Send Message')
                }
              </Button>

              {/* ✅ "She Decides" + "Chat First" - Meeting button logic */}
              {timeRemaining > 0 && onMarkMatchSuccessful && (
                canInitiateMeeting ? (
                  // ✅ ENABLED: Gender allows + has bidirectional chat
                  // ✅ v2.8.20: Fixed for iOS - use onTouchStart!
                  <button
                    type="button"
                    onTouchStart={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('💕 [iOS] We\'re Meeting button TOUCHED!')
                      
                      // ✅ CRITICAL: Mark match as successful IMMEDIATELY (sends notification to him!)
                      console.log('💕 Sending notification immediately...')
                      onMarkMatchSuccessful()  // ← Sends notification RIGHT NOW!
                      
                      // ✅ v2.8.22 FIX: Show modal IMMEDIATELY - before audio!
                      // On iOS, audio.play() can block/hang on first touch
                      console.log('💕 Opening WeAreMeetingModal IMMEDIATELY...')
                      setShowWeAreMeetingModal(true)
                      
                      // 🔊 Play "We're Meeting" celebration sound (non-blocking)
                      try {
                        if (meetingSoundRef.current) {
                          meetingSoundRef.current.currentTime = 0
                          meetingSoundRef.current.volume = 0.8
                          meetingSoundRef.current.play().catch(() => {})  // Fire and forget
                          console.log('🔊 Meeting celebration sound played!')
                        } else {
                          const audio = new Audio('/sounds/meeting-celebration.wav')
                          audio.volume = 0.8
                          audio.play().catch(() => {})  // Fire and forget
                          console.log('🔊 Meeting sound played (fallback)!')
                        }
                      } catch (err) {
                        console.warn('Could not play meeting sound:', err)
                      }
                    }}
                    onClick={async (e) => {
                      // Desktop fallback
                      e.preventDefault()
                      console.log('💕 [Desktop] We\'re Meeting button CLICKED!')
                      
                      onMarkMatchSuccessful()
                      
                      // ✅ v2.8.22 FIX: Show modal IMMEDIATELY - before audio!
                      setShowWeAreMeetingModal(true)
                      
                      // Play sound (non-blocking)
                      try {
                        if (meetingSoundRef.current) {
                          meetingSoundRef.current.currentTime = 0
                          meetingSoundRef.current.volume = 0.8
                          meetingSoundRef.current.play().catch(() => {})
                        } else {
                          const audio = new Audio('/sounds/meeting-celebration.wav')
                          audio.volume = 0.8
                          audio.play().catch(() => {})
                        }
                      } catch (err) {
                        console.warn('Could not play meeting sound:', err)
                      }
                    }}
                    className="w-full h-12 rounded-xl font-bold text-base shadow-lg transition-all bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white animate-pulse hover:animate-none flex items-center justify-center"
                    style={{ 
                      touchAction: 'manipulation', 
                      WebkitTapHighlightColor: 'transparent',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <Heart className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                    💕 {t('match.wereDeepMeeting')}
                  </button>
                ) : (
                  // ✅ DISABLED: Show button with appropriate message
                  <div className="w-full space-y-2">
                    <Button
                      disabled
                      className="w-full h-12 rounded-xl font-bold text-base shadow-lg bg-gradient-to-r from-pink-500/30 to-rose-500/30 text-pink-200/70 cursor-not-allowed border border-pink-500/20"
                    >
                      <Heart className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                      💕 {t('match.wereDeepMeeting')}
                    </Button>
                    {/* ✅ Different messages based on state */}
                    {isPartnerReadyToMeet ? (
                      // ✅ Partner already clicked "We're Meeting"!
                      <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-xl p-3 border border-pink-500/30 animate-pulse">
                        <p className="text-center text-sm text-pink-200" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('match.yourDateClicked')}
                        </p>
                        <p className="text-center text-xs text-white/70 mt-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('match.lookForPopup')}
                        </p>
                      </div>
                    ) : genderAllowsMeeting ? (
                      // ✅ v2.8.4 WOMAN: Wait for him to message first!
                      <div className="bg-pink-500/10 rounded-xl p-3 border border-pink-500/20">
                        <p className="text-center text-sm text-pink-200" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('match.youreInControl')}
                        </p>
                        <p className="text-center text-xs text-white/60 mt-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('match.whenHeMessages')}
                        </p>
                      </div>
                    ) : (
                      // ✅ v2.8.4 MAN: She decides - Send her a message first!
                      <div className="bg-[#1a4d3e]/30 rounded-xl p-3 border border-[#4ade80]/20">
                        <p className="text-center text-sm text-white/80" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('match.sheDecidesWhen')}
                        </p>
                        <p className="text-center text-xs text-white/50 mt-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('match.sendHerMessage')}
                        </p>
                      </div>
                    )}
                  </div>
                )
              )}
          
          {/* ✅ Pass/Not Interested Button */}
          {isPremium || passesLeft > 0 ? (
            // ✅ Has passes - "Use Pass" button
            <Button
              onClick={handlePassClick}
              variant="outline"
              className={`w-full h-11 rounded-xl font-bold text-base transition-all ${
                isPremium
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-400/50 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20'
                  : 'bg-transparent hover:bg-[#4ade80]/10 border-2 border-[#4ade80]/50 text-[#4ade80] hover:border-[#4ade80]'
              }`}
            >
              {isPremium ? (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  Use Pass (Unlimited)
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Use Pass ({passesLeft} left)
                </>
              )}
            </Button>
          ) : (
            // ✅ No passes - "Not Interested" button to exit match
            <Button
              onClick={handleNotInterested}
              variant="outline"
              className="w-full h-11 rounded-xl font-bold text-base transition-all bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-400/50 text-red-400 hover:border-red-400 hover:bg-red-500/20"
            >
              <XCircle className="mr-2 h-5 w-5" />
              🚫 Not Interested
            </Button>
          )}
          
          {/* ✅ Next Pass Timer - Only show when no passes */}
          {!isPremium && passesLeft === 0 && timeUntilNextPass > 0 && (
            <div className="text-center py-2 px-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/50 text-xs mb-1">Next Pass Available In</p>
              <p className="text-[#4ade80] text-lg font-mono font-bold">
                {formatPassResetTime(timeUntilNextPass)}
              </p>
            </div>
          )}

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
            </>
          )}
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
                    Out of Passes!
                  </h2>
                  <p className="text-gray-300 text-base leading-relaxed">
                    Upgrade to <span className="text-amber-400 font-bold">Premium</span> for unlimited passes!
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 mb-6 border border-amber-500/30">
                  <div className="space-y-3">
                    {[
                      'Unlimited passes daily',
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
                      Buy 1 Pass - $2.99
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
                      Next free pass available in:
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
        blurPhotos={effectiveIsLocked}
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
              {timeRemaining > 0 ? t('nav.locked') : t('nav.backToSwiping')}
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
                <span className="text-xs">{t('nav.notifications')}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('profile')}
                className="flex flex-col items-center gap-1 text-white/60 hover:text-[#4ade80] transition-colors"
              >
                <UserIcon className="h-6 w-6" />
                <span className="text-xs">{t('nav.profile')}</span>
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
      
      {/* ✅ v2.8.18: Debug Panel - Long press on "It's a Match!" to open */}
      <DebugPanel
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </div>
  )
}
