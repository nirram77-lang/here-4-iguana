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
  country: string
  city: string
  address: string
  postalCode: string
  ownerName: string
  email: string
  phone: string
  latitude: string
  longitude: string
  website: string
  instagram: string
  facebook: string
  capacity: string
  openingHours: string
  closingHours: string
  description: string
  agreedToTerms: boolean
}

const initialFormData: FormData = {
  venueName: '',
  venueType: 'bar',
  country: 'Israel',
  city: '',
  address: '',
  postalCode: '',
  ownerName: '',
  email: '',
  phone: '',
  latitude: '',
  longitude: '',
  website: '',
  instagram: '',
  facebook: '',
  capacity: '',
  openingHours: '20:00',
  closingHours: '03:00',
  description: '',
  agreedToTerms: false
}

// Israeli cities list
const israeliCities = [
  'תל אביב / Tel Aviv',
  'ירושלים / Jerusalem',
  'חיפה / Haifa',
  'באר שבע / Beer Sheva',
  'אשדוד / Ashdod',
  'אשקלון / Ashkelon',
  'נתניה / Netanya',
  'הרצליה / Herzliya',
  'רמת גן / Ramat Gan',
  'פתח תקווה / Petah Tikva',
  'ראשון לציון / Rishon LeZion',
  'חולון / Holon',
  'בת ים / Bat Yam',
  'רחובות / Rehovot',
  'כפר סבא / Kfar Saba',
  'רעננה / Raanana',
  'מודיעין / Modiin',
  'אילת / Eilat',
  'טבריה / Tiberias',
  'נהריה / Nahariya',
  'עכו / Acre',
  'קריית שמונה / Kiryat Shmona',
  'צפת / Safed',
  'נצרת / Nazareth',
  'כרמיאל / Karmiel',
  'עפולה / Afula',
  'בית שאן / Beit Shean',
  'דימונה / Dimona',
  'ערד / Arad',
  'מצפה רמון / Mitzpe Ramon',
  'אחר / Other'
]

// Common countries with phone codes
const countries = [
  { value: 'Israel', label: '🇮🇱 Israel / ישראל', phoneCode: '+972', phoneLength: 9 },
  { value: 'USA', label: '🇺🇸 United States', phoneCode: '+1', phoneLength: 10 },
  { value: 'UK', label: '🇬🇧 United Kingdom', phoneCode: '+44', phoneLength: 10 },
  { value: 'Germany', label: '🇩🇪 Germany', phoneCode: '+49', phoneLength: 11 },
  { value: 'France', label: '🇫🇷 France', phoneCode: '+33', phoneLength: 9 },
  { value: 'Spain', label: '🇪🇸 Spain', phoneCode: '+34', phoneLength: 9 },
  { value: 'Italy', label: '🇮🇹 Italy', phoneCode: '+39', phoneLength: 10 },
  { value: 'Netherlands', label: '🇳🇱 Netherlands', phoneCode: '+31', phoneLength: 9 },
  { value: 'Greece', label: '🇬🇷 Greece', phoneCode: '+30', phoneLength: 10 },
  { value: 'Cyprus', label: '🇨🇾 Cyprus', phoneCode: '+357', phoneLength: 8 },
  { value: 'Portugal', label: '🇵🇹 Portugal', phoneCode: '+351', phoneLength: 9 },
  { value: 'Australia', label: '🇦🇺 Australia', phoneCode: '+61', phoneLength: 9 },
  { value: 'Canada', label: '🇨🇦 Canada', phoneCode: '+1', phoneLength: 10 },
  { value: 'Other', label: '🌍 Other', phoneCode: '+', phoneLength: 7 },
]

// Hours for dropdown
const hours = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00',
  '03:00', '04:00', '05:00'
]

