"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, Bell, User, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore"
import { 
  Notification, 
  markNotificationAsRead, 
  deleteNotification,
  getUnreadNotificationCount 
} from "@/lib/firestore-service"

interface NotificationsScreenProps {
  onNavigate: (screen: "home" | "notifications" | "profile" | "match" | "chat") => void
  hasActiveMatch?: boolean
  onNotificationClick?: (notification: Notification) => void
}

// ✅ NEW: Grouped notification type
interface GroupedNotification {
  id: string
  senderId: string
  senderName: string
  senderPhoto?: string
  chatId?: string
  type: 'message' | 'match' | 'like' | 'other'
  lastMessage: string
  count: number
  isRead: boolean
  timestamp: any
  notifications: Notification[]
}

export default function NotificationsScreen({ 
  onNavigate, 
  hasActiveMatch = false,
  onNotificationClick 
}: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null)  // ✅ NEW: For full view

  // ✅ NEW: Group notifications by sender
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, GroupedNotification>()
    
    notifications.forEach(notif => {
      // Group key: senderId + type (messages from same person grouped together)
      const groupKey = `${notif.senderId || 'unknown'}_${notif.type || 'message'}`
      
      if (groups.has(groupKey)) {
        const existing = groups.get(groupKey)!
        existing.count++
        existing.notifications.push(notif)
        // Update to latest message
        const existingTime = existing.timestamp?.toMillis?.() || 0
        const newTime = notif.timestamp?.toMillis?.() || notif.createdAt?.toMillis?.() || 0
        if (newTime > existingTime) {
          existing.lastMessage = notif.body || notif.message || ''
          existing.timestamp = notif.timestamp || notif.createdAt
        }
        // If any unread, mark group as unread
        if (!notif.isRead) {
          existing.isRead = false
        }
      } else {
        groups.set(groupKey, {
          id: groupKey,
          senderId: notif.senderId || notif.fromUserId || '',
          senderName: notif.senderName || notif.fromUserName || notif.title?.replace('💬 ', '').replace('💚 ', '') || 'Unknown',
          senderPhoto: notif.senderPhoto || notif.fromUserPhoto,
          chatId: notif.chatId,
          type: notif.type as any || 'message',
          lastMessage: notif.body || notif.message || '',
          count: 1,
          isRead: notif.isRead || false,
          timestamp: notif.timestamp || notif.createdAt,
          notifications: [notif]
        })
      }
    })
    
    // Convert to array and sort by timestamp
    return Array.from(groups.values()).sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || 0
      const timeB = b.timestamp?.toMillis?.() || 0
      return timeB - timeA
    })
  }, [notifications])

  // 🔄 Real-time notifications listener
  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    console.log('📬 Setting up real-time notifications listener...')

    // ✅ FIXED: Listen to top-level notifications collection (where they're actually stored!)
    const notificationsRef = collection(db, 'notifications')
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid)
      // Note: Removed orderBy to avoid index requirement - sorting done client-side
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = []
      snapshot.forEach(doc => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification)
      })
      
      // ✅ Sort by timestamp descending (client-side)
      notifs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || a.createdAt?.toMillis?.() || 0
        const timeB = b.timestamp?.toMillis?.() || b.createdAt?.toMillis?.() || 0
        return timeB - timeA
      })
      
      setNotifications(notifs)
      setLoading(false)
      console.log(`📬 Loaded ${notifs.length} notifications (real-time)`)
      
      // Count unread
      const unread = notifs.filter(n => !n.isRead).length
      setUnreadCount(unread)
    }, (error) => {
      console.error('❌ Error in notifications listener:', error)
      setLoading(false)
    })

    // Cleanup listener on unmount
    return () => {
      console.log('🔇 Unsubscribing from notifications listener')
      unsubscribe()
    }
  }, [])

  // Handle notification click
  // ✅ FIXED: First click = select, Second click = view/navigate
  const handleNotificationClick = async (notification: Notification) => {
    try {
      const user = auth.currentUser
      if (!user) return
      
      // First click: Select the notification
      if (selectedNotificationId !== notification.id) {
        setSelectedNotificationId(notification.id)
        console.log(`📌 Notification selected: ${notification.id}`)
        
        // Mark as read on first click
        if (!notification.isRead && user) {
          await markNotificationAsRead(user.uid, notification.id)
        }
        return  // Don't navigate on first click
      }
      
      // Second click: ALWAYS open full view modal (ALL notification types!)
      console.log(`🚀 Opening full notification view: ${notification.id}`)
      setSelectedNotificationId(null)  // Clear selection
      setViewingNotification(notification)
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }
  
  // ✅ NEW: Clear selection when clicking outside
  const clearSelection = () => {
    setSelectedNotificationId(null)
  }

  // Handle delete notification
  const handleDelete = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering click on notification
    
    try {
      const user = auth.currentUser
      if (!user) return
      
      await deleteNotification(user.uid, notificationId)
      setSelectedNotificationId(null)  // ✅ Clear selection after delete
      console.log('🗑️ Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Format time ago - ✅ FIXED: Handle both timestamp and createdAt, and null
  const formatTimeAgo = (timestamp: Timestamp | undefined): string => {
    if (!timestamp || !timestamp.toDate) return 'Just now'
    
    try {
      const now = new Date()
      const notifTime = timestamp.toDate()
      const diffMs = now.getTime() - notifTime.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
    
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch (error) {
      console.error('Error formatting time:', error)
      return 'Just now'
    }
  }

  // Get color scheme based on notification type
  const getNotificationStyle = (type: Notification['type'], isRead: boolean) => {
    const baseStyle = {
      match: {
        bgColor: 'bg-[#4ade80]/20',
        borderColor: isRead ? 'border-[#4ade80]/20' : 'border-[#4ade80]/60',
        glowColor: 'shadow-[#4ade80]/20'
      },
      message: {
        bgColor: 'bg-blue-500/20',
        borderColor: isRead ? 'border-blue-500/20' : 'border-blue-500/60',
        glowColor: 'shadow-blue-500/20'
      },
      like: {
        bgColor: 'bg-pink-500/20',
        borderColor: isRead ? 'border-pink-500/20' : 'border-pink-500/60',
        glowColor: 'shadow-pink-500/20'
      },
      event: {
        bgColor: 'bg-orange-500/20',
        borderColor: isRead ? 'border-orange-500/20' : 'border-orange-500/60',
        glowColor: 'shadow-orange-500/20'
      },
      venue_announcement: {
        bgColor: 'bg-amber-500/20',
        borderColor: isRead ? 'border-amber-500/20' : 'border-amber-500/60',
        glowColor: 'shadow-amber-500/20'
      },
      meeting: {
        bgColor: 'bg-pink-500/20',
        borderColor: isRead ? 'border-pink-500/20' : 'border-pink-500/60',
        glowColor: 'shadow-pink-500/20'
      }
    }
    
    return baseStyle[type] || baseStyle.match
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      {/* 🎬 HOLLYWOOD HEADER - Deep shadows + glow */}
      <div className="relative flex items-center gap-4 p-4 bg-gradient-to-b from-[#0d2920] to-[#0d2920]/80 border-b border-[#4ade80]/30 shadow-2xl">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4ade80]/5 via-transparent to-[#4ade80]/5 blur-xl" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onNavigate(hasActiveMatch ? "match" : "home")} 
          className="relative z-10 rounded-full text-white hover:bg-white/10 transition-all hover:scale-110"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="relative z-10 flex-1">
          <h1 className="font-sans text-3xl font-black text-white tracking-tight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-[#4ade80] text-sm font-semibold mt-0.5">
              {unreadCount} new
            </p>
          )}
        </div>
      </div>

      {/* 📋 NOTIFICATIONS LIST */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            // Loading state
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block text-6xl"
              >
                🦎
              </motion.div>
              <p className="text-white/60 mt-4">Loading notifications...</p>
            </div>
          ) : groupedNotifications.length === 0 ? (
            // 🎬 HOLLYWOOD EMPTY STATE
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="text-8xl filter drop-shadow-2xl inline-block mb-6"
              >
                🦎
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                You're all caught up!
              </h2>
              <p className="text-white/50 text-base">
                No notifications yet. Start swiping to get matches!
              </p>
            </motion.div>
          ) : (
            // 🎬 HOLLYWOOD GROUPED NOTIFICATION CARDS
            <AnimatePresence mode="popLayout">
              {groupedNotifications.map((group, index) => {
                const style = getNotificationStyle(group.type as any, group.isRead)
                const isSelected = selectedNotificationId === group.id
                
                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      // Click the first (most recent) notification in the group
                      if (group.notifications.length > 0) {
                        handleNotificationClick(group.notifications[0])
                      }
                    }}
                    className={`
                      relative group
                      flex items-center gap-4 p-5 rounded-2xl 
                      bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80
                      backdrop-blur-md
                      border-2 ${isSelected 
                        ? 'border-[#4ade80] ring-2 ring-[#4ade80]/50 scale-[1.02]' 
                        : style.borderColor}
                      shadow-lg hover:shadow-2xl ${style.glowColor}
                      hover:scale-[1.02] hover:border-[#4ade80]
                      transition-all duration-300 cursor-pointer
                      ${!group.isRead && !isSelected ? 'ring-2 ring-[#4ade80]/30' : ''}
                    `}
                  >
                    {/* ✅ Selection indicator */}
                    {isSelected && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#4ade80] rounded-full" />
                    )}
                    
                    {/* Photo/Icon with glow */}
                    <div className={`
                      relative flex-shrink-0 h-16 w-16 rounded-full 
                      ${style.bgColor} 
                      border-2 ${style.borderColor}
                      flex items-center justify-center
                      shadow-lg group-hover:scale-110 transition-transform
                      overflow-hidden
                    `}>
                      {group.senderPhoto ? (
                        <img 
                          src={group.senderPhoto} 
                          alt={group.senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white/60" />
                      )}
                      
                      {/* Message count badge */}
                      {group.count > 1 && (
                        <div className="absolute -top-1 -right-1 bg-[#4ade80] text-[#0d2920] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                          {group.count > 9 ? '9+' : group.count}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-sans font-bold mb-1 text-lg flex items-center gap-2 ${
                        !group.isRead ? 'text-white' : 'text-white/80'
                      }`}>
                        {group.type === 'message' && <span className="text-white/80">💬</span>}
                        {group.type === 'match' && <span className="text-white/80">💚</span>}
                        {group.type === 'like' && <span className="text-white/80">❤️</span>}
                        {group.senderName}
                      </h3>
                      <p className="font-sans text-sm text-white/70 truncate">
                        {group.count > 1 
                          ? `${group.count} הודעות חדשות` 
                          : group.lastMessage
                        }
                      </p>
                    </div>

                    {/* Time & Unread indicator */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <span className="font-sans text-xs text-white/50 font-medium">
                        {formatTimeAgo(group.timestamp)}
                      </span>
                      
                      {/* Unread dot */}
                      {!group.isRead && (
                        <div className="w-3 h-3 rounded-full bg-[#4ade80] shadow-lg shadow-[#4ade80]/50" />
                      )}
                      
                      <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-[#4ade80] transition-colors" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}

          {/* Iguana illustration at bottom (only if has notifications) */}
          {groupedNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 mb-8 text-center"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -5, 5, -5, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="text-6xl filter drop-shadow-lg inline-block"
              >
                🦎
              </motion.div>
              <p className="mt-4 text-white/40 text-sm font-medium">
                You're all caught up!
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ✅ NEW: Full Notification View Modal */}
      <AnimatePresence>
        {viewingNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingNotification(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl overflow-hidden border-2 border-[#4ade80]/50 shadow-2xl shadow-[#4ade80]/20"
            >
              {/* Header with icon */}
              <div className="relative px-6 pt-8 pb-4 text-center">
                {/* Animated Icon - Different for each type */}
                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [-3, 3, -3]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-6xl mb-4"
                >
                  {viewingNotification.icon || (
                    viewingNotification.type === 'venue_announcement' ? '📢' :
                    viewingNotification.type === 'match' ? '💚' :
                    viewingNotification.type === 'message' ? '💬' :
                    viewingNotification.type === 'meeting' ? '🎉' :
                    '🦎'
                  )}
                </motion.div>

                {/* Type Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                  viewingNotification.type === 'meeting' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                  viewingNotification.type === 'match' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  viewingNotification.type === 'message' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  viewingNotification.type === 'venue_announcement' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-white/10 text-white/60 border border-white/20'
                }`}>
                  {viewingNotification.type === 'meeting' ? '💕 Meeting Request!' :
                   viewingNotification.type === 'match' ? '💚 New Match!' :
                   viewingNotification.type === 'message' ? '💬 New Message' :
                   viewingNotification.type === 'venue_announcement' ? '📢 Announcement' :
                   '🔔 Notification'}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-2">
                  {viewingNotification.title}
                </h2>

                {/* Sender/Venue badge */}
                {(viewingNotification.fromUserName || (viewingNotification as any).venueName) && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/30">
                    {viewingNotification.fromUserPhoto && (
                      <img 
                        src={viewingNotification.fromUserPhoto} 
                        alt="" 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-[#4ade80] font-semibold text-sm">
                      {viewingNotification.fromUserName || (viewingNotification as any).venueName}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="px-6 pb-6">
                <div className={`rounded-2xl p-6 border ${
                  viewingNotification.type === 'meeting' ? 'bg-pink-500/10 border-pink-500/20' :
                  viewingNotification.type === 'match' ? 'bg-green-500/10 border-green-500/20' :
                  'bg-[#0d2920]/60 border-[#4ade80]/20'
                }`}>
                  <p className="text-white/90 text-lg leading-relaxed text-center">
                    {viewingNotification.subtitle || 'No message content'}
                  </p>
                </div>

                {/* Special message for meeting type */}
                {viewingNotification.type === 'meeting' && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-4 text-center"
                  >
                    <span className="text-2xl">💕</span>
                    <p className="text-pink-400 font-semibold mt-1">Someone wants to meet you!</p>
                  </motion.div>
                )}

                {/* Timestamp */}
                <p className="text-center text-white/40 text-sm mt-4">
                  {formatTimeAgo(viewingNotification.timestamp || viewingNotification.createdAt)}
                </p>
              </div>

              {/* Action Buttons - Different per type */}
              <div className="px-6 pb-6 space-y-3">
                {/* Primary Action Button - Based on notification type */}
                {viewingNotification.type === 'meeting' && viewingNotification.matchId && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setViewingNotification(null)
                      onNavigate('match')
                    }}
                    className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    💕 View Match
                  </motion.button>
                )}

                {viewingNotification.type === 'match' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setViewingNotification(null)
                      if (onNotificationClick) {
                        onNotificationClick(viewingNotification)
                      } else {
                        onNavigate('match')
                      }
                    }}
                    className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    💚 View Match
                  </motion.button>
                )}

                {viewingNotification.type === 'message' && viewingNotification.chatId && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setViewingNotification(null)
                      onNavigate('chat')
                    }}
                    className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    💬 Go to Chat
                  </motion.button>
                )}

                {/* Close/Dismiss Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewingNotification(null)}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-[#4ade80] hover:bg-[#22c55e] text-[#0d2920] transition-colors"
                >
                  {viewingNotification.type === 'venue_announcement' ? 'Got it! 👍' : 'Close'}
                </motion.button>

                {/* Delete Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    const user = auth.currentUser
                    if (user) {
                      await deleteNotification(user.uid, viewingNotification.id)
                    }
                    setViewingNotification(null)  // Returns to notifications list
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Notification
                </motion.button>
              </div>

              {/* Bottom decoration - Color based on type */}
              <div className={`h-2 bg-gradient-to-r ${
                viewingNotification.type === 'meeting' ? 'from-pink-500 via-rose-500 to-pink-500' :
                viewingNotification.type === 'match' ? 'from-green-500 via-emerald-500 to-green-500' :
                viewingNotification.type === 'message' ? 'from-blue-500 via-cyan-500 to-blue-500' :
                'from-[#4ade80] via-[#22c55e] to-[#4ade80]'
              }`} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 HOLLYWOOD BOTTOM NAVIGATION - Glassmorphism */}
      <div className="relative flex items-center justify-around p-4 bg-[#0d2920]/90 backdrop-blur-xl border-t border-[#4ade80]/30 shadow-2xl">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#051410]/50 to-transparent" />
        
        <button 
          onClick={() => onNavigate(hasActiveMatch ? "match" : "home")}
          className="relative z-10 flex flex-col items-center gap-1.5 transition-all hover:scale-110"
        >
          <div className="text-3xl opacity-60 hover:opacity-100 transition-opacity">🦎</div>
          <span className="text-xs text-white/60 font-semibold">Home</span>
        </button>
        
        <button className="relative z-10 flex flex-col items-center gap-1.5 transition-all hover:scale-110">
          <div className="relative">
            <Bell className="h-7 w-7 text-[#4ade80]" fill="currentColor" />
            {unreadCount > 0 && (
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity
                }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#4ade80] flex items-center justify-center text-[#0d2920] text-[10px] font-bold shadow-lg shadow-[#4ade80]/50"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </div>
          <span className="text-xs text-[#4ade80] font-bold">Notifications</span>
        </button>
        
        <button 
          onClick={() => onNavigate("profile")}
          className="relative z-10 flex flex-col items-center gap-1.5 transition-all hover:scale-110"
        >
          <User className="h-7 w-7 text-white/60 hover:text-white transition-colors" />
          <span className="text-xs text-white/60 font-semibold">Profile</span>
        </button>
      </div>
    </div>
  )
}
