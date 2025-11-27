"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Crown, Zap, Sparkles, Star, Target } from "lucide-react"
import { PREMIUM_PRICING } from "@/lib/constants"

interface PremiumModalProps {
  onSelectPlan: (plan: 'weekly' | 'monthly') => void
  onClose: () => void
  isOpen: boolean
}

export default function PremiumModal({ onSelectPlan, onClose, isOpen }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)
    try {
      await onSelectPlan(selectedPlan)
    } catch (error) {
      console.error('Error purchasing premium:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with animated particles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
          >
            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-[#4ade80]/40 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] rounded-3xl p-8 max-w-md w-full shadow-2xl relative pointer-events-auto border-2 border-[#4ade80]/30 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Glow Border */}
              <motion.div
                className="absolute inset-0 rounded-3xl opacity-30"
                style={{
                  background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
                }}
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              {/* Close Button */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10 bg-white/10 rounded-full p-2"
              >
                <X size={24} />
              </motion.button>

              {/* Header with Iguana */}
              <div className="text-center mb-6 relative">
                <motion.div
                  animate={{
                    rotate: [0, -15, 15, -15, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-7xl mb-4 relative"
                >
                  🦎
                  {/* Sparkles around iguana */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${25 + i * 20}%`,
                        top: `${10 + (i % 2) * 20}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    >
                      <Sparkles className="h-4 w-4 text-[#4ade80]" />
                    </motion.div>
                  ))}
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Choose Your Plan
                </h2>
                <p className="text-white/80">
                  Unlock unlimited matches instantly!
                </p>
              </div>

              {/* Plans */}
              <div className="space-y-4 mb-6">
                {/* Weekly Plan */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan('weekly')}
                  className={`
                    bg-[#0d2920]/50 backdrop-blur-lg rounded-2xl p-6 cursor-pointer
                    border-2 transition-all relative overflow-hidden
                    ${selectedPlan === 'weekly' 
                      ? 'border-[#4ade80] shadow-[0_0_30px_rgba(74,222,128,0.3)]' 
                      : 'border-[#4ade80]/20 hover:border-[#4ade80]/40'}
                  `}
                >
                  {selectedPlan === 'weekly' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3"
                    >
                      <div className="bg-[#4ade80] rounded-full p-1">
                        <Check size={16} className="text-[#0d2920]" />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="text-[#4ade80] h-6 w-6" />
                    <h3 className="text-xl font-bold text-white">
                      Weekly Premium
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-[#4ade80] mb-3">
                    {PREMIUM_PRICING.WEEKLY.displayPrice}
                    <span className="text-lg font-normal text-white/70">/week</span>
                  </div>

                  <ul className="space-y-2">
                    {['Unlimited matches', 'No 2-hour wait', 'Cancel anytime'].map((feature, i) => (
                      <motion.li 
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center text-white/90 text-sm"
                      >
                        <Check size={16} className="mr-2 text-[#4ade80]" />
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Monthly Plan - BEST VALUE */}
                <motion.div
                  whileHover={{ scale: 1.03, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan('monthly')}
                  className={`
                    bg-[#0d2920]/50 backdrop-blur-lg rounded-2xl p-6 cursor-pointer
                    border-2 transition-all relative overflow-hidden
                    ${selectedPlan === 'monthly' 
                      ? 'border-[#4ade80] shadow-[0_0_30px_rgba(74,222,128,0.3)]' 
                      : 'border-[#4ade80]/20 hover:border-[#4ade80]/40'}
                  `}
                >
                  {/* Best Value Badge */}
                  <motion.div 
                    className="absolute top-0 right-0 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl"
                    animate={{
                      boxShadow: [
                        "0 0 10px rgba(74,222,128,0.5)",
                        "0 0 20px rgba(74,222,128,0.8)",
                        "0 0 10px rgba(74,222,128,0.5)",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      BEST VALUE!
                    </div>
                  </motion.div>

                  {selectedPlan === 'monthly' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3"
                    >
                      <div className="bg-[#4ade80] rounded-full p-1">
                        <Check size={16} className="text-[#0d2920]" />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="text-[#4ade80] h-6 w-6" />
                    <h3 className="text-xl font-bold text-white">
                      Monthly Premium
                    </h3>
                  </div>

                  <div className="text-3xl font-bold text-[#4ade80] mb-3">
                    {PREMIUM_PRICING.MONTHLY.displayPrice}
                    <span className="text-lg font-normal text-white/70">/month</span>
                  </div>

                  <ul className="space-y-2 mb-3">
                    {['Unlimited matches', 'No 2-hour wait', 'Priority support', 'Cancel anytime'].map((feature, i) => (
                      <motion.li 
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center text-white/90 text-sm"
                      >
                        <Check size={16} className="mr-2 text-[#4ade80]" />
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Savings Badge */}
                  <motion.div 
                    className="bg-[#4ade80]/20 rounded-lg p-2 text-center border border-[#4ade80]/40"
                    animate={{
                      backgroundColor: ["rgba(74,222,128,0.1)", "rgba(74,222,128,0.2)", "rgba(74,222,128,0.1)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-[#4ade80] text-xs font-semibold flex items-center justify-center gap-1">
                      <Target size={14} />
                      Save 25% compared to weekly
                    </span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Purchase Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg shadow-lg transition-all hover:shadow-[0_0_40px_rgba(74,222,128,0.5)]"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[#0d2920] border-t-transparent rounded-full mr-2"
                      />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Crown className="mr-2" size={20} />
                      Continue with {selectedPlan === 'weekly' ? 'Weekly' : 'Monthly'}
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Footer */}
              <p className="text-white/60 text-center text-xs mt-4 flex items-center justify-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔒
                </motion.span>
                Secure payment via Stripe • Cancel anytime
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
