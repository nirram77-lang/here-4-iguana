"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { ChevronLeft, ChevronRight, MapPin, Briefcase, GraduationCap, Wine, Cigarette, Ruler, Heart } from "lucide-react"

interface DatingCardProps {
  user: {
    uid?: string
    name?: string
    displayName?: string
    age?: number
    bio?: string
    photoURL?: string
    photos?: string[]
    distance?: number
    hobbies?: string[]
    occupation?: string
    education?: string
    height?: string
    drinking?: 'never' | 'social' | 'regular'
    smoking?: 'no' | 'social' | 'yes'
    lookingFor?: 'male' | 'female' | 'both'
    gender?: 'male' | 'female'
    city?: string
    preferences?: {
      lookingFor?: 'male' | 'female' | 'both'
    }
  }
  onSwipe: (direction: 'left' | 'right') => void
}

export default function DatingCard({ user, onSwipe }: DatingCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  
  // Get all photos
  const photos = user.photos?.length ? user.photos : (user.photoURL ? [user.photoURL] : [])
  const hasMultiplePhotos = photos.length > 1
  
  // Get display name
  const displayName = user.name || user.displayName || 'Unknown'
  
  // ✅ Get orientation label (what they're looking for)
  const getOrientationLabel = () => {
    const lookingFor = user.lookingFor || user.preferences?.lookingFor || 'both'
    const gender = user.gender
    
    if (lookingFor === 'both') {
      return { label: 'Bisexual', emoji: '💜', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
    }
    
    if (gender === 'male') {
      if (lookingFor === 'male') {
        return { label: 'Gay', emoji: '🏳️‍🌈', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
      }
      return { label: 'Straight', emoji: '💚', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
    }
    
    if (gender === 'female') {
      if (lookingFor === 'female') {
        return { label: 'Lesbian', emoji: '🏳️‍🌈', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' }
      }
      return { label: 'Straight', emoji: '💚', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
    }
    
    return { label: 'Open', emoji: '💚', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
  }
  
  const orientation = getOrientationLabel()
  
  // ✅ Photo navigation
  const goToNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1)
    }
  }
  
  const goToPrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1)
    }
  }
  
  // ✅ Swipe gesture handling
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      onSwipe('left')
    }
  }, [onSwipe])
  
  // ✅ Drinking/Smoking labels
  const getDrinkingLabel = () => {
    switch (user.drinking) {
      case 'never': return 'Never drinks'
      case 'social': return 'Social drinker'
      case 'regular': return 'Drinks regularly'
      default: return null
    }
  }
  
  const getSmokingLabel = () => {
    switch (user.smoking) {
      case 'no': return "Doesn't smoke"
      case 'social': return 'Social smoker'
      case 'yes': return 'Smokes'
      default: return null
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      className="relative w-[340px] h-[520px] rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Photo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhotoIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          {photos[currentPhotoIndex] ? (
            <img
              src={photos[currentPhotoIndex]}
              alt={displayName}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] flex items-center justify-center">
              <span className="text-8xl">🦎</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Photo navigation dots */}
      {hasMultiplePhotos && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-20">
          {photos.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentPhotoIndex(idx)
              }}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentPhotoIndex 
                  ? 'w-8 bg-white' 
                  : 'w-1.5 bg-white/50 hover:bg-white/70'
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>
      )}
      
      {/* ✅ Photo navigation buttons - Hollywood style */}
      {hasMultiplePhotos && (
        <>
          {/* Left arrow */}
          {currentPhotoIndex > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goToPrevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </motion.button>
          )}
          
          {/* Right arrow */}
          {currentPhotoIndex < photos.length - 1 && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goToNextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </motion.button>
          )}
        </>
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
      
      {/* ✅ Main Info - Always visible at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        {/* Name and Age - Hollywood style */}
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            {displayName}
          </h2>
          <span className="text-2xl font-bold text-[#4ade80] drop-shadow-lg">
            {user.age || '??'}
          </span>
        </div>
        
        {/* ✅ Orientation Badge - Prominent */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${orientation.color} mb-3`}
        >
          <span className="text-sm">{orientation.emoji}</span>
          <span className="text-sm font-semibold">{orientation.label}</span>
        </motion.div>
        
        {/* ✅ Quick Info Row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* City/Location */}
          {(user.city || user.distance !== undefined) && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <MapPin className="h-3.5 w-3.5 text-[#4ade80]" />
              <span className="text-white/90 text-xs font-medium">
                {user.city ? user.city.split(' - ')[0] : `${user.distance}m away`}
              </span>
            </div>
          )}
          
          {/* Occupation */}
          {user.occupation && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Briefcase className="h-3.5 w-3.5 text-[#4ade80]" />
              <span className="text-white/90 text-xs font-medium truncate max-w-[120px]">
                {user.occupation}
              </span>
            </div>
          )}
          
          {/* Height */}
          {user.height && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Ruler className="h-3.5 w-3.5 text-[#4ade80]" />
              <span className="text-white/90 text-xs font-medium">
                {user.height}
              </span>
            </div>
          )}
        </div>
        
        {/* ✅ Hobbies Preview */}
        {user.hobbies && user.hobbies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {user.hobbies.slice(0, 4).map((hobby, idx) => (
              <span
                key={idx}
                className="bg-[#4ade80]/20 text-[#4ade80] px-2.5 py-0.5 rounded-full text-xs font-medium border border-[#4ade80]/30"
              >
                {hobby}
              </span>
            ))}
            {user.hobbies.length > 4 && (
              <span className="text-white/50 text-xs self-center">
                +{user.hobbies.length - 4} more
              </span>
            )}
          </div>
        )}
        
        {/* ✅ Bio Preview */}
        {user.bio && (
          <p className="text-white/80 text-sm line-clamp-2 mb-2">
            {user.bio}
          </p>
        )}
        
        {/* ✅ Lifestyle Icons */}
        <div className="flex items-center gap-3 text-white/60">
          {getDrinkingLabel() && (
            <div className="flex items-center gap-1" title={getDrinkingLabel()!}>
              <Wine className="h-4 w-4" />
              <span className="text-xs">{user.drinking === 'never' ? '🚫' : user.drinking === 'social' ? '🍷' : '🍻'}</span>
            </div>
          )}
          {getSmokingLabel() && (
            <div className="flex items-center gap-1" title={getSmokingLabel()!}>
              <Cigarette className="h-4 w-4" />
              <span className="text-xs">{user.smoking === 'no' ? '🚫' : user.smoking === 'social' ? '💨' : '🚬'}</span>
            </div>
          )}
          {user.education && (
            <div className="flex items-center gap-1" title={user.education}>
              <GraduationCap className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
      
      {/* ✅ Swipe indicators */}
      <motion.div
        className="absolute top-20 left-6 z-30 rotate-[-20deg]"
        initial={{ opacity: 0, scale: 0.5 }}
        whileHover={{ opacity: 0.3, scale: 1 }}
      >
        <div className="border-4 border-red-500 text-red-500 px-4 py-2 rounded-lg font-bold text-2xl">
          NOPE
        </div>
      </motion.div>
      
      <motion.div
        className="absolute top-20 right-6 z-30 rotate-[20deg]"
        initial={{ opacity: 0, scale: 0.5 }}
        whileHover={{ opacity: 0.3, scale: 1 }}
      >
        <div className="border-4 border-[#4ade80] text-[#4ade80] px-4 py-2 rounded-lg font-bold text-2xl">
          LIKE
        </div>
      </motion.div>
      
      {/* ✅ Photo counter badge */}
      {hasMultiplePhotos && (
        <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <span className="text-white text-xs font-medium">
            {currentPhotoIndex + 1}/{photos.length}
          </span>
        </div>
      )}
    </motion.div>
  )
}
