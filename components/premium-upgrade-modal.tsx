"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, X, Check, Copy, Loader2, Phone, Ticket, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
  userEmail?: string
  isRTL: boolean
  language?: 'he' | 'en' | 'pt'
}

// 🌍 Localized pricing per country
const PRICING = {
  he: { // Israel - Shekels
    currency: '₪',
    currencyCode: 'ILS',
    paymentMethod: 'bit',
    paymentName: 'Bit',
    paymentPhone: '052-265-3170',
    plans: [
      { id: 'pass', icon: '⚡', price: 9, duration: 'חד פעמי', features: 'Match אחד עכשיו', durationMs: 0 },
      { id: 'weekly', icon: '🗓️', price: 19, duration: '7 ימים', features: 'שבוע של matches', durationMs: 7 * 24 * 60 * 60 * 1000 },
      { id: 'monthly', icon: '👑', price: 49, duration: '30 יום', features: 'חודש מלא + VIP', badge: '🔥 הכי משתלם', durationMs: 30 * 24 * 60 * 60 * 1000 }
    ]
  },
  en: { // USA - Dollars
    currency: '$',
    currencyCode: 'USD',
    paymentMethod: 'stripe',
    paymentName: 'Credit Card',
    paymentPhone: '',
    plans: [
      { id: 'pass', icon: '⚡', price: 2.90, duration: 'One-time', features: 'One match now', durationMs: 0 },
      { id: 'weekly', icon: '🗓️', price: 5.90, duration: '7 days', features: 'Week of matches', durationMs: 7 * 24 * 60 * 60 * 1000 },
      { id: 'monthly', icon: '👑', price: 14.90, duration: '30 days', features: 'Full month + VIP', badge: '🔥 Best Value', durationMs: 30 * 24 * 60 * 60 * 1000 }
    ]
  },
  pt: { // Brazil - Reais
    currency: 'R$',
    currencyCode: 'BRL',
    paymentMethod: 'pix',
    paymentName: 'PIX',
    paymentPhone: 'pix@i4iguana.com',
    plans: [
      { id: 'pass', icon: '⚡', price: 15, duration: 'Uma vez', features: 'Um match agora', durationMs: 0 },
      { id: 'weekly', icon: '🗓️', price: 30, duration: '7 dias', features: 'Semana de matches', durationMs: 7 * 24 * 60 * 60 * 1000 },
      { id: 'monthly', icon: '👑', price: 75, duration: '30 dias', features: 'Mês completo + VIP', badge: '🔥 Melhor valor', durationMs: 30 * 24 * 60 * 60 * 1000 }
    ]
  }
}

