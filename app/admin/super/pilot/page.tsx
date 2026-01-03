'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Save, Eye, Rocket, Calendar, MapPin, Mail, Globe, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface PilotLaunchData {
  isActive: boolean
  collectEmails: boolean
  launchDate: string
  venue: {
    he: string
    en: string
  }
  title: {
    he: string
    en: string
  }
  description: {
    he: string
    en: string
  }
  buttonText: {
    he: string
    en: string
  }
  updatedAt: string
}

const defaultData: PilotLaunchData = {
  isActive: true,
  collectEmails: true,
  launchDate: '2025-12-22',
  venue: {
    he: 'Archie Bar - אשקלון',
    en: 'Archie Bar - Ashkelon'
  },
  title: {
    he: '🚀 משיקים בקרוב!',
    en: '🚀 Launching Soon!'
  },
  description: {
    he: 'היו הראשונים לחוות דייטינג בזמן אמת במועדון האהוב עליכם!',
    en: 'Be the first to experience real-time dating at your favorite venue!'
  },
  buttonText: {
    he: '📧 עדכנו אותי בהשקה',
    en: '📧 Notify Me'
  },
  updatedAt: new Date().toISOString()
}

export default function PilotLaunchPage() {
  const [data, setData] = useState<PilotLaunchData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewLang, setPreviewLang] = useState<'he' | 'en'>('he')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const docRef = doc(db, 'settings', 'pilotLaunch')
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setData(docSnap.data() as PilotLaunchData)
      }
    } catch (error) {
      console.error('Error loading pilot launch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const docRef = doc(db, 'settings', 'pilotLaunch')
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving pilot launch data:', error)
      alert('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const formatDateForDisplay = (dateStr: string, lang: 'he' | 'en') => {
    const date = new Date(dateStr)
    if (lang === 'he') {
      return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] to-[#051410] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
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
            <Rocket className="h-6 w-6 text-[#4ade80]" />
            <div>
              <h1 className="text-xl font-bold">ניהול Pilot Launch</h1>
              <p className="text-white/50 text-sm">כפתור PILOT בדף הנחיתה</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-[#4ade80] hover:bg-[#22c55e] text-[#0d2920]'
            }`}
          >
            {saving ? (
              <>טוען...</>
            ) : saved ? (
              <>✅ נשמר!</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                שמור שינויים
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Settings Panel */}
          <div className="space-y-6">
            
            {/* Status Toggles */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#4ade80]" />
                הגדרות כלליות
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Rocket className="h-5 w-5 text-[#4ade80]" />
                    <div>
                      <div className="font-medium">פעיל</div>
                      <div className="text-xs text-white/50">הצג את הפופאפ בכפתור PILOT</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={data.isActive}
                    onChange={(e) => setData({ ...data, isActive: e.target.checked })}
                    className="w-5 h-5 accent-[#4ade80]"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#4ade80]" />
                    <div>
                      <div className="font-medium">איסוף מיילים</div>
                      <div className="text-xs text-white/50">אפשר למשתמשים להירשם לעדכונים</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={data.collectEmails}
                    onChange={(e) => setData({ ...data, collectEmails: e.target.checked })}
                    className="w-5 h-5 accent-[#4ade80]"
                  />
                </label>
              </div>
            </div>

            {/* Launch Details */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#4ade80]" />
                פרטי ההשקה
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">תאריך השקה</label>
                  <input
                    type="date"
                    value={data.launchDate}
                    onChange={(e) => setData({ ...data, launchDate: e.target.value })}
                    className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇮🇱 שם מקום (עברית)</label>
                    <input
                      type="text"
                      value={data.venue.he}
                      onChange={(e) => setData({ ...data, venue: { ...data.venue, he: e.target.value } })}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none"
                      placeholder="Archie Bar - אשקלון"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇺🇸 Venue Name (English)</label>
                    <input
                      type="text"
                      value={data.venue.en}
                      onChange={(e) => setData({ ...data, venue: { ...data.venue, en: e.target.value } })}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none text-left"
                      dir="ltr"
                      placeholder="Archie Bar - Ashkelon"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#4ade80]" />
                תוכן הפופאפ
              </h3>
              
              <div className="space-y-4">
                {/* Titles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇮🇱 כותרת (עברית)</label>
                    <input
                      type="text"
                      value={data.title.he}
                      onChange={(e) => setData({ ...data, title: { ...data.title, he: e.target.value } })}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇺🇸 Title (English)</label>
                    <input
                      type="text"
                      value={data.title.en}
                      onChange={(e) => setData({ ...data, title: { ...data.title, en: e.target.value } })}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                {/* Descriptions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇮🇱 תיאור (עברית)</label>
                    <textarea
                      value={data.description.he}
                      onChange={(e) => setData({ ...data, description: { ...data.description, he: e.target.value } })}
                      rows={3}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇺🇸 Description (English)</label>
                    <textarea
                      value={data.description.en}
                      onChange={(e) => setData({ ...data, description: { ...data.description, en: e.target.value } })}
                      rows={3}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none resize-none text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                {/* Button Text */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇮🇱 טקסט כפתור (עברית)</label>
                    <input
                      type="text"
                      value={data.buttonText.he}
                      onChange={(e) => setData({ ...data, buttonText: { ...data.buttonText, he: e.target.value } })}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">🇺🇸 Button Text (English)</label>
                    <input
                      type="text"
                      value={data.buttonText.en}
                      onChange={(e) => setData({ ...data, buttonText: { ...data.buttonText, en: e.target.value } })}
                      className="w-full p-3 rounded-lg bg-[#0d2920] text-white border border-[#4ade80]/30 focus:border-[#4ade80] focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#4ade80]" />
                  תצוגה מקדימה
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewLang('he')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      previewLang === 'he' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-white/10 text-white'
                    }`}
                  >
                    🇮🇱 עברית
                  </button>
                  <button
                    onClick={() => setPreviewLang('en')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      previewLang === 'en' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-white/10 text-white'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>
              
              {/* Pilot Button Preview */}
              <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#4ade80] rounded-full blur opacity-75 group-hover:opacity-100 animate-pulse transition-opacity"></div>
                  <div className="relative px-6 py-2 bg-[#0d2920] rounded-full border-2 border-[#4ade80] text-[#4ade80] font-bold">
                    PILOT
                  </div>
                </div>
              </div>
              
              {/* Popup Preview */}
              <div 
                className="relative bg-gradient-to-br from-[#0d2920] to-[#051410] rounded-2xl p-6 border-2 border-[#4ade80]/50 shadow-2xl"
                dir={previewLang === 'he' ? 'rtl' : 'ltr'}
              >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#4ade80]/20 via-[#22c55e]/20 to-[#4ade80]/20 rounded-2xl blur-xl"></div>
                
                <div className="relative">
                  {/* Close button */}
                  <button className="absolute top-0 left-0 text-white/50 hover:text-white text-xl">×</button>
                  
                  {/* Content */}
                  <div className="text-center space-y-4">
                    {/* Animated emoji */}
                    <div className="text-5xl animate-bounce">🦎</div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-black text-[#4ade80]">
                      {data.title[previewLang]}
                    </h3>
                    
                    {/* Venue */}
                    <div className="flex items-center justify-center gap-2 text-white">
                      <MapPin className="h-5 w-5 text-[#4ade80]" />
                      <span className="font-semibold">{data.venue[previewLang]}</span>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center justify-center gap-2 text-white/70">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateForDisplay(data.launchDate, previewLang)}</span>
                    </div>
                    
                    {/* Divider */}
                    <div className="w-16 h-1 mx-auto bg-gradient-to-r from-transparent via-[#4ade80] to-transparent"></div>
                    
                    {/* Description */}
                    <p className="text-white/80 text-sm leading-relaxed">
                      {data.description[previewLang]}
                    </p>
                    
                    {/* CTA Button */}
                    {data.collectEmails && (
                      <button className="w-full py-3 bg-[#4ade80] hover:bg-[#22c55e] text-[#0d2920] font-bold rounded-xl transition-colors shadow-lg shadow-[#4ade80]/25">
                        {data.buttonText[previewLang]}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${data.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-white/50">
                  {data.isActive ? 'הפופאפ פעיל' : 'הפופאפ כבוי'}
                </span>
              </div>
            </div>
            
            {/* Info */}
            <div className="bg-[#4ade80]/10 rounded-xl p-6 border border-[#4ade80]/30">
              <h4 className="text-[#4ade80] font-semibold mb-2">💡 איך זה עובד?</h4>
              <ul className="text-white/70 text-sm space-y-2">
                <li>• כפתור PILOT יציג אנימציית זוהר</li>
                <li>• Hover (מחשב) / Touch (מובייל) פותח את הפופאפ</li>
                <li>• משתמשים יכולים להשאיר מייל לעדכונים</li>
                <li>• המיילים נשמרים ב-Firebase לשימוש עתידי</li>
                <li>• אחרי ההשקה - כבה את הפופאפ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
