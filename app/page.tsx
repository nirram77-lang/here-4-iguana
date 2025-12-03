"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, X, Clock, Rocket, Star, Zap } from "lucide-react"
import { onSnapshot, doc, collection, query, where, getDoc } from "firebase/firestore"  // ✅ NEW
import { db } from "@/lib/firebase"  // ✅ NEW
import SplashScreen from "@/components/splash-screen"
import WelcomeScreen from "@/components/welcome-screen"
import OnboardingWelcomeScreen from "@/components/onboarding-welcome-screen"
import LoginScreen from "@/components/login-screen"
import NameEntryScreen from "@/components/name-entry-screen"
import OnboardingGender from "@/components/onboarding-gender"
// ✅ "She Decides" - SexualOrientationScreen removed (straight dating only)
import OnboardingAge from "@/components/onboarding-age"
import OnboardingHobbies from "@/components/onboarding-hobbies"
import OnboardingLifestyle from "@/components/onboarding-lifestyle"
import OnboardingPhotos from "@/components/onboarding-photos"
import HomeScreen from "@/components/home-screen"
import MatchScreen from "@/components/match-screen"
import NotificationsScreen from "@/components/notifications-screen"
import ProfileScreen from "@/components/profile-screen"
import ChatScreen from "@/components/chat-screen"
import ScanScreen from "@/components/scan-screen"
import CheckInBadge from "@/components/checkin-badge"
import QRScanRequiredModal from "@/components/qr-scan-required-modal"
import InAppNotification from "@/components/in-app-notification"
import MatchEndedScreen from "@/components/match-ended-screen"
import WeAreMeetingModal from "@/components/we-are-meeting-modal"
import { useAuth } from "@/lib/AuthContext"
import { saveOnboardingData } from "@/lib/onboarding-service"
import { 
  getUserProfile, 
  findNearbyAvailableUsers, 
  updateUserLocation,
  updateUserPreferences,  // ✅ NEW
  createActiveMatch,
  getActiveMatchExpiration,
  getMatchStatus,
  getActiveMatchForUser,
  clearActiveMatch,
  markMatchAsSuccessful,
  createMatchNotifications,
  getUsersByVenue,
  getUserVenue,
  recordSwipe
} from "@/lib/firestore-service"
import { getCurrentLocation } from "@/lib/location-service"
import { CheckInData, performCheckOut, getUserCheckInStatus, verifyUserStillAtVenue } from "@/lib/checkin-service"
import { getUserPassData, usePass, recordMatch } from "@/lib/pass-system"
import CouponModal from "@/components/coupon-modal"
import { 
  getOrCreatePhoneIdentity, 
  isPhoneIdentityLocked, 
  lockPhoneIdentity,
  getDevModePhoneNumber,
  syncUserWithPhoneIdentity 
} from "@/lib/phone-identity-service"

type Screen = "splash" | "welcome" | "login" | "signup" | "onboarding-welcome" | "onboarding-name" | "onboarding-gender" | "onboarding-age" | "onboarding-hobbies" | "onboarding-lifestyle" | "onboarding-photos" | "home" | "match" | "notifications" | "profile" | "chat" | "scan"

// Helper function to create consistent match IDs
const createMatchId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_')
}

