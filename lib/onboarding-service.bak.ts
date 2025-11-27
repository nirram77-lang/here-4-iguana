import { doc, setDoc, updateDoc, Timestamp, getDoc } from "firebase/firestore"
import { db } from "./firebase"
import { getDevModePhoneNumber } from "./phone-identity-service"

export interface OnboardingData {
  gender: 'male' | 'female'
  lookingFor: 'male' | 'female' | 'both'
  age: number
  ageRange: [number, number]
  minDistance?: number  // Optional - defaults to 50
  maxDistance?: number  // Optional - defaults to 500
  hobbies: string[]
  photos: string[]
  bio: string
  name: string
  city?: string  // ✅ NEW: City of residence
  // ✅ NEW: Lifestyle fields
  drinking?: string
  smoking?: string
  height?: string
  education?: string
  relationshipType?: string  // ✅ relationship/casual/friends
}

/**
 * Save complete onboarding data to Firestore
 * ✅ CRITICAL FIX: Always reset swipes for returning users (prevents phantom matches)
 */
export const saveOnboardingData = async (
  uid: string,
  email: string,
  data: OnboardingData
) => {
  const userRef = doc(db, "users", uid)
  
  // ✅ CRITICAL: First, check if user already exists (re-registration after delete)
  const existingUser = await getDoc(userRef)
  const isReturningUser = existingUser.exists()
  
  if (isReturningUser) {
    console.log('⚠️ Returning user detected - resetting swipes to prevent phantom matches!')
  }
  
  await setDoc(userRef, {
    uid,
    email,
    name: data.name,
    displayName: data.name,
    age: data.age,
    gender: data.gender,
    photos: data.photos,
    hobbies: data.hobbies,
    bio: data.bio,
    city: data.city || '',  // ✅ NEW: Save city
    drinking: data.drinking || 'social',
    smoking: data.smoking || 'no',
    height: data.height || '',
    education: data.education || '',
    relationshipType: data.relationshipType || 'relationship',
    onboardingComplete: true,
    deleted: false,
    isAvailable: true,
    lastAvailableToggle: Timestamp.now(),
    preferences: {
      lookingFor: data.lookingFor,
      minDistance: data.minDistance || 50,
      maxDistance: data.maxDistance || 500,
      ageRange: data.ageRange,
    },
    // ✅ CRITICAL: ALWAYS reset swipes - do NOT merge with old data!
    swipedRight: [],
    swipedLeft: [],
    matches: [],
    createdAt: isReturningUser ? (existingUser.data()?.createdAt || Timestamp.now()) : Timestamp.now(),
    lastActive: Timestamp.now(),
  })  // ⚠️ REMOVED { merge: true } - we want FULL overwrite for swipes!
  
  console.log('✅ Onboarding data saved to Firestore!')
  
  // ⚡ FIX BUG-001: Give user 1 free pass after completing onboarding!
  // ⚡ FIX BUG-002: BUT preserve timer if user deleted account during lockout!
  try {
    const phoneNumber = getDevModePhoneNumber(uid)
    const phoneRef = doc(db, "phoneIdentities", phoneNumber)
    
    // ✅ CRITICAL: Check if phoneIdentity has active timer (from deleted account)
    const phoneDoc = await getDoc(phoneRef)
    
    let shouldGivePass = true
    let existingLockedUntil = null
    
    if (phoneDoc.exists()) {
      const phoneData = phoneDoc.data()
      
      // Check if there's an active timer
      if (phoneData.lockedUntil) {
        const now = Date.now()
        const lockUntil = phoneData.lockedUntil.toMillis()
        const timeRemaining = Math.max(0, Math.floor((lockUntil - now) / 1000))
        
        if (timeRemaining > 0) {
          console.log(`🔒 EXPLOIT PREVENTION: User has active timer: ${Math.floor(timeRemaining / 60)} minutes remaining`)
          console.log('   User deleted account during lockout - NO FREE PASS!')
          shouldGivePass = false
          existingLockedUntil = phoneData.lockedUntil  // Preserve the timer!
        }
      }
    }
    
    if (shouldGivePass) {
      // Normal case: Give 1 free pass
      await setDoc(phoneRef, {
        passesLeft: 1,
        lockedUntil: null,
        passesUsedToday: 0,
        matchesCountToday: 0,
        lastPassReset: Timestamp.now(),
        currentUserId: uid,
        isPremium: false,
        lastLogin: Timestamp.now()
      }, { merge: true })
      
      console.log('🎁 FREE PASS: User got 1 free pass after onboarding!')
    } else {
      // Exploit prevention: Preserve timer, NO free pass
      await setDoc(phoneRef, {
        passesLeft: 0,  // ✅ NO FREE PASS!
        lockedUntil: existingLockedUntil,  // ✅ PRESERVE TIMER!
        passesUsedToday: 0,
        matchesCountToday: 0,
        currentUserId: uid,
        isPremium: false,
        lastLogin: Timestamp.now()
        // ✅ Do NOT update lastPassReset - keep existing timer!
      }, { merge: true })
      
      console.log('🚫 NO FREE PASS: User is still locked from previous account deletion!')
      console.log(`   Timer expires: ${new Date(existingLockedUntil.toMillis()).toLocaleString()}`)
    }
  } catch (error) {
    console.warn('⚠️ Could not set free pass for phoneIdentity:', error)
  }
}
