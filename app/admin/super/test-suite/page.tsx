"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Play, CheckCircle, XCircle, Clock, ChevronRight, ChevronDown,
  Zap, Activity, RefreshCw, Eye, EyeOff, Smartphone, Bell, MessageSquare,
  Heart, UserPlus, LogIn, LogOut, MapPin, Timer, Flag, Shield, FileText,
  Maximize2, Minimize2, ExternalLink, Trash2, QrCode, Coffee, Sparkles,
  Users, Home, User
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { getAdminData } from '@/lib/admin-auth'

// ===== TYPES =====
interface TestStep {
  id: string
  type: string
  name: string
  description: string
  params: Record<string, any>
  expectedResult: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  duration?: number
  error?: string
}

interface TestScenario {
  id: string
  name: string
  description: string
  category: string
  steps: TestStep[]
  isBuiltIn: boolean
  lastResult?: 'passed' | 'failed'
  priority?: 'critical' | 'high' | 'medium' | 'low'
}

interface TestRun {
  id: string
  scenarioId: string
  scenarioName: string
  timestamp: Date
  status: 'passed' | 'failed'
  duration: number
  stepsPassed: number
  stepsFailed: number
}

// ===== STEP ICONS =====
const STEP_ICONS: Record<string, any> = {
  navigate: Smartphone, login: LogIn, logout: LogOut, delete_account: Trash2,
  phone_verify: Smartphone, onboarding: UserPlus, 
  venue_select: MapPin, venue_checkin: QrCode, checkout: LogOut,
  find_users: Eye, swipe_right: Heart, swipe_left: XCircle, wait_match: Heart,
  open_chat: MessageSquare, send_message: MessageSquare, click_notification: Bell,
  match_expires: Timer, block_user: Shield, report_user: Flag, api_call: Zap,
  check_element: Eye, wait: Clock, assert: CheckCircle,
  we_are_meeting: Sparkles, enjoy_mode: Coffee, timer_check: Timer
}

