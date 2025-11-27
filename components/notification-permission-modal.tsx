"use client"

/**
 * 🦎 I4IGUANA - Push Notification Permission Modal
 * 
 * Beautiful modal to request notification permission from users.
 * Shows benefits and handles permission request.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, X, MessageCircle, Heart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  requestNotificationPermission, 
  getFCMToken,
  getNotificationPermissionStatus,
  setupPushNotifications
} from '@/lib/firebase-messaging'

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
  const [currentStatus, setCurrentStatus] = useState<string>('default')

  useEffect(() => {
    if (isOpen) {
      const status = getNotificationPermissionStatus()
      setCurrentStatus(status)
    }
  }, [isOpen])

  const handleEnableNotifications = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await setupPushNotifications(userId)
      
      if (result.success) {
        console.log('✅ Notifications enabled successfully!')
        onPermissionGranted?.()
        onClose()
      } else if (result.permission === 'denied') {
        setError('Notifications were blocked. Please enable them in your browser settings.')
        onPermissionDenied?.()
      } else {
        setError('Could not enable notifications. Please try again.')
      }
    } catch (err) {
      console.error('Error enabling notifications:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMaybeLater = () => {
    console.log('📌 User chose "Maybe Later" for notifications')
    onClose()
  }

  // Don't render if already granted
  if (currentStatus === 'granted') {
    return null
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

/**
 * ✅ Small banner for notification prompt (less intrusive)
 */
export function NotificationBanner({
  onEnable,
  onDismiss
}: {
  onEnable: () => void
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-4 right-4 z-40"
    >
      <div className="bg-gradient-to-r from-[#1a4d3e] to-[#0d2920] rounded-2xl border border-[#4ade80]/30 shadow-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-[#4ade80]" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">Enable notifications?</p>
            <p className="text-white/50 text-xs truncate">Get notified about matches & messages</p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={onEnable}
              className="px-4 py-2 bg-[#4ade80] text-[#0d2920] rounded-lg font-medium text-sm hover:bg-[#3bc970] transition-colors"
            >
              Enable
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
