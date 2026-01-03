import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"
import { calculateDistance, getGeohashNeighbors } from "./location-service"
import { LOCATION_CONFIG, ERROR_MESSAGES, MATCH_CONFIG } from "./constants"

// ✅ 12-hour cooldown for matches (in milliseconds)
const MATCH_COOLDOWN_MS = 12 * 60 * 60 * 1000  // 12 hours

/**
 * ✅ Check if match cooldown has passed (12 hours)
 * Returns true if should SKIP this user (cooldown not passed)
 * Returns false if can show this user again (cooldown passed or no match)
 */
async function isMatchOnCooldown(userId1: string, userId2: string): Promise<boolean> {
  try {
    const matchId = [userId1, userId2].sort().join('_')
    const matchDoc = await getDoc(doc(db, 'matches', matchId))
    
    if (!matchDoc.exists()) {
      return false  // No match history, can show
    }
    
    const matchData = matchDoc.data()
    const matchTime = matchData.timestamp?.toDate() || matchData.completedAt?.toDate()
    
    if (!matchTime) {
      return false  // No timestamp, can show
    }
    
    const hoursSinceMatch = (Date.now() - matchTime.getTime()) / MATCH_COOLDOWN_MS
    
    if (hoursSinceMatch >= 1) {  // 1 = 12 hours passed
      console.log(`✅ Match cooldown passed (${Math.round(hoursSinceMatch * 12)}h) - can show again`)
      return false  // Cooldown passed, can show
    }
    
    console.log(`⏰ Match cooldown active (${Math.round((1 - hoursSinceMatch) * 12)}h remaining)`)
    return true  // Still on cooldown, skip
  } catch (error) {
    console.error('Error checking match cooldown:', error)
    return false  // On error, allow showing
  }
}

/**
 * ✅ Get set of user IDs that are on match cooldown (matched within 12 hours)
 * Pre-loads all matches for efficient filtering
 */
async function getMatchesOnCooldown(userId: string, currentVenue?: string): Promise<Set<string>> {
  const cooldownSet = new Set<string>()
  
  try {
    // Get all matches where this user is involved
    const matchesRef = collection(db, 'matches')
    
    // Query matches containing this user
    const matchesSnapshot = await getDocs(matchesRef)
    
    const now = Date.now()
    
    matchesSnapshot.forEach((matchDoc) => {
      const data = matchDoc.data()
      const users = data.users as string[]
      
      // Check if this user is part of this match
      if (!users?.includes(userId)) return
      
      // Get the other user
      const otherUserId = users.find(u => u !== userId)
      if (!otherUserId) return
      
      // Check timestamp
      const matchTime = data.timestamp?.toDate() || data.completedAt?.toDate()
      if (!matchTime) return
      
      const msSinceMatch = now - matchTime.getTime()
      
      // If less than 12 hours AND same venue → cooldown applies
      // Different venue → NO cooldown! (viral feature: "fate brought us together again!")
      if (msSinceMatch < MATCH_COOLDOWN_MS) {
        const matchVenue = data.venue || data.venueId
        
        // ✅ NEW: Only apply cooldown if SAME venue!
        if (currentVenue && matchVenue && matchVenue !== currentVenue) {
          console.log(`🔥 ${otherUserId.substring(0, 8)} matched at different venue (${matchVenue}) - NO cooldown! Fate! 💕`)
          return  // Skip - different venue = can match again!
        }
        
        cooldownSet.add(otherUserId)
        console.log(`⏰ ${otherUserId.substring(0, 8)} on cooldown at SAME venue (${Math.round((MATCH_COOLDOWN_MS - msSinceMatch) / 3600000)}h remaining)`)
      }
    })
    
    console.log(`📋 Found ${cooldownSet.size} users on venue-specific cooldown`)
    return cooldownSet
  } catch (error) {
    console.error('Error getting matches on cooldown:', error)
    return cooldownSet
  }
}

export interface UserProfile {
  uid: string
  name: string
  displayName?: string
  age: number
  email: string
  gender: 'male' | 'female'
  photoURL?: string
  photos: string[]
  hobbies: string[]
  bio?: string
  onboardingComplete?: boolean
  deleted?: boolean  // ✅ NEW: Track deleted accounts
  // ✅ Phone verification fields
  phoneNumber?: string
  phoneVerified?: boolean
  phoneVerifiedAt?: Timestamp
  location: {
    latitude: number
    longitude: number
    geohash: string
    lastUpdated: Timestamp
  }
  preferences: {
    minDistance: number
    maxDistance: number
    ageRange: [number, number]
    lookingFor: 'male' | 'female' | 'both'
    expandSearch?: boolean  // ✅ NEW: Show profiles outside preferred range when running out
    smokingFilter?: 'any' | 'no' | 'no_or_social'  // ✅ v2.8.27: Filter by smoking preference
  }
  swipedRight: string[]
  swipedLeft: string[]
  matches: string[]
  lastActive: Timestamp
  createdAt: Timestamp
  // Additional profile fields
  drinking?: 'never' | 'social' | 'regular'
  smoking?: 'no' | 'social' | 'yes'
  height?: string
  occupation?: string
  education?: string
  lookingFor?: 'relationship' | 'casual' | 'friends'
  // ✅ NEW: Check-in fields
  checkedInVenue?: string | null
  checkInData?: {
    venueId: string
    venueName: string
    venueDisplayName: string
    checkedInAt: Timestamp
    expiresAt: Timestamp
    location: {
      latitude: number
      longitude: number
    }
  } | null
  lastCheckIn?: Timestamp
  lastCheckOut?: Timestamp
}

export interface Match {
  id: string
  users: [string, string]
  timestamp: Timestamp
  chatId: string
}

export interface UserProfileWithDistance extends UserProfile {
  distance: number
}

/**
 * Create or update user profile
 */
export const saveUserProfile = async (
  uid: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid)
    await setDoc(
      userRef,
      {
        ...profileData,
        lastActive: Timestamp.now(),
      },
      { merge: true }
    )
  } catch (error) {
    console.error('Error saving user profile:', error)
    throw new Error(ERROR_MESSAGES.FIRESTORE_SAVE_ERROR)
  }
}

/**
 * Update user location in real-time
 */
export const updateUserLocation = async (
  uid: string,
  latitude: number,
  longitude: number,
  geohash: string
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid)
    
    await setDoc(userRef, {
      location: {
        latitude,
        longitude,
        geohash,
        lastUpdated: Timestamp.now(),
      },
      lastActive: Timestamp.now(),
    }, { merge: true })
  } catch (error) {
    console.error('Error updating location:', error)
    throw new Error(ERROR_MESSAGES.FIRESTORE_SAVE_ERROR)
  }
}

/**
 * Get user profile
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      // ✅ v2.8.5 FIX: Include uid in the returned profile!
      // Firestore's doc.data() doesn't include the document ID
      return { ...userSnap.data(), uid } as UserProfile
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw new Error(ERROR_MESSAGES.FIRESTORE_LOAD_ERROR)
  }
}

/**
 * Update user search preferences
 * ✅ NEW: Update all search settings at once
 */
export const updateUserPreferences = async (
  uid: string,
  preferences: {
    maxDistance?: number
    ageRange?: [number, number]
    lookingFor?: 'male' | 'female' | 'both'
    expandSearch?: boolean
    smokingFilter?: 'any' | 'no' | 'no_or_social'  // ✅ v2.8.27: Smoking filter
  }
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, {
      preferences: {
        ...preferences,
        minDistance: 10  // Keep min distance fixed at 10m
      }
    }, { merge: true })
    
    console.log('✅ User preferences updated:', preferences)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw new Error('Failed to update preferences')
  }
}

/**
 * Find nearby users within radius (10m-1km)
 * ✅ FIXED: Now filters dummy users by distance range too!
 */
