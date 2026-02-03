"use client"

/**
 * 🎧 Audiobook Download Page
 * - Tracks download count (max 3)
 * - Shows nice "exhausted" page after limit
 * - NO-ART GALLERY Hollywood Edition
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Headphones, Download, AlertCircle, MessageCircle, 
  Loader2, CheckCircle, XCircle, RefreshCw
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'

type Status = 'loading' | 'downloading' | 'exhausted' | 'not-found' | 'error' | 'expired'

export default function AudiobookDownloadPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [status, setStatus] = useState<Status>('loading')
  const [customerName, setCustomerName] = useState('')
  const [downloadCount, setDownloadCount] = useState(0)

  const MAX_DOWNLOADS = 3
  const EXPIRY_DAYS = 30

  useEffect(() => {
    if (orderId) {
      checkAndDownload()
    }
  }, [orderId])

  const checkAndDownload = async () => {
    try {
      // Get order from Firestore
      const orderRef = doc(db, 'audiobook_orders', orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        setStatus('not-found')
        return
      }

      const orderData = orderSnap.data()
      setCustomerName(orderData.customerName || '')
      setDownloadCount(orderData.downloadCount || 0)

      // Check if download URL exists
      if (!orderData.downloadUrl) {
        setStatus('not-found')
        return
      }

      // Check expiry (30 days from upload)
      if (orderData.uploadedAt) {
        const uploadDate = orderData.uploadedAt.toDate ? orderData.uploadedAt.toDate() : new Date(orderData.uploadedAt)
        const expiryDate = new Date(uploadDate)
        expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS)
        
        if (new Date() > expiryDate) {
          setStatus('expired')
          return
        }
      }

      // Check download count
      const currentCount = orderData.downloadCount || 0
      if (currentCount >= MAX_DOWNLOADS) {
        setStatus('exhausted')
        return
      }

      // ✅ Can download! Increment counter and redirect
      setStatus('downloading')
      
      // Update download count in Firestore
      await updateDoc(orderRef, {
        downloadCount: increment(1),
        lastDownloadAt: new Date().toISOString()
      })

      // Small delay for UX, then redirect to actual file
      setTimeout(() => {
        window.location.href = orderData.downloadUrl
      }, 1500)

    } catch (error) {
      console.error('Download error:', error)
      setStatus('error')
    }
  }

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `שלום! 👋\n\n` +
      `ניסיתי להוריד את האודיובוק אבל הלינק לא עובד.\n\n` +
      `מספר הזמנה: ${orderId}\n` +
      `שם: ${customerName}\n\n` +
      `תודה!`
    )
    window.open(`https://wa.me/972522653170?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Loading State */}
        {status === 'loading' && (
          <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 p-8 text-center">
            <Loader2 className="w-16 h-16 text-red-400 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-white mb-2">טוען...</h1>
            <p className="text-white/60">מאמת את ההזמנה שלך</p>
          </div>
        )}

        {/* Downloading State */}
        {status === 'downloading' && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-3xl border border-green-500/30 p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Download className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">מוריד... 🎧</h1>
            <p className="text-white/60 mb-4">האודיובוק שלך בדרך אליך!</p>
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-green-400 text-sm">✨ הקובץ מותאם אישית עבור {customerName}</p>
            </div>
          </div>
        )}

        {/* Exhausted State - Link Used Up */}
        {status === 'exhausted' && (
          <div className="bg-[#1a1a1a] rounded-3xl border border-amber-500/30 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-6 text-center border-b border-amber-500/20">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-white">הלינק נוצל 🔒</h1>
            </div>
            
            {/* Content */}
            <div className="p-6 text-center">
              <p className="text-white/70 mb-6 leading-relaxed">
                הלינק הזה כבר נוצל {MAX_DOWNLOADS} פעמים.
                <br />
                אם לא הצלחת להוריד את האודיובוק, צור קשר ונשמח לעזור!
              </p>
              
              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <p className="text-white/50 text-sm mb-1">מספר הזמנה</p>
                <p className="text-white font-mono">{orderId}</p>
              </div>

              <button
                onClick={openWhatsApp}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-lg shadow-green-500/30"
              >
                <MessageCircle className="w-6 h-6" />
                פתח וואטסאפ
              </button>
              
              <p className="text-white/40 text-sm mt-4">
                📱 052-265-3170
              </p>
            </div>

            {/* Footer */}
            <div className="bg-black/30 p-4 text-center border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                <span className="text-lg">🦎</span>
                <span>NO-ART GALLERY</span>
              </div>
            </div>
          </div>
        )}

        {/* Expired State */}
        {status === 'expired' && (
          <div className="bg-[#1a1a1a] rounded-3xl border border-red-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 p-6 text-center border-b border-red-500/20">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-white">פג תוקף ⏰</h1>
            </div>
            
            <div className="p-6 text-center">
              <p className="text-white/70 mb-6">
                הלינק הזה פג תוקף לאחר {EXPIRY_DAYS} יום.
                <br />
                צור קשר לקבלת לינק חדש.
              </p>
              
              <button
                onClick={openWhatsApp}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold"
              >
                <MessageCircle className="w-6 h-6" />
                פתח וואטסאפ
              </button>
            </div>

            <div className="bg-black/30 p-4 text-center border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                <span className="text-lg">🦎</span>
                <span>NO-ART GALLERY</span>
              </div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {status === 'not-found' && (
          <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 p-8 text-center">
            <Headphones className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">לא נמצא 🤔</h1>
            <p className="text-white/60 mb-6">
              הלינק הזה לא קיים או שהאודיובוק עדיין לא הועלה.
            </p>
            <button
              onClick={openWhatsApp}
              className="py-3 px-6 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl flex items-center justify-center gap-2 mx-auto"
            >
              <MessageCircle className="w-5 h-5" />
              צור קשר
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-[#1a1a1a] rounded-3xl border border-red-500/20 p-8 text-center">
            <XCircle className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">שגיאה 😕</h1>
            <p className="text-white/60 mb-6">
              משהו השתבש. נסה שוב או צור קשר.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
              <button
                onClick={openWhatsApp}
                className="py-3 px-6 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                וואטסאפ
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
