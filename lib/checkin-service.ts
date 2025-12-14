import { 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'
import { checkInUser, checkOutUser, getVenue } from './venue-service'
import { calculateDistance } from './location-service'

export interface CheckInData {
  venueId: string
  venueName: string
  venueDisplayName: string
  checkedInAt: Timestamp
  expiresAt: Timestamp  // Auto-checkout after 4 hours
  location: {
    latitude: number
    longitude: number
  }
}

const CHECK_IN_DURATION = 4 * 60 * 60 * 1000  // 4 hours in milliseconds

// ✅ NEW: Fixed 2km radius for all venues
const CHECK_IN_RADIUS = 2000  // 2 kilometers in meters

/**
 * Check in user to venue
 */
export async function performCheckIn(
  userId: string,
  venueId: string,
  userLat: number,
  userLng: number,
  gpsAccuracy?: number
): Promise<CheckInData> {
  try {
    console.log('🔍 Performing check-in:', { userId, venueId, userLat, userLng, gpsAccuracy })
    
    // Get venue details
    const venue = await getVenue(venueId)
    if (!venue) {
      throw new Error('Venue not found')
    }
    
    // Verify user is within venue radius
    const distance = calculateDistance(
      userLat,
      userLng,
      venue.location.latitude,
      venue.location.longitude
    )
    
    // ✅ FIXED: Use fixed 2km radius instead of venue.radius
    // QR Code = identifies WHICH venue (unique ID)
    // GPS = verifies user is IN THE AREA (not at home)
    const GPS_GRACE_MARGIN = 100  // 100m grace for GPS inaccuracy
    const effectiveRadius = CHECK_IN_RADIUS + GPS_GRACE_MARGIN + (gpsAccuracy || 0)
    
    console.log(`📍 Location check:`)
    console.log(`   - User location: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}`)
    console.log(`   - Venue location: ${venue.location.latitude.toFixed(6)}, ${venue.location.longitude.toFixed(6)}`)
    console.log(`   - Distance: ${distance.toFixed(0)}m`)
    console.log(`   - Check-in radius: ${CHECK_IN_RADIUS}m (2km)`)
    console.log(`   - GPS accuracy: ${gpsAccuracy || 'unknown'}m`)
    console.log(`   - Effective radius (with grace): ${effectiveRadius.toFixed(0)}m`)
    
    if (distance > effectiveRadius) {
      console.log(`❌ Too far from venue! ${distance.toFixed(0)}m > ${effectiveRadius.toFixed(0)}m`)
      throw new Error(`You must be within 2km of ${venue.name} to check in (you are ${(distance/1000).toFixed(1)}km away)`)
    }
    
    console.log(`✅ Distance OK: ${distance.toFixed(0)}m <= ${effectiveRadius.toFixed(0)}m`)
    
    // Create check-in data
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(Date.now() + CHECK_IN_DURATION)
    
    const checkInData: CheckInData = {
      venueId: venue.id,
      venueName: venue.name,
      venueDisplayName: venue.displayName,
      checkedInAt: now,
      expiresAt,
      location: {
        latitude: venue.location.latitude,
        longitude: venue.location.longitude
      }
    }
    
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      checkedInVenue: venueId,
      checkInData,
      lastCheckIn: now,
      // ✅ CRITICAL: Reset swipes on check-in - "Every day is a new game!"
      // This allows users to match again after 12-hour cooldown expires
      swipedRight: [],
      swipedLeft: []
    })
    
    console.log('🔄 Swipes reset for fresh matching!')
    
    // Add user to venue's checked-in list
    await checkInUser(venueId, userId)
    
    console.log('✅ Check-in successful:', venue.displayName)
    
    return checkInData
  } catch (error) {
    console.error('❌ Error checking in:', error)
    throw error
  }
}

/**
 * Check out user from venue
 */
