'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HebrewLandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white overflow-x-hidden" dir="rtl">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-[#0a1f1a]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
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
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-gray-300 hover:text-green-400 transition-colors">איך זה עובד</a>
              <a href="#features" className="text-gray-300 hover:text-green-400 transition-colors">יתרונות</a>
              <a href="#for-venues" className="text-gray-300 hover:text-green-400 transition-colors">לבעלי מועדונים</a>
              <a href="#download" className="text-gray-300 hover:text-green-400 transition-colors">הורדה</a>
              <Link 
                href="/"
                className="group relative px-4 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white hover:bg-white/20 hover:border-white/50 transition-all"
              >
                <span className="absolute inset-0 rounded-full bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative flex items-center gap-1.5">
                  <span className="text-base">🌐</span>
                  <span>EN</span>
                </span>
              </Link>
              <Link 
                href="/download"
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
            <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-4">
              <a href="#how-it-works" className="block text-gray-300 hover:text-green-400">איך זה עובד</a>
              <a href="#features" className="block text-gray-300 hover:text-green-400">יתרונות</a>
              <a href="#for-venues" className="block text-gray-300 hover:text-green-400">לבעלי מועדונים</a>
              <a href="#download" className="block text-gray-300 hover:text-green-400">הורדה</a>
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white"
              >
                <span>🌐</span>
                <span>EN</span>
              </Link>
              <Link href="/he/terms" className="block text-gray-300 hover:text-green-400">תנאי שימוש</Link>
              <Link 
                href="/download"
                className="block w-full text-center px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold"
              >
                פתח אפליקציה
              </Link>
            </div>
          )}
        </div>
      </nav>

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
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          
          {/* Floating Hearts */}
          <div className="absolute bottom-0 left-[10%] text-pink-400/30 text-2xl animate-floatHeart" style={{animationDelay: '0s'}}>💕</div>
          <div className="absolute bottom-0 left-[25%] text-pink-400/20 text-xl animate-floatHeart" style={{animationDelay: '2s'}}>💕</div>
          <div className="absolute bottom-0 right-[15%] text-pink-400/30 text-2xl animate-floatHeart" style={{animationDelay: '4s'}}>💕</div>
          <div className="absolute bottom-0 right-[35%] text-pink-400/20 text-lg animate-floatHeart" style={{animationDelay: '6s'}}>💕</div>
          
          {/* Radar Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <div className="absolute inset-0 border border-green-500/20 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
            <div className="absolute inset-8 border border-green-500/30 rounded-full animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
            <div className="absolute inset-16 border border-green-500/40 rounded-full animate-ping" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
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

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-fadeInUp">
            <span className="bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
              היא בוחרת.
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              אתם נפגשים.
            </span>
            <br />
            <span className="text-white">
              עכשיו.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            בלי סוויפים אינסופיים. בלי פרופילים מזויפים.
            <br className="hidden md:block" />
            פגשו <span className="text-pink-400">אנשים אמיתיים</span> במקומות אמיתיים במרחק <span className="text-green-400 font-semibold">10-500 מטר</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <Link 
              href="/download"
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>פתח אפליקציה</span>
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a 
              href="#how-it-works"
              className="px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
            >
              למדו עוד
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mt-16 animate-fadeInUp" style={{animationDelay: '0.6s'}}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400">10m</div>
              <div className="text-gray-500 text-sm">מרחק מינימלי</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400">500m</div>
              <div className="text-gray-500 text-sm">טווח מקסימלי</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400">בזמן</div>
              <div className="text-gray-500 text-sm">אמת</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse"></div>
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
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-[#0d2920] rounded-2xl p-8 h-full border border-green-500/20">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">
                  1
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

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-[#0d2920] rounded-2xl p-8 h-full border border-green-500/20">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4">גלו</h3>
                <p className="text-gray-400">
                  ראו מי נמצא בקרבת מקום ב-10-500 מטר. פרופילים אמיתיים, תמונות אמיתיות, אנשים אמיתיים - עכשיו.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm">פרופילים מאומתים</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-[#0d2920] rounded-2xl p-8 h-full border border-green-500/20">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4">היא בוחרת</h3>
                <p className="text-gray-400">
                  נשים בשליטה. היא בוחרת את מי לפגוש, מתי ואיפה. אם יש התאמה - נפגשים מיד. בלי המתנה.
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
                  'נשים יוזמות את כל השיחות',
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
                  
                  {/* Screen Content */}
                  <div className="absolute inset-4 top-8 bg-gradient-to-b from-[#0d2920] to-[#1a4d3e] rounded-[28px] overflow-hidden">
                    {/* Match Animation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <h3 className="text-white font-bold text-xl">יש התאמה!</h3>
                        <p className="text-green-400 text-sm mt-2">50 מטר משם</p>
                      </div>
                    </div>
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
              href="/download"
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
              href="/download"
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
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.i4iguana.com/download&bgcolor=ffffff&color=0d2920"
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

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Link 
                  href="/join?lang=he"
                  className="block w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-center hover:shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  📝 Join Now - Digital Form
                </Link>
                <a 
                  href="tel:+972522653170"
                  className="block w-full py-3 bg-white/10 border border-white/20 rounded-xl font-bold text-center hover:bg-white/20 transition-all"
                >
                  📞 Let's Talk Partnership
                </a>
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
                היא בוחרת, אתם נפגשים - מיד.
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
                <a href="#contact" className="block text-gray-400 hover:text-green-400 transition-colors">צור קשר</a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
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
          0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) scale(1); opacity: 0; }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        .animate-floatHeart {
          animation: floatHeart 10s ease-in-out infinite;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}
