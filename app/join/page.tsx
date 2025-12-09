"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Globe,
  CheckCircle,
  Send,
  Navigation,
  ExternalLink,
  Clock,
  Users,
  HelpCircle,
  X,
  Instagram,
  Facebook,
  MessageCircle,
  Target,
  Zap
} from 'lucide-react'
import Link from 'next/link'

interface FormData {
  venueName: string
  venueType: string
  ownerName: string
  email: string
  phone: string
  address: string
  city: string
  latitude: string
  longitude: string
  website: string
  instagram: string
  facebook: string
  capacity: string
  openingHours: string
  description: string
  agreedToTerms: boolean
}

const initialFormData: FormData = {
  venueName: '',
  venueType: 'bar',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  latitude: '',
  longitude: '',
  website: '',
  instagram: '',
  facebook: '',
  capacity: '',
  openingHours: '',
  description: '',
  agreedToTerms: false
}

const venueTypes = [
  { value: 'bar', label: '🍺 בר' },
  { value: 'club', label: '🎉 מועדון' },
  { value: 'lounge', label: '🛋️ לאונג\'' },
  { value: 'pub', label: '🍻 פאב' },
  { value: 'restaurant_bar', label: '🍽️ מסעדה-בר' },
  { value: 'rooftop', label: '🌃 רופטופ' },
  { value: 'beach_bar', label: '🏖️ בר חוף' },
  { value: 'other', label: '✨ אחר' },
]

