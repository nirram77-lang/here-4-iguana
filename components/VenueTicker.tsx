'use client'

import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { MapPin, Zap, X } from 'lucide-react'
import IsraelMapHollywood from './israel-map-hollywood'

interface Venue {
  name: string
  nameHe: string
  icon: string
}

interface CityData {
  city: string
  cityHe: string
  icon: string
  zones: string[]
  zonesHe: string[]
  venues: Venue[]
}

// ✅ v2.8.19: Single Hot Zone
interface HotZoneItem {
  zoneName: string
  zoneNameHe: string
  city: string
  cityHe: string
  icon: string
  usersOnline: number
  schedule: string  // "חמישי-שבת 21:00-01:00"
}

// ✅ v2.8.19: Multiple Hot Zones from Firestore
interface HotZonesData {
  zones: HotZoneItem[]
  rotationSeconds: number  // How often to rotate (default 5)
}

// Pilot cities with their zones and venues - Full Israel Coverage!
const pilotCities: CityData[] = [
  {
    city: 'Tel Aviv',
    cityHe: 'תל אביב',
    icon: '🌆',
    zones: ['Rothschild', 'Florentin', 'Port', 'Dizengoff', 'Neve Tzedek'],
    zonesHe: ['רוטשילד', 'פלורנטין', 'הנמל', 'דיזנגוף', 'נווה צדק'],
    venues: [
      { name: 'The Block', nameHe: 'הבלוק', icon: '🎵' },
      { name: 'HaOman 17', nameHe: 'האומן 17', icon: '🔥' },
      { name: 'Clara Beach', nameHe: 'קלרה', icon: '🏖️' },
      { name: 'Kuli Alma', nameHe: 'קולי אלמא', icon: '🌙' },
      { name: 'Alphabet', nameHe: 'אלפבית', icon: '🅰️' },
    ]
  },
  {
    city: 'Central',
    cityHe: 'אזור המרכז',
    icon: '🏙️',
    zones: ['Rehovot', 'Rishon', 'Petah Tikva', 'Holon'],
    zonesHe: ['רחובות', 'ראשון לציון', 'פתח תקווה', 'חולון'],
    venues: [
      { name: 'Sheffield', nameHe: 'שפילד רחובות', icon: '🍺' },
      { name: 'Shpigel', nameHe: 'שפיגל', icon: '🍸' },
      { name: 'Cinema City', nameHe: 'סינמה סיטי', icon: '🎬' },
      { name: 'BIG Centers', nameHe: 'מתחמי ביג', icon: '🛍️' },
    ]
  },
  {
    city: 'Sharon',
    cityHe: 'השרון',
    icon: '🌊',
    zones: ['Netanya', 'Herzliya', 'Raanana', 'Kfar Saba'],
    zonesHe: ['נתניה', 'הרצליה', 'רעננה', 'כפר סבא'],
    venues: [
      { name: 'Herzliya Marina', nameHe: 'מרינה הרצליה', icon: '⛵' },
      { name: 'Netanya Beach', nameHe: 'חוף נתניה', icon: '🏖️' },
      { name: 'Arena Mall', nameHe: 'קניון ארנה', icon: '🛒' },
      { name: 'Poleg Beach', nameHe: 'חוף פולג', icon: '🌅' },
    ]
  },
  {
    city: 'Jerusalem',
    cityHe: 'ירושלים',
    icon: '✡️',
    zones: ['City Center', 'Mahane Yehuda', 'German Colony', 'Talpiot'],
    zonesHe: ['מרכז העיר', 'מחנה יהודה', 'מושבה גרמנית', 'תלפיות'],
    venues: [
      { name: 'Mahane Yehuda', nameHe: 'שוק מחנה יהודה', icon: '🍷' },
      { name: 'First Station', nameHe: 'התחנה הראשונה', icon: '🚂' },
      { name: 'Mamilla', nameHe: 'ממילא', icon: '🏛️' },
      { name: 'Beer Bazaar', nameHe: 'ביר בזאר', icon: '🍺' },
    ]
  },
  {
    city: 'South',
    cityHe: 'הדרום',
    icon: '🏜️',
    zones: ['Ashkelon', 'Beer Sheva', 'Eilat', 'Ashdod'],
    zonesHe: ['אשקלון', 'באר שבע', 'אילת', 'אשדוד'],
    venues: [
      { name: "Archie Bar", nameHe: 'ארצ׳י בר', icon: '🍺' },
      { name: "Jack's Place", nameHe: "ג'אק", icon: '🍸' },
      { name: 'Marina Ashkelon', nameHe: 'מרינה אשקלון', icon: '⚓' },
      { name: 'BGU Area', nameHe: 'אזור אוניברסיטה', icon: '🎓' },
    ]
  },
]

