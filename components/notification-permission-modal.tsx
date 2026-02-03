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
import { GA } from '@/lib/ga-events'
import { useLanguage } from '@/lib/LanguageContext'
// ✅ v2.8.34: Use robust OneSignal service
import { linkOneSignalToUser } from '@/lib/onesignal-service'

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
  const { t, isRTL } = useLanguage()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnableNotifications = async () => {
    setLoading(true)
    setError(null)
    
    console.log('═══════════════════════════════════════════════════')
    console.log('🔔 NOTIFICATION PERMISSION FLOW STARTED')
    console.log('═══════════════════════════════════════════════════')
    console.log('👤 User ID:', userId)
    
    // 📊 Track permission requested
    GA.notificationPermissionRequested()

    // Safety timeout - close modal after 20 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      console.log('⏱️ Safety timeout - closing modal')
      setLoading(false)
      onClose()
    }, 20000)

    try {
      // ✅ iOS Detection
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches
      
      // Check if Notification API is supported
      if (!('Notification' in window)) {
        console.log('❌ Notifications not supported in this browser')
        
        // ✅ Special message for iOS Safari (not PWA)
        if (isIOS && !isStandalone) {
          setError('📱 להתראות באייפון:\n1. לחץ על כפתור השיתוף (↑)\n2. בחר "הוסף למסך הבית"\n3. פתח את האפליקציה ממסך הבית\n4. אז התראות יעבדו!')
        } else {
          setError('Notifications are not supported in this browser.')
        }
        clearTimeout(safetyTimeout)
        setLoading(false)
        return
      }
      
      // ✅ Check CURRENT permission status FIRST
      const currentPermission = Notification.permission
      console.log('🔔 Current browser permission status:', currentPermission)
      
      // ✅ If already denied, show helpful message
      if (currentPermission === 'denied') {
        console.log('❌ Browser permission already denied')
        clearTimeout(safetyTimeout)
        setError('Notifications were blocked. Go to browser settings → Site Settings → Notifications → Allow for i4iguana.com')
        GA.notificationPermissionDenied()
        onPermissionDenied?.()
        setLoading(false)
        return
      }
      
      // ✅ CRITICAL: Wait for OneSignal to be ready
      console.log('🔔 Waiting for OneSignal SDK...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const OneSignal = (window as any).OneSignal
      
      if (!OneSignal) {
        console.error('❌ OneSignal SDK not loaded!')
        // Fallback: Try browser API directly
        console.log('🔔 Trying browser API fallback...')
        const permission = await Notification.requestPermission()
        console.log('🔔 Browser permission result:', permission)
        if (permission === 'granted') {
          GA.notificationPermissionGranted()
          onPermissionGranted?.()
        } else {
          GA.notificationPermissionDenied()
          onPermissionDenied?.()
        }
        clearTimeout(safetyTimeout)
        setLoading(false)
        onClose()
        return
      }
      
      console.log('✅ OneSignal SDK found!')
      
      // ✅ STEP 1: Use OneSignal's API to request permission AND subscribe
      // This is the CORRECT way - OneSignal handles everything!
      try {
        console.log('═══════════════════════════════════════════════════')
        console.log('🔔 STEP 1: Requesting permission via OneSignal...')
        console.log('═══════════════════════════════════════════════════')
        
        // Check if OneSignal has the v16 API
        if (OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
          // ✅ v16 API - This triggers the browser prompt!
          console.log('🔔 Calling OneSignal.Notifications.requestPermission()...')
          const permissionResult = await OneSignal.Notifications.requestPermission()
          console.log('🔔 OneSignal permission result:', permissionResult)
        } else if (OneSignal.User && OneSignal.User.PushSubscription) {
          // ✅ Try optIn which also requests permission
          console.log('🔔 Calling OneSignal.User.PushSubscription.optIn()...')
          await OneSignal.User.PushSubscription.optIn()
          console.log('✅ OneSignal optIn completed')
        } else if (OneSignal.registerForPushNotifications) {
          // Legacy API
          console.log('🔔 Using legacy registerForPushNotifications...')
          await OneSignal.registerForPushNotifications()
        }
        
        // ✅ Wait a moment for subscription to register
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // ✅ Check if subscription was successful
        let isSubscribed = false
        if (OneSignal.User && OneSignal.User.PushSubscription) {
          isSubscribed = await OneSignal.User.PushSubscription.optedIn
          console.log('🔔 OneSignal subscription status:', isSubscribed)
        }
        
        // ✅ STEP 2: Link user ID using robust service (v2.8.34)
        if (userId) {
          console.log('═══════════════════════════════════════════════════')
          console.log('🔗 STEP 2: Linking user to OneSignal (v2.8.34)')
          console.log('   User ID:', userId)
          console.log('═══════════════════════════════════════════════════')
          
          // ✅ Use new robust service that saves to Firestore!
          const linkStatus = await linkOneSignalToUser(userId)
          
          if (linkStatus.isLinked) {
            console.log('✅ OneSignal linked and saved to Firestore!')
            console.log('   Player ID:', linkStatus.playerId)
            console.log('   Subscribed:', linkStatus.subscribed)
          } else if (linkStatus.error) {
            console.warn('⚠️ OneSignal link issue:', linkStatus.error)
          }
        }
        
        // ✅ Check final status and respond
        const finalPermission = Notification.permission
        console.log('🔔 Final browser permission:', finalPermission)
        
        if (finalPermission === 'granted' || isSubscribed) {
          console.log('═══════════════════════════════════════════════════')
          console.log('✅ NOTIFICATIONS FULLY ENABLED!')
          console.log('═══════════════════════════════════════════════════')
          GA.notificationPermissionGranted()
          onPermissionGranted?.()
        } else if (finalPermission === 'denied') {
          setError('Notifications were blocked. Check browser settings.')
          GA.notificationPermissionDenied()
          onPermissionDenied?.()
        } else {
          // Permission dismissed
          console.log('ℹ️ Permission dismissed by user')
        }
        
        clearTimeout(safetyTimeout)
        setLoading(false)
        onClose()
        
      } catch (oneSignalError: any) {
        console.error('❌ OneSignal error:', oneSignalError)
        
        // ✅ Fallback: Try browser API directly
        console.log('🔔 Trying browser API as fallback...')
        try {
          const permission = await Notification.requestPermission()
          console.log('🔔 Browser fallback result:', permission)
          
          if (permission === 'granted') {
            GA.notificationPermissionGranted()
            onPermissionGranted?.()
          } else {
            GA.notificationPermissionDenied()
            onPermissionDenied?.()
          }
        } catch (browserError) {
          console.error('❌ Browser API also failed:', browserError)
        }
        
        clearTimeout(safetyTimeout)
        setLoading(false)
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
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {t('notifications.dontMiss')}
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 text-center text-sm mb-6"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {t('notifications.getNotified')}
                </motion.p>

                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 mb-6"
                >
                  <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-pink-400" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-white font-medium text-sm">{t('notifications.newMatches')}</p>
                      <p className="text-white/50 text-xs">{t('notifications.knowInstantly')}</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-white font-medium text-sm">{t('notifications.messages')}</p>
                      <p className="text-white/50 text-xs">{t('notifications.neverMiss')}</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-white font-medium text-sm">{t('notifications.specialEvents')}</p>
                      <p className="text-white/50 text-xs">{t('notifications.venueAnnouncements')}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-sm text-right whitespace-pre-line"
                    dir={error.includes('📱') ? 'rtl' : 'ltr'}
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
                        <Bell className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                        {t('notifications.enableNotifications')}
                      </>
                    )}
                  </Button>

                  <button
                    onClick={handleMaybeLater}
                    className="w-full py-3 text-white/60 hover:text-white text-sm font-medium transition-colors"
                  >
                    {t('notifications.maybeLater')}
                  </button>
                </motion.div>

                {/* Privacy Note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white/30 text-xs text-center mt-4"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {t('notifications.privacyNote')}
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
