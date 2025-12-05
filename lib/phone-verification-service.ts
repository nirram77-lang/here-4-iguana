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
  // Clear existing verifier if it exists (to avoid stale state)
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear()
      console.log('🧹 Cleared existing reCAPTCHA verifier')
    } catch (e) {
      console.log('⚠️ Could not clear existing verifier:', e)
    }
    recaptchaVerifier = null
  }

  console.log('🔐 Initializing new reCAPTCHA verifier...')

  // Check if container exists
  const container = document.getElementById('recaptcha-container')
  if (!container) {
    console.error('❌ recaptcha-container element not found!')
    throw new Error('reCAPTCHA container not found')
  }

  // Create new invisible reCAPTCHA
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      console.log('✅ reCAPTCHA verified successfully')
    },
    'expired-callback': () => {
      console.log('⚠️ reCAPTCHA expired - clearing')
      recaptchaVerifier = null
    }
  })

  return recaptchaVerifier
}

/**
 * Send phone verification code via SMS
 * @param phoneNumber - Phone number in international format (e.g., +972521234567)
 * @returns ConfirmationResult for code verification
 */
export async function sendPhoneVerification(phoneNumber: string): Promise<ConfirmationResult> {
  try {
    console.log('📱 Sending verification code to:', phoneNumber)

    // Validate phone number format
    if (!phoneNumber.startsWith('+972') || phoneNumber.length < 13) {
      throw new Error('מספר טלפון לא תקין - נדרש מספר ישראלי מלא')
    }

    // Initialize reCAPTCHA (always fresh)
    const verifier = initializeRecaptcha()
    
    // Render the reCAPTCHA widget
    console.log('🔄 Rendering reCAPTCHA...')
    await verifier.render()
    console.log('✅ reCAPTCHA rendered')

    // Send SMS code
    console.log('📤 Calling signInWithPhoneNumber...')
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
    
    console.log('✅ Verification code sent successfully')
    return confirmationResult
  } catch (error: any) {
    console.error('❌ Error sending verification code:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    
    // Clear the verifier on error
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear()
      } catch (e) {}
      recaptchaVerifier = null
    }
    
    // User-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('מספר טלפון לא תקין')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר')
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('הגעת למכסה היומית. אנא נסה מחר')
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('אימות טלפון לא מופעל. פנה לתמיכה')
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('בעיית אבטחה. רענן את הדף ונסה שנית')
    } else if (error.code === 'auth/missing-phone-number') {
      throw new Error('מספר טלפון חסר')
    } else if (error.message?.includes('reCAPTCHA')) {
      throw new Error('בעיית אבטחה. רענן את הדף ונסה שנית')
    } else {
      throw new Error(`שגיאה בשליחת קוד אימות: ${error.code || error.message}`)
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
