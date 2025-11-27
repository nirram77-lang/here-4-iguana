"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Wine, Cigarette, Ruler, Heart, GraduationCap, Search, X, MapPin, Briefcase, Languages } from "lucide-react"

// ✅ רשימת מוסדות אקדמיים בישראל
const ISRAELI_INSTITUTIONS = [
  "Tel Aviv University - אוניברסיטת תל אביב",
  "Hebrew University of Jerusalem - האוניברסיטה העברית",
  "Technion - הטכניון",
  "Ben-Gurion University - אוניברסיטת בן גוריון",
  "Bar-Ilan University - אוניברסיטת בר אילן",
  "University of Haifa - אוניברסיטת חיפה",
  "Weizmann Institute - מכון ויצמן",
  "Open University - האוניברסיטה הפתוחה",
  "Reichman University (IDC) - הבינתחומי הרצליה",
  "Ariel University - אוניברסיטת אריאל",
  "Shenkar College - מכללת שנקר",
  "Bezalel Academy - בצלאל אקדמיה לאמנות ועיצוב",
  "Afeka College - מכללת אפקה",
  "Holon Institute of Technology - HIT",
  "Academic College of Tel Aviv-Yafo - המכללה האקדמית תל אביב-יפו",
  "Sapir College - מכללת ספיר",
  "Ruppin College - מכללת רופין",
  "Kinneret College - המכללה האקדמית כנרת",
  "College of Management - המכללה למנהל",
  "Hadassah Academic College - המכללה האקדמית הדסה",
  "Ort Braude College - מכללת אורט בראודה",
  "Azrieli College - מכללת עזריאלי",
  "Sami Shamoon College - מכללת סמי שמעון",
  "Tel-Hai College - מכללת תל חי",
  "Emek Yezreel College - המכללה האקדמית עמק יזרעאל",
  "Western Galilee College - המכללה האקדמית גליל מערבי",
  "Achva Academic College - המכללה האקדמית אחוה",
  "Safed College - המכללה האקדמית צפת",
  "Shalem College - המרכז האקדמי שלם",
  "Netanya Academic College - המכללה האקדמית נתניה",
  "Lev Academic Center - המרכז האקדמי לב",
  "Peres Academic Center - המרכז האקדמי פרס",
  "Ashkelon Academic College - המכללה האקדמית אשקלון",
  "Other - אחר",
  "No degree - ללא תואר",
  "Prefer not to say - מעדיף לא לציין"
]

// ✅ רשימת ערים גדולות בישראל
const ISRAELI_CITIES = [
  "Tel Aviv - תל אביב",
  "Jerusalem - ירושלים",
  "Haifa - חיפה",
  "Rishon LeZion - ראשון לציון",
  "Petah Tikva - פתח תקווה",
  "Ashdod - אשדוד",
  "Netanya - נתניה",
  "Beer Sheva - באר שבע",
  "Holon - חולון",
  "Bnei Brak - בני ברק",
  "Ramat Gan - רמת גן",
  "Ashkelon - אשקלון",
  "Rehovot - רחובות",
  "Bat Yam - בת ים",
  "Herzliya - הרצליה",
  "Kfar Saba - כפר סבא",
  "Hadera - חדרה",
  "Ra'anana - רעננה",
  "Modi'in - מודיעין",
  "Givatayim - גבעתיים",
  "Nahariya - נהריה",
  "Eilat - אילת",
  "Nazareth - נצרת",
  "Tiberias - טבריה",
  "Acre - עכו",
  "Ramat HaSharon - רמת השרון",
  "Kiryat Gat - קריית גת",
  "Kiryat Ata - קריית אתא",
  "Other - אחר"
]

