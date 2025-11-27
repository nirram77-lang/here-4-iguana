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
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { 
  getAllVenues, 
  deleteVenue, 
  Venue 
} from '@/lib/venue-service'
import { getAdminData, adminLogout } from '@/lib/admin-auth'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore'
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
  const [cleaning, setCleaning] = useState(false)
  
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
        snapshot.forEach((doc) => {
          updatedVenues.push(doc.data() as Venue)
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

  // Filter venues
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d2920] to-[#0d2920]/80 border-b border-[#4ade80]/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🦎</div>
              <div>
                <h1 className="text-3xl font-black text-white">
                  Super Admin Panel
                </h1>
                <p className="text-[#4ade80] text-sm font-semibold">
                  {adminEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/admin/super/db')}
                variant="outline"
                className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20"
              >
                <Users className="mr-2 h-5 w-5" />
                DB Manager
              </Button>
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
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

        {/* Actions Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
          />
          
          {/* Cleanup Button */}
          <Button
            onClick={handleCleanup}
            disabled={cleaning}
            variant="outline"
            className="h-12 px-4 border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20"
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${cleaning ? 'animate-spin' : ''}`} />
            {cleaning ? 'Cleaning...' : 'Cleanup'}
          </Button>
          
          <Button
            onClick={() => setShowAddVenue(true)}
            className="h-12 px-6 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Venue
          </Button>
        </div>

        {/* Venues List */}
        <div className="space-y-4">
          {filteredVenues.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🦎</div>
              <p className="text-white/60 text-lg">
                {searchTerm ? 'No venues found' : 'No venues yet. Add your first venue!'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 hover:border-[#4ade80] rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-black text-white">
                          {venue.displayName}
                        </h3>
                        {venue.active ? (
                          <span className="px-3 py-1 bg-[#4ade80]/20 text-[#4ade80] text-xs font-bold rounded-full">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                            INACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                        <MapPin className="h-4 w-4" />
                        {venue.location.address}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-white/40 text-xs mb-1">Admin</p>
                          <p className="text-white text-sm font-medium">{venue.adminEmail}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Active Now</p>
                          <p className="text-[#4ade80] text-lg font-bold">
                            {venue.checkedInUsers?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Total Check-ins</p>
                          <p className="text-white text-lg font-bold">
                            {venue.stats?.totalCheckIns || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
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
