"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Trash2, 
  RefreshCw,
  Search,
  ArrowLeft,
  Database,
  UserX,
  UserCheck,
  Heart,
  MessageSquare,
  Bell,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore'
import { getAdminData } from '@/lib/admin-auth'

// Types
interface UserData {
  uid: string
  email: string
  name: string
  gender: string
  age: number
  photos: string[]
  onboardingComplete: boolean
  checkedInVenue: string | null
  isAvailable: boolean
  isPremium: boolean
  deleted: boolean
  isDummy: boolean
  createdAt: any
  swipedRight: string[]
  swipedLeft: string[]
  preferences?: {
    ageRange?: [number, number]
    lookingFor?: string
  }
}

interface MatchData {
  id: string
  users: string[]
  timestamp: any
  status: string
}

interface ChatData {
  id: string
  participants: string[]
  lastMessage: string
  updatedAt: any
}

interface PhoneIdentity {
  id: string
  odaUserId: string
  passesLeft: number
  isPremium: boolean
  lockedUntil: any
}

export default function DatabaseManager() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'matches' | 'chats' | 'phones' | 'cleanup'>('users')
  
  // Data states
  const [users, setUsers] = useState<UserData[]>([])
  const [matches, setMatches] = useState<MatchData[]>([])
  const [chats, setChats] = useState<ChatData[]>([])
  const [phoneIdentities, setPhoneIdentities] = useState<PhoneIdentity[]>([])
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [showDummy, setShowDummy] = useState(true)

  // Load admin and data
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/admin/login')
          return
        }

        const adminData = await getAdminData(user.uid)
        if (!adminData || adminData.role !== 'super') {
          router.push('/admin/login')
          return
        }

        setAdminEmail(adminData.email)
        await loadAllData()
      } catch (error) {
        console.error('❌ Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Load all data from Firestore
  const loadAllData = async () => {
    setProcessing(true)
    try {
      // Load Users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData: UserData[] = []
      usersSnapshot.forEach(doc => {
        const data = doc.data()
        usersData.push({
          uid: doc.id,
          email: data.email || '',
          name: data.name || 'No Name',
          gender: data.gender || 'Not Set',
          age: data.age || 0,
          photos: data.photos || [],
          onboardingComplete: data.onboardingComplete || false,
          checkedInVenue: data.checkedInVenue || null,
          isAvailable: data.isAvailable ?? true,
          isPremium: data.isPremium || false,
          deleted: data.deleted || false,
          isDummy: data.isDummy || false,
          createdAt: data.createdAt,
          swipedRight: data.swipedRight || [],
          swipedLeft: data.swipedLeft || [],
          preferences: data.preferences
        })
      })
      setUsers(usersData)
      console.log(`✅ Loaded ${usersData.length} users`)

      // Load Matches
      const matchesSnapshot = await getDocs(collection(db, 'matches'))
      const matchesData: MatchData[] = []
      matchesSnapshot.forEach(doc => {
        const data = doc.data()
        matchesData.push({
          id: doc.id,
          users: data.users || [],
          timestamp: data.timestamp,
          status: data.status || 'unknown'
        })
      })
      setMatches(matchesData)
      console.log(`✅ Loaded ${matchesData.length} matches`)

      // Load Chats
      const chatsSnapshot = await getDocs(collection(db, 'chats'))
      const chatsData: ChatData[] = []
      chatsSnapshot.forEach(doc => {
        const data = doc.data()
        chatsData.push({
          id: doc.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt
        })
      })
      setChats(chatsData)
      console.log(`✅ Loaded ${chatsData.length} chats`)

      // Load Phone Identities
      const phonesSnapshot = await getDocs(collection(db, 'phoneIdentities'))
      const phonesData: PhoneIdentity[] = []
      phonesSnapshot.forEach(doc => {
        const data = doc.data()
        phonesData.push({
          id: doc.id,
          odaUserId: data.odaUserId || '',
          passesLeft: data.passesLeft ?? 1,
          isPremium: data.isPremium || false,
          lockedUntil: data.lockedUntil
        })
      })
      setPhoneIdentities(phonesData)
      console.log(`✅ Loaded ${phonesData.length} phone identities`)

    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Get user name by UID
  const getUserName = (uid: string) => {
    const user = users.find(u => u.uid === uid)
    return user ? `${user.name} (${user.email})` : uid.substring(0, 8) + '...'
  }

  // Delete single user
  const deleteUser = async (uid: string) => {
    if (!confirm(`Delete user ${getUserName(uid)}?`)) return
    
    setProcessing(true)
    try {
      await deleteDoc(doc(db, 'users', uid))
      setUsers(users.filter(u => u.uid !== uid))
      console.log(`✅ Deleted user: ${uid}`)
    } catch (error) {
      console.error('❌ Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setProcessing(false)
    }
  }

  // Reset user (clear swipes, matches, set as new)
  const resetUser = async (uid: string) => {
    if (!confirm(`Reset user ${getUserName(uid)}? This will clear all swipes and matches.`)) return
    
    setProcessing(true)
    try {
      await updateDoc(doc(db, 'users', uid), {
        swipedRight: [],
        swipedLeft: [],
        deleted: false,
        isAvailable: true
      })
      
      // Reload data
      await loadAllData()
      console.log(`✅ Reset user: ${uid}`)
    } catch (error) {
      console.error('❌ Error resetting user:', error)
      alert('Failed to reset user')
    } finally {
      setProcessing(false)
    }
  }

  // Delete all dummy users
  const deleteAllDummy = async () => {
    const dummyUsers = users.filter(u => u.isDummy)
    if (!confirm(`Delete ${dummyUsers.length} dummy users?`)) return
    
    setProcessing(true)
    try {
      for (const user of dummyUsers) {
        await deleteDoc(doc(db, 'users', user.uid))
      }
      await loadAllData()
      console.log(`✅ Deleted ${dummyUsers.length} dummy users`)
    } catch (error) {
      console.error('❌ Error deleting dummy users:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Delete all deleted users (cleanup)
  const deleteAllDeleted = async () => {
    const deletedUsers = users.filter(u => u.deleted)
    if (!confirm(`Permanently remove ${deletedUsers.length} deleted users?`)) return
    
    setProcessing(true)
    try {
      for (const user of deletedUsers) {
        await deleteDoc(doc(db, 'users', user.uid))
      }
      await loadAllData()
      console.log(`✅ Removed ${deletedUsers.length} deleted users`)
    } catch (error) {
      console.error('❌ Error removing deleted users:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Reset specific users by email
  const resetUsersByEmail = async (emails: string[]) => {
    const usersToReset = users.filter(u => emails.includes(u.email))
    if (usersToReset.length === 0) {
      alert('No users found with those emails')
      return
    }
    
    if (!confirm(`Reset ${usersToReset.length} users?\n${usersToReset.map(u => u.email).join('\n')}`)) return
    
    setProcessing(true)
    try {
      for (const user of usersToReset) {
        // Reset user document
        await updateDoc(doc(db, 'users', user.uid), {
          swipedRight: [],
          swipedLeft: [],
          deleted: false,
          isAvailable: true,
          checkedInVenue: null,
          checkInData: null
        })
        
        // Delete their matches
        for (const match of matches) {
          if (match.users.includes(user.uid)) {
            await deleteDoc(doc(db, 'matches', match.id))
          }
        }
        
        // Delete active matches
        const activeMatchesSnapshot = await getDocs(collection(db, 'activeMatches'))
        for (const matchDoc of activeMatchesSnapshot.docs) {
          const data = matchDoc.data()
          if (data.users?.includes(user.uid)) {
            await deleteDoc(doc(db, 'activeMatches', matchDoc.id))
          }
        }
        
        // Delete their chats
        for (const chat of chats) {
          if (chat.participants.includes(user.uid)) {
            await deleteDoc(doc(db, 'chats', chat.id))
          }
        }
      }
      
      await loadAllData()
      alert(`✅ Reset ${usersToReset.length} users successfully!`)
    } catch (error) {
      console.error('❌ Error resetting users:', error)
      alert('Failed to reset users')
    } finally {
      setProcessing(false)
    }
  }

  // Delete match
  const deleteMatch = async (matchId: string) => {
    if (!confirm('Delete this match?')) return
    
    setProcessing(true)
    try {
      await deleteDoc(doc(db, 'matches', matchId))
      setMatches(matches.filter(m => m.id !== matchId))
      console.log(`✅ Deleted match: ${matchId}`)
    } catch (error) {
      console.error('❌ Error deleting match:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Delete all matches
  const deleteAllMatches = async () => {
    if (!confirm(`Delete ALL ${matches.length} matches?`)) return
    
    setProcessing(true)
    try {
      for (const match of matches) {
        await deleteDoc(doc(db, 'matches', match.id))
      }
      
      // Also delete active matches
      const activeMatchesSnapshot = await getDocs(collection(db, 'activeMatches'))
      for (const matchDoc of activeMatchesSnapshot.docs) {
        await deleteDoc(doc(db, 'activeMatches', matchDoc.id))
      }
      
      await loadAllData()
      console.log(`✅ Deleted all matches`)
    } catch (error) {
      console.error('❌ Error deleting matches:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Delete chat
  const deleteChat = async (chatId: string) => {
    if (!confirm('Delete this chat?')) return
    
    setProcessing(true)
    try {
      await deleteDoc(doc(db, 'chats', chatId))
      setChats(chats.filter(c => c.id !== chatId))
      console.log(`✅ Deleted chat: ${chatId}`)
    } catch (error) {
      console.error('❌ Error deleting chat:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Delete all chats
  const deleteAllChats = async () => {
    if (!confirm(`Delete ALL ${chats.length} chats?`)) return
    
    setProcessing(true)
    try {
      for (const chat of chats) {
        await deleteDoc(doc(db, 'chats', chat.id))
      }
      await loadAllData()
      console.log(`✅ Deleted all chats`)
    } catch (error) {
      console.error('❌ Error deleting chats:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Full cleanup
  const fullCleanup = async () => {
    if (!confirm('⚠️ FULL CLEANUP\n\nThis will:\n- Delete all dummy users\n- Delete all deleted users\n- Delete all matches\n- Delete all chats\n- Reset all phone identities\n\nAre you sure?')) return
    
    setProcessing(true)
    try {
      // Delete dummy users
      const dummyUsers = users.filter(u => u.isDummy)
      for (const user of dummyUsers) {
        await deleteDoc(doc(db, 'users', user.uid))
      }
      
      // Delete deleted users
      const deletedUsers = users.filter(u => u.deleted)
      for (const user of deletedUsers) {
        await deleteDoc(doc(db, 'users', user.uid))
      }
      
      // Delete all matches
      for (const match of matches) {
        await deleteDoc(doc(db, 'matches', match.id))
      }
      
      // Delete active matches
      const activeMatchesSnapshot = await getDocs(collection(db, 'activeMatches'))
      for (const matchDoc of activeMatchesSnapshot.docs) {
        await deleteDoc(doc(db, 'activeMatches', matchDoc.id))
      }
      
      // Delete all chats
      for (const chat of chats) {
        await deleteDoc(doc(db, 'chats', chat.id))
      }
      
      // Reset phone identities
      for (const phone of phoneIdentities) {
        await updateDoc(doc(db, 'phoneIdentities', phone.id), {
          passesLeft: 1,
          lockedUntil: null,
          passesUsedToday: 0,
          matchesCountToday: 0
        })
      }
      
      // Reset remaining real users
      const realUsers = users.filter(u => !u.isDummy && !u.deleted)
      for (const user of realUsers) {
        await updateDoc(doc(db, 'users', user.uid), {
          swipedRight: [],
          swipedLeft: [],
          isAvailable: true,
          checkedInVenue: null,
          checkInData: null
        })
      }
      
      await loadAllData()
      alert('✅ Full cleanup complete!')
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      alert('Error during cleanup')
    } finally {
      setProcessing(false)
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    if (!showDeleted && u.deleted) return false
    if (!showDummy && u.isDummy) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return u.email.toLowerCase().includes(search) || 
             u.name.toLowerCase().includes(search) ||
             u.uid.toLowerCase().includes(search)
    }
    return true
  })

  // Stats
  const stats = {
    totalUsers: users.length,
    realUsers: users.filter(u => !u.isDummy && !u.deleted).length,
    dummyUsers: users.filter(u => u.isDummy).length,
    deletedUsers: users.filter(u => u.deleted).length,
    checkedIn: users.filter(u => u.checkedInVenue).length,
    premium: users.filter(u => u.isPremium).length,
    totalMatches: matches.length,
    totalChats: chats.length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d2920] via-[#1a4d3e] to-[#0d2920] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🦎</div>
          <p className="text-white text-lg">Loading Database Manager...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Header */}
      <div className="bg-[#0d2920]/80 backdrop-blur-md border-b-2 border-[#4ade80]/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super')}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-[#4ade80]" />
                <div>
                  <h1 className="text-2xl font-black text-white">Database Manager</h1>
                  <p className="text-[#4ade80] text-sm">{adminEmail}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={loadAllData}
              disabled={processing}
              variant="outline"
              className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard icon={<Users />} label="Total" value={stats.totalUsers} />
          <StatCard icon={<UserCheck />} label="Real" value={stats.realUsers} color="green" />
          <StatCard icon={<UserX />} label="Dummy" value={stats.dummyUsers} color="yellow" />
          <StatCard icon={<Trash2 />} label="Deleted" value={stats.deletedUsers} color="red" />
          <StatCard icon={<MapPin />} label="Checked In" value={stats.checkedIn} color="blue" />
          <StatCard icon={<Shield />} label="Premium" value={stats.premium} color="purple" />
          <StatCard icon={<Heart />} label="Matches" value={stats.totalMatches} color="pink" />
          <StatCard icon={<MessageSquare />} label="Chats" value={stats.totalChats} color="cyan" />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['users', 'matches', 'chats', 'phones', 'cleanup'] as const).map(tab => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className={activeTab === tab 
                ? 'bg-[#4ade80] text-[#0d2920] font-bold' 
                : 'border-[#4ade80]/30 text-white hover:bg-[#4ade80]/20'}
            >
              {tab === 'users' && <Users className="mr-2 h-4 w-4" />}
              {tab === 'matches' && <Heart className="mr-2 h-4 w-4" />}
              {tab === 'chats' && <MessageSquare className="mr-2 h-4 w-4" />}
              {tab === 'phones' && <Shield className="mr-2 h-4 w-4" />}
              {tab === 'cleanup' && <Trash2 className="mr-2 h-4 w-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search by email, name, or UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0d2920]/50 border-[#4ade80]/20 text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showDummy} 
                  onChange={(e) => setShowDummy(e.target.checked)}
                  className="rounded"
                />
                Show Dummy
              </label>
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showDeleted} 
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="rounded"
                />
                Show Deleted
              </label>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => resetUsersByEmail(['niroram77@gmail.com', 'jango5432@gmail.com'])}
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Nir & Jango
              </Button>
              <Button
                onClick={deleteAllDummy}
                disabled={processing}
                variant="outline"
                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20"
              >
                <UserX className="mr-2 h-4 w-4" />
                Delete All Dummy ({stats.dummyUsers})
              </Button>
              <Button
                onClick={deleteAllDeleted}
                disabled={processing}
                variant="outline"
                className="border-red-500/50 text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Deleted ({stats.deletedUsers})
              </Button>
            </div>

            {/* Users Table */}
            <div className="bg-[#0d2920]/50 rounded-xl border border-[#4ade80]/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#4ade80]/10 text-left">
                      <th className="px-4 py-3 text-white font-bold">User</th>
                      <th className="px-4 py-3 text-white font-bold">Gender</th>
                      <th className="px-4 py-3 text-white font-bold">Age</th>
                      <th className="px-4 py-3 text-white font-bold">Age Range</th>
                      <th className="px-4 py-3 text-white font-bold">Venue</th>
                      <th className="px-4 py-3 text-white font-bold">Status</th>
                      <th className="px-4 py-3 text-white font-bold">Swipes</th>
                      <th className="px-4 py-3 text-white font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr 
                        key={user.uid} 
                        className={`border-t border-[#4ade80]/10 ${
                          user.deleted ? 'bg-red-900/20' : 
                          user.isDummy ? 'bg-yellow-900/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-white/50 text-xs">{user.email}</div>
                            <div className="text-white/30 text-xs font-mono">{user.uid.substring(0, 12)}...</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            user.gender === 'male' ? 'bg-blue-500/20 text-blue-400' :
                            user.gender === 'female' ? 'bg-pink-500/20 text-pink-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.gender || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white">{user.age || 'N/A'}</td>
                        <td className="px-4 py-3 text-white/70 text-xs">
                          {user.preferences?.ageRange ? 
                            `${user.preferences.ageRange[0]}-${user.preferences.ageRange[1]}` : 
                            '18-80'}
                        </td>
                        <td className="px-4 py-3">
                          {user.checkedInVenue ? (
                            <span className="text-[#4ade80] text-xs">✅ Checked In</span>
                          ) : (
                            <span className="text-white/40 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.deleted && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">DELETED</span>}
                            {user.isDummy && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">DUMMY</span>}
                            {user.isPremium && <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">PREMIUM</span>}
                            {user.onboardingComplete && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">READY</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-xs">
                          <div>👍 {user.swipedRight?.length || 0}</div>
                          <div>👎 {user.swipedLeft?.length || 0}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              onClick={() => resetUser(user.uid)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:bg-blue-500/20 h-8 w-8 p-0"
                              title="Reset User"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => deleteUser(user.uid)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Matches ({matches.length})</h2>
              <Button
                onClick={deleteAllMatches}
                disabled={processing}
                variant="outline"
                className="border-red-500/50 text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Matches
              </Button>
            </div>
            
            <div className="bg-[#0d2920]/50 rounded-xl border border-[#4ade80]/20 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#4ade80]/10 text-left">
                    <th className="px-4 py-3 text-white font-bold">Match ID</th>
                    <th className="px-4 py-3 text-white font-bold">Users</th>
                    <th className="px-4 py-3 text-white font-bold">Status</th>
                    <th className="px-4 py-3 text-white font-bold">Date</th>
                    <th className="px-4 py-3 text-white font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map(match => (
                    <tr key={match.id} className="border-t border-[#4ade80]/10">
                      <td className="px-4 py-3 text-white/50 font-mono text-xs">{match.id.substring(0, 16)}...</td>
                      <td className="px-4 py-3">
                        {match.users.map(uid => (
                          <div key={uid} className="text-white text-xs">{getUserName(uid)}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-[#4ade80]/20 text-[#4ade80] text-xs rounded">
                          {match.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">
                        {match.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => deleteMatch(match.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {matches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                        No matches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHATS TAB */}
        {activeTab === 'chats' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Chats ({chats.length})</h2>
              <Button
                onClick={deleteAllChats}
                disabled={processing}
                variant="outline"
                className="border-red-500/50 text-red-500 hover:bg-red-500/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Chats
              </Button>
            </div>
            
            <div className="bg-[#0d2920]/50 rounded-xl border border-[#4ade80]/20 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#4ade80]/10 text-left">
                    <th className="px-4 py-3 text-white font-bold">Chat ID</th>
                    <th className="px-4 py-3 text-white font-bold">Participants</th>
                    <th className="px-4 py-3 text-white font-bold">Last Message</th>
                    <th className="px-4 py-3 text-white font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chats.map(chat => (
                    <tr key={chat.id} className="border-t border-[#4ade80]/10">
                      <td className="px-4 py-3 text-white/50 font-mono text-xs">{chat.id.substring(0, 16)}...</td>
                      <td className="px-4 py-3">
                        {chat.participants.map(uid => (
                          <div key={uid} className="text-white text-xs">{getUserName(uid)}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-white/70 text-xs max-w-[200px] truncate">
                        {chat.lastMessage || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => deleteChat(chat.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {chats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                        No chats found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PHONES TAB */}
        {activeTab === 'phones' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Phone Identities ({phoneIdentities.length})</h2>
            
            <div className="bg-[#0d2920]/50 rounded-xl border border-[#4ade80]/20 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#4ade80]/10 text-left">
                    <th className="px-4 py-3 text-white font-bold">Phone ID</th>
                    <th className="px-4 py-3 text-white font-bold">User</th>
                    <th className="px-4 py-3 text-white font-bold">Passes</th>
                    <th className="px-4 py-3 text-white font-bold">Premium</th>
                    <th className="px-4 py-3 text-white font-bold">Locked Until</th>
                  </tr>
                </thead>
                <tbody>
                  {phoneIdentities.map(phone => (
                    <tr key={phone.id} className="border-t border-[#4ade80]/10">
                      <td className="px-4 py-3 text-white/50 font-mono text-xs">{phone.id}</td>
                      <td className="px-4 py-3 text-white text-xs">{getUserName(phone.odaUserId)}</td>
                      <td className="px-4 py-3 text-[#4ade80] font-bold">{phone.passesLeft}</td>
                      <td className="px-4 py-3">
                        {phone.isPremium ? (
                          <span className="text-purple-400">✅ Yes</span>
                        ) : (
                          <span className="text-white/40">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">
                        {phone.lockedUntil?.toDate?.()?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLEANUP TAB */}
        {activeTab === 'cleanup' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Database Cleanup Tools</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reset Test Users */}
              <div className="bg-[#0d2920]/50 rounded-xl border border-blue-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-400" />
                  Reset Test Users
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Reset niroram77@gmail.com and jango5432@gmail.com to fresh state (clear swipes, matches, chats)
                </p>
                <Button
                  onClick={() => resetUsersByEmail(['niroram77@gmail.com', 'jango5432@gmail.com'])}
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Processing...' : 'Reset Nir & Jango'}
                </Button>
              </div>

              {/* Delete Dummy Users */}
              <div className="bg-[#0d2920]/50 rounded-xl border border-yellow-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <UserX className="h-5 w-5 text-yellow-400" />
                  Delete Dummy Users
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Remove all {stats.dummyUsers} dummy/test users from the database
                </p>
                <Button
                  onClick={deleteAllDummy}
                  disabled={processing}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {processing ? 'Processing...' : `Delete ${stats.dummyUsers} Dummy Users`}
                </Button>
              </div>

              {/* Remove Deleted Users */}
              <div className="bg-[#0d2920]/50 rounded-xl border border-orange-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-orange-400" />
                  Remove Deleted Users
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Permanently remove {stats.deletedUsers} users marked as deleted
                </p>
                <Button
                  onClick={deleteAllDeleted}
                  disabled={processing}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {processing ? 'Processing...' : `Remove ${stats.deletedUsers} Deleted Users`}
                </Button>
              </div>

              {/* Clear All Matches */}
              <div className="bg-[#0d2920]/50 rounded-xl border border-pink-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-400" />
                  Clear All Matches
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Delete all {stats.totalMatches} matches from the database
                </p>
                <Button
                  onClick={deleteAllMatches}
                  disabled={processing}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  {processing ? 'Processing...' : `Delete ${stats.totalMatches} Matches`}
                </Button>
              </div>

              {/* Clear All Chats */}
              <div className="bg-[#0d2920]/50 rounded-xl border border-cyan-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  Clear All Chats
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Delete all {stats.totalChats} chat conversations
                </p>
                <Button
                  onClick={deleteAllChats}
                  disabled={processing}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  {processing ? 'Processing...' : `Delete ${stats.totalChats} Chats`}
                </Button>
              </div>

              {/* Full Cleanup */}
              <div className="bg-[#0d2920]/50 rounded-xl border-2 border-red-500/50 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  FULL CLEANUP
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  ⚠️ Nuclear option: Delete all dummy users, deleted users, matches, chats, and reset all real users
                </p>
                <Button
                  onClick={fullCleanup}
                  disabled={processing}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {processing ? 'Processing...' : '☢️ FULL CLEANUP'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color = 'default' }: { 
  icon: React.ReactNode
  label: string
  value: number
  color?: string 
}) {
  const colors: Record<string, string> = {
    default: 'text-white',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    cyan: 'text-cyan-400'
  }
  
  return (
    <div className="bg-[#0d2920]/50 rounded-lg border border-[#4ade80]/20 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`${colors[color]} opacity-60`}>{icon}</span>
        <span className="text-white/50 text-xs">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  )
}
