"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  FileText,
  Plus,
  Eye,
  Trash2,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  addDoc,
  setDoc,
  where
} from 'firebase/firestore'
import { createVenue } from '@/lib/venue-service'

interface VenueRequest {
  id: string
  venueName: string
  venueType: string
  address: string
  city: string
  location: {
    latitude: number
    longitude: number
  }
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  website?: string
  instagram?: string
  openingHours?: string
  capacity?: number
  description?: string
  logoUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Timestamp
  updatedAt: Timestamp
  notes?: string
  reviewedBy?: string
  reviewedAt?: Timestamp
}

export default function VenueRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<VenueRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<VenueRequest | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Load venue requests
  useEffect(() => {
    let q = query(
      collection(db, 'venueRequests'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VenueRequest[]
      
      setRequests(requestsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter requests
  const filteredRequests = requests.filter(req => {
    // Status filter
    if (filter !== 'all' && req.status !== filter) return false
    
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      return (
        req.venueName.toLowerCase().includes(search) ||
        req.ownerName.toLowerCase().includes(search) ||
        req.city.toLowerCase().includes(search) ||
        req.ownerEmail.toLowerCase().includes(search)
      )
    }
    
    return true
  })

  // Approve and create venue
  const handleApprove = async (request: VenueRequest) => {
    if (!confirm(`האם לאשר ולהוסיף את "${request.venueName}" כ-Venue חדש?`)) return
    
    setIsCreating(true)
    
    try {
      // Generate unique venue ID
      const venueId = `venue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Create the venue with correct structure
      const venueData = {
        id: venueId,
        name: request.venueName.toLowerCase().replace(/\s+/g, '-'),
        displayName: request.venueName,
        location: {
          latitude: request.location.latitude,
          longitude: request.location.longitude,
          address: `${request.address}, ${request.city}`
        },
        radius: 500,
        qrCode: '', // Will be generated later
        qrData: {
          type: 'iguana_checkin',
          venueId: venueId,
          venueName: request.venueName
        },
        adminUid: '',
        adminEmail: request.ownerEmail,
        adminPhone: request.ownerPhone || '',
        ownerName: request.ownerName,
        checkedInUsers: [],
        stats: {
          totalCheckIns: 0,
          activeNow: 0,
          notificationsSent: 0,
          matchesCreated: 0
        },
        website: request.website || '',
        instagram: request.instagram || '',
        openingHours: request.openingHours || '',
        capacity: request.capacity || 0,
        description: request.description || '',
        logoUrl: request.logoUrl || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        active: true,
        createdFromRequest: request.id
      }

      // Add to venues collection with the venueId as document ID
      await setDoc(doc(db, 'venues', venueId), venueData)
      
      console.log('✅ Venue created:', venueId)

      // Update request status
      await updateDoc(doc(db, 'venueRequests', request.id), {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy: 'admin',
        approvedVenueId: venueId,
        updatedAt: Timestamp.now()
      })

      alert(`✅ "${request.venueName}" נוסף בהצלחה!`)
      setSelectedRequest(null)
      
    } catch (error: any) {
      console.error('Error creating venue:', error)
      alert('שגיאה ביצירת ה-Venue: ' + error.message)
    } finally {
      setIsCreating(false)
    }
  }

  // Reject request
  const handleReject = async () => {
    if (!selectedRequest) return
    
    try {
      await updateDoc(doc(db, 'venueRequests', selectedRequest.id), {
        status: 'rejected',
        reviewedAt: Timestamp.now(),
        reviewedBy: 'admin',
        notes: rejectReason,
        updatedAt: Timestamp.now()
      })

      alert('הבקשה נדחתה')
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedRequest(null)
      
    } catch (error: any) {
      console.error('Error rejecting request:', error)
      alert('שגיאה: ' + error.message)
    }
  }

  // Delete request
  const handleDelete = async (requestId: string) => {
    if (!confirm('האם למחוק את הבקשה לצמיתות?')) return
    
    try {
      await deleteDoc(doc(db, 'venueRequests', requestId))
      setSelectedRequest(null)
    } catch (error: any) {
      console.error('Error deleting request:', error)
      alert('שגיאה במחיקה: ' + error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            ממתין
          </span>
        )
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            אושר
          </span>
        )
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            נדחה
          </span>
        )
      default:
        return null
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a4d3e] to-[#0d2920] border-b border-[#4ade80]/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super')}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <div className="text-4xl">📝</div>
              <div>
                <h1 className="text-2xl font-black text-white">
                  בקשות הצטרפות
                </h1>
                <p className="text-[#4ade80] text-sm font-semibold">
                  {pendingCount > 0 ? `${pendingCount} בקשות ממתינות` : 'אין בקשות ממתינות'}
                </p>
              </div>
            </div>

            {/* Pending Badge */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400 font-bold">{pendingCount} חדשות!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8" dir="rtl">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם, עיר, אימייל..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10 h-12 rounded-xl"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setFilter(status)}
                variant={filter === status ? 'default' : 'outline'}
                className={filter === status 
                  ? 'bg-[#4ade80] text-black hover:bg-[#22c55e]' 
                  : 'border-white/20 text-white hover:bg-white/10'
                }
              >
                {status === 'all' && 'הכל'}
                {status === 'pending' && `ממתין (${requests.filter(r => r.status === 'pending').length})`}
                {status === 'approved' && 'אושר'}
                {status === 'rejected' && 'נדחה'}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-1 space-y-3">
            {loading ? (
              <div className="text-center py-12 text-white/60">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                טוען...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין בקשות</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedRequest?.id === request.id
                      ? 'bg-[#4ade80]/20 border-2 border-[#4ade80]'
                      : 'bg-white/5 border-2 border-white/10 hover:border-white/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-bold">{request.venueName}</h3>
                      <p className="text-white/60 text-sm">{request.city}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex items-center gap-4 text-white/50 text-xs">
                    <span>{request.ownerName}</span>
                    <span>•</span>
                    <span>{new Date(request.createdAt?.toDate()).toLocaleDateString('he-IL')}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Request Details */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <motion.div
                key={selectedRequest.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/10 p-6 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedRequest.venueName}
                      </h2>
                      <p className="text-white/60">{selectedRequest.venueType}</p>
                    </div>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Venue Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        כתובת
                      </div>
                      <p className="text-white">{selectedRequest.address}, {selectedRequest.city}</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                        <MapPin className="w-4 h-4 text-[#4ade80]" />
                        קואורדינטות
                      </div>
                      <p className="text-white font-mono text-sm">
                        {selectedRequest.location.latitude}, {selectedRequest.location.longitude}
                      </p>
                      <a 
                        href={`https://maps.google.com/?q=${selectedRequest.location.latitude},${selectedRequest.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4ade80] text-sm flex items-center gap-1 mt-1 hover:underline"
                      >
                        פתח במפות <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#4ade80]" />
                      פרטי בעל העסק
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-white/60 text-sm mb-1">שם</div>
                        <p className="text-white font-medium">{selectedRequest.ownerName}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-white/60 text-sm mb-1">טלפון</div>
                        <a href={`tel:${selectedRequest.ownerPhone}`} className="text-[#4ade80] font-medium hover:underline">
                          {selectedRequest.ownerPhone}
                        </a>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-white/60 text-sm mb-1">אימייל</div>
                        <a href={`mailto:${selectedRequest.ownerEmail}`} className="text-[#4ade80] font-medium hover:underline text-sm break-all">
                          {selectedRequest.ownerEmail}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(selectedRequest.website || selectedRequest.instagram || selectedRequest.openingHours || selectedRequest.capacity) && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">מידע נוסף</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedRequest.website && (
                          <a 
                            href={selectedRequest.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors"
                          >
                            <Globe className="w-5 h-5 text-[#4ade80] mx-auto mb-1" />
                            <span className="text-white/60 text-xs">אתר</span>
                          </a>
                        )}
                        {selectedRequest.instagram && (
                          <a 
                            href={`https://instagram.com/${selectedRequest.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors"
                          >
                            <Instagram className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                            <span className="text-white/60 text-xs">{selectedRequest.instagram}</span>
                          </a>
                        )}
                        {selectedRequest.openingHours && (
                          <div className="bg-white/5 rounded-xl p-3 text-center">
                            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                            <span className="text-white/60 text-xs">{selectedRequest.openingHours}</span>
                          </div>
                        )}
                        {selectedRequest.capacity && (
                          <div className="bg-white/5 rounded-xl p-3 text-center">
                            <User className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                            <span className="text-white/60 text-xs">{selectedRequest.capacity} אנשים</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedRequest.description && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">תיאור</h3>
                      <p className="text-white/70 bg-white/5 rounded-xl p-4">
                        {selectedRequest.description}
                      </p>
                    </div>
                  )}

                  {/* Notes (for rejected) */}
                  {selectedRequest.notes && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <h3 className="text-red-400 font-bold mb-2">סיבת דחייה</h3>
                      <p className="text-white/70">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedRequest.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                      <Button
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={isCreating}
                        className="flex-1 h-12 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-black font-bold hover:from-[#22c55e] hover:to-[#16a34a]"
                      >
                        {isCreating ? (
                          <RefreshCw className="w-5 h-5 animate-spin ml-2" />
                        ) : (
                          <Plus className="w-5 h-5 ml-2" />
                        )}
                        אשר וצור Venue
                      </Button>
                      <Button
                        onClick={() => setShowRejectModal(true)}
                        variant="outline"
                        className="h-12 border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <XCircle className="w-5 h-5 ml-2" />
                        דחה
                      </Button>
                    </div>
                  )}

                  {selectedRequest.status !== 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                      <Button
                        onClick={() => handleDelete(selectedRequest.id)}
                        variant="outline"
                        className="h-12 border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-5 h-5 ml-2" />
                        מחק בקשה
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl h-full flex items-center justify-center p-12">
                <div className="text-center text-white/40">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">בחר בקשה לצפייה בפרטים</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRejectModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-2xl z-50 p-6"
              dir="rtl"
            >
              <h3 className="text-xl font-bold text-white mb-4">דחיית בקשה</h3>
              <p className="text-white/60 mb-4">
                האם לדחות את הבקשה של "{selectedRequest?.venueName}"?
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="סיבת דחייה (אופציונלי)"
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl p-4 h-24 resize-none mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  דחה בקשה
                </Button>
                <Button
                  onClick={() => setShowRejectModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  ביטול
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
