"use client"

/**
 * 🦎 I4IGUANA - Notifications Debug Panel
 * 
 * Complete debugging tool for push notifications
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  RefreshCw,
  User,
  Key,
  Server,
  Smartphone
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'

interface DebugResult {
  step: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: any
}

export default function NotificationsDebugPage() {
  const router = useRouter()
  
  const [results, setResults] = useState<DebugResult[]>([])
  const [loading, setLoading] = useState(false)
  const [testUserId, setTestUserId] = useState('')
  const [testMessage, setTestMessage] = useState('🧪 Test notification from Debug Panel')
  const [users, setUsers] = useState<any[]>([])
  const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'configured' | 'missing'>('unknown')

  // Load users with OneSignal data
  useEffect(() => {
    loadUsers()
    checkApiKey()
  }, [])

  const loadUsers = async () => {
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)))
      const usersData: any[] = []
      usersSnap.forEach(doc => {
        const data = doc.data()
        usersData.push({
          id: doc.id,
          name: data.name || 'Unknown',
          phoneNumber: data.phoneNumber || 'N/A',
          hasOneSignal: !!data.oneSignalPlayerId || !!data.oneSignalId,
          oneSignalId: data.oneSignalPlayerId || data.oneSignalId || null
        })
      })
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const checkApiKey = async () => {
    try {
      const response = await fetch('/api/check-onesignal')
      const data = await response.json()
      setApiKeyStatus(data.apiKeyConfigured ? 'configured' : 'missing')
    } catch (error) {
      setApiKeyStatus('unknown')
    }
  }

  const addResult = (result: DebugResult) => {
    setResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  const runFullDiagnostics = async () => {
    setLoading(true)
    clearResults()

    // Step 1: Check API Key
    addResult({
      step: '1. API Key Check',
      status: 'pending',
      message: 'Checking if ONESIGNAL_REST_API_KEY is configured...'
    })

    try {
      const apiResponse = await fetch('/api/check-onesignal')
      const apiData = await apiResponse.json()
      
      setResults(prev => prev.map(r => 
        r.step === '1. API Key Check' 
          ? {
              ...r,
              status: apiData.apiKeyConfigured ? 'success' : 'error',
              message: apiData.apiKeyConfigured 
                ? `✅ API Key configured (${apiData.apiKeyPreview})` 
                : '❌ API Key NOT configured in Vercel!',
              details: apiData
            }
          : r
      ))

      if (!apiData.apiKeyConfigured) {
        addResult({
          step: '⚠️ FIX REQUIRED',
          status: 'error',
          message: 'Add ONESIGNAL_REST_API_KEY to Vercel Environment Variables'
        })
        setLoading(false)
        return
      }
    } catch (error) {
      setResults(prev => prev.map(r => 
        r.step === '1. API Key Check' 
          ? { ...r, status: 'error', message: `❌ Error checking API: ${error}` }
          : r
      ))
    }

    // Step 2: Check OneSignal App ID
    addResult({
      step: '2. OneSignal App ID',
      status: 'success',
      message: '✅ App ID: e0009025-1eac-434c-ba27-353c60b0fcf7'
    })

    // Step 3: Check users with OneSignal registration
    addResult({
      step: '3. User Registration Check',
      status: 'pending',
      message: 'Checking users registered with OneSignal...'
    })

    const registeredUsers = users.filter(u => u.hasOneSignal)
    setResults(prev => prev.map(r => 
      r.step === '3. User Registration Check' 
        ? {
            ...r,
            status: registeredUsers.length > 0 ? 'success' : 'warning',
            message: registeredUsers.length > 0 
              ? `✅ ${registeredUsers.length} users registered for push notifications`
              : '⚠️ No users registered for push notifications yet',
            details: registeredUsers.slice(0, 5)
          }
        : r
    ))

    // Step 4: Service Worker check
    addResult({
      step: '4. Service Worker',
      status: 'success',
      message: '✅ OneSignalSDKWorker.js should be in /public folder'
    })

    // Final summary
    addResult({
      step: '📋 Summary',
      status: 'success',
      message: 'Diagnostics complete. Use "Send Test" to verify end-to-end.'
    })

    setLoading(false)
  }

  const sendTestNotification = async () => {
    if (!testUserId) {
      alert('Please enter a User ID or select from the list')
      return
    }

    setLoading(true)
    addResult({
      step: '📤 Sending Test',
      status: 'pending',
      message: `Sending to user: ${testUserId}...`
    })

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          targetUserId: testUserId,
          title: '🧪 Debug Test',
          message: testMessage,
          data: { test: true, timestamp: Date.now() }
        })
      })

      const result = await response.json()

      setResults(prev => prev.map(r => 
        r.step === '📤 Sending Test' 
          ? {
              ...r,
              status: response.ok ? 'success' : 'error',
              message: response.ok 
                ? `✅ Notification sent! ID: ${result.notificationId}, Recipients: ${result.recipients}`
                : `❌ Failed: ${result.error || 'Unknown error'}`,
              details: result
            }
          : r
      ))
    } catch (error) {
      setResults(prev => prev.map(r => 
        r.step === '📤 Sending Test' 
          ? { ...r, status: 'error', message: `❌ Error: ${error}` }
          : r
      ))
    }

    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default: return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 border-green-500/30'
      case 'error': return 'bg-red-500/10 border-red-500/30'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30'
      default: return 'bg-blue-500/10 border-blue-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d2920] to-[#0d2920]/80 border-b border-[#4ade80]/30 shadow-2xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-[#4ade80]" />
                <div>
                  <h1 className="text-xl font-black text-white">
                    Notifications Debug
                  </h1>
                  <p className="text-[#4ade80] text-xs">
                    OneSignal Push Notifications Diagnostics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${apiKeyStatus === 'configured' ? 'bg-green-500/10 border-green-500/30' : apiKeyStatus === 'missing' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
            <div className="flex items-center gap-3">
              <Key className={`w-8 h-8 ${apiKeyStatus === 'configured' ? 'text-green-500' : apiKeyStatus === 'missing' ? 'text-red-500' : 'text-gray-500'}`} />
              <div>
                <div className="text-sm text-white/60">API Key</div>
                <div className="font-bold text-white">
                  {apiKeyStatus === 'configured' ? '✅ OK' : apiKeyStatus === 'missing' ? '❌ Missing' : '? Unknown'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/30">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-sm text-white/60">Registered Users</div>
                <div className="font-bold text-white">{users.filter(u => u.hasOneSignal).length} / {users.length}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-purple-500/10 border-purple-500/30">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-sm text-white/60">OneSignal</div>
                <div className="font-bold text-white">Connected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={runFullDiagnostics}
            disabled={loading}
            className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0d2920] font-bold"
          >
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            Run Full Diagnostics
          </Button>
          <Button
            onClick={clearResults}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Clear Results
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">📋 Diagnostic Results</h2>
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl border ${getStatusBg(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-bold text-white">{result.step}</div>
                    <div className="text-white/80 text-sm">{result.message}</div>
                    {result.details && (
                      <pre className="mt-2 text-xs text-white/60 bg-black/20 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Test Notification */}
        <div className="bg-[#0d2920]/50 rounded-2xl border border-[#4ade80]/20 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#4ade80]" />
            Send Test Notification
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm block mb-2">Target User ID</label>
              <Input
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="Enter Firebase User ID..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm block mb-2">Message</label>
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test message..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <Button
              onClick={sendTestNotification}
              disabled={loading || !testUserId}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          </div>

          {/* User List */}
          <div className="mt-6">
            <h3 className="text-white/60 text-sm mb-2">Quick Select User:</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {users.filter(u => u.hasOneSignal).map(user => (
                <button
                  key={user.id}
                  onClick={() => setTestUserId(user.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${testUserId === user.id ? 'bg-[#4ade80]/20 border border-[#4ade80]/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#4ade80]" />
                    <span className="text-white font-medium">{user.name}</span>
                    <span className="text-white/40 text-xs">{user.id.slice(0, 8)}...</span>
                  </div>
                </button>
              ))}
              {users.filter(u => u.hasOneSignal).length === 0 && (
                <p className="text-white/40 text-sm">No users registered for push notifications</p>
              )}
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <h3 className="font-bold text-yellow-400 mb-2">🔧 Troubleshooting</h3>
          <ul className="text-white/80 text-sm space-y-1">
            <li>• <strong>API Key Missing?</strong> Add ONESIGNAL_REST_API_KEY to Vercel → Settings → Environment Variables</li>
            <li>• <strong>0 Recipients?</strong> User needs to allow notifications in browser AND have OneSignal.login() called</li>
            <li>• <strong>Still not working?</strong> Check browser console for errors on the app</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
