"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Calendar } from "lucide-react"

interface OnboardingAgeProps {
  onNext: (data: { age: number; ageRange: [number, number]; minDistance: number; maxDistance: number }) => void
  onBack: () => void
}

export default function OnboardingAge({ onNext, onBack }: OnboardingAgeProps) {
  // ✅ Calculate age from birth date
  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // ✅ Set default date to 25 years ago
  const getDefaultDate = (): string => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 25)
    return date.toISOString().split('T')[0]
  }

  const [birthDate, setBirthDate] = useState(getDefaultDate())
  const [age, setAge] = useState(25)
  const [minAge, setMinAge] = useState(21)
  const [maxAge, setMaxAge] = useState(35)
  const [maxDistance, setMaxDistance] = useState(500)
  const [error, setError] = useState("")

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    setBirthDate(dateValue)
    setError("")
    
    if (dateValue) {
      const birthDateObj = new Date(dateValue)
      const calculatedAge = calculateAge(birthDateObj)
      
      // Validation
      if (calculatedAge < 18) {
        setError("You must be at least 18 years old")
        return
      }
      
      if (calculatedAge > 100) {
        setError("Please enter a valid birth date")
        return
      }
      
      setAge(calculatedAge)
    }
  }

  const handleMinAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value <= maxAge) {
      setMinAge(value)
    }
  }

  const handleMaxAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value >= minAge) {
      setMaxAge(value)
    }
  }

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setMaxDistance(value)
  }

  const handleContinue = () => {
    if (age < 18) {
      setError("You must be at least 18 years old")
      return
    }
    
    if (!birthDate) {
      setError("Please select your birth date")
      return
    }
    
    onNext({
      age,
      ageRange: [minAge, maxAge],
      minDistance: 50,
      maxDistance,
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] overflow-hidden">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1" />
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-4 flex-shrink-0">
        <div className="flex gap-2">
          <div className="h-1 flex-1 bg-[#4ade80] rounded-full" />
          <div className="h-1 flex-1 bg-[#4ade80] rounded-full" />
          <div className="h-1 flex-1 bg-[#4ade80] rounded-full" />
          <div className="h-1 flex-1 bg-white/20 rounded-full" />
          <div className="h-1 flex-1 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Cake emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-6xl text-center"
          >
            🎂
          </motion.div>

          {/* Your Age Section - WITH DATE PICKER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-4"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              When's your birthday?
            </h1>
            <p className="text-white/60 mb-6 text-sm">Your age will be shown on your profile</p>

            {/* ✅ Date Picker */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Calendar className="w-5 h-5 text-[#4ade80]" />
              </div>
              <Input
                type="date"
                value={birthDate}
                onChange={handleBirthDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="h-16 text-lg text-center bg-white/10 border-white/20 text-white 
                  focus:border-[#4ade80] focus:ring-[#4ade80] pl-12
                  [color-scheme:dark]"
              />
            </div>

            {/* Age display */}
            {age >= 18 && !error && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-7xl font-bold text-[#4ade80] mt-4"
              >
                {age}
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Age Range Section - ORIGINAL WITH DUAL SLIDERS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Age Range Preferences
            </h2>

            {/* Age Range Display */}
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-[#4ade80]">{minAge} - {maxAge}</span>
            </div>

            {/* ✅ ORIGINAL: Dual-slider system (looks like one slider with 2 thumbs) */}
            <div className="relative h-12 flex items-center px-2">
              {/* Track Background */}
              <div className="absolute w-full h-2 bg-white/10 rounded-lg" />
              
              {/* Active Range */}
              <div 
                className="absolute h-2 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-lg transition-all duration-150"
                style={{
                  left: `${((minAge - 18) / (80 - 18)) * 100}%`,
                  right: `${100 - ((maxAge - 18) / (80 - 18)) * 100}%`
                }}
              />

              {/* Min Slider */}
              <input
                type="range"
                min="18"
                max="80"
                value={minAge}
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
                value={maxAge}
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
          </motion.div>

          {/* Distance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Maximum Distance
            </h2>

            {/* Distance Display */}
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-[#4ade80]">{maxDistance}m</span>
            </div>

            {/* Distance Slider */}
            <div className="relative h-12 flex items-center px-2">
              {/* Track Background */}
              <div className="absolute w-full h-2 bg-white/10 rounded-lg" />
              
              {/* Active Track */}
              <div 
                className="absolute h-2 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-lg transition-all duration-150"
                style={{
                  left: '0%',
                  right: `${100 - ((maxDistance - 50) / (500 - 50)) * 100}%`
                }}
              />

              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={maxDistance}
                onChange={handleDistanceChange}
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
                  [&::-moz-range-thumb]:shadow-lg"
              />
            </div>
            <p className="text-white/40 text-xs text-center mt-4">
              Maximum distance from your current location
            </p>
          </motion.div>
        </div>
      </div>

      {/* Continue Button - Fixed at bottom */}
      <div className="p-6 flex-shrink-0">
        <Button
          onClick={handleContinue}
          disabled={age < 18 || !birthDate || !!error}
          className="w-full h-14 rounded-xl text-lg font-bold 
            bg-gradient-to-r from-[#4ade80] to-[#22c55e] 
            hover:from-[#22c55e] hover:to-[#16a34a] 
            text-[#0d2920] shadow-xl shadow-[#4ade80]/30
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
