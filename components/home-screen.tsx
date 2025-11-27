"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Heart, MessageCircle, Bell, User as UserIcon, RefreshCw, Target } from "lucide-react"
import DatingCard from "./dating-card"
import AvailableToggle from "./available-toggle"
import HiddenState from "./hidden-state"
import SearchSettingsModal from "./search-settings-modal"  // ✅ NEW
import { useAuth } from "@/lib/AuthContext"
import { useAvailableStatus } from "@/lib/useAvailableStatus"
import { getUserProfile, updateUserPreferences } from "@/lib/firestore-service"  // ✅ NEW

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
  onShowVenueStatus  // ✅ NEW: Show venue details modal
}: HomeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [showSearchSettings, setShowSearchSettings] = useState(false)  // ✅ NEW: Renamed from showDistanceModal
  
  // ✅ NEW: Load user preferences
  const [searchPreferences, setSearchPreferences] = useState({
    radius: maxDistance || 500,
    ageRange: [18, 80] as [number, number],
    lookingFor: 'both' as 'male' | 'female' | 'both',
    expandSearch: false
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
            expandSearch: profile.preferences.expandSearch || false
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
    setDirection(swipeDirection)

    // If swiped right and there's a match callback
    if (swipeDirection === 'right' && onMatch && currentUser) {
      onMatch(currentUser)
    }
    
    // ✅ CRITICAL FIX: Save PASS to Firestore so user doesn't see profile again!
    if (swipeDirection === 'left' && onPass && currentUser) {
      console.log(`❌ User passed on ${currentUser.name} - saving to Firestore`)
      onPass(currentUser)
    }

    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setDirection(null)
    }, 300)
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

  // ✅ NEW: Handle search settings save
  const handleSaveSettings = async (settings: {
    radius: number
    ageRange: [number, number]
    lookingFor: 'male' | 'female' | 'both'
    expandSearch: boolean
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
        expandSearch: settings.expandSearch
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
    <div className="flex h-screen flex-col bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] overflow-hidden">
      {/* Top Bar - Hollywood Clean Design */}
      <div className="flex items-center justify-between px-3 py-3 bg-[#0d2920]/50 border-b border-[#4ade80]/20">
        {/* Left: Iguana Scan QR only */}
        <div className="flex items-center flex-shrink-0 w-12">
          {/* Iguana with Scan QR - ALWAYS visible */}
          {onScan ? (
            <div className="relative">
              {/* ✅ First-time user hint (only for first-timers) */}
              {showQRHint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-[#4ade80] text-[#0d2920] px-4 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <span className="text-sm font-bold">סרוק QR code להתחברות למקום</span>
                  </div>
                  {/* Arrow pointing down */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#4ade80]"></div>
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
                {/* ✅ Iguana with side-to-side animation */}
                <motion.div
                  animate={{ 
                    x: [-3, 3, -3],  // Side to side
                    rotate: [0, -5, 5, -5, 0]  // Slight rotation
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-2xl"
                >
                  🦎
                </motion.div>
                {/* ✅ Text - always visible, small and elegant */}
                <span className="text-[8px] font-semibold tracking-wider text-[#4ade80]/90 uppercase">
                  Scan
                </span>
              </motion.button>
            </div>
          ) : (
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-3xl"
            >
              🦎
            </motion.div>
          )}
        </div>
        
        {/* Center: Title + Venue Badge */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <h1 className="font-sans text-xl font-bold text-white">I4IGUANA</h1>
          
          {/* ✅ Venue Indicator - compact dot only when checked in */}
          {venueData && (
            <motion.button
              onClick={onShowVenueStatus}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 bg-[#4ade80]/20 px-2 py-0.5 rounded-full border border-[#4ade80]/30"
              title={venueData.venueName}
            >
              <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
              <span className="text-[9px] font-semibold text-[#4ade80] max-w-[60px] truncate">
                {venueData.venueName.split(' - ')[0]}
              </span>
            </motion.button>
          )}
        </div>
        
        {/* Right: Available + Settings + Refresh - Hollywood sizing */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ✅ Available Toggle - smaller */}
          <AvailableToggle
            isAvailable={isAvailable}
            onToggle={handleToggleAvailable}
            disabled={availableLoading}
          />
          {/* ✅ Search Settings - larger */}
          <button
            onClick={() => setShowSearchSettings(true)}
            className="p-2.5 rounded-full bg-[#4ade80]/20 hover:bg-[#4ade80]/30 transition-colors border border-[#4ade80]/30"
            title="Search Settings"
          >
            <Target className="h-5 w-5 text-[#4ade80]" />
          </button>
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
              <h2 className="text-2xl font-bold text-white mb-4">
                Searching for nearby users...
              </h2>
              <p className="text-white/60">
                We're scanning your area
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
              <h2 className="text-3xl font-bold text-white mb-4">
                No More Profiles
              </h2>
              <p className="text-white/60 mb-6">
                {nearbyUsers.length === 0 
                  ? "No nearby users right now. Check back soon!"
                  : "You've seen everyone nearby! Check back later for new people."}
              </p>
              <Button
                onClick={handleStartOver}
                className="bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold px-8 py-6 text-lg"
              >
                Refresh
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                x: direction === 'left' ? -500 : direction === 'right' ? 500 : 0,
                opacity: 0,
                rotate: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
                transition: { duration: 0.3 }
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

      {/* Action Buttons */}
      {!noMoreUsers && !loading && isAvailable && (
        <div className="flex items-center justify-center gap-6 p-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('left')}
            disabled={isLocked}
            className="h-16 w-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center hover:bg-red-500/30 transition-all shadow-lg disabled:opacity-50"
          >
            <X className="h-8 w-8 text-red-500" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('right')}
            disabled={isLocked}
            className="h-20 w-20 rounded-full bg-[#4ade80]/30 border-4 border-[#4ade80] flex items-center justify-center hover:bg-[#4ade80]/40 transition-all shadow-xl disabled:opacity-50"
          >
            <Heart className="h-10 w-10 text-[#4ade80]" fill="currentColor" />
          </motion.button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-around p-3 bg-[#0d2920]/80 border-t border-[#4ade80]/20">
        <button
          onClick={() => onNavigate("home")}
          className="flex flex-col items-center gap-1"
        >
          <div className="text-2xl">🦎</div>
          <span className="text-xs text-[#4ade80] font-semibold">Home</span>
        </button>

        <button
          onClick={() => onNavigate("notifications")}
          className="flex flex-col items-center gap-1"
        >
          <Bell className="h-6 w-6 text-white/60" />
          <span className="text-xs text-white/60">Notifications</span>
        </button>

        {hasActiveMatch && (
          <button
            onClick={() => onNavigate("chat")}
            className="flex flex-col items-center gap-1 relative"
          >
            <MessageCircle className="h-6 w-6 text-[#4ade80]" />
            <span className="text-xs text-[#4ade80] font-semibold">Chats</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4ade80] rounded-full border-2 border-[#0d2920] animate-pulse" />
          </button>
        )}

        <button
          onClick={() => onNavigate("profile")}
          className="flex flex-col items-center gap-1"
        >
          <UserIcon className="h-6 w-6 text-white/60" />
          <span className="text-xs text-white/60">Profile</span>
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
        onSave={handleSaveSettings}
      />
    </div>
  )
}