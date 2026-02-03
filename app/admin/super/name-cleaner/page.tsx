"use client"

import { useState } from 'react'
import { 
  ArrowLeft, 
  Loader2, 
  Check, 
  X, 
  Sparkles,
  TextCursorInput,
  RefreshCw,
  Save,
  AlertTriangle,
  ExternalLink,
  Scissors
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Venue {
  id: string
  displayName: string
  name: string
  city: string
  suggestedName: string
  editedName: string
  approved: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// NAME CLEANING LOGIC
// ═══════════════════════════════════════════════════════════════════════════

const MAX_NAME_LENGTH = 35

function suggestShorterName(name: string): string {
  let cleaned = name
  
  // Remove common suffixes/patterns
  const removePatterns = [
    /\s*-\s*סניפים ברחבי הארץ/gi,
    /\s*-\s*branches (across|throughout) (the country|israel)/gi,
    /\s*\(.*?\)/g,  // Remove parentheses content
    /\s*-\s*מרכז [א-ת]+$/gi,  // Remove "- מרכז X"
    /\s*-\s*סניף [א-ת]+$/gi,  // Remove "- סניף X"
    /\s*-\s*branch\s+\w+$/gi,
    /\s*restaurant\s*&?\s*bar$/gi,
    /\s*bar\s*&?\s*restaurant$/gi,
    /\s*cafe\s*&?\s*bar$/gi,
    /\s*lounge\s*&?\s*bar$/gi,
    /\s*-\s*בר ומסעדה$/gi,
    /\s*-\s*מסעדה ובר$/gi,
    /\s*-\s*קפה ובר$/gi,
    /\s*israel$/gi,
    /\s*ישראל$/gi,
    /\s*tlv$/gi,
    /\s*ת"א$/gi,
    /\s*תל אביב$/gi,
  ]
  
  for (const pattern of removePatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  
  // If name has both Hebrew and English separated by " - ", keep the shorter one
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ')
    // Filter out empty parts
    const validParts = parts.filter(p => p.trim().length > 0)
    if (validParts.length >= 2) {
      // Prefer the shorter name, or Hebrew if similar length
      const sorted = validParts.sort((a, b) => a.length - b.length)
      cleaned = sorted[0]
    }
  }
  
  // Clean up extra spaces and dashes
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  cleaned = cleaned.replace(/^-+|-+$/g, '').trim()
  cleaned = cleaned.replace(/\s*-\s*$/, '').trim()
  
  // If still too long, try to extract just the brand name (first part)
  if (cleaned.length > MAX_NAME_LENGTH) {
    // Try splitting by common separators
    const separators = [' - ', ' | ', ' – ', ' — ']
    for (const sep of separators) {
      if (cleaned.includes(sep)) {
        const firstPart = cleaned.split(sep)[0].trim()
        if (firstPart.length >= 3 && firstPart.length <= MAX_NAME_LENGTH) {
          cleaned = firstPart
          break
        }
      }
    }
  }
  
  // Final truncation if still too long (with ellipsis)
  if (cleaned.length > MAX_NAME_LENGTH) {
    cleaned = cleaned.substring(0, MAX_NAME_LENGTH - 1) + '…'
  }
  
  return cleaned
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NameCleanerPage() {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [minLength, setMinLength] = useState(MAX_NAME_LENGTH)
  const [savedCount, setSavedCount] = useState(0)

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD LONG NAMES
  // ═══════════════════════════════════════════════════════════════════════════

  const loadLongNames = async () => {
    setLoading(true)
    setVenues([])
    setSavedCount(0)
    
    try {
      const snapshot = await getDocs(collection(db, 'venues'))
      const longNames: Venue[] = []
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        const displayName = data.displayName || data.name || ''
        
        if (displayName.length > minLength) {
          const suggested = suggestShorterName(displayName)
          longNames.push({
            id: docSnap.id,
            displayName,
            name: data.name || '',
            city: data.city || '',
            suggestedName: suggested,
            editedName: suggested,
            approved: false
          })
        }
      })
      
      // Sort by name length (longest first)
      longNames.sort((a, b) => b.displayName.length - a.displayName.length)
      
      setVenues(longNames)
      
    } catch (error) {
      console.error('Error loading venues:', error)
      alert('שגיאה בטעינת המועדונים')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE VENUE NAME
  // ═══════════════════════════════════════════════════════════════════════════

  const updateVenueName = async (venueId: string, newName: string) => {
    try {
      const venueRef = doc(db, 'venues', venueId)
      await updateDoc(venueRef, {
        displayName: newName,
        updatedAt: Timestamp.now()
      })
      return true
    } catch (error) {
      console.error('Error updating venue:', error)
      return false
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE ALL APPROVED
  // ═══════════════════════════════════════════════════════════════════════════

  const saveAllApproved = async () => {
    const toSave = venues.filter(v => v.approved && v.editedName !== v.displayName)
    if (toSave.length === 0) {
      alert('אין שמות מאושרים לשמירה')
      return
    }
    
    if (!confirm(`לשמור ${toSave.length} שמות חדשים?`)) return
    
    setSaving(true)
    let successCount = 0
    
    for (const venue of toSave) {
      const success = await updateVenueName(venue.id, venue.editedName)
      if (success) {
        successCount++
      }
    }
    
    setSavedCount(successCount)
    setSaving(false)
    alert(`✅ נשמרו ${successCount} שמות!`)
    
    // Remove saved venues from list
    setVenues(prev => prev.filter(v => !v.approved || v.editedName === v.displayName))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE APPROVE
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleApprove = (venueId: string) => {
    setVenues(prev => prev.map(v => {
      if (v.id === venueId) {
        return { ...v, approved: !v.approved }
      }
      return v
    }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE EDITED NAME
  // ═══════════════════════════════════════════════════════════════════════════

  const updateEditedName = (venueId: string, newName: string) => {
    setVenues(prev => prev.map(v => {
      if (v.id === venueId) {
        return { ...v, editedName: newName }
      }
      return v
    }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVE ALL
  // ═══════════════════════════════════════════════════════════════════════════

  const approveAll = () => {
    setVenues(prev => prev.map(v => ({ ...v, approved: true })))
  }

  // Stats
  const approvedCount = venues.filter(v => v.approved).length

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#0a1f18] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0d2920]/95 backdrop-blur-sm border-b border-[#4ade80]/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-yellow-400" />
                  Name Cleaner
                </h1>
                <p className="text-sm text-white/60">קצר שמות ארוכים של מועדונים</p>
              </div>
            </div>
            
            {approvedCount > 0 && (
              <button
                onClick={saveAllApproved}
                disabled={saving}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                שמור ({approvedCount})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Controls */}
        <div className="bg-[#0d2920]/50 border border-[#4ade80]/20 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TextCursorInput className="h-5 w-5 text-[#4ade80]" />
            הגדרות
          </h2>
          
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">אורך מינימלי להצגה</label>
              <input
                type="number"
                value={minLength}
                onChange={e => setMinLength(Number(e.target.value))}
                min={20}
                max={100}
                className="w-24 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-center"
              />
              <span className="text-sm text-white/40 mr-2">תווים</span>
            </div>
            
            <button
              onClick={loadLongNames}
              disabled={loading}
              className="px-6 py-2 bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              טען שמות ארוכים
            </button>
            
            {venues.length > 0 && (
              <button
                onClick={approveAll}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-bold rounded-lg"
              >
                אשר הכל
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {venues.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0d2920]/50 border border-[#4ade80]/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{venues.length}</div>
              <div className="text-sm text-white/60">שמות ארוכים</div>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{approvedCount}</div>
              <div className="text-sm text-yellow-400/80">מאושרים</div>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{savedCount}</div>
              <div className="text-sm text-green-400/80">נשמרו</div>
            </div>
          </div>
        )}

        {/* Venues List */}
        {venues.length > 0 && (
          <div className="bg-[#0d2920]/50 border border-[#4ade80]/20 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              שמות לקיצור ({venues.length})
            </h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {venues.map(venue => (
                <div
                  key={venue.id}
                  className={`p-4 rounded-lg border transition-all ${
                    venue.approved
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-[#0d2920]/50 border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Approve Button */}
                    <button
                      onClick={() => toggleApprove(venue.id)}
                      className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                        venue.approved
                          ? 'bg-green-500 text-black'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {venue.approved ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </button>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Original Name */}
                      <div className="mb-2">
                        <span className="text-xs text-white/40">שם מקורי ({venue.displayName.length} תווים):</span>
                        <div className="text-red-400 font-mono text-sm break-all">
                          {venue.displayName}
                        </div>
                      </div>
                      
                      {/* Suggested/Edited Name */}
                      <div>
                        <span className="text-xs text-white/40">שם חדש:</span>
                        <input
                          type="text"
                          value={venue.editedName}
                          onChange={e => updateEditedName(venue.id, e.target.value)}
                          className={`w-full px-3 py-2 bg-black/30 border rounded-lg font-medium ${
                            venue.editedName.length <= MAX_NAME_LENGTH
                              ? 'border-green-500/50 text-green-400'
                              : 'border-yellow-500/50 text-yellow-400'
                          }`}
                        />
                        <div className="text-xs text-white/40 mt-1">
                          {venue.editedName.length} תווים
                          {venue.editedName.length > MAX_NAME_LENGTH && (
                            <span className="text-yellow-400 mr-2">⚠️ עדיין ארוך!</span>
                          )}
                        </div>
                      </div>
                      
                      {/* City */}
                      {venue.city && (
                        <div className="text-xs text-white/30 mt-1">
                          📍 {venue.city}
                        </div>
                      )}
                    </div>
                    
                    {/* External Link */}
                    <a
                      href={`/admin/super/venue/${venue.id}`}
                      target="_blank"
                      className="p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && venues.length === 0 && (
          <div className="text-center py-12 text-white/50">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>לחץ "טען שמות ארוכים" לחיפוש מועדונים עם שמות ארוכים</p>
          </div>
        )}

        {/* Help */}
        <div className="bg-[#0d2920]/30 border border-white/10 rounded-xl p-6">
          <h3 className="font-bold mb-3">📖 איך זה עובד:</h3>
          <div className="space-y-2 text-sm text-white/70">
            <p>1️⃣ הגדר אורך מינימלי (ברירת מחדל: {MAX_NAME_LENGTH} תווים)</p>
            <p>2️⃣ לחץ "טען שמות ארוכים" - המערכת מציעה שמות קצרים אוטומטית</p>
            <p>3️⃣ ערוך את השם המוצע אם צריך</p>
            <p>4️⃣ לחץ על ✓ לאישור כל שם</p>
            <p>5️⃣ לחץ "שמור" בהדר לעדכון כל השמות המאושרים</p>
          </div>
        </div>
      </div>
    </div>
  )
}
