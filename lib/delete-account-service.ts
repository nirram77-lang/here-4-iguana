/**
 * Delete Account Service
 * 
 * Handles proper account deletion:
 * 1. Deletes ALL user data (profile, matches, chats, notifications)
 * 2. Deletes ALL chat images from Storage (saves space!)
 * 3. PRESERVES phoneIdentity with timer (to prevent exploit)
 * 4. User can re-register but timer still applies
 * 
 * ✅ FIXED: Chat deletion now works properly
 * ✅ FIXED: Batch operations split to avoid 500 limit
 * ✅ NEW: Chat images deleted from Storage
 */

import { doc, getDoc, updateDoc, deleteDoc, setDoc, collection, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore"
import { ref, listAll, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import { getDevModePhoneNumber } from "./phone-identity-service"

/**
 * 📸 Delete all chat images for a specific chat from Storage
 */
async function deleteChatImagesFromStorage(chatId: string): Promise<number> {
  try {
    console.log(`   🗑️ Deleting images for chat: ${chatId}`)
    
    const chatImagesRef = ref(storage, `chat-images/${chatId}`)
    const imagesList = await listAll(chatImagesRef)
    
    if (imagesList.items.length === 0) {
      console.log(`   ℹ️ No images found for chat ${chatId}`)
      return 0
    }
    
    let deletedCount = 0
    for (const imageRef of imagesList.items) {
      try {
        await deleteObject(imageRef)
        deletedCount++
      } catch (err) {
        console.error(`   ⚠️ Failed to delete image: ${imageRef.name}`, err)
      }
    }
    
    console.log(`   ✅ Deleted ${deletedCount}/${imagesList.items.length} images from Storage`)
    return deletedCount
    
  } catch (error: any) {
    // If folder doesn't exist, that's fine
    if (error?.code === 'storage/object-not-found') {
      console.log(`   ℹ️ No image folder for chat ${chatId}`)
      return 0
    }
    console.error(`   ❌ Error deleting images for chat ${chatId}:`, error)
    return 0
  }
}

/**
 * Delete all messages from a chat - SEPARATE function to ensure it works
 */
async function deleteAllChatMessages(chatId: string): Promise<number> {
  try {
    const messagesRef = collection(db, 'matches', chatId, 'messages')
    const messagesSnapshot = await getDocs(messagesRef)
    
    if (messagesSnapshot.empty) {
      console.log(`   ℹ️ No messages in chat ${chatId}`)
      return 0
    }
    
    let deletedCount = 0
    let batch = writeBatch(db)
    let batchCount = 0
    
    for (const messageDoc of messagesSnapshot.docs) {
      batch.delete(messageDoc.ref)
      batchCount++
      deletedCount++
      
      // Commit every 400 operations (safety margin under 500 limit)
      if (batchCount >= 400) {
        await batch.commit()
        console.log(`   ✅ Committed batch of ${batchCount} message deletions`)
        batch = writeBatch(db)
        batchCount = 0
      }
    }
    
    // Commit remaining
    if (batchCount > 0) {
      await batch.commit()
      console.log(`   ✅ Committed final batch of ${batchCount} message deletions`)
    }
    
    return deletedCount
  } catch (error) {
    console.error(`   ❌ Error deleting messages from ${chatId}:`, error)
    return 0
  }
}

/**
 * Delete a chat document and all its messages AND images
 */
async function deleteChatCompletely(chatId: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting chat: ${chatId}`)
    
    // Step 1: Delete all messages first
    const messagesDeleted = await deleteAllChatMessages(chatId)
    console.log(`   ✅ Deleted ${messagesDeleted} messages`)
    
    // Step 2: Delete all images from Storage
    const imagesDeleted = await deleteChatImagesFromStorage(chatId)
    if (imagesDeleted > 0) {
      console.log(`   ✅ Deleted ${imagesDeleted} images from Storage`)
    }
    
    // Step 3: Delete the chat document itself
    const chatDocRef = doc(db, 'chats', chatId)
    await deleteDoc(chatDocRef)
    console.log(`   ✅ Deleted chat document`)
    
    return true
  } catch (error) {
    console.error(`   ❌ Error deleting chat ${chatId}:`, error)
    return false
  }
}

/**
 * Find all chats that involve this user
 */
async function findAllUserChats(userId: string): Promise<string[]> {
  const chatIds = new Set<string>()
  
  console.log(`🔍 Finding all chats for user: ${userId}`)
  
  try {
    // Method 1: Query by participants field
    try {
      const participantsQuery = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', userId)
      )
      const participantsSnapshot = await getDocs(participantsQuery)
      participantsSnapshot.docs.forEach(doc => chatIds.add(doc.id))
      console.log(`   Found ${participantsSnapshot.size} chats by 'participants' field`)
    } catch (e) {
      console.log('   ⚠️ Error querying by participants:', e)
    }
    
    // Method 2: Query by users field (some chats might use this)
    try {
      const usersQuery = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId)
      )
      const usersSnapshot = await getDocs(usersQuery)
      usersSnapshot.docs.forEach(doc => {
        if (!chatIds.has(doc.id)) {
          chatIds.add(doc.id)
        }
      })
      console.log(`   Found ${usersSnapshot.size} chats by 'users' field`)
    } catch (e) {
      console.log('   ⚠️ Error querying by users:', e)
    }
    
    // Method 3: Scan all chats for matchId pattern (userId1_userId2)
    const allChatsSnapshot = await getDocs(collection(db, 'matches'))
    let patternMatches = 0
    allChatsSnapshot.docs.forEach(doc => {
      if (doc.id.includes(userId)) {
        if (!chatIds.has(doc.id)) {
          patternMatches++
        }
        chatIds.add(doc.id)
      }
    })
    console.log(`   Found ${patternMatches} additional chats by matchId pattern`)
    
    console.log(`   📊 TOTAL unique chats to delete: ${chatIds.size}`)
    
  } catch (error) {
    console.error('   ❌ Error finding user chats:', error)
  }
  
  return Array.from(chatIds)
}

/**
 * Delete user account completely
 * BUT keep phoneIdentity with lock timer to prevent re-registration exploit
 */
export const deleteUserAccount = async (userId: string): Promise<{
  success: boolean
  error?: string
  phoneIdentityPreserved: boolean
  timerRemaining?: number
}> => {
  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🗑️ STARTING ACCOUNT DELETION FOR USER: ${userId}`)
    console.log(`${'='.repeat(60)}\n`)
    
    // ✅ NEW: Logout from OneSignal with TIMEOUT (prevent hanging)
    const oneSignalLogout = async () => {
      const OneSignal = (window as any)?.OneSignal
      if (!OneSignal) return
      
      console.log('🔔 Logging out from OneSignal...')
      
      // Unsubscribe from push (with timeout)
      if (OneSignal.User && OneSignal.User.PushSubscription) {
        try {
          await Promise.race([
            OneSignal.User.PushSubscription.optOut(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ])
          console.log('✅ OneSignal: Unsubscribed from push')
        } catch (e) {
          console.log('⚠️ OneSignal optOut timeout/error, continuing...')
        }
      }
      
      // Logout user (with timeout)
      if (OneSignal.logout) {
        try {
          await Promise.race([
            OneSignal.logout(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ])
          console.log('✅ OneSignal: Logged out successfully')
        } catch (e) {
          console.log('⚠️ OneSignal logout timeout/error, continuing...')
        }
      }
      
      // Clear localStorage keys for this user (this is sync, no timeout needed)
      localStorage.removeItem(`oneSignalLinked_${userId}`)
      localStorage.removeItem(`notificationModalShown_${userId}`)
      localStorage.removeItem('i4iguana_onesignal_linked')
      localStorage.removeItem('i4iguana_notifications_enabled')
      console.log('✅ OneSignal: Cleared localStorage keys')
    }
    
    // Run OneSignal cleanup with overall timeout
    try {
      await Promise.race([
        oneSignalLogout(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Overall timeout')), 5000))
      ])
    } catch (e) {
      console.log('⚠️ OneSignal cleanup timed out, continuing with delete...')
    }
    
    // Step 1: Get user's phone number before deleting
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'User not found',
        phoneIdentityPreserved: false
      }
    }
    
    const userData = userDoc.data()
    const phoneNumber = userData.phoneNumber || getDevModePhoneNumber(userId)
    
    console.log(`📱 User's phone number: ${phoneNumber}`)
    
    // ✅ v2.8.5: CHECKOUT FROM VENUE FIRST!
    if (userData.checkedInVenue) {
      console.log(`🚪 User is checked into venue: ${userData.checkedInVenue} - checking out...`)
      try {
        const { checkOutUser } = await import('./venue-service')
        await checkOutUser(userData.checkedInVenue, userId)
        console.log('✅ User checked out from venue successfully')
      } catch (checkoutError) {
        console.error('⚠️ Error checking out from venue (continuing anyway):', checkoutError)
        // Also try to remove from venue's checkedInUsers array directly
        try {
          const venueRef = doc(db, 'venues', userData.checkedInVenue)
          const { arrayRemove: arrRemove } = await import('firebase/firestore')
          await updateDoc(venueRef, {
            checkedInUsers: arrRemove(userId)
          })
          console.log('✅ Manually removed user from venue checkedInUsers')
        } catch (e) {
          console.error('⚠️ Manual venue cleanup also failed:', e)
        }
      }
    } else {
      console.log('ℹ️ User not checked into any venue')
    }
    
    // ✅ CRITICAL: Mark as deleted IMMEDIATELY
    await updateDoc(userRef, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      onboardingComplete: false,
      phoneVerified: false,
      isAvailable: false
    })
    console.log('✅ Step 1: User marked as deleted\n')
    
    // Step 2: Check phoneIdentity timer
    const phoneRef = doc(db, 'phoneIdentities', phoneNumber)
    const phoneDoc = await getDoc(phoneRef)
    
    let timerRemaining = 0
    let hasActiveTimer = false
    
    if (phoneDoc.exists()) {
      const phoneData = phoneDoc.data()
      if (phoneData.lockedUntil) {
        const now = Date.now()
        const lockUntil = phoneData.lockedUntil.toMillis()
        timerRemaining = Math.max(0, Math.floor((lockUntil - now) / 1000))
        hasActiveTimer = timerRemaining > 0
        
        if (hasActiveTimer) {
          console.log(`⏱️ Active timer found: ${Math.floor(timerRemaining / 60)} minutes remaining`)
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // Step 3: DELETE ALL CHATS (CRITICAL - DO THIS FIRST!)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📬 Step 3: Deleting all chats...')
    
    const chatIds = await findAllUserChats(userId)
    console.log(`   Found ${chatIds.length} total chats to delete`)
    
    let chatsDeleted = 0
    for (const chatId of chatIds) {
      const success = await deleteChatCompletely(chatId)
      if (success) chatsDeleted++
    }
    console.log(`✅ Deleted ${chatsDeleted}/${chatIds.length} chats\n`)
    
    // ═══════════════════════════════════════════════════════════════
    // Step 4: Delete matches and messages in matches collection
    // ═══════════════════════════════════════════════════════════════
    console.log('🤝 Step 4: Deleting matches...')
    
    // ✅ FIX: Search by BOTH 'participants' AND 'users' fields!
    // Old matches use 'participants', new matches use 'users'
    const matchIdsToDelete = new Set<string>()
    
    // Search by 'participants' field
    try {
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', userId)
      )
      const matchesSnapshot1 = await getDocs(matchesQuery1)
      matchesSnapshot1.docs.forEach(doc => matchIdsToDelete.add(doc.id))
      console.log(`   Found ${matchesSnapshot1.size} matches by 'participants' field`)
    } catch (e) {
      console.log('   ⚠️ Error querying by participants:', e)
    }
    
    // Search by 'users' field
    try {
      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId)
      )
      const matchesSnapshot2 = await getDocs(matchesQuery2)
      matchesSnapshot2.docs.forEach(doc => matchIdsToDelete.add(doc.id))
      console.log(`   Found ${matchesSnapshot2.size} matches by 'users' field`)
    } catch (e) {
      console.log('   ⚠️ Error querying by users:', e)
    }
    
    // ✅ Also search by matchId pattern (userId1_userId2)
    try {
      const allMatchesSnapshot = await getDocs(collection(db, 'matches'))
      allMatchesSnapshot.docs.forEach(doc => {
        if (doc.id.includes(userId)) {
          matchIdsToDelete.add(doc.id)
        }
      })
      console.log(`   Total unique matches found: ${matchIdsToDelete.size}`)
    } catch (e) {
      console.log('   ⚠️ Error scanning all matches:', e)
    }
    
    // Delete all found matches and their messages
    for (const matchId of matchIdsToDelete) {
      try {
        console.log(`   🗑️ Deleting match: ${matchId}`)
        
        // Delete messages in this match
        const matchMessagesRef = collection(db, 'matches', matchId, 'messages')
        const messagesSnap = await getDocs(matchMessagesRef)
        
        if (!messagesSnap.empty) {
          let batch = writeBatch(db)
          let count = 0
          
          for (const msgDoc of messagesSnap.docs) {
            batch.delete(msgDoc.ref)
            count++
            if (count >= 400) {
              await batch.commit()
              batch = writeBatch(db)
              count = 0
            }
          }
          if (count > 0) await batch.commit()
          console.log(`      ✅ Deleted ${messagesSnap.size} messages`)
        }
        
        // Delete the match document
        await deleteDoc(doc(db, 'matches', matchId))
        console.log(`      ✅ Deleted match document`)
      } catch (err) {
        console.error(`   ⚠️ Error deleting match ${matchId}:`, err)
      }
    }
    console.log(`✅ Deleted ${matchIdsToDelete.size} matches total\n`)
    
    // ═══════════════════════════════════════════════════════════════
    // Step 5: Clean up other users' swipe lists (in small batches)
    // ═══════════════════════════════════════════════════════════════
    console.log('🧹 Step 5: Cleaning up swipe references...')
    
    // Remove from swipedRight
    const swipedRightQuery = query(
      collection(db, 'users'),
      where('swipedRight', 'array-contains', userId)
    )
    const swipedRightSnap = await getDocs(swipedRightQuery)
    
    let batch1 = writeBatch(db)
    let batch1Count = 0
    
    for (const userDoc of swipedRightSnap.docs) {
      const data = userDoc.data()
      const updated = (data.swipedRight || []).filter((id: string) => id !== userId)
      batch1.update(userDoc.ref, { swipedRight: updated })
      batch1Count++
      
      if (batch1Count >= 400) {
        await batch1.commit()
        batch1 = writeBatch(db)
        batch1Count = 0
      }
    }
    if (batch1Count > 0) await batch1.commit()
    console.log(`   ✅ Removed from ${swipedRightSnap.size} users' swipedRight`)
    
    // Remove from swipedLeft
    const swipedLeftQuery = query(
      collection(db, 'users'),
      where('swipedLeft', 'array-contains', userId)
    )
    const swipedLeftSnap = await getDocs(swipedLeftQuery)
    
    let batch2 = writeBatch(db)
    let batch2Count = 0
    
    for (const userDoc of swipedLeftSnap.docs) {
      const data = userDoc.data()
      const updated = (data.swipedLeft || []).filter((id: string) => id !== userId)
      batch2.update(userDoc.ref, { swipedLeft: updated })
      batch2Count++
      
      if (batch2Count >= 400) {
        await batch2.commit()
        batch2 = writeBatch(db)
        batch2Count = 0
      }
    }
    if (batch2Count > 0) await batch2.commit()
    console.log(`   ✅ Removed from ${swipedLeftSnap.size} users' swipedLeft\n`)
    
    // ═══════════════════════════════════════════════════════════════
    // Step 6: Cancel active matches and notify partners
    // ═══════════════════════════════════════════════════════════════
    console.log('💔 Step 6: Cancelling active matches...')
    
    const activeMatchesQuery = query(
      collection(db, 'activeMatches'),
      where('users', 'array-contains', userId),
      where('isActive', '==', true)
    )
    const activeMatchesSnap = await getDocs(activeMatchesQuery)
    
    for (const matchDoc of activeMatchesSnap.docs) {
      try {
        const matchData = matchDoc.data()
        const otherUserId = matchData.users.find((id: string) => id !== userId)
        
        await updateDoc(matchDoc.ref, {
          isActive: false,
          cancelledAt: Timestamp.now(),
          cancelledBy: userId,
          cancelReason: 'account_deleted'
        })
        
        if (otherUserId) {
          await setDoc(doc(collection(db, 'notifications')), {
            userId: otherUserId,
            type: 'match_cancelled',
            title: 'Match Ended',
            message: 'Your match partner has left. Iguana is searching for a new match for you! 🦎✨',
            read: false,
            createdAt: Timestamp.now(),
            matchId: matchDoc.id,
            showIguanaAnimation: true
          })
        }
      } catch (err) {
        console.error(`   ⚠️ Error cancelling active match:`, err)
      }
    }
    console.log(`✅ Cancelled ${activeMatchesSnap.size} active matches\n`)
    
    // ═══════════════════════════════════════════════════════════════
    // Step 7: Delete notifications
    // ═══════════════════════════════════════════════════════════════
    console.log('🔔 Step 7: Deleting notifications...')
    
    const notifsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    )
    const notifsSnap = await getDocs(notifsQuery)
    
    let batch3 = writeBatch(db)
    let batch3Count = 0
    
    for (const notifDoc of notifsSnap.docs) {
      batch3.delete(notifDoc.ref)
      batch3Count++
      
      if (batch3Count >= 400) {
        await batch3.commit()
        batch3 = writeBatch(db)
        batch3Count = 0
      }
    }
    if (batch3Count > 0) await batch3.commit()
    console.log(`✅ Deleted ${notifsSnap.size} notifications\n`)
    
    // ═══════════════════════════════════════════════════════════════
    // Step 8: DELETE USER DOCUMENT COMPLETELY
    // ═══════════════════════════════════════════════════════════════
    console.log('👤 Step 8: DELETING user document completely...')
    
    // ✅ v2.8.5 FIX: Actually DELETE the user, not just mark as deleted!
    await deleteDoc(userRef)
    console.log('✅ User document DELETED from database\n')
    
    // ✅ v2.8.4 FIX: Clear ALL localStorage to force fresh start!
    console.log('🧹 Clearing localStorage...')
    const keysToRemove = [
      'i4iguana_phone_verified',
      'i4iguana_onboarding',
      'i4iguana_checkin',
      'i4iguana_was_authenticated',
      'i4iguana_just_deleted',
      'i4iguana_cached_screen',
      'i4iguana_user_id',
      'i4iguana_profile_complete',
      'i4iguana_onboarding_data',  // ✅ v2.8.25: CRITICAL - Clear old photos!
      'googleDisplayName',
      'googleEmail',
      `onesignal_last_refresh_${userId}`
    ]
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`✅ Cleared ${keysToRemove.length} localStorage keys\n`)
    
    // ═══════════════════════════════════════════════════════════════
    // Step 9: Handle phoneIdentity
    // ═══════════════════════════════════════════════════════════════
    if (hasActiveTimer) {
      console.log(`🔒 Preserving phoneIdentity timer: ${Math.floor(timerRemaining / 60)} minutes remaining`)
    } else {
      console.log('♻️ Resetting phoneIdentity for clean re-registration')
      try {
        await updateDoc(phoneRef, {
          passesLeft: 1,
          passesUsedToday: 0,
          matchesCountToday: 0,
          lockedUntil: null,
          lastPassReset: Timestamp.now()
        })
      } catch (phoneError) {
        console.error('⚠️ Error resetting phoneIdentity:', phoneError)
      }
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ ACCOUNT DELETION COMPLETE`)
    console.log(`${'='.repeat(60)}\n`)
    
    return {
      success: true,
      phoneIdentityPreserved: hasActiveTimer,
      timerRemaining: hasActiveTimer ? timerRemaining : undefined
    }
    
  } catch (error) {
    console.error('❌ Error deleting account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      phoneIdentityPreserved: false
    }
  }
}

/**
 * Check if user can delete account
 */
export const canDeleteAccount = async (userId: string): Promise<{
  canDelete: boolean
  reason?: string
}> => {
  // Always allow deletion - we handle active matches gracefully
  return { canDelete: true }
}