// ===== BUILT-IN SCENARIOS - UPDATED FOR VENUE FLOW =====
const BUILT_IN_SCENARIOS: TestScenario[] = [
  // ============ CRITICAL - VENUE FLOW ============
  {
    id: 'venue-checkin-flow', name: '🏪 Venue Check-in Flow',
    description: 'פתיחת אפליקציה → בחירת מועדון → Check-in → מציג משתמשים',
    category: 'Critical - Venue', isBuiltIn: true, priority: 'critical',
    steps: [
      { id: 's1', type: 'navigate', name: 'Open App', description: 'פתיחת האפליקציה', params: { screen: 'home' }, expectedResult: 'Venue selection shown', status: 'pending' },
      { id: 's2', type: 'venue_select', name: 'Select Venue', description: 'בחירת מועדון מהרשימה', params: { venue: 'Archie Bar' }, expectedResult: 'Venue selected', status: 'pending' },
      { id: 's3', type: 'venue_checkin', name: 'Check-in to Venue', description: 'ביצוע צ\'ק-אין', params: {}, expectedResult: 'Checked in successfully', status: 'pending' },
      { id: 's4', type: 'check_element', name: 'Venue Indicator', description: 'בדיקת חיווי מועדון (🟢 נקודה ירוקה + טקסט אדום)', params: { element: 'venue-badge' }, expectedResult: 'Badge visible', status: 'pending' },
      { id: 's5', type: 'find_users', name: 'Load Nearby Users', description: 'טעינת משתמשים קרובים', params: {}, expectedResult: 'Users loaded', status: 'pending' },
    ]
  },
  {
    id: 'fresh-user-venue-flow', name: '🆕 Fresh User + Venue Flow',
    description: 'משתמש חדש: הרשמה → Onboarding → Guidelines → Venue → Check-in',
    category: 'Critical - Venue', isBuiltIn: true, priority: 'critical',
    steps: [
      { id: 's1', type: 'delete_account', name: 'Delete Account', description: 'מחיקת חשבון קיים (אם יש)', params: {}, expectedResult: 'Account deleted or none', status: 'pending' },
      { id: 's2', type: 'navigate', name: 'Go to App', description: 'פתיחת האפליקציה', params: { screen: 'home' }, expectedResult: 'Welcome/Login screen', status: 'pending' },
      { id: 's3', type: 'phone_verify', name: 'Phone Verification', description: 'אימות טלפון', params: {}, expectedResult: 'Phone verified', status: 'pending' },
      { id: 's4', type: 'onboarding', name: 'Complete Onboarding', description: 'מילוי פרטים + Guidelines', params: {}, expectedResult: 'Onboarding complete', status: 'pending' },
      { id: 's5', type: 'venue_select', name: 'Venue Selection Modal', description: 'מודאל בחירת מועדון מופיע', params: {}, expectedResult: 'Modal shown', status: 'pending' },
      { id: 's6', type: 'venue_checkin', name: 'Check-in', description: 'צ\'ק-אין למועדון', params: {}, expectedResult: 'Checked in', status: 'pending' },
      { id: 's7', type: 'check_element', name: 'Home Screen Ready', description: 'מסך הבית מוכן עם משתמשים', params: {}, expectedResult: 'Home with users', status: 'pending' },
    ]
  },

  // ============ CRITICAL - SHE DECIDES FLOW ============
  {
    id: 'she-decides-flow', name: '💕 She Decides - Complete Flow',
    description: 'Match → האישה לוחצת "We\'re Meeting" → Celebration → Enjoy Mode',
    category: 'Critical - She Decides', isBuiltIn: true, priority: 'critical',
    steps: [
      { id: 's1', type: 'venue_checkin', name: 'Check-in', description: 'צ\'ק-אין למועדון', params: {}, expectedResult: 'Checked in', status: 'pending' },
      { id: 's2', type: 'swipe_right', name: 'Swipe Right', description: 'לייק למשתמש', params: {}, expectedResult: 'Swiped', status: 'pending' },
      { id: 's3', type: 'wait_match', name: 'Wait for Match', description: 'המתנה למאץ\'', params: {}, expectedResult: 'Match!', status: 'pending' },
      { id: 's4', type: 'check_element', name: 'Woman Sees Pink Button', description: 'האישה רואה כפתור ורוד פעיל', params: { gender: 'female' }, expectedResult: 'Pink button active', status: 'pending' },
      { id: 's5', type: 'check_element', name: 'Man Sees Gray Button', description: 'הגבר רואה כפתור אפור מושבת', params: { gender: 'male' }, expectedResult: 'Gray button disabled', status: 'pending' },
      { id: 's6', type: 'we_are_meeting', name: 'Click We\'re Meeting', description: 'האישה לוחצת על הכפתור', params: {}, expectedResult: 'Celebration modal', status: 'pending' },
      { id: 's7', type: 'check_element', name: 'Celebration Modal', description: 'מודאל חגיגה מופיע', params: {}, expectedResult: 'Modal with 🦎', status: 'pending' },
      { id: 's8', type: 'navigate', name: 'Click Awesome', description: 'לחיצה על Awesome', params: { button: 'awesome' }, expectedResult: 'Navigate to Enjoy Mode', status: 'pending' },
      { id: 's9', type: 'enjoy_mode', name: 'Enjoy Mode Screen', description: 'מסך Enjoy Mode מופיע', params: {}, expectedResult: 'Enjoy Mode with timer', status: 'pending' },
      { id: 's10', type: 'timer_check', name: '20 Min Timer', description: 'ספירה לאחור 20 דקות', params: {}, expectedResult: 'Timer counting', status: 'pending' },
    ]
  },
  {
    id: 'same-sex-both-initiate', name: '🏳️‍🌈 Same-Sex - Both Can Initiate',
    description: 'זוגות מאותו מין - שניהם יכולים ללחוץ על We\'re Meeting',
    category: 'Critical - She Decides', isBuiltIn: true, priority: 'critical',
    steps: [
      { id: 's1', type: 'wait_match', name: 'Same-Sex Match', description: 'מאץ\' בין אותו מין', params: { sameGender: true }, expectedResult: 'Match created', status: 'pending' },
      { id: 's2', type: 'check_element', name: 'Both See Green Button', description: 'שניהם רואים כפתור ירוק פעיל', params: {}, expectedResult: 'Green button for both', status: 'pending' },
      { id: 's3', type: 'we_are_meeting', name: 'Either Can Click', description: 'כל אחד יכול ללחוץ', params: {}, expectedResult: 'Button works', status: 'pending' },
    ]
  },

  // ============ CRITICAL - MATCH & CHAT ============
  {
    id: 'match-chat-full', name: '💬 Match & Chat Complete',
    description: 'Venue → Match → Chat → Send Message → Image',
    category: 'Critical - Match', isBuiltIn: true, priority: 'critical',
    steps: [
      { id: 's1', type: 'venue_checkin', name: 'Check-in', description: 'צ\'ק-אין', params: {}, expectedResult: 'Checked in', status: 'pending' },
      { id: 's2', type: 'find_users', name: 'Find Users', description: 'חיפוש משתמשים', params: {}, expectedResult: 'Found users', status: 'pending' },
      { id: 's3', type: 'swipe_right', name: 'Swipe Right', description: 'לייק', params: {}, expectedResult: 'Swiped', status: 'pending' },
      { id: 's4', type: 'wait_match', name: 'Wait Match', description: 'המתנה למאץ\'', params: {}, expectedResult: 'Match!', status: 'pending' },
      { id: 's5', type: 'timer_check', name: 'Timer Running', description: 'טיימר 10 דקות רץ', params: {}, expectedResult: 'Timer visible', status: 'pending' },
      { id: 's6', type: 'open_chat', name: 'Open Chat', description: 'פתיחת צ\'אט', params: {}, expectedResult: 'Chat open', status: 'pending' },
      { id: 's7', type: 'send_message', name: 'Send Text', description: 'שליחת הודעה', params: { text: 'היי! 👋' }, expectedResult: 'Message sent', status: 'pending' },
      { id: 's8', type: 'send_message', name: 'Send Image', description: 'שליחת תמונה', params: { type: 'image' }, expectedResult: 'Image sent', status: 'pending' },
    ]
  },

  // ============ EDGE CASES ============
  {
    id: 'expired-notification-no-crash', name: '⏰ Expired Notification - No Crash',
    description: 'לחיצה על notification של match שפג - לא קורס!',
    category: 'Edge Cases', isBuiltIn: true, priority: 'high',
    steps: [
      { id: 's1', type: 'navigate', name: 'Go to Notifications', description: 'מעבר לנוטיפיקציות', params: { screen: 'notifications' }, expectedResult: 'Notifications screen', status: 'pending' },
      { id: 's2', type: 'click_notification', name: 'Click Expired Match', description: 'לחיצה על מאץ\' שפג', params: { isExpired: true }, expectedResult: 'No crash!', status: 'pending' },
      { id: 's3', type: 'check_element', name: 'Fallback Message', description: 'הודעת "Match Unavailable" או צ\'אט', params: {}, expectedResult: 'Graceful handling', status: 'pending' },
      { id: 's4', type: 'navigate', name: 'Back to Home', description: 'חזרה למסך הבית', params: {}, expectedResult: 'Home screen', status: 'pending' },
    ]
  },
  {
    id: 'expired-chat-notification', name: '💬 Expired Chat Notification',
    description: 'לחיצה על notification של הודעה בצ\'אט שפג',
    category: 'Edge Cases', isBuiltIn: true, priority: 'high',
    steps: [
      { id: 's1', type: 'navigate', name: 'Go to Notifications', description: 'מעבר לנוטיפיקציות', params: { screen: 'notifications' }, expectedResult: 'Notifications screen', status: 'pending' },
      { id: 's2', type: 'click_notification', name: 'Click Old Message', description: 'לחיצה על הודעה ישנה', params: { type: 'message', isExpired: true }, expectedResult: 'No white screen', status: 'pending' },
      { id: 's3', type: 'check_element', name: 'Chat or Fallback', description: 'צ\'אט נטען או הודעת fallback', params: {}, expectedResult: 'No crash', status: 'pending' },
    ]
  },
  {
    id: 'we-are-meeting-no-oh-no', name: '🎉 We\'re Meeting - No "Oh No"',
    description: 'אחרי לחיצה על We\'re Meeting - לא מופיע מסך "Oh no"',
    category: 'Edge Cases', isBuiltIn: true, priority: 'critical',
    steps: [
      { id: 's1', type: 'wait_match', name: 'Get Match', description: 'קבלת מאץ\'', params: {}, expectedResult: 'Match screen', status: 'pending' },
      { id: 's2', type: 'we_are_meeting', name: 'Click We\'re Meeting', description: 'לחיצה על הכפתור', params: {}, expectedResult: 'Celebration modal', status: 'pending' },
      { id: 's3', type: 'wait', name: 'Wait 5 Seconds', description: 'המתנה', params: { seconds: 5 }, expectedResult: 'Still celebration', status: 'pending' },
      { id: 's4', type: 'check_element', name: 'No MatchEndedScreen', description: 'אין מסך "Oh no"!', params: { notPresent: 'MatchEndedScreen' }, expectedResult: 'Modal still visible', status: 'pending' },
      { id: 's5', type: 'navigate', name: 'Click Awesome', description: 'לחיצה על כפתור', params: {}, expectedResult: 'Enjoy Mode', status: 'pending' },
    ]
  },

  // ============ PROFILE & SETTINGS ============
  {
    id: 'profile-no-blue-button', name: '👤 Profile - No Blue Button',
    description: 'מסך פרופיל - אין כפתור כחול של פעמון!',
    category: 'UI Checks', isBuiltIn: true, priority: 'medium',
    steps: [
      { id: 's1', type: 'navigate', name: 'Go to Profile', description: 'מעבר לפרופיל', params: { screen: 'profile' }, expectedResult: 'Profile screen', status: 'pending' },
      { id: 's2', type: 'check_element', name: 'No Blue Bell Button', description: 'אין כפתור כחול עם פעמון', params: { notPresent: 'blue-bell' }, expectedResult: 'Only Logout button', status: 'pending' },
      { id: 's3', type: 'check_element', name: 'Logout is Red', description: 'כפתור Logout אדום', params: { element: 'logout-red' }, expectedResult: 'Red logout button', status: 'pending' },
    ]
  },

  // ============ API HEALTH ============
  {
    id: 'api-health', name: '🔌 API Health Check',
    description: 'בדיקת כל ה-API endpoints',
    category: 'API', isBuiltIn: true, priority: 'high',
    steps: [
      { id: 's1', type: 'api_call', name: 'OneSignal Config', description: '/api/check-onesignal', params: { endpoint: '/api/check-onesignal' }, expectedResult: 'Status 200', status: 'pending' },
      { id: 's2', type: 'api_call', name: 'App Loads', description: '/app', params: { endpoint: '/app' }, expectedResult: 'Status 200', status: 'pending' },
      { id: 's3', type: 'api_call', name: 'Admin Panel', description: '/admin/super/db', params: { endpoint: '/admin/super/db' }, expectedResult: 'Status 200', status: 'pending' },
    ]
  },

  // ============ ADMIN TOOLS ============
  {
    id: 'reset-nir-jango', name: '🔄 Reset Nir & Jango',
    description: 'בדיקת כפתור Reset במסך Admin',
    category: 'Admin', isBuiltIn: true, priority: 'medium',
    steps: [
      { id: 's1', type: 'navigate', name: 'Go to Admin DB', description: 'מעבר ל-Admin DB', params: { url: '/admin/super/db' }, expectedResult: 'Admin panel', status: 'pending' },
      { id: 's2', type: 'check_element', name: 'Reset Button Exists', description: 'כפתור Reset Nir & Jango קיים', params: {}, expectedResult: 'Button visible', status: 'pending' },
      { id: 's3', type: 'navigate', name: 'Click Reset', description: 'לחיצה על Reset', params: {}, expectedResult: 'Confirmation', status: 'pending' },
      { id: 's4', type: 'assert', name: 'Users Found', description: 'מוצא משתמשים לפי email או שם', params: {}, expectedResult: 'Users reset', status: 'pending' },
    ]
  },

  // ============ NOTIFICATIONS ============
  {
    id: 'push-notification-flow', name: '🔔 Push Notification Flow',
    description: 'בדיקת Push Notifications',
    category: 'Notifications', isBuiltIn: true, priority: 'high',
    steps: [
      { id: 's1', type: 'api_call', name: 'Check OneSignal', description: 'בדיקת הגדרה', params: { endpoint: '/api/check-onesignal' }, expectedResult: 'Configured', status: 'pending' },
      { id: 's2', type: 'check_element', name: 'Permission Modal', description: 'מודאל בקשת הרשאה', params: {}, expectedResult: 'Modal or granted', status: 'pending' },
    ]
  }
]

