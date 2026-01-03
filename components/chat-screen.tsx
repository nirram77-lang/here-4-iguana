"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, MapPin, Clock, MoreVertical, CheckCheck, Heart, X, Flag, UserX, AlertTriangle, Camera, Image as ImageIcon, Eye, EyeOff, Navigation } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import DebugPanel from "./debug-panel"  // ✅ Debug panel for chat screen
import { 
  sendMessage, 
  listenToChatMessages, 
  markMessagesAsRead,
  ChatMessage,
  uploadChatImage,
  sendImageMessage,
  markImageAsViewed
} from "@/lib/chat-system"
import { 
  setTypingStatus, 
  subscribeToTypingStatus 
} from "@/lib/chat-service"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, addDoc, arrayUnion, serverTimestamp, deleteDoc } from "firebase/firestore"
import { GA } from "@/lib/ga-events"
import { useLanguage } from "@/lib/LanguageContext"

interface ChatScreenProps {
  matchId: string
  currentUserId: string
  otherUserId: string
  matchUser: {
    name: string
    photo: string
    distance: string
    venueName?: string | null  // ✅ NEW: Name of venue they're at
    zoneName?: string  // ✅ NEW: Name of entertainment zone
  }
  // ✅ NEW: Current user info for notifications
  currentUser?: {
    name: string
    photo: string
  }
  timeRemaining: number
  onBack?: () => void
  onViewProfile?: () => void  // ✅ NEW: Callback to view match profile
  // 🆕 Proximity features
  userLocation?: { lat: number; lng: number } | null
  matchLocation?: { lat: number; lng: number } | null
  currentVenueName?: string | null  // User's current venue
  // ✅ v2.8.3: Filter messages by match creation time
  matchCreatedAt?: Date | null
}

interface DisplayMessage {
  id: string
  text: string
  sender: "me" | "them"
  timestamp: Date
  status?: "sent" | "delivered" | "read"
  likedBy?: string[]  // Array of user IDs who liked this message
  // ✅ NEW: Image support
  imageUrl?: string
  imageType?: 'normal' | 'view-once'
  imageViewed?: boolean
  // 🆕 Location sharing
  messageType?: 'text' | 'image' | 'location' | 'meet-suggestion'
  locationData?: {
    venueName?: string
    meetingPoint?: string  // "entrance", "bar", custom
  }
}

export default function ChatScreen({ 
  matchId: propMatchId,
  currentUserId: propCurrentUserId,
  otherUserId: propOtherUserId,
  matchUser,
  currentUser,  // ✅ NEW
  timeRemaining,
  onBack = () => {},
  onViewProfile,  // ✅ NEW
  // 🆕 Proximity features
  userLocation,
  matchLocation,
  currentVenueName,
  // ✅ v2.8.3: Filter messages by match creation time
  matchCreatedAt
}: ChatScreenProps) {
  const { t, isRTL } = useLanguage()
  
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)  // ✅ EXISTING: Track if WE are typing (not used)
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false)  // ✨ NEW: Track if OTHER user is typing
  const [loading, setLoading] = useState(true)
  const [matchId, setMatchId] = useState<string>("")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [otherUserId, setOtherUserId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)  // ✨ NEW: For debouncing typing status
  
  // 🆕 Location sharing state
  const [showLocationOptions, setShowLocationOptions] = useState(false)
  const [proximityDistance, setProximityDistance] = useState<number | null>(null)
  
  // 🚨 REPORT & BLOCK
  const [showMenuDropdown, setShowMenuDropdown] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState({
    name: '',
    email: '',
    phone: '',
    description: ''
  })
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  
  // 🔊 SOUND - Multiple attempts to ensure it works!
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // 🎬 ANIMATION - Gentle and elegant
  const [showSendAnimation, setShowSendAnimation] = useState(false)
  const [animationPosition, setAnimationPosition] = useState({ x: 0, y: 0 })
  
  // ✅ Debug Panel - Long press on header
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const debugPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  // 😊 v2.8.26: Emoji Picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

// Set up user IDs and matchId from props
useEffect(() => {
  // ✅ FIXED: Clear previous messages when match changes
  setMessages([])
  setLoading(true)
  
  setCurrentUserId(propCurrentUserId)
  setOtherUserId(propOtherUserId)
  setMatchId(propMatchId)
  
  console.log('💬 Chat initialized (messages cleared):', propMatchId)
}, [propMatchId, propCurrentUserId, propOtherUserId])

