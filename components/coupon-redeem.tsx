'use client'

import { useState } from 'react'
import { Gift, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface CouponRedeemProps {
  userId: string
  userEmail: string
  onSuccess?: (type: 'pass' | 'weekly') => void
  onClose?: () => void
}

export default function CouponRedeem({ userId, userEmail, onSuccess, onClose }: CouponRedeemProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    type?: 'pass' | 'weekly'
  } | null>(null)
  const { t, isRTL } = useLanguage()

  const handleRedeem = async () => {
    if (!code.trim()) return
    
    setLoading(true)
    setResult(null)

    try {
      const { db } = await import('@/lib/firebase')
      const { doc, getDoc, updateDoc, serverTimestamp, increment } = await import('firebase/firestore')

      // Format code (uppercase, trim)
      const formattedCode = code.toUpperCase().trim()

      // Get coupon
      const couponRef = doc(db, 'coupons', formattedCode)
      const couponSnap = await getDoc(couponRef)

      if (!couponSnap.exists()) {
        setResult({ success: false, message: t('couponRedeem.invalidCode') })
        setLoading(false)
        return
      }

      const coupon = couponSnap.data()

      if (coupon.status !== 'available') {
        setResult({ success: false, message: t('couponRedeem.alreadyUsed') })
        setLoading(false)
        return
      }

      // Check if expired
      if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
        setResult({ success: false, message: t('couponRedeem.expired') })
        setLoading(false)
        return
      }

      // Mark coupon as used
      await updateDoc(couponRef, {
        status: 'used',
        usedBy: userId,
        usedByEmail: userEmail,
        usedAt: serverTimestamp()
      })

      // Grant benefit to user
      const userRef = doc(db, 'users', userId)

      if (coupon.type === 'pass') {
        // Add 1 pass
        await updateDoc(userRef, {
          passes: increment(1)
        })
        setResult({
          success: true,
          message: t('couponRedeem.successPass'),
          type: 'pass'
        })
      } else if (coupon.type === 'weekly') {
        // Grant 1 week premium
        const weekFromNow = new Date()
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        
        await updateDoc(userRef, {
          isPremium: true,
          premiumType: 'weekly',
          premiumExpiresAt: weekFromNow.toISOString(),
          premiumSource: 'coupon'
        })
        setResult({
          success: true,
          message: t('couponRedeem.successWeek'),
          type: 'weekly'
        })
      }

      // Callback
      if (onSuccess && coupon.type) {
        onSuccess(coupon.type as 'pass' | 'weekly')
      }

    } catch (error) {
      console.error('Error redeeming coupon:', error)
      setResult({ success: false, message: t('couponRedeem.failed') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md mx-auto" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">{t('couponRedeem.title')}</h2>
        <p className="text-gray-400 mt-1">{t('couponRedeem.subtitle')}</p>
      </div>

      {/* Input */}
      {!result?.success && (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('couponRedeem.placeholder')}
              className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 text-white text-center text-xl font-mono tracking-wider focus:outline-none focus:border-green-500 transition-colors"
              maxLength={12}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-green-500/30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('couponRedeem.redeeming')}
              </span>
            ) : (
              t('couponRedeem.redeem')
            )}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-xl ${
          result.success 
            ? 'bg-green-500/20 border border-green-500' 
            : 'bg-red-500/20 border border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            )}
            <div>
              <p className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? t('couponRedeem.success') : t('couponRedeem.error')}
              </p>
              <p className="text-white">{result.message}</p>
            </div>
          </div>
          
          {result.success && (
            <button
              onClick={onClose}
              className="w-full mt-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              {t('couponRedeem.continue')}
            </button>
          )}
          
          {!result.success && (
            <button
              onClick={() => { setResult(null); setCode('') }}
              className="w-full mt-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              {t('couponRedeem.tryAgain')}
            </button>
          )}
        </div>
      )}

      {/* Close button */}
      {onClose && !result?.success && (
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          {t('couponRedeem.cancel')}
        </button>
      )}
    </div>
  )
}
