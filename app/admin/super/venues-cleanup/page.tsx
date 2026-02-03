"use client"

/**
 * 🧹 I4IGUANA - Venues Cleanup Tool
 * 
 * Features:
 * - Find duplicate venues
 * - Bulk activate/deactivate venues
 * - Delete duplicates
 * 
 * v1.0.0
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Loader2,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Copy,
  MapPin,
  Scissors
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, deleteDoc, doc, Timestamp, writeBatch } from 'firebase/firestore'

interface Venue {
  id: string
  displayName: string
  city: string
  address?: string
  isActive: boolean
  createdAt?: any
  importedFrom?: string
}

interface DuplicateGroup {
  name: string
  venues: Venue[]
}

export default function VenuesCleanupPage() {
  const router = useRouter()
  
  const [venues, setVenues] = useState<Venue[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processMessage, setProcessMessage] = useState('')
  
  // Stats
  const [totalVenues, setTotalVenues] = useState(0)
  const [activeVenues, setActiveVenues] = useState(0)
  const [inactiveVenues, setInactiveVenues] = useState(0)
  const [duplicateCount, setDuplicateCount] = useState(0)

  // Filter
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, 'venues'))
      const allVenues: Venue[] = []
      const citySet = new Set<string>()
      
      snapshot.forEach(doc => {
        const data = doc.data()
        
        // ✅ CRITICAL FIX: Check ONLY 'active' field - exactly like Venues page!
        // Venues page uses: venue.active ? "ACTIVE" : "INACTIVE"
        // So we must use the same logic!
        const isActive = data.active === true
        
        const venue: Venue = {
          id: doc.id,
          displayName: data.displayName || data.name || doc.id,
          city: data.city || '',
          address: data.address || data.location?.address || '',
          isActive: isActive,
          createdAt: data.createdAt,
          importedFrom: data.importedFrom
        }
        allVenues.push(venue)
        if (venue.city) citySet.add(venue.city)
      })
      
      setVenues(allVenues)
      setCities(Array.from(citySet).sort())
      setTotalVenues(allVenues.length)
      
      const active = allVenues.filter(v => v.isActive).length
      const inactive = allVenues.filter(v => !v.isActive).length
      
      console.log('Venues loaded:', allVenues.length, 'Active:', active, 'Inactive:', inactive)
      
      setActiveVenues(active)
      setInactiveVenues(inactive)
      
      // Find duplicates
      findDuplicates(allVenues)
      
    } catch (error) {
      console.error('Error loading venues:', error)
    }
    setLoading(false)
  }

  const findDuplicates = (allVenues: Venue[]) => {
    const duplicateGroups: DuplicateGroup[] = []
    const processedIds = new Set<string>()
    
    for (let i = 0; i < allVenues.length; i++) {
      const venue1 = allVenues[i]
      if (processedIds.has(venue1.id)) continue
      
      // Normalize name for comparison
      const name1 = venue1.displayName.toLowerCase().replace(/[^a-zא-ת0-9]/g, '').trim()
      
      const group: Venue[] = [venue1]
      
      for (let j = i + 1; j < allVenues.length; j++) {
        const venue2 = allVenues[j]
        if (processedIds.has(venue2.id)) continue
        
        const name2 = venue2.displayName.toLowerCase().replace(/[^a-zא-ת0-9]/g, '').trim()
        
        // Check if names are similar:
        // 1. Exact match
        // 2. One contains the other (at least 4 chars)
        // 3. Same city required for partial matches
        const isExactMatch = name1 === name2
        const name1ContainsName2 = name1.length >= 4 && name2.length >= 4 && name1.includes(name2)
        const name2ContainsName1 = name1.length >= 4 && name2.length >= 4 && name2.includes(name1)
        const sameCity = venue1.city === venue2.city || !venue1.city || !venue2.city
        
        if (isExactMatch || ((name1ContainsName2 || name2ContainsName1) && sameCity)) {
          group.push(venue2)
          processedIds.add(venue2.id)
        }
      }
      
      if (group.length > 1) {
        // Sort: manual first (no importedFrom), then active first
        group.sort((a, b) => {
          // Manual (no importedFrom) first
          if (!a.importedFrom && b.importedFrom) return -1
          if (a.importedFrom && !b.importedFrom) return 1
          // Active first
          if (a.isActive && !b.isActive) return -1
          if (!a.isActive && b.isActive) return 1
          return 0
        })
        
        duplicateGroups.push({
          name: group[0].displayName,
          venues: group
        })
        processedIds.add(venue1.id)
      }
    }
    
    // Count total duplicates (extras to delete)
    let count = 0
    duplicateGroups.forEach(g => count += g.venues.length - 1)
    
    setDuplicates(duplicateGroups)
    setDuplicateCount(count)
  }

  // Filter duplicates by city
  const filteredDuplicates = cityFilter === 'all' 
    ? duplicates 
    : duplicates.filter(g => g.venues.some(v => v.city === cityFilter))

  // Bulk activate all inactive venues
  const activateAll = async () => {
    const inactive = venues.filter(v => !v.isActive)
    if (inactive.length === 0) {
      alert('כל המקומות כבר פעילים!')
      return
    }
    
    if (!confirm(`להפעיל ${inactive.length} מקומות?`)) return
    
    setProcessing(true)
    setProcessMessage(`מפעיל ${inactive.length} מקומות...`)
    
    try {
      let count = 0
      const batchSize = 400
      
      // Process in batches of 400
      for (let i = 0; i < inactive.length; i += batchSize) {
        const batch = writeBatch(db)
        const chunk = inactive.slice(i, i + batchSize)
        
        for (const venue of chunk) {
          batch.update(doc(db, 'venues', venue.id), {
            active: true,  // ✅ FIX: Use 'active' not 'isActive'
            isActive: true, // Also set isActive for compatibility
            updatedAt: Timestamp.now()
          })
        }
        
        await batch.commit()
        count += chunk.length
        setProcessMessage(`הופעלו ${count}/${inactive.length}...`)
      }
      
      alert(`✅ הופעלו ${inactive.length} מקומות בהצלחה!`)
      loadVenues()
      
    } catch (error) {
      console.error('Error activating:', error)
      alert('שגיאה בהפעלה: ' + (error as any).message)
    }
    
    setProcessing(false)
    setProcessMessage('')
  }

  // Bulk activate only imported venues
  const activateImported = async () => {
    const imported = venues.filter(v => !v.isActive && v.importedFrom === 'google-places')
    if (imported.length === 0) {
      alert('כל המקומות המיובאים כבר פעילים!')
      return
    }
    
    if (!confirm(`להפעיל ${imported.length} מקומות מיובאים?`)) return
    
    setProcessing(true)
    setProcessMessage(`מפעיל ${imported.length} מקומות מיובאים...`)
    
    try {
      let count = 0
      const batchSize = 400
      
      for (let i = 0; i < imported.length; i += batchSize) {
        const batch = writeBatch(db)
        const chunk = imported.slice(i, i + batchSize)
        
        for (const venue of chunk) {
          batch.update(doc(db, 'venues', venue.id), {
            active: true,  // ✅ FIX: Use 'active' not 'isActive'
            isActive: true, // Also set isActive for compatibility
            updatedAt: Timestamp.now()
          })
        }
        
        await batch.commit()
        count += chunk.length
        setProcessMessage(`הופעלו ${count}/${imported.length}...`)
      }
      
      alert(`✅ הופעלו ${imported.length} מקומות מיובאים!`)
      loadVenues()
      
    } catch (error) {
      console.error('Error:', error)
      alert('שגיאה: ' + (error as any).message)
    }
    
    setProcessing(false)
    setProcessMessage('')
  }

  // Delete a single duplicate
  const deleteDuplicate = async (venueId: string, venueName: string) => {
    if (!confirm(`למחוק את "${venueName}"?`)) return
    
    try {
      await deleteDoc(doc(db, 'venues', venueId))
      // Refresh immediately
      await loadVenues()
      alert('✅ נמחק!')
    } catch (error) {
      console.error('Error deleting:', error)
      alert('שגיאה במחיקה')
    }
  }

  // Delete all duplicates (keep first in each group)
  const deleteAllDuplicates = async () => {
    const toDelete: Venue[] = []
    
    for (const group of filteredDuplicates) {
      // Keep first (manual), delete rest (imported)
      for (let i = 1; i < group.venues.length; i++) {
        toDelete.push(group.venues[i])
      }
    }
    
    if (toDelete.length === 0) {
      alert('אין כפילויות למחיקה!')
      return
    }
    
    if (!confirm(`למחוק ${toDelete.length} כפילויות?\n\nישאר המקום הראשון בכל קבוצה (בדרך כלל הידני).`)) return
    
    setProcessing(true)
    setProcessMessage(`מוחק ${toDelete.length} כפילויות...`)
    
    try {
      let count = 0
      const batchSize = 400
      
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = writeBatch(db)
        const chunk = toDelete.slice(i, i + batchSize)
        
        for (const venue of chunk) {
          batch.delete(doc(db, 'venues', venue.id))
        }
        
        await batch.commit()
        count += chunk.length
        setProcessMessage(`נמחקו ${count}/${toDelete.length}...`)
      }
      
      alert(`✅ נמחקו ${toDelete.length} כפילויות!`)
      loadVenues()
      
    } catch (error) {
      console.error('Error:', error)
      alert('שגיאה: ' + (error as any).message)
    }
    
    setProcessing(false)
    setProcessMessage('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] p-8 rounded-2xl border border-yellow-500/30 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold">{processMessage}</h3>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-red-500/20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/super/venues')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                🧹
              </div>
              <div>
                <h1 className="text-lg font-bold text-red-400">Venues Cleanup</h1>
                <p className="text-xs text-gray-400">ניקוי כפילויות והפעלה המונית</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-1 bg-green-500/10 rounded-lg">
                <div className="font-bold text-green-400">{activeVenues}</div>
                <div className="text-xs text-gray-500">פעילים</div>
              </div>
              <div className="text-center px-3 py-1 bg-gray-500/10 rounded-lg">
                <div className="font-bold text-gray-400">{inactiveVenues}</div>
                <div className="text-xs text-gray-500">לא פעילים</div>
              </div>
              <div className="text-center px-3 py-1 bg-red-500/10 rounded-lg">
                <div className="font-bold text-red-400">{duplicateCount}</div>
                <div className="text-xs text-gray-500">כפילויות</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.button
            onClick={activateAll}
            disabled={processing || inactiveVenues === 0}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              inactiveVenues === 0 
                ? 'bg-gray-500/10 border-gray-500/30 cursor-not-allowed opacity-50'
                : 'bg-green-500/10 border-green-500/30 hover:border-green-500/60'
            }`}
            whileHover={inactiveVenues > 0 ? { scale: 1.02 } : {}}
            whileTap={inactiveVenues > 0 ? { scale: 0.98 } : {}}
          >
            {inactiveVenues === 0 ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-bold text-green-400">✅ הכל פעיל!</h3>
                <p className="text-xs text-gray-400 mt-1">כל {activeVenues} המקומות פעילים</p>
              </>
            ) : (
              <>
                <Power className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-bold text-green-400">הפעל הכל</h3>
                <p className="text-xs text-gray-400 mt-1">{inactiveVenues} מקומות לא פעילים</p>
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={activateImported}
            disabled={processing}
            className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-500/60 transition-all text-center disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-bold text-blue-400">הפעל מיובאים</h3>
            <p className="text-xs text-gray-400 mt-1">רק מקומות מ-Google Places</p>
          </motion.button>
          
          <motion.button
            onClick={deleteAllDuplicates}
            disabled={processing || filteredDuplicates.length === 0}
            className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 hover:border-red-500/60 transition-all text-center disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="font-bold text-red-400">מחק כפילויות</h3>
            <p className="text-xs text-gray-400 mt-1">{duplicateCount} כפילויות נמצאו</p>
          </motion.button>
          
          <motion.button
            onClick={() => router.push('/admin/super/name-cleaner')}
            className="p-4 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all text-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Scissors className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="font-bold text-yellow-400">קצר שמות</h3>
            <p className="text-xs text-gray-400 mt-1">Name Cleaner</p>
          </motion.button>
        </div>

        {/* City Filter */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-gray-400">סנן לפי עיר:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">כל הערים</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={loadVenues}>
            <RefreshCw className="w-4 h-4 mr-1" />
            רענן
          </Button>
        </div>

        {/* Duplicates List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Copy className="w-5 h-5 text-red-400" />
            כפילויות ({filteredDuplicates.length} קבוצות)
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
          ) : filteredDuplicates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p>אין כפילויות! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDuplicates.map((group, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#111] border border-red-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold text-white">{group.name}</h3>
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                      {group.venues.length} כפילויות
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {group.venues.map((venue, vIdx) => (
                      <div 
                        key={venue.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          vIdx === 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/5 border border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {vIdx === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-400" />
                          )}
                          <div>
                            <span className="text-sm">{venue.displayName}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{venue.city}</span>
                              {venue.importedFrom && (
                                <span className="text-blue-400">[מיובא]</span>
                              )}
                              {!venue.importedFrom && (
                                <span className="text-green-400">[ידני]</span>
                              )}
                              <span className={venue.isActive ? 'text-green-400' : 'text-gray-500'}>
                                {venue.isActive ? 'פעיל' : 'לא פעיל'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {vIdx === 0 ? (
                          <span className="text-xs text-green-400">✓ ישאר</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDuplicate(venue.id, venue.displayName)}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-[#111] rounded-xl border border-white/10">
          <h3 className="font-bold mb-3">📋 איך זה עובד:</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><span className="text-green-400">✓ ירוק</span> = המקום שישאר (בדרך כלל הידני)</li>
            <li><span className="text-red-400">✗ אדום</span> = כפילות למחיקה (בדרך כלל המיובא)</li>
            <li><span className="text-blue-400">[מיובא]</span> = הגיע מ-Google Places</li>
            <li><span className="text-green-400">[ידני]</span> = נוצר ידנית</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
