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
    
    // Step 3: Delete user data in batches
    const batch = writeBatch(db)
    
    // 3a. Delete user profile (mark as deleted, don't actually delete document)
    batch.update(userRef, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      onboardingComplete: false,  // ✅ CRITICAL: Force onboarding on re-login
      // Clear sensitive data
      email: null,
      displayName: null,
      name: null,  // ✅ FIX: Also clear name!
      photoURL: null,
      photos: [],
      bio: '',
      hobbies: [],
      phoneNumber: null,  // ✅ Clear phone link from user profile
      phoneVerified: false,  // ✅ FIX: Reset phone verification!
      phoneVerifiedAt: null,  // ✅ FIX: Clear verification timestamp
      // ✅ Clear location & preferences
      location: null,
      preferences: null,
      // ✅ Clear swipe history
      swipedRight: [],
      swipedLeft: [],
      matches: [],
      // ✅ Clear check-in data
      checkedInVenue: null,
      checkInData: null,
      isAvailable: false
    })
    
    console.log('✅ User profile marked for deletion')
    
    // 3b. Delete all user's matches
    const matchesQuery = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', userId)
    )
    const matchesSnapshot = await getDocs(matchesQuery)
    
    matchesSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    console.log(`✅ ${matchesSnapshot.size} matches deleted`)
    
    // 3b-2. ✅ CRITICAL FIX: Remove deleted user's UID from OTHER users' swipedRight/swipedLeft
    // This prevents "ghost matches" when user re-registers with new account
    console.log('🧹 Cleaning up deleted user UID from other users swipes...')
    
    // Find users who have swiped on this user
    const usersWhoSwipedRightQuery = query(
      collection(db, 'users'),
      where('swipedRight', 'array-contains', userId)
    )
    const usersWhoSwipedRightSnapshot = await getDocs(usersWhoSwipedRightQuery)
    
    for (const userDoc of usersWhoSwipedRightSnapshot.docs) {
      const userData = userDoc.data()
      const updatedSwipedRight = (userData.swipedRight || []).filter((id: string) => id !== userId)
      batch.update(userDoc.ref, { swipedRight: updatedSwipedRight })
    }
    console.log(`✅ Removed from ${usersWhoSwipedRightSnapshot.size} users' swipedRight`)
    
    const usersWhoSwipedLeftQuery = query(
      collection(db, 'users'),
      where('swipedLeft', 'array-contains', userId)
    )
    const usersWhoSwipedLeftSnapshot = await getDocs(usersWhoSwipedLeftQuery)
    
    for (const userDoc of usersWhoSwipedLeftSnapshot.docs) {
      const userData = userDoc.data()
      const updatedSwipedLeft = (userData.swipedLeft || []).filter((id: string) => id !== userId)
      batch.update(userDoc.ref, { swipedLeft: updatedSwipedLeft })
    }
    console.log(`✅ Removed from ${usersWhoSwipedLeftSnapshot.size} users' swipedLeft`)
    
    // 3c. ✅ CRITICAL: Handle active match cancellation BEFORE deleting
    // Check activeMatches collection (10-minute timer matches)
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
          // Deactivate the match
          batch.update(matchDoc.ref, {
            isActive: false,
            cancelledAt: Timestamp.now(),
            cancelledBy: userId,
            cancelReason: 'account_deleted'
          })
          
          // ✅ Create notification for other user with iguana animation
          const notificationRef = doc(collection(db, 'notifications'))
          await setDoc(notificationRef, {
            userId: otherUserId,
            type: 'match_cancelled',
            title: 'Match Ended',
            message: 'Your match partner has left. Iguana is searching for a new match for you! 🦎✨',
            read: false,
            createdAt: Timestamp.now(),
            matchId: matchDoc.id,
            showIguanaAnimation: true  // ✅ Trigger iguana searching animation
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
    
    notificationsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    console.log(`✅ ${notificationsSnapshot.size} notifications deleted`)
    
    // 3e. Delete all user's chat messages (in all chats they participated in)
    // ✅ CRITICAL FIX: Must delete messages subcollection BEFORE deleting chat document
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    )
    const chatsSnapshot = await getDocs(chatsQuery)
    
    // First, delete all messages in each chat (subcollection)
    for (const chatDoc of chatsSnapshot.docs) {
      const chatId = chatDoc.id
      console.log(`🗑️ Deleting messages for chat: ${chatId}`)
      
      // Get all messages in this chat
      const messagesRef = collection(db, 'chats', chatId, 'messages')
      const messagesSnapshot = await getDocs(messagesRef)
      
      // Delete each message
      for (const messageDoc of messagesSnapshot.docs) {
        batch.delete(messageDoc.ref)
      }
      console.log(`   ✅ ${messagesSnapshot.size} messages deleted from chat ${chatId}`)
      
      // Now delete the chat document itself
      batch.delete(chatDoc.ref)
    }
    
    console.log(`✅ ${chatsSnapshot.size} chats and their messages deleted`)
    
    // 3f. Also delete messages from matches collection (some chats stored there)
    for (const matchDoc of matchesSnapshot.docs) {
      const matchId = matchDoc.id
      
      // Get all messages in this match's chat
      const matchMessagesRef = collection(db, 'matches', matchId, 'messages')
      const matchMessagesSnapshot = await getDocs(matchMessagesRef)
      
      // Delete each message
      for (const messageDoc of matchMessagesSnapshot.docs) {
        batch.delete(messageDoc.ref)
      }
      
      if (matchMessagesSnapshot.size > 0) {
        console.log(`   ✅ ${matchMessagesSnapshot.size} messages deleted from match ${matchId}`)
      }
    }
    
    console.log(`✅ All chat messages cleaned up`)
    
    // Step 4: Commit the batch
    await batch.commit()
    console.log('✅ All user data deleted')
    
    // Step 5: ✅ CRITICAL - Handle phoneIdentity based on timer status
    if (hasActiveTimer) {
      console.log(`🔒 Preserving phoneIdentity timer: ${Math.floor(timerRemaining / 60)} minutes remaining`)
      console.log('   This prevents re-registration exploit')
    } else {
      // ✅ FIX: No active timer - reset passes for clean re-registration
      console.log('✅ No active timer - resetting phoneIdentity for clean re-registration')
      await updateDoc(phoneRef, {
        passesLeft: 1,
        passesUsedToday: 0,
        matchesCountToday: 0,
        lockedUntil: null,
        lastPassReset: Timestamp.now()
      })
    }
    
    // Return success with timer info
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
 * (Maybe you want to prevent deletion during active matches, etc.)
 */
export const canDeleteAccount = async (userId: string): Promise<{
  canDelete: boolean
  reason?: string
}> => {
  try {
    // Check if user has active matches in activeMatches collection
    const activeMatchesQuery = query(
      collection(db, 'activeMatches'),
      where('users', 'array-contains', userId),
      where('isActive', '==', true)
    )
    
    const activeMatches = await getDocs(activeMatchesQuery)
    
    // ✅ Allow deletion even with active matches - we'll notify the other user
    // This is better UX than blocking deletion
    
    return { canDelete: true }
    
  } catch (error) {
    console.error('Error checking if can delete:', error)
    return {
      canDelete: true  // Allow deletion even if check fails
    }
  }
}
