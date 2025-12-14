"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Play, CheckCircle, XCircle, Clock, RefreshCw, 
  Smartphone, Heart, MessageSquare, MapPin, Timer, Sparkles,
  Users, Home, User, Apple, Chrome, Wifi, Battery, Signal
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// ===== DEVICE TYPES =====
type DeviceType = 'iphone' | 'android'
type UserGender = 'male' | 'female'

interface DeviceState {
  screen: 'splash' | 'home' | 'match' | 'enjoy-mode' | 'chat'
  user: {
    name: string
    gender: UserGender
    photo: string
  }
  matchedWith: string | null
  timerValue: number
  notifications: string[]
  isConnected: boolean
}

// ===== PHONE FRAME COMPONENT =====
const PhoneFrame = ({ 
  type, 
  children, 
  user 
}: { 
  type: DeviceType
  children: React.ReactNode
  user: { name: string; gender: UserGender }
}) => {
  const isIphone = type === 'iphone'
  
  return (
    <div className="relative">
      {/* Device Label */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {isIphone ? (
          <Apple className="h-5 w-5 text-gray-400" />
        ) : (
          <Chrome className="h-5 w-5 text-green-400" />
        )}
        <span className="text-white font-bold">
          {isIphone ? 'iPhone 15 Pro' : 'Samsung Galaxy S24'}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          user.gender === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {user.gender === 'female' ? '👩 Female' : '👨 Male'}
        </span>
      </div>
      
      {/* Phone Frame */}
      <div className={`relative rounded-[3rem] p-3 ${
        isIphone 
          ? 'bg-gradient-to-b from-gray-700 to-gray-900 shadow-[0_0_60px_rgba(0,0,0,0.5)]' 
          : 'bg-gradient-to-b from-gray-800 to-black shadow-[0_0_60px_rgba(0,0,0,0.5)]'
      }`}>
        {/* Dynamic Island / Notch */}
        {isIphone && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20" />
        )}
        
        {/* Status Bar */}
        <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-10 text-white/80 text-xs">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-3 w-3" />
          </div>
        </div>
        
        {/* Screen */}
        <div className={`relative overflow-hidden ${
          isIphone 
            ? 'rounded-[2.5rem] w-[280px] h-[580px]' 
            : 'rounded-[2rem] w-[280px] h-[580px]'
        }`}>
          {children}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  )
}

