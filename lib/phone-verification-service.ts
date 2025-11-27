import { auth, db } from './firebase'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

// Global reCAPTCHA verifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null

/**
 * Initialize invisible reCAPTCHA verifier
 * This is called automatically before sending SMS
 */
export function initializeRecaptcha(): RecaptchaVerifier {
  // If already initialized, return existing instance
  if (recaptchaVerifier) {
    console.log('♻️ Reusing existing reCAPTCHA verifier')
    return recaptchaVerifier
  }

  console.log('🔐 Initializing reCAPTCHA verifier...')

  // Create new invisible reCAPTCHA
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      console.log('✅ reCAPTCHA verified successfully')
    },
    'expired-callback': () => {
      console.log('⚠️ reCAPTCHA expired')
      recaptchaVerifier = null
    }
  })

  return recaptchaVerifier
}

/**
 * Send phone verification code via SMS
 * @param phoneNumber - Phone number in international format (e.g., +972501234567)
 * @returns ConfirmationResult for code verification
 */
export async function sendPhoneVerification(phoneNumber: string): Promise<ConfirmationResult> {
  try {
    console.log('📱 Sending verification code to:', phoneNumber)

    // Initialize reCAPTCHA if not already done
    const verifier = initializeRecaptcha()

    // Send SMS code
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
    
    console.log('✅ Verification code sent successfully')
    return confirmationResult
  } catch (error: any) {
    console.error('❌ Error sending verification code:', error)
    
    // User-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('מספר טלפון לא תקין')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר')
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('הגעת למכסה היומית. אנא נסה מחר')
    } else {
      throw new Error('שגיאה בשליחת קוד אימות. אנא נסה שנית')
    }
  }
}

/**
 * Verify the SMS code entered by user
 * @param confirmationResult - Result from sendPhoneVerification
 * @param code - 6-digit verification code
 */
export async function verifyPhoneCode(
  confirmationResult: ConfirmationResult, 
  code: string
): Promise<void> {
  try {
    console.log('🔐 Verifying code:', code)

    // Verify the code
    const result = await confirmationResult.confirm(code)
    
    console.log('✅ Phone number verified successfully:', result.user.phoneNumber)

    // Update user document in Firestore
    const userRef = doc(db, 'users', result.user.uid)
    await updateDoc(userRef, {
      phoneNumber: result.user.phoneNumber,
      phoneVerified: true,
      phoneVerifiedAt: serverTimestamp()
    })

    console.log('✅ User document updated with phone verification')
  } catch (error: any) {
    console.error('❌ Error verifying code:', error)
    
    // User-friendly error messages
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('קוד שגוי. אנא נסה שנית')
    } else if (error.code === 'auth/code-expired') {
      throw new Error('הקוד פג תוקף. אנא בקש קוד חדש')
    } else {
      throw new Error('שגיאה באימות הקוד. אנא נסה שנית')
    }
  }
}

/**
 * Clear reCAPTCHA verifier (useful for cleanup)
 */
export function clearRecaptcha(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear()
    } catch (error) {
      console.error('Error clearing reCAPTCHA:', error)
    }
    recaptchaVerifier = null
  }
}
