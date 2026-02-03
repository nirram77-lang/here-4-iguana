/**
 * 🦎 I4IGUANA - OneSignal Notification Service v2.0
 * 
 * COMPREHENSIVE FIX for push notification issues
 * 
 * Key improvements:
 * 1. Saves OneSignal Player ID to Firestore (persistent!)
 * 2. Retry mechanism with exponential backoff
 * 3. Verification that link is working
 * 4. Debug logging for troubleshooting
 * 5. Auto-recovery if link is lost
 * 
 * @version 2.0.0
 * @date 2026-01-12
 */

import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// OneSignal App ID
const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7'

// Types
export interface OneSignalLinkStatus {
  isLinked: boolean
  playerId: string | null
  externalId: string | null
  subscribed: boolean
  permission: NotificationPermission | 'unknown'
  lastUpdated: Date | null
  error?: string
}

/**
 * 🔧 Wait for OneSignal SDK to be fully ready
 * Uses polling with timeout instead of fixed delay
 */
export const waitForOneSignal = async (timeout = 10000): Promise<any> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const OneSignal = (window as any).OneSignal
    
    if (OneSignal && OneSignal.User && OneSignal.User.PushSubscription) {
      console.log('✅ OneSignal SDK ready!')
      return OneSignal
    }
    
    // Wait 200ms before checking again
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  throw new Error('OneSignal SDK not ready after timeout')
}

/**
 * 🔗 CRITICAL: Link OneSignal to user and save to Firestore
 * This is the main function that should be called after user login
 */
export const linkOneSignalToUser = async (userId: string): Promise<OneSignalLinkStatus> => {
  console.log('═══════════════════════════════════════════════════')
  console.log('🔔 ONESIGNAL LINK SERVICE v2.0')
  console.log('═══════════════════════════════════════════════════')
  console.log('👤 User ID:', userId)
  
  const status: OneSignalLinkStatus = {
    isLinked: false,
    playerId: null,
    externalId: null,
    subscribed: false,
    permission: 'unknown',
    lastUpdated: null
  }
  
  try {
    // Step 1: Wait for OneSignal to be ready
    console.log('🔄 Step 1: Waiting for OneSignal SDK...')
    const OneSignal = await waitForOneSignal()
    
    // Step 2: Get browser permission status
    status.permission = Notification.permission
    console.log('🔔 Step 2: Browser permission:', status.permission)
    
    // Step 3: Call OneSignal.login() with retry
    console.log('🔔 Step 3: Calling OneSignal.login()...')
    await retryWithBackoff(async () => {
      await OneSignal.login(userId)
    }, 3)
    console.log('✅ OneSignal.login() SUCCESS!')
    
    // Step 4: Get Player ID and subscription status
    console.log('🔔 Step 4: Getting Player ID...')
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for ID to be available
    
    const playerId = await OneSignal.User.PushSubscription.id
    const subscribed = await OneSignal.User.PushSubscription.optedIn
    const externalId = await OneSignal.User.externalId
    
    status.playerId = playerId || null
    status.subscribed = subscribed || false
    status.externalId = externalId || null
    status.lastUpdated = new Date()
    
    console.log('📊 OneSignal Status:')
    console.log('   Player ID:', status.playerId || '❌ MISSING')
    console.log('   External ID:', status.externalId || '❌ MISSING')
    console.log('   Subscribed:', status.subscribed)
    
    // Step 5: CRITICAL - Save to Firestore for persistence!
    if (status.playerId || status.subscribed) {
      console.log('🔔 Step 5: Saving to Firestore...')
      await saveOneSignalDataToFirestore(userId, status)
      status.isLinked = true
      console.log('✅ OneSignal data saved to Firestore!')
    } else {
      console.warn('⚠️ Step 5: No Player ID or subscription - user needs to enable notifications')
      status.error = 'User not subscribed to notifications'
    }
    
    // Step 6: Save to localStorage for quick reference
    localStorage.setItem(`oneSignal_linked_${userId}`, 'true')
    localStorage.setItem(`oneSignal_playerId_${userId}`, status.playerId || '')
    localStorage.setItem(`oneSignal_lastLink_${userId}`, Date.now().toString())
    
    console.log('═══════════════════════════════════════════════════')
    console.log('✅ ONESIGNAL LINK COMPLETE')
    console.log('═══════════════════════════════════════════════════')
    
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════')
    console.error('❌ ONESIGNAL LINK FAILED')
    console.error('Error:', error.message)
    console.error('═══════════════════════════════════════════════════')
    status.error = error.message
  }
  
  return status
}

/**
 * 💾 Save OneSignal data to Firestore user document
 */
export const saveOneSignalDataToFirestore = async (
  userId: string, 
  status: OneSignalLinkStatus
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    
    const updateData: Record<string, any> = {
      // OneSignal identifiers
      oneSignalPlayerId: status.playerId,
      oneSignalExternalId: status.externalId || userId, // Fallback to userId
      oneSignalSubscribed: status.subscribed,
      oneSignalPermission: status.permission,
      oneSignalLastLinked: serverTimestamp(),
      
      // General notification status
      notificationsEnabled: status.subscribed && status.permission === 'granted',
      notificationsLastUpdated: serverTimestamp()
    }
    
    await updateDoc(userRef, updateData)
    console.log('✅ Firestore updated with OneSignal data')
    
  } catch (error) {
    console.error('❌ Failed to save OneSignal data to Firestore:', error)
    throw error
  }
}

/**
 * 🔍 Check current OneSignal link status
 */