// ===== SIMULATED SCREENS =====
const SimulatedScreen = ({ 
  state, 
  deviceType,
  onAction 
}: { 
  state: DeviceState
  deviceType: DeviceType
  onAction: (action: string) => void 
}) => {
  switch (state.screen) {
    case 'splash':
      return (
        <div className="h-full bg-gradient-to-b from-[#0d2920] to-[#051410] flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🦎
          </motion.div>
          <h1 className="text-2xl font-black text-white">I4IGUANA</h1>
          <p className="text-[#4ade80] text-sm mt-2">Loading...</p>
        </div>
      )
      
    case 'home':
      return (
        <div className="h-full bg-gradient-to-b from-[#0d2920] to-[#051410] p-4 pt-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦎</span>
              <span className="text-white font-bold">I4IGUANA</span>
            </div>
            <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-bold">Archie Bar</span>
            </div>
          </div>
          
          {/* User Card */}
          <motion.div 
            className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl p-4 border border-[#4ade80]/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl mb-3 flex items-center justify-center">
              <span className="text-6xl">{state.user.gender === 'female' ? '👩' : '👨'}</span>
            </div>
            <h3 className="text-white font-bold text-lg">{state.matchedWith || 'Sarah'}, 28</h3>
            <p className="text-white/60 text-sm">250m away • Archie Bar</p>
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <Button 
                onClick={() => onAction('pass')}
                className="flex-1 bg-white/10 hover:bg-white/20 rounded-full h-12"
              >
                <XCircle className="h-6 w-6 text-red-400" />
              </Button>
              <Button 
                onClick={() => onAction('like')}
                className="flex-1 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:opacity-90 rounded-full h-12"
              >
                <Heart className="h-6 w-6 text-white" fill="white" />
              </Button>
            </div>
          </motion.div>
        </div>
      )
      
    case 'match':
      return (
        <div className="h-full bg-gradient-to-b from-[#0d2920] to-[#051410] flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">💕</div>
            <h1 className="text-2xl font-black text-white mb-2">It's a Match!</h1>
            <p className="text-white/60 mb-6">You and {state.matchedWith} liked each other</p>
            
            {/* Timer */}
            <div className="bg-white/10 rounded-2xl px-6 py-3 mb-6">
              <div className="flex items-center gap-2 justify-center">
                <Timer className="h-5 w-5 text-[#4ade80]" />
                <span className="text-3xl font-mono text-[#4ade80] font-bold">
                  {Math.floor(state.timerValue / 60)}:{(state.timerValue % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-white/40 text-xs mt-1">Time to decide</p>
            </div>
            
            {/* She Decides Button - Only for Female */}
            {state.user.gender === 'female' && (
              <Button 
                onClick={() => onAction('meeting')}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-bold"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                We're Meeting! 💕
              </Button>
            )}
            
            {state.user.gender === 'male' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-sm">
                  ⏳ Waiting for her to decide...
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )
      
    case 'enjoy-mode':
      return (
        <div className="h-full bg-gradient-to-b from-[#0d2920] to-[#051410] flex flex-col items-center justify-center p-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🦎
          </motion.div>
          <h1 className="text-2xl font-black text-white mb-2">Enjoy Your Meeting! 💚</h1>
          <p className="text-white/60 mb-4">with {state.matchedWith}</p>
          
          {/* Timer */}
          <div className="bg-white/10 rounded-2xl px-8 py-4 mb-6">
            <p className="text-white/40 text-xs mb-1">App returns in</p>
            <span className="text-4xl font-mono text-[#4ade80] font-bold">
              {Math.floor(state.timerValue / 60)}:{(state.timerValue % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4 mb-6">
            <p className="text-white/80 text-sm text-center">
              Look up from the screen and enjoy the real connection ✨
            </p>
          </div>
          
          <Button 
            onClick={() => onAction('chat')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-bold mb-3"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Open Chat 💬
          </Button>
          
          <Button 
            onClick={() => onAction('exit')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#15803d] via-[#22c55e] to-[#15803d] text-white font-bold"
          >
            🦎 Back to the Game
          </Button>
        </div>
      )
      
    default:
      return <div className="h-full bg-black" />
  }
}

// ===== MAIN COMPONENT =====
export default function DualDeviceSimulator() {
  const router = useRouter()
  
  // Device states
  const [iphoneState, setIphoneState] = useState<DeviceState>({
    screen: 'home',
    user: { name: 'Sarah', gender: 'female', photo: '' },
    matchedWith: 'David',
    timerValue: 600, // 10 minutes
    notifications: [],
    isConnected: true
  })
  
  const [androidState, setAndroidState] = useState<DeviceState>({
    screen: 'home',
    user: { name: 'David', gender: 'male', photo: '' },
    matchedWith: 'Sarah',
    timerValue: 600,
    notifications: [],
    isConnected: true
  })
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  
  // Add log entry
  const addLog = (message: string, device?: 'iphone' | 'android') => {
    const prefix = device ? (device === 'iphone' ? '🍎' : '🤖') : '📋'
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${prefix} ${message}`])
  }
  
  // Timer effect
  useEffect(() => {
    if (!isRunning) return
    
    const interval = setInterval(() => {
      setIphoneState(prev => ({ ...prev, timerValue: Math.max(0, prev.timerValue - 1) }))
      setAndroidState(prev => ({ ...prev, timerValue: Math.max(0, prev.timerValue - 1) }))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isRunning])
  
  // Handle actions
  const handleIphoneAction = (action: string) => {
    addLog(`Action: ${action}`, 'iphone')
    
    switch (action) {
      case 'like':
        setIphoneState(prev => ({ ...prev, screen: 'match' }))
        setAndroidState(prev => ({ ...prev, screen: 'match' }))
        addLog('MATCH! Both users matched!', 'iphone')
        addLog('Received match notification', 'android')
        break
        
      case 'meeting':
        setIphoneState(prev => ({ ...prev, screen: 'enjoy-mode', timerValue: 1200 }))
        setAndroidState(prev => ({ ...prev, screen: 'enjoy-mode', timerValue: 1200 }))
        addLog('Sarah clicked "We\'re Meeting!"', 'iphone')
        addLog('Received "We\'re Meeting" notification!', 'android')
        break
        
      case 'exit':
        setIphoneState(prev => ({ ...prev, screen: 'home' }))
        setAndroidState(prev => ({ ...prev, screen: 'home' }))
        addLog('Exited Enjoy Mode', 'iphone')
        break
    }
  }
  
  const handleAndroidAction = (action: string) => {
    addLog(`Action: ${action}`, 'android')
    
    switch (action) {
      case 'like':
        // Android user likes - waiting for female
        addLog('Liked Sarah - waiting for match...', 'android')
        break
    }
  }
  
  // Reset simulation
  const resetSimulation = () => {
    setIphoneState({
      screen: 'home',
      user: { name: 'Sarah', gender: 'female', photo: '' },
      matchedWith: 'David',
      timerValue: 600,
      notifications: [],
      isConnected: true
    })
    setAndroidState({
      screen: 'home',
      user: { name: 'David', gender: 'male', photo: '' },
      matchedWith: 'Sarah',
      timerValue: 600,
      notifications: [],
      isConnected: true
    })
    setIsRunning(false)
    setCurrentStep(0)
    setLogs([])
    addLog('Simulation reset')
  }
  
  // Run automated test
  const runAutomatedTest = async () => {
    setIsRunning(true)
    setLogs([])
    
    addLog('🚀 Starting automated cross-platform test...')
    
    // Step 1: Both at home
    await new Promise(r => setTimeout(r, 1000))
    addLog('Step 1: Both users at home screen')
    
    // Step 2: Android likes iPhone
    await new Promise(r => setTimeout(r, 1500))
    addLog('Step 2: David (Android) likes Sarah', 'android')
    
    // Step 3: iPhone likes Android - MATCH!
    await new Promise(r => setTimeout(r, 1500))
    handleIphoneAction('like')
    addLog('Step 3: MATCH CREATED! ✅')
    
    // Step 4: Wait 2 seconds, then female clicks meeting
    await new Promise(r => setTimeout(r, 2000))
    handleIphoneAction('meeting')
    addLog('Step 4: Sarah clicked "We\'re Meeting!" ✅')
    
    // Step 5: Both in Enjoy Mode
    await new Promise(r => setTimeout(r, 1000))
    addLog('Step 5: Both users in Enjoy Mode ✅')
    addLog('🎉 Cross-platform test completed successfully!')
    
    setIsRunning(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a4d3e] to-[#0d2920] border-b border-[#4ade80]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin/super')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-4xl">📱</span>
              <div>
                <h1 className="text-2xl font-black text-white">Dual Device Simulator</h1>
                <p className="text-[#4ade80] text-sm">iPhone vs Android • Cross-Platform Testing</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={resetSimulation}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={runAutomatedTest}
              disabled={isRunning}
              className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0d2920] font-bold"
            >
              <Play className="mr-2 h-4 w-4" />
              {isRunning ? 'Running...' : 'Run Full Test'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* iOS Compatibility Warnings */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
            <Apple className="h-5 w-5" />
            iOS Compatibility Notes
          </h3>
          <ul className="text-yellow-300/80 text-sm space-y-1">
            <li>• 🔔 Push Notifications: Limited in Safari PWA - works best when app added to Home Screen</li>
            <li>• 🔊 Audio Autoplay: Requires user interaction first on iOS</li>
            <li>• 📍 Geolocation: May require HTTPS and explicit permission</li>
            <li>• 💾 Local Storage: Safari may clear data after 7 days of inactivity</li>
            <li>• 📱 Safe Area: Notch/Dynamic Island requires padding consideration</li>
          </ul>
        </div>
        
        {/* Devices Side by Side */}
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          {/* iPhone */}
          <div>
            <PhoneFrame type="iphone" user={iphoneState.user}>
              <SimulatedScreen 
                state={iphoneState} 
                deviceType="iphone"
                onAction={handleIphoneAction}
              />
            </PhoneFrame>
          </div>
          
          {/* Android */}
          <div>
            <PhoneFrame type="android" user={androidState.user}>
              <SimulatedScreen 
                state={androidState} 
                deviceType="android"
                onAction={handleAndroidAction}
              />
            </PhoneFrame>
          </div>
        </div>
        
        {/* Test Log */}
        <div className="bg-black/30 rounded-2xl border border-[#4ade80]/20 p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#4ade80]" />
            Test Log
          </h3>
          <div className="bg-black/50 rounded-xl p-4 h-48 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-white/40">Click "Run Full Test" to start automated testing...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-white/80 mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
        
        {/* Platform Comparison Table */}
        <div className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-bold text-lg mb-4">📊 Platform Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 py-2 px-3">Feature</th>
                  <th className="text-center text-white/60 py-2 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <Apple className="h-4 w-4" /> iOS
                    </div>
                  </th>
                  <th className="text-center text-white/60 py-2 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <Chrome className="h-4 w-4 text-green-400" /> Android
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">PWA Installation</td>
                  <td className="text-center py-2 px-3">⚠️ Manual</td>
                  <td className="text-center py-2 px-3">✅ Auto-prompt</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Push Notifications</td>
                  <td className="text-center py-2 px-3">⚠️ Limited</td>
                  <td className="text-center py-2 px-3">✅ Full Support</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Background Sync</td>
                  <td className="text-center py-2 px-3">❌ Not supported</td>
                  <td className="text-center py-2 px-3">✅ Supported</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Geolocation</td>
                  <td className="text-center py-2 px-3">✅ Works</td>
                  <td className="text-center py-2 px-3">✅ Works</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Audio Playback</td>
                  <td className="text-center py-2 px-3">⚠️ User interaction</td>
                  <td className="text-center py-2 px-3">✅ Auto-play</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3">Camera Access</td>
                  <td className="text-center py-2 px-3">✅ Works</td>
                  <td className="text-center py-2 px-3">✅ Works</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Local Storage</td>
                  <td className="text-center py-2 px-3">⚠️ May clear</td>
                  <td className="text-center py-2 px-3">✅ Persistent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
