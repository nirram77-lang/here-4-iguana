"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Heart, MessageCircle, Bell, User as UserIcon, RefreshCw, Target, Map, Building2 } from "lucide-react"
import DatingCard from "./dating-card"
import AvailableToggle from "./available-toggle"
import HiddenState from "./hidden-state"
import SearchSettingsModal from "./search-settings-modal"  // ✅ NEW
import DebugPanel from "./debug-panel"  // ✅ NEW: Debug panel for pilot testing
import { useAuth } from "@/lib/AuthContext"
import { useAvailableStatus } from "@/lib/useAvailableStatus"
import { getUserProfile, updateUserPreferences } from "@/lib/firestore-service"  // ✅ NEW
import { useLanguage } from "@/lib/LanguageContext"

interface HomeScreenProps {
  onNavigate: (screen: "home" | "notifications" | "profile" | "chat") => void
  onMatch?: (user: any) => void
  onPass?: (user: any) => void  // ✅ NEW: Save pass to Firestore
  nearbyUsers?: any[]
  loading?: boolean
  onRefresh?: () => void
  isLocked?: boolean
  passesLeft?: number
  isPremium?: boolean
  maxDistance?: number
  onMaxDistanceChange?: (distance: number) => void
  hasActiveMatch?: boolean
  onScan?: () => void  // ✅ NEW: Open QR scanner
  venueData?: {  // ✅ NEW: Current venue info
    venueName: string
    checkedInAt: Date
    expiresAt: Date
  } | null
  onShowVenueStatus?: () => void  // ✅ NEW: Show venue details modal
  onSwitchMode?: () => void  // ✅ NEW: Switch between Venue/Zone mode
  appMode?: 'venue' | 'zone' | null  // ✅ NEW: Current app mode
}