export async function performCheckOut(
  userId: string,
  venueId?: string
): Promise<void> {
  try {
    console.log('🚪 Performing check-out:', userId)
    
    // Get user's current check-in
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }
    
    const userData = userDoc.data()
    const currentVenueId = venueId || userData.checkedInVenue
    
    if (!currentVenueId) {
      console.log('ℹ️ User not checked in anywhere')
      return
    }
    
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      checkedInVenue: null,
      checkInData: null,
      lastCheckOut: Timestamp.now()
    })
    
    // Remove user from venue's checked-in list
    await checkOutUser(currentVenueId, userId)
    
    console.log('✅ Check-out successful')
  } catch (error) {
    console.error('❌ Error checking out:', error)
    throw error
  }
}

/**
 * Get user's current check-in status
 */
export async function getUserCheckInStatus(userId: string): Promise<{
  isCheckedIn: boolean
  checkInData: CheckInData | null
}> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return { isCheckedIn: false, checkInData: null }
    }
    
    const userData = userDoc.data()
    const checkInData = userData.checkInData as CheckInData | undefined
    
    // Check if check-in has expired
    if (checkInData && checkInData.expiresAt) {
      const now = Date.now()
      const expiresAt = checkInData.expiresAt.toMillis()
      
      if (now > expiresAt) {
        console.log('⏰ Check-in expired, auto-checking out...')
        await performCheckOut(userId, checkInData.venueId)
        return { isCheckedIn: false, checkInData: null }
      }
    }
    
    return {
      isCheckedIn: !!userData.checkedInVenue,
      checkInData: checkInData || null
    }
  } catch (error) {
    console.error('❌ Error getting check-in status:', error)
    return { isCheckedIn: false, checkInData: null }
  }
}

/**
 * Auto-checkout expired check-ins
 * ✅ FIXED: Actually clears checkedInVenue for expired users
 */
export async function autoCheckoutExpiredUsers(): Promise<number> {
  try {
    console.log('🧹 Running auto-checkout for expired check-ins...')
    
    const now = Date.now()
    let checkoutCount = 0
    
    // Query all users with checkedInVenue
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('checkedInVenue', '!=', null))
    const snapshot = await getDocs(q)
    
    const batch = writeBatch(db)
    
    snapshot.forEach(docSnapshot => {
      const userData = docSnapshot.data()
      
      // Check if check-in has expired
      if (userData.checkInData?.expiresAt) {
        const expiresAt = userData.checkInData.expiresAt.toMillis 
          ? userData.checkInData.expiresAt.toMillis()
          : userData.checkInData.expiresAt
        
        if (now > expiresAt) {
          console.log(`⏰ Auto-checkout: ${userData.name || userData.uid} (expired)`)
          
          batch.update(docSnapshot.ref, {
            checkedInVenue: null,
            checkInData: null,
            isAvailable: false
          })
          
          checkoutCount++
        }
      }
    })
    
    if (checkoutCount > 0) {
      await batch.commit()
      console.log(`✅ Auto-checkout complete: ${checkoutCount} users checked out`)
    } else {
      console.log('✅ Auto-checkout: No expired check-ins found')
    }
    
    return checkoutCount
  } catch (error) {
    console.error('❌ Error in auto-checkout:', error)
    return 0
  }
}

/**
 * Validate venue proximity for check-in
 */
export async function validateVenueProximity(
  venueId: string,
  userLat: number,
  userLng: number
): Promise<{ valid: boolean; distance: number; message: string }> {
  try {
    const venue = await getVenue(venueId)
    
    if (!venue) {
      return {
        valid: false,
        distance: 0,
        message: 'Venue not found'
      }
    }
    
    const distance = calculateDistance(
      userLat,
      userLng,
      venue.location.latitude,
      venue.location.longitude
    )
    
    // ✅ FIXED: Use 2km radius
    const valid = distance <= CHECK_IN_RADIUS
    
    return {
      valid,
      distance,
      message: valid 
        ? 'You are within check-in range' 
        : `You must be within 2km to check in (currently ${(distance/1000).toFixed(1)}km away)`
    }
  } catch (error) {
    console.error('❌ Error validating proximity:', error)
    return {
      valid: false,
      distance: 0,
      message: 'Error validating location'
    }
  }
}

