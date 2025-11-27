import { useState, useEffect } from 'react'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Custom hook to manage user's "Available Now" status
 * Handles:
 * - Real-time status sync with Firestore
 * - Optimistic UI updates
 * - Error handling
 */
export function useAvailableStatus(userId: string | null) {
  const [isAvailable, setIsAvailable] = useState(true) // Default: ON
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Real-time listener for status changes
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const userRef = doc(db, 'users', userId)
    
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          // Default to true if field doesn't exist
          setIsAvailable(data.isAvailable ?? true)
        } else {
          setIsAvailable(true)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error listening to available status:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  /**
   * Toggle available status
   * Uses optimistic updates for instant UI feedback
   */
  const toggleAvailable = async (newState: boolean) => {
    if (!userId) {
      console.error('No user ID provided')
      return
    }

    // Optimistic update
    const previousState = isAvailable
    setIsAvailable(newState)
    
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        isAvailable: newState,
        lastAvailableToggle: new Date(),
      })
      
      console.log(`✅ Available status updated: ${newState}`)
    } catch (err: any) {
      console.error('❌ Error updating available status:', err)
      // Rollback on error
      setIsAvailable(previousState)
      setError(err.message)
      throw err
    }
  }

  return {
    isAvailable,
    loading,
    error,
    toggleAvailable,
  }
}