export const findNearbyUsers = async (
  currentUserId: string,
  userLocation: { latitude: number; longitude: number; geohash: string },
  maxDistance: number = LOCATION_CONFIG.DEFAULT_MAX_DISTANCE,
  minDistance: number = LOCATION_CONFIG.DEFAULT_MIN_DISTANCE
): Promise<UserProfileWithDistance[]> => {
  try {
    console.log(`🔍 Searching for users within ${minDistance}m - ${maxDistance}m`)
    
    // ✅ FIX: Get current user's profile first to check who they already swiped
    const currentUserProfile = await getUserProfile(currentUserId)
    if (!currentUserProfile) {
      throw new Error('Current user profile not found')
    }

    // ✅ FIXED: Use user's actual preferences for lookingFor
    const currentUserGender = currentUserProfile.gender
    const userLookingFor = currentUserProfile.preferences?.lookingFor
    
    // ✅ Determine what genders to show
    let lookingFor: 'male' | 'female' | 'both'
    if (userLookingFor === 'both') {
      lookingFor = 'both'
    } else if (userLookingFor === 'male' || userLookingFor === 'female') {
      lookingFor = userLookingFor
    } else {
      // Default: "She Decides" - opposite gender
      lookingFor = currentUserGender === 'male' ? 'female' : 'male'
    }
    console.log(`🔍 Looking for: ${lookingFor} (preference: ${userLookingFor || 'default'})`)
    
    const currentUserAge = currentUserProfile.age
    const currentUserAgeRange = currentUserProfile.preferences?.ageRange || [18, 80]
    const smokingFilter = currentUserProfile.preferences?.smokingFilter || 'any'  // ✅ v2.8.27: Smoking filter
    
    // ✅ 12-hour match cooldown - load users on cooldown
    const matchesOnCooldown = await getMatchesOnCooldown(currentUserId)
    
    console.log(`👤 Current user: age=${currentUserAge}, gender=${currentUserGender}, looking for ages ${currentUserAgeRange[0]}-${currentUserAgeRange[1]}, smoking filter: ${smokingFilter}`)
    console.log(`⏰ Users on 12h match cooldown: ${matchesOnCooldown.size}`)
    
    const geohashes = getGeohashNeighbors(userLocation.geohash)
    const usersRef = collection(db, "users")
    const nearbyUsers: UserProfileWithDistance[] = []

    // ✅ DUMMY users are ONLY shown in Simulator - not in real app
    // Simulator has its own query in /admin/super/simulator

    // Fetch real nearby users only
    for (const hash of geohashes) {
      const q = query(
        usersRef,
        where("location.geohash", ">=", hash),
        where("location.geohash", "<=", hash + "\uf8ff"),
        limit(MATCH_CONFIG.QUERY_LIMIT)
      )

      const snapshot = await getDocs(q)

      snapshot.forEach((docSnap) => {
        // ✅ v2.8.5 FIX: Include uid from document ID!
        const user = { ...docSnap.data(), uid: docSnap.id } as UserProfile

        // Skip current user
        if (user.uid === currentUserId) return
        
        // Skip dummy users (already added)
        if ((user as any).isDummy === true) return
        
        // ✅ Skip deleted users
        if ((user as any).deleted === true) return

        // ✅ FIX: Check if CURRENT USER already swiped on this user
        if (currentUserProfile.swipedRight?.includes(user.uid)) return
        if (currentUserProfile.swipedLeft?.includes(user.uid)) return

        // ✅ 12-hour cooldown: Skip users that matched within last 12 hours
        if (matchesOnCooldown.has(user.uid)) {
          console.log(`⏰ Skipping ${user.name} - match cooldown (12h)`)
          return
        }

        // Skip if other user already swiped on current user
        if (user.swipedRight?.includes(currentUserId)) return
        if (user.swipedLeft?.includes(currentUserId)) return

        // ✅ Gender filtering - supports 'both' for same-sex matching
        if (lookingFor !== 'both' && user.gender !== lookingFor) {
          console.log(`⚠️ Skipping ${user.name} - wrong gender (${user.gender}, looking for ${lookingFor})`)
          return
        }
        
        // ✅ Check if other user accepts our gender (two-way compatibility)
        const otherUserLookingFor = user.preferences?.lookingFor || 'both'
        if (otherUserLookingFor !== 'both' && currentUserGender !== otherUserLookingFor) {
          console.log(`⚠️ Skipping ${user.name} - they're looking for ${otherUserLookingFor}, we are ${currentUserGender}`)
          return
        }
        
        // ✅ NEW: Two-way age filtering
        const otherUserAge = user.age
        if (otherUserAge) {
          if (otherUserAge < currentUserAgeRange[0] || otherUserAge > currentUserAgeRange[1]) {
            console.log(`⚠️ User ${user.name} (age ${otherUserAge}) filtered - outside age range ${currentUserAgeRange[0]}-${currentUserAgeRange[1]}`)
            return
          }
        }
        
        const otherUserAgeRange = user.preferences?.ageRange || [18, 80]
        if (currentUserAge) {
          if (currentUserAge < otherUserAgeRange[0] || currentUserAge > otherUserAgeRange[1]) {
            console.log(`⚠️ User ${user.name} filtered - current user (age ${currentUserAge}) outside their age range ${otherUserAgeRange[0]}-${otherUserAgeRange[1]}`)
            return
          }
        }

        // ✅ v2.8.27: Smoking filter
        if (smokingFilter !== 'any') {
          const otherUserSmoking = (user as any).smoking || 'no'  // Default to 'no' if not set
          if (smokingFilter === 'no' && otherUserSmoking !== 'no') {
            console.log(`🚬 User ${user.name} filtered - smoker (${otherUserSmoking}), looking for non-smokers only`)
            return
          }
          if (smokingFilter === 'no_or_social' && otherUserSmoking === 'yes') {
            console.log(`🚬 User ${user.name} filtered - regular smoker, looking for non-smokers or social only`)
            return
          }
        }

        // Calculate exact distance
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          user.location.latitude,
          user.location.longitude
        )

        // ✅ Filter by distance range with logging
        if (distance >= minDistance && distance <= maxDistance) {
          nearbyUsers.push({ ...user, distance })
          console.log(`✅ Real user ${user.name} added: ${Math.round(distance)}m`)
        } else {
          console.log(`❌ Real user ${user.name} filtered out: ${Math.round(distance)}m (out of range)`)
        }
      })
    }

    console.log(`📊 Total users after filtering: ${nearbyUsers.length}`)
    
    // Sort by distance (closest first)
    return nearbyUsers.sort((a, b) => a.distance - b.distance)
    
  } catch (error) {
    console.error('Error finding nearby users:', error)
    throw new Error(ERROR_MESSAGES.NO_USERS_FOUND)
  }
}

/**
 * Record a swipe (like or pass)
 * ✅ FIXED: Returns match data if mutual like detected
 */
export const recordSwipe = async (
  currentUserId: string,
  targetUserId: string,
  liked: boolean
): Promise<{ isMatch: boolean; targetUserData?: any }> => {
  try {
    const currentUserRef = doc(db, "users", currentUserId)
    const targetUserRef = doc(db, "users", targetUserId)

    console.log(`🔄 recordSwipe called:`, {
      currentUserId: currentUserId.substring(0, 8),
      targetUserId: targetUserId.substring(0, 8),
      action: liked ? '❤️ LIKE' : '❌ PASS'
    })

    if (liked) {
      // Step 1: Add targetUserId to currentUser's swipedRight
      console.log(`📝 Step 1: Adding ${targetUserId.substring(0, 8)} to ${currentUserId.substring(0, 8)}'s swipedRight...`)
      await setDoc(currentUserRef, {
        swipedRight: arrayUnion(targetUserId),
      }, { merge: true })
      console.log(`✅ Step 1 complete: Like recorded`)

      // Step 2: Check if target user already liked current user (MUTUAL LIKE!)
      console.log(`📝 Step 2: Checking if ${targetUserId.substring(0, 8)} already liked ${currentUserId.substring(0, 8)}...`)
      const targetUserSnap = await getDoc(targetUserRef)
      
      if (targetUserSnap.exists()) {
        const targetUser = targetUserSnap.data() as UserProfile
        const targetSwipedRight = targetUser.swipedRight || []
        
        console.log(`📊 ${targetUserId.substring(0, 8)}'s swipedRight:`, {
          count: targetSwipedRight.length,
          includes_currentUser: targetSwipedRight.includes(currentUserId)
        })

        if (targetSwipedRight.includes(currentUserId)) {
          // ✅ IT'S A MUTUAL MATCH! 🎉 (both liked each other!)
          console.log(`🎉🎉🎉 MUTUAL MATCH DETECTED! 🎉🎉🎉`)
          console.log(`   User A: ${currentUserId.substring(0, 8)} ❤️ User B`)
          console.log(`   User B: ${targetUserId.substring(0, 8)} ❤️ User A`)
          console.log(`   Result: MATCH! Creating match document...`)
          
          await createMatch(currentUserId, targetUserId)
          console.log(`✅ Match document created successfully`)
          
          return { isMatch: true, targetUserData: targetUser }
        } else {
          console.log(`💚 One-sided like: ${currentUserId.substring(0, 8)} likes ${targetUserId.substring(0, 8)}`)
          console.log(`   Waiting for ${targetUserId.substring(0, 8)} to like back...`)
        }
      } else {
        console.warn(`⚠️ Target user ${targetUserId.substring(0, 8)} not found in database`)
      }
      
      // ✅ Only one person liked - save for later
      console.log(`💾 Pending like saved: ${currentUserId.substring(0, 8)} → ${targetUserId.substring(0, 8)}`)
      return { isMatch: false }
    } else {
      // Add to swipedLeft
      console.log(`❌ Pass recorded: ${currentUserId.substring(0, 8)} → ${targetUserId.substring(0, 8)}`)
      await setDoc(currentUserRef, {
        swipedLeft: arrayUnion(targetUserId),
      }, { merge: true })
    }

    return { isMatch: false }
    
  } catch (error) {
    console.error('❌ Error recording swipe:', error)
    throw new Error(ERROR_MESSAGES.SWIPE_ERROR)
  }
}