/**
 * Get time remaining until auto-checkout
 */
export function getTimeRemainingUntilCheckout(checkInData: CheckInData): number {
  if (!checkInData?.expiresAt) return 0
  
  const now = Date.now()
  const expiresAt = checkInData.expiresAt.toMillis()
  const remaining = expiresAt - now
  
  return Math.max(0, Math.floor(remaining / 1000))  // Return seconds
}

/**
 * Format check-in time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  }
  
  return `${minutes}m remaining`
}

/**
 * ✅ NEW: Verify user is still within venue proximity
 * Called before each search to auto-checkout users who left the area
 * Returns true if still at venue, false if auto-checked-out
 */
export async function verifyUserStillAtVenue(
  userId: string,
  userLat: number,
  userLng: number
): Promise<{
  stillAtVenue: boolean
  checkInData: CheckInData | null
  distance?: number
  venueName?: string
}> {
  try {
    // Get user's current check-in
    const { isCheckedIn, checkInData } = await getUserCheckInStatus(userId)
    
    if (!isCheckedIn || !checkInData) {
      console.log('ℹ️ User not checked in - no verification needed')
      return { stillAtVenue: false, checkInData: null }
    }
    
    // Calculate distance from venue
    const distance = calculateDistance(
      userLat,
      userLng,
      checkInData.location.latitude,
      checkInData.location.longitude
    )
    
    console.log(`📍 Proximity check: ${distance.toFixed(0)}m from ${checkInData.venueDisplayName}`)
    
    // If user is more than 2km away, auto-checkout
    if (distance > CHECK_IN_RADIUS) {
      console.log(`🚪 User left venue area (${(distance/1000).toFixed(1)}km away) - auto-checking out...`)
      
      await performCheckOut(userId, checkInData.venueId)
      
      return { 
        stillAtVenue: false, 
        checkInData: null,
        distance,
        venueName: checkInData.venueDisplayName
      }
    }
    
    console.log(`✅ User still at venue: ${checkInData.venueDisplayName}`)
    return { 
      stillAtVenue: true, 
      checkInData,
      distance 
    }
    
  } catch (error) {
    console.error('❌ Error verifying venue proximity:', error)
    // On error, assume still at venue (don't break the UX)
    return { stillAtVenue: true, checkInData: null }
  }
}

/**
 * ✅ NEW: Check in user by venue selection (no QR required!)
 * This is the new flow for venue discovery feature
 */
