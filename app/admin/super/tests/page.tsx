"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  Globe,
  Server,
  ExternalLink,
  Play,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TestResult {
  id: string
  runNumber: number
  timestamp: string
  trigger: string
  branch: string
  commit: string
  overall: 'passed' | 'failed' | 'running' | 'unknown'
  duration: string
  url?: string
  tests: {
    healthCheck: { status: string; website: string; app: string }
    buildTest: { status: string; buildTime: string }
    apiTests: { status: string }
    performanceTests: { status: string; websiteTime: string; appTime: string }
    securityCheck: { status: string }
  }
}

const testCategories = [
  { id: 'healthCheck', name: 'Health Check', icon: Globe, description: 'Website & App availability' },
  { id: 'apiTests', name: 'API Tests', icon: Zap, description: 'API endpoints functionality' },
  { id: 'performanceTests', name: 'Performance', icon: Activity, description: 'Response times & speed' },
  { id: 'securityCheck', name: 'Security', icon: Shield, description: 'Security headers & protection' },
]

export default function TestsDashboard() {
  const router = useRouter()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [selectedRun, setSelectedRun] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastFetched, setLastFetched] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch test results from GitHub API
  const fetchTestResults = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/github-tests', {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch test results')
      }
      
      const data = await response.json()
      
      if (data.success && data.results) {
        setTestResults(data.results)
        if (data.results.length > 0 && !selectedRun) {
          setSelectedRun(data.results[0])
        } else if (data.results.length > 0) {
          // Update selected run with fresh data
          const updatedSelected = data.results.find((r: TestResult) => r.id === selectedRun?.id)
          if (updatedSelected) {
            setSelectedRun(updatedSelected)
          } else {
            setSelectedRun(data.results[0])
          }
        }
        setLastFetched(data.fetchedAt)
      }
    } catch (err) {
      console.error('Error fetching tests:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [selectedRun])

  // Initial fetch
  useEffect(() => {
    fetchTestResults()
  }, [])

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing test results...')
      fetchTestResults()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, fetchTestResults])

  const handleRefresh = async () => {
    await fetchTestResults()
  }

  const handleTriggerTests = () => {
    window.open('https://github.com/nirram77-lang/here-4-iguana/actions/workflows/tests.yml', '_blank')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'failure':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'warning':
      case 'skipped':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      case 'running':
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'passed':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'failure':
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'warning':
      case 'skipped':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'running':
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const passedCount = testResults.filter(r => r.overall === 'passed').length
  const failedCount = testResults.filter(r => r.overall === 'failed').length
  const successRate = testResults.length > 0 
    ? Math.round((passedCount / testResults.length) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a4d3e] to-[#0d2920] border-b border-[#4ade80]/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super')}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <div className="text-4xl">🧪</div>
              <div>
                <h1 className="text-2xl font-black text-white">
                  Tests Dashboard
                </h1>
                <p className="text-purple-400 text-sm font-semibold">
                  Automated Testing & Monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastFetched && (
                <span className="text-white/40 text-xs">
                  Updated: {new Date(lastFetched).toLocaleTimeString()}
                </span>
              )}
              <label className="flex items-center gap-2 text-white/60 text-sm">
                <input 
                  type="checkbox" 
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded bg-white/10 border-white/30"
                />
                Auto-refresh
              </label>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-white/50 bg-white/10 text-white font-medium hover:bg-white/20 hover:border-white/70 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
              <Button
                onClick={handleTriggerTests}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Run Tests
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400 font-medium">❌ Error fetching results: {error}</p>
            <p className="text-red-300/70 text-sm mt-1">Click Refresh to try again</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && testResults.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl animate-bounce mb-4">🦎</div>
              <p className="text-white text-lg">Loading test results from GitHub...</p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-md border-2 border-green-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400/80 text-sm font-medium">Success Rate</p>
                <h3 className="text-4xl font-black text-green-400">{successRate}%</h3>
              </div>
              <TrendingUp className="h-10 w-10 text-green-400/50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium">Total Runs</p>
                <h3 className="text-4xl font-black text-white">{testResults.length}</h3>
              </div>
              <Activity className="h-10 w-10 text-[#4ade80]/50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-md border-2 border-green-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400/80 text-sm font-medium">Passed</p>
                <h3 className="text-4xl font-black text-green-400">{passedCount}</h3>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400/50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-md border-2 border-red-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400/80 text-sm font-medium">Failed</p>
                <h3 className="text-4xl font-black text-red-400">{failedCount}</h3>
              </div>
              <XCircle className="h-10 w-10 text-red-400/50" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test History */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Recent Runs</h2>
            <div className="space-y-3">
              {testResults.map((result) => (
                <motion.div
                  key={result.id}
                  onClick={() => setSelectedRun(result)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedRun?.id === result.id
                      ? 'bg-purple-500/20 border-2 border-purple-500/50'
                      : 'bg-white/5 border-2 border-white/10 hover:border-white/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.overall)}
                      <span className="text-white font-bold">Run #{result.runNumber}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(result.overall)}`}>
                      {result.overall.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-white/60 text-sm">
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                      {result.trigger}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <Button
              onClick={() => window.open('https://github.com/nirram77-lang/here-4-iguana/actions', '_blank')}
              variant="outline"
              className="w-full mt-4 border-white/30 text-white hover:bg-white/10"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View All in GitHub
            </Button>
          </div>

          {/* Selected Run Details */}
          <div className="lg:col-span-2">
            {selectedRun ? (
              <motion.div
                key={selectedRun.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Run #{selectedRun.runNumber} Details
                  </h2>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Clock className="h-4 w-4" />
                    Duration: {selectedRun.duration}
                  </div>
                </div>

                {/* Run Info */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/40 text-xs uppercase">Trigger</p>
                      <p className="text-white font-medium">{selectedRun.trigger}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs uppercase">Branch</p>
                      <p className="text-white font-medium">{selectedRun.branch}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs uppercase">Commit</p>
                      <p className="text-white font-medium font-mono">{selectedRun.commit}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs uppercase">Time</p>
                      <p className="text-white font-medium">
                        {new Date(selectedRun.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Test Categories */}
                <h3 className="text-lg font-bold text-white mb-4">Test Results</h3>
                <div className="space-y-3">
                  {testCategories.map((category) => {
                    const testData = selectedRun.tests[category.id as keyof typeof selectedRun.tests]
                    const status = testData?.status || 'unknown'
                    const Icon = category.icon
                    
                    return (
                      <div
                        key={category.id}
                        className={`p-4 rounded-xl border-2 transition-all ${getStatusColor(status)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold">{category.name}</h4>
                              <p className="text-sm opacity-70">{category.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Show additional info based on test type */}
                            {category.id === 'performanceTests' && testData && 'websiteTime' in testData && (
                              <div className="text-right text-sm">
                                <p>Website: {testData.websiteTime}</p>
                                <p>App: {testData.appTime}</p>
                              </div>
                            )}
                            {category.id === 'buildTest' && testData && 'buildTime' in testData && (
                              <span className="text-sm">
                                Build: {testData.buildTime}
                              </span>
                            )}
                            {getStatusIcon(status)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => window.open(`https://github.com/nirram77-lang/here-4-iguana/actions/runs/${selectedRun.id}`, '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in GitHub
                  </Button>
                  {selectedRun.overall === 'failed' && (
                    <Button
                      onClick={handleTriggerTests}
                      variant="outline"
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Re-run Tests
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                Select a test run to view details
              </div>
            )}
          </div>
        </div>

        {/* Test Schedule Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Automated Testing Schedule</h3>
              <p className="text-white/60">
                Tests run automatically <span className="text-purple-400 font-bold">every 6 hours</span> (00:00, 06:00, 12:00, 18:00 UTC) 
                and on every push to the main branch.
              </p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {testCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 text-white/70 text-sm">
                <CheckCircle className="h-4 w-4 text-green-400" />
                {cat.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
