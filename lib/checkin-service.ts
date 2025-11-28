import { 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp 
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
      lastCheckIn: now
    })
    
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
 * Should be called periodically (e.g., every hour)
 */
export async function autoCheckoutExpiredUsers(): Promise<void> {
  try {
    console.log('🧹 Running auto-checkout for expired check-ins...')
    
    // This would typically be implemented as a Cloud Function
    // For now, we rely on client-side checking when getUserCheckInStatus is called
    
    console.log('✅ Auto-checkout complete')
  } catch (error) {
    console.error('❌ Error in auto-checkout:', error)
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