// Translations
const translations = {
  en: {
    dir: 'ltr' as const,
    langToggle: 'עברית',
    heroTitle: 'Join ',
    heroTitleHighlight: 'I4IGUANA',
    heroSubtitle: 'Turn your venue into a hotspot for singles looking to connect!',
    benefits: [
      { title: 'New Audience', desc: 'Users looking for places to go out' },
      { title: 'Free Marketing', desc: 'Exposure in our app' },
      { title: 'Easy Start', desc: 'Simple joining process' },
    ],
    formTitle: '📝 Registration Form',
    venueSection: 'Venue Details',
    venueName: 'Venue Name',
    venueNamePlaceholder: 'e.g. The Iguana Bar',
    venueType: 'Venue Type',
    venueTypes: [
      { value: 'bar', label: '🍺 Bar' },
      { value: 'club', label: '🎉 Club' },
      { value: 'lounge', label: '🛋️ Lounge' },
      { value: 'pub', label: '🍻 Pub' },
      { value: 'restaurant_bar', label: '🍽️ Restaurant-Bar' },
      { value: 'rooftop', label: '🌃 Rooftop' },
      { value: 'beach_bar', label: '🏖️ Beach Bar' },
      { value: 'other', label: '✨ Other' },
    ],
    address: 'Street Address',
    addressPlaceholder: 'Street name, Number',
    country: 'Country',
    city: 'City',
    cityPlaceholder: 'e.g. New York',
    selectCity: 'Select city...',
    postalCode: 'Postal Code',
    postalCodePlaceholder: 'Optional',
    openingTime: 'Opens at',
    closingTime: 'Closes at',
    invalidPhone: 'Invalid phone number',
    coordinatesTitle: 'GPS Coordinates',
    coordinatesHelp: 'How to find?',
    coordinatesDesc: 'Coordinates are essential for the app to identify users inside your venue!',
    latitude: 'Latitude',
    longitude: 'Longitude',
    capacity: 'Capacity (people)',
    openingHours: 'Opening Hours',
    openingHoursPlaceholder: '20:00-03:00',
    description: 'Venue Description',
    descriptionPlaceholder: 'Tell us about your venue...',
    ownerSection: 'Owner Details',
    ownerName: 'Full Name',
    ownerNamePlaceholder: 'John Smith',
    email: 'Email',
    phone: 'Phone',
    phonePlaceholder: '+1-555-000-0000',
    socialSection: 'Digital Presence (Optional)',
    website: 'Website',
    submitButton: 'Submit Request',
    submitting: 'Submitting...',
    termsText: 'I agree to the',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
    and: 'and',
    questions: 'Questions?',
    required: 'Required',
    invalidEmail: 'Invalid email',
    invalidLat: 'Invalid (must be -90 to 90)',
    invalidLng: 'Invalid (must be -180 to 180)',
    mustAgree: 'You must agree to the terms',
    successTitle: 'Request Submitted! 🎉',
    successSubtitle: 'Thank you for joining the I4IGUANA family!',
    successDesc: 'Our team will contact you within 24-48 hours.',
    whatsNext: "What's next?",
    nextSteps: [
      '✅ Your request was received',
      '📞 We will contact you to coordinate',
      '🎨 We will prepare a unique QR sticker for you',
      '🚀 Your venue will go live!',
    ],
    backHome: 'Back to Home',
    coordHelpTitle: 'How to find coordinates?',
    method1Title: 'Method 1: WhatsApp (Easiest!)',
    method1Steps: [
      'Stand physically at your venue',
      'Open WhatsApp and send your location to yourself',
      'Click on the sent location',
      'Google Maps will open',
      'You will see the coordinates in the address bar',
      '⚡ Tip: Coordinates appear for a second! Copy quickly!',
    ],
    method2Title: 'Method 2: Google Maps on Computer',
    method2Steps: [
      'Open Google Maps on your computer',
      'Search for your venue address',
      'Right-click on the exact location',
      'The coordinates will appear - click to copy',
    ],
    importantNote: '⚠️ Important!',
    importantText: 'Coordinates must be accurate for the app to correctly identify users inside your venue. Stand in the center of your venue when getting the coordinates.',
    openMaps: 'Open Google Maps',
    exampleUrl: 'Example from URL:',
    firstIsLat: '↑ First number = Latitude, Second = Longitude',
  },
  he: {
    dir: 'rtl' as const,
    langToggle: 'English',
    heroTitle: 'הצטרפו ל-',
    heroTitleHighlight: 'I4IGUANA',
    heroSubtitle: 'הפכו את המועדון שלכם למוקד משיכה לרווקים ורווקות!',
    benefits: [
      { title: 'קהל חדש', desc: 'משתמשים מחפשים מקומות לצאת' },
      { title: 'שיווק חינמי', desc: 'חשיפה באפליקציה שלנו' },
      { title: 'קל להתחיל', desc: 'תהליך הצטרפות פשוט' },
    ],
    formTitle: '📝 טופס הצטרפות',
    venueSection: 'פרטי המקום',
    venueName: 'שם המקום',
    venueNamePlaceholder: 'לדוגמה: בר האיגואנה',
    venueType: 'סוג המקום',
    venueTypes: [
      { value: 'bar', label: '🍺 בר' },
      { value: 'club', label: '🎉 מועדון' },
      { value: 'lounge', label: '🛋️ לאונג\'' },
      { value: 'pub', label: '🍻 פאב' },
      { value: 'restaurant_bar', label: '🍽️ מסעדה-בר' },
      { value: 'rooftop', label: '🌃 רופטופ' },
      { value: 'beach_bar', label: '🏖️ בר חוף' },
      { value: 'other', label: '✨ אחר' },
    ],
    address: 'כתובת (רחוב ומספר)',
    addressPlaceholder: 'שם רחוב, מספר',
    country: 'מדינה',
    city: 'עיר',
    cityPlaceholder: 'לדוגמה: ניו יורק',
    selectCity: 'בחר עיר...',
    postalCode: 'מיקוד',
    postalCodePlaceholder: 'אופציונלי',
    openingTime: 'שעת פתיחה',
    closingTime: 'שעת סגירה',
    invalidPhone: 'מספר טלפון לא תקין',
    coordinatesTitle: 'קואורדינטות GPS',
    coordinatesHelp: 'איך למצוא?',
    coordinatesDesc: 'הקואורדינטות חיוניות כדי שהאפליקציה תזהה משתמשים בתוך המקום שלך!',
    latitude: 'Latitude (קו רוחב)',
    longitude: 'Longitude (קו אורך)',
    capacity: 'קיבולת (מספר אנשים)',
    openingHours: 'שעות פעילות',
    openingHoursPlaceholder: '20:00-03:00',
    description: 'תיאור המקום',
    descriptionPlaceholder: 'ספרו לנו על המקום שלכם...',
    ownerSection: 'פרטי בעל המקום',
    ownerName: 'שם מלא',
    ownerNamePlaceholder: 'ישראל ישראלי',
    email: 'אימייל',
    phone: 'טלפון',
    phonePlaceholder: '050-0000000',
    socialSection: 'נוכחות דיגיטלית (אופציונלי)',
    website: 'אתר אינטרנט',
    submitButton: 'שליחת הבקשה',
    submitting: 'שולח...',
    termsText: 'אני מאשר/ת שקראתי והסכמתי ל',
    termsLink: 'תנאי השימוש',
    privacyLink: 'מדיניות הפרטיות',
    and: 'ול',
    questions: 'שאלות?',
    required: 'שדה חובה',
    invalidEmail: 'אימייל לא תקין',
    invalidLat: 'ערך לא תקין (בין -90 ל-90)',
    invalidLng: 'ערך לא תקין (בין -180 ל-180)',
    mustAgree: 'יש לאשר את התנאים',
    successTitle: 'הטופס נשלח בהצלחה! 🎉',
    successSubtitle: 'תודה רבה על ההצטרפות למשפחת I4IGUANA!',
    successDesc: 'צוות שלנו יצור איתך קשר תוך 24-48 שעות.',
    whatsNext: 'מה קורה עכשיו?',
    nextSteps: [
      '✅ הבקשה שלך התקבלה',
      '📞 ניצור קשר לתיאום',
      '🎨 נכין עבורך סטיקר QR ייחודי',
      '🚀 המועדון שלך יעלה לאוויר!',
    ],
    backHome: 'חזרה לדף הבית',
    coordHelpTitle: 'איך למצוא קואורדינטות?',
    method1Title: 'שיטה 1: וואטסאפ (הכי קלה!)',
    method1Steps: [
      'עמדו פיזית במועדון שלכם',
      'פתחו וואטסאפ ושלחו מיקום לעצמכם',
      'לחצו על המיקום שנשלח',
      'ייפתח Google Maps',
      'בשורת הכתובת למעלה תראו את הקואורדינטות',
      '⚡ טיפ: הקואורדינטות מופיעות לשנייה! העתיקו מהר!',
    ],
    method2Title: 'שיטה 2: Google Maps במחשב',
    method2Steps: [
      'פתחו Google Maps במחשב',
      'חפשו את הכתובת של המקום',
      'לחצו קליק ימני על המיקום המדויק',
      'הקואורדינטות יופיעו - לחצו להעתקה',
    ],
    importantNote: '⚠️ חשוב!',
    importantText: 'הקואורדינטות צריכות להיות מדויקות כדי שהאפליקציה תזהה נכון משתמשים שנמצאים בתוך המקום שלכם. מומלץ לעמוד באמצע המקום כשמוציאים את הקואורדינטות.',
    openMaps: 'פתח את Google Maps',
    exampleUrl: 'דוגמה מ-URL:',
    firstIsLat: '↑ הראשון = Latitude, השני = Longitude',
  }
}