/**
 * Create a match between two users
 */
const createMatch = async (userId1: string, userId2: string): Promise<void> => {
  try {
    const matchId = [userId1, userId2].sort().join("_")
    const matchRef = doc(db, "matches", matchId)

    // ✅ NEW: Get the venue where this match happened (for venue-based cooldown)
    let matchVenue: string | null = null
    try {
      const user1Doc = await getDoc(doc(db, "users", userId1))
      if (user1Doc.exists()) {
        matchVenue = user1Doc.data().checkedInVenue || null
      }
    } catch (e) {
      console.warn('Could not get venue for match:', e)
    }

    // ✅ v2.8.14: Clear chatEndedBy to ensure fresh chat state for new match
    await setDoc(matchRef, {
      users: [userId1, userId2],
      timestamp: Timestamp.now(),
      chatId: matchId,
      venue: matchVenue,  // ✅ NEW: Save venue for venue-based cooldown
      chatEndedBy: [],  // ✅ v2.8.14: Clear any previous "End Chat" status!
      chatEndedAt: null,  // ✅ v2.8.14: Clear end time
      status: 'active'  // ✅ v2.8.14: Set initial status
    })

    // Add to both users' matches array
    await setDoc(doc(db, "users", userId1), {
      matches: arrayUnion(userId2),
    }, { merge: true })

    await setDoc(doc(db, "users", userId2), {
      matches: arrayUnion(userId1),
    }, { merge: true })
    
    // ✅ "She Decides" - Consume pass from the user who triggered the match
    // userId1 = the user who just swiped right (triggering the match)
    try {
      await consumePassOnMatch(userId1)
      console.log(`🎫 Pass consumed for user ${userId1.substring(0, 8)} (triggered match)`)
    } catch (passError) {
      // Don't fail the match if pass consumption fails
      console.warn('⚠️ Could not consume pass:', passError)
    }
    
    console.log('🎉 Match created:', matchId, matchVenue ? `at venue: ${matchVenue}` : '(no venue)')
    
  } catch (error) {
    console.error('Error creating match:', error)
    throw new Error(ERROR_MESSAGES.MATCH_ERROR)
  }
}

/**
 * ✅ NEW: Consume pass when a match is created
 * This ensures users can't keep getting matches without paying
 */
async function consumePassOnMatch(userId: string): Promise<void> {
  try {
    // Get phone number for this user
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) return
    
    // Dev mode phone number
    const phoneNumber = `dev_${userId.substring(0, 8)}`
    const phoneRef = doc(db, "phoneIdentities", phoneNumber)
    const phoneDoc = await getDoc(phoneRef)
    
    if (!phoneDoc.exists()) return
    
    const phoneData = phoneDoc.data()
    const currentPasses = phoneData.passesLeft || 0
    
    // Only consume if user has passes
    if (currentPasses > 0) {
      await setDoc(phoneRef, {
        passesLeft: Math.max(0, currentPasses - 1),
        lastPassUsed: Timestamp.now()
      }, { merge: true })
      
      console.log(`🎫 Pass consumed on match: ${phoneNumber} now has ${currentPasses - 1} passes`)
    }
  } catch (error) {
    console.error('Error consuming pass on match:', error)
    // Don't throw - match should still succeed
  }
}

/**
 * Delete user account completely
 * This removes ALL user data including swipes, matches, and profile
 */
export const deleteUserAccount = async (uid: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting user account:', uid)
    
    const userRef = doc(db, "users", uid)
    
    // ✅ Actually DELETE the document instead of marking as deleted
    await deleteDoc(userRef)
    
    console.log('✅ User account deleted successfully')
    
  } catch (error) {
    console.error('Error deleting user account:', error)
    throw new Error('Failed to delete account')
  }
}

/**
 * ✅ NEW: Reset user's swipe history
 * This allows users to see everyone again without deleting their account
 * Use case: Settings → "Reset Swipes" button
 */
export const resetUserSwipes = async (uid: string): Promise<void> => {
  try {
    console.log('🔄 Resetting swipes for user:', uid)
    
    const userRef = doc(db, "users", uid)
    
    await setDoc(userRef, {
      swipedRight: [],
      swipedLeft: []
    }, { merge: true })
    
    console.log('✅ Swipes reset successfully - user will see everyone again')
    
  } catch (error) {
    console.error('Error resetting swipes:', error)
    throw new Error('Failed to reset swipes')
  }
}

/**
 * Get user's matches (optimized with Promise.all)
 */
export const getUserMatches = async (userId: string): Promise<UserProfile[]> => {
  try {
    const userSnap = await getDoc(doc(db, "users", userId))
    
    if (!userSnap.exists()) {
      return []
    }
    
    const user = userSnap.data() as UserProfile

    if (!user.matches || user.matches.length === 0) {
      return []
    }

    // ✅ FIX: Use Promise.all instead of loop to avoid N+1 queries
    const matchedUsersPromises = user.matches.map(matchedUserId => 
      getUserProfile(matchedUserId)
    )
    
    const matchedUsers = await Promise.all(matchedUsersPromises)
    
    // Filter out null results
    return matchedUsers.filter((user): user is UserProfile => user !== null)
    
  } catch (error) {
    console.error('Error getting user matches:', error)
    throw new Error(ERROR_MESSAGES.FIRESTORE_LOAD_ERROR)
  }
}

// ============================================
// 🛡️ AVAILABLE NOW FEATURE
// Privacy control - users can hide from search
// ============================================

/**
 * Find nearby users who are AVAILABLE
 * Only shows users with isAvailable = true
 * If current user is hidden, returns empty array
 */
export const findNearbyAvailableUsers = async (
  currentUserId: string,
  userLocation: { latitude: number; longitude: number; geohash: string },
  maxDistance: number = LOCATION_CONFIG.DEFAULT_MAX_DISTANCE,
  minDistance: number = LOCATION_CONFIG.DEFAULT_MIN_DISTANCE
): Promise<UserProfileWithDistance[]> => {
  try {
    console.log(`🔍 [Available Filter] Searching for available users within ${minDistance}m - ${maxDistance}m`)
    
    // ✅ STEP 1: Check if current user is available
    const currentUserProfile = await getUserProfile(currentUserId)
    if (!currentUserProfile) {
      throw new Error('Current user profile not found')
    }

    // ✅ If current user is HIDDEN → return empty (don't show anyone)
    const isCurrentUserAvailable = (currentUserProfile as any).isAvailable ?? true
    if (!isCurrentUserAvailable) {
      console.log('🚫 You are HIDDEN - not showing any users')
      return []
    }

    console.log('✅ You are AVAILABLE - searching for other available users')
    
    // ✅ FIXED: Use user's actual preferences for lookingFor
    const currentUserGender = currentUserProfile.gender
    const userLookingFor = currentUserProfile.preferences?.lookingFor
    
    // ✅ Determine what genders to show
    let lookingFor: 'male' | 'female' | 'both'
    if (userLookingFor === 'both') {
      lookingFor = 'both'
    } else if (userLookingFor === 'male' || userLookingFor === 'female') {
      lookingFor = userLookingFor
    } else {
      // Default: "She Decides" - opposite gender
      lookingFor = currentUserGender === 'male' ? 'female' : 'male'
    }
    console.log(`🔍 Looking for: ${lookingFor} (preference: ${userLookingFor || 'default'})`)
    
    // ✅ 12-hour match cooldown - load users on cooldown
    const matchesOnCooldown = await getMatchesOnCooldown(currentUserId)
    console.log(`⏰ Users on 12h match cooldown: ${matchesOnCooldown.size}`)
    
    const geohashes = getGeohashNeighbors(userLocation.geohash)
    const usersRef = collection(db, "users")
    const nearbyUsers: UserProfileWithDistance[] = []

    // ✅ DUMMY users are ONLY shown in Simulator - not in real app

    // Fetch real nearby users
    for (const hash of geohashes) {
      const q = query(
        usersRef,
        where("location.geohash", ">=", hash),
        where("location.geohash", "<=", hash + "\uf8ff"),
        limit(MATCH_CONFIG.QUERY_LIMIT)
      )

      const snapshot = await getDocs(q)

      snapshot.forEach((docSnap) => {
        // ✅ v2.8.5 FIX: Include uid from document ID!
        const user = { ...docSnap.data(), uid: docSnap.id } as UserProfile

        if (user.uid === currentUserId) return
        if ((user as any).isDummy === true) return
        if ((user as any).deleted === true) return
        
        // ✅ Filter by isAvailable in code (avoid composite index)
        const isAvailable = (user as any).isAvailable ?? true
        if (!isAvailable) return

        // Skip already swiped
        if (currentUserProfile.swipedRight?.includes(user.uid)) return
        if (currentUserProfile.swipedLeft?.includes(user.uid)) return
        if (user.swipedRight?.includes(currentUserId)) return
        if (user.swipedLeft?.includes(currentUserId)) return

        // ✅ 12-hour cooldown: Skip users that matched within last 12 hours
        if (matchesOnCooldown.has(user.uid)) {
          console.log(`⏰ Skipping ${user.name} - match cooldown (12h)`)
          return
        }

        // ✅ Gender filtering - supports 'both' for same-sex matching
        if (lookingFor !== 'both' && user.gender !== lookingFor) {
          return
        }
        
        // ✅ Check if other user accepts our gender (two-way compatibility)
        const otherUserLookingFor = user.preferences?.lookingFor || 'both'
        if (otherUserLookingFor !== 'both' && currentUserGender !== otherUserLookingFor) {
          return
        }

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          user.location.latitude,
          user.location.longitude
        )

        if (distance >= minDistance && distance <= maxDistance) {
          nearbyUsers.push({ ...user, distance })
          console.log(`✅ Available user: ${user.name} (${Math.round(distance)}m)`)
        }
      })
    }

    console.log(`📊 Total available users found: ${nearbyUsers.length}`)
    
    return nearbyUsers.sort((a, b) => a.distance - b.distance)
    
  } catch (error) {
    console.error('Error finding nearby available users:', error)
    throw new Error(ERROR_MESSAGES.NO_USERS_FOUND)
  }
}