// ✅ v2.8.19: Default 3 hot zones (fallback)
const defaultHotZones: HotZonesData = {
  zones: [
    {
      zoneName: 'All Israel LIVE!',
      zoneNameHe: '🇮🇱 כל הארץ פתוחה!',
      city: 'Nationwide',
      cityHe: 'ארצי',
      icon: '🚀',
      usersOnline: 120,
      schedule: 'הורידו בחינם • התחילו עכשיו!'
    },
    {
      zoneName: 'Tel Aviv Nightlife',
      zoneNameHe: 'תל אביב • המרכז • השרון',
      city: 'Central Israel',
      cityHe: 'מרכז הארץ',
      icon: '🔥',
      usersOnline: 85,
      schedule: 'חמישי-שבת • כל אזורי הבילוי'
    },
    {
      zoneName: 'Venue Owners',
      zoneNameHe: 'בעלי מועדונים?',
      city: 'Join the Revolution',
      cityHe: 'הצטרפו למהפכה!',
      icon: '🏆',
      usersOnline: 50,
      schedule: 'מלאו טופס הצטרפות ← /join'
    }
  ],
  rotationSeconds: 5
}

// ═══════════════════════════════════════════════════════════════════════════
// ✅ v2.8.20: DYNAMIC USER COUNTS - Time-based realistic numbers!
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 🎬 Hollywood-level realistic user count generator!
 * Numbers change based on:
 * - Time of day (morning=low, evening=high, night=peak)
 * - Day of week (weekends are busier)
 * - Small random variations every few seconds
 * - Zone-specific multipliers
 */
const getDynamicUserCount = (baseCount: number, zoneIndex: number): number => {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay() // 0=Sunday, 4=Thursday, 5=Friday, 6=Saturday
  const minute = now.getMinutes()
  const second = now.getSeconds()
  
  // 🕐 Time-based multiplier (Israeli nightlife patterns)
  let timeMultiplier: number
  if (hour >= 6 && hour < 12) {
    // Morning (6am-12pm): Very quiet
    timeMultiplier = 0.1 + (hour - 6) * 0.05  // 0.1 → 0.4
  } else if (hour >= 12 && hour < 17) {
    // Afternoon (12pm-5pm): Starting to build
    timeMultiplier = 0.4 + (hour - 12) * 0.08  // 0.4 → 0.8
  } else if (hour >= 17 && hour < 20) {
    // Early evening (5pm-8pm): Building up
    timeMultiplier = 0.8 + (hour - 17) * 0.15  // 0.8 → 1.25
  } else if (hour >= 20 && hour < 23) {
    // Prime time (8pm-11pm): Peak hours! 🔥
    timeMultiplier = 1.25 + (hour - 20) * 0.25  // 1.25 → 2.0
  } else if (hour >= 23 || hour < 1) {
    // Late night (11pm-1am): Still hot!
    timeMultiplier = 1.8 + Math.random() * 0.4  // 1.8 → 2.2
  } else if (hour >= 1 && hour < 3) {
    // After midnight (1am-3am): Winding down
    timeMultiplier = 1.2 - (hour - 1) * 0.3  // 1.2 → 0.6
  } else {
    // Very late/early (3am-6am): Very quiet
    timeMultiplier = 0.1 + Math.random() * 0.1  // 0.1 → 0.2
  }
  
  // 📅 Day of week multiplier (Thu-Sat are peak!)
  let dayMultiplier = 1.0
  if (dayOfWeek === 4) dayMultiplier = 1.4  // Thursday night
  if (dayOfWeek === 5) dayMultiplier = 1.6  // Friday night - PEAK!
  if (dayOfWeek === 6) dayMultiplier = 1.5  // Saturday night
  if (dayOfWeek === 0) dayMultiplier = 0.8  // Sunday - quiet
  if (dayOfWeek >= 1 && dayOfWeek <= 3) dayMultiplier = 0.6  // Mon-Wed - quiet
  
  // 🎲 Small random variation (changes every 30 seconds)
  const variationSeed = Math.floor(second / 30) + minute + zoneIndex * 7
  const randomVariation = 0.85 + (Math.sin(variationSeed) * 0.5 + 0.5) * 0.3  // 0.85 → 1.15
  
  // 🏙️ Zone-specific variation (each zone is slightly different)
  const zoneVariation = 1 + (zoneIndex * 0.1) - 0.1  // -10% to +10%
  
  // 📊 Calculate final count
  const dynamicCount = Math.round(
    baseCount * timeMultiplier * dayMultiplier * randomVariation * zoneVariation
  )
  
  // 🔒 Clamp to reasonable range (minimum 8, maximum 150)
  return Math.max(8, Math.min(150, dynamicCount))
}

