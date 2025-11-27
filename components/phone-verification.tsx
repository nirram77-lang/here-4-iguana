'use client'

import { useState, useEffect } from 'react'
import { sendPhoneVerification, verifyPhoneCode } from '@/lib/phone-verification-service'
import type { ConfirmationResult } from 'firebase/auth'

interface PhoneVerificationProps {
  onComplete: () => void
  userId: string
}

export default function PhoneVerification({ onComplete, userId }: PhoneVerificationProps) {
  // States
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('+972')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Format phone number input
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits except the leading +
    const cleaned = value.replace(/[^\d+]/g, '')
    
    // Ensure it starts with +972
    if (!cleaned.startsWith('+972')) {
      return '+972'
    }
    
    // Limit to Israeli format: +972XXXXXXXXX (max 13 chars)
    return cleaned.slice(0, 13)
  }

  // Send verification code via SMS
  const handleSendCode = async () => {
    // Validation
    if (phoneNumber.length < 13) {
      setError('מספר טלפון לא תקין. יש להזין 10 ספרות')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📱 Sending SMS to:', phoneNumber)
      const result = await sendPhoneVerification(phoneNumber)
      setConfirmationResult(result)
      setStep('code')
      setResendTimer(60) // 60 seconds cooldown
      console.log('✅ SMS sent successfully')
    } catch (err: any) {
      console.error('❌ Error sending SMS:', err)
      setError(err.message || 'שגיאה בשליחת קוד אימות')
    } finally {
      setLoading(false)
    }
  }

  // Verify the entered code
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('יש להזין קוד בן 6 ספרות')
      return
    }

    if (!confirmationResult) {
      setError('שגיאה: אין תוצאת אימות. אנא שלח קוד מחדש')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔐 Verifying code...')
      await verifyPhoneCode(confirmationResult, verificationCode)
      console.log('✅ Code verified successfully!')
      onComplete()
    } catch (err: any) {
      console.error('❌ Error verifying code:', err)
      setError(err.message || 'קוד שגוי. אנא נסה שנית')
    } finally {
      setLoading(false)
    }
  }

  // Resend code
  const handleResendCode = async () => {
    setVerificationCode('')
    await handleSendCode()
  }

  // Go back to phone input
  const handleBackToPhone = () => {
    setStep('phone')
    setVerificationCode('')
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🦎</div>
          <h1 className="text-3xl font-bold text-emerald-600 mb-2">אימות זהות</h1>
          <p className="text-gray-600">
            {step === 'phone' 
              ? 'נשלח לך קוד אימות ב-SMS'
              : 'הזן את הקוד שקיבלת'
            }
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {step === 'phone' ? (
            // Step 1: Phone Number Input
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  מספר טלפון נייד
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  placeholder="+972501234567"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 text-lg text-center font-mono transition-colors"
                  disabled={loading}
                  maxLength={13}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  פורמט: +972 ואחריו 9 ספרות
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-center animate-shake">
                  {error}
                </div>
              )}

              <button
                onClick={handleSendCode}
                disabled={loading || phoneNumber.length < 13}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    שולח...
                  </span>
                ) : (
                  'שלח קוד אימות'
                )}
              </button>
            </>
          ) : (
            // Step 2: Verification Code Input
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  קוד אימות בן 6 ספרות
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setVerificationCode(value)
                  }}
                  placeholder="● ● ● ● ● ●"
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 text-2xl text-center font-bold tracking-widest transition-colors"
                  disabled={loading}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  נשלח אל {phoneNumber}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-center animate-shake">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    מאמת...
                  </span>
                ) : (
                  'אמת קוד'
                )}
              </button>

              {/* Resend Code Button */}
              <div className="text-center space-y-2">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-500">
                    ניתן לשלוח קוד מחדש בעוד {resendTimer} שניות
                  </p>
                ) : (
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm underline disabled:opacity-50"
                  >
                    שלח קוד מחדש
                  </button>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={handleBackToPhone}
                disabled={loading}
                className="w-full text-gray-600 hover:text-gray-800 font-medium text-sm py-2 disabled:opacity-50"
              >
                ← חזור לשינוי מספר טלפון
              </button>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 המידע שלך מוגן ומוצפן במלואו
          </p>
        </div>
      </div>

      {/* reCAPTCHA container - invisible */}
      <div id="recaptcha-container"></div>
    </div>
  )
}
