"use client"

import { useState, useEffect, useRef } from 'react'
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
import LanguageSettings from '@/components/language-settings'  // ✅ v2.8.7: Language settings
import SearchableSelectModal from '@/components/searchable-select-modal'  // ✅ NEW: Searchable select for education & city
import { useLanguage } from '@/lib/LanguageContext'

// ✅ רשימת מוסדות אקדמיים בישראל (כולל מוסדות דתיים)
const ISRAELI_INSTITUTIONS = [
  "Tel Aviv University - אוניברסיטת תל אביב",
  "Hebrew University of Jerusalem - האוניברסיטה העברית",
  "Technion - הטכניון",
  "Ben-Gurion University - אוניברסיטת בן גוריון",
  "Bar-Ilan University - אוניברסיטת בר אילן",
  "University of Haifa - אוניברסיטת חיפה",
  "Weizmann Institute - מכון ויצמן",
  "Open University - האוניברסיטה הפתוחה",
  "Reichman University (IDC) - הבינתחומי הרצליה",
  "Ariel University - אוניברסיטת אריאל",
  "Shenkar College - מכללת שנקר",
  "Bezalel Academy - בצלאל אקדמיה לאמנות ועיצוב",
  "Afeka College - מכללת אפקה",
  "Holon Institute of Technology - HIT",
  "Academic College of Tel Aviv-Yafo - המכללה האקדמית תל אביב-יפו",
  "Sapir College - מכללת ספיר",
  "Ruppin College - מכללת רופין",
  "Kinneret College - המכללה האקדמית כנרת",
  "College of Management - המכללה למנהל",
  "Hadassah Academic College - המכללה האקדמית הדסה",
  "Ort Braude College - מכללת אורט בראודה",
  "Azrieli College - מכללת עזריאלי",
  "Sami Shamoon College - מכללת סמי שמעון",
  "Tel-Hai College - מכללת תל חי",
  "Emek Yezreel College - המכללה האקדמית עמק יזרעאל",
  "Western Galilee College - המכללה האקדמית גליל מערבי",
  "Achva Academic College - המכללה האקדמית אחוה",
  "Safed College - המכללה האקדמית צפת",
  "Shalem College - המרכז האקדמי שלם",
  "Netanya Academic College - המכללה האקדמית נתניה",
  "Lev Academic Center - המרכז האקדמי לב",
  "Peres Academic Center - המרכז האקדמי פרס",
  "Ashkelon Academic College - המכללה האקדמית אשקלון",
  "Beit Rivka Seminary - סמינר בית רבקה",
  "Bnot Israel Seminary - סמינר בנות ישראל",
  "Midreshet HaRova - מדרשת הרובע",
  "Midreshet Lindenbaum - מדרשת לינדנבאום",
  "Midreshet Orot - מדרשת אורות",
  "Beit Ulpana Seminary - סמינר בית אולפנא",
  "Other - אחר",
  "No degree - ללא תואר",
  "Prefer not to say - מעדיף לא לציין"
]

// ✅ רשימת ערים גדולות בישראל
const ISRAELI_CITIES = [
  "Tel Aviv - תל אביב",
  "Jerusalem - ירושלים",
  "Haifa - חיפה",
  "Rishon LeZion - ראשון לציון",
  "Petah Tikva - פתח תקווה",
  "Ashdod - אשדוד",
  "Netanya - נתניה",
  "Beer Sheva - באר שבע",
  "Holon - חולון",
  "Bnei Brak - בני ברק",
  "Ramat Gan - רמת גן",
  "Ashkelon - אשקלון",
  "Rehovot - רחובות",
  "Bat Yam - בת ים",
  "Herzliya - הרצליה",
  "Kfar Saba - כפר סבא",
  "Hadera - חדרה",
  "Ra'anana - רעננה",
  "Modi'in - מודיעין",
  "Givatayim - גבעתיים",
  "Nahariya - נהריה",
  "Eilat - אילת",
  "Nazareth - נצרת",
  "Tiberias - טבריה",
  "Acre - עכו",
  "Ramat HaSharon - רמת השרון",
  "Kiryat Gat - קריית גת",
  "Kiryat Ata - קריית אתא",
  "Other - אחר"
]

