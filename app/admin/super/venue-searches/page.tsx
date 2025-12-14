"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  MapPin, 
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore'
import { getAdminData } from '@/lib/admin-auth'

interface VenueSearch {
  id: string
  searchTerm: string
  count: number
  firstSearched: Timestamp
  lastSearched: Timestamp
  location?: { lat: number; lng: number }
}

export default function VenueSearchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searches, setSearches] = useState<VenueSearch[]>([])
  const [filter, setFilter] = useState('')

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
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
      loadSearches()
    }
    checkAuth()
  }, [router])

  // Load searches
  const loadSearches = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, 'venueSearches'))
      const data: VenueSearch[] = []
      
      snapshot.forEach(docSnap => {
        const d = docSnap.data()
        data.push({
          id: docSnap.id,
          searchTerm: d.searchTerm,
          count: d.count || 1,
          firstSearched: d.firstSearched,
          lastSearched: d.lastSearched,
          location: d.location
        })
      })
      
      // Sort by count (most searched first)
      data.sort((a, b) => b.count - a.count)
      setSearches(data)
    } catch (error) {
      console.error('Error loading searches:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete search entry
  const deleteSearch = async (id: string) => {
    if (!confirm('למחוק את רשומת החיפוש הזו?')) return
    
    try {
      await deleteDoc(doc(db, 'venueSearches', id))
      setSearches(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting search:', error)
    }
  }

  // Filter searches
  const filteredSearches = filter 
    ? searches.filter(s => s.searchTerm.toLowerCase().includes(filter.toLowerCase()))
    : searches

  // Format date
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate()
    return date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-black flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-[#4ade80] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#051410] to-black">
      {/* Header */}
      <div className="bg-[#0d2920]/80 border-b border-[#4ade80]/20 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super/db')}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">חיפושי מועדונים</h1>
                  <p className="text-sm text-white/60">מועדונים שחיפשו ולא מצאו</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-center px-4">
                <div className="text-2xl font-bold text-[#4ade80]">{searches.length}</div>
                <div className="text-xs text-white/50">חיפושים</div>
              </div>
              <Button
                onClick={loadSearches}
                variant="outline"
                className="border-[#4ade80]/30 text-[#4ade80]"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Filter */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="סנן חיפושים..."
            className="pr-10 bg-[#1a4d3e]/30 border-[#4ade80]/30 text-white"
            dir="rtl"
          />
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold mb-1">💡 לידים חמים!</h3>
              <p className="text-white/70 text-sm">
                אנשים חיפשו את המועדונים האלה אבל לא מצאו. 
                כדאי לפנות לבעלי המועדונים ולהציע להם להצטרף!
              </p>
            </div>
          </div>
        </div>

        {/* Searches List */}
        {filteredSearches.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">אין חיפושים נכשלים</p>
            <p className="text-sm text-white/40 mt-2">
              כשמישהו יחפש מועדון שלא קיים, הוא יופיע כאן
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSearches.map((search, index) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1a4d3e]/30 border border-[#4ade80]/20 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Search Term */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🔍</span>
                      <h3 className="text-white font-bold text-lg">"{search.searchTerm}"</h3>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-[#4ade80]">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-bold">{search.count}</span>
                        <span className="text-white/50">חיפושים</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-white/60">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(search.lastSearched)}</span>
                      </div>
                      
                      {search.location && (
                        <div className="flex items-center gap-1 text-white/60">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {search.location.lat.toFixed(4)}, {search.location.lng.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push(`/admin/super/venues?add=${encodeURIComponent(search.searchTerm)}`)}
                      className="bg-[#4ade80] text-[#0d2920] hover:bg-[#4ade80]/80"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      הוסף כמועדון
                    </Button>
                    
                    <Button
                      onClick={() => deleteSearch(search.id)}
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/20"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