// 🌍 Localized text
const TEXTS = {
  he: {
    title: 'I4IGUANA Premium',
    subtitle: 'שדרג וקבל matches ללא הגבלה',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    choosePlan: 'בחר מסלול:',
    paymentTitle: 'תשלום מאובטח ב-',
    paymentSubtitle: 'העברה מיידית ומאובטחת',
    copyBtn: 'העתק',
    copied: 'הועתק!',
    paymentNote: 'שלח את הסכום עם שמך המלא בהערה',
    confirmCheckbox: 'אני מאשר/ת ששילמתי',
    submitBtn: 'שלחתי! הפעילו לי',
    submitting: 'שולח...',
    successTitle: 'תודה רבה! 🎉',
    successMsg: 'קיבלנו את הבקשה שלך. לאחר אישור התשלום, נשלח לך קופון תוך 24 שעות.\n\n📍 להפעלת הקופון: היכנס לפרופיל שלך ולחץ על "הפעל קופון"',
    close: 'סגור',
    confirmation: 'אישור תוך 24 שעות',
    // Coupon texts
    orDivider: 'או',
    haveCoupon: 'יש לך קופון?',
    couponPlaceholder: 'הכנס קוד קופון',
    activateCoupon: 'הפעל קופון',
    validatingCoupon: 'בודק...',
    couponSuccess: 'המנוי הופעל בהצלחה!',
    couponSuccessMsg: 'תהנה מחוויית Premium מלאה!',
    invalidCoupon: 'קופון לא תקף',
    couponUsed: 'קופון כבר נוצל',
    couponExpired: 'קופון פג תוקף',
    startMatching: 'התחל להתאים!'
  },
  en: {
    title: 'I4IGUANA Premium',
    subtitle: 'Upgrade for unlimited matches',
    firstName: 'First Name',
    lastName: 'Last Name',
    choosePlan: 'Choose a plan:',
    paymentTitle: 'Secure payment via ',
    paymentSubtitle: 'Instant & Secure Transfer',
    copyBtn: 'Copy',
    copied: 'Copied!',
    paymentNote: 'Send the amount with your full name in the note',
    confirmCheckbox: 'I confirm that I have paid',
    submitBtn: 'I paid! Activate me',
    submitting: 'Sending...',
    successTitle: 'Thank You! 🎉',
    successMsg: 'We received your request. After confirming your payment, we will send you an activation coupon within 24 hours.\n\n📍 To activate: Go to your Profile and tap "Activate Coupon"',
    close: 'Close',
    confirmation: 'Confirmation within 24 hours',
    // Coupon texts
    orDivider: 'or',
    haveCoupon: 'Have a coupon?',
    couponPlaceholder: 'Enter coupon code',
    activateCoupon: 'Activate Coupon',
    validatingCoupon: 'Validating...',
    couponSuccess: 'Premium Activated!',
    couponSuccessMsg: 'Enjoy the full Premium experience!',
    invalidCoupon: 'Invalid coupon',
    couponUsed: 'Coupon already used',
    couponExpired: 'Coupon expired',
    startMatching: 'Start Matching!'
  },
  pt: {
    title: 'I4IGUANA Premium',
    subtitle: 'Atualize para matches ilimitados',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    choosePlan: 'Escolha um plano:',
    paymentTitle: 'Pagamento seguro via ',
    paymentSubtitle: 'Transferência instantânea e segura',
    copyBtn: 'Copiar',
    copied: 'Copiado!',
    paymentNote: 'Envie o valor com seu nome completo na descrição',
    confirmCheckbox: 'Confirmo que paguei',
    submitBtn: 'Paguei! Ativar',
    submitting: 'Enviando...',
    successTitle: 'Obrigado! 🎉',
    successMsg: 'Recebemos seu pedido. Após confirmar o pagamento, enviaremos um cupom de ativação em 24 horas.\n\n📍 Para ativar: Vá ao seu Perfil e toque em "Ativar Cupom"',
    close: 'Fechar',
    confirmation: 'Confirmação em 24 horas',
    // Coupon texts
    orDivider: 'ou',
    haveCoupon: 'Tem um cupom?',
    couponPlaceholder: 'Digite o código do cupom',
    activateCoupon: 'Ativar Cupom',
    validatingCoupon: 'Validando...',
    couponSuccess: 'Premium Ativado!',
    couponSuccessMsg: 'Aproveite a experiência Premium completa!',
    invalidCoupon: 'Cupom inválido',
    couponUsed: 'Cupom já utilizado',
    couponExpired: 'Cupom expirado',
    startMatching: 'Começar a Combinar!'
  }
}

// Plan duration mapping
const PLAN_DURATIONS: Record<string, number> = {
  'pass': 0, // One-time unlock
  'weekly': 7 * 24 * 60 * 60 * 1000,
  'monthly': 30 * 24 * 60 * 60 * 1000
}

