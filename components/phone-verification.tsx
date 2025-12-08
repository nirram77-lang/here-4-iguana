'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, Shield, ArrowLeft, RefreshCw, CheckCircle, Sparkles } from 'lucide-react'

interface PhoneVerificationProps {
  onComplete: (phoneNumber: string) => void
  onSkip?: () => void
  userId: string
  userEmail?: string
  showSkip?: boolean
}

// Demo mode: These numbers don't send real SMS
const DEMO_PREFIXES = ['+97250000', '+972500000']
const DEMO_CODE = '123456'

export default function PhoneVerification({ 
  onComplete, 
  onSkip,
  userId, 
  userEmail,
  showSkip = false 
}: PhoneVerificationProps) {
  // States
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone')
  const [localNumber, setLocalNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  // Full phone number with country code
  const fullPhoneNumber = `+972${localNumber}`
  
  // Refs for code inputs
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Check if demo mode
  useEffect(() => {
    const isDemo = localNumber.startsWith('50000') || localNumber.startsWith('500000')
    setIsDemoMode(isDemo)
  }, [localNumber])

  // Format phone number for display
  const formatPhoneDisplay = (phone: string) => {
    if (phone.length <= 2) return `+972-${phone}`
    if (phone.length <= 5) return `+972-${phone.slice(0,2)}-${phone.slice(2)}`
    return `+972-${phone.slice(0,2)}-${phone.slice(2,5)}-${phone.slice(5)}`
  }

  // Format local number input (remove leading 0 if present)
  const handleLocalNumberChange = (value: string) => {
    let cleaned = value.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }
    setLocalNumber(cleaned.slice(0, 9))
  }

  // Format for display with dashes
  const formatLocalDisplay = (num: string) => {
    if (num.length <= 2) return num
    if (num.length <= 5) return `${num.slice(0,2)}-${num.slice(2)}`
    return `${num.slice(0,2)}-${num.slice(2,5)}-${num.slice(5)}`
  }

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newCode = [...verificationCode]
    newCode[index] = digit
    setVerificationCode(newCode)
    
    // Auto-focus next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
    
    // Auto-submit when complete
    if (digit && index === 5) {
      const fullCode = newCode.join('')
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode)
      }
    }
  }

  // Handle backspace
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pasted.split('')
    while (newCode.length < 6) newCode.push('')
    setVerificationCode(newCode)
    
    if (pasted.length === 6) {
      handleVerifyCode(pasted)
    }
  }

  // Send verification code via SMS
  const handleSendCode = async () => {
    // Validation - Israeli mobile is 9 digits
    if (localNumber.length < 9) {
      setError('Please enter a valid phone number (9 digits)')
      return
    }
    
    // Validate starts with 5 (Israeli mobile)
    if (!localNumber.startsWith('5')) {
      setError('Please enter a valid Israeli mobile number (starts with 05)')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📱 Sending SMS to:', fullPhoneNumber)
      
      // Check if demo mode
      if (isDemoMode) {
        console.log('🧪 DEMO MODE - No real SMS sent')
        console.log('🔑 Demo code is: ' + DEMO_CODE)
        setConfirmationResult({ isDemoMode: true })
        setStep('code')
        setResendTimer(60)
        setLoading(false)
        return
      }
      
      // Real SMS verification
      const { sendPhoneVerification } = await import('@/lib/phone-verification-service')
      const result = await sendPhoneVerification(fullPhoneNumber)
      setConfirmationResult(result)
      setStep('code')
      setResendTimer(60)
      console.log('✅ SMS sent successfully')
    } catch (err: any) {
      console.error('❌ Error sending SMS:', err)
      setError(err.message || 'Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Verify the entered code
  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || verificationCode.join('')
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔐 Verifying code:', codeToVerify)
      
      // Demo mode check
      if (confirmationResult?.isDemoMode) {
        if (codeToVerify === DEMO_CODE) {
          console.log('✅ Demo code verified!')
          await linkPhoneToUser()
          setStep('success')
          setTimeout(() => onComplete(fullPhoneNumber), 1500)
        } else {
          setError('Invalid code. Demo code is: ' + DEMO_CODE)
        }
        setLoading(false)
        return
      }
      
      // Real verification
      console.log('🔐 Calling verifyPhoneCode with confirmationResult:', confirmationResult)
      const { verifyPhoneCode } = await import('@/lib/phone-verification-service')
      await verifyPhoneCode(confirmationResult, codeToVerify)
      
      // Link phone to user
      await linkPhoneToUser()
      
      setStep('success')
      console.log('✅ Code verified successfully!')
      
      // Wait for animation then complete
      setTimeout(() => onComplete(fullPhoneNumber), 1500)
    } catch (err: any) {
      console.error('❌ Error verifying code:', err)
      
      // User-friendly error messages
      let errorMessage = 'Invalid code. Please try again.'
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid code. Please check and try again.'
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'Code expired. Please request a new one.'
        setResendTimer(0) // Allow immediate resend
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = '⏳ Too many attempts. Please wait 1 hour before trying again, or use a different phone number.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Resend verification code
  const handleResendCode = async () => {
    setVerificationCode(['', '', '', '', '', ''])
    setError('')
    setLoading(true)

    try {
      console.log('🔄 Resending SMS to:', fullPhoneNumber)
      
      if (isDemoMode) {
        console.log('🧪 DEMO MODE - Resend')
        setResendTimer(60)
        setLoading(false)
        return
      }
      
      const { sendPhoneVerification } = await import('@/lib/phone-verification-service')
      const result = await sendPhoneVerification(fullPhoneNumber)
      setConfirmationResult(result)
      setResendTimer(60)
      console.log('✅ SMS resent successfully')
    } catch (err: any) {
      console.error('❌ Error resending SMS:', err)
      setError(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Link phone to user profile in Firestore
  const linkPhoneToUser = async () => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      await updateDoc(doc(db, 'users', userId), {
        phoneNumber: fullPhoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date().toISOString()
      })
      
      // Cache verification status
      localStorage.setItem('i4iguana_phone_verified', 'true')
      
      console.log('✅ Phone linked to user profile')
    } catch (err) {
      console.error('❌ Error linking phone:', err)
    }
  }

  // Go back to phone input
  const handleBack = () => {
    setStep('phone')
    setVerificationCode(['', '', '', '', '', ''])
    setError('')
    setConfirmationResult(null)
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/50">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Verified!</h1>
          <p className="text-white/60">Your phone has been verified successfully</p>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-green-400 font-medium">Setting up your profile...</span>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHONE INPUT & CODE VERIFICATION SCREENS
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center">
        {step === 'code' && (
          <button
            onClick={handleBack}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {step === 'phone' ? (
          // ═══════════════════════════════════════════
          // STEP 1: Phone Number Input
          // ═══════════════════════════════════════════
          <div className="w-full max-w-sm space-y-8 animate-fadeIn">
            {/* Icon */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                <Phone className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">Verify Your Phone</h1>
              <p className="text-white/60">
                We'll send you a verification code via SMS
              </p>
            </div>

            {/* Phone Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-3">
                  Mobile Number
                </label>
                <div className="flex items-center gap-2">
                  {/* Country Code - Fixed */}
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-3 border border-white/20">
                    <span className="text-xl">🇮🇱</span>
                    <span className="text-white text-lg font-bold">+972</span>
                  </div>
                  
                  {/* Local Number Input */}
                  <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 border border-white/20 focus-within:border-green-400/50 transition-colors">
                    <input
                      type="tel"
                      value={formatLocalDisplay(localNumber)}
                      onChange={(e) => handleLocalNumberChange(e.target.value)}
                      placeholder="52-265-3170"
                      className="w-full bg-transparent text-white text-xl font-medium focus:outline-none placeholder-white/30"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                      disabled={loading}
                      autoComplete="tel-local"
                    />
                  </div>
                </div>
                
                {/* Helper Text */}
                <p className="text-white/40 text-xs mt-2 text-center">
                  Enter without leading 0 (e.g., 52-265-3170)
                </p>
              </div>

              {/* Demo Mode Indicator */}
              {isDemoMode && (
                <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 text-center">
                  <p className="text-yellow-300 text-sm">
                    🧪 Demo Mode - Code will be: <span className="font-bold">{DEMO_CODE}</span>
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-center animate-shake">
                  <p className="text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendCode}
              disabled={loading || localNumber.length < 9}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>

            {/* Skip Button (Dev Only) */}
            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="w-full py-3 bg-white/10 text-white/60 rounded-xl hover:bg-white/20 transition-colors"
              >
                🔧 SKIP (Dev Mode)
              </button>
            )}

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
              <Shield className="w-4 h-4" />
              <span>Your data is encrypted & secure</span>
            </div>
          </div>
        ) : (
          // ═══════════════════════════════════════════
          // STEP 2: Verification Code Input
          // ═══════════════════════════════════════════
          <div className="w-full max-w-sm space-y-8 animate-fadeIn">
            {/* Icon */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">Enter Code</h1>
              <p className="text-white/60">
                Sent to {formatPhoneDisplay(localNumber)}
              </p>
            </div>

            {/* Code Input - 6 Boxes */}
            <div 
              className="flex justify-center gap-2"
              onPaste={handleCodePaste}
            >
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { codeInputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-12 h-14 bg-white/10 border-2 border-white/30 rounded-xl text-center text-white text-2xl font-bold focus:outline-none focus:border-green-400 focus:bg-white/20 transition-all"
                  maxLength={1}
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Demo Mode Reminder */}
            {isDemoMode && (
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">
                  🧪 Demo Mode - Enter: <span className="font-bold">{DEMO_CODE}</span>
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-center animate-shake">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerifyCode()}
              disabled={loading || verificationCode.join('').length !== 6}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>

            {/* Resend Section - ALWAYS VISIBLE */}
            <div className="text-center space-y-3">
              {resendTimer > 0 ? (
                <p className="text-white/40">
                  Resend code in <span className="text-white font-bold">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  🔄 Resend Code
                </button>
              )}
              
              {/* Change number option */}
              <button
                onClick={handleBack}
                className="text-white/40 hover:text-white/60 text-sm underline"
              >
                Change phone number
              </button>
            </div>

            {/* Skip Button (Dev Only) */}
            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="w-full py-3 bg-white/10 text-white/60 rounded-xl hover:bg-white/20 transition-colors"
              >
                🔧 SKIP (Dev Mode)
              </button>
            )}
          </div>
        )}
      </div>

      {/* reCAPTCHA container - invisible */}
      <div id="recaptcha-container"></div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
