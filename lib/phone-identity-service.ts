import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "./firebase"

/**
 * Phone Identity Service
 * 
 * This service tracks users by their phone number instead of just their Google account.
 * This prevents users from exploiting the free pass system by logging in with multiple
 * Google accounts.
 * 
 * Core Concept:
 * - Phone number = True Identity
 * - Google Account = Just an authentication method
 * - If same phone logs in with different Google account → Same user, same restrictions
 */

export interface PhoneIdentity {
  phoneNumber: string
  currentUserId: string  // Current Firebase UID using this phone
  previousUserIds: string[]  // History of UIDs that used this phone
  lockedUntil: Timestamp | null  // Timer lockout (2 hours after match)
  passesLeft: number
  passesUsedToday: number
  matchesCountToday: number  // ✅ Track matches for admin panel
  lastPassReset: Timestamp  // Midnight reset
  isPremium: boolean
  createdAt: Timestamp
  lastLogin: Timestamp
  deviceInfo?: {
    deviceId?: string
    userAgent?: string
    lastIP?: string
  }
}

/**
 * Get or create phone identity
 * This is called after phone verification (or in dev mode, with a mock phone)
 */
export const getOrCreatePhoneIdentity = async (
  phoneNumber: string,
  currentUserId: string
): Promise<PhoneIdentity> => {
  const phoneRef = doc(db, "phoneIdentities", phoneNumber)
  const phoneDoc = await getDoc(phoneRef)

  if (phoneDoc.exists()) {
    const data = phoneDoc.data() as PhoneIdentity
    
    console.log('📱 Existing phone identity found:', phoneNumber)
    console.log('🔍 Previous UIDs:', data.previousUserIds)
    console.log('🆔 Current UID:', currentUserId)
    
    // Update current user if different
    if (data.currentUserId !== currentUserId) {
      console.log('🔄 User switched Google account but using same phone')
      console.log(`   Old: ${data.currentUserId}`)
      console.log(`   New: ${currentUserId}`)
      
      await updateDoc(phoneRef, {
        currentUserId,
        previousUserIds: [...new Set([...data.previousUserIds, data.currentUserId])],
        lastLogin: Timestamp.now()
      })
    }
    
    return {
      ...data,
      currentUserId  // Return updated current user
    }
  } else {
    // New phone number - create identity
    console.log('🆕 Creating new phone identity:', phoneNumber)
    
    const newIdentity: PhoneIdentity = {
      phoneNumber,
      currentUserId,
      previousUserIds: [],
      lockedUntil: null,
      passesLeft: 1,  // Free users get 1 pass
      passesUsedToday: 0,
      matchesCountToday: 0,  // ✅ Initialize matches counter
      lastPassReset: Timestamp.now(),
      isPremium: false,
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now()
    }
    
    await setDoc(phoneRef, newIdentity)
    return newIdentity
  }
}

/**
 * Check if phone identity is locked (in cooldown after match)
 */
export const isPhoneIdentityLocked = async (phoneNumber: string): Promise<{
  isLocked: boolean
  remainingTime: number  // seconds
}> => {
  const phoneRef = doc(db, "phoneIdentities", phoneNumber)
  const phoneDoc = await getDoc(phoneRef)
  
  if (!phoneDoc.exists()) {
    return { isLocked: false, remainingTime: 0 }
  }
  
  const data = phoneDoc.data() as PhoneIdentity
  
  if (!data.lockedUntil) {
    return { isLocked: false, remainingTime: 0 }
  }
  
  const now = Timestamp.now()
  const remainingSeconds = data.lockedUntil.seconds - now.seconds
  
  if (remainingSeconds <= 0) {
    // ✅ FIX: Lock expired - clear it AND restore pass
    console.log('🔓 2-hour lock expired - restoring pass!')
    
    // Get current pass count before updating
    const currentPassesLeft = data.passesLeft || 0
    const isPremium = data.isPremium || false
    
    // Premium users always have passes, free users get 1 pass back
    const newPassesLeft = isPremium ? 3 : Math.max(1, currentPassesLeft)
    
    await updateDoc(phoneRef, { 
      lockedUntil: null,
      passesLeft: newPassesLeft  // ✅ CRITICAL FIX: Restore pass!
    })
    
    console.log(`✅ Pass restored! New passes: ${newPassesLeft}`)
    return { isLocked: false, remainingTime: 0 }
  }
  
  return {
    isLocked: true,
    remainingTime: remainingSeconds
  }
}

/**
 * Lock phone identity for 2 hours after accepting a match
 */
export const lockPhoneIdentity = async (
  phoneNumber: string,
  durationHours: number = 2
): Promise<void> => {
  const phoneRef = doc(db, "phoneIdentities", phoneNumber)
  const lockedUntil = Timestamp.fromMillis(
    Date.now() + (durationHours * 60 * 60 * 1000)
  )
  
  await updateDoc(phoneRef, { lockedUntil })
  console.log(`🔒 Phone ${phoneNumber} locked until: ${new Date(lockedUntil.toMillis())}`)
}

