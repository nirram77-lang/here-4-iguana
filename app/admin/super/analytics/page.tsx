"use client"

/**
 * 🦎 I4IGUANA - Analytics Dashboard
 * 
 * HOLLYWOOD LEVEL! 🎬
 * 
 * Comprehensive analytics for business insights:
 * - User growth over time
 * - Check-ins by zone/venue
 * - Match statistics
 * - Activity heatmap by hour
 * - Top performing locations
 * - 💳 Payment Funnel tracking (NEW!)
 * 
 * v2.8.30 - Added Payment Funnel section
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Users,
  Heart,
  MapPin,
  Building2,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Zap,
  MessageCircle,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  Flame,
  Target,
  Award,
  Eye,
  CreditCard
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore'
import { ENTERTAINMENT_ZONES, CITIES } from '@/lib/entertainment-zones'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AnalyticsData {
  // Overview
  totalUsers: number
  totalDummies: number
  totalMatches: number
  totalMeetings: number
  totalMessages: number
  activeZones: number
  activeVenues: number
  
  // Growth
  newUsersToday: number
  newUsersWeek: number
  newUsersMonth: number
  matchesToday: number
  matchesWeek: number
  matchesMonth: number
  
  // Trends (percentage change)
  userGrowthTrend: number
  matchGrowthTrend: number
  
  // Activity by hour (0-23)
  activityByHour: number[]
  
  // Top zones
  topZones: { id: string; name: string; count: number }[]
  
  // Top venues
  topVenues: { id: string; name: string; count: number }[]
  
  // Users by city
  usersByCity: { city: string; count: number }[]
  
  // Recent activity
  recentMatches: any[]
  recentCheckIns: any[]
  
  // ✅ v2.8.30: Payment Funnel
  paymentFunnel: {
    paywallViews: number
    passClicks: number
    weeklyClicks: number
    monthlyClicks: number
    purchaseAttempts: number
    purchaseSuccess: number
  }
}

type TimePeriod = 'today' | 'week' | 'month' | 'all'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week')
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalDummies: 0,
    totalMatches: 0,
    totalMeetings: 0,
    totalMessages: 0,
    activeZones: 0,
    activeVenues: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    newUsersMonth: 0,
    matchesToday: 0,
    matchesWeek: 0,
    matchesMonth: 0,
    userGrowthTrend: 0,
    matchGrowthTrend: 0,
    activityByHour: Array(24).fill(0),
    topZones: [],
    topVenues: [],
    usersByCity: [],
    recentMatches: [],
    recentCheckIns: [],
    paymentFunnel: {
      paywallViews: 0,
      passClicks: 0,
      weeklyClicks: 0,
      monthlyClicks: 0,
      purchaseAttempts: 0,
      purchaseSuccess: 0
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadAnalytics = async () => {
    setRefreshing(true)
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // ─────────────────────────────────────────────────────────────────────
      // USERS DATA
      // ─────────────────────────────────────────────────────────────────────
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      const realUsers = users.filter((u: any) => !u.isDummy)
      const dummies = users.filter((u: any) => u.isDummy)
      
      // New users by period
      const newUsersToday = realUsers.filter((u: any) => {
        const created = u.createdAt?.toDate?.() || new Date(0)
        return created >= todayStart
      }).length
      
      const newUsersWeek = realUsers.filter((u: any) => {
        const created = u.createdAt?.toDate?.() || new Date(0)
        return created >= weekAgo
      }).length
      
      const newUsersMonth = realUsers.filter((u: any) => {
        const created = u.createdAt?.toDate?.() || new Date(0)
        return created >= monthAgo
      }).length

      // User growth trend (this week vs last week)
      const lastWeekUsers = realUsers.filter((u: any) => {
        const created = u.createdAt?.toDate?.() || new Date(0)
        return created >= twoWeeksAgo && created < weekAgo
      }).length
      const userGrowthTrend = lastWeekUsers > 0 
        ? Math.round(((newUsersWeek - lastWeekUsers) / lastWeekUsers) * 100)
        : newUsersWeek > 0 ? 100 : 0

      // Users by city
      const cityCount: Record<string, number> = {}
      realUsers.forEach((u: any) => {
        const city = u.city || 'Unknown'
        cityCount[city] = (cityCount[city] || 0) + 1
      })
      const usersByCity = Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // ─────────────────────────────────────────────────────────────────────
      // MATCHES DATA
      // ─────────────────────────────────────────────────────────────────────
      const matchesSnapshot = await getDocs(collection(db, 'matches'))
      const matches = matchesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      
      const matchesToday = matches.filter((m: any) => {
        const created = m.createdAt?.toDate?.() || new Date(0)
        return created >= todayStart
      }).length

      const matchesWeek = matches.filter((m: any) => {
        const created = m.createdAt?.toDate?.() || new Date(0)
        return created >= weekAgo
      }).length

      const matchesMonth = matches.filter((m: any) => {
        const created = m.createdAt?.toDate?.() || new Date(0)
        return created >= monthAgo
      }).length

      // Meetings (confirmed)
      const meetings = matches.filter((m: any) => m.meetingConfirmed || m.status === 'meeting')
      
      // Match growth trend
      const lastWeekMatches = matches.filter((m: any) => {
        const created = m.createdAt?.toDate?.() || new Date(0)
        return created >= twoWeeksAgo && created < weekAgo
      }).length
      const matchGrowthTrend = lastWeekMatches > 0 
        ? Math.round(((matchesWeek - lastWeekMatches) / lastWeekMatches) * 100)
        : matchesWeek > 0 ? 100 : 0

      // Recent matches
      const recentMatches = matches
        .filter((m: any) => m.createdAt)
        .sort((a: any, b: any) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.())
        .slice(0, 10)

      // ─────────────────────────────────────────────────────────────────────
      // ACTIVITY BY HOUR
      // ─────────────────────────────────────────────────────────────────────
      const activityByHour = Array(24).fill(0)
      matches.forEach((m: any) => {
        const hour = m.createdAt?.toDate?.()?.getHours?.()
        if (typeof hour === 'number') {
          activityByHour[hour]++
        }
      })

      // ─────────────────────────────────────────────────────────────────────
      // ZONES & VENUES
      // ─────────────────────────────────────────────────────────────────────
      
      // Count users by zone
      const zoneCount: Record<string, number> = {}
      users.forEach((u: any) => {
        const zone = u.dummyZone || u.currentZone
        if (zone) {
          zoneCount[zone] = (zoneCount[zone] || 0) + 1
        }
      })
      
      const topZones = Object.entries(zoneCount)
        .map(([id, count]) => ({
          id,
          name: ENTERTAINMENT_ZONES[id]?.name || id,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Count users by venue
      const venueCount: Record<string, number> = {}
      users.forEach((u: any) => {
        if (u.checkedInVenue) {
          const venueName = u.checkedInVenueName || u.checkedInVenue
          venueCount[u.checkedInVenue] = (venueCount[u.checkedInVenue] || 0) + 1
        }
      })
      
      // Get venues data
      const venuesSnapshot = await getDocs(collection(db, 'venues'))
      const venues = venuesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      
      const topVenues = Object.entries(venueCount)
        .map(([id, count]) => {
          const venue = venues.find((v: any) => v.id === id) as any
          return {
            id,
            name: venue?.name || id,
            count
          }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Active zones/venues
      const activeZones = Object.keys(zoneCount).length
      const activeVenues = Object.keys(venueCount).length

      // ─────────────────────────────────────────────────────────────────────
      // MESSAGES COUNT (estimate from matches)
      // ─────────────────────────────────────────────────────────────────────
      let totalMessages = 0
      matches.forEach((m: any) => {
        totalMessages += m.messageCount || 0
      })

      // ─────────────────────────────────────────────────────────────────────
      // CHECK-INS
      // ─────────────────────────────────────────────────────────────────────
      let recentCheckIns: any[] = []
      try {
        const checkInsSnapshot = await getDocs(
          query(collection(db, 'zoneCheckIns'), orderBy('timestamp', 'desc'), limit(20))
        )
        recentCheckIns = checkInsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      } catch (e) {
        console.log('No check-ins collection or error:', e)
      }

      // ─────────────────────────────────────────────────────────────────────
      // PAYMENT FUNNEL
      // ─────────────────────────────────────────────────────────────────────
      let paymentFunnel = {
        paywallViews: 0,
        passClicks: 0,
        weeklyClicks: 0,
        monthlyClicks: 0,
        purchaseAttempts: 0,
        purchaseSuccess: 0
      }
      
      try {
        const paymentEventsSnapshot = await getDocs(collection(db, 'paymentEvents'))
        const paymentEvents = paymentEventsSnapshot.docs.map(d => d.data())
        
        paymentEvents.forEach((event: any) => {
          if (event.type === 'plan_viewed') {
            if (event.source === 'paywall_default' || event.source === 'paywall') {
              paymentFunnel.paywallViews++
            }
            if (event.plan === 'pass') paymentFunnel.passClicks++
            if (event.plan === 'weekly') paymentFunnel.weeklyClicks++
            if (event.plan === 'monthly') paymentFunnel.monthlyClicks++
          }
          if (event.type === 'purchase_attempt') {
            paymentFunnel.purchaseAttempts++
          }
          if (event.type === 'purchase_success') {
            paymentFunnel.purchaseSuccess++
          }
        })
      } catch (e) {
        console.log('No payment events collection or error:', e)
      }

      // ─────────────────────────────────────────────────────────────────────
      // SET DATA
      // ─────────────────────────────────────────────────────────────────────
      setData({
        totalUsers: realUsers.length,
        totalDummies: dummies.length,
        totalMatches: matches.length,
        totalMeetings: meetings.length,
        totalMessages,
        activeZones,
        activeVenues: venues.length,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        matchesToday,
        matchesWeek,
        matchesMonth,
        userGrowthTrend,
        matchGrowthTrend,
        activityByHour,
        topZones,
        topVenues,
        usersByCity,
        recentMatches,
        recentCheckIns,
        paymentFunnel
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getMaxActivity = () => Math.max(...data.activityByHour, 1)

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a14] via-[#0d2920] to-[#0a1a14]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ade80]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 px-6 py-4 bg-gradient-to-r from-[#0a1a14]/98 via-[#0d2920]/98 to-[#0a1a14]/98 backdrop-blur-xl border-b border-[#4ade80]/30 shadow-2xl">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/super')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BarChart3 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-white/50">📊 Business Intelligence • Real Data</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Period Selector */}
            <div className="flex bg-black/30 rounded-xl p-1 border border-white/10">
              {(['today', 'week', 'month', 'all'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    timePeriod === period
                      ? 'bg-[#4ade80] text-black'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {period === 'today' && '📅 Today'}
                  {period === 'week' && '📆 Week'}
                  {period === 'month' && '🗓️ Month'}
                  {period === 'all' && '📊 All'}
                </button>
              ))}
            </div>

            <Button
              onClick={loadAnalytics}
              disabled={refreshing}
              className="bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30 hover:bg-[#4ade80]/30"
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
              רענן
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-6 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <BarChart3 className="w-16 h-16 text-[#4ade80]" />
            </motion.div>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* OVERVIEW CARDS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              {[
                { 
                  icon: Users, 
                  label: 'משתמשים', 
                  value: data.totalUsers, 
                  subValue: `+${data.newUsersWeek} השבוע`,
                  color: 'green',
                  trend: data.userGrowthTrend
                },
                { 
                  icon: Zap, 
                  label: 'Dummies', 
                  value: data.totalDummies, 
                  color: 'yellow' 
                },
                { 
                  icon: Heart, 
                  label: 'מאצ\'ים', 
                  value: data.totalMatches, 
                  subValue: `+${data.matchesWeek} השבוע`,
                  color: 'pink',
                  trend: data.matchGrowthTrend
                },
                { 
                  icon: Target, 
                  label: 'פגישות', 
                  value: data.totalMeetings, 
                  color: 'purple' 
                },
                { 
                  icon: MessageCircle, 
                  label: 'הודעות', 
                  value: data.totalMessages, 
                  color: 'blue' 
                },
                { 
                  icon: MapPin, 
                  label: 'אזורים פעילים', 
                  value: data.activeZones, 
                  color: 'emerald' 
                },
                { 
                  icon: Building2, 
                  label: 'מועדונים', 
                  value: data.activeVenues, 
                  color: 'orange' 
                }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative overflow-hidden bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-2xl border border-${stat.color}-500/30 p-5 hover:border-${stat.color}-500/50 transition-all group`}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-${stat.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                      {stat.trend !== undefined && (
                        <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                        </div>
                      )}
                    </div>
                    <div className="text-3xl font-black text-white mb-1">
                      {formatNumber(stat.value)}
                    </div>
                    <div className="text-sm text-white/50">{stat.label}</div>
                    {stat.subValue && (
                      <div className={`text-xs text-${stat.color}-400 mt-1`}>{stat.subValue}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* CHARTS ROW */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              
              {/* Activity by Hour */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-[#4ade80]/30 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">פעילות לפי שעה</h3>
                    <p className="text-sm text-white/50">מתי הכי פעיל באפליקציה</p>
                  </div>
                </div>
                
                <div className="flex items-end justify-between h-[200px] gap-1">
                  {data.activityByHour.map((count, hour) => {
                    const height = (count / getMaxActivity()) * 100
                    const isNightTime = hour >= 20 || hour <= 2
                    const isPeakHour = count === Math.max(...data.activityByHour)
                    
                    return (
                      <div 
                        key={hour} 
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${hour}:00 - ${count} פעולות`}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, 2)}%` }}
                          transition={{ delay: hour * 0.02, duration: 0.5 }}
                          className={`w-full rounded-t-sm ${
                            isPeakHour 
                              ? 'bg-gradient-to-t from-[#4ade80] to-[#22c55e] shadow-lg shadow-[#4ade80]/30'
                              : isNightTime
                              ? 'bg-gradient-to-t from-purple-500/60 to-purple-400/40'
                              : 'bg-gradient-to-t from-[#4ade80]/40 to-[#4ade80]/20'
                          }`}
                        />
                        <span className={`text-[10px] ${hour % 3 === 0 ? 'text-white/50' : 'text-transparent'}`}>
                          {hour}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex justify-between mt-4 text-xs text-white/40">
                  <span>🌅 בוקר</span>
                  <span>☀️ צהריים</span>
                  <span>🌆 ערב</span>
                  <span>🌙 לילה</span>
                </div>
              </motion.div>

              {/* Top Zones */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-purple-500/30 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">🏆 Top Zones</h3>
                    <p className="text-sm text-white/50">האזורים הכי פופולריים</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {data.topZones.slice(0, 7).map((zone, i) => {
                    const maxCount = data.topZones[0]?.count || 1
                    const percentage = (zone.count / maxCount) * 100
                    
                    return (
                      <div key={zone.id} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              i === 0 ? 'bg-yellow-500 text-black' :
                              i === 1 ? 'bg-gray-300 text-black' :
                              i === 2 ? 'bg-orange-600 text-white' :
                              'bg-white/10 text-white/50'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="text-white font-medium">{zone.name}</span>
                          </div>
                          <span className="text-[#4ade80] font-bold">{zone.count}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`h-full rounded-full ${
                              i === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              i === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                              i === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                              'bg-gradient-to-r from-[#4ade80]/60 to-[#22c55e]/40'
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                  
                  {data.topZones.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>אין נתונים עדיין</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 💳 PAYMENT FUNNEL */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-yellow-500/30 p-6 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Funnel</h3>
                  <p className="text-sm text-white/50">מעקב אחרי תשלומים ושדרוגים</p>
                </div>
              </div>
              
              {/* Funnel Visualization */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Paywall Views */}
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
                  <div className="text-3xl font-black text-purple-400">{data.paymentFunnel.paywallViews}</div>
                  <div className="text-sm text-white/50 mt-1">👁️ Paywall Views</div>
                </div>
                
                {/* Pass Clicks */}
                <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20 text-center">
                  <div className="text-3xl font-black text-pink-400">{data.paymentFunnel.passClicks}</div>
                  <div className="text-sm text-white/50 mt-1">💕 Pass Clicks</div>
                  <div className="text-xs text-pink-400/60 mt-1">$0.99</div>
                </div>
                
                {/* Weekly Clicks */}
                <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20 text-center">
                  <div className="text-3xl font-black text-orange-400">{data.paymentFunnel.weeklyClicks}</div>
                  <div className="text-sm text-white/50 mt-1">⚡ Weekly Clicks</div>
                  <div className="text-xs text-orange-400/60 mt-1">$4.99/week</div>
                </div>
                
                {/* Monthly Clicks */}
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 text-center">
                  <div className="text-3xl font-black text-green-400">{data.paymentFunnel.monthlyClicks}</div>
                  <div className="text-sm text-white/50 mt-1">👑 Monthly Clicks</div>
                  <div className="text-xs text-green-400/60 mt-1">$9.99/month</div>
                </div>
                
                {/* Purchase Attempts */}
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
                  <div className="text-3xl font-black text-blue-400">{data.paymentFunnel.purchaseAttempts}</div>
                  <div className="text-sm text-white/50 mt-1">🛒 Attempts</div>
                </div>
                
                {/* Successful Purchases */}
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
                  <div className="text-3xl font-black text-emerald-400">{data.paymentFunnel.purchaseSuccess}</div>
                  <div className="text-sm text-white/50 mt-1">✅ Success</div>
                  <div className="text-xs text-emerald-400/60 mt-1">
                    {data.paymentFunnel.purchaseAttempts > 0 
                      ? `${Math.round((data.paymentFunnel.purchaseSuccess / data.paymentFunnel.purchaseAttempts) * 100)}%`
                      : '0%'}
                  </div>
                </div>
              </div>
              
              {/* Conversion Rate Bar */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Conversion Rate (Paywall → Purchase)</span>
                  <span className="text-2xl font-black text-yellow-400">
                    {data.paymentFunnel.paywallViews > 0 
                      ? `${Math.round((data.paymentFunnel.purchaseSuccess / data.paymentFunnel.paywallViews) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: data.paymentFunnel.paywallViews > 0 
                        ? `${Math.min((data.paymentFunnel.purchaseSuccess / data.paymentFunnel.paywallViews) * 100, 100)}%`
                        : '0%'
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SECOND ROW */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              
              {/* Users by City */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-blue-500/30 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">📍 משתמשים לפי עיר</h3>
                    <p className="text-sm text-white/50">איפה הקהל שלנו</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {data.usersByCity.slice(0, 8).map((item, i) => (
                    <div key={item.city} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📍'}
                        </span>
                        <span className="text-white">{item.city}</span>
                      </div>
                      <span className="text-blue-400 font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top Venues */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-orange-500/30 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">🍺 Top Venues</h3>
                    <p className="text-sm text-white/50">המועדונים הכי פופולריים</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {data.topVenues.slice(0, 8).map((venue, i) => (
                    <div key={venue.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🍺'}
                        </span>
                        <span className="text-white truncate max-w-[150px]">{venue.name}</span>
                      </div>
                      <span className="text-orange-400 font-bold">{venue.count}</span>
                    </div>
                  ))}
                  
                  {data.topVenues.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>אין נתונים עדיין</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-[#0d2920]/80 to-[#0a1a14]/80 rounded-3xl border border-pink-500/30 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">🔥 סטטיסטיקות מהירות</h3>
                    <p className="text-sm text-white/50">המספרים החשובים</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                    <div className="text-3xl font-black text-green-400">{data.newUsersToday}</div>
                    <div className="text-sm text-white/50">משתמשים היום</div>
                  </div>
                  <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20">
                    <div className="text-3xl font-black text-pink-400">{data.matchesToday}</div>
                    <div className="text-sm text-white/50">מאצ'ים היום</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <div className="text-3xl font-black text-blue-400">{data.newUsersWeek}</div>
                    <div className="text-sm text-white/50">משתמשים השבוע</div>
                  </div>
                  <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                    <div className="text-3xl font-black text-purple-400">{data.matchesWeek}</div>
                    <div className="text-sm text-white/50">מאצ'ים השבוע</div>
                  </div>
                </div>
                
                {/* Conversion rate */}
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">שיעור המרה (משתמש → מאצ')</span>
                    <span className="text-2xl font-black text-[#4ade80]">
                      {data.totalUsers > 0 
                        ? Math.round((data.totalMatches / data.totalUsers) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* FOOTER STATS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center py-6 border-t border-white/10"
            >
              <p className="text-white/30 text-sm">
                📊 Analytics Dashboard v2.8.30 • Last updated: {new Date().toLocaleTimeString('he-IL')}
              </p>
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}
