import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp,
  setDoc,
  getDoc,
  getDocs,
  Unsubscribe,
  where,
  limit,
  writeBatch
} from 'firebase/firestore'
import { db, storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export interface ChatMessage {
  id: string
  matchId: string
  senderId: string
  recipientId: string
  text: string
  timestamp: Timestamp
  status: 'sent' | 'delivered' | 'read'
  createdAt: Timestamp
  likedBy?: string[]  // Array of user IDs who liked this message
  // ✅ NEW: Image support
  imageUrl?: string        // URL to the image in Firebase Storage
  imageType?: 'normal' | 'view-once'  // Normal image or disappears after viewing
  imageViewed?: boolean    // Has the view-once image been viewed?
  imageViewedAt?: Timestamp // When was it viewed?
}

export interface ChatMetadata {
  matchId: string
  lastMessage: string
  lastMessageTime: Timestamp
  unreadCount: {
    [userId: string]: number
  }
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  recipientId: string,
  text: string,
  senderName?: string,
  senderPhoto?: string
): Promise<string> {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    
    // ✅ FIXED: Include senderName and senderPhoto in message for Cloud Functions
    const messageData = {
      matchId,
      senderId,
      recipientId,
      text,
      senderName: senderName || 'Someone',
      senderPhoto: senderPhoto || '',
      timestamp: serverTimestamp(),
      status: 'sent',
      createdAt: serverTimestamp()
    }
    
    console.log('📤 Sending message with:', { senderName, senderPhoto: senderPhoto ? '✅' : '❌' })
    
    const docRef = await addDoc(messagesRef, messageData)
    
    await updateChatMetadata(matchId, text, recipientId, senderId)
    
    // ✅ Send in-app notification (stored in Firestore)
    await sendInAppNotification(
      recipientId, 
      senderId, 
      matchId, 
      text, 
      senderName || 'Someone',
      senderPhoto
    )
    
    // ✅ CRITICAL: Send REAL push notification via OneSignal API!
    await sendRealPushNotification(
      recipientId,
      senderName || 'Someone',
      senderPhoto || '',
      text,
      matchId,
      senderId
    )
    
    console.log('✅ Message sent:', docRef.id)
    return docRef.id
    
  } catch (error) {
    console.error('❌ Error sending message:', error)
    throw new Error('Failed to send message')
  }
}

// ✅ Send REAL push notification via OneSignal API
async function sendRealPushNotification(
  recipientId: string,
  senderName: string,
  senderPhoto: string,
  messageText: string,
  chatId: string,
  senderId: string
): Promise<void> {
  try {
    console.log('📤 Sending REAL push notification to:', recipientId)
    
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'message',
        targetUserId: recipientId,
        title: `💬 ${senderName}`,
        message: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
        data: {
          chatId,
          fromUserId: senderId,
          fromUserName: senderName,
          fromUserPhoto: senderPhoto
        }
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Push notification sent successfully:', result)
    } else {
      const error = await response.json()
      console.error('❌ Push notification failed:', error)
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    // Don't throw - push failure shouldn't break the message
  }
}

// ✅ Send in-app notification (stored in Firestore for app UI)
async function sendInAppNotification(
  recipientId: string,
  senderId: string,
  matchId: string,
  messageText: string,
  senderName: string,
  senderPhoto?: string
): Promise<void> {
  try {
    // Add to notifications collection (where the app listens!)
    await addDoc(collection(db, 'notifications'), {
      userId: recipientId,
      type: 'message',
      title: `💬 ${senderName}`,
      subtitle: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
      message: messageText,
      body: messageText,
      // ✅ FIXED: Store both field names for compatibility
      fromUserId: senderId,
      fromUserName: senderName,
      fromUserPhoto: senderPhoto || '',
      senderId: senderId,
      senderName: senderName,
      senderPhoto: senderPhoto || '',
      chatId: matchId,
      matchId: matchId,
      timestamp: serverTimestamp(),
      isRead: false
    })
    
    console.log('🔔 In-app notification sent to:', recipientId)
  } catch (error) {
    console.error('❌ Error sending in-app notification:', error)
    // Don't throw - notification failure shouldn't break the message
  }
}

async function updateChatMetadata(
  matchId: string,
  lastMessage: string,
  recipientId: string,
  senderId?: string
): Promise<void> {
  try {
    const chatMetaRef = doc(db, 'chats', matchId)
    const chatMetaSnap = await getDoc(chatMetaRef)
    
    let unreadCount: { [key: string]: number } = {}
    
    if (chatMetaSnap.exists()) {
      const existingData = chatMetaSnap.data()
      unreadCount = existingData.unreadCount || {}
    }
    
    unreadCount[recipientId] = (unreadCount[recipientId] || 0) + 1
    
    // ✅ CRITICAL FIX: Include participants for proper deletion on account delete!
    const participants = senderId ? [senderId, recipientId].sort() : [recipientId]
    
    await setDoc(chatMetaRef, {
      lastMessage: lastMessage.substring(0, 100),
      lastMessageTime: serverTimestamp(),
      unreadCount,
      participants  // ✅ NEW: Required for delete-account-service to find chats!
    }, { merge: true })
    
  } catch (error) {
    console.error('❌ Error updating chat metadata:', error)
  }
}

