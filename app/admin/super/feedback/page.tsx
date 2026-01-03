"use client"

/**
 * 🦎 I4IGUANA - Pilot Feedback Admin
 * View and manage feedback from pilot users
 * v2.8.6
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Trash2, User, Calendar, Phone, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, updateDoc, deleteDoc, orderBy, query, Timestamp } from "firebase/firestore"

interface FeedbackItem {
  id: string
  name: string
  feedback: string
  contact: string
  lang: string
  source: string
  read: boolean
  createdAt: Timestamp
  // ✅ v2.8.22: Meeting feedback fields
  rating?: 'positive' | 'negative'
  partnerName?: string
  userId?: string
}

export default function FeedbackAdminPage() {
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      // ✅ v2.8.22: Load from BOTH collections
      const allFeedbacks: FeedbackItem[] = []
      
      // 1. Load pilotFeedback (landing page feedback)
      const pilotQuery = query(collection(db, 'pilotFeedback'), orderBy('createdAt', 'desc'))
      const pilotSnapshot = await getDocs(pilotQuery)
      pilotSnapshot.docs.forEach(doc => {
        allFeedbacks.push({
          id: doc.id,
          source: 'pilot',
          ...doc.data()
        } as FeedbackItem)
      })
      
      // 2. Load meetingFeedback (match/meeting feedback)
      const meetingQuery = query(collection(db, 'meetingFeedback'), orderBy('createdAt', 'desc'))
      const meetingSnapshot = await getDocs(meetingQuery)
      meetingSnapshot.docs.forEach(doc => {
        const data = doc.data()
        allFeedbacks.push({
          id: doc.id,
          name: data.partnerName || 'Unknown',
          feedback: `${data.rating === 'positive' ? '👍' : '👎'} ${data.feedbackText || ''}`,
          contact: data.userId || '',
          lang: 'he',
          source: 'meeting',
          read: data.read || false,
          createdAt: data.createdAt,
          rating: data.rating,
          partnerName: data.partnerName,
          userId: data.userId
        } as FeedbackItem)
      })
      
      // Sort all by date
      allFeedbacks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0
        const timeB = b.createdAt?.toMillis?.() || 0
        return timeB - timeA
      })
      
      setFeedbacks(allFeedbacks)
    } catch (error) {
      console.error('Error loading feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      // ✅ v2.8.22: Find source and update correct collection
      const feedback = feedbacks.find(f => f.id === id)
      const collectionName = feedback?.source === 'meeting' ? 'meetingFeedback' : 'pilotFeedback'
      await updateDoc(doc(db, collectionName, id), { read: true })
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, read: true } : f))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadFeedbacks = feedbacks.filter(f => !f.read)
      for (const feedback of unreadFeedbacks) {
        const collectionName = feedback.source === 'meeting' ? 'meetingFeedback' : 'pilotFeedback'
        await updateDoc(doc(db, collectionName, feedback.id), { read: true })
      }
      setFeedbacks(prev => prev.map(f => ({ ...f, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteFeedback = async (id: string) => {
    if (!confirm('למחוק את הפידבק?')) return
    try {
      // ✅ v2.8.22: Find source and delete from correct collection
      const feedback = feedbacks.find(f => f.id === id)
      const collectionName = feedback?.source === 'meeting' ? 'meetingFeedback' : 'pilotFeedback'
      await deleteDoc(doc(db, collectionName, id))
      setFeedbacks(prev => prev.filter(f => f.id !== id))
    } catch (error) {
      console.error('Error deleting feedback:', error)
    }
  }

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate()
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'unread') return !f.read
    if (filter === 'read') return f.read
    return true
  })

  const unreadCount = feedbacks.filter(f => !f.read).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-[#061510]" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => router.push('/admin/super')}
            variant="ghost"
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            חזרה
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={loadFeedbacks}
              variant="ghost"
              className="text-white/70 hover:text-white"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Check className="w-4 h-4 ml-2" />
                סמן הכל כנקרא
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="text-5xl">💬</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              פידבק פיילוט
            </h1>
          </div>
          <p className="text-white/60">
            {feedbacks.length} פידבקים • {unreadCount} חדשים
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { key: 'all', label: 'הכל', count: feedbacks.length },
            { key: 'unread', label: 'חדשים', count: unreadCount },
            { key: 'read', label: 'נקראו', count: feedbacks.length - unreadCount }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl animate-bounce mb-4">💬</div>
            <p className="text-white/60">טוען פידבקים...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-white/60">אין פידבקים {filter === 'unread' ? 'חדשים' : filter === 'read' ? 'שנקראו' : ''}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className={`bg-white/5 rounded-2xl p-5 border transition-all ${
                  feedback.read 
                    ? 'border-white/10 opacity-70' 
                    : 'border-purple-500/50 shadow-lg shadow-purple-500/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{feedback.name || 'אנונימי'}</h3>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Calendar className="w-3 h-3" />
                        {formatDate(feedback.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!feedback.read && (
                      <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                        חדש
                      </span>
                    )}
                    {!feedback.read && (
                      <Button
                        onClick={() => markAsRead(feedback.id)}
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:bg-green-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteFeedback(feedback.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Feedback Content */}
                <div className="bg-black/20 rounded-xl p-4 mb-3">
                  <p className="text-white whitespace-pre-wrap">{feedback.feedback}</p>
                </div>

                {/* Contact */}
                {feedback.contact && (
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Phone className="w-4 h-4" />
                    <span>{feedback.contact}</span>
                  </div>
                )}

                {/* Source */}
                <div className="mt-2 text-xs text-white/40">
                  מקור: {feedback.source} • שפה: {feedback.lang === 'he' ? 'עברית' : 'אנגלית'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