export const checkOneSignalStatus = async (userId: string): Promise<OneSignalLinkStatus> => {
  const status: OneSignalLinkStatus = {
    isLinked: false,
    playerId: null,
    externalId: null,
    subscribed: false,
    permission: 'unknown',
    lastUpdated: null
  }
  
  try {
    // Check browser permission
    if ('Notification' in window) {
      status.permission = Notification.permission
    }
    
    // Check OneSignal status
    const OneSignal = (window as any).OneSignal
    if (OneSignal && OneSignal.User) {
      status.playerId = await OneSignal.User.PushSubscription?.id || null
      status.subscribed = await OneSignal.User.PushSubscription?.optedIn || false
      status.externalId = await OneSignal.User.externalId || null
    }
    
    // Check Firestore status
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const data = userDoc.data()
      if (data.oneSignalPlayerId) {
        status.isLinked = true
        status.lastUpdated = data.oneSignalLastLinked?.toDate() || null
      }
    }
    
  } catch (error: any) {
    status.error = error.message
  }
  
  return status
}

/**
 * 🔄 Auto-repair OneSignal link if broken
 * Call this on app startup to ensure notifications work
 */
export const ensureOneSignalLinked = async (userId: string): Promise<boolean> => {
  console.log('🔧 Checking OneSignal link status...')
  
  const status = await checkOneSignalStatus(userId)
  
  // If everything is good, return true
  if (status.isLinked && status.subscribed && status.playerId) {
    console.log('✅ OneSignal link is healthy!')
    return true
  }
  
  // If permission is granted but not subscribed, try to fix
  if (status.permission === 'granted' && !status.subscribed) {
    console.log('🔧 Attempting to repair OneSignal subscription...')
    
    try {
      const OneSignal = await waitForOneSignal()
      await OneSignal.User.PushSubscription.optIn()
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.warn('⚠️ Could not auto-subscribe:', error)
    }
  }
  
  // Try to link again
  console.log('🔧 Re-linking OneSignal to user...')
  const newStatus = await linkOneSignalToUser(userId)
  
  return newStatus.isLinked
}

/**
 * 🔁 Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number = 500
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const delay = baseDelay * Math.pow(2, i)
      console.log(`⚠️ Attempt ${i + 1} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * 📤 Send push notification (from client)
 * This calls the API route which handles the actual sending
 */
export const sendPushNotification = async (
  targetUserId: string,
  title: string,
  message: string,
  type: 'match' | 'message' | 'meeting' | 'like' = 'message',
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📤 Sending push notification...')
    console.log('   Target:', targetUserId)
    console.log('   Title:', title)
    console.log('   Type:', type)
    
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId,
        title,
        message,
        type,
        data
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ Notification failed:', result)
      return { success: false, error: result.error || 'Unknown error' }
    }
    
    console.log('✅ Notification sent! Recipients:', result.recipients)
    return { success: true }
    
  } catch (error: any) {
    console.error('❌ Error sending notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🧪 Debug: Log complete OneSignal state
 */
export const debugOneSignalState = async (userId: string): Promise<void> => {
  console.log('═══════════════════════════════════════════════════')
  console.log('🔍 ONESIGNAL DEBUG STATE')
  console.log('═══════════════════════════════════════════════════')
  
  // Browser state
  console.log('\n📱 BROWSER STATE:')
  console.log('   Notification API:', 'Notification' in window ? '✅' : '❌')
  console.log('   Permission:', Notification?.permission || 'unknown')
  console.log('   Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌')
  
  // OneSignal SDK state
  console.log('\n📦 ONESIGNAL SDK:')
  const OneSignal = (window as any).OneSignal
  console.log('   SDK Loaded:', OneSignal ? '✅' : '❌')
  
  if (OneSignal) {
    try {
      const playerId = await OneSignal.User?.PushSubscription?.id
      const subscribed = await OneSignal.User?.PushSubscription?.optedIn
      const token = await OneSignal.User?.PushSubscription?.token
      const externalId = await OneSignal.User?.externalId
      
      console.log('   Player ID:', playerId || '❌ MISSING')
      console.log('   External ID:', externalId || '❌ MISSING')
      console.log('   Subscribed:', subscribed ? '✅' : '❌')
      console.log('   Push Token:', token ? token.substring(0, 20) + '...' : '❌ MISSING')
    } catch (e) {
      console.log('   Error getting SDK state:', e)
    }
  }
  
  // Firestore state
  console.log('\n💾 FIRESTORE STATE:')
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const data = userDoc.data()
      console.log('   oneSignalPlayerId:', data.oneSignalPlayerId || '❌ MISSING')
      console.log('   oneSignalSubscribed:', data.oneSignalSubscribed ?? '❌ MISSING')
      console.log('   notificationsEnabled:', data.notificationsEnabled ?? '❌ MISSING')
      console.log('   oneSignalLastLinked:', data.oneSignalLastLinked?.toDate() || '❌ NEVER')
    } else {
      console.log('   User document not found!')
    }
  } catch (e) {
    console.log('   Error getting Firestore state:', e)
  }
  
  // localStorage state
  console.log('\n📁 LOCALSTORAGE STATE:')
  console.log('   oneSignal_linked:', localStorage.getItem(`oneSignal_linked_${userId}`))
  console.log('   oneSignal_playerId:', localStorage.getItem(`oneSignal_playerId_${userId}`))
  console.log('   oneSignal_lastLink:', localStorage.getItem(`oneSignal_lastLink_${userId}`))
  
  console.log('\n═══════════════════════════════════════════════════')
}
