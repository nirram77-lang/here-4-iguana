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
  RotateCcw,
  QrCode,
  Pencil,
  Mail,
  Rocket,
  FlaskConical
} from 'lucide-react'
import Link from 'next/link'
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
  lastLogin?: any  // ✅ v2.8.20: Track last login for sorting
  lastActive?: any // ✅ v2.8.20: Track last activity
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
  const [dummyUsersCount, setDummyUsersCount] = useState(0)  // ✅ v2.8.5: Count from dummyUsers collection
  const [matches, setMatches] = useState<MatchData[]>([])
  const [chats, setChats] = useState<ChatData[]>([])
  const [phoneIdentities, setPhoneIdentities] = useState<PhoneIdentity[]>([])
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [showDummy, setShowDummy] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'real' | 'dummy' | 'deleted' | 'checkedIn' | 'premium' | 'matches' | 'chats'>('all')
  
  // ✅ NEW: Edit email modal state
  const [editingUser, setEditingUser] = useState<{ uid: string; name: string; currentEmail: string } | null>(null)
  const [newEmail, setNewEmail] = useState('')

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
        // ✅ Check multiple possible email fields
        const userEmail = data.email || data.authEmail || data.googleEmail || data.providerEmail || ''
        usersData.push({
          uid: doc.id,
          email: userEmail,
          name: data.name || data.displayName || 'No Name',
          gender: data.gender || 'Not Set',
          age: data.age || 0,
          photos: data.photos || [],
          onboardingComplete: data.onboardingComplete || false,
          checkedInVenue: data.checkedInVenue || null,
          isAvailable: data.isAvailable ?? true,
          isPremium: data.isPremium || false,
          deleted: data.deleted || false,
          // ✅ FIX: Detect dummy users by multiple criteria
          isDummy: data.isDummy === true || 
                   (data.name && data.name.toLowerCase().includes('dummy')) ||
                   (data.name && data.name.toLowerCase().includes('test')) ||
                   (userEmail && userEmail.toLowerCase().includes('dummy')) ||
                   (userEmail && userEmail.toLowerCase().includes('test@')) ||
                   (!data.onboardingComplete && !data.photos?.length && !data.name),
          createdAt: data.createdAt,
          lastLogin: data.lastLogin || data.lastActive || data.checkInData?.checkedInAt || data.createdAt,  // ✅ v2.8.20
          lastActive: data.lastActive || data.checkInData?.checkedInAt || data.createdAt,  // ✅ v2.8.20
          swipedRight: data.swipedRight || [],
          swipedLeft: data.swipedLeft || [],
          preferences: data.preferences
        })
      })
      setUsers(usersData)
      console.log(`✅ Loaded ${usersData.length} users`)

      // ✅ v2.8.5: Load Dummy Users count from separate collection
      try {
        const dummySnapshot = await getDocs(collection(db, 'dummyUsers'))
        setDummyUsersCount(dummySnapshot.size)
        console.log(`✅ Loaded ${dummySnapshot.size} dummy users from dummyUsers collection`)
      } catch (err) {
        console.log('⚠️ No dummyUsers collection yet')
        setDummyUsersCount(0)
      }

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
      const chatsSnapshot = await getDocs(collection(db, 'matches'))
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
    const dummyUsersInUsers = users.filter(u => u.isDummy)
    const totalDummy = dummyUsersInUsers.length + dummyUsersCount
    
    if (!confirm(`Delete ${totalDummy} dummy users? (${dummyUsersInUsers.length} from users + ${dummyUsersCount} from dummyUsers)`)) return
    
    setProcessing(true)
    try {
      // Delete from users collection
      for (const user of dummyUsersInUsers) {
        await deleteDoc(doc(db, 'users', user.uid))
      }
      
      // ✅ v2.8.5: Delete from dummyUsers collection
      if (dummyUsersCount > 0) {
        const dummySnapshot = await getDocs(collection(db, 'dummyUsers'))
        for (const docSnap of dummySnapshot.docs) {
          await deleteDoc(doc(db, 'dummyUsers', docSnap.id))
        }
        console.log(`✅ Deleted ${dummySnapshot.size} from dummyUsers collection`)
      }
      
      await loadAllData()
      console.log(`✅ Deleted ${totalDummy} total dummy users`)
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

  // ✅ NEW: Update user email in Firestore
  const updateUserEmail = async () => {
    if (!editingUser || !newEmail.trim()) return
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      alert('❌ Invalid email format!')
      return
    }
    
    setProcessing(true)
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        email: newEmail.trim().toLowerCase()
      })
      
      console.log(`✅ Updated email for ${editingUser.name}: ${newEmail}`)
      alert(`✅ Email updated!\n\n${editingUser.name}\n${editingUser.currentEmail || '(no email)'} → ${newEmail}`)
      
      // Close modal and reload data
      setEditingUser(null)
      setNewEmail('')
      await loadAllData()
    } catch (error) {
      console.error('❌ Error updating email:', error)
      alert('❌ Error updating email!')
    } finally {
      setProcessing(false)
    }
  }

  // Reset specific users by email
  // ✅ EXACT test accounts to reset - UPDATED based on actual DB emails
  const TEST_ACCOUNTS = [
    'nir.ram77@gmail.com',      // Nir Ram (main)
    'ramnir0555@gmail.com',     // אור Or (was niroram77)
    'iguanabar2@gmail.com'      // Jacob (N) (was jango5432)
  ]

  const resetUsersByEmail = async (emails: string[]) => {
    setProcessing(true)
    try {
      console.log('🔍 Searching for EXACT test accounts:', TEST_ACCOUNTS)
      
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersToReset: { uid: string; email: string; name: string }[] = []
      const foundEmails: string[] = []
      const notFoundEmails: string[] = [...TEST_ACCOUNTS]
      
      // ✅ Search for EXACT email matches - check multiple email fields!
      usersSnapshot.forEach(doc => {
        const data = doc.data()
        // ✅ Check ALL possible email fields (same as loading)
        const userEmail = (data.email || data.authEmail || data.googleEmail || data.providerEmail || '').toLowerCase().trim()
        const userName = (data.name || data.displayName || '').toLowerCase()
        
        // Check if this is one of our test accounts by email
        let isTestAccount = TEST_ACCOUNTS.some(testEmail => testEmail.toLowerCase() === userEmail)
        
        // ✅ FALLBACK: Also check by name for users with missing email
        // Known test users: Nir Ram, אור Or, Jacob (N)
        if (!isTestAccount && !userEmail) {
          // Check if name matches known test user patterns
          const lowerName = userName.toLowerCase()
          if (lowerName === 'nir ram' ||
              lowerName === 'nir r' ||
              lowerName.includes('אור') ||
              lowerName === 'or or' ||
              lowerName.includes('jango') || 
              lowerName === 'jacob (n)' ||
              lowerName === 'jacob') {
            isTestAccount = true
            console.log(`⚠️ Found by NAME (no email): ${data.name} - UID: ${doc.id}`)
          }
        }
        
        if (isTestAccount) {
          // Avoid duplicates
          if (!usersToReset.some(u => u.uid === doc.id)) {
            usersToReset.push({
              uid: doc.id,
              email: userEmail || '⚠️ NO EMAIL',
              name: data.name || data.displayName || 'Unknown'
            })
            if (userEmail) {
              foundEmails.push(userEmail)
              const idx = notFoundEmails.findIndex(e => e.toLowerCase() === userEmail)
              if (idx > -1) notFoundEmails.splice(idx, 1)
            }
            console.log(`✅ Found: ${data.name} (${userEmail || 'NO EMAIL'}) - UID: ${doc.id}`)
          }
        }
      })
      
      // ✅ Show detailed status - which accounts found, which not
      let statusMsg = `🔍 Search Results:\n\n`
      statusMsg += `✅ Found ${usersToReset.length}/${TEST_ACCOUNTS.length} accounts:\n`
      usersToReset.forEach((u, i) => {
        statusMsg += `   ${i+1}. ${u.name} (${u.email})\n`
      })
      
      if (notFoundEmails.length > 0) {
        statusMsg += `\n❌ Not found in database:\n`
        notFoundEmails.forEach(e => {
          statusMsg += `   • ${e}\n`
        })
      }
      
      if (usersToReset.length === 0) {
        alert(statusMsg + '\n\n⚠️ No accounts to reset!')
        setProcessing(false)
        return
      }
      
      statusMsg += `\n🔄 Reset these ${usersToReset.length} account(s)?`
      
      if (!confirm(statusMsg)) {
        setProcessing(false)
        return
      }
      
      for (const user of usersToReset) {
        console.log(`🔄 Resetting user: ${user.name} (${user.uid})`)
        
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
            console.log(`🗑️ Deleted match: ${match.id}`)
          }
        }
        
        // Delete active matches
        const activeMatchesSnapshot = await getDocs(collection(db, 'activeMatches'))
        for (const matchDoc of activeMatchesSnapshot.docs) {
          const data = matchDoc.data()
          if (data.users?.includes(user.uid) || matchDoc.id.includes(user.uid)) {
            await deleteDoc(doc(db, 'activeMatches', matchDoc.id))
            console.log(`🗑️ Deleted active match: ${matchDoc.id}`)
          }
        }
        
        // Delete their chats
        for (const chat of chats) {
          if (chat.participants.includes(user.uid)) {
            await deleteDoc(doc(db, 'chats', chat.id))
            console.log(`🗑️ Deleted chat: ${chat.id}`)
          }
        }
      }
      
      await loadAllData()
      
      // ✅ Detailed success message
      let successMsg = `✅ RESET COMPLETE!\n\n`
      successMsg += `📊 ${usersToReset.length}/${TEST_ACCOUNTS.length} accounts reset:\n\n`
      usersToReset.forEach((u, i) => {
        successMsg += `${i+1}. ✅ ${u.name}\n   📧 ${u.email}\n\n`
      })
      
      if (notFoundEmails.length > 0) {
        successMsg += `⚠️ Not in database:\n`
        notFoundEmails.forEach(e => {
          successMsg += `   • ${e}\n`
        })
      }
      
      alert(successMsg)
    } catch (error) {
      console.error('❌ Error resetting users:', error)
      alert(`Failed to reset users: ${error}`)
    } finally {
      setProcessing(false)
    }
  }

  // ✅ v2.8.22: Reset match counts for test users (to test paywall)
  const resetTestUsersMatchCounts = async () => {
    setProcessing(true)
    try {
      console.log('🔄 Resetting match counts for test users...')
      
      // Test user emails to reset
      const testEmails = ['jango5432@gmail.com', 'niroram77@gmail.com', 'nir.ram77@gmail.com']
      let resetCount = 0
      
      // Find and reset phoneIdentities for test users
      const phoneIdentitiesSnapshot = await getDocs(collection(db, 'phoneIdentities'))
      
      for (const phoneDoc of phoneIdentitiesSnapshot.docs) {
        const phoneData = phoneDoc.data()
        
        // Check if this phone belongs to a test user by finding the user
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), where('phoneNumber', '==', phoneDoc.id))
        )
        
        let isTestUser = false
        usersSnapshot.forEach(userDoc => {
          const userData = userDoc.data()
          const userEmail = (userData.email || '').toLowerCase()
          if (testEmails.some(te => te.toLowerCase() === userEmail)) {
            isTestUser = true
          }
        })
        
        // Also check by email directly in phoneData if stored
        if (phoneData.email && testEmails.some(te => te.toLowerCase() === phoneData.email.toLowerCase())) {
          isTestUser = true
        }
        
        if (isTestUser) {
          await updateDoc(doc(db, 'phoneIdentities', phoneDoc.id), {
            matchesCountToday: 0,
            passesUsedToday: 0,
            passesLeft: 4
          })
          resetCount++
          console.log(`✅ Reset match counts for phone: ${phoneDoc.id}`)
        }
      }
      
      alert(`✅ Reset match counts for ${resetCount} test user phone(s)!\n\nThey can now test the paywall again.`)
    } catch (error) {
      console.error('❌ Error resetting match counts:', error)
      alert(`Failed: ${error}`)
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

  // Clear all cooldowns (delete matches and activeMatches)
  const clearAllCooldowns = async () => {
    if (!confirm('Clear all match cooldowns? This will delete all matches and active matches.')) return
    
    setProcessing(true)
    try {
      // Delete all matches
      const matchesSnapshot = await getDocs(collection(db, 'matches'))
      for (const matchDoc of matchesSnapshot.docs) {
        await deleteDoc(doc(db, 'matches', matchDoc.id))
      }
      console.log(`✅ Deleted ${matchesSnapshot.size} matches`)
      
      // Delete all active matches
      const activeMatchesSnapshot = await getDocs(collection(db, 'activeMatches'))
      for (const matchDoc of activeMatchesSnapshot.docs) {
        await deleteDoc(doc(db, 'activeMatches', matchDoc.id))
      }
      console.log(`✅ Deleted ${activeMatchesSnapshot.size} active matches`)
      
      // Also clear swipedRight/swipedLeft from users to allow fresh swiping
      const usersSnapshot = await getDocs(collection(db, 'users'))
      for (const userDoc of usersSnapshot.docs) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          swipedRight: [],
          swipedLeft: []
        })
      }
      console.log(`✅ Cleared swipes from ${usersSnapshot.size} users`)
      
      await loadAllData()
      alert('✅ All cooldowns cleared! Users can now match again.')
    } catch (error) {
      console.error('❌ Error clearing cooldowns:', error)
      alert('Error clearing cooldowns')
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

  // Filter users based on activeFilter
  const filteredUsers = users.filter(u => {
    // First apply active filter
    switch (activeFilter) {
      case 'real':
        if (!u.onboardingComplete || !u.photos?.length || u.isDummy || u.deleted) return false
        break
      case 'dummy':
        if (!u.isDummy) return false
        break
      case 'deleted':
        if (!u.deleted) return false
        break
      case 'checkedIn':
        if (!u.checkedInVenue) return false
        break
      case 'premium':
        if (!u.isPremium) return false
        break
      case 'all':
      default:
        if (!showDeleted && u.deleted) return false
        if (!showDummy && u.isDummy) return false
        break
    }
    
    // Then apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return u.email.toLowerCase().includes(search) || 
             u.name.toLowerCase().includes(search) ||
             u.uid.toLowerCase().includes(search)
    }
    return true
  }).sort((a, b) => {
    // ✅ v2.8.20: Sort by Last Active (most recent first)
    const getTimestamp = (u: UserData) => {
      const lastActive = u.lastLogin || u.lastActive || u.createdAt
      if (!lastActive) return 0
      return lastActive.toDate ? lastActive.toDate().getTime() : new Date(lastActive).getTime()
    }
    return getTimestamp(b) - getTimestamp(a)  // Descending (newest first)
  })

  // Stats
  // ✅ FIX: Real users = completed onboarding + have photos + not dummy + not deleted
  const stats = {
    totalUsers: users.length,
    realUsers: users.filter(u => u.onboardingComplete && u.photos?.length > 0 && !u.isDummy && !u.deleted).length,
    dummyUsers: dummyUsersCount + users.filter(u => u.isDummy).length,  // ✅ v2.8.5: Count from both collections
    deletedUsers: users.filter(u => u.deleted).length,
    incompleteUsers: users.filter(u => !u.onboardingComplete && !u.isDummy && !u.deleted).length,
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
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
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

            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/admin/super/control')}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                🎛️ Control
              </Button>
              
              <Button
                onClick={() => router.push('/admin/super/pilot')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Rocket className="mr-2 h-4 w-4" />
                🚀 Pilot Launch
              </Button>
              
              <Button
                onClick={() => router.push('/admin/super/simulator')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                🧪 Simulator
              </Button>
              
              <Button
                onClick={() => router.push('/admin/super/stickers')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <QrCode className="mr-2 h-4 w-4" />
                🖨️ Sticker Generator
              </Button>
              
              <Button
                onClick={loadAllData}
                disabled={processing}
                variant="outline"
                className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {/* ✅ NEW: Test Suite Button */}
              <Link href="/admin/super/test-suite">
                <Button
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Test Suite
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - Clickable Cards */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <ClickableStatCard 
            icon={<Users />} 
            label="Total" 
            value={stats.totalUsers} 
            isActive={activeFilter === 'all'}
            onClick={() => { setActiveFilter('all'); setActiveTab('users'); }}
          />
          <ClickableStatCard 
            icon={<UserCheck />} 
            label="Real" 
            value={stats.realUsers} 
            color="green"
            isActive={activeFilter === 'real'}
            onClick={() => { setActiveFilter('real'); setActiveTab('users'); }}
          />
          <ClickableStatCard 
            icon={<UserX />} 
            label="Dummy" 
            value={stats.dummyUsers} 
            color="yellow"
            isActive={activeFilter === 'dummy'}
            onClick={() => { setActiveFilter('dummy'); setActiveTab('users'); }}
          />
          <ClickableStatCard 
            icon={<Trash2 />} 
            label="Deleted" 
            value={stats.deletedUsers} 
            color="red"
            isActive={activeFilter === 'deleted'}
            onClick={() => { setActiveFilter('deleted'); setActiveTab('users'); }}
          />
          <ClickableStatCard 
            icon={<MapPin />} 
            label="Checked In" 
            value={stats.checkedIn} 
            color="blue"
            isActive={activeFilter === 'checkedIn'}
            onClick={() => { setActiveFilter('checkedIn'); setActiveTab('users'); }}
          />
          <ClickableStatCard 
            icon={<Shield />} 
            label="Premium" 
            value={stats.premium} 
            color="purple"
            isActive={activeFilter === 'premium'}
            onClick={() => { setActiveFilter('premium'); setActiveTab('users'); }}
          />
          <ClickableStatCard 
            icon={<Heart />} 
            label="Matches" 
            value={stats.totalMatches} 
            color="pink"
            isActive={activeTab === 'matches'}
            onClick={() => setActiveTab('matches')}
          />
          <ClickableStatCard 
            icon={<MessageSquare />} 
            label="Chats" 
            value={stats.totalChats} 
            color="cyan"
            isActive={activeTab === 'chats'}
            onClick={() => setActiveTab('chats')}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['users', 'matches', 'chats', 'phones', 'cleanup'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-[#4ade80] text-[#0d2920] font-bold' 
                  : 'bg-white/10 border border-[#4ade80]/30 text-white hover:bg-[#4ade80]/20'
              }`}
            >
              {tab === 'users' && <Users className="h-4 w-4" />}
              {tab === 'matches' && <Heart className="h-4 w-4" />}
              {tab === 'chats' && <MessageSquare className="h-4 w-4" />}
              {tab === 'phones' && <Shield className="h-4 w-4" />}
              {tab === 'cleanup' && <Trash2 className="h-4 w-4" />}
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        
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
              {/* Active Filter Indicator */}
              {activeFilter !== 'all' && (
                <div className="flex items-center gap-2 bg-[#4ade80]/20 border border-[#4ade80]/50 rounded-lg px-3 py-2">
                  <span className="text-[#4ade80] text-sm font-medium">
                    🔍 מציג: {
                      activeFilter === 'real' ? 'משתמשים אמיתיים' :
                      activeFilter === 'dummy' ? 'משתמשי דמה' :
                      activeFilter === 'deleted' ? 'משתמשים מחוקים' :
                      activeFilter === 'checkedIn' ? 'מחוברים למקום' :
                      activeFilter === 'premium' ? 'פרימיום' : activeFilter
                    } ({filteredUsers.length})
                  </span>
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className="text-white/60 hover:text-white text-lg"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <Button
                onClick={() => resetUsersByEmail(TEST_ACCOUNTS)}
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset 3 Test Users
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
                      <th className="px-4 py-3 text-white font-bold">Email</th>
                      <th className="px-4 py-3 text-white font-bold">Gender</th>
                      <th className="px-4 py-3 text-white font-bold">Age</th>
                      <th className="px-4 py-3 text-white font-bold">Age Range</th>
                      <th className="px-4 py-3 text-white font-bold">Venue</th>
                      <th className="px-4 py-3 text-white font-bold">Last Active</th>
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
                            <div className="text-white/30 text-xs font-mono">{user.uid.substring(0, 12)}...</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {user.email ? (
                            <div className="text-white/70 text-xs">{user.email}</div>
                          ) : (
                            <span className="text-red-400/60 text-xs">⚠️ No email</span>
                          )}
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
                          {/* ✅ v2.8.20: Last Active column */}
                          {(() => {
                            const lastActive = user.lastLogin || user.lastActive || user.createdAt
                            if (!lastActive) return <span className="text-white/30 text-xs">-</span>
                            
                            const date = lastActive.toDate ? lastActive.toDate() : new Date(lastActive)
                            const now = new Date()
                            const diffMs = now.getTime() - date.getTime()
                            const diffHours = diffMs / (1000 * 60 * 60)
                            const diffDays = diffMs / (1000 * 60 * 60 * 24)
                            
                            // Highlight recent users (last 24 hours) in green
                            const isRecent = diffHours < 24
                            const isNew = diffDays < 7
                            
                            const formatDate = () => {
                              if (diffHours < 1) return `${Math.round(diffMs / (1000 * 60))} min ago`
                              if (diffHours < 24) return `${Math.round(diffHours)} hrs ago`
                              if (diffDays < 7) return `${Math.round(diffDays)} days ago`
                              return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })
                            }
                            
                            return (
                              <div className={`text-xs ${
                                isRecent ? 'text-green-400 font-bold' : 
                                isNew ? 'text-yellow-400' : 
                                'text-white/50'
                              }`}>
                                {isRecent && <span className="mr-1">🟢</span>}
                                {formatDate()}
                              </div>
                            )
                          })()}
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
                              onClick={() => {
                                setEditingUser({ uid: user.uid, name: user.name, currentEmail: user.email })
                                setNewEmail(user.email || '')
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-amber-400 hover:bg-amber-500/20 h-8 w-8 p-0"
                              title="Edit Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
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
                  Reset 3 test accounts to fresh state (clear swipes, matches, chats):
                  <br />• nir.ram77@gmail.com
                  <br />• niroram77@gmail.com  
                  <br />• jango5432@gmail.com
                </p>
                <Button
                  onClick={() => resetUsersByEmail(TEST_ACCOUNTS)}
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Processing...' : 'Reset 3 Test Users'}
                </Button>
              </div>

              {/* ✅ v2.8.22: Reset Match Counts for Test Users (Paywall Testing) */}
              <div className="bg-[#0d2920]/50 rounded-xl border border-purple-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-purple-400" />
                  Reset Match Counts
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Reset matchesCountToday & passesLeft for test users to test paywall:
                  <br />• jango5432@gmail.com
                  <br />• niroram77@gmail.com
                </p>
                <Button
                  onClick={resetTestUsersMatchCounts}
                  disabled={processing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {processing ? 'Processing...' : '🧪 Reset Match Counts'}
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

              {/* Clear Match Cooldowns */}
              <div className="bg-[#0d2920]/50 rounded-xl border border-purple-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-purple-400" />
                  Clear Match Cooldowns
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Remove 12-hour cooldown between users (delete all matches and active matches)
                </p>
                <Button
                  onClick={clearAllCooldowns}
                  disabled={processing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {processing ? 'Processing...' : '⏰ Clear All Cooldowns'}
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
      
      {/* ✅ Edit Email Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-2xl p-6 max-w-md w-full border-2 border-[#4ade80]/30 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#4ade80]" />
              Edit User Email
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-white/70 text-sm mb-1">User</p>
                <p className="text-white font-medium">{editingUser.name}</p>
              </div>
              
              <div>
                <p className="text-white/70 text-sm mb-1">Current Email</p>
                <p className={`font-mono ${editingUser.currentEmail ? 'text-white' : 'text-red-400'}`}>
                  {editingUser.currentEmail || '⚠️ No email set'}
                </p>
              </div>
              
              <div>
                <p className="text-white/70 text-sm mb-1">New Email</p>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address..."
                  className="w-full bg-black/30 border border-[#4ade80]/30 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#4ade80] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setEditingUser(null)
                  setNewEmail('')
                }}
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={updateUserEmail}
                className="flex-1 bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold"
                disabled={processing || !newEmail.trim()}
              >
                {processing ? 'Saving...' : 'Save Email'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Stat Card Component (legacy)
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

// ✅ NEW: Clickable Stat Card Component
function ClickableStatCard({ icon, label, value, color = 'default', isActive, onClick }: { 
  icon: React.ReactNode
  label: string
  value: number
  color?: string
  isActive?: boolean
  onClick?: () => void
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
  
  const borderColors: Record<string, string> = {
    default: 'border-white/50',
    green: 'border-green-400',
    yellow: 'border-yellow-400',
    red: 'border-red-400',
    blue: 'border-blue-400',
    purple: 'border-purple-400',
    pink: 'border-pink-400',
    cyan: 'border-cyan-400'
  }
  
  return (
    <button
      onClick={onClick}
      className={`
        bg-[#0d2920]/50 rounded-lg p-3 text-left transition-all duration-200
        hover:bg-[#0d2920]/80 hover:scale-105 cursor-pointer
        ${isActive 
          ? `border-2 ${borderColors[color]} shadow-lg shadow-${color}-500/20` 
          : 'border border-[#4ade80]/20 hover:border-[#4ade80]/40'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`${colors[color]} ${isActive ? 'opacity-100' : 'opacity-60'}`}>{icon}</span>
        <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
    </button>
  )
}
