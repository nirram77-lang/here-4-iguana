/**
 * 🦎 I4IGUANA - Zone Check-in Service
 * 
 * ✅ v2.8.31: FIXED to match Venue Mode algorithm!
 * 
 * Handles:
 * - User check-in to entertainment zone
 * - Tracking nearest venue (within 100m)
 * - Real-time location updates
 * - Fetching users in zone (with ALL filters like venue mode!)
 */

import { 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc, 
  collection, 
  query, 
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  Venue, 
  EntertainmentZone, 
  searchNearbyVenues,
  calculateDistance,
  formatDistance
} from '@/lib/google-places-service'

// Types
export interface ZoneCheckIn {
  oderId: string
  location: {
    lat: number
    lng: number
  }
  zoneId: string
  zoneName: string
  nearestVenue: {
    placeId: string
    name: string
    distance: number
  } | null
  checkedInAt: Timestamp
  updatedAt: Timestamp
  expiresAt: Timestamp
}

export interface UserInZone {
  oderId: string
  uid: string  // ✅ v2.8.31: Added for compatibility with match system
  name: string
  age: number
  photos: string[]
  bio: string
  gender: 'male' | 'female'
  lookingFor: 'male' | 'female' | 'both'
  hobbies: string[]
  distance: number  // From current user
  formattedDistance: string
  venueName: string | null  // Nearest venue name (if within 100m)
  location: {
    lat: number
    lng: number
  }
  // All other profile fields...
  height?: string
  drinking?: string
  smoking?: string
  relationshipType?: string
  education?: string
  city?: string
  occupation?: string
  languages?: string[]
}

/**
 * 🔍 Find the nearest venue to a location
 */