export function listenToChatMessages(
  matchId: string,
  onMessagesUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    const q = query(messagesRef, orderBy('timestamp', 'asc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = []
      
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as ChatMessage)
      })
      
      console.log(`💬 Loaded ${messages.length} messages`)
      onMessagesUpdate(messages)
    }, (error) => {
      console.error('❌ Error listening to messages:', error)
    })
    
    return unsubscribe
    
  } catch (error) {
    console.error('❌ Error setting up message listener:', error)
    return () => {}
  }
}

export async function markMessagesAsDelivered(
  matchId: string,
  userId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    const q = query(messagesRef)
    const snapshot = await getDocs(q)
    
    const updates: Promise<void>[] = []
    
    snapshot.forEach((docSnap) => {
      const message = docSnap.data() as ChatMessage
      
      if (message.recipientId === userId && message.status === 'sent') {
        updates.push(
          updateDoc(doc(db, 'chats', matchId, 'messages', docSnap.id), {
            status: 'delivered'
          })
        )
      }
    })
    
    await Promise.all(updates)
    console.log(`✅ Marked ${updates.length} messages as delivered`)
    
  } catch (error) {
    console.error('❌ Error marking messages as delivered:', error)
  }
}

export async function markMessagesAsRead(
  matchId: string,
  userId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    const q = query(messagesRef)
    const snapshot = await getDocs(q)
    
    const updates: Promise<void>[] = []
    
    snapshot.forEach((docSnap) => {
      const message = docSnap.data() as ChatMessage
      
      if (message.recipientId === userId && message.status !== 'read') {
        updates.push(
          updateDoc(doc(db, 'chats', matchId, 'messages', docSnap.id), {
            status: 'read'
          })
        )
      }
    })
    
    await Promise.all(updates)
    
    const chatMetaRef = doc(db, 'chats', matchId)
    await updateDoc(chatMetaRef, {
      [`unreadCount.${userId}`]: 0
    })
    
    console.log(`✅ Marked ${updates.length} messages as read`)
    
  } catch (error) {
    console.error('❌ Error marking messages as read:', error)
  }
}

export async function getChatHistory(matchId: string): Promise<ChatMessage[]> {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    const q = query(messagesRef, orderBy('timestamp', 'asc'))
    const snapshot = await getDocs(q)
    
    const messages: ChatMessage[] = []
    
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)
    })
    
    console.log(`📜 Loaded ${messages.length} messages from history`)
    return messages
    
  } catch (error) {
    console.error('❌ Error getting chat history:', error)
    return []
  }
}

export async function deleteMessage(matchId: string, messageId: string): Promise<void> {
  try {
    const messageRef = doc(db, 'chats', matchId, 'messages', messageId)
    await updateDoc(messageRef, {
      text: '🚫 Message deleted',
      deleted: true
    })
    
    console.log('✅ Message deleted')
    
  } catch (error) {
    console.error('❌ Error deleting message:', error)
    throw new Error('Failed to delete message')
  }
}

export async function chatHasMessages(matchId: string): Promise<boolean> {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    const snapshot = await getDocs(messagesRef)
    
    return snapshot.size > 0
    
  } catch (error) {
    console.error('❌ Error checking chat messages:', error)
    return false
  }
}

/**
 * ✅ NEW: Clear all messages from a chat (for new match)
 * Deletes all messages in the messages subcollection
 */
export async function clearChatMessages(matchId: string): Promise<void> {
  try {
    console.log(`🧹 Clearing chat messages for: ${matchId}`)
    
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    const snapshot = await getDocs(messagesRef)
    
    if (snapshot.empty) {
      console.log('ℹ️ No messages to clear')
      return
    }
    
    // Delete all messages in batch
    const batch = writeBatch(db)
    snapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    
    // Also reset chat metadata
    const chatRef = doc(db, 'chats', matchId)
    await updateDoc(chatRef, {
      lastMessage: null,
      lastMessageTime: null,
      lastMessageSenderId: null,
      messageCount: 0
    }).catch(() => {
      // If chat doc doesn't exist, that's fine
      console.log('ℹ️ Chat metadata doc does not exist')
    })
    
    console.log(`✅ Cleared ${snapshot.size} messages from chat`)
    
  } catch (error) {
    console.error('❌ Error clearing chat messages:', error)
    throw error
  }
}

/**
 * ✅ NEW: Check if current user has sent at least one message to this chat
 * Used to determine "Start Chatting" vs "Continue Chatting" button text
 */
