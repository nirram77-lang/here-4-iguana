import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { MATCH_CONFIG, ERROR_MESSAGES } from './constants'

/**
 * 🧹 Clear previous chat history between two users
 * HOLLYWOOD: Every match = Fresh start!
 * This ensures:
 * - Pink button lights up properly
 * - Suggested messages appear
 * - No old baggage
 */
async function clearPreviousChatHistory(user1Id: string, user2Id: string): Promise<void> {
  try {
    // Generate possible chat IDs (could be either direction)
    const possibleChatIds = [
      `${user1Id}_${user2Id}`,
      `${user2Id}_${user1Id}`
    ]
    
    for (const chatId of possibleChatIds) {
      // Delete all messages in this chat
      const messagesRef = collection(db, 'matches', chatId, 'messages')
      const messagesSnap = await getDocs(messagesRef)
      
      if (!messagesSnap.empty) {
        console.log(`🧹 Clearing ${messagesSnap.size} old messages from chat: ${chatId}`)
        
        const batch = writeBatch(db)
        messagesSnap.forEach((docSnap) => {
          batch.delete(docSnap.ref)
        })
        await batch.commit()
      }
      
      // Also delete the chat metadata
      try {
        await deleteDoc(doc(db, 'chats', chatId))
      } catch (e) {
        // Chat doc might not exist, that's fine
      }
    }
    
    console.log('✅ Previous chat history cleared - fresh start!')
    
  } catch (error) {
    console.error('⚠️ Error clearing chat history (non-critical):', error)
    // Don't throw - this is not critical for match creation
  }
}

export interface Match {
  id: string
  user1Id: string
  user2Id: string
  user1Data: any
  user2Data: any
  createdAt: Timestamp
  expiresAt: Date
  status: 'active' | 'met' | 'passed' | 'expired'
  meetingLocation?: {
    lat: number
    lng: number
    name: string
  }
}

export interface ActiveMatch {
  matchId: string
  otherUser: any
  timeRemaining: number
  status: 'active'
}

/**
 * Create a new match between two users
 * FIXED: Consistent use of serverTimestamp
 * 🆕 HOLLYWOOD: Always clears previous chat for fresh start!
 */
export async function createMatch(user1Id: string, user2Id: string, user1Data: any, user2Data: any): Promise<string> {
  try {
    // 🆕 CRITICAL: Clear any previous chat history between these users
    // This ensures: pink button works, suggested messages appear, fresh start!
    await clearPreviousChatHistory(user1Id, user2Id)
    
    const matchRef = doc(collection(db, 'matches'))
    const expiresAt = new Date(Date.now() + MATCH_CONFIG.EXPIRATION_TIME)
    
    // ✅ FIX: Use serverTimestamp consistently
    await setDoc(matchRef, {
      user1Id,
      user2Id,
      user1Data,
      user2Data,
      createdAt: serverTimestamp(),
      expiresAt,
      status: 'active'
    })
    
    // Set active match for both users
    await setDoc(doc(db, 'users', user1Id, 'activeMatch', 'current'), {
      matchId: matchRef.id,
      otherUserId: user2Id,
      createdAt: serverTimestamp()
    })
    
    await setDoc(doc(db, 'users', user2Id, 'activeMatch', 'current'), {
      matchId: matchRef.id,
      otherUserId: user1Id,
      createdAt: serverTimestamp()
    })
    
    console.log('🎉 Match created:', matchRef.id)
    return matchRef.id
    
  } catch (error) {
    console.error('❌ Error creating match:', error)
    throw new Error(ERROR_MESSAGES.MATCH_ERROR)
  }
}

/**
 * Get active match for a user
 */
export async function getActiveMatch(userId: string): Promise<ActiveMatch | null> {
  try {
    const activeMatchRef = doc(db, 'users', userId, 'activeMatch', 'current')
    const activeMatchSnap = await getDoc(activeMatchRef)
    
    if (!activeMatchSnap.exists()) {
      return null
    }
    
    const activeMatchData = activeMatchSnap.data()
    const matchRef = doc(db, 'matches', activeMatchData.matchId)
    const matchSnap = await getDoc(matchRef)
    
    if (!matchSnap.exists()) {
      await deleteDoc(activeMatchRef)
      return null
    }
    
    const matchData = matchSnap.data() as Match
    
    // Handle both Timestamp and Date objects
    const now = new Date()
    const expiresAt = matchData.expiresAt instanceof Date 
      ? matchData.expiresAt 
      : new Date(matchData.expiresAt)
    
    // Check if expired
    if (now > expiresAt || matchData.status !== 'active') {
      await clearActiveMatch(userId)
      return null
    }
    
    const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    
    const otherUserId = matchData.user1Id === userId ? matchData.user2Id : matchData.user1Id
    const otherUserData = matchData.user1Id === userId ? matchData.user2Data : matchData.user1Data
    
    return {
      matchId: activeMatchData.matchId,
      otherUser: otherUserData,
      timeRemaining,
      status: 'active'
    }
    
  } catch (error) {
    console.error('❌ Error getting active match:', error)
    return null
  }
}

