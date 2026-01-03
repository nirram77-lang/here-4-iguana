/**
 * 🦎 I4IGUANA - Push Notification Sender
 * 
 * This module sends push notifications to users.
 * 
 * ⚠️ IMPORTANT: This should run on a secure server (Cloud Functions)
 * because it requires Firebase Admin SDK with service account credentials.
 * 
 * For production, deploy this as a Firebase Cloud Function.
 */

import { Timestamp, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Types for notification payloads
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    type: 'match' | 'message' | 'meeting' | 'venue_announcement' | 'like';
    matchId?: string;
    chatId?: string;
    venueId?: string;
    fromUserId?: string;
    fromUserName?: string;
    [key: string]: any;
  };
}

/**
 * ✅ Get user's FCM tokens
 */
export const getUserFCMTokens = async (userId: string): Promise<string[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log(`⚠️ User ${userId} not found`);
      return [];
    }
    
    const userData = userDoc.data();
    const tokens = userData.fcmTokens || [];
    
    console.log(`📱 Found ${tokens.length} FCM tokens for user ${userId}`);
    return tokens;
  } catch (error) {
    console.error('❌ Error getting FCM tokens:', error);
    return [];
  }
};

/**
 * ✅ Create notification payload for match
 * ✅ v2.8.26: Added language support for Hebrew
 */
export const createMatchNotification = (
  matchedUserName: string,
  matchedUserPhoto: string,
  matchId: string,
  fromUserId: string,
  language: 'en' | 'he' = 'en'
): PushNotificationPayload => ({
  title: language === 'he' ? '🦎 יש לך Match!' : '🦎 It\'s a Match!',
  body: language === 'he' 
    ? `לך ול${matchedUserName} יש חיבור! התחילו לדבר עכשיו! 💚`
    : `You and ${matchedUserName} liked each other! Start chatting now! 💚`,
  icon: '/notification-icon-192.png',
  badge: '/notification-badge-72.png',
  tag: `match-${matchId}`,
  data: {
    type: 'match',
    matchId,
    fromUserId,
    fromUserName: matchedUserName,
    fromUserPhoto: matchedUserPhoto
  }
});

/**
 * ✅ Create notification payload for message
 * ✅ v2.8.26: Added language support for Hebrew
 */
export const createMessageNotification = (
  senderName: string,
  senderPhoto: string,
  messagePreview: string,
  chatId: string,
  fromUserId: string,
  language: 'en' | 'he' = 'en'
): PushNotificationPayload => ({
  title: `💬 ${senderName}`,
  body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
  icon: '/notification-icon-192.png',
  badge: '/notification-badge-72.png',
  tag: `message-${chatId}`,
  data: {
    type: 'message',
    chatId,
    fromUserId,
    fromUserName: senderName,
    fromUserPhoto: senderPhoto
  }
});

/**
 * ✅ Create notification payload for "We're Meeting!"
 * ✅ v2.8.26: Added language support for Hebrew
 */
export const createMeetingNotification = (
  partnerName: string,
  partnerPhoto: string,
  matchId: string,
  fromUserId: string,
  language: 'en' | 'he' = 'en'
): PushNotificationPayload => ({
  title: language === 'he' ? '🎉 אנחנו נפגשים!' : '🎉 We\'re Meeting!',
  body: language === 'he'
    ? `${partnerName} אישר/ה שאתם נפגשים! בהצלחה! 💕`
    : `${partnerName} confirmed you're meeting! Have a great time! 💕`,
  icon: '/notification-icon-192.png',
  badge: '/notification-badge-72.png',
  tag: `meeting-${matchId}`,
  data: {
    type: 'meeting',
    matchId,
    fromUserId,
    fromUserName: partnerName,
    fromUserPhoto: partnerPhoto
  }
});

/**
 * ✅ Create notification payload for venue announcement
 */
export const createVenueNotification = (
  venueName: string,
  message: string,
  venueId: string
): PushNotificationPayload => ({
  title: `📢 ${venueName}`,
  body: message,
  icon: '/notification-icon-192.png',
  badge: '/notification-badge-72.png',
  tag: `venue-${venueId}-${Date.now()}`,
  data: {
    type: 'venue_announcement',
    venueId,
    venueName
  }
});

/**
 * ✅ Queue notification for sending via Firestore
 * 
 * This creates a document in 'notificationQueue' collection
 * which can be processed by Cloud Functions
 */
export const queuePushNotification = async (
  recipientUserId: string,
  payload: PushNotificationPayload
): Promise<string | null> => {
  try {
    const { addDoc } = await import('firebase/firestore');
    
    const queueDoc = await addDoc(collection(db, 'notificationQueue'), {
      recipientUserId,
      payload,
      status: 'pending',
      createdAt: Timestamp.now(),
      attempts: 0
    });
    
    console.log(`📤 Notification queued: ${queueDoc.id}`);
    return queueDoc.id;
  } catch (error) {
    console.error('❌ Error queuing notification:', error);
    return null;
  }
};

/**
 * ✅ Queue match notification
 * ✅ v2.8.26: Added language support
 */
export const sendMatchPushNotification = async (
  recipientUserId: string,
  matchedUserName: string,
  matchedUserPhoto: string,
  matchId: string,
  fromUserId: string,
  language: 'en' | 'he' = 'en'
): Promise<void> => {
  const payload = createMatchNotification(matchedUserName, matchedUserPhoto, matchId, fromUserId, language);
  await queuePushNotification(recipientUserId, payload);
};

/**
 * ✅ Queue message notification
 * ✅ v2.8.26: Added language support
 */
export const sendMessagePushNotification = async (
  recipientUserId: string,
  senderName: string,
  senderPhoto: string,
  messagePreview: string,
  chatId: string,
  fromUserId: string,
  language: 'en' | 'he' = 'en'
): Promise<void> => {
  const payload = createMessageNotification(senderName, senderPhoto, messagePreview, chatId, fromUserId, language);
  await queuePushNotification(recipientUserId, payload);
};

/**
 * ✅ Queue meeting notification
 * ✅ v2.8.26: Added language support
 */
export const sendMeetingPushNotification = async (
  recipientUserId: string,
  partnerName: string,
  partnerPhoto: string,
  matchId: string,
  fromUserId: string,
  language: 'en' | 'he' = 'en'
): Promise<void> => {
  const payload = createMeetingNotification(partnerName, partnerPhoto, matchId, fromUserId, language);
  await queuePushNotification(recipientUserId, payload);
};

/**
 * ✅ Queue venue announcement notification to multiple users
 */
export const sendVenueAnnouncementPush = async (
  recipientUserIds: string[],
  venueName: string,
  message: string,
  venueId: string
): Promise<void> => {
  const payload = createVenueNotification(venueName, message, venueId);
  
  const promises = recipientUserIds.map(userId => 
    queuePushNotification(userId, payload)
  );
  
  await Promise.all(promises);
  console.log(`📢 Venue announcement queued for ${recipientUserIds.length} users`);
};
