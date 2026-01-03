/**
 * 🦎 I4IGUANA - Zone Check-in Service
 * 
 * Handles:
 * - User check-in to entertainment zone
 * - Tracking nearest venue (within 100m)
 * - Real-time location updates
 * - Fetching users in zone
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
    console.log(`📍 Checking in user ${oderId} to zone ${zone.name}`)
    
    // Find nearest venue
    const nearestVenue = await findNearestVenue(lat, lng)
    
    // Calculate expiration (4 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 4)
    
    // Save check-in
    const checkInRef = doc(db, 'zoneCheckIns', oderId)
    await setDoc(checkInRef, {
      oderId,
      location: { lat, lng },
      zoneId: zone.id,
      zoneName: zone.name,
      nearestVenue,
      checkedInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt)
    })
    
    // ✅ v2.8.5 CRITICAL: Set user as available when checking into zone!
    const userRef = doc(db, 'users', oderId)
    await setDoc(userRef, {
      isAvailable: true,
      lastZoneCheckIn: serverTimestamp()
    }, { merge: true })
    
    console.log(`✅ User checked in to ${zone.name}${nearestVenue ? ` (near ${nearestVenue.name})` : ''}`)
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
 */
export const getUsersInZone = async (
  zoneId: string,
  currentUserId: string,
  currentUserLat: number,
  currentUserLng: number,
  currentUserGender: 'male' | 'female',
  currentUserLookingFor: 'male' | 'female' | 'both'
): Promise<UserInZone[]> => {
  try {
    console.log(`👥 Fetching users in zone ${zoneId}`)
    
    const usersInZone: UserInZone[] = []
    const addedUserIds = new Set<string>()  // ✅ Prevent duplicates
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Get users from Zone Check-ins
    // ═══════════════════════════════════════════════════════════════
    const checkInsRef = collection(db, 'zoneCheckIns')
    const q = query(
      checkInsRef,
      where('zoneId', '==', zoneId),
      where('expiresAt', '>', Timestamp.now())
    )
    
    const snapshot = await getDocs(q)
    const checkIns: ZoneCheckIn[] = []
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ZoneCheckIn
      if (data.oderId !== currentUserId) {
        checkIns.push(data)
      }
    })
    
    console.log(`📍 Found ${checkIns.length} users in zone check-ins`)
    
    // Process zone check-ins
    for (const checkIn of checkIns) {
      try {
        const userRef = doc(db, 'users', checkIn.oderId)
        const userDoc = await getDoc(userRef)
        
        if (!userDoc.exists()) continue
        
        const userData = userDoc.data()
        
        // Filter by gender preferences
        const userGender = userData.gender
        const userLookingFor = userData.lookingFor || userData.preferences?.lookingFor
        
        // Check if this user matches current user's preferences
        const currentUserWantsThis = 
          currentUserLookingFor === 'both' || 
          currentUserLookingFor === userGender
        
        // Check if this user wants current user
        const thisUserWantsCurrent = 
          userLookingFor === 'both' || 
          userLookingFor === currentUserGender
        
        if (!currentUserWantsThis || !thisUserWantsCurrent) continue
        
        // Skip if user is hidden
        if (userData.isAvailable === false) continue
        
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
          // Additional fields
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
    // ✅ v2.8.5: Zone mode shows EVERYONE - including venue users!
    // ═══════════════════════════════════════════════════════════════
    console.log(`🍸 Also fetching venue check-ins within 500m...`)
    
    try {
      const usersRef = collection(db, 'users')
      const venueQuery = query(
        usersRef,
        where('checkedInVenue', '!=', null)
      )
      
      const venueSnapshot = await getDocs(venueQuery)
      let venueUsersCount = 0
      
      venueSnapshot.forEach((userDocSnap) => {
        const userData = userDocSnap.data()
        const userId = userDocSnap.id
        
        // Skip current user and already added users
        if (userId === currentUserId || addedUserIds.has(userId)) return
        
        // Skip hidden users
        if (userData.isAvailable === false) return
        
        // Check if user has valid check-in data with location
        const checkInData = userData.checkInData
        if (!checkInData || !checkInData.location) return
        
        // Check if venue is within 500m of current user
        const distance = calculateDistance(
          currentUserLat,
          currentUserLng,
          checkInData.location.lat || checkInData.location.latitude,
          checkInData.location.lng || checkInData.location.longitude
        )
        
        // Only include if within 500m
        if (distance > 500) return
        
        // Filter by gender preferences
        const userGender = userData.gender
        const userLookingFor = userData.lookingFor || userData.preferences?.lookingFor
        
        const currentUserWantsThis = 
          currentUserLookingFor === 'both' || 
          currentUserLookingFor === userGender
        
        const thisUserWantsCurrent = 
          userLookingFor === 'both' || 
          userLookingFor === currentUserGender
        
        if (!currentUserWantsThis || !thisUserWantsCurrent) return
        
        addedUserIds.add(userId)
        venueUsersCount++
        
        usersInZone.push({
          oderId: userId,
          name: userData.name || 'Anonymous',
          age: userData.age || 0,
          photos: userData.photos || [],
          bio: userData.bio || '',
          gender: userGender,
          lookingFor: userLookingFor,
          hobbies: userData.hobbies || [],
          distance,
          formattedDistance: formatDistance(distance),
          venueName: checkInData.venueName || userData.checkedInVenue || null,  // ✅ Show venue name!
          location: {
            lat: checkInData.location.lat || checkInData.location.latitude,
            lng: checkInData.location.lng || checkInData.location.longitude
          },
          // Additional fields
          height: userData.height,
          drinking: userData.drinking,
          smoking: userData.smoking,
          relationshipType: userData.relationshipType,
          education: userData.education,
          city: userData.city,
          occupation: userData.occupation,
          languages: userData.languages
        })
      })
      
      console.log(`🍸 Added ${venueUsersCount} users from venue check-ins`)
      
    } catch (venueErr) {
      console.warn('⚠️ Error fetching venue users:', venueErr)
      // Continue without venue users
    }
    
    // Sort by distance
    usersInZone.sort((a, b) => a.distance - b.distance)
    
    console.log(`✅ Returning ${usersInZone.length} total matching users (zone + venues)`)
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
