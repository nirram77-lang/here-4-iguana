"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Heart, MessageCircle, Bell, User as UserIcon, RefreshCw, Target } from "lucide-react"
import DatingCard from "./dating-card"
import AvailableToggle from "./available-toggle"
import HiddenState from "./hidden-state"
import LocationPermissionModal from "./LocationPermissionModal"
import { useAuth } from "@/lib/AuthContext"
import { useAvailableStatus } from "@/lib/useAvailableStatus"

interface HomeScreenProps {
  onNavigate: (screen: "home" | "notifications" | "profile" | "chat") => void
  onMatch?: (user: any) => void
  nearbyUsers?: any[]
  loading?: boolean
  onRefresh?: () => void
  isLocked?: boolean
  passesLeft?: number
  isPremium?: boolean
  maxDistance?: number
  onMaxDistanceChange?: (distance: number) => void
}

export default function HomeScreen({
  onNavigate,
  onMatch,
  nearbyUsers = [],
  loading = false,
  onRefresh,
  isLocked = false,
  passesLeft = 1,
  isPremium = false,
  maxDistance = 500,
  onMaxDistanceChange
}: HomeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [showDistanceModal, setShowDistanceModal] = useState(false)
  const [tempDistance, setTempDistance] = useState(maxDistance)
  
  // ✅ Location Permission State
  const [showLocationModal, setShowLocationModal] = useState(true)
  const [locationGranted, setLocationGranted] = useState(false)

  // ✅ Available Now Feature
  const { user } = useAuth()
  const { isAvailable, loading: availableLoading, toggleAvailable } = useAvailableStatus(user?.uid || null)

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

  const openDistanceModal = () => {
    setTempDistance(maxDistance)
    setShowDistanceModal(true)
  }

  const applyDistance = () => {
    if (onMaxDistanceChange) {
      onMaxDistanceChange(tempDistance)
    }
    setShowDistanceModal(false)
    // Refresh to get new users with new distance
    if (onRefresh) {
      onRefresh()
    }
  }

  const formatDistance = (distance: number) => {
    if (distance < 1000) return `${distance}m`
    return `${(distance / 1000).toFixed(1)}km`
  }

  // Check if we've gone through all users
  const noMoreUsers = currentIndex >= nearbyUsers.length

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] overflow-hidden">
      {/* ✅ Location Permission Modal - Hollywood Level Design */}
      {showLocationModal && !locationGranted && (
        <LocationPermissionModal
          onPermissionGranted={() => {
            setLocationGranted(true)
            setShowLocationModal(false)
            // Refresh to load nearby users
            if (onRefresh) {
              onRefresh()
            }
          }}
          onPermissionDenied={() => {
            setShowLocationModal(false)
            // User can still use app but without location features
          }}
        />
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-[#0d2920]/50 border-b border-[#4ade80]/20">
        {/* Left: Logo */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-4xl flex-shrink-0"
        >
          🦎
        </motion.div>
        
        {/* Center: Title */}
        <h1 className="font-sans text-2xl font-bold text-white">I4IGUANA</h1>
        
        {/* Right: Available + Distance + Refresh */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ✅ Available Toggle - positioned left of distance */}
          <AvailableToggle
            isAvailable={isAvailable}
            onToggle={handleToggleAvailable}
            disabled={availableLoading}
          />
          <button
            onClick={openDistanceModal}
            className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
            title="Set search radius"
          >
            <Target className="h-5 w-5 text-[#4ade80]" />
            <span className="absolute -bottom-1 -right-1 bg-[#4ade80] text-[#0d2920] text-xs font-bold px-1.5 py-0.5 rounded-full">
              {formatDistance(maxDistance)}
            </span>
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
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
                מחפש משתמשים קרובים...
              </h2>
              <p className="text-white/60">
                אנחנו סורקים את האזור שלך
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
                  ? 'אין משתמשים קרובים כרגע. נסה שוב מאוחר יותר!'
                  : 'עברת על כל המשתמשים הקרובים!'}
              </p>
              <Button
                onClick={handleStartOver}
                className="bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold px-8 py-6 text-lg"
              >
                {nearbyUsers.length === 0 ? 'רענן' : 'התחל מחדש'}
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

        <button
          onClick={() => onNavigate("chat")}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="h-6 w-6 text-white/60" />
          <span className="text-xs text-white/60">Chats</span>
        </button>

        <button
          onClick={() => onNavigate("profile")}
          className="flex flex-col items-center gap-1"
        >
          <UserIcon className="h-6 w-6 text-white/60" />
          <span className="text-xs text-white/60">Profile</span>
        </button>
      </div>

      {/* Distance Range Modal */}
      <AnimatePresence>
        {showDistanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDistanceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-md w-full border-2 border-[#4ade80]/30 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Search Radius
                </h2>
                <p className="text-white/60 text-sm">
                  Find matches within your preferred distance
                </p>
              </div>

              {/* Distance Display */}
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-[#4ade80] mb-2">
                  {formatDistance(tempDistance)}
                </div>
                <p className="text-white/40 text-sm">
                  {tempDistance >= 1000 ? 'Wide search area' : 'Nearby matches only'}
                </p>
              </div>

              {/* Slider */}
              <div className="mb-8">
                <div className="relative py-2">
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={tempDistance}
                    onChange={(e) => setTempDistance(Number(e.target.value))}
                    className="w-full appearance-none cursor-pointer bg-transparent
                      [&::-webkit-slider-track]:h-2
                      [&::-webkit-slider-track]:rounded-lg
                      [&::-webkit-slider-track]:bg-white/10
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-6
                      [&::-webkit-slider-thumb]:h-6
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-[#4ade80]
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-white
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:transition-all
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-moz-range-track]:h-2
                      [&::-moz-range-track]:rounded-lg
                      [&::-moz-range-track]:bg-white/10
                      [&::-moz-range-thumb]:w-6
                      [&::-moz-range-thumb]:h-6
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-[#4ade80]
                      [&::-moz-range-thumb]:border-2
                      [&::-moz-range-thumb]:border-white
                      [&::-moz-range-thumb]:shadow-lg
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:transition-all
                      [&::-moz-range-thumb]:hover:scale-110
                      [&::-moz-range-thumb]:border-none"
                    style={{
                      background: `linear-gradient(to right, #4ade80 0%, #4ade80 ${((tempDistance - 50) / 450) * 100}%, rgba(255,255,255,0.1) ${((tempDistance - 50) / 450) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      height: '8px',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div className="flex justify-between text-white/40 text-xs mt-2">
                  <span>50m</span>
                  <span>500m</span>
                </div>
              </div>

              {/* Distance Presets */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[50, 100, 200, 300, 500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setTempDistance(preset)}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      tempDistance === preset
                        ? 'bg-[#4ade80] text-[#0d2920]'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={applyDistance}
                  className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold rounded-xl"
                >
                  Apply & Search
                </Button>
                <Button
                  onClick={() => setShowDistanceModal(false)}
                  variant="outline"
                  className="w-full h-10 bg-transparent border-2 border-white/20 text-white hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-center text-white/30 text-xs mt-4">
                💡 Wider radius = more matches
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}