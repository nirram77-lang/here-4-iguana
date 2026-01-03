"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Save,
  Download,
  Key,
  MapPin,
  Mail,
  Phone,
  Building2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  QrCode,
  FileImage
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { 
  getVenue, 
  updateVenue, 
  Venue,
  VENUE_TYPES,
  VenueType 
} from '@/lib/venue-service'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getAdminData } from '@/lib/admin-auth'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import VenueQRTemplate from '@/components/venue-qr-template'

export default function VenueEditPage() {
  const router = useRouter()
  const params = useParams()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form fields
  const [displayName, setDisplayName] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [radius, setRadius] = useState('100')
  const [venueType, setVenueType] = useState<VenueType>('bar')  // ✅ NEW: Venue type
  
  // Password generation
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  
  // QR Template Modal
  const [showQRTemplate, setShowQRTemplate] = useState(false)

  // Load venue data
  useEffect(() => {
    // Wait for auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login')
        return
      }

      try {
        // Verify super admin
        const adminData = await getAdminData(user.uid)
        if (!adminData || adminData.role !== 'super') {
          console.error('❌ Not a super admin')
          router.push('/admin/login')
          return
        }

        // Load venue
        const venueData = await getVenue(venueId)
        if (!venueData) {
          setError('Venue not found')
          setLoading(false)
          return
        }

        setVenue(venueData)
        
        // Populate form
        setDisplayName(venueData.displayName)
        setAddress(venueData.location.address)
        setLatitude(venueData.location.latitude.toString())
        setLongitude(venueData.location.longitude.toString())
        setAdminEmail(venueData.adminEmail)
        setAdminPhone((venueData as any).adminPhone || '')
        setRadius(venueData.radius.toString())
        setVenueType((venueData as any).venueType || 'bar')  // ✅ NEW: Load venue type

        console.log('✅ Venue loaded:', venueData.displayName)
        
      } catch (error) {
        console.error('❌ Error loading venue:', error)
        setError('Failed to load venue')
      } finally {
        setLoading(false)
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [venueId, router])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Validation
      if (!displayName || !address || !adminEmail) {
        setError('Please fill in all required fields')
        return
      }

      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      if (isNaN(lat) || isNaN(lng)) {
        setError('Invalid coordinates')
        return
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError('Coordinates out of range')
        return
      }

      // Update venue
      await updateVenue(venueId, {
        displayName,
        location: {
          latitude: lat,
          longitude: lng,
          address
        },
        adminEmail,
        adminPhone,
        radius: parseInt(radius),
        venueType  // ✅ NEW: Save venue type
      })

      setSuccess('Venue updated successfully!')
      console.log('✅ Venue updated')

      // Reload venue data
      const updatedVenue = await getVenue(venueId)
      if (updatedVenue) {
        setVenue(updatedVenue)
      }

    } catch (error: any) {
      console.error('❌ Error saving venue:', error)
      setError(error.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePassword = () => {
    // Generate secure random password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    setNewPassword(password)
    setShowPassword(true)
    console.log('🔑 Password generated')
  }

  const handleUpdatePasswordInFirebase = async () => {
    if (!newPassword || !venue?.adminUid) {
      setError('Generate a password first')
      return
    }

    try {
      setUpdatingPassword(true)
      setError(null)
      setSuccess(null)

      console.log('🔄 Updating password in Firebase Auth...')

      // Call API to update password
      const response = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminUid: venue.adminUid,
          newPassword: newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      console.log('✅ Password updated in Firebase Auth successfully!')
      setSuccess('Password updated in Firebase! Venue owner can now login.')

    } catch (error: any) {
      console.error('❌ Error updating password:', error)
      setError(error.message || 'Failed to update password in Firebase')
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      console.log('📋 Password copied')
    } catch (error) {
      console.error('❌ Failed to copy:', error)
    }
  }

  const handleDownloadQR = () => {
    if (!venue) return
    
    const link = document.createElement('a')
    link.href = venue.qrCode
    link.download = `${venue.name}-QR-Code.png`
    link.click()
    
    console.log('📥 QR code downloaded')
  }

  const handleCopyCredentials = async () => {
    const credentials = `
🦎 I4IGUANA - פרטי התחברות למנהל
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 מועדון: ${venue?.displayName}
📌 כתובת: ${venue?.location.address}

🔐 פרטי התחברות:

Email:
${adminEmail}

Password:
${newPassword}

🔗 לינק להתחברות:
https://i4iguana.com/admin/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
שמור את הפרטים במקום בטוח! 🔒
    `.trim()

    try {
      await navigator.clipboard.writeText(credentials)
      setSuccess('Credentials copied to clipboard!')
      console.log('📋 Credentials copied')
    } catch (error) {
      console.error('❌ Failed to copy:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-8xl"
        >
          🦎
        </motion.div>
      </div>
    )
  }

  if (error && !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a4d3e] to-[#0d2920]">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-white text-xl">{error}</p>
          <Button
            onClick={() => router.push('/admin/super')}
            className="mt-6"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0d2920] to-[#0d2920]/80 border-b border-[#4ade80]/30 shadow-2xl">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/super')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-black text-white">
                  Edit Venue
                </h1>
                <p className="text-[#4ade80] text-sm font-semibold">
                  {venue?.displayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownloadQR}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <Download className="mr-2 h-5 w-5" />
                QR Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-6 p-4 bg-[#4ade80]/20 border-2 border-[#4ade80] rounded-xl flex items-center gap-3"
            >
              <Check className="h-5 w-5 text-[#4ade80]" />
              <p className="text-white font-medium">{success}</p>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-white font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Venue Details */}
          <div className="space-y-6">
            
            {/* Venue Information */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-6 w-6 text-[#4ade80]" />
                <h2 className="text-2xl font-black text-white">
                  Venue Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Display Name *
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="IGUANA BAR (Beach Club)"
                    className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Address *
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Sderon Jerusalem 147, Ashkelon"
                    className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Check-in Radius (meters)
                  </label>
                  <Input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    placeholder="100"
                    className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white"
                  />
                </div>
                
                {/* ✅ NEW: Venue Type Selector */}
                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Venue Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {VENUE_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setVenueType(type.id)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          venueType === type.id
                            ? 'bg-[#4ade80]/20 border-[#4ade80] text-white'
                            : 'bg-[#0d2920]/50 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Location Coordinates */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-6 w-6 text-[#4ade80]" />
                <h2 className="text-2xl font-black text-white">
                  GPS Coordinates
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Latitude *
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="31.6969697"
                    className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white font-mono"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    Range: -90 to 90
                  </p>
                </div>

                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Longitude *
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="34.5778645"
                    className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white font-mono"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    Range: -180 to 180
                  </p>
                </div>

                {/* Current Coordinates Display */}
                <div className="p-4 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl">
                  <p className="text-white/60 text-xs mb-2">Current Location:</p>
                  <p className="text-[#4ade80] font-mono text-sm">
                    📍 {venue?.location.latitude}, {venue?.location.longitude}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${venue?.location.latitude},${venue?.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white text-xs mt-2 inline-block"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column - Admin & Actions */}
          <div className="space-y-6">
            
            {/* Admin Account */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Mail className="h-6 w-6 text-[#4ade80]" />
                <h2 className="text-2xl font-black text-white">
                  Admin Account
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Admin Email *
                  </label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="manager@venue.com"
                    className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm font-medium mb-2 block">
                    Admin Phone
                  </label>
                  <Input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="050-1234567"
                    className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white"
                    dir="ltr"
                  />
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/60 text-xs mb-1">Admin UID:</p>
                  <p className="text-white/80 font-mono text-xs break-all">
                    {venue?.adminUid}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Admin Login Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Key className="h-6 w-6 text-[#4ade80]" />
                <h2 className="text-2xl font-black text-white">
                  פרטי התחברות
                </h2>
              </div>

              <div className="space-y-4">
                {/* Email Display */}
                <div className="p-4 bg-white/5 border border-white/20 rounded-xl">
                  <p className="text-white/60 text-xs mb-2">📧 Email:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-white font-mono text-sm break-all select-all">
                      {adminEmail}
                    </code>
                    <Button
                      onClick={async () => {
                        await navigator.clipboard.writeText(adminEmail)
                        setSuccess('Email copied!')
                      }}
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Login URL */}
                <div className="p-4 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl">
                  <p className="text-white/60 text-xs mb-2">🔗 Login URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[#4ade80] font-mono text-sm break-all select-all">
                      https://i4iguana.com/admin/login
                    </code>
                    <Button
                      onClick={async () => {
                        await navigator.clipboard.writeText('https://i4iguana.com/admin/login')
                        setSuccess('Link copied!')
                      }}
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* WhatsApp Share */}
                <Button
                  onClick={() => {
                    const message = `
🦎 I4IGUANA - פרטי התחברות למנהל

📍 מועדון: ${venue?.displayName}
📌 כתובת: ${venue?.location.address}

🔐 פרטי התחברות:

Email:
${adminEmail}

🔗 לינק להתחברות:
https://i4iguana.com/admin/login

💡 הסיסמא נשלחה בנפרד בעת יצירת המועדון.
צור קשר אם צריך סיסמא חדשה: nir@i4iguana.com
                    `.trim()
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#1da851] text-white font-bold"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  📱 שלח פרטי התחברות בוואטסאפ
                </Button>

                {/* Info Note */}
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs">
                    💡 הסיסמא נשלחת רק פעם אחת בעת יצירת המועדון.<br/>
                    לאיפוס סיסמא: מחק את המועדון והקם מחדש.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 🦎 QR Template Generator */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-[#4ade80]/20 to-[#1a4d3e]/60 backdrop-blur-md border-2 border-[#4ade80]/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">🦎</div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    QR Template
                  </h2>
                  <p className="text-[#4ade80] text-sm">
                    תבנית מושלמת לשליחה למקום!
                  </p>
                </div>
              </div>
              
              <p className="text-white/70 text-sm mb-4">
                הפק תבנית יפה עם 2 QR codes:
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span className="bg-[#4ade80] text-[#0d2920] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                  <span>QR להורדת האפליקציה</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span className="bg-[#4ade80] text-[#0d2920] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                  <span>QR להתחברות למקום</span>
                </div>
              </div>
              
              <Button
                onClick={() => setShowQRTemplate(true)}
                className="w-full h-14 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold text-lg"
              >
                <FileImage className="mr-2 h-5 w-5" />
                🦎 הפק תבנית QR
              </Button>
            </motion.div>

            {/* Venue Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-black text-white mb-4">
                Venue Stats
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs mb-1">Active Now</p>
                  <p className="text-[#4ade80] text-2xl font-black">
                    {venue?.stats?.activeNow || 0}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Total Check-ins</p>
                  <p className="text-white text-2xl font-black">
                    {venue?.stats?.totalCheckIns || 0}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Notifications</p>
                  <p className="text-white text-2xl font-black">
                    {venue?.stats?.notificationsSent || 0}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Matches</p>
                  <p className="text-white text-2xl font-black">
                    {venue?.stats?.matchesCreated || 0}
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-end gap-4"
        >
          <Button
            onClick={() => router.push('/admin/super')}
            variant="outline"
            className="h-14 px-8"
            disabled={saving}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-14 px-12 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold text-lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>
      
      {/* QR Template Modal */}
      {venue && (
        <VenueQRTemplate
          venue={{
            id: venue.id,
            displayName: venue.displayName
          }}
          isOpen={showQRTemplate}
          onClose={() => setShowQRTemplate(false)}
        />
      )}
    </div>
  )
}
