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
  signInWithRedirect,
  getRedirectResult
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

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    console.log('🔄 Initializing authentication...')
    
    // ✅ FIX: Handle redirect result for mobile devices (Samsung, etc.)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          console.log('✅ Redirect result received:', result.user.email)
        }
      } catch (error: any) {
        console.error('❌ Redirect result error:', error.code, error.message)
        // Don't throw - just log the error and continue
      }
    }
    
    handleRedirectResult()
    
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
    
    const mobile = isMobile()
    console.log(`📱 Device type: ${mobile ? 'Mobile' : 'Desktop'}`)
    
    try {
      if (mobile) {
        console.log('📱 Using redirect flow for mobile')
        await signInWithRedirect(auth, provider)
      } else {
        console.log('💻 Using popup flow for desktop')
        await signInWithPopup(auth, provider)
      }
    } catch (error: any) {
      console.error(`❌ Google sign-in error:`, error.code, error.message)
      throw error
    }
  }

  const logout = async () => {
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

  return (
    <AuthContext.Provider value={value}>
      {!initializing && children}
    </AuthContext.Provider>
  )
}