/**
 * Update user's available status
 * When false, user is hidden from search
 */
export const updateAvailableStatus = async (
  userId: string,
  isAvailable: boolean
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId)
    await setDoc(userRef, {
      isAvailable,
      lastAvailableToggle: Timestamp.now(),
    }, { merge: true })
    
    console.log(`✅ User ${userId} is now ${isAvailable ? 'AVAILABLE' : 'HIDDEN'}`)
  } catch (error) {
    console.error('Error updating available status:', error)
    throw new Error('Failed to update availability')
  }
}

// ============================================
// ⏰ ACTIVE MATCH TIMER SYSTEM
// Timestamp-based timer that survives app minimize, logout, etc.
// ============================================

/**
 * Create or update active match with expiration timer
 * Saves matchExpiresAt as Timestamp in Firestore
 * @param lockedForUser - If provided, this user needs to pay to unlock the match
 */
export const createActiveMatch = async (
  userId: string,
  matchedUserId: string,
  durationMinutes: number = 10,
  lockedForUser?: string  // ✅ NEW: User ID that needs to pay
): Promise<Date> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)
    
    console.log(`⏰ Creating active match: ${matchId} (expires in ${durationMinutes} minutes)`)
    if (lockedForUser) {
      console.log(`🔒 Match locked for user: ${lockedForUser}`)
    }
    
    // ✅ v2.8.4 CRITICAL: Clear previous chat history for FRESH START!
    // This ensures: clean chat, pink button works, suggested messages appear!
    console.log(`🧹 Clearing previous chat history for fresh start...`)
    try {
      // ✅ v2.8.5 FIX: Messages are stored in 'matches' collection, not 'chats'!
      const messagesRef = collection(db, 'matches', matchId, 'messages')
      const messagesSnap = await getDocs(messagesRef)
      
      if (!messagesSnap.empty) {
        console.log(`🧹 Deleting ${messagesSnap.size} old messages from chat: ${matchId}`)
        const batch = writeBatch(db)
        messagesSnap.forEach((docSnap) => {
          batch.delete(docSnap.ref)
        })
        await batch.commit()
        console.log('✅ Previous chat cleared - fresh start!')
      } else {
        console.log('✅ Chat already clean - no old messages')
      }
    } catch (chatClearError) {
      console.error('⚠️ Error clearing chat (non-critical):', chatClearError)
      // Continue anyway - not critical
    }
    
    await setDoc(doc(db, 'activeMatches', matchId), {
      users: [userId, matchedUserId],
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      isActive: true,
      lockedForUsers: lockedForUser ? [lockedForUser] : []  // ✅ NEW: Track locked users
    })
    
    console.log(`✅ Active match created, expires at: ${expiresAt.toLocaleString()}`)
    return expiresAt
  } catch (error) {
    console.error('Error creating active match:', error)
    throw new Error('Failed to create active match')
  }
}

/**
 * Get active match expiration time
 * Returns the Date when match expires, or null if no active match
 */
export const getActiveMatchExpiration = async (
  userId: string,
  matchedUserId: string
): Promise<Date | null> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    const matchDoc = await getDoc(doc(db, 'activeMatches', matchId))
    
    if (!matchDoc.exists()) {
      console.log(`❌ No active match found: ${matchId}`)
      return null
    }
    
    const data = matchDoc.data()
    if (!data.isActive) {
      console.log(`⏹️ Match is no longer active: ${matchId}`)
      return null
    }
    
    const expiresAt = data.expiresAt.toDate()
    const now = new Date()
    
    // Check if already expired
    if (expiresAt <= now) {
      console.log(`⏰ Match already expired: ${matchId}`)
      // Auto-deactivate expired matches
      await clearActiveMatch(userId, matchedUserId)
      return null
    }
    
    console.log(`✅ Active match expires at: ${expiresAt.toLocaleString()}`)
    return expiresAt
  } catch (error) {
    console.error('Error getting active match expiration:', error)
    return null
  }
}

/**
 * Check if a user is locked on a specific match (needs to pay)
 */
export const isUserLockedOnMatch = async (
  userId: string,
  matchedUserId: string
): Promise<boolean> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    const matchDoc = await getDoc(doc(db, 'activeMatches', matchId))
    
    if (!matchDoc.exists()) {
      return false  // No match = not locked
    }
    
    const data = matchDoc.data()
    const lockedUsers = data.lockedForUsers || []
    
    const isLocked = lockedUsers.includes(userId)
    console.log(`🔒 User ${userId.slice(0, 8)}... locked on match: ${isLocked}`)
    
    return isLocked
  } catch (error) {
    console.error('Error checking if user locked on match:', error)
    return false  // Default to not locked on error
  }
}

/**
 * Unlock a match for a user (after payment)
 */
export const unlockMatchForUser = async (
  userId: string,
  matchedUserId: string
): Promise<void> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    const matchRef = doc(db, 'activeMatches', matchId)
    const matchDoc = await getDoc(matchRef)
    
    if (!matchDoc.exists()) {
      console.log('❌ No match to unlock')
      return
    }
    
    const data = matchDoc.data()
    const lockedUsers = data.lockedForUsers || []
    
    // Remove user from locked list
    const updatedLockedUsers = lockedUsers.filter((id: string) => id !== userId)
    
    await updateDoc(matchRef, {
      lockedForUsers: updatedLockedUsers
    })
    
    console.log(`🔓 Match unlocked for user ${userId.slice(0, 8)}...`)
  } catch (error) {
    console.error('Error unlocking match:', error)
    throw error
  }
}

/**
 * ✅ NEW: Get active match for a user (without knowing matched user)
 * This is used when app is reopened from memory to restore match state
 */
