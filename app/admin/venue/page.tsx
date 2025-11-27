"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  Bell, 
  Send,
  Clock,
  LogOut,
  Download,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getVenue, Venue, incrementNotificationCount } from '@/lib/venue-service'
import { getAdminData, getVenueAdminVenueId, adminLogout } from '@/lib/admin-auth'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, query, where, limit, getDocs, Timestamp, doc, onSnapshot } from 'firebase/firestore'

interface SystemNotification {
  id: string
  message: string
  venueId: string
  venueName: string
  sentAt: Timestamp
  delivered: number
  clicked: number
}

export default function VenueAdminPanel() {
  const router = useRouter()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const [recentNotifications, setRecentNotifications] = useState<SystemNotification[]>([])
  
  // Notification form
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  // Quick emoji picker
  const quickEmojis = ['🍺', '🍸', '🍹', '🎵', '🎉', '🔥', '⚡', '🎊', '💃', '🕺']

  // Load venue data
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/admin/login')
          return
        }

        // Verify venue admin
        const adminData = await getAdminData(user.uid)
        if (!adminData || adminData.role !== 'venue') {
          console.error('❌ Not a venue admin')
          router.push('/admin/login')
          return
        }

        setAdminEmail(adminData.email)

        // Get venue ID
        const loadedVenueId = await getVenueAdminVenueId(user.uid)
        if (!loadedVenueId) {
          console.error('❌ No venue assigned')
          alert('No venue assigned to this admin account')
          return
        }

        setVenueId(loadedVenueId)

        // Load venue
        const venueData = await getVenue(loadedVenueId)
        if (venueData) {
          setVenue(venueData)
          console.log('✅ Venue loaded:', venueData.displayName)
          
          // Load recent notifications
          await loadRecentNotifications(loadedVenueId)
        }
        
      } catch (error) {
        console.error('❌ Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Real-time listener for venue updates
  useEffect(() => {
    if (!venueId) return

    console.log('👁️ Setting up real-time listener for venue:', venueId)
    
    const unsubscribe = onSnapshot(
      doc(db, 'venues', venueId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedVenue = docSnapshot.data() as Venue
          setVenue(updatedVenue)
          console.log(`🔄 Venue updated - Active users: ${updatedVenue.checkedInUsers?.length || 0}`)
        }
      },
      (error) => {
        console.error('❌ Error listening to venue:', error)
      }
    )

    return () => {
      console.log('👋 Cleaning up venue listener')
      unsubscribe()
    }
  }, [venueId])

  // ✅ FIXED: Read all and filter in JavaScript - no index needed!
  const loadRecentNotifications = async (venueId: string) => {
    try {
      console.log('📋 Loading notifications for venue:', venueId)
      
      // Get ALL systemNotifications, filter in JS (no index needed)
      const snapshot = await getDocs(collection(db, 'systemNotifications'))
      const notifs: SystemNotification[] = []
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        // Filter by venueId in JavaScript
        if (data.venueId === venueId) {
          notifs.push({ id: docSnap.id, ...data } as SystemNotification)
        }
      })
      
      // Sort in memory (newest first)
      notifs.sort((a, b) => {
        const timeA = a.sentAt?.toMillis?.() || 0
        const timeB = b.sentAt?.toMillis?.() || 0
        return timeB - timeA
      })
      
      setRecentNotifications(notifs.slice(0, 10))
      console.log(`✅ Loaded ${notifs.length} notifications`)
    } catch (error) {
      console.error('❌ Error loading notifications:', error)
    }
  }

  const handleSendNotification = async () => {
    if (!venue || !message.trim()) return

    if (message.length > 40) {
      alert('Message must be 40 characters or less')
      return
    }

    setSending(true)

    try {
      console.log('📢 Sending notification...')
      
      const checkedInUsers = venue.checkedInUsers || []
      
      if (checkedInUsers.length === 0) {
        alert('⚠️ No users checked in right now')
        setSending(false)
        return
      }

      // Send to each user
      const notificationPromises = checkedInUsers.map(async (userId: string) => {
        try {
          // ✅ FIXED: Send to TOP-LEVEL notifications collection (where app listens!)
          await addDoc(collection(db, 'notifications'), {
            userId: userId,  // ← Important! This is how we filter
            type: 'venue_announcement',
            title: `📢 ${venue.displayName || venue.name}`,
            subtitle: message.trim(),
            icon: '📢',
            venueId: venue.id,
            venueName: venue.name,
            timestamp: Timestamp.now(),
            isRead: false
          })
          console.log(`✅ Sent to user: ${userId}`)
        } catch (error) {
          console.error(`Failed to send to ${userId}:`, error)
        }
      })

      await Promise.all(notificationPromises)

      // Save to systemNotifications for tracking
      await addDoc(collection(db, 'systemNotifications'), {
        type: 'venue_announcement',
        venueId: venue.id,
        venueName: venue.name,
        message: message.trim(),
        targetUsers: checkedInUsers,
        sentAt: Timestamp.now(),
        sentBy: adminEmail,
        delivered: checkedInUsers.length,
        clicked: 0,
        active: true
      })

      await incrementNotificationCount(venue.id)

      console.log(`✅ Notification sent to ${checkedInUsers.length} users`)
      
      setSuccess(true)
      setMessage('')
      
      // Reload notifications list
      await loadRecentNotifications(venue.id)
      
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (error) {
      console.error('❌ Error sending notification:', error)
      alert('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await adminLogout()
      router.push('/admin/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  const handleDownloadQR = () => {
    if (!venue?.qrCode) return
    const link = document.createElement('a')
    link.href = venue.qrCode
    link.download = `${venue.name}-QR-Code.png`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-8xl"
        >
          🦎
        </motion.div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]">
        <p className="text-white text-xl">No venue found</p>
      </div>
    )
  }

  const activeUsers = venue.checkedInUsers?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d2920] to-[#0d2920]/80 border-b border-[#4ade80]/30 shadow-2xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🦎</div>
              <div>
                <h1 className="text-2xl font-black text-white">
                  {venue.displayName || venue.name}
                </h1>
                <p className="text-[#4ade80] text-sm font-semibold">
                  Venue Admin
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-4"
          >
            <div className="text-center">
              <p className="text-white/60 text-xs mb-1">Active Now</p>
              <p className="text-3xl font-black text-[#4ade80]">
                {activeUsers}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-4"
          >
            <div className="text-center">
              <p className="text-white/60 text-xs mb-1">Total Check-ins</p>
              <p className="text-3xl font-black text-white">
                {venue.stats?.totalCheckIns || 0}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-4"
          >
            <div className="text-center">
              <p className="text-white/60 text-xs mb-1">Notifications Sent</p>
              <p className="text-3xl font-black text-white">
                {venue.stats?.notificationsSent || 0}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Send Notification */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-[#4ade80]" />
            <h2 className="text-xl font-bold text-white">Send Notification</h2>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-[#4ade80]/20 border border-[#4ade80]/50 rounded-xl text-[#4ade80] text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              ✅ Notification sent to {activeUsers} users!
            </motion.div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/80 text-sm font-medium">
                Your Message (max 40 chars)
              </label>
              <span className="text-white/40 text-xs">
                {message.length}/40
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 40))}
              placeholder="Happy Hour! 50% off 5-7pm"
              className="bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40 resize-none h-20"
              maxLength={40}
            />
          </div>

          {/* Quick Emojis */}
          <div className="mb-4">
            <p className="text-white/60 text-xs mb-2">Quick Emojis:</p>
            <div className="flex gap-2 flex-wrap">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setMessage(prev => (prev + emoji).slice(0, 40))}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={!message.trim() || message.length > 40 || sending || activeUsers === 0}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] rounded-xl disabled:opacity-50"
          >
            {sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.div>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send to {activeUsers} Users
              </>
            )}
          </Button>
          
          {activeUsers === 0 && (
            <p className="text-center text-white/40 text-sm mt-2">
              No users checked in right now
            </p>
          )}
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Your QR Code</h2>
          
          <div className="flex items-center gap-6">
            {venue.qrCode && (
              <img 
                src={venue.qrCode} 
                alt="Venue QR Code" 
                className="w-32 h-32 rounded-xl bg-white p-2"
              />
            )}
            <div>
              <p className="text-white/60 text-sm mb-4">
                Place this QR code at your venue entrance for customers to check in
              </p>
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20"
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Recent Notifications */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Recent Notifications</h2>
          
          {recentNotifications.length === 0 ? (
            <p className="text-white/40 text-center py-8">No notifications sent yet</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="bg-[#0d2920]/50 rounded-xl p-4 border border-[#4ade80]/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{notif.message}</p>
                      <p className="text-white/40 text-xs mt-1">
                        Sent to {notif.delivered} users
                      </p>
                    </div>
                    <div className="text-white/40 text-xs">
                      {notif.sentAt?.toDate?.()?.toLocaleDateString?.() || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