type Language = 'en' | 'he'

export default function VenueJoinPage() {
  const [lang, setLang] = useState<Language>('en')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showCoordinatesHelp, setShowCoordinatesHelp] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const t = translations[lang]
  const benefitIcons = [Users, Target, Zap]

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getSelectedCountry = () => countries.find(c => c.value === formData.country) || countries[0]

  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '')
    const country = getSelectedCountry()
    // Allow some flexibility: between min length and +3
    return digitsOnly.length >= country.phoneLength && digitsOnly.length <= country.phoneLength + 3
  }

  const validateCoordinatePrecision = (coord: string): boolean => {
    if (!coord.includes('.')) return false
    const decimals = coord.split('.')[1]
    return decimals !== undefined && decimals.length >= 4
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    if (!formData.venueName.trim()) newErrors.venueName = t.required
    if (!formData.ownerName.trim()) newErrors.ownerName = t.required
    if (!formData.email.trim()) newErrors.email = t.required
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t.invalidEmail
    if (!formData.phone.trim()) newErrors.phone = t.required
    else if (!validatePhone(formData.phone)) newErrors.phone = t.invalidPhone
    if (!formData.address.trim()) newErrors.address = t.required
    if (!formData.city.trim()) newErrors.city = t.required
    if (!formData.capacity.trim()) newErrors.capacity = t.required
    
    // Latitude validation with precision check
    if (!formData.latitude.trim()) newErrors.latitude = t.required
    else if (isNaN(parseFloat(formData.latitude)) || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90) {
      newErrors.latitude = t.invalidLat
    } else if (!validateCoordinatePrecision(formData.latitude)) {
      newErrors.latitude = lang === 'he' ? 'נדרשות לפחות 4 ספרות אחרי הנקודה' : 'At least 4 digits after decimal required'
    }
    
    // Longitude validation with precision check
    if (!formData.longitude.trim()) newErrors.longitude = t.required
    else if (isNaN(parseFloat(formData.longitude)) || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180) {
      newErrors.longitude = t.invalidLng
    } else if (!validateCoordinatePrecision(formData.longitude)) {
      newErrors.longitude = lang === 'he' ? 'נדרשות לפחות 4 ספרות אחרי הנקודה' : 'At least 4 digits after decimal required'
    }
    
    if (!formData.agreedToTerms) newErrors.agreedToTerms = t.mustAgree
    
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
        body: JSON.stringify({ ...formData, language: lang })
      })
      
      if (response.ok) {
        setIsSubmitted(true)
      } else {
        alert(lang === 'he' ? 'אירעה שגיאה, נסה שוב' : 'An error occurred, please try again')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert(lang === 'he' ? 'אירעה שגיאה, נסה שוב' : 'An error occurred, please try again')
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
          dir={t.dir}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-14 h-14 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-black text-white mb-4">{t.successTitle}</h2>
          <p className="text-white/70 mb-2">{t.successSubtitle}</p>
          <p className="text-white/70 mb-6">{t.successDesc}</p>
          
          <div className={`bg-white/10 rounded-xl p-4 mb-6 ${lang === 'he' ? 'text-right' : 'text-left'}`}>
            <p className="text-[#4ade80] font-bold mb-2">{t.whatsNext}</p>
            <ul className="text-white/60 text-sm space-y-2">
              {t.nextSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
          
          <Link href="/">
            <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold">
              {t.backHome}
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Top Bar - Back & Language */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
        {/* Back Button */}
        <Link 
          href="/"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{lang === 'he' ? 'חזרה' : 'Back'}</span>
        </Link>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          {t.langToggle}
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden" dir={t.dir}>
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
            {t.heroTitle}<span className="text-[#4ade80]">{t.heroTitleHighlight}</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/70 mb-8"
          >
            {t.heroSubtitle}
          </motion.p>
          
          {/* Benefits */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {t.benefits.map((benefit, i) => {
              const Icon = benefitIcons[i]
              return (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <Icon className="w-8 h-8 text-[#4ade80] mx-auto mb-2" />
                  <h3 className="text-white font-bold">{benefit.title}</h3>
                  <p className="text-white/60 text-sm">{benefit.desc}</p>
                </div>
              )
            })}
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
          dir={t.dir}
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.formTitle}</h2>

          {/* Venue Info */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-[#4ade80] flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t.venueSection}
            </h3>
            
            {/* 1. Venue Name */}
            <div className={errors.venueName ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">{t.venueName} *</label>
              <Input
                value={formData.venueName}
                onChange={(e) => handleInputChange('venueName', e.target.value)}
                placeholder={t.venueNamePlaceholder}
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.venueName ? 'border-red-500' : ''}`}
                dir="auto"
              />
              {errors.venueName && <p className="text-red-400 text-xs mt-1">{errors.venueName}</p>}
            </div>

            {/* 2. Venue Type */}
            <div>
              <label className="block text-white/80 text-sm mb-1">{t.venueType} *</label>
              <select
                value={formData.venueType}
                onChange={(e) => handleInputChange('venueType', e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2.5 cursor-pointer hover:bg-white/15 transition-colors"
                dir="auto"
              >
                {t.venueTypes.map(type => (
                  <option key={type.value} value={type.value} className="bg-[#1a4d3e] text-white">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Country Selection */}
            <div>
              <label className="block text-white/80 text-sm mb-1">{t.country} *</label>
              <select
                value={formData.country}
                onChange={(e) => {
                  handleInputChange('country', e.target.value)
                  handleInputChange('city', '') // Reset city when country changes
                }}
                className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2.5 cursor-pointer hover:bg-white/15 transition-colors"
              >
                {countries.map(c => (
                  <option key={c.value} value={c.value} className="bg-[#1a4d3e] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. City - Dropdown for Israel, Text for others */}
            <div className={errors.city ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">{t.city} *</label>
              {formData.country === 'Israel' ? (
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full bg-white/10 border border-white/20 text-white rounded-md p-2.5 cursor-pointer hover:bg-white/15 transition-colors ${errors.city ? 'border-red-500' : ''}`}
                >
                  <option value="" className="bg-[#1a4d3e] text-white/50">{t.selectCity}</option>
                  {israeliCities.map(city => (
                    <option key={city} value={city} className="bg-[#1a4d3e] text-white">
                      {city}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder={t.cityPlaceholder}
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.city ? 'border-red-500' : ''}`}
                  dir="auto"
                />
              )}
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* 5. Street Address */}
            <div className={errors.address ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">{t.address} *</label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t.addressPlaceholder}
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.address ? 'border-red-500' : ''}`}
                dir="auto"
              />
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* 6. Postal Code (Optional) */}
            <div>
              <label className="block text-white/80 text-sm mb-1">{t.postalCode}</label>
              <Input
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder={t.postalCodePlaceholder}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                dir="ltr"
              />
            </div>

            {/* 7. GPS Coordinates */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-purple-400" />
                  {t.coordinatesTitle}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCoordinatesHelp(true)}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  {t.coordinatesHelp}
                </button>
              </div>
              
              <p className="text-white/60 text-sm mb-3">{t.coordinatesDesc}</p>

              {/* Critical Accuracy Warning */}
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-red-300 font-bold text-sm">
                      {lang === 'he' ? 'דיוק קריטי!' : 'Critical Accuracy!'}
                    </p>
                    <p className="text-red-200/80 text-xs mt-1">
                      {lang === 'he' 
                        ? 'הקואורדינטות קובעות אם משתמשים יזוהו במקום שלך. העתק את המספרים בדיוק מ-Google Maps - כולל כל הספרות אחרי הנקודה!'
                        : 'Coordinates determine if users are detected at your venue. Copy the numbers exactly from Google Maps - including ALL digits after the decimal point!'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={errors.latitude ? 'error-field' : ''}>
                  <label className="block text-white/80 text-xs mb-1">{t.latitude} *</label>
                  <Input
                    value={formData.latitude}
                    onChange={(e) => {
                      // Allow only numbers, one decimal point, and minus sign at start
                      const val = e.target.value.replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1')
                      handleInputChange('latitude', val)
                    }}
                    placeholder="31.794505"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono text-center ${errors.latitude ? 'border-red-500' : ''}`}
                    dir="ltr"
                  />
                  {formData.latitude && !errors.latitude && formData.latitude.includes('.') && (
                    <p className={`text-xs mt-1 ${(formData.latitude.split('.')[1] || '').length >= 4 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {(formData.latitude.split('.')[1] || '').length >= 4 
                        ? (lang === 'he' ? '✓ דיוק מעולה' : '✓ Great precision')
                        : (lang === 'he' ? '⚠ הוסף עוד ספרות לדיוק' : '⚠ Add more digits for accuracy')}
                    </p>
                  )}
                  {errors.latitude && <p className="text-red-400 text-xs mt-1">{errors.latitude}</p>}
                </div>
                <div className={errors.longitude ? 'error-field' : ''}>
                  <label className="block text-white/80 text-xs mb-1">{t.longitude} *</label>
                  <Input
                    value={formData.longitude}
                    onChange={(e) => {
                      // Allow only numbers, one decimal point, and minus sign at start
                      const val = e.target.value.replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1')
                      handleInputChange('longitude', val)
                    }}
                    placeholder="34.632057"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono text-center ${errors.longitude ? 'border-red-500' : ''}`}
                    dir="ltr"
                  />
                  {formData.longitude && !errors.longitude && formData.longitude.includes('.') && (
                    <p className={`text-xs mt-1 ${(formData.longitude.split('.')[1] || '').length >= 4 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {(formData.longitude.split('.')[1] || '').length >= 4 
                        ? (lang === 'he' ? '✓ דיוק מעולה' : '✓ Great precision')
                        : (lang === 'he' ? '⚠ הוסף עוד ספרות לדיוק' : '⚠ Add more digits for accuracy')}
                    </p>
                  )}
                  {errors.longitude && <p className="text-red-400 text-xs mt-1">{errors.longitude}</p>}
                </div>
              </div>

              {/* Format Example */}
              <div className="mt-3 text-center">
                <p className="text-white/40 text-xs">
                  {lang === 'he' ? 'פורמט נדרש:' : 'Required format:'} <span className="font-mono text-purple-300">31.794505, 34.632057</span>
                </p>
              </div>
            </div>

            {/* 8. Capacity & Opening Hours - Hollywood Style */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
              <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-amber-400" />
                {lang === 'he' ? 'קיבולת ושעות פעילות' : 'Capacity & Hours'}
              </h4>
              
              {/* Capacity */}
              <div className={`mb-4 ${errors.capacity ? 'error-field' : ''}`}>
                <label className="block text-white/80 text-sm mb-2">{t.capacity} *</label>
                <div className="relative">
                  <Input
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="200"
                    type="number"
                    min="1"
                    className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 text-center text-xl font-bold pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.capacity ? 'border-red-500' : ''}`}
                    dir="ltr"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleInputChange('capacity', String(Math.max(1, parseInt(formData.capacity || '0') + 10)))}
                      className="w-8 h-6 bg-amber-500/30 hover:bg-amber-500/50 rounded text-white text-xs font-bold transition-colors"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('capacity', String(Math.max(1, parseInt(formData.capacity || '0') - 10)))}
                      className="w-8 h-6 bg-amber-500/20 hover:bg-amber-500/40 rounded text-white text-xs font-bold transition-colors"
                    >
                      -10
                    </button>
                  </div>
                </div>
                {errors.capacity && <p className="text-red-400 text-xs mt-1">{errors.capacity}</p>}
              </div>

              {/* Opening Hours with Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">{t.openingTime} *</label>
                  <select
                    value={formData.openingHours}
                    onChange={(e) => handleInputChange('openingHours', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2.5 cursor-pointer hover:bg-white/15 transition-colors text-center font-mono"
                  >
                    {hours.map(hour => (
                      <option key={`open-${hour}`} value={hour} className="bg-[#1a4d3e] text-white">
                        🕐 {hour}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">{t.closingTime} *</label>
                  <select
                    value={formData.closingHours}
                    onChange={(e) => handleInputChange('closingHours', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2.5 cursor-pointer hover:bg-white/15 transition-colors text-center font-mono"
                  >
                    {hours.map(hour => (
                      <option key={`close-${hour}`} value={hour} className="bg-[#1a4d3e] text-white">
                        🕐 {hour}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 9. Description */}
            <div>
              <label className="block text-white/80 text-sm mb-1">{t.description}</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={3}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-md p-2 resize-none"
                dir="auto"
              />
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-[#4ade80] flex items-center gap-2">
              <User className="w-5 h-5" />
              {t.ownerSection}
            </h3>

            <div className={errors.ownerName ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">{t.ownerName} *</label>
              <Input
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                placeholder={t.ownerNamePlaceholder}
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.ownerName ? 'border-red-500' : ''}`}
                dir="auto"
              />
              {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName}</p>}
            </div>

            <div className={errors.email ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">{t.email} *</label>
              <Input
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
                type="email"
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 ${errors.email ? 'border-red-500' : ''}`}
                dir="ltr"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className={errors.phone ? 'error-field' : ''}>
              <label className="block text-white/80 text-sm mb-1">{t.phone} *</label>
              <div className="flex gap-2">
                {/* Country Code Display */}
                <div className="flex items-center justify-center bg-white/10 border border-white/20 rounded-md px-3 min-w-[80px] text-white font-mono">
                  {getSelectedCountry().phoneCode}
                </div>
                {/* Phone Input */}
                <Input
                  value={formData.phone}
                  onChange={(e) => {
                    // Allow only numbers, spaces, and dashes
                    const cleaned = e.target.value.replace(/[^\d\s-]/g, '')
                    handleInputChange('phone', cleaned)
                  }}
                  placeholder={formData.country === 'Israel' ? '52-265-3170' : '555-123-4567'}
                  type="tel"
                  className={`flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono ${errors.phone ? 'border-red-500' : ''}`}
                  dir="ltr"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              <p className="text-white/40 text-xs mt-1">
                {lang === 'he' ? `מינימום ${getSelectedCountry().phoneLength} ספרות` : `Minimum ${getSelectedCountry().phoneLength} digits`}
              </p>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-[#4ade80] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t.socialSection}
            </h3>

            <div>
              <label className="block text-white/80 text-sm mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4" /> {t.website}
              </label>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-1 flex items-center gap-2">
                <Instagram className="w-4 h-4" /> Instagram
              </label>
              <Input
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="@yourvenue"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-1 flex items-center gap-2">
                <Facebook className="w-4 h-4" /> Facebook
              </label>
              <Input
                value={formData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                placeholder="facebook.com/yourvenue"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                dir="ltr"
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
                {t.termsText}
                <Link href="/terms" className="text-[#4ade80] hover:underline mx-1">{t.termsLink}</Link>
                {t.and}
                <Link href="/privacy" className="text-[#4ade80] hover:underline mx-1">{t.privacyLink}</Link>
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
                {t.submitting}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                {t.submitButton}
              </span>
            )}
          </Button>

          <p className="text-center text-white/50 text-sm mt-4">
            {t.questions} <a href="mailto:venues@i4iguana.com" className="text-[#4ade80] hover:underline">venues@i4iguana.com</a>
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
              dir={t.dir}
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Navigation className="w-6 h-6" />
                  {t.coordHelpTitle}
                </h2>
                <button onClick={() => setShowCoordinatesHelp(false)} className="p-2 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* WhatsApp Method */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {t.method1Title}
                  </h3>
                  <ol className="text-white/80 text-sm space-y-2 list-decimal list-inside">
                    {t.method1Steps.map((step, i) => (
                      <li key={i} className={step.includes('⚡') ? 'text-yellow-400 font-bold' : ''}>{step}</li>
                    ))}
                  </ol>
                  <div className="mt-3 bg-black/30 rounded-lg p-3 font-mono text-sm text-white/70" dir="ltr">
                    <p>{t.exampleUrl}</p>
                    <p className="text-green-400">maps.google.com/?q=<span className="text-yellow-400">31.794505</span>,<span className="text-yellow-400">34.632057</span></p>
                    <p className="mt-2 text-white/50">{t.firstIsLat}</p>
                  </div>
                </div>

                {/* Google Maps Method */}
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t.method2Title}
                  </h3>
                  <ol className="text-white/80 text-sm space-y-2 list-decimal list-inside">
                    {t.method2Steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Important Note */}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-yellow-400 mb-2">{t.importantNote}</h3>
                  <p className="text-white/80 text-sm">{t.importantText}</p>
                </div>

                <a
                  href="https://www.google.com/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  {t.openMaps}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
