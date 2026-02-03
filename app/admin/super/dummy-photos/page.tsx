"use client"

/**
 * 📸 I4IGUANA - Dummy Photos Manager
 * 
 * Features:
 * - View all dummy photos by zone
 * - Upload new photos
 * - Shuffle photos between dummies
 * - Replace individual photos
 * - Bulk photo operations
 * 
 * v1.0.0
 */

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Loader2,
  RefreshCw,
  Upload,
  Shuffle,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Eye,
  Filter,
  Camera,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

interface DummyUser {
  id: string
  name: string
  gender: 'male' | 'female'
  photos: string[]
  dummyZone?: string
  city?: string
}

interface ZoneGroup {
  zoneId: string
  zoneName: string
  city: string
  dummies: DummyUser[]
}

// Zone display names
const ZONE_NAMES: Record<string, string> = {
  'ashkelon-marina': '🏖️ מרינה אשקלון',
  'ashkelon-delila': '🌴 דלילה',
  'ashkelon-barnea': '🏠 ברנע',
  'ashkelon-city-center': '🏙️ מרכז אשקלון',
  'tlv-rothschild': '🍸 רוטשילד',
  'tlv-florentin': '🎨 פלורנטין',
  'tlv-dizengoff': '🛍️ דיזנגוף',
  'tlv-port': '⚓ נמל ת"א',
  'tlv-neve-tzedek': '🏛️ נווה צדק',
  'rehovot-science-park': '🔬 פארק המדע',
  'rehovot-herzl': '🌳 הרצל רחובות',
  'jlm-mahane-yehuda': '🥙 מחנה יהודה',
  'jlm-german-colony': '🏘️ מושבה גרמנית',
  'haifa-downtown': '🏢 מרכז חיפה',
  'haifa-carmel': '🌲 כרמל',
  'beer-sheva-old': '🏜️ באר שבע עתיקה',
  'eilat-promenade': '🌴 טיילת אילת',
  // Add more as needed
}

