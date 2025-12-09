'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Ticket, Users, MapPin, Trash2, RefreshCw, Plus, 
  CheckCircle, XCircle, Clock, Download, Search,
  AlertTriangle, Gift, Calendar, TrendingUp, BarChart3, Eye, QrCode
} from 'lucide-react'
import { 
  getAnalyticsSummary, 
  getRecentPageViews, 
  getPageDisplayName,
  AnalyticsSummary,
  PageView 
} from '@/lib/analytics-service'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Coupon {
  id: string
  code: string
  type: 'pass' | 'weekly'
  status: 'available' | 'used' | 'expired'
  usedBy: string | null
  usedByEmail?: string | null
  usedAt: any | null
  createdAt: any
  expiresAt?: any | null
}

interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: any
  lastActive?: any
  phoneNumber?: string
  phoneVerified?: boolean
  isPremium?: boolean
  premiumType?: string
  currentVenue?: string | null
  checkedInVenue?: string | null  // ✅ Added - this is what checkin-service uses
  checkedInAt?: any | null
}

interface Venue {
  id: string
  name: string
  address?: string
  activeUsers?: number
}

interface CheckIn {
  oderId: string
  userName: string
  userEmail: string
  userPhoto?: string
  checkedInAt: any
  venueId: string
  venueName: string
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AdminControlPanel() {
  const [activeTab, setActiveTab] = useState<'coupons' | 'users' | 'checkins' | 'stats' | 'analytics'>('stats')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponFilter, setCouponFilter] = useState<'all' | 'available' | 'used'>('all')
  const [couponTypeFilter, setCouponTypeFilter] = useState<'all' | 'pass' | 'weekly'>('all')

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [inactiveDays, setInactiveDays] = useState(30)

