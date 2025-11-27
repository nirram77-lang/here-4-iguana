"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Users, Calendar, Sparkles, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentRadius: number
  currentAgeRange: [number, number]
  currentGender: 'male' | 'female' | 'both'
  currentExpandSearch: boolean
  onSave: (settings: {
    radius: number
    ageRange: [number, number]
    lookingFor: 'male' | 'female' | 'both'
    expandSearch: boolean
  }) => void
}

export default function SearchSettingsModal({
  isOpen,
  onClose,
  currentRadius,
  currentAgeRange,
  currentGender,
  currentExpandSearch,
  onSave
}: SearchSettingsModalProps) {
  const [radius, setRadius] = useState(currentRadius)
  const [ageRange, setAgeRange] = useState<[number, number]>(currentAgeRange)
  const [lookingFor, setLookingFor] = useState<'male' | 'female' | 'both'>(currentGender)
  const [expandSearch, setExpandSearch] = useState(currentExpandSearch)
  
  // ✅ NEW: Keep Screen On (Wake Lock API)
  const [keepScreenOn, setKeepScreenOn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('i4iguana_keep_screen_on') === 'true'
    }
    return false
  })
  const wakeLockRef = useRef<any>(null)
  
  // ✅ Save keepScreenOn to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('i4iguana_keep_screen_on', keepScreenOn.toString())
    }
  }, [keepScreenOn])
  
  // ✅ Handle Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if (keepScreenOn && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
          console.log('🔆 Screen Wake Lock activated!')
          
          // Re-acquire wake lock when page becomes visible again
          const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && keepScreenOn && !wakeLockRef.current?.released) {
              try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
                console.log('🔆 Wake Lock re-acquired after visibility change')
              } catch (e) {
                console.warn('Could not re-acquire wake lock')
              }
            }
          }
          document.addEventListener('visibilitychange', handleVisibilityChange)
          
          return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
          }
        } catch (err) {
          console.warn('⚠️ Wake Lock not available:', err)
        }
      } else if (!keepScreenOn && wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log('🌙 Screen Wake Lock released')
      }
    }
    
    requestWakeLock()
    
    // Cleanup on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }
  }, [keepScreenOn])

  // Update local state when props change
  useEffect(() => {
    setRadius(currentRadius)
    setAgeRange(currentAgeRange)
    setLookingFor(currentGender)
    setExpandSearch(currentExpandSearch)
  }, [currentRadius, currentAgeRange, currentGender, currentExpandSearch, isOpen])

  const handleSave = () => {
    onSave({
      radius,
      ageRange,
      lookingFor,
      expandSearch
    })
    onClose()
  }

  const getRadiusLabel = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  // Age range handlers
  const handleMinAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseInt(e.target.value)
    setAgeRange([newMin, Math.max(newMin, ageRange[1])])
  }

  const handleMaxAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value)
    setAgeRange([Math.min(ageRange[0], newMax), newMax])
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl shadow-2xl border-2 border-[#4ade80]/30 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-b from-[#1a4d3e] to-[#1a4d3e]/95 backdrop-blur-xl border-b border-[#4ade80]/20 p-6 rounded-t-3xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg"
                  style={{
                    boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)'
                  }}
                >
                  <Target className="h-6 w-6 text-[#0d2920]" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-black text-white">Search Settings</h2>
                  <p className="text-sm text-[#4ade80]">Customize your search</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-white/10 text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            
            {/* 1. Search Radius */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div className="flex-1">
                  <label className="text-white font-bold text-lg">Search Radius</label>
                  <p className="text-sm text-white/60">How far to search for matches</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#4ade80]">{getRadiusLabel(radius)}</div>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #4ade80 0%, #4ade80 ${((radius - 10) / 490) * 100}%, #1a4d3e ${((radius - 10) / 490) * 100}%, #1a4d3e 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>10m</span>
                  <span>500m</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#4ade80]/30 to-transparent" />

            {/* 2. Age Range - Dual Range Slider (like onboarding) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div className="flex-1">
                  <label className="text-white font-bold text-lg">Age Range</label>
                  <p className="text-sm text-white/60">Who you want to meet</p>
                </div>
              </div>

              {/* Age Range Display */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <span className="text-white/70 text-xs block mb-1">Min Age</span>
                  <span className="text-3xl font-bold text-[#4ade80]">{ageRange[0]}</span>
                </div>
                <div className="text-white/50 text-2xl">—</div>
                <div className="text-center">
                  <span className="text-white/70 text-xs block mb-1">Max Age</span>
                  <span className="text-3xl font-bold text-[#4ade80]">{ageRange[1]}</span>
                </div>
              </div>

              {/* Dual Range Slider - EXACTLY like onboarding */}
              <div className="relative h-12 flex items-center px-2">
                {/* Track Background */}
                <div className="absolute w-full h-2 bg-white/10 rounded-lg" />
                
                {/* Active Range - Green between the two handles */}
                <div 
                  className="absolute h-2 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-lg transition-all duration-150"
                  style={{
                    left: `${((ageRange[0] - 18) / (80 - 18)) * 100}%`,
                    right: `${100 - ((ageRange[1] - 18) / (80 - 18)) * 100}%`
                  }}
                />

                {/* Min Slider */}
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={ageRange[0]}
                  onChange={handleMinAgeChange}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-10
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[#4ade80]
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#0d2920]
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-[#4ade80]
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#0d2920]
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:shadow-lg
                    pointer-events-none
                    [&::-webkit-slider-thumb]:pointer-events-auto
                    [&::-moz-range-thumb]:pointer-events-auto"
                />

                {/* Max Slider */}
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={ageRange[1]}
                  onChange={handleMaxAgeChange}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-20
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[#4ade80]
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-[#0d2920]
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-[#4ade80]
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-[#0d2920]
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:shadow-lg
                    pointer-events-none
                    [&::-webkit-slider-thumb]:pointer-events-auto
                    [&::-moz-range-thumb]:pointer-events-auto"
                />
              </div>

              {/* Age labels */}
              <div className="flex justify-between text-xs text-white/40 px-2">
                <span>18</span>
                <span>80</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#4ade80]/30 to-transparent" />

            {/* 3. Show Me (Gender) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div className="flex-1">
                  <label className="text-white font-bold text-lg">Show Me</label>
                  <p className="text-sm text-white/60">Who you want to see</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLookingFor('male')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    lookingFor === 'male'
                      ? 'bg-[#4ade80]/20 border-[#4ade80] shadow-lg shadow-[#4ade80]/20'
                      : 'bg-[#0d2920]/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">♂️</div>
                  <div className={`text-sm font-bold ${lookingFor === 'male' ? 'text-[#4ade80]' : 'text-white/60'}`}>
                    Men
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLookingFor('female')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    lookingFor === 'female'
                      ? 'bg-[#4ade80]/20 border-[#4ade80] shadow-lg shadow-[#4ade80]/20'
                      : 'bg-[#0d2920]/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">♀️</div>
                  <div className={`text-sm font-bold ${lookingFor === 'female' ? 'text-[#4ade80]' : 'text-white/60'}`}>
                    Women
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLookingFor('both')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    lookingFor === 'both'
                      ? 'bg-[#4ade80]/20 border-[#4ade80] shadow-lg shadow-[#4ade80]/20'
                      : 'bg-[#0d2920]/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">👥</div>
                  <div className={`text-sm font-bold ${lookingFor === 'both' ? 'text-[#4ade80]' : 'text-white/60'}`}>
                    Everyone
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#4ade80]/30 to-transparent" />

            {/* 4. Expand Search Toggle */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div className="flex-1">
                  <label className="text-white font-bold text-lg">Smart Search</label>
                  <p className="text-sm text-white/60">Expand beyond preferences when needed</p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setExpandSearch(!expandSearch)}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  expandSearch
                    ? 'bg-[#4ade80]/20 border-[#4ade80]'
                    : 'bg-[#0d2920]/50 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={expandSearch ? {
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      } : {}}
                      transition={{
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity }
                      }}
                      className="text-2xl"
                    >
                      ✨
                    </motion.div>
                    <div className="text-left">
                      <div className={`text-sm font-bold ${expandSearch ? 'text-[#4ade80]' : 'text-white/70'}`}>
                        Show profiles outside my range
                      </div>
                      <div className="text-xs text-white/50">
                        When I run out of preferred profiles
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className={`w-14 h-8 rounded-full transition-colors relative ${
                    expandSearch ? 'bg-[#4ade80]' : 'bg-white/20'
                  }`}>
                    <motion.div
                      animate={{ x: expandSearch ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                  </div>
                </div>
              </motion.button>

              {/* ✅ NEW: Keep Screen On Toggle */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setKeepScreenOn(!keepScreenOn)}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  keepScreenOn
                    ? 'bg-[#4ade80]/20 border-[#4ade80]'
                    : 'bg-[#0d2920]/50 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={keepScreenOn ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-2xl"
                    >
                      {keepScreenOn ? '☀️' : '🌙'}
                    </motion.div>
                    <div className="text-left">
                      <div className={`text-sm font-bold ${keepScreenOn ? 'text-[#4ade80]' : 'text-white/70'}`}>
                        Keep screen always on
                      </div>
                      <div className="text-xs text-white/50">
                        Prevent screen from turning off while using app
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className={`w-14 h-8 rounded-full transition-colors relative ${
                    keepScreenOn ? 'bg-[#4ade80]' : 'bg-white/20'
                  }`}>
                    <motion.div
                      animate={{ x: keepScreenOn ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Footer - Save Button */}
          <div className="sticky bottom-0 p-6 bg-gradient-to-t from-[#0d2920] to-[#0d2920]/95 backdrop-blur-xl border-t border-[#4ade80]/20 rounded-b-3xl">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-black text-lg shadow-lg shadow-[#4ade80]/30 hover:shadow-[#4ade80]/50 transition-all"
            >
              Save Settings
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
