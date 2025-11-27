/**
 * Demo Payment Service
 * Toggle between Demo Mode and Real Stripe
 */

import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { getDevModePhoneNumber } from './phone-identity-service'

// ✅ Configuration
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_PAYMENTS === 'true'

// ✅ SUPER USERS - Automatically get Premium for testing
const SUPER_USERS = [
  'nir.ram77@gmail.com'
]

/**
 * Check if user is a super user
 */
export function isSuperUser(email: string): boolean {
  return SUPER_USERS.includes(email.toLowerCase())
}

/**
 * Upgrade user to Premium in Firestore
 */
export async function upgradeUserToPremium(
  userId: string,
  plan: 'monthly' | 'yearly' | 'lifetime' = 'lifetime'
): Promise<void> {
  try {
    console.log(`🔥 Upgrading user ${userId} to Premium (${plan})...`)
    
    // Update phoneIdentity
    const phoneNumber = getDevModePhoneNumber(userId)
    const phoneRef = doc(db, 'phoneIdentities', phoneNumber)
    
    await setDoc(phoneRef, {
      isPremium: true,
      premiumPlan: plan,
      premiumSince: Timestamp.now(),
      passesLeft: 999,  // Unlimited passes
      lockedUntil: null,  // Clear any locks
      currentUserId: userId
    }, { merge: true })
    
    console.log('✅ Premium status updated in phoneIdentity')
    
    // Also update user profile
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      isPremium: true,
      premiumPlan: plan,
      premiumSince: Timestamp.now()
    })
    
    console.log('✅ Premium status updated in user profile')
  } catch (error) {
    console.error('❌ Failed to upgrade user to premium:', error)
    throw error
  }
}

/**
 * Add one pass to user
 */
export async function addOnePassToUser(userId: string): Promise<void> {
  try {
    console.log(`🎫 Adding 1 pass to user ${userId}...`)
    
    const phoneNumber = getDevModePhoneNumber(userId)
    const phoneRef = doc(db, 'phoneIdentities', phoneNumber)
    
    const phoneDoc = await getDoc(phoneRef)
    if (phoneDoc.exists()) {
      const currentPasses = phoneDoc.data().passesLeft || 0
      
      await updateDoc(phoneRef, {
        passesLeft: currentPasses + 1,
        lockedUntil: null  // Clear lock when buying pass
      })
      
      console.log(`✅ Pass added! User now has ${currentPasses + 1} passes`)
    }
  } catch (error) {
    console.error('❌ Failed to add pass:', error)
    throw error
  }
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  error?: string
}

/**
 * Process Premium Upgrade
 */
export async function processPremiumUpgrade(
  userId: string,
  plan: 'monthly' | 'yearly' | 'lifetime',
  demoMode: boolean = DEMO_MODE
): Promise<PaymentResult> {
  
  if (demoMode) {
    // ✅ DEMO MODE - Simulate payment
    console.log('💳 [DEMO] Processing premium upgrade...')
    console.log('💳 [DEMO] User:', userId)
    console.log('💳 [DEMO] Plan:', plan)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate success (100% for demo)
    const success = true
    
    if (success) {
      console.log('✅ [DEMO] Payment successful!')
      
      // ✅ Actually upgrade user to premium in Firestore!
      await upgradeUserToPremium(userId, plan)
      
      return {
        success: true,
        transactionId: `demo-txn-${Date.now()}`
      }
    } else {
      console.log('❌ [DEMO] Payment failed!')
      return {
        success: false,
        error: 'Demo payment failed (simulated)'
      }
    }
  } else {
    // ✅ REAL MODE - Use Stripe
    console.log('💳 [REAL] Processing with Stripe...')
    
    try {
      // This will be the real Stripe integration
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan,
          mode: 'subscription'
        })
      })
      
      const data = await response.json()
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
        return { success: true }
      }
      
      return {
        success: false,
        error: 'Failed to create checkout session'
      }
    } catch (error: any) {
      console.error('❌ Stripe error:', error)
      return {
        success: false,
        error: error.message || 'Payment failed'
      }
    }
  }
}

/**
 * Process One-Time Pass Purchase
 */
export async function purchaseOnePass(
  userId: string,
  demoMode: boolean = DEMO_MODE
): Promise<PaymentResult> {
  
  if (demoMode) {
    // ✅ DEMO MODE
    console.log('💳 [DEMO] Purchasing 1 pass...')
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const success = true  // 100% success for demo
    
    if (success) {
      console.log('✅ [DEMO] Pass purchased!')
      
      // ✅ Actually add pass to user in Firestore!
      await addOnePassToUser(userId)
      
      return {
        success: true,
        transactionId: `demo-pass-${Date.now()}`
      }
    } else {
      return {
        success: false,
        error: 'Demo payment failed'
      }
    }
  } else {
    // ✅ REAL MODE - Stripe
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          product: 'one_pass',
          mode: 'payment'
        })
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
        return { success: true }
      }
      
      return {
        success: false,
        error: 'Failed to create checkout'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment failed'
      }
    }
  }
}

/**
 * Verify Payment (for webhooks)
 */
export async function verifyPayment(
  sessionId: string,
  demoMode: boolean = DEMO_MODE
): Promise<boolean> {
  
  if (demoMode) {
    // ✅ DEMO MODE - Always succeed
    return true
  } else {
    // ✅ REAL MODE - Verify with Stripe
    try {
      const response = await fetch(`/api/stripe/verify-session/${sessionId}`)
      const data = await response.json()
      return data.verified === true
    } catch (error) {
      console.error('❌ Verification failed:', error)
      return false
    }
  }
}

/**
 * Get payment mode (for UI display)
 */
export function getPaymentMode(): 'demo' | 'real' {
  return DEMO_MODE ? 'demo' : 'real'
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Get plan prices
 */
export const PLAN_PRICES = {
  monthly: { cents: 999, display: '$9.99' },
  yearly: { cents: 7999, display: '$79.99' },
  lifetime: { cents: 14999, display: '$149.99' },
  one_pass: { cents: 99, display: '$0.99' }
}
