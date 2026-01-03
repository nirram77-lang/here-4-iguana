"use client"

// ✅ v2.8.16: App Version for auto-update detection
const APP_VERSION = "2.8.16"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, X, Clock, Rocket, Star, Zap, Check, Heart, Gift, Home } from "lucide-react"
import { onSnapshot, doc, collection, query, where, getDoc, getDocs, Timestamp } from "firebase/firestore"  // ✅ NEW
import { db } from "@/lib/firebase"  // ✅ NEW
import { getOrCreateDeviceId } from "@/lib/device-id"  // ✅ v2.8.4: Device ID for security
import SplashScreen from "@/components/splash-screen"
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
import EnjoyModeScreen from "@/components/enjoy-mode-screen"  // ✅ NEW: Enjoy Mode
// ❌ DISABLED: import ScanScreen from "@/components/scan-screen"  // Replaced by VenueSelectionScreen
import CheckInBadge from "@/components/checkin-badge"
import VenueSelectionScreen from "@/components/venue-selection-screen"  // ✅ NEW: Replace QR with venue selection
import InAppNotification from "@/components/in-app-notification"
import MatchEndedScreen from "@/components/match-ended-screen"
import WeAreMeetingModal from "@/components/we-are-meeting-modal"
import PhoneVerification from "@/components/phone-verification"
import NotificationPermissionModal from "@/components/notification-permission-modal"
// ✅ NEW: Zone-based discovery system
import DiscoveryScreen from "@/components/discovery-screen"
import ZoneModeScreen from "@/components/zone-mode-screen"
import ExploreZoneScreen from "@/components/explore-zone-screen"
import { EntertainmentZone, searchNearbyVenues, clusterVenuesIntoZones, getCurrentZone } from "@/lib/google-places-service"
import { checkInToZone, getUsersInZone, getUserZoneCheckIn, updateLocationInZone } from "@/lib/zone-checkin-service"
// Using native Notification API for permission check
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
  recordSwipe,
  clearSwipeReferencesToUser,  // ✅ NEW: Clear old swipes when re-creating profile
  clearMatchCooldownsForUser,  // ✅ NEW: Clear old cooldowns when re-creating profile
  isUserLockedOnMatch,         // ✅ NEW: Check if user needs to pay for match
  unlockMatchForUser           // ✅ NEW: Unlock match after payment
} from "@/lib/firestore-service"
import { getCurrentLocation } from "@/lib/location-service"
import { CheckInData, performCheckOut, getUserCheckInStatus, verifyUserStillAtVenue, performCheckInBySelection } from "@/lib/checkin-service"
import { getUserPassData, usePass, recordMatch } from "@/lib/pass-system"
import { clearAllChatsForUser } from "@/lib/chat-system"  // ✅ NEW: Clear chat history on profile recreation
import CouponModal from "@/components/coupon-modal"
import PremiumPaywallModal from "@/components/premium-paywall-modal"  // ✅ NEW: Premium paywall for second match
import { PASS_CONFIG } from "@/lib/constants"  // ✅ NEW: For FREE_MATCHES_LIMIT
import { 
  getOrCreatePhoneIdentity, 
  isPhoneIdentityLocked, 
  lockPhoneIdentity,
  getDevModePhoneNumber,
  syncUserWithPhoneIdentity 
} from "@/lib/phone-identity-service"
// ✅ NEW: Mode Selection Screen
import ModeSelectionScreen from "@/components/mode-selection-screen"
import ActionTonightScreen from "@/components/action-tonight-screen"  // ✅ NEW: Action Tonight - איפה האקשן הערב?
import MeetingFeedbackScreen from "@/components/meeting-feedback-screen"
import WorldSelectionScreen from "@/components/world-selection-screen"  // ✅ v2.8.5: Main junction between Zones and Venues
import LanguageSelectionScreen from "@/components/language-selection-screen"  // ✅ v2.8.7: Multi-language support
import { useLanguage } from "@/lib/LanguageContext"  // ✅ v2.8.7: Language hook

type Screen = "splash" | "language-selection" | "welcome" | "login" | "signup" | "phone-verification" | "onboarding-welcome" | "onboarding-name" | "onboarding-gender" | "onboarding-age" | "onboarding-hobbies" | "onboarding-lifestyle" | "onboarding-photos" | "world-selection" | "mode-selection" | "home" | "match" | "notifications" | "profile" | "chat" | "scan" | "enjoy-mode" | "meeting-feedback" | "discovery" | "zone-mode" | "explore-zone"

// ✅ NEW: App Mode - Venue (existing) or Zone (new global)
type AppMode = "venue" | "zone" | null

// Helper function to create consistent match IDs
const createMatchId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_')
}

// ✅ v2.8.26: Fallback component for enjoy-mode with auto-redirect
// This prevents iOS race condition where user sees fallback and taps "Back to Home"
const EnjoyModeFallback = ({ onTimeout }: { onTimeout: () => void }) => {
  const [showButton, setShowButton] = useState(false)
  
  useEffect(() => {
    // Wait 3 seconds before showing back button
    // This gives time for state to properly update on iOS
    const timer = setTimeout(() => {
      console.log('⏳ EnjoyModeFallback: 3 seconds passed, showing back button')
      setShowButton(true)
    }, 3000)
    
    // Auto-redirect after 8 seconds if still stuck
    const autoRedirect = setTimeout(() => {
      console.log('⏳ EnjoyModeFallback: Auto-redirecting after 8 seconds')
      onTimeout()
    }, 8000)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(autoRedirect)
    }
  }, [onTimeout])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#0a1f18] to-[#050d0a] flex flex-col items-center justify-center p-6">
      <div className="text-6xl mb-4 animate-pulse">⏳</div>
      <h2 className="text-xl font-bold text-white mb-2">Loading Meeting...</h2>
      <p className="text-white/60 text-center mb-6">Setting up your meeting experience</p>
      {showButton && (
        <button
          onClick={onTimeout}
          className="px-6 py-3 bg-[#4ade80] text-[#0d2920] font-bold rounded-full"
        >
          Back to Home
        </button>
      )}
    </div>
  )
}

