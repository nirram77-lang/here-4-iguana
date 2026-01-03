"use client"

/**
 * 🦎 I4IGUANA - Mode Selection Screen
 * 
 * HOLLYWOOD LEVEL! 🎬
 * Beautiful animations, stunning visuals, unforgettable experience
 * 
 * After onboarding, user chooses how to play:
 * 1. VENUE MODE - Check into a specific bar/club (existing system)
 * 2. ZONE MODE - See everyone in the area (new global system)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Map, 
  Users, 
  Building2,
  Sparkles,
  ChevronRight,
  Loader2,
  Zap,
  Heart
} from 'lucide-react'

interface ModeSelectionScreenProps {
  onSelectVenueMode: () => void
  onSelectZoneMode: () => void
  userName?: string
}

export default function ModeSelectionScreen({
  onSelectVenueMode,
  onSelectZoneMode,
  userName = 'there'
}: ModeSelectionScreenProps) {
  // Viewport height for mobile
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [selectedMode, setSelectedMode] = useState<'venue' | 'zone' | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Generate particles once on mount
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5
    }))
  )
  
  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    
    // Reset states when component mounts (for when returning from other screens)
    setSelectedMode(null)
    setIsLoaded(false)
    
    // Trigger entrance animation with a small delay for smoothness
    requestAnimationFrame(() => {
      setTimeout(() => setIsLoaded(true), 50)
    })
    
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  const handleSelectVenue = () => {
    setSelectedMode('venue')
    setTimeout(() => onSelectVenueMode(), 500)
  }

  const handleSelectZone = () => {
    setSelectedMode('zone')
    setTimeout(() => onSelectZoneMode(), 500)
  }

  return (
    <div 
      className="relative flex flex-col overflow-hidden"
      style={{ 
        minHeight: viewportHeight ? `${viewportHeight}px` : '100vh',
        background: 'linear-gradient(160deg, #0a1f1a 0%, #0d2920 30%, #051410 70%, #030b08 100%)'
      }}
    >
      {/* 💕 Floating Hearts Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`heart-${i}`}
            className="absolute text-pink-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: -30,
              fontSize: 14 + Math.random() * 12,
            }}
            animate={{
              y: [0, -(viewportHeight || 800) - 50],
              x: [0, Math.sin(i) * 20],
              rotate: [0, 360],
              opacity: [0.3, 0.15, 0]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            💕
          </motion.div>
        ))}
      </div>

      {/* ✨ Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-[#4ade80]/20"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* 🌟 Glowing Orb Background Effect - with pink tint */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, rgba(236, 72, 153, 0.04) 50%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header Section */}
      <motion.div 
        className="relative z-10 p-6 pt-10 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -30 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo with Glow */}
        <motion.div
          className="relative inline-block mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: isLoaded ? 1 : 0, rotate: isLoaded ? 0 : -180 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="absolute inset-0 blur-2xl bg-[#4ade80]/30 rounded-full scale-150" />
          <span className="relative text-6xl drop-shadow-[0_0_25px_rgba(74,222,128,0.5)]">🦎</span>
        </motion.div>
        
        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            Hey{' '}
            <span className="bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#15803d] bg-clip-text text-transparent">
              {userName}
            </span>
            ! 💕
          </h1>
          
          <motion.p
            className="text-white/60 text-lg font-medium flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <span>Ready to find love tonight?</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              💚
            </motion.span>
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Mode Selection Cards */}
      <div className="relative z-10 flex-1 px-5 py-6 flex flex-col justify-center gap-5">
        
        {/* 📍 VENUE MODE Card */}
        <motion.button
          initial={{ opacity: 0, x: -100, rotateY: -30 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0, 
            x: isLoaded ? 0 : -100,
            rotateY: isLoaded ? 0 : -30
          }}
          transition={{ duration: 0.7, delay: 0.5, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSelectVenue}
          disabled={selectedMode !== null}
          className={`relative w-full overflow-hidden rounded-3xl text-left transition-all duration-500 ${
            selectedMode === 'venue'
              ? 'ring-4 ring-[#4ade80] shadow-[0_0_40px_rgba(74,222,128,0.4)]'
              : selectedMode === 'zone'
                ? 'opacity-30 scale-95'
                : 'hover:shadow-[0_0_30px_rgba(74,222,128,0.2)]'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(13,41,32,0.9) 50%, rgba(5,20,16,0.95) 100%)',
            border: '1px solid rgba(74,222,128,0.3)',
          }}
        >
          {/* Card Shine Effect */}
          <motion.div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(74,222,128,0.1) 50%, transparent 60%)',
            }}
          />
          
          <div className="relative p-6">
            <div className="flex items-start gap-4">
              {/* Icon Container */}
              <motion.div 
                className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedMode === 'venue' 
                    ? 'bg-[#4ade80] shadow-[0_0_30px_rgba(74,222,128,0.6)]' 
                    : 'bg-gradient-to-br from-[#4ade80]/30 to-[#4ade80]/10'
                }`}
                animate={selectedMode === 'venue' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Building2 className={`h-8 w-8 transition-colors duration-300 ${
                  selectedMode === 'venue' ? 'text-[#0d2920]' : 'text-[#4ade80]'
                }`} />
                
                {/* Pulse Ring */}
                {selectedMode !== 'zone' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-[#4ade80]/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                  At a Venue
                  {selectedMode === 'venue' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-[#4ade80]" />
                    </motion.div>
                  )}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Check into a bar or club and see who's there right now
                </p>
                
                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full border border-white/10">
                    <MapPin className="h-3 w-3 text-[#4ade80]" />
                    Specific venue
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full border border-white/10">
                    <Users className="h-3 w-3 text-[#4ade80]" />
                    Same place
                  </span>
                </div>
              </div>
              
              <ChevronRight className={`h-6 w-6 self-center transition-all duration-300 ${
                selectedMode === 'venue' ? 'text-[#4ade80] translate-x-1' : 'text-white/30'
              }`} />
            </div>
          </div>
        </motion.button>

        {/* Divider with Animation */}
        <motion.div 
          className="flex items-center gap-4 py-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <motion.span 
            className="text-white/40 text-sm font-medium px-2"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            or
          </motion.span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>

        {/* 🗺️ ZONE MODE Card */}
        <motion.button
          initial={{ opacity: 0, x: 100, rotateY: 30 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0, 
            x: isLoaded ? 0 : 100,
            rotateY: isLoaded ? 0 : 30
          }}
          transition={{ duration: 0.7, delay: 0.6, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSelectZone}
          disabled={selectedMode !== null}
          className={`relative w-full overflow-hidden rounded-3xl text-left transition-all duration-500 ${
            selectedMode === 'zone'
              ? 'ring-4 ring-[#4ade80] shadow-[0_0_40px_rgba(74,222,128,0.4)]'
              : selectedMode === 'venue'
                ? 'opacity-30 scale-95'
                : 'hover:shadow-[0_0_30px_rgba(74,222,128,0.2)]'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(13,41,32,0.9) 50%, rgba(5,20,16,0.95) 100%)',
            border: '1px solid rgba(74,222,128,0.3)',
          }}
        >
          {/* Card Shine Effect */}
          <motion.div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(74,222,128,0.1) 50%, transparent 60%)',
            }}
          />
          
          <div className="relative p-6">
            <div className="flex items-start gap-4">
              {/* Icon Container */}
              <motion.div 
                className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedMode === 'zone' 
                    ? 'bg-[#4ade80] shadow-[0_0_30px_rgba(74,222,128,0.6)]' 
                    : 'bg-gradient-to-br from-[#4ade80]/30 to-[#4ade80]/10'
                }`}
                animate={selectedMode === 'zone' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Map className={`h-8 w-8 transition-colors duration-300 ${
                  selectedMode === 'zone' ? 'text-[#0d2920]' : 'text-[#4ade80]'
                }`} />
                
                {/* Pulse Ring */}
                {selectedMode !== 'venue' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-[#4ade80]/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                )}
              </motion.div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                  Explore Zone
                  {selectedMode === 'zone' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-[#4ade80]" />
                    </motion.div>
                  )}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  See everyone nearby within 500m, no matter where they are
                </p>
                
                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full border border-white/10">
                    <Map className="h-3 w-3 text-[#4ade80]" />
                    Whole area
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full border border-white/10">
                    <Zap className="h-3 w-3 text-[#4ade80]" />
                    More people
                  </span>
                </div>
              </div>
              
              <ChevronRight className={`h-6 w-6 self-center transition-all duration-300 ${
                selectedMode === 'zone' ? 'text-[#4ade80] translate-x-1' : 'text-white/30'
              }`} />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Footer Pro Tip */}
      <motion.div
        className="relative z-10 p-5 pb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <div 
          className="rounded-2xl p-4 border border-[#4ade80]/20"
          style={{
            background: 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(13,41,32,0.5) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="h-5 w-5 text-[#4ade80]" />
            </motion.div>
            <div>
              <p className="text-white/80 text-sm font-semibold">
                Pro tip
              </p>
              <p className="text-white/40 text-xs">
                You can switch between modes anytime!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
