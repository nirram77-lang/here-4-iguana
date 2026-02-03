/**
 * 🦎 Super Like Service - I4IGUANA
 * 
 * Handles Super Like functionality:
 * - Sending Super Likes with optional messages
 * - Tracking weekly Super Like limits (3/week free)
 * - Creating chats that lock when users leave the area
 * - Converting to Match when recipient responds
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore"
import { db } from "./firebase"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SuperLike {
  id: string
  senderId: string
  senderName: string
  senderPhoto: string
  senderAge: number
  receiverId: string
  receiverName?: string
  message?: string  // Optional message
  zoneId: string
  zoneName: string
  createdAt: Timestamp
  status: 'pending' | 'accepted' | 'locked' | 'expired'
  chatId?: string  // Created when super like is sent
  lockedAt?: Timestamp  // When chat was locked (user left area)
  lockedReason?: 'sender_left' | 'receiver_left' | 'both_left'
  acceptedAt?: Timestamp  // When receiver responded
  matchId?: string  // Created when accepted
}

export interface SuperLikeStats {
  remaining: number  // 0-3
  total: number  // Always 3 for free users
  resetDate: string  // ISO date string (Sunday)
  isPremium: boolean
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const WEEKLY_SUPER_LIKES = 3
const COLLECTION_NAME = 'superLikes'

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get next Sunday date for reset
 */
function getNextSunday(): string {
  const now = new Date()
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7
  const nextSunday = new Date(now)
  nextSunday.setDate(now.getDate() + daysUntilSunday)
  nextSunday.setHours(0, 0, 0, 0)
  return nextSunday.toISOString().split('T')[0]
}

/**
 * Check if reset date has passed
 */
function shouldResetSuperLikes(resetDate: string | undefined): boolean {
  if (!resetDate) return true
  const now = new Date()
  const reset = new Date(resetDate)
  return now >= reset
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get user's Super Like stats
 */
export async function getSuperLikeStats(userId: string): Promise<SuperLikeStats> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return {
        remaining: WEEKLY_SUPER_LIKES,
        total: WEEKLY_SUPER_LIKES,
        resetDate: getNextSunday(),
        isPremium: false
      }
    }
    
    const userData = userDoc.data()
    const isPremium = userData.isPremium || userData.subscriptionStatus === 'active'
    
    // Premium users have unlimited
    if (isPremium) {
      return {
        remaining: 999,
        total: 999,
        resetDate: '',
        isPremium: true
      }
    }
    
    // Check if reset is needed
    if (shouldResetSuperLikes(userData.superLikesResetDate)) {
      // Reset the counter
      const newResetDate = getNextSunday()
      await updateDoc(doc(db, 'users', userId), {
        superLikesRemaining: WEEKLY_SUPER_LIKES,
        superLikesResetDate: newResetDate
      })
      
      return {
        remaining: WEEKLY_SUPER_LIKES,
        total: WEEKLY_SUPER_LIKES,
        resetDate: newResetDate,
        isPremium: false
      }
    }
    
    return {
      remaining: userData.superLikesRemaining ?? WEEKLY_SUPER_LIKES,
      total: WEEKLY_SUPER_LIKES,
      resetDate: userData.superLikesResetDate || getNextSunday(),
      isPremium: false
    }
  } catch (error) {
    console.error('❌ Error getting Super Like stats:', error)
    return {
      remaining: 0,
      total: WEEKLY_SUPER_LIKES,
      resetDate: getNextSunday(),
      isPremium: false
    }
  }
}

/**
 * Send a Super Like
 */