export const getActiveMatchForUser = async (userId: string): Promise<{
  matchedUser: any | null
  expiresAt: Date | null
  createdAt?: Date | null  // ✅ NEW: When match was created (for Chat First logic)
  status?: string  // ✅ NEW: 'matched' | 'successful' | 'meeting'
  meetingStartedAt?: Date | null  // ✅ NEW: When meeting started
  matchId?: string  // ✅ NEW: For reference
  lockedForUsers?: string[]  // ✅ NEW: Users who need to pay
  meetingConfirmedBy?: string | null  // ✅ v2.8.13: Who clicked "We're Meeting"
} | null> => {
  try {
    console.log(`🔍 Searching for active match for user: ${userId}`)
    
    // Query activeMatches where users array contains userId
    const matchesQuery = query(
      collection(db, 'activeMatches'),
      where('users', 'array-contains', userId),
      where('isActive', '==', true)
    )
    
    const matchesSnapshot = await getDocs(matchesQuery)
    
    if (matchesSnapshot.empty) {
      console.log(`📭 No active matches found for user ${userId}`)
      return null
    }
    
    // Should only be one active match
    const matchDoc = matchesSnapshot.docs[0]
    const matchData = matchDoc.data()
    
    // Check if expired
    const expiresAt = matchData.expiresAt.toDate()
    const now = new Date()
    
    // ✅ v2.8.18 FIX: If status is 'meeting', use meetingStartedAt + 20 min instead of expiresAt!
    const status = matchData.status || 'matched'
    const meetingStartedAt = matchData.meetingStartedAt ? matchData.meetingStartedAt.toDate() : null
    
    if (status === 'meeting' && meetingStartedAt) {
      // Meeting mode - check meeting timer (20 minutes from meeting start)
      const meetingEndTime = new Date(meetingStartedAt.getTime() + 20 * 60 * 1000)
      
      if (now > meetingEndTime) {
        console.log(`⏰ Meeting time expired (started: ${meetingStartedAt.toLocaleString()})`)
        const otherUserId = matchData.users.find((id: string) => id !== userId)
        if (otherUserId) {
          await clearActiveMatch(userId, otherUserId)
        }
        return null
      }
      
      console.log(`🎉 Meeting still active! Time remaining: ${Math.round((meetingEndTime.getTime() - now.getTime()) / 60000)} min`)
    } else if (expiresAt <= now) {
      console.log(`⏰ Match expired, clearing...`)
      const otherUserId = matchData.users.find((id: string) => id !== userId)
      if (otherUserId) {
        await clearActiveMatch(userId, otherUserId)
      }
      return null
    }
    
    // Get other user's ID
    const matchedUserId = matchData.users.find((id: string) => id !== userId)
    
    if (!matchedUserId) {
      console.error(`❌ Could not find other user in match`)
      return null
    }
    
    // Get matched user's profile
    const matchedUserProfile = await getUserProfile(matchedUserId)
    
    if (!matchedUserProfile) {
      console.error(`❌ Could not load matched user profile`)
      return null
    }
    
    const lockedForUsers = matchData.lockedForUsers || []
    const isLocked = lockedForUsers.includes(userId)
    
    console.log(`✅ Active match found! Matched with: ${matchedUserProfile.name}`)
    console.log(`⏰ Match expires at: ${expiresAt.toLocaleString()}`)
    console.log(`📊 Match status: ${matchData.status || 'matched'}`)
    console.log(`🔒 User locked: ${isLocked}`)
    
    // ✅ NEW: Return status, meetingStartedAt, createdAt, and lockedForUsers
    return {
      matchedUser: matchedUserProfile,
      expiresAt,
      createdAt: matchData.createdAt ? matchData.createdAt.toDate() : null,
      status: matchData.status || 'matched',
      meetingStartedAt: matchData.meetingStartedAt ? matchData.meetingStartedAt.toDate() : null,
      matchId: matchDoc.id,
      lockedForUsers,
      meetingConfirmedBy: matchData.meetingConfirmedBy || null  // ✅ v2.8.13: Who clicked "We're Meeting"
    }
  } catch (error) {
    console.error('Error getting active match for user:', error)
    return null
  }
}

/**
 * Calculate remaining time in seconds for active match
 * Returns seconds remaining, or null if no active match
 */
export const getActiveMatchTimeRemaining = async (
  userId: string,
  matchedUserId: string
): Promise<number | null> => {
  try {
    const expiresAt = await getActiveMatchExpiration(userId, matchedUserId)
    if (!expiresAt) return null
    
    const now = new Date()
    const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    
    console.log(`⏰ Time remaining: ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`)
    return remaining
  } catch (error) {
    console.error('Error getting time remaining:', error)
    return null
  }
}

/**
 * Clear/deactivate active match
 */
export const clearActiveMatch = async (
  userId: string,
  matchedUserId: string
): Promise<void> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    console.log(`🗑️ Clearing active match: ${matchId}`)
    
    await setDoc(doc(db, 'activeMatches', matchId), {
      isActive: false,
      status: 'expired',  // ✅ Timer expired
      clearedAt: Timestamp.now()
    }, { merge: true })
    
    // ✅ CRITICAL: Update 'matches' collection for 12-hour cooldown!
    // This ensures they can't match again for 12 hours
    await setDoc(doc(db, 'matches', matchId), {
      users: [userId, matchedUserId].sort(),
      status: 'expired',
      timestamp: Timestamp.now(),  // ✅ Update timestamp for cooldown!
      expiredAt: Timestamp.now()
    }, { merge: true })
    
    console.log(`✅ Active match cleared + 12h cooldown set: ${matchId}`)
  } catch (error) {
    console.error('Error clearing active match:', error)
    throw new Error('Failed to clear active match')
  }
}

/**
 * ✅ NEW: Mark match as successful (they're meeting!)
 * This is different from expired - they actually made plans
 */
export const markMatchAsSuccessful = async (
  userId: string,
  matchedUserId: string
): Promise<void> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    console.log(`🎉 Marking match as MEETING: ${matchId}`)
    
    // ✅ CRITICAL FIX: Keep isActive TRUE during meeting!
    // This allows us to restore Enjoy Mode after app restart
    await setDoc(doc(db, 'activeMatches', matchId), {
      isActive: true,  // ✅ CHANGED: Keep active so we can restore after app restart!
      status: 'meeting',  // ✅ NEW: They're meeting!
      meetingConfirmedBy: userId,  // Who confirmed (the woman)
      meetingStartedAt: Timestamp.now(),  // ✅ NEW: When the meeting was confirmed
      meetingConfirmedAt: Timestamp.now(),
    }, { merge: true })
    
    // ✅ Also save to 'matches' collection for 12-hour cooldown
    // ✅ v2.8.14: CRITICAL - Clear chatEndedBy to prevent "HAS LEFT" showing incorrectly!
    await setDoc(doc(db, 'matches', matchId), {
      users: [userId, matchedUserId].sort(),
      status: 'meeting',  // ✅ Changed from 'successful' to 'meeting'
      timestamp: Timestamp.now(),
      meetingStartedAt: Timestamp.now(),
      meetingConfirmedBy: userId,
      chatEndedBy: [],  // ✅ v2.8.14: Clear any previous "End Chat" status!
      chatEndedAt: null  // ✅ v2.8.14: Clear end time
    }, { merge: true })
    console.log(`✅ Match saved to 'matches' collection with 'meeting' status (chatEndedBy cleared)`)
    
    // ✅ Send notification to the OTHER user!
    await sendWeAreMeetingNotification(userId, matchedUserId)
    
    console.log(`✅ Match marked as MEETING by ${userId}: ${matchId}`)
  } catch (error) {
    console.error('Error marking match as meeting:', error)
    throw new Error('Failed to mark match as meeting')
  }
}

/**
 * ✅ NEW: Mark meeting as completed (after Enjoy Mode ends)
 * Called when the 20-minute cooldown expires or user exits early
 */
export const markMeetingAsCompleted = async (
  matchId: string,
  exitReason: 'timeout' | 'manual',
  exitedByUserId?: string  // ✅ NEW: Track who exited
): Promise<void> => {
  try {
    console.log(`✅ Marking meeting as completed: ${matchId}, reason: ${exitReason}, exitedBy: ${exitedByUserId || 'unknown'}`)
    
    await setDoc(doc(db, 'activeMatches', matchId), {
      isActive: false,  // ✅ NEW: Now we can set to false - meeting is over!
      status: 'completed',  // ✅ Changed from 'successful' to 'completed' for clarity
      meetingCompletedAt: Timestamp.now(),
      meetingExitReason: exitReason,
      meetingExitedBy: exitedByUserId || null,  // ✅ NEW: Who exited
    }, { merge: true })
    
    await setDoc(doc(db, 'matches', matchId), {
      status: 'completed',
      completedAt: Timestamp.now(),
      meetingExitReason: exitReason,
      meetingExitedBy: exitedByUserId || null,
    }, { merge: true })
    
    console.log(`✅ Meeting marked as completed: ${matchId}`)
    
    // ✅ NEW: Create notifications for BOTH users so they can access chat history
    const userIds = matchId.split('_')
    if (userIds.length === 2) {
      await createMeetingCompletedNotifications(userIds[0], userIds[1], matchId)
    }
    
  } catch (error) {
    console.error('Error marking meeting as completed:', error)
  }
}

/**
 * ✅ DISABLED: Meeting completed notifications - clutters notification screen
 * Users can still access chat history through their recent chats
 */
export const createMeetingCompletedNotifications = async (
  user1Id: string,
  user2Id: string,
  matchId: string
): Promise<void> => {
  // ✅ DISABLED: No longer creating in-app notifications for meeting completion
  // Chat history is still accessible through the chat system
  console.log(`📭 Skipping meeting_completed notifications (disabled) for ${user1Id} and ${user2Id}`)
  return
}

/**
 * ✅ UPDATED: Send "We're Meeting!" notification - PUSH only, no in-app clutter
 * Push notification brings user back to app where they see the modal
 */
