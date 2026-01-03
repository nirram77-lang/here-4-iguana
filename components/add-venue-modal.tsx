"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, MapPin, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { createVenue, CreateVenueData } from '@/lib/venue-service'

interface AddVenueModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddVenueModal({ onClose, onSuccess }: AddVenueModalProps) {
  const [step, setStep] = useState(1) // 1: Form, 2: Review, 3: Success
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [venueName, setVenueName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  
  // Result data
  const [createdVenue, setCreatedVenue] = useState<any>(null)

  const generatePassword = () => {
    // Generate random password: Capital + lowercase + numbers
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setAdminPassword(password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!venueName || !displayName || !address || !adminEmail || !adminPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (!latitude || !longitude) {
      setError('Please enter valid coordinates')
      return
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordinates must be valid numbers')
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Invalid coordinates range')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🏗️ Creating venue...')

      const venueData: CreateVenueData = {
        name: venueName.toLowerCase().replace(/\s+/g, '-'),
        displayName,
        address,
        latitude: lat,
        longitude: lng,
        adminEmail,
        adminPassword
      }

      const result = await createVenue(venueData)
      
      setCreatedVenue(result)
      setStep(3) // Success step
      
      console.log('✅ Venue created successfully!')

    } catch (error: any) {
      console.error('❌ Error creating venue:', error)
      setError(error.message || 'Failed to create venue')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-[#1a4d3e] to-[#0d2920] rounded-3xl p-8 max-w-2xl w-full border-2 border-[#4ade80]/30 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-white">
            {step === 1 && 'Add New Venue'}
            {step === 2 && 'Review Details'}
            {step === 3 && 'Venue Created!'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Venue Name */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Venue Name (Internal ID)
              </label>
              <Input
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="iguana-bar-tlv"
                className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                disabled={loading}
              />
              <p className="text-white/40 text-xs mt-1">
                Lowercase, no spaces (use hyphens)
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Iguana Bar Tel Aviv"
                className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                disabled={loading}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Dizengoff St, Tel Aviv"
                className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                disabled={loading}
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Latitude
                </label>
                <Input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="32.0853"
                  className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Longitude
                </label>
                <Input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="34.7818"
                  className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                  disabled={loading}
                />
              </div>
            </div>

            <p className="text-white/40 text-xs">
              💡 Tip: Use Google Maps → Right click → Copy coordinates
            </p>

            {/* Admin Email */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Venue Admin Email
              </label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@venue.com"
                className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40"
                disabled={loading}
              />
            </div>

            {/* Admin Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white text-sm font-semibold">
                  Admin Password
                </label>
                <Button
                  type="button"
                  onClick={generatePassword}
                  size="sm"
                  variant="ghost"
                  className="text-[#4ade80] hover:bg-[#4ade80]/20 text-xs"
                >
                  Generate
                </Button>
              </div>
              <Input
                type="text"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Auto-generated password"
                className="h-12 bg-[#0d2920]/50 border-[#4ade80]/20 text-white placeholder:text-white/40 font-mono"
                disabled={loading}
              />
              <p className="text-white/40 text-xs mt-1">
                Share this with the venue admin
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] rounded-2xl"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-2xl"
                >
                  🔄
                </motion.div>
              ) : (
                'Create Venue'
              )}
            </Button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && createdVenue && (
          <div className="space-y-6">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 bg-[#4ade80]/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-[#4ade80]" />
              </div>
            </motion.div>

            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">
                🎉 Venue Created Successfully!
              </h3>
              <p className="text-white/60">
                {createdVenue.venue.displayName}
              </p>
            </div>

            {/* Venue Details */}
            <div className="bg-[#0d2920]/50 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-white/40 text-xs mb-1">Venue ID</p>
                <p className="text-white font-mono text-sm">{createdVenue.venue.id}</p>
              </div>
              
              {/* Email with Copy */}
              <div>
                <p className="text-white/40 text-xs mb-1">📧 Admin Email</p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-[#4ade80] font-medium font-mono bg-[#4ade80]/10 px-3 py-2 rounded-lg">
                    {createdVenue.admin.email}
                  </p>
                  <Button
                    onClick={() => navigator.clipboard.writeText(createdVenue.admin.email)}
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                  >
                    <X className="h-4 w-4" style={{ display: 'none' }} />
                    📋
                  </Button>
                </div>
              </div>
              
              {/* Password with Copy */}
              <div>
                <p className="text-white/40 text-xs mb-1">🔑 Admin Password</p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-white font-mono bg-[#4ade80]/10 px-3 py-2 rounded-lg">
                    {createdVenue.admin.tempPassword}
                  </p>
                  <Button
                    onClick={() => navigator.clipboard.writeText(createdVenue.admin.tempPassword)}
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                  >
                    📋
                  </Button>
                </div>
                <p className="text-red-400 text-xs mt-2">
                  ⚠️ שמור את הסיסמא! היא לא תוצג שוב.
                </p>
              </div>

              {/* Login Link */}
              <div>
                <p className="text-white/40 text-xs mb-1">🔗 Login URL</p>
                <p className="text-[#4ade80] font-medium">
                  https://i4iguana.com/admin/login
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* WhatsApp Share - PRIMARY */}
              <Button
                onClick={() => {
                  const message = `
🦎 I4IGUANA - פרטי התחברות למנהל

📍 מועדון: ${createdVenue.venue.displayName}

🔐 פרטי התחברות:

Email:
${createdVenue.admin.email}

Password:
${createdVenue.admin.tempPassword}

🔗 לינק להתחברות:
https://i4iguana.com/admin/login

שמור את הפרטים במקום בטוח! 🔒
                  `.trim()
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, '_blank')
                }}
                className="w-full h-14 bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-lg"
              >
                <svg className="mr-2 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                📱 שלח בוואטסאפ לבעל המועדון
              </Button>

              {/* Copy All Credentials */}
              <Button
                onClick={() => {
                  const credentials = `
🦎 I4IGUANA - פרטי התחברות למנהל

📍 מועדון: ${createdVenue.venue.displayName}

🔐 פרטי התחברות:

Email:
${createdVenue.admin.email}

Password:
${createdVenue.admin.tempPassword}

🔗 לינק להתחברות:
https://i4iguana.com/admin/login

שמור את הפרטים במקום בטוח! 🔒
                  `.trim()
                  navigator.clipboard.writeText(credentials)
                }}
                className="w-full h-12 bg-white/10 hover:bg-white/20 text-white"
              >
                📋 העתק את כל הפרטים
              </Button>

              <Button
                onClick={handleFinish}
                className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold"
              >
                ✅ סיום
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
