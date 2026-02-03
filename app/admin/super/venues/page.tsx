"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  MapPin, 
  Users, 
  TrendingUp, 
  Download,
  Edit,
  Trash2,
  LogOut,
  Bell,
  RefreshCw,
  FileText,
  Flag,
  Mail,
  ChevronDown,
  Inbox,
  Activity,
  Crown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { 
  getAllVenues, 
  deleteVenue, 
  Venue 
} from '@/lib/venue-service'
import { getAdminData, adminLogout } from '@/lib/admin-auth'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, doc, getDoc, updateDoc, arrayRemove, query, where } from 'firebase/firestore'
import AddVenueModal from '@/components/add-venue-modal'

// ✅ NEW: Auto-cleanup expired check-ins
async function cleanupExpiredCheckIns(venues: Venue[]) {
  console.log('🧹 Starting cleanup of expired check-ins...')
  
  for (const venue of venues) {
    if (!venue.checkedInUsers || venue.checkedInUsers.length === 0) continue
    
    const expiredUsers: string[] = []
    
    for (const userId of venue.checkedInUsers) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId))
        
        if (!userDoc.exists()) {
          // User doesn't exist - remove from venue
          console.log(`🗑️ User ${userId} doesn't exist - removing from ${venue.name}`)
          expiredUsers.push(userId)
          continue
        }
        
        const userData = userDoc.data()
        
        // Check if user is still checked into THIS venue
        if (userData.checkedInVenue !== venue.id) {
          console.log(`🗑️ User ${userId} not checked into ${venue.name} anymore - removing`)
          expiredUsers.push(userId)
          continue
        }
        
        // Check if check-in expired
        if (userData.checkInData?.expiresAt) {
          const now = Date.now()
          let expiresAt: number
          
          const expiry = userData.checkInData.expiresAt
          if (typeof expiry.toMillis === 'function') {
            expiresAt = expiry.toMillis()
          } else if (typeof expiry === 'number') {
            expiresAt = expiry
          } else {
            continue
          }
          
          if (now > expiresAt) {
            console.log(`⏰ User ${userId} check-in expired - removing from ${venue.name}`)
            expiredUsers.push(userId)
          }
        }
      } catch (error) {
        console.error(`Error checking user ${userId}:`, error)
      }
    }
    
    // Remove expired users from venue
    if (expiredUsers.length > 0) {
      try {
        const venueRef = doc(db, 'venues', venue.id)
        for (const userId of expiredUsers) {
          await updateDoc(venueRef, {
            checkedInUsers: arrayRemove(userId)
          })
        }
        console.log(`✅ Removed ${expiredUsers.length} expired users from ${venue.name}`)
      } catch (error) {
        console.error(`Error removing users from ${venue.name}:`, error)
      }
    }
  }
  
  console.log('🧹 Cleanup complete!')
}

