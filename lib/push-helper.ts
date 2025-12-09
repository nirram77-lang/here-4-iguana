/**
 * 🦎 I4IGUANA - Push Notification Helper
 * 
 * Client-side helper to send push notifications via API route
 */

interface SendPushParams {
  type: 'match' | 'message' | 'meeting' | 'like'
  targetUserId: string
  title: string
  message: string
  data?: {
    matchId?: string
    chatId?: string
    fromUserId?: string
    fromUserName?: string
    fromUserPhoto?: string
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(params: SendPushParams): Promise<boolean> {
  try {
    console.log('📤 Sending push to:', params.targetUserId)
    
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Push notification failed:', error)
      return false
    }
    
    const result = await response.json()
    console.log('✅ Push notification sent:', result)
    return true
    
  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    return false
  }
}

/**
 * Send match notification
 */
export async function sendMatchNotification(
  targetUserId: string,
  fromUserName: string,
  fromUserPhoto: string,
  matchId: string,
  fromUserId: string
): Promise<boolean> {
  return sendPushNotification({
    type: 'match',
    targetUserId,
    title: '🦎 It\'s a Match!',
    message: `You and ${fromUserName} liked each other! Start chatting now! 💚`,
    data: {
      matchId,
      fromUserId,
      fromUserName,
      fromUserPhoto
    }
  })
}

/**
 * Send message notification
 */
export async function sendMessageNotification(
  targetUserId: string,
  fromUserName: string,
  fromUserPhoto: string,
  messagePreview: string,
  chatId: string,
  fromUserId: string
): Promise<boolean> {
  return sendPushNotification({
    type: 'message',
    targetUserId,
    title: `💬 ${fromUserName}`,
    message: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
    data: {
      chatId,
      fromUserId,
      fromUserName,
      fromUserPhoto
    }
  })
}

/**
 * Send "We're Meeting" notification
 */
export async function sendMeetingNotification(
  targetUserId: string,
  fromUserName: string,
  fromUserPhoto: string,
  matchId: string,
  fromUserId: string
): Promise<boolean> {
  return sendPushNotification({
    type: 'meeting',
    targetUserId,
    title: '🎉 We\'re Meeting!',
    message: `${fromUserName} confirmed you're meeting! Have a great time! 💕`,
    data: {
      matchId,
      fromUserId,
      fromUserName,
      fromUserPhoto
    }
  })
}

/**
 * Send like notification (when someone likes you)
 */
export async function sendLikeNotification(
  targetUserId: string,
  fromUserName: string,
  fromUserPhoto: string,
  fromUserId: string
): Promise<boolean> {
  return sendPushNotification({
    type: 'like',
    targetUserId,
    title: '💚 Someone Likes You!',
    message: `${fromUserName} is interested in you! Check them out 👀`,
    data: {
      fromUserId,
      fromUserName,
      fromUserPhoto
    }
  })
}
