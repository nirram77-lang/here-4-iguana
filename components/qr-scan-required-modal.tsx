"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { QrCode, MapPin, Sparkles, X } from "lucide-react"

interface QRScanRequiredModalProps {
  isOpen: boolean
  onScanClick: () => void
  onClose?: () => void
}

export default function QRScanRequiredModal({ 
  isOpen, 
  onScanClick,
  onClose 
}: QRScanRequiredModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ 
          type: "spring", 
          damping: 20,
          stiffness: 300
        }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      >
        <div 
          className="relative bg-gradient-to-br from-[#1a4d3e] via-[#0d2920] to-[#051410] rounded-3xl max-w-md w-full border-2 border-[#4ade80]/40 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzRhZGU4MCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
          </div>

          {/* Glowing orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-[#4ade80] rounded-full blur-[100px]"
          />
          
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-[#22c55e] rounded-full blur-[100px]"
          />

          {/* Close button - only if onClose provided */}
          {onClose && (
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 z-20 text-white/60 hover:text-white transition-colors bg-white/5 backdrop-blur-sm rounded-full p-2 border border-white/10"
            >
              <X size={20} />
            </motion.button>
          )}

          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Animated Iguana */}
            <motion.div
              animate={{ 
                rotate: [0, -8, 8, -8, 0],
                y: [0, -10, 0, -10, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-6"
            >
              <div className="text-9xl filter drop-shadow-2xl inline-block">
                🦎
              </div>
            </motion.div>

            {/* Title with sparkle effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                One More Step!
              </h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="text-[#4ade80] w-5 h-5" />
                <p className="text-[#4ade80] font-bold text-lg">
                  Check In to Start
                </p>
                <Sparkles className="text-[#4ade80] w-5 h-5" />
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/80 text-lg leading-relaxed mb-8"
            >
              To see people at your venue, scan the <span className="text-[#4ade80] font-semibold">QR code</span> at the entrance
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 mb-8"
            >
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div className="text-left">
                  <h4 className="text-white font-bold text-base">Quick & Easy</h4>
                  <p className="text-white/60 text-sm">Just scan, check in, and match!</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div className="text-left">
                  <h4 className="text-white font-bold text-base">Venue-Based</h4>
                  <p className="text-white/60 text-sm">Meet people at the same place</p>
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onScanClick}
                className="w-full h-16 text-xl font-black bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] rounded-2xl shadow-2xl shadow-[#4ade80]/30 relative overflow-hidden group"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                
                <QrCode className="mr-3 h-6 w-6" />
                Scan QR Code Now
              </Button>
            </motion.div>

            {/* Helper text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/40 text-sm mt-6"
            >
              Look for the <span className="text-[#4ade80]">Iguana Bar</span> QR code at your venue
            </motion.p>
          </div>
        </div>
      </motion.div>
    </>
  )
}
