"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Loader2, User, ChevronLeft, ChevronRight, X, Plus, Wine, Cigarette, Ruler, Briefcase, GraduationCap, Heart, Trash2, Home, Bell, MessageCircle, CheckCircle, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { auth, db } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'

interface ProfileData {
  displayName: string
  age: number
  birthDate?: string  // ✅ NEW: Birth date for age validation
  bio: string
  photoURL: string
  photos: string[]
  hobbies: string[]
  // Lifestyle
  drinking: 'never' | 'social' | 'regular'
  smoking: 'no' | 'social' | 'yes'
  height: string
  // Optional
  occupation: string
  education: string
  lookingFor: 'relationship' | 'casual' | 'friends'
}

interface ProfileScreenProps {
  onNavigate: (screen: string) => void
  hasActiveMatch?: boolean
  // 🆕 NEW: Add key prop that changes when navigating back to trigger reload
  refreshKey?: number
}

export default function ProfileScreen({ onNavigate, hasActiveMatch = false, refreshKey = 0 }: ProfileScreenProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: 25,
    bio: '',
    photoURL: '',
    photos: [],
    hobbies: [],
    drinking: 'social',
    smoking: 'no',
    height: '',
    occupation: '',
    education: '',
    lookingFor: 'relationship'
  })
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [showHobbyModal, setShowHobbyModal] = useState(false)
  const [newHobby, setNewHobby] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 🆕 NEW: Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // ✅ NEW: Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // Height slider state
  const [heightValue, setHeightValue] = useState(170)
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inch'>('cm')

  const cmToInch = (cm: number) => Math.round(cm / 2.54)
  const inchToCm = (inch: number) => Math.round(inch * 2.54)

  const displayValue = heightUnit === 'cm' ? heightValue : cmToInch(heightValue)
  const minValue = heightUnit === 'cm' ? 100 : 39
  const maxValue = heightUnit === 'cm' ? 220 : 87

  // ✅ NEW: Birth date and age validation
  const [birthDate, setBirthDate] = useState('')
  const [ageError, setAgeError] = useState('')

  // ✅ Calculate age from birth date
  const calculateAge = (birthDateStr: string): number => {
    const birthDateObj = new Date(birthDateStr)
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }
    
    return age
  }

  // ✅ Convert age to approximate birth date (for display)
  const ageToBirthDate = (age: number): string => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - age)
    return date.toISOString().split('T')[0]
  }

  // ✅ Handle birth date change with validation
  const handleBirthDateChange = (dateValue: string) => {
    setBirthDate(dateValue)
    setAgeError('')
    
    if (dateValue) {
      const calculatedAge = calculateAge(dateValue)
      
      // Validation: Must be 18+
      if (calculatedAge < 18) {
        setAgeError("You must be at least 18 years old")
        return
      }
      
      // Validation: Reasonable age
      if (calculatedAge > 120) {
        setAgeError("Please enter a valid birth date")
        return
      }
      
      // ✅ Update profile data with new age
      setProfileData({ ...profileData, age: calculatedAge, birthDate: dateValue })
    }
  }


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user)
        await loadProfileData(user.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  // ✅ FIXED: Reload profile when refreshKey changes (when navigating back)
  useEffect(() => {
    const reloadProfile = async () => {
      if (currentUser) {
        console.log('🔄 Reloading profile data... (refreshKey changed)')
        await loadProfileData(currentUser.uid)
      }
    }
    
    // Reload profile whenever refreshKey changes
    if (refreshKey > 0) {
      reloadProfile()
    }
  }, [refreshKey, currentUser])

  // Parse height from string format
  useEffect(() => {
    if (profileData.height) {
      const heightStr = profileData.height
      if (heightStr.includes('cm')) {
        const cm = parseInt(heightStr.replace('cm', ''))
        if (!isNaN(cm)) {
          setHeightValue(cm)
          setHeightUnit('cm')
        }
      } else if (heightStr.includes('"') || heightStr.includes('inch')) {
        const inch = parseInt(heightStr.replace(/[^0-9]/g, ''))
        if (!isNaN(inch)) {
          setHeightValue(inchToCm(inch))
          setHeightUnit('inch')
        }
      }
    }
  }, [profileData.height])

  const loadProfileData = async (uid: string) => {
    try {
      console.log('📸 Loading profile data for:', uid)
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        console.log('✅ Profile data loaded from Firestore:', data)
        
        // ✅ CRITICAL FIX: Load photos array as-is from Firestore
        // DO NOT add photoURL if it's not in photos - user may have deleted it!
        const photos = data.photos || []
        
        // ✅ NEW: Calculate birthDate from age if not stored
        const age = data.age || 25
        const storedBirthDate = data.birthDate || ageToBirthDate(age)
        setBirthDate(storedBirthDate)
        
        setProfileData({
          displayName: data.name || data.displayName || '',  // ✅ FIX: Profile name FIRST, Google name fallback
          age: age,
          birthDate: storedBirthDate,
          bio: data.bio || '',
          photoURL: data.photoURL || '',
          photos: photos,
          hobbies: data.hobbies || [],
          drinking: data.drinking || 'social',
          smoking: data.smoking || 'no',
          height: data.height || '',
          occupation: data.occupation || '',
          education: data.education || '',
          lookingFor: data.lookingFor || 'relationship'
        })
        console.log('📸 Total photos loaded:', photos.length)
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error)
    }
  }

  const handlePhotoClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => handleFileChange(e)
    input.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    if (profileData.photos.length >= 6) {
      toast({
        title: "מקסימום תמונות",
        description: "ניתן להעלות עד 6 תמונות",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      const imageUrl = await uploadToCloudinary(file)
      
      const updatedPhotos = [...profileData.photos, imageUrl]
      setProfileData({
        ...profileData,
        photos: updatedPhotos,
        photoURL: profileData.photoURL || imageUrl
      })
      
      setCurrentPhotoIndex(updatedPhotos.length - 1)
      
      toast({
        title: "תמונה הועלתה!",
        description: "התמונה הועלתה בהצלחה.",
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: "שגיאה",
        description: "העלאת התמונה נכשלה.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (index: number) => {
    // ✅ CRITICAL: Prevent deleting the last photo - profile must have at least 1 photo!
    if (profileData.photos.length <= 1) {
      console.log('🚫 Cannot delete last photo - profile must have at least 1 photo')
      toast({
        title: "Cannot Delete",
        description: "Your profile must have at least one photo.",
        variant: "destructive",
      })
      return
    }
    
    const updatedPhotos = profileData.photos.filter((_, i) => i !== index)
    const newPhotoURL = updatedPhotos[0] || ''
    
    const newProfileData = {
      ...profileData,
      photos: updatedPhotos,
      photoURL: newPhotoURL
    }
    
    // ✅ CRITICAL: Update state immediately
    setProfileData(newProfileData)
    
    if (currentPhotoIndex >= updatedPhotos.length) {
      setCurrentPhotoIndex(Math.max(0, updatedPhotos.length - 1))
    }
    
    // ✅ AUTO-SAVE: Save immediately to Firestore
    if (currentUser) {
      try {
        console.log('🗑️ Photo deleted, auto-saving to Firestore...')
        console.log('📸 New photos array:', updatedPhotos)
        console.log('📸 New photoURL:', newPhotoURL)
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
          photos: updatedPhotos,
          photoURL: newPhotoURL
        })
        
        console.log('✅ Photo deletion saved to Firestore successfully!')
        
        // ✅ Show Hollywood-style success modal
        setShowSuccessModal(true)
        setTimeout(() => setShowSuccessModal(false), 2000)
        
      } catch (error) {
        console.error('❌ Error saving photo deletion:', error)
        toast({
          title: "Error",
          description: "Failed to save. Please click Save Changes.",
          variant: "destructive",
        })
      }
    }
  }

  // ✅ NEW: Drag & Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    console.log('🎯 Started dragging photo:', index + 1)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    console.log(`📦 Dropping photo ${draggedIndex + 1} at position ${dropIndex + 1}`)

    // Reorder photos array
    const newPhotos = [...profileData.photos]
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(dropIndex, 0, draggedPhoto)

    // Update local state
    setProfileData({ ...profileData, photos: newPhotos })
    setDraggedIndex(null)
    setDragOverIndex(null)
    
    // Update current photo index if needed
    if (currentPhotoIndex === draggedIndex) {
      setCurrentPhotoIndex(dropIndex)
    } else if (draggedIndex < currentPhotoIndex && dropIndex >= currentPhotoIndex) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    } else if (draggedIndex > currentPhotoIndex && dropIndex <= currentPhotoIndex) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }

    // ✅ Auto-save to Firestore
    if (currentUser) {
      try {
        console.log('💾 Auto-saving photo order to Firestore...')
        await updateDoc(doc(db, 'users', currentUser.uid), {
          photos: newPhotos,
          photoURL: newPhotos[0] || ''  // Update main photo
        })
        console.log('✅ Photo order saved!')
        
        toast({
          title: "Photos reordered",
          description: "Your photo order has been updated!",
        })
      } catch (error) {
        console.error('❌ Error saving photo order:', error)
        toast({
          title: "Error",
          description: "Failed to save photo order",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveChanges = async () => {
    if (!currentUser) return
    
    // ✅ NEW: Validate age before saving
    if (ageError) {
      toast({
        title: "Invalid Age",
        description: ageError,
        variant: "destructive",
      })
      return
    }
    
    if (profileData.age < 18) {
      toast({
        title: "Invalid Age",
        description: "You must be at least 18 years old",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      console.log('💾 Starting to save profile changes...')
      console.log('📸 Photos to save:', profileData.photos)
      
      const updatedData = {
        displayName: profileData.displayName,
        name: profileData.displayName,
        age: profileData.age,
        birthDate: birthDate,  // ✅ NEW: Save birth date too
        bio: profileData.bio,
        photoURL: profileData.photos[0] || profileData.photoURL,
        photos: profileData.photos,
        hobbies: profileData.hobbies,
        drinking: profileData.drinking,
        smoking: profileData.smoking,
        height: profileData.height,
        occupation: profileData.occupation,
        education: profileData.education,
        lookingFor: profileData.lookingFor
      }

      console.log('📝 Saving to Firestore:', updatedData)
      await updateDoc(doc(db, 'users', currentUser.uid), updatedData)
      console.log('✅ Profile saved successfully to Firestore!')
      
      // ✅ REPLACED: Show Hollywood-style success modal instead of browser alert
      setShowSuccessModal(true)
      setTimeout(() => setShowSuccessModal(false), 2000)
      
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      toast({
        title: "Error Saving Profile",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addSuggestedHobby = (hobby: string) => {
    if (!profileData.hobbies.includes(hobby) && profileData.hobbies.length < 10) {
      setProfileData({
        ...profileData,
        hobbies: [...profileData.hobbies, hobby]
      })
    }
  }

  const saveNewHobby = () => {
    if (newHobby.trim() && !profileData.hobbies.includes(newHobby.trim()) && profileData.hobbies.length < 10) {
      setProfileData({
        ...profileData,
        hobbies: [...profileData.hobbies, newHobby.trim()]
      })
      setNewHobby('')
      setShowHobbyModal(false)
    }
  }

  const removeHobby = (index: number) => {
    setProfileData({
      ...profileData,
      hobbies: profileData.hobbies.filter((_, i) => i !== index)
    })
  }

  const handleLogout = async () => {
    try {
      // ✅ FIX: Clear localStorage and sessionStorage on logout
      localStorage.removeItem('hasScannedQR')
      localStorage.removeItem('pendingCheckIn')
      
      // ✅ NEW: Clear match sound timestamps for all users
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('match_sound_played_')) {
          localStorage.removeItem(key)
        }
      })
      
      sessionStorage.clear()
      
      await signOut(auth)
      onNavigate('welcome')  // ✅ Go to welcome, not login
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE' || !currentUser) return

    try {
      setIsDeleting(true)
      
      // ✅ FIX: Use the proper delete service for full cleanup
      const { deleteUserAccount } = await import('@/lib/delete-account-service')
      const result = await deleteUserAccount(currentUser.uid)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account')
      }
      
      console.log('✅ Account deleted successfully')
      
      // ✅ CRITICAL FIX: Set flag BEFORE signOut to prevent race condition
      // This flag tells page.tsx to go straight to welcome, bypassing all checks
      localStorage.setItem('i4iguana_just_deleted', 'true')
      
      // ✅ FIX: Clear ALL other localStorage and sessionStorage
      localStorage.removeItem('hasScannedQR')
      localStorage.removeItem('pendingCheckIn')
      
      // ✅ NEW: Clear match sound timestamps for all users
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('match_sound_played_')) {
          localStorage.removeItem(key)
        }
      })
      
      sessionStorage.clear()
      
      // Sign out and navigate to welcome (not login - they need fresh start)
      await signOut(auth)
      onNavigate('welcome')
      
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const allPhotos = profileData.photos.length > 0 ? profileData.photos : (profileData.photoURL ? [profileData.photoURL] : [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] pb-24 custom-scrollbar mobile-scrollbar">
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-30 bg-gradient-to-r from-[#0d2920] to-[#1a4d3e] backdrop-blur-xl border-b-2 border-[#4ade80]/30 px-6 py-4"
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="h-7 w-7 text-[#4ade80]" />
            My Profile
          </h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500 rounded-xl px-4 py-2"
          >
            Logout
          </Button>
        </div>
      </motion.div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Photo Gallery Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-2 border-[#4ade80]/30 overflow-hidden shadow-2xl"
        >
          <div className="relative aspect-square">
            {allPhotos.length > 0 ? (
              <>
                <motion.img
                  key={currentPhotoIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={allPhotos[currentPhotoIndex]}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation arrows */}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                      disabled={currentPhotoIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-30 rounded-full p-2 transition-all"
                    >
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                    <button
                      onClick={() => setCurrentPhotoIndex(Math.min(allPhotos.length - 1, currentPhotoIndex + 1))}
                      disabled={currentPhotoIndex === allPhotos.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-30 rounded-full p-2 transition-all"
                    >
                      <ChevronRight className="h-6 w-6 text-white" />
                    </button>
                  </>
                )}

                {/* Delete photo button - HIDDEN when only 1 photo remains */}
                {profileData.photos.length > 1 && (
                  <button
                    onClick={() => handleDeletePhoto(currentPhotoIndex)}
                    className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 rounded-full p-2 transition-all"
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </button>
                )}

                {/* Photo counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-white text-sm font-medium">
                    {currentPhotoIndex + 1} / {allPhotos.length}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#1a4d3e] to-[#0d2920]">
                <div className="text-center">
                  <User className="h-20 w-20 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">No photos yet</p>
                </div>
              </div>
            )}

            {/* Upload overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-[#4ade80] animate-spin" />
              </div>
            )}
          </div>

          {/* Photo thumbnails */}
          <div className="p-4 bg-[#0d2920]/50">
            <div className="flex gap-2 overflow-x-auto pb-2 photo-scroll">
              {allPhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-move ${
                    index === currentPhotoIndex
                      ? 'border-[#4ade80] scale-110'
                      : 'border-white/20 hover:border-white/40'
                  } ${
                    dragOverIndex === index && draggedIndex !== index
                      ? 'border-yellow-400 scale-105'
                      : ''
                  } ${
                    draggedIndex === index
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  <img src={photo} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                  
                  {/* ✅ NEW: Photo number badge */}
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                    {index + 1}
                  </div>
                </button>
              ))}
              
              {allPhotos.length < 6 && (
                <button
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-[#4ade80]/50 hover:border-[#4ade80] bg-[#4ade80]/10 hover:bg-[#4ade80]/20 flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <Plus className="h-6 w-6 text-[#4ade80]" />
                </button>
              )}
            </div>
            
            {/* ✅ NEW: Drag & Drop hint */}
            {allPhotos.length > 1 && (
              <p className="text-xs text-white/40 text-center mt-2">
                💡 Drag photos to reorder (Photo #1 is your main photo)
              </p>
            )}
          </div>
        </motion.div>

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-2 border-[#4ade80]/30 p-6 space-y-4 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-[#4ade80]" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block">Name</label>
              <Input
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                placeholder="Your name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl"
              />
            </div>

            {/* ✅ Age via Birth Date - With Validation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/80 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#4ade80]" />
                  Birth Date
                </label>
                {profileData.age && !ageError && (
                  <span className="text-[#4ade80] text-sm font-semibold">
                    {profileData.age} years old
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`bg-white/10 border-white/20 text-white h-12 rounded-xl ${
                    ageError ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              {/* Error Message */}
              <AnimatePresence>
                {ageError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center gap-2 text-red-400 text-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {ageError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Bio</label>
              <Textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px] rounded-xl resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-2 border-[#4ade80]/30 p-6 space-y-4 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#4ade80]" />
            Interests
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {profileData.hobbies.map((hobby, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-[#4ade80]/20 border border-[#4ade80]/40 rounded-full px-4 py-2 flex items-center gap-2"
              >
                <span className="text-[#4ade80] text-sm font-medium">{hobby}</span>
                <button
                  onClick={() => removeHobby(index)}
                  className="text-[#4ade80] hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
            
            {profileData.hobbies.length < 10 && (
              <button
                onClick={() => setShowHobbyModal(true)}
                className="bg-[#4ade80]/10 border-2 border-dashed border-[#4ade80]/40 hover:border-[#4ade80] hover:bg-[#4ade80]/20 rounded-full px-4 py-2 flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4 text-[#4ade80]" />
                <span className="text-[#4ade80] text-sm font-medium">Add Interest</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Lifestyle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-2 border-[#4ade80]/30 p-6 space-y-4 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wine className="h-5 w-5 text-[#4ade80]" />
            Lifestyle
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2">
                <Wine className="h-4 w-4 text-[#4ade80]" />
                Drinking
              </label>
              <Select
                value={profileData.drinking}
                onValueChange={(value: any) => setProfileData({ ...profileData, drinking: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="social">Socially</SelectItem>
                  <SelectItem value="regular">Regularly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2">
                <Cigarette className="h-4 w-4 text-[#4ade80]" />
                Smoking
              </label>
              <Select
                value={profileData.smoking}
                onValueChange={(value: any) => setProfileData({ ...profileData, smoking: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="social">Socially</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-lg font-semibold mb-4 block flex items-center gap-2">
                <Ruler className="h-5 w-5 text-[#4ade80]" />
                Height: <span className="text-[#4ade80] text-2xl font-bold">{displayValue}</span> <span className="text-white/60">{heightUnit}</span>
              </label>
              <div className="space-y-4">
                <input
                  type="range"
                  min={minValue}
                  max={maxValue}
                  value={displayValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (heightUnit === 'inch') {
                      setHeightValue(inchToCm(val))
                      setProfileData({ ...profileData, height: `${val}"` })
                    } else {
                      setHeightValue(val)
                      setProfileData({ ...profileData, height: `${val}cm` })
                    }
                  }}
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setHeightUnit('cm')}
                    className={`flex-1 py-3 rounded-xl text-lg font-bold transition-all ${
                      heightUnit === 'cm'
                        ? 'bg-[#4ade80] text-[#0d2920]'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    onClick={() => setHeightUnit('inch')}
                    className={`flex-1 py-3 rounded-xl text-lg font-bold transition-all ${
                      heightUnit === 'inch'
                        ? 'bg-[#4ade80] text-[#0d2920]'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    inch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-2 border-[#4ade80]/30 p-6 space-y-4 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#4ade80]" />
            Additional Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#4ade80]" />
                Occupation
              </label>
              <Input
                value={profileData.occupation}
                onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                placeholder="What do you do?"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#4ade80]" />
                Education
              </label>
              <Input
                value={profileData.education}
                onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                placeholder="Your education"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#4ade80]" />
                Looking For
              </label>
              <Select
                value={profileData.lookingFor}
                onValueChange={(value: any) => setProfileData({ ...profileData, lookingFor: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relationship">Relationship</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleSaveChanges}
            disabled={saving || !!ageError}
            className={`w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] text-lg font-bold rounded-2xl shadow-lg disabled:opacity-50 ${ageError ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : ''}`}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : ageError ? (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
                Fix Age Error
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>

        {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="outline"
            className="w-full h-12 border-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500 rounded-xl"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Delete Account
          </Button>
        </motion.div>
      </div>

      {/* 🎬 HOLLYWOOD SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl border-4 border-[#4ade80] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                animate={{
                  background: [
                    "radial-gradient(circle at 50% 50%, rgba(74, 222, 128, 0.3) 0%, transparent 50%)",
                    "radial-gradient(circle at 50% 50%, rgba(74, 222, 128, 0.1) 0%, transparent 70%)",
                    "radial-gradient(circle at 50% 50%, rgba(74, 222, 128, 0.3) 0%, transparent 50%)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0"
              />

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Animated Iguana */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="text-8xl mb-4"
                >
                  🦎
                </motion.div>

                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-4"
                >
                  <CheckCircle className="h-16 w-16 text-[#4ade80] mx-auto" />
                </motion.div>

                {/* Text */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Profile Saved!
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[#4ade80] text-lg"
                >
                  ✨ Changes saved successfully ✨
                </motion.p>
              </div>

              {/* Particles effect */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: [0, Math.random() * 200 - 100],
                    y: [0, Math.random() * 200 - 100],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#4ade80] rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hobby Modal */}
      <AnimatePresence>
        {showHobbyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHobbyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-md w-full border-2 border-[#4ade80]/30 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Add Interest
                </h2>
                <p className="text-white/60 text-sm">
                  Choose from suggestions or add your own
                </p>
              </div>

              {/* Quick Suggestions */}
              <div className="mb-6">
                <p className="text-white/80 text-sm mb-3 font-medium">Popular Interests:</p>
                <div className="flex flex-wrap gap-2">
                  {['Dancing', 'Music', 'Sports', 'Travel', 'Cooking', 'Photography', 'Gaming', 'Reading', 'Fitness', 'Art', 'Movies', 'Yoga'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => addSuggestedHobby(suggestion)}
                      disabled={profileData.hobbies.includes(suggestion)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        profileData.hobbies.includes(suggestion)
                          ? 'bg-white/10 text-white/40 cursor-not-allowed'
                          : 'bg-[#4ade80]/20 border border-[#4ade80]/40 text-[#4ade80] hover:bg-[#4ade80]/30'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block font-medium">
                    Or add custom:
                  </label>
                  <Input
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveNewHobby()}
                    placeholder="e.g., Rock Climbing, Coffee Tasting..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={saveNewHobby}
                    disabled={!newHobby.trim()}
                    className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Interest
                  </Button>
                  <Button
                    onClick={() => {
                      setNewHobby('')
                      setShowHobbyModal(false)
                    }}
                    variant="outline"
                    className="w-full h-10 bg-transparent border-2 border-white/20 text-white hover:bg-white/10 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-md w-full border-2 border-red-500/30 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Delete Account
                </h2>
                <p className="text-red-400 text-sm">
                  This action cannot be undone!
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                <p className="text-red-400 text-sm mb-2">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-red-400 text-sm space-y-1 list-disc list-inside">
                  <li>Your profile and photos</li>
                  <li>All your matches</li>
                  <li>All your messages</li>
                  <li>Your entire history</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
                </label>
                <Input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  className="w-full h-12 bg-black/30 border-2 border-red-500/30 text-white text-center font-mono text-lg rounded-xl focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteText('')
                  }}
                  disabled={isDeleting}
                  variant="outline"
                  className="flex-1 h-12 bg-white/5 border-2 border-white/20 text-white hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== 'DELETE' || isDeleting}
                  className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-5 w-5" />
                      Delete Forever
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-[#0d2920]/90 backdrop-blur-xl border-t-2 border-[#4ade80]/30 z-40"
      >
        <div className="flex justify-around items-center py-4 px-6 max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(hasActiveMatch ? 'match' : 'home')}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-[#4ade80] transition-colors"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('notifications')}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-[#4ade80] transition-colors"
          >
            <Bell className="h-6 w-6" />
            <span className="text-xs">Notifications</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 text-[#4ade80]"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </motion.button>
        </div>
      </motion.div>

    </div>
  )
}
