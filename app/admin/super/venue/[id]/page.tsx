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
  Building2,
  Copy,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { 
  getVenue, 
  updateVenue, 
  Venue 
} from '@/lib/venue-service'
import { auth } from '@/lib/firebase'
import { getAdminData } from '@/lib/admin-auth'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
  const [radius, setRadius] = useState('100')
  
  // Password generation
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Load venue data
  useEffect(() => {
    const loadVenue = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/admin/login')
          return
        }

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
          return
        }

        setVenue(venueData)
        
        // Populate form
        setDisplayName(venueData.displayName)
        setAddress(venueData.location.address)
        setLatitude(venueData.location.latitude.toString())
        setLongitude(venueData.location.longitude.toString())
        setAdminEmail(venueData.adminEmail)
        setRadius(venueData.radius.toString())

        console.log('✅ Venue loaded:', venueData.displayName)
        
      } catch (error) {
        console.error('❌ Error loading venue:', error)
        setError('Failed to load venue')
      } finally {
        setLoading(false)
      }
    }

    loadVenue()
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
        radius: parseInt(radius)
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
🦎 IGUANA BAR - Venue Admin Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Venue: ${venue?.displayName}
Location: ${venue?.location.address}

Admin Login:
📧 Email: ${adminEmail}
🔑 Password: ${newPassword}

Login URL: https://yourdomain.com/admin/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keep these credentials secure!
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

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/60 text-xs mb-1">Admin UID:</p>
                  <p className="text-white/80 font-mono text-xs break-all">
                    {venue?.adminUid}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Generate Login */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-md border-2 border-[#4ade80]/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Key className="h-6 w-6 text-[#4ade80]" />
                <h2 className="text-2xl font-black text-white">
                  Generate Login
                </h2>
              </div>

              <p className="text-white/60 text-sm mb-4">
                Generate new login credentials for venue owner
              </p>

              <Button
                onClick={handleGeneratePassword}
                className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold mb-4"
              >
                <Key className="mr-2 h-5 w-5" />
                Generate New Password
              </Button>

              {showPassword && newPassword && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="p-4 bg-[#4ade80]/10 border-2 border-[#4ade80] rounded-xl">
                    <p className="text-white/60 text-xs mb-2">New Password:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[#4ade80] font-mono text-sm break-all">
                        {newPassword}
                      </code>
                      <Button
                        onClick={handleCopyPassword}
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-[#4ade80]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleCopyCredentials}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Full Credentials
                  </Button>

                  <Button
                    onClick={handleUpdatePasswordInFirebase}
                    disabled={updatingPassword}
                    className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Updating Firebase...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Update Password in Firebase
                      </>
                    )}
                  </Button>

                  <div className="p-3 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-lg">
                    <p className="text-[#4ade80] text-xs">
                      ✅ Click "Update Password in Firebase" to activate this password automatically!
                    </p>
                  </div>
                </motion.div>
              )}
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
    </div>
  )
}
