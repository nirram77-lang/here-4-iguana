import { auth, db } from './firebase'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

// Global reCAPTCHA verifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null
let recaptchaWidgetId: number | null = null

/**
 * Clear and reset reCAPTCHA completely
 */
function clearRecaptchaCompletely(): void {
  console.log('🧹 Clearing reCAPTCHA completely...')
  
  // Clear the verifier instance
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear()
      console.log('✅ Cleared verifier instance')
    } catch (e) {
      console.log('⚠️ Could not clear verifier:', e)
    }
    recaptchaVerifier = null
  }
  
  // Reset widget ID
  recaptchaWidgetId = null
  
  // Clear the container completely
  const container = document.getElementById('recaptcha-container')
  if (container) {
    container.innerHTML = ''
    console.log('✅ Cleared container innerHTML')
  }
  
  // Also try to clear any grecaptcha widgets
  if (typeof window !== 'undefined' && (window as any).grecaptcha) {
    try {
      const grecaptcha = (window as any).grecaptcha
      if (grecaptcha.reset) {
        grecaptcha.reset()
        console.log('✅ Reset grecaptcha')
      }
    } catch (e) {
      console.log('⚠️ Could not reset grecaptcha:', e)
    }
  }
}

/**
 * Initialize invisible reCAPTCHA verifier
 * This is called automatically before sending SMS
 */
export function initializeRecaptcha(): RecaptchaVerifier {
  // Always clear completely first
  clearRecaptchaCompletely()
  
  console.log('🔐 Initializing new reCAPTCHA verifier...')

  // Check if container exists
  const container = document.getElementById('recaptcha-container')
  if (!container) {
    console.error('❌ recaptcha-container element not found!')
    throw new Error('reCAPTCHA container not found. Please refresh the page.')
  }

  // Create new invisible reCAPTCHA
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      console.log('✅ reCAPTCHA verified successfully')
    },
    'expired-callback': () => {
      console.log('⚠️ reCAPTCHA expired - clearing')
      clearRecaptchaCompletely()
    },
    'error-callback': () => {
      console.log('❌ reCAPTCHA error - clearing')
      clearRecaptchaCompletely()
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
      throw new Error('Invalid phone number. Please enter a valid Israeli mobile number.')
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
    console.log('📋 ConfirmationResult verificationId:', confirmationResult.verificationId)
    
    return confirmationResult
  } catch (error: any) {
    console.error('❌ Error sending verification code:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    
    // Clear the verifier on error
    clearRecaptchaCompletely()
    
    // User-friendly error messages in English
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('⏳ Too many attempts. Please wait 15-30 minutes and try again.')
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('Daily limit reached. Please try again tomorrow.')
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Phone verification is not enabled. Please contact support.')
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('Security check failed. Please refresh the page and try again.')
    } else if (error.code === 'auth/missing-phone-number') {
      throw new Error('Phone number is required.')
    } else if (error.message?.includes('reCAPTCHA')) {
      throw new Error('Security check failed. Please refresh the page and try again.')
    } else {
      throw new Error(`Failed to send verification code: ${error.code || error.message}`)
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
    console.log('📋 ConfirmationResult exists:', !!confirmationResult)
    console.log('📋 ConfirmationResult.confirm exists:', typeof confirmationResult?.confirm)

    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      throw new Error('Invalid verification session. Please request a new code.')
    }

    // Verify the code
    const result = await confirmationResult.confirm(code)
    
    console.log('✅ Phone number verified successfully:', result.user.phoneNumber)

    // Update user document in Firestore
    if (result.user.uid) {
      try {
        const userRef = doc(db, 'users', result.user.uid)
        await updateDoc(userRef, {
          phoneNumber: result.user.phoneNumber,
          phoneVerified: true,
          phoneVerifiedAt: serverTimestamp()
        })
        console.log('✅ User document updated with phone verification')
      } catch (updateError) {
        console.log('⚠️ Could not update user document (might be handled elsewhere):', updateError)
        // Don't throw - the phone verification itself succeeded
      }
    }
  } catch (error: any) {
    console.error('❌ Error verifying code:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    
    // User-friendly error messages in English
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid code. Please check and try again.')
    } else if (error.code === 'auth/code-expired') {
      throw new Error('Code expired. Please request a new one.')
    } else if (error.code === 'auth/session-expired') {
      throw new Error('Session expired. Please request a new code.')
    } else if (error.code === 'auth/invalid-verification-id') {
      throw new Error('Verification session invalid. Please request a new code.')
    } else if (error.message?.includes('Invalid verification session')) {
      throw error // Re-throw our custom error
    } else {
      throw new Error('Verification failed. Please try again.')
    }
  }
}

/**
 * Clear reCAPTCHA verifier (useful for cleanup)
 */
export function clearRecaptcha(): void {
  clearRecaptchaCompletely()
}
