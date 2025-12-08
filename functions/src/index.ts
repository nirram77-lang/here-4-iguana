/**
 * 🦎 I4IGUANA - Firebase Cloud Functions with OneSignal
 * 
 * Push notifications using OneSignal API
 * Updated: 2025-12-06 - WORKING API KEY!
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// OneSignal Configuration - WORKING KEY (Rotated 2025-12-06)
const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7';
const ONESIGNAL_API_KEY = 'os_v2_app_4aajaji6vrbuzorhgu6gbmh465qf2jv7xa5ui5fxnpdovkzsbsbi2r4afyjrm63fy5orulj25ob4vqsjxtbgljku5ysads6upxxvjay';

/**
 * Send push notification via OneSignal
 */
async function sendOneSignalNotification(
  externalUserId: string,
  title: string,
  message: string,
  data?: Record<string, string>,
  url?: string
): Promise<boolean> {
  try {
    console.log('🔔 Sending notification to:', externalUserId);
    console.log('📝 Title:', title);
    console.log('📝 Message:', message);
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [externalUserId],
        headings: { en: title },
        contents: { en: message },
        data: data || {},
        url: url || 'https://i4iguana-app.vercel.app',
        chrome_web_icon: 'https://i4iguana-app.vercel.app/notification-icon-192.png',
        chrome_web_badge: 'https://i4iguana-app.vercel.app/notification-badge.png',
        firefox_icon: 'https://i4iguana-app.vercel.app/notification-icon-192.png',
      }),
    });

    const result = await response.json();
    console.log('📤 OneSignal response:', JSON.stringify(result));
    
    if (result.errors) {
      console.error('❌ OneSignal error:', result.errors);
      return false;
    }
    
    console.log('✅ Notification sent successfully! ID:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending OneSignal notification:', error);
    return false;
  }
}

/**
 * 🔔 Trigger: New Match Created
 */
export const onNewMatch = functions.firestore
  .document('activeMatches/{matchId}')
  .onCreate(async (snapshot, context) => {
    const matchData = snapshot.data();
    
    if (!matchData) {
      console.log('❌ No match data found');
      return null;
    }

    const { odedUserId, sharonUserId, odedName, sharonName } = matchData;
    
    console.log(`🎉 New match! ${odedName} ↔ ${sharonName}`);

    const notifications = [];

    if (odedUserId) {
      notifications.push(
        sendOneSignalNotification(
          odedUserId,
          '💚 It\'s a Match!',
          `You and ${sharonName} liked each other! Start chatting now.`,
          { type: 'match', matchId: context.params.matchId },
          'https://i4iguana-app.vercel.app'
        )
      );
    }

    if (sharonUserId) {
      notifications.push(
        sendOneSignalNotification(
          sharonUserId,
          '💚 It\'s a Match!',
          `You and ${odedName} liked each other! Start chatting now.`,
          { type: 'match', matchId: context.params.matchId },
          'https://i4iguana-app.vercel.app'
        )
      );
    }

    await Promise.all(notifications);
    console.log('✅ Match notifications sent');
    
    return null;
  });

/**
 * 💬 Trigger: New Message in Chat
 */
export const onNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const { chatId } = context.params;

    if (!messageData) {
      console.log('❌ No message data found');
      return null;
    }

    const { senderId, recipientId, senderName, text } = messageData;
    
    console.log('📨 Message data:', { senderId, recipientId, senderName, text: text?.substring(0, 30) });

    if (!recipientId) {
      console.log('❌ No recipientId in message data');
      
      const chatDoc = await db.collection('chats').doc(chatId).get();
      const chatData = chatDoc.data();
      
      if (chatData?.participants) {
        const fallbackRecipientId = chatData.participants.find((id: string) => id !== senderId);
        if (fallbackRecipientId) {
          console.log('✅ Found recipient from chat participants:', fallbackRecipientId);
          
          const truncatedText = text?.length > 50 ? text.substring(0, 50) + '...' : text || '';
          
          await sendOneSignalNotification(
            fallbackRecipientId,
            `💬 ${senderName || 'Someone'}`,
            truncatedText,
            { type: 'message', chatId },
            'https://i4iguana-app.vercel.app'
          );
          return null;
        }
      }
      
      console.log('❌ Could not find recipient');
      return null;
    }

    console.log(`💬 New message from ${senderName} to ${recipientId}`);

    const truncatedText = text?.length > 50 ? text.substring(0, 50) + '...' : text || '';

    const success = await sendOneSignalNotification(
      recipientId,
      `💬 ${senderName || 'Someone'}`,
      truncatedText,
      { type: 'message', chatId },
      'https://i4iguana-app.vercel.app'
    );
    
    console.log('📤 OneSignal notification result:', success ? '✅ Success' : '❌ Failed');
    
    return null;
  });

/**
 * ❤️ Trigger: New Like Received
 */
export const onNewLike = functions.firestore
  .document('swipes/{swipeId}')
  .onCreate(async (snapshot, context) => {
    const swipeData = snapshot.data();

    if (!swipeData || swipeData.action !== 'like') {
      return null;
    }

    const { odedId, sharonId, odedName } = swipeData;

    const reverseSwipe = await db.collection('swipes')
      .where('odedId', '==', sharonId)
      .where('sharonId', '==', odedId)
      .where('action', '==', 'like')
      .get();

    if (!reverseSwipe.empty) {
      console.log('🎉 This will be a match - skipping like notification');
      return null;
    }

    console.log(`❤️ ${odedName} liked user ${sharonId}`);

    await sendOneSignalNotification(
      sharonId,
      '👀 Someone Likes You!',
      'Open I4IGUANA to see who\'s interested in you.',
      { type: 'like' },
      'https://i4iguana-app.vercel.app'
    );

    console.log('✅ Like notification sent');
    
    return null;
  });

/**
 * 🤝 Trigger: Meeting Confirmed
 */
export const onMeetingConfirmed = functions.firestore
  .document('activeMatches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return null;

    if (!before.odedConfirmed && after.odedConfirmed) {
      console.log(`🤝 ${after.odedName} confirmed meeting!`);
      
      await sendOneSignalNotification(
        after.sharonUserId,
        '🎉 Meeting Confirmed!',
        `${after.odedName} confirmed you're meeting! Have fun! 🦎`,
        { type: 'meeting_confirmed', matchId: context.params.matchId },
        'https://i4iguana-app.vercel.app'
      );
    }

    if (!before.sharonConfirmed && after.sharonConfirmed) {
      console.log(`🤝 ${after.sharonName} confirmed meeting!`);
      
      await sendOneSignalNotification(
        after.odedUserId,
        '🎉 Meeting Confirmed!',
        `${after.sharonName} confirmed you're meeting! Have fun! 🦎`,
        { type: 'meeting_confirmed', matchId: context.params.matchId },
        'https://i4iguana-app.vercel.app'
      );
    }

    return null;
  });
