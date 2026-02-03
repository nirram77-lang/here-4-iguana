"use client"

/**
 * 🦎 I4IGUANA - Dummy Users Admin Panel
 * 
 * v2.8.28: Complete overhaul - One button per CITY!
 * Initializes ALL zones in the city at once.
 * 
 * Access via: /admin/dummies
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initializeDummiesForZone } from '@/lib/dummy-users-service'
import { ArrowLeft, Sparkles, Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// CITY DEFINITIONS - All 32 cities with their zones
// ═══════════════════════════════════════════════════════════════════════════

interface CityConfig {
  id: string
  name: string
  nameHe: string
  emoji: string
  zones: string[]
  color: string
}

const CITIES: CityConfig[] = [
  // 🏖️ SOUTH
  {
    id: 'ashkelon',
    name: 'Ashkelon',
    nameHe: 'אשקלון',
    emoji: '🏖️',
    zones: ['ashkelon-marina', 'ashkelon-delila', 'ashkelon-barnea', 'ashkelon-city-center', 'ashkelon-hanasi', 'nir-home'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'ashdod',
    name: 'Ashdod',
    nameHe: 'אשדוד',
    emoji: '🌊',
    zones: ['ashdod-city', 'ashdod-marina', 'ashdod-rova-vav'],
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'beer-sheva',
    name: 'Beer Sheva',
    nameHe: 'באר שבע',
    emoji: '🏜️',
    zones: ['bsheva-old-city', 'bsheva-big', 'bsheva-rager'],
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'eilat',
    name: 'Eilat',
    nameHe: 'אילת',
    emoji: '🏝️',
    zones: ['eilat-promenade', 'eilat-hotel-strip', 'eilat-north-beach'],
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'kiryat-gat',
    name: 'Kiryat Gat',
    nameHe: 'קריית גת',
    emoji: '🏭',
    zones: ['kiryat-gat-center'],
    color: 'from-gray-500 to-slate-500'
  },
  {
    id: 'dimona',
    name: 'Dimona',
    nameHe: 'דימונה',
    emoji: '☢️',
    zones: ['dimona-center'],
    color: 'from-yellow-500 to-lime-500'
  },
  {
    id: 'rehovot',
    name: 'Rehovot',
    nameHe: 'רחובות',
    emoji: '🔬',
    zones: ['rehovot-science-park', 'rehovot-herzl'],
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'nes-ziona',
    name: 'Nes Ziona',
    nameHe: 'נס ציונה',
    emoji: '🌳',
    zones: ['nes-ziona-center'],
    color: 'from-green-500 to-emerald-500'
  },
  
  // 🏙️ CENTER
  {
    id: 'tel-aviv',
    name: 'Tel Aviv',
    nameHe: 'תל אביב',
    emoji: '🌴',
    zones: ['tlv-florentin', 'tlv-rothschild', 'tlv-port', 'tlv-dizengoff', 'tlv-neve-tzedek', 'tlv-carmel-market', 'tlv-arbaa', 'tlv-station', 'tlv-allenby'],
    color: 'from-[#4ade80] to-[#22c55e]'
  },
  {
    id: 'ramat-gan',
    name: 'Ramat Gan',
    nameHe: 'רמת גן',
    emoji: '💎',
    zones: ['rg-bursa', 'rg-ayalon', 'rg-city-center'],
    color: 'from-purple-500 to-violet-500'
  },
  {
    id: 'givatayim',
    name: 'Givatayim',
    nameHe: 'גבעתיים',
    emoji: '🏡',
    zones: ['givatayim-center'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'herzliya',
    name: 'Herzliya',
    nameHe: 'הרצליה',
    emoji: '💻',
    zones: ['herzliya-pituach', 'herzliya-marina', 'herzliya-arena'],
    color: 'from-sky-500 to-blue-500'
  },
  {
    id: 'netanya',
    name: 'Netanya',
    nameHe: 'נתניה',
    emoji: '🌊',
    zones: ['netanya-promenade', 'netanya-city-center', 'netanya-poleg'],
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'raanana',
    name: 'Raanana',
    nameHe: 'רעננה',
    emoji: '🌳',
    zones: ['raanana-ahuza', 'raanana-park'],
    color: 'from-emerald-500 to-green-500'
  },
  {
    id: 'kfar-saba',
    name: 'Kfar Saba',
    nameHe: 'כפר סבא',
    emoji: '🏘️',
    zones: ['kfar-saba-weizmann', 'kfar-saba-center'],
    color: 'from-lime-500 to-green-500'
  },
  {
    id: 'petah-tikva',
    name: 'Petah Tikva',
    nameHe: 'פתח תקווה',
    emoji: '🏙️',
    zones: ['pt-rothschild', 'pt-em-hamoshavot', 'pt-big', 'pt-hashaham'],
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'rishon-lezion',
    name: 'Rishon LeZion',
    nameHe: 'ראשון לציון',
    emoji: '🌆',
    zones: ['rishon-rothschild', 'rishon-rishonim', 'rishon-west'],
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'holon',
    name: 'Holon',
    nameHe: 'חולון',
    emoji: '🎭',
    zones: ['holon-sokolov', 'holon-center'],
    color: 'from-fuchsia-500 to-pink-500'
  },
  {
    id: 'bat-yam',
    name: 'Bat Yam',
    nameHe: 'בת ים',
    emoji: '🏖️',
    zones: ['bat-yam-beach', 'bat-yam-center'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'modiin',
    name: 'Modiin',
    nameHe: 'מודיעין',
    emoji: '🏙️',
    zones: ['modiin-azrieli', 'modiin-ligad'],
    color: 'from-slate-500 to-gray-500'
  },
  
  // 🏛️ JERUSALEM
  {
    id: 'jerusalem',
    name: 'Jerusalem',
    nameHe: 'ירושלים',
    emoji: '🏛️',
    zones: ['jlm-mahane-yehuda', 'jlm-german-colony', 'jlm-first-station', 'jlm-nahalat-shiva', 'jlm-talbiya', 'jlm-emek-refaim'],
    color: 'from-yellow-500 to-amber-500'
  },
  {
    id: 'beit-shemesh',
    name: 'Beit Shemesh',
    nameHe: 'בית שמש',
    emoji: '☀️',
    zones: ['beit-shemesh-center'],
    color: 'from-orange-500 to-yellow-500'
  },
  
  // ⛰️ HAIFA & NORTH
  {
    id: 'haifa',
    name: 'Haifa',
    nameHe: 'חיפה',
    emoji: '⛰️',
    zones: ['haifa-downtown', 'haifa-carmel', 'haifa-german-colony', 'haifa-masada', 'haifa-bat-galim'],
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'zichron-yaakov',
    name: 'Zichron Yaakov',
    nameHe: 'זיכרון יעקב',
    emoji: '🍷',
    zones: ['zichron-midrahov', 'zichron-wineries'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'nahariya',
    name: 'Nahariya',
    nameHe: 'נהריה',
    emoji: '🌊',
    zones: ['nahariya-gaaton', 'nahariya-beach'],
    color: 'from-blue-400 to-sky-500'
  },
  {
    id: 'acre',
    name: 'Acre',
    nameHe: 'עכו',
    emoji: '🏰',
    zones: ['acre-old-city', 'acre-beach'],
    color: 'from-amber-600 to-yellow-500'
  },
  {
    id: 'kiryat-shmona',
    name: 'Kiryat Shmona',
    nameHe: 'קריית שמונה',
    emoji: '🏔️',
    zones: ['kiryat-shmona-center'],
    color: 'from-green-600 to-emerald-500'
  },
  {
    id: 'tiberias',
    name: 'Tiberias',
    nameHe: 'טבריה',
    emoji: '🌅',
    zones: ['tiberias-promenade', 'tiberias-center'],
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'safed',
    name: 'Safed',
    nameHe: 'צפת',
    emoji: '✨',
    zones: ['safed-old-city', 'safed-artists'],
    color: 'from-indigo-500 to-blue-500'
  },
  {
    id: 'karmiel',
    name: 'Karmiel',
    nameHe: 'כרמיאל',
    emoji: '🌸',
    zones: ['karmiel-center'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'nazareth',
    name: 'Nazareth',
    nameHe: 'נצרת',
    emoji: '⛪',
    zones: ['nazareth-old-city', 'nazareth-center'],
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'afula',
    name: 'Afula',
    nameHe: 'עפולה',
    emoji: '🌾',
    zones: ['afula-center', 'afula-yula-bar'],
    color: 'from-lime-500 to-yellow-500'
  },
  {
    id: 'tel-adashim',
    name: 'Tel Adashim',
    nameHe: 'תל עדשים',
    emoji: '💚',
    zones: ['tel-adashim-kachol-yarok'],
    color: 'from-green-500 to-teal-500'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DummyAdminPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<{ city: string; status: 'success' | 'error' | 'pending'; count: number }[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [seedingAll, setSeedingAll] = useState(false)

  // Initialize all zones for a city
  const initializeCity = async (city: CityConfig) => {
    setLoading(city.id)
    setLogs(prev => [...prev, `🚀 Starting ${city.name} (${city.zones.length} zones)...`])
    
    let totalCount = 0
    let hasError = false
    
    for (const zone of city.zones) {
      try {
        setLogs(prev => [...prev, `   📍 ${zone}...`])
        const count = await initializeDummiesForZone(zone, 30, 30)  // 60 per zone
        totalCount += count
        setLogs(prev => [...prev, `   ✅ ${zone}: ${count} dummies`])
      } catch (error: any) {
        setLogs(prev => [...prev, `   ❌ ${zone} failed: ${error.message}`])
        hasError = true
      }
    }
    
    setResults(prev => [
      ...prev.filter(r => r.city !== city.id),
      { city: city.id, status: hasError ? 'error' : 'success', count: totalCount }
    ])
    
    setLogs(prev => [...prev, `${hasError ? '⚠️' : '✅'} ${city.name} complete: ${totalCount} total dummies\n`])
    setLoading(null)
  }

  // Seed ALL cities at once
  const seedAllCities = async () => {
    setSeedingAll(true)
    setLogs(['🌍 SEEDING ALL CITIES...', ''])
    
    for (const city of CITIES) {
      await initializeCity(city)
      // Small delay between cities
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setLogs(prev => [...prev, '', '🎉 ALL CITIES COMPLETE!'])
    setSeedingAll(false)
  }

  const getCityStatus = (cityId: string) => {
    return results.find(r => r.city === cityId)
  }

  const completedCities = results.filter(r => r.status === 'success').length
  const totalDummies = results.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="min-h-screen bg-[#0d2920] p-4 md:p-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/admin/super/dummies')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>חזרה ל-Control Center</span>
        </button>
        
        <button
          onClick={() => router.push('/admin/super/dummies')}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          <span>Control Center</span>
        </button>
      </div>
      
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4ade80] flex items-center justify-center gap-3">
          <span className="text-3xl">🤖</span>
          Dummy Users Admin
          <span className="text-3xl">🦎</span>
        </h1>
        <p className="text-white/60 mt-2">Initialize dummies for ALL 32 cities</p>
        
        {/* Stats */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="bg-[#4ade80]/20 px-4 py-2 rounded-lg">
            <span className="text-[#4ade80] font-bold">{completedCities}/{CITIES.length}</span>
            <span className="text-white/60 ml-2">cities</span>
          </div>
          <div className="bg-purple-500/20 px-4 py-2 rounded-lg">
            <span className="text-purple-400 font-bold">{totalDummies.toLocaleString()}</span>
            <span className="text-white/60 ml-2">dummies</span>
          </div>
        </div>
      </div>

      {/* SEED ALL Button */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={seedAllCities}
          disabled={seedingAll || loading !== null}
          className="w-full bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#15803d] text-white py-4 px-6 rounded-xl font-black text-xl disabled:opacity-50 hover:shadow-lg hover:shadow-[#4ade80]/30 transition-all flex items-center justify-center gap-3"
        >
          {seedingAll ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Seeding All Cities...
            </>
          ) : (
            <>
              <Globe className="w-6 h-6" />
              🌍 SEED ALL 32 CITIES (One Click!)
            </>
          )}
        </button>
      </div>
      
      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-7xl mx-auto mb-6">
        {CITIES.map(city => {
          const status = getCityStatus(city.id)
          const isLoading = loading === city.id
          
          return (
            <button
              key={city.id}
              onClick={() => initializeCity(city)}
              disabled={loading !== null || seedingAll}
              className={`
                relative bg-gradient-to-r ${city.color} text-white py-3 px-4 rounded-xl font-bold 
                disabled:opacity-50 hover:shadow-lg transition-all text-left
                ${status?.status === 'success' ? 'ring-2 ring-green-400' : ''}
                ${status?.status === 'error' ? 'ring-2 ring-red-400' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{city.emoji}</span>
                  <div>
                    <div className="font-bold">{city.name}</div>
                    <div className="text-xs opacity-80">{city.nameHe} • {city.zones.length} zones</div>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div>
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {status?.status === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
                  {status?.status === 'error' && <XCircle className="w-5 h-5 text-white" />}
                </div>
              </div>
              
              {/* Count badge */}
              {status && (
                <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold px-2 py-1 rounded-full">
                  {status.count}
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Log */}
      <div className="bg-black/30 rounded-xl p-4 max-w-4xl mx-auto">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          📋 Log:
        </h2>
        <div className="space-y-1 font-mono text-xs max-h-60 overflow-y-auto">
          {logs.map((log, i) => (
            <p key={i} className={`
              ${log.includes('✅') ? 'text-green-400' : ''}
              ${log.includes('❌') ? 'text-red-400' : ''}
              ${log.includes('🚀') ? 'text-yellow-400' : ''}
              ${log.includes('🎉') ? 'text-[#4ade80] font-bold' : ''}
              ${!log.includes('✅') && !log.includes('❌') && !log.includes('🚀') && !log.includes('🎉') ? 'text-white/70' : ''}
            `}>{log}</p>
          ))}
          {logs.length === 0 && (
            <p className="text-white/40">Click a city or "Seed All" to start...</p>
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-6 p-4 bg-white/10 rounded-xl max-w-4xl mx-auto">
        <h3 className="text-[#4ade80] font-bold mb-2">📌 Instructions:</h3>
        <ul className="text-white/70 text-sm space-y-1 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <li>• Click city button to initialize all its zones</li>
          <li>• Or click "SEED ALL" to do everything at once</li>
          <li>• Each zone gets 30 male + 30 female = 60 profiles</li>
          <li>• Already initialized zones are skipped</li>
          <li>• Real users always shown FIRST in gallery</li>
          <li>• Like on dummy = disappears forever</li>
          <li>• Pass on dummy = reappears after 3 days</li>
          <li>• ✅ = success, ❌ = partial failure</li>
        </ul>
      </div>
    </div>
  )
}