export default function Page() {
  const { user, loading: authLoading } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash")
  const [matchedUser, setMatchedUser] = useState<any>(null)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [currentMatchId, setCurrentMatchId] = useState<string>("")
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showOutOfPasses, setShowOutOfPasses] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState<'premium' | 'pass' | null>(null)  // ✅ NEW: Coupon modal

  // ✅ FIX: Track if location permission alert was shown
  const locationAlertShownRef = useRef(false)

  // Pass system state
  const [passesLeft, setPassesLeft] = useState(1)
  const [isPremium, setIsPremium] = useState(false)
  const [isLockedInMatch, setIsLockedInMatch] = useState(false)
  const [passResetTime, setPassResetTime] = useState<Date | null>(null)  // ✅ NEW: When next pass will be available
  const [outOfPassesTimerDisplay, setOutOfPassesTimerDisplay] = useState('02:00:00')  // ✅ NEW: Timer display for Out of Passes modal
  
  // ✅ Phone Identity state - prevents Google account switching exploit
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null)
  const [isPhoneLocked, setIsPhoneLocked] = useState(false)
  const [phoneLockTimeRemaining, setPhoneLockTimeRemaining] = useState(0)
  const [phoneLockExpiresAt, setPhoneLockExpiresAt] = useState<Date | null>(null)  // ✅ When 2-hour lock expires
  
  // ✅ FIXED: Timestamp-based timer that survives app minimize and screen changes
  const [matchExpiresAt, setMatchExpiresAt] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  
  // ✅ NEW: Track if this is a NEW match (for sound) vs returning from chat
  const [isNewMatch, setIsNewMatch] = useState(false)

  // ✅ NEW: Check-in state
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [showCheckInBadge, setShowCheckInBadge] = useState(true)  // ✅ NEW: Control badge visibility
  const [showVenueStatus, setShowVenueStatus] = useState(false)  // ✅ NEW: Venue status modal

  // ✅ Search preferences
  const [searchPreferences, setSearchPreferences] = useState({
    maxDistance: 500,
    ageRange: [18, 80] as [number, number],
    // ✅ "She Decides" - lookingFor removed (automatic opposite gender)
    expandSearch: false
  })

  // ✅ NEW: Iguana searching modal (when match partner deletes account)
  const [showMatchEnded, setShowMatchEnded] = useState(false)
  
  // ✅ NEW: "We're Meeting!" notification for the OTHER user
  const [showWeAreMeeting, setShowWeAreMeeting] = useState(false)
  const [meetingPartnerInfo, setMeetingPartnerInfo] = useState<{
    name: string
    photo: string
  } | null>(null)

  // ✅ NEW: QR Scan Required modal - shown after onboarding if no check-in
  const [showQRScanRequired, setShowQRScanRequired] = useState(false)
  
  // ✅ NEW: In-App Notification for messages
  const [inAppNotification, setInAppNotification] = useState<{
    isVisible: boolean
    message: string
    senderName?: string
    senderPhoto?: string
    chatId?: string
    fromUserId?: string  // ✅ NEW: For navigating to correct chat
    type?: 'message' | 'match' | 'meeting' | 'info'
  }>({
    isVisible: false,
    message: '',
    senderName: undefined,
    senderPhoto: undefined,
    chatId: undefined,
    fromUserId: undefined,  // ✅ NEW
    type: 'info'
  })

  const [onboardingData, setOnboardingData] = useState({
    gender: 'male' as 'male' | 'female',
    // ✅ "She Decides" - lookingFor is automatic (opposite gender)
    // No orientation - straight dating only
    age: 25,
    ageRange: [21, 35] as [number, number],
    minDistance: 50,
    maxDistance: 500,
    hobbies: [] as string[],
    photos: [] as string[],
    bio: '',
    name: '',
    city: '' as string,
    occupation: '' as string,
    languages: ['he'] as string[],  // ✅ Languages (Hebrew default)
    // ✅ Lifestyle fields
    drinking: 'social' as string,
    smoking: 'no' as string,
    height: '' as string,
    education: '' as string,
    relationshipType: 'relationship' as string,
  })

  // ✅ HARDWARE BACK BUTTON HANDLER - For Android devices
  // Maps each screen to its previous screen
  const screenBackMap: Record<Screen, Screen | null> = {
    'splash': null,
    'welcome': null,
    'login': 'welcome',
    'signup': 'welcome',
    'onboarding-welcome': null,  // Don't allow back from welcome
    'onboarding-name': null,  // Don't allow back from name entry
    'onboarding-gender': 'onboarding-name',
    // ✅ "She Decides" - Skip orientation, go directly gender → age
    'onboarding-age': 'onboarding-gender',
    'onboarding-hobbies': 'onboarding-age',
    'onboarding-lifestyle': 'onboarding-hobbies',
    'onboarding-photos': 'onboarding-lifestyle',
    'home': null,  // Don't allow back from home (main screen)
    'match': 'home',
    'notifications': 'home',
    'profile': 'home',
    'chat': 'match',
    'scan': 'home'
  }

  // ✅ Handle hardware back button press
  useEffect(() => {
    // Push initial state
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: currentScreen }, '', '')
    }

    const handlePopState = (event: PopStateEvent) => {
      console.log('📱 Hardware back button pressed')
      console.log(`   Current screen: ${currentScreen}`)
      
      const previousScreen = screenBackMap[currentScreen]
      
      if (previousScreen) {
        console.log(`   Navigating to: ${previousScreen}`)
        setCurrentScreen(previousScreen)
        // Push new state to prevent exiting app on next back press
        window.history.pushState({ screen: previousScreen }, '', '')
      } else {
        console.log('   No previous screen - staying on current screen')
        // Prevent app exit by pushing state back
        window.history.pushState({ screen: currentScreen }, '', '')
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentScreen])

  // ✅ Push state when screen changes (for back button to work correctly)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: currentScreen }, '', '')
    }
  }, [currentScreen])

  // ✅ NEW: Handle Stripe payment success redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment_success')
    const paymentPlan = urlParams.get('plan')
    const paymentCancelled = urlParams.get('payment_cancelled')
    
    if (paymentSuccess === 'true' && paymentPlan) {
      console.log(`🎉 Payment successful! Plan: ${paymentPlan}`)
      
      // Show success message
      setTimeout(() => {
        alert(`🎉 Payment Successful!\n\nYour ${paymentPlan === 'weekly' ? 'Weekly' : paymentPlan === 'monthly' ? 'Monthly' : ''} Premium subscription is now active!\n\nEnjoy unlimited matches!`)
      }, 500)
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
      
      // Reload user data to get updated premium status
      if (user) {
        console.log('🔄 Reloading user pass data after payment...')
        getUserPassData(user.uid).then((passData) => {
          setPassesLeft(passData.passesLeft)
          setIsPremium(passData.isPremium)
          setIsPhoneLocked(false)
          setPhoneLockExpiresAt(null)
          setPassResetTime(null)
          console.log('✅ User data reloaded:', passData)
        }).catch(console.error)
      }
    }
    
    if (paymentCancelled === 'true') {
      console.log('❌ Payment was cancelled')
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [user])

  // ✅ GLOBAL: Keep Screen On (Wake Lock API) - loads from localStorage
  useEffect(() => {
    let wakeLock: any = null
    
    const initWakeLock = async () => {
      if (typeof window === 'undefined') return
      
      const keepScreenOn = localStorage.getItem('i4iguana_keep_screen_on') === 'true'
      
      if (keepScreenOn && 'wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen')
          console.log('🔆 Global Wake Lock activated on app start!')
          
          // Re-acquire on visibility change
          const handleVisibility = async () => {
            if (document.visibilityState === 'visible' && keepScreenOn) {
              try {
                wakeLock = await (navigator as any).wakeLock.request('screen')
                console.log('🔆 Wake Lock re-acquired')
              } catch (e) {}
            }
          }
          document.addEventListener('visibilitychange', handleVisibility)
          
          return () => document.removeEventListener('visibilitychange', handleVisibility)
        } catch (err) {
          console.warn('⚠️ Wake Lock not available')
        }
      }
    }
    
    initWakeLock()
    
    return () => {
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, []) // Run once on mount

  // ✅ FIXED: Listen for new messages from ALL matches - Real-time!
  useEffect(() => {
    if (!user || currentScreen === 'chat') return
    
    console.log('👀 Setting up real-time message listeners')
    
    // Get all active matches for this user
    const matchesRef = collection(db, 'activeMatches')
    const q = query(
      matchesRef,
      where('users', 'array-contains', user.uid),
      where('isActive', '==', true)
    )
    
    const unsubscribe = onSnapshot(q, (matchesSnapshot) => {
      console.log(`📬 Monitoring ${matchesSnapshot.docs.length} active matches for messages`)
      
      matchesSnapshot.docs.forEach((matchDoc) => {
        const matchId = matchDoc.id
        const messagesRef = collection(db, 'matches', matchId, 'messages')
        
        // ✅ Listen for ALL messages, filter client-side
        const messageQuery = query(
          messagesRef,
          where('read', '==', false)
        )
        
        onSnapshot(messageQuery, async (messagesSnapshot) => {
          messagesSnapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const messageData = change.doc.data()
              
              // Only show if message is FOR this user (not FROM this user)
              if (messageData.senderId !== user.uid) {
                console.log('📬 New message received! From:', messageData.senderId)
                
                // Get sender info
                try {
                  const senderDoc = await getDoc(doc(db, 'users', messageData.senderId))
                  const senderData = senderDoc.data()
                  
                  // Show InAppNotification
                  setInAppNotification({
                    isVisible: true,
                    message: messageData.text || 'Sent you a message',
                    senderName: senderData?.name || senderData?.displayName || 'Your match',
                    senderPhoto: senderData?.photos?.[0] || senderData?.photoURL,
                    chatId: matchId,
                    type: 'message'  // ✅ Added type
                  })
                  
                  console.log('✅ InAppNotification shown for message!')
                  
                } catch (error) {
                  console.error('Error getting sender info:', error)
                  setInAppNotification({
                    isVisible: true,
                    message: 'You have a new message! 💚',
                    chatId: matchId,
                    type: 'message'  // ✅ Added type
                  })
                }
              }
            }
          })
        })
      })
    })
    
    return () => unsubscribe()
  }, [user, currentScreen])

  // ✅ FIXED: Listen for ALL new notifications - Real-time popup!
  useEffect(() => {
    if (!user) return
    
    console.log('📢 Setting up real-time notifications listener for popups')
    
    // Track when we started listening (to avoid showing old notifications)
    // ✅ FIX: Subtract 5 seconds to handle server/client time differences
    const sessionStartTime = new Date(Date.now() - 5000)
    
    // ✅ FIXED: Listen to TOP-LEVEL notifications collection
    const notificationsRef = collection(db, 'notifications')
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('isRead', '==', false)
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notifData = change.doc.data()
          
          // Check if notification is new (created after we started listening)
          const notifTime = notifData.timestamp?.toDate() || notifData.createdAt?.toDate()
          if (notifTime && notifTime < sessionStartTime) {
            console.log('📦 Old notification, skipping popup:', notifData.title)
            return
          }
          
          console.log('🔔 NEW notification received!', notifData)
          
          // Determine notification type for styling
          const notifType = notifData.type || 'info'
          let displayType: 'message' | 'match' | 'meeting' | 'info' = 'info'
          
          if (notifType === 'message') displayType = 'message'
          else if (notifType === 'match') displayType = 'match'
          else if (notifType === 'meeting') displayType = 'meeting'
          else if (notifType === 'venue_announcement') displayType = 'info'
          
          // ✅ NEW: Auto-show "We're Meeting!" modal for meeting notifications
          if (displayType === 'meeting') {
            console.log('🎉 Auto-showing We\'re Meeting modal!')
            
            // Play celebration sound! 🔔 (no await in forEach)
            try {
              const audio = new Audio('/match-sound.mp3')
              audio.volume = 0.8
              audio.play().catch(err => console.warn('Could not play sound:', err))
              console.log('🔊 Celebration sound played!')
            } catch (err) {
              console.warn('Could not play sound:', err)
            }
            
            setMeetingPartnerInfo({
              name: notifData.fromUserName || 'Your match',
              photo: notifData.fromUserPhoto || ''
            })
            setShowWeAreMeeting(true)
            // Don't show regular notification popup - modal is enough
            return
          }
          
          // ✅ CRITICAL FIX: Don't show match popup if already on match screen!
          // This prevents duplicate notifications when user is already viewing the match
          if (displayType === 'match' && currentScreen === 'match') {
            console.log('📦 Already on match screen - skipping popup')
            return
          }
          
          // ✅ Also skip chat notifications if already in chat with that person
          if (displayType === 'message' && currentScreen === 'chat' && notifData.chatId) {
            console.log('📦 Already in chat - skipping popup')
            return
          }
          
          // ✅ FIX: Get photo URL - handle both photo string and photos array
          let photoUrl = notifData.fromUserPhoto
          if (!photoUrl && notifData.photos && notifData.photos.length > 0) {
            photoUrl = notifData.photos[0]
          }
          
          // Show InAppNotification popup!
          setInAppNotification({
            isVisible: true,
            message: notifData.subtitle || notifData.message || notifData.title,
            senderName: notifData.fromUserName || notifData.venueName || notifData.title,
            senderPhoto: photoUrl,  // ✅ FIX: Use resolved photo URL
            chatId: notifData.chatId,
            fromUserId: notifData.fromUserId,  // ✅ NEW: For navigating to correct chat
            type: displayType
          })
          
          console.log('✅ Popup notification shown!', { photoUrl, senderName: notifData.fromUserName })
        }
      })
    }, (error) => {
      console.error('❌ Error in notifications listener:', error)
    })
    
    return () => {
      console.log('🔇 Cleaning up notifications popup listener')
      unsubscribe()
    }
  }, [user])

  // ✅ NEW: Listen for "We're Meeting!" from the other user
  useEffect(() => {
    if (!user || !matchedUser) return
    
    const matchId = createMatchId(user.uid, matchedUser.uid || matchedUser.id)
    console.log(`👀 Listening for "We're Meeting" on match: ${matchId}`)
    
    const matchRef = doc(db, 'activeMatches', matchId)
    
    const unsubscribe = onSnapshot(matchRef, async (snapshot) => {
      if (!snapshot.exists()) return
      
      const data = snapshot.data()
      
      // Check if someone clicked "We're Meeting" and it wasn't us
      if (data.status === 'successful' && 
          data.meetingConfirmedBy && 
          data.meetingConfirmedBy !== user.uid) {
        
        console.log('🎉 Partner clicked "We\'re Meeting!"')
        
        // Get partner info
        const partnerName = matchedUser.name || matchedUser.displayName || 'Your match'
        const partnerPhoto = matchedUser.photos?.[0] || matchedUser.photoURL || ''
        
        setMeetingPartnerInfo({
          name: partnerName,
          photo: partnerPhoto
        })
        
        // Play match sound! 🔔
        try {
          const audio = new Audio('/match-sound.mp3')
          audio.volume = 0.8
          await audio.play()
          console.log('🔊 Match sound played!')
        } catch (err) {
          console.warn('Could not play sound:', err)
        }
        
        // Show the modal!
        setShowWeAreMeeting(true)
      }
    })
    
    return () => unsubscribe()
  }, [user, matchedUser])

  // ✅ OPTIMIZED: Handle auth state changes with timeout
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Auth still loading...')
        return
      }

      // ✅ CRITICAL FIX: Check if account was JUST deleted - go straight to welcome!
      // This flag is set by handleDeleteAccount and cleared after navigation
      const justDeleted = localStorage.getItem('i4iguana_just_deleted')
      if (justDeleted === 'true') {
        console.log('🗑️ Account JUST deleted → WELCOME (bypass all checks)')
        localStorage.removeItem('i4iguana_just_deleted')
        setCurrentScreen("welcome")
        return
      }

      // ✅ FIX: Skip if already in onboarding flow - don't interrupt user!
      const onboardingScreens = ["onboarding-welcome", "onboarding-name", "onboarding-gender", "onboarding-age", "onboarding-hobbies", "onboarding-lifestyle", "onboarding-photos"]
      if (onboardingScreens.includes(currentScreen)) {
        console.log('✅ Already in onboarding flow, not interrupting')
        return
      }

      console.log('🔍 Auth check:', user?.email || 'No user')
      
      // No user → stay on/go to welcome (unless already in auth flow)
      if (!user) {
        const authFlowScreens = ["splash", "welcome", "login", "onboarding-welcome", "onboarding-name", "onboarding-gender", "onboarding-age", "onboarding-hobbies", "onboarding-lifestyle", "onboarding-photos"]
        if (!authFlowScreens.includes(currentScreen)) {
          console.log('❌ No user → WELCOME')
          setCurrentScreen("welcome")
        }
        return
      }
      
      // User exists → check if we need to navigate
      // Skip if already on home/match/notifications/profile/chat/scan
      const appScreens = ["home", "match", "notifications", "profile", "chat", "scan"]
      if (appScreens.includes(currentScreen)) {
        console.log('✅ Already in app, staying on:', currentScreen)
        return
      }
      
      // ✅ Check profile with timeout (5 seconds max on mobile)
      try {
        const profilePromise = getUserProfile(user.uid)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile check timeout')), 5000)
        )
        
        const profile = await Promise.race([profilePromise, timeoutPromise]) as any
        
        // ⚡ FIX: Account was deleted - reset flag and go straight to ONBOARDING
        // NO signOut needed - user just logged in, let them create new profile!
        if (profile?.deleted === true) {
          console.log('🗑️ Account was deleted → Resetting flag, going to ONBOARDING')
          
          // Clear any localStorage flags
          localStorage.removeItem('hasScannedQR')
          localStorage.removeItem('pendingCheckIn')
          sessionStorage.clear()
          
          // ✅ Reset deleted flag - user is re-registering
          const { doc, updateDoc } = await import('firebase/firestore')
          const { db } = await import('@/lib/firebase')
          await updateDoc(doc(db, 'users', user.uid), { 
            deleted: false, 
            onboardingComplete: false 
          })
          console.log('✅ Reset deleted flag to false')
          
          // ✅ Go directly to WELCOME - start onboarding flow!
          setCurrentScreen("onboarding-welcome")
          return
        }
        
        const hasCompletedOnboarding = profile?.onboardingComplete === true
        const hasBasicProfile = profile && profile.photos && profile.photos.length > 0 && (profile.name || profile.displayName)
        
        if (hasCompletedOnboarding || hasBasicProfile) {
          console.log('✅ Existing user detected')
          
          // ✅ CRITICAL FIX: Load gender from profile for "She Decides" logic!
          if (profile?.gender) {
            console.log(`👤 Loading gender from profile: ${profile.gender}`)
            setOnboardingData(prev => ({ ...prev, gender: profile.gender }))
          }
          
          // ✅ CRITICAL: Check for active match BEFORE going to home!
          // This ensures seamless return to match after logout/login
          console.log('🔍 Checking for active match before navigation...')
          try {
            const activeMatch = await getActiveMatchForUser(user.uid)
            
            if (activeMatch && activeMatch.matchedUser && activeMatch.expiresAt) {
              console.log('🎯 ACTIVE MATCH FOUND! Going directly to match screen')
              console.log(`   Partner: ${activeMatch.matchedUser.name}`)
              console.log(`   Expires: ${activeMatch.expiresAt.toLocaleString()}`)
              
              setMatchedUser(activeMatch.matchedUser)
              setMatchExpiresAt(activeMatch.expiresAt)
              setIsLockedInMatch(true)
              setIsNewMatch(false)  // Not a new match - don't play sound
              setCurrentScreen("match")  // Go directly to match screen!
              return  // Don't go to home
            }
          } catch (matchError) {
            console.error('⚠️ Error checking for active match:', matchError)
            // Continue to home if error
          }
          
          console.log('📭 No active match → HOME')
          setCurrentScreen("home")
        } else {
          console.log('🆕 New user → WELCOME ONBOARDING')
          setCurrentScreen("onboarding-welcome")
        }
      } catch (error: any) {
        console.error('⚠️ Error checking profile:', error.message)
        // ✅ On timeout or error, assume new user → go to onboarding
        console.log('🆕 Timeout/Error → WELCOME ONBOARDING (safe default)')
        setCurrentScreen("onboarding-welcome")
      }
    }

    checkAuth()
  }, [user, authLoading, currentScreen])

  // ✅ NEW: Load check-in status when user logs in
  // ✅ Load check-in status on app start and when returning to home
  useEffect(() => {
    const loadCheckInStatus = async () => {
      if (!user) {
        setCheckInData(null)
        setIsCheckedIn(false)
        return
      }
      
      try {
        const status = await getUserCheckInStatus(user.uid)
        
        if (status.isCheckedIn && status.checkInData) {
          console.log('✅ User is checked in:', status.checkInData.venueDisplayName)
          setCheckInData(status.checkInData)
          setIsCheckedIn(true)
        } else {
          console.log('ℹ️ User not checked in (or check-in expired)')
          setCheckInData(null)
          setIsCheckedIn(false)
          
          // ✅ CRITICAL FIX: If user opens app while NOT checked in (e.g., at home after 4 hours expired)
          // Show QR Scan modal to guide them back to a venue
          // This protects privacy - user won't see nearby matches from home!
          // ✅ FIX: Only show if on home screen (not during onboarding/login flow)
          if (currentScreen === "home") {
            // Double-check user has completed onboarding by checking profile
            const userProfile = await getUserProfile(user.uid)
            if (userProfile && userProfile.onboardingComplete === true) {
              console.log('🏠 User on home screen without check-in → showing QR modal for privacy')
              setTimeout(() => {
                setShowQRScanRequired(true)
              }, 1000)  // 1 second delay to let home screen render
            } else {
              console.log('⏳ Onboarding not complete yet, skipping QR modal')
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading check-in status:', error)
      }
    }
    
    loadCheckInStatus()
  }, [user, currentScreen])  // ✅ Added currentScreen dependency to detect when user returns to home

  // ✅ NEW: Real-time listener for active matches - User B gets notified immediately!
  useEffect(() => {
    if (!user) return
    
    console.log('👂 Setting up real-time listener for active matches...')
    
    // Listen to activeMatches collection for any match involving this user
    const activeMatchesRef = collection(db, 'activeMatches')
    const q = query(
      activeMatchesRef,
      where('users', 'array-contains', user.uid),
      where('isActive', '==', true)
    )
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('🔔 Active matches snapshot received:', snapshot.size, 'matches')
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const matchData = change.doc.data()
          console.log('🎉 NEW MATCH DETECTED via real-time listener!', {
            matchId: change.doc.id,
            users: matchData.users,
            expiresAt: matchData.expiresAt?.toDate(),
            status: matchData.status
          })
          
          // ✅ CRITICAL FIX: Don't navigate to match if status is 'successful'
          // This means "We're Meeting" was already clicked and match is done
          if (matchData.status === 'successful') {
            console.log('⏭️ Match already successful - skipping navigation to match screen')
            return
          }
          
          // ✅ CRITICAL FIX: Don't navigate if we're already on home and match is not new
          // Check if this match was already shown by looking at session storage
          const matchShownKey = `match_shown_${change.doc.id}`
          if (sessionStorage.getItem(matchShownKey)) {
            console.log('⏭️ Match already shown in this session - skipping navigation')
            return
          }
          
          // Get the OTHER user (the one who's not me)
          const otherUserId = matchData.users.find((id: string) => id !== user.uid)
          
          if (otherUserId) {
            try {
              // Load other user's profile
              const otherUserProfile = await getUserProfile(otherUserId)
              
              if (otherUserProfile) {
                console.log('✅ Loading match screen for:', otherUserProfile.name)
                
                // ✅ Mark this match as shown
                sessionStorage.setItem(matchShownKey, 'true')
                
                // Set match state
                setMatchedUser(otherUserProfile)
                setMatchExpiresAt(matchData.expiresAt?.toDate() || new Date(Date.now() + 10 * 60 * 1000))
                setIsLockedInMatch(true)
                setIsNewMatch(true)  // Play sound!
                
                // Navigate to match screen
                setCurrentScreen('match')
                
                console.log('🎯 User B: Match screen loaded via real-time sync!')
              }
            } catch (error) {
              console.error('❌ Error loading matched user profile:', error)
            }
          }
        }
        
        if (change.type === 'removed') {
          console.log('⏰ Match expired or removed:', change.doc.id)
        }
      })
    }, (error) => {
      console.error('❌ Error in activeMatches listener:', error)
    })
    
    // Cleanup listener on unmount
    return () => {
      console.log('👋 Cleaning up activeMatches listener')
      unsubscribe()
    }
  }, [user])

  // ✅ FIXED: Handle logout - navigate back to welcome
  useEffect(() => {
    // Skip if still loading auth
    if (authLoading) return
    
    // ✅ FIX: Skip if already in onboarding flow - don't interrupt user!
    const onboardingScreens = ["onboarding-welcome", "onboarding-name", "onboarding-gender", "onboarding-age", "onboarding-hobbies", "onboarding-lifestyle", "onboarding-photos"]
    if (onboardingScreens.includes(currentScreen)) {
      console.log('✅ In onboarding, skipping logout check')
      return
    }
    
    // ✅ Skip if on splash/welcome/login (already in auth flow)
    const authFlowScreens = ["splash", "welcome", "login"]
    if (authFlowScreens.includes(currentScreen)) return
    
    // If user logged out (user=null) while in app → go back to welcome
    if (!user) {
      console.log('🚪 User logged out → WELCOME')
      setCurrentScreen("welcome")
    }
  }, [user, authLoading, currentScreen])

  // ✅ Load pass data and check profile when on home screen
  useEffect(() => {
    const initializeHomeScreen = async () => {
      if (!user || currentScreen !== "home") return

      try {
        // ✅ Step 1: Get or create phone identity
        const phoneNumber = getDevModePhoneNumber(user.uid)
        console.log('📱 Using phone number:', phoneNumber)
        
        const phoneIdentity = await getOrCreatePhoneIdentity(phoneNumber, user.uid)
        setUserPhoneNumber(phoneNumber)
        
        // ✅ Step 2: Sync user profile with phone identity
        await syncUserWithPhoneIdentity(user.uid, phoneNumber, {
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined
        })
        
        // ✅ Step 2.5: Check for active match (restore after app closed from memory)
        console.log('🔍 Checking for active matches...')
        const activeMatch = await getActiveMatchForUser(user.uid)
        
        if (activeMatch && activeMatch.matchedUser && activeMatch.expiresAt) {
          console.log('✅ Active match found! Restoring match state...')
          console.log(`   Partner: ${activeMatch.matchedUser.name}`)
          console.log(`   Expires: ${activeMatch.expiresAt.toLocaleString()}`)
          
          setMatchedUser(activeMatch.matchedUser)
          setMatchExpiresAt(activeMatch.expiresAt)
          setIsLockedInMatch(true)
          setIsNewMatch(false)  // Not a new match - don't play sound
          setCurrentScreen("match")  // Go directly to match screen
          
          console.log('🎯 Navigating to match screen with restored state')
          return  // Exit early - don't load nearby users
        } else {
          console.log('📭 No active matches - continuing to home')
        }
        
        // ✅ Step 3: Check if phone is locked (2-hour cooldown)
        const lockStatus = await isPhoneIdentityLocked(phoneNumber)
        setIsPhoneLocked(lockStatus.isLocked)
        setPhoneLockTimeRemaining(lockStatus.remainingTime)
        
        if (lockStatus.isLocked && lockStatus.remainingTime > 0) {
          // Calculate when the lock expires
          const expiresAt = new Date(Date.now() + lockStatus.remainingTime * 1000)
          setPhoneLockExpiresAt(expiresAt)
          setPassResetTime(expiresAt)  // ✅ FIXED: passResetTime = phoneLockExpiresAt (same timer!)
          console.log(`🔒 Phone locked for ${Math.floor(lockStatus.remainingTime / 60)} more minutes`)
          console.log(`🔒 Timer expires at: ${expiresAt.toLocaleString()}`)
        } else {
          setPhoneLockExpiresAt(null)
          setPassResetTime(null)  // ✅ FIXED: No timer when not locked
        }
        
        // ✅ Step 4: Load pass data (now based on phone identity)
        const passData = await getUserPassData(user.uid)
        setPassesLeft(passData.passesLeft)
        setIsPremium(passData.isPremium)
        
        // ✅ Step 4.5: Check if user is a SUPER USER - auto-upgrade to Premium!
        if (!passData.isPremium && user.email) {
          const { isSuperUser, upgradeUserToPremium } = await import('@/lib/demo-payment-service')
          
          if (isSuperUser(user.email)) {
            console.log('👑 SUPER USER DETECTED - Auto-upgrading to Premium!')
            try {
              await upgradeUserToPremium(user.uid, 'lifetime')
              
              // Reload pass data
              const updatedPassData = await getUserPassData(user.uid)
              setPassesLeft(updatedPassData.passesLeft)
              setIsPremium(updatedPassData.isPremium)
              
              // Clear lock
              setIsPhoneLocked(false)
              setPhoneLockExpiresAt(null)
              setPassResetTime(null)
              
              console.log('✅ Super user upgraded to Premium automatically!')
            } catch (error) {
              console.error('❌ Failed to upgrade super user:', error)
            }
          }
        }
        
        console.log(`📊 Pass Data:`, {
          passesLeft: passData.passesLeft,
          isPremium: passData.isPremium,
          phoneLocked: lockStatus.isLocked,
          nextPassAt: lockStatus.isLocked ? new Date(Date.now() + lockStatus.remainingTime * 1000).toLocaleString() : 'Not locked'
        })

        // ✅ Step 5: Load nearby users (only if not locked)
        if (!lockStatus.isLocked) {
          await loadNearbyUsers()
        }
      } catch (error) {
        console.error('❌ Error initializing home screen:', error)
      }
    }

    initializeHomeScreen()
  }, [user, currentScreen])

  // ✅ FIXED: Timestamp-based timer - runs continuously regardless of screen
  useEffect(() => {
    if (!matchExpiresAt) {
      setTimeRemaining(0)
      return
    }
    
    const updateTimer = () => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((matchExpiresAt.getTime() - now.getTime()) / 1000))
      setTimeRemaining(remaining)
      
      if (remaining <= 0) {
        console.log('⏰ Match timer expired!')
        setMatchExpiresAt(null)
        setIsLockedInMatch(false)
        
        // Clear active match in Firestore
        if (matchedUser && user) {
          clearActiveMatch(user.uid, matchedUser.uid).catch(err => 
            console.error('Error clearing expired match:', err)
          )
          
          // ✅ Clear match sound flag so next match will play sound
          const storageKey = `match_sound_played_${matchedUser.uid}`
          sessionStorage.removeItem(storageKey)
          console.log('🔊 Cleared match sound flag for next match')
        }
        
        // ✅ Show Match Ended Screen (5 seconds) then return to home
        if (currentScreen === "match" || currentScreen === "chat") {
          setShowMatchEnded(true)
        }
      }
    }
    
    // Update immediately
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [matchExpiresAt, currentScreen, matchedUser, user])

  // 🔒 Phone Lock Timer - Runs continuously for 2-hour lockout
  useEffect(() => {
    if (!phoneLockExpiresAt) {
      setPhoneLockTimeRemaining(0)
      return
    }
    
    const updateLockTimer = () => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((phoneLockExpiresAt.getTime() - now.getTime()) / 1000))
      setPhoneLockTimeRemaining(remaining)
      
      if (remaining <= 0) {
        console.log('🔓 Phone lock expired!')
        setPhoneLockExpiresAt(null)
        setIsPhoneLocked(false)
      }
    }
    
    // Update immediately
    updateLockTimer()
    
    // Update every second
    const interval = setInterval(updateLockTimer, 1000)
    
    return () => clearInterval(interval)
  }, [phoneLockExpiresAt])

  // ⏰ Out of Passes Timer Display - Updates every second for modal
  useEffect(() => {
    if (!passResetTime) {
      setOutOfPassesTimerDisplay('02:00:00')
      return
    }
    
    const updateOutOfPassesTimer = () => {
      const now = new Date()
      const diff = Math.max(0, passResetTime.getTime() - now.getTime())
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diff % (1000 * 60)) / 1000)
      const display = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      setOutOfPassesTimerDisplay(display)
      
      if (diff <= 0) {
        console.log('✅ Pass timer expired - user can get new pass!')
        
        // ✅ CRITICAL FIX: Reload pass data from Firebase
        if (user?.uid) {
          getUserPassData(user.uid)
            .then(passData => {
              console.log(`🔓 Pass restored! New passes: ${passData.passesLeft}`)
              setPassesLeft(passData.passesLeft)
              setIsPremium(passData.isPremium)
              setIsPhoneLocked(false)
              setPassResetTime(null)
              setPhoneLockExpiresAt(null)
              
              // Close Out of Passes modal if open
              setShowOutOfPasses(false)
            })
            .catch(err => {
              console.error('❌ Error reloading pass data:', err)
            })
        } else {
          // Fallback if no user
          setPassResetTime(null)
          setIsPhoneLocked(false)
        }
      }
    }
    
    // Update immediately
    updateOutOfPassesTimer()
    
    // Update every second
    const interval = setInterval(updateOutOfPassesTimer, 1000)
    
    return () => clearInterval(interval)
  }, [passResetTime, user])

  // ✅ FIXED: Restore timer from Firestore when returning to match/chat screen
  useEffect(() => {
    const restoreTimerFromFirestore = async () => {
      if (!user || !matchedUser) return
      if (currentScreen !== "match" && currentScreen !== "chat") return
      if (matchExpiresAt) return // Already have timer
      
      console.log('🔄 Attempting to restore timer from Firestore...')
      
      try {
        const expiresAt = await getActiveMatchExpiration(user.uid, matchedUser.uid)
        
        if (expiresAt) {
          console.log(`✅ Timer restored from Firestore: expires at ${expiresAt.toLocaleString()}`)
          setMatchExpiresAt(expiresAt)
          setIsLockedInMatch(true)
        } else {
          console.log('⏰ No active match found in Firestore')
        }
      } catch (error) {
        console.error('❌ Error restoring timer:', error)
      }
    }
    
    restoreTimerFromFirestore()
  }, [user, matchedUser, currentScreen, matchExpiresAt])

  // ✅ NEW: Check if match partner deleted account (while in match/chat screen)
  useEffect(() => {
    if (!user || !matchedUser) return
    if (currentScreen !== "match" && currentScreen !== "chat") return
    if (!matchExpiresAt) return  // No active match
    
    const checkMatchStillActive = async () => {
      try {
        // ✅ First check status - if 'successful', partner clicked "We're Meeting!"
        const status = await getMatchStatus(user.uid, matchedUser.uid || matchedUser.id)
        
        if (status === 'successful') {
          // Partner clicked "We're Meeting!" - DON'T show MatchEndedScreen!
          // The WeAreMeetingModal listener will handle this
          console.log('💕 Match is successful - partner clicked We\'re Meeting!')
          return
        }
        
        const expiresAt = await getActiveMatchExpiration(user.uid, matchedUser.uid)
        
        if (!expiresAt) {
          // Match no longer exists but timer hasn't expired yet
          // This means partner deleted account or match was cancelled
          console.log('💔 Match partner deleted account or cancelled match')
          
          // ✅ Show Match Ended screen (3 seconds)
          setShowMatchEnded(true)
        }
      } catch (error) {
        console.error('❌ Error checking match status:', error)
      }
    }
    
    // Check every 5 seconds
    const interval = setInterval(checkMatchStillActive, 5000)
    
    return () => clearInterval(interval)
  }, [user, matchedUser, currentScreen, matchExpiresAt])

  const loadNearbyUsers = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Get user's current location
      const location = await getCurrentLocation()
      console.log('📍 User location:', location)
      
      // ✅ NEW: Verify user is still at venue before searching
      // Auto-checkout if user left the area (more than 2km away)
      if (isCheckedIn && checkInData) {
        console.log('🔍 Verifying user still at venue...')
        const proximityCheck = await verifyUserStillAtVenue(
          user.uid,
          location.latitude,
          location.longitude
        )
        
        if (!proximityCheck.stillAtVenue) {
          console.log(`🚪 User left ${proximityCheck.venueName} - auto-checked out`)
          
          // Update local state
          setIsCheckedIn(false)
          setCheckInData(null)
          setShowCheckInBadge(false)
          
          // Show notification and redirect to scan screen
          setInAppNotification({
            isVisible: true,
            message: `You left ${proximityCheck.venueName}. Scan a QR code at your new venue to continue matching!`,
            type: 'info'
          })
          
          // Show QR scan screen after a brief delay
          setTimeout(() => {
            setCurrentScreen("scan")
          }, 2000)
          
          setLoading(false)
          return  // Don't continue with search
        }
      }
      
      // Update user's location in Firestore
      await updateUserLocation(user.uid, location.latitude, location.longitude, location.geohash)
      
      // ✅ SIMPLIFIED: Check if user is checked in to a venue
      const userVenue = await getUserVenue(user.uid)
      
      let users: any[] = []
      
      if (userVenue) {
        // ✅ SIMPLIFIED: Just pass venue and user ID - function reads profile from Firestore
        console.log(`🏢 Loading users at venue: ${userVenue}`)
        users = await getUsersByVenue(userVenue, user.uid)
        console.log(`👥 Found ${users.length} users at venue`)
      } else {
        // ✅ User NOT checked in - don't show ANY users!
        console.log('⚠️ User not checked in to venue - NOT loading users')
        console.log('   User must scan QR code at venue to see matches')
        users = []
        
        // ✅ Show QR Scan Required modal if not already shown
        if (!showQRScanRequired && currentScreen === "home") {
          const userProfile = await getUserProfile(user.uid)
          if (userProfile && userProfile.onboardingComplete === true) {
            setTimeout(() => {
              setShowQRScanRequired(true)
            }, 500)
          }
        }
      }
      
      setNearbyUsers(users)
      
      // ✅ FIX: Reset alert flag on successful load
      locationAlertShownRef.current = false
      
    } catch (error: any) {
      console.error('❌ Error loading nearby users:', error)
      
      // ✅ FIX: Show location permission alert ONLY ONCE per session
      if (!locationAlertShownRef.current && 
          (error.message?.includes('Location permission denied') || 
           error.message?.includes('permission'))) {
        
        locationAlertShownRef.current = true // Mark as shown
        
        alert('📍 Location Access Required\n\nI4IGUANA needs your location to find nearby matches.\n\nPlease:\n1. Go to Settings\n2. Find I4IGUANA or your browser\n3. Enable Location permissions\n4. Refresh the page')
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Handle check-in success
  const handleCheckIn = async (newCheckInData: CheckInData) => {
    console.log('🎉 Check-in requested:', newCheckInData)
    
    // ✅ NEW: Auto checkout if already checked in at different venue
    if (isCheckedIn && checkInData && checkInData.venueId !== newCheckInData.venueId) {
      console.log('🔄 Already checked in at different venue - auto checkout first')
      console.log(`   Old venue: ${checkInData.venueName}`)
      console.log(`   New venue: ${newCheckInData.venueName}`)
      
      try {
        if (user) {
          await performCheckOut(user.uid)
          console.log('✅ Auto checkout successful')
        }
      } catch (error) {
        console.error('❌ Error during auto checkout:', error)
      }
    }
    
    // Set new check-in data
    setCheckInData(newCheckInData)
    setIsCheckedIn(true)
    setShowCheckInBadge(true)  // ✅ Show badge on new check-in
    
    // ✅ Close QR Scan Required modal if it was open
    setShowQRScanRequired(false)
    
    // Reload users from this venue
    await loadNearbyUsers()
    
    console.log(`✅ Checked in at: ${newCheckInData.venueName}`)
  }

  // ✅ NEW: Handle check-out
  const handleCheckOut = async () => {
    if (!user) return
    
    try {
      console.log('🚪 Checking out...')
      await performCheckOut(user.uid)
      
      setCheckInData(null)
      setIsCheckedIn(false)
      
      // Reload normal proximity-based users
      await loadNearbyUsers()
      
      console.log('✅ Checked out successfully')
    } catch (error) {
      console.error('❌ Error checking out:', error)
    }
  }

  // ✅ NEW: Handle PASS on search screen - save to swipedLeft in Firestore
  // This ensures users don't see the same profiles after navigating away
  const handlePassOnSearch = async (passedUser: any) => {
    if (!user) return
    
    try {
      console.log(`❌ Saving PASS on ${passedUser.name || passedUser.uid} to Firestore...`)
      
      // ✅ Call recordSwipe with liked=false to add to swipedLeft
      await recordSwipe(user.uid, passedUser.uid, false)
      
      console.log(`✅ PASS saved - ${passedUser.name} won't appear again`)
    } catch (error) {
      console.error('❌ Error saving pass:', error)
      // Don't throw - user can still continue browsing
    }
  }

  const handleMatch = async (matchUser: any) => {
    if (!user) return
    
    // ✅ NEW FLOW: Check if user has passes BEFORE creating match
    if (!isPremium && passesLeft === 0) {
      console.log('🛑 No passes left! Showing Out of Passes Modal...')
      
      // ✅ CRITICAL FIX: ALWAYS load lock status and set passResetTime
      if (userPhoneNumber) {
        console.log('⏰ Loading lock status for timer display...')
        const lockStatus = await isPhoneIdentityLocked(userPhoneNumber)
        
        if (lockStatus.isLocked && lockStatus.remainingTime > 0) {
          const expiresAt = new Date(Date.now() + lockStatus.remainingTime * 1000)
          setPassResetTime(expiresAt)
          setPhoneLockExpiresAt(expiresAt)
          setIsPhoneLocked(true)
          console.log(`⏰ Timer loaded: expires at ${expiresAt.toLocaleString()}`)
          console.log(`⏰ Time remaining: ${Math.floor(lockStatus.remainingTime / 60)} minutes`)
        } else {
          // ⚡ FIX: User has 0 passes but no lock - CREATE ONE NOW!
          console.warn('⚠️ User has 0 passes but no lock - creating lock now!')
          await lockPhoneIdentity(userPhoneNumber, 2)
          
          const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
          setPassResetTime(expiresAt)
          setPhoneLockExpiresAt(expiresAt)
          setIsPhoneLocked(true)
          console.log(`🔒 Lock created: expires at ${expiresAt.toLocaleString()}`)
        }
      }
      
      setShowOutOfPasses(true)
      return  // Don't create match!
    }
    
    // 🎯 CRITICAL FIX: Record like and check for MUTUAL LIKE before creating match!
    try {
      console.log(`💚 User ${user.uid} liked ${matchUser.uid}`)
      
      // ✅ Call recordSwipe to check for mutual like
      const swipeResult = await recordSwipe(user.uid, matchUser.uid, true)
      
      if (!swipeResult.isMatch) {
        // ✅ Only one person liked - just save and continue browsing
        console.log(`💚 Pending like saved. Waiting for ${matchUser.name} to like back...`)
        return  // Don't create match yet!
      }
      
      // 🎉 MUTUAL MATCH DETECTED! Both users liked each other!
      console.log(`🎉 MUTUAL MATCH! Creating active match...`)
      
      setMatchedUser(matchUser)
      setIsLockedInMatch(true)
      
      // ✅ FIXED: Create timestamp-based timer in Firestore
      const expiresAt = await createActiveMatch(user.uid, matchUser.uid, 10) // 10 minutes
      setMatchExpiresAt(expiresAt)
      
      // ✅ NEW: Mark as NEW match (for sound - only play once!)
      setIsNewMatch(true)
      
      setCurrentScreen("match")
      
      // ✅ Record the match in phone identity
      await recordMatch(user.uid)
      
      // 🔔 Create notifications for BOTH users
      try {
        const currentUserProfile = await getUserProfile(user.uid)
        
        if (currentUserProfile) {
          // ✅ FIX: Profile photo FIRST (photos[0]), Google photo as FALLBACK
          await createMatchNotifications(
            user.uid,
            matchUser.uid,
            currentUserProfile.name || user.displayName || 'Someone',
            matchUser.name || matchUser.displayName || 'Someone',
            currentUserProfile.photos?.[0] || currentUserProfile.photoURL || '',
            matchUser.photos?.[0] || matchUser.photoURL || ''
          )
          console.log('✅ Match notifications sent to both users')
        } else {
          console.warn('⚠️ Could not load user profile for notifications')
        }
      } catch (notifError) {
        console.error('⚠️ Error sending match notifications:', notifError)
        // Don't fail the match creation if notifications fail
      }
      
      console.log('✅ Match created with user:', matchUser.name || matchUser.uid)
      console.log(`⏰ Match expires at: ${expiresAt.toLocaleString()}`)
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  const handleMeetNow = async () => {
    if (!user || !userPhoneNumber) return
    
    try {
      // ✅ Lock phone identity for 2 hours
      await lockPhoneIdentity(userPhoneNumber, 2)
      console.log('🔒 Phone identity locked for 2 hours')
      
      setIsPhoneLocked(true)
      setPhoneLockTimeRemaining(2 * 60 * 60) // 2 hours in seconds
      
      // ✅ Calculate when lock expires (2 hours from now)
      const lockExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
      setPhoneLockExpiresAt(lockExpiresAt)
      console.log(`🔒 Lock expires at: ${lockExpiresAt.toLocaleString()}`)
      
      setSelectedMatch(matchedUser)
      
      // ✅ FIXED: Keep timer running! Don't set isLockedInMatch to false
      // Timer is now based on matchExpiresAt, not isLockedInMatch
      // isLockedInMatch is used to prevent returning to swiping
      
      setCurrentScreen("chat")
      
      // Show confirmation
      console.log('✅ Match accepted! Phone locked to prevent account switching exploit')
      console.log('⏰ Timer continues running in Chat screen')
    } catch (error) {
      console.error('Error accepting match:', error)
    }
  }

  const handlePass = async () => {
    // ✅ NEW FLOW: Always return to home screen after PASS
    // User can browse freely, but will be blocked on next swipe if no passes
    
    if (passesLeft > 0) {
      // Use a pass
      const newPassesLeft = await usePass(user!.uid)
      setPassesLeft(newPassesLeft)
      console.log(`✅ Pass used. Remaining: ${newPassesLeft}`)
      
      // ✅ CRITICAL FIX: ALWAYS reload lock status when out of passes
      if (newPassesLeft === 0 && userPhoneNumber) {
        console.log('⏰ Out of passes - checking lock status...')
        const lockStatus = await isPhoneIdentityLocked(userPhoneNumber)
        
        if (lockStatus.isLocked && lockStatus.remainingTime > 0) {
          const expiresAt = new Date(Date.now() + lockStatus.remainingTime * 1000)
          setPhoneLockExpiresAt(expiresAt)
          setPassResetTime(expiresAt)
          setIsPhoneLocked(true)
          console.log(`🔒 Locked until: ${expiresAt.toLocaleString()}`)
          console.log(`⏰ Timer set: ${Math.floor(lockStatus.remainingTime / 60)} minutes remaining`)
        } else {
          console.warn('⚠️ Out of passes but no lock found - this should not happen!')
        }
      }
    } else {
      console.log('⚠️ No passes left, but user can still browse')
      
      // ✅ SAFETY: Even if no passes, ensure timer is set
      if (userPhoneNumber && !passResetTime) {
        console.log('⏰ Checking if timer should be set...')
        const lockStatus = await isPhoneIdentityLocked(userPhoneNumber)
        if (lockStatus.isLocked && lockStatus.remainingTime > 0) {
          const expiresAt = new Date(Date.now() + lockStatus.remainingTime * 1000)
          setPassResetTime(expiresAt)
          setPhoneLockExpiresAt(expiresAt)
          setIsPhoneLocked(true)
          console.log(`⏰ Timer set: ${expiresAt.toLocaleString()}`)
        }
      }
    }
    
    // ✅ CRITICAL FIX: Clear active match from Firestore!
    // This prevents useEffect from restoring the match when returning to home
    if (user && matchedUser) {
      console.log('🗑️ Clearing active match from Firestore...')
      await clearActiveMatch(user.uid, matchedUser.uid)
      console.log('✅ Active match cleared')
    }
    
    // Always return to home (freedom to explore!)
    setIsLockedInMatch(false)
    
    // ✅ Clear match sound flag so next match will play sound
    if (matchedUser) {
      const storageKey = `match_sound_played_${matchedUser.uid}`
      sessionStorage.removeItem(storageKey)
      console.log('🔊 Cleared match sound flag for next match')
    }
    
    setMatchedUser(null)  // Clear current match
    setMatchExpiresAt(null)  // ✅ NEW: Clear expiry time
    
    // ✅ Show Match Ended Screen (5 seconds) then return to home
    setShowMatchEnded(true)
    
    console.log('🔙 Showing Match Ended screen')
  }

  // ✅ NEW: Handle "Not Interested" - Exit match without using pass
  // Used when user has no passes but wants to exit the match
  const handleNotInterested = async () => {
    console.log('🚫 Not Interested clicked - exiting match without pass')
    
    // ✅ CRITICAL: Save match to history for 12-hour cooldown
    // This prevents them from seeing each other again immediately
    if (user && matchedUser) {
      try {
        console.log('📝 Saving match to history for cooldown...')
        
        // Create a match record for cooldown (even though they didn't really match)
        const matchId = [user.uid, matchedUser.uid].sort().join('_')
        const { doc, setDoc, Timestamp } = await import('firebase/firestore')
        
        await setDoc(doc(db, 'matches', matchId), {
          users: [user.uid, matchedUser.uid],
          timestamp: Timestamp.now(),
          status: 'declined',  // Mark as declined
          declinedBy: user.uid,
          declinedAt: Timestamp.now()
        }, { merge: true })
        
        console.log('✅ Match saved to history for 12h cooldown')
        
        // ✅ Clear active match from Firestore
        await clearActiveMatch(user.uid, matchedUser.uid)
        console.log('✅ Active match cleared')
        
        // ✅ Send notification to the other user that match ended
        // (Optional - we can add this later if needed)
        
      } catch (error) {
        console.error('❌ Error saving match history:', error)
      }
    }
    
    // Return to home screen
    setIsLockedInMatch(false)
    
    // Clear match sound flag
    if (matchedUser) {
      const storageKey = `match_sound_played_${matchedUser.uid}`
      sessionStorage.removeItem(storageKey)
    }
    
    setMatchedUser(null)
    setMatchExpiresAt(null)
    
    // Show Match Ended screen
    setShowMatchEnded(true)
    
    console.log('🔙 Returning to home - Not Interested')
  }

  // ✅ "She Decides" - Handle "We're Meeting!" button
  // Called IMMEDIATELY when she clicks, NOT after the modal closes
  const handleMarkMatchSuccessful = async () => {
    if (!user || !matchedUser) return
    
    try {
      console.log('🎉 Marking match as successful!')
      
      // Mark match as successful in Firestore (this sends notification to HIM!)
      await markMatchAsSuccessful(user.uid, matchedUser.uid)
      
      console.log('✅ Match marked as successful - notification sent to partner!')
      // ✅ DON'T clear state or navigate yet - let her see the celebration modal first!
      // The modal's onClose will handle navigation
    } catch (error) {
      console.error('❌ Error marking match as successful:', error)
    }
  }
  
  // ✅ NEW: Called when she closes the "We're Meeting" modal
  const handleWeAreMeetingModalClose = () => {
    console.log('💕 She closed the celebration modal - returning to home')
    setIsLockedInMatch(false)
    setMatchedUser(null)
    setMatchExpiresAt(null)
    setCurrentScreen("home")
  }

  const handleContinue = async () => {
    // ✅ SAFETY CHECK: Don't allow returning to home if timer is still running
    if (timeRemaining > 0) {
      console.warn('⚠️ Cannot return to home - timer still running!')
      return
    }
    
    // ✅ CRITICAL FIX: Clear active match from Firestore when timer expires!
    if (user && matchedUser) {
      console.log('🗑️ Clearing active match from Firestore (timer expired)...')
      await clearActiveMatch(user.uid, matchedUser.uid)
      console.log('✅ Active match cleared')
    }
    
    setIsLockedInMatch(false)
    setMatchedUser(null)
    setMatchExpiresAt(null)
    setCurrentScreen("home")
    console.log('🔙 Returned to home screen after timer expired')
  }

  const handleSkipTimer = () => {
    alert('Skip Timer feature coming soon! ($2.99)')
  }

  const handleUpgradePremium = async () => {
    if (!user) return
    
    try {
      console.log('👑 Processing Premium upgrade...')
      setLoading(true)
      
      // Import payment service
      const { processPremiumUpgrade } = await import('@/lib/demo-payment-service')
      
      // Process payment (Demo mode = instant upgrade)
      const result = await processPremiumUpgrade(user.uid, 'lifetime', true)
      
      if (result.success) {
        console.log('✅ Premium upgrade successful!')
        
        // Reload pass data to reflect premium status
        const passData = await getUserPassData(user.uid)
        setPassesLeft(passData.passesLeft)
        setIsPremium(passData.isPremium)
        
        // Clear lock
        setIsPhoneLocked(false)
        setPhoneLockExpiresAt(null)
        setPassResetTime(null)
        
        alert('🎉 Welcome to Premium!\n\nYou now have UNLIMITED passes!')
      } else {
        alert('❌ Payment failed. Please try again.')
      }
    } catch (error) {
      console.error('❌ Premium upgrade error:', error)
      alert('❌ Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Real Stripe Checkout
  const handleStripeCheckout = async (plan: 'weekly' | 'monthly' | 'skip-timer') => {
    if (!user) return
    
    try {
      console.log(`💳 Creating Stripe checkout for plan: ${plan}`)
      setLoading(true)
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          plan: plan
        })
      })
      
      const data = await response.json()
      
      if (data.url) {
        console.log('✅ Redirecting to Stripe checkout:', data.url)
        window.location.href = data.url
      } else {
        console.error('❌ No checkout URL returned:', data)
        alert('❌ Failed to create checkout. Please try again.')
      }
    } catch (error) {
      console.error('❌ Stripe checkout error:', error)
      alert('❌ Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyOnePass = async () => {
    if (!user) return
    
    try {
      console.log('🎫 Purchasing 1 pass...')
      setLoading(true)
      
      // Import payment service
      const { purchaseOnePass } = await import('@/lib/demo-payment-service')
      
      // Process payment (Demo mode = instant add pass)
      const result = await purchaseOnePass(user.uid, true)
      
      if (result.success) {
        console.log('✅ Pass purchased successfully!')
        
        // Reload pass data
        const passData = await getUserPassData(user.uid)
        setPassesLeft(passData.passesLeft)
        
        // Clear lock
        setIsPhoneLocked(false)
        setPhoneLockExpiresAt(null)
        setPassResetTime(null)
        
        alert(`🎫 Pass added!\n\nYou now have ${passData.passesLeft} pass${passData.passesLeft > 1 ? 'es' : ''}.`)
      } else {
        alert('❌ Payment failed. Please try again.')
      }
    } catch (error) {
      console.error('❌ Pass purchase error:', error)
      alert('❌ Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingComplete = async (finalData: { photos: string[], bio: string }) => {
    // ✅ name already in onboardingData from Name Entry screen!
    const completeData = {
      ...onboardingData,
      ...finalData,
    }

    console.log('🎉 Onboarding Complete:', completeData)

    if (user) {
      try {
        await saveOnboardingData(user.uid, user.email || '', completeData)
        console.log('✅ User data saved to Firestore!')
        
        // ✅ CRITICAL FIX: Load pass data and lock status after onboarding!
        // This is especially important for users who deleted account during lockout
        const phoneNumber = getDevModePhoneNumber(user.uid)
        console.log('📱 Loading lock status after onboarding...')
        
        const lockStatus = await isPhoneIdentityLocked(phoneNumber)
        setIsPhoneLocked(lockStatus.isLocked)
        setPhoneLockTimeRemaining(lockStatus.remainingTime)
        
        if (lockStatus.isLocked && lockStatus.remainingTime > 0) {
          const expiresAt = new Date(Date.now() + lockStatus.remainingTime * 1000)
          setPhoneLockExpiresAt(expiresAt)
          setPassResetTime(expiresAt)
          console.log(`🔒 User is locked for ${Math.floor(lockStatus.remainingTime / 60)} more minutes`)
          console.log(`   Timer expires: ${expiresAt.toLocaleString()}`)
        } else {
          setPhoneLockExpiresAt(null)
          setPassResetTime(null)
        }
        
        // Load pass data
        const passData = await getUserPassData(user.uid)
        setPassesLeft(passData.passesLeft)
        setIsPremium(passData.isPremium)
        console.log(`🎫 Passes after onboarding: ${passData.passesLeft}`)
        
        // ✅ NEW: Check if user has checked in to a venue
        // If not, show QR Scan Required modal instead of going directly to home
        const userVenue = await getUserVenue(user.uid)
        const checkInStatus = await getUserCheckInStatus(user.uid)
        
        if (!userVenue || !checkInStatus.isCheckedIn || !checkInStatus.checkInData) {
          console.log('⚠️ User has not checked in to any venue - showing QR Scan modal')
          setCurrentScreen("home") // Go to home first
          // Show modal after a short delay to let home screen render
          setTimeout(() => {
            setShowQRScanRequired(true)
          }, 500)
        } else {
          console.log('✅ User already checked in to venue:', userVenue)
          setCheckInData(checkInStatus.checkInData)  // ✅ תוקן!
          setIsCheckedIn(checkInStatus.isCheckedIn)
          setCurrentScreen("home")
        }
      } catch (error) {
        console.error('❌ Error saving onboarding data:', error)
      }
    }
  }

  const handleNavigate = (screen: string) => {
    // ✅ FIX: Reset isNewMatch when navigating away from match screen
    // This prevents the match sound from playing again when returning
    if (currentScreen === "match" && screen !== "match") {
      setIsNewMatch(false)
      console.log('🔇 Reset isNewMatch (navigating away from match screen)')
    }
    
    // Type assertion - we trust the components to send valid screen names
    setCurrentScreen(screen as Screen)
  }

  // ✅ Type-safe wrappers for NotificationsScreen and ProfileScreen
  const handleNotificationsNavigate = (screen: "home" | "notifications" | "profile" | "match" | "chat") => {
    // ✅ FIX: Reset isNewMatch when navigating away from match screen
    if (currentScreen === "match" && screen !== "match") {
      setIsNewMatch(false)
      console.log('🔇 Reset isNewMatch (navigating from match via notifications)')
    }
    
    setCurrentScreen(screen as Screen)
  }

  const handleProfileNavigate = (screen: string) => {
    // ✅ FIX: Reset isNewMatch when navigating away from match screen
    if (currentScreen === "match" && screen !== "match") {
      setIsNewMatch(false)
      console.log('🔇 Reset isNewMatch (navigating from match via profile)')
    }
    
    setCurrentScreen(screen as Screen)
  }

  // 🔔 Handle clicking on a notification
  const handleNotificationClick = async (notification: any) => {
    console.log('🔔 Notification clicked:', notification)
    
    if (notification.type === 'match' && notification.fromUserId) {
      try {
        // Load the user who triggered the notification
        const matchUserProfile = await getUserProfile(notification.fromUserId)
        
        if (matchUserProfile) {
          // Set as matched user
          setMatchedUser(matchUserProfile)
          setIsNewMatch(false) // Not a new match - don't play sound
          
          // ✅ Check if match is still active
          if (notification.matchId && user) {
            const matchExpiration = await getActiveMatchExpiration(user.uid, notification.fromUserId)
            
            if (!matchExpiration) {
              // ⏰ Match expired - but let user view it!
              console.log('⏰ Match expired - showing expired state')
              setMatchExpiresAt(null) // No expiration = expired
              setIsLockedInMatch(false) // Not locked anymore
            } else {
              // ✅ Match is still active
              console.log(`✅ Match active, expires: ${matchExpiration.toLocaleString()}`)
              setMatchExpiresAt(matchExpiration)
              setIsLockedInMatch(true)
            }
          }
          
          setCurrentScreen("match")
          console.log('✅ Loaded match from notification')
        } else {
          console.warn('⚠️ Could not load user profile from notification')
          setCurrentScreen("match")
        }
      } catch (error) {
        console.error('❌ Error loading match from notification:', error)
        setCurrentScreen("match")
      }
    } else if (notification.type === 'message' && notification.chatId) {
      // ✅ FIX: Load the sender's profile before opening chat
      try {
        if (notification.fromUserId) {
          console.log('📧 Loading sender profile for chat...')
          const senderProfile = await getUserProfile(notification.fromUserId)
          
          if (senderProfile) {
            // ✅ Set sender as selected match for chat
            setSelectedMatch({
              uid: notification.fromUserId,
              name: senderProfile.name || senderProfile.displayName || 'User',
              displayName: senderProfile.name || senderProfile.displayName || 'User',
              // ✅ CRITICAL: Profile photo FIRST, Google photo as FALLBACK
              photos: senderProfile.photos || [],
              photoURL: senderProfile.photoURL || '',
              distance: 'nearby'
            })
            console.log('✅ Sender profile loaded:', senderProfile.name, 'Photo:', senderProfile.photos?.[0])
          } else {
            // Fallback: use notification data
            setSelectedMatch({
              uid: notification.fromUserId,
              name: notification.fromUserName || 'User',
              displayName: notification.fromUserName || 'User',
              photos: notification.fromUserPhoto ? [notification.fromUserPhoto] : [],
              photoURL: notification.fromUserPhoto || '',
              distance: 'nearby'
            })
            console.warn('⚠️ Using notification data for chat (profile not found)')
          }
        }
      } catch (error) {
        console.error('❌ Error loading sender profile:', error)
        // Fallback to notification data
        if (notification.fromUserId) {
          setSelectedMatch({
            uid: notification.fromUserId,
            name: notification.fromUserName || 'User',
            displayName: notification.fromUserName || 'User',
            photos: notification.fromUserPhoto ? [notification.fromUserPhoto] : [],
            photoURL: notification.fromUserPhoto || '',
            distance: 'nearby'
          })
        }
      }
      
      setCurrentScreen("chat")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Splash Screen */}
      {currentScreen === "splash" && (
        <SplashScreen onComplete={() => setCurrentScreen("welcome")} />
      )}
      
      {/* Welcome Screen */}
      {currentScreen === "welcome" && (
        <WelcomeScreen 
          onLogin={() => setCurrentScreen("login")} 
          onSignUp={() => setCurrentScreen("login")}
        />
      )}
      
      {/* ✅ Login Screen - FIXED: Use onSuccess prop */}
      {currentScreen === "login" && (
        <LoginScreen 
          onSuccess={() => {
            // Auth will handle navigation via useEffect
            console.log('✅ Login successful')
          }}
        />
      )}
      
      {/* Onboarding Screens */}
      {/* ✅ NEW: Welcome Screen */}
      {currentScreen === "onboarding-welcome" && (
        <OnboardingWelcomeScreen
          onContinue={() => {
            console.log('📝 Moving to Name Entry')
            setCurrentScreen("onboarding-name")
          }}
        />
      )}

      {/* ✅ NEW: Name Entry Screen */}
      {currentScreen === "onboarding-name" && (
        <NameEntryScreen
          defaultName={user?.displayName || ""}
          onContinue={(name) => {
            console.log('📝 Name entered:', name)
            setOnboardingData({ ...onboardingData, name })
            setCurrentScreen("onboarding-gender")
          }}
        />
      )}

      {currentScreen === "onboarding-gender" && (
        <OnboardingGender 
          onNext={(data) => {
            setOnboardingData({ ...onboardingData, ...data })
            setCurrentScreen("onboarding-age")
          }}
          onBack={() => setCurrentScreen("onboarding-name")}
          initialGender={onboardingData.gender}
        />
      )}

      {/* ✅ "She Decides" - Orientation screen removed (straight dating only) */}
      
      {currentScreen === "onboarding-age" && (
        <OnboardingAge
          onNext={(data) => {
            setOnboardingData({ ...onboardingData, ...data })
            setCurrentScreen("onboarding-hobbies")
          }}
          onBack={() => setCurrentScreen("onboarding-gender")}
          initialAge={onboardingData.age}
          initialAgeRange={onboardingData.ageRange}
          initialMaxDistance={onboardingData.maxDistance}
        />
      )}
      
      {currentScreen === "onboarding-hobbies" && (
        <OnboardingHobbies
          onNext={(data) => {
            setOnboardingData({ ...onboardingData, ...data })
            setCurrentScreen("onboarding-lifestyle")
          }}
          onBack={() => setCurrentScreen("onboarding-age")}
          initialHobbies={onboardingData.hobbies}
        />
      )}
      
      {/* ✅ NEW: Lifestyle Screen */}
      {currentScreen === "onboarding-lifestyle" && (
        <OnboardingLifestyle
          onNext={(data) => {
            setOnboardingData({ ...onboardingData, ...data })
            setCurrentScreen("onboarding-photos")
          }}
          onBack={() => setCurrentScreen("onboarding-hobbies")}
          initialDrinking={onboardingData.drinking as 'never' | 'social' | 'regular'}
          initialSmoking={onboardingData.smoking as 'no' | 'social' | 'yes'}
          initialHeight={onboardingData.height}
          initialRelationshipType={onboardingData.relationshipType as 'relationship' | 'casual' | 'friends'}
          initialEducation={onboardingData.education}
          initialCity={onboardingData.city}
          initialOccupation={onboardingData.occupation}
          initialLanguages={onboardingData.languages}
        />
      )}
      
      {currentScreen === "onboarding-photos" && (
        <OnboardingPhotos
          onComplete={handleOnboardingComplete}
          onBack={() => setCurrentScreen("onboarding-lifestyle")}
          initialPhotos={onboardingData.photos}
          initialBio={onboardingData.bio}
        />
      )}
      
      {/* Home Screen */}
      {currentScreen === "home" && (
        <>
          {/* ✅ Check-in Badge - shows when user is checked in */}
          {isCheckedIn && checkInData && showCheckInBadge && (
            <div className="fixed top-4 left-4 right-4 z-50">
              <CheckInBadge
                checkInData={checkInData}
                onCheckOut={handleCheckOut}
                onClose={() => setShowCheckInBadge(false)}
                autoHide={true}
                autoHideDelay={5000}
              />
            </div>
          )}
          
          <HomeScreen
            onMatch={handleMatch}
            onPass={handlePassOnSearch}
            nearbyUsers={nearbyUsers}
            loading={loading}
            onRefresh={loadNearbyUsers}
            onNavigate={handleNavigate}
            onScan={() => setCurrentScreen("scan")}
            venueData={checkInData ? {
              venueName: checkInData.venueDisplayName || checkInData.venueName,
              checkedInAt: checkInData.checkedInAt instanceof Date ? checkInData.checkedInAt : checkInData.checkedInAt?.toDate?.() || new Date(),
              expiresAt: checkInData.expiresAt instanceof Date ? checkInData.expiresAt : checkInData.expiresAt?.toDate?.() || new Date()
            } : null}
            onShowVenueStatus={() => setShowVenueStatus(true)}
          />
        </>
      )}
      
      {/* ✅ NEW: Scan Screen */}
      {currentScreen === "scan" && (
        <ScanScreen
          onNavigate={(screen) => setCurrentScreen(screen)}
          onCheckInSuccess={handleCheckIn}
        />
      )}
      
      {/* Match Screen */}
      {currentScreen === "match" && matchedUser && (
        <MatchScreen
          user={matchedUser}
          onContinue={handleContinue}
          onMeetNow={handleMeetNow}
          onMarkMatchSuccessful={handleMarkMatchSuccessful}
          onWeAreMeetingModalClose={handleWeAreMeetingModalClose}  // ✅ NEW: Close modal → return to home
          passesLeft={passesLeft}
          onPass={handlePass}
          onNotInterested={handleNotInterested}  // ✅ NEW: Exit match without using pass
          isPremium={isPremium}
          timeRemaining={timeRemaining}
          onNavigate={handleNavigate}
          onUpgradePremium={handleUpgradePremium}
          onBuyOnePass={handleBuyOnePass}
          passResetTime={passResetTime || undefined}
          isNewMatch={isNewMatch}
          currentUserGender={onboardingData.gender}  // ✅ "She Decides"
        />
      )}
      
      {/* ✅ Notifications Screen - FIXED: Type-safe wrapper */}
      {currentScreen === "notifications" && (
        <NotificationsScreen 
          onNavigate={handleNotificationsNavigate}
          hasActiveMatch={isLockedInMatch}
          onNotificationClick={handleNotificationClick}
        />
      )}
      
      {/* ✅ Profile Screen - FIXED: Type-safe wrapper */}
      {currentScreen === "profile" && (
        <ProfileScreen 
          onNavigate={handleProfileNavigate}
          hasActiveMatch={isLockedInMatch}
        />
      )}
      
      {/* Chat Screen */}
      {currentScreen === "chat" && selectedMatch && user && (
        <ChatScreen
          matchId={createMatchId(user.uid, selectedMatch.uid)}
          currentUserId={user.uid}
          otherUserId={selectedMatch.uid}
          matchUser={{
            name: selectedMatch.name || selectedMatch.displayName || "User",
            photo: selectedMatch.photos?.[0] || selectedMatch.photoURL || "/placeholder.jpg",
            distance: selectedMatch.distance || "nearby"
          }}
          // ✅ NEW: Pass current user info for notifications
          currentUser={{
            name: onboardingData.name || user.displayName || "Someone",
            photo: onboardingData.photos?.[0] || user.photoURL || ""
          }}
          timeRemaining={timeRemaining}
          onBack={() => {
            // ✅ CRITICAL FIX: If timer still running, go back to Match screen
            // Only go to Home if timer expired or no active match
            if (timeRemaining > 0 && matchedUser) {
              console.log('⬅️ Returning to Match screen (timer still running)')
              setIsNewMatch(false)  // ✅ NOT a new match - don't play sound!
              setCurrentScreen("match")
            } else {
              console.log('⬅️ Timer expired, returning to Home')
              setCurrentScreen("home")
            }
          }}
          // ✅ NEW: View match profile
          onViewProfile={() => {
            console.log('👤 Viewing match profile from chat')
            setCurrentScreen("match")
            setIsNewMatch(false)  // Don't play match sound
          }}
        />
      )}
      
      {/* ✅ NEW: Out of Passes Modal - Shown when user swipes with no passes */}
      <AnimatePresence>
        {showOutOfPasses && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOutOfPasses(false)}
              className="fixed inset-0 bg-black/95 z-[60] backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            >
              <div 
                className="relative bg-gradient-to-br from-[#1a4d3e] via-[#0d2920] to-[#051410] rounded-3xl p-6 max-w-md w-full border-2 border-[#4ade80]/30 shadow-2xl overflow-hidden pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <motion.button
                  onClick={() => setShowOutOfPasses(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10 bg-white/10 rounded-full p-2"
                >
                  <X size={24} />
                </motion.button>

                {/* 🚀 Launch Price Banner */}
                <motion.div
                  className="mb-4 -mx-6 -mt-6 bg-gradient-to-r from-[#f59e0b] via-[#eab308] to-[#f59e0b] p-3 text-center relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(245,158,11,0.4)",
                      "0 0 40px rgba(245,158,11,0.6)",
                      "0 0 20px rgba(245,158,11,0.4)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="relative flex items-center justify-center gap-2">
                    <Rocket className="h-5 w-5 text-[#0d2920]" />
                    <span className="font-bold text-[#0d2920] text-lg">
                      🎉 Launch Price - Limited Time!
                    </span>
                    <Rocket className="h-5 w-5 text-[#0d2920]" />
                  </div>
                </motion.div>

                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className="inline-block text-6xl mb-3"
                    >
                      🦎
                    </motion.div>
                    <h2 className="text-2xl font-black text-white mb-1">
                      Out of Passes!
                    </h2>
                    <p className="text-white/70 text-sm">
                      Get more passes to keep matching
                    </p>
                  </div>

                  {/* Timer - Next Free Pass */}
                  <div className="bg-gradient-to-br from-[#4ade80]/10 to-[#22c55e]/10 rounded-xl p-4 mb-5 border border-[#4ade80]/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#4ade80]" />
                        <span className="text-white/70 text-sm">Next free pass in:</span>
                      </div>
                      <span className="text-2xl font-mono font-bold text-[#4ade80]">
                        {outOfPassesTimerDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons - 3 Separate Buttons */}
                  <div className="space-y-3">
                    {/* Weekly Premium Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => {
                          setShowOutOfPasses(false)
                          handleStripeCheckout('weekly')
                        }}
                        className="w-full h-14 bg-gradient-to-r from-[#4ade80]/80 to-[#22c55e]/80 hover:from-[#4ade80] hover:to-[#22c55e] text-[#0d2920] font-bold text-lg rounded-xl shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        <Zap className="mr-2 h-5 w-5" />
                        Weekly Premium - $4.90/week
                      </Button>
                    </motion.div>

                    {/* Monthly Premium Button - BEST VALUE */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative">
                      {/* Best Value Badge */}
                      <div className="absolute -top-2 right-3 z-10 bg-gradient-to-r from-[#f59e0b] to-[#eab308] text-[#0d2920] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" fill="currentColor" />
                        BEST VALUE
                      </div>
                      <Button
                        onClick={() => {
                          setShowOutOfPasses(false)
                          handleStripeCheckout('monthly')
                        }}
                        className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg rounded-xl shadow-lg relative overflow-hidden border-2 border-[#f59e0b]/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        <Crown className="mr-2 h-5 w-5" />
                        Monthly Premium - $9.90/month
                      </Button>
                    </motion.div>

                    {/* Get Bonus Pass Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => {
                          setShowOutOfPasses(false)
                          handleStripeCheckout('skip-timer')
                        }}
                        className="w-full h-14 bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] font-bold text-lg rounded-xl border-2 border-[#4ade80]/50 relative overflow-hidden"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Get 1 Pass - $2.90
                      </Button>
                    </motion.div>

                    {/* Wait Button */}
                    <Button
                      onClick={() => setShowOutOfPasses(false)}
                      variant="outline"
                      className="w-full h-11 bg-transparent border border-white/20 text-white/60 hover:bg-white/5 rounded-xl text-sm"
                    >
                      I'll Wait
                    </Button>
                  </div>

                  <p className="text-center text-white/40 text-xs mt-4">
                    🔒 Secure payment via Stripe
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ NEW: QR Scan Required Modal - Shown after onboarding if no venue check-in */}
      <QRScanRequiredModal
        isOpen={showQRScanRequired}
        onScanClick={() => {
          setShowQRScanRequired(false)
          setCurrentScreen("scan")
        }}
        onClose={() => setShowQRScanRequired(false)}
      />

      {/* ✅ Match Ended Screen - 5 seconds with two-phase animation */}
      <MatchEndedScreen
        isVisible={showMatchEnded}
        onComplete={() => {
          setShowMatchEnded(false)
          setMatchedUser(null)
          setIsLockedInMatch(false)
          setMatchExpiresAt(null)
          setCurrentScreen("home")
          console.log('🔙 Match ended - returned to home')
        }}
        duration={5000}
        reason="deleted"
        matchName={matchedUser?.name || matchedUser?.displayName}
      />

      {/* ✅ NEW: "We're Meeting!" Modal - shown when partner clicks the button */}
      <WeAreMeetingModal
        isOpen={showWeAreMeeting}
        onClose={async () => {
          setShowWeAreMeeting(false)
          
          // ✅ CRITICAL FIX: Use a pass when match is successful!
          // This prevents the user from getting another free match immediately
          if (user && userPhoneNumber && !isPremium && passesLeft > 0) {
            console.log('🎫 Using pass after successful match...')
            const newPassesLeft = await usePass(user.uid)
            setPassesLeft(newPassesLeft)
            console.log(`✅ Pass used after "We're Meeting!". Remaining: ${newPassesLeft}`)
            
            // ✅ Lock phone identity for 2 hours if out of passes
            if (newPassesLeft === 0) {
              await lockPhoneIdentity(userPhoneNumber, 2)
              const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
              setPhoneLockExpiresAt(expiresAt)
              setPassResetTime(expiresAt)
              setIsPhoneLocked(true)
              console.log(`🔒 Phone locked until: ${expiresAt.toLocaleString()}`)
            }
          }
          
          // Clear match state
          setIsLockedInMatch(false)
          setMatchedUser(null)
          setMatchExpiresAt(null)
          setCurrentScreen("home")
          console.log('💕 We Are Meeting modal closed - returned to home')
        }}
        partnerName={meetingPartnerInfo?.name}
        partnerPhoto={meetingPartnerInfo?.photo}
      />

      {/* ✅ NEW: Venue Status Modal */}
      <AnimatePresence>
        {showVenueStatus && checkInData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowVenueStatus(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-6 max-w-sm w-full border border-[#4ade80]/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📍</div>
                <h2 className="text-xl font-bold text-white">Venue Status</h2>
              </div>

              {/* Venue Info */}
              <div className="space-y-3 mb-4">
                <div className="bg-[#0d2920]/50 rounded-xl p-3 border border-[#4ade80]/20">
                  <p className="text-[#4ade80]/60 text-xs mb-1">Location</p>
                  <p className="text-white font-semibold">{checkInData.venueDisplayName || checkInData.venueName}</p>
                </div>

                <div className="bg-[#0d2920]/50 rounded-xl p-3 border border-[#4ade80]/20">
                  <p className="text-[#4ade80]/60 text-xs mb-1">Checked in</p>
                  <p className="text-white font-semibold">
                    {checkInData.checkedInAt ? (checkInData.checkedInAt instanceof Date ? checkInData.checkedInAt : (checkInData.checkedInAt as any).toDate?.() || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>

                <div className="bg-[#0d2920]/50 rounded-xl p-3 border border-[#4ade80]/20">
                  <p className="text-[#4ade80]/60 text-xs mb-1">Auto checkout at</p>
                  <p className="text-white font-semibold">
                    {checkInData.expiresAt ? (checkInData.expiresAt instanceof Date ? checkInData.expiresAt : (checkInData.expiresAt as any).toDate?.() || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowVenueStatus(false)}
                  className="flex-1 bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] border border-[#4ade80]/30"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowVenueStatus(false)
                    setCurrentScreen("scan")
                  }}
                  className="flex-1 bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920]"
                >
                  Switch Venue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ✅ NEW: Coupon Modal for Premium/Pass redemption */}
      <CouponModal
        isOpen={showCouponModal !== null}
        onClose={() => setShowCouponModal(null)}
        phoneNumber={userPhoneNumber || ''}
        type={showCouponModal || 'premium'}
        onSuccess={async (result) => {
          console.log('🎟️ Coupon redeemed:', result)
          // Refresh user data after coupon redemption
          if (userPhoneNumber) {
            const updatedPassData = await getUserPassData(userPhoneNumber)
            setPassesLeft(updatedPassData.passesLeft)
            setIsPremium(updatedPassData.isPremium)
          }
        }}
      />
      
      {/* ✅ FIXED: In-App Notification for ALL notification types */}
      <InAppNotification
        isVisible={inAppNotification.isVisible}
        message={inAppNotification.message}
        senderName={inAppNotification.senderName}
        senderPhoto={inAppNotification.senderPhoto}
        onClose={() => setInAppNotification(prev => ({ ...prev, isVisible: false }))}
        onClick={async () => {
          setInAppNotification(prev => ({ ...prev, isVisible: false }))
          // Navigate based on notification type
          if (inAppNotification.type === 'meeting') {
            // ✅ NEW: Show "We're Meeting!" modal
            console.log('🎉 Opening We\'re Meeting modal from notification')
            setMeetingPartnerInfo({
              name: inAppNotification.senderName || 'Your match',
              photo: inAppNotification.senderPhoto || ''
            })
            setShowWeAreMeeting(true)
          } else if (inAppNotification.chatId && inAppNotification.fromUserId) {
            console.log('💬 Opening chat from notification:', inAppNotification.chatId)
            
            // ✅ FIX: Load FULL profile from Firestore to get correct photo
            try {
              const senderProfile = await getUserProfile(inAppNotification.fromUserId)
              
              if (senderProfile) {
                setSelectedMatch({
                  uid: inAppNotification.fromUserId,
                  name: senderProfile.name || senderProfile.displayName || 'User',
                  displayName: senderProfile.name || senderProfile.displayName || 'User',
                  // ✅ CRITICAL: Profile photo FIRST!
                  photos: senderProfile.photos || [],
                  photoURL: senderProfile.photoURL || '',
                  distance: 'nearby'
                } as any)
                console.log('✅ Loaded sender profile for chat:', senderProfile.name)
              } else {
                // Fallback to notification data
                setSelectedMatch({
                  uid: inAppNotification.fromUserId,
                  name: inAppNotification.senderName || 'User',
                  displayName: inAppNotification.senderName || 'User',
                  photos: inAppNotification.senderPhoto ? [inAppNotification.senderPhoto] : [],
                  photoURL: inAppNotification.senderPhoto || '',
                  distance: 'nearby'
                } as any)
              }
            } catch (error) {
              console.error('❌ Error loading sender profile:', error)
              // Fallback
              setSelectedMatch({
                uid: inAppNotification.fromUserId,
                name: inAppNotification.senderName || 'User',
                displayName: inAppNotification.senderName || 'User',
                photos: inAppNotification.senderPhoto ? [inAppNotification.senderPhoto] : [],
                photoURL: inAppNotification.senderPhoto || '',
                distance: 'nearby'
              } as any)
            }
            
            setCurrentScreen('chat')
          } else if (inAppNotification.type === 'match') {
            setCurrentScreen('match')
          } else {
            // Default: go to notifications screen
            setCurrentScreen('notifications')
          }
        }}
        type={inAppNotification.type || 'info'}
        autoHide={true}
        autoHideDelay={3000}
      />
    </div>
  )
}