/**
 * User chooses to meet
 */
export async function chooseMeet(userId: string, matchId: string, meetingLocation?: { lat: number, lng: number, name: string }): Promise<void> {
  try {
    const matchRef = doc(db, 'matches', matchId)
    
    await updateDoc(matchRef, {
      status: 'met',
      meetingLocation: meetingLocation || null,
      [`${userId}_decision`]: 'meet',
      [`${userId}_decisionTime`]: serverTimestamp()
    })
    
    console.log('✅ User chose to meet')
    
  } catch (error) {
    console.error('❌ Error choosing meet:', error)
    throw new Error(ERROR_MESSAGES.MATCH_ERROR)
  }
}

/**
 * User passes on the match
 */
export async function passMatch(userId: string, matchId: string): Promise<void> {
  try {
    const matchRef = doc(db, 'matches', matchId)
    
    await updateDoc(matchRef, {
      status: 'passed',
      [`${userId}_decision`]: 'pass',
      [`${userId}_decisionTime`]: serverTimestamp()
    })
    
    await clearActiveMatch(userId)
    
    console.log('✅ User passed on match')
    
  } catch (error) {
    console.error('❌ Error passing match:', error)
    throw new Error(ERROR_MESSAGES.MATCH_ERROR)
  }
}

/**
 * Match expires (timeout)
 * ✅ FIXED: Clears activeMatch for BOTH users
 */
export async function expireMatch(userId: string, matchId: string): Promise<void> {
  try {
    const matchRef = doc(db, 'matches', matchId)
    const matchSnap = await getDoc(matchRef)
    
    if (!matchSnap.exists()) {
      console.warn('⚠️ Match not found for expiration')
      return
    }
    
    const matchData = matchSnap.data() as Match
    
    // Update match status to expired
    await updateDoc(matchRef, {
      status: 'expired',
      expiredAt: serverTimestamp()
    })
    
    // ✅ FIX: Clear activeMatch for BOTH users
    await clearActiveMatch(matchData.user1Id)
    await clearActiveMatch(matchData.user2Id)
    
    console.log('⏰ Match expired - both users freed')
    
  } catch (error) {
    console.error('❌ Error expiring match:', error)
    throw new Error(ERROR_MESSAGES.MATCH_ERROR)
  }
}

/**
 * Clear active match for user
 */
export async function clearActiveMatch(userId: string): Promise<void> {
  try {
    const activeMatchRef = doc(db, 'users', userId, 'activeMatch', 'current')
    await deleteDoc(activeMatchRef)
    
    console.log('🧹 Active match cleared')
    
  } catch (error) {
    console.error('❌ Error clearing active match:', error)
  }
}

/**
 * Check if user has an active match
 */
export async function hasActiveMatch(userId: string): Promise<boolean> {
  try {
    const activeMatch = await getActiveMatch(userId)
    return activeMatch !== null
  } catch (error) {
    console.error('❌ Error checking active match:', error)
    return false
  }
}

/**
 * Check if match is about to expire (warning)
 */
export function shouldShowWarning(timeRemaining: number): boolean {
  return timeRemaining <= MATCH_CONFIG.WARNING_TIME && timeRemaining > 0
}

/**
 * Get match history for user
 */
export async function getMatchHistory(userId: string, limitCount: number = 20): Promise<Match[]> {
  try {
    const matchesRef = collection(db, 'matches')
    const q1 = query(
      matchesRef,
      where('user1Id', '==', userId)
    )
    
    const q2 = query(
      matchesRef,
      where('user2Id', '==', userId)
    )
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ])
    
    const matches: Match[] = []
    
    snapshot1.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() } as Match)
    })
    
    snapshot2.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() } as Match)
    })
    
    // Sort by creation time (newest first)
    matches.sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt)
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
    
    return matches.slice(0, limitCount)
    
  } catch (error) {
    console.error('❌ Error getting match history:', error)
    return []
  }
}