async function sendWeAreMeetingNotification(
  senderId: string,
  recipientId: string
): Promise<void> {
  try {
    // Get sender's info for the notification
    const senderDoc = await getDoc(doc(db, 'users', senderId))
    const senderData = senderDoc.data()
    
    const senderName = senderData?.name || senderData?.displayName || 'Your match'
    const senderPhoto = senderData?.photos?.[0] || senderData?.photoURL || ''
    
    // ✅ REMOVED: In-app notification (clutters notification screen)
    // User will see modal when they open app from push notification
    console.log('📱 Skipping in-app notification for meeting (user sees modal instead)')
    
    // ✅ KEEP: Send PUSH notification via OneSignal API (for when user is outside app)
    try {
      const matchId = [senderId, recipientId].sort().join('_')
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meeting',
          targetUserId: recipientId,
          title: '🎉 We\'re Meeting!',
          message: `${senderName} confirmed you're meeting! Have a great time! 💕`,
          data: {
            matchId,
            fromUserId: senderId,
            fromUserName: senderName,
            fromUserPhoto: senderPhoto
          }
        })
      })
      
      if (response.ok) {
        console.log('✅ PUSH notification sent to:', recipientId)
      } else {
        const error = await response.json()
        console.error('❌ Push API error:', error)
      }
    } catch (pushError) {
      console.error('⚠️ Push notification failed:', pushError)
    }
    
  } catch (error) {
    console.error('❌ Error sending "We\'re Meeting" notification:', error)
  }
}

/**
 * ✅ NEW: Get match status (active/successful/expired)
 */
export const getMatchStatus = async (
  userId: string,
  matchedUserId: string
): Promise<'active' | 'successful' | 'meeting' | 'expired' | null> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    const matchDoc = await getDoc(doc(db, 'activeMatches', matchId))
    
    if (!matchDoc.exists()) {
      return null  // No match found
    }
    
    const data = matchDoc.data()
    
    // Check status - 'meeting' means they clicked "We're Meeting!"
    if (data.status === 'successful' || data.status === 'meeting') {
      return data.status  // Return 'successful' or 'meeting'
    }
    
    if (data.isActive) {
      // Check if expired
      const expiresAt = data.expiresAt.toDate()
      if (expiresAt <= new Date()) {
        return 'expired'
      }
      return 'active'
    }
    
    return 'expired'
  } catch (error) {
    console.error('Error getting match status:', error)
    return null
  }
}

// ===================================
// 🔔 NOTIFICATION SYSTEM
// ===================================

export interface Notification {
  id: string
  userId?: string  // ✅ Optional - not stored in subcollection
  type: 'match' | 'message' | 'like' | 'event' | 'venue_announcement' | 'meeting' | 'meeting_completed'
  title: string
  subtitle: string
  body?: string  // ✅ Message body
  message?: string  // ✅ Alternative message field
  icon?: string  // Emoji or icon name
  fromUserId?: string  // Who triggered this notification (for matches/likes)
  fromUserName?: string
  fromUserPhoto?: string
  senderId?: string  // ✅ Sender ID for grouping
  senderName?: string  // ✅ Sender name for display
  senderPhoto?: string  // ✅ Sender photo for display
  matchId?: string  // For navigation to match
  chatId?: string  // For navigation to chat
  venueId?: string  // For venue announcements
  venueName?: string
  isRead: boolean
  timestamp?: Timestamp  // Primary timestamp field
  createdAt?: Timestamp  // ✅ Alternative timestamp field (for compatibility)
  data?: any  // Additional data if needed
}

/**
 * Create a notification for a user
 */
export const createNotification = async (
  userId: string,
  notificationData: Omit<Notification, 'id' | 'userId' | 'isRead' | 'timestamp'>
): Promise<string> => {
  try {
    // ✅ Use user's personal notifications subcollection
    const notificationsRef = collection(db, 'users', userId, 'notifications')
    
    const notification = {
      isRead: false,
      timestamp: Timestamp.now(),
      ...notificationData
    }
    
    const docRef = await addDoc(notificationsRef, notification)
    
    console.log(`✅ Notification created for user ${userId}:`, notification.title)
    return docRef.id
  } catch (error) {
    console.error('Error creating notification:', error)
    throw new Error('Failed to create notification')
  }
}

/**
 * Get all notifications for a user (ordered by newest first)
 */
export const getNotifications = async (
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> => {
  try {
    // ✅ Use user's personal notifications subcollection
    const notificationsRef = collection(db, 'users', userId, 'notifications')
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    const notifications: Notification[] = []
    
    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification)
    })
    
    console.log(`📬 Loaded ${notifications.length} notifications for user ${userId}`)
    return notifications
  } catch (error) {
    console.error('Error getting notifications:', error)
    throw new Error('Failed to load notifications')
  }
}

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  try {
    // ✅ FIXED: Notifications are stored in top-level 'notifications' collection
    const notificationRef = doc(db, 'notifications', notificationId)
    
    // ✅ FIXED: Field name is 'isRead' to match how notifications are created
    await updateDoc(notificationRef, {
      isRead: true
    })
    
    console.log(`✅ Notification marked as read: ${notificationId}`)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    // Try user subcollection as fallback
    try {
      const userNotificationRef = doc(db, 'users', userId, 'notifications', notificationId)
      await updateDoc(userNotificationRef, {
        isRead: true
      })
      console.log(`✅ Notification marked as read (user subcollection): ${notificationId}`)
    } catch (fallbackError) {
      console.error('Error marking notification as read (both paths failed):', fallbackError)
    }
  }
}

/**
 * Delete a notification
 */
export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  console.log(`🗑️ deleteNotification called: userId=${userId}, notificationId=${notificationId}`)
  
  try {
    // ✅ FIXED: Notifications are stored in top-level 'notifications' collection, NOT under users
    const notificationRef = doc(db, 'notifications', notificationId)
    console.log(`   Path: notifications/${notificationId}`)
    
    // Check if document exists first
    const docSnap = await getDoc(notificationRef)
    if (!docSnap.exists()) {
      console.log(`   ⚠️ Notification not found at top-level, trying user subcollection...`)
      // Try user subcollection as fallback (for old notifications)
      const userNotificationRef = doc(db, 'users', userId, 'notifications', notificationId)
      const userDocSnap = await getDoc(userNotificationRef)
      if (userDocSnap.exists()) {
        await deleteDoc(userNotificationRef)
        console.log(`   ✅ Deleted from user subcollection`)
        return
      }
      console.log(`   ❌ Notification not found in either location`)
      throw new Error('Notification not found')
    }
    
    await deleteDoc(notificationRef)
    console.log(`   ✅ Notification deleted from top-level collection`)
  } catch (error) {
    console.error('❌ Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }
}

/**
 * Get count of unread notifications
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    // ✅ FIXED: Notifications are stored in top-level 'notifications' collection
    const notificationsRef = collection(db, 'notifications')
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)  // ✅ FIXED: Field name is 'read', not 'isRead'
    )
    
    const snapshot = await getDocs(q)
    const count = snapshot.size
    
    console.log(`🔔 User ${userId} has ${count} unread notifications`)
    return count
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}

/**
 * ✅ UPDATED: Create match notifications - PUSH only, no in-app clutter
 * User already sees match screen, no need for in-app notification
 */
export const createMatchNotifications = async (
  user1Id: string,
  user2Id: string,
  user1Name: string,
  user2Name: string,
  user1Photo?: string,
  user2Photo?: string
): Promise<void> => {
  try {
    const matchId = [user1Id, user2Id].sort().join('_')
    
    // ✅ DISABLED: In-app notifications (user already sees match screen)
    console.log('📭 Skipping in-app notifications for match (user sees match screen)')
    
    // ✅ KEEP: PUSH notifications via OneSignal (for when user is outside app)
    try {
      // Push to user 1
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'match',
          targetUserId: user1Id,
          title: '🦎 It\'s a Match!',
          message: `You and ${user2Name} liked each other! Start chatting now! 💚`,
          data: { matchId, fromUserId: user2Id, fromUserName: user2Name, fromUserPhoto: user2Photo }
        })
      })
      
      // Push to user 2
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'match',
          targetUserId: user2Id,
          title: '🦎 It\'s a Match!',
          message: `You and ${user1Name} liked each other! Start chatting now! 💚`,
          data: { matchId, fromUserId: user1Id, fromUserName: user1Name, fromUserPhoto: user1Photo }
        })
      })
      
      console.log('✅ PUSH notifications sent to both users')
    } catch (pushError) {
      console.error('⚠️ Push notifications failed:', pushError)
    }
    
    console.log(`✅ Match push notifications created for ${user1Name} & ${user2Name}`)
  } catch (error) {
    console.error('Error creating match notifications:', error)
    throw new Error('Failed to create match notifications')
  }
}

/**
 * ✅ NEW: Get users checked in at the same venue
 * Filters users by venue check-in status
 */
