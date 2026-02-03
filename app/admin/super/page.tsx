"use client"

/**
 * 🦎 I4IGUANA - Super Admin Dashboard
 * 
 * Main admin panel with quick access to all management tools
 * 
 * FEATURES:
 * - Quick stats overview
 * - Navigation to all admin sections
 * - Live Activity monitoring
 * - 💔 FunnyDates Quotes Manager (NEW!)
 * 
 * v2.8.7 - Added FunnyDates Quotes Manager
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Users,
  Heart,
  MapPin,
  Building2,
  Activity,
  Settings,
  ChevronRight,
  Zap,
  Image,
  TestTube,
  Home,
  BarChart3,
  Flame,
  UserPlus,
  Globe,
  Sparkles,
  BookOpen,
  Quote,
  ExternalLink,
  ClipboardList,
  FileText,
  Headphones,
  Bell
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ENTERTAINMENT_ZONES, CITIES } from '@/lib/entertainment-zones'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SuperAdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalDummies: 0,
    totalMatches: 0,
    activeZones: 0,
    activeVenues: 0
  })
  const [loading, setLoading] = useState(true)

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD STATS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Users
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const users = usersSnapshot.docs.map(d => d.data())
        const realUsers = users.filter(u => !u.isDummy)
        const dummies = users.filter(u => u.isDummy)
        
        // Matches
        const matchesSnapshot = await getDocs(collection(db, 'matches'))
        
        // Active zones (zones with at least one user)
        const zonesWithUsers = new Set<string>()
        const venuesWithUsers = new Set<string>()
        
        users.forEach(user => {
          if (user.dummyZone) zonesWithUsers.add(user.dummyZone)
          if (user.currentZone) zonesWithUsers.add(user.currentZone)
          if (user.checkedInVenue) venuesWithUsers.add(user.checkedInVenue)
        })

        setStats({
          totalUsers: realUsers.length,
          onlineUsers: realUsers.filter(u => u.isOnline || u.lastSeen?.toDate() > new Date(Date.now() - 30 * 60 * 1000)).length,
          totalDummies: dummies.length,
          totalMatches: matchesSnapshot.size,
          activeZones: zonesWithUsers.size,
          activeVenues: venuesWithUsers.size
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
      setLoading(false)
    }

    loadStats()
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const adminSections = [
    {
      id: 'places-import',
      title: 'Places Import',
      description: 'מיפוי ברים, מועדונים ובתי קפה',
      icon: Globe,
      color: 'from-blue-500 to-cyan-600',
      badge: 'NEW',
      badgeColor: 'bg-blue-500',
      path: '/admin/super/places-import'
    },
    {
      id: 'mission',
      title: 'Mission Control',
      description: 'לוח משימות משותף',
      icon: ClipboardList,
      color: 'from-amber-500 to-orange-600',
      badge: 'NEW',
      badgeColor: 'bg-amber-500',
      path: '/admin/super/mission'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'נתונים ומטריקות עסקיות',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-600',
      badge: 'NEW',
      badgeColor: 'bg-purple-500',
      path: '/admin/super/analytics'
    },
    {
      id: 'live',
      title: 'Live Activity',
      description: 'מעקב בזמן אמת אחרי פעילות',
      icon: Activity,
      color: 'from-green-500 to-emerald-600',
      badge: 'LIVE',
      badgeColor: 'bg-green-500',
      path: '/admin/super/live'
    },
    {
      id: 'ticker',
      title: 'Global Ticker',
      description: 'הודעות לאתר הגלובלי באנגלית',
      icon: Globe,
      color: 'from-cyan-500 to-blue-600',
      badge: 'NEW',
      badgeColor: 'bg-cyan-500',
      path: '/admin/super/ticker'
    },
    {
      id: 'funnydates',
      title: 'FunnyDates Quotes',
      description: 'ניהול ציטוטים לאתר הספר',
      icon: BookOpen,
      color: 'from-red-500 to-rose-600',
      badge: 'NEW',
      badgeColor: 'bg-red-500',
      path: '/admin/super/funnydates'
    },
    {
      id: 'invoices',
      title: 'Invoices',
      description: 'ניהול חשבוניות NO-ART GALLERY',
      icon: FileText,
      color: 'from-amber-500 to-yellow-600',
      badge: 'NEW',
      badgeColor: 'bg-amber-500',
      path: '/admin/super/invoices'
    },
    {
      id: 'audiobook',
      title: 'רכישות אודיובוק',
      description: '🇮🇱 עברית + 🇺🇸 English orders',
      icon: Headphones,
      color: 'from-red-500 to-rose-600',
      badge: 'HE+EN',
      badgeColor: 'bg-red-500',
      path: '/admin/super/audiobook'
    },
    {
      id: 'dummies',
      title: 'Dummy Control',
      description: 'ניהול משתמשי דמה לפיילוטים',
      icon: UserPlus,
      color: 'from-purple-500 to-violet-600',
      path: '/admin/super/dummies'
    },
    {
      id: 'venues',
      title: 'Venue Management',
      description: 'ניהול מועדונים ומקומות',
      icon: Building2,
      color: 'from-blue-500 to-cyan-600',
      path: '/admin/super/venues'
    },
    {
      id: 'stickers',
      title: 'Sticker Generator',
      description: 'יצירת סטיקרים ורול-אפים',
      icon: Image,
      color: 'from-orange-500 to-amber-600',
      path: '/admin/super/stickers'
    },
    {
      id: 'simulator',
      title: 'Match Simulator',
      description: 'בדיקות מאצ\'ים ותסריטים',
      icon: TestTube,
      color: 'from-pink-500 to-rose-600',
      path: '/admin/super/simulator'
    },
    {
      id: 'notifications',
      title: 'Notifications Debug',
      description: 'בדיקת התראות Push',
      icon: Bell,
      color: 'from-yellow-500 to-orange-600',
      path: '/admin/super/notifications-debug',
      badge: 'DEBUG'
    }
  ]

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTERNAL LINKS
  // ═══════════════════════════════════════════════════════════════════════════

  const externalLinks = [
    {
      title: 'I4IGUANA App',
      url: 'https://i4iguana.com',
      icon: '🦎',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'FunnyDates HE',
      url: 'https://funnydates101.co.il',
      icon: '📚',
      color: 'from-red-500 to-rose-500'
    },
    {
      title: 'FunnyDates EN',
      url: 'https://funnydates101.com',
      icon: '📖',
      color: 'from-blue-500 to-indigo-500'
    }
  ]

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-green-500/20"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">🦎</span>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Super Admin
                </h1>
                <p className="text-xs text-gray-400">I4IGUANA Control Center</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/super/control')}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <BarChart3 className="w-4 h-4 ml-2" />
                Control Panel
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Home className="w-4 h-4 ml-2" />
                חזרה לאפליקציה
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Stats Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            סטטיסטיקות מהירות
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, label: 'משתמשים', value: stats.totalUsers, color: 'green' },
              { icon: Zap, label: 'אונליין', value: stats.onlineUsers, color: 'yellow' },
              { icon: UserPlus, label: 'דמויות', value: stats.totalDummies, color: 'purple' },
              { icon: Heart, label: 'מאצ\'ים', value: stats.totalMatches, color: 'pink' },
              { icon: MapPin, label: 'אזורים', value: stats.activeZones, color: 'blue' },
              { icon: Building2, label: 'מועדונים', value: stats.activeVenues, color: 'orange' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-[#111]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-4 hover:border-green-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Admin Sections */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-400" />
            כלי ניהול
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminSections.map((section, i) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => router.push(section.path)}
                className="bg-[#111]/80 backdrop-blur-sm rounded-2xl border border-white/5 p-5 hover:border-green-500/30 transition-all text-right group relative overflow-hidden"
              >
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{section.title}</h3>
                        {section.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${section.badgeColor} text-white animate-pulse`}>
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* External Links */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" />
            קישורים חיצוניים
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {externalLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${link.color} text-white font-medium text-sm hover:scale-105 transition-transform shadow-lg`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.title}
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ))}
          </div>
        </motion.section>

        {/* Pilot Status */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 bg-[#111]/80 backdrop-blur-sm rounded-2xl border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">סטטוס פיילוטים</h3>
              <p className="text-xs text-gray-500">מעקב אחרי מקומות פעילים</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Archie', status: 'active', color: 'green' },
              { name: 'Jack', status: 'active', color: 'green' },
              { name: 'Marina', status: 'active', color: 'green' },
              { name: 'Trinity (31/01)', status: 'pending', color: 'yellow' }
            ].map((pilot) => (
              <div 
                key={pilot.name}
                className={`flex items-center gap-2 p-3 rounded-xl bg-${pilot.color}-500/10 border border-${pilot.color}-500/20`}
              >
                <div className={`w-2 h-2 rounded-full bg-${pilot.color}-500 ${pilot.status === 'active' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-gray-300">{pilot.name}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-600 border-t border-white/5">
        <p>I4IGUANA Admin Panel • v2.8.30 • Made with 🦎 in Israel</p>
      </footer>
    </div>
  )
}