export async function userHasSentMessage(matchId: string, userId: string): Promise<boolean> {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    const q = query(
      messagesRef,
      where('senderId', '==', userId),
      limit(1)  // We only need to know if at least one exists
    )
    
    const snapshot = await getDocs(q)
    const hasSent = snapshot.size > 0
    
    console.log(`📨 User ${userId} has sent message to ${matchId}: ${hasSent}`)
    return hasSent
    
  } catch (error) {
    console.error('❌ Error checking user messages:', error)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📸 IMAGE MESSAGING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Upload image to Firebase Storage and return the download URL
 */
export async function uploadChatImage(
  matchId: string,
  senderId: string,
  imageFile: File | Blob
): Promise<string> {
  console.log('📤 uploadChatImage called')
  console.log('   matchId:', matchId)
  console.log('   senderId:', senderId)
  console.log('   imageFile type:', imageFile instanceof File ? 'File' : 'Blob')
  console.log('   imageFile size:', imageFile.size, 'bytes')
  
  if (!matchId || !senderId) {
    throw new Error('Missing matchId or senderId')
  }
  
  if (!imageFile || imageFile.size === 0) {
    throw new Error('Invalid image file')
  }
  
  try {
    // Create unique filename
    const timestamp = Date.now()
    const extension = imageFile instanceof File ? (imageFile.name.split('.').pop() || 'jpg') : 'jpg'
    const filename = `chat-images/${matchId}/${senderId}_${timestamp}.${extension}`
    
    console.log('📤 Uploading to path:', filename)
    
    const storageRef = ref(storage, filename)
    
    console.log('📤 Starting uploadBytes...')
    const uploadResult = await uploadBytes(storageRef, imageFile)
    console.log('✅ uploadBytes complete, getting download URL...')
    
    const downloadUrl = await getDownloadURL(uploadResult.ref)
    console.log('✅ Image uploaded successfully!')
    console.log('   Download URL:', downloadUrl.substring(0, 80) + '...')
    
    return downloadUrl
    
  } catch (error) {
    console.error('❌ Error uploading image:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('unauthorized') || error.message.includes('permission')) {
        throw new Error('storage/permission-denied: No permission to upload images')
      }
      if (error.message.includes('quota')) {
        throw new Error('storage/quota-exceeded: Storage quota exceeded')
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('storage/network-error: Network error during upload')
      }
      throw new Error(`storage/upload-failed: ${error.message}`)
    }
    
    throw new Error('storage/unknown-error: Failed to upload image')
  }
}

/**
 * Send an image message (normal or view-once)
 */
export async function sendImageMessage(
  matchId: string,
  senderId: string,
  recipientId: string,
  imageUrl: string,
  imageType: 'normal' | 'view-once' = 'normal',
  senderName?: string,
  senderPhoto?: string
): Promise<string> {
  try {
    const messagesRef = collection(db, 'chats', matchId, 'messages')
    
    const messageData = {
      matchId,
      senderId,
      recipientId,
      text: imageType === 'view-once' ? '📷 תמונה חד-פעמית' : '📷 תמונה',
      senderName: senderName || 'Someone',
      senderPhoto: senderPhoto || '',
      timestamp: serverTimestamp(),
      status: 'sent',
      createdAt: serverTimestamp(),
      // Image specific fields
      imageUrl,
      imageType,
      imageViewed: false,
    }
    
    console.log(`📤 Sending ${imageType} image message`)
    
    const docRef = await addDoc(messagesRef, messageData)
    
    // Update chat metadata
    await updateChatMetadata(
      matchId, 
      imageType === 'view-once' ? '📷 תמונה חד-פעמית' : '📷 תמונה', 
      recipientId, 
      senderId
    )
    
    console.log('✅ Image message sent:', docRef.id)
    return docRef.id
    
  } catch (error) {
    console.error('❌ Error sending image message:', error)
    throw new Error('Failed to send image message')
  }
}

/**
 * Mark a view-once image as viewed
 * After this, the image cannot be viewed again
 */
export async function markImageAsViewed(
  matchId: string,
  messageId: string
): Promise<void> {
  try {
    const messageRef = doc(db, 'chats', matchId, 'messages', messageId)
    
    await updateDoc(messageRef, {
      imageViewed: true,
      imageViewedAt: serverTimestamp()
    })
    
    console.log('👁️ Image marked as viewed:', messageId)
    
  } catch (error) {
    console.error('❌ Error marking image as viewed:', error)
  }
}

/**
 * Delete a view-once image from storage after it's been viewed
 * Called after the image viewing modal is closed
 */
export async function deleteViewOnceImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const storageRef = ref(storage, imageUrl)
    await deleteObject(storageRef)
    console.log('🗑️ View-once image deleted from storage')
  } catch (error) {
    // Image might already be deleted or URL format different
    console.warn('⚠️ Could not delete view-once image:', error)
  }
}