export const getUsersByVenue = async (
  venueId: string,
  currentUserId: string
): Promise<UserProfileWithDistance[]> => {
  try {
    console.log(`🏢 Getting users at venue: ${venueId}`)
    console.log(`👤 Current user ID: ${currentUserId}`)
    
    // ✅ FIX: Load current user's full profile to get age and age preferences
    const currentUserProfile = await getUserProfile(currentUserId)
    if (!currentUserProfile) {
      console.error('❌ Could not load current user profile')
      return []
    }
    
    // ✅ FIXED: Use user's actual preferences for lookingFor
    // Default to opposite gender (She Decides) but respect user preferences if set
    const currentUserGender = currentUserProfile.gender
    const userLookingFor = currentUserProfile.preferences?.lookingFor
    
    console.log(`🔍 DEBUG lookingFor:`)
    console.log(`   preferences object:`, currentUserProfile.preferences)
    console.log(`   userLookingFor from preferences: "${userLookingFor}"`)
    
    // ✅ Determine what genders to show
    let lookingFor: 'male' | 'female' | 'both'
    if (userLookingFor === 'both') {
      lookingFor = 'both'
    } else if (userLookingFor === 'male' || userLookingFor === 'female') {
      lookingFor = userLookingFor
    } else {
      // Default: "She Decides" - opposite gender
      lookingFor = currentUserGender === 'male' ? 'female' : 'male'
    }
    
    console.log(`   FINAL lookingFor: "${lookingFor}"`)
    
    const currentUserAge = currentUserProfile.age
    const currentUserAgeRange = currentUserProfile.preferences?.ageRange || [18, 80]
    const smokingFilter = currentUserProfile.preferences?.smokingFilter || 'any'  // ✅ v2.8.27: Smoking filter
    
    // ✅ VENUE-BASED COOLDOWN: Only applies at SAME venue!
    // Different venue = "fate brought us together!" = no cooldown 🔥
    const matchesOnCooldown = await getMatchesOnCooldown(currentUserId, venueId)
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`👤 CURRENT USER PROFILE:`)
    console.log(`   Name: ${currentUserProfile.name}`)
    console.log(`   Gender: ${currentUserGender}`)
    console.log(`   Age: ${currentUserAge}`)
    console.log(`   Looking for: ${lookingFor}`)
    console.log(`   Age range: ${currentUserAgeRange[0]}-${currentUserAgeRange[1]}`)
    console.log(`   Smoking filter: ${smokingFilter}`)
    console.log(`   Onboarding complete: ${currentUserProfile.onboardingComplete}`)
    console.log(`⏰ Users on venue-specific cooldown: ${matchesOnCooldown.size}`)
    console.log(`🔥 Different venue = NO cooldown (fate feature!)`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Query users checked in at this venue
    const usersRef = collection(db, 'users')
    const q = query(
      usersRef,
      where('checkedInVenue', '==', venueId)
    )
    
    const snapshot = await getDocs(q)
    console.log(`📊 Total users checked in at venue: ${snapshot.size}`)
    
    const users: UserProfile[] = []
    
    snapshot.forEach(docSnap => {
      // ✅ v2.8.5 FIX: Include uid from document ID!
      const userData = { ...docSnap.data(), uid: docSnap.id } as UserProfile
      
      console.log(`\n🔍 Checking user: ${userData.name || 'Unknown'} (${userData.uid?.substring(0, 8)}...)`)
      
      // ✅ FIX: Skip current user (prevent seeing yourself!)
      if (userData.uid === currentUserId) {
        console.log(`   ⏭️ SKIP: This is the current user (self)`)
        return
      }
      
      // ✅ Skip users already swiped in THIS SESSION
      // swipedRight/swipedLeft reset on every check-in, so this only blocks same-session repeats
      if (currentUserProfile.swipedRight?.includes(userData.uid)) {
        console.log(`   ⏭️ SKIP: Already liked this user (this session)`)
        return
      }
      if (currentUserProfile.swipedLeft?.includes(userData.uid)) {
        console.log(`   ⏭️ SKIP: Already skipped this user (this session)`)
        return
      }
      
      // ✅ VENUE-BASED COOLDOWN: Skip users that matched at THIS venue within 12 hours
      // Different venue = "fate!" = they CAN match again 🔥
      if (matchesOnCooldown.has(userData.uid)) {
        console.log(`   ⏭️ SKIP: Same-venue cooldown (12h) - matched at this venue recently`)
        return
      }
      
      // Skip if not onboarded
      if (!userData.onboardingComplete) {
        console.log(`   ⏭️ SKIP: Onboarding not complete`)
        return
      }
      
      // ✅ NEW: Skip deleted users
      if (userData.deleted === true) {
        console.log(`   ⏭️ SKIP: User account was deleted`)
        return
      }
      
      // ✅ Gender filtering - supports 'both' for same-sex matching
      if (lookingFor !== 'both' && userData.gender !== lookingFor) {
        console.log(`   ⏭️ SKIP: Wrong gender (${userData.gender}) - looking for ${lookingFor}`)
        return
      }
      
      // ✅ Check if other user accepts our gender (two-way compatibility)
      const otherUserLookingFor = userData.preferences?.lookingFor || 'both'
      if (otherUserLookingFor !== 'both' && currentUserGender !== otherUserLookingFor) {
        console.log(`   ⏭️ SKIP: They're looking for ${otherUserLookingFor}, not ${currentUserGender}`)
        return
      }
      
      // ✅ CRITICAL FIX: Two-way age filtering!
      // 3. Check if current user is interested in this user's age
      const otherUserAge = userData.age
      console.log(`   📊 Their age: ${otherUserAge}, Their age range: ${userData.preferences?.ageRange?.[0] || 18}-${userData.preferences?.ageRange?.[1] || 80}`)
      
      if (otherUserAge) {
        if (otherUserAge < currentUserAgeRange[0] || otherUserAge > currentUserAgeRange[1]) {
          console.log(`   ⏭️ SKIP: Their age (${otherUserAge}) is outside YOUR age range (${currentUserAgeRange[0]}-${currentUserAgeRange[1]})`)
          return
        }
      }
      
      // 4. Check if THIS user is interested in current user's age
      const otherUserAgeRange = userData.preferences?.ageRange || [18, 80]
      if (currentUserAge) {
        if (currentUserAge < otherUserAgeRange[0] || currentUserAge > otherUserAgeRange[1]) {
          console.log(`   ⏭️ SKIP: YOUR age (${currentUserAge}) is outside THEIR age range (${otherUserAgeRange[0]}-${otherUserAgeRange[1]})`)
          return
        }
      }
      
      // ✅ v2.8.27: Smoking filter
      if (smokingFilter !== 'any') {
        const otherUserSmoking = userData.smoking || 'no'  // Default to 'no' if not set
        if (smokingFilter === 'no' && otherUserSmoking !== 'no') {
          console.log(`   🚬 SKIP: Smoker (${otherUserSmoking}), looking for non-smokers only`)
          return
        }
        if (smokingFilter === 'no_or_social' && otherUserSmoking === 'yes') {
          console.log(`   🚬 SKIP: Regular smoker, looking for non-smokers or social only`)
          return
        }
      }
      
      // Check if check-in has expired
      if (userData.checkInData?.expiresAt) {
        const now = Date.now()
        const expiresAt = userData.checkInData.expiresAt.toMillis()
        
        if (now > expiresAt) {
          console.log(`   ⏭️ SKIP: Check-in expired`)
          return
        }
      }
      
      console.log(`   ✅ PASSED: Adding to results`)
      users.push(userData)
    })
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ FINAL RESULT: Found ${users.length} matching users at venue`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    // Add distance (0 since they're at same venue)
    const usersWithDistance: UserProfileWithDistance[] = users.map(user => ({
      ...user,
      distance: 0
    }))
    
    return usersWithDistance
  } catch (error) {
    console.error('❌ Error getting users by venue:', error)
    return []
  }
}

/**
 * ✅ NEW: Get user's current venue
 */
export const getUserVenue = async (userId: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) return null
    
    const userData = userDoc.data() as UserProfile
    
    // Check if check-in expired
    if (userData.checkInData?.expiresAt) {
      const now = Date.now()
      const expiresAt = userData.checkInData.expiresAt.toMillis()
      
      if (now > expiresAt) {
        console.log('⏰ Check-in expired')
        return null
      }
    }
    
    return userData.checkedInVenue || null
  } catch (error) {
    console.error('❌ Error getting user venue:', error)
    return null
  }
}

/**
 * ✅ CRITICAL: Clear all swipe references to a user from other users' profiles
 * Called when a user re-creates their profile after account deletion
 * This ensures the "new" user isn't blocked by old swipe data
 */
export const clearSwipeReferencesToUser = async (userId: string): Promise<number> => {
  console.log(`🧹 Clearing swipe references to user: ${userId}`)
  
  let clearedCount = 0
  
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      let needsUpdate = false
      const updates: any = {}
      
      // Check swipedRight
      if (userData.swipedRight && Array.isArray(userData.swipedRight)) {
        if (userData.swipedRight.includes(userId)) {
          updates.swipedRight = userData.swipedRight.filter((id: string) => id !== userId)
          needsUpdate = true
          console.log(`   🗑️ Removing from ${userData.name || userDoc.id}'s swipedRight`)
        }
      }
      
      // Check swipedLeft
      if (userData.swipedLeft && Array.isArray(userData.swipedLeft)) {
        if (userData.swipedLeft.includes(userId)) {
          updates.swipedLeft = userData.swipedLeft.filter((id: string) => id !== userId)
          needsUpdate = true
          console.log(`   🗑️ Removing from ${userData.name || userDoc.id}'s swipedLeft`)
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        await updateDoc(doc(db, 'users', userDoc.id), updates)
        clearedCount++
      }
    }
    
    console.log(`🧹 Cleared swipe references from ${clearedCount} users`)
    return clearedCount
    
  } catch (error) {
    console.error('❌ Error clearing swipe references:', error)
    return clearedCount
  }
}

