"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Heart, Briefcase, GraduationCap, Wine, Cigarette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    displayName?: string
    name?: string
    photoURL?: string
    photos?: string[]
    age?: number
    bio?: string
    hobbies?: string[]
    distance?: number
    occupation?: string
    education?: string
    drinking?: 'never' | 'social' | 'regular'
    smoking?: 'no' | 'social' | 'yes'
  } | null
  isCurrentUser?: boolean
}

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  user,
  isCurrentUser = false 
}: UserProfileModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  if (!user) return null

  // ✅ "She Decides" - name (from onboarding) before displayName (from Google)
  const userName = user.name || user.displayName || 'Unknown'
  const userAge = user.age || '??'
  const userPhotos = user.photos || (user.photoURL ? [user.photoURL] : [])
  const currentPhoto = userPhotos[currentPhotoIndex] || '/placeholder.svg'

  const formatDistance = (distance?: number) => {
    if (!distance) return '0m'
    if (distance < 1000) return `${Math.round(distance)}m`
    return `${(distance / 1000).toFixed(1)}km`
  }

  const getDrinkingLabel = (drinking?: string) => {
    switch (drinking) {
      case 'never': return '🚫 Never drinks'
      case 'social': return '🍷 Social drinker'
      case 'regular': return '🍺 Regular drinker'
      default: return null
    }
  }

  const getSmokingLabel = (smoking?: string) => {
    switch (smoking) {
      case 'no': return '🚭 Non-smoker'
      case 'social': return '🚬 Social smoker'
      case 'yes': return '🚬 Smoker'
      default: return null
    }
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % userPhotos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + userPhotos.length) % userPhotos.length)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-[#4ade80]/30 shadow-2xl"
          >
            {/* Close Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Photo Section */}
            <div className="relative h-[400px] bg-black">
              <img
                src={currentPhoto}
                alt={userName}
                className="w-full h-full object-cover"
              />
              
              {/* Photo Navigation */}
              {userPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
                  >
                    ❮
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
                  >
                    ❯
                  </button>
                  
                  {/* Photo Indicators */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {userPhotos.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentPhotoIndex
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Gradient Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-32" />
              
              {/* Name Badge */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-white text-3xl font-bold drop-shadow-lg">
                  {userName}, {userAge}
                </h2>
                {!isCurrentUser && user.distance !== undefined && (
                  <div className="flex items-center gap-2 text-white/90 mt-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{formatDistance(user.distance)} away</span>
                  </div>
                )}
                {isCurrentUser && (
                  <div className="flex items-center gap-2 text-[#4ade80] mt-2">
                    <Heart className="h-4 w-4" fill="currentColor" />
                    <span className="font-medium">Your Profile</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 space-y-6">
              {/* Bio */}
              {user.bio && (
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">About</h3>
                  <p className="text-white/80 leading-relaxed">{user.bio}</p>
                </div>
              )}

              {/* Hobbies */}
              {user.hobbies && user.hobbies.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.hobbies.map((hobby, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-[#4ade80]/20 border border-[#4ade80]/30 rounded-full text-[#4ade80] text-sm font-medium"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-3">
                {user.occupation && (
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-10 h-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs">Occupation</p>
                      <p className="text-white font-medium">{user.occupation}</p>
                    </div>
                  </div>
                )}

                {user.education && (
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-10 h-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs">Education</p>
                      <p className="text-white font-medium">{user.education}</p>
                    </div>
                  </div>
                )}

                {getDrinkingLabel(user.drinking) && (
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-10 h-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center flex-shrink-0">
                      <Wine className="h-5 w-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{getDrinkingLabel(user.drinking)}</p>
                    </div>
                  </div>
                )}

                {getSmokingLabel(user.smoking) && (
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-10 h-10 rounded-full bg-[#4ade80]/10 flex items-center justify-center flex-shrink-0">
                      <Cigarette className="h-5 w-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{getSmokingLabel(user.smoking)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button at Bottom */}
              <Button
                onClick={onClose}
                className="w-full h-12 bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold rounded-xl"
              >
                Close Profile
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