export async function sendSuperLike(
  senderId: string,
  senderData: {
    name: string
    photo: string
    age: number
  },
  receiverId: string,
  receiverName: string,
  zoneId: string,
  zoneName: string,
  message?: string
): Promise<{ success: boolean; error?: string; superLikeId?: string; chatId?: string }> {
  try {
    console.log('🦎 Sending Super Like...')
    console.log(`   From: ${senderId.slice(0, 8)}... (${senderData.name})`)
    console.log(`   To: ${receiverId.slice(0, 8)}... (${receiverName})`)
    console.log(`   Zone: ${zoneName}`)
    
    // 1. Check if user has Super Likes remaining
    const stats = await getSuperLikeStats(senderId)
    if (stats.remaining <= 0 && !stats.isPremium) {
      console.log('❌ No Super Likes remaining!')
      return { success: false, error: 'no_super_likes' }
    }
    
    // 2. Check if already sent Super Like to this user
    const existingQuery = query(
      collection(db, COLLECTION_NAME),
      where('senderId', '==', senderId),
      where('receiverId', '==', receiverId),
      where('status', '==', 'pending')
    )
    const existingDocs = await getDocs(existingQuery)
    
    if (!existingDocs.empty) {
      console.log('❌ Already sent Super Like to this user!')
      return { success: false, error: 'already_sent' }
    }
    
    // 3. Create chat ID for this Super Like
    const chatId = `superlike_${senderId}_${receiverId}_${Date.now()}`
    
    // 4. Create the Super Like document
    const superLikeData: Omit<SuperLike, 'id'> = {
      senderId,
      senderName: senderData.name,
      senderPhoto: senderData.photo,
      senderAge: senderData.age,
      receiverId,
      receiverName,
      message: message || undefined,
      zoneId,
      zoneName,
      createdAt: Timestamp.now(),
      status: 'pending',
      chatId
    }
    
    const superLikeRef = await addDoc(collection(db, COLLECTION_NAME), superLikeData)
    console.log(`✅ Super Like created: ${superLikeRef.id}`)
    
    // 5. Create the chat document (one-sided initially)
    const chatData = {
      participants: [senderId, receiverId],
      type: 'super_like',
      superLikeId: superLikeRef.id,
      initiatedBy: senderId,
      zoneId,
      zoneName,
      createdAt: Timestamp.now(),
      lastMessage: message || '🦎 Super Like!',
      lastMessageAt: Timestamp.now(),
      status: 'pending',  // pending until receiver responds
      // Initial message
      messages: message ? [{
        id: `msg_${Date.now()}`,
        senderId,
        text: message,
        timestamp: Timestamp.now(),
        type: 'super_like_message'
      }] : []
    }
    
    await setDoc(doc(db, 'chats', chatId), chatData)
    console.log(`✅ Chat created: ${chatId}`)
    
    // 6. Decrement Super Likes counter (if not premium)
    if (!stats.isPremium) {
      await updateDoc(doc(db, 'users', senderId), {
        superLikesRemaining: stats.remaining - 1
      })
      console.log(`📊 Super Likes remaining: ${stats.remaining - 1}`)
    }
    
    // 7. Send notification to receiver
    try {
      const notificationData = {
        userId: receiverId,
        type: 'super_like',
        title: `🦎 ${senderData.name} שלח/ה לך Super Like!`,
        body: message || `${senderData.name} רוצה להכיר אותך`,
        data: {
          superLikeId: superLikeRef.id,
          chatId,
          senderId,
          senderName: senderData.name,
          senderPhoto: senderData.photo
        },
        isRead: false,
        createdAt: Timestamp.now()
      }
      
      await addDoc(collection(db, 'notifications'), notificationData)
      console.log('✅ Notification sent to receiver')
    } catch (notifError) {
      console.error('⚠️ Could not send notification:', notifError)
      // Don't fail the whole operation
    }
    
    console.log('🦎💚 Super Like sent successfully!')
    return { 
      success: true, 
      superLikeId: superLikeRef.id,
      chatId 
    }
    
  } catch (error) {
    console.error('❌ Error sending Super Like:', error)
    return { success: false, error: 'unknown_error' }
  }
}

/**
 * Accept a Super Like - creates a Match!
 */
