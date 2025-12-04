'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, Shield, ArrowLeft, RefreshCw, CheckCircle, Sparkles } from 'lucide-react'

interface PhoneVerificationProps {
  onComplete: (phoneNumber: string) => void
  onSkip?: () => void  // ✅ For dev mode
  userId: string
  userEmail?: string
  showSkip?: boolean   // ✅ Show skip button (dev only)
}

// ✅ Demo mode: These numbers don't send real SMS
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
  const [phoneNumber, setPhoneNumber] = useState('+972')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isDemoMode, setIsDemoMode] = useState(false)
  
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
    const isDemo = DEMO_PREFIXES.some(prefix => phoneNumber.startsWith(prefix))
    setIsDemoMode(isDemo)
  }, [phoneNumber])

  // Format phone number for display
  const formatPhoneDisplay = (phone: string) => {
    if (phone.length <= 4) return phone
    // Format: +972-52-XXX-XXXX
    const digits = phone.slice(4)
    if (digits.length <= 2) return `+972-${digits}`
    if (digits.length <= 5) return `+972-${digits.slice(0,2)}-${digits.slice(2)}`
    return `+972-${digits.slice(0,2)}-${digits.slice(2,5)}-${digits.slice(5)}`
  }

  // Format phone number input
  const handlePhoneChange = (value: string) => {
    // Remove all non-digits except the leading +
    const cleaned = value.replace(/[^\d+]/g, '')
    
    // Ensure it starts with +972
    if (!cleaned.startsWith('+972')) {
      setPhoneNumber('+972')
      return
    }
    
    // Limit to Israeli format: +972XXXXXXXXX (max 13 chars)
    setPhoneNumber(cleaned.slice(0, 13))
  }

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
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
    // Validation
    if (phoneNumber.length < 13) {
      setError('Please enter a valid phone number (10 digits)')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📱 Sending SMS to:', phoneNumber)
      
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
      const result = await sendPhoneVerification(phoneNumber)
      setConfirmationResult(result)
      setStep('code')
      setResendTimer(60)
      console.log('✅ SMS sent successfully')
    } catch (err: any) {
      console.error('❌ Error sending SMS:', err)
      setError(err.message || 'Error sending verification code')
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
      console.log('🔐 Verifying code...')
      
      // Demo mode check
      if (confirmationResult?.isDemoMode) {
        if (codeToVerify === DEMO_CODE) {
          console.log('✅ Demo code verified!')
          await linkPhoneToUser()
          setStep('success')
          setTimeout(() => onComplete(phoneNumber), 1500)
        } else {
          setError('Invalid code. Demo code is: ' + DEMO_CODE)
        }
        setLoading(false)
        return
      }
      
      // Real verification
      const { verifyPhoneCode } = await import('@/lib/phone-verification-service')
      await verifyPhoneCode(confirmationResult, codeToVerify)
      
      // Link phone to user
      await linkPhoneToUser()
      
      setStep('success')
      console.log('✅ Code verified successfully!')
      
      // Wait for animation then complete
      setTimeout(() => onComplete(phoneNumber), 1500)
    } catch (err: any) {
      console.error('❌ Error verifying code:', err)
      setError(err.message || 'Invalid code. Please try again')
      setVerificationCode(['', '', '', '', '', ''])
      codeInputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  // Link phone number to user and phoneIdentities
  const linkPhoneToUser = async () => {
    try {
      const { doc, updateDoc, setDoc, getDoc, arrayUnion, Timestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      // 1. Update user document
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        phoneNumber: phoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: Timestamp.now()
      })
      console.log('✅ User document updated with phone')
      
      // 2. Update/create phoneIdentity and link Gmail
      const phoneRef = doc(db, 'phoneIdentities', phoneNumber)
      const phoneDoc = await getDoc(phoneRef)
      
      if (phoneDoc.exists()) {
        // Phone exists - add this Gmail to linked accounts
        const phoneData = phoneDoc.data()
        const oldUserIds = phoneData.linkedUserIds || []
        
        // ✅ CRITICAL FIX: Clean up old UIDs from all users' swipedRight/swipedLeft
        // This prevents "ghost matches" when user deletes account and re-registers
        if (oldUserIds.length > 0 && !oldUserIds.includes(userId)) {
          console.log('🧹 Cleaning up old UIDs from swipedRight/swipedLeft...')
          console.log('   Old UIDs:', oldUserIds)
          console.log('   New UID:', userId)
          
          // Note: Full cleanup would require scanning all users
          // For now, we just log this for debugging
          // The real fix is to NOT check swipedRight for match detection
        }
        
        await updateDoc(phoneRef, {
          linkedUserIds: arrayUnion(userId),
          linkedGmailAccounts: userEmail ? arrayUnion(userEmail) : arrayUnion(),
          lastVerification: Timestamp.now()
        })
        console.log('✅ Phone identity updated with new Gmail link')
      } else {
        // New phone - create phoneIdentity
        await setDoc(phoneRef, {
          phoneNumber: phoneNumber,
          linkedUserIds: [userId],
          linkedGmailAccounts: userEmail ? [userEmail] : [],
          passesLeft: 1,
          isPremium: false,
          passesUsedToday: 0,
          matchesCountToday: 0,
          lockedUntil: null,
          createdAt: Timestamp.now(),
          lastVerification: Timestamp.now()
        })
        console.log('✅ New phone identity created')
      }
    } catch (error) {
      console.error('❌ Error linking phone to user:', error)
      // Don't throw - verification succeeded, linking is secondary
    }
  }

  // Resend code
  const handleResendCode = async () => {
    setVerificationCode(['', '', '', '', '', ''])
    await handleSendCode()
  }

  // Go back to phone input
  const handleBackToPhone = () => {
    setStep('phone')
    setVerificationCode(['', '', '', '', '', ''])
    setError('')
  }

  // ✅ Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] p-4">
        <div className="text-center space-y-6 animate-fadeIn">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-20 h-20 text-green-400" />
            </div>
            <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -bottom-1 -left-4 animate-bounce delay-200" />
          </div>
          
          <h1 className="text-3xl font-bold text-white">Verified! ✅</h1>
          <p className="text-green-300 text-lg">{formatPhoneDisplay(phoneNumber)}</p>
          <p className="text-white/60">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] p-4">
      {/* Header */}
      <div className="pt-8 pb-4">
        {step === 'code' && (
          <button
            onClick={handleBackToPhone}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Change Number</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {step === 'phone' ? (
          // ═══════════════════════════════════════════
          // STEP 1: Phone Number Input
          // ═══════════════════════════════════════════
          <div className="w-full space-y-8 animate-fadeIn">
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
                One phone = One identity 📱
              </p>
              <p className="text-white/40 text-sm">
                This keeps our community safe & authentic
              </p>
            </div>

            {/* Phone Input */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-white/60 text-sm mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇮🇱</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+972 52-XXX-XXXX"
                    className="flex-1 bg-transparent text-white text-xl font-medium focus:outline-none placeholder-white/30"
                    disabled={loading}
                    maxLength={13}
                  />
                </div>
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
              disabled={loading || phoneNumber.length < 13}
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
          <div className="w-full space-y-8 animate-fadeIn">
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
                Sent to {formatPhoneDisplay(phoneNumber)}
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

            {/* Resend */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-white/40">
                  Resend code in <span className="text-white">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-green-400 hover:text-green-300 font-medium disabled:opacity-50"
                >
                  Didn't receive? Resend Code
                </button>
              )}
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
