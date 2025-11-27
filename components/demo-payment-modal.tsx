"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle, X, AlertCircle } from 'lucide-react'
import { processPremiumUpgrade, purchaseOnePass, getPaymentMode, PLAN_PRICES } from '@/lib/demo-payment-service'

interface DemoPaymentModalProps {
  type: 'premium' | 'one_pass'
  plan?: 'monthly' | 'yearly' | 'lifetime'
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function DemoPaymentModal({
  type,
  plan,
  userId,
  onSuccess,
  onCancel
}: DemoPaymentModalProps) {
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const paymentMode = getPaymentMode()
  const isDemoMode = paymentMode === 'demo'

  // Get price
  const price = type === 'one_pass' 
    ? PLAN_PRICES.one_pass 
    : plan 
      ? PLAN_PRICES[plan] 
      : PLAN_PRICES.monthly

  const handleSimulatePayment = async () => {
    setProcessing(true)
    setError(null)

    try {
      let result
      
      if (type === 'premium' && plan) {
        result = await processPremiumUpgrade(userId, plan, true)
      } else {
        result = await purchaseOnePass(userId, true)
      }

      if (result.success) {
        setSuccess(true)
        
        // Show success animation, then close
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setError(result.error || 'Payment failed')
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleRealPayment = async () => {
    setProcessing(true)
    setError(null)

    try {
      // This will redirect to Stripe
      if (type === 'premium' && plan) {
        await processPremiumUpgrade(userId, plan, false)
      } else {
        await purchaseOnePass(userId, false)
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-md w-full border-2 border-[#4ade80]/30"
      >
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={processing}
            className="rounded-full text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ✨ HOLLYWOOD SUCCESS State - Iguana + Confetti + Animation */}
        {success && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-center py-8 relative overflow-hidden"
          >
            {/* ✨ Confetti Animation */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#4ade80', '#fbbf24', '#f87171', '#60a5fa', '#c084fc'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: `-10px`
                }}
                animate={{
                  y: [0, 400],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, Math.random() * 360],
                  opacity: [1, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  repeat: Infinity
                }}
              />
            ))}
            
            {/* ✨ Sparkles around iguana */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                className="absolute text-2xl"
                style={{
                  top: '50%',
                  left: '50%'
                }}
                animate={{
                  x: Math.cos(i * 45 * Math.PI / 180) * 100,
                  y: Math.sin(i * 45 * Math.PI / 180) * 100,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              >
                ✨
              </motion.div>
            ))}
            
            {/* 🦎 Happy Iguana */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-4 relative z-10"
            >
              <div className="text-9xl">😄🦎</div>
            </motion.div>
            
            {/* ✅ Checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <CheckCircle className="h-16 w-16 text-[#4ade80]" />
            </motion.div>
            
            {/* 🎉 Success Text */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-black text-white mb-3 drop-shadow-lg"
            >
              {type === 'premium' ? 'Welcome to Premium!' : 'Pass Added!'}
            </motion.h2>
            
            {/* 💚 Unlimited Likes Message */}
            {type === 'premium' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-[#4ade80]/20 to-[#3bc970]/20 rounded-2xl p-4 border-2 border-[#4ade80]/50"
              >
                <p className="text-2xl font-bold text-[#4ade80] mb-1">
                  ∞ Unlimited Likes!
                </p>
                <p className="text-white/80 text-sm">
                  Start swiping with no limits! 🚀
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Payment Form */}
        {!success && (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-[#4ade80]" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-white text-center mb-2">
              {isDemoMode ? 'Demo Payment' : 'Complete Payment'}
            </h2>
            
            {/* Mode Badge */}
            <div className="flex justify-center mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isDemoMode 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'bg-[#4ade80]/20 text-[#4ade80]'
              }`}>
                {isDemoMode ? '🧪 DEMO MODE' : '💳 LIVE MODE'}
              </span>
            </div>

            {/* Price */}
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">
                  {type === 'premium' 
                    ? `Premium ${plan}` 
                    : 'One Pass'}
                </span>
                <span className="text-2xl font-black text-[#4ade80]">
                  {price.display}
                </span>
              </div>
              
              {type === 'premium' && (
                <p className="text-white/40 text-xs">
                  {plan === 'monthly' && 'Billed monthly, cancel anytime'}
                  {plan === 'yearly' && 'Billed annually, best value!'}
                  {plan === 'lifetime' && 'One-time payment, forever access'}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl mb-6"
              >
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Demo Mode Info */}
            {isDemoMode && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
                <p className="text-yellow-200 text-sm">
                  <strong>Demo Mode Active</strong><br/>
                  No real payment will be processed. This simulates a successful payment for testing.
                </p>
              </div>
            )}

            {/* Payment Button */}
            <Button
              onClick={isDemoMode ? handleSimulatePayment : handleRealPayment}
              disabled={processing}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] rounded-2xl"
            >
              {processing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-2xl"
                >
                  🔄
                </motion.div>
              ) : (
                <>
                  {isDemoMode ? '🧪 Simulate Payment' : '💳 Pay Now'}
                </>
              )}
            </Button>

            {/* Cancel */}
            <Button
              onClick={onCancel}
              disabled={processing}
              variant="ghost"
              className="w-full mt-3 text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}
