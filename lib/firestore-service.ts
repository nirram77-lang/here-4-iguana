import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
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
async function getMatchesOnCooldown(userId: string): Promise<Set<string>> {
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
      
      // If less than 12 hours, add to cooldown set
      if (msSinceMatch < MATCH_COOLDOWN_MS) {
        cooldownSet.add(otherUserId)
        console.log(`⏰ ${otherUserId.substring(0, 8)} on cooldown (${Math.round((MATCH_COOLDOWN_MS - msSinceMatch) / 3600000)}h remaining)`)
      }
    })
    
    console.log(`📋 Found ${cooldownSet.size} users on match cooldown`)
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
      return userSnap.data() as UserProfile
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

    // ✅ "She Decides" - Always look for opposite gender (straight dating)
    const lookingFor = currentUserProfile.gender === 'male' ? 'female' : 'male'
    const currentUserGender = currentUserProfile.gender
    const currentUserAge = currentUserProfile.age
    const currentUserAgeRange = currentUserProfile.preferences?.ageRange || [18, 80]
    
    // ✅ 12-hour match cooldown - load users on cooldown
    const matchesOnCooldown = await getMatchesOnCooldown(currentUserId)
    
    console.log(`👤 Current user: age=${currentUserAge}, gender=${currentUserGender}, looking for ages ${currentUserAgeRange[0]}-${currentUserAgeRange[1]}`)
    console.log(`⏰ Users on 12h match cooldown: ${matchesOnCooldown.size}`)
    
    const geohashes = getGeohashNeighbors(userLocation.geohash)
    const usersRef = collection(db, "users")
    const nearbyUsers: UserProfileWithDistance[] = []

    // 🎯 ALWAYS fetch dummy/test users first (marked with isDummy: true)
    const dummyQuery = query(
      usersRef,
      where("isDummy", "==", true),
      limit(50)
    )
    
    const dummySnapshot = await getDocs(dummyQuery)
    console.log(`🎭 Found ${dummySnapshot.size} dummy users`)
    
    dummySnapshot.forEach((doc) => {
      const user = doc.data() as UserProfile
      
      // Skip current user
      if (user.uid === currentUserId) return
      
      // ✅ Skip deleted dummy users
      if ((user as any).deleted === true) return
      
      // ✅ "She Decides" - Simple opposite gender filtering
      if (user.gender !== lookingFor) return
      
      // ✅ Check if other user accepts our gender (backwards compatibility)
      const otherUserLookingFor = user.preferences?.lookingFor || 'both'
      if (otherUserLookingFor !== 'both' && currentUserGender !== otherUserLookingFor) return
      
      // ✅ NEW: Two-way age filtering
      const otherUserAge = user.age
      if (otherUserAge) {
        if (otherUserAge < currentUserAgeRange[0] || otherUserAge > currentUserAgeRange[1]) {
          console.log(`⚠️ Dummy ${user.name} (age ${otherUserAge}) filtered - outside age range ${currentUserAgeRange[0]}-${currentUserAgeRange[1]}`)
          return
        }
      }
      
      const otherUserAgeRange = user.preferences?.ageRange || [18, 80]
      if (currentUserAge) {
        if (currentUserAge < otherUserAgeRange[0] || currentUserAge > otherUserAgeRange[1]) {
          console.log(`⚠️ Dummy ${user.name} filtered - current user (age ${currentUserAge}) outside their age range ${otherUserAgeRange[0]}-${otherUserAgeRange[1]}`)
          return
        }
      }
      
      // Calculate distance (or use fake distance for dummies within range)
      const distance = user.location ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        user.location.latitude,
        user.location.longitude
      ) : Math.floor(Math.random() * (maxDistance - minDistance)) + minDistance
      
      // ✅ FIX: Filter dummy users by distance range too!
      if (distance >= minDistance && distance <= maxDistance) {
        nearbyUsers.push({ ...user, distance })
        console.log(`✅ Dummy user ${user.name} added: ${Math.round(distance)}m`)
      } else {
        console.log(`❌ Dummy user ${user.name} filtered out: ${Math.round(distance)}m (out of range)`)
      }
    })

    // Then fetch real nearby users
    for (const hash of geohashes) {
      const q = query(
        usersRef,
        where("location.geohash", ">=", hash),
        where("location.geohash", "<=", hash + "\uf8ff"),
        limit(MATCH_CONFIG.QUERY_LIMIT)
      )

      const snapshot = await getDocs(q)

      snapshot.forEach((doc) => {
        const user = doc.data() as UserProfile

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

        // ✅ "She Decides" - Simple opposite gender filtering
        if (user.gender !== lookingFor) return
        
        // ✅ Check if other user accepts our gender (backwards compatibility)
        const otherUserLookingFor = user.preferences?.lookingFor || 'both'
        if (otherUserLookingFor !== 'both' && currentUserGender !== otherUserLookingFor) return
        
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

    await setDoc(matchRef, {
      users: [userId1, userId2],
      timestamp: Timestamp.now(),
      chatId: matchId,
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
    
    console.log('🎉 Match created:', matchId)
    
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
    
    // ✅ "She Decides" - Always look for opposite gender (straight dating)
    const lookingFor = currentUserProfile.gender === 'male' ? 'female' : 'male'
    
    // ✅ 12-hour match cooldown - load users on cooldown
    const matchesOnCooldown = await getMatchesOnCooldown(currentUserId)
    console.log(`⏰ Users on 12h match cooldown: ${matchesOnCooldown.size}`)
    
    const geohashes = getGeohashNeighbors(userLocation.geohash)
    const usersRef = collection(db, "users")
    const nearbyUsers: UserProfileWithDistance[] = []

    // Fetch dummy users (marked with isDummy: true)
    const dummyQuery = query(
      usersRef,
      where("isDummy", "==", true),
      limit(50)
    )
    
    const dummySnapshot = await getDocs(dummyQuery)
    console.log(`🎭 Found ${dummySnapshot.size} dummy users`)
    
    dummySnapshot.forEach((doc) => {
      const user = doc.data() as UserProfile
      
      if (user.uid === currentUserId) return
      
      // ✅ Filter by isAvailable in code (avoid composite index)
      const isAvailable = (user as any).isAvailable ?? true
      if (!isAvailable) return
      if ((user as any).deleted === true) return
      
      // ✅ FIX: Filter already swiped dummy users (same as real users!)
      if (currentUserProfile.swipedRight?.includes(user.uid)) return
      if (currentUserProfile.swipedLeft?.includes(user.uid)) return
      if (user.swipedRight?.includes(currentUserId)) return
      if (user.swipedLeft?.includes(currentUserId)) return
      
      // ✅ 12-hour cooldown: Skip users that matched within last 12 hours
      if (matchesOnCooldown.has(user.uid)) {
        console.log(`⏰ Skipping ${user.name} - match cooldown (12h)`)
        return
      }
      
      // ✅ "She Decides" - Filter by opposite gender
      if (user.gender !== lookingFor) return
      
      const distance = user.location ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        user.location.latitude,
        user.location.longitude
      ) : Math.floor(Math.random() * (maxDistance - minDistance)) + minDistance
      
      if (distance >= minDistance && distance <= maxDistance) {
        nearbyUsers.push({ ...user, distance })
        console.log(`✅ Available dummy: ${user.name} (${Math.round(distance)}m)`)
      }
    })

    // Fetch real nearby users
    for (const hash of geohashes) {
      const q = query(
        usersRef,
        where("location.geohash", ">=", hash),
        where("location.geohash", "<=", hash + "\uf8ff"),
        limit(MATCH_CONFIG.QUERY_LIMIT)
      )

      const snapshot = await getDocs(q)

      snapshot.forEach((doc) => {
        const user = doc.data() as UserProfile

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

        // ✅ "She Decides" - Filter by opposite gender
        if (user.gender !== lookingFor) return

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
 */
export const createActiveMatch = async (
  userId: string,
  matchedUserId: string,
  durationMinutes: number = 10
): Promise<Date> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)
    
    console.log(`⏰ Creating active match: ${matchId} (expires in ${durationMinutes} minutes)`)
    
    await setDoc(doc(db, 'activeMatches', matchId), {
      users: [userId, matchedUserId],
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      isActive: true
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
 * ✅ NEW: Get active match for a user (without knowing matched user)
 * This is used when app is reopened from memory to restore match state
 */
export const getActiveMatchForUser = async (userId: string): Promise<{
  matchedUser: any | null
  expiresAt: Date | null
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
    
    if (expiresAt <= now) {
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
    
    console.log(`✅ Active match found! Matched with: ${matchedUserProfile.name}`)
    console.log(`⏰ Match expires at: ${expiresAt.toLocaleString()}`)
    
    return {
      matchedUser: matchedUserProfile,
      expiresAt
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
      clearedAt: Timestamp.now()
    }, { merge: true })
    
    console.log(`✅ Active match cleared: ${matchId}`)
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
    console.log(`🎉 Marking match as successful: ${matchId}`)
    
    await setDoc(doc(db, 'activeMatches', matchId), {
      isActive: false,  // No longer active
      status: 'successful',  // They're meeting!
      meetingConfirmedBy: userId,  // ✅ Who confirmed?
      meetingConfirmedAt: Timestamp.now(),  // ✅ When?
      completedAt: Timestamp.now()
    }, { merge: true })
    
    // ✅ NEW: Send notification to the OTHER user!
    await sendWeAreMeetingNotification(userId, matchedUserId)
    
    console.log(`✅ Match marked as successful by ${userId}: ${matchId}`)
  } catch (error) {
    console.error('Error marking match as successful:', error)
    throw new Error('Failed to mark match as successful')
  }
}

/**
 * ✅ NEW: Send "We're Meeting!" notification to the other user
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
    
    // Send to notifications collection (real-time!)
    await addDoc(collection(db, 'notifications'), {
      userId: recipientId,
      type: 'meeting',
      title: '🎉 We\'re Meeting!',
      subtitle: `${senderName} confirmed you're meeting!`,
      message: `${senderName} clicked "We're Meeting!" - Have a great time!`,
      fromUserId: senderId,
      fromUserName: senderName,
      fromUserPhoto: senderPhoto,
      timestamp: Timestamp.now(),
      isRead: false
    })
    
    console.log('🔔 "We\'re Meeting" notification sent to:', recipientId)
  } catch (error) {
    console.error('❌ Error sending "We\'re Meeting" notification:', error)
    // Don't throw - notification failure shouldn't break the meeting confirmation
  }
}

/**
 * ✅ NEW: Get match status (active/successful/expired)
 */
export const getMatchStatus = async (
  userId: string,
  matchedUserId: string
): Promise<'active' | 'successful' | 'expired' | null> => {
  try {
    const matchId = [userId, matchedUserId].sort().join('_')
    const matchDoc = await getDoc(doc(db, 'activeMatches', matchId))
    
    if (!matchDoc.exists()) {
      return null  // No match found
    }
    
    const data = matchDoc.data()
    
    // Check status
    if (data.status === 'successful') {
      return 'successful'
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
  type: 'match' | 'message' | 'like' | 'event' | 'venue_announcement' | 'meeting'
  title: string
  subtitle: string
  icon?: string  // Emoji or icon name
  fromUserId?: string  // Who triggered this notification (for matches/likes)
  fromUserName?: string
  fromUserPhoto?: string
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
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId)
    await setDoc(notificationRef, {
      isRead: true
    }, { merge: true })
    
    console.log(`✅ Notification marked as read: ${notificationId}`)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }
}

/**
 * Delete a notification
 */
export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId)
    await deleteDoc(notificationRef)
    
    console.log(`🗑️ Notification deleted: ${notificationId}`)
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }
}

/**
 * Get count of unread notifications
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications')
    const q = query(
      notificationsRef,
      where('isRead', '==', false)
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
 * Create match notification for both users
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
    
    // Notification for user 1
    await createNotification(user1Id, {
      type: 'match',
      title: 'New Match! 🦎',
      subtitle: `You matched with ${user2Name}`,
      icon: '🦎',
      fromUserId: user2Id,
      fromUserName: user2Name,
      fromUserPhoto: user2Photo,
      matchId
    })
    
    // Notification for user 2
    await createNotification(user2Id, {
      type: 'match',
      title: 'New Match! 🦎',
      subtitle: `You matched with ${user1Name}`,
      icon: '🦎',
      fromUserId: user1Id,
      fromUserName: user1Name,
      fromUserPhoto: user1Photo,
      matchId
    })
    
    console.log(`✅ Match notifications created for ${user1Name} & ${user2Name}`)
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
    
    // ✅ FIX: Load current user's full profile to get age and age preferences
    const currentUserProfile = await getUserProfile(currentUserId)
    if (!currentUserProfile) {
      console.error('❌ Could not load current user profile')
      return []
    }
    
    // ✅ "She Decides" - Always look for opposite gender (straight dating)
    const currentUserGender = currentUserProfile.gender
    const lookingFor = currentUserGender === 'male' ? 'female' : 'male'
    
    const currentUserAge = currentUserProfile.age
    const currentUserAgeRange = currentUserProfile.preferences?.ageRange || [18, 80]
    
    // ✅ 12-hour match cooldown - load users on cooldown
    const matchesOnCooldown = await getMatchesOnCooldown(currentUserId)
    
    console.log(`👤 Current user: age=${currentUserAge}, looking for ages ${currentUserAgeRange[0]}-${currentUserAgeRange[1]}`)
    console.log(`⏰ Users on 12h match cooldown: ${matchesOnCooldown.size}`)
    
    // Query users checked in at this venue
    const usersRef = collection(db, 'users')
    const q = query(
      usersRef,
      where('checkedInVenue', '==', venueId)
    )
    
    const snapshot = await getDocs(q)
    const users: UserProfile[] = []
    
    snapshot.forEach(doc => {
      const userData = doc.data() as UserProfile
      
      // ✅ FIX: Skip current user (prevent seeing yourself!)
      if (userData.uid === currentUserId) {
        console.log(`⚠️ Skipping current user (self)`)
        return
      }
      
      // Skip if not onboarded
      if (!userData.onboardingComplete) return
      
      // ✅ 12-hour cooldown: Skip users that matched within last 12 hours
      if (matchesOnCooldown.has(userData.uid)) {
        console.log(`⏰ Skipping ${userData.name} - match cooldown (12h)`)
        return
      }
      
      // ✅ "She Decides" - Simple opposite gender filtering
      if (userData.gender !== lookingFor) {
        console.log(`⚠️ Skipping ${userData.name} - wrong gender for current user`)
        return
      }
      
      // ✅ Check if other user accepts our gender (backwards compatibility)
      const otherUserLookingFor = userData.preferences?.lookingFor || 'both'
      if (otherUserLookingFor !== 'both' && currentUserGender !== otherUserLookingFor) {
        console.log(`⚠️ Skipping ${userData.name} - not interested in current user's gender`)
        return
      }
      
      // ✅ CRITICAL FIX: Two-way age filtering!
      // 3. Check if current user is interested in this user's age
      const otherUserAge = userData.age
      if (otherUserAge) {
        if (otherUserAge < currentUserAgeRange[0] || otherUserAge > currentUserAgeRange[1]) {
          console.log(`⚠️ Skipping ${userData.name} (age ${otherUserAge}) - outside current user's age range ${currentUserAgeRange[0]}-${currentUserAgeRange[1]}`)
          return
        }
      }
      
      // 4. Check if THIS user is interested in current user's age
      const otherUserAgeRange = userData.preferences?.ageRange || [18, 80]
      if (currentUserAge) {
        if (currentUserAge < otherUserAgeRange[0] || currentUserAge > otherUserAgeRange[1]) {
          console.log(`⚠️ Skipping ${userData.name} - current user (age ${currentUserAge}) outside their age range ${otherUserAgeRange[0]}-${otherUserAgeRange[1]}`)
          return
        }
      }
      
      // Check if check-in has expired
      if (userData.checkInData?.expiresAt) {
        const now = Date.now()
        const expiresAt = userData.checkInData.expiresAt.toMillis()
        
        if (now > expiresAt) {
          console.log(`⏰ User ${userData.name} check-in expired`)
          return
        }
      }
      
      users.push(userData)
    })
    
    console.log(`✅ Found ${users.length} users at venue`)
    
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
