"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/LanguageContext"

interface SuperLikeModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (message?: string) => Promise<void>
  recipientName: string
  recipientPhoto: string
  recipientAge?: number
  zoneName: string
  superLikesRemaining: number
  isPremium?: boolean
}

export default function SuperLikeModal({
  isOpen,
  onClose,
  onSend,
  recipientName,
  recipientPhoto,
  recipientAge,
  zoneName,
  superLikesRemaining,
  isPremium = false
}: SuperLikeModalProps) {
  const { t, isRTL } = useLanguage()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    setIsSending(true)
    try {
      await onSend(message.trim() || undefined)
      setMessage("")
      onClose()
    } catch (error) {
      console.error('Error sending Super Like:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-gradient-to-b from-[#1a2e1a] to-[#0d1f0d] rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-500/20"
          >
            {/* Purple glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
            
            {/* Content */}
            <div className="relative p-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {/* Header with sparkles */}
              <div className="text-center mb-6">
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
                  className="inline-block mb-2"
                >
                  <span className="text-5xl">🦎</span>
                </motion.div>
                <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {t('superLike.title')}
                </h2>
              </div>
              
              {/* Recipient info */}
              <div className="flex items-center gap-4 mb-6 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-400 shadow-lg shadow-purple-500/30">
                    <img 
                      src={recipientPhoto || '/placeholder.svg'} 
                      alt={recipientName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1a2e1a] flex items-center justify-center">
                    <span className="text-[10px]">✓</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {recipientName}{recipientAge ? `, ${recipientAge}` : ''}
                  </h3>
                  <p className="text-white/60 text-sm flex items-center gap-1">
                    📍 {zoneName}
                  </p>
                </div>
              </div>
              
              {/* Message input */}
              <div className="mb-4">
                <label className="text-white/70 text-sm mb-2 block">
                  ✍️ {t('superLike.addMessage')}
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('superLike.messagePlaceholder')}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl resize-none h-24 focus:border-purple-400 focus:ring-purple-400/20"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                  maxLength={200}
                />
                <p className="text-white/40 text-xs mt-1 text-left">
                  {message.length}/200
                </p>
              </div>
              
              {/* Super Likes counter */}
              <div className="flex items-center justify-center gap-2 mb-4 text-sm">
                <span className="text-purple-400 font-bold">💜</span>
                <span className="text-white/80">
                  {isPremium ? (
                    <span className="text-purple-400">{t('superLike.unlimited')}</span>
                  ) : (
                    <>
                      {superLikesRemaining}/3 {t('superLike.remaining')}
                    </>
                  )}
                </span>
              </div>
              
              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={isSending || (!isPremium && superLikesRemaining <= 0)}
                className="w-full h-14 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSending ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span className="mr-2">🦎</span>
                    {t('superLike.send')}
                  </>
                )}
              </Button>
              
              {/* Cancel */}
              <button
                onClick={onClose}
                className="w-full text-center text-white/50 hover:text-white/70 text-sm mt-3 transition-colors"
              >
                {t('superLike.cancel')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
