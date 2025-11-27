"use client"

import { useState } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { MapPin, Info, ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"

interface DatingCardProps {
  user: {
    uid?: string
    name?: string
    displayName?: string
    age?: number
    distance?: number
    photos?: string[]
    photoURL?: string
    bio?: string
    hobbies?: string[]
  }
  onSwipe: (direction: 'left' | 'right') => void
}

export default function DatingCard({ user, onSwipe }: DatingCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [dragStart, setDragStart] = useState(0)

  const photos = user.photos || (user.photoURL ? [user.photoURL] : ["/placeholder.jpg"])
  const userName = user.displayName || user.name || "User"
  const userAge = user.age || 25
  const userDistance = user.distance ? `${Math.round(user.distance)}m away` : "nearby"
  const userBio = user.bio || "No bio yet"
  const userHobbies = user.hobbies || []

  const handleDragEnd = (info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
      if (offset > 0) {
        onSwipe('right')
      } else {
        onSwipe('left')
      }
    }
  }

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const openProfile = () => {
    setShowProfileModal(true)
  }

  return (
    <>
      {/* Main Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={(_, info) => setDragStart(info.point.x)}
        onDragEnd={(_, info) => handleDragEnd(info)}
        className="relative w-full max-w-sm h-[600px] rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
      >
        {/* Photo Carousel */}
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhotoIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <Image
                src={photos[currentPhotoIndex]}
                alt={userName}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Photo Navigation */}
          {photos.length > 1 && (
            <>
              {/* Left Arrow */}
              {currentPhotoIndex > 0 && (
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Right Arrow */}
              {currentPhotoIndex < photos.length - 1 && (
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Photo Indicators */}
              <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 z-10">
                {photos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentPhotoIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50 w-1'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Info Button */}
          <button
            onClick={openProfile}
            className="absolute top-4 right-4 w-10 h-10 bg-[#4ade80] rounded-full flex items-center justify-center hover:scale-110 transition-transform z-10"
          >
            <Info className="w-5 h-5 text-[#0d2920]" />
          </button>

          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-4xl font-bold mb-2">
              {userName}, {userAge}
            </h2>
            <div className="flex items-center gap-2 text-white/80 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{userDistance}</span>
            </div>
            {userBio && (
              <p className="text-white/90 text-sm line-clamp-2 mb-3">
                {userBio}
              </p>
            )}
            {userHobbies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userHobbies.slice(0, 3).map((hobby, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto border-2 border-[#4ade80]/30 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Photo Gallery */}
              <div className="relative h-96">
                <Image
                  src={photos[currentPhotoIndex]}
                  alt={userName}
                  fill
                  className="object-cover"
                />
                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentPhotoIndex
                            ? 'bg-[#4ade80] w-8'
                            : 'bg-white/50 w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {userName}, {userAge}
                </h2>
                <div className="flex items-center gap-2 text-white/70 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{userDistance}</span>
                </div>

                {/* Bio */}
                {userBio && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#4ade80] mb-2">
                      About
                    </h3>
                    <p className="text-white/80 leading-relaxed">
                      {userBio}
                    </p>
                  </div>
                )}

                {/* Hobbies */}
                {userHobbies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#4ade80] mb-3">
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userHobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-[#4ade80]/20 border border-[#4ade80]/30 rounded-full text-sm font-medium text-white"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