// 🔊 CRITICAL: Load sound with MULTIPLE methods to ensure it works!
useEffect(() => {
  console.log('🔊 Starting sound initialization...')
  
  // Method 1: HTML Audio (primary)
  try {
    const audio = new Audio()
    audio.src = '/sounds/message-sent.wav'  // ✅ FIXED: Changed MP3 → WAV
    audio.volume = 0.8
    audio.preload = 'auto'
    
    audio.addEventListener('canplaythrough', () => {
      console.log('✅ HTML Audio loaded successfully!')
    })
    
    audio.addEventListener('error', (e) => {
      console.error('❌ HTML Audio error:', e)
    })
    
    audio.load()
    htmlAudioRef.current = audio
    
    console.log('✅ HTML Audio initialized')
  } catch (error) {
    console.error('❌ Failed to initialize HTML Audio:', error)
  }
  
  // Method 2: Web Audio API (fallback)
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      const context = new AudioContextClass()
      audioContextRef.current = context
      
      // Preload the sound
      fetch('/sounds/message-sent.wav')  // ✅ FIXED: Changed MP3 → WAV
        .then(response => {
          console.log('🔊 Fetch response:', response.status)
          return response.arrayBuffer()
        })
        .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          audioBufferRef.current = audioBuffer
          console.log('✅ Web Audio API loaded successfully!')
          console.log('🔊 Audio duration:', audioBuffer.duration, 'seconds')
        })
        .catch(error => {
          console.error('❌ Web Audio API error:', error)
        })
    }
  } catch (error) {
    console.error('❌ Failed to initialize Web Audio API:', error)
  }
  
  // Log the sound file path
  console.log('🔊 Sound file path: /sounds/message-sent.wav')  // ✅ FIXED: Changed to .wav
  console.log('🔊 Full URL:', window.location.origin + '/sounds/message-sent.wav')
  
  return () => {
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause()
      htmlAudioRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }
}, [])

  // Listen to messages from Firestore
  useEffect(() => {
    if (!matchId || !currentUserId) return

    console.log(`💬 Setting up message listener for match: ${matchId}`)
    
    // ✅ FIXED: Clear old messages before listening to new match
    setMessages([])
    setLoading(true)
    
    const unsubscribe = listenToChatMessages(matchId, (firestoreMessages) => {
      // ✅ v2.8.3: Filter messages to only show those from CURRENT match
      const filteredMessages = matchCreatedAt 
        ? firestoreMessages.filter(msg => {
            const msgTime = msg.timestamp?.toDate() || new Date(0)
            return msgTime >= matchCreatedAt
          })
        : firestoreMessages
      
      if (matchCreatedAt && firestoreMessages.length !== filteredMessages.length) {
        console.log(`💬 Filtered ${firestoreMessages.length - filteredMessages.length} old messages (before ${matchCreatedAt.toLocaleString()})`)
      }
      
      const displayMessages: DisplayMessage[] = filteredMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.senderId === currentUserId ? "me" : "them",
        timestamp: msg.timestamp?.toDate() || new Date(),
        status: msg.status || "sent",
        likedBy: msg.likedBy || [],
        // 📸 Image fields
        imageUrl: msg.imageUrl,
        imageType: msg.imageType,
        imageViewed: msg.imageViewed
      }))
      
      setMessages(displayMessages)
      setLoading(false)
    })

    unsubscribeRef.current = unsubscribe

    // Mark messages as read
    markMessagesAsRead(matchId, currentUserId)

    return () => {
      if (unsubscribeRef.current) {
        console.log('🧹 Cleaning up message listener')
        unsubscribeRef.current()
      }
    }
  }, [matchId, currentUserId, matchCreatedAt])  // ✅ v2.8.3: Re-filter when matchCreatedAt changes

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ✨ NEW: Subscribe to other user's typing status
  useEffect(() => {
    if (!matchId || !otherUserId) return
    
    console.log('👀 Subscribing to typing status for:', otherUserId)
    
    const unsubscribe = subscribeToTypingStatus(
      matchId,
      otherUserId,
      (isTyping) => {
        setOtherUserIsTyping(isTyping)
        if (isTyping) {
          console.log('✍️ Other user is typing...')
        }
      }
    )
    
    return () => {
      console.log('🔇 Unsubscribing from typing status')
      unsubscribe()
    }
  }, [matchId, otherUserId])

  // ✨ NEW: Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      // Clear typing status when leaving chat
      if (matchId && currentUserId) {
        setTypingStatus(matchId, currentUserId, false)
          .catch(err => console.error('Error clearing typing status:', err))
      }
    }
  }, [matchId, currentUserId])

  // 🆕 Calculate proximity distance when both locations are available
  useEffect(() => {
    if (userLocation && matchLocation) {
      const distance = calculateDistanceMeters(
        userLocation.lat, userLocation.lng,
        matchLocation.lat, matchLocation.lng
      )
      setProximityDistance(distance)
      console.log(`📍 Distance to match: ${Math.round(distance)}m`)
    }
  }, [userLocation, matchLocation])

  // 🆕 Helper: Calculate distance in meters
  const calculateDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // 🆕 Share location message
  const handleShareLocation = async (option: 'my-spot' | 'come-to-me' | 'meet-entrance') => {
    setShowLocationOptions(false)
    
    let messageText = ''
    let locationData: any = {}
    
    switch (option) {
      case 'my-spot':
        messageText = currentVenueName 
          ? `📍 I'm at ${currentVenueName}` 
          : `📍 I shared my location`
        locationData = { venueName: currentVenueName }
        break
      case 'come-to-me':
        messageText = currentVenueName 
          ? `💚 Come find me at ${currentVenueName}!` 
          : `💚 Come find me!`
        locationData = { venueName: currentVenueName, meetingPoint: 'come-to-me' }
        break
      case 'meet-entrance':
        messageText = `🚪 Let's meet at the entrance!`
        locationData = { meetingPoint: 'entrance' }
        break
    }
    
    try {
      await sendMessage(matchId, currentUserId, otherUserId, messageText)
    } catch (error) {
      console.error('Error sending location:', error)
    }
  }

  // 🚨 BLOCK & REPORT FUNCTIONS
  const handleBlockAndReport = () => {
    setShowMenuDropdown(false)
    setShowReportModal(true)
    // Pre-fill reporter info if available
    if (currentUser?.name) {
      setReportData(prev => ({ ...prev, name: currentUser.name }))
    }
  }

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmitReport = async () => {
    // Validate required fields
    if (!reportData.email.trim()) {
      alert('Please enter your email address')
      return
    }
    
    if (!isValidEmail(reportData.email)) {
      alert('Please enter a valid email address')
      return
    }
    
    if (!reportData.description.trim()) {
      alert('Please describe the issue')
      return
    }

    setReportSubmitting(true)

    try {
      // Get reporter's full profile from Firebase
      let reporterProfile: any = null
      try {
        const reporterDoc = await getDoc(doc(db, 'users', currentUserId))
        if (reporterDoc.exists()) {
          reporterProfile = reporterDoc.data()
        }
      } catch (e) {
        console.log('⚠️ Could not load reporter profile:', e)
      }

      // Get reported user's full profile from Firebase
      let reportedProfile: any = null
      try {
        const reportedDoc = await getDoc(doc(db, 'users', otherUserId))
        if (reportedDoc.exists()) {
          reportedProfile = reportedDoc.data()
        }
      } catch (e) {
        console.log('⚠️ Could not load reported profile:', e)
      }

      // 1. Save report to Firestore with full details
      await addDoc(collection(db, 'reports'), {
        // Reporter details (who is reporting)
        reporterId: currentUserId,
        reporterName: reportData.name || reporterProfile?.name || 'Unknown',
        reporterEmail: reportData.email,
        reporterPhone: reportData.phone || '',
        reporterFirebaseEmail: reporterProfile?.email || null,
        reporterGender: reporterProfile?.gender || null,
        reporterAge: reporterProfile?.age || null,
        reporterPhoto: reporterProfile?.photos?.[0] || reporterProfile?.photoURL || null,
        
        // Reported user details (who is being reported)
        reportedUserId: otherUserId,
        reportedUserName: reportedProfile?.name || matchUser.name || 'Unknown',
        reportedUserEmail: reportedProfile?.email || null,
        reportedUserPhone: reportedProfile?.phoneNumber || null,
        reportedUserGender: reportedProfile?.gender || null,
        reportedUserAge: reportedProfile?.age || null,
        reportedUserPhoto: reportedProfile?.photos?.[0] || reportedProfile?.photoURL || null,
        reportedUserBio: reportedProfile?.bio || null,
        
        // Match context
        matchId: matchId,
        
        // Report content
        description: reportData.description,
        
        // Metadata
        timestamp: serverTimestamp(),
        status: 'pending'
      })

      // 2. Block the user - add to swipedLeft (like PASS)
      const userRef = doc(db, 'users', currentUserId)
      await updateDoc(userRef, {
        swipedLeft: arrayUnion(otherUserId)
      })

      // 3. Remove from matches
      await updateDoc(userRef, {
        matches: arrayUnion() // This won't add anything, we need to filter
      })

      // 4. Delete the active match
      try {
        const activeMatchRef = doc(db, 'activeMatches', matchId)
        await deleteDoc(activeMatchRef)
        console.log('✅ Active match deleted')
      } catch (e) {
        console.log('⚠️ Could not delete active match:', e)
      }

      console.log('✅ Report submitted and user blocked')
      setReportSuccess(true)

      // Close modal and go back after 2 seconds
      setTimeout(() => {
        setShowReportModal(false)
        setReportSuccess(false)
        setReportData({ name: '', email: '', phone: '', description: '' })
        onBack()
      }, 2000)

    } catch (error) {
      console.error('❌ Error submitting report:', error)
      alert('Failed to submit report. Please try again.')
    } finally {
      setReportSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatMessageTime = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // ❤️ NEW: Toggle like on a message
  const [likeAnimations, setLikeAnimations] = useState<{[key: string]: boolean}>({})
  
  // 📸 NEW: Image messaging state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [viewOnceEnabled, setViewOnceEnabled] = useState(false)
  const [viewingImage, setViewingImage] = useState<{url: string, messageId: string, isViewOnce: boolean} | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  // 📸 Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 handleImageSelect called')
    const file = e.target.files?.[0]
    
    if (!file) {
      console.log('📸 No file selected')
      return
    }
    
    console.log('📸 File selected:', file.name)
    console.log('   Type:', file.type)
    console.log('   Size:', file.size, 'bytes')
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large!')
      alert('התמונה גדולה מדי. מקסימום 5MB')
      return
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Not an image file!')
      alert('יש לבחור קובץ תמונה בלבד')
      return
    }
    
    setSelectedImage(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      console.log('📸 Image preview ready - opening modal NOW')
      setImagePreview(reader.result as string)
      // ✅ CRITICAL FIX: Only show modal AFTER preview is ready!
      setShowImageOptions(true)
      console.log('📸 Modal should be visible now!')
    }
    reader.onerror = () => {
      console.error('❌ Error reading file')
      alert('שגיאה בקריאת הקובץ')
    }
    reader.readAsDataURL(file)
    // ❌ REMOVED: setShowImageOptions(true) - was called too early!
    console.log('📸 Reading file...')
  }
  
  // 📸 Cancel image selection
  const cancelImageSelection = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setShowImageOptions(false)
    setViewOnceEnabled(false)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }
  
  // 📸 Send the selected image
  const sendSelectedImage = async () => {
    console.log('📸 sendSelectedImage called')
    console.log('   selectedImage:', selectedImage ? 'exists' : 'null')
    console.log('   matchId:', matchId || 'MISSING!')
    console.log('   currentUserId:', currentUserId || 'MISSING!')
    console.log('   otherUserId:', otherUserId || 'MISSING!')
    
    // Check for missing required values
    if (!selectedImage) {
      console.error('❌ No image selected!')
      alert('לא נבחרה תמונה')
      return
    }
    
    if (!matchId || !currentUserId || !otherUserId) {
      console.error('❌ Missing IDs - matchId:', matchId, 'currentUserId:', currentUserId, 'otherUserId:', otherUserId)
      alert('שגיאה: חסרים פרטי משתמש. נסה לסגור ולפתוח את הצ\'אט מחדש.')
      return
    }
    
    setIsUploadingImage(true)
    console.log('📤 Starting image upload...')
    
    try {
      // Upload image to Firebase Storage
      console.log('📤 Uploading to Firebase Storage...')
      const imageUrl = await uploadChatImage(matchId, currentUserId, selectedImage)
      console.log('✅ Image uploaded, URL:', imageUrl.substring(0, 50) + '...')
      
      // Send image message
      console.log('📤 Sending image message...')
      await sendImageMessage(
        matchId,
        currentUserId,
        otherUserId,
        imageUrl,
        viewOnceEnabled ? 'view-once' : 'normal',
        currentUser?.name,
        currentUser?.photo
      )
      
      console.log(`✅ ${viewOnceEnabled ? 'View-once' : 'Normal'} image sent successfully!`)
      
      // Reset state
      cancelImageSelection()
      
    } catch (error) {
      console.error('❌ Error sending image:', error)
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          alert('שגיאה בהעלאת התמונה. בדוק את החיבור לאינטרנט.')
        } else if (error.message.includes('permission')) {
          alert('אין הרשאה להעלות תמונות. נסה להתחבר מחדש.')
        } else {
          alert(`שגיאה בשליחת התמונה: ${error.message}`)
        }
      } else {
        alert('שגיאה לא צפויה בשליחת התמונה')
      }
    } finally {
      setIsUploadingImage(false)
      console.log('📸 Upload process finished')
    }
  }
  
  // 📸 Handle viewing an image (especially view-once)
  const handleViewImage = async (imageUrl: string, messageId: string, isViewOnce: boolean, alreadyViewed: boolean) => {
    // If it's view-once and already viewed, don't show
    if (isViewOnce && alreadyViewed) {
      return
    }
    
    setViewingImage({ url: imageUrl, messageId, isViewOnce })
    
    // If it's view-once and we're the recipient, mark as viewed
    if (isViewOnce && !alreadyViewed) {
      const message = messages.find(m => m.id === messageId)
      if (message && message.sender === 'them') {
        await markImageAsViewed(matchId, messageId)
      }
    }
  }
  
  // 📸 Close image viewer
  const closeImageViewer = () => {
    setViewingImage(null)
  }
  
  const toggleMessageLike = async (messageId: string) => {
    if (!matchId || !currentUserId) return
    
    try {
      const { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      const messageRef = doc(db, 'matches', matchId, 'messages', messageId)
      
      // Check if already liked
      const message = messages.find(m => m.id === messageId)
      const isLiked = message?.likedBy?.includes(currentUserId)
      
      if (isLiked) {
        // Unlike
        await updateDoc(messageRef, {
          likedBy: arrayRemove(currentUserId)
        })
        console.log('💔 Message unliked:', messageId)
      } else {
        // Like - trigger animation!
        setLikeAnimations(prev => ({ ...prev, [messageId]: true }))
        setTimeout(() => {
          setLikeAnimations(prev => ({ ...prev, [messageId]: false }))
        }, 1000)
        
        await updateDoc(messageRef, {
          likedBy: arrayUnion(currentUserId)
        })
        console.log('❤️ Message liked:', messageId)
        
        // ✅ Send notification to the other user (only if it's THEIR message)
        if (message?.sender === 'them') {
          try {
            const notificationsRef = collection(db, 'users', otherUserId, 'notifications')
            await addDoc(notificationsRef, {
              type: 'message_liked',
              fromUserId: currentUserId,
              fromUserName: currentUser?.name || 'Someone',
              fromUserPhoto: currentUser?.photo || '',
              messageText: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
              matchId: matchId,
              read: false,
              createdAt: serverTimestamp()
            })
            console.log('🔔 Like notification sent to:', otherUserId)
          } catch (notifError) {
            console.error('Error sending like notification:', notifError)
          }
        }
      }
    } catch (error) {
      console.error('Error toggling message like:', error)
    }
  }
  
  // ❤️ Heart burst animation component
  const HeartBurst = ({ show }: { show: boolean }) => {
    if (!show) return null
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              scale: 0, 
              opacity: 1,
              x: 0,
              y: 0
            }}
            animate={{ 
              scale: [0, 1, 0.5],
              opacity: [1, 1, 0],
              x: Math.cos(i * 60 * Math.PI / 180) * 30,
              y: Math.sin(i * 60 * Math.PI / 180) * 30 - 10
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut"
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </motion.div>
        ))}
      </div>
    )
  }

  // 🔊 PLAY SOUND - Try all methods!
  const playMessageSound = async () => {
    console.log('🔊 Attempting to play message sound...')
    
    let played = false
    
    // Method 1: HTML Audio (most reliable)
    if (htmlAudioRef.current && !played) {
      try {
        htmlAudioRef.current.currentTime = 0
        htmlAudioRef.current.volume = 0.8
        
        const playPromise = htmlAudioRef.current.play()
        
        if (playPromise !== undefined) {
          await playPromise
          console.log('✅ Sound played via HTML Audio!')
          played = true
        }
      } catch (error: any) {
        console.warn('⚠️ HTML Audio failed:', error.message)
      }
    }
    
    // Method 2: Web Audio API (fallback)
    if (!played && audioContextRef.current && audioBufferRef.current) {
      try {
        // Resume context if suspended (required by browsers)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        
        const source = audioContextRef.current.createBufferSource()
        source.buffer = audioBufferRef.current
        
        const gainNode = audioContextRef.current.createGain()
        gainNode.gain.value = 0.8
        
        source.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        
        source.start(0)
        console.log('✅ Sound played via Web Audio API!')
        played = true
      } catch (error: any) {
        console.warn('⚠️ Web Audio API failed:', error.message)
      }
    }
    
    // Method 3: Create new Audio element (last resort)
    if (!played) {
      try {
        const audio = new Audio('/sounds/message-sent.wav')  // ✅ FIXED: Changed MP3 → WAV
        audio.volume = 0.8
        await audio.play()
        console.log('✅ Sound played via new Audio element!')
        played = true
      } catch (error: any) {
        console.warn('⚠️ New Audio element failed:', error.message)
      }
    }
    
    if (!played) {
      console.error('❌ ALL SOUND METHODS FAILED!')
      console.error('📁 Please check:')
      console.error('   1. File exists at: public/sounds/message-sent.wav')  // ✅ FIXED: Changed to .wav
      console.error('   2. File is a valid WAV/MP3')
      console.error('   3. User has interacted with page (browser policy)')
    }
    
    return played
  }

  // 🎬 GENTLE ANIMATION - Elegant and subtle
  const playGentleAnimation = (buttonElement?: HTMLElement) => {
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect()
      setAnimationPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    } else {
      setAnimationPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80
      })
    }
    
    setShowSendAnimation(true)
    setTimeout(() => setShowSendAnimation(false), 1000)
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  // ✨ NEW: Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputText(value)
    
    if (!matchId || !currentUserId) return
    
    // ✅ User is typing - set status to true
    if (value.trim().length > 0) {
      setTypingStatus(matchId, currentUserId, true)
        .catch(err => console.error('Error setting typing status:', err))
      
      // ✅ Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // ✅ Set timeout to clear typing status after 3 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(matchId, currentUserId, false)
          .catch(err => console.error('Error clearing typing status:', err))
      }, 3000)
    } else {
      // ✅ Input is empty - clear typing status immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      setTypingStatus(matchId, currentUserId, false)
        .catch(err => console.error('Error clearing typing status:', err))
    }
  }

  const handleSend = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!inputText.trim() || !matchId || !currentUserId || !otherUserId) return

    const messageText = inputText.trim()
    const sendButton = e?.currentTarget
    setInputText("")
    
    // ✅ Clear typing status when sending message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setTypingStatus(matchId, currentUserId, false)
      .catch(err => console.error('Error clearing typing status:', err))

    try {
      // ✅ CRITICAL FIX: Load fresh profile from Firestore for correct name/photo
      let senderName = currentUser?.name || 'Someone'
      let senderPhoto = currentUser?.photo || ''
      
      try {
        const profileDoc = await getDoc(doc(db, 'users', currentUserId))
        if (profileDoc.exists()) {
          const profile = profileDoc.data()
          senderName = profile.name || profile.displayName || senderName
          senderPhoto = profile.photos?.[0] || profile.photoURL || senderPhoto
          console.log('📸 Using fresh profile:', senderName, senderPhoto ? '✅ has photo' : '❌ no photo')
        }
      } catch (profileError) {
        console.log('⚠️ Could not load fresh profile, using cached:', profileError)
      }
      
      await sendMessage(
        matchId, 
        currentUserId, 
        otherUserId, 
        messageText,
        senderName,
        senderPhoto
      )
      console.log('✅ Message sent successfully')
      
      // 📊 Track message sent
      const isFirstMessage = messages.length === 0 || !messages.some(m => m.sender === 'me')
      GA.messageSent(messageText.length, isFirstMessage)
      
      // 🔊 PLAY SOUND - Critical!
      const soundPlayed = await playMessageSound()
      if (soundPlayed) {
        console.log('🎵 Sound feedback successful!')
      }
      
      // 🎬 GENTLE ANIMATION
      playGentleAnimation(sendButton)
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      alert('Failed to send message. Please try again.')
      setInputText(messageText)
    }
  }

  const handleSuggestMeetup = () => {
    const meetupText = "Let's meet by the bar in 5 minutes? 🍹"
    setInputText(meetupText)
  }

  // 🎬 GENTLE ANIMATION COMPONENT - Elegant and subtle
  const GentleSendAnimation = () => (
    <AnimatePresence>
      {showSendAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[9999]"
        >
          {/* Single elegant ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ 
              scale: [0, 1.5, 2.5],
              opacity: [0.6, 0.3, 0]
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute rounded-full border-2 border-[#4ade80]"
            style={{
              left: animationPosition.x,
              top: animationPosition.y,
              width: '60px',
              height: '60px',
              marginLeft: '-30px',
              marginTop: '-30px',
            }}
          />
          
          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute"
            style={{
              left: animationPosition.x,
              top: animationPosition.y,
              marginLeft: '-16px',
              marginTop: '-16px',
            }}
          >
            <div className="bg-[#4ade80] rounded-full p-2 shadow-lg">
              <svg
                className="w-6 h-6 text-[#0d2920]"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </motion.div>
          
          {/* Subtle particles - only 4 */}
          {[...Array(4)].map((_, i) => {
            const angle = (i / 4) * Math.PI * 2
            const distance = 60
            const x = Math.cos(angle) * distance
            const y = Math.sin(angle) * distance
            
            return (
              <motion.div
                key={`particle-${i}`}
                initial={{ scale: 0, x: 0, y: 0, opacity: 0.8 }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: [0, x],
                  y: [0, y],
                  opacity: [0.8, 0.4, 0]
                }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full bg-[#4ade80]"
                style={{
                  left: animationPosition.x,
                  top: animationPosition.y,
                }}
              />
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // 💬 TYPING INDICATOR - 3 bouncing dots
  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex justify-start"
    >
      <div className="flex items-end gap-2 max-w-[75%]">
        <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#4ade80] flex-shrink-0 bg-[#1a4d3e] flex items-center justify-center">
          {matchUser.photo && matchUser.photo !== '/placeholder.jpg' ? (
            <img src={matchUser.photo} alt={matchUser.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </div>
        
        <div className="px-4 py-3 rounded-2xl bg-[#1a4d3e] border border-[#4ade80]/20 rounded-bl-md">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 rounded-full bg-white/60"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]"
      style={{ 
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        WebkitUserSelect: 'none', 
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Header - with iOS safe area padding */}
      <div 
        className="bg-[#0d2920]/80 border-b border-[#4ade80]/20 backdrop-blur-sm sticky top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        onTouchStart={() => {
          debugPressTimer.current = setTimeout(() => setShowDebugPanel(true), 3000)
        }}
        onTouchEnd={() => {
          if (debugPressTimer.current) clearTimeout(debugPressTimer.current)
        }}
        onMouseDown={() => {
          debugPressTimer.current = setTimeout(() => setShowDebugPanel(true), 3000)
        }}
        onMouseUp={() => {
          if (debugPressTimer.current) clearTimeout(debugPressTimer.current)
        }}
        onMouseLeave={() => {
          if (debugPressTimer.current) clearTimeout(debugPressTimer.current)
        }}
      >
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-full text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 flex-1 ml-2">
            {/* ✅ CLICKABLE: Tap photo or name to view profile */}
            <button 
              onClick={onViewProfile}
              className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity active:scale-95"
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#4ade80] bg-[#1a4d3e] flex items-center justify-center">
                  {matchUser.photo && matchUser.photo !== '/placeholder.jpg' ? (
                    <img 
                      src={matchUser.photo} 
                      alt={matchUser.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Fallback to emoji if image fails
                        (e.target as HTMLImageElement).style.display = 'none'
                        const parent = (e.target as HTMLImageElement).parentElement
                        if (parent && !parent.querySelector('.fallback-emoji')) {
                          const span = document.createElement('span')
                          span.className = 'fallback-emoji text-xl'
                          span.textContent = '👤'
                          parent.appendChild(span)
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#4ade80] border-2 border-[#0d2920]" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="font-sans font-bold text-white text-base">{matchUser.name}</h2>
                <div className="flex items-center gap-1 text-xs text-[#4ade80]">
                  <MapPin className="h-3 w-3" />
                  <span className="font-medium">
                    {matchUser.distance}
                    {matchUser.venueName && ` (${matchUser.venueName})`}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* ⋮ More Options Menu */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="rounded-full text-white hover:bg-white/10"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenuDropdown && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenuDropdown(false)}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#1a4d3e] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <button
                      onClick={handleBlockAndReport}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <UserX className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Block & Report</div>
                        <div className="text-xs text-red-400/60">Report inappropriate behavior</div>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ✅ ENHANCED: Proximity Banner - Shows distance and encourages meeting */}
        {(matchUser.zoneName || (proximityDistance !== null && proximityDistance <= 500)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`border-b px-4 py-3 ${
              proximityDistance !== null && proximityDistance <= 50 
                ? 'bg-gradient-to-r from-pink-500/20 to-[#4ade80]/20 border-pink-400/30' 
                : proximityDistance !== null && proximityDistance <= 200
                  ? 'bg-[#f97316]/15 border-[#f97316]/30'
                  : 'bg-[#4ade80]/10 border-[#4ade80]/20'
            }`}
          >
            {/* Super close! - Under 50m */}
            {proximityDistance !== null && proximityDistance <= 50 && (
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-base">
                  <motion.span 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    💕
                  </motion.span>
                  <span className="text-pink-300 font-bold">
                    {matchUser.name} is right here!
                  </span>
                  <motion.span 
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    💕
                  </motion.span>
                </div>
                <p className="text-white/60 text-xs mt-1">Look around... 👀</p>
              </motion.div>
            )}
            
            {/* Getting warmer! - 50-200m */}
            {proximityDistance !== null && proximityDistance > 50 && proximityDistance <= 200 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🔥
                  </motion.span>
                  <span className="text-[#f97316] font-semibold">
                    Getting warmer! ~{Math.round(proximityDistance)}m away
                  </span>
                </div>
                <p className="text-white/50 text-xs mt-1">Almost there!</p>
              </div>
            )}
            
            {/* In the zone - 200-500m */}
            {((proximityDistance !== null && proximityDistance > 200 && proximityDistance <= 500) || 
              (matchUser.zoneName && (proximityDistance === null || proximityDistance > 200))) && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-[#4ade80]">💡</span>
                  <span className="text-[#4ade80]/90">
                    {proximityDistance !== null 
                      ? `${matchUser.name} is ${Math.round(proximityDistance)}m away`
                      : `You're both in ${matchUser.zoneName}!`
                    }
                  </span>
                  <span className="text-[#4ade80]">🦎</span>
                </div>
                <p className="text-[#4ade80]/60 text-xs mt-0.5">
                  Perfect time to meet up!
                </p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          animate={{ 
            backgroundColor: timeRemaining < 60 ? "rgba(239, 68, 68, 0.2)" : "rgba(74, 222, 128, 0.1)"
          }}
          className="flex items-center justify-center gap-2 py-2 border-t border-white/5"
        >
          <Clock className={`h-4 w-4 ${timeRemaining < 60 ? "text-red-400 animate-pulse" : "text-[#4ade80]"}`} />
          <span className={`font-mono font-bold text-sm ${timeRemaining < 60 ? "text-red-400" : "text-[#4ade80]"}`}>
            {formatTime(timeRemaining)} to meet
          </span>
        </motion.div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="text-white/40 text-sm">Loading messages...</div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2 py-6"
          >
            <div className="flex items-center gap-2">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#4ade80] bg-[#1a4d3e] flex items-center justify-center">
                {matchUser.photo && matchUser.photo !== '/placeholder.jpg' ? (
                  <img src={matchUser.photo} alt={matchUser.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <div className="text-3xl">💬</div>
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#4ade80] bg-[#4ade80]/20 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
            <p className="text-white/60 text-sm font-medium">
              You matched with {matchUser.name}!
            </p>
            <p className="text-white/40 text-xs">
              Say hi and suggest where to meet 👋
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"} pb-6`}
            >
              <div className={`flex items-end gap-2 max-w-[75%] ${message.sender === "me" ? "flex-row-reverse" : "flex-row"} overflow-visible`}>
                {message.sender === "them" && (
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#4ade80] flex-shrink-0 bg-[#1a4d3e] flex items-center justify-center">
                    {matchUser.photo && matchUser.photo !== '/placeholder.jpg' ? (
                      <img src={matchUser.photo} alt={matchUser.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                )}
                
                {/* ❤️ FIX: overflow-visible allows hearts to show outside message bubble */}
                <div className="relative group overflow-visible">
                  <div className={`
                    px-4 py-3 rounded-2xl
                    ${message.sender === "me" 
                      ? "bg-[#4ade80] text-[#0d2920] rounded-br-md" 
                      : "bg-[#1a4d3e] text-white rounded-bl-md border border-[#4ade80]/20"
                    }
                  `}>
                    {/* 📸 IMAGE MESSAGE */}
                    {message.imageUrl ? (
                      <div className="relative">
                        {/* View-once image that hasn't been viewed yet (by recipient) */}
                        {message.imageType === 'view-once' && !message.imageViewed && message.sender === 'them' ? (
                          <button
                            onClick={() => handleViewImage(message.imageUrl!, message.id, true, false)}
                            className="flex flex-col items-center gap-2 p-4 bg-black/20 rounded-xl min-w-[150px]"
                          >
                            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <Eye className="w-6 h-6 text-pink-400" />
                            </div>
                            <span className="text-sm font-medium">תמונה חד-פעמית</span>
                            <span className="text-xs opacity-70">לחץ לצפייה</span>
                          </button>
                        ) : message.imageType === 'view-once' && message.imageViewed ? (
                          /* View-once image that was already viewed */
                          <div className="flex flex-col items-center gap-2 p-4 bg-black/20 rounded-xl min-w-[150px] opacity-60">
                            <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center">
                              <EyeOff className="w-6 h-6 text-gray-400" />
                            </div>
                            <span className="text-sm font-medium">נצפתה</span>
                            <span className="text-xs opacity-70">תמונה חד-פעמית</span>
                          </div>
                        ) : message.imageType === 'view-once' && message.sender === 'me' && !message.imageViewed ? (
                          /* View-once sent by me, not yet viewed */
                          <div className="flex flex-col items-center gap-2 p-4 bg-black/20 rounded-xl min-w-[150px]">
                            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <Eye className="w-6 h-6 text-pink-400" />
                            </div>
                            <span className="text-sm font-medium">תמונה חד-פעמית</span>
                            <span className="text-xs opacity-70">ממתין לצפייה</span>
                          </div>
                        ) : (
                          /* Normal image - clickable to view full size */
                          <button
                            onClick={() => handleViewImage(message.imageUrl!, message.id, false, false)}
                            className="block"
                          >
                            <img 
                              src={message.imageUrl} 
                              alt="תמונה" 
                              className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                            />
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Regular text message */
                      <p className="font-sans text-base">{message.text}</p>
                    )}
                  </div>
                  
                  {/* ❤️ LIKE BUTTON - Shows on tap/hover */}
                  <div className={`
                    absolute -bottom-1 ${message.sender === "me" ? "-left-8" : "-right-8"}
                  `}>
                    <motion.button
                      onClick={() => toggleMessageLike(message.id)}
                      whileTap={{ scale: 1.4 }}
                      animate={likeAnimations[message.id] ? { scale: [1, 1.3, 1] } : {}}
                      className={`
                        p-1.5 rounded-full transition-all duration-200 relative
                        ${message.likedBy?.length 
                          ? "opacity-100" 
                          : "opacity-60 group-hover:opacity-100"
                        }
                      `}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Heart 
                        className={`h-5 w-5 transition-all duration-200 ${
                          message.likedBy?.includes(currentUserId)
                            ? "text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                            : "text-white/60 hover:text-red-400"
                        }`}
                      />
                      {/* ❤️ HEART BURST ANIMATION - Inside button for proper positioning */}
                      <HeartBurst show={likeAnimations[message.id] || false} />
                    </motion.button>
                  </div>
                  
                  {/* ❤️ LIKE COUNT - Shows if liked */}
                  {message.likedBy && message.likedBy.length > 0 && (
                    <div className={`
                      absolute -bottom-5 ${message.sender === "me" ? "left-0" : "right-0"}
                      flex items-center gap-0.5 text-xs text-red-400
                    `}>
                      <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                      {message.likedBy.length > 1 && <span>{message.likedBy.length}</span>}
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-1 mt-1 px-2 ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs text-white/40">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {/* ✅ READ RECEIPTS */}
                    {message.sender === "me" && (
                      <span className="flex items-center">
                        {message.status === "read" ? (
                          <CheckCheck className="h-3 w-3 text-[#4ade80]" />
                        ) : message.status === "delivered" ? (
                          <CheckCheck className="h-3 w-3 text-white/40" />
                        ) : (
                          <svg className="h-3 w-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* ✨ TYPING INDICATOR - Shows when other user is typing */}
          {otherUserIsTyping && <TypingIndicator />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ✅ Suggested Messages - Only for ACTIVE matches with few messages */}
      {/* ✅ v2.8.26: Hollywood Edition - Cool action-oriented suggestions! */}
      {messages.length < 5 && !loading && timeRemaining > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="px-4 pb-2"
        >
          <p className="text-xs text-white/40 mb-2 text-center" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {isRTL ? '💬 הודעות מהירות:' : '💬 Quick replies:'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {(isRTL ? [
              "היי! מה קורה? 👋",
              "אני ליד הבר, בוא/י! 🍹",
              "רוקדים? 💃🕺",
              "איפה את/ה עכשיו? 📍",
              "נראה לי ראיתי אותך... 👀",
              "מחכה לך! 🌙"
            ] : [
              "Hey! What's up? 👋",
              "I'm by the bar, come! 🍹",
              "Dancing? 💃🕺",
              "Where are you now? 📍",
              "Think I saw you... 👀",
              "Waiting for you! 🌙"
            ]).map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setInputText(suggestion)
                  GA.tipUsed(index)
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 bg-[#1a4d3e]/60 hover:bg-[#4ade80]/20 border border-[#4ade80]/30 rounded-full text-xs text-white/80 hover:text-white transition-all"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {messages.length === 0 && !loading && timeRemaining > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4 pb-2"
        >
          <Button
            onClick={handleSuggestMeetup}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold text-base shadow-lg"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <MapPin className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? '📍 בואו ניפגש!' : '📍 Suggest a Meetup Spot'}
          </Button>
        </motion.div>
      )}

      {/* Input Area - or Read-Only Notice */}
      {timeRemaining > 0 ? (
        // ✅ ACTIVE: Can send messages
        <div className="bg-[#0d2920]/90 border-t border-[#4ade80]/20 p-4 backdrop-blur-sm">
          {/* 🆕 Location Share Options Popup */}
          <AnimatePresence>
            {showLocationOptions && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-24 left-4 right-4 bg-[#1a4d3e] border border-[#4ade80]/30 rounded-2xl p-4 shadow-xl z-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {isRTL ? '📍 שתף מיקום' : '📍 Share Location'}
                  </h3>
                  <button 
                    onClick={() => setShowLocationOptions(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {/* Share my spot */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShareLocation('my-spot')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-[#4ade80]" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-white font-medium">{isRTL ? 'שתף את המיקום שלי' : 'Share my spot'}</p>
                      <p className="text-white/50 text-xs">
                        {currentVenueName || (isRTL ? 'המיקום הנוכחי שלך' : 'Your current location')}
                      </p>
                    </div>
                  </motion.button>
                  
                  {/* Come to me */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShareLocation('come-to-me')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-400/20 flex items-center justify-center">
                      <span className="text-xl">💕</span>
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-white font-medium">{isRTL ? 'בוא/י אליי!' : 'Come find me!'}</p>
                      <p className="text-white/50 text-xs">{isRTL ? 'הזמן אותם למיקום שלך' : 'Invite them to your location'}</p>
                    </div>
                  </motion.button>
                  
                  {/* Meet at entrance */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShareLocation('meet-entrance')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f97316]/20 flex items-center justify-center">
                      <span className="text-xl">🚪</span>
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-white font-medium">{isRTL ? 'ניפגש בכניסה' : 'Meet at entrance'}</p>
                      <p className="text-white/50 text-xs">{isRTL ? 'נקודת מפגש בטוחה' : 'Safe neutral meeting point'}</p>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2">
            {/* 📸 Camera Button */}
            <motion.button
              onClick={() => imageInputRef.current?.click()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-[#1a4d3e]/50 hover:bg-[#1a4d3e] transition-colors"
            >
              <Camera className="h-5 w-5 text-white/70" />
            </motion.button>
            
            {/* 📍 Location Share Button */}
            <motion.button
              onClick={() => setShowLocationOptions(!showLocationOptions)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                showLocationOptions 
                  ? 'bg-[#4ade80]/30 text-[#4ade80]' 
                  : 'bg-[#1a4d3e]/50 hover:bg-[#1a4d3e] text-white/70'
              }`}
            >
              <Navigation className="h-5 w-5" />
            </motion.button>
            
            {/* 😊 v2.8.26: Emoji Picker Button */}
            <motion.button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                showEmojiPicker 
                  ? 'bg-[#4ade80]/30' 
                  : 'bg-[#1a4d3e]/50 hover:bg-[#1a4d3e]'
              }`}
            >
              <span className="text-xl">😊</span>
            </motion.button>
            
            {/* 😊 v2.8.26: Emoji Picker Popup */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="absolute bottom-24 left-4 right-4 bg-[#1a4d3e] border border-[#4ade80]/30 rounded-2xl p-4 shadow-xl z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">
                      {isRTL ? '😊 אימוג\'ים' : '😊 Emojis'}
                    </h3>
                    <button 
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-white/50 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Emoji Categories */}
                  <div className="space-y-3">
                    {/* Flirty & Fun */}
                    <div>
                      <p className="text-white/40 text-xs mb-2">{isRTL ? '💕 פלירט' : '💕 Flirty'}</p>
                      <div className="flex flex-wrap gap-2">
                        {['😍', '🥰', '😘', '💕', '❤️', '🔥', '✨', '💫', '🌹', '💋'].map((emoji) => (
                          <motion.button
                            key={emoji}
                            onClick={() => {
                              setInputText(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-2xl p-1 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Party & Fun */}
                    <div>
                      <p className="text-white/40 text-xs mb-2">{isRTL ? '🎉 מסיבה' : '🎉 Party'}</p>
                      <div className="flex flex-wrap gap-2">
                        {['🎉', '🥳', '🍹', '🍸', '🍻', '💃', '🕺', '🎶', '🎤', '🪩'].map((emoji) => (
                          <motion.button
                            key={emoji}
                            onClick={() => {
                              setInputText(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-2xl p-1 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Reactions */}
                    <div>
                      <p className="text-white/40 text-xs mb-2">{isRTL ? '😄 תגובות' : '😄 Reactions'}</p>
                      <div className="flex flex-wrap gap-2">
                        {['😄', '😂', '🤣', '😎', '🤩', '👋', '👍', '👏', '🙌', '🦎'].map((emoji) => (
                          <motion.button
                            key={emoji}
                            onClick={() => {
                              setInputText(prev => prev + emoji)
                              setShowEmojiPicker(false)
                            }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-2xl p-1 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder={t('chat.typeMessage')}
                className="h-12 rounded-full bg-[#1a4d3e]/50 border-[#4ade80]/20 text-white placeholder:text-white/40 pr-12"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              />
            </div>
            
            <motion.button
              onClick={handleSend}
              disabled={!inputText.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                h-12 w-12 rounded-full flex items-center justify-center
                ${inputText.trim() 
                  ? "bg-[#4ade80] hover:bg-[#3bc970]" 
                  : "bg-[#1a4d3e]/50 cursor-not-allowed"
                }
                transition-colors
              `}
            >
              <Send className={`h-5 w-5 ${inputText.trim() ? "text-[#0d2920]" : "text-white/30"}`} />
            </motion.button>
          </div>
        </div>
      ) : (
        // ✅ EXPIRED: Read-only mode
        <div className="bg-[#0d2920]/90 border-t border-[#4ade80]/20 p-4 backdrop-blur-sm">
          <div className="text-center py-2">
            <p className="text-white/60 text-sm" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('chat.chatExpired')}
            </p>
            <p className="text-white/40 text-xs mt-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('chat.chatExpiredNote')}
            </p>
          </div>
        </div>
      )}

      {/* 🎬 GENTLE ANIMATION */}
      <GentleSendAnimation />

      {/* 🚨 REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => !reportSubmitting && setShowReportModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-2 border-red-500/30 shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Block & Report</h2>
                    <p className="text-xs text-white/60">Report {matchUser.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => !reportSubmitting && setShowReportModal(false)}
                  className="rounded-full text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              {reportSuccess ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-16 w-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4"
                  >
                    <CheckCheck className="h-8 w-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
                  <p className="text-white/60">Thank you for helping keep I4IGUANA safe.</p>
                  <p className="text-white/40 text-sm mt-2">User has been blocked.</p>
                </div>
              ) : (
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Warning */}
                  <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">
                      This will block {matchUser.name} and remove this match. This action cannot be undone.
                    </p>
                  </div>

                  {/* Your Name */}
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Your Name</label>
                    <Input
                      value={reportData.name}
                      onChange={(e) => setReportData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your name"
                      className="h-12 rounded-xl bg-[#0d2920]/50 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>

                  {/* Email - REQUIRED */}
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Email *</label>
                    <Input
                      type="email"
                      value={reportData.email}
                      onChange={(e) => setReportData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                      className={`h-12 rounded-xl bg-[#0d2920]/50 border-white/20 text-white placeholder:text-white/40 ${
                        reportData.email && !isValidEmail(reportData.email) ? 'border-red-500' : ''
                      }`}
                    />
                    {reportData.email && !isValidEmail(reportData.email) && (
                      <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Phone (optional)</label>
                    <Input
                      type="tel"
                      value={reportData.phone}
                      onChange={(e) => setReportData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="05X-XXXXXXX"
                      className="h-12 rounded-xl bg-[#0d2920]/50 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm text-white/70 mb-2">What happened? *</label>
                    <Textarea
                      value={reportData.description}
                      onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Please describe the issue, inappropriate behavior, or any feedback you'd like to share..."
                      rows={4}
                      className="rounded-xl bg-[#0d2920]/50 border-white/20 text-white placeholder:text-white/40 resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowReportModal(false)}
                      disabled={reportSubmitting}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitReport}
                      disabled={reportSubmitting || !reportData.description.trim() || !reportData.email.trim() || !isValidEmail(reportData.email)}
                      className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                    >
                      {reportSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          Block & Report
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 📸 IMAGE PREVIEW MODAL - Before sending */}
      <AnimatePresence>
        {showImageOptions && imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 safe-area-top">
              <button
                onClick={cancelImageSelection}
                className="p-2 rounded-full hover:bg-white/10 active:bg-white/20"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              <h3 className="text-white font-medium text-lg">📸 שליחת תמונה</h3>
              <div className="w-10" />
            </div>

            {/* Image Preview - takes available space */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Options - Fixed at bottom with safe area */}
            <div className="p-4 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent" dir="rtl">
              {/* View-once toggle */}
              <button
                onClick={() => setViewOnceEnabled(!viewOnceEnabled)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-2xl mb-4
                  ${viewOnceEnabled 
                    ? 'bg-pink-500/20 border-2 border-pink-500' 
                    : 'bg-white/10 border-2 border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${viewOnceEnabled ? 'bg-pink-500' : 'bg-white/20'}
                  `}>
                    <Eye className={`h-5 w-5 ${viewOnceEnabled ? 'text-white' : 'text-white/60'}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">צפייה חד-פעמית</p>
                    <p className="text-white/60 text-sm">התמונה תיעלם לאחר צפייה</p>
                  </div>
                </div>
                <div className={`
                  w-6 h-6 rounded-full border-2
                  ${viewOnceEnabled 
                    ? 'bg-pink-500 border-pink-500' 
                    : 'border-white/40'
                  }
                  flex items-center justify-center
                `}>
                  {viewOnceEnabled && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 bg-white rounded-full"
                    />
                  )}
                </div>
              </button>

              {/* Send Button - BIG and visible! */}
              <motion.button
                onClick={() => {
                  console.log('📸 Send button clicked!')
                  sendSelectedImage()
                }}
                disabled={isUploadingImage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-bold text-xl disabled:opacity-50 shadow-lg shadow-green-500/30 active:shadow-none"
              >
                {isUploadingImage ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-[#0d2920]/30 border-t-[#0d2920] rounded-full animate-spin" />
                    <span>שולח...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Send className="h-6 w-6" />
                    <span>{viewOnceEnabled ? 'שלח תמונה חד-פעמית 👁️' : 'שלח תמונה 📤'}</span>
                  </div>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📸 IMAGE VIEWER MODAL - For viewing images */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
            onClick={closeImageViewer}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <button
                onClick={closeImageViewer}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              {viewingImage.isViewOnce && (
                <div className="flex items-center gap-2 text-pink-400 text-sm">
                  <Eye className="h-4 w-4" />
                  <span>תמונה חד-פעמית</span>
                </div>
              )}
              <div className="w-10" />
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={viewingImage.url}
                alt="תמונה"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* View-once notice */}
            {viewingImage.isViewOnce && (
              <div className="p-4 text-center">
                <p className="text-pink-400 text-sm">
                  התמונה תיעלם כשתסגור את המסך
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ✅ Debug Panel - Long press header for 3 seconds */}
      <DebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />
    </div>
  )
}