/**
 * 🔄 Get variation direction (+1, -1, or 0) for natural fluctuation
 * Makes numbers feel alive by adding small changes
 */
const getSmallVariation = (): number => {
  const rand = Math.random()
  if (rand < 0.3) return -1  // 30% chance decrease
  if (rand < 0.6) return 1   // 30% chance increase
  return 0                    // 40% chance stay same
}

// ═══════════════════════════════════════════════════════════════════════════
// ✅ v2.8.24: KILLER SLOGANS - Witty, fun, brainwashing!
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 🎯 Sharp, witty, fun slogans that sell real-time dating
 * Mix of: Pain points + Humor + FOMO + Call to action
 */
const getActivityMessage = (
  zoneIndex: number, 
  isHebrew: boolean, 
  zone: HotZoneItem
): string => {
  const now = new Date()
  const minute = now.getMinutes()
  const second = now.getSeconds()
  
  // Rotate every 6 seconds, different per zone
  const messageIndex = Math.floor((second + zoneIndex * 19 + minute * 11) / 6) % 20
  
  // 🔥 Hebrew - Killer slogans!
  const hebrewSlogans = [
    // Pain points - שנון
    'נמאס לסווייפ? צאי להכיר',
    'הסווייפ האחרון שלך',
    'דייטינג בלי סווייפים',
    'תעזבי את האפליקציות',
    
    // Real-time messaging
    'כאן ועכשיו',
    'Real Time Dating',
    'הוא במרחק 50 מטר',
    'מי עוד פה הערב?',
    
    // Witty & Fun - שנון ומשעשע
    'קשר עין לפני קשר וואטסאפ',
    'פחות אימוג׳י, יותר חיוכים',
    'הצ׳אט הכי קצר בהיסטוריה',
    'מהאפליקציה לבר ב-5 דקות',
    
    // FOMO & Action
    'הערב קורה פה',
    'למה לדבר? בואי',
    'החיים קצרים מסווייפים',
    'תני לזה לקרות',
    
    // Playful
    'הכימיה לא עוברת במסך',
    'פגישה > 1000 הודעות',
    'מחר תספרי לחברות',
    'הדייט הבא שלך כבר פה'
  ]
  
  // 🔥 English - Killer slogans!
  const englishSlogans = [
    // Pain points
    'Done swiping? Come meet',
    'Your last swipe ever',
    'Dating without swiping',
    'Ditch the apps',
    
    // Real-time messaging
    'Here and now',
    'Real Time Dating',
    'He\'s 50 meters away',
    'Who else is here tonight?',
    
    // Witty & Fun
    'Eye contact before WhatsApp',
    'Less emojis, more smiles',
    'Shortest chat in history',
    'App to bar in 5 minutes',
    
    // FOMO & Action
    'Tonight happens here',
    'Why text? Just come',
    'Life\'s too short to swipe',
    'Let it happen',
    
    // Playful
    'Chemistry doesn\'t stream',
    'One meetup > 1000 texts',
    'Tomorrow\'s story starts now',
    'Your next date is here'
  ]
  
  return isHebrew ? hebrewSlogans[messageIndex] : englishSlogans[messageIndex]
}

