'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { auth, db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface User {
  displayName: string
  photoURL: string
  bio?: string
  location?: string
}

interface MatchModalProps {
  matchedUser: {
    id: string
    displayName: string
    photoURL: string
  }
  onClose: () => void
  onMessage: () => void
}

export default function MatchModal({ matchedUser, onClose, onMessage }: MatchModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [matchedUserDetails, setMatchedUserDetails] = useState<User | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        // Load current user data
        const currentUserDoc = await getDoc(doc(db, 'users', user.uid))
        if (currentUserDoc.exists()) {
          setCurrentUser(currentUserDoc.data() as User)
        }

        // Load matched user data
        const matchedUserDoc = await getDoc(doc(db, 'users', matchedUser.id))
        if (matchedUserDoc.exists()) {
          setMatchedUserDetails(matchedUserDoc.data() as User)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }

    loadUsers()
  }, [matchedUser.id])

  if (showProfile && matchedUserDetails) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowProfile(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-[#0d2920] to-[#0a1f1a] rounded-3xl p-8 max-w-md w-full border-2 border-[#4ade80]/30 relative"
        >
          <button
            onClick={() => setShowProfile(false)}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center mb-6">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#4ade80]">
              {matchedUserDetails.photoURL ? (
                <img
                  src={matchedUserDetails.photoURL}
                  alt={matchedUserDetails.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <UserIcon className="h-16 w-16 text-white/50" />
                </div>
              )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {matchedUserDetails.displayName}
            </h2>
            {matchedUserDetails.location && (
              <p className="text-gray-400 text-sm">📍 {matchedUserDetails.location}</p>
            )}
          </div>

          {matchedUserDetails.bio && (
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-white/80 text-center">{matchedUserDetails.bio}</p>
            </div>
          )}

          <Button
            onClick={() => {
              setShowProfile(false)
              onMessage()
            }}
            className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#3bc970] text-[#0d2920] font-bold"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Send Message
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.5, rotate: 10 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center"
        >
          {/* It's a Match! Header */}
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-bold mb-8 bg-gradient-to-r from-[#4ade80] to-[#3bc970] bg-clip-text text-transparent"
          >
            It's a Match! 🎉
          </motion.h1>

          {/* Profile Pictures */}
          <div className="flex justify-center items-center gap-8 mb-8">
            {/* Current User */}
            <motion.button
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#4ade80] shadow-2xl shadow-[#4ade80]/50">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4ade80] to-[#3bc970] flex items-center justify-center">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0d2920] px-3 py-1 rounded-full border-2 border-[#4ade80]">
                <span className="text-white text-sm font-semibold">You</span>
              </div>
            </motion.button>

            {/* Heart Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <div className="text-6xl">❤️</div>
            </motion.div>

            {/* Matched User */}
            <motion.button
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowProfile(true)}
              className="relative cursor-pointer"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#4ade80] shadow-2xl shadow-[#4ade80]/50">
                {matchedUser.photoURL ? (
                  <img
                    src={matchedUser.photoURL}
                    alt={matchedUser.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4ade80] to-[#3bc970] flex items-center justify-center">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0d2920] px-3 py-1 rounded-full border-2 border-[#4ade80]">
                <span className="text-white text-sm font-semibold">
                  {matchedUser.displayName}
                </span>
              </div>
            </motion.button>
          </div>

          {/* Message */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/80 text-lg mb-8 max-w-md mx-auto"
          >
            You and {matchedUser.displayName} liked each other!
            <br />
            <span className="text-sm text-[#4ade80]">
              Click on {matchedUser.displayName}'s photo to view profile
            </span>
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 justify-center"
          >
            <Button
              onClick={onMessage}
              className="h-14 px-8 bg-gradient-to-r from-[#4ade80] to-[#3bc970] text-[#0d2920] font-bold text-lg hover:opacity-90"
            >
              <MessageCircle className="h-6 w-6 mr-2" />
              Send Message
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="h-14 px-8 bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-lg"
            >
              Keep Swiping
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}