'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PilotButton from '@/components/PilotButton'
import VenueTicker from '@/components/VenueTicker'

export default function HebrewLandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div 
      className="min-h-screen bg-[#0a1f1a] text-white overflow-x-hidden landing-page" 
      dir="rtl"
    >
      
      {/* Floating Hearts - Fixed on screen */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="absolute bottom-0 left-[10%] text-pink-400/50 text-3xl animate-floatHeart" style={{animationDelay: '0s'}}>💕</div>
        <div className="absolute bottom-0 left-[30%] text-pink-400/40 text-2xl animate-floatHeart" style={{animationDelay: '1.5s'}}>💕</div>
        <div className="absolute bottom-0 right-[15%] text-pink-400/50 text-3xl animate-floatHeart" style={{animationDelay: '3s'}}>💕</div>
        <div className="absolute bottom-0 right-[35%] text-pink-400/40 text-2xl animate-floatHeart" style={{animationDelay: '4.5s'}}>💕</div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-[#0a1f1a] shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full animate-pulse opacity-50"></div>
                <img 
                  src="/notification-icon-192.png" 
                  alt="I4IGUANA" 
                  className="w-12 h-12 relative z-10"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                I4IGUANA
              </span>
              
              {/* Launch Pilot Button */}
              <div className="mr-3">
                <PilotButton lang="he" />
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <a href="#how-it-works" className="text-gray-300 hover:text-green-400 transition-colors">איך זה עובד</a>
              <a href="#features" className="text-gray-300 hover:text-green-400 transition-colors">יתרונות</a>
              <a href="#for-venues" className="text-gray-300 hover:text-green-400 transition-colors">לבעלי מועדונים</a>
              <a href="#download" className="text-gray-300 hover:text-green-400 transition-colors">הורדה</a>
              
              {/* PT Language Button */}
              <Link 
                href="/br"
                className="group relative px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white hover:bg-white/20 hover:border-white/50 transition-all"
              >
                <span className="relative flex items-center gap-1">
                  <svg className="w-5 h-4" viewBox="0 0 640 480">
                    <path fill="#229e45" d="M0 0h640v480H0z"/>
                    <path fill="#f8e509" d="M321.4 36.2L594.8 240l-273.4 203.8L48 240z"/>
                    <circle fill="#2b49a3" cx="321.4" cy="240" r="68.8"/>
                    <path fill="#fff" d="M270 210c30-18 73-18 103 0-3 8-8 15-15 20-25-14-48-14-73 0-7-5-12-12-15-20z"/>
                  </svg>
                  <span>PT</span>
                </span>
              </Link>

              {/* EN Language Button */}
              <Link 
                href="/"
                className="group relative px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white hover:bg-white/20 hover:border-white/50 transition-all"
              >
                <span className="relative flex items-center gap-1">
                  <svg className="w-5 h-4" viewBox="0 0 640 480">
                    <path fill="#012169" d="M0 0h640v480H0z"/>
                    <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                    <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                  </svg>
                  <span>EN</span>
                </span>
              </Link>

              <Link 
                href="/app"
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all"
              >
                פתח אפליקציה
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-full h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-full h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a1f1a] border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">איך זה עובד</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">יתרונות</a>
              <a href="#for-venues" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">לבעלי מועדונים</a>
              <a href="#download" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">הורדה</a>
              <div className="flex items-center gap-2">
                <Link 
                  href="/br" 
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white"
                >
                  <svg className="w-5 h-4" viewBox="0 0 640 480">
                    <path fill="#229e45" d="M0 0h640v480H0z"/>
                    <path fill="#f8e509" d="M321.4 36.2L594.8 240l-273.4 203.8L48 240z"/>
                    <circle fill="#2b49a3" cx="321.4" cy="240" r="68.8"/>
                    <path fill="#fff" d="M270 210c30-18 73-18 103 0-3 8-8 15-15 20-25-14-48-14-73 0-7-5-12-12-15-20z"/>
                  </svg>
                  <span>PT</span>
                </Link>
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white"
                >
                  <svg className="w-5 h-4" viewBox="0 0 640 480">
                    <path fill="#012169" d="M0 0h640v480H0z"/>
                    <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                    <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                  </svg>
                  <span>EN</span>
                </Link>
              </div>
              <Link href="/he/terms" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">תנאי שימוש</Link>
              <Link 
                href="/app"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold mt-4"
              >
                פתח אפליקציה
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FLOATING VENUE TICKER - Physical LEFT side of screen            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block fixed left-4 top-24 z-40">
        <VenueTicker lang="he" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f1a] via-transparent to-[#0a1f1a] z-10"></div>
          
          {/* Animated Circles */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" style={{animationDelay: '1s'}}></div>
          
          {/* Radar Effect - Static rings for stability */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <div className="absolute inset-0 border border-green-500/20 rounded-full opacity-50"></div>
            <div className="absolute inset-8 border border-green-500/30 rounded-full opacity-50"></div>
            <div className="absolute inset-16 border border-green-500/40 rounded-full opacity-50"></div>
          </div>

          {/* Iguana Mascot - Background */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-20"
            style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.1}px)` }}
          >
            <img 
              src="/notification-icon-512.png" 
              alt="" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-8 animate-fadeIn">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 text-sm font-medium">✨ הכרויות בזמן אמת - פה ועכשיו ✨</span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* שכבה 1 - בום רגשי - משפט דגל */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-8 leading-tight animate-fadeInUp">
            <span className="text-white block mb-2">
              מסכים לא יוצרים כימיה.
            </span>
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(74,222,128,0.6)]">
              מפגשים אמיתיים כן
            </span>
            <span className="inline-block w-3 h-3 md:w-4 md:h-4 bg-green-400 rounded-full animate-pulse ml-1 shadow-[0_0_20px_rgba(74,222,128,0.8)]"></span>
          </h1>
          
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* שכבה 2 - חידוד חד עם צבעים הוליוודיים */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <p className="text-xl md:text-2xl mb-8 animate-fadeInUp" style={{animationDelay: '0.5s'}}>
            <span className="text-white/70">בלי סווייפים אינסופיים. בלי משחקים.</span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]">פגישה אמיתית.</span>
            {' '}
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]">עכשיו.</span>
          </p>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* שכבה 3 - פרטים עם צבעים */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <p className="text-lg md:text-xl mb-4 animate-fadeInUp" style={{animationDelay: '0.8s'}}>
            <span className="text-pink-400">אנשים אמיתיים.</span>
            {' '}
            <span className="text-white">מקומות אמיתיים.</span>
            {' '}
            <span className="text-green-400 font-semibold">10-500 מטר ממך.</span>
          </p>
          
          {/* She Decides */}
          <p className="text-lg md:text-xl text-pink-400 font-semibold mb-10 animate-fadeInUp flex items-center justify-center gap-2" style={{animationDelay: '1s'}}>
            <span className="text-pink-500">💜</span>
            <span>היא בוחרת. אתם נפגשים.</span>
          </p>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CTA - כפתור אחד ברור */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col items-center gap-3 animate-fadeInUp" style={{animationDelay: '1.2s'}}>
            <Link 
              href="/app"
              className="group px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-3"
            >
              <span>פתח אפליקציה</span>
              <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-white/40 text-sm">בלי התחייבות. בלי חפירות.</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              איך זה <span className="text-green-400">עובד</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              שלושה צעדים פשוטים לפגוש מישהו מיוחד בקרבת מקום
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 - Install App */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-[#0d2920] rounded-2xl p-8 h-full border border-green-500/20">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4">התקנת אפליקציה</h3>
                <p className="text-gray-400 mb-4">
                  הוסיפו את I4IGUANA למסך הבית לחוויה מושלמת. גישה מהירה, התראות מיידיות.
                </p>
                {/* Install Button with Tooltip */}
                <div className="relative group/install">
                  <button
                    id="install-app-btn-he"
                    onClick={() => {
                      // @ts-ignore
                      if (window.deferredPrompt) {
                        // @ts-ignore
                        window.deferredPrompt.prompt()
                        // @ts-ignore
                        window.deferredPrompt.userChoice.then((choiceResult: any) => {
                          // @ts-ignore
                          window.deferredPrompt = null
                        })
                      } else {
                        // Fallback: redirect to /app
                        window.location.href = '/app'
                      }
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    התקנת אפליקציה
                  </button>
                  
                  {/* Tooltip - appears on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 opacity-0 invisible group-hover/install:opacity-100 group-hover/install:visible transition-all duration-300 z-50">
                    {/* Arrow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-[#1a3d2e] to-[#0d2920] rotate-45 border-r border-b border-green-500/30"></div>
                    
                    {/* Content Box */}
                    <div className="relative bg-gradient-to-br from-[#1a3d2e] to-[#0d2920] border border-green-500/30 rounded-xl p-4 shadow-2xl shadow-green-500/20">
                      <div className="absolute inset-0 bg-green-500/5 rounded-xl blur-xl"></div>
                      
                      <div className="relative">
                        <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                          <span>💡</span>
                          לא רואים את ההתקנה?
                        </h4>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <span className="text-green-400">🤖</span>
                            <span className="text-gray-300">אנדרואיד: <span className="text-white font-medium">⋮</span> ← התקן אפליקציה</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <span className="text-blue-400">🍎</span>
                            <span className="text-gray-300">אייפון: <span className="text-white font-medium">⬆️</span> ← הוסף למסך הבית</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">עובד אופליין</span>
                </div>
              </div>
            </div>

            {/* Step 2 - Check In */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-[#0d2920] rounded-2xl p-8 h-full border border-green-500/20">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4">צ'ק-אין</h3>
                <p className="text-gray-400">
                  הגיעו למקום בילוי משתתף - בר, קפה, או אירוע. סרקו את הברקוד כדי להיכנס למערכת.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">אימות GPS</span>
                </div>
              </div>
            </div>

            {/* Step 3 - She Decides */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-[#0d2920] rounded-2xl p-8 h-full border border-green-500/20">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4">היא בוחרת</h3>
                <p className="text-gray-400">
                  נשים בשליטה. היא בוחרת את מי לפגוש. אם יש התאמה - נפגשים מיד. בלי המתנה.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm">נשים קודם</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FEATURES - WOMEN IN CONTROL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-[#0d2920] to-[#0a1f1a]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full mb-6">
                <span className="text-pink-400">👸</span>
                <span className="text-pink-400 text-sm font-medium">נשים קודם</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                היא <span className="text-green-400">בשליטה</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                בניגוד לאפליקציות אחרות, I4IGUANA שמה את הנשים במושב הנהג.
                היא מחליטה את מי לפגוש, מתי ואיפה.
                בלי הודעות לא רצויות. בלי הטרדות. רק חיבורים משמעותיים.
              </p>
              
              <div className="space-y-4">
                {[
                  'נשים מחליטות על המפגש',
                  'מיקומים בטוחים ומאומתים GPS',
                  'נוכחות בזמן אמת - בלי קטפישינג',
                  'חסימה ודיווח בלחיצה אחת',
                  'מקומות פרימיום מאומתים לבטיחות'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-pink-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-[#0a1f1a] border border-white/10 rounded-3xl p-8 overflow-hidden">
                {/* Phone Mockup */}
                <div className="relative mx-auto w-64 h-[500px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-[40px] border-4 border-gray-700 shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                  
                  {/* Screen Content - Using match-screen.png */}
                  <div className="absolute inset-4 top-8 rounded-[28px] overflow-hidden">
                    <img 
                      src="/match-screen.png" 
                      alt="יש התאמה! - I4IGUANA"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FOR VENUE OWNERS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="for-venues" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6">
              <span className="text-amber-400">🏢</span>
              <span className="text-amber-400 text-sm font-medium">לבעלי מקומות בילוי</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              הפכו את <span className="text-green-400">המקום שלכם</span>
              <br />לנקודת מפגש!
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              I4IGUANA מביאה לכם קהל חדש ואיכותי של רווקים שמחפשים לצאת ולהכיר
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { emoji: '👥', title: 'קהל חדש', desc: 'משיכת רווקים איכותיים' },
              { emoji: '📈', title: 'הגדלת תנועה', desc: 'יותר לקוחות למקום' },
              { emoji: '🎯', title: 'שיווק ממוקד', desc: 'חשיפה באפליקציה' },
              { emoji: '💰', title: 'ללא עלות', desc: 'שותפות WIN-WIN' },
            ].map((item, i) => (
              <div key={i} className="bg-[#0d2920] border border-green-500/20 rounded-2xl p-6 text-center hover:border-green-500/50 transition-all">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <div className="bg-gradient-to-r from-[#0d2920] to-[#1a4d3e] border-2 border-green-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              רוצים להצטרף? 🦎
            </h3>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              מלאו את הטופס ונציג שלנו יצור איתכם קשר תוך 24-48 שעות
            </p>
            <Link 
              href="/join?lang=he"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all"
            >
              <span>📝</span>
              <span>מלאו טופס הצטרפות</span>
            </Link>
            <p className="text-gray-500 text-sm mt-4">
              או שלחו מייל ל: <a href="mailto:venues@i4iguana.com" className="text-green-400 hover:underline">venues@i4iguana.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DOWNLOAD SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="download" className="py-24 px-6 bg-[#0d2920]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            מוכנים <span className="text-green-400">להיפגש?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            הורידו את I4IGUANA עכשיו והתחילו לפגוש אנשים אמיתיים במקומות אמיתיים.
            החיבור הבא שלכם במרחק מטרים בודדים.
          </p>

          {/* App Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              href="/app"
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-3"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.9 17.39c-.26.8-.78 1.49-1.4 2.1-1.02 1.02-2.43 1.51-3.82 1.51H6.05c-1.4 0-2.8-.49-3.82-1.51-1.01-1.02-1.51-2.43-1.51-3.82V6.05c0-1.4.49-2.8 1.51-3.82 1.02-1.02 2.43-1.51 3.82-1.51h6.63c1.4 0 2.8.49 3.82 1.51.62.62 1.14 1.3 1.4 2.1.24.73.28 1.52.28 2.28v8.5c0 .76-.04 1.55-.28 2.28zM12 6.21c-2.86 0-5.19 2.33-5.19 5.19s2.33 5.19 5.19 5.19 5.19-2.33 5.19-5.19-2.33-5.19-5.19-5.19z"/>
              </svg>
              <div className="text-right">
                <div className="text-xs opacity-80">Android</div>
                <div className="text-lg font-bold">Web App</div>
              </div>
            </Link>
            
            <Link 
              href="/app"
              className="group px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl font-bold text-lg shadow-lg hover:shadow-gray-500/30 hover:scale-105 transition-all flex items-center gap-3 border border-white/20"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-right">
                <div className="text-xs opacity-80">iOS</div>
                <div className="text-lg font-bold">App Store</div>
              </div>
            </Link>
          </div>

          {/* QR Code */}
          <div className="inline-block p-6 bg-white rounded-2xl">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.i4iguana.com/app&bgcolor=ffffff&color=0d2920"
              alt="סרקו להורדה"
              className="w-36 h-36"
            />
            <p className="text-gray-800 text-sm mt-2 font-medium">סרקו לפתיחת האפליקציה</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CONTACT SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            צרו <span className="text-green-400">קשר</span>
          </h2>
          <p className="text-gray-400 text-lg mb-12">
            יש שאלות? רוצים לשתף פעולה? נשמח לשמוע מכם.
          </p>
          
          {/* Founder Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-[#0d2920] to-[#1a4d3e] border border-green-500/30 rounded-3xl p-8 shadow-xl">
              {/* Profile */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-10 h-10" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-white">Nir Ram</h3>
                  <p className="text-green-400">Founder & CEO</p>
                </div>
              </div>

              {/* Company */}
              <div className="mb-6 text-right">
                <h4 className="text-2xl font-bold text-green-400">I4IGUANA</h4>
                <p className="text-gray-400">Real-Time Dating Revolution</p>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 mb-6">
                <a href="tel:+972522653170" className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors justify-end">
                  <span>052-265-3170</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
                <a href="mailto:nir@i4iguana.com" className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors justify-end">
                  <span>nir@i4iguana.com</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <a href="https://www.i4iguana.com" className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors justify-end">
                  <span>i4iguana.com</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <Link 
                  href="/join?lang=he"
                  className="block w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-center hover:shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  📝 הצטרפו עכשיו - טופס דיגיטלי
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-10 h-10" />
                <span className="text-xl font-bold">I4IGUANA</span>
              </div>
              <p className="text-gray-400 max-w-sm">
                מהפכת ההכרויות בזמן אמת. פגשו אנשים אמיתיים במקומות אמיתיים.
                בלי סווייפים אינסופיים. בלי משחקים. נפגשים באמת.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold mb-4">מוצר</h4>
              <div className="space-y-2">
                <a href="#how-it-works" className="block text-gray-400 hover:text-green-400 transition-colors">איך זה עובד</a>
                <a href="#features" className="block text-gray-400 hover:text-green-400 transition-colors">יתרונות</a>
                <a href="#download" className="block text-gray-400 hover:text-green-400 transition-colors">הורדה</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">משפטי</h4>
              <div className="space-y-2">
                <Link href="/he/terms" className="block text-gray-400 hover:text-green-400 transition-colors">תנאי שימוש</Link>
                <Link href="/he/privacy" className="block text-gray-400 hover:text-green-400 transition-colors">מדיניות פרטיות</Link>
                <Link href="/accessibility" className="block text-gray-400 hover:text-green-400 transition-colors">הצהרת נגישות</Link>
                <a href="#contact" className="block text-gray-400 hover:text-green-400 transition-colors">צור קשר</a>
              </div>
            </div>
          </div>

          {/* No Art Gallery Logo - Hollywood Style */}
          <div className="py-6 md:py-10 flex justify-center">
            <a 
              href="https://noartgallery.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-150" />
              
              <img 
                src="/no-art-gallery-logo.png" 
                alt="No Art Gallery" 
                className="h-6 md:h-10 w-auto relative z-10 transition-all duration-500 group-hover:scale-110"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255, 140, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 100, 0, 0.3))'
                }}
              />
            </a>
          </div>

          {/* Bottom */}
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} I4IGUANA. כל הזכויות שמורות.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>נוצר עם</span>
              <span className="text-pink-400 animate-pulse">💕</span>
              <span>בישראל</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CUSTOM STYLES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        @keyframes floatHeart {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-100vh) scale(1.3); opacity: 0; }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        .animate-floatHeart {
          animation: floatHeart 8s ease-in-out infinite;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}