export default function Page() {
  const { user, loading: authLoading } = useAuth()
  const { hasSelectedLanguage, t, isRTL } = useLanguage()  // ✅ v2.8.7: Language support
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash")
  const [matchedUser, setMatchedUser] = useState<any>(null)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [currentMatchId, setCurrentMatchId] = useState<string>("")
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState<'weekly' | 'monthly' | 'skip-timer' | null>(null)
  const [showOutOfPasses, setShowOutOfPasses] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState<'premium' | 'pass' | null>(null)  // ✅ NEW: Coupon modal
  
  // ✅ v2.8.25: Pending notification to open chat directly
  const [pendingChatMatchId, setPendingChatMatchId] = useState<string | null>(null)
  
  // ✅ v2.8.25 CRITICAL: Check URL params for notification click on app load
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const openChatMatchId = urlParams.get('openChat')
    const notificationType = urlParams.get('notificationType')
    
    if (openChatMatchId) {
      console.log('═══════════════════════════════════════════════════')
      console.log('🔔 NOTIFICATION CLICK DETECTED!')
      console.log('   matchId:', openChatMatchId)
      console.log('   type:', notificationType)
      console.log('═══════════════════════════════════════════════════')
      
      // ✅ Save to localStorage for persistence during auth/splash
      localStorage.setItem('i4iguana_pending_chat_matchId', openChatMatchId)
      setPendingChatMatchId(openChatMatchId)
      
      // ✅ Clear URL params to prevent re-processing
      window.history.replaceState({}, '', window.location.pathname)
    }
    
    // ✅ Also check localStorage for existing pending notification
    const storedMatchId = localStorage.getItem('i4iguana_pending_chat_matchId')
    if (storedMatchId && !openChatMatchId) {
      console.log('🔔 Found pending chat in localStorage:', storedMatchId)
      setPendingChatMatchId(storedMatchId)
    }
    
    // ✅ Listen for messages from service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        console.log('🔔 Service Worker message: NOTIFICATION_CLICKED')
        console.log('   matchId:', event.data.matchId)
        if (event.data.matchId) {
          localStorage.setItem('i4iguana_pending_chat_matchId', event.data.matchId)
          setPendingChatMatchId(event.data.matchId)
        }
      }
    }
    
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [])
  
  // ✅ v2.8.25: Handle pending notification when matchedUser becomes available
  useEffect(() => {
    if (pendingChatMatchId && matchedUser) {
      console.log('═══════════════════════════════════════════════════')
      console.log('🔔 PROCESSING PENDING NOTIFICATION!')
      console.log('   pendingChatMatchId:', pendingChatMatchId)
      console.log('   matchedUser:', matchedUser.name)
      console.log('   currentScreen:', currentScreen)
      console.log('═══════════════════════════════════════════════════')
      
      // Clear the pending state
      localStorage.removeItem('i4iguana_pending_chat_matchId')
      setPendingChatMatchId(null)
      
      // Navigate directly to chat
      setSelectedMatch(matchedUser)
      setCurrentScreen("chat")
    }
  }, [pendingChatMatchId, matchedUser, currentScreen])
  
  // ✅ NEW: Premium Paywall for second match onwards
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false)
  const [isMatchLocked, setIsMatchLocked] = useState(false)  // Whether current match is locked (needs payment)
  const [freeMatchesUsedToday, setFreeMatchesUsedToday] = useState(0)  // Track free matches used
  const [hasBidirectionalChat, setHasBidirectionalChat] = useState(false)  // ✅ NEW: Both users must chat before meeting
  const [isInEnjoyModeSession, setIsInEnjoyModeSession] = useState(false)  // ✅ NEW: Track if we're in active enjoy mode session
  const [isPartnerReadyToMeet, setIsPartnerReadyToMeet] = useState(false)  // ✅ NEW: Partner already clicked "We're Meeting"
  const [isViewingProfileFromChat, setIsViewingProfileFromChat] = useState(false)  // ✅ NEW: Viewing profile from chat history

  // ✅ NEW: Save important state to localStorage for persistence across app restarts
  useEffect(() => {
    // Only save app screens (not splash, welcome, login, onboarding)
    // ✅ v2.8.22 FIX: Removed 'meeting-feedback' - it requires pendingFeedback which isn't persisted!
    const persistableScreens = ['world-selection', 'mode-selection', 'home', 'match', 'chat', 'notifications', 'profile', 'enjoy-mode', 'discovery', 'zone-mode']
    if (persistableScreens.includes(currentScreen)) {
      localStorage.setItem('i4iguana_last_screen', currentScreen)
      console.log('💾 Saved currentScreen to localStorage:', currentScreen)
    }
    
    // ✅ v2.8.22 FIX: If on meeting-feedback, save 'world-selection' instead (safe fallback)
    if (currentScreen === 'meeting-feedback') {
      localStorage.setItem('i4iguana_last_screen', 'world-selection')
      console.log('💾 meeting-feedback → saved world-selection as fallback')
    }
    
    // ✅ v2.8.20 FIX: Reset appMode when arriving at world-selection!
    // This ensures HOME button from Profile goes back to world-selection, not venue-home
    if (currentScreen === 'world-selection') {
      setAppMode(null)
      localStorage.removeItem('i4iguana_app_mode')
      console.log('🌍 Reset appMode to null (arrived at world-selection)')
    }
  }, [currentScreen])
  
  useEffect(() => {
    if (isInEnjoyModeSession) {
      localStorage.setItem('i4iguana_enjoy_mode', 'true')
      console.log('💾 Saved enjoy mode state')
    }
    // ✅ v2.8.22 FIX: Don't auto-remove the flag here!
    // The flag should only be removed AFTER feedback screen is shown or skipped.
    // This ensures that on app reload, we know if user was in enjoy mode.
  }, [isInEnjoyModeSession])
  
  useEffect(() => {
    if (matchedUser) {
      localStorage.setItem('i4iguana_matched_user_id', matchedUser.uid)
      console.log('💾 Saved matched user ID:', matchedUser.uid)
    }
  }, [matchedUser])

  // ✅ FIX: Track if location permission alert was shown
  const locationAlertShownRef = useRef(false)
  const justCheckedInRef = useRef(false)  // ✅ v2.8.16: Prevent venue selection popup after check-in
  const venueSelectionBlockedUntilRef = useRef<number>(0)  // ✅ v2.8.17: Block venue selection until this timestamp

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
  const [matchCreatedAt, setMatchCreatedAt] = useState<Date | null>(null)  // ✅ NEW: For Chat First logic (only count messages from THIS match)
  const [meetingStartedAt, setMeetingStartedAt] = useState<Date | null>(null)  // ✅ NEW: For Enjoy Mode countdown
  const [timeRemaining, setTimeRemaining] = useState(0)
  
  // ✅ NEW: Meeting Feedback state
  const [pendingFeedback, setPendingFeedback] = useState<{
    matchId: string
    partnerId: string
    partnerName: string
    partnerPhoto?: string
  } | null>(null)
  
  // ✅ v2.8.21 FIX: Redirect from meeting-feedback if no pending data (silent, no UI flash)
  useEffect(() => {
    if (currentScreen === "meeting-feedback" && !pendingFeedback) {
      console.log('⚠️ [v2.8.21] Meeting feedback without pending data - silent redirect')
      setCurrentScreen("world-selection")
    }
  }, [currentScreen, pendingFeedback])
  
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
  const weAreMeetingOpenedAtRef = useRef<number>(0)  // ✅ v2.8.26: Track when modal opened
  const [meetingPartnerInfo, setMeetingPartnerInfo] = useState<{
    uid: string  // ✅ CRITICAL: Need uid for matchedUser!
    name: string
    photo: string
  } | null>(null)
  const [showPartnerLeftMeeting, setShowPartnerLeftMeeting] = useState(false)  // ✅ NEW: Partner exited meeting
  const [wasInEnjoyModeWhenPartnerLeft, setWasInEnjoyModeWhenPartnerLeft] = useState(false)  // ✅ v2.8.26: Track enjoy mode state for feedback
  const [partnerInfoWhenLeft, setPartnerInfoWhenLeft] = useState<{matchId: string, partnerId: string, partnerName: string, partnerPhoto?: string} | null>(null)  // ✅ v2.8.26: Save partner info for feedback
  const [showVenueDisconnected, setShowVenueDisconnected] = useState(false)  // ✅ NEW: Real-time venue disconnect notification
  const switchingToZoneModeRef = useRef(false)  // ✅ v2.8.6: Flag to prevent disconnect message during zone switch

  // ✅ NEW: Venue Selection modal - shown after onboarding if no venue check-in
  const [showVenueSelection, setShowVenueSelection] = useState(false)
  const [userLocationForVenues, setUserLocationForVenues] = useState<{ lat: number; lng: number } | null>(null)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<{
    isVisible: boolean
    plan: 'weekly' | 'monthly' | 'skip-timer' | null
  }>({ isVisible: false, plan: null })
  
  // ✅ NEW: Zone-based discovery system
  const [entertainmentZones, setEntertainmentZones] = useState<EntertainmentZone[]>([])
  const [currentZone, setCurrentZone] = useState<any | null>(null)
  const [exploringZone, setExploringZone] = useState<any | null>(null)
  const [singlesInZone, setSinglesInZone] = useState(0)
  const [zoneUsers, setZoneUsers] = useState<any[]>([])  // Users in current zone for matching
  const [appMode, setAppMode] = useState<AppMode>(null)  // ✅ NEW: Current mode - venue or zone
  
  // ✅ NEW: Persist appMode to localStorage
  useEffect(() => {
    if (appMode) {
      localStorage.setItem('i4iguana_app_mode', appMode)
      console.log('💾 Saved appMode:', appMode)
    }
  }, [appMode])
  
  // ✅ NEW: Restore appMode on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('i4iguana_app_mode') as AppMode
    if (savedMode && (savedMode === 'venue' || savedMode === 'zone')) {
      setAppMode(savedMode)
      console.log('📂 Restored appMode:', savedMode)
    }
  }, [])
  
  // ✅ NEW: Push Notification Permission Modal
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  
  // ✅ NEW: Track if splash animation completed
  const [splashComplete, setSplashComplete] = useState(false)

  // ✅ v2.8.26: Quick restore for app reload (memory cleared)
  // This handles the case where iOS kills the app but user returns quickly
  useEffect(() => {
    const QUICK_RESTORE_THRESHOLD = 60 * 60 * 1000 // 1 hour - same as background threshold
    const lastActiveTime = localStorage.getItem('i4iguana_last_active')
    const wasAuthenticated = localStorage.getItem('i4iguana_was_authenticated')
    
    if (lastActiveTime && wasAuthenticated === 'true') {
      const timeSinceActive = Date.now() - parseInt(lastActiveTime)
      
      if (timeSinceActive < QUICK_RESTORE_THRESHOLD) {
        // User was on the app less than 1 hour ago - skip splash animation!
        console.log(`⚡ QUICK RESTORE: User was active ${Math.round(timeSinceActive / 1000 / 60)}min ago - skipping splash`)
        setSplashComplete(true)
      }
    }
    
    // Update last active time on every load and periodically
    localStorage.setItem('i4iguana_last_active', String(Date.now()))
    
    const updateActive = setInterval(() => {
      localStorage.setItem('i4iguana_last_active', String(Date.now()))
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(updateActive)
  }, [])
  
  // ✅ NEW: Track background time for splash on return
  const backgroundTimeRef = useRef<number | null>(null)
  const isInEnjoyModeSessionRef = useRef(false)  // ✅ v2.8.22: Ref for enjoy mode state
  const matchedUserRef = useRef<any>(null)  // ✅ v2.8.26: Ref for matched user (for popstate)
  const matchExpiresAtRef = useRef<Date | null>(null)  // ✅ v2.8.26: Ref for match expiration (for popstate)
  
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

  // ✅ LOCALSTORAGE KEY for remembering user preferences
  const ONBOARDING_STORAGE_KEY = 'i4iguana_onboarding_data'

  // ✅ Load saved onboarding data from localStorage
  const loadSavedOnboardingData = () => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('📦 Loaded saved onboarding data from localStorage')
        return parsed
      }
    } catch (e) {
      console.warn('⚠️ Could not load saved onboarding data:', e)
    }
    return null
  }

  // ✅ Initialize onboardingData with saved data or defaults
  const savedData = typeof window !== 'undefined' ? loadSavedOnboardingData() : null
  
  const [onboardingData, setOnboardingData] = useState({
    gender: (savedData?.gender || 'male') as 'male' | 'female',
    lookingFor: (savedData?.lookingFor || undefined) as 'male' | 'female' | 'both' | undefined,  // ✅ FIXED: undefined not null
    age: savedData?.age || 25,
    ageRange: (savedData?.ageRange || [21, 35]) as [number, number],
    minDistance: savedData?.minDistance || 50,
    maxDistance: savedData?.maxDistance || 500,
    hobbies: (savedData?.hobbies || []) as string[],
    photos: (savedData?.photos || []) as string[],
    bio: savedData?.bio || '',
    name: savedData?.name || '',
    city: (savedData?.city || '') as string,
    occupation: (savedData?.occupation || '') as string,
    languages: (savedData?.languages || ['he']) as string[],  // ✅ Languages (Hebrew default)
    // ✅ Lifestyle fields
    drinking: (savedData?.drinking || 'social') as string,
    smoking: (savedData?.smoking || 'no') as string,
    height: (savedData?.height || '') as string,
    education: (savedData?.education || '') as string,
    relationshipType: (savedData?.relationshipType || 'relationship') as string,
  })

  // ✅ Save onboardingData to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(onboardingData))
      console.log('💾 Saved onboarding data to localStorage')
    } catch (e) {
      console.warn('⚠️ Could not save onboarding data:', e)
    }
  }, [onboardingData])

  // ✅ HARDWARE BACK BUTTON HANDLER - For Android devices
  // Maps each screen to its previous screen
  const screenBackMap: Record<Screen, Screen | null> = {
    'splash': null,
    'language-selection': null,  // ✅ v2.8.7: First screen - no back
    'welcome': null,
    'login': 'welcome',
    'signup': 'welcome',
    'phone-verification': null,  // Don't allow back from phone verification
    'onboarding-welcome': null,  // Don't allow back from welcome
    'onboarding-name': 'onboarding-welcome',  // ✅ Allow back to welcome
    'onboarding-gender': 'onboarding-name',
    'onboarding-age': 'onboarding-gender',
    'onboarding-hobbies': 'onboarding-age',
    'onboarding-lifestyle': 'onboarding-hobbies',
    'onboarding-photos': 'onboarding-lifestyle',
    'world-selection': null,  // ✅ v2.8.5: Main screen - no back
    'mode-selection': 'world-selection',  // ✅ v2.8.5: Back to world selection
    'home': 'world-selection',  // ✅ Back to world selection
    'match': 'home',
    'notifications': 'home',
    'profile': 'home',
    'chat': 'match',
    'scan': 'home',
    'enjoy-mode': null,  // ✅ Don't allow back from enjoy mode
    'meeting-feedback': null,  // ✅ HERMETIC: Don't allow back from feedback
    'discovery': 'world-selection',  // ✅ v2.8.5: Back to world selection
    'zone-mode': 'mode-selection',  // ✅ v2.8.5: Back to zones screen
    'explore-zone': 'mode-selection'  // ✅ v2.8.5: Back to zones screen
  }

  // ✅ Ref to track current screen for popstate handler (avoids stale closure)
  const currentScreenRef = useRef<Screen>(currentScreen)
  useEffect(() => {
    currentScreenRef.current = currentScreen
  }, [currentScreen])

  // ✅ Handle hardware back button - runs ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Push initial state
    window.history.pushState({ screen: 'initial' }, '', '')

    const handlePopState = () => {
      const screen = currentScreenRef.current
      console.log('📱 Hardware back button pressed, current screen:', screen)
      
      // ✅ v2.8.26 FIX: Smart back navigation for chat - same logic as onBack!
      if (screen === 'chat') {
        if (isInEnjoyModeSessionRef.current) {
          console.log('   ✅ Chat → Enjoy Mode (in session)')
          setCurrentScreen('enjoy-mode')
          window.history.pushState({ screen: 'navigation' }, '', '')
          return
        } else if (matchedUserRef.current && matchExpiresAtRef.current && matchExpiresAtRef.current > new Date()) {
          console.log('   ✅ Chat → Match (active match)')
          setCurrentScreen('match')
          window.history.pushState({ screen: 'navigation' }, '', '')
          return
        } else {
          console.log('   ✅ Chat → Home (no active match)')
          setCurrentScreen('home')
          window.history.pushState({ screen: 'navigation' }, '', '')
          return
        }
      }
      
      const previousScreen = screenBackMap[screen]
      
      if (previousScreen) {
        console.log('   ✅ Navigating to:', previousScreen)
        setCurrentScreen(previousScreen)
      } else {
        console.log('   ⛔ No previous screen - staying')
      }
      
      // CRITICAL: Always push state back to prevent app exit
      window.history.pushState({ screen: 'navigation' }, '', '')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, []) // Empty deps - runs once on mount

  // ✅ NEW: Handle Stripe payment success redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment_success')
    const paymentPlan = urlParams.get('plan') as 'weekly' | 'monthly' | 'skip-timer' | null
    const sessionId = urlParams.get('session_id')
    const paymentCancelled = urlParams.get('payment_cancelled')
    
    if (paymentSuccess === 'true' && paymentPlan) {
      console.log(`🎉 Payment successful! Plan: ${paymentPlan}, Session: ${sessionId}`)
      
      // Clear URL params immediately to prevent re-processing
      window.history.replaceState({}, '', window.location.pathname)
      
      // ✅ Show Hollywood-style success modal immediately!
      setShowPaymentSuccess({ isVisible: true, plan: paymentPlan })
      
      // ✅ CRITICAL: Call verify-payment API to update DB directly
      // This doesn't rely on webhooks!
      const verifyAndUpdatePayment = async () => {
        if (!user) {
          console.log('⏳ Waiting for user...')
          return
        }
        
        console.log('🔄 Calling verify-payment API...')
        
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              sessionId: sessionId,
              plan: paymentPlan
            })
          })
          
          const result = await response.json()
          console.log('📋 Verify-payment response:', result)
          
          if (result.success) {
            console.log('✅ Payment verified and DB updated!')
            
            // Reload user data to reflect changes
            const passData = await getUserPassData(user.uid)
            console.log('📊 Updated pass data:', passData)
            
            setPassesLeft(passData.passesLeft)
            setIsPremium(passData.isPremium)
            setIsPhoneLocked(false)
            setPhoneLockExpiresAt(null)
            setPassResetTime(null)
            // ✅ Close OUT OF PASSES modal after successful purchase
            setShowOutOfPasses(false)
            
            console.log('✅ UI updated with new pass data!')
          } else {
            console.error('❌ Payment verification failed:', result.error)
            // Still try to reload data in case webhook worked
            const passData = await getUserPassData(user.uid)
            setPassesLeft(passData.passesLeft)
            setIsPremium(passData.isPremium)
            // ✅ Close OUT OF PASSES modal even on fallback
            if (passData.passesLeft > 0 || passData.isPremium) {
              setShowOutOfPasses(false)
            }
          }
        } catch (error) {
          console.error('❌ Error calling verify-payment:', error)
          // Fallback: try to reload data anyway
          try {
            const passData = await getUserPassData(user.uid)
            setPassesLeft(passData.passesLeft)
            setIsPremium(passData.isPremium)
            // ✅ Close OUT OF PASSES modal even on fallback
            if (passData.passesLeft > 0 || passData.isPremium) {
              setShowOutOfPasses(false)
            }
          } catch (e) {
            console.error('❌ Fallback reload also failed:', e)
          }
        }
      }
      
      // Call immediately
      verifyAndUpdatePayment()
    }
    
    if (paymentCancelled === 'true') {
      console.log('❌ Payment was cancelled')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [user])

  // ✅ v2.8.22 FIX: Keep Screen On (Wake Lock API) - responds to setting changes!
  const [keepScreenOn, setKeepScreenOn] = useState(false)
  const wakeLockRef = useRef<any>(null)
  
  // Load setting from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('i4iguana_keep_screen_on') === 'true'
    setKeepScreenOn(saved)
    
    // Listen for storage changes (when setting is toggled in modal)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'i4iguana_keep_screen_on') {
        setKeepScreenOn(e.newValue === 'true')
      }
    }
    
    // Also listen for custom event from settings modal
    const handleCustomEvent = () => {
      const current = localStorage.getItem('i4iguana_keep_screen_on') === 'true'
      setKeepScreenOn(current)
    }
    
    window.addEventListener('storage', handleStorage)
    window.addEventListener('wakeLockSettingChanged', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('wakeLockSettingChanged', handleCustomEvent)
    }
  }, [])
  
  // Apply Wake Lock when setting changes
  useEffect(() => {
    const applyWakeLock = async () => {
      if (typeof window === 'undefined') return
      
      // Release existing lock first
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release()
          wakeLockRef.current = null
          console.log('🔅 Wake Lock released')
        } catch (e) {}
      }
      
      // Acquire new lock if enabled
      if (keepScreenOn && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
          console.log('🔆 Wake Lock activated!')
          
          // Re-acquire on visibility change (Android needs this!)
          const handleVisibility = async () => {
            if (document.visibilityState === 'visible' && keepScreenOn) {
              try {
                if (!wakeLockRef.current || wakeLockRef.current.released) {
                  wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
                  console.log('🔆 Wake Lock re-acquired after visibility change')
                }
              } catch (e) {
                console.warn('⚠️ Could not re-acquire wake lock:', e)
              }
            }
          }
          document.addEventListener('visibilitychange', handleVisibility)
          
          return () => document.removeEventListener('visibilitychange', handleVisibility)
        } catch (err) {
          console.warn('⚠️ Wake Lock not available:', err)
        }
      }
    }
    
    applyWakeLock()
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
        wakeLockRef.current = null
      }
    }
  }, [keepScreenOn])

  // ✅ v2.8.22: Keep ref in sync with state for use in listeners
  useEffect(() => {
    isInEnjoyModeSessionRef.current = isInEnjoyModeSession
  }, [isInEnjoyModeSession])

  // ✅ v2.8.26: Keep refs in sync for popstate handler
  useEffect(() => {
    matchedUserRef.current = matchedUser
  }, [matchedUser])
  
  useEffect(() => {
    matchExpiresAtRef.current = matchExpiresAt
  }, [matchExpiresAt])

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
            
            // 🔊 Play "We're Meeting" celebration sound!
            try {
              const audio = new Audio('/sounds/meeting-celebration.wav')
              audio.volume = 0.8
              audio.play().catch(err => console.warn('Could not play meeting sound:', err))
              console.log('🔊 Meeting celebration sound played!')
            } catch (err) {
              console.warn('Could not play meeting sound:', err)
            }
            
            setMeetingPartnerInfo({
              uid: notifData.fromUserId || '',  // ✅ CRITICAL: Save uid!
              name: notifData.fromUserName || 'Your match',
              photo: notifData.fromUserPhoto || ''
            })
            weAreMeetingOpenedAtRef.current = Date.now()  // ✅ v2.8.26: Track open time
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
  // ✅ v2.8.18 FIX: Added polling fallback for iOS PWA reliability
  useEffect(() => {
    if (!user || !matchedUser) return
    
    // ✅ v2.8.5 FIX: Use currentMatchId if available
    const matchId = currentMatchId || createMatchId(user.uid, matchedUser.uid || matchedUser.id)
    console.log(`👀 [WeAreMeeting] Setting up listener for match: ${matchId}`)
    console.log(`👀 [WeAreMeeting] user.uid: ${user.uid}, matchedUser: ${matchedUser.uid || matchedUser.id}`)
    
    const matchRef = doc(db, 'activeMatches', matchId)
    
    // ✅ Track if we already handled this to prevent duplicate modals
    let hasHandledMeeting = false
    
    // ✅ v2.8.18: Reusable function to handle meeting confirmation
    const handleMeetingConfirmed = async (data: any, source: string) => {
      if (hasHandledMeeting) {
        console.log(`⏭️ [WeAreMeeting] Already handled (source: ${source}) - skipping`)
        return
      }
      
      // ✅ CRITICAL FIX: Don't show modal if already in Enjoy Mode session
      if (isInEnjoyModeSession || currentScreen === 'enjoy-mode') {
        console.log(`⏭️ [WeAreMeeting] Already in Enjoy Mode (source: ${source}) - skipping`)
        return
      }
      
      // Check if someone clicked "We're Meeting" and it wasn't us
      if ((data.status === 'successful' || data.status === 'meeting') && 
          data.meetingConfirmedBy && 
          data.meetingConfirmedBy !== user.uid) {
        
        hasHandledMeeting = true  // ✅ Mark as handled
        setIsPartnerReadyToMeet(true)  // ✅ CRITICAL: Disable "We're Meeting" button for us!
        
        console.log(`🎉 [WeAreMeeting] Partner clicked "We're Meeting!" (detected via ${source})`)
        console.log(`🎉 [WeAreMeeting] meetingConfirmedBy: ${data.meetingConfirmedBy}`)
        
        // Get partner info
        const partnerName = matchedUser.name || matchedUser.displayName || 'Your match'
        const partnerPhoto = matchedUser.photos?.[0] || matchedUser.photoURL || ''
        
        setMeetingPartnerInfo({
          uid: matchedUser.uid || matchedUser.id || '',
          name: partnerName,
          photo: partnerPhoto
        })
        
        // 🔊 Play "We're Meeting" celebration sound for HIM!
        try {
          const audio = new Audio('/sounds/meeting-celebration.wav')
          audio.volume = 0.8
          await audio.play()
          console.log('🔊 Meeting celebration sound played for partner!')
        } catch (err) {
          console.warn('Could not play meeting sound:', err)
        }
        
        // Show the modal!
        console.log(`🎉 [WeAreMeeting] Setting showWeAreMeeting = TRUE`)
        weAreMeetingOpenedAtRef.current = Date.now()  // ✅ v2.8.26: Track open time
        setShowWeAreMeeting(true)
      }
    }
    
    // ✅ Strategy 1: Real-time listener (works well on Android/Desktop)
    const unsubscribe = onSnapshot(matchRef, async (snapshot) => {
      if (!snapshot.exists()) {
        console.log(`👀 [WeAreMeeting] Snapshot: document doesn't exist`)
        return
      }
      
      const data = snapshot.data()
      console.log(`👀 [WeAreMeeting] Snapshot received - status: ${data.status}, meetingConfirmedBy: ${data.meetingConfirmedBy || 'none'}`)
      
      await handleMeetingConfirmed(data, 'realtime-listener')
    }, (error) => {
      console.error('❌ [WeAreMeeting] Listener error:', error)
    })
    
    // ✅ v2.8.18 FIX: Strategy 2: Polling fallback for iOS PWA
    // iOS PWA may not receive real-time updates reliably when app is in background
    const pollInterval = setInterval(async () => {
      if (hasHandledMeeting) return  // Already handled, stop polling
      
      try {
        const { getDoc } = await import('firebase/firestore')
        const snapshot = await getDoc(matchRef)
        
        if (snapshot.exists()) {
          const data = snapshot.data()
          
          // Only log if status changed to meeting
          if (data.status === 'meeting' || data.status === 'successful') {
            console.log(`🔄 [WeAreMeeting] Poll check - status: ${data.status}, confirmedBy: ${data.meetingConfirmedBy || 'none'}`)
            await handleMeetingConfirmed(data, 'polling-fallback')
          }
        }
      } catch (err) {
        // Silent fail - polling is just a fallback
      }
    }, 2000)  // Poll every 2 seconds
    
    return () => {
      console.log(`🔇 [WeAreMeeting] Cleaning up listener and polling for match: ${matchId}`)
      unsubscribe()
      clearInterval(pollInterval)
    }
  }, [user, matchedUser, isInEnjoyModeSession, currentScreen])  // ✅ Added enjoy mode dependencies

  // ✅ v2.8.18 FIX: Ensure Modal shows when partner clicks "We're Meeting"
  // This handles the case when user is in chat and returns to match screen
  useEffect(() => {
    // If partner clicked "We're Meeting" but modal not showing - show it!
    if (isPartnerReadyToMeet && !showWeAreMeeting && !isInEnjoyModeSession && currentScreen !== 'enjoy-mode') {
      console.log('🔔 [v2.8.18] Partner ready to meet but modal not showing - showing now!')
      console.log(`   isPartnerReadyToMeet: ${isPartnerReadyToMeet}`)
      console.log(`   showWeAreMeeting: ${showWeAreMeeting}`)
      console.log(`   currentScreen: ${currentScreen}`)
      
      // Get partner info from matchedUser if available
      if (matchedUser) {
        setMeetingPartnerInfo({
          uid: matchedUser.uid || matchedUser.id || '',
          name: matchedUser.name || matchedUser.displayName || 'Your match',
          photo: matchedUser.photos?.[0] || matchedUser.photoURL || ''
        })
      }
      
      // Show the modal!
      weAreMeetingOpenedAtRef.current = Date.now()  // ✅ v2.8.26: Track open time
      setShowWeAreMeeting(true)
      
      // Play celebration sound
      try {
        const audio = new Audio('/sounds/meeting-celebration.wav')
        audio.volume = 0.8
        audio.play()
      } catch (err) {
        console.warn('Could not play meeting sound:', err)
      }
    }
  }, [isPartnerReadyToMeet, showWeAreMeeting, isInEnjoyModeSession, currentScreen, matchedUser])

  // ✅ v2.8.4: "SHE DECIDES" Logic - Button lights up for woman when man sends message
  useEffect(() => {
    // Early exit - no cleanup needed
    const relevantScreens = ['match', 'chat', 'enjoy-mode']
    
    // 🔍 DEBUG: Log all conditions
    console.log('🔍 SHE DECIDES DEBUG:')
    console.log(`   user: ${user ? user.uid.slice(0, 8) + '...' : 'null'}`)
    console.log(`   matchedUser: ${matchedUser ? (matchedUser.uid || matchedUser.id || 'exists').slice(0, 8) + '...' : 'null'}`)
    console.log(`   currentScreen: ${currentScreen}`)
    console.log(`   matchCreatedAt: ${matchCreatedAt ? matchCreatedAt.toLocaleString() : 'null'}`)
    console.log(`   onboardingData.gender: ${onboardingData.gender}`)
    
    if (!user || !matchedUser || !relevantScreens.includes(currentScreen) || !matchCreatedAt) {
      if (!matchCreatedAt && matchedUser) {
        console.log('⏳ Waiting for matchCreatedAt before checking chat status...')
      }
      return
    }
    
    let isMounted = true
    // ✅ v2.8.5 FIX: Use currentMatchId if available, otherwise create it
    const matchId = currentMatchId || createMatchId(user.uid, matchedUser.uid || matchedUser.id)
    
    // ✅ v2.8.22 FIX: Get gender from profile, not just onboardingData!
    // onboardingData.gender might be stale or default to 'male'
    const loadGenderAndCheck = async () => {
      if (!isMounted) return
      
      try {
        // ✅ Load fresh gender from profile
        const { getUserProfile } = await import('@/lib/firestore-service')
        const profile = await getUserProfile(user.uid)
        const currentUserGender = profile?.gender || onboardingData.gender || 'male'
        
        console.log(`🔍 CHECKING She Decides for matchId: ${matchId}`)
        console.log(`🔍 currentMatchId state: ${currentMatchId || 'NOT SET'}`)
        console.log(`🔍 Current user gender from PROFILE: "${currentUserGender}"`)
        
        // ✅ Update onboardingData if different
        if (profile?.gender && profile.gender !== onboardingData.gender) {
          console.log(`🔄 Updating onboardingData.gender: ${onboardingData.gender} → ${profile.gender}`)
          setOnboardingData(prev => ({ ...prev, gender: profile.gender }))
        }
        
        return currentUserGender
      } catch (err) {
        console.error('Error loading gender:', err)
        return onboardingData.gender || 'male'
      }
    }
    
    // ✅ v2.8.22 FIX: Reusable function to check and update button state
    const checkAndUpdateButtonState = async (currentUserGender: string) => {
      if (!isMounted) return false
      
      try {
        const { checkBidirectionalChat, getUserProfile } = await import('@/lib/firestore-service')
        const result = await checkBidirectionalChat(matchId, user.uid, matchedUser.uid || matchedUser.id, matchCreatedAt)
        
        if (!isMounted) return false
        
        console.log(`💕 Chat check result:`)
        console.log(`   user1HasSent (me): ${result.user1HasSent}`)
        console.log(`   user2HasSent (partner): ${result.user2HasSent}`)
        console.log(`   messageCount: ${result.messageCount}`)
        
        // ✅ v2.8.26 FIX: Get partner's gender to detect same-sex matches!
        const partnerProfile = await getUserProfile(matchedUser.uid || matchedUser.id)
        const partnerGender = partnerProfile?.gender || matchedUser.gender || 'unknown'
        const isSameSexMatch = currentUserGender === partnerGender
        
        console.log(`💕 Gender check: me=${currentUserGender}, partner=${partnerGender}, sameSex=${isSameSexMatch}`)
        
        let shouldEnableButton = false
        
        if (isSameSexMatch) {
          // ✅ v2.8.26: SAME-SEX MATCH - Button lights up for BOTH only after BOTH sent messages!
          // True bidirectional chat required - both must participate
          const isTrueBidirectional = result.user1HasSent && result.user2HasSent
          shouldEnableButton = isTrueBidirectional
          console.log(`💕 Same-sex match: Bidirectional chat (both sent) = ${isTrueBidirectional} → Button: ${shouldEnableButton ? 'ON 💖' : 'OFF'}`)
        } else if (currentUserGender === 'female') {
          // STRAIGHT MATCH - Woman sees button when man sent her a message
          shouldEnableButton = result.user2HasSent
          console.log(`💕 Woman's view: Man sent message = ${result.user2HasSent} → Button: ${shouldEnableButton ? 'ON 💖' : 'OFF'}`)
        } else {
          // STRAIGHT MATCH - Man's button stays OFF - he waits for her to click
          shouldEnableButton = false
          console.log(`💕 Man's view: Waiting for her decision → Button: OFF`)
        }
        
        console.log(`🔴 Setting hasBidirectionalChat to: ${shouldEnableButton}`)
        setHasBidirectionalChat(shouldEnableButton)
        
        return shouldEnableButton
      } catch (err) {
        console.error('Error checking chat status:', err)
        return false
      }
    }
    
    // ✅ v2.8.22: Store gender for polling
    let cachedGender: string = onboardingData.gender || 'male'
    
    // Initial check - load gender first!
    const initCheck = async () => {
      cachedGender = await loadGenderAndCheck() || 'male'
      await checkAndUpdateButtonState(cachedGender)
    }
    initCheck()
    
    // Real-time listener for new messages
    // ✅ v2.8.5 FIX: Messages are stored in 'matches' collection, not 'chats'!
    const messagesRef = collection(db, 'matches', matchId, 'messages')
    
    const unsubscribe = onSnapshot(messagesRef, async (snapshot) => {
      console.log(`📩 onSnapshot fired! ${snapshot.size} messages detected`)
      await checkAndUpdateButtonState(cachedGender)
    }, (error) => {
      // ✅ v2.8.6: Handle listener errors (common on iOS Safari)
      console.error('⚠️ onSnapshot error (iOS Safari issue?):', error)
    })
    
    // ✅ v2.8.22 FIX: Enable polling for ALL devices!
    // Android new versions may have issues with onSnapshot too
    // Poll every 2 seconds as a safety net for She Decides button
    console.log('📱 Enabling polling backup for She Decides button (all devices)')
    const pollInterval = setInterval(async () => {
      if (!isMounted) return
      const buttonEnabled = await checkAndUpdateButtonState(cachedGender)
      console.log(`🔄 Polling check: button=${buttonEnabled ? 'ON 💖' : 'OFF'}`)
    }, 2000)  // Check every 2 seconds
    
    return () => {
      isMounted = false
      unsubscribe()
      clearInterval(pollInterval)
    }
  }, [user, matchedUser, currentScreen, matchCreatedAt, onboardingData.gender, currentMatchId])  // ✅ Added gender + currentMatchId dependency!

  // ✅ NEW: Listen for partner exiting Enjoy Mode
  // This detects when partner clicks "Exit Meeting" before timer ends
  useEffect(() => {
    // Only listen when WE are in enjoy-mode
    if (!user || !matchedUser || currentScreen !== "enjoy-mode" || !meetingStartedAt) return
    
    // ✅ v2.8.5 FIX: Use currentMatchId if available
    const matchId = currentMatchId || createMatchId(user.uid, matchedUser.uid || matchedUser.id)
    console.log(`👀 Listening for partner exit on match: ${matchId}`)
    
    const matchRef = doc(db, 'activeMatches', matchId)
    
    // Track if we've already shown the modal to prevent duplicates
    let hasShownModal = false
    
    const unsubscribe = onSnapshot(matchRef, async (snapshot) => {
      if (hasShownModal) return  // Already handled
      
      if (!snapshot.exists()) {
        // Match document was deleted - partner left!
        console.log('💔 Match document deleted - partner left the meeting!')
        hasShownModal = true
        
        // ✅ v2.8.26 FIX: Save enjoy mode state NOW, before showing modal!
        const wasInEnjoy = currentScreen === 'enjoy-mode' || localStorage.getItem('i4iguana_enjoy_mode') === 'true'
        setWasInEnjoyModeWhenPartnerLeft(wasInEnjoy)
        console.log(`📋 Was in Enjoy Mode when partner left: ${wasInEnjoy}`)
        
        // Save partner info for feedback
        if (matchedUser && user) {
          setPartnerInfoWhenLeft({
            matchId: currentMatchId || createMatchId(user.uid, matchedUser.uid || matchedUser.id),
            partnerId: matchedUser.uid || matchedUser.id,
            partnerName: matchedUser.name || matchedUser.displayName || 'Your match',
            partnerPhoto: matchedUser.photos?.[0] || matchedUser.photoURL
          })
        }
        
        setShowPartnerLeftMeeting(true)
        return
      }
      
      const data = snapshot.data()
      
      // ✅ NEW: Check if partner DELETED their account during Enjoy Mode
      if (data.isActive === false && 
          data.cancelReason === 'account_deleted' && 
          data.cancelledBy && 
          data.cancelledBy !== user.uid) {
        
        console.log('💔 Partner deleted their account during meeting!')
        console.log(`   Cancelled by: ${data.cancelledBy} (not us: ${user.uid})`)
        hasShownModal = true
        
        // ✅ v2.8.26 FIX: Save enjoy mode state NOW!
        const wasInEnjoy = currentScreen === 'enjoy-mode' || localStorage.getItem('i4iguana_enjoy_mode') === 'true'
        setWasInEnjoyModeWhenPartnerLeft(wasInEnjoy)
        console.log(`📋 Was in Enjoy Mode when partner left: ${wasInEnjoy}`)
        
        // Save partner info for feedback
        if (matchedUser && user) {
          setPartnerInfoWhenLeft({
            matchId: currentMatchId || createMatchId(user.uid, matchedUser.uid || matchedUser.id),
            partnerId: matchedUser.uid || matchedUser.id,
            partnerName: matchedUser.name || matchedUser.displayName || 'Your match',
            partnerPhoto: matchedUser.photos?.[0] || matchedUser.photoURL
          })
        }
        
        // Play a gentle notification sound
        try {
          const audio = new Audio('/sounds/notification.wav')
          audio.volume = 0.5
          await audio.play()
        } catch (err) {
          console.warn('Could not play notification sound:', err)
        }
        
        setShowPartnerLeftMeeting(true)
        return
      }
      
      // Check if meeting was completed by PARTNER (not us)
      // ✅ CRITICAL: Check meetingExitedBy to know WHO exited
      if (data.meetingCompletedAt && 
          data.meetingExitReason === 'manual' && 
          data.meetingExitedBy && 
          data.meetingExitedBy !== user.uid) {
        
        console.log('💔 Partner manually exited the meeting!')
        console.log(`   Exited by: ${data.meetingExitedBy} (not us: ${user.uid})`)
        hasShownModal = true
        
        // ✅ v2.8.26 FIX: Save enjoy mode state NOW!
        const wasInEnjoy = currentScreen === 'enjoy-mode' || localStorage.getItem('i4iguana_enjoy_mode') === 'true'
        setWasInEnjoyModeWhenPartnerLeft(wasInEnjoy)
        console.log(`📋 Was in Enjoy Mode when partner left: ${wasInEnjoy}`)
        
        // Save partner info for feedback
        if (matchedUser && user) {
          setPartnerInfoWhenLeft({
            matchId: currentMatchId || createMatchId(user.uid, matchedUser.uid || matchedUser.id),
            partnerId: matchedUser.uid || matchedUser.id,
            partnerName: matchedUser.name || matchedUser.displayName || 'Your match',
            partnerPhoto: matchedUser.photos?.[0] || matchedUser.photoURL
          })
        }
        
        // Play a gentle notification sound
        try {
          const audio = new Audio('/sounds/notification.wav')
          audio.volume = 0.5
          await audio.play()
        } catch (err) {
          console.warn('Could not play notification sound:', err)
        }
        
        setShowPartnerLeftMeeting(true)
      }
    })
    
    return () => unsubscribe()
  }, [user, matchedUser, currentScreen, meetingStartedAt])

  // ✅ v2.8.26: SIMPLE refresh logic - like Tinder/Bumble!
  // App in memory + return within 1 hour = NO REFRESH
  // App in memory + return after 1 hour = REFRESH
  // App closed from memory = REFRESH + re-auth
  useEffect(() => {
    const BACKGROUND_THRESHOLD = 60 * 60 * 1000 // 1 hour - simple and clear!
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - save timestamp
        backgroundTimeRef.current = Date.now()
        console.log('📱 App went to background')
      } else {
        // App returning to foreground
        if (backgroundTimeRef.current) {
          const timeInBackground = Date.now() - backgroundTimeRef.current
          const minutesInBackground = Math.round(timeInBackground / 1000 / 60)
          console.log(`📱 App returned from background after ${minutesInBackground} minutes`)
          
          // ✅ v2.8.25: Check if user clicked notification while in background
          const pendingMatchId = localStorage.getItem('i4iguana_pending_chat_matchId')
          if (pendingMatchId && matchedUser) {
            console.log('🔔 NOTIFICATION CLICK: App returned from background - opening chat!')
            localStorage.removeItem('i4iguana_pending_chat_matchId')
            setSelectedMatch(matchedUser)
            setCurrentScreen("chat")
            backgroundTimeRef.current = null
            return
          }
          
          // ✅ v2.8.26 SIMPLE RULE: Refresh only after 1 hour
          if (timeInBackground >= BACKGROUND_THRESHOLD) {
            console.log('🚀 Over 1 hour in background - refreshing')
            setSplashComplete(false)
            setCurrentScreen("splash")
          } else {
            console.log(`⚡ Under 1 hour (${minutesInBackground}min) - NO refresh!`)
          }
          
          backgroundTimeRef.current = null
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [matchedUser])

  // ✅ OPTIMIZED: Handle auth state changes with timeout
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Auth still loading...')
        return
      }
      
      // ✅ CRITICAL: Wait for auth initialization to complete
      // This prevents navigation while Firebase is still restoring auth state
      const authInitializing = localStorage.getItem('i4iguana_auth_initializing')
      if (authInitializing === 'true') {
        console.log('⏳ Auth still initializing, waiting...')
        return
      }

      // ═══════════════════════════════════════════════════════════════
      // 🔍 DEBUG v2.8.23: Log all important flags
      // ═══════════════════════════════════════════════════════════════
      const debugJustDeleted = localStorage.getItem('i4iguana_just_deleted')
      const debugLangSelected = localStorage.getItem('i4iguana_language_selected')
      const debugWasAuth = localStorage.getItem('i4iguana_was_authenticated')
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('🔍 DEBUG FLAGS:')
      console.log('   just_deleted:', debugJustDeleted)
      console.log('   language_selected:', debugLangSelected)
      console.log('   was_authenticated:', debugWasAuth)
      console.log('   user:', user?.email || 'null/undefined')
      console.log('   currentScreen:', currentScreen)
      console.log('   splashComplete:', splashComplete)
      console.log('═══════════════════════════════════════════════════════════════')
      
      // ✅ CRITICAL FIX: Check if account was JUST deleted - go to fresh start!
      // This flag is set by handleDeleteAccount and cleared after navigation
      const justDeleted = localStorage.getItem('i4iguana_just_deleted')
      if (justDeleted === 'true') {
        // ✅ v2.8.24 FIX: Allow user to proceed through auth flow!
        // Don't redirect to welcome if already in welcome, login, or phone-verification!
        const allowedScreensForJustDeleted = ["welcome", "login", "phone-verification"]
        if (allowedScreensForJustDeleted.includes(currentScreen)) {
          console.log('🗑️ Account JUST deleted but user is in auth flow (' + currentScreen + ') - NOT redirecting!')
          // Don't return - let user proceed!
        } else {
          console.log('🗑️ Account JUST deleted → Fresh start!')
          // ✅ v2.8.23 FIX: Check language selection DIRECTLY from localStorage!
          // Don't use hasSelectedLanguage hook - it might not be synced yet!
          const languageSelected = localStorage.getItem('i4iguana_language_selected')
          if (languageSelected !== 'true') {
            console.log('🌍 No language selected (localStorage check) → LANGUAGE SELECTION')
            setCurrentScreen("language-selection")
            return
          }
          console.log('🌍 Language already selected → WELCOME')
          setCurrentScreen("welcome")
          return
        }
      }

      // ✅ FIX: Skip if already in onboarding flow - don't interrupt user!
      const onboardingScreens = ["onboarding-welcome", "onboarding-name", "onboarding-gender", "onboarding-age", "onboarding-hobbies", "onboarding-lifestyle", "onboarding-photos"]
      if (onboardingScreens.includes(currentScreen)) {
        console.log('✅ Already in onboarding flow, not interrupting')
        return
      }

      console.log('🔍 Auth check:', user?.email || 'No user', 'splash:', currentScreen === 'splash', 'splashComplete:', splashComplete)
      
      // ✅ Wait for splash animation to complete before navigating
      if (currentScreen === "splash" && !splashComplete) {
        console.log('⏳ Waiting for splash animation...')
        return
      }
      
      // No user → go to welcome (from splash or other non-auth screens)
      if (!user) {
        const authFlowScreens = ["language-selection", "welcome", "login", "onboarding-welcome", "onboarding-name", "onboarding-gender", "onboarding-age", "onboarding-hobbies", "onboarding-lifestyle", "onboarding-photos"]
        
        // ✅ CRITICAL FIX: Check if user was previously authenticated!
        // Firebase might still be restoring the auth state
        const wasAuthenticated = localStorage.getItem('i4iguana_was_authenticated')
        const phoneVerified = localStorage.getItem('i4iguana_phone_verified')
        
        if (wasAuthenticated === 'true' || phoneVerified === 'true') {
          // User was previously logged in - Firebase might still be loading
          console.log('⏳ No user but was previously authenticated - waiting for Firebase to restore...')
          
          // ✅ IMPROVED: Give Firebase more time (5 seconds instead of 3)
          const authWaitStart = localStorage.getItem('i4iguana_auth_wait_start')
          const now = Date.now()
          
          if (!authWaitStart) {
            // Start waiting
            localStorage.setItem('i4iguana_auth_wait_start', String(now))
            console.log('   Starting 5 second wait for Firebase auth restoration...')
            return // Wait for next checkAuth cycle
          }
          
          const waitTime = now - parseInt(authWaitStart)
          if (waitTime < 5000) {  // ✅ Changed from 3000 to 5000
            // Still waiting
            console.log(`   Waiting... ${Math.round(waitTime/1000)}s / 5s`)
            return // Keep waiting
          }
          
          // Waited long enough - auth really didn't restore
          console.log('⏰ Waited 5 seconds - Firebase auth did not restore. Session expired.')
          localStorage.removeItem('i4iguana_auth_wait_start')
          localStorage.removeItem('i4iguana_was_authenticated')
          // Clean up saved state
          localStorage.removeItem('i4iguana_last_screen')
          localStorage.removeItem('i4iguana_enjoy_mode')
          localStorage.removeItem('i4iguana_matched_user_id')
          // Don't remove phone_verified - user might re-login
        }
        
        if (currentScreen === "splash" && splashComplete) {
          // ✅ v2.8.23: Check language selection DIRECTLY from localStorage!
          const languageSelected = localStorage.getItem('i4iguana_language_selected')
          if (languageSelected !== 'true') {
            console.log('🌍 No language selected (localStorage) → LANGUAGE SELECTION')
            setCurrentScreen("language-selection")
            return
          }
          // ✅ Splash finished, no user → go to welcome
          console.log('🚀 Splash done, no user → WELCOME')
          setCurrentScreen("welcome")
          return
        }
        if (!authFlowScreens.includes(currentScreen)) {
          console.log('❌ No user → WELCOME')
          setCurrentScreen("welcome")
        }
        return
      }
      
      // ✅ v2.8.6 FIX: Create device ID if not exists - don't sign out!
      // The profile check later will handle returning users properly.
      const existingDeviceId = localStorage.getItem('i4iguana_device_id')
      
      if (!existingDeviceId) {
        // ✅ Create Device ID (whether fresh login or cache cleared)
        console.log('🆔 No device ID found - creating new one...')
        const newDeviceId = getOrCreateDeviceId()
        console.log('🆔 Device ID created:', newDeviceId.slice(0, 15) + '...')
      }
      
      localStorage.removeItem('i4iguana_auth_wait_start')
      localStorage.setItem('i4iguana_was_authenticated', 'true')
      
      // ✅ User exists - if on splash and splash complete, continue to check profile and navigate
      if (currentScreen === "splash" && splashComplete) {
        console.log('🚀 User logged in, splash done → checking profile...')
        // ✅ v2.8.6: Add small delay to ensure Firestore is ready
        await new Promise(resolve => setTimeout(resolve, 500))
        // Don't return - continue to profile check below
      } else if (currentScreen === "splash") {
        // Splash not complete yet - wait
        return
      }
      
      // ═══════════════════════════════════════════════════════════════
      // 🔍 DEBUG: FULL LOGIN FLOW ANALYSIS
      // ═══════════════════════════════════════════════════════════════
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('🔍 LOGIN FLOW DEBUG - v2.8.5')
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('📱 User UID:', user.uid)
      console.log('📧 User Email:', user.email)
      console.log('🖥️ Current Screen:', currentScreen)
      console.log('═══════════════════════════════════════════════════════════════')
      
      // User exists → check if we need to navigate
      // ✅ CRITICAL FIX: ALWAYS check deleted status FIRST - before ANY other logic!
      // This MUST run before checking localStorage or any cached values!
      
      // ✅ ANTI-RACE-CONDITION: Check if we're already handling a deleted account
      const isHandlingDeleted = localStorage.getItem('i4iguana_handling_deleted')
      if (isHandlingDeleted === 'true') {
        console.log('🔄 Already handling deleted account - waiting...')
        // We're already in process of handling a deleted account
        // Don't interfere - just check if we should stay on phone-verification
        if (currentScreen === 'phone-verification') {
          console.log('   ✅ Already on phone-verification, staying here')
          return
        }
        // Clear the flag after 5 seconds in case something went wrong
        setTimeout(() => {
          localStorage.removeItem('i4iguana_handling_deleted')
        }, 5000)
        return
      }
      
      // ✅ STEP 1: Get profile and check deleted status IMMEDIATELY
      let profile: any = null
      try {
        // ✅ v2.8.6: Add retry logic for more reliable profile fetch
        let retryCount = 0
        const maxRetries = 2
        
        while (retryCount <= maxRetries) {
          try {
            profile = await getUserProfile(user.uid)
            if (profile) break
            
            // If no profile, wait and retry
            if (retryCount < maxRetries) {
              console.log(`⏳ Profile not found, retry ${retryCount + 1}/${maxRetries}...`)
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
            retryCount++
          } catch (fetchErr) {
            if (retryCount < maxRetries) {
              console.log(`⏳ Profile fetch failed, retry ${retryCount + 1}/${maxRetries}...`)
              await new Promise(resolve => setTimeout(resolve, 1000))
              retryCount++
            } else {
              throw fetchErr // Re-throw on final retry
            }
          }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ✅ v2.8.5 FIX: If profile not found by UID, try to find by EMAIL!
        // This handles cases where Firebase Auth creates a new UID
        // ✅ v2.8.23 FIX: Skip migration if account was JUST deleted!
        // ═══════════════════════════════════════════════════════════════
        const justDeletedFlag = localStorage.getItem('i4iguana_just_deleted')
        
        if (!profile && user.email && justDeletedFlag !== 'true') {
          console.log('🔍 Profile not found by UID - searching by email...')
          console.log(`   Email: ${user.email}`)
          
          try {
            const { collection: fbCollection, query, where, getDocs, doc: fbDoc, setDoc, deleteDoc } = await import('firebase/firestore')
            const { db } = await import('@/lib/firebase')
            
            const usersRef = fbCollection(db, 'users')
            
            // ✅ Try searching by email first
            let emailQuery = query(usersRef, where('email', '==', user.email))
            let emailSnapshot = await getDocs(emailQuery)
            
            // ✅ If not found, also try searching by Google email field
            if (emailSnapshot.empty) {
              console.log('   Not found by email field, trying Google email...')
              emailQuery = query(usersRef, where('googleEmail', '==', user.email))
              emailSnapshot = await getDocs(emailQuery)
            }
            
            if (!emailSnapshot.empty) {
              const oldProfileDoc = emailSnapshot.docs[0]
              const oldProfile = oldProfileDoc.data()
              const oldUid = oldProfileDoc.id
              
              console.log('✅ Found existing profile by email!')
              console.log(`   Old UID: ${oldUid}`)
              console.log(`   New UID: ${user.uid}`)
              console.log(`   Name: ${oldProfile.name}`)
              console.log(`   Was deleted: ${oldProfile.deleted}`)
              
              // ✅ MIGRATE: Copy profile to new UID
              console.log('🔄 Migrating profile to new UID...')
              
              // Create new document with new UID
              // ✅ Also UNDELETE if it was deleted, and ADD email!
              await setDoc(fbDoc(db, 'users', user.uid), {
                ...oldProfile,
                uid: user.uid,  // Update UID field
                email: user.email,  // ✅ Ensure email is set!
                deleted: false,  // ✅ UNDELETE!
                migratedFrom: oldUid,  // Track migration
                migratedAt: new Date().toISOString()
              })
              
              // Delete old document
              await deleteDoc(fbDoc(db, 'users', oldUid))
              
              console.log('✅ Profile migrated successfully!')
              
              // Load the migrated profile (with deleted: false)
              profile = { ...oldProfile, uid: user.uid, email: user.email, deleted: false }
            } else {
              console.log('❌ No profile found by email either - truly new user')
            }
          } catch (emailSearchError) {
            console.error('⚠️ Error searching by email:', emailSearchError)
            // Continue with null profile
          }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ✅ v2.8.22 FIX: If STILL no profile, try to find by PHONE NUMBER!
        // This handles cases where user logged in with phone (no email)
        // ✅ v2.8.23 FIX: Skip migration if account was JUST deleted!
        // ═══════════════════════════════════════════════════════════════
        if (!profile && user.phoneNumber && justDeletedFlag !== 'true') {
          console.log('🔍 Profile not found - searching by phone number...')
          console.log(`   Phone: ${user.phoneNumber}`)
          
          try {
            const { collection: fbCollection, query, where, getDocs, doc: fbDoc, setDoc, deleteDoc } = await import('firebase/firestore')
            const { db } = await import('@/lib/firebase')
            
            const usersRef = fbCollection(db, 'users')
            
            // Search by phone number
            const phoneQuery = query(usersRef, where('phoneNumber', '==', user.phoneNumber))
            const phoneSnapshot = await getDocs(phoneQuery)
            
            if (!phoneSnapshot.empty) {
              const oldProfileDoc = phoneSnapshot.docs[0]
              const oldProfile = oldProfileDoc.data()
              const oldUid = oldProfileDoc.id
              
              console.log('✅ Found existing profile by phone!')
              console.log(`   Old UID: ${oldUid}`)
              console.log(`   New UID: ${user.uid}`)
              console.log(`   Name: ${oldProfile.name}`)
              
              // MIGRATE: Copy profile to new UID
              console.log('🔄 Migrating profile to new UID...')
              
              await setDoc(fbDoc(db, 'users', user.uid), {
                ...oldProfile,
                uid: user.uid,
                phoneNumber: user.phoneNumber,
                deleted: false,
                migratedFrom: oldUid,
                migratedAt: new Date().toISOString()
              })
              
              // Delete old document
              await deleteDoc(fbDoc(db, 'users', oldUid))
              
              console.log('✅ Profile migrated successfully by phone!')
              profile = { ...oldProfile, uid: user.uid, phoneNumber: user.phoneNumber, deleted: false }
            } else {
              console.log('❌ No profile found by phone either')
            }
          } catch (phoneSearchError) {
            console.error('⚠️ Error searching by phone:', phoneSearchError)
          }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // 🔍 DEBUG: PROFILE DATA
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════')
        console.log('📋 PROFILE DATA:')
        console.log('   Name:', profile?.name || 'NULL')
        console.log('   Email:', profile?.email || 'NULL')
        console.log('   Phone:', profile?.phoneNumber || 'NULL')
        console.log('   phoneVerified:', profile?.phoneVerified)
        console.log('   verifiedDeviceId:', profile?.verifiedDeviceId || 'NULL')
        console.log('   onboardingComplete:', profile?.onboardingComplete)
        console.log('   checkedInVenue:', profile?.checkedInVenue || 'NULL')
        console.log('   deleted:', profile?.deleted)
        console.log('   photos:', profile?.photos?.length || 0, 'photos')
        console.log('═══════════════════════════════════════════════════════════════')
        
        // ═══════════════════════════════════════════════════════════════
        // ✅ v2.8.22 FIX: Update profile with missing email/phone for cross-login!
        // If user logged in with Google but profile has no email, add it.
        // If user logged in with phone but profile has no phoneNumber, add it.
        // ═══════════════════════════════════════════════════════════════
        if (profile && !profile.deleted) {
          const updates: Record<string, string> = {}
          
          if (user.email && !profile.email) {
            updates.email = user.email
            console.log('📧 Adding missing email to profile:', user.email)
          }
          
          if (user.phoneNumber && !profile.phoneNumber) {
            updates.phoneNumber = user.phoneNumber
            console.log('📱 Adding missing phoneNumber to profile:', user.phoneNumber)
          }
          
          if (Object.keys(updates).length > 0) {
            try {
              const { doc: fbDoc, updateDoc } = await import('firebase/firestore')
              const { db } = await import('@/lib/firebase')
              await updateDoc(fbDoc(db, 'users', user.uid), updates)
              console.log('✅ Profile updated with cross-login identifiers!')
              // Update local profile object too
              Object.assign(profile, updates)
            } catch (updateErr) {
              console.error('⚠️ Error updating profile with cross-login identifiers:', updateErr)
            }
          }
        }
        
        // ✅ CRITICAL: If account was deleted - FORCE phone verification!
        if (profile?.deleted === true) {
          console.log('🗑️ ===== DELETED ACCOUNT DETECTED! =====')
          console.log('   Setting handling flag to prevent race condition...')
          
          // ✅ SET FLAG FIRST to prevent re-entry
          localStorage.setItem('i4iguana_handling_deleted', 'true')
          
          console.log('   Clearing ALL cached data and forcing phone verification...')
          
          // ✅ NUCLEAR OPTION: Clear EVERYTHING from localStorage (except handling flag!)
          const keysToRemove = [
            'hasScannedQR',
            'pendingCheckIn', 
            'i4iguana_phone_verified',
            `notificationModalShown_${user.uid}`,
            `oneSignalLinked_${user.uid}`,
            'i4iguana_checkin',
            'lastVenueId',
            'force_notification_setup'
          ]
          keysToRemove.forEach(key => localStorage.removeItem(key))
          sessionStorage.clear()
          
          console.log('   ✅ All localStorage cleared')
          
          // ✅ Reset user profile for fresh start
          const { doc, updateDoc, Timestamp } = await import('firebase/firestore')
          const { db } = await import('@/lib/firebase')
          await updateDoc(doc(db, 'users', user.uid), { 
            deleted: false, 
            onboardingComplete: false,
            phoneVerified: false,
            phoneVerifiedAt: null,
            phoneNumber: null,
            verifiedDeviceId: null,  // ✅ v2.8.4: Clear device ID for fresh start!
            lastVerifiedAt: null,
            isAvailable: true,
            swipedRight: [],
            swipedLeft: [],
            matches: [],
            // ✅ CRITICAL: Also clear photos to prevent wasDefinitelyVerified bypass!
            photos: [],
            name: null,
            bio: ''
          })
          console.log('   ✅ User profile reset in Firebase')
          
          // ✅ FORCE phone verification - NO EXCEPTIONS!
          console.log('   ✅ Redirecting to phone-verification...')
          setCurrentScreen("phone-verification")
          
          // ✅ Clear the handling flag after navigation is done
          setTimeout(() => {
            localStorage.removeItem('i4iguana_handling_deleted')
            console.log('   ✅ Cleared handling_deleted flag')
          }, 3000)
          
          return
        }
      } catch (profileError) {
        console.error('⚠️ Error checking profile:', profileError)
        // ✅ v2.8.6 FIX: On profile error, check cache FIRST!
        // Don't force re-verification just because of a network issue
        const cachedPhoneVerified = localStorage.getItem('i4iguana_phone_verified')
        
        if (cachedPhoneVerified === 'true') {
          console.log('⚠️ Profile error but phone was verified (cached) → WORLD SELECTION')
          setCurrentScreen("world-selection")
        } else {
          console.log('📱 Profile error and no cache - requiring phone verification for safety')
          setCurrentScreen("phone-verification")
        }
        localStorage.removeItem('i4iguana_handling_deleted')
        return
      }
      
      // ✅ STEP 2: Now we can safely check if already on app screen
      // ✅ FIXED: Don't include phone-verification - we want to re-check after login!
      // ✅ FIXED v2.5.21: Include Zone Mode screens to prevent reset!
      const appScreens = ["world-selection", "home", "match", "notifications", "profile", "chat", "scan", "enjoy-mode", "mode-selection", "discovery", "zone-mode", "explore-zone"]
      if (appScreens.includes(currentScreen)) {
        // ✅ v2.8.3 CRITICAL FIX: If on match/enjoy-mode/chat but matchCreatedAt is null,
        // we need to load it from the server!
        const matchRelatedScreens = ["match", "enjoy-mode", "chat"]
        if (matchRelatedScreens.includes(currentScreen) && !matchCreatedAt) {
          console.log('⚠️ On match screen but matchCreatedAt is null - loading from server...')
          
          try {
            const activeMatch = await getActiveMatchForUser(user.uid)
            if (activeMatch && activeMatch.createdAt) {
              console.log('✅ Loaded matchCreatedAt from server:', activeMatch.createdAt.toLocaleString())
              setMatchCreatedAt(activeMatch.createdAt)
              
              // Also ensure matchedUser is set
              if (!matchedUser && activeMatch.matchedUser) {
                setMatchedUser(activeMatch.matchedUser)
                setMatchExpiresAt(activeMatch.expiresAt)
                
                // ✅ v2.8.5 FIX: Set currentMatchId!
                const loadedMatchId = activeMatch.matchId || createMatchId(user.uid, activeMatch.matchedUser.uid)
                setCurrentMatchId(loadedMatchId)
                console.log(`🎯 Set currentMatchId from activeMatch: ${loadedMatchId}`)
              }
            }
          } catch (err) {
            console.error('⚠️ Error loading matchCreatedAt:', err)
          }
        }
        
        console.log('✅ Already in app, staying on:', currentScreen)
        return
      }
      
      // ✅ CRITICAL: Skip navigation if returning from payment
      // The payment success handler will handle navigation
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('payment_success') === 'true') {
          console.log('💳 Returning from payment - skipping auth navigation')
          return
        }
      }
      
      // ✅ Use the profile we already loaded above (no need to fetch again!)
      // The deleted check was already done - if we're here, account is NOT deleted
      
      if (!profile) {
        // ✅ v2.8.6 CRITICAL FIX: Check localStorage FIRST before requiring verification!
        // If user was previously verified, they shouldn't have to verify again just because
        // of a network issue or slow Firestore fetch.
        const cachedPhoneVerified = localStorage.getItem('i4iguana_phone_verified')
        
        if (cachedPhoneVerified === 'true') {
          console.log('⚠️ No profile found BUT phone was verified (cached) - retrying profile fetch...')
          
          // Give Firestore another chance
          try {
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
            const retryProfile = await getUserProfile(user.uid)
            
            if (retryProfile) {
              console.log('✅ Profile found on retry - continuing normally!')
              profile = retryProfile
              // Continue to normal flow below (don't return)
            } else {
              // ✅ v2.8.22 FIX: No profile = MUST go to onboarding to create user document!
              console.log('⚠️ Still no profile - phone was verified but NO user document exists!')
              console.log('   Redirecting to onboarding to create user document...')
              setCurrentScreen("onboarding-welcome")
              return
            }
          } catch (retryErr) {
            console.error('⚠️ Retry failed:', retryErr)
            // ✅ v2.8.22 FIX: Even with cache, if no profile exists, must create it!
            console.log('⚠️ Retry failed - redirecting to onboarding to create user document')
            setCurrentScreen("onboarding-welcome")
            return
          }
        } else {
          // ✅ No cache AND no profile = New user = MUST verify phone!
          console.log('📱 No profile found AND no cache → New user → Phone verification required')
          setCurrentScreen("phone-verification")
          return
        }
      }
      
      // ✅ Profile exists and is not deleted - continue with normal flow
      // ✅ CRITICAL FIX: Check for active match FIRST - before phone verification!
      // This prevents the phone-verification screen from flashing for 1 second
      console.log('🔍 Checking for active match FIRST...')
      try {
        const activeMatch = await getActiveMatchForUser(user.uid)
          
          if (activeMatch && activeMatch.matchedUser && activeMatch.expiresAt) {
            console.log('🎯 ACTIVE MATCH FOUND! Skipping phone verification check')
            console.log(`   Partner: ${activeMatch.matchedUser.name}`)
            console.log(`   Expires: ${activeMatch.expiresAt.toLocaleString()}`)
            console.log(`   Status: ${activeMatch.status}`)
            
            // ✅ v2.8.3 FIX: Check if this is a "resumed" match (old match, not freshly created)
            // If the match was created more than 5 minutes ago AND user is reconnecting,
            // we need to REFRESH the chat to ensure a clean start!
            const matchCreatedTime = activeMatch.createdAt ? new Date(activeMatch.createdAt) : null
            const now = new Date()
            const matchAgeMinutes = matchCreatedTime ? (now.getTime() - matchCreatedTime.getTime()) / (1000 * 60) : 0
            
            if (matchAgeMinutes > 5) {
              console.log(`🔄 Match is ${Math.round(matchAgeMinutes)} minutes old - REFRESHING chat for clean start!`)
              
              // ✅ Clear old chat messages!
              try {
                const matchedUserId = activeMatch.matchedUser.uid || activeMatch.matchedUser.id
                const chatMatchId = [user.uid, matchedUserId].sort().join('_')
                
                const { collection: fbCollection, getDocs: fbGetDocs, writeBatch, doc: fbDoc } = await import('firebase/firestore')
                const { db } = await import('@/lib/firebase')
                
                // ✅ v2.8.5 FIX: Messages are stored in 'matches' collection!
                const messagesRef = fbCollection(db, 'matches', chatMatchId, 'messages')
                const messagesSnap = await fbGetDocs(messagesRef)
                
                if (!messagesSnap.empty) {
                  console.log(`🧹 Clearing ${messagesSnap.size} old messages from resumed match`)
                  const batch = writeBatch(db)
                  messagesSnap.docs.forEach((docSnap) => {
                    batch.delete(docSnap.ref)
                  })
                  await batch.commit()
                  console.log('✅ Old chat cleared for fresh start!')
                }
                
                // ✅ Update createdAt in activeMatches to NOW
                const { updateDoc, Timestamp: fbTimestamp } = await import('firebase/firestore')
                await updateDoc(fbDoc(db, 'activeMatches', chatMatchId), {
                  createdAt: fbTimestamp.now(),
                  refreshedAt: fbTimestamp.now()
                })
                console.log('✅ Match createdAt refreshed to NOW')
                
                // ✅ Use NOW as matchCreatedAt, not the old timestamp
                setMatchCreatedAt(now)
              } catch (refreshError) {
                console.error('⚠️ Error refreshing chat:', refreshError)
                // Continue anyway - not critical
                setMatchCreatedAt(activeMatch.createdAt || null)
              }
            } else {
              console.log(`✅ Match is only ${Math.round(matchAgeMinutes)} minutes old - keeping chat`)
              setMatchCreatedAt(activeMatch.createdAt || null)
            }
            
            // ✅ Load phone number for match
            try {
              const phoneNumber = profile?.phoneNumber || `+972DEV${user.uid.slice(-8)}`
              setUserPhoneNumber(phoneNumber)
              console.log('📱 Loaded phone number for match:', phoneNumber)
            } catch (phoneError) {
              console.error('⚠️ Error loading phone number:', phoneError)
            }
            
            // ✅ Cache phone verified (user must have verified to get a match)
            localStorage.setItem('i4iguana_phone_verified', 'true')
            
            // ✅ Load gender from profile
            if (profile?.gender) {
              setOnboardingData(prev => ({ ...prev, gender: profile.gender }))
            }
            
            // ✅ CRITICAL: Reset bidirectional chat BEFORE setting matchCreatedAt
            // This prevents the button from lighting up due to old messages
            setHasBidirectionalChat(false)
            
            setMatchedUser(activeMatch.matchedUser)
            setMatchExpiresAt(activeMatch.expiresAt)
            // ✅ NOTE: matchCreatedAt is already set above (in the refresh logic)
            setIsLockedInMatch(true)
            setIsNewMatch(false)
            
            // ✅ v2.8.5 FIX: Set currentMatchId from activeMatch!
            const loadedMatchId = activeMatch.matchId || createMatchId(user.uid, activeMatch.matchedUser.uid)
            setCurrentMatchId(loadedMatchId)
            console.log(`🎯 Set currentMatchId from activeMatch: ${loadedMatchId}`)
            
            // ✅ CRITICAL: Check if user is locked on this match!
            const userIsLocked = activeMatch.lockedForUsers?.includes(user.uid) || false
            if (userIsLocked) {
              console.log('🔒 User is LOCKED on this match - will show paywall!')
              setIsMatchLocked(true)
              setTimeout(() => {
                setShowPremiumPaywall(true)
              }, 500)
            } else {
              setIsMatchLocked(false)
            }
            
            // ✅ FIX: Also set selectedMatch for chat to work after re-login!
            setSelectedMatch(activeMatch.matchedUser)
            
            // ✅ NEW: Check if in MEETING status → Restore to Enjoy Mode!
            if (activeMatch.status === 'meeting' && activeMatch.meetingStartedAt) {
              console.log('🎉 MEETING IN PROGRESS! Restoring to Enjoy Mode')
              console.log(`   Meeting started: ${activeMatch.meetingStartedAt.toLocaleString()}`)
              
              // Calculate remaining time
              const now = new Date()
              const meetingEndTime = new Date(activeMatch.meetingStartedAt.getTime() + 20 * 60 * 1000) // 20 minutes
              
              if (now < meetingEndTime) {
                // Meeting still active - restore Enjoy Mode
                setMeetingStartedAt(activeMatch.meetingStartedAt)
                setIsInEnjoyModeSession(true)  // ✅ FIXED: Track enjoy mode session!
                setCurrentScreen("enjoy-mode")
                console.log('✅ Restored to Enjoy Mode!')
                return  // Go directly to enjoy-mode!
              } else {
                // ✅ v2.8.26 FIX: Meeting timer expired - SHOW FEEDBACK SCREEN!
                console.log('⏰ Meeting timer expired - GOING TO FEEDBACK SCREEN!')
                
                // Set pending feedback data
                const partnerInfo = {
                  matchId: activeMatch.matchId || createMatchId(user.uid, activeMatch.matchedUser.uid || activeMatch.matchedUser.id),
                  partnerId: activeMatch.matchedUser.uid || activeMatch.matchedUser.id,
                  partnerName: activeMatch.matchedUser.name || activeMatch.matchedUser.displayName || 'Your match',
                  partnerPhoto: activeMatch.matchedUser.photos?.[0] || activeMatch.matchedUser.photoURL
                }
                
                setPendingFeedback(partnerInfo)
                localStorage.removeItem('i4iguana_enjoy_mode')  // Clear flag
                setCurrentScreen("meeting-feedback")
                console.log('✅ Showing feedback screen after expired meeting!')
                return  // Go to feedback!
              }
            }
            
            // ✅ v2.8.16 FIX: "She Decides" - Navigate based on gender when restoring!
            const currentUserGender = profile?.gender || onboardingData.gender || 'male'
            const matchedUserGender = activeMatch.matchedUser.gender || 'female'
            const isSameSexCouple = currentUserGender === matchedUserGender
            
            console.log(`🎯 "She Decides" LOGIN: User is ${currentUserGender}, match is ${matchedUserGender}`)
            
            // ✅ v2.8.25 FIX: Check for pending notification - go directly to chat!
            const pendingMatchId = localStorage.getItem('i4iguana_pending_chat_matchId')
            if (pendingMatchId) {
              console.log('🔔 NOTIFICATION CLICK: Opening chat directly!')
              console.log('   pendingMatchId:', pendingMatchId)
              localStorage.removeItem('i4iguana_pending_chat_matchId')  // Clear the flag
              setSelectedMatch(activeMatch.matchedUser)
              setCurrentScreen("chat")
              return  // Exit - go to chat!
            }
            
            console.log(`👩 Going to MATCH screen - gender UI handled there`)
            
            setCurrentScreen("match")
            return  // Exit - match found
          }
        } catch (matchError) {
          console.error('⚠️ Error checking for active match:', matchError)
          // Continue with normal flow
        }
        
        try {
          // ✅ v2.8.4 CRITICAL: Device-based verification!
          // Must verify phone on NEW devices for security!
          const currentDeviceId = getOrCreateDeviceId()
          const profileDeviceId = profile?.verifiedDeviceId
          
          console.log('═══════════════════════════════════════════════════════════════')
          console.log('🆔 DEVICE & PHONE CHECK:')
          console.log(`   Current device ID: ${currentDeviceId}`)
          console.log(`   Profile device ID: ${profileDeviceId || 'NOT SET'}`)
          console.log('═══════════════════════════════════════════════════════════════')
          
          // ✅ v2.8.5 FIX: Check if user was in enjoy-mode session (Cooling)
          // If yes, and they return after hours, don't force phone verification!
          const wasInEnjoyMode = localStorage.getItem('i4iguana_enjoy_mode') === 'true'
          const savedLastScreen = localStorage.getItem('i4iguana_last_screen')
          
          // ✅ v2.8.22 FIX: If user was on ANY app screen, don't require phone verification!
          // This prevents phone-verification from flashing after refresh
          const validAppScreensForRefresh = ['home', 'match', 'chat', 'enjoy-mode', 'meeting-feedback', 'world-selection', 'mode-selection', 'notifications', 'profile', 'discovery', 'zone-mode']
          const wasOnValidAppScreen = savedLastScreen && validAppScreensForRefresh.includes(savedLastScreen)
          
          if (wasInEnjoyMode || wasOnValidAppScreen) {
            console.log(`🔄 User was on app screen (${savedLastScreen}) - TRUSTING PROFILE!`)
            // Clear the enjoy mode state
            localStorage.removeItem('i4iguana_enjoy_mode')
            
            // ✅ v2.8.22 FIX: Always trust the profile and continue!
            // If user had an app screen saved, they were logged in - no need to re-verify
            console.log('✅ Trusting profile - going to world-selection')
            
            // Update device ID silently if different
            if (profileDeviceId !== currentDeviceId) {
              try {
                const { doc: fbDoc, updateDoc } = await import('firebase/firestore')
                const { db } = await import('@/lib/firebase')
                await updateDoc(fbDoc(db, 'users', user.uid), {
                  verifiedDeviceId: currentDeviceId
                })
                console.log('🆔 Device ID updated silently for returning user')
              } catch (updateErr) {
                console.warn('⚠️ Could not update device ID:', updateErr)
              }
            }
            
            localStorage.setItem('i4iguana_phone_verified', 'true')
            setCurrentScreen('world-selection')
            return
          }
          
          // ✅ v2.8.4 FIX: Check BOTH phone verification AND device match!
          const hasVerifiedPhone = profile?.phoneVerified === true && profile?.phoneNumber
          const isKnownDevice = profileDeviceId === currentDeviceId
          const hasCompletedOnboardingCheck = profile?.onboardingComplete === true
          
          console.log('📊 DECISION FACTORS:')
          console.log(`   hasVerifiedPhone: ${hasVerifiedPhone}`)
          console.log(`   isKnownDevice: ${isKnownDevice}`)
          console.log(`   hasCompletedOnboarding: ${hasCompletedOnboardingCheck}`)
          console.log(`   profileDeviceId exists: ${!!profileDeviceId}`)
          
          // ✅ v2.8.6 SECURITY FIX: Like Tinder - require phone verification on new device!
          // Even if user has verified phone and completed onboarding,
          // a NEW DEVICE (cache cleared / reinstall) requires re-verification for security.
          
          // ✅ v2.8.22: wasOnValidAppScreen already checked above - reuse it here!
          
          if (hasVerifiedPhone && hasCompletedOnboardingCheck) {
            // ✅ Check if this is the SAME device (localStorage cache exists)
            const cachedPhoneVerified = localStorage.getItem('i4iguana_phone_verified')
            
            if (cachedPhoneVerified === 'true') {
              // ✅ Same session, same device - continue without verification
              console.log('✅ DECISION: Same device session - CONTINUING!')
              // Continue to the normal flow below - don't return here!
            } else if (isKnownDevice) {
              // ✅ Device ID matches profile - trusted device
              console.log('✅ DECISION: Known device - CONTINUING!')
              localStorage.setItem('i4iguana_phone_verified', 'true')
              // Continue to the normal flow below
            } else if (wasOnValidAppScreen) {
              // ✅ v2.8.22 FIX: User was on app screen (refresh) - trust the profile!
              console.log('✅ DECISION: Was on app screen - trusting profile!')
              console.log(`   savedLastScreen: ${savedLastScreen}`)
              localStorage.setItem('i4iguana_phone_verified', 'true')
              // Update device ID to current
              try {
                const { doc: fbDoc, updateDoc } = await import('firebase/firestore')
                const { db } = await import('@/lib/firebase')
                await updateDoc(fbDoc(db, 'users', user.uid), {
                  verifiedDeviceId: currentDeviceId
                })
                console.log('🆔 Device ID updated after refresh')
              } catch (e) {
                console.warn('⚠️ Could not update device ID:', e)
              }
              // Continue to the normal flow below
            } else {
              // ❌ NEW DEVICE or cache cleared - require phone verification for security!
              // This is the "Tinder-like" behavior
              console.log('🔐 SECURITY: New device detected - phone verification required!')
              console.log('   Reason: Device ID mismatch AND no localStorage cache AND no savedLastScreen')
              console.log(`   Profile device: ${profileDeviceId?.slice(0, 15)}...`)
              console.log(`   Current device: ${currentDeviceId.slice(0, 15)}...`)
              console.log('   ℹ️ User will skip onboarding after verification (existing user)')
              setCurrentScreen("phone-verification")
              return
            }
          }
          // ✅ v2.8.5 FIX: If phone is verified but NO device ID in profile (old user),
          // save current device ID and continue WITHOUT requiring phone verification again!
          else if (hasVerifiedPhone && !profileDeviceId) {
            console.log('✅ DECISION: Old user - saving device ID and CONTINUING!')
            try {
              const { doc: fbDoc, updateDoc } = await import('firebase/firestore')
              const { db } = await import('@/lib/firebase')
              await updateDoc(fbDoc(db, 'users', user.uid), {
                verifiedDeviceId: currentDeviceId
              })
              console.log('🆔 Device ID saved for old user:', currentDeviceId.slice(0, 15) + '...')
              localStorage.setItem('i4iguana_phone_verified', 'true')
            } catch (saveError) {
              console.error('⚠️ Error saving device ID:', saveError)
              // Continue anyway - don't block the user
            }
          } else if (!hasVerifiedPhone) {
            // ✅ Phone NOT verified in Firestore - require verification
            console.log('❌ DECISION: Phone verification REQUIRED!')
            console.log('   Reason: hasVerifiedPhone is FALSE')
            console.log('   profile.phoneVerified =', profile?.phoneVerified)
            console.log('   profile.phoneNumber =', profile?.phoneNumber)
            // Clear any stale localStorage cache
            localStorage.removeItem('i4iguana_phone_verified')
            setCurrentScreen("phone-verification")
            return
          } else {
            console.log('✅ DECISION: Phone verified and device matches - CONTINUING!')
          }
        
        // ✅ If Firestore confirms verified (on same device OR old user without device ID), update localStorage cache
        if (hasVerifiedPhone && (isKnownDevice || !profileDeviceId)) {
          localStorage.setItem('i4iguana_phone_verified', 'true')
          console.log('✅ Phone verified:', profile?.phoneNumber)
        }
        
        const hasCompletedOnboarding = profile?.onboardingComplete === true
        
        // ✅ NOTE: deleted check is already done above (with race-condition protection)
        // No need to check again here
        
        const hasBasicProfile = profile && profile.photos && profile.photos.length > 0 && (profile.name || profile.displayName)
        
        if (hasCompletedOnboarding || hasBasicProfile) {
          console.log('✅ Existing user detected')
          
          // ✅ CRITICAL FIX: Load ALL profile data for "She Decides" logic and notifications!
          setOnboardingData(prev => ({ 
            ...prev, 
            gender: profile?.gender || prev.gender,
            name: profile?.name || profile?.displayName || prev.name,
            photos: profile?.photos || prev.photos,
            age: profile?.age || prev.age,
            bio: profile?.bio || prev.bio,
            hobbies: profile?.hobbies || prev.hobbies,
            city: profile?.city || prev.city,
            occupation: profile?.occupation || prev.occupation,
          }))
          console.log(`👤 Loaded profile: ${profile?.name || profile?.displayName}, gender: ${profile?.gender}`)
          
          // ✅ NEW: Check for pending feedback BEFORE going to mode selection
          // ✅ v2.8.22 FIX: ONLY show feedback if user was in Enjoy Mode!
          try {
            const { checkPendingFeedback, clearPendingFeedback } = await import('@/lib/firestore-service')
            const pending = await checkPendingFeedback(user.uid)
            
            // ✅ v2.8.22: Check if user was actually in Enjoy Mode
            const wasInEnjoyMode = localStorage.getItem('i4iguana_enjoy_mode') === 'true'
            
            // ✅ v2.8.20 FIX: Verify ALL required fields exist before showing feedback screen!
            if (pending && pending.hasPendingFeedback && pending.matchId && pending.partnerId && pending.partnerName) {
              
              // ✅ v2.8.22: Only show feedback if was in Enjoy Mode!
              if (wasInEnjoyMode) {
                console.log('📋 Pending feedback found AND was in Enjoy Mode - going to feedback screen')
                setPendingFeedback({
                  matchId: pending.matchId,
                  partnerId: pending.partnerId,
                  partnerName: pending.partnerName,
                  partnerPhoto: pending.partnerPhoto
                })
                localStorage.removeItem('i4iguana_enjoy_mode')  // Clear flag
                setCurrentScreen("meeting-feedback")
                return
              } else {
                // ✅ v2.8.22: Not from Enjoy Mode - clear the stale pending feedback!
                console.log('⚠️ Pending feedback found but NOT from Enjoy Mode - clearing it')
                try {
                  await clearPendingFeedback(user.uid)
                  console.log('✅ Cleared stale pending feedback')
                } catch (clearErr) {
                  console.warn('⚠️ Could not clear stale pending feedback:', clearErr)
                }
              }
            } else if (pending && pending.hasPendingFeedback) {
              // ✅ v2.8.20: Has pending flag but missing required fields - clear it!
              console.warn('⚠️ Pending feedback found but missing required fields - clearing it')
              console.warn('   matchId:', pending.matchId)
              console.warn('   partnerId:', pending.partnerId)
              console.warn('   partnerName:', pending.partnerName)
              // Clear the invalid pending feedback
              try {
                await clearPendingFeedback(user.uid)
                console.log('✅ Cleared invalid pending feedback')
              } catch (clearErr) {
                console.warn('⚠️ Could not clear invalid pending feedback:', clearErr)
              }
            }
          } catch (feedbackErr) {
            console.warn('⚠️ Error checking pending feedback:', feedbackErr)
            // Continue to mode selection
          }
          
          // ✅ v2.8.4 CRITICAL: Always set isAvailable: true on login!
          // This ensures user is NOT hidden after reconnecting
          try {
            const { doc: fbDoc, updateDoc: fbUpdateDoc } = await import('firebase/firestore')
            const { db: fbDb } = await import('@/lib/firebase')
            await fbUpdateDoc(fbDoc(fbDb, 'users', user.uid), {
              isAvailable: true
            })
            console.log('✅ isAvailable set to TRUE on login')
          } catch (availableErr) {
            console.warn('⚠️ Error setting isAvailable:', availableErr)
          }
          
          // ✅ v2.8.5: Go to World Selection screen - user chooses Zones or Venues
          console.log('🌍 Going to World Selection screen...')
          setCurrentScreen("world-selection")
        } else {
          console.log('🆕 New user → WELCOME ONBOARDING')
          setCurrentScreen("onboarding-welcome")
        }
      } catch (error: any) {
        console.error('⚠️ Error checking profile:', error.message)
        // ✅ FIXED: Check cache before forcing phone verification
        const cachedPhoneVerified = localStorage.getItem('i4iguana_phone_verified')
        if (cachedPhoneVerified === 'true') {
          console.log('⚠️ Error but phone was verified (cached) → WORLD SELECTION')
          setCurrentScreen("world-selection")
        } else {
          console.log('⚠️ Timeout/Error and no cache → PHONE VERIFICATION')
          setCurrentScreen("phone-verification")
        }
      }
    }

    checkAuth()
  }, [user, authLoading, currentScreen, splashComplete])

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ v2.8.5: AUTO-UPDATE - Refresh app when new version is deployed
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Check version on mount
    const storedVersion = localStorage.getItem('i4iguana_app_version')
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log(`🔄 New version detected! ${storedVersion} → ${APP_VERSION}`)
      console.log('🔄 Auto-refreshing to load new version...')
      localStorage.setItem('i4iguana_app_version', APP_VERSION)
      window.location.reload()
      return
    }
    
    // Store current version
    localStorage.setItem('i4iguana_app_version', APP_VERSION)
    console.log(`🦎 I4IGUANA v${APP_VERSION}`)
    
    // Listen for visibility changes (app coming to foreground)
    // ✅ v2.8.22: DISABLED version check on foreground - causes unwanted refreshes
    // const handleVisibilityChange = () => {
    //   if (document.visibilityState === 'visible') {
    //     // Check if version changed while app was in background
    //     const currentStoredVersion = localStorage.getItem('i4iguana_app_version')
    //     if (currentStoredVersion !== APP_VERSION) {
    //       console.log('🔄 Version mismatch on foreground - refreshing...')
    //       localStorage.setItem('i4iguana_app_version', APP_VERSION)
    //       window.location.reload()
    //     }
    //   }
    // }
    // document.addEventListener('visibilitychange', handleVisibilityChange)
    // return () => {
    //   document.removeEventListener('visibilitychange', handleVisibilityChange)
    // }
  }, [])

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
          
          // ✅ v2.8.17: REMOVED automatic venue selection here!
          // This was causing the bug - venue selection popping up when returning to home
          // Now venue selection is ONLY shown when user explicitly enters Venue Mode
          // from the World Selection screen via handleSelectVenueMode
          console.log('🏠 User not checked in - NOT auto-showing venue selection')
          console.log('   (Venue selection will show when user enters Venue Mode)')
        }
      } catch (error) {
        console.error('❌ Error loading check-in status:', error)
      }
    }
    
    loadCheckInStatus()
  }, [user, currentScreen])  // ✅ Added currentScreen dependency to detect when user returns to home

  // ✅ NEW: Real-time listener for venue check-in status
  // This detects when user is disconnected from venue (admin reset, network issues, etc.)
  useEffect(() => {
    if (!user) return
    
    console.log('👁️ Setting up real-time venue check-in listener')
    
    const userRef = doc(db, 'users', user.uid)
    
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (!docSnapshot.exists()) return
      
      const data = docSnapshot.data()
      const serverCheckedInVenue = data.checkedInVenue || data.currentVenueId || null
      const serverCheckInData = data.checkInData || null
      
      // ✅ v2.8.18 FIX: Skip processing if we just checked in (race condition protection!)
      if (justCheckedInRef.current) {
        console.log('👁️ REAL-TIME: Skipping - justCheckedInRef is true (recent check-in)')
        return
      }
      
      // ✅ v2.8.18 FIX: Skip if venue selection is blocked
      if (Date.now() < venueSelectionBlockedUntilRef.current) {
        console.log('👁️ REAL-TIME: Skipping - venue selection blocked by timer')
        return
      }
      
      // ✅ CRITICAL: Detect when user was checked in but now isn't
      // ✅ v2.8.6: Don't show message if we're intentionally switching to zone mode
      if (isCheckedIn && checkInData && !serverCheckedInVenue && !switchingToZoneModeRef.current) {
        console.log('⚠️ REAL-TIME: User disconnected from venue!')
        console.log(`   Was at: ${checkInData.venueName || checkInData.venueDisplayName}`)
        
        // Update local state
        setCheckInData(null)
        setIsCheckedIn(false)
        
        // Show disconnect notification
        setShowVenueDisconnected(true)
        
        // Auto-hide after 4 seconds and show venue selection
        setTimeout(() => {
          setShowVenueDisconnected(false)
          
          // ✅ v2.8.18 FIX: Double-check before showing venue selection!
          if (justCheckedInRef.current || Date.now() < venueSelectionBlockedUntilRef.current) {
            console.log('👁️ REAL-TIME: NOT showing venue selection - blocked by recent check-in')
            return
          }
          
          // ✅ v2.8.6 FIX: Show venue selection if on home screen AND NOT in Zone Mode
          if (currentScreen === "home" && appMode !== 'zone') {
            setShowVenueSelection(true)
          }
        }, 4000)
      } else if (isCheckedIn && checkInData && !serverCheckedInVenue && switchingToZoneModeRef.current) {
        console.log('✅ Intentional checkout for zone switch - not showing disconnect message')
        // Just update state without showing notification
        setCheckInData(null)
        setIsCheckedIn(false)
        // Reset the flag after a short delay
        setTimeout(() => {
          switchingToZoneModeRef.current = false
        }, 2000)
      }
      
      // ✅ Also detect when user is checked in from another device/session
      if (!isCheckedIn && serverCheckedInVenue && serverCheckInData) {
        console.log('✅ REAL-TIME: User checked in from elsewhere')
        setCheckInData(serverCheckInData)
        setIsCheckedIn(true)
      }
    }, (error) => {
      console.error('❌ Error in venue check-in listener:', error)
    })
    
    return () => {
      console.log('👋 Cleaning up venue check-in listener')
      unsubscribe()
    }
  }, [user, isCheckedIn, checkInData, currentScreen])

  // ✅ NEW: Check notification permission and show modal if needed
  // ✅ v2.8.16: Daily re-check - every 24 hours
  useEffect(() => {
    const checkNotificationPermission = async () => {
      // Only check when user is logged in and on home OR match screen
      if (!user || (currentScreen !== "home" && currentScreen !== "match")) return
      
      // ✅ v2.8.16: DAILY RE-CHECK - every 24 hours
      const lastCheckKey = `notification_last_check_${user.uid}`
      const lastCheck = localStorage.getItem(lastCheckKey)
      const now = Date.now()
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
      
      const shouldForceDaily = lastCheck && (now - parseInt(lastCheck)) > TWENTY_FOUR_HOURS
      if (shouldForceDaily) {
        console.log('🔔 DAILY CHECK: 24 hours passed, re-checking notifications...')
      }
      
      // ✅ CRITICAL: Check force flag FIRST - before any delays!
      const forceNotificationSetup = localStorage.getItem('force_notification_setup')
      if (forceNotificationSetup === 'true') {
        console.log('🔔 FORCE: Showing notification modal after account re-registration')
        localStorage.removeItem('force_notification_setup')
        
        // Wait a bit for the home screen to fully render, then show modal
        setTimeout(() => {
          console.log('🔔 FORCE: Opening notification modal NOW')
          setShowNotificationModal(true)
        }, 1500)
        return
      }
      
      // Check if browser supports notifications
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('⚠️ Browser does not support notifications')
        return
      }
      
      const permission = Notification.permission
      console.log('🔔 Current notification permission:', permission)
      
      // ✅ CRITICAL: Check if OneSignal is actually subscribed
      // Even if browser permission is granted, OneSignal might not be set up
      let isOneSignalSubscribed = false
      let oneSignalPlayerId = null
      let oneSignalExternalId = null
      
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const OneSignal = (window as any).OneSignal
        if (OneSignal && OneSignal.User && OneSignal.User.PushSubscription) {
          isOneSignalSubscribed = await OneSignal.User.PushSubscription.optedIn
          oneSignalPlayerId = await OneSignal.User.PushSubscription.id
          oneSignalExternalId = await OneSignal.User.externalId
          console.log('🔔 OneSignal subscription status:', isOneSignalSubscribed)
          console.log('🔔 OneSignal Player ID:', oneSignalPlayerId || 'MISSING')
          console.log('🔔 OneSignal External ID:', oneSignalExternalId || 'MISSING')
        }
      } catch (e) {
        console.log('⚠️ Error checking OneSignal status:', e)
      }
      
      // ✅ FIX: Use user-specific key AND check OneSignal subscription
      const modalShownKey = `notificationModalShown_${user.uid}`
      const oneSignalLinkedKey = `oneSignalLinked_${user.uid}`
      const modalShown = localStorage.getItem(modalShownKey)
      const oneSignalLinked = localStorage.getItem(oneSignalLinkedKey)
      
      // ✅ v2.8.16: If daily check triggered and something is wrong, show modal
      if (shouldForceDaily && (!isOneSignalSubscribed || !oneSignalPlayerId || !oneSignalExternalId)) {
        console.log('🔔 DAILY CHECK: OneSignal not fully configured, showing modal')
        localStorage.setItem(lastCheckKey, now.toString())
        setTimeout(() => {
          setShowNotificationModal(true)
        }, 1500)
        return
      }
      
      // If permission granted and OneSignal is subscribed, just link user
      if (permission === 'granted' && isOneSignalSubscribed) {
        console.log('✅ Notifications fully set up')
        localStorage.setItem(modalShownKey, 'true')
        localStorage.setItem(oneSignalLinkedKey, 'true')
        localStorage.setItem(lastCheckKey, now.toString())
        
        // Link user to OneSignal
        try {
          const OneSignal = (window as any).OneSignal
          if (OneSignal) {
            await OneSignal.login(user.uid)
            console.log('✅ OneSignal login successful:', user.uid)
          }
        } catch (e) {
          console.log('⚠️ OneSignal login error:', e)
        }
        return
      }
      
      // If permission granted BUT OneSignal not subscribed - try to subscribe silently
      if (permission === 'granted' && !isOneSignalSubscribed) {
        console.log('═══════════════════════════════════════════════════')
        console.log('🔔 SILENT SUBSCRIBE: Browser permission granted but OneSignal not subscribed')
        console.log('═══════════════════════════════════════════════════')
        
        try {
          const OneSignal = (window as any).OneSignal
          
          if (!OneSignal) {
            console.error('❌ OneSignal SDK not loaded!')
            throw new Error('OneSignal not available')
          }
          
          console.log('🔔 Step 1: Checking OneSignal API availability...')
          
          // ✅ NEW: First try requestPermission - this can help re-establish the subscription
          if (OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
            console.log('🔔 Step 1a: Calling OneSignal.Notifications.requestPermission()...')
            try {
              await OneSignal.Notifications.requestPermission()
              console.log('✅ OneSignal requestPermission completed')
            } catch (reqErr) {
              console.log('⚠️ requestPermission error (continuing):', reqErr)
            }
          }
          
          console.log('🔔 Step 2: Checking OneSignal.User...')
          if (!OneSignal.User) {
            console.error('❌ OneSignal.User not available!')
            throw new Error('OneSignal.User not available')
          }
          
          console.log('🔔 Step 3: Checking OneSignal.User.PushSubscription...')
          if (!OneSignal.User.PushSubscription) {
            console.error('❌ OneSignal.User.PushSubscription not available!')
            throw new Error('OneSignal.User.PushSubscription not available')
          }
          
          console.log('🔔 Step 4: Calling optIn()...')
          await OneSignal.User.PushSubscription.optIn()
          console.log('✅ OneSignal optIn successful!')
          
          // Wait a moment for subscription to register
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check if it worked
          const newStatus = await OneSignal.User.PushSubscription.optedIn
          console.log('🔔 Step 5: New subscription status:', newStatus)
          
          // ✅ Always try to login, even if status shows false
          console.log('🔔 Step 6: Calling login()...')
          await OneSignal.login(user.uid)
          console.log('✅ OneSignal login successful:', user.uid)
          
          localStorage.setItem(oneSignalLinkedKey, 'true')
          localStorage.setItem('i4iguana_notifications_enabled', 'true')
          
          console.log('═══════════════════════════════════════════════════')
          console.log('✅ SILENT SUBSCRIBE: COMPLETED!')
          console.log('═══════════════════════════════════════════════════')
          
        } catch (e: any) {
          console.error('❌ Silent subscribe failed:', e.message || e)
          console.log('📢 Showing notification modal as fallback...')
          
          // Show modal as fallback if silent subscription fails
          if (modalShown !== 'true') {
            localStorage.setItem(modalShownKey, 'true')
            setShowNotificationModal(true)
          }
        }
        return
      }
      
      // If permission denied, don't bother
      if (permission === 'denied') {
        console.log('🔔 Notifications denied by user')
        localStorage.setItem(modalShownKey, 'true')
        return
      }
      
      // Permission is 'default' - show the modal ONCE
      if (modalShown !== 'true') {
        setTimeout(() => {
          console.log('📢 Showing notification permission modal')
          localStorage.setItem(modalShownKey, 'true')
          setShowNotificationModal(true)
        }, 3000)
      }
    }
    
    checkNotificationPermission()
  }, [user, currentScreen])

  // ✅ CRITICAL: Ensure OneSignal is linked to user on every login
  // This MUST happen regardless of subscription status!
  // ✅ v2.8.3: Added daily refresh mechanism to ensure notifications work consistently
  useEffect(() => {
    const linkOneSignalUser = async () => {
      if (!user?.uid) return
      
      try {
        const OneSignal = (window as any).OneSignal
        if (!OneSignal) {
          console.log('⏳ OneSignal not loaded yet')
          return
        }
        
        // Wait for OneSignal to be ready
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // ✅ v2.8.3: Check if we need to refresh (once per day)
        const lastRefreshKey = `onesignal_last_refresh_${user.uid}`
        const lastRefresh = localStorage.getItem(lastRefreshKey)
        const now = Date.now()
        const oneDayMs = 24 * 60 * 60 * 1000  // 24 hours
        const needsRefresh = !lastRefresh || (now - parseInt(lastRefresh)) > oneDayMs
        
        if (needsRefresh) {
          console.log('🔄 OneSignal daily refresh triggered!')
          
          // ✅ Step 1: Try to opt in if not subscribed
          if (OneSignal.User?.PushSubscription) {
            const isSubscribed = await OneSignal.User.PushSubscription.optedIn
            console.log(`🔔 Current subscription status: ${isSubscribed}`)
            
            if (!isSubscribed && Notification.permission === 'granted') {
              console.log('🔔 Browser permission granted but not subscribed - opting in...')
              try {
                await OneSignal.User.PushSubscription.optIn()
                console.log('✅ OneSignal optIn successful!')
              } catch (optInErr) {
                console.log('⚠️ optIn error:', optInErr)
              }
            }
          }
        }
        
        // ✅ CRITICAL FIX: Always call login() to link external_user_id
        // This must happen BEFORE subscription, so notifications work when user subscribes later
        console.log(`🔔 Linking OneSignal to user: ${user.uid}`)
        await OneSignal.login(user.uid)
        console.log(`✅ OneSignal.login() SUCCESS for user: ${user.uid}`)
        
        // ✅ v2.8.3: Update last refresh timestamp
        if (needsRefresh) {
          localStorage.setItem(lastRefreshKey, now.toString())
          console.log('✅ OneSignal daily refresh completed!')
        }
        
        // Also check subscription status for logging
        if (OneSignal.User?.PushSubscription) {
          const isSubscribed = await OneSignal.User.PushSubscription.optedIn
          console.log(`🔔 Final OneSignal subscription status: ${isSubscribed}`)
        }
      } catch (e) {
        console.log('⚠️ OneSignal link error:', e)
      }
    }
    
    linkOneSignalUser()
  }, [user?.uid])

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
          
          // ✅ CRITICAL FIX: Don't navigate to match if status is 'successful' or 'meeting'
          // This means "We're Meeting" was already clicked and match is done
          if (matchData.status === 'successful' || matchData.status === 'meeting') {
            console.log('⏭️ Match already successful/meeting - skipping navigation to match screen')
            return
          }
          
          // ✅ v2.8.22 FIX: Don't navigate to match if we're in enjoy-mode!
          if (isInEnjoyModeSessionRef.current) {
            console.log('⏭️ Already in Enjoy Mode session - skipping navigation to match screen')
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
                
                // ✅ v2.8.26: Also set currentMatchId for User B!
                setCurrentMatchId(change.doc.id)
                setMatchCreatedAt(new Date())  // Track when match was shown
                
                // Navigate to match screen
                setCurrentScreen('match')
                
                console.log('🎯 User B: Match screen loaded via real-time sync!')
                console.log(`   matchId: ${change.doc.id}`)
                console.log(`   otherUser: ${otherUserProfile.name}`)
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
    
    // ✅ Skip if on splash/welcome/login/language-selection (already in auth flow)
    const authFlowScreens = ["splash", "language-selection", "welcome", "login"]
    if (authFlowScreens.includes(currentScreen)) return
    
    // If user logged out (user=null) while in app → go back to welcome
    if (!user) {
      console.log('🚪 User logged out → WELCOME')
      setCurrentScreen("welcome")
    }
  }, [user, authLoading, currentScreen])

  // ✅ NEW: Auto-request location when entering mode-selection (Action Tonight) screen
  useEffect(() => {
    const requestLocationForActionTonight = async () => {
      if (currentScreen !== 'mode-selection') return
      if (userLocationForVenues) return // Already have location
      
      console.log('📍 Action Tonight: Requesting user location...')
      try {
        const location = await getCurrentLocation()
        if (location) {
          const coords = { lat: location.latitude, lng: location.longitude }
          setUserLocationForVenues(coords)
          console.log('✅ Location obtained for Action Tonight:', coords)
        }
      } catch (error) {
        console.log('⚠️ Could not get location for Action Tonight:', error)
        // Screen will show "Enable Location" button
      }
    }
    
    requestLocationForActionTonight()
  }, [currentScreen, userLocationForVenues])

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
          console.log(`   Status: ${activeMatch.status}`)
          
          // ✅ CRITICAL: Reset bidirectional chat BEFORE setting matchCreatedAt
          // This prevents the button from lighting up due to old messages
          setHasBidirectionalChat(false)
          
          setMatchedUser(activeMatch.matchedUser)
          setMatchExpiresAt(activeMatch.expiresAt)
          setMatchCreatedAt(activeMatch.createdAt || null)  // ✅ NEW: For Chat First logic
          setIsLockedInMatch(true)
          setIsNewMatch(false)  // Not a new match - don't play sound
          
          // ✅ v2.8.5 FIX: Set currentMatchId from activeMatch!
          const loadedMatchId = activeMatch.matchId || createMatchId(user.uid, activeMatch.matchedUser.uid)
          setCurrentMatchId(loadedMatchId)
          console.log(`🎯 Set currentMatchId from activeMatch: ${loadedMatchId}`)
          
          // ✅ CRITICAL: Check if user is locked on this match!
          const userIsLocked = activeMatch.lockedForUsers?.includes(user.uid) || false
          if (userIsLocked) {
            console.log('🔒 User is LOCKED on this match - will show paywall!')
            setIsMatchLocked(true)
            setTimeout(() => {
              setShowPremiumPaywall(true)
            }, 500)
          } else {
            setIsMatchLocked(false)
          }
          
          // ✅ FIX: Also set selectedMatch for chat to work after re-login!
          setSelectedMatch(activeMatch.matchedUser)
          
          // ✅ NEW: Check if in MEETING status → Restore to Enjoy Mode!
          if (activeMatch.status === 'meeting' && activeMatch.meetingStartedAt) {
            console.log('🎉 MEETING IN PROGRESS! Restoring to Enjoy Mode')
            console.log(`   Meeting started: ${activeMatch.meetingStartedAt.toLocaleString()}`)
            
            // Calculate remaining time
            const now = new Date()
            const meetingEndTime = new Date(activeMatch.meetingStartedAt.getTime() + 20 * 60 * 1000) // 20 minutes
            
            if (now < meetingEndTime) {
              // Meeting still active - restore Enjoy Mode
              setMeetingStartedAt(activeMatch.meetingStartedAt)
              setIsInEnjoyModeSession(true)  // ✅ FIXED: Track enjoy mode session!
              setCurrentScreen("enjoy-mode")
              console.log('✅ Restored to Enjoy Mode from home screen check!')
              return  // Exit early - don't load nearby users
            } else {
              // ✅ v2.8.26 FIX: Meeting timer expired - SHOW FEEDBACK SCREEN!
              console.log('⏰ Meeting timer expired - GOING TO FEEDBACK SCREEN!')
              
              // Set pending feedback data
              const partnerInfo = {
                matchId: activeMatch.matchId || createMatchId(user.uid, activeMatch.matchedUser.uid || activeMatch.matchedUser.id),
                partnerId: activeMatch.matchedUser.uid || activeMatch.matchedUser.id,
                partnerName: activeMatch.matchedUser.name || activeMatch.matchedUser.displayName || 'Your match',
                partnerPhoto: activeMatch.matchedUser.photos?.[0] || activeMatch.matchedUser.photoURL
              }
              
              setPendingFeedback(partnerInfo)
              localStorage.removeItem('i4iguana_enjoy_mode')  // Clear flag
              setCurrentScreen("meeting-feedback")
              console.log('✅ Showing feedback screen after expired meeting!')
              return  // Go to feedback!
            }
          }
          
          // ✅ v2.8.16 FIX: "She Decides" - Navigate based on gender when restoring!
          // All users go to MATCH screen - gender-specific UI is handled there
          // Men see "Waiting for her to decide..." message
          // Women see the "We're Meeting!" button
          const currentUserGender = onboardingData.gender || 'male'
          const matchedUserGender = activeMatch.matchedUser.gender || 'female'
          const isSameSexCouple = currentUserGender === matchedUserGender
          
          console.log(`🎯 "She Decides" RESTORE: User is ${currentUserGender}, match is ${matchedUserGender}`)
          console.log(`👩 Going to MATCH screen - gender UI handled there`)
          
          setCurrentScreen("match")
          
          console.log('🎯 Navigating to MATCH screen with restored state')
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
        // ✅ FIX: Ensure matchesCountToday is a valid number
        const matchCount = Number(passData.matchesCountToday) || 0
        setFreeMatchesUsedToday(matchCount)
        console.log(`📊 Matches used today: ${matchCount}`)
        
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

        // ✅ v2.8.18 FIX: Load nearby users ONLY if:
        // 1. Not phone locked
        // 2. NOT in Zone Mode (Zone Mode loads users via handleEnterZone!)
        if (!lockStatus.isLocked && appMode !== 'zone') {
          console.log('📍 Loading nearby users (Venue Mode)...')
          await loadNearbyUsers()
        } else if (appMode === 'zone') {
          console.log('🗺️ Zone Mode - skipping loadNearbyUsers (users loaded via handleEnterZone)')
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
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
        setIsLockedInMatch(false)
        
        // ✅ CRITICAL FIX: Don't clear match or show MatchEnded if meeting is in progress!
        // This happens when she clicked "We're Meeting!" and timer expired while modal was showing
        if (meetingStartedAt) {
          console.log('💕 Meeting already started - skipping MatchEnded screen')
          return
        }
        
        // Clear active match in Firestore
        if (matchedUser && user) {
          // ✅ CRITICAL: Check Firestore status BEFORE clearing!
          // Don't clear if status is 'meeting' - she clicked "We're Meeting!"
          getMatchStatus(user.uid, matchedUser.uid).then(status => {
            if (status === 'meeting' || status === 'successful') {
              console.log('💕 Match is meeting/successful - NOT clearing active match')
              return
            }
            clearActiveMatch(user.uid, matchedUser.uid).catch(err => 
              console.error('Error clearing expired match:', err)
            )
          }).catch(err => {
            console.error('Error checking match status:', err)
          })
          
          // ✅ Clear match sound flag so next match will play sound
          const storageKey = `match_sound_played_${matchedUser.uid}`
          sessionStorage.removeItem(storageKey)
          console.log('🔊 Cleared match sound flag for next match')
        }
        
        // ✅ Show Match Ended Screen (5 seconds) then return to home
        // ✅ CRITICAL FIX: Also check meetingStartedAt in case it was just set!
        if ((currentScreen === "match" || currentScreen === "chat") && !meetingStartedAt) {
          setShowMatchEnded(true)
        }
      }
    }
    
    // Update immediately
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [matchExpiresAt, currentScreen, matchedUser, user, meetingStartedAt])

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
    if (meetingStartedAt) return  // ✅ NEW: Already in meeting mode, don't check
    
    const checkMatchStillActive = async () => {
      try {
        // ✅ First check status - if 'successful' or 'meeting', don't show MatchEndedScreen!
        const status = await getMatchStatus(user.uid, matchedUser.uid || matchedUser.id)
        
        if (status === 'successful' || status === 'meeting') {
          // Partner clicked "We're Meeting!" - DON'T show MatchEndedScreen!
          console.log('💕 Match is meeting/successful - partner clicked We\'re Meeting!')
          
          // ✅ v2.8.22 FIX: Actually navigate to Enjoy Mode!
          // Get meeting info from the match document
          try {
            const { doc: fbDoc, getDoc } = await import('firebase/firestore')
            const { db } = await import('@/lib/firebase')
            
            const matchId = currentMatchId || createMatchId(user.uid, matchedUser.uid || matchedUser.id)
            const matchDocRef = fbDoc(db, 'activeMatches', matchId)
            const matchSnap = await getDoc(matchDocRef)
            
            if (matchSnap.exists()) {
              const matchData = matchSnap.data()
              
              // Check if WE haven't confirmed yet (partner confirmed)
              if (matchData.meetingConfirmedBy && matchData.meetingConfirmedBy !== user.uid) {
                console.log('🎉 Partner confirmed meeting! Showing modal...')
                
                // Set partner info
                setMeetingPartnerInfo({
                  uid: matchedUser.uid || matchedUser.id || '',
                  name: matchedUser.name || matchedUser.displayName || 'Your match',
                  photo: matchedUser.photos?.[0] || matchedUser.photoURL || ''
                })
                
                // Show the modal!
                weAreMeetingOpenedAtRef.current = Date.now()  // ✅ v2.8.26: Track open time
                setShowWeAreMeeting(true)
                setIsPartnerReadyToMeet(true)
                
                // Play celebration sound
                try {
                  const audio = new Audio('/sounds/meeting-celebration.wav')
                  audio.volume = 0.8
                  audio.play().catch(() => {})
                } catch (err) {}
              }
              
              // ✅ If meeting already started, go directly to Enjoy Mode
              if (matchData.meetingStartedAt) {
                const meetingTime = matchData.meetingStartedAt.toDate ? matchData.meetingStartedAt.toDate() : new Date(matchData.meetingStartedAt)
                const now = new Date()
                const meetingEndTime = new Date(meetingTime.getTime() + 20 * 60 * 1000) // 20 min
                
                if (now < meetingEndTime) {
                  console.log('🎉 Meeting in progress - going to Enjoy Mode!')
                  setMeetingStartedAt(meetingTime)
                  setIsInEnjoyModeSession(true)
                  setCurrentScreen("enjoy-mode")
                }
              }
            }
          } catch (err) {
            console.error('Error getting match data:', err)
          }
          
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
  }, [user, matchedUser, currentScreen, matchExpiresAt, meetingStartedAt])

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Mode Selection handlers
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * ✅ v2.8.17: HERMETIC - Safe venue selection that checks Firestore first!
   * This prevents showing venue selection when user is already checked in
   */
  const safeShowVenueSelection = async (source: string) => {
    console.log(`🔍 safeShowVenueSelection called from: ${source}`)
    
    // Check 1: Is venue selection blocked?
    if (Date.now() < venueSelectionBlockedUntilRef.current) {
      console.log('❌ Venue selection blocked by timer')
      return false
    }
    
    // Check 2: Did we just check in?
    if (justCheckedInRef.current) {
      console.log('❌ Venue selection blocked - just checked in')
      return false
    }
    
    // Check 3: Are we in zone mode?
    if (appMode === 'zone') {
      console.log('❌ Venue selection blocked - in Zone Mode')
      return false
    }
    
    // Check 4: Is venue selection already showing?
    if (showVenueSelection) {
      console.log('❌ Venue selection already showing')
      return false
    }
    
    // Check 5: CRITICAL - Check Firestore directly!
    if (user) {
      try {
        const status = await getUserCheckInStatus(user.uid)
        if (status.isCheckedIn && status.checkInData) {
          console.log('❌ Venue selection blocked - user IS checked in:', status.checkInData.venueDisplayName)
          // Update local state to match Firestore
          setCheckInData(status.checkInData)
          setIsCheckedIn(true)
          return false
        }
      } catch (error) {
        console.error('⚠️ Error checking Firestore:', error)
      }
    }
    
    // All checks passed - show venue selection
    console.log('✅ Showing venue selection')
    setShowVenueSelection(true)
    return true
  }
  
  /**
   * Handle selecting Venue Mode (existing system)
   * ✅ v2.8.17: HERMETIC FIX - Check Firestore directly, not state!
   */
  const handleSelectVenueMode = async () => {
    console.log('📍 User selected VENUE MODE')
    setAppMode('venue')
    
    // ✅ Set user as Available when selecting a mode
    if (user) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'users', user.uid), { isAvailable: true })
        console.log('✅ User set to Available')
      } catch (e) {
        console.error('⚠️ Could not set available:', e)
      }
    }
    
    // ✅ v2.8.17 HERMETIC FIX: Check Firestore DIRECTLY - don't trust state!
    // State might be stale when returning from world-selection
    if (user) {
      try {
        console.log('🔍 Checking Firestore for check-in status...')
        const status = await getUserCheckInStatus(user.uid)
        
        if (status.isCheckedIn && status.checkInData) {
          console.log('✅ Firestore confirms user is checked in:', status.checkInData.venueDisplayName)
          // Update state to match Firestore
          setCheckInData(status.checkInData)
          setIsCheckedIn(true)
          setCurrentScreen('home')
          // Don't show venue selection!
          return
        } else {
          console.log('📋 Firestore confirms user NOT checked in - showing Venue Selection')
          setCheckInData(null)
          setIsCheckedIn(false)
          setCurrentScreen('home')
          setTimeout(() => setShowVenueSelection(true), 300)
          return
        }
      } catch (error) {
        console.error('❌ Error checking Firestore:', error)
      }
    }
    
    // Fallback to state check (shouldn't reach here normally)
    if (isCheckedIn && checkInData) {
      console.log('✅ State says checked in - going to Home')
      setCurrentScreen('home')
    } else {
      console.log('📋 State says not checked in - showing Venue Selection')
      setCurrentScreen('home')
      setTimeout(() => setShowVenueSelection(true), 300)
    }
  }
  
  /**
   * Handle selecting Zone Mode (new global system)
   */
  const handleSelectZoneMode = async () => {
    console.log('🗺️ User selected ZONE MODE')
    setAppMode('zone')
    
    // ✅ Set user as Available when selecting a mode
    if (user) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'users', user.uid), { isAvailable: true })
        console.log('✅ User set to Available')
      } catch (e) {
        console.error('⚠️ Could not set available:', e)
      }
    }
    
    // Get user location
    try {
      const location = await getCurrentLocation()
      const coords = { lat: location.latitude, lng: location.longitude }
      setUserLocationForVenues(coords)
      
      // Load entertainment zones
      const zone = await loadEntertainmentZones(coords.lat, coords.lng)
      
      if (zone) {
        // User is already in an entertainment zone
        console.log(`🎉 User is in zone: ${zone.name}`)
        setCurrentZone(zone)
        if (user) {
          await checkInToZone(user.uid, coords.lat, coords.lng, zone)
        }
        setCurrentScreen('zone-mode')
      } else {
        // User is not in a zone - show Discovery screen
        console.log('📍 User not in zone - showing Discovery')
        setCurrentScreen('discovery')
      }
    } catch (locError) {
      console.error('⚠️ Location error:', locError)
      setCurrentScreen('discovery')
    }
  }
  
  /**
   * Handle going back to world selection (main screen)
   */
  const handleBackToModeSelection = () => {
    console.log('🌍 Back to World Selection')
    setAppMode(null)
    setCurrentZone(null)
    setExploringZone(null)
    setCurrentScreen('world-selection')
  }

  /**
   * ✅ NEW: Handle joining a special event (Venue Mode with event)
   */
  const handleJoinEvent = async (event: { id: string; venueId: string; venueName: string; location: { lat: number; lng: number } }) => {
    console.log(`🎉 User joining event: ${event.id} at ${event.venueName}`)
    
    // Save event registration to user's profile
    if (user) {
      try {
        const { doc, updateDoc, arrayUnion, increment } = await import('firebase/firestore')
        
        // Add event to user's registered events
        await updateDoc(doc(db, 'users', user.uid), { 
          registeredEvents: arrayUnion(event.id),
          isAvailable: true
        })
        
        // Increment planned count for the event
        try {
          await updateDoc(doc(db, 'events', event.id), {
            plannedCount: increment(1)
          })
        } catch (e) {
          // Event doc might not exist yet
          console.log('Could not update event planned count:', e)
        }
        
        console.log('✅ User registered for event!')
        
      } catch (e) {
        console.error('⚠️ Could not register for event:', e)
      }
    }
    
    // Set app mode to venue
    setAppMode('venue')
    
    // Check if user is at the venue location (within 500m)
    if (userLocationForVenues) {
      const distance = calculateDistanceMeters(
        userLocationForVenues.lat, 
        userLocationForVenues.lng, 
        event.location.lat, 
        event.location.lng
      )
      
      if (distance <= 500) {
        // User is at the venue - check them in and start matching!
        console.log('📍 User is at event venue - starting Venue Mode!')
        
        // Perform check-in
        await handleVenueSelection({
          id: event.venueId,
          name: event.venueName,
          location: event.location
        })
        
        setCurrentScreen('home')
      } else {
        // User is not at venue - show confirmation and offer navigation
        console.log(`📍 User is ${Math.round(distance)}m from venue`)
        // For now, just show a toast or stay on screen
        // User will auto check-in when they arrive
      }
    }
  }
  
  /**
   * ✅ NEW: Handle searching for entertainment zones in a specific city
   */
  const handleSearchCity = async (cityName: string) => {
    console.log(`🔍 Searching for entertainment zones in: ${cityName}`)
    
    // Map city names to coordinates (we can expand this)
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'אשקלון': { lat: 31.6688, lng: 34.5743 },
      'ashkelon': { lat: 31.6688, lng: 34.5743 },
      'תל אביב': { lat: 32.0853, lng: 34.7818 },
      'tel aviv': { lat: 32.0853, lng: 34.7818 },
      'ירושלים': { lat: 31.7683, lng: 35.2137 },
      'jerusalem': { lat: 31.7683, lng: 35.2137 },
      'חיפה': { lat: 32.7940, lng: 34.9896 },
      'haifa': { lat: 32.7940, lng: 34.9896 },
      'באר שבע': { lat: 31.2530, lng: 34.7915 },
      'beer sheva': { lat: 31.2530, lng: 34.7915 },
    }
    
    const normalizedCity = cityName.toLowerCase().trim()
    const coords = cityCoordinates[normalizedCity] || cityCoordinates[cityName]
    
    if (coords) {
      console.log(`📍 Found coordinates for ${cityName}:`, coords)
      setUserLocationForVenues(coords)
      // The ActionTonightScreen will reload with new location
    } else {
      console.log(`⚠️ City not found: ${cityName}`)
      // Could use Google Places Autocomplete for more cities
    }
  }
  
  /**
   * ✅ Helper: Calculate distance in meters between two coordinates
   */
  const calculateDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Zone-based discovery system functions
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Load entertainment zones near user
   */
  const loadEntertainmentZones = async (lat: number, lng: number) => {
    try {
      console.log('🗺️ Loading entertainment zones...')
      
      // Search for venues within 5km (we show up to 2km)
      const venues = await searchNearbyVenues(lat, lng, 5000)
      console.log(`📍 Found ${venues.length} venues`)
      
      // Cluster into zones
      const zones = clusterVenuesIntoZones(venues, lat, lng)
      
      // Filter to 2km and at least 2 singles (hide quiet zones)
      const activeZones = zones.filter(z => z.distance <= 2000)
      
      setEntertainmentZones(activeZones)
      
      // Check if user is in a zone (within 500m)
      const zone = getCurrentZone(activeZones, lat, lng, 500)
      if (zone) {
        console.log(`🎉 User is in zone: ${zone.name}`)
        setCurrentZone(zone)
        return zone
      }
      
      return null
    } catch (error) {
      console.error('❌ Error loading zones:', error)
      return null
    }
  }
  
  /**
   * Handle entering a zone (user is physically there)
   */
  const handleEnterZone = async (zone: any) => {
    if (!user || !userLocationForVenues) return
    
    console.log(`📍 Entering zone: ${zone.name}`)
    console.log(`🦎 HOLLYWOOD: Direct to gallery!`)
    
    // ✅ v2.8.6: Set flag to prevent disconnect notification
    switchingToZoneModeRef.current = true
    
    setCurrentZone(zone)
    setAppMode('zone')
    
    // Check in to zone
    await checkInToZone(
      user.uid,
      userLocationForVenues.lat,
      userLocationForVenues.lng,
      zone
    )
    
    // ✅ v2.8.5: Create checkInData for badge display (same format as venue)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours
    
    const zoneCheckInData = {
      venueId: zone.id,
      venueName: zone.name,
      venueDisplayName: `📍 ${zone.name}`,  // Zone indicator
      checkedInAt: { toDate: () => now },
      expiresAt: { toDate: () => expiresAt, toMillis: () => expiresAt.getTime() },
      location: {
        latitude: zone.center.lat,
        longitude: zone.center.lng
      }
    }
    
    setCheckInData(zoneCheckInData as any)
    setIsCheckedIn(true)
    setShowCheckInBadge(true)
    
    // ✅ v2.8.5: Load users in zone and go DIRECTLY to gallery!
    const userProfile = await getUserProfile(user.uid)
    if (!userProfile) {
      console.log('⚠️ No user profile, going to home anyway')
      setCurrentScreen('home')
      return
    }
    
    const genderPreference = userProfile.preferences?.lookingFor || 
      (userProfile.gender === 'male' ? 'female' : userProfile.gender === 'female' ? 'male' : 'both')
    
    // ✅ v2.8.6: Get age range preference
    const ageRange = userProfile.preferences?.ageRange as [number, number] | undefined
    
    // ✅ Step 1: Load REAL users in zone (always first!)
    const realUsers = await getUsersInZone(
      zone.id,
      user.uid,
      userLocationForVenues.lat,
      userLocationForVenues.lng,
      userProfile.gender || 'male',
      genderPreference
    )
    
    console.log(`👥 Found ${realUsers.length} REAL users in zone`)
    
    // ✅ v2.8.26: Get previous matches to put them LAST (but still show them!)
    // In zone mode, people hop between clubs - they CAN match again, but NEW profiles first!
    let previousMatchIds = new Set<string>()
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userMatches = userDoc.data().matches || []
        previousMatchIds = new Set(userMatches)
        console.log(`📜 Found ${previousMatchIds.size} previous matches`)
      }
    } catch (err) {
      console.warn('Could not fetch user matches:', err)
    }
    
    // ✅ v2.8.26: Sort real users - NEW profiles first, previous matches LAST
    const sortedRealUsers = [...realUsers].sort((a, b) => {
      const aMatched = previousMatchIds.has(a.oderId)
      const bMatched = previousMatchIds.has(b.oderId)
      
      // Non-matched first, matched last
      if (aMatched && !bMatched) return 1   // a goes after b
      if (!aMatched && bMatched) return -1  // a goes before b
      return 0  // Keep original order
    })
    
    console.log(`🔀 Sorted: ${sortedRealUsers.filter(u => !previousMatchIds.has(u.oderId)).length} new + ${sortedRealUsers.filter(u => previousMatchIds.has(u.oderId)).length} previously matched`)
    
    // ✅ Step 2: Load DUMMY users to fill the gallery
    const { getDummiesForUser } = await import('@/lib/dummy-users-service')
    const dummyUsers = await getDummiesForUser(
      user.uid,
      zone.id,  // Zone ID like 'florentin'
      userProfile.gender || 'male',
      genderPreference,
      50 - sortedRealUsers.length,  // Fill up to 50 total
      ageRange  // ✅ v2.8.6: Pass age range filter
    )
    
    console.log(`🤖 Added ${dummyUsers.length} DUMMY users`)
    
    // ✅ Step 3: Combine - REAL users first (sorted: new then matched), then dummies!
    const allUsers = [
      ...sortedRealUsers,
      ...dummyUsers.map(d => ({
        uid: d.oderId,
        ...d,
        photos: d.photos?.slice(0, 1) || [],  // ✅ v2.8.18: רק תמונה אחת לדמי
        isDummy: true  // Mark for special handling
      }))
    ]
    
    console.log(`📊 Total gallery: ${sortedRealUsers.length} real + ${dummyUsers.length} dummy = ${allUsers.length}`)
    
    // Set zone users and go DIRECTLY to home screen (gallery)!
    setZoneUsers(allUsers)
    setNearbyUsers(allUsers)
    setCurrentScreen('home')
    
    console.log(`✅ Connected to ${zone.name} - showing gallery!`)
  }
  
  /**
   * Handle exploring a zone (user wants to see it but is not there)
   */
  const handleExploreZone = (zone: any) => {
    console.log(`👀 Exploring zone: ${zone.name}`)
    setExploringZone(zone)
    setCurrentScreen('explore-zone')
  }
  
  /**
   * Handle navigating to a zone (opens Google Maps)
   */
  const handleNavigateToZone = (zone: any) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${zone.center.lat},${zone.center.lng}&travelmode=walking`
    window.open(url, '_blank')
  }
  
  /**
   * Handle starting to match in a zone
   */
  const handleStartMatchingInZone = async () => {
    if (!user || !currentZone || !userLocationForVenues) return
    
    console.log(`🦎 Starting matching in zone: ${currentZone.name}`)
    
    // Get user profile for preferences
    const userProfile = await getUserProfile(user.uid)
    if (!userProfile) return
    
    // ✅ FIX: Get gender preference from preferences object
    const genderPreference = userProfile.preferences?.lookingFor || 
      (userProfile.gender === 'male' ? 'female' : userProfile.gender === 'female' ? 'male' : 'both')
    
    // ✅ v2.8.6: Get age range preference
    const ageRange = userProfile.preferences?.ageRange as [number, number] | undefined
    
    // ✅ Step 1: Load REAL users in zone (always first!)
    const realUsers = await getUsersInZone(
      currentZone.id,
      user.uid,
      userLocationForVenues.lat,
      userLocationForVenues.lng,
      userProfile.gender || 'male',
      genderPreference
    )
    
    console.log(`👥 Found ${realUsers.length} REAL users in zone`)
    
    // ✅ v2.8.26: Sort - NEW profiles first, previous matches LAST
    let previousMatchIds2 = new Set<string>()
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userMatches = userDoc.data().matches || []
        previousMatchIds2 = new Set(userMatches)
        console.log(`📜 Found ${previousMatchIds2.size} previous matches`)
      }
    } catch (err) {
      console.warn('Could not fetch user matches:', err)
    }
    
    const sortedRealUsers2 = [...realUsers].sort((a, b) => {
      const aMatched = previousMatchIds2.has(a.oderId)
      const bMatched = previousMatchIds2.has(b.oderId)
      if (aMatched && !bMatched) return 1
      if (!aMatched && bMatched) return -1
      return 0
    })
    
    // ✅ Step 2: Load DUMMY users to fill the gallery
    const { getDummiesForUser } = await import('@/lib/dummy-users-service')
    const dummyUsers = await getDummiesForUser(
      user.uid,
      currentZone.id,
      userProfile.gender || 'male',
      genderPreference,
      50 - sortedRealUsers2.length,
      ageRange  // ✅ v2.8.6: Pass age range filter
    )
    
    console.log(`🤖 Added ${dummyUsers.length} DUMMY users`)
    
    // ✅ Step 3: Combine - REAL users first (sorted), then dummies!
    const allUsers = [
      ...sortedRealUsers2,
      ...dummyUsers.map(d => ({
        uid: d.oderId,
        ...d,
        photos: d.photos?.slice(0, 1) || [],  // ✅ v2.8.18: רק תמונה אחת לדמי
        isDummy: true
      }))
    ]
    
    console.log(`📊 Total: ${sortedRealUsers2.length} real + ${dummyUsers.length} dummy = ${allUsers.length}`)
    
    // Set zone users and go to home screen
    setZoneUsers(allUsers)
    setNearbyUsers(allUsers)
    setCurrentScreen('home')
  }
  
  /**
   * Handle going back to discovery from zone mode
   */
  const handleBackToDiscovery = () => {
    setCurrentZone(null)
    setExploringZone(null)
    setCurrentScreen('discovery')
  }
  
  /**
   * Request location for discovery
   */
  const handleRequestLocationForDiscovery = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log('📍 Requesting location for discovery...')
      const location = await getCurrentLocation()
      console.log(`✅ Got location: ${location.latitude}, ${location.longitude}`)
      const coords = { lat: location.latitude, lng: location.longitude }
      setUserLocationForVenues(coords)
      return coords
    } catch (error: any) {
      console.error('❌ Error getting location:', error?.message || error)
      // ✅ v2.8.6: Return null but don't throw - let the component handle the UI
      return null
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════

  const loadNearbyUsers = async () => {
    if (!user) return
    
    // ✅ v2.8.18 FIX: Don't overwrite Zone Mode users!
    if (appMode === 'zone') {
      console.log('🗺️ loadNearbyUsers: Skipping - Zone Mode users loaded separately')
      return
    }
    
    setLoading(true)
    try {
      // ✅ NEW: Clean up expired check-ins before searching
      try {
        const { autoCheckoutExpiredUsers } = await import('@/lib/checkin-service')
        const checkoutCount = await autoCheckoutExpiredUsers()
        if (checkoutCount > 0) {
          console.log(`🧹 Cleaned up ${checkoutCount} expired check-ins`)
        }
      } catch (cleanupError) {
        console.log('⚠️ Auto-checkout cleanup skipped:', cleanupError)
      }
      
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
          
          // Show notification and open venue selection
          setInAppNotification({
            isVisible: true,
            message: t('venueSelection.leftVenue', { venueName: proximityCheck.venueName || '' }),
            type: 'info'
          })
          
          // ✅ v2.8.18 FIX: Show venue selection ONLY in Venue Mode AND not recently checked in
          if (appMode === 'venue' && !justCheckedInRef.current && Date.now() >= venueSelectionBlockedUntilRef.current) {
            setTimeout(() => {
              // Double-check before showing
              if (!justCheckedInRef.current && Date.now() >= venueSelectionBlockedUntilRef.current) {
                setShowVenueSelection(true)
              }
            }, 2000)
          }
          
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
        console.log('   User must select a venue to see matches')
        users = []
        
        // ✅ v2.8.17: REMOVED automatic venue selection here!
        // Venue selection is ONLY shown via handleSelectVenueMode
        console.log('   (Venue selection handled by handleSelectVenueMode)')
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
    
    // ✅ v2.8.17: HERMETIC - Block venue selection for 30 seconds after check-in!
    justCheckedInRef.current = true
    venueSelectionBlockedUntilRef.current = Date.now() + 30000  // 30 seconds
    setTimeout(() => {
      justCheckedInRef.current = false
    }, 30000)  // Reset after 30 seconds
    
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
    setShowVenueSelection(false)
    
    // Reload users from this venue
    await loadNearbyUsers()
    
    console.log(`✅ Checked in at: ${newCheckInData.venueName}`)
  }

  // ✅ NEW: Handle check-out
  const handleCheckOut = async () => {
    if (!user) return
    
    try {
      console.log('🚪 Checking out...')
      
      // ✅ v2.8.5: Check out from zone or venue
      if (appMode === 'zone' && currentZone) {
        console.log(`📍 Checking out from zone: ${currentZone.name}`)
        const { checkOutFromZone } = await import('@/lib/zone-checkin-service')
        await checkOutFromZone(user.uid)
        setCurrentZone(null)
        setZoneUsers([])
      } else {
        console.log('🍸 Checking out from venue')
        await performCheckOut(user.uid)
      }
      
      setCheckInData(null)
      setIsCheckedIn(false)
      setAppMode(null)
      
      // Go back to world selection
      setCurrentScreen('world-selection')
      
      console.log('✅ Checked out successfully')
    } catch (error) {
      console.error('❌ Error checking out:', error)
    }
  }

  // ✅ NEW: Handle venue selection from VenueSelectionScreen
  const handleVenueSelection = async (venue: any) => {
    if (!user) {
      console.error('❌ No user logged in')
      throw new Error('לא מחובר')
    }
    
    console.log('🎯 Venue selected:', venue.displayName)
    
    // ✅ v2.8.27 CRITICAL FIX: If coming from Zone Mode, switch to Venue Mode!
    if (appMode === 'zone') {
      console.log('🔄 SWITCHING from Zone Mode to Venue Mode!')
      
      // Check out from zone first
      if (currentZone) {
        console.log(`📍 Checking out from zone: ${currentZone.name}`)
        try {
          const { checkOutFromZone } = await import('@/lib/zone-checkin-service')
          await checkOutFromZone(user.uid)
        } catch (e) {
          console.error('⚠️ Zone checkout error (continuing):', e)
        }
      }
      
      // Clear zone data
      setCurrentZone(null)
      setZoneUsers([])
      
      // Switch to Venue Mode
      setAppMode('venue')
      console.log('✅ Switched to Venue Mode')
    }
    
    // ✅ v2.8.18 FIX: IMMEDIATELY block venue selection to prevent race conditions!
    justCheckedInRef.current = true
    venueSelectionBlockedUntilRef.current = Date.now() + 30000  // Block for 30 seconds
    console.log('🛡️ Venue selection blocked for 30 seconds (race condition protection)')
    
    // Get current location
    let location = userLocationForVenues
    if (!location) {
      console.log('📍 Requesting location for venue check-in...')
      location = await requestLocationForVenues()
      if (!location) {
        // Reset protection if failed
        justCheckedInRef.current = false
        throw new Error('נדרשת גישה למיקום כדי להיכנס למועדון')
      }
    }
    
    try {
      // Perform check-in using the new function
      const checkInResult = await performCheckInBySelection(
        user.uid,
        venue.id,
        location.lat,
        location.lng
      )
      
      console.log('✅ Check-in successful:', checkInResult)
      
      // Update state
      setCheckInData(checkInResult)
      setIsCheckedIn(true)
      setShowCheckInBadge(true)
      setShowVenueSelection(false)
      
      // Reload users from this venue
      await loadNearbyUsers()
      
      // Show success notification
      setInAppNotification({
        isVisible: true,
        message: t('venueSelection.checkedIn', { venueName: venue.displayName }),
        type: 'info'
      })
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setInAppNotification(prev => ({ ...prev, isVisible: false }))
      }, 3000)
      
      // ✅ v2.8.18: Reset justCheckedInRef after 30 seconds
      setTimeout(() => {
        justCheckedInRef.current = false
        console.log('🛡️ Venue selection protection released')
      }, 30000)
      
    } catch (error: any) {
      console.error('❌ Check-in error:', error)
      throw error
    }
  }

  // ✅ NEW: Request location for venue selection
  const requestLocationForVenues = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log('📍 Requesting location for venues...')
      const location = await getCurrentLocation()
      
      if (location) {
        setUserLocationForVenues({ lat: location.latitude, lng: location.longitude })
        return { lat: location.latitude, lng: location.longitude }
      }
      
      return null
    } catch (error) {
      console.error('❌ Error getting location:', error)
      return null
    }
  }

  // ✅ NEW: Handle PASS on search screen - save to swipedLeft in Firestore
  // This ensures users don't see the same profiles after navigating away
  const handlePassOnSearch = async (passedUser: any) => {
    if (!user) return
    
    // ✅ CRITICAL FIX: Remove user from nearbyUsers IMMEDIATELY
    // This prevents showing them again in the same session
    setNearbyUsers(prev => prev.filter(u => u.uid !== passedUser.uid))
    console.log(`🗑️ Removed ${passedUser.name || passedUser.uid} from nearbyUsers list (PASS)`)
    
    try {
      // ✅ v2.8.5: Check if this is a DUMMY user
      if (passedUser.isDummy || passedUser.uid?.startsWith('dummy_')) {
        console.log(`🤖 PASS on DUMMY user ${passedUser.name} - recording with 3-day cooldown`)
        const { recordDummyInteraction } = await import('@/lib/dummy-users-service')
        await recordDummyInteraction(user.uid, passedUser.uid || passedUser.oderId, 'pass')
        console.log(`✅ Dummy PASS recorded - will reappear in 3 days`)
        return
      }
      
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
    
    // 🔍 DEBUG: Log current match count state
    console.log(`🔍 handleMatch called. Current freeMatchesUsedToday: ${freeMatchesUsedToday}, isPremium: ${isPremium}`)
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ v2.8.22 SIMPLE PAYWALL LOGIC:
    // After 4 matches → Block on LIKE attempt!
    // - Like is NOT saved
    // - No dependency on other user
    // - Simple and clean!
    // ═══════════════════════════════════════════════════════════════════════════
    if (!isPremium && freeMatchesUsedToday >= PASS_CONFIG.FREE_MATCHES_LIMIT) {
      console.log(`🔒 User has ${freeMatchesUsedToday}/${PASS_CONFIG.FREE_MATCHES_LIMIT} matches - BLOCKED on LIKE!`)
      console.log('🔒 Showing Paywall - like NOT saved!')
      setShowPremiumPaywall(true)
      return  // ← STOP! Don't save the like!
    }
    
    // ✅ CRITICAL FIX: Remove user from nearbyUsers IMMEDIATELY
    // This prevents showing them again in the same session
    setNearbyUsers(prev => prev.filter(u => u.uid !== matchUser.uid))
    console.log(`🗑️ Removed ${matchUser.name || matchUser.uid} from nearbyUsers list`)
    
    // ✅ v2.8.5: Check if this is a DUMMY user - no real match possible!
    if (matchUser.isDummy || matchUser.uid?.startsWith('dummy_')) {
      console.log(`🤖 LIKE on DUMMY user ${matchUser.name} - recording but no match`)
      try {
        const { recordDummyInteraction } = await import('@/lib/dummy-users-service')
        await recordDummyInteraction(user.uid, matchUser.uid || matchUser.oderId, 'like')
        console.log(`✅ Dummy LIKE recorded - will never appear again`)
      } catch (error) {
        console.error('❌ Error recording dummy like:', error)
      }
      // Don't create match - just continue browsing
      return
    }
    
    // 🎯 Record like and check for MUTUAL LIKE
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
      
      // ✅ v2.8.20: All matches are FREE! Paywall only before NEXT swipe
      // No more locking during match - users can chat freely
      
      setMatchedUser(matchUser)
      setIsLockedInMatch(true)
      setIsMatchLocked(false)  // ✅ v2.8.20: Never lock during match!
      setHasBidirectionalChat(false)  // ✅ Reset chat status for new match
      setIsPartnerReadyToMeet(false)  // ✅ Reset partner ready state for new match
      
      // ✅ v2.8.20 FIX: Set screen IMMEDIATELY - before any await!
      // This fixes Android bug where screen didn't change
      setCurrentScreen("match")
      console.log(`📱 Screen set to MATCH immediately!`)
      
      // ✅ NOTE: freeMatchesUsedToday will be updated from server after recordMatch
      
      // ✅ FIXED: Create timestamp-based timer in Firestore
      // ✅ v2.8.20: No more lockedForUser - all matches are free!
      const expiresAt = await createActiveMatch(
        user.uid, 
        matchUser.uid, 
        10,  // 10 minutes
        undefined  // ✅ v2.8.20: No lock!
      )
      setMatchExpiresAt(expiresAt)
      setMatchCreatedAt(new Date())  // ✅ NEW: Track when this match started (for Chat First logic)
      
      // ✅ v2.8.5 FIX: Set currentMatchId for consistent use everywhere!
      const newMatchId = createMatchId(user.uid, matchUser.uid)
      setCurrentMatchId(newMatchId)
      console.log(`🎯 Set currentMatchId: ${newMatchId}`)
      
      // ✅ v2.8.26 FIX: Mark this match as shown for User A too!
      // Prevents real-time listener from double-navigating
      sessionStorage.setItem(`match_shown_${newMatchId}`, 'true')
      
      // ✅ NEW: Mark as NEW match (for sound - only play once!)
      setIsNewMatch(true)
      
      // ✅ v2.8.16: "She Decides" - All users go to match screen
      // The match-screen handles gender-specific UI (disabled button for men)
      // Men see "Waiting for her to decide..." message
      // Women see the "We're Meeting!" button
      const currentUserGender = onboardingData.gender || 'male'
      const matchedUserGender = matchUser.gender || 'female'
      const isSameSexCouple = currentUserGender === matchedUserGender
      
      console.log(`🎯 "She Decides": User is ${currentUserGender}, match is ${matchedUserGender}, same-sex: ${isSameSexCouple}`)
      
      // ✅ v2.8.20: NO PAYWALL HERE! Match is FREE!
      // Paywall only shows when trying to do NEXT swipe (in handleMatch beginning)
      
      // ✅ Record the match in phone identity and update local state
      try {
        const newMatchCount = await recordMatch(user.uid)
        // ✅ FIX: Validate the count is a valid number
        if (typeof newMatchCount === 'number' && !isNaN(newMatchCount)) {
          setFreeMatchesUsedToday(newMatchCount)
          console.log(`📊 Matches used today (from server): ${newMatchCount}`)
          
          // ✅ v2.8.20: Set timer when user reaches the limit
          if (newMatchCount >= PASS_CONFIG.FREE_MATCHES_LIMIT && !isPremium) {
            console.log(`🔒 User reached ${PASS_CONFIG.FREE_MATCHES_LIMIT} matches - setting reset timer...`)
            // Set timer for 1 hour from now
            const expiresAt = new Date(Date.now() + PASS_CONFIG.LOCK_DURATION)
            setPassResetTime(expiresAt)
            setPhoneLockExpiresAt(expiresAt)
            setIsPhoneLocked(true)
            console.log(`⏰ Reset timer set for: ${expiresAt.toLocaleString()}`)
          }
        } else {
          console.error(`❌ Invalid match count returned: ${newMatchCount}`)
          // Fallback: increment locally
          setFreeMatchesUsedToday(prev => prev + 1)
        }
      } catch (recordError) {
        console.error('❌ Error recording match:', recordError)
        // Fallback: increment locally even if Firestore fails
        setFreeMatchesUsedToday(prev => prev + 1)
      }
      
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
    if (!user) return
    
    // ✅ CRITICAL FIX: Get phone number from state or load it
    let phoneNumber = userPhoneNumber
    if (!phoneNumber) {
      console.log('⚠️ Phone number not in state, loading from profile...')
      try {
        const profile = await getUserProfile(user.uid)
        phoneNumber = profile?.phoneNumber || `+972DEV${user.uid.slice(-8)}`
        setUserPhoneNumber(phoneNumber)
        console.log('📱 Loaded phone number:', phoneNumber)
      } catch (error) {
        console.error('❌ Error loading phone number:', error)
        // Use fallback
        phoneNumber = `+972DEV${user.uid.slice(-8)}`
        setUserPhoneNumber(phoneNumber)
      }
    }
    
    try {
      // ✅ Lock phone identity for 2 hours
      await lockPhoneIdentity(phoneNumber, 2)
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
    setMatchExpiresAt(null)
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
    
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
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
    
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
      
      // ✅ CRITICAL FIX: Cancel the match timer immediately!
      // This prevents MatchEndedScreen from showing while modal is open
      setMatchExpiresAt(null)
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
      setIsLockedInMatch(false)
      console.log('⏱️ Match timer cancelled - meeting confirmed!')
      
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
  // ✅ UPDATED: Called when user closes the "We're Meeting" modal
  // Now goes to Enjoy Mode instead of home
  const handleWeAreMeetingModalClose = () => {
    console.log('💕 handleWeAreMeetingModalClose called!')
    console.log('📍 Current screen:', currentScreen)
    console.log('👤 matchedUser:', matchedUser?.name || matchedUser?.displayName || 'undefined')
    
    // ✅ v2.8.20 FIX: Reset isPartnerReadyToMeet FIRST to prevent modal from reopening!
    console.log('🔒 Resetting isPartnerReadyToMeet to false')
    setIsPartnerReadyToMeet(false)
    
    const meetingTime = new Date()
    console.log('⏰ Setting meetingStartedAt:', meetingTime.toLocaleString())
    setMeetingStartedAt(meetingTime)  // Start the 20-minute countdown
    
    setIsLockedInMatch(false)
    setMatchExpiresAt(null)
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
    
    console.log('🚀 Navigating to enjoy-mode screen!')
    setIsInEnjoyModeSession(true)  // ✅ Track that we're in enjoy mode session
    setCurrentScreen("enjoy-mode")  // ✅ Go to Enjoy Mode!
    
    console.log('✅ handleWeAreMeetingModalClose completed!')
    // NOTE: Keep matchedUser - we need it for the Enjoy Mode screen
  }

  // ✅ NEW: Called when Enjoy Mode ends (timer or manual exit)
  const handleEnjoyModeExit = async (reason: 'timeout' | 'manual') => {
    console.log(`🏠 Exiting Enjoy Mode - reason: ${reason}`)
    console.log(`   user: ${user?.uid || 'NULL'}`)
    console.log(`   matchedUser: ${matchedUser?.uid || 'NULL'}`)
    
    // ✅ v2.8.26 NEW LOGIC:
    // - Manual exit (YOU leave) = YOU see feedback (share your experience)
    // - Timeout = BOTH see feedback
    // - Partner left (handled in modal) = NO feedback for you (you're disappointed)
    
    // Save partner info for feedback screen BEFORE clearing state
    const partnerInfo = matchedUser ? {
      matchId: currentMatchId || createMatchId(user!.uid, matchedUser.uid || matchedUser.id),
      partnerId: matchedUser.uid || matchedUser.id,
      partnerName: matchedUser.name || matchedUser.displayName || 'Your match',
      partnerPhoto: matchedUser.photos?.[0] || matchedUser.photoURL
    } : null
    
    // Mark meeting as completed in Firebase
    if (user && matchedUser) {
      const matchId = currentMatchId || createMatchId(user.uid, matchedUser.uid)
      try {
        const { markMeetingAsCompleted, setPendingFeedback: savePendingFeedback } = await import('@/lib/firestore-service')
        await markMeetingAsCompleted(matchId, reason, user.uid)
        console.log('✅ Meeting marked as completed in Firebase')
        
        // Save pending feedback in Firebase (for hermetic restore)
        if (partnerInfo) {
          await savePendingFeedback(
            user.uid,
            partnerInfo.matchId,
            partnerInfo.partnerId,
            partnerInfo.partnerName,
            partnerInfo.partnerPhoto
          )
          console.log('✅ Pending feedback saved to Firebase')
        }
      } catch (err) {
        console.error('Error marking meeting as completed:', err)
      }
    }
    
    // ✅ Show feedback screen for BOTH manual exit and timeout!
    if (partnerInfo) {
      console.log(`📋 Going to Meeting Feedback screen (reason: ${reason})`)
      setPendingFeedback(partnerInfo)
      setCurrentScreen("meeting-feedback")
    } else {
      console.warn('⚠️ No partner info for feedback - going home')
      setCurrentScreen("home")
    }
    
    // Clear enjoy mode state
    setMeetingStartedAt(null)
    setIsInEnjoyModeSession(false)
    localStorage.removeItem('i4iguana_enjoy_mode')
    
    // Clear match state (after setting feedback!)
    setMatchedUser(null)
    setSelectedMatch(null)
    setIsMatchLocked(false)
    setIsViewingProfileFromChat(false)
    setCurrentMatchId("")
  }

  // ✅ NEW: Handle meeting feedback submission
  const handleFeedbackSubmit = async (feedback: { rating: 'positive' | 'negative', feedbackText: string }) => {
    console.log('📋 Submitting meeting feedback:', feedback)
    
    if (!user || !pendingFeedback) {
      console.warn('⚠️ No user or pending feedback')
      handleFeedbackSkip()
      return
    }
    
    try {
      const { saveMeetingFeedback, clearPendingFeedback } = await import('@/lib/firestore-service')
      
      await saveMeetingFeedback(
        user.uid,
        pendingFeedback.matchId,
        pendingFeedback.partnerId,
        pendingFeedback.partnerName,
        feedback
      )
      
      await clearPendingFeedback(user.uid)
      console.log('✅ Feedback submitted successfully')
    } catch (err) {
      console.error('Error submitting feedback:', err)
    }
    
    // Clear state and check venue status
    finishFeedbackFlow()
  }
  
  // ✅ NEW: Handle feedback skip
  const handleFeedbackSkip = async () => {
    console.log('⏭️ Skipping meeting feedback')
    
    if (user) {
      try {
        const { clearPendingFeedback } = await import('@/lib/firestore-service')
        await clearPendingFeedback(user.uid)
      } catch (err) {
        console.error('Error clearing pending feedback:', err)
      }
    }
    
    finishFeedbackFlow()
  }
  
  // ✅ NEW: Common logic after feedback submit/skip
  const finishFeedbackFlow = () => {
    // Clear all match-related state
    setPendingFeedback(null)
    setMatchedUser(null)
    setSelectedMatch(null)
    setIsMatchLocked(false)
    setIsViewingProfileFromChat(false)
    setMatchCreatedAt(null)
    
    // ✅ v2.8.22: Clear enjoy mode flag - feedback flow is complete!
    localStorage.removeItem('i4iguana_enjoy_mode')
    setIsInEnjoyModeSession(false)
    
    // ✅ v2.8.7: Clear all modals and overlays
    setShowVenueSelection(false)
    setShowOutOfPasses(false)
    setShowPremiumPaywall(false)
    setShowMatchEnded(false)
    setShowWeAreMeeting(false)
    setInAppNotification(prev => ({ ...prev, isVisible: false }))
    
    // Check if still checked in to venue
    if (isCheckedIn && checkInData) {
      console.log('✅ Still checked in - going to home')
      setCurrentScreen("home")
    } else {
      // Not checked in - show message and go to world selection
      console.log('⚠️ Not checked in - going to world selection')
      setCurrentScreen("world-selection")
    }
  }

  // ✅ NEW: Open chat from Enjoy Mode
  const handleOpenChatFromEnjoyMode = () => {
    console.log('💬 Opening chat from Enjoy Mode')
    console.log(`   matchedUser: ${matchedUser ? matchedUser.name : 'NULL'}`)
    console.log(`   selectedMatch: ${selectedMatch ? selectedMatch.name : 'NULL'}`)
    
    // ✅ CRITICAL FIX: Must set selectedMatch for ChatScreen to work!
    if (matchedUser) {
      setSelectedMatch(matchedUser)
      setCurrentScreen("chat")
    } else if (selectedMatch) {
      // Fallback: use selectedMatch if matchedUser is null
      console.log('⚠️ Using selectedMatch as fallback for chat')
      setCurrentScreen("chat")
    } else {
      console.error('❌ No matchedUser or selectedMatch found - cannot open chat!')
      // Don't crash - just stay on current screen
      alert('Unable to open chat. Please try again.')
    }
  }
  
  // ✅ v2.8.16: Open chat from Match screen (WITHOUT locking phone!)
  // This is different from handleMeetNow which locks the phone
  const handleOpenChatFromMatch = () => {
    console.log('💬 Opening chat from Match screen')
    if (matchedUser) {
      setSelectedMatch(matchedUser)
      setCurrentScreen("chat")
    } else if (selectedMatch) {
      console.log('⚠️ Using selectedMatch as fallback for chat')
      setCurrentScreen("chat")
    } else {
      console.error('❌ No matchedUser or selectedMatch found - cannot open chat!')
      alert('Unable to open chat. Please try again.')
    }
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
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
    setCurrentScreen("home")
    console.log('🔙 Returned to home screen after timer expired')
  }

  const handleSkipTimer = () => {
    // ✅ FIX: Use Stripe checkout for skip-timer (1 Pass)
    handleStripeCheckout('skip-timer')
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
      setPaymentLoading(plan)  // ✅ Set specific button loading
      
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
        setPaymentLoading(null)
      }
    } catch (error) {
      console.error('❌ Stripe checkout error:', error)
      alert('❌ Something went wrong. Please try again.')
      setPaymentLoading(null)
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
        // ✅ v2.8.22: Pass phoneNumber for cross-login identification
        await saveOnboardingData(user.uid, user.email || '', completeData, user.phoneNumber || '')
        console.log('✅ User data saved to Firestore!')
        
        // ✅ CRITICAL FIX: Clear any existing chat history from previous account with same UID
        // This prevents old conversations from appearing after account deletion + recreation
        console.log('🧹 Clearing any old chat history...')
        const clearedChats = await clearAllChatsForUser(user.uid)
        if (clearedChats > 0) {
          console.log(`✅ Cleared ${clearedChats} old chats from previous account`)
        }
        
        // ✅ CRITICAL FIX: Clear swipe references from other users
        // This ensures the "new" user isn't blocked by old swipe data
        console.log('🧹 Clearing old swipe references...')
        const clearedSwipes = await clearSwipeReferencesToUser(user.uid)
        if (clearedSwipes > 0) {
          console.log(`✅ Cleared swipe references from ${clearedSwipes} users`)
        }
        
        // ✅ CRITICAL FIX: Clear match cooldowns for this user
        // This ensures the "new" user can match with previous partners
        console.log('🧹 Clearing old match cooldowns...')
        const clearedCooldowns = await clearMatchCooldownsForUser(user.uid)
        if (clearedCooldowns > 0) {
          console.log(`✅ Cleared ${clearedCooldowns} match cooldowns`)
        }
        
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
        
        // ✅ v2.8.5: Go to World Selection screen
        // User chooses between Zones (Hot Zones) or Venues (Join a Venue)
        console.log('🌍 Going to World Selection screen...')
        setCurrentScreen("world-selection")
        
        // ✅ CRITICAL: Show notification modal after onboarding completion!
        // Check if we should show notification prompt
        const modalShownKey = `notificationModalShown_${user.uid}`
        const forceSetup = localStorage.getItem('force_notification_setup')
        const modalAlreadyShown = localStorage.getItem(modalShownKey)
        
        // Show notification modal if: force flag is set OR modal never shown before
        if (forceSetup === 'true' || modalAlreadyShown !== 'true') {
          console.log('🔔 Showing notification modal after onboarding...')
          localStorage.removeItem('force_notification_setup')
          localStorage.setItem(modalShownKey, 'true')
          
          // Wait for other modals to close, then show notification modal
          setTimeout(() => {
            console.log('🔔 Opening notification permission modal NOW')
            setShowNotificationModal(true)
          }, 2000)
        }
        
      } catch (error) {
        console.error('❌ Error saving onboarding data:', error)
      }
    }
  }

  const handleNavigate = (screen: string) => {
    // ✅ HERMETIC: During enjoy mode session, only block home and notifications
    if (isInEnjoyModeSession) {
      if (screen === "home" || screen === "notifications") {
        console.log(`⛔ [HERMETIC] Blocked navigation to ${screen} - returning to enjoy-mode`)
        setCurrentScreen("enjoy-mode")  // Show enjoy mode instead of blocking
        return
      }
      // Allow: chat, match (partner profile), profile (own profile)
      console.log(`✅ [HERMETIC] Allowed navigation to ${screen} during enjoy mode session`)
    }
    
    // ✅ HERMETIC: During meeting feedback, block ALL navigation except skip/submit
    if (currentScreen === "meeting-feedback" && pendingFeedback) {
      console.log(`⛔ [HERMETIC] Blocked navigation to ${screen} - must complete feedback first`)
      setCurrentScreen("meeting-feedback")
      return
    }
    
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
  const handleNotificationsNavigate = (screen: "home" | "notifications" | "profile" | "match" | "chat" | "enjoy-mode") => {
    // ✅ HERMETIC: During enjoy mode, redirect home to enjoy-mode
    if (isInEnjoyModeSession && screen === "home") {
      console.log(`⛔ [HERMETIC] Notifications nav to home - returning to enjoy-mode`)
      setCurrentScreen("enjoy-mode")
      return
    }
    
    // ✅ FIX: Reset isNewMatch when navigating away from match screen
    if (currentScreen === "match" && screen !== "match") {
      setIsNewMatch(false)
      console.log('🔇 Reset isNewMatch (navigating from match via notifications)')
    }
    
    // ✅ FIXED: "home" should return to the correct world based on appMode!
    if (screen === "home") {
      if (appMode === 'venue') {
        console.log('🏠 Notifications nav to home - going to VENUE home (appMode=venue)')
        setCurrentScreen("home")
        return
      } else if (appMode === 'zone') {
        // ✅ v2.8.6 FIX: Go to mode-selection (ActionTonightScreen) not discovery!
        console.log('🗺️ Notifications nav to home - going to ZONE mode-selection (appMode=zone)')
        setCurrentScreen("mode-selection")
        return
      } else {
        // No mode selected - go to world selection
        console.log('🌍 Notifications nav to home - going to world-selection (no appMode)')
        setCurrentScreen("world-selection")
        return
      }
    }
    
    setCurrentScreen(screen as Screen)
  }

  const handleProfileNavigate = (screen: string) => {
    // ✅ HERMETIC: During enjoy mode, redirect home/notifications to enjoy-mode
    if (isInEnjoyModeSession && (screen === "home" || screen === "notifications")) {
      console.log(`⛔ [HERMETIC] Profile nav to ${screen} - returning to enjoy-mode`)
      setCurrentScreen("enjoy-mode")
      return
    }
    
    // ✅ FIX: Reset isNewMatch when navigating away from match screen
    if (currentScreen === "match" && screen !== "match") {
      setIsNewMatch(false)
      console.log('🔇 Reset isNewMatch (navigating from match via profile)')
    }
    
    // ✅ FIXED: "home" should return to the correct world based on appMode!
    if (screen === "home") {
      if (appMode === 'venue') {
        console.log('🏠 Profile nav to home - going to VENUE home (appMode=venue)')
        setCurrentScreen("home")
        return
      } else if (appMode === 'zone') {
        // ✅ v2.8.6 FIX: Go to mode-selection (ActionTonightScreen) not discovery!
        console.log('🗺️ Profile nav to home - going to ZONE mode-selection (appMode=zone)')
        setCurrentScreen("mode-selection")
        return
      } else {
        // No mode selected - go to world selection
        console.log('🌍 Profile nav to home - going to world-selection (no appMode)')
        setCurrentScreen("world-selection")
        return
      }
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
              setMatchExpiresAt(null)
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
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
          
          // ✅ CRITICAL: Build selectedMatch object FIRST, then navigate
          const chatMatchData = senderProfile ? {
            uid: notification.fromUserId,
            name: senderProfile.name || senderProfile.displayName || 'User',
            displayName: senderProfile.name || senderProfile.displayName || 'User',
            photos: senderProfile.photos || [],
            photoURL: senderProfile.photoURL || '',
            distance: 'nearby'
          } : {
            uid: notification.fromUserId,
            name: notification.fromUserName || 'User',
            displayName: notification.fromUserName || 'User',
            photos: notification.fromUserPhoto ? [notification.fromUserPhoto] : [],
            photoURL: notification.fromUserPhoto || '',
            distance: 'nearby'
          }
          
          // ✅ Set before navigating!
          setSelectedMatch(chatMatchData)
          console.log('✅ Selected match set for chat:', chatMatchData.name)
          
          // ✅ Check if chat is still active or read-only
          if (user) {
            const matchExpiration = await getActiveMatchExpiration(user.uid, notification.fromUserId)
            if (!matchExpiration) {
              console.log('⏰ Chat is read-only (match expired)')
              setMatchExpiresAt(null)
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
              setIsLockedInMatch(false)
            } else {
              // ✅ CRITICAL: Check if user is LOCKED on this match (needs to pay)
              const isLocked = await isUserLockedOnMatch(user.uid, notification.fromUserId)
              if (isLocked) {
                console.log('🔒 User is LOCKED on this match - showing paywall instead of chat!')
                setMatchedUser(chatMatchData)
                setIsMatchLocked(true)
                setIsLockedInMatch(true)
                setMatchExpiresAt(matchExpiration)
                setCurrentScreen("match")  // Go to match screen, not chat
                setTimeout(() => {
                  setShowPremiumPaywall(true)  // Show paywall
                }, 500)
                return  // Don't continue to chat
              }
            }
          }
          
          setCurrentScreen("chat")
        } else {
          console.warn('⚠️ No fromUserId in notification')
          // Don't navigate if we can't identify the chat partner
        }
      } catch (error) {
        console.error('❌ Error loading sender profile:', error)
        // Fallback: if we have fromUserId, still try to show chat
        if (notification.fromUserId) {
          setSelectedMatch({
            uid: notification.fromUserId,
            name: notification.fromUserName || 'User',
            displayName: notification.fromUserName || 'User',
            photos: notification.fromUserPhoto ? [notification.fromUserPhoto] : [],
            photoURL: notification.fromUserPhoto || '',
            distance: 'nearby'
          })
          setCurrentScreen("chat")
        }
      }
    }
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden fixed inset-0">
      {/* Splash Screen - Loading mode (user logged in) */}
      {/* ✅ v2.8.26: Skip splash if already completed (quick restore) */}
      {currentScreen === "splash" && !splashComplete && (
        <SplashScreen 
          onComplete={() => {
            console.log('🚀 Splash animation complete')
            setSplashComplete(true)
          }} 
        />
      )}
      
      {/* ✅ v2.8.26: Show loading indicator for quick restore */}
      {currentScreen === "splash" && splashComplete && (
        <div 
          className="flex flex-col items-center justify-center h-screen"
          style={{ background: 'linear-gradient(160deg, #1a4d3e 0%, #0d2920 40%, #0a1f18 70%, #051410 100%)' }}
        >
          <div className="text-6xl mb-4 animate-pulse">🦎</div>
          <div className="text-white/50 text-sm">Loading...</div>
        </div>
      )}
      
      {/* Welcome Screen - Same splash but with buttons (no user) */}
      {currentScreen === "welcome" && (
        <SplashScreen 
          showButtons={true}
          onLogin={() => setCurrentScreen("login")} 
          onSignUp={() => setCurrentScreen("login")}
          onComplete={() => {}}
        />
      )}
      
      {/* ✅ v2.8.7: Language Selection Screen - First time users */}
      {currentScreen === "language-selection" && (
        <LanguageSelectionScreen
          onComplete={() => {
            console.log('🌍 Language selected → WELCOME')
            setCurrentScreen("welcome")
          }}
        />
      )}
      
      {/* ✅ Login Screen - FIXED: Use onSuccess prop */}
      {currentScreen === "login" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <LoginScreen 
            onSuccess={() => {
              // Auth will handle navigation via useEffect
              console.log('✅ Login successful')
            }}
          />
        </div>
      )}
      
      {/* ✅ NEW: Phone Verification Screen */}
      {currentScreen === "phone-verification" && user && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <PhoneVerification
            userId={user.uid}
            userEmail={user.email || undefined}
            showSkip={false}  // ❌ Disabled for Production - real phone verification only
            onComplete={async (phoneNumber) => {
              console.log('✅ Phone verified:', phoneNumber)
              
              // ✅ v2.8.4 CRITICAL: Save Device ID to profile + SET AVAILABLE!
              // This ensures the same device won't need to re-verify
              // AND user is visible after login!
              // ✅ v2.8.22: Also save phoneNumber for cross-login identification!
              const currentDeviceId = getOrCreateDeviceId()
              try {
                const { doc, updateDoc, Timestamp } = await import('firebase/firestore')
                const { db } = await import('@/lib/firebase')
                
                await updateDoc(doc(db, 'users', user.uid), {
                  verifiedDeviceId: currentDeviceId,
                  lastVerifiedAt: Timestamp.now(),
                  isAvailable: true,  // ✅ v2.8.4 CRITICAL: Always available after login!
                  phoneNumber: phoneNumber,  // ✅ v2.8.22: Save phone for cross-login!
                  phoneVerified: true,
                  phoneVerifiedAt: Timestamp.now()
                })
                console.log('🆔 Device ID saved to profile:', currentDeviceId.slice(0, 15) + '...')
                console.log('📱 Phone number saved to profile:', phoneNumber)
                console.log('✅ isAvailable set to TRUE')
              } catch (deviceError) {
                console.error('⚠️ Error saving device ID:', deviceError)
                // Continue anyway - not critical
              }
              
              // ✅ CRITICAL: Cache phone verification to prevent refresh bug
              localStorage.setItem('i4iguana_phone_verified', 'true')
              
              // ✅ CRITICAL: Clear the race-condition flag now that verification is complete
              localStorage.removeItem('i4iguana_handling_deleted')
              
              // ✅ v2.8.24 FIX: Save flag BEFORE clearing it!
              const wasJustDeleted = localStorage.getItem('i4iguana_just_deleted') === 'true'
              
              // ✅ v2.8.23 FIX: Clear just_deleted flag - migration is now safe!
              localStorage.removeItem('i4iguana_just_deleted')
              console.log('✅ Cleared i4iguana_just_deleted flag after phone verification')
              
              // Check if user needs onboarding
              try {
                // ✅ v2.8.24 FIX: Use saved flag (already read above)
                
                const profile = await getUserProfile(user.uid)
                const hasCompletedOnboarding = profile?.onboardingComplete === true
                
                if (hasCompletedOnboarding && !wasJustDeleted) {
                  console.log('✅ Existing user → WORLD SELECTION')
                  setCurrentScreen("world-selection")
                } else {
                  console.log('🆕 New user (or just deleted) → ONBOARDING')
                  setCurrentScreen("onboarding-welcome")
                }
              } catch (error) {
                console.log('⚠️ Error checking profile → ONBOARDING')
                setCurrentScreen("onboarding-welcome")
              }
            }}
            onSkip={async () => {
              console.log('🔧 DEV: Skipping phone verification')
              
              // ✅ v2.8.24 FIX: Save flag BEFORE clearing it!
              const wasJustDeleted = localStorage.getItem('i4iguana_just_deleted') === 'true'
              
              // ✅ CRITICAL: Clear the race-condition flag
            localStorage.removeItem('i4iguana_handling_deleted')
            localStorage.removeItem('i4iguana_just_deleted')  // ✅ v2.8.24: Also clear in dev mode
            
            // In dev mode, use fake phone number based on userId
            const devPhoneNumber = `+972DEV${user.uid.slice(-8)}`
            
            // ✅ v2.8.4: Also save Device ID in dev mode!
            const currentDeviceId = getOrCreateDeviceId()
            
            // Update user profile with dev phone and device ID
            try {
              const { doc, updateDoc, Timestamp } = await import('firebase/firestore')
              const { db } = await import('@/lib/firebase')
              
              await updateDoc(doc(db, 'users', user.uid), {
                phoneNumber: devPhoneNumber,
                phoneVerified: true,
                phoneVerifiedAt: Timestamp.now(),
                verifiedDeviceId: currentDeviceId,  // ✅ v2.8.4: Save device ID
                lastVerifiedAt: Timestamp.now(),
                isAvailable: true  // ✅ v2.8.4: Always available after login!
              })
              console.log('✅ Dev phone saved:', devPhoneNumber)
              console.log('🆔 Device ID saved:', currentDeviceId.slice(0, 15) + '...')
              console.log('✅ isAvailable set to TRUE')
            } catch (error) {
              console.log('⚠️ Error saving dev phone:', error)
            }
            
            // Check if user needs onboarding
            try {
              // ✅ v2.8.24 FIX: Use saved flag (already read above)
              
              const profile = await getUserProfile(user.uid)
              const hasCompletedOnboarding = profile?.onboardingComplete === true
              
              if (hasCompletedOnboarding && !wasJustDeleted) {
                console.log('✅ DEV: Existing user → WORLD SELECTION')
                setCurrentScreen("world-selection")
              } else {
                setCurrentScreen("onboarding-welcome")
              }
            } catch (error) {
              setCurrentScreen("onboarding-welcome")
            }
          }}
        />
        </div>
      )}
      
      {/* Onboarding Screens - ALL with scroll wrappers */}
      {/* ✅ NEW: Welcome Screen */}
      {currentScreen === "onboarding-welcome" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <OnboardingWelcomeScreen
            onContinue={() => {
              console.log('📝 Moving to Name Entry')
              setCurrentScreen("onboarding-name")
            }}
          />
        </div>
      )}

      {/* ✅ NEW: Name Entry Screen */}
      {currentScreen === "onboarding-name" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <NameEntryScreen
            defaultName={user?.displayName || (typeof window !== 'undefined' ? localStorage.getItem('googleDisplayName') : '') || ""}
            onContinue={(name) => {
              console.log('📝 Name entered:', name)
              setOnboardingData({ ...onboardingData, name })
              setCurrentScreen("onboarding-gender")
            }}
          />
        </div>
      )}

      {currentScreen === "onboarding-gender" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <OnboardingGender 
            onNext={(data) => {
              setOnboardingData({ ...onboardingData, ...data })
              setCurrentScreen("onboarding-age")
            }}
            onBack={() => setCurrentScreen("onboarding-name")}
            initialGender={onboardingData.gender}
            initialLookingFor={onboardingData.lookingFor}
          />
        </div>
      )}

      {/* ✅ "She Decides" - Orientation screen removed (straight dating only) */}
      
      {currentScreen === "onboarding-age" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
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
        </div>
      )}
      
      {currentScreen === "onboarding-hobbies" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <OnboardingHobbies
            onNext={(data) => {
              setOnboardingData({ ...onboardingData, ...data })
              setCurrentScreen("onboarding-lifestyle")
            }}
            onBack={() => setCurrentScreen("onboarding-age")}
            initialHobbies={onboardingData.hobbies}
          />
        </div>
      )}
      
      {/* ✅ NEW: Lifestyle Screen */}
      {currentScreen === "onboarding-lifestyle" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
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
        </div>
      )}
      
      {currentScreen === "onboarding-photos" && (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'auto' }}>
          <OnboardingPhotos
            onComplete={handleOnboardingComplete}
            onBack={() => setCurrentScreen("onboarding-lifestyle")}
            initialPhotos={onboardingData.photos}
            initialBio={onboardingData.bio}
          />
        </div>
      )}
      
      {/* ✅ v2.8.5: World Selection Screen - Junction between Zones and Venues */}
      {currentScreen === "world-selection" && (
        <WorldSelectionScreen
          userName={onboardingData.name || 'there'}
          nearestZoneDistance={currentZone ? 0 : (entertainmentZones.length > 0 && userLocationForVenues ? 
            Math.min(...entertainmentZones.map(z => {
              const R = 6371000
              const dLat = (z.center.lat - userLocationForVenues.lat) * Math.PI / 180
              const dLon = (z.center.lng - userLocationForVenues.lng) * Math.PI / 180
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLocationForVenues.lat * Math.PI / 180) * Math.cos(z.center.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            })) : null
          )}
          nearestZoneName={entertainmentZones.length > 0 ? entertainmentZones[0]?.name : null}
          onNavigateToProfile={() => setCurrentScreen('profile')}
          onNavigateToNotifications={() => setCurrentScreen('notifications')}
          onSelectZones={async () => {
            console.log('🔥 User selected HOT ZONES')
            
            // ✅ v2.8.6: Set flag BEFORE checkout to prevent disconnect notification
            switchingToZoneModeRef.current = true
            
            // ✅ v2.8.5: Auto-checkout from venue when switching to Zone mode
            if (isCheckedIn && checkInData) {
              console.log('🚪 Auto-checkout from venue:', checkInData.venueDisplayName)
              try {
                await handleCheckOut()
                console.log('✅ Auto-checkout successful')
              } catch (err) {
                console.warn('⚠️ Auto-checkout failed, continuing anyway:', err)
              }
            }
            
            setAppMode('zone')
            setCurrentScreen('mode-selection')  // Go to ActionTonightScreen
          }}
          onSelectVenues={async () => {
            console.log('🍸 User selected JOIN A VENUE')
            setAppMode('venue')
            
            // ✅ v2.8.17: Check Firestore first!
            if (user) {
              const status = await getUserCheckInStatus(user.uid)
              if (status.isCheckedIn && status.checkInData) {
                console.log('✅ User already checked in:', status.checkInData.venueDisplayName)
                setCheckInData(status.checkInData)
                setIsCheckedIn(true)
                setCurrentScreen('home')
                return  // Don't show venue selection!
              }
            }
            
            setCurrentScreen('home')
            setTimeout(() => setShowVenueSelection(true), 300)
          }}
        />
      )}
      
      {/* ✅ Action Tonight Screen - Entertainment Zones (Hot Zones) */}
      {currentScreen === "mode-selection" && (
        <ActionTonightScreen
          userLocation={userLocationForVenues}
          userId={user?.uid}
          userName={onboardingData.name || 'there'}
          onRequestLocation={handleRequestLocationForDiscovery}
          onJoinEvent={handleJoinEvent}
          onEnterZone={handleEnterZone}
          onExploreZone={handleExploreZone}
          onBackToModeSelection={() => setCurrentScreen('world-selection')}  // ✅ v2.8.5: Back to world selection
          onSearchCity={handleSearchCity}
          onSelectVenue={async () => {
            // Open venue selection modal for specific venue check-in
            // ✅ v2.8.17: Check Firestore first!
            setAppMode('venue')
            
            if (user) {
              const status = await getUserCheckInStatus(user.uid)
              if (status.isCheckedIn && status.checkInData) {
                console.log('✅ User already checked in:', status.checkInData.venueDisplayName)
                setCheckInData(status.checkInData)
                setIsCheckedIn(true)
                setCurrentScreen('home')
                return  // Don't show venue selection!
              }
            }
            
            setCurrentScreen('home')
            setTimeout(() => setShowVenueSelection(true), 300)
          }}
          onNavigateToProfile={() => setCurrentScreen('profile')}
          onNavigateToNotifications={() => setCurrentScreen('notifications')}
        />
      )}
      
      {/* ✅ NEW: Discovery Screen - Shows entertainment zones */}
      {currentScreen === "discovery" && (
        <DiscoveryScreen
          userLocation={userLocationForVenues}
          onRequestLocation={handleRequestLocationForDiscovery}
          onEnterZone={handleEnterZone}
          onExploreZone={handleExploreZone}
          onBackToModeSelection={handleBackToModeSelection}
        />
      )}
      
      {/* ✅ NEW: Zone Mode Screen - User is in an entertainment zone */}
      {currentScreen === "zone-mode" && currentZone && userLocationForVenues && (
        <ZoneModeScreen
          currentZone={currentZone}
          userLocation={userLocationForVenues}
          otherZones={entertainmentZones.filter(z => z.id !== currentZone.id)}
          singlesCount={singlesInZone}
          onStartMatching={handleStartMatchingInZone}
          onExploreZone={handleExploreZone}
          onBackToDiscovery={handleBackToModeSelection}
        />
      )}
      
      {/* ✅ NEW: Explore Zone Screen - Viewing a zone user is not in */}
      {currentScreen === "explore-zone" && exploringZone && userLocationForVenues && (
        <ExploreZoneScreen
          zone={exploringZone}
          userLocation={userLocationForVenues}
          onBack={() => {
            setExploringZone(null)
            setCurrentScreen(currentZone ? 'zone-mode' : 'discovery')
          }}
          onNavigate={handleNavigateToZone}
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
            onRefresh={appMode === 'zone' ? async () => {
              // ✅ v2.8.18: Zone Mode refresh - reload zone users
              if (currentZone && user) {
                console.log('🔄 Refreshing Zone Mode users...')
                setLoading(true)
                try {
                  const userProfile = await getUserProfile(user.uid)
                  if (!userProfile || !userLocationForVenues) {
                    setLoading(false)
                    return
                  }
                  
                  const genderPreference = userProfile.preferences?.lookingFor || 
                    (userProfile.gender === 'male' ? 'female' : userProfile.gender === 'female' ? 'male' : 'both')
                  const ageRange = userProfile.preferences?.ageRange as [number, number] | undefined
                  
                  const realUsers = await getUsersInZone(
                    currentZone.id,
                    user.uid,
                    userLocationForVenues.lat,
                    userLocationForVenues.lng,
                    userProfile.gender || 'male',
                    genderPreference
                  )
                  
                  // ✅ v2.8.26: Sort - NEW profiles first, previous matches LAST
                  let previousMatchIds = new Set<string>()
                  try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid))
                    if (userDoc.exists()) {
                      const userMatches = userDoc.data().matches || []
                      previousMatchIds = new Set(userMatches)
                    }
                  } catch (err) {
                    console.warn('Could not fetch user matches:', err)
                  }
                  
                  const sortedRealUsers = [...realUsers].sort((a, b) => {
                    const aMatched = previousMatchIds.has(a.oderId)
                    const bMatched = previousMatchIds.has(b.oderId)
                    if (aMatched && !bMatched) return 1
                    if (!aMatched && bMatched) return -1
                    return 0
                  })
                  
                  const { getDummiesForUser } = await import('@/lib/dummy-users-service')
                  const dummyUsers = await getDummiesForUser(
                    user.uid,
                    currentZone.id,
                    userProfile.gender || 'male',
                    genderPreference,
                    50 - sortedRealUsers.length,
                    ageRange
                  )
                  
                  const allUsers = [
                    ...sortedRealUsers,
                    ...dummyUsers.map(d => ({ uid: d.oderId, ...d, photos: d.photos?.slice(0, 1) || [], isDummy: true }))
                  ]
                  
                  setZoneUsers(allUsers)
                  setNearbyUsers(allUsers)
                  console.log(`✅ Refreshed: ${sortedRealUsers.length} real + ${dummyUsers.length} dummy = ${allUsers.length}`)
                } catch (err) {
                  console.error('❌ Zone refresh error:', err)
                }
                setLoading(false)
              }
            } : loadNearbyUsers}
            onNavigate={handleNavigate}
            onScan={() => setShowVenueSelection(true)}  // ✅ CHANGED: Open venue selection instead of scan
            venueData={checkInData ? {
              venueName: checkInData.venueDisplayName || checkInData.venueName,
              checkedInAt: checkInData.checkedInAt instanceof Date ? checkInData.checkedInAt : checkInData.checkedInAt?.toDate?.() || new Date(),
              expiresAt: checkInData.expiresAt instanceof Date ? checkInData.expiresAt : checkInData.expiresAt?.toDate?.() || new Date()
            } : null}
            onShowVenueStatus={() => setShowVenueStatus(true)}
            onSwitchMode={handleBackToModeSelection}
            appMode={appMode}
          />
        </>
      )}
      
      {/* ❌ DISABLED: Scan Screen - replaced by VenueSelectionScreen
      {currentScreen === "scan" && (
        <ScanScreen
          onNavigate={(screen) => setCurrentScreen(screen)}
          onCheckInSuccess={handleCheckIn}
        />
      )}
      */}
      
      {/* Match Screen */}
      {currentScreen === "match" && (matchedUser || selectedMatch) && (
        <MatchScreen
          user={matchedUser || selectedMatch}
          onContinue={handleContinue}
          onMeetNow={handleMeetNow}
          onOpenChat={handleOpenChatFromMatch}
          onMarkMatchSuccessful={handleMarkMatchSuccessful}
          onWeAreMeetingModalClose={handleWeAreMeetingModalClose}
          passesLeft={passesLeft}
          onPass={handlePass}
          onNotInterested={handleNotInterested}
          isPremium={isPremium}
          timeRemaining={timeRemaining}
          currentUserGender={onboardingData?.gender as 'male' | 'female' | undefined}
          matchedUserGender={(matchedUser || selectedMatch)?.gender as 'male' | 'female' | undefined}
          onNavigate={handleNavigate}
          isNewMatch={isNewMatch}
          isMatchLocked={isMatchLocked}
          onUnlockMatch={() => setShowPremiumPaywall(true)}
          hasBidirectionalChat={hasBidirectionalChat}
          isPartnerReadyToMeet={isPartnerReadyToMeet}
          matchCreatedAt={matchCreatedAt}
          isInEnjoyModeSession={isInEnjoyModeSession}
          onBackToEnjoyMode={() => {
            console.log('⬅️ [HERMETIC] Returning to Enjoy Mode from profile')
            setCurrentScreen("enjoy-mode")
          }}
          isReadOnlyProfile={isViewingProfileFromChat}
          onBackToChat={() => {
            console.log('⬅️ Returning to Chat from profile view')
            setIsViewingProfileFromChat(false)
            setCurrentScreen("chat")
          }}
        />
      )}
      
      {/* ✅ FALLBACK: Match screen without matchedUser - redirect to home */}
      {currentScreen === "match" && !matchedUser && !selectedMatch && (
        <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#0a1f18] to-[#050d0a] flex flex-col items-center justify-center p-6">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-xl font-bold text-white mb-2">Match Unavailable</h2>
          <p className="text-white/60 text-center mb-6">This match is no longer available or has expired.</p>
          <button
            onClick={() => setCurrentScreen("home")}
            className="px-6 py-3 bg-[#4ade80] text-[#0d2920] font-bold rounded-full"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Chat Screen */}
      {currentScreen === "chat" && selectedMatch && user && (
        <ChatScreen
          matchId={currentMatchId || createMatchId(user.uid, selectedMatch.uid)}
          currentUserId={user.uid}
          otherUserId={selectedMatch.uid}
          matchUser={{
            name: selectedMatch.name || selectedMatch.displayName || "User",
            photo: selectedMatch.photos?.[0] || selectedMatch.photoURL || "/placeholder.jpg",
            distance: selectedMatch.distance || "nearby",
            venueName: selectedMatch.venueName || null,
            zoneName: currentZone?.name
          }}
          currentUser={{
            name: onboardingData.name || user.displayName || "Someone",
            photo: onboardingData.photos?.[0] || user.photoURL || ""
          }}
          // ✅ v2.8.26 FIX: During Enjoy Mode, chat should ALWAYS be open!
          // Calculate remaining time from meetingStartedAt if in enjoy mode
          timeRemaining={
            meetingStartedAt 
              ? Math.max(0, Math.floor((meetingStartedAt.getTime() + 20 * 60 * 1000 - Date.now()) / 1000))
              : timeRemaining
          }
          // ✅ v2.8.3: Pass matchCreatedAt to filter old messages
          matchCreatedAt={matchCreatedAt}
          // 🆕 Proximity features
          userLocation={userLocationForVenues}
          matchLocation={selectedMatch.location || null}
          currentVenueName={appMode === 'venue' ? (checkInData?.venueDisplayName || checkInData?.venueName) : currentZone?.name}
          onBack={() => {
            // ✅ HERMETIC: Always return to enjoy-mode if in session
            if (isInEnjoyModeSession && matchedUser) {
              console.log('⬅️ [HERMETIC] Returning to Enjoy Mode from chat')
              setCurrentScreen("enjoy-mode")
            } else if (meetingStartedAt && matchedUser) {
              console.log('⬅️ Returning to Enjoy Mode from chat (via meetingStartedAt)')
              setCurrentScreen("enjoy-mode")
            } else if (timeRemaining > 0 && matchedUser) {
              console.log('⬅️ Returning to Match screen')
              setIsNewMatch(false)
              setCurrentScreen("match")
            } else {
              console.log('⬅️ Returning to Home')
              setCurrentScreen("home")
            }
          }}
          onViewProfile={() => {
            console.log('👤 Viewing match profile from chat')
            // ✅ FIX: Set matchedUser from selectedMatch if not already set
            if (!matchedUser && selectedMatch) {
              setMatchedUser(selectedMatch)
            }
            // ✅ NEW: Check if this is a read-only view (expired match)
            // If there's no active match timer, it's read-only
            if (!matchExpiresAt || matchExpiresAt < new Date()) {
              console.log('📖 Match expired - showing read-only profile')
              setIsViewingProfileFromChat(true)
            } else {
              setIsViewingProfileFromChat(false)
            }
            // ✅ HERMETIC: We go to "match" for profile view
            // The match screen knows to return to enjoy-mode via isInEnjoyModeSession
            setCurrentScreen("match")
            setIsNewMatch(false)
          }}
        />
      )}
      
      {/* ✅ FALLBACK: Chat screen without selectedMatch - redirect to home */}
      {currentScreen === "chat" && !selectedMatch && (
        <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#0a1f18] to-[#050d0a] flex flex-col items-center justify-center p-6">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-bold text-white mb-2">Chat Unavailable</h2>
          <p className="text-white/60 text-center mb-6">This chat is no longer available or the match has ended.</p>
          <button
            onClick={() => setCurrentScreen("home")}
            className="px-6 py-3 bg-[#4ade80] text-[#0d2920] font-bold rounded-full"
          >
            Back to Home
          </button>
        </div>
      )}
      
      {/* ✅ NEW: Enjoy Mode Screen - After they confirm meeting */}
      {currentScreen === "enjoy-mode" && matchedUser && meetingStartedAt && (
        <EnjoyModeScreen
          meetingStartedAt={meetingStartedAt}
          partnerName={matchedUser.name || matchedUser.displayName || "Your match"}
          partnerPhoto={matchedUser.photos?.[0] || matchedUser.photoURL || "/placeholder.jpg"}
          matchId={currentMatchId || (user ? createMatchId(user.uid, matchedUser.uid) : "")}
          cooldownMinutes={20}
          currentUserGender={onboardingData.gender || 'male'}
          onOpenChat={handleOpenChatFromEnjoyMode}
          onOpenProfile={() => {
            console.log('👤 Opening own profile from Enjoy Mode')
            setCurrentScreen("profile")
          }}
          onExit={handleEnjoyModeExit}
        />
      )}
      
      {/* ✅ FALLBACK: Enjoy mode without matchedUser - show loading or redirect */}
      {/* ✅ v2.8.20 FIX: Don't show fallback if we have pendingFeedback (transitioning to feedback screen) */}
      {/* ✅ v2.8.26 FIX: Auto-redirect instead of showing button - prevents iOS race condition */}
      {currentScreen === "enjoy-mode" && (!matchedUser || !meetingStartedAt) && !pendingFeedback && (
        <EnjoyModeFallback 
          onTimeout={() => {
            console.log('⚠️ Enjoy mode fallback timeout - returning to home')
            setMeetingStartedAt(null)
            setCurrentScreen("home")
          }}
        />
      )}

      {/* ✅ NEW: Meeting Feedback Screen - After Enjoy Mode ends */}
      {currentScreen === "meeting-feedback" && pendingFeedback && (
        <MeetingFeedbackScreen
          partnerName={pendingFeedback.partnerName}
          partnerPhoto={pendingFeedback.partnerPhoto}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleFeedbackSkip}
        />
      )}
      
      {/* ✅ FALLBACK: Meeting feedback without pending data - render nothing, useEffect will redirect */}
      {/* ✅ v2.8.21 FIX: Don't show any UI - redirect handled by useEffect below */}
      {currentScreen === "meeting-feedback" && !pendingFeedback && null}

      {/* Profile Screen - with scroll wrapper */}
      {currentScreen === "profile" && user && (
        <div 
          className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >
          <ProfileScreen
            onNavigate={handleProfileNavigate}
            hasActiveMatch={!!(matchedUser && (timeRemaining > 0 || meetingStartedAt))}
          />
        </div>
      )}

      {/* Notifications Screen - with scroll wrapper */}
      {currentScreen === "notifications" && user && (
        <div 
          className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >
          <NotificationsScreen
            onNavigate={handleNotificationsNavigate}
            onNotificationClick={handleNotificationClick}
          />
        </div>
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
                    {/* 🎟️ Coupon Code Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setShowCouponModal('premium')}
                        className="w-full h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white font-bold text-base rounded-xl border-2 border-purple-400/50 relative overflow-hidden"
                      >
                        <Gift className="mr-2 h-5 w-5 text-purple-400" />
                        🎟️ יש לי קוד קופון
                      </Button>
                    </motion.div>
                    
                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-white/20" />
                      <span className="text-white/40 text-sm">או</span>
                      <div className="flex-1 h-px bg-white/20" />
                    </div>

                    {/* Weekly Premium Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => handleStripeCheckout('weekly')}
                        disabled={paymentLoading !== null}
                        className="w-full h-14 bg-gradient-to-r from-[#4ade80]/80 to-[#22c55e]/80 hover:from-[#4ade80] hover:to-[#22c55e] text-[#0d2920] font-bold text-lg rounded-xl shadow-lg relative overflow-hidden disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        {paymentLoading === 'weekly' ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-[#0d2920] border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <>
                            <Zap className="mr-2 h-5 w-5" />
                            Weekly Premium - $4.90/week
                          </>
                        )}
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
                        onClick={() => handleStripeCheckout('monthly')}
                        disabled={paymentLoading !== null}
                        className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg rounded-xl shadow-lg relative overflow-hidden border-2 border-[#f59e0b]/50 disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        {paymentLoading === 'monthly' ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-[#0d2920] border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <>
                            <Crown className="mr-2 h-5 w-5" />
                            Monthly Premium - $9.90/month
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {/* Get Bonus Pass Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => handleStripeCheckout('skip-timer')}
                        disabled={paymentLoading !== null}
                        className="w-full h-14 bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] font-bold text-lg rounded-xl border-2 border-[#4ade80]/50 relative overflow-hidden disabled:opacity-50"
                      >
                        {paymentLoading === 'skip-timer' ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Get 1 Pass - $2.90
                          </>
                        )}
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

      {/* ✅ NEW: Payment Success Modal - Hollywood Style! */}
      <AnimatePresence>
        {showPaymentSuccess.isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
              onClick={() => setShowPaymentSuccess({ isVisible: false, plan: null })}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="fixed inset-0 flex items-center justify-center z-[101] p-4"
            >
              <div className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-[#4ade80]/30 relative overflow-hidden">
                {/* Confetti Effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        y: -20, 
                        x: Math.random() * 300 - 150,
                        rotate: 0,
                        opacity: 1 
                      }}
                      animate={{ 
                        y: 400, 
                        rotate: Math.random() * 360,
                        opacity: 0 
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 0.5,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2
                      }}
                      className="absolute text-2xl"
                      style={{ left: `${Math.random() * 100}%` }}
                    >
                      {['🎉', '✨', '💎', '🦎', '💚', '⭐'][Math.floor(Math.random() * 6)]}
                    </motion.div>
                  ))}
                </div>
                
                {/* Success Icon */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
                  className="flex justify-center mb-6"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center shadow-lg shadow-[#4ade80]/30">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Check className="h-12 w-12 text-[#0d2920]" strokeWidth={3} />
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Title */}
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-black text-white text-center mb-2"
                >
                  Payment Successful!
                </motion.h2>
                
                {/* Subtitle based on plan */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[#4ade80] text-center text-lg mb-6"
                >
                  {showPaymentSuccess.plan === 'weekly' && '🌟 Weekly Premium Activated!'}
                  {showPaymentSuccess.plan === 'monthly' && '👑 Monthly Premium Activated!'}
                  {showPaymentSuccess.plan === 'skip-timer' && '🎫 1 Pass Added!'}
                </motion.p>
                
                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/5 rounded-xl p-4 mb-6"
                >
                  {(showPaymentSuccess.plan === 'weekly' || showPaymentSuccess.plan === 'monthly') ? (
                    <ul className="space-y-2 text-white/80">
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#4ade80]" />
                        <span>Unlimited matches</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#4ade80]" />
                        <span>No waiting time</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-[#4ade80]" />
                        <span>Priority matching</span>
                      </li>
                    </ul>
                  ) : (
                    <p className="text-white/80 text-center">
                      You now have <span className="text-[#4ade80] font-bold">1 extra pass</span> to find your match!
                    </p>
                  )}
                </motion.div>
                
                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={() => {
                      setShowPaymentSuccess({ isVisible: false, plan: null })
                      // Reload user data one more time
                      if (user) {
                        getUserPassData(user.uid).then(passData => {
                          setPassesLeft(passData.passesLeft)
                          setIsPremium(passData.isPremium)
                          setIsPhoneLocked(false)
                        })
                      }
                    }}
                    className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg rounded-xl shadow-lg"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Start Matching!
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ NEW: Venue Selection Screen - Shown after onboarding if no venue check-in */}
      <VenueSelectionScreen
        isOpen={showVenueSelection}
        onClose={() => {
          setShowVenueSelection(false)
          // ✅ If user closes without selecting venue and not checked in, go back to mode selection
          if (!isCheckedIn && !checkInData && appMode === 'venue') {
            console.log('🔙 No venue selected - back to mode selection')
            handleBackToModeSelection()
          }
        }}
        onSelectVenue={handleVenueSelection}
        userLocation={userLocationForVenues}
        onRequestLocation={requestLocationForVenues}
      />

      {/* ✅ Match Ended Screen - 5 seconds with two-phase animation */}
      <MatchEndedScreen
        isVisible={showMatchEnded}
        onComplete={() => {
          setShowMatchEnded(false)
          
          // ✅ v2.8.22 FIX: NO feedback when match timer expires!
          // Feedback is ONLY shown after Cooling (enjoy-mode) ends.
          // Match timer expiring = they never met = no feedback needed.
          console.log('⏰ Match timer expired - returning to home (no feedback)')
          setMatchedUser(null)
          setIsLockedInMatch(false)
          setMatchExpiresAt(null)
          setMatchCreatedAt(null)
          setCurrentMatchId("")
          setCurrentScreen("home")
        }}
        duration={5000}
        reason="deleted"
        matchName={matchedUser?.name || matchedUser?.displayName}
      />

      {/* ✅ NEW: "We're Meeting!" Modal - shown when partner clicks the button */}
      <WeAreMeetingModal
        isOpen={showWeAreMeeting}
        onClose={async () => {
          // ✅ v2.8.26 FIX iOS: Check minimum display time
          const timeSinceOpen = Date.now() - weAreMeetingOpenedAtRef.current
          console.log('═══════════════════════════════════════════════════════')
          console.log('🎉 AWESOME CLICKED - WeAreMeetingModal onClose STARTING!')
          console.log(`   Time since modal opened: ${timeSinceOpen}ms`)
          console.log('═══════════════════════════════════════════════════════')
          
          // ✅ v2.8.26 FIX iOS: Block if modal opened too recently
          const MINIMUM_DISPLAY_TIME = 1500
          if (timeSinceOpen < MINIMUM_DISPLAY_TIME) {
            console.log(`🚫 BLOCKED in page.tsx: Modal must be open for ${MINIMUM_DISPLAY_TIME}ms, only ${timeSinceOpen}ms passed`)
            return
          }
          
          // ✅ v2.8.20 FIX: Reset isPartnerReadyToMeet FIRST to prevent modal from reopening!
          console.log('🔒 [v2.8.20] Resetting isPartnerReadyToMeet to false in WeAreMeetingModal onClose')
          setIsPartnerReadyToMeet(false)
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
          
          // ✅ UPDATED: Go to Enjoy Mode instead of home!
          console.log('💕 We Are Meeting modal closed - entering Enjoy Mode!')
          
          // ✅ FIX: Reset match lock state since they're actually meeting!
          setIsMatchLocked(false)
          setShowPremiumPaywall(false)
          
          // ✅ CRITICAL FIX: Set up matchedUser from meetingPartnerInfo
          // This is needed for Enjoy Mode screen to work!
          if (meetingPartnerInfo && meetingPartnerInfo.uid && !matchedUser) {
            console.log('📍 Setting matchedUser from meetingPartnerInfo:', meetingPartnerInfo.uid)
            setMatchedUser({
              uid: meetingPartnerInfo.uid,
              name: meetingPartnerInfo.name,
              displayName: meetingPartnerInfo.name,
              photos: meetingPartnerInfo.photo ? [meetingPartnerInfo.photo] : [],
              photoURL: meetingPartnerInfo.photo || '',
            })
          } else if (!matchedUser) {
            // ✅ Fallback: Try to get from inAppNotification
            const notificationFromUserId = inAppNotification?.fromUserId
            if (notificationFromUserId) {
              console.log('📍 Setting matchedUser from inAppNotification:', notificationFromUserId)
              setMatchedUser({
                uid: notificationFromUserId,
                name: meetingPartnerInfo?.name || 'Your match',
                displayName: meetingPartnerInfo?.name || 'Your match',
                photos: meetingPartnerInfo?.photo ? [meetingPartnerInfo.photo] : [],
                photoURL: meetingPartnerInfo?.photo || '',
              })
            } else {
              console.error('❌ Cannot set matchedUser - no uid available!')
              console.error('   meetingPartnerInfo:', meetingPartnerInfo)
              console.error('   inAppNotification:', inAppNotification)
            }
          } else {
            console.log('📍 matchedUser already set:', matchedUser?.uid)
          }
          
          setMeetingStartedAt(new Date())  // Start 20-minute countdown
          setIsLockedInMatch(false)
          setMatchExpiresAt(null)
    setMatchCreatedAt(null)  // ✅ Clear match creation time
    setCurrentMatchId("")  // ✅ v2.8.5: Clear match ID
          setIsInEnjoyModeSession(true)  // ✅ FIXED: Track that we're in enjoy mode session!
          
          // ✅ v2.8.26 FIX iOS: Defer screen transition to ensure state is updated first
          // iOS Safari can render before React state updates are applied
          console.log('🚀 SETTING SCREEN TO enjoy-mode NOW!')
          requestAnimationFrame(() => {
            setTimeout(() => {
              setCurrentScreen("enjoy-mode")  // ✅ Go to Enjoy Mode!
              console.log('═══════════════════════════════════════════════════════')
              console.log('🎉 AWESOME - onClose COMPLETED! Screen should be enjoy-mode')
              console.log('═══════════════════════════════════════════════════════')
            }, 50)  // Small delay for iOS
          })
        }}
        partnerName={meetingPartnerInfo?.name}
        partnerPhoto={meetingPartnerInfo?.photo}
      />

      {/* ✅ NEW: Partner Left Meeting Modal */}
      <AnimatePresence>
        {showPartnerLeftMeeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-sm w-full border border-[#4ade80]/30 shadow-2xl text-center"
            >
              {/* Emoji */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="text-6xl mb-4"
              >
                👋
              </motion.div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('meetingEnded.title')}
              </h2>
              
              {/* Message */}
              <p className="text-white/70 mb-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('meetingEnded.partnerLeft').replace('{name}', partnerInfoWhenLeft?.partnerName || matchedUser?.name || matchedUser?.displayName || 'Your match')}
                <br />
                <span className="text-[#4ade80]/80">{t('meetingEnded.nextTime')} 🦎</span>
              </p>
              
              {/* Button */}
              <Button
                onClick={() => {
                  console.log('💔 Partner left - going straight home (no feedback)')
                  setShowPartnerLeftMeeting(false)
                  
                  // ✅ v2.8.26 NEW LOGIC: Partner left = you're disappointed = NO feedback!
                  // Just go home, don't ask for feedback when someone cancelled on you
                  console.log('💔 Partner cancelled on you - skipping feedback, going home')
                  setMeetingStartedAt(null)
                  setMatchedUser(null)
                  setIsInEnjoyModeSession(false)
                  localStorage.removeItem('i4iguana_enjoy_mode')
                  setCurrentScreen("home")
                  
                  // ✅ Clear saved state
                  setWasInEnjoyModeWhenPartnerLeft(false)
                  setPartnerInfoWhenLeft(null)
                }}
                className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg rounded-xl shadow-lg"
              >
                <Home className={isRTL ? 'ml-2 h-5 w-5' : 'mr-2 h-5 w-5'} />
                {t('meetingEnded.backToHome')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NEW: Venue Disconnected Notification */}
      <AnimatePresence>
        {showVenueDisconnected && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-[200] pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-4 shadow-2xl border-2 border-orange-400/50 pointer-events-auto max-w-md mx-auto"
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="text-4xl animate-bounce">📍</div>
                <div className="flex-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <h3 className="text-white font-bold text-lg">{t('venueDisconnected.title')}</h3>
                  <p className="text-white/80 text-sm">
                    {t('venueDisconnected.message')}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-2xl"
                >
                  🦎
                </motion.div>
              </div>
              
              {/* Progress bar for auto-dismiss */}
              <motion.div 
                className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4, ease: "linear" }}
                  className="h-full bg-white/60 rounded-full"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <h2 className="text-xl font-bold text-white" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('venueStatus.title')}</h2>
              </div>

              {/* Venue Info */}
              <div className="space-y-3 mb-4">
                <div className="bg-[#0d2920]/50 rounded-xl p-3 border border-[#4ade80]/20">
                  <p className="text-[#4ade80]/60 text-xs mb-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('venueStatus.location')}</p>
                  <p className="text-white font-semibold">{checkInData.venueDisplayName || checkInData.venueName}</p>
                </div>

                <div className="bg-[#0d2920]/50 rounded-xl p-3 border border-[#4ade80]/20">
                  <p className="text-[#4ade80]/60 text-xs mb-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('venueStatus.checkedIn')}</p>
                  <p className="text-white font-semibold">
                    {checkInData.checkedInAt ? (checkInData.checkedInAt instanceof Date ? checkInData.checkedInAt : (checkInData.checkedInAt as any).toDate?.() || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>

                <div className="bg-[#0d2920]/50 rounded-xl p-3 border border-[#4ade80]/20">
                  <p className="text-[#4ade80]/60 text-xs mb-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('venueStatus.autoCheckout')}</p>
                  <p className="text-white font-semibold">
                    {checkInData.expiresAt ? (checkInData.expiresAt instanceof Date ? checkInData.expiresAt : (checkInData.expiresAt as any).toDate?.() || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  onClick={() => setShowVenueStatus(false)}
                  className="flex-1 bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] border border-[#4ade80]/30"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {t('venueStatus.close')}
                </Button>
                <Button
                  onClick={() => {
                    setShowVenueStatus(false)
                    setShowVenueSelection(true)  // ✅ CHANGED: Open venue selection instead of scan
                  }}
                  className="flex-1 bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920]"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {t('venueStatus.changeVenue')}
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
            // ✅ Close OUT OF PASSES modal after successful redemption
            setShowOutOfPasses(false)
            // ✅ NEW: Also unlock the match if we're on match screen
            if (isMatchLocked && matchedUser && user) {
              setIsMatchLocked(false)
              setShowPremiumPaywall(false)
              // ✅ CRITICAL: Also unlock in Firestore!
              try {
                await unlockMatchForUser(user.uid, matchedUser.uid || matchedUser.id)
                console.log('🔓 Match unlocked in Firestore!')
              } catch (err) {
                console.error('❌ Error unlocking match in Firestore:', err)
              }
              console.log('🔓 Match unlocked via coupon!')
            }
          }
        }}
      />
      
      {/* ✅ NEW: Premium Paywall Modal - shows when match is LOCKED (second match onwards) */}
      {/* ✅ v2.8.20: Paywall shows BEFORE swipe, not during match! */}
      <PremiumPaywallModal
        isOpen={showPremiumPaywall}
        onClose={() => {
          setShowPremiumPaywall(false)
          // User can wait for reset or upgrade later
        }}
        resetTime={passResetTime}
        matchesUsed={freeMatchesUsedToday}
        matchesLimit={PASS_CONFIG.FREE_MATCHES_LIMIT}
        onSelectPlan={async (plan) => {
          console.log(`💳 User selected plan: ${plan}`)
          // Show coupon modal for payment
          if (plan === 'pass') {
            setShowPremiumPaywall(false)
            setShowCouponModal('pass')
          } else {
            setShowPremiumPaywall(false)
            setShowCouponModal('premium')
          }
        }}
      />
      
      {/* ✅ NEW: Push Notification Permission Modal */}
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        userId={user?.uid || ''}
        onPermissionGranted={() => {
          console.log('✅ Notification permission granted!')
          setShowNotificationModal(false)
        }}
        onPermissionDenied={() => {
          console.log('❌ Notification permission denied')
          setShowNotificationModal(false)
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
              uid: inAppNotification.fromUserId || '',  // ✅ CRITICAL: Include uid!
              name: inAppNotification.senderName || 'Your match',
              photo: inAppNotification.senderPhoto || ''
            })
            weAreMeetingOpenedAtRef.current = Date.now()  // ✅ v2.8.26: Track open time
            setShowWeAreMeeting(true)
          } else if (inAppNotification.type === 'match' && inAppNotification.fromUserId) {
            // ✅ v2.8.26 FIX: Handle MATCH notifications - go to MATCH SCREEN!
            console.log('💕 Opening MATCH SCREEN from notification')
            
            try {
              // Load the sender's profile
              const senderProfile = await getUserProfile(inAppNotification.fromUserId)
              
              const matchData = senderProfile ? {
                uid: inAppNotification.fromUserId,
                name: senderProfile.name || senderProfile.displayName || 'User',
                displayName: senderProfile.name || senderProfile.displayName || 'User',
                photos: senderProfile.photos || [],
                photoURL: senderProfile.photoURL || '',
                gender: senderProfile.gender,
                age: senderProfile.age,
                bio: senderProfile.bio,
                distance: 'nearby'
              } : {
                uid: inAppNotification.fromUserId,
                name: inAppNotification.senderName || 'User',
                displayName: inAppNotification.senderName || 'User',
                photos: inAppNotification.senderPhoto ? [inAppNotification.senderPhoto] : [],
                photoURL: inAppNotification.senderPhoto || '',
                distance: 'nearby'
              }
              
              setMatchedUser(matchData as any)
              setSelectedMatch(matchData as any)
              
              // Get match expiration
              if (user) {
                const matchExpiration = await getActiveMatchExpiration(user.uid, inAppNotification.fromUserId)
                if (matchExpiration) {
                  setMatchExpiresAt(matchExpiration)
                  setIsLockedInMatch(true)
                }
              }
              
              // ✅ Go to MATCH SCREEN, not chat!
              setCurrentScreen('match')
              console.log('✅ Navigated to match screen from notification')
              
            } catch (error) {
              console.error('❌ Error loading match from notification:', error)
              // Fallback - still go to match screen
              setMatchedUser({
                uid: inAppNotification.fromUserId,
                name: inAppNotification.senderName || 'User',
                displayName: inAppNotification.senderName || 'User',
                photos: inAppNotification.senderPhoto ? [inAppNotification.senderPhoto] : [],
                photoURL: inAppNotification.senderPhoto || '',
                distance: 'nearby'
              } as any)
              setCurrentScreen('match')
            }
          } else if (inAppNotification.chatId && inAppNotification.fromUserId) {
            console.log('💬 Opening chat from notification:', inAppNotification.chatId)
            
            // ✅ CRITICAL: Check if user is LOCKED before allowing chat access!
            if (user) {
              const isLocked = await isUserLockedOnMatch(user.uid, inAppNotification.fromUserId)
              if (isLocked) {
                console.log('🔒 User is LOCKED - redirecting to paywall instead of chat!')
                
                // Load sender profile for match screen
                try {
                  const senderProfile = await getUserProfile(inAppNotification.fromUserId)
                  const matchData = senderProfile ? {
                    uid: inAppNotification.fromUserId,
                    name: senderProfile.name || senderProfile.displayName || 'User',
                    displayName: senderProfile.name || senderProfile.displayName || 'User',
                    photos: senderProfile.photos || [],
                    photoURL: senderProfile.photoURL || '',
                    distance: 'nearby'
                  } : {
                    uid: inAppNotification.fromUserId,
                    name: inAppNotification.senderName || 'User',
                    displayName: inAppNotification.senderName || 'User',
                    photos: inAppNotification.senderPhoto ? [inAppNotification.senderPhoto] : [],
                    photoURL: inAppNotification.senderPhoto || '',
                    distance: 'nearby'
                  }
                  
                  setMatchedUser(matchData as any)
                  setSelectedMatch(matchData as any)
                  
                  // Get match expiration
                  const matchExpiration = await getActiveMatchExpiration(user.uid, inAppNotification.fromUserId)
                  setMatchExpiresAt(matchExpiration)
                  
                } catch (err) {
                  console.error('Error loading sender profile:', err)
                }
                
                setIsMatchLocked(true)
                setIsLockedInMatch(true)
                setCurrentScreen('match')
                setTimeout(() => {
                  setShowPremiumPaywall(true)
                }, 500)
                return  // Don't continue to chat!
              }
            }
            
            // ✅ Not locked - continue to chat normally
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
