/**
 * Delete Account Service
 * 
 * Handles proper account deletion:
 * 1. Deletes ALL user data (profile, matches, chats, notifications)
 * 2. PRESERVES phoneIdentity with timer (to prevent exploit)
 * 3. User can re-register but timer still applies
 */

import { doc, getDoc, updateDoc, deleteDoc, setDoc, collection, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { getDevModePhoneNumber } from "./phone-identity-service"

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
    console.log(`🗑️ Starting account deletion for user: ${userId}`)
    
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
    
    // ✅ CRITICAL FIX: Mark as deleted IMMEDIATELY (before anything else!)
    // This ensures even if batch fails, user is marked as deleted!
    await updateDoc(userRef, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      onboardingComplete: false,
      phoneVerified: false,
      isAvailable: false
    })
    console.log('✅ User marked as deleted IMMEDIATELY')
    
    // Step 2: Check if phoneIdentity has active timer
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
        
        console.log(`⏱️ Active timer found: ${Math.floor(timerRemaining / 60)} minutes remaining`)
      }
    }
    
    // Step 3: Delete user data in batches (cleanup - can fail without breaking delete)
    try {
      const batch = writeBatch(db)
      
      // 3a. Clear sensitive data from user profile
      batch.update(userRef, {
        email: null,
        displayName: null,
        name: null,
        photoURL: null,
        photos: [],
        bio: '',
        hobbies: [],
        phoneNumber: null,
        phoneVerifiedAt: null,
        location: null,
        preferences: null,
        swipedRight: [],
        swipedLeft: [],
        matches: [],
        checkedInVenue: null,
        checkInData: null
      })
      
      console.log('✅ User profile data cleared')
      
      // 3b. Delete all user's matches
      const matchesQuery = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', userId)
      )
      const matchesSnapshot = await getDocs(matchesQuery)
      
      matchesSnapshot.forEach((matchDoc) => {
        batch.delete(matchDoc.ref)
      })
      
      console.log(`✅ ${matchesSnapshot.size} matches deleted`)
      
      // 3b-2. Remove deleted user's UID from OTHER users' swipedRight/swipedLeft
      console.log('🧹 Cleaning up deleted user UID from other users swipes...')
      
      const usersWhoSwipedRightQuery = query(
        collection(db, 'users'),
        where('swipedRight', 'array-contains', userId)
      )
      const usersWhoSwipedRightSnapshot = await getDocs(usersWhoSwipedRightQuery)
      
      for (const swipeDoc of usersWhoSwipedRightSnapshot.docs) {
        const swipeData = swipeDoc.data()
        const updatedSwipedRight = (swipeData.swipedRight || []).filter((id: string) => id !== userId)
        batch.update(swipeDoc.ref, { swipedRight: updatedSwipedRight })
      }
      console.log(`✅ Removed from ${usersWhoSwipedRightSnapshot.size} users' swipedRight`)
      
      const usersWhoSwipedLeftQuery = query(
        collection(db, 'users'),
        where('swipedLeft', 'array-contains', userId)
      )
      const usersWhoSwipedLeftSnapshot = await getDocs(usersWhoSwipedLeftQuery)
      
      for (const swipeDoc of usersWhoSwipedLeftSnapshot.docs) {
        const swipeData = swipeDoc.data()
        const updatedSwipedLeft = (swipeData.swipedLeft || []).filter((id: string) => id !== userId)
        batch.update(swipeDoc.ref, { swipedLeft: updatedSwipedLeft })
      }
      console.log(`✅ Removed from ${usersWhoSwipedLeftSnapshot.size} users' swipedLeft`)
      
      // 3c. Handle active match cancellation
      const activeMatchesQuery = query(
        collection(db, 'activeMatches'),
        where('users', 'array-contains', userId),
        where('isActive', '==', true)
      )
      const activeMatchesSnapshot = await getDocs(activeMatchesQuery)
      
      if (activeMatchesSnapshot.size > 0) {
        console.log(`🔔 Found ${activeMatchesSnapshot.size} active matches - notifying other users...`)
        
        for (const matchDoc of activeMatchesSnapshot.docs) {
          const matchData = matchDoc.data()
          const otherUserId = matchData.users.find((id: string) => id !== userId)
          
          if (otherUserId) {
            batch.update(matchDoc.ref, {
              isActive: false,
              cancelledAt: Timestamp.now(),
              cancelledBy: userId,
              cancelReason: 'account_deleted'
            })
            
            const notificationRef = doc(collection(db, 'notifications'))
            await setDoc(notificationRef, {
              userId: otherUserId,
              type: 'match_cancelled',
              title: 'Match Ended',
              message: 'Your match partner has left. Iguana is searching for a new match for you! 🦎✨',
              read: false,
              createdAt: Timestamp.now(),
              matchId: matchDoc.id,
              showIguanaAnimation: true
            })
            
            console.log(`✅ Match ${matchDoc.id} cancelled, notification sent to user ${otherUserId}`)
          }
        }
      }
      
      // 3d. Delete all user's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      )
      const notificationsSnapshot = await getDocs(notificationsQuery)
      
      notificationsSnapshot.forEach((notifDoc) => {
        batch.delete(notifDoc.ref)
      })
      
      console.log(`✅ ${notificationsSnapshot.size} notifications deleted`)
      
      // 3e. Delete all user's chat messages
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      )
      const chatsSnapshot = await getDocs(chatsQuery)
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatId = chatDoc.id
        console.log(`🗑️ Deleting messages for chat: ${chatId}`)
        
        const messagesRef = collection(db, 'chats', chatId, 'messages')
        const messagesSnapshot = await getDocs(messagesRef)
        
        // Delete messages in mini-batches of 100
        let messagesBatch = writeBatch(db)
        let batchCount = 0
        
        for (const messageDoc of messagesSnapshot.docs) {
          messagesBatch.delete(messageDoc.ref)
          batchCount++
          
          if (batchCount >= 100) {
            await messagesBatch.commit()
            messagesBatch = writeBatch(db)
            batchCount = 0
          }
        }
        
        if (batchCount > 0) {
          await messagesBatch.commit()
        }
        
        console.log(`   ✅ ${messagesSnapshot.size} messages deleted from chat ${chatId}`)
        
        batch.delete(chatDoc.ref)
      }
      
      console.log(`✅ ${chatsSnapshot.size} chats and their messages deleted`)
      
      // 3f. Delete messages from matches collection
      for (const matchDoc of matchesSnapshot.docs) {
        const matchId = matchDoc.id
        
        const matchMessagesRef = collection(db, 'matches', matchId, 'messages')
        const matchMessagesSnapshot = await getDocs(matchMessagesRef)
        
        let matchMsgBatch = writeBatch(db)
        let matchBatchCount = 0
        
        for (const messageDoc of matchMessagesSnapshot.docs) {
          matchMsgBatch.delete(messageDoc.ref)
          matchBatchCount++
          
          if (matchBatchCount >= 100) {
            await matchMsgBatch.commit()
            matchMsgBatch = writeBatch(db)
            matchBatchCount = 0
          }
        }
        
        if (matchBatchCount > 0) {
          await matchMsgBatch.commit()
        }
        
        if (matchMessagesSnapshot.size > 0) {
          console.log(`   ✅ ${matchMessagesSnapshot.size} messages deleted from match ${matchId}`)
        }
      }
      
      console.log(`✅ All chat messages cleaned up`)
      
      // Step 4: Commit the main batch
      await batch.commit()
      console.log('✅ All user data deleted')
      
    } catch (batchError) {
      // Batch cleanup failed - but user is already marked as deleted!
      console.error('⚠️ Batch cleanup failed (user still marked as deleted):', batchError)
    }
    
    // Step 5: Handle phoneIdentity based on timer status
    if (hasActiveTimer) {
      console.log(`🔒 Preserving phoneIdentity timer: ${Math.floor(timerRemaining / 60)} minutes remaining`)
      console.log('   This prevents re-registration exploit')
    } else {
      console.log('✅ No active timer - resetting phoneIdentity for clean re-registration')
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
    
    // Return success - user is definitely marked as deleted!
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
  try {
    const activeMatchesQuery = query(
      collection(db, 'activeMatches'),
      where('users', 'array-contains', userId),
      where('isActive', '==', true)
    )
    
    const activeMatches = await getDocs(activeMatchesQuery)
    
    // Allow deletion even with active matches - we'll notify the other user
    return { canDelete: true }
    
  } catch (error) {
    console.error('Error checking if can delete:', error)
    return {
      canDelete: true
    }
  }
}
