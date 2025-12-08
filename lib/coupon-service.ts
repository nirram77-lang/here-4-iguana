/**
 * 🎟️ I4IGUANA Coupon System
 * Handles promotional codes from Firestore - PASS, WEEKLY, MONTHLY
 */

import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

// ===================================
// 🎟️ COUPON TYPES & INTERFACES
// ===================================

export type CouponType = 'pass' | 'weekly' | 'monthly'

export interface CouponResult {
  success: boolean
  message: string
  couponType?: CouponType
  reward?: string
}

interface FirestoreCoupon {
  code: string
  type: CouponType
  status: 'available' | 'used' | 'expired'
  usedBy: string | null
  usedByEmail: string | null
  usedAt: any | null
  createdAt: any
  expiresAt: any | null
}

// ===================================
// 🔍 COUPON REDEMPTION
// ===================================

/**
 * Validate and apply a coupon code from Firestore
 */
export async function redeemCoupon(
  phoneNumber: string,
  couponCode: string
): Promise<CouponResult> {
  try {
    // Normalize coupon code (uppercase, trim)
    const normalizedCode = couponCode.trim().toUpperCase()
    
    console.log(`🎟️ Attempting to redeem coupon: ${normalizedCode}`)
    
    // ═══════════════════════════════════════════════════════════
    // Step 1: Check Firestore for the coupon
    // ═══════════════════════════════════════════════════════════
    const couponRef = doc(db, 'coupons', normalizedCode)
    const couponSnap = await getDoc(couponRef)
    
    if (!couponSnap.exists()) {
      console.log('❌ Coupon not found in Firestore')
      return {
        success: false,
        message: 'Invalid coupon code. Please check and try again.'
      }
    }
    
    const coupon = couponSnap.data() as FirestoreCoupon
    
    // ═══════════════════════════════════════════════════════════
    // Step 2: Validate coupon status
    // ═══════════════════════════════════════════════════════════
    if (coupon.status === 'used') {
      console.log('❌ Coupon already used')
      return {
        success: false,
        message: 'This coupon has already been used.'
      }
    }
    
    if (coupon.status === 'expired') {
      console.log('❌ Coupon expired')
      return {
        success: false,
        message: 'This coupon has expired.'
      }
    }
    
    // Check expiration date
    if (coupon.expiresAt) {
      const expirationDate = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt)
      if (new Date() > expirationDate) {
        console.log('❌ Coupon has expired')
        // Update status in Firestore
        await updateDoc(couponRef, { status: 'expired' })
        return {
          success: false,
          message: 'This coupon has expired.'
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // Step 3: Get user's phone identity
    // ═══════════════════════════════════════════════════════════
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
    const userEmail = phoneData.email || ''
    
    // ═══════════════════════════════════════════════════════════
    // Step 4: Apply coupon based on type
    // ═══════════════════════════════════════════════════════════
    let result: CouponResult
    
    switch (coupon.type) {
      case 'pass':
        result = await applyPassCoupon(phoneRef, phoneData, coupon)
        break
      case 'weekly':
        result = await applyPremiumCoupon(phoneRef, phoneData, coupon, 7)
        break
      case 'monthly':
        result = await applyPremiumCoupon(phoneRef, phoneData, coupon, 30)
        break
      default:
        return {
          success: false,
          message: 'Unknown coupon type.'
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // Step 5: Mark coupon as used in Firestore
    // ═══════════════════════════════════════════════════════════
    if (result.success) {
      await updateDoc(couponRef, {
        status: 'used',
        usedBy: phoneNumber,
        usedByEmail: userEmail,
        usedAt: Timestamp.now()
      })
      console.log(`✅ Coupon ${normalizedCode} marked as used`)
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Error redeeming coupon:', error)
    return {
      success: false,
      message: 'Failed to redeem coupon. Please try again.'
    }
  }
}

// ===================================
// 🎫 APPLY PASS COUPON
// ===================================

async function applyPassCoupon(
  phoneRef: any,
  phoneData: any,
  coupon: FirestoreCoupon
): Promise<CouponResult> {
  try {
    const currentPasses = phoneData.passesLeft || 0
    const newPassCount = currentPasses + 1
    
    // Update phone identity with extra pass
    await updateDoc(phoneRef, {
      passesLeft: newPassCount,
      lastCouponRedeemedAt: Timestamp.now()
    })
    
    console.log(`✅ Pass coupon applied! New pass count: ${newPassCount}`)
    
    return {
      success: true,
      message: `🎁 Bonus! You received 1 extra pass!`,
      couponType: 'pass',
      reward: `+1 pass (Total: ${newPassCount})`
    }
    
  } catch (error) {
    console.error('❌ Error applying pass coupon:', error)
    return {
      success: false,
      message: 'Failed to add bonus pass.'
    }
  }
}

// ===================================
// 💎 APPLY PREMIUM COUPON (WEEKLY/MONTHLY)
// ===================================

async function applyPremiumCoupon(
  phoneRef: any,
  phoneData: any,
  coupon: FirestoreCoupon,
  durationDays: number
): Promise<CouponResult> {
  try {
    const premiumExpiresAt = new Date()
    
    // Check if user already has premium and extend it
    if (phoneData.isPremium && phoneData.premiumExpiresAt) {
      const currentExpiry = phoneData.premiumExpiresAt.toDate ? 
        phoneData.premiumExpiresAt.toDate() : 
        new Date(phoneData.premiumExpiresAt)
      
      if (currentExpiry > new Date()) {
        // Extend from current expiry
        premiumExpiresAt.setTime(currentExpiry.getTime())
      }
    }
    
    // Add duration days
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + durationDays)
    
    // Update phone identity with premium status
    await updateDoc(phoneRef, {
      isPremium: true,
      premiumExpiresAt: Timestamp.fromDate(premiumExpiresAt),
      premiumSource: 'coupon',
      premiumCouponCode: coupon.code,
      passesLeft: Math.max(phoneData.passesLeft || 0, 3), // Premium users get at least 3 passes
      lastCouponRedeemedAt: Timestamp.now()
    })
    
    const typeLabel = durationDays === 7 ? 'Weekly' : 'Monthly'
    console.log(`✅ ${typeLabel} Premium coupon applied! Expires: ${premiumExpiresAt.toLocaleDateString()}`)
    
    return {
      success: true,
      message: `🎉 Welcome to Premium! Your ${durationDays}-day ${typeLabel} subscription is now active!`,
      couponType: durationDays === 7 ? 'weekly' : 'monthly',
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

// ===================================
// 🔍 VALIDATE COUPON (without redeeming)
// ===================================

export async function validateCouponCode(couponCode: string): Promise<{
  isValid: boolean
  couponType?: CouponType
  description?: string
}> {
  try {
    const normalizedCode = couponCode.trim().toUpperCase()
    const couponRef = doc(db, 'coupons', normalizedCode)
    const couponSnap = await getDoc(couponRef)
    
    if (!couponSnap.exists()) {
      return { isValid: false }
    }
    
    const coupon = couponSnap.data() as FirestoreCoupon
    
    if (coupon.status !== 'available') {
      return { isValid: false }
    }
    
    // Check expiration
    if (coupon.expiresAt) {
      const expirationDate = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt)
      if (new Date() > expirationDate) {
        return { isValid: false }
      }
    }
    
    const descriptions: Record<CouponType, string> = {
      'pass': '🎫 Bonus Pass - פאס חינמי!',
      'weekly': '💎 Weekly Premium - שבוע חינם!',
      'monthly': '👑 Monthly Premium - חודש חינם!'
    }
    
    return {
      isValid: true,
      couponType: coupon.type,
      description: descriptions[coupon.type]
    }
    
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { isValid: false }
  }
}
