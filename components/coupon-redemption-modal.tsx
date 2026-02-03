"use client"

/**
 * 🎫 I4IGUANA - Coupon Redemption Modal
 * Hollywood Edition - Golden Shining Experience
 * 
 * מסך הפעלת קופון מנצנץ וזהוב!
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, X, Loader2, Sparkles, Crown, Calendar, Zap, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'

interface CouponRedemptionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userEmail?: string
  language?: 'he' | 'en' | 'pt'
  onSuccess?: () => void
}

// Plan details for success screen
const PLAN_DETAILS = {
  pass: {
    he: { name: 'Match אחד', icon: '⚡', duration: 'חד פעמי', benefit: 'Match אחד עכשיו!' },
    en: { name: 'One Match', icon: '⚡', duration: 'One-time', benefit: 'One match now!' },
    pt: { name: 'Um Match', icon: '⚡', duration: 'Uma vez', benefit: 'Um match agora!' }
  },
  weekly: {
    he: { name: '7 ימים', icon: '🗓️', duration: 'שבוע', benefit: 'Matches ללא הגבלה לשבוע!' },
    en: { name: '7 Days', icon: '🗓️', duration: 'Week', benefit: 'Unlimited matches for a week!' },
    pt: { name: '7 Dias', icon: '🗓️', duration: 'Semana', benefit: 'Matches ilimitados por uma semana!' }
  },
  monthly: {
    he: { name: '30 יום', icon: '👑', duration: 'חודש', benefit: 'חודש מלא של VIP!' },
    en: { name: '30 Days', icon: '👑', duration: 'Month', benefit: 'Full month of VIP!' },
    pt: { name: '30 Dias', icon: '👑', duration: 'Mês', benefit: 'Mês completo de VIP!' }
  }
}

const TEXTS = {
  he: {
    title: 'הפעל קופון Premium',
    subtitle: 'הזן את הקוד שקיבלת',
    placeholder: 'הכנס קוד קופון',
    activate: 'הפעל קופון',
    activating: 'מפעיל...',
    successTitle: 'ברוך הבא ל-VIP!',
    planLabel: 'מנוי',
    validUntil: 'תוקף עד',
    benefits: 'הטבות',
    startMatching: 'התחל להתאים!',
    errors: {
      empty: 'נא להזין קוד קופון',
      invalid: 'קופון לא תקף',
      used: 'קופון כבר נוצל',
      expired: 'קופון פג תוקף',
      notYours: 'קופון לא שייך לחשבון זה'
    }
  },
  en: {
    title: 'Activate Premium Coupon',
    subtitle: 'Enter your coupon code',
    placeholder: 'Enter coupon code',
    activate: 'Activate Coupon',
    activating: 'Activating...',
    successTitle: 'Welcome to VIP!',
    planLabel: 'Plan',
    validUntil: 'Valid until',
    benefits: 'Benefits',
    startMatching: 'Start Matching!',
    errors: {
      empty: 'Please enter a coupon code',
      invalid: 'Invalid coupon',
      used: 'Coupon already used',
      expired: 'Coupon expired',
      notYours: 'Coupon not linked to this account'
    }
  },
  pt: {
    title: 'Ativar Cupom Premium',
    subtitle: 'Digite seu código de cupom',
    placeholder: 'Digite o código do cupom',
    activate: 'Ativar Cupom',
    activating: 'Ativando...',
    successTitle: 'Bem-vindo ao VIP!',
    planLabel: 'Plano',
    validUntil: 'Válido até',
    benefits: 'Benefícios',
    startMatching: 'Começar a Combinar!',
    errors: {
      empty: 'Por favor, insira um código de cupom',
      invalid: 'Cupom inválido',
      used: 'Cupom já utilizado',
      expired: 'Cupom expirado',
      notYours: 'Cupom não vinculado a esta conta'
    }
  }
}

// Duration mapping
const PLAN_DURATIONS: Record<string, number> = {
  'pass': 0,
  'PASS': 0,
  'weekly': 7 * 24 * 60 * 60 * 1000,
  'WEEKLY': 7 * 24 * 60 * 60 * 1000,
  'monthly': 30 * 24 * 60 * 60 * 1000,
  'MONTHLY': 30 * 24 * 60 * 60 * 1000
}

export default function CouponRedemptionModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  language = 'he',
  onSuccess
}: CouponRedemptionModalProps) {
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activatedPlan, setActivatedPlan] = useState<string>('weekly')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  const texts = TEXTS[language] || TEXTS.he
  const isRTL = language === 'he'

  const handleActivate = async () => {
    if (!couponCode.trim()) {
      setError(texts.errors.empty)
      return
    }

    setLoading(true)
    setError('')

    try {
      const code = couponCode.trim().toUpperCase()
      let couponDoc: any = null
      let couponData: any = null
      let couponCollection = ''

      // 🔍 Search in BOTH collections

      // 1. Check premium_requests (personal coupons)
      const premiumQuery = query(
        collection(db, 'premium_requests'),
        where('couponCode', '==', code),
        where('status', '==', 'approved')
      )
      const premiumSnapshot = await getDocs(premiumQuery)

      if (!premiumSnapshot.empty) {
        couponDoc = premiumSnapshot.docs[0]
        couponData = couponDoc.data()
        couponCollection = 'premium_requests'

        // 🔐 Security: Check if belongs to this user
        if (couponData.userId && couponData.userId !== userId) {
          setError(texts.errors.notYours)
          setLoading(false)
          return
        }
      }

      // 2. Check coupons collection (generic coupons)
      if (!couponDoc) {
        const couponsQuery = query(
          collection(db, 'coupons'),
          where('code', '==', code),
          where('status', '==', 'available')
        )
        const couponsSnapshot = await getDocs(couponsQuery)

        if (!couponsSnapshot.empty) {
          couponDoc = couponsSnapshot.docs[0]
          couponData = couponDoc.data()
          couponCollection = 'coupons'
        }
      }

      // Not found
      if (!couponDoc || !couponData) {
        setError(texts.errors.invalid)
        setLoading(false)
        return
      }

      // Check if already used
      if (couponData.usedBy || couponData.status === 'used') {
        setError(texts.errors.used)
        setLoading(false)
        return
      }

      // Get plan type
      const planType = couponData.selectedPlan || couponData.type || 'weekly'
      const normalizedPlan = planType.toLowerCase()
      const durationMs = PLAN_DURATIONS[planType] || PLAN_DURATIONS[normalizedPlan] || 7 * 24 * 60 * 60 * 1000
      const expDate = durationMs > 0 ? new Date(Date.now() + durationMs) : null

      // ✅ Activate premium for user
      await updateDoc(doc(db, 'users', userId), {
        isPremium: true,
        premiumPlan: normalizedPlan,
        premiumActivatedAt: serverTimestamp(),
        premiumExpiresAt: expDate ? expDate.getTime() : null,
        premiumCoupon: code,
        premiumEmail: userEmail || null,
        premiumCollection: couponCollection,
        premiumCouponId: couponDoc.id
      })

      // ✅ Mark coupon as used
      if (couponCollection === 'premium_requests') {
        await updateDoc(doc(db, 'premium_requests', couponDoc.id), {
          usedBy: userId,
          usedByEmail: userEmail || null,
          usedAt: serverTimestamp()
        })
      } else {
        await updateDoc(doc(db, 'coupons', couponDoc.id), {
          status: 'used',
          usedBy: userId,
          usedByEmail: userEmail || null,
          usedAt: serverTimestamp()
        })
      }

      // Success!
      setActivatedPlan(normalizedPlan)
      setExpiresAt(expDate)
      setSuccess(true)

    } catch (err) {
      console.error('Error activating coupon:', err)
      setError(texts.errors.invalid)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCouponCode('')
    setError('')
    setSuccess(false)
    onClose()
    if (success && onSuccess) {
      onSuccess()
    }
  }

  const planDetails = PLAN_DETAILS[activatedPlan as keyof typeof PLAN_DETAILS]?.[language] || PLAN_DETAILS.weekly[language]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-sm relative"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* ✨ Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 rounded-3xl blur-xl animate-pulse" />
          
          {/* Main card */}
          <div className="relative bg-gradient-to-br from-[#1a4d3e] via-[#0d2920] to-[#1a4d3e] rounded-3xl border-2 border-amber-500/50 overflow-hidden">
            {/* ✨ Top sparkle decoration */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {success ? (
                  // 🎉 SUCCESS SCREEN
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-4"
                  >
                    {/* Animated crown */}
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="relative inline-block mb-4"
                    >
                      <div className="text-7xl">👑</div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        {[...Array(6)].map((_, i) => (
                          <Star
                            key={i}
                            className="absolute w-4 h-4 text-amber-400"
                            style={{
                              transform: `rotate(${i * 60}deg) translateY(-45px)`
                            }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold text-amber-400 mb-6"
                    >
                      {texts.successTitle}
                    </motion.h2>

                    {/* Plan details card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-2xl p-4 mb-6"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">{texts.planLabel}</span>
                          <span className="text-amber-400 font-bold flex items-center gap-2">
                            <span>{planDetails.icon}</span>
                            {planDetails.name}
                          </span>
                        </div>
                        
                        {expiresAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">{texts.validUntil}</span>
                            <span className="text-white font-medium flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-amber-400" />
                              {expiresAt.toLocaleDateString(language === 'he' ? 'he-IL' : language === 'pt' ? 'pt-BR' : 'en-US')}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">{texts.benefits}</span>
                          <span className="text-green-400 font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            {planDetails.benefit}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={handleClose}
                        className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-[#0d2920] font-bold text-lg rounded-xl shadow-lg shadow-amber-500/30"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {texts.startMatching}
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  // 🎫 INPUT SCREEN
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Header */}
                    <div className="text-center mb-6">
                      <motion.div
                        animate={{ 
                          rotate: [0, -5, 5, -5, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        className="inline-block mb-3"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                          <Ticket className="w-8 h-8 text-[#0d2920]" />
                        </div>
                      </motion.div>
                      <h2 className="text-xl font-bold text-amber-400 mb-1">
                        {texts.title}
                      </h2>
                      <p className="text-white/60 text-sm">
                        {texts.subtitle}
                      </p>
                    </div>

                    {/* Coupon input */}
                    <div className="mb-4">
                      <div className="relative">
                        <Input
                          value={couponCode}
                          onChange={e => {
                            setCouponCode(e.target.value.toUpperCase())
                            setError('')
                          }}
                          placeholder={texts.placeholder}
                          className="h-14 bg-white/10 border-2 border-amber-500/30 focus:border-amber-500 text-white text-center text-xl font-mono tracking-widest placeholder:text-white/30 rounded-xl"
                          onKeyDown={e => e.key === 'Enter' && handleActivate()}
                        />
                        {/* Sparkle decorations */}
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/50" />
                        <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/50" />
                      </div>
                      
                      {/* Error message */}
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm mt-2 text-center flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Activate button */}
                    <Button
                      onClick={handleActivate}
                      disabled={loading || !couponCode.trim()}
                      className={`w-full h-12 font-bold text-lg rounded-xl transition-all duration-300 ${
                        couponCode.trim()
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-[#0d2920] shadow-lg shadow-amber-500/30'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          {texts.activating}
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5 mr-2" />
                          {texts.activate}
                        </>
                      )}
                    </Button>

                    {/* Bottom decoration */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                      <span className="text-amber-500/50 text-2xl">🦎</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ✨ Bottom sparkle decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
