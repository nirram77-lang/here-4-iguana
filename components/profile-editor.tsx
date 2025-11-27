'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Save, Loader2, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { auth, db } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'

interface ProfileData {
  displayName: string
  bio: string
  photoURL: string
  location: string
  website: string
}

export default function ProfileEditor() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    photoURL: '',
    location: '',
    website: '',
  })
  const [currentPhoto, setCurrentPhoto] = useState<string>('')
  const [tempPhoto, setTempPhoto] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user)
        await loadProfileData(user.uid)
      } else {
        router.push('/auth')
      }
    })

    return () => unsubscribe()
  }, [router])

  const loadProfileData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as ProfileData
        setProfileData(data)
        setCurrentPhoto(data.photoURL || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    try {
      setUploading(true)
      
      // Upload with progress
      const imageUrl = await uploadToCloudinary(file, (progress) => {
        console.log('Upload progress:', progress + '%')
      })
      
      // Show preview
      setTempPhoto(imageUrl)
      setCurrentPhoto(imageUrl)
      
      toast({
        title: "✅ תמונה הועלתה!",
        description: "התמונה הועלתה בהצלחה.",
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: "❌ שגיאה",
        description: "העלאת התמונה נכשלה. בדוק את החיבור לאינטרנט.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!currentUser) return

    try {
      setSaving(true)

      const updatedData = {
        ...profileData,
        photoURL: currentPhoto,
      }

      await updateDoc(doc(db, 'users', currentUser.uid), updatedData)

      setTempPhoto('')
      
      toast({
        title: "פרופיל עודכן!",
        description: "השינויים נשמרו בהצלחה.",
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "שגיאה",
        description: "שמירת השינויים נכשלה. נסה שוב.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1f1a] via-[#0d2920] to-[#0a1f1a]">
        <Loader2 className="h-8 w-8 text-[#4ade80] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f1a] via-[#0d2920] to-[#0a1f1a] p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Edit Profile</h1>
          <p className="text-gray-400">Customize your i4iguana profile</p>
        </motion.div>

        {/* Profile Photo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#4ade80]/30 cursor-pointer"
              onClick={handlePhotoClick}
            >
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <User className="h-16 w-16 text-white/50" />
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>

              {/* Uploading indicator */}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </motion.div>

            {/* Camera button */}
            <button
              onClick={handlePhotoClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-[#4ade80] p-3 rounded-full shadow-lg hover:bg-[#3bc970] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="h-5 w-5 text-[#0d2920]" />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </motion.div>

        {tempPhoto && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4 text-center"
          >
            <p className="text-[#4ade80] text-sm">
              תמונה חדשה הועלתה! לחץ על "Save Changes" לשמירה
            </p>
          </motion.div>
        )}

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
        >
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Display Name
            </label>
            <Input
              value={profileData.displayName}
              onChange={(e) =>
                setProfileData({ ...profileData, displayName: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80] h-12"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Bio
            </label>
            <Textarea
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80] min-h-[100px]"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Location
            </label>
            <Input
              value={profileData.location}
              onChange={(e) =>
                setProfileData({ ...profileData, location: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80] h-12"
              placeholder="City, Country"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Website
            </label>
            <Input
              value={profileData.website}
              onChange={(e) =>
                setProfileData({ ...profileData, website: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80] h-12"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <Button
          onClick={handleSaveChanges}
          disabled={saving || uploading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#3bc970] text-[#0d2920] font-bold hover:opacity-90 transition-opacity"
        >
          {saving || uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {uploading ? 'Uploading photo...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </>
          )}
        </Button>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-xl bg-transparent border-2 border-red-400/50 text-red-400 hover:bg-red-400/10 font-semibold transition-all"
        >
          Logout
        </Button>
      </div>
    </div>
  )
}