"use client"

/**
 * 🦎 I4IGUANA - Premium Paywall Modal v2.8.30
 * 
 * HOLLYWOOD EDITION! 🎬
 * - Stunning gradient backgrounds
 * - Animated hearts
 * - Glowing buttons
 * - Smooth animations
 * - Better UX messaging
 * - ✅ v2.8.30: Firebase tracking for plan clicks!
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Crown, Zap, Lock, Heart, MessageCircle, User as UserIcon, Sparkles, Star } from "lucide-react"
import { PREMIUM_PRICING } from "@/lib/constants"
import { GA } from "@/lib/ga-events"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// ✅ v2.8.30: Track plan click to Firebase for admin dashboard
const trackPlanClick = async (plan: 'pass' | 'weekly' | 'monthly', source: string = 'paywall') => {
  try {
    await addDoc(collection(db, 'paymentEvents'), {
      type: 'plan_viewed',
      plan,
      source,
      timestamp: Timestamp.now(),
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD for easy grouping
    })
    console.log(`📊 Tracked plan click: ${plan}`)
  } catch (error) {
    console.error('Error tracking plan click:', error)
  }
}

// ✅ v2.8.30: Track purchase attempt
const trackPurchaseAttempt = async (plan: 'pass' | 'weekly' | 'monthly', success: boolean) => {
  try {
    await addDoc(collection(db, 'paymentEvents'), {
      type: success ? 'purchase_success' : 'purchase_attempt',
      plan,
      success,
      timestamp: Timestamp.now(),
      date: new Date().toISOString().split('T')[0]
    })
    console.log(`📊 Tracked purchase ${success ? 'success' : 'attempt'}: ${plan}`)
  } catch (error) {
    console.error('Error tracking purchase:', error)
  }
}

interface MatchedUserData {
  displayName: string
  photoURL?: string
  photos?: string[]
  bio?: string
  age?: number
  city?: string
  hobbies?: string[]
}

interface PremiumPaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlan: (plan: 'pass' | 'weekly' | 'monthly') => void
  matchedUser?: MatchedUserData
  lang?: 'he' | 'en'
  resetTime?: Date | null  // ✅ v2.8.20: When free matches reset
  matchesUsed?: number     // ✅ v2.8.20: How many matches used
  matchesLimit?: number    // ✅ v2.8.20: Total free matches allowed
}

export default function PremiumPaywallModal({ 
  isOpen, 
  onClose, 
  onSelectPlan, 
  matchedUser,
  lang = 'en',
  resetTime,
  matchesUsed = 4,
  matchesLimit = 4
}: PremiumPaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pass' | 'weekly' | 'monthly'>('weekly')
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  // ✅ v2.8.30: Track paywall open
  useEffect(() => {
    if (isOpen) {
      GA.premiumViewed('paywall_opened')
      trackPlanClick('weekly', 'paywall_default') // Default selection
    }
  }, [isOpen])

  // ✅ v2.8.30: Timer countdown
  useEffect(() => {
    if (!resetTime) return
    
    const updateTimer = () => {
      const now = new Date()
      const diff = resetTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('Ready!')
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [resetTime])

  // Floating hearts animation
  const [hearts] = useState(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
      size: 10 + Math.random() * 14,
    }))
  )

  const texts = {
    en: {
      // ✅ v2.8.20: New texts for "before swipe" paywall
      title: "🔥 You're on Fire!",
      subtitle: `You've enjoyed ${matchesUsed} amazing matches`,
      timerLabel: "Free matches reset in:",
      orUpgrade: "Or upgrade now to keep swiping!",
      unlock: "Unlock unlimited matches",
      name: matchedUser?.displayName || "Mystery Match",
      bio: matchedUser?.bio || "Waiting to meet you...",
      age: matchedUser?.age ? `${matchedUser.age} years old` : "",
      city: matchedUser?.city || "",
      unlockMatch: "🚀 Continue Matching",
      onePass: "One Match",
      passDesc: "Unlock just one more match",
      weekly: "Weekly",
      weeklyDesc: "Unlimited matches for 7 days",
      monthly: "Monthly",
      monthlyDesc: "Unlimited matches for 30 days",
      bestValue: "BEST VALUE",
      popular: "POPULAR",
      securePayment: "🔒 Secure payment via Stripe • Cancel anytime",
      waitMessage: "Or wait for free reset:",
    },
    he: {
      title: "🔥 אתה על גל!",
      subtitle: `נהנית מ-${matchesUsed} התאמות מדהימות`,
      timerLabel: "התאמות חינם מתאפסות בעוד:",
      orUpgrade: "או שדרג עכשיו כדי להמשיך!",
      unlock: "שחרר התאמות ללא הגבלה",
      name: matchedUser?.displayName || "התאמה מסתורית",
      bio: matchedUser?.bio || "מחכה לפגוש אותך...",
      age: matchedUser?.age ? `בת ${matchedUser.age}` : "",
      city: matchedUser?.city || "",
      unlockMatch: "🚀 המשך להתאים",
      onePass: "התאמה אחת",
      passDesc: "שחרר רק עוד התאמה אחת",
      weekly: "שבועי",
      weeklyDesc: "התאמות ללא הגבלה ל-7 ימים",
      monthly: "חודשי",
      monthlyDesc: "התאמות ללא הגבלה ל-30 יום",
      bestValue: "הכי משתלם",
      popular: "פופולרי",
      securePayment: "🔒 תשלום מאובטח דרך Stripe • ביטול בכל עת",
      waitMessage: "או חכה לאיפוס חינם:",
    }
  }

  const t = texts[lang]
  const isRTL = lang === 'he'

  // ✅ v2.8.30: Track plan selection with GA and Firebase
  const handlePlanSelect = (plan: 'pass' | 'weekly' | 'monthly') => {
    setSelectedPlan(plan)
    trackPlanClick(plan, 'paywall')
    GA.premiumViewed(`plan_selected_${plan}`)
  }

  const handlePurchase = async () => {
    setLoading(true)
    setShowConfetti(true)
    
    // ✅ v2.8.30: Track purchase attempt
    trackPurchaseAttempt(selectedPlan, false) // Will update to true on success
    GA.checkoutStarted(selectedPlan, 0, 'ILS')
    
    try {
      await onSelectPlan(selectedPlan)
      // ✅ v2.8.30: Track successful purchase
      trackPurchaseAttempt(selectedPlan, true)
    } catch (error) {
      console.error('Error purchasing:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPhotoUrl = () => {
    if (matchedUser?.photos && matchedUser.photos.length > 0) {
      return matchedUser.photos[0]
    }
    return matchedUser?.photoURL || ''
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{
              background: 'linear-gradient(180deg, rgba(13,41,32,0.98) 0%, rgba(5,20,16,0.99) 100%)'
            }}
          >
            {/* Floating Hearts Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {hearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  className="absolute text-pink-500/30"
                  initial={{ 
                    x: `${heart.x}%`, 
                    y: '110%',
                    scale: 0
                  }}
                  animate={{ 
                    y: '-10%',
                    scale: [0, 1, 1, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: heart.duration,
                    delay: heart.delay,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ fontSize: heart.size }}
                >
                  💕
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Modal Content - FULLSCREEN with safe areas */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{
              paddingTop: 'env(safe-area-inset-top, 20px)',
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
              paddingLeft: 'env(safe-area-inset-left, 16px)',
              paddingRight: 'env(safe-area-inset-right, 16px)',
            }}
          >
            <div 
              className="relative flex-1 flex flex-col max-w-md w-full mx-auto my-auto"
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-[#4ade80] to-pink-500 rounded-3xl opacity-50 blur-lg animate-pulse" />
              
              {/* Main Card - Scrollable */}
              <div className="relative bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] rounded-3xl shadow-2xl border border-[#4ade80]/30 overflow-hidden flex flex-col max-h-full">
                
                {/* Close Button - ✅ v2.8.25: Larger, more visible */}
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔒 [iOS] Paywall close button touched')
                    onClose()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    console.log('🔒 [Desktop] Paywall close button clicked')
                    onClose()
                  }}
                  className="absolute top-3 right-3 text-white hover:text-white transition-colors z-20 bg-black/40 backdrop-blur-sm rounded-full p-2.5 hover:bg-black/60 border border-white/20"
                  style={{ 
                    touchAction: 'manipulation', 
                    WebkitTapHighlightColor: 'transparent',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
                >
                  <X size={22} strokeWidth={2.5} />
                </button>

                {/* ✅ v2.8.20: New Header with Timer - Hollywood Style! */}
                <div className="relative p-6 pb-4 text-center">
                  {/* Animated Title */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl font-black mb-1">
                      <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        {t.title}
                      </span>
                    </h2>
                    <p className="text-[#4ade80] text-sm mb-4">{t.subtitle}</p>
                  </motion.div>

                  {/* Match Counter - Big & Bold */}
                  <motion.div 
                    className="relative mx-auto mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    {/* Glowing Circle with Count */}
                    <div className="relative w-32 h-32 mx-auto">
                      {/* Animated rings */}
                      <div className="absolute inset-0 rounded-full border-4 border-pink-500/30 animate-ping" />
                      <div className="absolute -inset-2 rounded-full border-2 border-[#4ade80]/20 animate-pulse" />
                      
                      {/* Main circle */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 via-[#4ade80]/20 to-orange-500/20 border-4 border-[#4ade80]/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl font-black text-white">{matchesUsed}</div>
                          <div className="text-xs text-white/60">of {matchesLimit}</div>
                        </div>
                      </div>
                      
                      {/* Fire emojis */}
                      <motion.div 
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl"
                        animate={{ y: [-2, 2, -2], rotate: [-5, 5, -5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🔥
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Timer Section - Flashing! */}
                  {resetTime && timeLeft && (
                    <motion.div 
                      className="bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-orange-500/20 rounded-xl p-4 border border-orange-500/30 mb-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-white/60 text-xs mb-1">{t.waitMessage}</p>
                      
                      {/* Big Flashing Timer */}
                      <motion.div 
                        className="text-3xl font-black text-orange-400"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          textShadow: [
                            '0 0 10px rgba(251,146,60,0.5)',
                            '0 0 20px rgba(251,146,60,0.8)',
                            '0 0 10px rgba(251,146,60,0.5)'
                          ]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ⏱️ {timeLeft}
                      </motion.div>
                      
                      {/* Progress bar */}
                      <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                          initial={{ width: '100%' }}
                          animate={{ width: '0%' }}
                          transition={{ duration: 3600, ease: 'linear' }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Or Upgrade Message */}
                  <p className="text-white/50 text-sm mb-2">{t.orUpgrade}</p>
                </div>

                {/* Pricing Plans */}
                <div className="px-4 pb-4 space-y-2">
                  
                  {/* Pass - One Time - ✅ v2.8.20: iOS compatible! */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onTouchStart={() => handlePlanSelect('pass')}
                    onClick={() => handlePlanSelect('pass')}
                    className={`
                      rounded-xl p-3 cursor-pointer transition-all relative overflow-hidden
                      ${selectedPlan === 'pass' 
                        ? 'bg-gradient-to-r from-pink-500/20 to-[#4ade80]/20 border-2 border-[#4ade80] shadow-[0_0_25px_rgba(74,222,128,0.3)]' 
                        : 'bg-[#0d2920]/50 border-2 border-white/10 hover:border-[#4ade80]/40'}
                    `}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedPlan === 'pass' ? 'bg-[#4ade80]/20' : 'bg-white/5'}`}>
                          <Heart className={`h-5 w-5 ${selectedPlan === 'pass' ? 'text-[#4ade80]' : 'text-white/50'}`} />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{t.onePass}</h3>
                          <p className="text-white/50 text-xs">{t.passDesc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#4ade80]">
                          {PREMIUM_PRICING.SKIP_TIMER.displayPrice}
                        </div>
                      </div>
                    </div>
                    {selectedPlan === 'pass' && (
                      <motion.div 
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <div className="bg-[#4ade80] rounded-full p-1">
                          <Check size={14} className="text-[#0d2920]" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Weekly - Popular - ✅ v2.8.20: iOS compatible! */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onTouchStart={() => handlePlanSelect('weekly')}
                    onClick={() => handlePlanSelect('weekly')}
                    className={`
                      rounded-xl p-3 cursor-pointer transition-all relative overflow-hidden
                      ${selectedPlan === 'weekly' 
                        ? 'bg-gradient-to-r from-pink-500/20 to-[#4ade80]/20 border-2 border-[#4ade80] shadow-[0_0_25px_rgba(74,222,128,0.3)]' 
                        : 'bg-[#0d2920]/50 border-2 border-white/10 hover:border-[#4ade80]/40'}
                    `}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {/* Popular Badge */}
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-3 py-0.5 rounded-full shadow-lg">
                      ⚡ {t.popular}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedPlan === 'weekly' ? 'bg-[#4ade80]/20' : 'bg-white/5'}`}>
                          <Zap className={`h-5 w-5 ${selectedPlan === 'weekly' ? 'text-[#4ade80]' : 'text-white/50'}`} />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{t.weekly}</h3>
                          <p className="text-white/50 text-xs">{t.weeklyDesc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#4ade80]">
                          {PREMIUM_PRICING.WEEKLY.displayPrice}
                          <span className="text-xs text-white/50 font-normal">/week</span>
                        </div>
                      </div>
                    </div>
                    {selectedPlan === 'weekly' && (
                      <motion.div 
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <div className="bg-[#4ade80] rounded-full p-1">
                          <Check size={14} className="text-[#0d2920]" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Monthly - Best Value - ✅ v2.8.20: iOS compatible! */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onTouchStart={() => handlePlanSelect('monthly')}
                    onClick={() => handlePlanSelect('monthly')}
                    className={`
                      rounded-xl p-3 cursor-pointer transition-all relative overflow-hidden
                      ${selectedPlan === 'monthly' 
                        ? 'bg-gradient-to-r from-pink-500/20 to-[#4ade80]/20 border-2 border-[#4ade80] shadow-[0_0_25px_rgba(74,222,128,0.3)]' 
                        : 'bg-[#0d2920]/50 border-2 border-white/10 hover:border-[#4ade80]/40'}
                    `}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {/* Best Value Badge */}
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] text-[10px] font-black px-3 py-0.5 rounded-full shadow-lg">
                      💎 {t.bestValue}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedPlan === 'monthly' ? 'bg-[#4ade80]/20' : 'bg-white/5'}`}>
                          <Crown className={`h-5 w-5 ${selectedPlan === 'monthly' ? 'text-[#4ade80]' : 'text-white/50'}`} />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{t.monthly}</h3>
                          <p className="text-white/50 text-xs">{t.monthlyDesc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#4ade80]">
                          {PREMIUM_PRICING.MONTHLY.displayPrice}
                          <span className="text-xs text-white/50 font-normal">/month</span>
                        </div>
                      </div>
                    </div>
                    {selectedPlan === 'monthly' && (
                      <motion.div 
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <div className="bg-[#4ade80] rounded-full p-1">
                          <Check size={14} className="text-[#0d2920]" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* CTA Button - ✅ v2.8.20: iOS compatible! */}
                  <button
                    type="button"
                    onTouchStart={(e) => {
                      if (loading) return
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🔒 [iOS] Unlock Match button touched')
                      handlePurchase()
                    }}
                    onClick={(e) => {
                      if (loading) return
                      e.preventDefault()
                      console.log('🔒 [Desktop] Unlock Match button clicked')
                      handlePurchase()
                    }}
                    disabled={loading}
                    className="w-full mt-4 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-pink-500 via-[#4ade80] to-pink-500 text-white shadow-lg shadow-[#4ade80]/30 hover:shadow-[#4ade80]/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                    style={{ 
                      backgroundSize: '200% 100%',
                      touchAction: 'manipulation', 
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '56px'
                    }}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        {t.unlockMatch}
                      </>
                    )}
                  </button>

                  {/* Security Note */}
                  <p className="text-center text-white/40 text-xs mt-3 pb-6">
                    {t.securePayment}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
