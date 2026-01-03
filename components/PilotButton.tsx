'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MapPin, Calendar, X, Mail, CheckCircle, Sparkles, Store, User, Phone, Building2, ChevronDown, Users, Map, Navigation, Zap } from 'lucide-react'

interface PilotLaunchData {
  isActive: boolean
  collectEmails: boolean
  launchDate: string
  venue: { he: string; en: string }
  title: { he: string; en: string }
  description: { he: string; en: string }
  buttonText: { he: string; en: string }
}

interface PilotButtonProps {
  lang: 'he' | 'en' | 'pt'
}

interface VenueFormData {
  venueName: string
  venueType: string
  contactName: string
  phone: string
  email: string
  city: string
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 REAL PILOT DATA - Cities and Zones
// ═══════════════════════════════════════════════════════════════════════════

const pilotCities = {
  he: [
    {
      name: 'תל אביב',
      icon: '🌆',
      zones: [
        { name: 'פלורנטין', venues: ['ברים', 'פאבים', 'מועדונים'], hot: true },
        { name: 'רחוב הארבעה', venues: ['Capella', 'Mass', 'Tapeo'], hot: true }
      ]
    },
    {
      name: 'אשקלון',
      icon: '🏖️',
      zones: [
        { name: 'מרינה', venues: ['Archie', 'Jack', 'ברים על החוף'], hot: true },
        { name: 'חוף דלילה', venues: ['ברים', 'מסעדות', 'על החוף'], hot: false },
        { name: 'שדרות הנשיא', venues: ['Bar HaNasi 1', 'Patio'], hot: false },
        { name: 'Barnea Blv.', venues: ['בתי קפה', 'ברים'], hot: false }
      ]
    },
    {
      name: 'רחובות',
      icon: '🔬',
      zones: [
        { name: 'פארק המדע', venues: ['מסעדות', 'ברים', 'בתי קפה'], hot: true },
        { name: 'הרצל דאונטאון', venues: ['בתי קפה', 'ברים'], hot: false }
      ]
    }
  ],
  en: [
    {
      name: 'Tel Aviv',
      icon: '🌆',
      zones: [
        { name: 'Florentin', venues: ['Bars', 'Pubs', 'Clubs'], hot: true },
        { name: 'HaArbaa St.', venues: ['Capella', 'Mass', 'Tapeo'], hot: true }
      ]
    },
    {
      name: 'Ashkelon',
      icon: '🏖️',
      zones: [
        { name: 'Marina', venues: ['Archie', 'Jack', 'Beach bars'], hot: true },
        { name: 'Delila Beach', venues: ['Bars', 'Restaurants'], hot: false },
        { name: 'Sderot HaNasi', venues: ['Bar HaNasi 1', 'Patio'], hot: false },
        { name: 'Barnea Blv.', venues: ['Cafes', 'Bars'], hot: false }
      ]
    },
    {
      name: 'Rehovot',
      icon: '🔬',
      zones: [
        { name: 'Science Park', venues: ['Restaurants', 'Bars', 'Cafes'], hot: true },
        { name: 'Herzl Downtown', venues: ['Cafes', 'Bars'], hot: false }
      ]
    }
  ],
  pt: [
    {
      name: 'Tel Aviv',
      icon: '🌆',
      zones: [
        { name: 'Florentin', venues: ['Bares', 'Pubs', 'Clubes'], hot: true },
        { name: 'HaArbaa St.', venues: ['Capella', 'Mass', 'Tapeo'], hot: true }
      ]
    },
    {
      name: 'Ashkelon',
      icon: '🏖️',
      zones: [
        { name: 'Marina', venues: ['Archie', 'Jack', 'Bares na praia'], hot: true },
        { name: 'Praia Delila', venues: ['Bares', 'Restaurantes'], hot: false },
        { name: 'Sderot HaNasi', venues: ['Bar HaNasi 1', 'Patio'], hot: false },
        { name: 'Barnea Blv.', venues: ['Cafés', 'Bares'], hot: false }
      ]
    },
    {
      name: 'Rehovot',
      icon: '🔬',
      zones: [
        { name: 'Parque da Ciência', venues: ['Restaurantes', 'Bares', 'Cafés'], hot: true },
        { name: 'Herzl Centro', venues: ['Cafés', 'Bares'], hot: false }
      ]
    }
  ]
}

export default function PilotButton({ lang }: PilotButtonProps) {
  const [data, setData] = useState<PilotLaunchData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'user' | 'venue' | 'feedback'>('map')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [expandedCity, setExpandedCity] = useState<string | null>(null)
  
  // Venue form states
  const [venueSubmitting, setVenueSubmitting] = useState(false)
  const [venueSubmitted, setVenueSubmitted] = useState(false)
  const [venueForm, setVenueForm] = useState<VenueFormData>({
    venueName: '',
    venueType: '',
    contactName: '',
    phone: '',
    email: '',
    city: ''
  })
  
  // ✅ v2.8.6: Feedback form states
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    feedback: '',
    contact: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const loadData = async () => {
    try {
      const docRef = doc(db, 'settings', 'pilotLaunch')
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setData(docSnap.data() as PilotLaunchData)
      }
    } catch (error) {
      console.error('Error loading pilot launch data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitting) return
    
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'pilotWaitlist'), {
        email,
        lang,
        createdAt: Timestamp.now(),
        source: 'pilot-button'
      })
      setSubmitted(true)
      setEmail('')
    } catch (error) {
      console.error('Error saving email:', error)
      alert(lang === 'he' ? 'שגיאה, נסה שוב' : 'Error, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (venueSubmitting) return
    
    setVenueSubmitting(true)
    try {
      await addDoc(collection(db, 'venueRequests'), {
        venueName: venueForm.venueName,
        venueType: venueForm.venueType,
        ownerName: venueForm.contactName,
        ownerPhone: venueForm.phone,
        ownerEmail: venueForm.email,
        city: venueForm.city,
        address: venueForm.city,
        location: { latitude: 0, longitude: 0 },
        lang,
        status: 'pending',
        source: 'pilot-modal',
        createdAt: Timestamp.now()
      })
      setVenueSubmitted(true)
    } catch (error) {
      console.error('Error saving venue request:', error)
      alert(lang === 'he' ? 'שגיאה, נסה שוב' : 'Error, please try again')
    } finally {
      setVenueSubmitting(false)
    }
  }

  // ✅ v2.8.6: Feedback form handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (feedbackSubmitting) return
    
    setFeedbackSubmitting(true)
    try {
      await addDoc(collection(db, 'pilotFeedback'), {
        name: feedbackForm.name,
        feedback: feedbackForm.feedback,
        contact: feedbackForm.contact,
        lang,
        source: 'pilot-modal-feedback',
        createdAt: Timestamp.now()
      })
      setFeedbackSubmitted(true)
    } catch (error) {
      console.error('Error saving feedback:', error)
      alert(lang === 'he' ? 'שגיאה, נסה שוב' : 'Error, please try again')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const venueTypes = lang === 'he' 
    ? ['בר', 'פאב', 'מועדון', 'מסעדה-בר', 'לאונג\'', 'אחר']
    : lang === 'pt'
    ? ['Bar', 'Pub', 'Clube', 'Restaurante-Bar', 'Lounge', 'Outro']
    : ['Bar', 'Pub', 'Club', 'Restaurant-Bar', 'Lounge', 'Other']

  const texts = {
    he: {
      pilotLive: 'הפיילוט באוויר! 🔥',
      subtitle: '3 ערים • 7 אזורי בילוי • בנות ובנים מחכים לך',
      activeZones: 'מקומות שהאפליקציה עובדת בהם',
      hotNow: 'חם עכשיו',
      joinMovement: 'הורד את האפליקציה והצטרף למהפכה!',
      wantToJoin: 'רוצה להצטרף?',
      ownVenue: 'בעל מועדון?',
      backToMap: 'חזרה',
      emailPlaceholder: 'האימייל שלך',
      notifyMe: 'עדכנו אותי',
      noSpam: 'לא נשלח ספאם. רק עדכון אחד.',
      thankYou: 'תודה! נעדכן אותך בהקדם',
      joinPilot: 'הצטרף לפיילוט',
      venueName: 'שם המועדון / הבר',
      venueType: 'סוג המקום',
      contactName: 'שם איש קשר',
      phone: 'טלפון',
      email: 'אימייל',
      city: 'עיר',
      sending: 'שולח...',
      venueThankYou: 'תודה! נחזור אליך בהקדם 🎉',
      venueThankYouSub: 'הצוות שלנו יצור איתך קשר',
      within24: 'נחזור אליך תוך 24 שעות',
      limitedSpots: 'מקומות מוגבלים בפיילוט',
      downloadApp: 'הורד את האפליקציה',
      clickToExpand: 'לחץ לפרטים',
      ctaMain: '🔥 צאי/צא הלילה - תכירי/תכיר מישהו!',
      ctaSub: 'Real-Time Dating Experience 💃🕺',
      // ✅ v2.8.6: Feedback form translations
      feedbackTitle: 'שתף אותנו בחוויה 💬',
      feedbackSubtitle: 'הפידבק שלך עוזר לנו להשתפר',
      feedbackName: 'שם',
      feedbackText: 'מה חשבת? איך היה?',
      feedbackContact: 'פרטי יצירת קשר (אופציונלי)',
      feedbackButton: 'שלח פידבק',
      feedbackThankYou: 'תודה על הפידבק! 🙏',
      feedbackThankYouSub: 'נקרא ונלמד מכל תגובה',
      shareFeedback: 'שתפו חוויה',
    },
    en: {
      pilotLive: 'Pilot is LIVE! 🇮🇱',
      subtitle: 'Starting in Israel • More cities coming soon',
      activeZones: 'Where the App Works',
      hotNow: 'Hot Now',
      joinMovement: 'Get notified when we launch in your city!',
      wantToJoin: 'Get Notified',
      ownVenue: 'Own a Venue?',
      backToMap: 'Back',
      emailPlaceholder: 'Your email',
      notifyMe: 'Notify Me',
      noSpam: 'No spam. Just launch updates.',
      thankYou: 'Thanks! We\'ll notify you',
      joinPilot: 'Join the Pilot',
      venueName: 'Venue Name',
      venueType: 'Venue Type',
      contactName: 'Contact Name',
      phone: 'Phone',
      email: 'Email',
      city: 'City',
      sending: 'Sending...',
      venueThankYou: 'Thanks! We\'ll get back to you soon 🎉',
      venueThankYouSub: 'Our team will contact you',
      within24: 'We\'ll get back within 24 hours',
      limitedSpots: 'Expanding to new cities soon',
      downloadApp: 'Download the App',
      clickToExpand: 'Click for details',
      ctaMain: '🔥 Go out tonight, meet someone new!',
      ctaSub: 'Try it • Experience it • Connect',
      // ✅ v2.8.6: Feedback form translations
      feedbackTitle: 'Share Your Experience 💬',
      feedbackSubtitle: 'Your feedback helps us improve',
      feedbackName: 'Name',
      feedbackText: 'What did you think? How was it?',
      feedbackContact: 'Contact info (optional)',
      feedbackButton: 'Send Feedback',
      feedbackThankYou: 'Thanks for your feedback! 🙏',
      feedbackThankYouSub: 'We read and learn from every response',
      shareFeedback: 'Share Feedback',
    },
    pt: {
      pilotLive: 'Piloto ATIVO! 🇧🇷',
      subtitle: 'Começando em Israel • Mais cidades em breve',
      activeZones: 'Onde o App Funciona',
      hotNow: 'Em Alta',
      joinMovement: 'Seja notificado quando lançarmos na sua cidade!',
      wantToJoin: 'Seja Notificado',
      ownVenue: 'Tem um Local?',
      backToMap: 'Voltar',
      emailPlaceholder: 'Seu email',
      notifyMe: 'Me Avise',
      noSpam: 'Sem spam. Apenas atualizações de lançamento.',
      thankYou: 'Obrigado! Vamos te notificar',
      joinPilot: 'Junte-se ao Piloto',
      venueName: 'Nome do Local',
      venueType: 'Tipo de Local',
      contactName: 'Nome do Contato',
      phone: 'Telefone',
      email: 'Email',
      city: 'Cidade',
      sending: 'Enviando...',
      venueThankYou: 'Obrigado! Entraremos em contato em breve 🎉',
      venueThankYouSub: 'Nossa equipe entrará em contato',
      within24: 'Retornaremos em 24 horas',
      limitedSpots: 'Expandindo para novas cidades em breve',
      downloadApp: 'Baixar o App',
      clickToExpand: 'Clique para detalhes',
      ctaMain: '🔥 Saia hoje, conheça alguém novo!',
      ctaSub: 'Experimente • Viva • Conecte-se',
      feedbackTitle: 'Compartilhe sua Experiência 💬',
      feedbackSubtitle: 'Seu feedback nos ajuda a melhorar',
      feedbackName: 'Nome',
      feedbackText: 'O que você achou? Como foi?',
      feedbackContact: 'Contato (opcional)',
      feedbackButton: 'Enviar Feedback',
      feedbackThankYou: 'Obrigado pelo feedback! 🙏',
      feedbackThankYouSub: 'Lemos e aprendemos com cada resposta',
      shareFeedback: 'Compartilhar Feedback',
    }
  }

  const t = texts[lang]
  const cities = pilotCities[lang]

  // Count total zones
  const totalZones = cities.reduce((acc, city) => acc + city.zones.length, 0)

  // ✅ v2.8.12: Button text based on active status, but ALWAYS clickable
  const buttonText = data?.isActive 
    ? (lang === 'he' ? 'פיילוט LIVE' : 'Pilot LIVE')
    : (lang === 'he' ? 'פיילוט בקרוב' : 'Pilot Soon')

  return (
    <>
      {/* PILOT Button - Premium Red-Orange-Yellow Style */}
      <button
        data-pilot-button
        onClick={() => {
          setIsOpen(true)
          setActiveTab('map')
          setVenueSubmitted(false)
          setSubmitted(false)
          setExpandedCity(null)
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #dc2626, #ea580c, #f59e0b)',
          color: 'white',
          boxShadow: isHovered 
            ? '0 0 25px rgba(234, 88, 12, 0.6), 0 4px 20px rgba(245, 158, 11, 0.4)' 
            : '0 2px 15px rgba(234, 88, 12, 0.3)',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        {/* Subtle elegant shimmer */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'pilotShimmer 3s ease-in-out infinite'
          }}
        />
        
        {/* Live dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        
        {/* Text */}
        <span className="relative z-10">{buttonText}</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir={lang === 'he' ? 'rtl' : 'ltr'}
          >
            {/* Animated glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#15803d] via-[#4ade80] to-[#15803d] rounded-3xl blur-lg opacity-30 animate-glow"></div>
            
            {/* Main Card */}
            <div className="relative bg-gradient-to-b from-[#0d2920] to-[#071812] rounded-2xl border border-[#4ade80]/30 overflow-hidden">
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* MAP VIEW - Different for HE vs EN */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'map' && (
                <div className="p-5 pt-10">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4ade80]/20 rounded-full mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]"></span>
                      </span>
                      <span className="text-[#4ade80] text-sm font-medium">LIVE</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      🦎 {t.pilotLive}
                    </h2>
                    <p className="text-white/60 text-sm">{t.subtitle}</p>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════ */}
                  {/* HEBREW VERSION - Detailed Cities & Zones */}
                  {/* ═══════════════════════════════════════════════════════════ */}
                  {lang === 'he' ? (
                    <div className="space-y-3 mb-4">
                      <h3 className="text-[#4ade80] font-semibold text-sm flex items-center gap-2 justify-center">
                        <MapPin className="h-4 w-4" />
                        {t.activeZones}
                      </h3>
                      
                      {cities.map((city, cityIndex) => (
                        <div 
                          key={city.name}
                          className="bg-white/5 rounded-xl border border-[#4ade80]/20 overflow-hidden"
                        >
                          {/* City Header - Clickable */}
                          <button
                            onClick={() => setExpandedCity(expandedCity === city.name ? null : city.name)}
                            className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{city.icon}</span>
                              <span className="text-white font-bold">{city.name}</span>
                              <span className="text-white/40 text-xs">({city.zones.length} אזורים)</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${expandedCity === city.name ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {/* Zones List - Expanded */}
                          {expandedCity === city.name && (
                            <div className="px-3 pb-3 space-y-2 animate-fadeIn">
                              {city.zones.map((zone, zoneIndex) => (
                                <div 
                                  key={zone.name}
                                  className={`p-2 rounded-lg ${zone.hot ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30' : 'bg-white/5'}`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {zone.hot && <Zap className="h-3 w-3 text-orange-400" />}
                                    <span className={`font-medium text-sm ${zone.hot ? 'text-orange-300' : 'text-white/90'}`}>
                                      {zone.name}
                                    </span>
                                    {zone.hot && (
                                      <span className="text-[10px] bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded-full">
                                        {t.hotNow}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {zone.venues.map((venue, i) => (
                                      <span key={i} className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded">
                                        {venue}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Stats with Feedback Button */}
                      <div className="flex justify-center items-center gap-4 py-2">
                        {/* ✅ v2.8.6: Feedback Button with shimmer */}
                        <button
                          onClick={() => setActiveTab('feedback')}
                          className="relative flex flex-col items-center gap-1 px-4 py-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/40 rounded-xl hover:border-purple-400 hover:bg-purple-500/30 transition-all group overflow-hidden"
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          <span className="text-xl">💬</span>
                          <span className="text-[10px] text-white/70 font-medium">{t.shareFeedback}</span>
                        </button>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#4ade80]">{cities.length}</div>
                          <div className="text-xs text-white/50">ערים</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#4ade80]">{totalZones}</div>
                          <div className="text-xs text-white/50">אזורי בילוי</div>
                        </div>
                        {/* ✅ v2.8.6: Bigger infinity icon */}
                        <div className="text-center">
                          <div className="text-4xl font-bold text-[#4ade80]">∞</div>
                          <div className="text-xs text-white/50">הזדמנויות</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ═══════════════════════════════════════════════════════════ */
                    /* ENGLISH VERSION - Teasing/Global */
                    /* ═══════════════════════════════════════════════════════════ */
                    <div className="mb-4">
                      {/* Map visualization */}
                      <div className="relative mx-auto w-full max-w-[200px] h-[180px] mb-4">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d="M45,5 L55,5 L58,15 L55,25 L60,35 L55,45 L50,50 L55,60 L50,70 L55,80 L50,95 L45,95 L40,80 L45,70 L40,60 L45,50 L40,45 L35,35 L40,25 L38,15 Z"
                            fill="rgba(74, 222, 128, 0.1)"
                            stroke="rgba(74, 222, 128, 0.3)"
                            strokeWidth="0.5"
                          />
                          {/* === ACTIVE CITIES (Orange/Hot) === */}
                          {/* Tel Aviv - ACTIVE 🔥 */}
                          <g>
                            <circle cx="38" cy="38" r="4" fill="rgba(251, 146, 60, 0.4)" className="animate-ping" />
                            <circle cx="38" cy="38" r="2.5" fill="#fb923c" />
                          </g>
                          {/* Rehovot - ACTIVE 🔥 */}
                          <g>
                            <circle cx="42" cy="48" r="4" fill="rgba(251, 146, 60, 0.4)" className="animate-ping" style={{ animationDelay: '0.3s' }} />
                            <circle cx="42" cy="48" r="2.5" fill="#fb923c" />
                          </g>
                          {/* Ashkelon - ACTIVE 🔥 */}
                          <g>
                            <circle cx="36" cy="58" r="4" fill="rgba(251, 146, 60, 0.4)" className="animate-ping" style={{ animationDelay: '0.6s' }} />
                            <circle cx="36" cy="58" r="2.5" fill="#fb923c" />
                          </g>
                          {/* === COMING SOON CITIES (Gray) === */}
                          {/* Haifa */}
                          <circle cx="42" cy="22" r="1.5" fill="rgba(255,255,255,0.3)" />
                          {/* Jerusalem */}
                          <circle cx="52" cy="42" r="1.5" fill="rgba(255,255,255,0.3)" />
                          {/* Beer Sheva */}
                          <circle cx="42" cy="72" r="1.5" fill="rgba(255,255,255,0.3)" />
                          {/* Eilat */}
                          <circle cx="48" cy="92" r="1.5" fill="rgba(255,255,255,0.3)" />
                          {/* Netanya */}
                          <circle cx="36" cy="30" r="1.5" fill="rgba(255,255,255,0.3)" />
                        </svg>
                        
                        {/* City labels - Active cities in orange */}
                        <div className="absolute top-[32%] left-[15%] text-[10px] text-orange-400 font-medium">Tel Aviv 🔥</div>
                        <div className="absolute top-[45%] left-[55%] text-[10px] text-orange-400 font-medium">Rehovot 🔥</div>
                        <div className="absolute top-[55%] left-[10%] text-[10px] text-orange-400 font-medium">Ashkelon 🔥</div>
                        {/* Coming soon labels */}
                        <div className="absolute top-[18%] left-[52%] text-[8px] text-white/30">Haifa</div>
                        <div className="absolute top-[38%] left-[62%] text-[8px] text-white/30">Jerusalem</div>
                        <div className="absolute top-[70%] left-[50%] text-[8px] text-white/30">Beer Sheva</div>
                      </div>
                      
                      {/* Global message */}
                      <div className="text-center bg-white/5 rounded-xl p-4 border border-[#4ade80]/20">
                        <div className="text-white/80 text-sm mb-2">
                          🌍 We're starting in Israel and expanding globally!
                        </div>
                        <div className="text-white/50 text-xs">
                          Tel Aviv • Ashkelon • Rehovot
                        </div>
                        <div className="text-[#4ade80] text-xs mt-2 font-medium">
                          More cities coming soon...
                        </div>
                      </div>
                      
                      {/* ✅ v2.8.10: Feedback button for English users only */}
                      <div className="flex justify-center my-4">
                        <button
                          onClick={() => setActiveTab('feedback')}
                          className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/40 rounded-xl hover:border-purple-400 hover:bg-purple-500/30 transition-all group overflow-hidden"
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          <span className="text-xl">💬</span>
                          <span className="text-sm text-white/80 font-medium">{t.shareFeedback}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 🔥 CTA Banner - Action oriented! */}
                  <div className="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border border-orange-500/30 rounded-2xl p-4 mb-4">
                    <p className="text-center text-white font-bold text-lg mb-1">
                      {t.ctaMain}
                    </p>
                    <p className="text-center text-white/60 text-sm">
                      {t.ctaSub}
                    </p>
                  </div>

                  {/* Two CTA Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <button
                      onClick={() => setActiveTab('user')}
                      className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-[#4ade80]/20 to-[#22c55e]/10 border border-[#4ade80]/30 rounded-xl hover:border-[#4ade80] hover:bg-[#4ade80]/20 transition-all group"
                    >
                      <Users className="h-5 w-5 text-[#4ade80] group-hover:scale-110 transition-transform" />
                      <span className="text-white font-medium text-sm">{t.wantToJoin}</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('venue')}
                      className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-[#4ade80]/20 to-[#22c55e]/10 border border-[#4ade80]/30 rounded-xl hover:border-[#4ade80] hover:bg-[#4ade80]/20 transition-all group"
                    >
                      <Store className="h-5 w-5 text-[#4ade80] group-hover:scale-110 transition-transform" />
                      <span className="text-white font-medium text-sm">{t.ownVenue}</span>
                    </button>
                  </div>

                  {/* Footer text */}
                  <p className="text-center text-[#4ade80]/60 text-xs flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    {t.limitedSpots}
                  </p>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* USER FORM */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'user' && (
                <div className="p-6 pt-12">
                  {/* Back button */}
                  <button
                    onClick={() => setActiveTab('map')}
                    className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-4 transition-colors"
                  >
                    <ChevronDown className={`h-4 w-4 ${lang === 'he' ? 'rotate-90' : '-rotate-90'}`} />
                    {t.backToMap}
                  </button>

                  <div className="text-center mb-6">
                    <Users className="h-12 w-12 text-[#4ade80] mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-1">{t.wantToJoin}</h3>
                    <p className="text-white/60 text-sm">{t.noSpam}</p>
                  </div>

                  {submitted ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                      <CheckCircle className="h-12 w-12 text-[#4ade80]" />
                      <span className="font-semibold text-lg text-white">{t.thankYou}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'right-4' : 'left-4'} h-5 w-5 text-white/30`} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.emailPlaceholder}
                          required
                          className={`w-full py-3 ${lang === 'he' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} bg-white/5 border border-[#4ade80]/30 rounded-xl text-white placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors`}
                          dir="ltr"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-[#0d2920] font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#4ade80]/25 hover:shadow-[#4ade80]/50 hover:scale-[1.02] disabled:opacity-50"
                      >
                        {submitting ? t.sending : `🦎 ${t.notifyMe}`}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* VENUE FORM */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'venue' && (
                <div className="p-6 pt-12">
                  {/* Back button */}
                  <button
                    onClick={() => setActiveTab('map')}
                    className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-4 transition-colors"
                  >
                    <ChevronDown className={`h-4 w-4 ${lang === 'he' ? 'rotate-90' : '-rotate-90'}`} />
                    {t.backToMap}
                  </button>

                  <div className="text-center mb-6">
                    <Store className="h-12 w-12 text-[#4ade80] mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-1">{t.ownVenue}</h3>
                    <p className="text-white/60 text-sm">{t.joinPilot}</p>
                  </div>

                  {venueSubmitted ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                      <CheckCircle className="h-12 w-12 text-[#4ade80]" />
                      <span className="font-semibold text-lg text-white">{t.venueThankYou}</span>
                      <span className="text-white/50 text-sm">{t.venueThankYouSub}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleVenueSubmit} className="space-y-3">
                      {/* Venue Name */}
                      <div className="relative">
                        <Store className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'right-3' : 'left-3'} h-4 w-4 text-white/30`} />
                        <input
                          type="text"
                          value={venueForm.venueName}
                          onChange={(e) => setVenueForm({...venueForm, venueName: e.target.value})}
                          placeholder={t.venueName}
                          required
                          className={`w-full py-2.5 ${lang === 'he' ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} bg-white/5 border border-[#4ade80]/30 rounded-xl text-white text-sm placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors`}
                        />
                      </div>

                      {/* Venue Type */}
                      <div className="relative">
                        <Building2 className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'right-3' : 'left-3'} h-4 w-4 text-white/30`} />
                        <select
                          value={venueForm.venueType}
                          onChange={(e) => setVenueForm({...venueForm, venueType: e.target.value})}
                          required
                          className={`w-full py-2.5 ${lang === 'he' ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} bg-white/5 border border-[#4ade80]/30 rounded-xl text-white text-sm focus:border-[#4ade80] focus:outline-none transition-colors appearance-none cursor-pointer`}
                          style={{ backgroundColor: '#0a1f1a' }}
                        >
                          <option value="" disabled>{t.venueType}</option>
                          {venueTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'left-3' : 'right-3'} h-4 w-4 text-white/30 pointer-events-none`} />
                      </div>

                      {/* Contact Name */}
                      <div className="relative">
                        <User className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'right-3' : 'left-3'} h-4 w-4 text-white/30`} />
                        <input
                          type="text"
                          value={venueForm.contactName}
                          onChange={(e) => setVenueForm({...venueForm, contactName: e.target.value})}
                          placeholder={t.contactName}
                          required
                          className={`w-full py-2.5 ${lang === 'he' ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} bg-white/5 border border-[#4ade80]/30 rounded-xl text-white text-sm placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors`}
                        />
                      </div>

                      {/* Phone */}
                      <div className="relative">
                        <Phone className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'right-3' : 'left-3'} h-4 w-4 text-white/30`} />
                        <input
                          type="tel"
                          value={venueForm.phone}
                          onChange={(e) => setVenueForm({...venueForm, phone: e.target.value})}
                          placeholder={t.phone}
                          required
                          className={`w-full py-2.5 ${lang === 'he' ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} bg-white/5 border border-[#4ade80]/30 rounded-xl text-white text-sm placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors`}
                          dir="ltr"
                        />
                      </div>

                      {/* Email */}
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'right-3' : 'left-3'} h-4 w-4 text-white/30`} />
                        <input
                          type="email"
                          value={venueForm.email}
                          onChange={(e) => setVenueForm({...venueForm, email: e.target.value})}
                          placeholder={t.email}
                          required
                          className={`w-full py-2.5 ${lang === 'he' ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} bg-white/5 border border-[#4ade80]/30 rounded-xl text-white text-sm placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors`}
                          dir="ltr"
                        />
                      </div>

                      {/* City */}
                      <div className="relative">
                        <MapPin className={`absolute top-1/2 -translate-y-1/2 ${lang === 'he' ? 'right-3' : 'left-3'} h-4 w-4 text-white/30`} />
                        <input
                          type="text"
                          value={venueForm.city}
                          onChange={(e) => setVenueForm({...venueForm, city: e.target.value})}
                          placeholder={t.city}
                          required
                          className={`w-full py-2.5 ${lang === 'he' ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} bg-white/5 border border-[#4ade80]/30 rounded-xl text-white text-sm placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors`}
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={venueSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-[#0d2920] font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#4ade80]/25 hover:shadow-[#4ade80]/50 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {venueSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            {t.sending}
                          </span>
                        ) : (
                          <>
                            <span>🦎</span>
                            <span>{t.joinPilot}</span>
                          </>
                        )}
                      </button>

                      <p className="text-white/30 text-xs text-center">
                        {t.within24}
                      </p>
                    </form>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* FEEDBACK FORM - v2.8.6 */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'feedback' && (
                <div className="p-6 pt-12">
                  {/* Back button */}
                  <button
                    onClick={() => setActiveTab('map')}
                    className="flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-4 transition-colors"
                  >
                    <ChevronDown className={`h-4 w-4 ${lang === 'he' ? 'rotate-90' : '-rotate-90'}`} />
                    {t.backToMap}
                  </button>

                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">💬</div>
                    <h3 className="text-xl font-bold text-white mb-1">{t.feedbackTitle}</h3>
                    <p className="text-white/60 text-sm">{t.feedbackSubtitle}</p>
                  </div>

                  {feedbackSubmitted ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                      <CheckCircle className="h-12 w-12 text-[#4ade80]" />
                      <span className="font-semibold text-lg text-white">{t.feedbackThankYou}</span>
                      <span className="text-white/60 text-sm">{t.feedbackThankYouSub}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className={`block text-white/70 text-sm mb-1 ${lang === 'he' ? 'text-right' : 'text-left'}`}>
                          {t.feedbackName}
                        </label>
                        <input
                          type="text"
                          value={feedbackForm.name}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className={`w-full py-3 px-4 bg-white/5 border border-[#4ade80]/30 rounded-xl text-white placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors ${lang === 'he' ? 'text-right' : 'text-left'}`}
                          dir={lang === 'he' ? 'rtl' : 'ltr'}
                        />
                      </div>

                      {/* Feedback */}
                      <div>
                        <label className={`block text-white/70 text-sm mb-1 ${lang === 'he' ? 'text-right' : 'text-left'}`}>
                          {t.feedbackText}
                        </label>
                        <textarea
                          value={feedbackForm.feedback}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                          required
                          rows={4}
                          className={`w-full py-3 px-4 bg-white/5 border border-[#4ade80]/30 rounded-xl text-white placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors resize-none ${lang === 'he' ? 'text-right' : 'text-left'}`}
                          dir={lang === 'he' ? 'rtl' : 'ltr'}
                        />
                      </div>

                      {/* Contact (optional) */}
                      <div>
                        <label className={`block text-white/70 text-sm mb-1 ${lang === 'he' ? 'text-right' : 'text-left'}`}>
                          {t.feedbackContact}
                        </label>
                        <input
                          type="text"
                          value={feedbackForm.contact}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, contact: e.target.value }))}
                          className={`w-full py-3 px-4 bg-white/5 border border-[#4ade80]/30 rounded-xl text-white placeholder-white/40 focus:border-[#4ade80] focus:outline-none transition-colors ${lang === 'he' ? 'text-right' : 'text-left'}`}
                          dir={lang === 'he' ? 'rtl' : 'ltr'}
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={feedbackSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {feedbackSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            {t.sending}
                          </span>
                        ) : (
                          <>
                            <span>💬</span>
                            <span>{t.feedbackButton}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes glow {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 0.4;
            transform: scale(1.02);
          }
        }
        @keyframes pilotShimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