export default function VenueJoinPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showCoordinatesHelp, setShowCoordinatesHelp] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    if (!formData.venueName.trim()) newErrors.venueName = 'שדה חובה'
    if (!formData.ownerName.trim()) newErrors.ownerName = 'שדה חובה'
    if (!formData.email.trim()) newErrors.email = 'שדה חובה'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'אימייל לא תקין'
    if (!formData.phone.trim()) newErrors.phone = 'שדה חובה'
    if (!formData.address.trim()) newErrors.address = 'שדה חובה'
    if (!formData.city.trim()) newErrors.city = 'שדה חובה'
    if (!formData.latitude.trim()) newErrors.latitude = 'שדה חובה'
    else if (isNaN(parseFloat(formData.latitude)) || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90) {
      newErrors.latitude = 'ערך לא תקין (בין -90 ל-90)'
    }
    if (!formData.longitude.trim()) newErrors.longitude = 'שדה חובה'
    else if (isNaN(parseFloat(formData.longitude)) || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180) {
      newErrors.longitude = 'ערך לא תקין (בין -180 ל-180)'
    }
    if (!formData.agreedToTerms) newErrors.agreedToTerms = 'יש לאשר את התנאים'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      const firstError = document.querySelector('.error-field')
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/venue-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setIsSubmitted(true)
      } else {
        alert('אירעה שגיאה, נסה שוב')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('אירעה שגיאה, נסה שוב')
    }
    
    setIsSubmitting(false)
  }

  // Success Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-[#1a4d3e]/80 to-[#0d2920]/90 backdrop-blur-xl border-2 border-[#4ade80]/50 rounded-3xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-black text-white mb-4">
            הטופס נשלח בהצלחה! 🎉
          </h2>
          
          <p className="text-white/70 mb-6">
            תודה רבה על ההצטרפות למשפחת I4IGUANA!
            <br />
            צוות שלנו יצור איתך קשר תוך 24-48 שעות.
          </p>
          
          <div className="bg-white/10 rounded-xl p-4 mb-6 text-right" dir="rtl">
            <p className="text-[#4ade80] font-bold mb-2">מה קורה עכשיו?</p>
            <ul className="text-white/60 text-sm space-y-2">
              <li>✅ הבקשה שלך התקבלה</li>
              <li>📞 ניצור קשר לתיאום</li>
              <li>🎨 נכין עבורך סטיקר QR ייחודי</li>
              <li>🚀 המועדון שלך יעלה לאוויר!</li>
            </ul>
          </div>
          
          <Link href="/">
            <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold">
              חזרה לדף הבית
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ade80]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#22c55e]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 py-12 text-center">
          {/* Logo with Radar */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 1 }}
            className="relative w-32 h-32 mx-auto mb-6"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-32 h-32 border-2 border-[#4ade80]/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute w-24 h-24 border-2 border-[#4ade80]/40 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              <div className="absolute w-16 h-16 border-2 border-[#4ade80]/50 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
            </div>
            <div className="relative z-10 text-7xl flex items-center justify-center h-full">🦎</div>
          </motion.div>
          
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            הצטרפו ל-<span className="text-[#4ade80]">I4IGUANA</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/70 mb-8"
          >
            הפכו את המועדון שלכם למוקד משיכה לרווקים ורווקות!
          </motion.p>
          
          {/* Benefits */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {[
              { icon: Users, title: 'קהל חדש', desc: 'משתמשים מחפשים מקומות לצאת' },
              { icon: Target, title: 'שיווק חינמי', desc: 'חשיפה באפליקציה שלנו' },
              { icon: Zap, title: 'קל להתחיל', desc: 'תהליך הצטרפות פשוט' },
            ].map((benefit, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <benefit.icon className="w-8 h-8 text-[#4ade80] mx-auto mb-2" />
                <h3 className="text-white font-bold">{benefit.title}</h3>
                <p className="text-white/60 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <motion.form
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-[#1a4d3e]/60 to-[#0d2920]/80 backdrop-blur-xl border-2 border-[#4ade80]/30 rounded-3xl p-8"
          dir="rtl"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">📝 טופס הצטרפות</h2>

          {/* Venue Info */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-[#4ade80] flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              פרטי המקום
            </h3>
            
            <div className={errors.venueName ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">שם המקום *</label>
              <Input
                value={formData.venueName}
                onChange={(e) => handleInputChange('venueName', e.target.value)}
                placeholder="לדוגמה: בר האיגואנה"
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.venueName ? 'border-red-500' : ''}`}
              />
              {errors.venueName && <p className="text-red-400 text-xs mt-1">{errors.venueName}</p>}
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-1">סוג המקום *</label>
              <select
                value={formData.venueType}
                onChange={(e) => handleInputChange('venueType', e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2"
              >
                {venueTypes.map(type => (
                  <option key={type.value} value={type.value} className="bg-[#1a4d3e] text-white">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={errors.address ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">כתובת מלאה *</label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="רחוב, מספר"
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>

            <div className={errors.city ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">עיר *</label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="לדוגמה: תל אביב"
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.city ? 'border-red-500' : ''}`}
              />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Coordinates */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-purple-400" />
                  קואורדינטות GPS
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCoordinatesHelp(true)}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  איך למצוא?
                </button>
              </div>
              
              <p className="text-white/60 text-sm mb-3">
                הקואורדינטות חיוניות כדי שהאפליקציה תזהה משתמשים בתוך המקום שלך!
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={errors.latitude ? 'error-field' : ''}>
                  <label className="block text-white/80 text-xs mb-1">Latitude (קו רוחב) *</label>
                  <Input
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    placeholder="31.794505"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono ${errors.latitude ? 'border-red-500' : ''}`}
                  />
                  {errors.latitude && <p className="text-red-400 text-xs mt-1">{errors.latitude}</p>}
                </div>
                <div className={errors.longitude ? 'error-field' : ''}>
                  <label className="block text-white/80 text-xs mb-1">Longitude (קו אורך) *</label>
                  <Input
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    placeholder="34.632057"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono ${errors.longitude ? 'border-red-500' : ''}`}
                  />
                  {errors.longitude && <p className="text-red-400 text-xs mt-1">{errors.longitude}</p>}
                </div>
              </div>
            </div>

            {/* Capacity & Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/80 text-sm mb-1">קיבולת (מספר אנשים)</label>
                <Input
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  placeholder="200"
                  type="number"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">שעות פעילות</label>
                <Input
                  value={formData.openingHours}
                  onChange={(e) => handleInputChange('openingHours', e.target.value)}
                  placeholder="20:00-03:00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-1">תיאור המקום</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="ספרו לנו על המקום שלכם..."
                rows={3}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-md p-2 resize-none"
              />
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-[#4ade80] flex items-center gap-2">
              <User className="w-5 h-5" />
              פרטי בעל המקום
            </h3>

            <div className={errors.ownerName ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">שם מלא *</label>
              <Input
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                placeholder="ישראל ישראלי"
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.ownerName ? 'border-red-500' : ''}`}
              />
              {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName}</p>}
            </div>

            <div className={errors.email ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">אימייל *</label>
              <Input
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
                type="email"
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className={errors.phone ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">טלפון *</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="050-0000000"
                type="tel"
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-[#4ade80] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              נוכחות דיגיטלית (אופציונלי)
            </h3>

            <div>
              <label className="block text-white/80 text-sm mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4" /> אתר אינטרנט
              </label>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-1 flex items-center gap-2">
                <Instagram className="w-4 h-4" /> אינסטגרם
              </label>
              <Input
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="@yourvenue"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-1 flex items-center gap-2">
                <Facebook className="w-4 h-4" /> פייסבוק
              </label>
              <Input
                value={formData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                placeholder="facebook.com/yourvenue"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Terms */}
          <div className={`mb-6 ${errors.agreedToTerms ? 'error-field' : ''}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                className="mt-1 w-5 h-5 rounded bg-white/10 border-white/20"
              />
              <span className="text-white/70 text-sm">
                אני מאשר/ת שקראתי והסכמתי ל
                <Link href="/terms" className="text-[#4ade80] hover:underline mx-1">תנאי השימוש</Link>
                ול
                <Link href="/privacy" className="text-[#4ade80] hover:underline mx-1">מדיניות הפרטיות</Link>
              </span>
            </label>
            {errors.agreedToTerms && <p className="text-red-400 text-xs mt-1">{errors.agreedToTerms}</p>}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-black font-bold text-lg py-6 rounded-xl shadow-lg shadow-[#4ade80]/30"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⏳</motion.div>
                שולח...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                שליחת הבקשה
              </span>
            )}
          </Button>

          <p className="text-center text-white/50 text-sm mt-4">
            שאלות? <a href="mailto:venues@i4iguana.com" className="text-[#4ade80] hover:underline">venues@i4iguana.com</a>
          </p>
        </motion.form>
      </div>

      {/* Coordinates Help Modal */}
      <AnimatePresence>
        {showCoordinatesHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCoordinatesHelp(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] rounded-2xl z-50 border-2 border-purple-500/50"
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Navigation className="w-6 h-6" />
                  איך למצוא קואורדינטות?
                </h2>
                <button onClick={() => setShowCoordinatesHelp(false)} className="p-2 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6" dir="rtl">
                {/* WhatsApp Method */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    שיטה 1: וואטסאפ (הכי קלה!)
                  </h3>
                  <ol className="text-white/80 text-sm space-y-2 list-decimal list-inside">
                    <li>עמדו פיזית במועדון שלכם</li>
                    <li>פתחו וואטסאפ ושלחו מיקום לעצמכם</li>
                    <li>לחצו על המיקום שנשלח</li>
                    <li>ייפתח Google Maps</li>
                    <li>בשורת הכתובת למעלה תראו את הקואורדינטות</li>
                    <li className="text-yellow-400 font-bold">⚡ טיפ: הקואורדינטות מופיעות לשנייה! העתיקו מהר!</li>
                  </ol>
                  <div className="mt-3 bg-black/30 rounded-lg p-3 font-mono text-sm text-white/70">
                    <p>דוגמה מ-URL:</p>
                    <p className="text-green-400">maps.google.com/?q=<span className="text-yellow-400">31.794505</span>,<span className="text-yellow-400">34.632057</span></p>
                    <p className="mt-2 text-white/50">↑ הראשון = Latitude, השני = Longitude</p>
                  </div>
                </div>

                {/* Google Maps Method */}
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    שיטה 2: Google Maps במחשב
                  </h3>
                  <ol className="text-white/80 text-sm space-y-2 list-decimal list-inside">
                    <li>פתחו Google Maps במחשב</li>
                    <li>חפשו את הכתובת של המקום</li>
                    <li>לחצו קליק ימני על המיקום המדויק</li>
                    <li>הקואורדינטות יופיעו - לחצו להעתקה</li>
                  </ol>
                </div>

                {/* Important Note */}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-yellow-400 mb-2">⚠️ חשוב!</h3>
                  <p className="text-white/80 text-sm">
                    הקואורדינטות צריכות להיות <span className="text-yellow-400 font-bold">מדויקות</span> כדי שהאפליקציה תזהה נכון משתמשים שנמצאים בתוך המקום שלכם.
                    <br /><br />
                    מומלץ לעמוד <span className="text-yellow-400 font-bold">באמצע המקום</span> כשמוציאים את הקואורדינטות.
                  </p>
                </div>

                <a
                  href="https://www.google.com/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  פתח את Google Maps
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
