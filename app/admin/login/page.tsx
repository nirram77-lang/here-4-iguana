"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogIn, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { adminLogin } from '@/lib/admin-auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔐 Admin login attempt:', email)
      
      const { adminData } = await adminLogin(email, password)
      
      console.log('✅ Admin login successful:', adminData.role)
      
      // Redirect based on role
      if (adminData.role === 'super') {
        router.push('/admin/super')
      } else if (adminData.role === 'venue') {
        router.push('/admin/venue')
      }
      
    } catch (error: any) {
      console.error('❌ Login error:', error)
      setError(error.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="text-8xl mb-4"
          >
            🦎
          </motion.div>
          
          <h1 className="text-4xl font-black text-white mb-2">
            IGUANA BAR
          </h1>
          <p className="text-[#4ade80] text-lg font-semibold">
            Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-3xl p-8 shadow-2xl">
          
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                disabled={loading}
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] rounded-2xl shadow-lg shadow-[#4ade80]/30"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-2xl"
                >
                  🔄
                </motion.div>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Login to Admin Panel
                </>
              )}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              Admin access only. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Back to App */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-white/60 hover:text-white text-sm font-medium transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </motion.div>
    </div>
  )
}