interface VenueTickerProps {
  lang?: 'he' | 'en' | 'pt'
}

export default function VenueTicker({ lang = 'he' }: VenueTickerProps) {
  const [currentCityIndex, setCurrentCityIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showVenues, setShowVenues] = useState(false)
  const [hotZones, setHotZones] = useState<HotZonesData>(defaultHotZones)
  const [currentHotZoneIndex, setCurrentHotZoneIndex] = useState(0)
  const [hotZonePulse, setHotZonePulse] = useState(false)
  const [hotZoneTransitioning, setHotZoneTransitioning] = useState(false)
  
  // ✅ v2.8.20: Dynamic user counts that update periodically
  const [dynamicCounts, setDynamicCounts] = useState<number[]>([])

  // ✅ v2.8.20: Initialize and update dynamic counts
  useEffect(() => {
    // Initialize counts
    const updateCounts = () => {
      const newCounts = hotZones.zones.map((zone, idx) => 
        getDynamicUserCount(zone.usersOnline, idx)
      )
      setDynamicCounts(newCounts)
    }
    
    // Initial update
    updateCounts()
    
    // Update every 10 seconds for natural feel
    const interval = setInterval(updateCounts, 10000)
    
    return () => clearInterval(interval)
  }, [hotZones])
  
  // ✅ v2.8.20: Add small variations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDynamicCounts(prev => prev.map((count, idx) => {
        const variation = getSmallVariation()
        const newCount = count + variation
        // Keep within reasonable bounds
        const minCount = Math.max(3, Math.floor(hotZones.zones[idx]?.usersOnline * 0.3) || 3)
        const maxCount = Math.ceil((hotZones.zones[idx]?.usersOnline || 20) * 3)
        return Math.max(minCount, Math.min(maxCount, newCount))
      }))
      // Trigger pulse animation on change
      setHotZonePulse(true)
      setTimeout(() => setHotZonePulse(false), 200)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [hotZones])

  // ✅ v2.8.19: Listen to hot zones from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'hotZones'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as HotZonesData
          if (data.zones && data.zones.length > 0) {
            setHotZones(data)
            console.log('🔥 Hot zones updated:', data.zones.length, 'zones')
          }
        }
      },
      (error) => {
        console.log('📍 Using default hot zones (no Firestore doc)')
      }
    )
    
    return () => unsubscribe()
  }, [])

  // ✅ v2.8.19: Rotate hot zones with smooth Hollywood animation
  useEffect(() => {
    if (hotZones.zones.length <= 1) return
    
    const interval = setInterval(() => {
      // Phase 1: Fade out + slide
      setHotZoneTransitioning(true)
      
      // Phase 2: Change content after fade out completes
      setTimeout(() => {
        setCurrentHotZoneIndex((prev) => (prev + 1) % hotZones.zones.length)
      }, 400)
      
      // Phase 3: Fade in with new content
      setTimeout(() => {
        setHotZoneTransitioning(false)
      }, 500)
    }, (hotZones.rotationSeconds || 5) * 1000)
    
    return () => clearInterval(interval)
  }, [hotZones])

  // ✅ Pulse animation for hot zone users count
  useEffect(() => {
    const interval = setInterval(() => {
      setHotZonePulse(true)
      setTimeout(() => setHotZonePulse(false), 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Show venues after city appears
    const venueTimer = setTimeout(() => {
      setShowVenues(true)
    }, 500)

    // Cycle to next city
    const cityTimer = setInterval(() => {
      setIsTransitioning(true)
      setShowVenues(false)
      
      setTimeout(() => {
        setCurrentCityIndex((prev) => (prev + 1) % pilotCities.length)
        setIsTransitioning(false)
        
        // Show venues for new city
        setTimeout(() => setShowVenues(true), 500)
      }, 400)
    }, 5000)

    return () => {
      clearTimeout(venueTimer)
      clearInterval(cityTimer)
    }
  }, [currentCityIndex])

  const currentCity = pilotCities[currentCityIndex]
  const currentHotZone = hotZones.zones[currentHotZoneIndex] || hotZones.zones[0]
  const isHebrew = lang === 'he'

  return (
    <div className="hidden lg:block space-y-3">
      
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* 🔥 HOT ZONES - 3 Rotating Zones - Hollywood Style */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-orange-900/40 via-red-900/30 to-orange-900/40 backdrop-blur-md border-2 border-orange-500/50 rounded-xl overflow-hidden shadow-xl shadow-orange-500/20">
        
        {/* Fire Glow Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-16 bg-orange-500/30 blur-2xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-shimmer" />
        </div>
        
        {/* Header - HOT NOW */}
        <div className="relative bg-gradient-to-r from-orange-600/40 via-red-500/50 to-orange-600/40 px-4 py-2 border-b border-orange-500/30">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl ">🔥</span>
            <span className="text-orange-300 text-sm font-black tracking-wider uppercase">
              {isHebrew ? 'אזורים חמים!' : 'HOT ZONES!'}
            </span>
            <span className="text-xl " style={{ animationDelay: '0.1s' }}>🔥</span>
          </div>
        </div>
        
        {/* Content - Rotating Zone with Hollywood Smooth Animation */}
        <div className="relative px-4 py-3 min-h-[140px] overflow-hidden">
          <div 
            className={`
              transition-all duration-500 ease-out
              ${hotZoneTransitioning 
                ? 'opacity-0 transform translate-y-4 scale-95 blur-sm' 
                : 'opacity-100 transform translate-y-0 scale-100 blur-0'
              }
            `}
          >
            {/* Zone Name - Big & Bold */}
            <div className="text-center mb-2">
              <div className="flex items-center justify-center gap-2">
                <span className={`text-3xl transition-transform duration-700 ${hotZoneTransitioning ? 'rotate-12' : 'rotate-0'}`}>
                  {currentHotZone.icon}
                </span>
                <span className="text-white font-black text-2xl drop-shadow-lg">
                  {isHebrew ? currentHotZone.zoneNameHe : currentHotZone.zoneName}
                </span>
              </div>
              <p className="text-orange-300/80 text-xs mt-0.5">
                {isHebrew ? currentHotZone.cityHe : currentHotZone.city}
              </p>
            </div>
            
            {/* Emotional Teaser - Eye-catching! */}
            <div className={`
              flex items-center justify-center mb-2
              transition-all duration-500 delay-100 ease-out
              ${hotZoneTransitioning 
                ? 'opacity-0 transform translate-y-2' 
                : 'opacity-100 transform translate-y-0'
              }
            `}>
              <div className="text-center">
                <span className="text-white font-medium text-base italic">
                  "{getActivityMessage(currentHotZoneIndex, isHebrew, currentHotZone)}"
                </span>
              </div>
            </div>
            
            {/* Schedule - with delay animation */}
            <div className={`
              flex items-center justify-center gap-2 text-orange-300/70 text-xs
              transition-all duration-500 delay-150 ease-out
              ${hotZoneTransitioning 
                ? 'opacity-0 transform translate-y-1' 
                : 'opacity-100 transform translate-y-0'
              }
            `}>
              <span>📅</span>
              <span>{currentHotZone.schedule}</span>
            </div>
          </div>
          
          {/* Progress Dots for Zones - Always visible, smooth transition */}
          <div className="flex justify-center gap-1.5 mt-3">
            {hotZones.zones.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  idx === currentHotZoneIndex 
                    ? 'w-5 bg-gradient-to-r from-orange-400 to-red-400 shadow-lg shadow-orange-500/50' 
                    : 'w-1.5 bg-orange-500/30 hover:bg-orange-500/50'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="px-4 pb-3">
          <a 
            href="/app"
            className="block w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold text-sm text-center rounded-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-orange-500/50"
          >
            {isHebrew ? '🦎 היכנס עכשיו!' : '🦎 Join Now!'}
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* 🗺️ Interactive Israel Map - HOLLYWOOD EDITION */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <IsraelMapHollywood lang={lang} />
    </div>
  )
}
