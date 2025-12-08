"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, MapPin, Clock, MoreVertical, CheckCheck, Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  sendMessage, 
  listenToChatMessages, 
  markMessagesAsRead,
  ChatMessage 
} from "@/lib/chat-system"
import { 
  setTypingStatus, 
  subscribeToTypingStatus 
} from "@/lib/chat-service"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface ChatScreenProps {
  matchId: string
  currentUserId: string
  otherUserId: string
  matchUser: {
    name: string
    photo: string
    distance: string
  }
  // ✅ NEW: Current user info for notifications
  currentUser?: {
    name: string
    photo: string
  }
  timeRemaining: number
  onBack?: () => void
  onViewProfile?: () => void  // ✅ NEW: Callback to view match profile
}

interface DisplayMessage {
  id: string
  text: string
  sender: "me" | "them"
  timestamp: Date
  status?: "sent" | "delivered" | "read"
  likedBy?: string[]  // ✅ NEW: Array of user IDs who liked this message
}

export default function ChatScreen({ 
  matchId: propMatchId,
  currentUserId: propCurrentUserId,
  otherUserId: propOtherUserId,
  matchUser,
  currentUser,  // ✅ NEW
  timeRemaining,
  onBack = () => {},
  onViewProfile  // ✅ NEW
}: ChatScreenProps) {
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
  
  // 🔊 SOUND - Multiple attempts to ensure it works!
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // 🎬 ANIMATION - Gentle and elegant
  const [showSendAnimation, setShowSendAnimation] = useState(false)
  const [animationPosition, setAnimationPosition] = useState({ x: 0, y: 0 })

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
      const displayMessages: DisplayMessage[] = firestoreMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.senderId === currentUserId ? "me" : "them",
        timestamp: msg.timestamp?.toDate() || new Date(),
        status: msg.status || "sent",
        likedBy: msg.likedBy || []  // ✅ NEW: Load likes from Firestore
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
  }, [matchId, currentUserId])

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
  
  const toggleMessageLike = async (messageId: string) => {
    if (!matchId || !currentUserId) return
    
    try {
      const { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      const messageRef = doc(db, 'chats', matchId, 'messages', messageId)
      
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
        <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#4ade80] flex-shrink-0">
          <img src={matchUser.photo} alt={matchUser.name} className="h-full w-full object-cover" />
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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]">
      {/* Header */}
      <div className="bg-[#0d2920]/80 border-b border-[#4ade80]/20 backdrop-blur-sm sticky top-0 z-50">
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
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#4ade80]">
                  <img 
                    src={matchUser.photo} 
                    alt={matchUser.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#4ade80] border-2 border-[#0d2920]" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="font-sans font-bold text-white text-base">{matchUser.name}</h2>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <MapPin className="h-3 w-3" />
                  <span>{matchUser.distance} away</span>
                </div>
              </div>
            </button>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full text-white hover:bg-white/10"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

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
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#4ade80]">
                <img src={matchUser.photo} alt={matchUser.name} className="h-full w-full object-cover" />
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
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-end gap-2 max-w-[75%] ${message.sender === "me" ? "flex-row-reverse" : "flex-row"}`}>
                {message.sender === "them" && (
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#4ade80] flex-shrink-0">
                    <img src={matchUser.photo} alt={matchUser.name} className="h-full w-full object-cover" />
                  </div>
                )}
                
                <div className="relative group">
                  <div className={`
                    px-4 py-3 rounded-2xl
                    ${message.sender === "me" 
                      ? "bg-[#4ade80] text-[#0d2920] rounded-br-md" 
                      : "bg-[#1a4d3e] text-white rounded-bl-md border border-[#4ade80]/20"
                    }
                  `}>
                    <p className="font-sans text-base">{message.text}</p>
                  </div>
                  
                  {/* ❤️ LIKE BUTTON - Shows on tap/hover */}
                  <div className={`
                    absolute -bottom-1 ${message.sender === "me" ? "-left-6" : "-right-6"}
                    relative
                  `}>
                    <motion.button
                      onClick={() => toggleMessageLike(message.id)}
                      whileTap={{ scale: 1.4 }}
                      animate={likeAnimations[message.id] ? { scale: [1, 1.3, 1] } : {}}
                      className={`
                        p-1 rounded-full transition-all duration-200
                        ${message.likedBy?.length 
                          ? "opacity-100" 
                          : "opacity-40 group-hover:opacity-100"
                        }
                      `}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Heart 
                        className={`h-4 w-4 transition-all duration-200 ${
                          message.likedBy?.includes(currentUserId)
                            ? "text-red-500 fill-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                            : "text-white/50 hover:text-red-400"
                        }`}
                      />
                    </motion.button>
                    {/* ❤️ HEART BURST ANIMATION */}
                    <HeartBurst show={likeAnimations[message.id] || false} />
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

      {/* ✅ Suggested Messages - Always visible to help start conversation */}
      {messages.length < 3 && !loading && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="px-4 pb-2"
        >
          <p className="text-xs text-white/40 mb-2 text-center">Quick replies:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Hey! Nice to match with you 👋",
              "What brings you here today?",
              "Love your photos! 📸",
              "Ready to meet up? 😊",
              "Hi! How's your day going?"
            ].map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setInputText(suggestion)
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-1.5 bg-[#1a4d3e]/60 hover:bg-[#4ade80]/20 border border-[#4ade80]/30 rounded-full text-xs text-white/80 hover:text-white transition-all"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {messages.length === 0 && !loading && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4 pb-2"
        >
          <Button
            onClick={handleSuggestMeetup}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold text-base shadow-lg"
          >
            <MapPin className="mr-2 h-5 w-5" />
            Suggest a Meetup Spot
          </Button>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="bg-[#0d2920]/90 border-t border-[#4ade80]/20 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="h-12 rounded-full bg-[#1a4d3e]/50 border-[#4ade80]/20 text-white placeholder:text-white/40 pr-12"
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

      {/* 🎬 GENTLE ANIMATION */}
      <GentleSendAnimation />
    </div>
  )
}