// ✅ NEW: רשימת שפות - עברית ואנגלית בראש!
const LANGUAGES = [
  { code: 'he', name: 'Hebrew - עברית', flag: '🇮🇱' },
  { code: 'en', name: 'English - אנגלית', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian - רוסית', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic - ערבית', flag: '🇸🇦' },
  { code: 'fr', name: 'French - צרפתית', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish - ספרדית', flag: '🇪🇸' },
  { code: 'de', name: 'German - גרמנית', flag: '🇩🇪' },
  { code: 'am', name: 'Amharic - אמהרית', flag: '🇪🇹' },
  { code: 'pt', name: 'Portuguese - פורטוגזית', flag: '🇵🇹' },
  { code: 'it', name: 'Italian - איטלקית', flag: '🇮🇹' },
  { code: 'ro', name: 'Romanian - רומנית', flag: '🇷🇴' },
  { code: 'pl', name: 'Polish - פולנית', flag: '🇵🇱' },
  { code: 'yi', name: 'Yiddish - יידיש', flag: '📜' },
  { code: 'other', name: 'Other - אחר', flag: '🌐' }
]

interface OnboardingLifestyleProps {
  onNext: (data: {
    drinking: 'never' | 'social' | 'regular'
    smoking: 'no' | 'social' | 'yes'
    height: string
    relationshipType: 'relationship' | 'casual' | 'friends'
    education: string
    city: string
    occupation: string
    languages: string[]  // ✅ NEW: Languages array
  }) => void
  onBack: () => void
}

export default function OnboardingLifestyle({ onNext, onBack }: OnboardingLifestyleProps) {
  const [drinking, setDrinking] = useState<'never' | 'social' | 'regular'>('social')
  const [smoking, setSmoking] = useState<'no' | 'social' | 'yes'>('no')
  const [heightValue, setHeightValue] = useState(170)
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inch'>('cm')
  const [relationshipType, setRelationshipType] = useState<'relationship' | 'casual' | 'friends'>('relationship')
  
  // Education state
  const [education, setEducation] = useState('')
  const [educationSearch, setEducationSearch] = useState('')
  const [showEducationDropdown, setShowEducationDropdown] = useState(false)
  
  // City state
  const [city, setCity] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  
  // Occupation state
  const [occupation, setOccupation] = useState('')
  
  // ✅ NEW: Languages state - with Hebrew pre-selected
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['he'])
  
  // Filtered institutions for autocomplete
  const filteredInstitutions = useMemo(() => {
    if (!educationSearch.trim()) return ISRAELI_INSTITUTIONS.slice(0, 8)
    const search = educationSearch.toLowerCase()
    return ISRAELI_INSTITUTIONS.filter(inst => 
      inst.toLowerCase().includes(search)
    ).slice(0, 8)
  }, [educationSearch])
  
  // Filtered cities for autocomplete
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return ISRAELI_CITIES.slice(0, 8)
    const search = citySearch.toLowerCase()
    return ISRAELI_CITIES.filter(c => 
      c.toLowerCase().includes(search)
    ).slice(0, 8)
  }, [citySearch])

  const cmToInch = (cm: number) => Math.round(cm / 2.54)
  const inchToCm = (inch: number) => Math.round(inch * 2.54)

  const displayValue = heightUnit === 'cm' ? heightValue : cmToInch(heightValue)
  const minValue = heightUnit === 'cm' ? 100 : 39
  const maxValue = heightUnit === 'cm' ? 220 : 87

  const handleHeightChange = (value: number) => {
    if (heightUnit === 'cm') {
      setHeightValue(value)
    } else {
      setHeightValue(inchToCm(value))
    }
  }

  const handleUnitToggle = (unit: 'cm' | 'inch') => {
    setHeightUnit(unit)
  }

  // ✅ NEW: Toggle language selection
  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langCode)) {
        // Don't allow removing the last language
        if (prev.length === 1) return prev
        return prev.filter(l => l !== langCode)
      } else {
        return [...prev, langCode]
      }
    })
  }

  const handleNext = () => {
    const height = heightUnit === 'cm' ? `${heightValue}cm` : `${cmToInch(heightValue)}"`
    onNext({ 
      drinking, 
      smoking, 
      height, 
      relationshipType, 
      education, 
      city, 
      occupation,
      languages: selectedLanguages  // ✅ NEW
    })
  }
  
  // Handle education selection
  const handleEducationSelect = (institution: string) => {
    setEducation(institution)
    setEducationSearch(institution)
    setShowEducationDropdown(false)
  }
  
  // Handle city selection
  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity)
    setCitySearch(selectedCity)
    setShowCityDropdown(false)
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#1a4d3e] to-[#0d2920] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div initial={{ width: "60%" }} animate={{ width: "80%" }} className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e]" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 px-6 overflow-y-auto pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }} className="text-6xl mb-3">
              🌟
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Lifestyle</h2>
            <p className="text-white/60 text-sm">Help us find your perfect match</p>
          </div>

          {/* All Options */}
          <div className="space-y-6">
            
            {/* ✅ NEW: Languages - First section! */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Languages className="w-5 h-5 text-[#4ade80]" />
                <label className="text-white font-semibold text-sm">Languages I Speak</label>
                <span className="text-white/40 text-xs">(select all that apply)</span>
              </div>
              
              {/* Quick select for Hebrew & English */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {LANGUAGES.slice(0, 2).map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleLanguage(lang.code)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      selectedLanguages.includes(lang.code)
                        ? 'bg-[#4ade80]/20 border-[#4ade80] text-white'
                        : 'bg-white/5 border-white/20 text-white/60'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{lang.name.split(' - ')[0]}</div>
                      <div className="text-xs opacity-60">{lang.name.split(' - ')[1]}</div>
                    </div>
                    {selectedLanguages.includes(lang.code) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-[#4ade80]"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Other languages in grid */}
              <div className="grid grid-cols-4 gap-2">
                {LANGUAGES.slice(2).map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleLanguage(lang.code)}
                    className={`p-2 rounded-xl border-2 transition-all text-center ${
                      selectedLanguages.includes(lang.code)
                        ? 'bg-[#4ade80]/20 border-[#4ade80] text-white'
                        : 'bg-white/5 border-white/20 text-white/60'
                    }`}
                  >
                    <div className="text-xl mb-1">{lang.flag}</div>
                    <div className="text-[10px] font-medium truncate">{lang.name.split(' - ')[0]}</div>
                  </motion.button>
                ))}
              </div>
              
              {/* Selected languages badge */}
              {selectedLanguages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {selectedLanguages.map(code => {
                    const lang = LANGUAGES.find(l => l.code === code)
                    return (
                      <span 
                        key={code}
                        className="px-2 py-1 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/50 text-[#4ade80] text-xs flex items-center gap-1"
                      >
                        {lang?.flag} {lang?.name.split(' - ')[0]}
                      </span>
                    )
                  })}
                </motion.div>
              )}
            </div>

            {/* Drinking */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wine className="w-5 h-5 text-[#4ade80]" />
                <label className="text-white font-semibold text-sm">Drinking</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'never', label: 'Never', emoji: '🚫' },
                  { value: 'social', label: 'Social', emoji: '🍷' },
                  { value: 'regular', label: 'Regular', emoji: '🍺' }
                ].map((option) => (
                  <motion.button key={option.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDrinking(option.value as any)} className={`p-3 rounded-2xl border-2 transition-all ${drinking === option.value ? 'bg-[#4ade80]/20 border-[#4ade80] text-white' : 'bg-white/5 border-white/20 text-white/60'}`}>
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Smoking */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cigarette className="w-5 h-5 text-[#4ade80]" />
                <label className="text-white font-semibold text-sm">Smoking</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'no', label: 'No', emoji: '🚭' },
                  { value: 'social', label: 'Social', emoji: '🌿' },
                  { value: 'yes', label: 'Yes', emoji: '🚬' }
                ].map((option) => (
                  <motion.button key={option.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSmoking(option.value as any)} className={`p-3 rounded-2xl border-2 transition-all ${smoking === option.value ? 'bg-[#4ade80]/20 border-[#4ade80] text-white' : 'bg-white/5 border-white/20 text-white/60'}`}>
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-[#4ade80]" />
                  <label className="text-white font-semibold text-sm">Height</label>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleUnitToggle('cm')} className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${heightUnit === 'cm' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-white/10 text-white/60'}`}>cm</button>
                  <button onClick={() => handleUnitToggle('inch')} className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${heightUnit === 'inch' ? 'bg-[#4ade80] text-[#0d2920]' : 'bg-white/10 text-white/60'}`}>inch</button>
                </div>
              </div>
              <div className="text-center mb-2">
                <span className="text-3xl font-bold text-[#4ade80]">{displayValue}</span>
                <span className="text-white/60 text-sm ml-1">{heightUnit}</span>
              </div>
              <input type="range" min={minValue} max={maxValue} value={displayValue} onChange={(e) => handleHeightChange(parseInt(e.target.value))} className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#4ade80]" />
              <div className="flex justify-between text-white/40 text-xs mt-1">
                <span>{minValue}{heightUnit}</span>
                <span>{maxValue}{heightUnit}</span>
              </div>
            </div>

            {/* Education */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-[#4ade80]" />
                <label className="text-white font-semibold text-sm">Education</label>
              </div>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={educationSearch}
                    onChange={(e) => {
                      setEducationSearch(e.target.value)
                      setShowEducationDropdown(true)
                    }}
                    onFocus={() => setShowEducationDropdown(true)}
                    placeholder="Search institution..."
                    className="w-full p-3 pl-10 pr-10 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-[#4ade80] focus:outline-none text-sm"
                  />
                  {educationSearch && (
                    <button
                      onClick={() => {
                        setEducationSearch('')
                        setEducation('')
                        setShowEducationDropdown(true)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Dropdown */}
                <AnimatePresence>
                  {showEducationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#1a4d3e] border-2 border-[#4ade80]/30 rounded-xl overflow-hidden shadow-2xl z-20 max-h-48 overflow-y-auto"
                    >
                      {filteredInstitutions.map((institution, index) => (
                        <motion.button
                          key={institution}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => handleEducationSelect(institution)}
                          className={`w-full p-3 text-left hover:bg-[#4ade80]/20 transition-colors border-b border-white/10 last:border-b-0 ${
                            education === institution ? 'bg-[#4ade80]/30 text-[#4ade80]' : 'text-white'
                          }`}
                        >
                          <span className="text-sm">{institution}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Selected badge */}
                {education && !showEducationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 p-2 rounded-lg bg-[#4ade80]/20 border border-[#4ade80]/50 text-[#4ade80] text-center text-xs"
                  >
                    <GraduationCap className="h-4 w-4 inline mr-1" />
                    {education}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Occupation */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5 text-[#4ade80]" />
                <label className="text-white font-semibold text-sm">Occupation</label>
              </div>
              
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="What do you do? (e.g., Software Engineer, Teacher...)"
                maxLength={50}
                className="w-full p-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-[#4ade80] focus:outline-none text-sm"
              />
              
              {occupation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-2 rounded-lg bg-[#4ade80]/20 border border-[#4ade80]/50 text-[#4ade80] text-center text-xs"
                >
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  {occupation}
                </motion.div>
              )}
            </div>

            {/* City */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-[#4ade80]" />
                <label className="text-white font-semibold text-sm">City</label>
              </div>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value)
                      setShowCityDropdown(true)
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Search your city..."
                    className="w-full p-3 pl-10 pr-10 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-[#4ade80] focus:outline-none text-sm"
                  />
                  {citySearch && (
                    <button
                      onClick={() => {
                        setCitySearch('')
                        setCity('')
                        setShowCityDropdown(true)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Dropdown */}
                <AnimatePresence>
                  {showCityDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#1a4d3e] border-2 border-[#4ade80]/30 rounded-xl overflow-hidden shadow-2xl z-20 max-h-48 overflow-y-auto"
                    >
                      {filteredCities.map((cityOption, index) => (
                        <motion.button
                          key={cityOption}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => handleCitySelect(cityOption)}
                          className={`w-full p-3 text-left hover:bg-[#4ade80]/20 transition-colors border-b border-white/10 last:border-b-0 ${
                            city === cityOption ? 'bg-[#4ade80]/30 text-[#4ade80]' : 'text-white'
                          }`}
                        >
                          <span className="text-sm">{cityOption}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Selected badge */}
                {city && !showCityDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 p-2 rounded-lg bg-[#4ade80]/20 border border-[#4ade80]/50 text-[#4ade80] text-center text-xs"
                  >
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {city}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Looking For */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-[#4ade80]" />
                <label className="text-white font-semibold text-sm">Looking For</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'relationship', label: 'Relationship', emoji: '💑' },
                  { value: 'casual', label: 'Casual', emoji: '😊' },
                  { value: 'friends', label: 'Friends', emoji: '🤝' }
                ].map((option) => (
                  <motion.button key={option.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setRelationshipType(option.value as any)} className={`p-3 rounded-2xl border-2 transition-all ${relationshipType === option.value ? 'bg-[#4ade80]/20 border-[#4ade80] text-white' : 'bg-white/5 border-white/20 text-white/60'}`}>
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Extra padding for button */}
            <div className="h-4" />
          </div>
        </motion.div>
      </div>

      {/* Continue Button - Fixed at bottom */}
      <div className="p-4 bg-[#0d2920]/50 border-t border-[#4ade80]/20 flex-shrink-0">
        <Button onClick={handleNext} className="w-full h-12 bg-gradient-to-r from-[#4ade80] to-[#22c55e] hover:from-[#3bc970] hover:to-[#16a34a] text-[#0d2920] text-base font-bold rounded-2xl shadow-lg shadow-[#4ade80]/20">
          Continue
        </Button>
      </div>
    </div>
  )
}
