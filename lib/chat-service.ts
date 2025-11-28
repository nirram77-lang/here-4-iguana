import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore'
import { db } from './firebase'

export interface Message {
  id: string
  matchId: string
  senderId: string
  text: string
  createdAt: number
  read: boolean
}

/**
 * Send a message in a match
 * ✅ FIXED: Added otherUserId to create notification for recipient
 */
export async function sendMessage(
  matchId: string,
  senderId: string,
  receiverId: string,
  text: string
): Promise<void> {
  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages')
    
    await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: Timestamp.now(),
      read: false
    })

    // Update match lastMessage
    const matchRef = doc(db, 'matches', matchId)
    await updateDoc(matchRef, {
      lastMessage: text,
      lastMessageAt: Timestamp.now()
    })
    
    // ✅ NEW: Create notification for the receiver
    try {
      // Get sender's profile for notification
      const senderDoc = await getDoc(doc(db, 'users', senderId))
      if (senderDoc.exists()) {
        const senderData = senderDoc.data()
        // ✅ FIX: Profile photo FIRST, Google photo as FALLBACK
        const senderName = senderData.name || senderData.displayName || 'Someone'
        const senderPhoto = senderData.photos?.[0] || senderData.photoURL || ''
        
        // Create notification
        const notificationsRef = collection(db, 'users', receiverId, 'notifications')
        await addDoc(notificationsRef, {
          type: 'message',
          title: `💬 New Message from ${senderName}`,
          subtitle: text.length > 50 ? text.substring(0, 50) + '...' : text,
          icon: '💬',
          fromUserId: senderId,
          fromUserName: senderName,
          fromUserPhoto: senderPhoto,
          matchId: matchId,
          chatId: matchId,
          timestamp: Timestamp.now(),
          isRead: false
        })
        
        console.log(`🔔 Message notification sent to ${receiverId}`)
      }
    } catch (notifError) {
      console.error('⚠️ Error creating message notification:', notifError)
      // Don't fail message send if notification fails
    }
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

/**
 * Subscribe to messages in a match (real-time)
 */
export function subscribeToMessages(
  matchId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, 'matches', matchId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: Message[] = []
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        id: doc.id,
        matchId,
        senderId: data.senderId,
        text: data.text,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        read: data.read || false
      })
    })

    callback(messages)
  })

  return unsubscribe
}

/**
 * Get unread message count for a match
 */
export async function getUnreadCount(
  matchId: string,
  userId: string
): Promise<number> {
  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages')
    const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      where('read', '==', false)
    )

    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  matchId: string,
  userId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages')
    const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      where('read', '==', false)
    )

    const snapshot = await getDocs(q)
    
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    )

    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error marking messages as read:', error)
  }
}

/**
 * ✨ NEW: Set typing status for a user in a match
 * @param matchId - The match ID
 * @param userId - The user who is typing
 * @param isTyping - Whether the user is currently typing
 */
export async function setTypingStatus(
  matchId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const typingRef = doc(db, 'matches', matchId, 'typing', userId)
    
    await setDoc(typingRef, {
      isTyping,
      timestamp: Timestamp.now()
    }, { merge: true })
    
    console.log(`💬 Set typing status for ${userId}: ${isTyping}`)
  } catch (error) {
    console.error('❌ Error setting typing status:', error)
  }
}

/**
 * ✨ NEW: Subscribe to typing status of another user (real-time)
 * @param matchId - The match ID
 * @param otherUserId - The other user's ID to watch
 * @param callback - Called when typing status changes
 * @returns Unsubscribe function
 */
export function subscribeToTypingStatus(
  matchId: string,
  otherUserId: string,
  callback: (isTyping: boolean) => void
): () => void {
  const typingRef = doc(db, 'matches', matchId, 'typing', otherUserId)
  
  const unsubscribe = onSnapshot(typingRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      const isTyping = data?.isTyping || false
      
      // ✅ Check timestamp - if older than 5 seconds, consider not typing
      const timestamp = data?.timestamp?.toMillis() || 0
      const now = Date.now()
      const isRecent = (now - timestamp) < 5000 // 5 seconds
      
      callback(isTyping && isRecent)
    } else {
      callback(false)
    }
  })
  
  return unsubscribe
}