interface ProfileData {
  displayName: string
  age: number
  birthDate?: string  // ✅ NEW: Birth date for age validation
  bio: string
  photoURL: string
  photos: string[]
  hobbies: string[]
  // Location
  city?: string  // ✅ NEW: City of residence
  // Languages
  languages?: string[]  // ✅ NEW: Languages spoken
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
  const { t, isRTL } = useLanguage()
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: 25,
    bio: '',
    photoURL: '',
    photos: [],
    hobbies: [],
    city: '',
    languages: ['he'],
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
  const [loadingProfile, setLoadingProfile] = useState(true)  // ✅ NEW: Loading state
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
  
  // ✅ FIX iOS: Touch drag state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  
  // ✅ FIX iOS: Use ref for file input instead of dynamic creation
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)  // ✅ NEW: Separate camera input
  
  // ✅ NEW: ActionSheet for photo upload options
  const [showPhotoActionSheet, setShowPhotoActionSheet] = useState(false)
  
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
    // ✅ FIX: Load profile immediately if user is already authenticated
    const loadInitialProfile = async () => {
      const user = auth.currentUser
      if (user) {
        console.log('📸 Loading profile for already authenticated user:', user.uid)
        setCurrentUser(user)
        await loadProfileData(user.uid)
      }
    }
    
    loadInitialProfile()
    
    // Also listen for auth state changes (for login/logout)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('📸 Auth state changed - loading profile for:', user.uid)
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
    setLoadingProfile(true)  // ✅ Start loading
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
          city: data.city || '',  // ✅ NEW: Load city
          languages: data.languages || ['he'],  // ✅ NEW: Load languages
          drinking: data.drinking || 'social',
          smoking: data.smoking || 'no',
          height: data.height || '',
          occupation: data.occupation || '',
          education: data.education || '',
          lookingFor: data.lookingFor || 'relationship'
        })
        console.log('📸 Total photos loaded:', photos.length)
      } else {
        console.log('⚠️ No profile document found for user:', uid)
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error)
    } finally {
      setLoadingProfile(false)  // ✅ Stop loading
    }
  }

  // ✅ FIX iOS: Show ActionSheet instead of directly opening camera
  const handlePhotoClick = () => {
    setShowPhotoActionSheet(true)
  }
  
  // ✅ NEW: Handle camera selection
  const handleCameraSelect = () => {
    setShowPhotoActionSheet(false)
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
      cameraInputRef.current.click()
    }
  }
  
  // ✅ NEW: Handle gallery selection
  const handleGallerySelect = () => {
    setShowPhotoActionSheet(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) {
      console.log('📸 No file selected or no user')
      return
    }
    
    console.log('📸 File selected:', file.name, file.type, file.size)

    if (profileData.photos.length >= 6) {
      toast({
        title: t('profileToasts.maxPhotos'),
        description: t('profileToasts.maxPhotosDesc'),
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      console.log('📸 Starting upload to Cloudinary...')
      const imageUrl = await uploadToCloudinary(file)
      console.log('📸 Upload successful:', imageUrl)
      
      const updatedPhotos = [...profileData.photos, imageUrl]
      const newPhotoURL = profileData.photoURL || imageUrl
      
      // ✅ FIX: Update local state
      setProfileData({
        ...profileData,
        photos: updatedPhotos,
        photoURL: newPhotoURL
      })
      
      setCurrentPhotoIndex(updatedPhotos.length - 1)
      
      // ✅ FIX iOS: Auto-save to Firestore immediately after upload
      console.log('📸 Auto-saving to Firestore...')
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        photos: updatedPhotos,
        photoURL: newPhotoURL
      })
      console.log('📸 Saved to Firestore!')
      
      toast({
        title: t('profileToasts.photoUploaded'),
        description: t('profileToasts.photoUploadedDesc'),
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: t('profileToasts.uploadError'),
        description: t('profileToasts.uploadErrorDesc'),
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
        title: t('profileToasts.cannotDeleteLast'),
        description: t('profileToasts.mustHavePhoto'),
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
          title: t('profileToasts.uploadError'),
          description: t('profileToasts.uploadErrorDesc'),
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

  // ✅ FIX iOS: Touch event handlers for mobile drag & drop
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    setTouchDragIndex(index)
    console.log('📱 Touch start on photo:', index + 1)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex === null || !touchStartPos.current || !thumbnailsRef.current) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartPos.current.x
    
    // Only process if moved significantly horizontally
    if (Math.abs(deltaX) > 30) {
      const thumbnails = thumbnailsRef.current.querySelectorAll('[data-photo-index]')
      let targetIndex = touchDragIndex
      
      thumbnails.forEach((thumb, idx) => {
        const rect = thumb.getBoundingClientRect()
        if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
          targetIndex = idx
        }
      })
      
      if (targetIndex !== touchDragIndex) {
        setDragOverIndex(targetIndex)
      }
    }
  }

  const handleTouchEnd = async () => {
    if (touchDragIndex !== null && dragOverIndex !== null && touchDragIndex !== dragOverIndex) {
      console.log(`📱 Touch drop: photo ${touchDragIndex + 1} → position ${dragOverIndex + 1}`)
      await reorderPhotos(touchDragIndex, dragOverIndex)
    }
    
    setTouchDragIndex(null)
    setDragOverIndex(null)
    touchStartPos.current = null
  }

  // ✅ Shared reorder function for both drag & touch
  const reorderPhotos = async (fromIndex: number, toIndex: number) => {
    console.log(`📦 Reordering photo ${fromIndex + 1} → position ${toIndex + 1}`)

    const newPhotos = [...profileData.photos]
    const [movedPhoto] = newPhotos.splice(fromIndex, 1)
    newPhotos.splice(toIndex, 0, movedPhoto)

    setProfileData({ ...profileData, photos: newPhotos })
    
    // Update current photo index if needed
    if (currentPhotoIndex === fromIndex) {
      setCurrentPhotoIndex(toIndex)
    } else if (fromIndex < currentPhotoIndex && toIndex >= currentPhotoIndex) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    } else if (fromIndex > currentPhotoIndex && toIndex <= currentPhotoIndex) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }

    // Auto-save to Firestore
    if (currentUser) {
      try {
        console.log('💾 Auto-saving photo order to Firestore...')
        await updateDoc(doc(db, 'users', currentUser.uid), {
          photos: newPhotos,
          photoURL: newPhotos[0] || ''
        })
        console.log('✅ Photo order saved!')
        
        toast({
          title: t('profileToasts.photosReordered'),
          description: t('profileToasts.mainPhotoChanged'),
        })
      } catch (error) {
        console.error('❌ Error saving photo order:', error)
        toast({
          title: t('profileToasts.reorderError'),
          description: t('profileToasts.reorderErrorDesc'),
          variant: "destructive",
        })
      }
    }
  }

  // ✅ Simple arrow button handlers for iOS
  const movePhotoLeft = async (index: number) => {
    if (index <= 0) return
    await reorderPhotos(index, index - 1)
  }

  const movePhotoRight = async (index: number) => {
    if (index >= profileData.photos.length - 1) return
    await reorderPhotos(index, index + 1)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    await reorderPhotos(draggedIndex, dropIndex)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSaveChanges = async () => {
    if (!currentUser) return
    
    // ✅ NEW: Validate age before saving
    if (ageError) {
      toast({
        title: t('profileToasts.invalidAge'),
        description: t('profileToasts.invalidAgeDesc'),
        variant: "destructive",
      })
      return
    }
    
    if (profileData.age < 18) {
      toast({
        title: t('profileToasts.invalidAge'),
        description: t('profileToasts.mustBe18'),
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
        city: profileData.city || '',  // ✅ NEW: Save city
        languages: profileData.languages || ['he'],  // ✅ NEW: Save languages
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
        title: t('profileToasts.saveError'),
        description: t('profileToasts.saveErrorDesc'),
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
      localStorage.removeItem('i4iguana_phone_verified')  // ✅ Clear phone verification cache
      
      // ✅ NEW: Clear match sound timestamps for all users
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('match_sound_played_')) {
          localStorage.removeItem(key)
        }
      })
      
      // ✅ NEW: Remove FCM token to stop receiving notifications
      if (currentUser) {
        try {
          const { removeFCMToken, getFCMToken } = await import('@/lib/firebase-messaging')
          const currentToken = localStorage.getItem('fcm_token')
          if (currentToken) {
            await removeFCMToken(currentUser.uid, currentToken)
            localStorage.removeItem('fcm_token')
            console.log('✅ FCM token removed on logout')
          }
        } catch (fcmError) {
          console.log('⚠️ Could not remove FCM token:', fcmError)
        }
      }
      
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
      
      // ✅ Step 1: OneSignal logout FIRST (before deleting account!)
      try {
        const OneSignal = (window as any).OneSignal
        if (OneSignal) {
          console.log('🔔 Logging out from OneSignal...')
          if (OneSignal.logout) {
            await OneSignal.logout()
            console.log('✅ OneSignal logout successful')
          } else if (OneSignal.removeExternalUserId) {
            await OneSignal.removeExternalUserId()
            console.log('✅ OneSignal removeExternalUserId successful')
          }
        }
      } catch (oneSignalError) {
        console.log('⚠️ OneSignal logout error (continuing anyway):', oneSignalError)
      }
      
      // ✅ Step 2: Use the proper delete service for full cleanup
      const { deleteUserAccount } = await import('@/lib/delete-account-service')
      const result = await deleteUserAccount(currentUser.uid)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account')
      }
      
      console.log('✅ Account deleted successfully')
      
      // ✅ CRITICAL: Set flags for proper re-registration flow
      localStorage.setItem('i4iguana_just_deleted', 'true')
      localStorage.setItem('force_notification_setup', 'true')  // ← NEW: Force notification modal on re-register
      console.log('✅ Set force_notification_setup flag')
      console.log('✅ Set i4iguana_just_deleted = true')
      
      // ✅ Clear ALL other localStorage and sessionStorage
      localStorage.removeItem('hasScannedQR')
      localStorage.removeItem('pendingCheckIn')
      localStorage.removeItem('i4iguana_phone_verified')
      localStorage.removeItem('i4iguana_handling_deleted')
      localStorage.removeItem('i4iguana_notification_modal_shown')  // ← NEW: Clear notification modal flag
      localStorage.removeItem('i4iguana_onesignal_linked')  // ← NEW: Clear OneSignal linked flag
      localStorage.removeItem('googleDisplayName')  // ← CRITICAL: Clear Google name so new login gets fresh name
      localStorage.removeItem('googleEmail')  // ← v2.8.25: Clear Google email
      localStorage.removeItem('i4iguana_onboarding_data')  // ← v2.8.25 CRITICAL: Clear old photos/onboarding data!
      // ✅ v2.8.23: Clear language selection so language selection screen appears
      localStorage.removeItem('i4iguana_language')
      localStorage.removeItem('i4iguana_language_selected')
      console.log('✅ Cleared i4iguana_language_selected')
      // ✅ NEW: Clear all state persistence flags on DELETE (not on logout!)
      localStorage.removeItem('i4iguana_was_authenticated')
      localStorage.removeItem('i4iguana_auth_wait_start')
      localStorage.removeItem('i4iguana_auth_initializing')
      localStorage.removeItem('i4iguana_last_screen')
      localStorage.removeItem('i4iguana_enjoy_mode')
      localStorage.removeItem('i4iguana_matched_user_id')
      
      // ✅ Clear match sound timestamps for all users
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
        title: t('profileToasts.deleteError'),
        description: t('profileToasts.deleteErrorDesc'),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const allPhotos = profileData.photos.length > 0 ? profileData.photos : (profileData.photoURL ? [profileData.photoURL] : [])

  // ✅ Loading screen while profile is loading
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ade80] mx-auto mb-4"></div>
          <p className="text-white/60" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('loading.profile')}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] custom-scrollbar mobile-scrollbar overflow-y-auto"
      style={{ 
        height: 'var(--app-height, 100dvh)',
        minHeight: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        paddingBottom: 'max(env(safe-area-inset-bottom), 96px)'
      }}
    >
      {/* ✅ FIX iOS: Two separate inputs - one for gallery, one for camera */}
      {/* Gallery input - no capture attribute */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      {/* Camera input - with capture attribute */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      
      {/* Header - with iOS safe area padding */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-30 bg-gradient-to-r from-[#0d2920] to-[#1a4d3e] backdrop-blur-xl border-b-2 border-[#4ade80]/30 px-6 py-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">👤</span>
            {isRTL ? 'הפרופיל שלי' : 'My Profile'}
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500 rounded-xl px-4 py-2"
            >
              {isRTL ? 'התנתקות' : 'Logout'}
            </Button>
          </div>
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

          {/* Photo thumbnails - with touch support for iOS */}
          <div className="p-4 bg-[#0d2920]/50">
            <div 
              ref={thumbnailsRef}
              className="flex gap-2 overflow-x-auto pb-2 photo-scroll"
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {allPhotos.map((photo, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <button
                    data-photo-index={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex
                        ? 'border-[#4ade80] scale-110'
                        : 'border-white/20 hover:border-white/40'
                    } ${
                      (dragOverIndex === index || (touchDragIndex !== null && dragOverIndex === index)) && draggedIndex !== index && touchDragIndex !== index
                        ? 'border-yellow-400 scale-105'
                        : ''
                    } ${
                      draggedIndex === index || touchDragIndex === index
                        ? 'opacity-50'
                        : ''
                    }`}
                  >
                    <img src={photo} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                    
                    {/* Photo number badge */}
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                      {index + 1}
                    </div>
                  </button>
                  
                  {/* ✅ iOS FIX: Arrow buttons for easy reordering on touch devices */}
                  {allPhotos.length > 1 && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {index > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); movePhotoLeft(index); }}
                          className="w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white text-xs hover:bg-[#4ade80] transition-colors"
                        >
                          ‹
                        </button>
                      )}
                      {index < allPhotos.length - 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); movePhotoRight(index); }}
                          className="w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white text-xs hover:bg-[#4ade80] transition-colors"
                        >
                          ›
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
            
            {/* Reorder hint */}
            {allPhotos.length > 1 && (
              <p className="text-xs text-white/40 text-center mt-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {isRTL 
                  ? '👆 השתמש בחצים או גרור כדי לסדר (תמונה #1 היא הראשית) ⭐' 
                  : '👆 Use arrows or drag to reorder (Photo #1 is your main) ⭐'}
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <span className="text-2xl">👤</span>
            {isRTL ? 'מידע בסיסי' : 'Basic Information'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {isRTL ? 'שם' : 'Name'}
              </label>
              <Input
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                placeholder={isRTL ? 'השם שלך' : 'Your name'}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl"
                style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}
              />
            </div>

            {/* ✅ v2.8.25: Email Display - Read Only */}
            {currentUser?.email && (
              <div>
                <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <span className="text-lg">📧</span>
                  {isRTL ? 'אימייל' : 'Email'}
                </label>
                <Input
                  value={currentUser.email}
                  readOnly
                  disabled
                  className="bg-white/5 border-white/10 text-white/60 h-12 rounded-xl cursor-not-allowed"
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>
            )}

            {/* ✅ Age via Birth Date - With Validation */}
            <div>
              <div className="flex items-center justify-between mb-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <label className="text-white/80 text-sm flex items-center gap-2">
                  <span className="text-lg">🎂</span>
                  {isRTL ? 'תאריך לידה' : 'Birth Date'}
                </label>
                {profileData.age && !ageError && (
                  <span className="text-[#4ade80] text-xl font-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {isRTL ? `${profileData.age} שנים` : `${profileData.age} years old`}
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
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                  >
                    <AlertCircle className="h-4 w-4" />
                    {ageError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg mr-1">✏️</span>
                {isRTL ? 'ביו' : 'Bio'}
              </label>
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <span className="text-2xl">💜</span>
            {isRTL ? 'תחביבים ותחומי עניין' : 'Interests'}
          </h2>
          
          <div className="flex flex-wrap gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
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
                <span className="text-[#4ade80] text-sm font-medium">{isRTL ? 'הוסף תחביב' : 'Add Interest'}</span>
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <span className="text-2xl">🌟</span>
            {isRTL ? 'סגנון חיים' : 'Lifestyle'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg">🍷</span>
                {isRTL ? 'שתייה' : 'Drinking'}
              </label>
              <Select
                value={profileData.drinking}
                onValueChange={(value: any) => setProfileData({ ...profileData, drinking: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{isRTL ? 'לא שותה' : 'Never'}</SelectItem>
                  <SelectItem value="social">{isRTL ? 'חברתית' : 'Socially'}</SelectItem>
                  <SelectItem value="regular">{isRTL ? 'באופן קבוע' : 'Regularly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg">🚬</span>
                {isRTL ? 'עישון' : 'Smoking'}
              </label>
              <Select
                value={profileData.smoking}
                onValueChange={(value: any) => setProfileData({ ...profileData, smoking: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">{isRTL ? 'לא' : 'No'}</SelectItem>
                  <SelectItem value="social">{isRTL ? 'חברתית' : 'Socially'}</SelectItem>
                  <SelectItem value="yes">{isRTL ? 'כן' : 'Yes'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-lg font-semibold mb-4 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-xl">📏</span>
                {isRTL ? 'גובה:' : 'Height:'} <span className="text-[#4ade80] text-2xl font-bold">{displayValue}</span> <span className="text-white/60">{heightUnit}</span>
              </label>
              <div className="space-y-4">
                {/* ✅ Custom Slider with Progress Bar - NO transition for smooth dragging */}
                <div className="relative w-full h-3">
                  {/* Background Track */}
                  <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                  {/* Progress Fill */}
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full"
                    style={{ width: `${((displayValue - minValue) / (maxValue - minValue)) * 100}%` }}
                  ></div>
                  {/* Invisible Range Input for Interaction */}
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
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {/* Custom Thumb */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[#4ade80] rounded-full shadow-lg shadow-[#4ade80]/50 border-2 border-white pointer-events-none"
                    style={{ left: `calc(${((displayValue - minValue) / (maxValue - minValue)) * 100}% - 10px)` }}
                  ></div>
                </div>
                
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <span className="text-2xl">✨</span>
            {isRTL ? 'פרטים נוספים' : 'Additional Details'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg">💼</span>
                {isRTL ? 'עיסוק' : 'Occupation'}
              </label>
              <Input
                value={profileData.occupation}
                onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                placeholder={isRTL ? 'במה את/ה עוסק/ת?' : 'What do you do?'}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl"
                style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}
              />
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg">🎓</span>
                {isRTL ? 'השכלה' : 'Education'}
              </label>
              <SearchableSelectModal
                value={profileData.education}
                onValueChange={(value) => setProfileData({ ...profileData, education: value })}
                options={ISRAELI_INSTITUTIONS}
                placeholder={isRTL ? 'בחר/י מוסד לימודים' : 'Select institution'}
                icon="🎓"
                label={isRTL ? 'השכלה' : 'Education'}
              />
            </div>

            {/* ✅ NEW: City Field - Searchable Modal */}
            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg">🏠</span>
                {isRTL ? 'עיר מגורים' : 'City'}
              </label>
              <SearchableSelectModal
                value={profileData.city || ''}
                onValueChange={(value) => setProfileData({ ...profileData, city: value })}
                options={ISRAELI_CITIES}
                placeholder={isRTL ? 'בחר/י עיר' : 'Select city'}
                icon="🏠"
                label={isRTL ? 'עיר מגורים' : 'City'}
              />
            </div>

            {/* ✅ NEW: Languages Field */}
            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg">🗣️</span>
                {isRTL ? 'שפות' : 'Languages'}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(profileData.languages || []).map((lang, index) => (
                  <span 
                    key={index}
                    className="bg-[#4ade80]/20 text-[#4ade80] px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {lang === 'he' ? '🇮🇱 עברית' : 
                     lang === 'en' ? '🇺🇸 English' : 
                     lang === 'ru' ? '🇷🇺 Русский' : 
                     lang === 'ar' ? '🇸🇦 العربية' : 
                     lang === 'fr' ? '🇫🇷 Français' : 
                     lang === 'es' ? '🇪🇸 Español' : lang}
                    <button
                      onClick={() => setProfileData({
                        ...profileData,
                        languages: (profileData.languages || []).filter((_, i) => i !== index)
                      })}
                      className="hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Select
                onValueChange={(value) => {
                  if (!(profileData.languages || []).includes(value)) {
                    setProfileData({
                      ...profileData,
                      languages: [...(profileData.languages || []), value]
                    })
                  }
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl">
                  <SelectValue placeholder="הוסף שפה / Add language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">🇮🇱 עברית</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                  <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <span className="text-lg">💕</span>
                {isRTL ? 'מחפש/ת' : 'Looking For'}
              </label>
              <Select
                value={profileData.lookingFor}
                onValueChange={(value: any) => setProfileData({ ...profileData, lookingFor: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relationship">{isRTL ? '💑 מערכת יחסים' : '💑 Relationship'}</SelectItem>
                  <SelectItem value="casual">{isRTL ? '😎 קז\'ואל' : '😎 Casual'}</SelectItem>
                  <SelectItem value="friends">{isRTL ? '🤝 חברים' : '🤝 Friends'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* ✅ v2.8.8: Language Settings - MOVED ABOVE Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <LanguageSettings />
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="pt-4"
        >
          <Button
            onClick={handleSaveChanges}
            disabled={saving || !!ageError}
            className={`w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] text-lg font-bold rounded-2xl shadow-lg disabled:opacity-50 ${ageError ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : ''}`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            {saving ? (
              <>
                <Loader2 className={`h-5 w-5 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isRTL ? 'שומר...' : 'Saving...'}
              </>
            ) : ageError ? (
              <>
                <AlertCircle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isRTL ? 'תקן שגיאת גיל' : 'Fix Age Error'}
              </>
            ) : (
              <>
                <span className="text-xl">{isRTL ? '💾' : '💾'}</span>
                <span className={isRTL ? 'mr-2' : 'ml-2'}>{isRTL ? 'שמור שינויים' : 'Save Changes'}</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* ✅ v2.8.31: Premium Upgrade & Coupon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="pt-6 space-y-3"
        >
          {/* Premium Title */}
          <div className="text-center mb-2">
            <span className="text-2xl">👑</span>
            <h3 className="text-white font-bold text-lg mt-1">
              {isRTL ? 'מנוי פרימיום' : 'Premium Membership'}
            </h3>
            <p className="text-white/60 text-sm">
              {isRTL ? 'התאמות ללא הגבלה, הודעות ללא הגבלה' : 'Unlimited matches & messages'}
            </p>
          </div>
          
          {/* Upgrade Button - Opens PremiumUpgradeModal */}
          <Button
            onClick={() => {
              // Dispatch custom event to open premium modal in parent
              window.dispatchEvent(new CustomEvent('openPremiumUpgrade'))
            }}
            className="w-full h-14 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-400 text-[#0d2920] text-lg font-bold rounded-2xl shadow-lg shadow-yellow-500/30"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <span className="text-xl mr-2">💳</span>
            {isRTL ? 'שדרג לפרימיום' : 'Upgrade to Premium'}
          </Button>
          
          {/* Coupon Activation Button */}
          <Button
            onClick={() => {
              // Dispatch custom event to open coupon modal in parent
              window.dispatchEvent(new CustomEvent('openCouponModal', { detail: { type: 'premium' } }))
            }}
            variant="outline"
            className="w-full h-12 border-2 border-[#4ade80]/50 bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 hover:border-[#4ade80] rounded-xl"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <span className="text-xl mr-2">🎟️</span>
            {isRTL ? 'הפעל קופון' : 'Activate Coupon'}
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
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <Trash2 className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'מחיקת חשבון' : 'Delete Account'}
          </Button>
        </motion.div>

        {/* Terms & Privacy Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="pt-6 pb-4 flex justify-center gap-4 text-sm"
        >
          <a 
            href="/terms" 
            className="text-white/50 hover:text-[#4ade80] underline transition-colors"
          >
            Terms of Service
          </a>
          <span className="text-white/30">|</span>
          <a 
            href="/privacy" 
            className="text-white/50 hover:text-[#4ade80] underline transition-colors"
          >
            Privacy Policy
          </a>
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
            <span className="text-xs">{t('nav.home')}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('notifications')}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-[#4ade80] transition-colors"
          >
            <Bell className="h-6 w-6" />
            <span className="text-xs">{t('nav.notifications')}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 text-[#4ade80]"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">{t('nav.profile')}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ✅ NEW: Photo Source ActionSheet */}
      <AnimatePresence>
        {showPhotoActionSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end justify-center"
            onClick={() => setShowPhotoActionSheet(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md mx-4 mb-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Options */}
              <div className="bg-[#1a4d3e] rounded-2xl overflow-hidden mb-3">
                <button
                  onClick={handleCameraSelect}
                  className="w-full py-4 px-6 text-white text-lg font-medium border-b border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
                >
                  📷 {isRTL ? 'צלם תמונה' : 'Take Photo'}
                </button>
                <button
                  onClick={handleGallerySelect}
                  className="w-full py-4 px-6 text-white text-lg font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
                >
                  🖼️ {isRTL ? 'בחר מהגלריה' : 'Choose from Gallery'}
                </button>
              </div>
              
              {/* Cancel Button */}
              <button
                onClick={() => setShowPhotoActionSheet(false)}
                className="w-full py-4 px-6 bg-[#1a4d3e] rounded-2xl text-white/70 text-lg font-medium hover:bg-white/10 transition-colors"
              >
                {isRTL ? 'ביטול' : 'Cancel'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