export const findNearestVenue = async (
  lat: number, 
  lng: number
): Promise<{ placeId: string; name: string; distance: number } | null> => {
  try {
    // Search for venues within 200m
    const venues = await searchNearbyVenues(lat, lng, 200)
    
    if (venues.length === 0) return null
    
    // Find the closest one
    const nearest = venues[0] // Already sorted by distance
    
    // Only return if within 100m (actually inside/at the venue)
    if (nearest.distance && nearest.distance <= 100) {
      return {
        placeId: nearest.placeId,
        name: nearest.name,
        distance: nearest.distance
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ Error finding nearest venue:', error)
    return null
  }
}

/**
 * 📍 Check user into a zone
 */
export const checkInToZone = async (
  oderId: string,
  lat: number,
  lng: number,
  zone: EntertainmentZone
): Promise<boolean> => {
  try {
    console.log(`\n`)
    console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
    console.log(`📍 CHECK-IN TO ZONE - SAVING TO FIREBASE`)
    console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
    console.log(`👤 User ID: ${oderId}`)
    console.log(`📍 Zone ID: "${zone.id}"`)
    console.log(`📍 Zone Name: "${zone.name}"`)
    console.log(`📍 Location: ${lat}, ${lng}`)
    console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
    
    // Find nearest venue
    const nearestVenue = await findNearestVenue(lat, lng)
    
    // Calculate expiration (4 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 4)
    
    // Save check-in
    const checkInRef = doc(db, 'zoneCheckIns', oderId)
    const checkInData = {
      oderId,
      location: { lat, lng },
      zoneId: zone.id,
      zoneName: zone.name,
      nearestVenue,
      checkedInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt)
    }
    
    console.log(`💾 Saving to zoneCheckIns/${oderId}:`, JSON.stringify({
      ...checkInData,
      checkedInAt: 'serverTimestamp()',
      updatedAt: 'serverTimestamp()',
      expiresAt: expiresAt.toISOString()
    }, null, 2))
    
    await setDoc(checkInRef, checkInData)
    
    // ✅ v2.8.5 CRITICAL: Set user as available when checking into zone!
    const userRef = doc(db, 'users', oderId)
    await setDoc(userRef, {
      isAvailable: true,
      lastZoneCheckIn: serverTimestamp()
    }, { merge: true })
    
    console.log(`✅ CHECK-IN SAVED SUCCESSFULLY!`)
    console.log(`✅ User ${oderId} checked into zone "${zone.id}" (${zone.name})`)
    console.log(`✅ isAvailable set to TRUE`)
    return true
    
  } catch (error) {
    console.error('❌ Error checking in to zone:', error)
    return false
  }
}

/**
 * 🔄 Update user location within zone
 */
export const updateLocationInZone = async (
  oderId: string,
  lat: number,
  lng: number
): Promise<boolean> => {
  try {
    // Get current check-in
    const checkInRef = doc(db, 'zoneCheckIns', oderId)
    const checkInDoc = await getDoc(checkInRef)
    
    if (!checkInDoc.exists()) {
      console.log('⚠️ User not checked into any zone')
      return false
    }
    
    // Find nearest venue with new location
    const nearestVenue = await findNearestVenue(lat, lng)
    
    // Update location
    await setDoc(checkInRef, {
      ...checkInDoc.data(),
      location: { lat, lng },
      nearestVenue,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    console.log(`🔄 Location updated${nearestVenue ? ` (near ${nearestVenue.name})` : ''}`)
    return true
    
  } catch (error) {
    console.error('❌ Error updating location:', error)
    return false
  }
}

/**
 * 🚪 Check out from zone
 */
export const checkOutFromZone = async (oderId: string): Promise<boolean> => {
  try {
    const checkInRef = doc(db, 'zoneCheckIns', oderId)
    await deleteDoc(checkInRef)
    console.log('👋 User checked out from zone')
    return true
  } catch (error) {
    console.error('❌ Error checking out:', error)
    return false
  }
}

/**
 * 📊 Get user's current zone check-in
 */
export const getUserZoneCheckIn = async (oderId: string): Promise<ZoneCheckIn | null> => {
  try {
    const checkInRef = doc(db, 'zoneCheckIns', oderId)
    const checkInDoc = await getDoc(checkInRef)
    
    if (!checkInDoc.exists()) return null
    
    const data = checkInDoc.data() as ZoneCheckIn
    
    // Check if expired
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      await deleteDoc(checkInRef)
      return null
    }
    
    return data
  } catch (error) {
    console.error('❌ Error getting zone check-in:', error)
    return null
  }
}

/**
 * 👥 Get all users in a zone (for matching)
 * ✅ v2.8.31: FIXED to match Venue Mode algorithm with ALL filters!
 */
export const getUsersInZone = async (
  zoneId: string,
  currentUserId: string,
  currentUserLat: number,
  currentUserLng: number,
  currentUserGender: 'male' | 'female',
  currentUserLookingFor: 'male' | 'female' | 'both',
  currentUserAge?: number,
  currentUserAgeRange?: [number, number],
  smokingFilter?: 'any' | 'no' | 'no_or_social',
  relationshipFilter?: 'all' | 'relationship' | 'casual' | 'friends',
  swipedRight?: string[],
  swipedLeft?: string[]
): Promise<UserInZone[]> => {
  try {
    console.log(`\n`)
    console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
    console.log(`👥 ZONE MODE DEBUG - getUsersInZone CALLED`)
    console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
    console.log(`📍 Zone ID: "${zoneId}"`)
    console.log(`👤 Current user: ${currentUserId}`)
    console.log(`   Gender: ${currentUserGender}`)
    console.log(`   Looking for: ${currentUserLookingFor}`)
    console.log(`   Age: ${currentUserAge || 'N/A'}`)
    console.log(`   Age range: ${currentUserAgeRange?.[0] || 18}-${currentUserAgeRange?.[1] || 80}`)
    console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
    
    const usersInZone: UserInZone[] = []
    const addedUserIds = new Set<string>()
    
    const ageRange = currentUserAgeRange || [18, 80]
    const smoking = smokingFilter || 'any'
    const relationship = relationshipFilter || 'all'
    const alreadySwipedRight = swipedRight || []
    const alreadySwipedLeft = swipedLeft || []
    
    // ═══════════════════════════════════════════════════════════════
    // DEBUG STEP 0: Get ALL zone check-ins to see what's in the DB
    // ✅ v2.8.32: Also clean up check-ins for deleted users
    // ═══════════════════════════════════════════════════════════════
    console.log(`\n🔍 DEBUG: Fetching ALL zoneCheckIns from database...`)
    const checkInsToDelete: string[] = []
    try {
      const allCheckInsRef = collection(db, 'zoneCheckIns')
      const allCheckInsSnapshot = await getDocs(allCheckInsRef)
      console.log(`📊 TOTAL zoneCheckIns in database: ${allCheckInsSnapshot.size}`)
      
      for (const docSnap of allCheckInsSnapshot.docs) {
        const data = docSnap.data()
        const isExpired = data.expiresAt?.toDate?.() < new Date()
        console.log(`   📍 ID: ${docSnap.id.substring(0, 8)}... | zoneId: "${data.zoneId}" | expired: ${isExpired} | zone: ${data.zoneName}`)
        
        // ✅ v2.8.32: Check if user was deleted
        if (data.oderId) {
          const userRef = doc(db, 'users', data.oderId)
          const userDoc = await getDoc(userRef)
          if (!userDoc.exists() || userDoc.data()?.deleted === true) {
            console.log(`   🗑️ User ${data.oderId.substring(0, 8)} was deleted - marking check-in for cleanup`)
            checkInsToDelete.push(docSnap.id)
          }
        }
      }
      
      // ✅ v2.8.32: Delete check-ins for deleted users
      if (checkInsToDelete.length > 0) {
        console.log(`🧹 Cleaning up ${checkInsToDelete.length} check-ins for deleted users...`)
        for (const checkInId of checkInsToDelete) {
          try {
            await deleteDoc(doc(db, 'zoneCheckIns', checkInId))
            console.log(`   ✅ Deleted: ${checkInId}`)
          } catch (delErr) {
            console.warn(`   ⚠️ Failed to delete: ${checkInId}`, delErr)
          }
        }
      }
    } catch (debugErr) {
      console.error('Debug query failed:', debugErr)
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Get users from Zone Check-ins
    // ✅ v2.8.31 FIX: Query only by zoneId, filter expiration client-side
    // (Avoids need for composite index)
    // ═══════════════════════════════════════════════════════════════
    console.log(`\n📍 Querying zoneCheckIns where zoneId == "${zoneId}"...`)
    
    const checkInsRef = collection(db, 'zoneCheckIns')
    const q = query(
      checkInsRef,
      where('zoneId', '==', zoneId)
    )
    
    const snapshot = await getDocs(q)
    const checkIns: ZoneCheckIn[] = []
    const now = new Date()
    
    console.log(`📍 Query returned ${snapshot.size} total check-ins for zoneId "${zoneId}"`)
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ZoneCheckIn
      
      // ✅ v2.8.31: Filter expired check-ins client-side
      const expiresAt = data.expiresAt?.toDate?.() || new Date(0)
      const isExpired = expiresAt < now
      
      if (isExpired) {
        console.log(`   ⏭️ Skipping expired: ${docSnap.id}`)
        return
      }
      
      console.log(`   ✅ Active: ${docSnap.id} in zone "${data.zoneId}"`)
      
      if (data.oderId !== currentUserId) {
        checkIns.push(data)
      } else {
        console.log(`   ⏭️ Skipping self (${currentUserId})`)
      }
    })
    
    console.log(`📍 After excluding self: ${checkIns.length} other users to check`)
    
    // Process zone check-ins
    for (const checkIn of checkIns) {
      try {
        const userRef = doc(db, 'users', checkIn.oderId)
        const userDoc = await getDoc(userRef)
        
        if (!userDoc.exists()) {
          console.log(`   ❌ User ${checkIn.oderId} not found in users collection`)
          continue
        }
        
        const userData = userDoc.data()
        
        console.log(`\n🔍 Checking user: ${userData.name || 'Unknown'} (${checkIn.oderId.substring(0, 8)}...)`)
        
        // ✅ v2.8.31: Skip deleted users
        if (userData.deleted === true) {
          console.log(`   ⏭️ SKIP: User account was deleted`)
          continue
        }
        
        // ✅ v2.8.31: Skip if onboarding not complete
        if (!userData.onboardingComplete) {
          console.log(`   ⏭️ SKIP: Onboarding not complete`)
          continue
        }
        
        // ✅ v2.8.31: Skip already swiped users (same session)
        if (alreadySwipedRight.includes(checkIn.oderId)) {
          console.log(`   ⏭️ SKIP: Already liked this user (this session)`)
          continue
        }
        if (alreadySwipedLeft.includes(checkIn.oderId)) {
          console.log(`   ⏭️ SKIP: Already passed this user (this session)`)
          continue
        }
        
        // Skip if user is hidden
        if (userData.isAvailable === false) {
          console.log(`   ⏭️ SKIP: isAvailable=false`)
          continue
        }
        
        // Filter by gender preferences - TWO WAY!
        const userGender = userData.gender
        const userLookingFor = userData.lookingFor || userData.preferences?.lookingFor || 'both'
        
        console.log(`   📊 Their: gender=${userGender}, lookingFor=${userLookingFor}`)
        console.log(`   📊 Me: gender=${currentUserGender}, lookingFor=${currentUserLookingFor}`)
        
        // 1. Check if current user wants this user's gender
        const currentUserWantsThis = 
          currentUserLookingFor === 'both' || 
          currentUserLookingFor === userGender
        
        // 2. Check if this user wants current user's gender
        const thisUserWantsCurrent = 
          userLookingFor === 'both' || 
          userLookingFor === currentUserGender
        
        if (!currentUserWantsThis) {
          console.log(`   ⏭️ SKIP: I'm looking for ${currentUserLookingFor}, not ${userGender}`)
          continue
        }
        
        if (!thisUserWantsCurrent) {
          console.log(`   ⏭️ SKIP: They're looking for ${userLookingFor}, not ${currentUserGender}`)
          continue
        }
        
        // ✅ v2.8.31: Age filtering - TWO WAY!
        const otherUserAge = userData.age
        const otherUserAgeRange = userData.preferences?.ageRange || [18, 80]
        
        console.log(`   📊 Their age: ${otherUserAge}, Their range: ${otherUserAgeRange[0]}-${otherUserAgeRange[1]}`)
        
        // Check if their age is in MY range
        if (otherUserAge) {
          if (otherUserAge < ageRange[0] || otherUserAge > ageRange[1]) {
            console.log(`   ⏭️ SKIP: Their age (${otherUserAge}) outside MY range (${ageRange[0]}-${ageRange[1]})`)
            continue
          }
        }
        
        // Check if MY age is in their range
        if (currentUserAge) {
          if (currentUserAge < otherUserAgeRange[0] || currentUserAge > otherUserAgeRange[1]) {
            console.log(`   ⏭️ SKIP: My age (${currentUserAge}) outside THEIR range (${otherUserAgeRange[0]}-${otherUserAgeRange[1]})`)
            continue
          }
        }
        
        // ✅ v2.8.31: Smoking filter
        if (smoking !== 'any') {
          const otherUserSmoking = userData.smoking || 'no'
          if (smoking === 'no' && otherUserSmoking !== 'no') {
            console.log(`   🚬 SKIP: Smoker (${otherUserSmoking}), looking for non-smokers`)
            continue
          }
          if (smoking === 'no_or_social' && otherUserSmoking === 'yes') {
            console.log(`   🚬 SKIP: Regular smoker, looking for non/social only`)
            continue
          }
        }
        
        // ✅ v2.8.31: Relationship type filter
        if (relationship !== 'all') {
          const otherUserRelType = userData.lookingForType || userData.relationshipType || 'relationship'
          if (otherUserRelType !== relationship) {
            console.log(`   💕 SKIP: They want ${otherUserRelType}, I want ${relationship}`)
            continue
          }
        }
        
        console.log(`   ✅ PASSED ALL FILTERS!`)
        
        // Calculate distance
        const distance = calculateDistance(
          currentUserLat,
          currentUserLng,
          checkIn.location.lat,
          checkIn.location.lng
        )
        
        addedUserIds.add(checkIn.oderId)
        usersInZone.push({
          oderId: checkIn.oderId,
          uid: checkIn.oderId,  // ✅ v2.8.31: Add uid for match system compatibility
          name: userData.name || 'Anonymous',
          age: userData.age || 0,
          photos: userData.photos || [],
          bio: userData.bio || '',
          gender: userGender,
          lookingFor: userLookingFor,
          hobbies: userData.hobbies || [],
          distance,
          formattedDistance: formatDistance(distance),
          venueName: checkIn.nearestVenue?.name || null,
          location: checkIn.location,
          height: userData.height,
          drinking: userData.drinking,
          smoking: userData.smoking,
          relationshipType: userData.relationshipType,
          education: userData.education,
          city: userData.city,
          occupation: userData.occupation,
          languages: userData.languages
        })
        
      } catch (err) {
        console.error(`Error fetching user ${checkIn.oderId}:`, err)
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Get users from Venue Check-ins (within 500m radius)
    // ═══════════════════════════════════════════════════════════════
    console.log(`\n🍸 Also fetching venue check-ins within 500m...`)
    
    try {
      const usersRef = collection(db, 'users')
      const venueQuery = query(
        usersRef,
        where('checkedInVenue', '!=', null)
      )
      
      const venueSnapshot = await getDocs(venueQuery)
      let venueUsersCount = 0
      
      for (const userDocSnap of venueSnapshot.docs) {
        const userData = userDocSnap.data()
        const oderId = userDocSnap.id
        
        // Skip current user and already added users
        if (oderId === currentUserId || addedUserIds.has(oderId)) continue
        
        // ✅ v2.8.31: Skip deleted users
        if (userData.deleted === true) continue
        
        // ✅ v2.8.31: Skip if onboarding not complete
        if (!userData.onboardingComplete) continue
        
        // ✅ v2.8.31: Skip already swiped users
        if (alreadySwipedRight.includes(oderId) || alreadySwipedLeft.includes(oderId)) continue
        
        // Skip hidden users
        if (userData.isAvailable === false) continue
        
        // Check if user has valid check-in data with location
        const checkInData = userData.checkInData
        if (!checkInData || !checkInData.location) continue
        
        // Check if venue is within 500m of current user
        const distance = calculateDistance(
          currentUserLat,
          currentUserLng,
          checkInData.location.lat || checkInData.location.latitude,
          checkInData.location.lng || checkInData.location.longitude
        )
        
        if (distance > 500) continue
        
        // Gender filtering - TWO WAY
        const userGender = userData.gender
        const userLookingFor = userData.lookingFor || userData.preferences?.lookingFor || 'both'
        
        const currentUserWantsThis = currentUserLookingFor === 'both' || currentUserLookingFor === userGender
        const thisUserWantsCurrent = userLookingFor === 'both' || userLookingFor === currentUserGender
        
        if (!currentUserWantsThis || !thisUserWantsCurrent) continue
        
        // ✅ v2.8.31: Age filtering
        const otherUserAge = userData.age
        const otherUserAgeRange = userData.preferences?.ageRange || [18, 80]
        
        if (otherUserAge && (otherUserAge < ageRange[0] || otherUserAge > ageRange[1])) continue
        if (currentUserAge && (currentUserAge < otherUserAgeRange[0] || currentUserAge > otherUserAgeRange[1])) continue
        
        // ✅ v2.8.31: Smoking filter
        if (smoking !== 'any') {
          const otherUserSmoking = userData.smoking || 'no'
          if (smoking === 'no' && otherUserSmoking !== 'no') continue
          if (smoking === 'no_or_social' && otherUserSmoking === 'yes') continue
        }
        
        // ✅ v2.8.31: Relationship filter
        if (relationship !== 'all') {
          const otherUserRelType = userData.lookingForType || userData.relationshipType || 'relationship'
          if (otherUserRelType !== relationship) continue
        }
        
        addedUserIds.add(oderId)
        venueUsersCount++
        
        usersInZone.push({
          oderId,
          uid: oderId,  // ✅ v2.8.31: Add uid for match system compatibility
          name: userData.name || 'Anonymous',
          age: userData.age || 0,
          photos: userData.photos || [],
          bio: userData.bio || '',
          gender: userGender,
          lookingFor: userLookingFor,
          hobbies: userData.hobbies || [],
          distance,
          formattedDistance: formatDistance(distance),
          venueName: checkInData.venueName || userData.checkedInVenue || null,
          location: {
            lat: checkInData.location.lat || checkInData.location.latitude,
            lng: checkInData.location.lng || checkInData.location.longitude
          },
          height: userData.height,
          drinking: userData.drinking,
          smoking: userData.smoking,
          relationshipType: userData.relationshipType,
          education: userData.education,
          city: userData.city,
          occupation: userData.occupation,
          languages: userData.languages
        })
      }
      
      console.log(`🍸 Added ${venueUsersCount} users from venue check-ins`)
      
    } catch (venueErr) {
      console.warn('⚠️ Error fetching venue users:', venueErr)
    }
    
    // Sort by distance
    usersInZone.sort((a, b) => a.distance - b.distance)
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ ZONE MODE RESULT: ${usersInZone.length} matching users`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    return usersInZone
    
  } catch (error) {
    console.error('❌ Error getting users in zone:', error)
    return []
  }
}

/**
 * 🔔 Subscribe to users in zone (real-time updates)
 */
export const subscribeToUsersInZone = (
  zoneId: string,
  currentUserId: string,
  callback: (count: number) => void
): (() => void) => {
  const checkInsRef = collection(db, 'zoneCheckIns')
  const q = query(
    checkInsRef,
    where('zoneId', '==', zoneId),
    where('expiresAt', '>', Timestamp.now())
  )
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Count users excluding current user
    const count = snapshot.docs.filter(doc => doc.id !== currentUserId).length
    callback(count)
  })
  
  return unsubscribe
}

/**
 * 📊 Get user's location info for display
 */
export const getUserLocationInfo = async (
  oderId: string
): Promise<{ distance: number; venueName: string | null; zoneName: string } | null> => {
  try {
    const checkIn = await getUserZoneCheckIn(oderId)
    if (!checkIn) return null
    
    return {
      distance: 0, // Will be calculated relative to viewer
      venueName: checkIn.nearestVenue?.name || null,
      zoneName: checkIn.zoneName
    }
  } catch (error) {
    console.error('❌ Error getting user location info:', error)
    return null
  }
}