export default function HomeScreen({
  onNavigate,
  onMatch,
  onPass,  // ✅ NEW: Save pass to Firestore
  nearbyUsers = [],
  loading = false,
  onRefresh,
  isLocked = false,
  passesLeft = 1,
  isPremium = false,
  maxDistance = 500,
  onMaxDistanceChange,
  hasActiveMatch = false,
  onScan,  // ✅ NEW: QR Scanner callback
  venueData,  // ✅ NEW: Current venue info
  onShowVenueStatus,  // ✅ NEW: Show venue details modal
  onSwitchMode,  // ✅ NEW: Switch between Venue/Zone mode
  appMode  // ✅ NEW: Current app mode
}: HomeScreenProps) {
  const { t, isRTL } = useLanguage()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [showSearchSettings, setShowSearchSettings] = useState(false)  // ✅ NEW: Renamed from showDistanceModal
  const [showDebugPanel, setShowDebugPanel] = useState(false)  // ✅ NEW: Debug panel for pilot
  
  // ✅ v2.8.26 FIX: Track previous real user IDs to detect NEW real users
  const prevRealUserIdsRef = useRef<Set<string>>(new Set())
  
  // ✅ v2.8.26 FIX: Reset index when NEW real users appear (priority over dummies!)
  useEffect(() => {
    // Get current real user IDs (non-dummy)
    const currentRealUserIds = new Set(
      nearbyUsers
        .filter(u => !u.isDummy && !u.uid?.startsWith('dummy_'))
        .map(u => u.uid)
    )
    
    // Check if there are NEW real users that weren't in the previous set
    const newRealUsers: string[] = []
    currentRealUserIds.forEach(id => {
      if (!prevRealUserIdsRef.current.has(id)) {
        newRealUsers.push(id)
      }
    })
    
    // If new real users appeared, reset index to show them first!
    if (newRealUsers.length > 0 && currentIndex > 0) {
      console.log(`🚀 NEW REAL USERS DETECTED: ${newRealUsers.length} - resetting to first card!`)
      setCurrentIndex(0)
    }
    
    // Update the ref for next comparison
    prevRealUserIdsRef.current = currentRealUserIds
  }, [nearbyUsers])
  
  // ✅ NEW: Long press detection for debug panel (3 seconds)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressingRef = useRef(false)
  
  // ✅ NEW: Load user preferences
  const [searchPreferences, setSearchPreferences] = useState({
    radius: maxDistance || 500,
    ageRange: [18, 80] as [number, number],
    lookingFor: 'both' as 'male' | 'female' | 'both',
    expandSearch: false,
    smokingFilter: 'any' as 'any' | 'no' | 'no_or_social'  // ✅ NEW: Smoking filter
  })
  
  // ✅ NEW: First-time user detection for QR scan hint
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)
  const [showQRHint, setShowQRHint] = useState(false)

  // ✅ Available Now Feature
  const { user } = useAuth()
  const { isAvailable, loading: availableLoading, toggleAvailable } = useAvailableStatus(user?.uid || null)

  // ✅ NEW: Load user preferences from Firestore
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) return
      
      try {
        const profile = await getUserProfile(user.uid)
        if (profile?.preferences) {
          setSearchPreferences({
            radius: profile.preferences.maxDistance || 500,
            ageRange: profile.preferences.ageRange || [18, 80],
            lookingFor: profile.preferences.lookingFor || 'both',
            expandSearch: profile.preferences.expandSearch || false,
            smokingFilter: profile.preferences.smokingFilter || 'any'  // ✅ NEW
          })
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }
    
    loadPreferences()
  }, [user])

  // ✅ NEW: Check if user has scanned QR code before (first-time hint)
  useEffect(() => {
    const hasScannedBefore = localStorage.getItem('hasScannedQR')
    if (!hasScannedBefore && onScan) {
      setIsFirstTimeUser(true)
      setShowQRHint(true)
      
      // Hide hint after 10 seconds
      const timer = setTimeout(() => {
        setShowQRHint(false)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [onScan])

  const handleToggleAvailable = async (newState: boolean) => {
    try {
      await toggleAvailable(newState)
      // If becoming available, refresh to load users
      if (newState && onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  const currentUser = nearbyUsers[currentIndex]

  const handleSwipe = (swipeDirection: 'left' | 'right') => {
    console.log(`🔄 handleSwipe called: ${swipeDirection}`)
    console.log(`   current direction state: ${direction}`)
    
    // ✅ Prevent double-clicks during animation
    if (direction !== null) {
      console.log(`   ⚠️ BLOCKED: direction is not null (${direction})`)
      return
    }
    
    setDirection(swipeDirection)
    console.log(`   ✅ Direction set to: ${swipeDirection}`)

    // If swiped right and there's a match callback
    if (swipeDirection === 'right' && onMatch && currentUser) {
      console.log(`   💚 Calling onMatch for: ${currentUser.name}`)
      onMatch(currentUser)
    }
    
    // ✅ CRITICAL FIX: Save PASS to Firestore so user doesn't see profile again!
    if (swipeDirection === 'left' && onPass && currentUser) {
      console.log(`❌ User passed on ${currentUser.name} - saving to Firestore`)
      onPass(currentUser)
    }

    // ✅ v2.8.6 FIX: Wait for exit animation to FULLY complete
    // Exit animation is 300ms, wait 350ms to be safe
    setTimeout(() => {
      console.log(`   🔄 Clearing direction and moving to next`)
      setDirection(null)  // Clear direction FIRST
      setCurrentIndex(prev => prev + 1)  // Then update index
    }, 350)
  }

  const handleButtonSwipe = (swipeDirection: 'left' | 'right') => {
    // ✅ FIX: Unlimited swipes in home screen
    // Passes are only used when declining matches in match screen
    handleSwipe(swipeDirection)
  }

  const handleStartOver = () => {
    setCurrentIndex(0)
    if (onRefresh) {
      onRefresh()
    }
  }

  // ✅ NEW: Long press handlers for Debug Panel (3 seconds)
  const handleLongPressStart = () => {
    isLongPressingRef.current = true
    longPressTimerRef.current = setTimeout(() => {
      if (isLongPressingRef.current) {
        console.log('🐛 Debug Panel activated via long press!')
        setShowDebugPanel(true)
        // Vibrate on devices that support it
        if (navigator.vibrate) {
          navigator.vibrate(100)
        }
      }
    }, 3000) // 3 seconds long press
  }

  const handleLongPressEnd = () => {
    isLongPressingRef.current = false
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // ✅ NEW: Handle search settings save
  const handleSaveSettings = async (settings: {
    radius: number
    ageRange: [number, number]
    lookingFor: 'male' | 'female' | 'both'
    expandSearch: boolean
    smokingFilter: 'any' | 'no' | 'no_or_social'  // ✅ NEW
  }) => {
    try {
      if (!user?.uid) return
      
      // Update local state
      setSearchPreferences(settings)
      
      // Update Firestore
      await updateUserPreferences(user.uid, {
        maxDistance: settings.radius,
        ageRange: settings.ageRange,
        lookingFor: settings.lookingFor,
        expandSearch: settings.expandSearch,
        smokingFilter: settings.smokingFilter  // ✅ NEW
      })
      
      // Update parent if callback provided
      if (onMaxDistanceChange) {
        onMaxDistanceChange(settings.radius)
      }
      
      // Refresh users with new settings
      if (onRefresh) {
        onRefresh()
      }
      
      console.log('✅ Search settings saved:', settings)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Check if we've gone through all users
  const noMoreUsers = currentIndex >= nearbyUsers.length

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] overflow-hidden" 
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
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      {/* Top Bar - Hollywood Clean Design */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#0d2920]/50 border-b border-[#4ade80]/20">
        {/* Left: SCAN + Zone Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* SCAN Button - Only in Venue Mode (not in Zone Mode) */}
          {onScan && appMode !== 'zone' ? (
            <div className="relative">
              {/* ✅ First-time user hint (only for first-timers) */}
              {showQRHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-[#4ade80] text-[#0d2920] px-4 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap"
                >
                  {/* Arrow pointing UP at the button */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#4ade80]"></div>
                  <div className="flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <span className="text-xl">📍</span>
                    <span className="text-sm font-bold">{isRTL ? 'סרוק QR להתחברות למקום' : 'Scan QR to connect'}</span>
                  </div>
                </motion.div>
              )}
              
              <motion.button
                onClick={() => {
                  localStorage.setItem('hasScannedQR', 'true')
                  setShowQRHint(false)
                  setIsFirstTimeUser(false)
                  onScan()
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-0.5 cursor-pointer relative"
                animate={showQRHint ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(74, 222, 128, 0)',
                    '0 0 0 8px rgba(74, 222, 128, 0.2)',
                    '0 0 0 0 rgba(74, 222, 128, 0)'
                  ]
                } : {}}
                transition={{ duration: 2, repeat: showQRHint ? Infinity : 0 }}
              >
                <motion.div
                  animate={{ x: [-2, 2, -2], rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-xl"
                >
                  🦎
                </motion.div>
                <span className="text-[7px] font-semibold tracking-wider text-[#4ade80]/90 uppercase">
                  Scan
                </span>
              </motion.button>
            </div>
          ) : (
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl"
            >
              🦎
            </motion.div>
          )}
          
          {/* ✅ Zone Button - Luxurious Bronze/Black Round */}
          {onSwitchMode && (
            <motion.button
              onClick={onSwitchMode}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(205,127,50,0.25)',
                border: '1.5px solid rgba(205,127,50,0.5)'
              }}
              title="Switch to Zone Mode"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-full"
                animate={{
                  background: [
                    'linear-gradient(90deg, transparent 0%, rgba(205,127,50,0.15) 50%, transparent 100%)',
                    'linear-gradient(90deg, transparent 100%, rgba(205,127,50,0.2) 150%, transparent 200%)'
                  ],
                  x: ['-100%', '100%']
                }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              />
              <Map className="h-4 w-4 relative z-10" style={{ color: '#cd7f32' }} />
            </motion.button>
          )}
        </div>
        
        {/* Center: Title + Venue Badge (smaller, display only) */}
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          {/* ✅ Title - smaller, display only */}
          <h1 
            className="font-sans text-base font-bold text-white select-none cursor-pointer tracking-wide"
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onTouchCancel={handleLongPressEnd}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
          >
            I4IGUANA
          </h1>
          
          {/* ✅ Venue Indicator - compact dot only when checked in */}
          {venueData && (
            <motion.button
              onClick={onShowVenueStatus}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full border border-white/30"
              title={venueData.venueName}
            >
              <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
              <span className="text-[9px] font-bold text-[#4ade80] max-w-[50px] truncate">
                {venueData.venueName.split(' - ')[0]}
              </span>
            </motion.button>
          )}
        </div>
        
        {/* Right: Join Venue + Search + Available + Refresh - Hollywood sizing */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ✅ v2.8.6: Join a Venue Button - Zone Mode Only - Premium Style! */}
          {appMode === 'zone' && onScan && (
            <motion.button
              onClick={onScan}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(74,222,128,0.25)',
                border: '1.5px solid rgba(74,222,128,0.5)'
              }}
              title="Join a Venue"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-full"
                animate={{
                  background: [
                    'linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.2) 50%, transparent 100%)',
                    'linear-gradient(90deg, transparent 100%, rgba(74,222,128,0.3) 150%, transparent 200%)'
                  ],
                  x: ['-100%', '100%']
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
              />
              <span className="text-base relative z-10">🍸</span>
            </motion.button>
          )}
          
          {/* ✅ Search Settings - FIRST (leftmost for quick access) */}
          <button
            onClick={() => setShowSearchSettings(true)}
            className="p-2.5 rounded-full bg-[#4ade80]/20 hover:bg-[#4ade80]/30 transition-colors border border-[#4ade80]/30"
            title="Search Settings"
          >
            <Target className="h-5 w-5 text-[#4ade80]" />
          </button>
          {/* ✅ Available Toggle */}
          <AvailableToggle
            isAvailable={isAvailable}
            onToggle={handleToggleAvailable}
            disabled={availableLoading}
          />
          {/* ✅ Refresh - larger */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ✅ Hidden State - When user is not available */}
          {!isAvailable ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <HiddenState onBecomeAvailable={() => handleToggleAvailable(true)} />
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <div className="text-8xl mb-6 animate-bounce">🦎</div>
              <h2 className="text-2xl font-bold text-white mb-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('loading.searching')}
              </h2>
              <p className="text-white/60" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('loading.scanningArea')}
              </p>
            </motion.div>
          ) : noMoreUsers ? (
            <motion.div
              key="no-more"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">🦎</div>
              <h2 className="text-3xl font-bold text-white mb-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('loading.noMoreProfiles')}
              </h2>
              <p className="text-white/60 mb-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {nearbyUsers.length === 0 
                  ? t('loading.noUsersNearby')
                  : t('loading.seenEveryone')}
              </p>
              <Button
                onClick={handleStartOver}
                className="bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold px-8 py-6 text-lg"
              >
                {t('loading.refresh')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={`card-${currentIndex}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                x: direction === 'left' ? -400 : direction === 'right' ? 400 : 0,
                opacity: 0,
                rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0,
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
            >
              <DatingCard
                user={currentUser}
                onSwipe={handleSwipe}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons - ✅ v2.8.19: Fixed for iOS 12! */}
      {!noMoreUsers && !loading && isAvailable && (
        <div className="flex-shrink-0 flex items-center justify-center gap-6 p-4 pb-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onTouchStart={(e) => {
              // ✅ v2.8.19: Mark that this is a touch interaction
              (e.currentTarget as any)._isTouchEvent = true
            }}
            onTouchEnd={(e) => {
              // ✅ v2.8.19: onTouchEnd for iOS (including iOS 12!)
              e.preventDefault()
              console.log('❌ PASS onTouchEnd!')
              if (!isLocked && direction === null) {
                handleButtonSwipe('left')
              }
            }}
            onClick={(e) => {
              // ✅ v2.8.19: onClick only for non-touch (desktop)
              if ((e.currentTarget as any)._isTouchEvent) {
                (e.currentTarget as any)._isTouchEvent = false
                return // Skip - already handled by onTouchEnd
              }
              console.log('❌ PASS onClick!')
              if (!isLocked && direction === null) {
                handleButtonSwipe('left')
              }
            }}
            disabled={isLocked}
            className="h-14 w-14 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center hover:bg-red-500/30 transition-all shadow-lg disabled:opacity-50 flex-shrink-0"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            <X className="h-7 w-7 text-red-500" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onTouchStart={(e) => {
              // ✅ v2.8.19: Mark that this is a touch interaction
              (e.currentTarget as any)._isTouchEvent = true
            }}
            onTouchEnd={(e) => {
              // ✅ v2.8.19: onTouchEnd for iOS (including iOS 12!)
              e.preventDefault()
              console.log('💚 AWESOME onTouchEnd!')
              console.log('   isLocked:', isLocked)
              console.log('   direction:', direction)
              if (!isLocked && direction === null) {
                handleButtonSwipe('right')
              }
            }}
            onClick={(e) => {
              // ✅ v2.8.19: onClick only for non-touch (desktop)
              if ((e.currentTarget as any)._isTouchEvent) {
                (e.currentTarget as any)._isTouchEvent = false
                return // Skip - already handled by onTouchEnd
              }
              console.log('💚 AWESOME onClick!')
              if (!isLocked && direction === null) {
                handleButtonSwipe('right')
              }
            }}
            disabled={isLocked}
            className="h-18 w-18 rounded-full bg-[#4ade80]/30 border-4 border-[#4ade80] flex items-center justify-center hover:bg-[#4ade80]/40 transition-all shadow-xl disabled:opacity-50 flex-shrink-0"
            style={{ height: '72px', width: '72px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            <Heart className="h-9 w-9 text-[#4ade80]" fill="currentColor" />
          </motion.button>
        </div>
      )}

      {/* Bottom Navigation - ✅ v2.8.25: Fixed with safe-area */}
      <div 
        className="flex-shrink-0 flex items-center justify-around p-2 bg-[#0d2920]/90 backdrop-blur-sm border-t border-[#4ade80]/20"
        style={{
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))'
        }}
      >
        <button
          onClick={() => onNavigate("home")}
          className="flex flex-col items-center gap-1"
        >
          <div className="text-2xl">🦎</div>
          <span className="text-xs text-[#4ade80] font-semibold">{t('nav.home')}</span>
        </button>

        <button
          onClick={() => onNavigate("notifications")}
          className="flex flex-col items-center gap-1"
        >
          <Bell className="h-6 w-6 text-white/60" />
          <span className="text-xs text-white/60">{t('nav.notifications')}</span>
        </button>

        {hasActiveMatch && (
          <button
            onClick={() => onNavigate("chat")}
            className="flex flex-col items-center gap-1 relative"
          >
            <MessageCircle className="h-6 w-6 text-[#4ade80]" />
            <span className="text-xs text-[#4ade80] font-semibold">{t('nav.chats')}</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4ade80] rounded-full border-2 border-[#0d2920] animate-pulse" />
          </button>
        )}

        <button
          onClick={() => onNavigate("profile")}
          className="flex flex-col items-center gap-1"
        >
          <UserIcon className="h-6 w-6 text-white/60" />
          <span className="text-xs text-white/60">{t('nav.profile')}</span>
        </button>
      </div>

      {/* ✅ NEW: Search Settings Modal */}
      <SearchSettingsModal
        isOpen={showSearchSettings}
        onClose={() => setShowSearchSettings(false)}
        currentRadius={searchPreferences.radius}
        currentAgeRange={searchPreferences.ageRange}
        currentGender={searchPreferences.lookingFor}
        currentExpandSearch={searchPreferences.expandSearch}
        currentSmokingFilter={searchPreferences.smokingFilter}
        onSave={handleSaveSettings}
      />

      {/* ✅ NEW: Debug Panel - activated by 3-second long press on title */}
      <DebugPanel
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </div>
  )
}