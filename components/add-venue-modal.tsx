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
                Venue Created Successfully!
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
              
              <div>
                <p className="text-white/40 text-xs mb-1">Admin Email</p>
                <p className="text-[#4ade80] font-medium">{createdVenue.admin.email}</p>
              </div>
              
              <div>
                <p className="text-white/40 text-xs mb-1">Admin Password</p>
                <p className="text-white font-mono bg-[#4ade80]/10 px-3 py-2 rounded-lg">
                  {createdVenue.admin.tempPassword}
                </p>
                <p className="text-red-400 text-xs mt-2">
                  ⚠️ Save this password! It won't be shown again.
                </p>
              </div>

              <div>
                <p className="text-white/40 text-xs mb-2">QR Code</p>
                <img 
                  src={createdVenue.venue.qrCode} 
                  alt="Venue QR Code"
                  className="w-48 h-48 mx-auto rounded-xl border-2 border-[#4ade80]/30"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = createdVenue.venue.qrCode
                  link.download = `${createdVenue.venue.name}-qr.png`
                  link.click()
                }}
                className="w-full h-12 bg-white/10 hover:bg-white/20 text-white"
              >
                Download QR Code
              </Button>

              <Button
                onClick={handleFinish}
                className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#3bc970] hover:from-[#3bc970] hover:to-[#2da55e] text-[#0d2920] font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
