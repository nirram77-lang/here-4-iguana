import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from './firebase'
import { generateVenueQRCode } from './qr-service'
import { encodeGeohash } from './location-service'

export interface CreateVenueData {
  name: string
  displayName: string
  address: string
  latitude: number
  longitude: number
  adminEmail: string
  adminPassword: string
}

export interface CreateVenueResult {
  venue: Venue
  admin: {
    uid: string
    email: string
    tempPassword: string
  }
}

export interface Venue {
  id: string
  name: string
  displayName: string  // "IGUANA BAR (Beach Club)"
  location: {
    latitude: number
    longitude: number
    address: string
  }
  radius: number  // Check-in radius in meters (default: 100m)
  qrCode: string  // Data URL of QR code
  qrData: {
    type: 'iguana_checkin'
    venueId: string
    venueName: string
  }
  adminUid: string
  adminEmail: string
  checkedInUsers: string[]  // Array of user IDs currently checked in
  stats: {
    totalCheckIns: number
    activeNow: number
    notificationsSent: number
    matchesCreated: number
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  active: boolean
}

/**
 * ✅ NEW: Create a new venue with admin account
 */
export async function createVenue(data: CreateVenueData): Promise<CreateVenueResult> {
  try {
    console.log('🏗️ Creating venue:', data.displayName)

    // Step 1: Create Firebase Auth user for venue admin
    console.log('👤 Creating admin account...')
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.adminEmail,
      data.adminPassword
    )
    const adminUid = userCredential.user.uid
    console.log('✅ Admin account created:', adminUid)

    // Step 2: Generate unique venue ID
    const venueId = `venue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log('🆔 Venue ID:', venueId)

    // Step 3: Generate QR code
    console.log('📸 Generating QR code...')
    const { dataURL } = await generateVenueQRCode(venueId, data.name)

    // Step 4: Calculate geohash for location
    const geohash = encodeGeohash(data.latitude, data.longitude, 9)

    // Step 5: Create venue document
    const venue: Venue = {
      id: venueId,
      name: data.name,
      displayName: data.displayName,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address
      },
      radius: 500, // ✅ FIXED: Default 500m radius (was 100m - too strict for GPS accuracy)
      qrCode: dataURL,
      qrData: {
        type: 'iguana_checkin',
        venueId,
        venueName: data.name
      },
      adminUid,
      adminEmail: data.adminEmail,
      checkedInUsers: [],
      stats: {
        totalCheckIns: 0,
        activeNow: 0,
        notificationsSent: 0,
        matchesCreated: 0
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      active: true
    }

    // Step 6: Save venue to Firestore
    await setDoc(doc(db, 'venues', venueId), venue)
    console.log('✅ Venue document created')

    // Step 7: Create venue admin document
    await setDoc(doc(db, 'venueAdmins', adminUid), {
      uid: adminUid,
      email: data.adminEmail,
      role: 'venue',
      venueId: venueId,
      venueName: data.displayName,
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      active: true
    })
    console.log('✅ Venue admin document created')

    console.log('🎉 Venue creation complete!')

    return {
      venue,
      admin: {
        uid: adminUid,
        email: data.adminEmail,
        tempPassword: data.adminPassword
      }
    }

  } catch (error: any) {
    console.error('❌ Error creating venue:', error)
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak')
    }
    
    throw new Error(error.message || 'Failed to create venue')
  }
}

/**
 * Get venue by ID
 */
export async function getVenue(venueId: string): Promise<Venue | null> {
  try {
    const venueDoc = await getDoc(doc(db, 'venues', venueId))
    
    if (!venueDoc.exists()) {
      console.log('❌ Venue not found:', venueId)
      return null
    }
    
    return venueDoc.data() as Venue
  } catch (error) {
    console.error('❌ Error getting venue:', error)
    return null
  }
}

/**
 * Get all venues
 */
export async function getAllVenues(): Promise<Venue[]> {
  try {
    const venuesSnapshot = await getDocs(collection(db, 'venues'))
    const venues: Venue[] = []
    
    venuesSnapshot.forEach(doc => {
      venues.push(doc.data() as Venue)
    })
    
    console.log(`✅ Loaded ${venues.length} venues`)
    return venues
  } catch (error) {
    console.error('❌ Error getting venues:', error)
    return []
  }
}

/**
 * Get venues by admin UID
 */
export async function getVenuesByAdmin(adminUid: string): Promise<Venue[]> {
  try {
    const q = query(
      collection(db, 'venues'),
      where('adminUid', '==', adminUid)
    )
    
    const snapshot = await getDocs(q)
    const venues: Venue[] = []
    
    snapshot.forEach(doc => {
      venues.push(doc.data() as Venue)
    })
    
    console.log(`✅ Loaded ${venues.length} venues for admin:`, adminUid)
    return venues
  } catch (error) {
    console.error('❌ Error getting admin venues:', error)
    return []
  }
}

/**
 * Update venue details
 */
export async function updateVenue(
  venueId: string,
  updates: Partial<Omit<Venue, 'id' | 'createdAt' | 'qrCode' | 'qrData'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'venues', venueId), {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    console.log('✅ Venue updated:', venueId)
  } catch (error) {
    console.error('❌ Error updating venue:', error)
    throw new Error('Failed to update venue')
  }
}

/**
 * Delete venue
 */
export async function deleteVenue(venueId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'venues', venueId))
    console.log('✅ Venue deleted:', venueId)
  } catch (error) {
    console.error('❌ Error deleting venue:', error)
    throw new Error('Failed to delete venue')
  }
}

/**
 * Check in user to venue
 */
export async function checkInUser(venueId: string, userId: string): Promise<void> {
  try {
    const venueRef = doc(db, 'venues', venueId)
    
    // Add user to checkedInUsers array
    await updateDoc(venueRef, {
      checkedInUsers: arrayUnion(userId),
      'stats.activeNow': await getActiveUserCount(venueId) + 1,
      'stats.totalCheckIns': await getTotalCheckIns(venueId) + 1,
      updatedAt: Timestamp.now()
    })
    
    console.log('✅ User checked in:', userId, 'to venue:', venueId)
  } catch (error) {
    console.error('❌ Error checking in user:', error)
    throw new Error('Failed to check in')
  }
}

/**
 * Check out user from venue
 */
export async function checkOutUser(venueId: string, userId: string): Promise<void> {
  try {
    const venueRef = doc(db, 'venues', venueId)
    
    // Remove user from checkedInUsers array
    await updateDoc(venueRef, {
      checkedInUsers: arrayRemove(userId),
      'stats.activeNow': Math.max(0, await getActiveUserCount(venueId) - 1),
      updatedAt: Timestamp.now()
    })
    
    console.log('✅ User checked out:', userId, 'from venue:', venueId)
  } catch (error) {
    console.error('❌ Error checking out user:', error)
    throw new Error('Failed to check out')
  }
}

/**
 * Get active user count for venue
 */
export async function getActiveUserCount(venueId: string): Promise<number> {
  try {
    const venue = await getVenue(venueId)
    return venue?.checkedInUsers?.length || 0
  } catch (error) {
    console.error('❌ Error getting active count:', error)
    return 0
  }
}

/**
 * Get total check-ins for venue
 */
export async function getTotalCheckIns(venueId: string): Promise<number> {
  try {
    const venue = await getVenue(venueId)
    return venue?.stats?.totalCheckIns || 0
  } catch (error) {
    console.error('❌ Error getting total check-ins:', error)
    return 0
  }
}

/**
 * Get checked-in users for venue
 */
export async function getCheckedInUsers(venueId: string): Promise<string[]> {
  try {
    const venue = await getVenue(venueId)
    return venue?.checkedInUsers || []
  } catch (error) {
    console.error('❌ Error getting checked-in users:', error)
    return []
  }
}

/**
 * Increment notification sent count
 */
export async function incrementNotificationCount(venueId: string): Promise<void> {
  try {
    const venue = await getVenue(venueId)
    if (!venue) return
    
    await updateDoc(doc(db, 'venues', venueId), {
      'stats.notificationsSent': (venue.stats.notificationsSent || 0) + 1,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('❌ Error incrementing notification count:', error)
  }
}

/**
 * Increment match created count
 */
export async function incrementMatchCount(venueId: string): Promise<void> {
  try {
    const venue = await getVenue(venueId)
    if (!venue) return
    
    await updateDoc(doc(db, 'venues', venueId), {
      'stats.matchesCreated': (venue.stats.matchesCreated || 0) + 1,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('❌ Error incrementing match count:', error)
  }
}