export async function performCheckInBySelection(
  userId: string,
  venueId: string,
  userLat: number,
  userLng: number,
  gpsAccuracy?: number
): Promise<CheckInData> {
  try {
    console.log('🎯 Performing check-in by venue selection:', { userId, venueId })
    
    // Get venue details
    const venue = await getVenue(venueId)
    if (!venue) {
      throw new Error('המועדון לא נמצא')
    }
    
    if (!venue.active) {
      throw new Error('המועדון אינו פעיל כרגע')
    }
    
    // Calculate distance from venue
    const distance = calculateDistance(
      userLat,
      userLng,
      venue.location.latitude,
      venue.location.longitude
    )
    
    // Use venue's radius or default 500m
    const venueRadius = venue.radius || 500
    const GPS_GRACE_MARGIN = 100  // 100m grace for GPS inaccuracy
    const effectiveRadius = venueRadius + GPS_GRACE_MARGIN + (gpsAccuracy || 0)
    
    console.log(`📍 Venue check-in location validation:`)
    console.log(`   - User location: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}`)
    console.log(`   - Venue location: ${venue.location.latitude.toFixed(6)}, ${venue.location.longitude.toFixed(6)}`)
    console.log(`   - Distance: ${distance.toFixed(0)}m`)
    console.log(`   - Venue radius: ${venueRadius}m`)
    console.log(`   - Effective radius (with grace): ${effectiveRadius.toFixed(0)}m`)
    
    // Validate distance
    if (distance > effectiveRadius) {
      const distanceKm = (distance / 1000).toFixed(1)
      const radiusKm = (venueRadius / 1000).toFixed(1)
      console.log(`❌ Too far from venue! ${distance.toFixed(0)}m > ${effectiveRadius.toFixed(0)}m`)
      throw new Error(`אתה רחוק מדי מ-${venue.displayName}. קרב ל-${radiusKm} ק"מ מהמועדון כדי להיכנס (המרחק הנוכחי: ${distanceKm} ק"מ)`)
    }
    
    console.log(`✅ Distance OK: ${distance.toFixed(0)}m <= ${effectiveRadius.toFixed(0)}m`)
    
    // Check if user is already checked in somewhere else
    const currentStatus = await getUserCheckInStatus(userId)
    if (currentStatus.isCheckedIn && currentStatus.checkInData?.venueId !== venueId) {
      console.log(`🔄 User already checked in at ${currentStatus.checkInData?.venueName} - checking out first`)
      await performCheckOut(userId, currentStatus.checkInData?.venueId)
    }
    
    // Create check-in data
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(Date.now() + CHECK_IN_DURATION)
    
    const checkInData: CheckInData = {
      venueId: venue.id,
      venueName: venue.name,
      venueDisplayName: venue.displayName,
      checkedInAt: now,
      expiresAt,
      location: {
        latitude: venue.location.latitude,
        longitude: venue.location.longitude
      }
    }
    
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      checkedInVenue: venueId,
      checkInData,
      lastCheckIn: now,
      // Reset swipes on check-in - "Every day is a new game!"
      swipedRight: [],
      swipedLeft: []
    })
    
    // ✅ NEW: Clear old matches cooldown when checking into NEW venue
    // This allows users to meet again at different venues!
    await clearMatchesCooldown(userId)
    console.log('🔄 Matches cooldown cleared - fresh start at new venue!')
    
    console.log('🔄 Swipes reset for fresh matching!')
    
    // Add user to venue's checked-in list
    await checkInUser(venueId, userId)
    
    console.log('✅ Check-in by selection successful:', venue.displayName)
    
    return checkInData
    
  } catch (error: any) {
    console.error('❌ Error in check-in by selection:', error)
    throw error
  }
}

/**
 * ✅ NEW: Clear all matches cooldown for a user
 * This allows them to meet the same people again at different venues
 */
async function clearMatchesCooldown(userId: string): Promise<void> {
  try {
    const { collection, getDocs, deleteDoc, doc: firestoreDoc } = await import('firebase/firestore')
    const { db: firebaseDb } = await import('@/lib/firebase')
    
    console.log(`🧹 Clearing matches cooldown for user: ${userId.substring(0, 8)}...`)
    
    // Get all matches involving this user
    const matchesRef = collection(firebaseDb, 'matches')
    const snapshot = await getDocs(matchesRef)
    
    let deletedCount = 0
    
    for (const matchDoc of snapshot.docs) {
      const data = matchDoc.data()
      const users = data.users as string[]
      
      // Check if this user is part of this match
      if (users?.includes(userId)) {
        await deleteDoc(firestoreDoc(firebaseDb, 'matches', matchDoc.id))
        deletedCount++
        console.log(`   🗑️ Deleted match: ${matchDoc.id}`)
      }
    }
    
    // Also clear active matches
    const activeMatchesRef = collection(firebaseDb, 'activeMatches')
    const activeSnapshot = await getDocs(activeMatchesRef)
    
    for (const matchDoc of activeSnapshot.docs) {
      const data = matchDoc.data()
      const users = data.users as string[]
      
      if (users?.includes(userId)) {
        await deleteDoc(firestoreDoc(firebaseDb, 'activeMatches', matchDoc.id))
        deletedCount++
        console.log(`   🗑️ Deleted active match: ${matchDoc.id}`)
      }
    }
    
    console.log(`✅ Cleared ${deletedCount} matches for user`)
    
  } catch (error) {
    console.error('❌ Error clearing matches cooldown:', error)
    // Don't throw - this is not critical
  }
}
