"use client"

/**
 * 🦎 I4IGUANA - Venue Management (Super Admin)
 * 
 * List and manage all venues
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  QrCode,
  Edit,
  Plus,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

interface Venue {
  id: string
  displayName: string
  address?: string
  city?: string
  isActive: boolean
  isPilot?: boolean
  checkedInCount?: number
  adminEmail?: string
  venueType?: string
}

export default function VenueManagementPage() {
  const router = useRouter()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const venuesSnapshot = await getDocs(collection(db, 'venues'))
        const venuesList: Venue[] = venuesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Venue))
        
        // Sort by name
        venuesList.sort((a, b) => a.displayName?.localeCompare(b.displayName || '') || 0)
        
        setVenues(venuesList)
      } catch (error) {
        console.error('Error loading venues:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVenues()
  }, [])

  const filteredVenues = venues.filter(venue => 
    venue.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeVenues = filteredVenues.filter(v => v.isActive)
  const pilotVenues = filteredVenues.filter(v => v.isPilot)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/super')}
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Venue Management</h1>
                <p className="text-sm text-gray-500">ניהול מועדונים ומקומות</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{venues.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{activeVenues.length}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{pilotVenues.length}</div>
              <div className="text-xs text-gray-500">Pilots</div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Venues Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/admin/super/venue/${venue.id}`)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                  venue.isPilot 
                    ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50' 
                    : venue.isActive 
                      ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {venue.isPilot ? (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        🔥 Pilot
                      </span>
                    ) : venue.isActive ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <Edit className="w-4 h-4 text-gray-500" />
                </div>

                <h3 className="font-bold text-white mb-1">{venue.displayName || 'Unnamed Venue'}</h3>
                
                {venue.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{venue.address}</span>
                  </div>
                )}

                {venue.city && (
                  <div className="text-xs text-gray-500 mb-2">{venue.city}</div>
                )}

                {venue.venueType && (
                  <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    {venue.venueType}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredVenues.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No venues found</h3>
            <p className="text-gray-500">Try a different search term</p>
          </div>
        )}
      </main>
    </div>
  )
}
