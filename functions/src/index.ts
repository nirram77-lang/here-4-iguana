/**
 * 🦎 I4IGUANA - Cloud Functions for Push Notifications
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// 💚 MATCH NOTIFICATIONS
export const onNewMatch = functions.firestore
  .document('activeMatches/{matchId}')
  .onCreate(async (snapshot, context) => {
    const matchData = snapshot.data();
    const matchId = context.params.matchId;

    console.log(`💚 New match created: ${matchId}`);

    try {
      const initiatorId = matchData.initiatedBy;
      const recipientId = matchData.recipientId;

      const initiatorDoc = await db.collection('users').doc(initiatorId).get();
      const initiatorData = initiatorDoc.data();
      const initiatorName = initiatorData?.name || initiatorData?.displayName || 'Someone';
      const initiatorPhoto = initiatorData?.photos?.[0] || initiatorData?.photoURL || '';

      const recipientDoc = await db.collection('users').doc(recipientId).get();
      const recipientData = recipientDoc.data();
      const fcmTokens = recipientData?.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log(`⚠️ No FCM tokens for user ${recipientId}`);
        return;
      }

      const payload: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: '💚 New Match!',
          body: `${initiatorName} wants to meet you!`,
        },
        data: {
          type: 'match',
          matchId: matchId,
          fromUserId: initiatorId,
          fromUserName: initiatorName,
          fromUserPhoto: initiatorPhoto,
          click_action: 'OPEN_MATCH',
        },
        webpush: {
          fcmOptions: {
            link: 'https://i4iguana.app',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`📤 Match notification sent: ${response.successCount} success, ${response.failureCount} failed`);

      await cleanupInvalidTokens(recipientId, fcmTokens, response);

    } catch (error) {
      console.error('❌ Error sending match notification:', error);
    }
  });

// 💬 MESSAGE NOTIFICATIONS
export const onNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const chatId = context.params.chatId;

    if (messageData.isSystem) return;

    const senderId = messageData.senderId;
    const text = messageData.text || 'Sent a message';

    console.log(`💬 New message in chat: ${chatId}`);

    try {
      const senderDoc = await db.collection('users').doc(senderId).get();
      const senderData = senderDoc.data();
      const senderName = senderData?.name || senderData?.displayName || 'Someone';
      const senderPhoto = senderData?.photos?.[0] || senderData?.photoURL || '';

      const userIds = chatId.split('_');
      const recipientId = userIds.find((id: string) => id !== senderId);

      if (!recipientId) {
        console.log('⚠️ Could not find recipient');
        return;
      }

      const recipientDoc = await db.collection('users').doc(recipientId).get();
      const recipientData = recipientDoc.data();
      const fcmTokens = recipientData?.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log(`⚠️ No FCM tokens for user ${recipientId}`);
        return;
      }

      const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;

      const payload: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: `💬 ${senderName}`,
          body: truncatedText,
        },
        data: {
          type: 'message',
          chatId: chatId,
          senderId: senderId,
          fromUserName: senderName,
          fromUserPhoto: senderPhoto,
          messagePreview: truncatedText,
          click_action: 'OPEN_CHAT',
        },
        webpush: {
          fcmOptions: {
            link: 'https://i4iguana.app',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`📤 Message notification sent: ${response.successCount} success, ${response.failureCount} failed`);

      await cleanupInvalidTokens(recipientId, fcmTokens, response);

    } catch (error) {
      console.error('❌ Error sending message notification:', error);
    }
  });

// 💕 "WE'RE MEETING" NOTIFICATIONS
export const onMeetingConfirmed = functions.firestore
  .document('activeMatches/{matchId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const matchId = context.params.matchId;

    if (beforeData.status === afterData.status) return;
    if (afterData.status !== 'successful') return;

    console.log(`💕 Meeting confirmed for match: ${matchId}`);

    try {
      const confirmedBy = afterData.meetingConfirmedBy;
      const userIds = matchId.split('_');
      const otherUserId = userIds.find((id: string) => id !== confirmedBy);

      if (!otherUserId) return;

      const confirmerDoc = await db.collection('users').doc(confirmedBy).get();
      const confirmerData = confirmerDoc.data();
      const confirmerName = confirmerData?.name || confirmerData?.displayName || 'Your match';
      const confirmerPhoto = confirmerData?.photos?.[0] || confirmerData?.photoURL || '';

      const otherUserDoc = await db.collection('users').doc(otherUserId).get();
      const otherUserData = otherUserDoc.data();
      const fcmTokens = otherUserData?.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log(`⚠️ No FCM tokens for user ${otherUserId}`);
        return;
      }

      const payload: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: '🎉 We\'re Meeting!',
          body: `${confirmerName} confirmed you're meeting! Have fun!`,
        },
        data: {
          type: 'meeting',
          matchId: matchId,
          fromUserId: confirmedBy,
          fromUserName: confirmerName,
          fromUserPhoto: confirmerPhoto,
          click_action: 'OPEN_MATCH',
        },
        webpush: {
          fcmOptions: {
            link: 'https://i4iguana.app',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`📤 Meeting notification sent: ${response.successCount} success, ${response.failureCount} failed`);

      await cleanupInvalidTokens(otherUserId, fcmTokens, response);

    } catch (error) {
      console.error('❌ Error sending meeting notification:', error);
    }
  });

// ❤️ LIKE NOTIFICATIONS
export const onNewLike = functions.firestore
  .document('users/{userId}/receivedLikes/{likeId}')
  .onCreate(async (snapshot, context) => {
    const likeData = snapshot.data();
    const recipientId = context.params.userId;
    const likerId = likeData.fromUserId;

    console.log(`❤️ New like for user: ${recipientId}`);

    try {
      const likerDoc = await db.collection('users').doc(likerId).get();
      const likerData = likerDoc.data();
      const likerName = likerData?.name || likerData?.displayName || 'Someone';
      const likerPhoto = likerData?.photos?.[0] || likerData?.photoURL || '';

      const recipientDoc = await db.collection('users').doc(recipientId).get();
      const recipientData = recipientDoc.data();
      const fcmTokens = recipientData?.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log(`⚠️ No FCM tokens for user ${recipientId}`);
        return;
      }

      const payload: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: '❤️ Someone likes you!',
          body: `${likerName} is interested in meeting you!`,
        },
        data: {
          type: 'like',
          fromUserId: likerId,
          fromUserName: likerName,
          fromUserPhoto: likerPhoto,
          click_action: 'OPEN_LIKES',
        },
        webpush: {
          fcmOptions: {
            link: 'https://i4iguana.app',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`📤 Like notification sent: ${response.successCount} success, ${response.failureCount} failed`);

      await cleanupInvalidTokens(recipientId, fcmTokens, response);

    } catch (error) {
      console.error('❌ Error sending like notification:', error);
    }
  });

// 🔧 HELPER FUNCTION
async function cleanupInvalidTokens(
  userId: string, 
  tokens: string[], 
  response: admin.messaging.BatchResponse
): Promise<void> {
  const invalidTokens: string[] = [];

  response.responses.forEach((result, index) => {
    if (!result.success) {
      const error = result.error;
      if (
        error?.code === 'messaging/invalid-registration-token' ||
        error?.code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  if (invalidTokens.length > 0) {
    console.log(`🧹 Removing ${invalidTokens.length} invalid tokens for user ${userId}`);
    
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens)
    });
  }
}