export default function PremiumUpgradeModal({ 
  isOpen, 
  onClose, 
  userId, 
  userEmail, 
  isRTL,
  language = 'he'
}: PremiumUpgradeModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmPayment, setConfirmPayment] = useState(false)
  
  // 🎟️ Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponActivated, setCouponActivated] = useState(false)
  const [couponError, setCouponError] = useState('')
  
  const { toast } = useToast()

  // Get localized content
  const pricing = PRICING[language] || PRICING.he
  const texts = TEXTS[language] || TEXTS.he
  const selectedPlanData = pricing.plans.find(p => p.id === selectedPlan)

  const handleCopyPayment = async () => {
    const textToCopy = pricing.paymentPhone || ''
    try {
      await navigator.clipboard.writeText(textToCopy.replace(/-/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: `📋 ${texts.copied}`,
        description: textToCopy
      })
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // 🎟️ Validate and redeem coupon
  const handleRedeemCoupon = async () => {
    if (!couponCode.trim() || !userId) {
      setCouponError(texts.invalidCoupon)
      return
    }

    setValidatingCoupon(true)
    setCouponError('')

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
          setCouponError(texts.invalidCoupon)
          setValidatingCoupon(false)
          console.warn('⚠️ Coupon userId mismatch:', { couponUserId: couponData.userId, currentUserId: userId })
          return
        }
      }

      // 2. Check coupons collection (generic coupons like WEEK-XXXXX)
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

      // Not found in any collection
      if (!couponDoc || !couponData) {
        setCouponError(texts.invalidCoupon)
        setValidatingCoupon(false)
        return
      }

      // Check if already used
      if (couponData.usedBy || couponData.status === 'used') {
        setCouponError(texts.couponUsed)
        setValidatingCoupon(false)
        return
      }

      // Get plan type from coupon
      const planType = couponData.selectedPlan || couponData.type || 'weekly'
      const normalizedPlan = planType.toLowerCase()
      const durationMs = PLAN_DURATIONS[normalizedPlan] || PLAN_DURATIONS[planType] || 7 * 24 * 60 * 60 * 1000
      const expiresAt = durationMs > 0 ? Date.now() + durationMs : null

      // ✅ v2.8.31 FIX: Get user's phone number from users collection
      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)
      const phoneNumber = userDocSnap.exists() ? userDocSnap.data().phoneNumber : null

      // ✅ Activate premium for user in USERS collection
      await updateDoc(userDocRef, {
        isPremium: true,
        premiumPlan: normalizedPlan,
        premiumActivatedAt: serverTimestamp(),
        premiumExpiresAt: expiresAt,
        premiumCoupon: code,
        premiumEmail: userEmail || couponData.userEmail || null,
        premiumRequestId: couponDoc.id,
        premiumCollection: couponCollection
      })

      // ✅ v2.8.31 CRITICAL FIX: Also update phoneIdentities collection!
      // getUserPassData reads from phoneIdentities, not users!
      if (phoneNumber) {
        console.log('✅ [v2.8.31] Also updating phoneIdentities for:', phoneNumber)
        await updateDoc(doc(db, 'phoneIdentities', phoneNumber), {
          isPremium: true,
          premiumExpiresAt: expiresAt ? Timestamp.fromMillis(expiresAt) : null,
          premiumSource: 'coupon',
          premiumCouponCode: code,
          passesLeft: 4, // Premium users get 4 passes
          lastCouponRedeemedAt: serverTimestamp()
        })
      } else {
        console.warn('⚠️ [v2.8.31] No phoneNumber found for user, only users collection updated')
      }

      // ✅ Mark coupon as used with full audit trail
      if (couponCollection === 'premium_requests') {
        await updateDoc(doc(db, 'premium_requests', couponDoc.id), {
          usedBy: userId,
          usedByEmail: userEmail || null,
          usedAt: serverTimestamp()
        })
      } else {
        // Generic coupons collection
        await updateDoc(doc(db, 'coupons', couponDoc.id), {
          status: 'used',
          usedBy: userId,
          usedByEmail: userEmail || null,
          usedAt: serverTimestamp()
        })
      }

      setCouponActivated(true)
      
      toast({
        title: '🎉 ' + texts.couponSuccess,
        description: texts.couponSuccessMsg
      })

    } catch (error) {
      console.error('Error redeeming coupon:', error)
      setCouponError(texts.invalidCoupon)
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !selectedPlan || !confirmPayment) {
      return
    }

    setSubmitting(true)

    try {
      await addDoc(collection(db, 'premium_requests'), {
        userId: userId || 'anonymous',
        userEmail: userEmail || 'unknown',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        selectedPlan,
        planPrice: selectedPlanData?.price || 0,
        currency: pricing.currencyCode,
        paymentMethod: pricing.paymentMethod,
        language,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'profile_upgrade_button'
      })

      setSubmitted(true)
      
      toast({
        title: language === 'he' ? '✅ הבקשה נשלחה!' : language === 'pt' ? '✅ Pedido enviado!' : '✅ Request Sent!',
        description: language === 'he' ? 'ניצור איתך קשר בקרוב' : language === 'pt' ? 'Entraremos em contato em breve' : 'We will contact you soon'
      })

    } catch (error) {
      console.error('Error submitting premium request:', error)
      toast({
        title: '❌ Error',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetAndClose = () => {
    setFirstName('')
    setLastName('')
    setSelectedPlan(null)
    setSubmitted(false)
    setConfirmPayment(false)
    setCouponCode('')
    setCouponError('')
    setCouponActivated(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={resetAndClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-5 max-w-md w-full border-2 border-amber-500/30 shadow-2xl max-h-[90vh] overflow-y-auto relative"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 🎉 Coupon Activated Success */}
        {couponActivated ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-2">
              {texts.couponSuccess}
            </h2>
            <p className="text-white/70 mb-6 text-sm">
              {texts.couponSuccessMsg}
            </p>
            <Button
              onClick={resetAndClose}
              className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold rounded-xl px-8"
            >
              {texts.startMatching} 🦎
            </Button>
          </motion.div>
        ) : submitted ? (
          // ✅ Payment Request Submitted
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-7xl mb-4">📨</div>
            <h2 className="text-2xl font-bold text-amber-400 mb-2">
              {texts.successTitle}
            </h2>
            <p className="text-white/70 mb-6 text-sm">
              {texts.successMsg}
            </p>
            <Button
              onClick={resetAndClose}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-[#0d2920] font-bold rounded-xl px-8"
            >
              {texts.close}
            </Button>
          </motion.div>
        ) : (
          // 📝 Form State
          <>
            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-2xl">🦎</span>
              </div>
              <h2 className="text-xl font-bold text-amber-400 mb-1">
                {texts.title}
              </h2>
              <p className="text-white/60 text-sm">
                {texts.subtitle}
              </p>
            </div>

            {/* 🔐 Email Display - Read Only (from Google Auth) */}
            {userEmail && (
              <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">📧</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-xs">{language === 'he' ? 'חשבון מקושר' : language === 'pt' ? 'Conta vinculada' : 'Linked Account'}</p>
                  <p className="text-white text-sm font-medium truncate">{userEmail}</p>
                </div>
                <div className="text-green-400 text-xs flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {language === 'he' ? 'מאומת' : language === 'pt' ? 'Verificado' : 'Verified'}
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-white/80 text-xs mb-1 block font-medium">
                  {texts.firstName}
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-white/80 text-xs mb-1 block font-medium">
                  {texts.lastName}
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Plans */}
            <div className="mb-4">
              <label className="text-white/80 text-xs mb-2 block font-medium">
                {texts.choosePlan}
              </label>
              <div className="space-y-2">
                {pricing.plans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-300 ${
                      selectedPlan === plan.id
                        ? 'border-amber-400 bg-amber-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{plan.icon}</span>
                        <div className={`text-${isRTL ? 'right' : 'left'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">
                              {plan.duration}
                            </span>
                            {plan.badge && (
                              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-white/50 text-xs">
                            {plan.features}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 font-bold text-lg">
                          {pricing.currency}{plan.price}
                        </span>
                        {selectedPlan === plan.id && (
                          <Check className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Payment Section - Only for manual payments */}
            {(pricing.paymentMethod === 'bit' || pricing.paymentMethod === 'pix') && (
              <div className={`bg-gradient-to-br ${
                pricing.paymentMethod === 'bit' 
                  ? 'from-[#00D4AA]/20 to-[#00B894]/10 border-[#00D4AA]/40' 
                  : 'from-[#32BCAD]/20 to-[#00A693]/10 border-[#32BCAD]/40'
              } border-2 rounded-xl p-4 mb-4 relative overflow-hidden`}>
                
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-10 h-10 ${
                    pricing.paymentMethod === 'bit'
                      ? 'bg-gradient-to-br from-[#00D4AA] to-[#00B894]'
                      : 'bg-gradient-to-br from-[#32BCAD] to-[#00A693]'
                  } rounded-lg flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-sm">
                      {pricing.paymentMethod === 'bit' ? 'bit' : 'PIX'}
                    </span>
                  </div>
                  <div>
                    <p className={`${
                      pricing.paymentMethod === 'bit' ? 'text-[#00D4AA]' : 'text-[#32BCAD]'
                    } font-bold text-sm`}>
                      {texts.paymentTitle}{pricing.paymentName}
                    </p>
                    <p className={`${
                      pricing.paymentMethod === 'bit' ? 'text-[#00D4AA]/60' : 'text-[#32BCAD]/60'
                    } text-xs`}>
                      {texts.paymentSubtitle}
                    </p>
                  </div>
                </div>
                
                {/* Phone/PIX Display */}
                <div className={`flex items-center justify-between bg-black/40 backdrop-blur rounded-lg p-3 border ${
                  pricing.paymentMethod === 'bit' ? 'border-[#00D4AA]/20' : 'border-[#32BCAD]/20'
                }`}>
                  <div className="flex items-center gap-2">
                    <Phone className={`h-4 w-4 ${
                      pricing.paymentMethod === 'bit' ? 'text-[#00D4AA]' : 'text-[#32BCAD]'
                    }`} />
                    <span className="text-white font-mono text-base font-bold whitespace-nowrap">
                      {pricing.paymentPhone}
                    </span>
                  </div>
                  <Button
                    onClick={handleCopyPayment}
                    variant="outline"
                    size="sm"
                    className={`${
                      pricing.paymentMethod === 'bit'
                        ? 'border-[#00D4AA]/50 text-[#00D4AA] hover:bg-[#00D4AA]/20'
                        : 'border-[#32BCAD]/50 text-[#32BCAD] hover:bg-[#32BCAD]/20'
                    } px-2 h-8`}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span className="mr-1 text-xs">{copied ? texts.copied : texts.copyBtn}</span>
                  </Button>
                </div>
                
                <p className="text-white/50 text-xs mt-2 flex items-center gap-1">
                  <span>💡</span>
                  {texts.paymentNote}
                </p>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <div className="mb-4">
              <label 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setConfirmPayment(!confirmPayment)}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  confirmPayment 
                    ? 'bg-amber-500 border-amber-500' 
                    : 'border-white/30 group-hover:border-amber-400/50'
                }`}>
                  {confirmPayment && <Check className="h-4 w-4 text-[#0d2920]" />}
                </div>
                <span className={`text-sm ${confirmPayment ? 'text-amber-400' : 'text-white/70'}`}>
                  {texts.confirmCheckbox}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || !firstName.trim() || !lastName.trim() || !selectedPlan || !confirmPayment}
              className={`w-full h-12 text-base font-bold rounded-xl shadow-lg transition-all duration-300 ${
                confirmPayment && firstName.trim() && lastName.trim() && selectedPlan
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-[#0d2920]'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {texts.submitting}
                </>
              ) : (
                <>
                  {texts.submitBtn} 🦎
                </>
              )}
            </Button>

            <p className="text-white/40 text-xs text-center mt-3">
              📱 {texts.confirmation}
            </p>

            {/* ━━━━━━━━ OR DIVIDER ━━━━━━━━ */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="text-white/40 text-sm font-medium">{texts.orDivider}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* 🎟️ Coupon Section */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-2 border-purple-500/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Ticket className="h-5 w-5 text-white" />
                </div>
                <p className="text-purple-300 font-bold text-sm">
                  {texts.haveCoupon}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    setCouponError('')
                  }}
                  placeholder={texts.couponPlaceholder}
                  className="bg-black/40 border-purple-500/30 text-white placeholder:text-white/40 h-10 rounded-lg text-sm font-mono uppercase"
                />
                <Button
                  onClick={handleRedeemCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg px-4 h-10 whitespace-nowrap"
                >
                  {validatingCoupon ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      {texts.activateCoupon}
                    </>
                  )}
                </Button>
              </div>
              
              {couponError && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {couponError}
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
