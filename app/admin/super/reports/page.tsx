"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Flag, ArrowLeft, User, Mail, Phone, Calendar, 
  Clock, CheckCircle, XCircle, AlertTriangle, 
  Eye, Trash2, RefreshCw, Search, Filter,
  ChevronDown, ChevronUp, MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"

interface Report {
  id: string
  // Reporter details
  reporterId: string
  reporterName: string
  reporterEmail: string
  reporterPhone?: string
  reporterFirebaseEmail?: string
  reporterGender?: string
  reporterAge?: number
  reporterPhoto?: string
  
  // Reported user details
  reportedUserId: string
  reportedUserName: string
  reportedUserEmail?: string
  reportedUserPhone?: string
  reportedUserGender?: string
  reportedUserAge?: number
  reportedUserPhoto?: string
  reportedUserBio?: string
  
  // Report content
  matchId: string
  description: string
  timestamp: Date
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Load reports from Firestore
  const loadReports = async () => {
    setLoading(true)
    try {
      const reportsRef = collection(db, 'reports')
      const q = query(reportsRef, orderBy('timestamp', 'desc'))
      const snapshot = await getDocs(q)
      
      const loadedReports: Report[] = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp)
        } as Report
      })
      
      setReports(loadedReports)
      console.log(`✅ Loaded ${loadedReports.length} reports`)
    } catch (error) {
      console.error('❌ Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  // Update report status
  const updateStatus = async (reportId: string, newStatus: string) => {
    setUpdatingStatus(reportId)
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: newStatus as any } : r
      ))
      
      console.log(`✅ Updated report ${reportId} to ${newStatus}`)
    } catch (error) {
      console.error('❌ Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Delete report
  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    
    try {
      await deleteDoc(doc(db, 'reports', reportId))
      setReports(prev => prev.filter(r => r.id !== reportId))
      console.log(`✅ Deleted report ${reportId}`)
    } catch (error) {
      console.error('❌ Error deleting report:', error)
      alert('Failed to delete report')
    }
  }

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporterEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'dismissed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#051410] to-black">
      {/* Header */}
      <div className="bg-[#0d2920]/80 border-b border-[#4ade80]/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/super">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Flag className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">User Reports</h1>
                  <p className="text-sm text-white/60">{reports.length} total reports</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={loadReports}
              variant="outline"
              className="border-[#4ade80]/30 text-[#4ade80] hover:bg-[#4ade80]/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="pl-10 bg-[#1a4d3e]/30 border-[#4ade80]/20 text-white placeholder:text-white/40"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map(status => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status)}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className={statusFilter === status 
                  ? 'bg-[#4ade80] text-[#0d2920]' 
                  : 'border-[#4ade80]/30 text-white/70 hover:bg-[#4ade80]/10'
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({reports.filter(r => r.status === status).length})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold text-2xl">{reports.filter(r => r.status === 'pending').length}</span>
            </div>
            <p className="text-sm text-yellow-400/70 mt-1">Pending</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Eye className="h-5 w-5" />
              <span className="font-bold text-2xl">{reports.filter(r => r.status === 'reviewed').length}</span>
            </div>
            <p className="text-sm text-blue-400/70 mt-1">Reviewed</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-bold text-2xl">{reports.filter(r => r.status === 'resolved').length}</span>
            </div>
            <p className="text-sm text-green-400/70 mt-1">Resolved</p>
          </div>
          <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400">
              <XCircle className="h-5 w-5" />
              <span className="font-bold text-2xl">{reports.filter(r => r.status === 'dismissed').length}</span>
            </div>
            <p className="text-sm text-gray-400/70 mt-1">Dismissed</p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-[#4ade80] animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No reports found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map(report => (
              <motion.div
                key={report.id}
                layout
                className="bg-[#1a4d3e]/30 border border-[#4ade80]/20 rounded-2xl overflow-hidden"
              >
                {/* Report Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Reporter Photo */}
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-[#0d2920] border-2 border-[#4ade80]/30">
                          {report.reporterPhoto ? (
                            <img src={report.reporterPhoto} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white/40" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#4ade80] flex items-center justify-center text-[10px] font-bold text-[#0d2920]">
                          →
                        </div>
                      </div>
                      
                      {/* Reported Photo */}
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-red-500/20 border-2 border-red-500/30">
                        {report.reportedUserPhoto ? (
                          <img src={report.reportedUserPhoto} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <User className="h-6 w-6 text-red-400/40" />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{report.reporterName || 'Unknown'}</span>
                          <span className="text-white/40">reported</span>
                          <span className="font-semibold text-red-400">{report.reportedUserName || 'Unknown'}</span>
                        </div>
                        <p className="text-sm text-white/60 mt-1 line-clamp-1">{report.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(report.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.reporterEmail}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status & Expand */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      {expandedReport === report.id ? (
                        <ChevronUp className="h-5 w-5 text-white/40" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-white/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedReport === report.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#4ade80]/10"
                    >
                      <div className="p-4 space-y-4">
                        {/* Two columns - Reporter & Reported */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Reporter Details */}
                          <div className="bg-[#0d2920]/50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-[#4ade80] mb-3 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Reporter (Who Reported)
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-white/50">Name:</span>
                                <span className="text-white">{report.reporterName || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Email:</span>
                                <span className="text-white">{report.reporterEmail || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Phone:</span>
                                <span className="text-white">{report.reporterPhone || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Firebase Email:</span>
                                <span className="text-white">{report.reporterFirebaseEmail || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Gender:</span>
                                <span className="text-white">{report.reporterGender || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Age:</span>
                                <span className="text-white">{report.reporterAge || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">User ID:</span>
                                <span className="text-white/70 text-xs font-mono">{report.reporterId}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reported User Details */}
                          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Reported User
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-white/50">Name:</span>
                                <span className="text-white">{report.reportedUserName || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Email:</span>
                                <span className="text-white">{report.reportedUserEmail || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Phone:</span>
                                <span className="text-white">{report.reportedUserPhone || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Gender:</span>
                                <span className="text-white">{report.reportedUserGender || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Age:</span>
                                <span className="text-white">{report.reportedUserAge || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">User ID:</span>
                                <span className="text-white/70 text-xs font-mono">{report.reportedUserId}</span>
                              </div>
                              {report.reportedUserBio && (
                                <div className="pt-2 border-t border-red-500/20">
                                  <span className="text-white/50 block mb-1">Bio:</span>
                                  <p className="text-white/80 text-xs">{report.reportedUserBio}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Report Description */}
                        <div className="bg-[#0d2920]/50 rounded-xl p-4">
                          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Report Description
                          </h3>
                          <p className="text-white/80 whitespace-pre-wrap">{report.description}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateStatus(report.id, 'reviewed')}
                              disabled={updatingStatus === report.id}
                              className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Mark Reviewed
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(report.id, 'resolved')}
                              disabled={updatingStatus === report.id}
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolved
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(report.id, 'dismissed')}
                              disabled={updatingStatus === report.id}
                              className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteReport(report.id)}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
