"use client"

/**
 * 🦎 I4IGUANA - Premium Requests Admin Page
 * 
 * View and manage premium upgrade requests from users
 * - See pending requests
 * - Mark as approved/rejected
 * - View user details
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Crown,
  ArrowLeft,
  Check,
  X,
  Clock,
  User,
  Mail,
  Calendar,
  DollarSign,
  Phone,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

interface PremiumRequest {
  id: string
  userId: string
  userEmail: string
  firstName: string
  lastName: string
  fullName: string
  selectedPlan: 'pass' | 'weekly' | 'monthly'
  planPrice: number
  currency?: string
  paymentMethod?: string
  language?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: any
  processedAt?: any
  processedBy?: string
  couponCode?: string
}

const PLAN_NAMES: Record<string, { name: string, emoji: string, color: string }> = {
  pass: { name: 'Pass (חד פעמי)', emoji: '⚡', color: 'text-blue-400' },
  weekly: { name: 'שבועי (7 ימים)', emoji: '🗓️', color: 'text-orange-400' },
  monthly: { name: 'חודשי (30 יום)', emoji: '👑', color: 'text-amber-400' }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  BRL: 'R$'
}

const PAYMENT_METHODS: Record<string, { name: string, color: string }> = {
  bit: { name: 'Bit 🇮🇱', color: 'text-[#00D4AA]' },
  pix: { name: 'PIX 🇧🇷', color: 'text-[#32BCAD]' },
  stripe: { name: 'Card 🇺🇸', color: 'text-purple-400' }
}

export default function PremiumRequestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [requests, setRequests] = useState<PremiumRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  // Listen to premium requests
  useEffect(() => {
    const q = query(
      collection(db, 'premium_requests'),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PremiumRequest[]
      
      setRequests(requestsData)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [])

  // Approve request
  const handleApprove = async (request: PremiumRequest) => {
    setProcessingId(request.id)
    
    // Generate coupon code
    const couponCode = `PREMIUM-${request.selectedPlan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    
    try {
      await updateDoc(doc(db, 'premium_requests', request.id), {
        status: 'approved',
        processedAt: serverTimestamp(),
        couponCode
      })
      
      toast({
        title: '✅ אושר!',
        description: `קופון נוצר: ${couponCode}`
      })
      
      // Copy coupon to clipboard
      await navigator.clipboard.writeText(couponCode)
      
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: '❌ שגיאה',
        description: 'לא ניתן לאשר את הבקשה',
        variant: 'destructive'
      })
    } finally {
      setProcessingId(null)
    }
  }

  // Reject request
  const handleReject = async (request: PremiumRequest) => {
    setProcessingId(request.id)
    
    try {
      await updateDoc(doc(db, 'premium_requests', request.id), {
        status: 'rejected',
        processedAt: serverTimestamp()
      })
      
      toast({
        title: '❌ נדחה',
        description: 'הבקשה נדחתה'
      })
      
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: '❌ שגיאה',
        description: 'לא ניתן לדחות את הבקשה',
        variant: 'destructive'
      })
    } finally {
      setProcessingId(null)
    }
  }

  // Copy coupon
  const handleCopyCoupon = async (coupon: string) => {
    await navigator.clipboard.writeText(coupon)
    toast({
      title: '📋 הועתק!',
      description: 'הקופון הועתק ללוח'
    })
  }

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true
    return r.status === filter
  })

  // Stats
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalRevenue: requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.planPrice || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f1a] via-[#0d2920] to-[#0a1f1a] p-4 sm:p-8" dir="rtl">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin/super/venues')}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              חזרה
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="h-6 w-6 text-[#0d2920]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">בקשות Premium</h1>
                <p className="text-white/60 text-sm">ניהול בקשות שדרוג</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => setLoading(true)}
            variant="outline"
            size="sm"
            className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/20"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 text-center"
          >
            <Clock className="h-6 w-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-amber-400/70 text-sm">ממתינות</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 text-center"
          >
            <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            <p className="text-green-400/70 text-sm">אושרו</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-center"
          >
            <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
            <p className="text-red-400/70 text-sm">נדחו</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#4ade80]/20 border border-[#4ade80]/30 rounded-2xl p-4 text-center"
          >
            <DollarSign className="h-6 w-6 text-[#4ade80] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#4ade80]">₪{stats.totalRevenue}</p>
            <p className="text-[#4ade80]/70 text-sm">הכנסות</p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-2 flex-wrap">
          {/* Pending Button */}
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'pending' 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'border-amber-500/50 text-amber-400 hover:bg-amber-500/20'}
          >
            ממתינות
            <span className="mr-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {stats.pending}
            </span>
          </Button>
          
          {/* Approved Button */}
          <Button
            onClick={() => setFilter('approved')}
            variant={filter === 'approved' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'approved' 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'border-green-500/50 text-green-400 hover:bg-green-500/20'}
          >
            אושרו
            <span className="mr-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {stats.approved}
            </span>
          </Button>
          
          {/* Rejected Button */}
          <Button
            onClick={() => setFilter('rejected')}
            variant={filter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'rejected' 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'border-red-500/50 text-red-400 hover:bg-red-500/20'}
          >
            נדחו
            <span className="mr-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {stats.rejected}
            </span>
          </Button>
          
          {/* All Button */}
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'all' 
              ? 'bg-white/20 hover:bg-white/30 text-white' 
              : 'border-white/30 text-white/70 hover:bg-white/10'}
          >
            הכל
          </Button>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60">טוען בקשות...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Crown className="h-12 w-12 text-amber-400/30 mx-auto mb-4" />
            <p className="text-white/60">אין בקשות {filter !== 'all' && `ב-${filter}`}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white/5 border rounded-2xl p-6 ${
                    request.status === 'pending' 
                      ? 'border-amber-500/30' 
                      : request.status === 'approved'
                        ? 'border-green-500/30'
                        : 'border-red-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{request.fullName}</h3>
                        <p className="text-white/50 text-sm flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {request.userEmail || 'לא ידוע'}
                        </p>
                      </div>
                    </div>

                    {/* Plan Info */}
                    <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-2">
                      <span className="text-2xl">{PLAN_NAMES[request.selectedPlan]?.emoji || '💰'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${PLAN_NAMES[request.selectedPlan]?.color || 'text-white'}`}>
                            {PLAN_NAMES[request.selectedPlan]?.name || request.selectedPlan}
                          </p>
                          {request.paymentMethod && (
                            <span className={`text-xs ${PAYMENT_METHODS[request.paymentMethod]?.color || 'text-white/60'}`}>
                              {PAYMENT_METHODS[request.paymentMethod]?.name || request.paymentMethod}
                            </span>
                          )}
                        </div>
                        <p className="text-amber-400 font-bold">
                          {CURRENCY_SYMBOLS[request.currency || 'ILS'] || '₪'}{request.planPrice}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      {request.status === 'pending' ? (
                        <>
                          <Button
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.id}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 ml-1" />
                                אשר
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.id}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          >
                            <X className="h-4 w-4 ml-1" />
                            דחה
                          </Button>
                        </>
                      ) : request.status === 'approved' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            אושר
                          </span>
                          {request.couponCode && (
                            <Button
                              onClick={() => handleCopyCoupon(request.couponCode!)}
                              variant="outline"
                              size="sm"
                              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                            >
                              <Copy className="h-3 w-3 ml-1" />
                              {request.couponCode}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          נדחה
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-white/40 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {request.createdAt?.toDate?.()?.toLocaleString('he-IL') || 'לא ידוע'}
                    </div>
                    <span className="text-white/30">ID: {request.userId?.slice(0, 8)}...</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}