/**
 * Use a pass (decrement passes)
 * ✅ FIXED: Now locks user for 2 hours when running out of passes
 */
export const usePassForPhone = async (phoneNumber: string): Promise<number> => {
  const phoneRef = doc(db, "phoneIdentities", phoneNumber)
  const phoneDoc = await getDoc(phoneRef)
  
  if (!phoneDoc.exists()) {
    throw new Error('Phone identity not found')
  }
  
  const data = phoneDoc.data() as PhoneIdentity
  
  if (data.passesLeft <= 0) {
    throw new Error('No passes left')
  }
  
  const newPassesLeft = data.passesLeft - 1
  
  // ✅ FIX: If user runs out of passes, lock for 2 hours
  const updateData: any = {
    passesLeft: newPassesLeft,
    passesUsedToday: data.passesUsedToday + 1
  }
  
  if (newPassesLeft === 0) {
    const lockedUntil = Timestamp.fromMillis(Date.now() + (2 * 60 * 60 * 1000))
    updateData.lockedUntil = lockedUntil
    console.log(`🔒 User out of passes - locked until: ${new Date(lockedUntil.toMillis()).toLocaleString()}`)
  }
  
  await updateDoc(phoneRef, updateData)
  
  console.log(`✅ Pass used. Remaining: ${newPassesLeft}`)
  return newPassesLeft
}

/**
 * Reset daily passes at midnight
 * This should be called by a Cloud Function or checked on app launch
 */
export const resetDailyPassesIfNeeded = async (phoneNumber: string): Promise<void> => {
  const phoneRef = doc(db, "phoneIdentities", phoneNumber)
  const phoneDoc = await getDoc(phoneRef)
  
  if (!phoneDoc.exists()) return
  
  const data = phoneDoc.data() as PhoneIdentity
  const now = new Date()
  
  // ✅ FIXED: Safe toDate call
  if (!data.lastPassReset || !data.lastPassReset.toDate) {
    console.log('⚠️ No lastPassReset found, skipping daily reset check')
    return
  }
  
  const lastReset = data.lastPassReset.toDate()
  
  // Check if it's a new day
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    
    const newPasses = data.isPremium ? 3 : 1
    
    await updateDoc(phoneRef, {
      passesLeft: newPasses,
      passesUsedToday: 0,
      matchesCountToday: 0,  // ✅ Reset matches counter
      lastPassReset: Timestamp.now()
    })
    
    console.log(`🔄 Daily passes reset for ${phoneNumber}: ${newPasses} passes`)
  }
}

/**
 * Find if a user (by UID) has used another phone number before
 * This helps detect if someone is trying to use multiple phones with same Google account
 */
export const findOtherPhonesForUser = async (userId: string): Promise<string[]> => {
  const phonesRef = collection(db, "phoneIdentities")
  const q = query(
    phonesRef,
    where("previousUserIds", "array-contains", userId)
  )
  
  const snapshot = await getDocs(q)
  const phones: string[] = []
  
  snapshot.forEach(doc => {
    phones.push(doc.id)  // doc.id is the phone number
  })
  
  return phones
}

/**
 * Developer Mode: Get phone number for testing
 * In production, this would come from phone verification
 */
export const getDevModePhoneNumber = (userId: string): string => {
  // In dev mode, use a consistent "fake" phone based on userId
  // This allows testing without real SMS verification
  // Format: +972-DEV-{last 8 chars of userId}
  const shortId = userId.slice(-8)
  return `+972DEV${shortId}`
}

/**
 * Increment match count when a match is created
 */
export const incrementMatchCount = async (phoneNumber: string): Promise<number> => {
  const phoneRef = doc(db, "phoneIdentities", phoneNumber)
  const phoneDoc = await getDoc(phoneRef)
  
  if (!phoneDoc.exists()) {
    throw new Error('Phone identity not found')
  }
  
  const data = phoneDoc.data() as PhoneIdentity
  const newCount = data.matchesCountToday + 1
  
  await updateDoc(phoneRef, {
    matchesCountToday: newCount
  })
  
  console.log(`✅ Match count incremented. Total today: ${newCount}`)
  return newCount
}

/**
 * Check if phone verification is enabled
 * This can be controlled by an environment variable or Firestore config
 */
export const isPhoneVerificationEnabled = (): boolean => {
  // TODO: Read from environment variable or Firestore config
  // For now, return false (developer mode)
  return process.env.NEXT_PUBLIC_PHONE_VERIFICATION_ENABLED === 'true'
}

/**
 * Sync user's Firebase Auth profile with phone identity
 * This links the Google account data to the phone identity
 */
export const syncUserWithPhoneIdentity = async (
  userId: string,
  phoneNumber: string,
  userData: {
    email?: string
    displayName?: string
    photoURL?: string
  }
): Promise<void> => {
  const userRef = doc(db, "users", userId)
  
  await setDoc(userRef, {
    phoneNumber,  // ✅ Link phone to user profile
    linkedAt: Timestamp.now(),
    ...userData
  }, { merge: true })
  
  console.log(`✅ User ${userId} synced with phone ${phoneNumber}`)
}
