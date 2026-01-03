"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth'
import { auth } from './firebase'
import { unsubscribeFromPushNotifications } from './firebase-messaging'  // ✅ v2.8.6

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    console.log('🔄 Initializing authentication...')
    
    let unsubscribe: () => void = () => {}
    let authStateReceived = false
    
    // ✅ CRITICAL: Set a flag to prevent premature navigation
    // This tells the app to WAIT for auth state before navigating
    if (typeof window !== 'undefined') {
      localStorage.setItem('i4iguana_auth_initializing', 'true')
    }
    
    // ✅ FIXED: Set persistence and WAIT for it before listening to auth state
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
        console.log('✅ Auth persistence set to LOCAL')
      } catch (error) {
        console.error('❌ Persistence error:', error)
      }
      
      // ✅ Now listen for auth state changes (after persistence is set)
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('🔄 Auth state changed:', currentUser?.email || 'No user')
        authStateReceived = true
        setUser(currentUser)
        setLoading(false)
        setInitializing(false)
        
        // ✅ Clear the initializing flag - auth state is now known
        if (typeof window !== 'undefined') {
          localStorage.removeItem('i4iguana_auth_initializing')
        }
      })
      
      // ✅ SAFETY: If no auth state received after 3 seconds, clear loading
      // This handles edge cases where onAuthStateChanged never fires
      setTimeout(() => {
        if (!authStateReceived) {
          console.log('⚠️ No auth state received after 3s, assuming no user')
          setLoading(false)
          setInitializing(false)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('i4iguana_auth_initializing')
          }
        }
      }, 3000)
    }
    
    initAuth()

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account'
    })
    
    try {
      // ✅ Always use popup - works on both mobile and desktop
      console.log('🔐 Using popup flow for Google sign-in')
      await setPersistence(auth, browserLocalPersistence)
      const result = await signInWithPopup(auth, provider)
      console.log('✅ Sign-in successful:', result.user.email)
      
      // ✅ CRITICAL: Save Google displayName to localStorage IMMEDIATELY!
      // This ensures the name is saved BEFORE any navigation or state changes
      if (result.user.displayName) {
        console.log('💾 Saving Google displayName to localStorage:', result.user.displayName)
        localStorage.setItem('googleDisplayName', result.user.displayName)
        console.log('💾 Verify saved:', localStorage.getItem('googleDisplayName'))
      } else {
        console.log('⚠️ No displayName from Google - user.displayName is:', result.user.displayName)
      }
      
      return result.user
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error.code, error.message)
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked - please allow popups for this site')
      } else {
        throw error
      }
    }
  }

  const logout = async () => {
    // ✅ v2.8.6: Unsubscribe from FCM push notifications FIRST
    try {
      if (user?.uid) {
        console.log('🔔 Unsubscribing from FCM push notifications...');
        await unsubscribeFromPushNotifications(user.uid);
        console.log('   ✓ FCM unsubscribe successful');
      }
    } catch (fcmError) {
      console.log('⚠️ FCM unsubscribe error (continuing anyway):', fcmError);
    }
    
    // ✅ Clear ONLY authentication flags - NOT match state!
    // Match state stays because the match is still active in Firestore
    // When user logs back in, checkAuth will restore their match from Firestore
    localStorage.removeItem('i4iguana_was_authenticated')
    localStorage.removeItem('i4iguana_auth_wait_start')
    localStorage.removeItem('i4iguana_auth_initializing')
    // ✅ DON'T remove these - user might log back in and continue their match:
    // - i4iguana_last_screen (they'll return to same screen)
    // - i4iguana_enjoy_mode (they're still in a meeting!)
    // - i4iguana_matched_user_id (match is still active)
    // - i4iguana_phone_verified (phone is still verified)
    console.log('🧹 Cleared auth flags only (match state preserved)')
    
    // ✅ Logout from OneSignal (unlink device from user)
    try {
      const OneSignal = (window as any).OneSignal;
      if (OneSignal) {
        console.log('🔔 Logging out from OneSignal...');
        if (OneSignal.logout) {
          await OneSignal.logout();
          console.log('   ✓ OneSignal logout successful');
        } else if (OneSignal.removeExternalUserId) {
          await OneSignal.removeExternalUserId();
          console.log('   ✓ OneSignal removeExternalUserId successful');
        }
      }
    } catch (oneSignalError) {
      console.log('⚠️ OneSignal logout error (continuing anyway):', oneSignalError);
    }
    
    await signOut(auth)
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout
  }

  // ✅ REMOVED: No more null return during initializing
  // The HTML splash screen handles the loading state now

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
