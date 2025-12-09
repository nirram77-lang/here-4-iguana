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

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
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
    
    // ✅ Set persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('✅ Auth persistence set'))
      .catch((error) => console.error('❌ Persistence error:', error))
    
    // ✅ Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔄 Auth state:', currentUser?.email || 'No user')
      setUser(currentUser)
      setLoading(false)
      setInitializing(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
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
    // ✅ Logout from OneSignal first (unlink device from user)
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

  // ✅ Show nothing while initializing (very brief)
  if (initializing) {
    return null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
