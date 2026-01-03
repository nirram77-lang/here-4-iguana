'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Mail, Download, Trash2, Globe, Calendar, Users, Search, RefreshCw, Copy, Check, CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'

interface WaitlistEntry {
  id: string
  email: string
  lang: 'he' | 'en'
  createdAt: string
  source: string
  handled?: boolean
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLang, setFilterLang] = useState<'all' | 'he' | 'en'>('all')
  const [filterHandled, setFilterHandled] = useState<'all' | 'pending' | 'handled'>('pending')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyEmail = async (email: string, id: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const toggleHandled = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'pilotWaitlist', id), {
        handled: !currentStatus
      })
    } catch (error) {
      console.error('Error updating handled status:', error)
    }
  }

  useEffect(() => {
    const q = query(
      collection(db, 'pilotWaitlist'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: WaitlistEntry[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as WaitlistEntry)
      })
      setEntries(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLang = filterLang === 'all' || entry.lang === filterLang
    const matchesHandled = filterHandled === 'all' || 
      (filterHandled === 'pending' && !entry.handled) ||
      (filterHandled === 'handled' && entry.handled)
    return matchesSearch && matchesLang && matchesHandled
  })

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את המייל הזה?')) return
    
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'pilotWaitlist', id))
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('שגיאה במחיקה')
    } finally {
      setDeleting(null)
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['Email', 'Language', 'Date', 'Source'].join(','),
      ...filteredEntries.map((entry) => [
        entry.email,
        entry.lang,
        new Date(entry.createdAt).toLocaleDateString(),
        entry.source
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pilot-waitlist-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = {
    total: entries.length,
    hebrew: entries.filter((e) => e.lang === 'he').length,
    english: entries.filter((e) => e.lang === 'en').length,
    pending: entries.filter((e) => !e.handled).length,
    today: entries.filter((e) => {
      const entryDate = new Date(e.createdAt).toDateString()
      const today = new Date().toDateString()
      return entryDate === today
    }).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-[#051410] flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin" />
          טוען...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-[#051410] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/super" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>חזרה</span>
          </Link>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-[#4ade80]" />
            <div>
              <h1 className="text-xl font-bold">רשימת המתנה - Pilot</h1>
              <p className="text-white/50 text-sm">מיילים שנאספו מכפתור PILOT</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#0d2920] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            ייצוא CSV
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#4ade80]/20 rounded-lg">
                <Users className="h-5 w-5 text-[#4ade80]" />
              </div>
              <div>
                <p className="text-white/50 text-xs">סה״כ</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <span className="text-lg">🇮🇱</span>
              </div>
              <div>
                <p className="text-white/50 text-xs">עברית</p>
                <p className="text-2xl font-bold">{stats.hebrew}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <span className="text-lg">🇺🇸</span>
              </div>
              <div>
                <p className="text-white/50 text-xs">English</p>
                <p className="text-2xl font-bold">{stats.english}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-white/50 text-xs">היום</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </div>
          
          <div className={`rounded-xl p-4 border ${stats.pending > 0 ? 'bg-orange-500/20 border-orange-500/40' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.pending > 0 ? 'bg-orange-500/30' : 'bg-green-500/20'}`}>
                {stats.pending > 0 ? (
                  <Circle className="h-5 w-5 text-orange-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
              </div>
              <div>
                <p className="text-white/50 text-xs">ממתין לטיפול</p>
                <p className={`text-2xl font-bold ${stats.pending > 0 ? 'text-orange-400' : 'text-green-400'}`}>{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="חפש לפי מייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#4ade80] focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterHandled('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterHandled === 'pending' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              ⏳ ממתין ({stats.pending})
            </button>
            <button
              onClick={() => setFilterHandled('handled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterHandled === 'handled' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              ✅ טופל
            </button>
            <button
              onClick={() => setFilterHandled('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterHandled === 'all' 
                  ? 'bg-[#4ade80] text-[#0d2920]' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              הכל
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterLang('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterLang === 'all' 
                  ? 'bg-[#4ade80] text-[#0d2920]' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilterLang('he')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterLang === 'he' 
                  ? 'bg-[#4ade80] text-[#0d2920]' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              🇮🇱 עברית
            </button>
            <button
              onClick={() => setFilterLang('en')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterLang === 'en' 
                  ? 'bg-[#4ade80] text-[#0d2920]' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              🇺🇸 English
            </button>
          </div>
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
            <Mail className="h-16 w-16 mx-auto text-white/20 mb-4" />
            <p className="text-white/50 text-lg">
              {searchTerm || filterLang !== 'all' 
                ? 'לא נמצאו תוצאות' 
                : 'עדיין אין נרשמים'}
            </p>
            <p className="text-white/30 text-sm mt-2">
              המיילים יופיעו כאן כשאנשים ירשמו דרך כפתור PILOT
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-right p-4 text-white/50 font-medium text-sm">מייל</th>
                    <th className="text-center p-4 text-white/50 font-medium text-sm">שפה</th>
                    <th className="text-right p-4 text-white/50 font-medium text-sm">תאריך</th>
                    <th className="text-right p-4 text-white/50 font-medium text-sm">מקור</th>
                    <th className="text-center p-4 text-white/50 font-medium text-sm">סטטוס</th>
                    <th className="text-center p-4 text-white/50 font-medium text-sm">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <button
                          onClick={() => handleCopyEmail(entry.email, entry.id)}
                          className="flex items-center gap-2 group hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
                          title="לחץ להעתקה"
                        >
                          <Mail className="h-4 w-4 text-[#4ade80]" />
                          <span className="text-white font-medium" dir="ltr">{entry.email}</span>
                          {copiedId === entry.id ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-white/30 group-hover:text-white/70 transition-colors" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg">
                          {entry.lang === 'he' ? '🇮🇱' : '🇺🇸'}
                        </span>
                      </td>
                      <td className="p-4 text-white/70 text-sm">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                          {entry.source}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleHandled(entry.id, entry.handled || false)}
                          className={`p-2 rounded-lg transition-colors ${
                            entry.handled 
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                              : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                          }`}
                          title={entry.handled ? 'סמן כלא טופל' : 'סמן כטופל'}
                        >
                          {entry.handled ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === entry.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-[#4ade80]/10 rounded-xl p-6 border border-[#4ade80]/30">
          <h4 className="text-[#4ade80] font-semibold mb-2 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            💡 מידע שימושי
          </h4>
          <ul className="text-white/70 text-sm space-y-2">
            <li>• המיילים נאספים כשמשתמשים לוחצים על כפתור PILOT באתר</li>
            <li>• ניתן לייצא את הרשימה ל-CSV לשימוש בניוזלטר או מערכת דיוור</li>
            <li>• הרשימה מתעדכנת בזמן אמת</li>
            <li>• מומלץ לא למחוק מיילים - רק במקרה של ספאם או טעות</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