export default function DummyPhotosManager() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processMessage, setProcessMessage] = useState('')
  
  const [dummies, setDummies] = useState<DummyUser[]>([])
  const [zoneGroups, setZoneGroups] = useState<ZoneGroup[]>([])
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  
  // Upload state
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [previewDummy, setPreviewDummy] = useState<DummyUser | null>(null)
  
  // Stats
  const [totalDummies, setTotalDummies] = useState(0)
  const [withPhotos, setWithPhotos] = useState(0)
  const [withoutPhotos, setWithoutPhotos] = useState(0)

  useEffect(() => {
    loadDummies()
  }, [])

  const loadDummies = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const allDummies: DummyUser[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        if (data.isDummy) {
          allDummies.push({
            id: doc.id,
            name: data.name || 'Unknown',
            gender: data.gender || 'female',
            photos: data.photos || [],
            dummyZone: data.dummyZone || 'unknown',
            city: data.city || ''
          })
        }
      })
      
      setDummies(allDummies)
      setTotalDummies(allDummies.length)
      setWithPhotos(allDummies.filter(d => d.photos.length > 0).length)
      setWithoutPhotos(allDummies.filter(d => d.photos.length === 0).length)
      
      // Group by zone
      const groups = new Map<string, ZoneGroup>()
      
      for (const dummy of allDummies) {
        const zoneId = dummy.dummyZone || 'unknown'
        if (!groups.has(zoneId)) {
          groups.set(zoneId, {
            zoneId,
            zoneName: ZONE_NAMES[zoneId] || zoneId,
            city: dummy.city || '',
            dummies: []
          })
        }
        groups.get(zoneId)!.dummies.push(dummy)
      }
      
      setZoneGroups(Array.from(groups.values()).sort((a, b) => a.zoneName.localeCompare(b.zoneName)))
      
    } catch (error) {
      console.error('Error loading dummies:', error)
    }
    setLoading(false)
  }

  // Filter dummies
  const getFilteredDummies = () => {
    let filtered = dummies
    
    if (selectedZone !== 'all') {
      filtered = filtered.filter(d => d.dummyZone === selectedZone)
    }
    
    if (genderFilter !== 'all') {
      filtered = filtered.filter(d => d.gender === genderFilter)
    }
    
    return filtered
  }

  // Shuffle photos within a zone
  const shuffleZonePhotos = async (zoneId: string) => {
    const zoneDummies = dummies.filter(d => d.dummyZone === zoneId)
    if (zoneDummies.length < 2) {
      alert('צריך לפחות 2 דמות באזור כדי לערבל!')
      return
    }
    
    // Separate by gender
    const males = zoneDummies.filter(d => d.gender === 'male')
    const females = zoneDummies.filter(d => d.gender === 'female')
    
    if (!confirm(`לערבל תמונות ב-${ZONE_NAMES[zoneId] || zoneId}?\n\n${males.length} גברים, ${females.length} נשים`)) return
    
    setProcessing(true)
    setProcessMessage('מערבל תמונות...')
    
    try {
      const batch = writeBatch(db)
      
      // Shuffle male photos
      if (males.length > 1) {
        const malePhotos = males.flatMap(d => d.photos).filter(p => p)
        shuffleArray(malePhotos)
        
        let photoIndex = 0
        for (const dummy of males) {
          const photosCount = dummy.photos.length || 1
          const newPhotos = malePhotos.slice(photoIndex, photoIndex + photosCount)
          photoIndex += photosCount
          
          if (newPhotos.length > 0) {
            batch.update(doc(db, 'users', dummy.id), { photos: newPhotos })
          }
        }
      }
      
      // Shuffle female photos
      if (females.length > 1) {
        const femalePhotos = females.flatMap(d => d.photos).filter(p => p)
        shuffleArray(femalePhotos)
        
        let photoIndex = 0
        for (const dummy of females) {
          const photosCount = dummy.photos.length || 1
          const newPhotos = femalePhotos.slice(photoIndex, photoIndex + photosCount)
          photoIndex += photosCount
          
          if (newPhotos.length > 0) {
            batch.update(doc(db, 'users', dummy.id), { photos: newPhotos })
          }
        }
      }
      
      await batch.commit()
      alert('✅ התמונות עורבלו בהצלחה!')
      loadDummies()
      
    } catch (error) {
      console.error('Error shuffling:', error)
      alert('שגיאה בערבול')
    }
    
    setProcessing(false)
    setProcessMessage('')
  }

  // Shuffle all photos (same gender only)
  const shuffleAllPhotos = async () => {
    if (!confirm('לערבל את כל התמונות בכל האזורים?\n\n(גברים עם גברים, נשים עם נשים)')) return
    
    setProcessing(true)
    setProcessMessage('מערבל את כל התמונות...')
    
    try {
      const males = dummies.filter(d => d.gender === 'male')
      const females = dummies.filter(d => d.gender === 'female')
      
      // Collect all photos
      const malePhotos = males.flatMap(d => d.photos).filter(p => p)
      const femalePhotos = females.flatMap(d => d.photos).filter(p => p)
      
      // Shuffle
      shuffleArray(malePhotos)
      shuffleArray(femalePhotos)
      
      // Redistribute
      const batchSize = 400
      let operations: { id: string, photos: string[] }[] = []
      
      let maleIndex = 0
      for (const dummy of males) {
        const count = Math.max(1, dummy.photos.length)
        const newPhotos = malePhotos.slice(maleIndex, maleIndex + count)
        maleIndex += count
        if (newPhotos.length > 0) {
          operations.push({ id: dummy.id, photos: newPhotos })
        }
      }
      
      let femaleIndex = 0
      for (const dummy of females) {
        const count = Math.max(1, dummy.photos.length)
        const newPhotos = femalePhotos.slice(femaleIndex, femaleIndex + count)
        femaleIndex += count
        if (newPhotos.length > 0) {
          operations.push({ id: dummy.id, photos: newPhotos })
        }
      }
      
      // Execute in batches
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = writeBatch(db)
        const chunk = operations.slice(i, i + batchSize)
        
        for (const op of chunk) {
          batch.update(doc(db, 'users', op.id), { photos: op.photos })
        }
        
        await batch.commit()
        setProcessMessage(`עודכנו ${Math.min(i + batchSize, operations.length)}/${operations.length}...`)
      }
      
      alert('✅ כל התמונות עורבלו!')
      loadDummies()
      
    } catch (error) {
      console.error('Error:', error)
      alert('שגיאה')
    }
    
    setProcessing(false)
    setProcessMessage('')
  }

  // Upload photo for a dummy
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, dummyId: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setProcessing(true)
    setProcessMessage('מעלה תמונה...')
    
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `dummy-photos/${dummyId}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      // Update dummy's photos
      const dummy = dummies.find(d => d.id === dummyId)
      const newPhotos = [downloadURL] // Replace with single photo
      
      await updateDoc(doc(db, 'users', dummyId), { photos: newPhotos })
      
      alert('✅ התמונה הועלתה!')
      loadDummies()
      
    } catch (error) {
      console.error('Error uploading:', error)
      alert('שגיאה בהעלאה')
    }
    
    setProcessing(false)
    setProcessMessage('')
    setUploadingFor(null)
  }

  // Set single photo for dummy (keep only first)
  const setSinglePhoto = async (dummyId: string) => {
    const dummy = dummies.find(d => d.id === dummyId)
    if (!dummy || dummy.photos.length <= 1) return
    
    if (!confirm(`להשאיר רק תמונה אחת ל-${dummy.name}?`)) return
    
    try {
      await updateDoc(doc(db, 'users', dummyId), { 
        photos: [dummy.photos[0]] 
      })
      alert('✅ עודכן!')
      loadDummies()
    } catch (error) {
      alert('שגיאה')
    }
  }

  // Set all dummies to single photo
  const setAllSinglePhoto = async () => {
    const multiPhoto = dummies.filter(d => d.photos.length > 1)
    if (multiPhoto.length === 0) {
      alert('כל הדמות כבר עם תמונה אחת!')
      return
    }
    
    if (!confirm(`להגדיר תמונה אחת לכל ${multiPhoto.length} דמות?`)) return
    
    setProcessing(true)
    setProcessMessage('מעדכן...')
    
    try {
      const batchSize = 400
      
      for (let i = 0; i < multiPhoto.length; i += batchSize) {
        const batch = writeBatch(db)
        const chunk = multiPhoto.slice(i, i + batchSize)
        
        for (const dummy of chunk) {
          batch.update(doc(db, 'users', dummy.id), { 
            photos: [dummy.photos[0]] 
          })
        }
        
        await batch.commit()
        setProcessMessage(`עודכנו ${Math.min(i + batchSize, multiPhoto.length)}/${multiPhoto.length}...`)
      }
      
      alert('✅ כל הדמות עודכנו לתמונה אחת!')
      loadDummies()
      
    } catch (error) {
      console.error('Error:', error)
      alert('שגיאה')
    }
    
    setProcessing(false)
    setProcessMessage('')
  }

  // Helper: shuffle array
  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }

  const filteredDummies = getFilteredDummies()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] p-8 rounded-2xl border border-pink-500/30 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold">{processMessage}</h3>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDummy && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewDummy(null)}>
          <div className="bg-[#111] rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{previewDummy.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewDummy(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {previewDummy.photos.map((photo, idx) => (
                <img 
                  key={idx}
                  src={photo} 
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
            
            <div className="text-sm text-gray-400">
              <p>מגדר: {previewDummy.gender === 'male' ? '👨 גבר' : '👩 אישה'}</p>
              <p>אזור: {ZONE_NAMES[previewDummy.dummyZone || ''] || previewDummy.dummyZone}</p>
              <p>תמונות: {previewDummy.photos.length}</p>
            </div>
            
            <div className="flex gap-2 mt-4">
              {previewDummy.photos.length > 1 && (
                <Button 
                  onClick={() => { setSinglePhoto(previewDummy.id); setPreviewDummy(null); }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  📷 השאר תמונה אחת
                </Button>
              )}
              <Button 
                onClick={() => { setUploadingFor(previewDummy.id); fileInputRef.current?.click(); }}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                <Upload className="w-4 h-4 mr-1" />
                החלף תמונה
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadingFor && handlePhotoUpload(e, uploadingFor)}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-pink-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/super/dummies')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                📸
              </div>
              <div>
                <h1 className="text-lg font-bold text-pink-400">Dummy Photos Manager</h1>
                <p className="text-xs text-gray-400">ניהול והחלפת תמונות דמה</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-1 bg-pink-500/10 rounded-lg">
                <div className="font-bold text-pink-400">{totalDummies}</div>
                <div className="text-xs text-gray-500">דמות</div>
              </div>
              <div className="text-center px-3 py-1 bg-green-500/10 rounded-lg">
                <div className="font-bold text-green-400">{withPhotos}</div>
                <div className="text-xs text-gray-500">עם תמונות</div>
              </div>
              <div className="text-center px-3 py-1 bg-red-500/10 rounded-lg">
                <div className="font-bold text-red-400">{withoutPhotos}</div>
                <div className="text-xs text-gray-500">ללא</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.button
            onClick={shuffleAllPhotos}
            disabled={processing}
            className="p-4 rounded-xl bg-purple-500/10 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all text-center disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Shuffle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="font-bold text-purple-400">ערבל הכל</h3>
            <p className="text-xs text-gray-400 mt-1">ערבל תמונות בכל האזורים</p>
          </motion.button>
          
          <motion.button
            onClick={setAllSinglePhoto}
            disabled={processing}
            className="p-4 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all text-center disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Camera className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="font-bold text-yellow-400">תמונה אחת לכולם</h3>
            <p className="text-xs text-gray-400 mt-1">השאר רק תמונה ראשונה</p>
          </motion.button>
          
          <motion.button
            onClick={loadDummies}
            disabled={processing}
            className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-500/60 transition-all text-center disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-bold text-blue-400">רענן</h3>
            <p className="text-xs text-gray-400 mt-1">טען מחדש את הנתונים</p>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-[#111] rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">סינון:</span>
          </div>
          
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">כל האזורים</option>
            {zoneGroups.map(group => (
              <option key={group.zoneId} value={group.zoneId}>
                {group.zoneName} ({group.dummies.length})
              </option>
            ))}
          </select>
          
          <div className="flex gap-2">
            <Button
              variant={genderFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenderFilter('all')}
            >
              הכל
            </Button>
            <Button
              variant={genderFilter === 'female' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenderFilter('female')}
              className={genderFilter === 'female' ? 'bg-pink-600' : ''}
            >
              👩 נשים
            </Button>
            <Button
              variant={genderFilter === 'male' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenderFilter('male')}
              className={genderFilter === 'male' ? 'bg-blue-600' : ''}
            >
              👨 גברים
            </Button>
          </div>
          
          {selectedZone !== 'all' && (
            <Button
              onClick={() => shuffleZonePhotos(selectedZone)}
              className="bg-purple-600 hover:bg-purple-700 ml-auto"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              ערבל אזור זה
            </Button>
          )}
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                📸 {filteredDummies.length} דמות
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredDummies.map(dummy => (
                <motion.div
                  key={dummy.id}
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setPreviewDummy(dummy)}
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] border-2 border-white/10 hover:border-pink-500/50 transition-all">
                    {dummy.photos[0] ? (
                      <img 
                        src={dummy.photos[0]} 
                        alt={dummy.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all rounded-xl flex flex-col items-center justify-center p-2">
                    <p className="text-sm font-medium truncate w-full text-center">{dummy.name}</p>
                    <p className="text-xs text-gray-400">{dummy.photos.length} תמונות</p>
                    <div className="flex gap-1 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${dummy.gender === 'female' ? 'bg-pink-500/30 text-pink-300' : 'bg-blue-500/30 text-blue-300'}`}>
                        {dummy.gender === 'female' ? '👩' : '👨'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Photo count badge */}
                  {dummy.photos.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full">
                      {dummy.photos.length}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 p-4 bg-[#111] rounded-xl border border-white/10">
          <h3 className="font-bold mb-3">📋 איך זה עובד:</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>🔀 <span className="text-purple-400">ערבל הכל</span> - מערבל תמונות בין דמות מאותו מגדר</li>
            <li>📷 <span className="text-yellow-400">תמונה אחת לכולם</span> - משאיר רק תמונה ראשונה לכל דמה</li>
            <li>👆 לחץ על דמה לצפייה והחלפת תמונה</li>
            <li>🎯 סנן לפי אזור וערבל רק את האזור הספציפי</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
