'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { trackPageView, trackSectionView } from '@/lib/analytics-service'

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [trackedSections, setTrackedSections] = useState<Set<string>>(new Set())

  // Refs for section tracking
  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const howItWorksRef = useRef<HTMLElement>(null)
  const downloadRef = useRef<HTMLElement>(null)
  const partnersRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    
    // ✅ Track page view on load
    trackPageView('website', 'hero')
    
    // ✅ Capture install prompt for PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      // @ts-ignore
      window.deferredPrompt = e
      console.log('✅ Install prompt captured')
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // ✅ Track section views when user scrolls to them
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id
            if (sectionId && !trackedSections.has(sectionId)) {
              trackSectionView(`website_${sectionId}`)
              setTrackedSections(prev => new Set([...prev, sectionId]))
            }
          }
        })
      },
      { threshold: 0.3 } // 30% of section visible
    )

    // Observe all sections
    const sections = document.querySelectorAll('section[id]')
    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [trackedSections])

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 || menuOpen ? 'bg-[#0a1f1a]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
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
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-gray-300 hover:text-green-400 transition-colors">How It Works</a>
              <a href="#features" className="text-gray-300 hover:text-green-400 transition-colors">Features</a>
              <a href="#partners" className="text-gray-300 hover:text-green-400 transition-colors">For Venues</a>
              <a href="#download" className="text-gray-300 hover:text-green-400 transition-colors">Download</a>
              <Link 
                href="/join"
                className="relative px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full font-semibold text-black hover:shadow-lg hover:shadow-green-500/50 transition-all"
                style={{ animation: 'subtle-glow 2s ease-in-out infinite' }}
              >
                <span className="flex items-center gap-2">
                  🏢 Join as Venue
                </span>
              </Link>
              <Link 
                href="/app"
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all"
              >
                Open App
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
            <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-4 bg-[#0a1f1a]">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400">How It Works</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400">Features</a>
              <a href="#partners" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400">For Venues</a>
              <a href="#download" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400">Download</a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400">Contact</a>
              <Link 
                href="/join"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full font-semibold text-black"
                style={{ animation: 'subtle-glow 2s ease-in-out infinite' }}
              >
                🏢 Join as Venue
              </Link>
              <Link 
                href="/app"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold"
              >
                Open App
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
            <span className="text-green-400 text-sm font-medium">Real-Time Dating Revolution</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-fadeInUp">
            <span className="bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
              She Decides.
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              You Meet.
            </span>
            <br />
            <span className="text-white">
              Right Now.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            No endless swiping. No fake profiles. 
            <br className="hidden md:block" />
            Meet real people at real places within <span className="text-green-400 font-semibold">10-500 meters</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <Link 
              href="/app"
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>Open App</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a 
              href="#how-it-works"
              className="px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mt-16 animate-fadeInUp" style={{animationDelay: '0.6s'}}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400">10m</div>
              <div className="text-gray-500 text-sm">Min Distance</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400">500m</div>
              <div className="text-gray-500 text-sm">Max Range</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400">Real</div>
              <div className="text-gray-500 text-sm">Time</div>
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
              How It <span className="text-green-400">Works</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Three simple steps to meet someone special nearby
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
                <h3 className="text-2xl font-bold mb-4">Install App</h3>
                <p className="text-gray-400 mb-4">
                  Add I4IGUANA to your home screen for the best experience. Quick access, instant notifications.
                </p>
                {/* Install Button with Tooltip */}
                <div className="relative group/install">
                  <button
                    id="install-app-btn"
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
                    Install App
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
                          Not seeing install prompt?
                        </h4>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <span className="text-green-400">🤖</span>
                            <span className="text-gray-300">Android: <span className="text-white font-medium">⋮</span> → Install app</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <span className="text-blue-400">🍎</span>
                            <span className="text-gray-300">iPhone: <span className="text-white font-medium">⬆️</span> → Add to Home</span>
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
                  <span className="text-sm">Works Offline</span>
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
                <h3 className="text-2xl font-bold mb-4">Check In</h3>
                <p className="text-gray-400">
                  Arrive at a participating venue - bar, cafe, or event. Scan the QR code to check in and go live.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">GPS Verified</span>
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
                <h3 className="text-2xl font-bold mb-4">She Decides</h3>
                <p className="text-gray-400">
                  Women are in control. She chooses who to meet. If there's a match - you meet instantly. No waiting.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm">Women First</span>
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
                <span className="text-pink-400 text-sm font-medium">Women First</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                She's in <span className="text-green-400">Control</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Unlike other dating apps, I4IGUANA puts women in the driver's seat. 
                She decides who she wants to meet, when, and where. 
                No unwanted messages. No harassment. Just meaningful connections.
              </p>
              
              <div className="space-y-4">
                {[
                  'Women initiate all conversations',
                  'Safe, GPS-verified locations only',
                  'Real-time presence - no catfishing',
                  'Block & report with one tap',
                  'Premium venues vetted for safety'
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
                        <h3 className="text-white font-bold text-xl">It's a Match!</h3>
                        <p className="text-green-400 text-sm mt-2">50 meters away</p>
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
      {/* DOWNLOAD SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="download" className="py-24 px-6 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-green-400">Meet?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Download I4IGUANA now and start meeting real people at real places. 
            Your next connection is just meters away.
          </p>

          {/* ✅ NEW: Platform Badges - iPhone & Android */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="font-semibold">iPhone</span>
              <span className="text-green-400">✓</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
              </svg>
              <span className="font-semibold">Android</span>
              <span className="text-green-400">✓</span>
            </div>
          </div>

          {/* App Button */}
          <div className="flex flex-col items-center justify-center gap-4 mb-12">
            <Link 
              href="/app"
              className="group px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-bold text-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm opacity-80">Works on iPhone & Android</div>
                <div className="text-xl font-bold">Open Web App</div>
              </div>
            </Link>
            
            <p className="text-gray-500 text-sm">
              No app store download needed • Instant access
            </p>
            
            {/* ✅ NEW: Hollywood Installation Tip Tooltip */}
            <div className="mt-6 group relative inline-block">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full cursor-pointer hover:from-amber-500/30 hover:to-orange-500/30 transition-all">
                <span className="text-xl">💡</span>
                <span className="text-amber-300 text-sm font-medium">Installation tip</span>
                <svg className="w-4 h-4 text-amber-400 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Tooltip Content */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                {/* Arrow */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-[#1a3d2e] to-[#0d2920] rotate-45 border-l border-t border-green-500/30"></div>
                
                {/* Content Box */}
                <div className="relative bg-gradient-to-br from-[#1a3d2e] to-[#0d2920] border border-green-500/30 rounded-2xl p-5 shadow-2xl shadow-green-500/20">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-green-500/5 rounded-2xl blur-xl"></div>
                  
                  <div className="relative">
                    <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                      <span className="text-2xl">📲</span>
                      Not seeing the install prompt?
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Android */}
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-green-400 font-semibold text-sm">Android / Chrome</p>
                          <p className="text-gray-300 text-xs mt-1">
                            Tap <span className="text-white font-bold">⋮</span> (menu) → <span className="text-green-400 font-medium">"Install app"</span>
                          </p>
                        </div>
                      </div>
                      
                      {/* iPhone */}
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-blue-400 font-semibold text-sm">iPhone / Safari</p>
                          <p className="text-gray-300 text-xs mt-1">
                            Tap <span className="text-white font-bold">⬆️</span> (share) → <span className="text-blue-400 font-medium">"Add to Home Screen"</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-xs mt-4 text-center">
                      ✨ Works like a native app - no App Store needed!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code with enhanced styling */}
          <div className="inline-block p-8 bg-white rounded-3xl shadow-2xl shadow-green-500/20">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://i4iguana.com/app&bgcolor=ffffff&color=0d2920"
              alt="Scan to download"
              className="w-44 h-44 mx-auto"
            />
            <p className="text-gray-800 text-lg mt-4 font-bold">Scan with your phone</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-gray-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-sm font-medium">iPhone</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1 text-gray-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                </svg>
                <span className="text-sm font-medium">Android</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VENUE OWNERS / BUSINESS SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="partners" className="py-24 px-6 bg-gradient-to-b from-[#0a1f1a] to-[#0d2920]">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full text-green-400 text-sm font-medium mb-6">
              <span>🏢</span>
              <span>For Venue Owners</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Bring <span className="text-green-400">Real Connections</span> to Your Venue
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join the I4IGUANA network and transform your bar, club, or venue into a hotspot for meaningful connections. More engagement, more customers, more buzz.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-green-500/50 transition-all">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Increase Traffic</h3>
              <p className="text-gray-400 text-sm">Users check in at your venue to find matches nearby. More app users = more customers.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-green-500/50 transition-all">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Targeted Audience</h3>
              <p className="text-gray-400 text-sm">Singles aged 21-45 actively looking to meet people. Your ideal customer base.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-green-500/50 transition-all">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Free to Join</h3>
              <p className="text-gray-400 text-sm">No fees, no commitments. We provide QR stickers and promote your venue in the app.</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mb-16">
            <Link 
              href="/join"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full font-bold text-xl text-black hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all"
              style={{ animation: 'subtle-glow 2s ease-in-out infinite' }}
            >
              <span className="text-2xl">🦎</span>
              <span>הצטרפו עכשיו - חינם!</span>
              <span className="text-2xl">→</span>
            </Link>
            <p className="text-gray-400 text-sm mt-4">מלאו טופס קצר ונחזור אליכם תוך 24 שעות</p>
          </div>

          {/* Business Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-[#0d2920] to-[#1a4d3e] rounded-3xl p-8 border border-green-500/30 shadow-2xl shadow-green-500/10 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl"></div>
              
              {/* Card Content */}
              <div className="relative z-10">
                {/* Logo & Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-black/30 rounded-2xl flex items-center justify-center border border-green-500/30">
                    <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Nir Ram</h3>
                    <p className="text-green-400 font-medium">Founder & CEO</p>
                  </div>
                </div>
                
                {/* Company */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                    I4IGUANA
                  </p>
                  <p className="text-gray-400 text-sm mt-1">Real-Time Dating Revolution</p>
                </div>
                
                {/* Contact Details */}
                <div className="space-y-4">
                  <a href="tel:+972522653170" className="flex items-center gap-4 text-white hover:text-green-400 transition-colors group">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="font-medium">052-265-3170</span>
                  </a>
                  
                  <a href="mailto:nir@i4iguana.com" className="flex items-center gap-4 text-white hover:text-green-400 transition-colors group">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium">nir@i4iguana.com</span>
                  </a>
                  
                  <a href="https://i4iguana.com" className="flex items-center gap-4 text-white hover:text-green-400 transition-colors group">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <span className="font-medium">i4iguana.com</span>
                  </a>
                </div>
                
                {/* CTA */}
                <div className="mt-8 space-y-3">
                  <a 
                    href="/join"
                    className="block w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-center font-bold text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
                  >
                    📝 הצטרף עכשיו - טופס דיגיטלי
                  </a>
                  <a 
                    href="tel:+972522653170"
                    className="block w-full py-4 bg-white/10 border border-white/20 rounded-xl text-center font-bold text-lg hover:bg-white/20 transition-all"
                  >
                    📞 Let's Talk Partnership
                  </a>
                </div>
              </div>
            </div>
            
            <p className="text-center text-gray-500 text-sm mt-6">
              🦎 Join 6+ venues already in the network
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CONTACT SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-24 px-6 bg-[#0d2920]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Get in <span className="text-green-400">Touch</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Have questions? Want to partner with us? We'd love to hear from you.
          </p>
          
          <a 
            href="mailto:nir@i4iguana.com"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            nir@i4iguana.com
          </a>
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
                Real-time dating revolution. Meet real people at real places. 
                She decides, you meet - instantly.
              </p>
              {/* ✅ NEW: Creator Credit */}
              <p className="text-gray-500 text-sm mt-4">
                Created by <span className="text-green-400 font-medium">Nir Ram</span>
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#how-it-works" className="block text-gray-400 hover:text-green-400 transition-colors">How It Works</a>
                <a href="#features" className="block text-gray-400 hover:text-green-400 transition-colors">Features</a>
                <a href="#download" className="block text-gray-400 hover:text-green-400 transition-colors">Download</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-gray-400 hover:text-green-400 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-gray-400 hover:text-green-400 transition-colors">Privacy Policy</Link>
                <a href="#contact" className="block text-gray-400 hover:text-green-400 transition-colors">Contact</a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm font-medium">
                © {new Date().getFullYear()} I4IGUANA. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                A product by <span className="text-green-400">Nir Ram</span> • All copyrights reserved
              </p>
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
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        html {
          scroll-behavior: smooth;
        }
        @keyframes subtle-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(74, 222, 128, 0.3);
          }
          50% { 
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.6), 0 0 30px rgba(74, 222, 128, 0.3);
          }
        }
      `}</style>
    </div>
  )
}
