// lib/lock-system.ts
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { PASS_CONFIG, ERROR_MESSAGES } from './constants'

export interface LockStatus {
  isLocked: boolean
  remainingTime: number // milliseconds
  canUnlock: boolean
  lockUntil: number
}

/**
 * 🔒 Check if user is currently locked
 */
export async function checkLockStatus(userId: string): Promise<LockStatus> {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      throw new Error('User not found')
    }
    
    const data = userSnap.data()
    const now = Date.now()
    const lockUntil = data.lockUntil || 0
    const isLocked = data.isLocked || false
    const isPremium = data.isPremium || false
    
    // Premium users are never locked
    if (isPremium) {
      return {
        isLocked: false,
        remainingTime: 0,
        canUnlock: true,
        lockUntil: 0
      }
    }
    
    // Check if lock has expired
    if (isLocked && now >= lockUntil) {
      console.log('🔓 Lock expired - auto unlocking user')
      await unlockUser(userId, 'timer')
      return {
        isLocked: false,
        remainingTime: 0,
        canUnlock: true,
        lockUntil: 0
      }
    }
    
    // User is still locked
    if (isLocked && now < lockUntil) {
      const remainingTime = lockUntil - now
      console.log(`🔒 User locked for ${Math.round(remainingTime / 1000 / 60)} more minutes`)
      return {
        isLocked: true,
        remainingTime,
        canUnlock: false,
        lockUntil
      }
    }
    
    // User is not locked
    return {
      isLocked: false,
      remainingTime: 0,
      canUnlock: true,
      lockUntil: 0
    }
    
  } catch (error) {
    console.error('❌ Error checking lock status:', error)
    throw error
  }
}

/**
 * 🔒 Lock user after reaching match limit
 */
export async function lockUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const now = Date.now()
    const lockUntil = now + PASS_CONFIG.LOCK_DURATION
    
    await updateDoc(userRef, {
      isLocked: true,
      lockUntil,
      passesLeft: 0,
      lastMatchTimestamp: serverTimestamp()
    })
    
    const lockDurationMinutes = PASS_CONFIG.LOCK_DURATION / 1000 / 60
    console.log(`🔒 User locked until ${new Date(lockUntil).toLocaleTimeString()}`)
    console.log(`⏰ Lock duration: ${lockDurationMinutes} minutes`)
    
  } catch (error) {
    console.error('❌ Error locking user:', error)
    throw new Error(ERROR_MESSAGES.FIRESTORE_SAVE_ERROR)
  }
}

/**
 * 🔓 Unlock user (after timer or payment)
 */
export async function unlockUser(
  userId: string, 
  reason: 'timer' | 'payment' | 'premium'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    await updateDoc(userRef, {
      isLocked: false,
      lockUntil: 0,
      passesLeft: 1,
      matchesCountToday: 0,
      lastMatchTimestamp: 0
    })
    
    console.log(`🔓 User unlocked via: ${reason}`)
    
  } catch (error) {
    console.error('❌ Error unlocking user:', error)
    throw new Error(ERROR_MESSAGES.FIRESTORE_SAVE_ERROR)
  }
}

/**
 * ⚡ Skip timer with payment ($2.99)
 */
export async function skipTimer(userId: string, paymentId: string): Promise<void> {
  try {
    // First, verify the payment was successful
    // This should be done via webhook or Stripe API verification
    
    // Unlock the user
    await unlockUser(userId, 'payment')
    
    // Record the purchase
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      skipTimerPurchases: serverTimestamp()
    })
    
    console.log(`⚡ Timer skipped for user ${userId} with payment ${paymentId}`)
    
  } catch (error) {
    console.error('❌ Error skipping timer:', error)
    throw new Error(ERROR_MESSAGES.PAYMENT_ERROR)
  }
}

/**
 * 📊 Get lock info for display
 */
export async function getLockInfo(userId: string): Promise<{
  isLocked: boolean
  lockUntilDate: Date | null
  remainingTimeFormatted: string
}> {
  try {
    const status = await checkLockStatus(userId)
    
    if (!status.isLocked) {
      return {
        isLocked: false,
        lockUntilDate: null,
        remainingTimeFormatted: '00:00:00'
      }
    }
    
    const lockUntilDate = new Date(status.lockUntil)
    const remainingTimeFormatted = formatTime(status.remainingTime)
    
    return {
      isLocked: true,
      lockUntilDate,
      remainingTimeFormatted
    }
    
  } catch (error) {
    console.error('❌ Error getting lock info:', error)
    throw error
  }
}

/**
 * 🕐 Format milliseconds to HH:MM:SS
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * ⏰ Check if user can make a match
 */
export async function canMakeMatch(userId: string): Promise<{
  canMatch: boolean
  reason?: string
}> {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return { canMatch: false, reason: 'User not found' }
    }
    
    const data = userSnap.data()
    const isPremium = data.isPremium || false
    
    // Premium users can always match
    if (isPremium) {
      return { canMatch: true }
    }
    
    // Check lock status
    const status = await checkLockStatus(userId)
    if (status.isLocked) {
      return { 
        canMatch: false, 
        reason: `Locked for ${formatTime(status.remainingTime)}` 
      }
    }
    
    // Check match limit
    const matchesCountToday = data.matchesCountToday || 0
    if (matchesCountToday >= PASS_CONFIG.MAX_MATCHES_FREE) {
      return { 
        canMatch: false, 
        reason: 'Reached daily match limit' 
      }
    }
    
    return { canMatch: true }
    
  } catch (error) {
    console.error('❌ Error checking if can match:', error)
    return { canMatch: false, reason: 'Error checking status' }
  }
}