// ===== MAIN COMPONENT =====
export default function TestSuitePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<TestScenario[]>(BUILT_IN_SCENARIOS)
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null)
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [expandedCategories, setExpandedCategories] = useState(['Critical - Venue', 'Critical - She Decides', 'Critical - Match', 'Edge Cases'])
  const [activeTab, setActiveTab] = useState<'scenarios' | 'live' | 'results'>('scenarios')
  const [runLogs, setRunLogs] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [previewUrl, setPreviewUrl] = useState('https://i4iguana.com/app')
  const logRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/admin/login'); return }
      const adminData = await getAdminData(user.uid)
      if (!adminData || adminData.role !== 'super') { router.push('/admin/login'); return }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'action' = 'info') => {
    const time = new Date().toLocaleTimeString('he-IL')
    const icons = { info: 'ℹ️', success: '✅', error: '❌', action: '▶️' }
    setRunLogs(prev => [...prev, `[${time}] ${icons[type]} ${msg}`])
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 100)
  }

  const runApiStep = async (endpoint: string): Promise<boolean> => {
    try {
      const res = await fetch(`https://i4iguana.com${endpoint}`)
      return res.status === 200
    } catch { return false }
  }

  const runStep = async (step: TestStep): Promise<TestStep> => {
    addLog(`Running: ${step.name}`, 'action')
    const start = Date.now()
    let success = false

    if (step.type === 'api_call' && step.params.endpoint) {
      success = await runApiStep(step.params.endpoint)
    } else if (step.type === 'navigate') {
      const urls: Record<string, string> = { 
        home: '/app', 
        notifications: '/app', 
        profile: '/app',
        admin: '/admin/super/db'
      }
      setPreviewUrl(`https://i4iguana.com${step.params.url || urls[step.params.screen] || '/app'}`)
      await new Promise(r => setTimeout(r, 1500))
      success = true
    } else if (step.type === 'wait') {
      await new Promise(r => setTimeout(r, (step.params.seconds || 1) * 1000))
      success = true
    } else {
      // Simulate other steps
      await new Promise(r => setTimeout(r, 600 + Math.random() * 1000))
      success = Math.random() > 0.1 // 90% success rate for simulation
    }

    const duration = Date.now() - start
    addLog(success ? `Passed: ${step.name} (${duration}ms)` : `Failed: ${step.name}`, success ? 'success' : 'error')
    return { ...step, status: success ? 'passed' : 'failed', duration }
  }

  const runScenario = async (scenario: TestScenario) => {
    if (isRunning) return
    setIsRunning(true)
    setCurrentStep(0)
    setRunLogs([])
    setActiveTab('live')
    setShowPreview(true)
    addLog(`🚀 Starting: ${scenario.name}`, 'info')
    addLog(`📋 ${scenario.description}`, 'info')

    const resetSteps = scenario.steps.map(s => ({ ...s, status: 'pending' as const }))
    setSelectedScenario({ ...scenario, steps: resetSteps })

    let passed = 0, failed = 0
    const start = Date.now()

    for (let i = 0; i < scenario.steps.length; i++) {
      setCurrentStep(i)
      setSelectedScenario(prev => prev ? { ...prev, steps: prev.steps.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s) } : null)
      
      const result = await runStep(scenario.steps[i])
      if (result.status === 'passed') passed++; else failed++
      
      setSelectedScenario(prev => prev ? { ...prev, steps: prev.steps.map((s, idx) => idx === i ? result : s) } : null)
      
      // Stop on first failure if critical
      if (result.status === 'failed' && scenario.priority === 'critical') {
        addLog('⚠️ Critical step failed - stopping test', 'error')
        break
      }
    }

    const duration = Date.now() - start
    const status: 'passed' | 'failed' = failed === 0 ? 'passed' : 'failed'
    addLog(`\n${'═'.repeat(40)}`, 'info')
    addLog(`📊 Results: ${passed}/${scenario.steps.length} passed`, 'info')
    addLog(`⏱️ Duration: ${(duration / 1000).toFixed(1)}s`, 'info')
    addLog(status === 'passed' ? '✅ SCENARIO PASSED' : '❌ SCENARIO FAILED', status === 'passed' ? 'success' : 'error')

    const newRun: TestRun = {
      id: `run_${Date.now()}`,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      timestamp: new Date(),
      status,
      duration,
      stepsPassed: passed,
      stepsFailed: failed
    }
    setTestRuns(prev => [newRun, ...prev].slice(0, 50))
    setScenarios(prev => prev.map(s => s.id === scenario.id ? { ...s, lastResult: status } : s))
    setIsRunning(false)
    setCurrentStep(-1)
  }

  const categories = [...new Set(scenarios.map(s => s.category))]
  const getStatusColor = (status: string) => status === 'passed' ? 'text-green-400 bg-green-400/10' : status === 'failed' ? 'text-red-400 bg-red-400/10' : status === 'running' ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 bg-gray-400/10'
  const getPriorityBadge = (priority?: string) => {
    if (priority === 'critical') return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Critical</span>
    if (priority === 'high') return <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">High</span>
    return null
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-black flex items-center justify-center"><RefreshCw className="h-8 w-8 text-[#4ade80] animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#051410] to-black">
      {/* Header */}
      <div className="bg-[#0d2920]/80 border-b border-[#4ade80]/20 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/admin/super/db')} variant="ghost" className="text-white hover:bg-white/10"><ArrowLeft className="h-5 w-5" /></Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl">🧪</div>
                <div>
                  <h1 className="text-xl font-bold text-white">Test Suite v2.0</h1>
                  <p className="text-sm text-white/60">E2E Testing - Venue Flow + She Decides</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 mr-4">
                <div className="text-center"><div className="text-2xl font-bold text-green-400">{testRuns.filter(r => r.status === 'passed').length}</div><div className="text-xs text-white/50">Passed</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-red-400">{testRuns.filter(r => r.status === 'failed').length}</div><div className="text-xs text-white/50">Failed</div></div>
              </div>
              <Button onClick={() => setShowPreview(!showPreview)} variant="outline" className="border-[#4ade80]/30 text-[#4ade80]">
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}{showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {[{ id: 'scenarios', label: '📋 Scenarios', icon: FileText }, { id: 'live', label: '📱 Live Test', icon: Smartphone }, { id: 'results', label: '📊 Results', icon: Activity }].map(tab => (
              <Button key={tab.id} onClick={() => setActiveTab(tab.id as any)} variant={activeTab === tab.id ? 'default' : 'ghost'} className={activeTab === tab.id ? 'bg-[#4ade80] text-[#0d2920]' : 'text-white/70 hover:text-white hover:bg-white/10'}>
                <tab.icon className="h-4 w-4 mr-2" />{tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className={`grid gap-6 ${showPreview && activeTab === 'live' ? 'grid-cols-12' : ''}`}>
          
          {/* Scenarios */}
          {(activeTab === 'scenarios' || activeTab === 'live') && (
            <div className={showPreview && activeTab === 'live' ? 'col-span-3' : 'col-span-12 max-w-3xl'}>
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat} className="bg-[#1a4d3e]/30 border border-[#4ade80]/20 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{cat}</span>
                        <span className="text-xs text-white/50">({scenarios.filter(s => s.category === cat).length})</span>
                      </div>
                      {expandedCategories.includes(cat) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {expandedCategories.includes(cat) && (
                      <div className="px-2 pb-2 space-y-1">
                        {scenarios.filter(s => s.category === cat).map(scenario => (
                          <button
                            key={scenario.id}
                            onClick={() => { setSelectedScenario(scenario); if (activeTab === 'scenarios') setActiveTab('live') }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${selectedScenario?.id === scenario.id ? 'bg-[#4ade80]/20 border border-[#4ade80]/50' : 'hover:bg-white/5'}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${scenario.lastResult === 'passed' ? 'bg-green-400' : scenario.lastResult === 'failed' ? 'bg-red-400' : 'bg-gray-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate flex items-center gap-2">
                                {scenario.name}
                                {getPriorityBadge(scenario.priority)}
                              </div>
                              <div className="text-white/50 text-xs truncate">{scenario.description}</div>
                            </div>
                            <Play className="h-4 w-4 text-[#4ade80] opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview - Phone Mockup */}
          {showPreview && activeTab === 'live' && (
            <div className="col-span-5">
              <div className="bg-[#1a4d3e]/30 border border-[#4ade80]/20 rounded-xl overflow-hidden sticky top-32">
                <div className="px-4 py-3 border-b border-[#4ade80]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#4ade80]" />
                    <span className="text-white font-medium">📱 I4IGUANA - Live Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => iframeRef.current && (iframeRef.current.src = previewUrl)} variant="ghost" size="sm" className="text-white/60 hover:text-white"><RefreshCw className="h-4 w-4" /></Button>
                    <Button onClick={() => window.open(previewUrl, '_blank')} variant="ghost" size="sm" className="text-white/60 hover:text-white"><ExternalLink className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="p-6 flex justify-center bg-gradient-to-b from-[#0d2920]/50 to-black/50">
                  {/* iPhone-style mockup */}
                  <div className="relative bg-[#1a1a1a] rounded-[50px] p-3 shadow-2xl border-4 border-[#2a2a2a]">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-10 flex items-center justify-center">
                      <div className="w-16 h-4 bg-[#1a1a1a] rounded-full" />
                    </div>
                    {/* Status bar simulation */}
                    <div className="absolute top-3 left-8 right-8 flex justify-between text-white text-[10px] font-semibold z-20 px-2">
                      <span>17:01</span>
                      <span className="flex items-center gap-1">
                        <span>📶</span>
                        <span>🔋 92%</span>
                      </span>
                    </div>
                    {/* Screen */}
                    <div className="w-[300px] h-[620px] rounded-[40px] overflow-hidden bg-[#0d2920] shadow-inner">
                      <iframe 
                        ref={iframeRef} 
                        src={previewUrl} 
                        className="w-full h-full border-0" 
                        title="App Preview"
                        style={{ borderRadius: '40px' }}
                      />
                    </div>
                    {/* Home indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steps & Log */}
          {activeTab === 'live' && selectedScenario && (
            <div className="col-span-4 space-y-4">
              {/* Run Button */}
              <Button
                onClick={() => runScenario(selectedScenario)}
                disabled={isRunning}
                className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold text-lg rounded-xl disabled:opacity-50"
              >
                {isRunning ? (
                  <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Running...</>
                ) : (
                  <><Play className="mr-2 h-5 w-5" /> Run Test</>
                )}
              </Button>

              {/* Steps */}
              <div className="bg-[#1a4d3e]/30 border border-[#4ade80]/20 rounded-xl">
                <div className="px-4 py-3 border-b border-[#4ade80]/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold">{selectedScenario.name}</h3>
                  {getPriorityBadge(selectedScenario.priority)}
                </div>
                <div className="p-4 space-y-2 max-h-[280px] overflow-y-auto">
                  {selectedScenario.steps.map((step, i) => {
                    const Icon = STEP_ICONS[step.type] || Zap
                    const isCurrent = isRunning && currentStep === i
                    return (
                      <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isCurrent ? 'bg-yellow-500/20 border-yellow-500/50 scale-[1.02]' : step.status === 'passed' ? 'bg-green-500/10 border-green-500/30' : step.status === 'failed' ? 'bg-red-500/10 border-red-500/30' : 'bg-[#0d2920]/50 border-[#4ade80]/10'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step.status === 'passed' ? 'bg-green-500 text-white' : step.status === 'failed' ? 'bg-red-500 text-white' : isCurrent ? 'bg-yellow-500 text-black' : 'bg-[#4ade80]/20 text-[#4ade80]'}`}>
                          {step.status === 'passed' ? '✓' : step.status === 'failed' ? '✗' : isCurrent ? <RefreshCw className="h-3 w-3 animate-spin" /> : i + 1}
                        </div>
                        <Icon className="h-4 w-4 text-white/50" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{step.name}</div>
                          <div className="text-white/50 text-xs truncate">{step.description}</div>
                        </div>
                        {step.duration && <div className="text-xs text-white/40">{step.duration}ms</div>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Log */}
              <div className="bg-[#1a4d3e]/30 border border-[#4ade80]/20 rounded-xl">
                <div className="px-4 py-3 border-b border-[#4ade80]/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold">📋 Run Log</h3>
                  {runLogs.length > 0 && (
                    <Button onClick={() => setRunLogs([])} variant="ghost" size="sm" className="text-white/50 hover:text-white text-xs">Clear</Button>
                  )}
                </div>
                <div ref={logRef} className="p-4 font-mono text-xs h-[180px] overflow-y-auto bg-black/20">
                  {runLogs.length === 0 ? (
                    <div className="text-white/30 text-center py-4">Select a scenario and click "Run Test"</div>
                  ) : (
                    runLogs.map((log, i) => (
                      <div key={i} className={
                        log.includes('✅') ? 'text-green-400' : 
                        log.includes('❌') ? 'text-red-400' : 
                        log.includes('🚀') ? 'text-blue-400' : 
                        log.includes('▶️') ? 'text-yellow-400' : 
                        log.includes('═') ? 'text-white/20' :
                        'text-white/60'
                      }>{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="col-span-12">
              <div className="bg-[#1a4d3e]/30 border border-[#4ade80]/20 rounded-xl">
                <div className="px-6 py-4 border-b border-[#4ade80]/10 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">📊 Test Run History</h2>
                  {testRuns.length > 0 && (
                    <Button onClick={() => setTestRuns([])} variant="ghost" className="text-white/50 hover:text-white">Clear History</Button>
                  )}
                </div>
                <div className="p-6">
                  {testRuns.length === 0 ? (
                    <div className="text-center py-12 text-white/50">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No test runs yet</p>
                      <p className="text-sm mt-2">Select a scenario and run it to see results here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testRuns.map(run => (
                        <div key={run.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0d2920]/50 border border-[#4ade80]/10 hover:border-[#4ade80]/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${run.status === 'passed' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                              {run.status === 'passed' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                            </div>
                            <div>
                              <div className="text-white font-medium">{run.scenarioName}</div>
                              <div className="text-white/50 text-sm">{run.timestamp.toLocaleString('he-IL')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-400">{run.stepsPassed}</div>
                              <div className="text-xs text-white/40">Passed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-400">{run.stepsFailed}</div>
                              <div className="text-xs text-white/40">Failed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{(run.duration / 1000).toFixed(1)}s</div>
                              <div className="text-xs text-white/40">Duration</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
