"use strict";
/**
 * 🦎 I4IGUANA - Firebase Cloud Functions with OneSignal
 *
 * Push notifications using OneSignal API
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMeetingConfirmed = exports.onNewLike = exports.onNewMessage = exports.onNewMatch = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// OneSignal Configuration
const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7';
const ONESIGNAL_API_KEY = 'os_v2_app_4aajaji6vrbuzorhgu6gbmh4675gd6p7p25eefexb44ruurql7jjhyyo2pxknixeu2mw5d5obdtge36kl2cgetwmjigxq6plv3rnuey';
/**
 * Send push notification via OneSignal
 */
async function sendOneSignalNotification(externalUserId, title, message, data, url) {
    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_external_user_ids: [externalUserId],
                headings: { en: title },
                contents: { en: message },
                data: data || {},
                url: url || 'https://i4iguana-app.vercel.app',
                chrome_web_icon: 'https://i4iguana-app.vercel.app/icon-192.png',
                chrome_web_badge: 'https://i4iguana-app.vercel.app/icon-monochrome.png',
                firefox_icon: 'https://i4iguana-app.vercel.app/icon-192.png',
                small_icon: 'https://i4iguana-app.vercel.app/icon-monochrome.png',
            }),
        });
        const result = await response.json();
        console.log('📤 OneSignal response:', result);
        if (result.errors) {
            console.error('❌ OneSignal error:', result.errors);
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('❌ Error sending OneSignal notification:', error);
        return false;
    }
}
/**
 * 🔔 Trigger: New Match Created
 * Sends notification to User B when User A likes them back (mutual match)
 */
exports.onNewMatch = functions.firestore
    .document('activeMatches/{matchId}')
    .onCreate(async (snapshot, context) => {
    const matchData = snapshot.data();
    if (!matchData) {
        console.log('❌ No match data found');
        return null;
    }
    const { odedUserId, sharonUserId, odedName, sharonName } = matchData;
    console.log(`🎉 New match! ${odedName} ↔ ${sharonName}`);
    // Send notification to both users
    const notifications = [];
    // Notify User A (Oded) about the match
    if (odedUserId) {
        notifications.push(sendOneSignalNotification(odedUserId, '💚 It\'s a Match!', `You and ${sharonName} liked each other! Start chatting now.`, { type: 'match', matchId: context.params.matchId }, 'https://i4iguana-app.vercel.app'));
    }
    // Notify User B (Sharon) about the match
    if (sharonUserId) {
        notifications.push(sendOneSignalNotification(sharonUserId, '💚 It\'s a Match!', `You and ${odedName} liked each other! Start chatting now.`, { type: 'match', matchId: context.params.matchId }, 'https://i4iguana-app.vercel.app'));
    }
    await Promise.all(notifications);
    console.log('✅ Match notifications sent');
    return null;
});
/**
 * 💬 Trigger: New Message in Chat
 * Sends notification to the recipient
 */
exports.onNewMessage = functions.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const { chatId } = context.params;
    if (!messageData) {
        console.log('❌ No message data found');
        return null;
    }
    const { senderId, senderName, text } = messageData;
    // Get chat document to find recipient
    const chatDoc = await db.collection('chats').doc(chatId).get();
    const chatData = chatDoc.data();
    if (!chatData) {
        console.log('❌ No chat data found');
        return null;
    }
    const { participants } = chatData;
    // Find recipient (the other participant)
    const recipientId = participants.find((id) => id !== senderId);
    if (!recipientId) {
        console.log('❌ No recipient found');
        return null;
    }
    console.log(`💬 New message from ${senderName} to ${recipientId}`);
    // Truncate message for notification
    const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
    await sendOneSignalNotification(recipientId, `💬 ${senderName}`, truncatedText, { type: 'message', chatId }, 'https://i4iguana-app.vercel.app');
    console.log('✅ Message notification sent');
    return null;
});
/**
 * ❤️ Trigger: New Like Received
 * Notifies a user when someone likes them (before it's a match)
 */
exports.onNewLike = functions.firestore
    .document('swipes/{swipeId}')
    .onCreate(async (snapshot, context) => {
    const swipeData = snapshot.data();
    if (!swipeData || swipeData.action !== 'like') {
        return null;
    }
    const { odedId, sharonId, odedName } = swipeData;
    // Check if this creates a match (Sharon already liked Oded)
    const reverseSwipe = await db.collection('swipes')
        .where('odedId', '==', sharonId)
        .where('sharonId', '==', odedId)
        .where('action', '==', 'like')
        .get();
    // If it's going to be a match, don't send "like" notification
    // The match notification will be sent instead
    if (!reverseSwipe.empty) {
        console.log('🎉 This will be a match - skipping like notification');
        return null;
    }
    console.log(`❤️ ${odedName} liked user ${sharonId}`);
    // Send subtle notification to Sharon
    await sendOneSignalNotification(sharonId, '👀 Someone Likes You!', 'Open I4IGUANA to see who\'s interested in you.', { type: 'like' }, 'https://i4iguana-app.vercel.app');
    console.log('✅ Like notification sent');
    return null;
});
/**
 * 🤝 Trigger: Meeting Confirmed
 * Notifies when a user confirms "We Are Meeting"
 */
exports.onMeetingConfirmed = functions.firestore
    .document('activeMatches/{matchId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after)
        return null;
    // Check if odedConfirmed changed from false to true
    if (!before.odedConfirmed && after.odedConfirmed) {
        console.log(`🤝 ${after.odedName} confirmed meeting!`);
        await sendOneSignalNotification(after.sharonUserId, '🎉 Meeting Confirmed!', `${after.odedName} confirmed you're meeting! Have fun! 🦎`, { type: 'meeting_confirmed', matchId: context.params.matchId }, 'https://i4iguana-app.vercel.app');
    }
    // Check if sharonConfirmed changed from false to true
    if (!before.sharonConfirmed && after.sharonConfirmed) {
        console.log(`🤝 ${after.sharonName} confirmed meeting!`);
        await sendOneSignalNotification(after.odedUserId, '🎉 Meeting Confirmed!', `${after.sharonName} confirmed you're meeting! Have fun! 🦎`, { type: 'meeting_confirmed', matchId: context.params.matchId }, 'https://i4iguana-app.vercel.app');
    }
    return null;
});
//# sourceMappingURL=index.js.map