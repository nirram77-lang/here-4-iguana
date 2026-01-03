"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { ChevronLeft, ChevronRight, MapPin, Briefcase, GraduationCap, Wine, Cigarette, Ruler, Heart, X } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

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
  const { t, isRTL } = useLanguage()
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [exitX, setExitX] = useState(0)
  const [exitRotation, setExitRotation] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  
  // ✅ Motion values for Tinder-like swipe
  const x = useMotionValue(0)
  
  // ✅ Card rotation based on drag (Tinder effect!)
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25])
  
  // ✅ Like/Nope indicator opacity based on drag
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.8, 1])
  const nopeOpacity = useTransform(x, [-200, -100, 0], [1, 0.8, 0])
  
  // ✅ Scale effect when dragging
  const scale = useTransform(x, [-300, 0, 300], [0.95, 1, 0.95])
  
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
  
  // ✅ Enhanced swipe gesture handling with exit animation
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 100
    const velocity = info.velocity.x
    const offset = info.offset.x
    
    // Check if swipe was strong enough (either by distance or velocity)
    if (offset > threshold || velocity > 500) {
      // Swipe RIGHT - LIKE! 💚
      setExitX(500)
      setExitRotation(30)
      setIsExiting(true)
      setTimeout(() => onSwipe('right'), 150)  // ✅ v2.8.6: Faster callback
    } else if (offset < -threshold || velocity < -500) {
      // Swipe LEFT - PASS! ❌
      setExitX(-500)
      setExitRotation(-30)
      setIsExiting(true)
      setTimeout(() => onSwipe('left'), 150)  // ✅ v2.8.6: Faster callback
    }
  }, [onSwipe])
  
  // ✅ Drinking/Smoking labels
  const getDrinkingLabel = () => {
    switch (user.drinking) {
      case 'never': return t('datingCard.neverDrinks')
      case 'social': return t('datingCard.socialDrinker')
      case 'regular': return t('datingCard.drinksRegularly')
      default: return null
    }
  }
  
  const getSmokingLabel = () => {
    switch (user.smoking) {
      case 'no': return t('datingCard.doesntSmoke')
      case 'social': return t('datingCard.socialSmoker')
      case 'yes': return t('datingCard.smokes')
      default: return null
    }
  }

  return (
    <motion.div
      style={{ x, rotate, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={isExiting ? { 
        x: exitX, 
        rotate: exitRotation,
        opacity: 0,
        transition: { duration: 0.25, ease: "easeOut" }  // ✅ v2.8.6: Faster exit
      } : {}}
      className="relative w-[340px] max-w-[90vw] h-[480px] max-h-[60vh] rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none"
      whileTap={{ cursor: "grabbing" }}
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
      
      {/* ✅ LIKE Indicator - Hollywood Style Heart! */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className={`absolute top-16 ${isRTL ? 'right-6' : 'left-6'} z-30 pointer-events-none`}
      >
        <motion.div 
          className="relative"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 blur-xl bg-[#4ade80]/50 rounded-full scale-150" />
          {/* Heart icon with border */}
          <div className={`relative border-[5px] border-[#4ade80] text-[#4ade80] px-5 py-3 rounded-2xl font-black text-3xl bg-black/30 backdrop-blur-sm flex items-center gap-2 ${isRTL ? 'rotate-[15deg]' : 'rotate-[-15deg]'} shadow-[0_0_30px_rgba(74,222,128,0.5)]`}>
            <Heart className="w-8 h-8 fill-[#4ade80]" />
            <span>{t('datingCard.like')}</span>
          </div>
        </motion.div>
      </motion.div>
      
      {/* ✅ NOPE Indicator - Hollywood Style X! */}
      <motion.div
        style={{ opacity: nopeOpacity }}
        className={`absolute top-16 ${isRTL ? 'left-6' : 'right-6'} z-30 pointer-events-none`}
      >
        <motion.div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-xl bg-red-500/50 rounded-full scale-150" />
          {/* X icon with border */}
          <div className={`relative border-[5px] border-red-500 text-red-500 px-5 py-3 rounded-2xl font-black text-3xl bg-black/30 backdrop-blur-sm flex items-center gap-2 ${isRTL ? 'rotate-[-15deg]' : 'rotate-[15deg]'} shadow-[0_0_30px_rgba(239,68,68,0.5)]`}>
            <X className="w-8 h-8 stroke-[3]" />
            <span>{t('datingCard.nope')}</span>
          </div>
        </motion.div>
      </motion.div>
      
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
        <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Distance + Location Badge */}
          {user.distance !== undefined && (
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Distance */}
              <div className={`flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className="h-3.5 w-3.5 text-[#4ade80]" />
                <span className="text-white/90 text-xs font-medium">
                  {user.distance}{isRTL ? " מ'" : 'm'}
                </span>
              </div>
              
              {/* ✅ NEW: At This Bar / Nearby Badge */}
              {user.distance <= 100 ? (
                <div className={`flex items-center gap-1 bg-[#4ade80]/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[#4ade80]/40 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px]">✅</span>
                  <span className="text-[#4ade80] text-xs font-bold">{t('datingCard.atThisBar')}</span>
                </div>
              ) : (
                <div className={`flex items-center gap-1 bg-amber-500/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-amber-500/40 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px]">📍</span>
                  <span className="text-amber-400 text-xs font-bold">{t('datingCard.nearby')}</span>
                </div>
              )}
            </div>
          )}
          
          {/* City (fallback if no distance) */}
          {user.city && user.distance === undefined && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <MapPin className="h-3.5 w-3.5 text-[#4ade80]" />
              <span className="text-white/90 text-xs font-medium">
                {user.city.split(' - ')[0]}
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
      
      {/* ✅ Photo counter badge */}
      {hasMultiplePhotos && (
        <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <span className="text-white text-xs font-medium">
            {currentPhotoIndex + 1}/{photos.length}
          </span>
        </div>
      )}
      
      {/* ✅ Swipe hint for new users */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-32 left-0 right-0 flex justify-center z-20 pointer-events-none"
      >
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-red-400 text-sm">👈 Pass</span>
          <span className="text-white/50">|</span>
          <span className="text-[#4ade80] text-sm">Like 👉</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