/**
 * ✅ Clear match cooldown entries for a user
 * Called when a user re-creates their profile after account deletion
 */
export const clearMatchCooldownsForUser = async (userId: string): Promise<number> => {
  console.log(`🧹 Clearing match cooldowns for user: ${userId}`)
  
  let clearedCount = 0
  
  try {
    // Query matchCooldowns collection for entries involving this user
    const cooldownsRef = collection(db, 'matchCooldowns')
    const snapshot = await getDocs(cooldownsRef)
    
    for (const docSnap of snapshot.docs) {
      // matchCooldown IDs are formatted as "userId1_userId2" (sorted)
      if (docSnap.id.includes(userId)) {
        await deleteDoc(doc(db, 'matchCooldowns', docSnap.id))
        clearedCount++
        console.log(`   🗑️ Deleted cooldown: ${docSnap.id}`)
      }
    }
    
    console.log(`🧹 Cleared ${clearedCount} match cooldowns`)
    return clearedCount
    
  } catch (error) {
    console.error('❌ Error clearing match cooldowns:', error)
    return clearedCount
  }
}

/**
 * ✅ NEW: Check if both users have sent at least one message in the chat
 * This is required before "We're Meeting!" button is enabled
 */
export const checkBidirectionalChat = async (
  matchId: string,
  user1Id: string,
  user2Id: string,
  matchCreatedAt?: Date  // ✅ NEW: Only count messages AFTER this timestamp
): Promise<{
  hasBidirectionalChat: boolean
  user1HasSent: boolean
  user2HasSent: boolean
  messageCount: number
}> => {
  try {
    console.log(`💬 Checking bidirectional chat for match: ${matchId}`)
    console.log(`   user1Id: ${user1Id}`)
    console.log(`   user2Id: ${user2Id}`)
    if (matchCreatedAt) {
      console.log(`   Only counting messages after: ${matchCreatedAt.toLocaleString()}`)
    }
    
    // Get all messages in this chat
    // ✅ v2.8.5 FIX: Messages are stored in 'matches' collection, not 'chats'!
    const messagesRef = collection(db, 'matches', matchId, 'messages')
    const messagesSnap = await getDocs(messagesRef)
    
    console.log(`💬 Found ${messagesSnap.size} total messages in matches/${matchId}/messages`)
    
    if (messagesSnap.empty) {
      console.log('💬 No messages yet - bidirectional: false')
      return {
        hasBidirectionalChat: false,
        user1HasSent: false,
        user2HasSent: false,
        messageCount: 0
      }
    }
    
    let user1HasSent = false
    let user2HasSent = false
    let relevantMessageCount = 0
    
    messagesSnap.docs.forEach(doc => {
      const data = doc.data()
      const senderId = data.senderId
      const messageTime = data.timestamp?.toDate ? data.timestamp.toDate() : 
                          data.createdAt?.toDate ? data.createdAt.toDate() : null
      
      console.log(`💬 Message: senderId=${senderId?.slice(0,8)}..., time=${messageTime?.toLocaleString() || 'null'}, text="${data.text?.slice(0,20)}..."`)
      
      // ✅ NEW: Skip messages from BEFORE the current match
      if (matchCreatedAt && messageTime && messageTime < matchCreatedAt) {
        console.log(`   ⏭️ SKIPPED (before match created)`)
        return  // Skip old messages
      }
      
      relevantMessageCount++
      console.log(`   ✅ COUNTED as relevant`)
      
      if (senderId === user1Id) {
        user1HasSent = true
        console.log(`   → User1 sent this message`)
      } else if (senderId === user2Id) {
        user2HasSent = true
        console.log(`   → User2 sent this message`)
      } else {
        console.log(`   ⚠️ Unknown sender!`)
      }
    })
    
    const hasBidirectionalChat = user1HasSent && user2HasSent
    
    console.log(`💬 Bidirectional chat check:`)
    console.log(`   User1 (${user1Id.slice(0, 8)}...) sent: ${user1HasSent}`)
    console.log(`   User2 (${user2Id.slice(0, 8)}...) sent: ${user2HasSent}`)
    console.log(`   Bidirectional: ${hasBidirectionalChat}`)
    console.log(`   Relevant messages (this match): ${relevantMessageCount}`)
    console.log(`   Total messages (all time): ${messagesSnap.size}`)
    
    return {
      hasBidirectionalChat,
      user1HasSent,
      user2HasSent,
      messageCount: relevantMessageCount
    }
    
  } catch (error) {
    console.error('❌ Error checking bidirectional chat:', error)
    return {
      hasBidirectionalChat: false,
      user1HasSent: false,
      user2HasSent: false,
      messageCount: 0
    }
  }
}

/**
 * 💕 Save meeting feedback from user
 * Called after Enjoy Mode ends to collect user's experience
 */
export const saveMeetingFeedback = async (
  userId: string,
  matchId: string,
  partnerId: string,
  partnerName: string,
  feedback: {
    rating: 'positive' | 'negative'
    feedbackText: string
  }
): Promise<void> => {
  try {
    console.log(`💕 Saving meeting feedback from ${userId} for match ${matchId}`)
    
    const feedbackDoc = {
      matchId,
      userId,
      partnerId: partnerId,
      partnerName,
      rating: feedback.rating,
      feedbackText: feedback.feedbackText,
      submittedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    }
    
    // Save to meetingFeedback collection
    await addDoc(collection(db, 'meetingFeedback'), feedbackDoc)
    
    // Also mark that this user has submitted feedback for this match
    await setDoc(doc(db, 'users', userId, 'feedbackSubmitted', matchId), {
      submittedAt: Timestamp.now(),
      rating: feedback.rating
    })
    
    console.log('✅ Meeting feedback saved successfully')
  } catch (error) {
    console.error('❌ Error saving meeting feedback:', error)
    throw error
  }
}

/**
 * 💕 Check if user has pending feedback to submit
 * Returns the match info if feedback is pending
 */
export const checkPendingFeedback = async (
  userId: string
): Promise<{
  hasPendingFeedback: boolean
  matchId?: string
  partnerId?: string
  partnerName?: string
  partnerPhoto?: string
  meetingEndedAt?: Date
} | null> => {
  try {
    console.log(`🔍 Checking pending feedback for user ${userId}`)
    
    // Look for completed meetings where this user hasn't submitted feedback
    const pendingRef = doc(db, 'users', userId, 'pendingFeedback', 'current')
    const pendingDoc = await getDoc(pendingRef)
    
    if (!pendingDoc.exists()) {
      console.log('📭 No pending feedback found')
      return { hasPendingFeedback: false }
    }
    
    const data = pendingDoc.data()
    console.log('📋 Pending feedback found:', data)
    
    return {
      hasPendingFeedback: true,
      matchId: data.matchId,
      partnerId: data.partnerId,
      partnerName: data.partnerName,
      partnerPhoto: data.partnerPhoto,
      meetingEndedAt: data.meetingEndedAt?.toDate()
    }
  } catch (error) {
    console.error('❌ Error checking pending feedback:', error)
    return { hasPendingFeedback: false }
  }
}

/**
 * 💕 Set pending feedback for user
 * Called when Enjoy Mode ends to mark that user should provide feedback
 */
export const setPendingFeedback = async (
  userId: string,
  matchId: string,
  partnerId: string,
  partnerName: string,
  partnerPhoto?: string
): Promise<void> => {
  try {
    console.log(`📝 Setting pending feedback for user ${userId}`)
    
    const pendingRef = doc(db, 'users', userId, 'pendingFeedback', 'current')
    await setDoc(pendingRef, {
      matchId,
      partnerId,
      partnerName,
      partnerPhoto: partnerPhoto || null,
      meetingEndedAt: Timestamp.now()
    })
    
    console.log('✅ Pending feedback set')
  } catch (error) {
    console.error('❌ Error setting pending feedback:', error)
    throw error
  }
}

/**
 * 💕 Clear pending feedback after user submits or skips
 */
export const clearPendingFeedback = async (userId: string): Promise<void> => {
  try {
    console.log(`🗑️ Clearing pending feedback for user ${userId}`)
    
    const pendingRef = doc(db, 'users', userId, 'pendingFeedback', 'current')
    await deleteDoc(pendingRef)
    
    console.log('✅ Pending feedback cleared')
  } catch (error) {
    console.error('❌ Error clearing pending feedback:', error)
    // Don't throw - not critical
  }
}
