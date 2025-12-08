"use client"

/**
 * 🦎 I4IGUANA - Push Notification Permission Modal
 * 
 * Beautiful modal to request notification permission from users.
 * Uses OneSignal for push notifications.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, MessageCircle, Heart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export default function NotificationPermissionModal({
  isOpen,
  onClose,
  userId,
  onPermissionGranted,
  onPermissionDenied
}: NotificationPermissionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnableNotifications = async () => {
    setLoading(true)
    setError(null)

    // Safety timeout - close modal after 15 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      console.log('⏱️ Safety timeout - closing modal')
      setLoading(false)
      onClose()
    }, 15000)

    try {
      // ✅ STEP 1: Request browser permission FIRST (this shows the native browser prompt)
      console.log('🔔 Step 1: Requesting browser notification permission...')
      
      // Check if Notification API is supported
      if (!('Notification' in window)) {
        console.log('❌ Notifications not supported in this browser')
        setError('Notifications are not supported in this browser. Please use Chrome or Firefox.')
        clearTimeout(safetyTimeout)
        setLoading(false)
        return
      }
      
      // Request permission - this triggers the native browser popup
      const permission = await Notification.requestPermission()
      console.log('🔔 Browser permission result:', permission)
      
      if (permission === 'granted') {
        console.log('✅ Browser permission granted!')
        
        // ✅ STEP 2: Setup OneSignal (with fallback for older devices)
        try {
          // Wait for OneSignal to be ready
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          const OneSignal = (window as any).OneSignal
          
          if (OneSignal) {
            console.log('🔔 Step 2: Setting up OneSignal...')
            
            // Helper function with timeout
            const withTimeout = (promise: Promise<any>, ms: number) => {
              return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
              ])
            }
            
            // Check if OneSignal User API is available (v16)
            if (OneSignal.User && OneSignal.User.PushSubscription) {
              // Opt in to push notifications
              try {
                await withTimeout(OneSignal.User.PushSubscription.optIn(), 5000)
                console.log('✅ OneSignal optIn successful')
              } catch (optInError: any) {
                console.log('⚠️ OneSignal optIn error:', optInError.message)
                // Try alternative method
                try {
                  await withTimeout(OneSignal.Notifications.requestPermission(), 5000)
                  console.log('✅ OneSignal requestPermission successful (fallback)')
                } catch (e) {
                  console.log('⚠️ OneSignal fallback also failed:', e)
                }
              }
              
              // Link user ID for targeting
              if (userId) {
                try {
                  await withTimeout(OneSignal.login(userId), 5000)
                  console.log('✅ OneSignal user linked:', userId)
                } catch (loginError: any) {
                  console.log('⚠️ OneSignal login error:', loginError.message)
                  // Try setExternalUserId as fallback (older API)
                  try {
                    if (OneSignal.setExternalUserId) {
                      await OneSignal.setExternalUserId(userId)
                      console.log('✅ OneSignal setExternalUserId successful (fallback)')
                    }
                  } catch (e) {
                    console.log('⚠️ setExternalUserId fallback failed:', e)
                  }
                }
              }
            } else {
              // Older OneSignal API fallback
              console.log('⚠️ Using older OneSignal API...')
              if (OneSignal.registerForPushNotifications) {
                await OneSignal.registerForPushNotifications()
              }
              if (userId && OneSignal.setExternalUserId) {
                await OneSignal.setExternalUserId(userId)
              }
            }
            
            console.log('✅ OneSignal setup complete')
          } else {
            console.log('⚠️ OneSignal not available - browser notifications still enabled')
          }
        } catch (oneSignalError) {
          console.log('⚠️ OneSignal error (notifications may still work):', oneSignalError)
        }
        
        // ✅ STEP 3: Show success message
        console.log('✅ Notifications enabled successfully!')
        clearTimeout(safetyTimeout)
        onPermissionGranted?.()
        onClose()
        
      } else if (permission === 'denied') {
        clearTimeout(safetyTimeout)
        setError('Notifications were blocked. To enable them, go to your browser settings → Site Settings → Notifications → Allow for i4iguana.com')
        onPermissionDenied?.()
        setLoading(false)
      } else {
        // Permission dismissed
        console.log('ℹ️ Permission dismissed by user')
        clearTimeout(safetyTimeout)
        onClose()
      }
    } catch (err: any) {
      console.error('Error enabling notifications:', err)
      setError(`Error: ${err.message || 'Unknown error'}`)
      clearTimeout(safetyTimeout)
      setLoading(false)
    }
  }

  const handleMaybeLater = () => {
    console.log('📌 User chose "Maybe Later" for notifications')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50"
          >
            <div className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl border-2 border-[#4ade80]/30 shadow-2xl overflow-hidden">
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                
                {/* Icon Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    {/* Animated Rings */}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-[#4ade80]/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 rounded-full bg-[#4ade80]/20"
                    />
                    
                    {/* Main Icon */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Bell className="h-12 w-12 text-[#0d2920]" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white text-center mb-2"
                >
                  Don't Miss a Match! 💚
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 text-center text-sm mb-6"
                >
                  Get notified when someone likes you or sends a message
                </motion.p>

                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 mb-6"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">New Matches</p>
                      <p className="text-white/50 text-xs">Know instantly when you match</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Messages</p>
                      <p className="text-white/50 text-xs">Never miss a conversation</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Special Events</p>
                      <p className="text-white/50 text-xs">Venue announcements & more</p>
                    </div>
                  </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-base rounded-xl"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[#0d2920] border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Bell className="mr-2 h-5 w-5" />
                        Enable Notifications
                      </>
                    )}
                  </Button>

                  <button
                    onClick={handleMaybeLater}
                    className="w-full py-3 text-white/60 hover:text-white text-sm font-medium transition-colors"
                  >
                    Maybe Later
                  </button>
                </motion.div>

                {/* Privacy Note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white/30 text-xs text-center mt-4"
                >
                  You can change this anytime in settings
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
