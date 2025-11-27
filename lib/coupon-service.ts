/**
 * 🎟️ I4IGUANA Coupon System
 * Handles promotional codes for Premium upgrades and Pass bonuses
 */

import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

// ===================================
// 🎟️ COUPON CODES CONFIGURATION
// ===================================

interface CouponConfig {
  code: string
  type: 'premium' | 'pass'
  durationDays?: number  // For premium coupons
  passCount?: number     // For pass coupons
  description: string
  maxUses?: number       // Optional limit on total uses
  expiresAt?: Date       // Optional expiration date
}

// 🔥 ACTIVE COUPONS - Add/remove coupons here!
const ACTIVE_COUPONS: CouponConfig[] = [
  {
    code: 'PILOT2026',
    type: 'premium',
    durationDays: 7,
    description: '🎉 Pilot Premium - 7 Days Free!'
  },
  {
    code: 'PASS2026',
    type: 'pass',
    passCount: 1,
    description: '🎁 Bonus Pass - 1 Extra Swipe!'
  },
  // Add more coupons as needed:
  // {
  //   code: 'LAUNCH2026',
  //   type: 'premium',
  //   durationDays: 30,
  //   description: '🚀 Launch Special - 30 Days Premium!'
  // },
]

// ===================================
// 🔍 COUPON VALIDATION
// ===================================

export interface CouponResult {
  success: boolean
  message: string
  couponType?: 'premium' | 'pass'
  reward?: string
}

/**
 * Validate and apply a coupon code
 */
export async function redeemCoupon(
  phoneNumber: string,
  couponCode: string
): Promise<CouponResult> {
  try {
    // Normalize coupon code (uppercase, trim)
    const normalizedCode = couponCode.trim().toUpperCase()
    
    console.log(`🎟️ Attempting to redeem coupon: ${normalizedCode}`)
    
    // Find matching coupon
    const coupon = ACTIVE_COUPONS.find(c => c.code === normalizedCode)
    
    if (!coupon) {
      console.log('❌ Invalid coupon code')
      return {
        success: false,
        message: 'Invalid coupon code. Please check and try again.'
      }
    }
    
    // Check if coupon has expired
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      console.log('❌ Coupon has expired')
      return {
        success: false,
        message: 'This coupon has expired.'
      }
    }
    
    // Get user's phone identity
    const phoneRef = doc(db, 'phoneIdentities', phoneNumber)
    const phoneDoc = await getDoc(phoneRef)
    
    if (!phoneDoc.exists()) {
      console.log('❌ Phone identity not found')
      return {
        success: false,
        message: 'User not found. Please complete registration first.'
      }
    }
    
    const phoneData = phoneDoc.data()
    
    // Check if user already used this coupon
    const usedCoupons = phoneData.usedCoupons || []
    if (usedCoupons.includes(normalizedCode)) {
      console.log('❌ Coupon already used by this user')
      return {
        success: false,
        message: 'You have already used this coupon.'
      }
    }
    
    // Apply coupon based on type
    if (coupon.type === 'premium') {
      return await applyPremiumCoupon(phoneRef, phoneData, coupon, normalizedCode)
    } else if (coupon.type === 'pass') {
      return await applyPassCoupon(phoneRef, phoneData, coupon, normalizedCode)
    }
    
    return {
      success: false,
      message: 'Unknown coupon type.'
    }
    
  } catch (error) {
    console.error('❌ Error redeeming coupon:', error)
    return {
      success: false,
      message: 'Failed to redeem coupon. Please try again.'
    }
  }
}

/**
 * Apply a Premium coupon
 */
async function applyPremiumCoupon(
  phoneRef: any,
  phoneData: any,
  coupon: CouponConfig,
  couponCode: string
): Promise<CouponResult> {
  try {
    const durationDays = coupon.durationDays || 7
    const premiumExpiresAt = new Date()
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + durationDays)
    
    // Update phone identity with premium status
    await updateDoc(phoneRef, {
      isPremium: true,
      premiumExpiresAt: Timestamp.fromDate(premiumExpiresAt),
      premiumSource: 'coupon',
      premiumCouponCode: couponCode,
      passesLeft: 3,  // Premium users get 3 passes
      usedCoupons: [...(phoneData.usedCoupons || []), couponCode],
      lastCouponRedeemedAt: Timestamp.now()
    })
    
    console.log(`✅ Premium coupon applied! Expires: ${premiumExpiresAt.toLocaleDateString()}`)
    
    return {
      success: true,
      message: `🎉 Welcome to Premium! Your ${durationDays}-day trial is now active!`,
      couponType: 'premium',
      reward: `${durationDays} days Premium + 3 daily passes`
    }
    
  } catch (error) {
    console.error('❌ Error applying premium coupon:', error)
    return {
      success: false,
      message: 'Failed to apply premium upgrade.'
    }
  }
}

/**
 * Apply a Pass coupon
 */
async function applyPassCoupon(
  phoneRef: any,
  phoneData: any,
  coupon: CouponConfig,
  couponCode: string
): Promise<CouponResult> {
  try {
    const passCount = coupon.passCount || 1
    const currentPasses = phoneData.passesLeft || 0
    const newPassCount = currentPasses + passCount
    
    // Update phone identity with extra passes
    await updateDoc(phoneRef, {
      passesLeft: newPassCount,
      usedCoupons: [...(phoneData.usedCoupons || []), couponCode],
      lastCouponRedeemedAt: Timestamp.now()
    })
    
    console.log(`✅ Pass coupon applied! New pass count: ${newPassCount}`)
    
    return {
      success: true,
      message: `🎁 Bonus! You received ${passCount} extra pass${passCount > 1 ? 'es' : ''}!`,
      couponType: 'pass',
      reward: `+${passCount} pass${passCount > 1 ? 'es' : ''} (Total: ${newPassCount})`
    }
    
  } catch (error) {
    console.error('❌ Error applying pass coupon:', error)
    return {
      success: false,
      message: 'Failed to add bonus pass.'
    }
  }
}

/**
 * Check if a coupon code is valid (without redeeming)
 */
export function validateCouponCode(couponCode: string): {
  isValid: boolean
  couponType?: 'premium' | 'pass'
  description?: string
} {
  const normalizedCode = couponCode.trim().toUpperCase()
  const coupon = ACTIVE_COUPONS.find(c => c.code === normalizedCode)
  
  if (!coupon) {
    return { isValid: false }
  }
  
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { isValid: false }
  }
  
  return {
    isValid: true,
    couponType: coupon.type,
    description: coupon.description
  }
}

/**
 * Get list of available coupon codes (for admin/testing)
 */
export function getAvailableCoupons(): string[] {
  return ACTIVE_COUPONS.map(c => c.code)
}
