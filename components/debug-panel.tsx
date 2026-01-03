"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Trash2, Download, CheckCircle, Bell } from 'lucide-react'
import { getOneSignalDebugInfo } from '@/lib/onesignal'

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

// ✅ Global log storage - captures all console.log calls
const MAX_LOGS = 200
let globalLogs: { time: string; type: string; message: string }[] = []

// ✅ Override console methods to capture logs
if (typeof window !== 'undefined') {
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  
  const addLog = (type: string, args: any[]) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
    
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')
    
    globalLogs.push({ time, type, message })
    
    // Keep only last MAX_LOGS
    if (globalLogs.length > MAX_LOGS) {
      globalLogs = globalLogs.slice(-MAX_LOGS)
    }
  }
  
  console.log = (...args) => {
    addLog('log', args)
    originalLog.apply(console, args)
  }
  
  console.warn = (...args) => {
    addLog('warn', args)
    originalWarn.apply(console, args)
  }
  
  console.error = (...args) => {
    addLog('error', args)
    originalError.apply(console, args)
  }
}

export default function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [logs, setLogs] = useState<typeof globalLogs>([])
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all')
  const [oneSignalInfo, setOneSignalInfo] = useState<any>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  // ✅ Refresh logs when panel opens
  useEffect(() => {
    if (isOpen) {
      setLogs([...globalLogs])
    }
  }, [isOpen])
  
  // ✅ Auto-refresh logs every second when open
  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(() => {
      setLogs([...globalLogs])
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isOpen])
  
  // ✅ Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])
  
  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter)
  
  const handleCopy = async () => {
    const text = filteredLogs.map(log => 
      `[${log.time}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n')
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for iOS
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleClear = () => {
    globalLogs = []
    setLogs([])
  }
  
  // ✅ NEW: Check OneSignal status
  const checkOneSignal = async () => {
    console.log('🔍 Checking OneSignal status...')
    const info = await getOneSignalDebugInfo()
    setOneSignalInfo(info)
  }
  
  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      default: return 'text-green-400'
    }
  }
  
  const getLogBg = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500/10'
      case 'warn': return 'bg-yellow-500/10'
      default: return ''
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐛</span>
                <h2 className="text-white font-bold text-lg">Debug Panel</h2>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                  {filteredLogs.length} logs
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Filter + Actions */}
            <div className="flex items-center justify-between gap-2">
              {/* Filter buttons */}
              <div className="flex gap-1">
                {(['all', 'log', 'warn', 'error'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      filter === f 
                        ? 'bg-[#4ade80] text-black' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'log' ? '📝' : f === 'warn' ? '⚠️' : '❌'}
                  </button>
                ))}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy All
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
                
                <button
                  onClick={checkOneSignal}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                >
                  <Bell className="h-3.5 w-3.5" />
                  OneSignal
                </button>
              </div>
            </div>
            
            {/* ✅ NEW: OneSignal Status Card */}
            {oneSignalInfo && (
              <div className="mt-3 p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <div className="text-sm font-bold text-purple-300 mb-2">🔔 OneSignal Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">SDK:</span>
                    <span className={oneSignalInfo.sdkLoaded ? 'text-green-400' : 'text-red-400'}>
                      {oneSignalInfo.sdkLoaded ? '✅ Loaded' : '❌ Not Loaded'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Permission:</span>
                    <span className={oneSignalInfo.permission === 'granted' ? 'text-green-400' : 'text-yellow-400'}>
                      {oneSignalInfo.permission}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Subscribed:</span>
                    <span className={oneSignalInfo.subscribed ? 'text-green-400' : 'text-red-400'}>
                      {oneSignalInfo.subscribed ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">External ID:</span>
                    <span className={oneSignalInfo.externalId ? 'text-green-400' : 'text-red-400'}>
                      {oneSignalInfo.externalId ? oneSignalInfo.externalId.substring(0, 8) + '...' : '❌ Not Set'}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-between">
                    <span className="text-zinc-400">Player ID:</span>
                    <span className={oneSignalInfo.playerId ? 'text-green-400' : 'text-red-400'}>
                      {oneSignalInfo.playerId ? oneSignalInfo.playerId.substring(0, 12) + '...' : '❌ None'}
                    </span>
                  </div>
                </div>
                {!oneSignalInfo.externalId && (
                  <div className="mt-2 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded">
                    ⚠️ External ID not set! Push notifications from app won't work.
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Logs */}
          <div className="h-[calc(100vh-120px)] overflow-y-auto p-2">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <span className="text-4xl mb-2">📋</span>
                <p>No logs yet</p>
                <p className="text-xs mt-1">Interact with the app to see logs</p>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${getLogBg(log.type)}`}
                  >
                    <span className="text-zinc-500">[{log.time}]</span>
                    {' '}
                    <span className={getLogColor(log.type)}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
          
          {/* Footer hint */}
          <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-2">
            <p className="text-center text-zinc-500 text-xs">
              💡 Copy logs and send via WhatsApp to report bugs
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ✅ Export function to add custom logs
export const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`🔧 ${message}`, data)
  } else {
    console.log(`🔧 ${message}`)
  }
}
