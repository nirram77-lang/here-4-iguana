'use client'

/**
 * 🦎 I4IGUANA - Israel Venues Map - HOLLYWOOD EDITION! 🎬
 * 
 * Features:
 * - Large glowing nodes with intense halos
 * - Connection lines between cities
 * - City names on map
 * - Central hub (Tel Aviv) with mega glow
 * - Phone frame design
 * - Stats counter at bottom
 * - Premium animations
 * 
 * v3.0.0 - HOLLYWOOD LEVEL!
 */

import { useState, useEffect, useRef } from 'react'
import { MapPin, Zap, X, Users, Sparkles } from 'lucide-react'

interface VenueZone {
  name: string
  icon: string
  hot?: boolean
}

interface CityData {
  id: string
  name: string
  nameEn: string
  x: number
  y: number
  zones: VenueZone[]
  isHub?: boolean  // Main hub cities get extra glow
  connections?: string[]  // IDs of connected cities
}

// All 33 cities with positions and connections
const citiesData: CityData[] = [
  // === Main Hubs (Extra Glow) ===
  { id: 'tel-aviv', name: 'תל אביב', nameEn: 'Tel Aviv', x: 22, y: 42, isHub: true, 
    connections: ['ramat-gan', 'herzliya', 'holon', 'bat-yam', 'rishon', 'netanya'],
    zones: [
      { name: 'רוטשילד', icon: '🍷', hot: true },
      { name: 'פלורנטין', icon: '🎵', hot: true },
      { name: 'הנמל', icon: '⚓' },
      { name: 'דיזנגוף', icon: '🛍️' },
      { name: 'נווה צדק', icon: '🏛️' },
    ]},
  { id: 'jerusalem', name: 'ירושלים', nameEn: 'Jerusalem', x: 52, y: 52, isHub: true,
    connections: ['modiin', 'beit-shemesh'],
    zones: [
      { name: 'מחנה יהודה', icon: '🍷', hot: true },
      { name: 'מושבה גרמנית', icon: '🏛️' },
      { name: 'תלפיות', icon: '🛍️' },
      { name: 'ממילא', icon: '✨' },
    ]},
  { id: 'haifa', name: 'חיפה', nameEn: 'Haifa', x: 24, y: 22, isHub: true,
    connections: ['acre', 'nazareth', 'zichron'],
    zones: [
      { name: 'הכרמל', icon: '🌲' },
      { name: 'חוף הים', icon: '🏖️', hot: true },
      { name: 'מושבה גרמנית', icon: '🏛️' },
    ]},
  { id: 'beer-sheva', name: 'באר שבע', nameEn: 'Beer Sheva', x: 40, y: 72, isHub: true,
    connections: ['ashkelon', 'dimona'],
    zones: [
      { name: 'העיר העתיקה', icon: '🏛️', hot: true },
      { name: 'מתחם הבילוי', icon: '🎉' },
    ]},
    
  // === Center ===
  { id: 'ramat-gan', name: 'רמת גן', nameEn: 'Ramat Gan', x: 28, y: 42, connections: ['tel-aviv', 'petah-tikva'], zones: [
    { name: 'הבורסה', icon: '🏢' }, { name: 'מתחם הסיטי', icon: '🛍️' },
  ]},
  { id: 'givatayim', name: 'גבעתיים', nameEn: 'Givatayim', x: 26, y: 44, connections: ['tel-aviv'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'holon', name: 'חולון', nameEn: 'Holon', x: 23, y: 47, connections: ['tel-aviv', 'bat-yam'], zones: [
    { name: 'מתחם עזריאלי', icon: '🛍️' },
  ]},
  { id: 'bat-yam', name: 'בת ים', nameEn: 'Bat Yam', x: 20, y: 48, connections: ['tel-aviv', 'holon'], zones: [
    { name: 'הטיילת', icon: '🌊' },
  ]},
  { id: 'petah-tikva', name: 'פתח תקווה', nameEn: 'Petah Tikva', x: 34, y: 38, connections: ['ramat-gan', 'kfar-saba'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' }, { name: 'סגולה', icon: '🍺' },
  ]},
  { id: 'rishon', name: 'ראשון לציון', nameEn: 'Rishon LeZion', x: 22, y: 50, connections: ['tel-aviv', 'rehovot'], zones: [
    { name: 'הרצל', icon: '🛍️' }, { name: 'מתחם הבילוי', icon: '🎉', hot: true },
  ]},
  { id: 'rehovot', name: 'רחובות', nameEn: 'Rehovot', x: 27, y: 54, connections: ['rishon', 'nes-ziona'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'nes-ziona', name: 'נס ציונה', nameEn: 'Nes Ziona', x: 25, y: 52, connections: ['rehovot'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'raanana', name: 'רעננה', nameEn: 'Raanana', x: 26, y: 34, connections: ['herzliya', 'kfar-saba'], zones: [
    { name: 'אחוזה', icon: '🌳' },
  ]},
  { id: 'netanya', name: 'נתניה', nameEn: 'Netanya', x: 20, y: 30, connections: ['tel-aviv', 'herzliya'], zones: [
    { name: 'הטיילת', icon: '🏖️', hot: true }, { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'herzliya', name: 'הרצליה', nameEn: 'Herzliya', x: 21, y: 38, connections: ['tel-aviv', 'raanana', 'netanya'], zones: [
    { name: 'מרינה', icon: '⛵', hot: true }, { name: 'הרצליה פיתוח', icon: '🏢' },
  ]},
  { id: 'kfar-saba', name: 'כפר סבא', nameEn: 'Kfar Saba', x: 30, y: 32, connections: ['raanana', 'petah-tikva'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'modiin', name: 'מודיעין', nameEn: 'Modiin', x: 40, y: 50, connections: ['jerusalem'], zones: [
    { name: 'עזריאלי מודיעין', icon: '🛍️' },
  ]},
  
  // === North ===
  { id: 'nahariya', name: 'נהריה', nameEn: 'Nahariya', x: 22, y: 8, connections: ['acre'], zones: [
    { name: 'הטיילת', icon: '🌊' },
  ]},
  { id: 'acre', name: 'עכו', nameEn: 'Acre', x: 24, y: 14, connections: ['haifa', 'nahariya'], zones: [
    { name: 'העיר העתיקה', icon: '🏰' }, { name: 'הנמל', icon: '⚓' },
  ]},
  { id: 'tiberias', name: 'טבריה', nameEn: 'Tiberias', x: 52, y: 18, connections: ['nazareth', 'safed'], zones: [
    { name: 'טיילת הכינרת', icon: '🌊', hot: true },
  ]},
  { id: 'nazareth', name: 'נצרת', nameEn: 'Nazareth', x: 40, y: 20, connections: ['haifa', 'tiberias', 'afula'], zones: [
    { name: 'העיר העתיקה', icon: '⛪' },
  ]},
  { id: 'karmiel', name: 'כרמיאל', nameEn: 'Karmiel', x: 34, y: 14, connections: ['acre', 'safed'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'safed', name: 'צפת', nameEn: 'Safed', x: 46, y: 10, connections: ['tiberias', 'karmiel', 'kiryat-shmona'], zones: [
    { name: 'העיר העתיקה', icon: '✡️' },
  ]},
  { id: 'kiryat-shmona', name: 'ק.שמונה', nameEn: 'K.Shmona', x: 50, y: 4, connections: ['safed'], zones: [
    { name: 'מרכז העיר', icon: '🏔️' },
  ]},
  { id: 'afula', name: 'עפולה', nameEn: 'Afula', x: 40, y: 26, connections: ['nazareth', 'tel-adashim'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'zichron', name: 'זכרון יעקב', nameEn: 'Zichron', x: 24, y: 26, connections: ['haifa', 'netanya'], zones: [
    { name: 'המייסדים', icon: '🍷', hot: true },
  ]},
  
  // === South ===
  { id: 'ashkelon', name: 'אשקלון', nameEn: 'Ashkelon', x: 16, y: 62, connections: ['ashdod', 'beer-sheva', 'kiryat-gat'], zones: [
    { name: 'המרינה', icon: '⛵', hot: true },
    { name: 'ברנע', icon: '🏖️' },
    { name: 'אזור האוניברסיטה', icon: '📚' },
  ]},
  { id: 'ashdod', name: 'אשדוד', nameEn: 'Ashdod', x: 17, y: 56, connections: ['ashkelon', 'rehovot'], zones: [
    { name: 'מרינה', icon: '⛵' }, { name: 'סיטי', icon: '🛍️' },
  ]},
  { id: 'eilat', name: 'אילת', nameEn: 'Eilat', x: 52, y: 96, isHub: true, connections: [], zones: [
    { name: 'הטיילת', icon: '🏖️', hot: true },
    { name: 'שדרות התמרים', icon: '🌴' },
    { name: 'מלונות', icon: '🏨' },
  ]},
  { id: 'dimona', name: 'דימונה', nameEn: 'Dimona', x: 48, y: 78, connections: ['beer-sheva'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'kiryat-gat', name: 'קריית גת', nameEn: 'Kiryat Gat', x: 28, y: 62, connections: ['ashkelon', 'beer-sheva'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  
  // === Jerusalem Area ===
  { id: 'beit-shemesh', name: 'בית שמש', nameEn: 'Beit Shemesh', x: 38, y: 58, connections: ['jerusalem'], zones: [
    { name: 'מרכז העיר', icon: '🏙️' },
  ]},
  { id: 'tel-adashim', name: 'תל עדשים', nameEn: 'Tel Adashim', x: 42, y: 28, connections: ['afula'], zones: [
    { name: 'מרכז הישוב', icon: '🌾' },
  ]},
]

interface Props {
  lang?: 'he' | 'en' | 'pt'
}

export default function IsraelMapHollywood({ lang = 'he' }: Props) {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null)
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [animatedCount, setAnimatedCount] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  
  const isHebrew = lang === 'he'
  const totalUsers = 4785  // Animated counter target
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Set count immediately - no animation to prevent shake
  useEffect(() => {
    setAnimatedCount(totalUsers)
  }, [])
  
  // Close tooltip on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (mapRef.current && !mapRef.current.contains(e.target as Node)) {
        setSelectedCity(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
  
  const activeCity = isMobile ? selectedCity : hoveredCity
  
  const handleCityInteraction = (city: CityData, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMobile) {
      setSelectedCity(selectedCity?.id === city.id ? null : city)
    }
  }
  
  // Get city by ID for connection lines
  const getCityById = (id: string) => citiesData.find(c => c.id === id)
  
  // Calculate totals
  const totalCities = citiesData.length
  const totalZones = citiesData.reduce((acc, city) => acc + city.zones.length, 0)

  return (
    <div 
      ref={mapRef}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a1a14 0%, #051510 50%, #030d0a 100%)',
        border: '1px solid rgba(74, 222, 128, 0.3)',
        boxShadow: '0 0 60px rgba(74, 222, 128, 0.1), inset 0 0 60px rgba(0,0,0,0.5)',
      }}
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      {/* Header - Green Gradient */}
      <div 
        className="relative px-4 py-3 overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.2) 0%, rgba(74, 222, 128, 0.3) 50%, rgba(34, 197, 94, 0.2) 100%)',
          borderBottom: '1px solid rgba(74, 222, 128, 0.3)',
        }}
      >
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            animation: 'shimmer 3s infinite',
          }}
        />
        
        <div className="relative flex items-center justify-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 " />
          </div>
          <span className="text-green-400 font-bold text-sm tracking-wide">
            {isHebrew ? 'הקהילה שלנו במפה' : 'Our Community Map'}
          </span>
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 " style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div 
        className="relative mx-auto"
        style={{
          width: '100%',
          maxWidth: '320px',
          aspectRatio: '0.5',
          padding: '16px',
        }}
      >
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Tel Aviv mega glow */}
          <div 
            className="absolute rounded-full"
            style={{
              left: '22%',
              top: '42%',
              width: '120px',
              height: '120px',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.1) 40%, transparent 70%)',
              filter: 'blur(20px)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
          {/* Jerusalem glow */}
          <div 
            className="absolute rounded-full"
            style={{
              left: '52%',
              top: '52%',
              width: '80px',
              height: '80px',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
              filter: 'blur(15px)',
              animation: 'pulse 3s ease-in-out infinite 0.5s',
            }}
          />
          {/* Haifa glow */}
          <div 
            className="absolute rounded-full"
            style={{
              left: '24%',
              top: '22%',
              width: '60px',
              height: '60px',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
              filter: 'blur(12px)',
              animation: 'pulse 3s ease-in-out infinite 1s',
            }}
          />
        </div>

        {/* SVG for connection lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ padding: '16px' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.1)" />
              <stop offset="50%" stopColor="rgba(251, 191, 36, 0.4)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.1)" />
            </linearGradient>
          </defs>
          
          {/* Connection lines */}
          {citiesData.map(city => 
            city.connections?.map(connId => {
              const connCity = getCityById(connId)
              if (!connCity) return null
              // Only draw line once (from lower to higher ID)
              if (city.id > connId) return null
              
              return (
                <line
                  key={`${city.id}-${connId}`}
                  x1={`${city.x}%`}
                  y1={`${city.y}%`}
                  x2={`${connCity.x}%`}
                  y2={`${connCity.y}%`}
                  stroke="url(#lineGradient)"
                  strokeWidth="1"
                  opacity="0.6"
                />
              )
            })
          )}
        </svg>

        {/* City nodes */}
        {citiesData.map((city, index) => {
          const isHub = city.isHub
          const hasHotZone = city.zones.some(z => z.hot)
          const isActive = activeCity?.id === city.id
          const nodeSize = isHub ? 16 : hasHotZone ? 10 : 6
          const glowSize = isHub ? 40 : hasHotZone ? 24 : 16
          
          return (
            <div
              key={city.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ 
                left: `${city.x}%`, 
                top: `${city.y}%`,
                zIndex: isActive ? 50 : isHub ? 30 : 20,
              }}
              onClick={(e) => handleCityInteraction(city, e)}
              onMouseEnter={() => !isMobile && setHoveredCity(city)}
              onMouseLeave={() => !isMobile && setHoveredCity(null)}
            >
              {/* Outer glow ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: glowSize,
                  height: glowSize,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: isHub 
                    ? 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(251, 191, 36, 0.2) 50%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(249, 115, 22, 0.5) 0%, rgba(249, 115, 22, 0.1) 50%, transparent 70%)',
                  animation: 'pulse 2s ease-in-out infinite',
                  animationDelay: `${index * 0.1}s`,
                }}
              />
              
              {/* Pulse ring animation */}
              <div
                className="absolute rounded-full"
                style={{
                  width: glowSize * 1.5,
                  height: glowSize * 1.5,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: `1px solid ${isHub ? 'rgba(251, 191, 36, 0.4)' : 'rgba(249, 115, 22, 0.3)'}`,
                  animation: 'ripple 3s ease-out infinite',
                  animationDelay: `${index * 0.15}s`,
                }}
              />
              
              {/* Core node */}
              <div
                className={`relative rounded-full transition-transform duration-200 ${isActive ? 'scale-150' : 'group-hover:scale-125'}`}
                style={{
                  width: nodeSize,
                  height: nodeSize,
                  background: isHub
                    ? 'radial-gradient(circle at 30% 30%, #fef08a 0%, #fbbf24 50%, #f59e0b 100%)'
                    : hasHotZone
                      ? 'radial-gradient(circle at 30% 30%, #fdba74 0%, #f97316 50%, #ea580c 100%)'
                      : 'radial-gradient(circle at 30% 30%, #fed7aa 0%, #fb923c 50%, #f97316 100%)',
                  boxShadow: isHub
                    ? '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2)'
                    : hasHotZone
                      ? '0 0 15px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.4)'
                      : '0 0 10px rgba(249, 115, 22, 0.6)',
                }}
              />
              
              {/* City name label (only for hubs and on hover) */}
              {(isHub || isActive) && (
                <div
                  className="absolute whitespace-nowrap text-[9px] font-bold pointer-events-none"
                  style={{
                    top: nodeSize / 2 + 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: isHub ? '#fbbf24' : '#fb923c',
                    textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
                  }}
                >
                  {isHebrew ? city.name : city.nameEn}
                </div>
              )}
            </div>
          )
        })}

        {/* City Tooltip */}
        {activeCity && (
          <div
            className="absolute z-[100]"
            style={{
              left: `${Math.min(Math.max(activeCity.x, 30), 70)}%`,
              // For cities at bottom (y > 55%), show tooltip ABOVE the city
              top: activeCity.y > 55 
                ? `${activeCity.y - 5}%` 
                : `${Math.min(activeCity.y + 10, 80)}%`,
              transform: activeCity.y > 55 
                ? 'translate(-50%, -100%)' 
                : 'translateX(-50%)',
            }}
            onMouseEnter={() => !isMobile && setHoveredCity(activeCity)}
            onMouseLeave={() => !isMobile && setHoveredCity(null)}
          >
            <div 
              className="relative rounded-xl overflow-hidden min-w-[180px]"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 40, 32, 0.98) 0%, rgba(10, 25, 18, 0.98) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(251, 191, 36, 0.2)',
                animation: 'tooltipIn 0.2s ease-out',
              }}
            >
              {/* Arrow - flip for bottom cities */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${
                  activeCity.y > 55 ? '-bottom-[6px]' : '-top-[6px]'
                }`}
                style={{
                  background: 'rgba(20, 40, 32, 0.98)',
                  borderLeft: activeCity.y > 55 ? 'none' : '1px solid rgba(251, 191, 36, 0.5)',
                  borderTop: activeCity.y > 55 ? 'none' : '1px solid rgba(251, 191, 36, 0.5)',
                  borderRight: activeCity.y > 55 ? '1px solid rgba(251, 191, 36, 0.5)' : 'none',
                  borderBottom: activeCity.y > 55 ? '1px solid rgba(251, 191, 36, 0.5)' : 'none',
                }}
              />
              
              {/* Close for mobile */}
              {isMobile && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCity(null); }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white/60" />
                </button>
              )}
              
              {/* Header */}
              <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">
                  {isHebrew ? activeCity.name : activeCity.nameEn}
                </span>
                {activeCity.isHub && (
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                )}
              </div>
              
              {/* Zones */}
              <div className="p-2 space-y-1 max-h-36 overflow-y-auto">
                <p className="text-[9px] text-white/40 px-1">{isHebrew ? 'אזורי בילוי:' : 'Entertainment zones:'}</p>
                {activeCity.zones.map((zone, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                      zone.hot 
                        ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/10 border border-yellow-500/30' 
                        : 'bg-white/5'
                    }`}
                  >
                    <span>{zone.icon}</span>
                    <span className={zone.hot ? 'text-yellow-300' : 'text-white/80'}>{zone.name}</span>
                    {zone.hot && <Zap className="w-3 h-3 text-yellow-400 mr-auto" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div 
        className="px-4 py-3 border-t"
        style={{
          background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.15) 50%, rgba(34, 197, 94, 0.1) 100%)',
          borderColor: 'rgba(74, 222, 128, 0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-bold text-lg">{animatedCount.toLocaleString()}+</span>
            <span className="text-white/50 text-xs">{isHebrew ? 'משתמשים רשומים' : 'registered users'}</span>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-green-300">
              <span className="font-bold">{totalCities}</span> {isHebrew ? 'ערים' : 'cities'}
            </span>
            <span className="text-green-300">
              <span className="font-bold">{totalZones}</span> {isHebrew ? 'אזורים' : 'zones'}
            </span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes ripple {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
