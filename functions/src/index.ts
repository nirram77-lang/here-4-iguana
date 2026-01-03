/**
 * 🦎 I4IGUANA - Cloud Functions
 * 
 * Push Notifications via OneSignal API v2
 * 
 * v2.8.17 - WORKING OneSignal Integration
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
admin.initializeApp()
const db = admin.firestore()

// ═══════════════════════════════════════════════════════════════════════════
// ONESIGNAL CONFIGURATION - API v2
// ═══════════════════════════════════════════════════════════════════════════

const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7'
const ONESIGNAL_API_KEY = 'os_v2_app_4aajaji6vrbuzorhgu6gbmh465qf2jv7xa5ui5fxnpdovkzsbsbi2r4afyjrm63fy5orulj25ob4vqsjxtbgljku5ysads6upxxvjay'

// ═══════════════════════════════════════════════════════════════════════════
// SEND ONESIGNAL NOTIFICATION - API v2 FORMAT
// ═══════════════════════════════════════════════════════════════════════════

async function sendOneSignalNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, string>
): Promise<boolean> {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🔔 SENDING ONESIGNAL NOTIFICATION')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`📍 Target User ID: ${userId}`)
  console.log(`📝 Title: ${title}`)
  console.log(`💬 Message: ${message}`)
  console.log(`📦 Data: ${JSON.stringify(data || {})}`)
  
  try {
    // ✅ OneSignal API v2 format
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      // ✅ NEW API v2 format: include_aliases instead of include_external_user_ids
      include_aliases: {
        external_id: [userId]
      },
      target_channel: 'push',
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      // iOS specific
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      // Android specific  
      android_channel_id: 'default',
      priority: 10,
      // TTL
      ttl: 86400
    }
    
    console.log('📤 Sending to OneSignal API v2...')
    console.log(`   Endpoint: https://api.onesignal.com/notifications`)
    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`)
    
    // ✅ NEW API v2 endpoint and auth format
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`  // ✅ "Key" not "Basic"!
      },
      body: JSON.stringify(payload)
    })
    
    const result = await response.json()
    
    console.log('📥 OneSignal Response:')
    console.log(`   Status: ${response.status}`)
    console.log(`   Body: ${JSON.stringify(result)}`)
    
    if (response.ok && result.id) {
      console.log('✅ NOTIFICATION SENT SUCCESSFULLY!')
      console.log(`   Notification ID: ${result.id}`)
      return true
    } else {
      console.error('❌ OneSignal ERROR:')
      console.error(`   Status: ${response.status}`)
      console.error(`   Errors: ${JSON.stringify(result.errors || result)}`)
      return false
    }
  } catch (error: any) {
    console.error('❌ EXCEPTION sending notification:')
    console.error(`   Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}`)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER: NEW MATCH CREATED
// ═══════════════════════════════════════════════════════════════════════════

export const onNewMatch = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snapshot, context) => {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('💕 NEW MATCH CREATED - TRIGGER FIRED')
    console.log('═══════════════════════════════════════════════════════════')
    
    const matchData = snapshot.data()
    const matchId = context.params.matchId
    
    console.log(`   Match ID: ${matchId}`)
    console.log(`   User 1: ${matchData.user1Id}`)
    console.log(`   User 2: ${matchData.user2Id}`)
    
    if (!matchData.user1Id || !matchData.user2Id) {
      console.log('⚠️ Missing user IDs - skipping')
      return
    }
    
    // Get user profiles for names
    const [user1Doc, user2Doc] = await Promise.all([
      db.collection('users').doc(matchData.user1Id).get(),
      db.collection('users').doc(matchData.user2Id).get()
    ])
    
    const user1Name = user1Doc.data()?.name || 'Someone'
    const user2Name = user2Doc.data()?.name || 'Someone'
    
    // Send notification to BOTH users
    const results = await Promise.all([
      sendOneSignalNotification(
        matchData.user1Id,
        "💚 It's a Match!",
        `You matched with ${user2Name}! Say hi 👋`,
        { type: 'match', matchId, fromUserId: matchData.user2Id }
      ),
      sendOneSignalNotification(
        matchData.user2Id,
        "💚 It's a Match!",
        `You matched with ${user1Name}! Say hi 👋`,
        { type: 'match', matchId, fromUserId: matchData.user1Id }
      )
    ])
    
    console.log(`✅ Match notifications sent: ${results.filter(r => r).length}/2 successful`)
  })

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER: NEW MESSAGE IN MATCH
// ═══════════════════════════════════════════════════════════════════════════

export const onNewMessage = functions.firestore
  .document('matches/{matchId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('💬 NEW MESSAGE - TRIGGER FIRED')
    console.log('═══════════════════════════════════════════════════════════')
    
    const messageData = snapshot.data()
    const matchId = context.params.matchId
    
    console.log(`   Match ID: ${matchId}`)
    console.log(`   Sender: ${messageData.senderId}`)
    console.log(`   Text: ${messageData.text?.substring(0, 50)}...`)
    
    if (!messageData.senderId) {
      console.log('⚠️ Missing sender ID - skipping')
      return
    }
    
    // Get match to find recipient
    const matchDoc = await db.collection('matches').doc(matchId).get()
    const matchData = matchDoc.data()
    
    if (!matchData) {
      console.log('⚠️ Match not found - skipping')
      return
    }
    
    // Find recipient (the other user)
    const recipientId = matchData.user1Id === messageData.senderId 
      ? matchData.user2Id 
      : matchData.user1Id
    
    console.log(`   Recipient: ${recipientId}`)
    
    // Get sender name
    const senderDoc = await db.collection('users').doc(messageData.senderId).get()
    const senderName = senderDoc.data()?.name || 'Someone'
    
    // Send notification
    const result = await sendOneSignalNotification(
      recipientId,
      `💬 ${senderName}`,
      messageData.text || '📷 Photo',
      { 
        type: 'message', 
        matchId, 
        fromUserId: messageData.senderId,
        fromUserName: senderName
      }
    )
    
    console.log(`✅ Message notification sent: ${result ? 'success' : 'failed'}`)
  })

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER: NEW LIKE (Heart on message)
// ═══════════════════════════════════════════════════════════════════════════

export const onMessageLike = functions.firestore
  .document('matches/{matchId}/messages/{messageId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    
    // Check if likedBy array changed (new like added)
    const beforeLikes = before.likedBy || []
    const afterLikes = after.likedBy || []
    
    if (afterLikes.length <= beforeLikes.length) {
      return // No new like
    }
    
    // Find who added the like
    const newLikers = afterLikes.filter((id: string) => !beforeLikes.includes(id))
    if (newLikers.length === 0) return
    
    const likerId = newLikers[0]
    const messageOwnerId = after.senderId
    
    // Don't notify if user liked their own message
    if (likerId === messageOwnerId) return
    
    console.log('═══════════════════════════════════════════════════════════')
    console.log('❤️ MESSAGE LIKED - TRIGGER FIRED')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`   Liker: ${likerId}`)
    console.log(`   Message owner: ${messageOwnerId}`)
    
    // Get liker name
    const likerDoc = await db.collection('users').doc(likerId).get()
    const likerName = likerDoc.data()?.name || 'Someone'
    
    // Send notification to message owner
    await sendOneSignalNotification(
      messageOwnerId,
      `❤️ ${likerName} liked your message`,
      after.text?.substring(0, 50) || '❤️',
      { 
        type: 'like', 
        matchId: context.params.matchId,
        fromUserId: likerId 
      }
    )
  })

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER: MEETING CONFIRMED ("We're Meeting!" clicked)
// ═══════════════════════════════════════════════════════════════════════════

export const onMeetingConfirmed = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    
    // Check if status changed to 'meeting'
    if (before.status !== 'meeting' && after.status === 'meeting') {
      console.log('═══════════════════════════════════════════════════════════')
      console.log('🎉 MEETING CONFIRMED - TRIGGER FIRED')
      console.log('═══════════════════════════════════════════════════════════')
      
      const matchId = context.params.matchId
      
      // Notify BOTH users
      const results = await Promise.all([
        sendOneSignalNotification(
          after.user1Id,
          "🎉 Meeting Confirmed!",
          "Get ready to meet! Have a great time! 💚",
          { type: 'meeting', matchId }
        ),
        sendOneSignalNotification(
          after.user2Id,
          "🎉 Meeting Confirmed!",
          "Get ready to meet! Have a great time! 💚",
          { type: 'meeting', matchId }
        )
      ])
      
      console.log(`✅ Meeting notifications sent: ${results.filter(r => r).length}/2 successful`)
    }
  })

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP: Delete expired matches (runs every hour)
// ═══════════════════════════════════════════════════════════════════════════

export const cleanupExpiredMatches = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    console.log('🧹 Running expired matches cleanup...')
    
    const now = admin.firestore.Timestamp.now()
    
    const expiredMatches = await db.collection('matches')
      .where('expiresAt', '<', now)
      .where('status', '==', 'active')
      .get()
    
    console.log(`Found ${expiredMatches.size} expired matches`)
    
    const batch = db.batch()
    expiredMatches.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'expired' })
    })
    
    await batch.commit()
    console.log('✅ Cleanup complete')
  })
