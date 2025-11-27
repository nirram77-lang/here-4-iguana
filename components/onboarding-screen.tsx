'use client'

import { useState } from 'react'
import { User } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface OnboardingProps {
  user: User | null
  onComplete: () => void
}

export default function OnboardingScreen({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: '',
    interestedIn: '',
    minAge: 18,
    maxAge: 35,
    bio: ''
  })

  const totalSteps = 4

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      await completeOnboarding()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const completeOnboarding = async () => {
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        interestedIn: formData.interestedIn,
        minAge: formData.minAge,
        maxAge: formData.maxAge,
        bio: formData.bio,
        onboardingCompleted: true,
        updatedAt: new Date()
      })
      onComplete()
    } catch (error) {
      console.error('❌ Onboarding error:', error)
    }
  }

  const progressPercentage = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-green-900/20 to-black relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU1LCAyMjUsIDEwMCwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      {/* MEGA PROGRESS BAR */}
      <div className="relative z-10 bg-black/50 backdrop-blur-md border-b border-green-500/30">
        <div className="px-6 py-6">
          {/* Step Numbers */}
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mb-2 transition-all duration-500 ${
                  s < step 
                    ? 'bg-green-500 text-white scale-100'
                    : s === step
                    ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-125 shadow-2xl'
                    : 'bg-gray-700 text-gray-400 scale-90'
                }`}
                style={{
                  boxShadow: s === step ? '0 0 40px rgba(34, 197, 94, 1), 0 0 80px rgba(34, 197, 94, 0.5)' : 'none'
                }}>
                  {s < step ? '✓' : s}
                </div>
                <div className={`text-xs font-bold ${s === step ? 'text-green-400' : 'text-gray-500'}`}>
                  {s === 1 ? 'Name' : s === 2 ? 'Age' : s === 3 ? 'Gender' : 'Bio'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 transition-all duration-700 ease-out flex items-center justify-end pr-4"
              style={{ 
                width: `${progressPercentage}%`,
                boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.2), 0 0 30px rgba(34, 197, 94, 0.6)'
              }}
            >
              <span className="text-white font-black text-lg drop-shadow-lg">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
          
          {/* Step Text */}
          <div className="text-center mt-3">
            <span className="text-green-400 font-bold text-lg">
              Step {step} of {totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-[200px] pb-[140px] overflow-y-auto">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="text-6xl mb-6 text-center">👤</div>
            <h2 className="text-4xl font-bold text-white text-center mb-4">
              What's your name?
            </h2>
            <p className="text-white/60 text-center mb-8">
              This will be shown on your profile
            </p>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-6 py-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl text-white text-xl text-center focus:outline-none focus:border-green-500 transition-all"
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="text-6xl mb-6 text-center">🎂</div>
            <h2 className="text-4xl font-bold text-white text-center mb-4">
              How old are you?
            </h2>
            <p className="text-white/60 text-center mb-8">
              This will be shown on your profile
            </p>
            
            {/* Age Display */}
            <div className="text-center mb-8">
              <div className="text-7xl font-bold text-green-400 mb-2">
                {formData.age}
              </div>
              <input
                type="range"
                min="18"
                max="65"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((formData.age - 18) / (65 - 18)) * 100}%, rgba(255,255,255,0.2) ${((formData.age - 18) / (65 - 18)) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <div className="flex justify-between text-white/40 text-sm mt-2">
                <span>18</span>
                <span>65</span>
              </div>
            </div>

            {/* Age Range - SINGLE BAR WITH TWO HANDLES */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold text-lg mb-6 text-center">
                Age range you're looking for
              </h3>
              
              {/* Display Range */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-green-400">
                  {formData.minAge} - {formData.maxAge}
                </div>
                <div className="text-white/60 text-sm mt-1">years old</div>
              </div>

              {/* Visual Range Bar */}
              <div className="relative h-12 mb-8">
                {/* Background */}
                <div className="absolute top-5 left-0 right-0 h-3 bg-white/10 rounded-full"></div>
                
                {/* Active Range */}
                <div 
                  className="absolute top-5 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                  style={{
                    left: `${((formData.minAge - 18) / (65 - 18)) * 100}%`,
                    right: `${100 - ((formData.maxAge - 18) / (65 - 18)) * 100}%`
                  }}
                ></div>
                
                {/* Min Handle */}
                <div 
                  className="absolute top-0 w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold"
                  style={{
                    left: `calc(${((formData.minAge - 18) / (65 - 18)) * 100}% - 24px)`
                  }}
                >
                  {formData.minAge}
                </div>
                
                {/* Max Handle */}
                <div 
                  className="absolute top-0 w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold"
                  style={{
                    left: `calc(${((formData.maxAge - 18) / (65 - 18)) * 100}% - 24px)`
                  }}
                >
                  {formData.maxAge}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Minimum Age: {formData.minAge}</label>
                  <input
                    type="range"
                    min="18"
                    max="65"
                    value={formData.minAge}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value)
                      setFormData({ 
                        ...formData, 
                        minAge: Math.min(newMin, formData.maxAge - 1)
                      })
                    }}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((formData.minAge - 18) / (65 - 18)) * 100}%, rgba(255,255,255,0.2) ${((formData.minAge - 18) / (65 - 18)) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Maximum Age: {formData.maxAge}</label>
                  <input
                    type="range"
                    min="18"
                    max="65"
                    value={formData.maxAge}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value)
                      setFormData({ 
                        ...formData, 
                        maxAge: Math.max(newMax, formData.minAge + 1)
                      })
                    }}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((formData.maxAge - 18) / (65 - 18)) * 100}%, rgba(255,255,255,0.2) ${((formData.maxAge - 18) / (65 - 18)) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Gender */}
        {step === 3 && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="text-6xl mb-6 text-center">⚧️</div>
            <h2 className="text-4xl font-bold text-white text-center mb-4">
              I am a...
            </h2>
            <p className="text-white/60 text-center mb-8">
              Select your gender
            </p>
            
            <div className="space-y-3 mb-8">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                    formData.gender === g
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white/5 backdrop-blur-lg text-white border border-white/10'
                  }`}
                >
                  {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '🌈 Other'}
                </button>
              ))}
            </div>

            <h3 className="text-2xl font-bold text-white text-center mb-4">
              Interested in...
            </h3>
            <div className="space-y-3">
              {['male', 'female', 'everyone'].map((g) => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, interestedIn: g })}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                    formData.interestedIn === g
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white/5 backdrop-blur-lg text-white border border-white/10'
                  }`}
                >
                  {g === 'male' ? '👨 Men' : g === 'female' ? '👩 Women' : '🌈 Everyone'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Bio */}
        {step === 4 && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="text-6xl mb-6 text-center">📝</div>
            <h2 className="text-4xl font-bold text-white text-center mb-4">
              About you
            </h2>
            <p className="text-white/60 text-center mb-8">
              Write a short bio to introduce yourself
            </p>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={5}
              maxLength={500}
              className="w-full px-6 py-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl text-white resize-none focus:outline-none focus:border-green-500 transition-all"
            />
            <p className="text-white/40 text-sm text-right mt-2">
              {formData.bio.length}/500
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-20">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-8 py-4 bg-white/5 backdrop-blur-lg text-white rounded-2xl border border-white/10 hover:bg-white/10 transition-all font-semibold"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && !formData.name) ||
              (step === 3 && (!formData.gender || !formData.interestedIn))
            }
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === totalSteps ? 'Complete' : 'Continue'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 4px 12px rgba(0,0,0,0.4);
          border: 4px solid white;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 4px 12px rgba(0,0,0,0.4);
          border: 4px solid white;
        }
      `}</style>
    </div>
  )
}