export default function SuperAdminPanel() {
  const router = useRouter()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const [showAddVenue, setShowAddVenue] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('all')  // ✅ City filter
  const [sortBy, setSortBy] = useState<'name' | 'city'>('name')  // ✅ Sort option
  const [cleaning, setCleaning] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [pendingReportsCount, setPendingReportsCount] = useState(0)
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [feedbackCount, setFeedbackCount] = useState(0)  // ✅ v2.8.6: Pilot feedback
  const [premiumRequestsCount, setPremiumRequestsCount] = useState(0)  // ✅ Premium upgrade requests
  const [audiobookOrdersCount, setAudiobookOrdersCount] = useState(0)  // ✅ Audiobook orders
  const [showInboxDropdown, setShowInboxDropdown] = useState(false)
  
  // Listen for waitlist entries (only unhandled)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pilotWaitlist'),
      (snapshot) => {
        // Count only entries that are NOT handled
        const unhandledCount = snapshot.docs.filter(doc => {
          const data = doc.data()
          return !data.handled // Count if handled is false, undefined, or null
        }).length
        setWaitlistCount(unhandledCount)
      }
    )
    return () => unsubscribe()
  }, [])
  
  // Listen for pending venue requests
  useEffect(() => {
    const q = query(
      collection(db, 'venueRequests'),
      where('status', '==', 'pending')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRequestsCount(snapshot.size)
    })
    
    return () => unsubscribe()
  }, [])

  // Listen for pending reports
  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingReportsCount(snapshot.size)
    })
    
    return () => unsubscribe()
  }, [])
  
  // ✅ v2.8.6: Listen for pilot feedback (unread)
  // ✅ v2.8.32: Also count meetingFeedback!
  useEffect(() => {
    let pilotUnread = 0
    let meetingUnread = 0
    
    // Listen to pilotFeedback
    const unsubPilot = onSnapshot(
      collection(db, 'pilotFeedback'),
      (snapshot) => {
        pilotUnread = snapshot.docs.filter(doc => !doc.data().read).length
        setFeedbackCount(pilotUnread + meetingUnread)
      }
    )
    
    // Listen to meetingFeedback
    const unsubMeeting = onSnapshot(
      collection(db, 'meetingFeedback'),
      (snapshot) => {
        meetingUnread = snapshot.docs.filter(doc => !doc.data().read).length
        setFeedbackCount(pilotUnread + meetingUnread)
      }
    )
    
    return () => {
      unsubPilot()
      unsubMeeting()
    }
  }, [])
  
  // ✅ Listen for premium upgrade requests
  useEffect(() => {
    const q = query(
      collection(db, 'premium_requests'),
      where('status', '==', 'pending')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPremiumRequestsCount(snapshot.size)
    })
    
    return () => unsubscribe()
  }, [])
  
  // ✅ Listen for pending audiobook orders
  useEffect(() => {
    const q = query(
      collection(db, 'audiobook_orders'),
      where('status', '==', 'pending')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAudiobookOrdersCount(snapshot.size)
    })
    
    return () => unsubscribe()
  }, [])
  
  // Manual cleanup handler
  const handleCleanup = async () => {
    setCleaning(true)
    try {
      await cleanupExpiredCheckIns(venues)
      // Reload venues after cleanup
      const venuesData = await getAllVenues()
      setVenues(venuesData)
    } catch (error) {
      console.error('❌ Cleanup error:', error)
    } finally {
      setCleaning(false)
    }
  }

  // Load admin and venues
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/admin/login')
          return
        }

        // Verify super admin
        const adminData = await getAdminData(user.uid)
        if (!adminData || adminData.role !== 'super') {
          console.error('❌ Not a super admin')
          router.push('/admin/login')
          return
        }

        setAdminEmail(adminData.email)

        // Load venues (initial load)
        const venuesData = await getAllVenues()
        setVenues(venuesData)
        console.log(`✅ Loaded ${venuesData.length} venues`)
        
        // ✅ NEW: Auto-cleanup expired check-ins
        await cleanupExpiredCheckIns(venuesData)
        
      } catch (error) {
        console.error('❌ Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // ✅ NEW: Real-time listener for ALL venues updates (check-ins/check-outs)
  // Only start listener AFTER admin is verified
  useEffect(() => {
    // ✅ FIX: Wait for admin to be verified before starting listener
    if (!adminEmail) {
      console.log('⏳ Waiting for admin verification before starting listener...')
      return
    }
    
    console.log('👁️ Setting up real-time listener for all venues')
    
    const unsubscribe = onSnapshot(
      collection(db, 'venues'),
      (snapshot) => {
        const updatedVenues: Venue[] = []
        snapshot.forEach((docSnap) => {
          // Include document ID in venue data
          updatedVenues.push({ ...docSnap.data(), id: docSnap.id } as Venue)
        })
        setVenues(updatedVenues)
        
        // Calculate total active users
        const totalActive = updatedVenues.reduce((sum, v) => sum + (v.checkedInUsers?.length || 0), 0)
        console.log(`🔄 Venues updated - Total active users: ${totalActive}`)
      },
      (error) => {
        console.error('❌ Error listening to venues:', error)
      }
    )

    return () => {
      console.log('👋 Cleaning up venues listener')
      unsubscribe()
    }
  }, [adminEmail])  // ✅ FIX: Only run after adminEmail is set

  const handleLogout = async () => {
    try {
      await adminLogout()
      router.push('/admin/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  const handleDeleteVenue = async (venueId: string, venueName: string) => {
    if (!confirm(`Are you sure you want to delete "${venueName}"? This cannot be undone.`)) {
      return
    }

    try {
      await deleteVenue(venueId)
      setVenues(venues.filter(v => v.id !== venueId))
      console.log('✅ Venue deleted')
    } catch (error) {
      console.error('❌ Error deleting venue:', error)
      alert('Failed to delete venue')
    }
  }

  const handleDownloadQR = (venue: Venue) => {
    // Create download link
    const link = document.createElement('a')
    link.href = venue.qrCode
    link.download = `${venue.name}-QR-Code.png`
    link.click()
    
    console.log('📥 QR code downloaded:', venue.name)
  }

  // ✅ Get unique cities for dropdown
  const uniqueCities = [...new Set(venues.map(v => (v as any).city || '').filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he'))

  // ✅ Filter and sort venues
  const filteredVenues = [...venues]  // Create a copy to avoid mutating original
    .filter(venue => {
      // Search filter
      const matchesSearch = 
        venue.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (venue.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // City filter
      const venueCity = (venue as any).city || ''
      const matchesCity = cityFilter === 'all' || venueCity === cityFilter
      
      return matchesSearch && matchesCity
    })
    .sort((a, b) => {
      // Sort by city first if selected
      if (sortBy === 'city') {
        const cityA = (a as any).city || ''
        const cityB = (b as any).city || ''
        const cityCompare = cityA.localeCompare(cityB, 'he')
        if (cityCompare !== 0) return cityCompare
      }
      // Sort by displayName (Hebrew alphabetical, ascending = א→ת)
      return a.displayName.localeCompare(b.displayName, 'he')
    })

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d2920] to-[#0d2920]/80 border-b border-[#4ade80]/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Mobile: Stack layout, Desktop: Row layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title - Always visible */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-3xl sm:text-5xl">🦎</div>
              <div>
                <h1 className="text-xl sm:text-3xl font-black text-white">
                  Super Admin Panel
                </h1>
                <p className="text-[#4ade80] text-xs sm:text-sm font-semibold">
                  {adminEmail}
                </p>
              </div>
            </div>

            {/* Buttons - Horizontal scroll on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* 🤖 Dummies Admin Button */}
              <Button
                onClick={() => router.push('/admin/super/dummies')}
                variant="outline"
                size="sm"
                className="border-[#f97316]/50 text-[#f97316] hover:bg-[#f97316]/20 h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0"
              >
                <Users className="mr-1 sm:mr-2 h-4 w-4" />
                🎬 Dummies
              </Button>
              
              {/* 🧹 Cleanup Button */}
              <Button
                onClick={() => router.push('/admin/super/venues-cleanup')}
                variant="outline"
                size="sm"
                className="border-[#ef4444]/50 text-[#ef4444] hover:bg-[#ef4444]/20 h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0"
              >
                <Trash2 className="mr-1 sm:mr-2 h-4 w-4" />
                🧹 Cleanup
              </Button>
              
              {/* 🗺️ Zones Overview Button */}
              <Button
                onClick={() => router.push('/admin/super/zones-overview')}
                variant="outline"
                size="sm"
                className="border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6]/20 h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0"
              >
                <MapPin className="mr-1 sm:mr-2 h-4 w-4" />
                🗺️ Zones
              </Button>
              
              {/* 📍 Places Import Button */}
              <Button
                onClick={() => router.push('/admin/super/places-import')}
                variant="outline"
                size="sm"
                className="border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/20 h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0"
              >
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                📍 Import
              </Button>
              
              {/* Inbox Dropdown */}
              <div className="relative flex-shrink-0">
                <Button
                  onClick={() => setShowInboxDropdown(!showInboxDropdown)}
                  variant="outline"
                  size="sm"
                  className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20 relative h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Inbox className="mr-1 sm:mr-2 h-4 w-4" />
                  Inbox
                  <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showInboxDropdown ? 'rotate-180' : ''}`} />
                  {(pendingReportsCount + pendingRequestsCount + waitlistCount + feedbackCount + premiumRequestsCount + audiobookOrdersCount) > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {pendingReportsCount + pendingRequestsCount + waitlistCount + feedbackCount + premiumRequestsCount + audiobookOrdersCount}
                    </span>
                  )}
                </Button>
                
                {/* Dropdown Menu */}
                {showInboxDropdown && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowInboxDropdown(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#0d2920] border border-[#4ade80]/30 rounded-xl shadow-2xl overflow-hidden z-50">
                      {/* Reports */}
                      <button
                        onClick={() => {
                          router.push('/admin/super/reports')
                          setShowInboxDropdown(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Flag className="h-5 w-5 text-red-400" />
                          <span className="text-white">דיווחים</span>
                        </div>
                        {pendingReportsCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {pendingReportsCount}
                          </span>
                        )}
                      </button>
                      
                      {/* Requests */}
                      <button
                        onClick={() => {
                          router.push('/admin/super/requests')
                          setShowInboxDropdown(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-orange-400" />
                          <span className="text-white">בקשות</span>
                        </div>
                        {pendingRequestsCount > 0 && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                            {pendingRequestsCount}
                          </span>
                        )}
                      </button>
                      
                      {/* Waitlist */}
                      <button
                        onClick={() => {
                          router.push('/admin/super/waitlist')
                          setShowInboxDropdown(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-[#4ade80]" />
                          <span className="text-white">רשימת המתנה</span>
                        </div>
                        {waitlistCount > 0 && (
                          <span className="px-2 py-0.5 bg-[#4ade80] text-[#0d2920] text-xs font-bold rounded-full">
                            {waitlistCount}
                          </span>
                        )}
                      </button>
                      
                      {/* ✅ v2.8.6: Pilot Feedback */}
                      <button
                        onClick={() => {
                          router.push('/admin/super/feedback')
                          setShowInboxDropdown(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💬</span>
                          <span className="text-white">פידבק פיילוט</span>
                        </div>
                        {feedbackCount > 0 && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                            {feedbackCount}
                          </span>
                        )}
                      </button>
                      
                      {/* ✅ Premium Upgrade Requests */}
                      <button
                        onClick={() => {
                          router.push('/admin/super/premium')
                          setShowInboxDropdown(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Crown className="h-5 w-5 text-amber-400" />
                          <span className="text-white">בקשות Premium</span>
                        </div>
                        {premiumRequestsCount > 0 && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                            {premiumRequestsCount}
                          </span>
                        )}
                      </button>
                      
                      {/* 🎧 FunnyDates Audiobook Orders */}
                      <button
                        onClick={() => {
                          router.push('/admin/super/audiobook')
                          setShowInboxDropdown(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🎧</span>
                          <span className="text-white">רכישות אודיובוק</span>
                        </div>
                        {audiobookOrdersCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                            {audiobookOrdersCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* 🔴 LIVE Dashboard Button */}
              <Button
                onClick={() => router.push('/admin/super/live')}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-red-500/50 text-red-400 hover:bg-red-500/20 h-9 sm:h-10 text-xs sm:text-sm animate-pulse hover:animate-none"
              >
                <Activity className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Live</span>
                <span className="sm:hidden">🔴</span>
              </Button>
              
              {/* 🔔 Notifications Debug Button */}
              <Button
                onClick={() => router.push('/admin/super/notifications-debug')}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Bell className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Push</span>
                <span className="sm:hidden">🔔</span>
              </Button>
              
              <Button
                onClick={() => router.push('/admin/super/db')}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Users className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">DB Manager</span>
                <span className="sm:hidden">DB</span>
              </Button>
              <Button
                onClick={() => router.push('/admin/super/tests')}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 h-9 sm:h-10 text-xs sm:text-sm hidden sm:flex"
              >
                <TrendingUp className="mr-1 sm:mr-2 h-4 w-4" />
                Tests
              </Button>
              <Button
                onClick={() => router.push('/admin/super/stickers')}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 h-9 sm:h-10 text-xs sm:text-sm hidden sm:flex"
              >
                🎨
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 text-white hover:bg-white/10 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#4ade80]/20 rounded-xl">
                <MapPin className="h-8 w-8 text-[#4ade80]" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Total Venues</p>
                <h3 className="text-3xl font-black text-white">
                  {venues.length}
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#4ade80]/20 rounded-xl">
                <Users className="h-8 w-8 text-[#4ade80]" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Active Now</p>
                <h3 className="text-3xl font-black text-white">
                  {venues.reduce((sum, v) => sum + (v.checkedInUsers?.length || 0), 0)}
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#4ade80]/20 rounded-xl">
                <TrendingUp className="h-8 w-8 text-[#4ade80]" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Total Check-ins</p>
                <h3 className="text-3xl font-black text-white">
                  {venues.reduce((sum, v) => sum + (v.stats?.totalCheckIns || 0), 0)}
                </h3>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions Bar - Sticky on mobile */}
        <div className="sticky top-0 z-30 bg-gradient-to-b from-[#0d2920] to-[#0d2920]/95 backdrop-blur-md py-3 sm:py-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-4">
          <div className="flex flex-col gap-2">
            {/* Row 1: Search + Add */}
            <div className="flex gap-2 sm:gap-4">
              <Input
                placeholder="🔍 Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-10 sm:h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40 text-sm"
              />
              
              {/* Cleanup Button */}
              <Button
                onClick={handleCleanup}
                disabled={cleaning}
                variant="outline"
                size="sm"
                className="h-10 sm:h-12 px-3 border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20 text-xs sm:text-sm"
              >
                <RefreshCw className={`mr-1 h-4 w-4 ${cleaning ? 'animate-spin' : ''}`} />
                {cleaning ? '...' : 'Clean'}
              </Button>
              
              <Button
                onClick={() => setShowAddVenue(true)}
                size="sm"
                className="h-10 sm:h-12 px-3 sm:px-4 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold text-xs sm:text-sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
            
            {/* Row 2: City Filter + Sort */}
            <div className="flex gap-2 items-center">
              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-9 px-3 bg-[#0d2920]/70 border border-[#4ade80]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#4ade80]"
              >
                <option value="all">🏙️ כל הערים ({venues.length})</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>
                    {city} ({venues.filter(v => (v as any).city === city).length})
                  </option>
                ))}
              </select>
              
              {/* Sort Toggle */}
              <Button
                onClick={() => setSortBy(sortBy === 'name' ? 'city' : 'name')}
                variant="outline"
                size="sm"
                className="h-9 px-3 border-[#4ade80]/30 text-white hover:bg-[#4ade80]/20 text-xs"
              >
                {sortBy === 'name' ? '🔤 א-ב' : '🏙️ עיר→א-ב'}
              </Button>
              
              {/* Results count */}
              <span className="text-white/60 text-sm ml-auto">
                {filteredVenues.length} מועדונים
              </span>
            </div>
          </div>
        </div>

        {/* Venues List */}
        <div className="pb-8">
          {filteredVenues.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🦎</div>
              <p className="text-white/60 text-lg">
                {searchTerm ? 'No venues found' : 'No venues yet. Add your first venue!'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  layout
                  className="group bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 hover:border-[#4ade80] rounded-2xl p-4 sm:p-6 transition-all mb-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-2xl font-black text-white truncate">
                          {venue.displayName}
                        </h3>
                        {venue.active ? (
                          <span className="px-2 sm:px-3 py-1 bg-[#4ade80]/20 text-[#4ade80] text-xs font-bold rounded-full flex-shrink-0">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 sm:px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full flex-shrink-0">
                            INACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-white/60 text-xs sm:text-sm mb-3 sm:mb-4">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{venue.location?.address || (venue as any).address || 'No address'}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-white/40 text-xs mb-1">Admin</p>
                          <p className="text-white text-xs sm:text-sm font-medium truncate">{venue.adminEmail}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Active</p>
                          <p className="text-[#4ade80] text-base sm:text-lg font-bold">
                            {venue.checkedInUsers?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Check-ins</p>
                          <p className="text-white text-base sm:text-lg font-bold">
                            {venue.stats?.totalCheckIns || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 justify-end flex-shrink-0">
                      <Button
                        onClick={() => handleDownloadQR(venue)}
                        size="sm"
                        variant="ghost"
                        className="text-[#4ade80] hover:bg-[#4ade80]/20"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={() => router.push(`/admin/super/venue/${venue.id}`)}
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteVenue(venue.id, venue.name)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Add Venue Modal */}
      {showAddVenue && (
        <AddVenueModal
          onClose={() => setShowAddVenue(false)}
          onSuccess={async () => {
            // Reload venues after successful creation
            const venuesData = await getAllVenues()
            setVenues(venuesData)
          }}
        />
      )}
    </div>
  )
}