export async function acceptSuperLike(
  superLikeId: string,
  receiverId: string
): Promise<{ success: boolean; matchId?: string; error?: string }> {
  try {
    console.log('✅ Accepting Super Like:', superLikeId)
    
    // 1. Get the Super Like
    const superLikeRef = doc(db, COLLECTION_NAME, superLikeId)
    const superLikeDoc = await getDoc(superLikeRef)
    
    if (!superLikeDoc.exists()) {
      return { success: false, error: 'not_found' }
    }
    
    const superLike = superLikeDoc.data() as SuperLike
    
    // 2. Verify receiver
    if (superLike.receiverId !== receiverId) {
      return { success: false, error: 'unauthorized' }
    }
    
    // 3. Check if already processed
    if (superLike.status !== 'pending') {
      return { success: false, error: 'already_processed' }
    }
    
    // 4. Create Match ID
    const matchId = [superLike.senderId, receiverId].sort().join('_')
    
    // 5. Update Super Like status
    await updateDoc(superLikeRef, {
      status: 'accepted',
      acceptedAt: Timestamp.now(),
      matchId
    })
    
    // 6. Create Match document
    const matchData = {
      users: [superLike.senderId, receiverId],
      timestamp: Timestamp.now(),
      chatId: superLike.chatId || matchId,
      type: 'super_like',  // Mark as originated from Super Like
      superLikeId,
      status: 'active',
      chatEndedBy: [],
      chatEndedAt: null
    }
    
    await setDoc(doc(db, 'matches', matchId), matchData)
    console.log(`🎉 Match created: ${matchId}`)
    
    // 7. Update chat status
    if (superLike.chatId) {
      await updateDoc(doc(db, 'chats', superLike.chatId), {
        status: 'active',
        matchId,
        matchedAt: Timestamp.now()
      })
    }
    
    // 8. Add to both users' matches arrays
    await updateDoc(doc(db, 'users', superLike.senderId), {
      matches: arrayUnion(receiverId)
    })
    await updateDoc(doc(db, 'users', receiverId), {
      matches: arrayUnion(superLike.senderId)
    })
    
    // 9. Send Match notification to sender
    try {
      const receiverDoc = await getDoc(doc(db, 'users', receiverId))
      const receiverData = receiverDoc.data()
      
      await addDoc(collection(db, 'notifications'), {
        userId: superLike.senderId,
        type: 'match',
        title: `🎉 Match עם ${receiverData?.name || receiverData?.displayName}!`,
        body: 'ענו ל-Super Like שלך! התחילו לדבר',
        data: {
          matchId,
          chatId: superLike.chatId,
          matchedUserId: receiverId
        },
        isRead: false,
        createdAt: Timestamp.now()
      })
    } catch (e) {
      console.error('⚠️ Could not send match notification:', e)
    }
    
    console.log('🎉💚 Super Like accepted - Match created!')
    return { success: true, matchId }
    
  } catch (error) {
    console.error('❌ Error accepting Super Like:', error)
    return { success: false, error: 'unknown_error' }
  }
}

/**
 * Lock a Super Like chat (when user leaves area)
 */
export async function lockSuperLikeChat(
  superLikeId: string,
  reason: 'sender_left' | 'receiver_left' | 'both_left'
): Promise<boolean> {
  try {
    console.log(`🔒 Locking Super Like chat: ${superLikeId}, reason: ${reason}`)
    
    const superLikeRef = doc(db, COLLECTION_NAME, superLikeId)
    const superLikeDoc = await getDoc(superLikeRef)
    
    if (!superLikeDoc.exists()) {
      return false
    }
    
    const superLike = superLikeDoc.data() as SuperLike
    
    // Only lock if still pending
    if (superLike.status !== 'pending') {
      return false
    }
    
    // Update Super Like
    await updateDoc(superLikeRef, {
      status: 'locked',
      lockedAt: Timestamp.now(),
      lockedReason: reason
    })
    
    // Update chat
    if (superLike.chatId) {
      await updateDoc(doc(db, 'chats', superLike.chatId), {
        status: 'locked',
        lockedAt: Timestamp.now(),
        lockedReason: reason
      })
    }
    
    console.log('🔒 Super Like chat locked')
    return true
    
  } catch (error) {
    console.error('❌ Error locking Super Like chat:', error)
    return false
  }
}

/**
 * Get pending Super Likes for a user (received)
 */
export async function getPendingSuperLikes(userId: string): Promise<SuperLike[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('receiverId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SuperLike[]
    
  } catch (error) {
    console.error('❌ Error getting pending Super Likes:', error)
    return []
  }
}

/**
 * Subscribe to pending Super Likes (real-time)
 */
export function subscribeToPendingSuperLikes(
  userId: string,
  callback: (superLikes: SuperLike[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('receiverId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const superLikes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SuperLike[]
    
    callback(superLikes)
  }, (error) => {
    console.error('❌ Error in Super Likes subscription:', error)
    callback([])
  })
}

/**
 * Get count of pending Super Likes
 */
export async function getPendingSuperLikesCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('receiverId', '==', userId),
      where('status', '==', 'pending')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.size
    
  } catch (error) {
    console.error('❌ Error getting Super Likes count:', error)
    return 0
  }
}
