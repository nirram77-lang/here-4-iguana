"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Heart, Lock, Crown, X } from 'lucide-react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface LikesScreenProps {
  userId: string
  onNavigate: (screen: string) => void
  isPremium: boolean
  onUpgrade: () => void  // Open premium modal
  onUserClick: (user: any) => void  // When user clicks on a profile
}

interface LikeUser {
  uid: string
  name: string
  displayName?: string
  age: number
  photoURL: string
  photos: string[]
  bio?: string
  hobbies?: string[]
}

export default function LikesScreen({
  userId,
  onNavigate,
  isPremium,
  onUpgrade,
  onUserClick
}: LikesScreenProps) {
  const [likes, setLikes] = useState<LikeUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLikes()
  }, [userId])

  const loadLikes = async () => {
    setLoading(true)
    try {
      console.log('💚 Loading users who liked you...')
      
      // Get current user's profile
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        console.error('User profile not found')
        return
      }
      
      const userData = userDoc.data()
      
      // ✅ CRITICAL: Find all users who have current user in their swipedRight
      // BUT current user has NOT swiped right on them yet (no match yet)
      const usersRef = collection(db, 'users')
      const q = query(
        usersRef,
        where('swipedRight', 'array-contains', userId)
      )
      
      const snapshot = await getDocs(q)
      const likesList: LikeUser[] = []
      
      snapshot.forEach(doc => {
        const likeUserData = doc.data()
        
        // ✅ Filter: Only show if current user hasn't swiped right on them yet
        if (!userData.swipedRight?.includes(likeUserData.uid)) {
          likesList.push({
            uid: likeUserData.uid,
            name: likeUserData.name || likeUserData.displayName,
            displayName: likeUserData.displayName,
            age: likeUserData.age,
            photoURL: likeUserData.photoURL || likeUserData.photos?.[0],
            photos: likeUserData.photos || [],
            bio: likeUserData.bio,
            hobbies: likeUserData.hobbies
          })
        }
      })
      
      setLikes(likesList)
      console.log(`✅ Found ${likesList.length} users who liked you`)
    } catch (error) {
      console.error('Error loading likes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-[#0d2920]/50 border-b border-[#4ade80]/20">
        <button
          onClick={() => onNavigate('home')}
          className="text-white/60 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          Likes
        </h1>
        
        <div className="w-6" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Premium Required Overlay */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            {/* Blurred Likes Background */}
            <div className="filter blur-md pointer-events-none mb-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/10 rounded-2xl p-4 mb-3 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-white/20 rounded-xl" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-white/20 rounded mb-2" />
                    <div className="w-48 h-3 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-[#1a4d3e] via-[#0d2920] to-[#0d2920] rounded-3xl p-8 max-w-sm border-2 border-[#4ade80]/30 text-center"
              >
                {/* Lock Icon */}
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <div className="w-20 h-20 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                    <Lock className="h-10 w-10 text-[#4ade80]" />
                  </div>
                </motion.div>

                <h2 className="text-3xl font-black text-white mb-3">
                  Premium Feature
                </h2>
                
                <p className="text-white/80 mb-2">
                  See who likes you!
                </p>
                
                <p className="text-white/60 text-sm mb-6">
                  {likes.length > 0 
                    ? `You have ${likes.length} ${likes.length === 1 ? 'like' : 'likes'} waiting!`
                    : 'Discover your admirers'}
                </p>

                {/* Upgrade Button */}
                <Button
                  onClick={onUpgrade}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#d97706] text-white rounded-2xl"
                >
                  <Crown className="mr-2 h-6 w-6" />
                  Upgrade to Premium
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Premium - Show Likes */}
        {isPremium && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block text-6xl mb-4"
                >
                  🦎
                </motion.div>
                <p className="text-white/60">Loading likes...</p>
              </div>
            ) : likes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💔</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  No Likes Yet
                </h3>
                <p className="text-white/60">
                  Keep swiping to find your matches!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white/60 text-sm mb-4">
                  {likes.length} {likes.length === 1 ? 'person' : 'people'} liked you
                </p>
                
                {likes.map((likeUser) => (
                  <motion.div
                    key={likeUser.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onUserClick(likeUser)}
                    className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all"
                  >
                    {/* Photo */}
                    <div className="relative">
                      <img
                        src={likeUser.photoURL || '/placeholder.jpg'}
                        alt={likeUser.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                      >
                        <Heart className="h-4 w-4 text-white fill-white" />
                      </motion.div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {likeUser.name}, {likeUser.age}
                      </h3>
                      {likeUser.bio && (
                        <p className="text-white/60 text-sm line-clamp-1">
                          {likeUser.bio}
                        </p>
                      )}
                      {likeUser.hobbies && likeUser.hobbies.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {likeUser.hobbies.slice(0, 2).map((hobby, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-[#4ade80]/20 rounded-full text-[#4ade80] text-xs"
                            >
                              {hobby}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="text-[#4ade80]">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