  // Analytics state
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null)
  const [recentViews, setRecentViews] = useState<PageView[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Check-ins state
  const [venues, setVenues] = useState<Venue[]>([])
  const [activeCheckIns, setActiveCheckIns] = useState<CheckIn[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('all')

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalCoupons: 0,
    usedCoupons: 0,
    availableCoupons: 0,
    passAvailable: 0,
    weeklyAvailable: 0,
    monthlyAvailable: 0,
    activeCheckIns: 0
  })

  // ═══════════════════════════════════════════════════════════════
  // FIREBASE IMPORTS & INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  const getFirebase = async () => {
    const { db } = await import('@/lib/firebase')
    const { 
      collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
      query, where, orderBy, limit, writeBatch, serverTimestamp,
      Timestamp
    } = await import('firebase/firestore')
    return { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, writeBatch, serverTimestamp, Timestamp }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════

  const loadStats = async () => {
    try {
      const { db, collection, getDocs, query, where, Timestamp } = await getFirebase()
      
      // Count users
      const usersSnap = await getDocs(collection(db, 'users'))
      const totalUsers = usersSnap.size
      
      // Active today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = Timestamp.fromDate(today)
      
      let activeToday = 0
      usersSnap.forEach(doc => {
        const data = doc.data()
        if (data.lastActive && data.lastActive.toDate() >= today) {
          activeToday++
        }
      })

      // Count coupons
      const couponsSnap = await getDocs(collection(db, 'coupons'))
      let totalCoupons = 0, usedCoupons = 0, availableCoupons = 0, passAvailable = 0, weeklyAvailable = 0, monthlyAvailable = 0
      
      couponsSnap.forEach(doc => {
        const data = doc.data()
        totalCoupons++
        if (data.status === 'used') usedCoupons++
        if (data.status === 'available') {
          availableCoupons++
          if (data.type === 'pass') passAvailable++
          if (data.type === 'weekly') weeklyAvailable++
          if (data.type === 'monthly') monthlyAvailable++
        }
      })

      // Active check-ins
      let activeCheckIns = 0
      usersSnap.forEach(doc => {
        const data = doc.data()
        // ✅ FIX: Use checkedInVenue (not currentVenue)
        if (data.checkedInVenue) activeCheckIns++
      })

      setStats({
        totalUsers,
        activeToday,
        totalCoupons,
        usedCoupons,
        availableCoupons,
        passAvailable,
        weeklyAvailable,
        monthlyAvailable,
        activeCheckIns
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const { db, collection, getDocs, query, orderBy } = await getFirebase()
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      
      const couponsList: Coupon[] = []
      snap.forEach(doc => {
        couponsList.push({ id: doc.id, ...doc.data() } as Coupon)
      })
      
      setCoupons(couponsList)
    } catch (error) {
      console.error('Error loading coupons:', error)
      setMessage({ type: 'error', text: 'Failed to load coupons' })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { db, collection, getDocs, query, orderBy } = await getFirebase()
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      
      const usersList: User[] = []
      snap.forEach(doc => {
        usersList.push({ id: doc.id, ...doc.data() } as User)
      })
      
      setUsers(usersList)
    } catch (error) {
      console.error('Error loading users:', error)
      setMessage({ type: 'error', text: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  const loadVenuesAndCheckIns = async () => {
    setLoading(true)
    try {
      const { db, collection, getDocs } = await getFirebase()
      
      // Load venues
      const venuesSnap = await getDocs(collection(db, 'venues'))
      const venuesList: Venue[] = []
      venuesSnap.forEach(doc => {
        venuesList.push({ id: doc.id, ...doc.data() } as Venue)
      })
      setVenues(venuesList)

      // Load active check-ins (users with checkedInVenue)
      const usersSnap = await getDocs(collection(db, 'users'))
      const checkInsList: CheckIn[] = []
      
      console.log('🔍 DEBUG: Total users found:', usersSnap.size)
      
      usersSnap.forEach(doc => {
        const data = doc.data()
        
        // Debug: Log all users with any check-in related fields
        if (data.checkedInVenue || data.currentVenue || data.checkInData) {
          console.log('🔍 DEBUG: User with check-in data:', {
            id: doc.id,
            email: data.email,
            checkedInVenue: data.checkedInVenue,
            currentVenue: data.currentVenue,
            checkInData: data.checkInData
          })
        }
        
        // ✅ FIX: Use checkedInVenue (not currentVenue) - this is what checkin-service saves!
        if (data.checkedInVenue) {
          const venue = venuesList.find(v => v.id === data.checkedInVenue)
          console.log('✅ DEBUG: Found checked-in user:', data.email, 'at venue:', data.checkedInVenue)
          checkInsList.push({
            oderId: doc.id,
            userName: data.name || data.displayName || 'Unknown',
            userEmail: data.email,
            userPhoto: data.photos?.[0] || data.photoURL,
            checkedInAt: data.checkInData?.checkedInAt || data.checkedInAt,
            venueId: data.checkedInVenue,
            venueName: venue?.name || data.checkedInVenue || 'Unknown Venue'
          })
        }
      })
      
      console.log('🔍 DEBUG: Total check-ins found:', checkInsList.length)
      setActiveCheckIns(checkInsList)
    } catch (error) {
      console.error('Error loading venues:', error)
      setMessage({ type: 'error', text: 'Failed to load venues' })
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // COUPON FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const generateCouponCode = (type: 'pass' | 'weekly' | 'monthly') => {
    const prefixes = {
      'pass': 'PASS',
      'weekly': 'WEEK',
      'monthly': 'MONTH'
    }
    const prefix = prefixes[type]
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `${prefix}-${code}`
  }

  const createCoupons = async (type: 'pass' | 'weekly' | 'monthly', count: number) => {
    setLoading(true)
    setMessage(null)
    
    try {
      const { db, doc, writeBatch, serverTimestamp } = await getFirebase()
      
      // Firestore allows max 500 operations per batch
      const batchSize = 500
      let created = 0
      
      while (created < count) {
        const batch = writeBatch(db)
        const batchCount = Math.min(batchSize, count - created)
        
        for (let i = 0; i < batchCount; i++) {
          const code = generateCouponCode(type)
          const couponRef = doc(db, 'coupons', code)
          
          batch.set(couponRef, {
            code,
            type,
            status: 'available',
            usedBy: null,
            usedByEmail: null,
            usedAt: null,
            createdAt: serverTimestamp(),
            expiresAt: null
          })
        }
        
        await batch.commit()
        created += batchCount
        console.log(`Created ${created}/${count} coupons`)
      }
      
      setMessage({ type: 'success', text: `✅ Created ${count} ${type.toUpperCase()} coupons!` })
      await loadCoupons()
      await loadStats()
    } catch (error) {
      console.error('Error creating coupons:', error)
      setMessage({ type: 'error', text: 'Failed to create coupons' })
    } finally {
      setLoading(false)
    }
  }

  const redeemCoupon = async (code: string, userId: string, userEmail: string) => {
    try {
      const { db, doc, getDoc, updateDoc, serverTimestamp } = await getFirebase()
      
      const couponRef = doc(db, 'coupons', code)
      const couponSnap = await getDoc(couponRef)
      
      if (!couponSnap.exists()) {
        return { success: false, error: 'Coupon not found' }
      }
      
      const coupon = couponSnap.data()
      
      if (coupon.status !== 'available') {
        return { success: false, error: 'Coupon already used or expired' }
      }
      
      // Mark as used
      await updateDoc(couponRef, {
        status: 'used',
        usedBy: userId,
        usedByEmail: userEmail,
        usedAt: serverTimestamp()
      })
      
      // Grant the benefit to user
      const userRef = doc(db, 'users', userId)
      if (coupon.type === 'pass') {
        await updateDoc(userRef, {
          passes: (await getDoc(userRef)).data()?.passes || 0 + 1
        })
      } else if (coupon.type === 'weekly') {
        const weekFromNow = new Date()
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        await updateDoc(userRef, {
          isPremium: true,
          premiumType: 'weekly',
          premiumExpiresAt: weekFromNow.toISOString()
        })
      }
      
      return { success: true, type: coupon.type }
    } catch (error) {
      console.error('Error redeeming coupon:', error)
      return { success: false, error: 'Failed to redeem coupon' }
    }
  }

  const deleteCoupon = async (code: string) => {
    if (!confirm(`Delete coupon ${code}?`)) return
    
    try {
      const { db, doc, deleteDoc } = await getFirebase()
      await deleteDoc(doc(db, 'coupons', code))
      setMessage({ type: 'success', text: `Deleted coupon ${code}` })
      await loadCoupons()
      await loadStats()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      setMessage({ type: 'error', text: 'Failed to delete coupon' })
    }
  }

  const exportCoupons = (type: 'pass' | 'weekly' | 'all') => {
    const filtered = coupons.filter(c => 
      c.status === 'available' && (type === 'all' || c.type === type)
    )
    
    const csv = ['Code,Type,Status,Created'].concat(
      filtered.map(c => `${c.code},${c.type},${c.status},${c.createdAt?.toDate?.()?.toISOString() || ''}`)
    ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coupons-${type}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // ═══════════════════════════════════════════════════════════════
  // USER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    
    try {
      const { db, doc, deleteDoc } = await getFirebase()
      await deleteDoc(doc(db, 'users', userId))
      setMessage({ type: 'success', text: 'User deleted' })
      await loadUsers()
      await loadStats()
    } catch (error) {
      console.error('Error deleting user:', error)
      setMessage({ type: 'error', text: 'Failed to delete user' })
    }
  }

  const deleteSelectedUsers = async () => {
    if (selectedUsers.size === 0) return
    if (!confirm(`Delete ${selectedUsers.size} selected users? This cannot be undone.`)) return
    
    setLoading(true)
    try {
      const { db, doc, writeBatch } = await getFirebase()
      const batch = writeBatch(db)
      
      selectedUsers.forEach(userId => {
        batch.delete(doc(db, 'users', userId))
      })
      
      await batch.commit()
      setMessage({ type: 'success', text: `Deleted ${selectedUsers.size} users` })
      setSelectedUsers(new Set())
      await loadUsers()
      await loadStats()
    } catch (error) {
      console.error('Error deleting users:', error)
      setMessage({ type: 'error', text: 'Failed to delete users' })
    } finally {
      setLoading(false)
    }
  }

  const selectInactiveUsers = () => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)
    
    const inactive = new Set<string>()
    users.forEach(user => {
      const lastActive = user.lastActive?.toDate?.() || user.createdAt?.toDate?.()
      if (lastActive && lastActive < cutoffDate) {
        inactive.add(user.id)
      }
    })
    
    setSelectedUsers(inactive)
    setMessage({ type: 'success', text: `Selected ${inactive.size} inactive users (${inactiveDays}+ days)` })
  }

  const forceCheckoutUser = async (userId: string) => {
    try {
      const { db, doc, updateDoc } = await getFirebase()
      // ✅ FIX: Clear all check-in related fields
      await updateDoc(doc(db, 'users', userId), {
        currentVenue: null,
        checkedInVenue: null,
        checkInData: null,
        checkedInAt: null
      })
      setMessage({ type: 'success', text: 'User checked out' })
      await loadVenuesAndCheckIns()
    } catch (error) {
      console.error('Error checking out user:', error)
      setMessage({ type: 'error', text: 'Failed to checkout user' })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const [summary, recent] = await Promise.all([
        getAnalyticsSummary(),
        getRecentPageViews(50)
      ])
      setAnalyticsSummary(summary)
      setRecentViews(recent)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setMessage({ type: 'error', text: 'Failed to load analytics' })
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'coupons') loadCoupons()
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'checkins') loadVenuesAndCheckIns()
  }, [activeTab])

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ═══════════════════════════════════════════════════════════════
  // FILTERED DATA
  // ═══════════════════════════════════════════════════════════════

  const filteredCoupons = coupons.filter(c => {
    if (couponFilter !== 'all' && c.status !== couponFilter) return false
    if (couponTypeFilter !== 'all' && c.type !== couponTypeFilter) return false
    return true
  })

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true
    const search = userSearch.toLowerCase()
    return (
      u.email?.toLowerCase().includes(search) ||
      u.displayName?.toLowerCase().includes(search) ||
      u.phoneNumber?.includes(search)
    )
  })

  const filteredCheckIns = activeCheckIns.filter(c => {
    if (selectedVenue === 'all') return true
    return c.venueId === selectedVenue
  })

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🦎 I4IGUANA Control Panel</h1>
        <p className="text-gray-400 mb-6">Manage coupons, users, and check-ins</p>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'stats', icon: TrendingUp, label: '📊 Dashboard' },
            { id: 'analytics', icon: BarChart3, label: '📈 Analytics' },
            { id: 'coupons', icon: Ticket, label: '🎫 Coupons' },
            { id: 'users', icon: Users, label: '👥 Users' },
            { id: 'checkins', icon: MapPin, label: '📍 Check-ins' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                if (tab.id === 'analytics') loadAnalytics()
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 mb-4 text-yellow-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading...
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STATS TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6">
              <Users className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <div className="text-blue-200">Total Users</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6">
              <CheckCircle className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.activeToday}</div>
              <div className="text-green-200">Active Today</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6">
              <Ticket className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.availableCoupons}</div>
              <div className="text-purple-200">Available Coupons</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6">
              <MapPin className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.activeCheckIns}</div>
              <div className="text-orange-200">Active Check-ins</div>
            </div>

            {/* Coupon breakdown */}
            <div className="col-span-2 bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">🎫 Coupon Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{stats.passAvailable}</div>
                  <div className="text-gray-400">PASS Available</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-cyan-400">{stats.weeklyAvailable}</div>
                  <div className="text-gray-400">WEEKLY Available</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{stats.monthlyAvailable}</div>
                  <div className="text-gray-400">MONTHLY Available</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{stats.usedCoupons}</div>
                  <div className="text-gray-400">Used</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-400">{stats.totalCoupons}</div>
                  <div className="text-gray-400">Total</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-span-2 bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">⚡ Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setActiveTab('coupons'); createCoupons('pass', 100) }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors"
                >
                  + 100 PASS
                </button>
                <button
                  onClick={() => { setActiveTab('coupons'); createCoupons('weekly', 100) }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
                >
                  + 100 WEEKLY
                </button>
                <button
                  onClick={() => { setActiveTab('coupons'); createCoupons('monthly', 100) }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                >
                  + 100 MONTHLY
                </button>
                <button
                  onClick={() => loadStats()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Refresh Stats
                </button>
                <Link
                  href="/admin/super/stickers"
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  🖨️ Sticker Generator
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ANALYTICS TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
                <Eye className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{analyticsSummary?.today.views || 0}</div>
                <div className="text-blue-200">Views Today</div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
                <Users className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{analyticsSummary?.today.uniqueVisitors || 0}</div>
                <div className="text-green-200">Unique Visitors Today</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
                <BarChart3 className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{analyticsSummary?.thisWeek.views || 0}</div>
                <div className="text-purple-200">Views This Week</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6">
                <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
                <div className="text-3xl font-bold">{analyticsSummary?.thisMonth.views || 0}</div>
                <div className="text-orange-200">Views This Month</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Trend */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">📈 Daily Trend (Last 7 Days)</h3>
                <div className="flex items-end gap-2 h-40">
                  {analyticsSummary?.dailyTrend.map((day, index) => {
                    const maxViews = Math.max(...(analyticsSummary?.dailyTrend.map(d => d.views) || [1]))
                    const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1">{day.views}</div>
                        <div 
                          className="w-full bg-green-500 rounded-t transition-all"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </div>
                    )
                  })}
                  {(!analyticsSummary?.dailyTrend || analyticsSummary.dailyTrend.length === 0) && (
                    <div className="w-full text-center text-gray-500">No data yet</div>
                  )}
                </div>
              </div>

              {/* Popular Pages */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">🔥 Popular Pages</h3>
                <div className="space-y-3">
                  {analyticsSummary?.popularPages.slice(0, 6).map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{getPageDisplayName(page.page)}</span>
                      <span className="text-green-400 font-bold">{page.views}</span>
                    </div>
                  ))}
                  {(!analyticsSummary?.popularPages || analyticsSummary.popularPages.length === 0) && (
                    <div className="text-gray-500">No data yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Popular Sections (Website) */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">🎯 Website Sections Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analyticsSummary?.popularSections.slice(0, 8).map((section, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{section.views}</div>
                    <div className="text-sm text-gray-400">{getPageDisplayName(section.section)}</div>
                  </div>
                ))}
                {(!analyticsSummary?.popularSections || analyticsSummary.popularSections.length === 0) && (
                  <div className="col-span-4 text-center text-gray-500 py-8">
                    No section data yet. Visit the website to start tracking!
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">👁️ Recent Activity (Live)</h3>
                <button
                  onClick={loadAnalytics}
                  disabled={analyticsLoading}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {analyticsLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    '🔄 Refresh'
                  )}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {recentViews.slice(0, 20).map((view, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-2 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400">{getPageDisplayName(view.page)}</span>
                      {view.section && (
                        <span className="text-gray-500">→ {view.section}</span>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {view.timestamp?.toDate?.()?.toLocaleTimeString?.() || 'Just now'}
                    </span>
                  </div>
                ))}
                {recentViews.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity. Visit the website or app to see live tracking!
                  </div>
                )}
              </div>
            </div>

            {/* Google Analytics Link */}
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold mb-2">📊 Need More Details?</h3>
              <p className="text-gray-400 mb-4">View advanced analytics in Google Analytics</p>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Open Google Analytics →
              </a>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* COUPONS TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">➕ Create Coupons</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => createCoupons('pass', 999)}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Create 999 PASS Coupons
                </button>
                <button
                  onClick={() => createCoupons('weekly', 999)}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Create 999 WEEKLY Coupons
                </button>
                <button
                  onClick={() => createCoupons('monthly', 999)}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Create 999 MONTHLY Coupons
                </button>
                <button
                  onClick={() => createCoupons('pass', 100)}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-800 hover:bg-yellow-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  + 100 PASS
                </button>
                <button
                  onClick={() => createCoupons('weekly', 100)}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-800 hover:bg-cyan-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  + 100 WEEKLY
                </button>
                <button
                  onClick={() => createCoupons('monthly', 100)}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  + 100 MONTHLY
                </button>
              </div>
            </div>

            {/* Filters & Export */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="text-sm text-gray-400 mr-2">Status:</label>
                  <select
                    value={couponFilter}
                    onChange={(e) => setCouponFilter(e.target.value as any)}
                    className="bg-gray-700 rounded px-3 py-1"
                  >
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mr-2">Type:</label>
                  <select
                    value={couponTypeFilter}
                    onChange={(e) => setCouponTypeFilter(e.target.value as any)}
                    className="bg-gray-700 rounded px-3 py-1"
                  >
                    <option value="all">All</option>
                    <option value="pass">PASS</option>
                    <option value="weekly">WEEKLY</option>
                    <option value="monthly">MONTHLY</option>
                  </select>
                </div>
                <button
                  onClick={() => exportCoupons(couponTypeFilter)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors ml-auto"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={loadCoupons}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Coupons List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <span className="text-gray-400">
                  Showing {filteredCoupons.length} of {coupons.length} coupons
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="text-left p-3">Code</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Used By</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoupons.slice(0, 100).map(coupon => (
                      <tr key={coupon.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-3 font-mono">{coupon.code}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            coupon.type === 'pass' ? 'bg-yellow-600' : 
                            coupon.type === 'weekly' ? 'bg-cyan-600' : 'bg-purple-600'
                          }`}>
                            {coupon.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            coupon.status === 'available' ? 'bg-green-600' : 
                            coupon.status === 'used' ? 'bg-gray-600' : 'bg-red-600'
                          }`}>
                            {coupon.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-400">
                          {coupon.usedByEmail || '-'}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => deleteCoupon(coupon.code)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCoupons.length > 100 && (
                  <div className="p-4 text-center text-gray-400">
                    Showing first 100 coupons. Use filters to narrow down.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* USERS TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search & Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by email, name, or phone..."
                      className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                    />
                  </div>
                </div>
                <button
                  onClick={loadUsers}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Inactive for:</label>
                  <select
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(Number(e.target.value))}
                    className="bg-gray-700 rounded px-3 py-1"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                  <button
                    onClick={selectInactiveUsers}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded transition-colors text-sm"
                  >
                    Select Inactive
                  </button>
                </div>
                
                {selectedUsers.size > 0 && (
                  <button
                    onClick={deleteSelectedUsers}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Delete {selectedUsers.size} Selected
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <span className="text-gray-400">
                  {filteredUsers.length} users {selectedUsers.size > 0 && `(${selectedUsers.size} selected)`}
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="text-left p-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
                            } else {
                              setSelectedUsers(new Set())
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Phone</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Last Active</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className={`border-b border-gray-700 hover:bg-gray-700/50 ${
                        selectedUsers.has(user.id) ? 'bg-blue-900/30' : ''
                      }`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedUsers)
                              if (e.target.checked) {
                                newSet.add(user.id)
                              } else {
                                newSet.delete(user.id)
                              }
                              setSelectedUsers(newSet)
                            }}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                {user.email?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{user.displayName || 'No name'}</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {user.phoneVerified ? (
                            <span className="text-green-400">{user.phoneNumber}</span>
                          ) : (
                            <span className="text-gray-500">Not verified</span>
                          )}
                        </td>
                        <td className="p-3">
                          {user.isPremium && (
                            <span className="px-2 py-1 bg-purple-600 rounded text-sm">
                              {user.premiumType || 'Premium'}
                            </span>
                          )}
                          {/* ✅ FIX: Use checkedInVenue (not currentVenue) */}
                          {user.checkedInVenue && (
                            <span className="px-2 py-1 bg-green-600 rounded text-sm ml-1">
                              Checked In
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-400">
                          {user.lastActive?.toDate?.()?.toLocaleDateString() || 
                           user.createdAt?.toDate?.()?.toLocaleDateString() || '-'}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CHECK-INS TAB */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'checkins' && (
          <div className="space-y-6">
            {/* Venue Filter */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm text-gray-400 mr-2">Venue:</label>
                  <select
                    value={selectedVenue}
                    onChange={(e) => setSelectedVenue(e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                  >
                    <option value="all">All Venues</option>
                    {venues.map(venue => (
                      <option key={venue.id} value={venue.id}>{venue.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={loadVenuesAndCheckIns}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors ml-auto"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Active Check-ins */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <span className="text-gray-400">
                  {filteredCheckIns.length} active check-ins
                </span>
                <span className="px-3 py-1 bg-green-600 rounded-full text-sm animate-pulse">
                  🟢 Live
                </span>
              </div>
              
              {filteredCheckIns.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active check-ins</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {filteredCheckIns.map(checkIn => (
                    <div key={checkIn.oderId} className="p-4 flex items-center justify-between hover:bg-gray-700/50">
                      <div className="flex items-center gap-4">
                        {checkIn.userPhoto ? (
                          <img src={checkIn.userPhoto} alt="" className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl">
                            {checkIn.userName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{checkIn.userName}</div>
                          <div className="text-sm text-gray-400">{checkIn.userEmail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-green-400">
                          <MapPin className="w-4 h-4" />
                          {checkIn.venueName}
                        </div>
                        <div className="text-sm text-gray-400">
                          Since {checkIn.checkedInAt?.toDate?.()?.toLocaleTimeString() || 'Unknown'}
                        </div>
                      </div>
                      <button
                        onClick={() => forceCheckoutUser(checkIn.oderId)}
                        className="ml-4 px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-sm"
                      >
                        Force Checkout
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Venues Overview */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📍 Venues Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {venues.map(venue => {
                  const count = activeCheckIns.filter(c => c.venueId === venue.id).length
                  return (
                    <div 
                      key={venue.id}
                      onClick={() => setSelectedVenue(venue.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedVenue === venue.id ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm truncate">{venue.name}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
