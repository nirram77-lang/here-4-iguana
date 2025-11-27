import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { 
  getOrCreatePhoneIdentity, 
  usePassForPhone, 
  resetDailyPassesIfNeeded,
  getDevModePhoneNumber,
  isPhoneVerificationEnabled,
  incrementMatchCount as _incrementMatchCountByPhone
} from "./phone-identity-service"

// ✅ Re-export internal function with clear name
export { incrementMatchCount as incrementMatchCountByPhone } from "./phone-identity-service"

export interface PassData {
  passesLeft: number
  isPremium: boolean
  passesUsedToday: number
  matchesCountToday: number  // ✅ For admin panel
  lastPassReset: Date
}

/**
 * Get pass data for a user
 * Now uses phone identity system instead of just userId
 */
export const getUserPassData = async (userId: string): Promise<PassData> => {
  try {
    console.log(`📊 [getUserPassData] Starting for userId: ${userId}`)
    
    // Step 1: Get user's phone number
    let phoneNumber: string
    
    if (isPhoneVerificationEnabled()) {
      // Production: Get from user profile (after phone verification)
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists() || !userDoc.data().phoneNumber) {
        throw new Error('User has no verified phone number')
      }
      
      phoneNumber = userDoc.data().phoneNumber
    } else {
      // Developer mode: Generate consistent fake phone
      phoneNumber = getDevModePhoneNumber(userId)
      console.log(`🔧 [getUserPassData] DEV MODE: Using fake phone: ${phoneNumber}`)
    }
    
    // Step 2: Get or create phone identity
    const identity = await getOrCreatePhoneIdentity(phoneNumber, userId)
    console.log(`📱 [getUserPassData] Phone identity loaded:`, {
      passesLeft: identity.passesLeft,
      isPremium: identity.isPremium,
      lockedUntil: identity.lockedUntil ? new Date(identity.lockedUntil.toMillis()).toLocaleString() : 'Not locked'
    })
    
    // Step 3: Check if we need to reset daily passes
    await resetDailyPassesIfNeeded(phoneNumber)
    
    // Step 4: Get fresh data after potential reset
    const updatedIdentity = await getOrCreatePhoneIdentity(phoneNumber, userId)
    
    console.log(`✅ [getUserPassData] Final pass data:`, {
      passesLeft: updatedIdentity.passesLeft,
      isPremium: updatedIdentity.isPremium,
      passesUsedToday: updatedIdentity.passesUsedToday,
      matchesCountToday: updatedIdentity.matchesCountToday
    })
    
    return {
      passesLeft: updatedIdentity.passesLeft,
      isPremium: updatedIdentity.isPremium,
      passesUsedToday: updatedIdentity.passesUsedToday,
      matchesCountToday: updatedIdentity.matchesCountToday,  // ✅ Include matches count
      lastPassReset: updatedIdentity.lastPassReset?.toDate?.() || new Date()  // ✅ FIXED: Safe toDate call
    }
  } catch (error) {
    console.error('❌ [getUserPassData] Error getting pass data:', error)
    
    // Fallback: Return default data
    return {
      passesLeft: 1,
      isPremium: false,
      passesUsedToday: 0,
      matchesCountToday: 0,  // ✅ Include matches count
      lastPassReset: new Date()
    }
  }
}

/**
 * Use a pass
 * Now tracks by phone number, not userId
 */
export const usePass = async (userId: string): Promise<number> => {
  try {
    // Get phone number
    let phoneNumber: string
    
    if (isPhoneVerificationEnabled()) {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists() || !userDoc.data().phoneNumber) {
        throw new Error('User has no verified phone number')
      }
      
      phoneNumber = userDoc.data().phoneNumber
    } else {
      phoneNumber = getDevModePhoneNumber(userId)
      console.log('🔧 DEV MODE: Using fake phone:', phoneNumber)
    }
    
    // Use pass via phone identity
    const newPassesLeft = await usePassForPhone(phoneNumber)
    
    console.log(`✅ Pass used for phone ${phoneNumber}. Remaining: ${newPassesLeft}`)
    return newPassesLeft
  } catch (error) {
    console.error('Error using pass:', error)
    throw error
  }
}

/**
 * Check if user can swipe (has passes left or is premium)
 */
export const canUserSwipe = async (userId: string): Promise<boolean> => {
  const passData = await getUserPassData(userId)
  return passData.isPremium || passData.passesLeft > 0
}

/**
 * Legacy function for backwards compatibility
 * TODO: Remove after migration
 */
export const getPassesLeft = async (userId: string): Promise<number> => {
  const passData = await getUserPassData(userId)
  return passData.passesLeft
}

/**
 * Legacy function for backwards compatibility
 * TODO: Remove after migration
 */
export const isPremiumUser = async (userId: string): Promise<boolean> => {
  const passData = await getUserPassData(userId)
  return passData.isPremium
}

/**
 * Record a match (increment match counter)
 * Should be called when a match is created
 */
export const recordMatch = async (userId: string): Promise<number> => {
  try {
    // Get phone number
    let phoneNumber: string
    
    if (isPhoneVerificationEnabled()) {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists() || !userDoc.data().phoneNumber) {
        throw new Error('User has no verified phone number')
      }
      
      phoneNumber = userDoc.data().phoneNumber
    } else {
      phoneNumber = getDevModePhoneNumber(userId)
    }
    
    // Increment match count
    const newCount = await _incrementMatchCountByPhone(phoneNumber)
    
    console.log(`✅ Match recorded for phone ${phoneNumber}. Total today: ${newCount}`)
    return newCount
  } catch (error) {
    console.error('Error recording match:', error)
    throw error
  }
}

/**
 * Increment match count by userId (for admin panel and app)
 * This is the main public API - converts userId to phoneNumber internally
 */
export const incrementMatchCount = async (userId: string): Promise<number> => {
  return await recordMatch(userId)
}
