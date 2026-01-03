'use client'

import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [installReady, setInstallReady] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [radarAngle, setRadarAngle] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [installState, setInstallState] = useState<'idle' | 'installed'>('idle')

  useEffect(() => {
    setMounted(true)
    // Check if on desktop to show QR
    const isDesktop = window.innerWidth > 768
    setShowQR(isDesktop)
    
    // Detect platform
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios')
    } else if (/android/.test(ua)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }
    
    // ✅ Capture install prompt for PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      // @ts-ignore
      window.deferredPrompt = e
      setInstallReady(true)
      console.log('✅ Install prompt captured on landing page')
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // ✅ Listen for successful installation
    const handleAppInstalled = () => {
      console.log('🎉 PWA Installation COMPLETE!')
      setInstallState('installed')
      setInstallReady(false)
    }
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Check if already captured
    // @ts-ignore
    if (window.deferredPrompt) {
      setInstallReady(true)
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Radar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 1.5) % 360)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleDownload = () => {
    console.log('📲 handleDownload triggered')
    setIsPressed(true)
    
    // ✅ v2.8.6: Better iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    // @ts-ignore
    if (window.deferredPrompt) {
      console.log('📲 Using deferred prompt (Android)')
      // @ts-ignore
      window.deferredPrompt.prompt()
      // @ts-ignore
      window.deferredPrompt.userChoice.then((choiceResult: any) => {
        console.log('User choice:', choiceResult.outcome)
        // @ts-ignore
        window.deferredPrompt = null
        setInstallReady(false)
        setIsPressed(false)
        
        // If accepted, show success screen
        if (choiceResult.outcome === 'accepted') {
          setTimeout(() => {
            setInstallState('installed')
          }, 3000)
        }
      })
    } else {
      console.log(`📲 No deferred prompt - showing instructions (iOS: ${isIOS})`)
      // ✅ v2.8.6: Immediate response for iOS
      setIsPressed(false)
      setShowInstructions(true)
    }
  }

  return (
    <div 
      className="min-h-screen min-h-[100dvh] bg-[#0a1f1a] text-white overflow-hidden fixed inset-0 landing-page" 
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        touchAction: 'manipulation',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating particles */}
        {mounted && [...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}>
        
        {/* Top Section - Logo, Title, Features */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* Logo */}
          <div className={`mb-3 sm:mb-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <img 
                src="/notification-icon-192.png" 
                alt="I4IGUANA" 
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Brand Name */}
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
              I4IGUANA
            </span>
          </h1>

          {/* Tagline */}
          <p className={`text-base sm:text-lg md:text-xl text-white/80 mb-1 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            Real-Time Dating
          </p>
          
          {/* Sub-tagline */}
          <p className={`text-sm sm:text-base text-green-400/80 mb-4 sm:mb-6 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            Meet. Here. Now.
          </p>

          {/* Features - 3 simple icons */}
          <div className={`flex items-center justify-center gap-8 sm:gap-10 md:gap-14 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl mb-1">📍</div>
              <p className="text-[10px] sm:text-xs text-white/60">Same Place</p>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl mb-1">⚡</div>
              <p className="text-[10px] sm:text-xs text-white/60">Real Time</p>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl mb-1">💚</div>
              <p className="text-[10px] sm:text-xs text-white/60">Real People</p>
            </div>
          </div>
        </div>

        {/* Center Section - Radar */}
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 py-4 sm:py-6">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RADAR CIRCLE WITH IGUANA - THE STAR OF THE SHOW! */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className={`relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 transition-all duration-1000 delay-600 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          
          {/* Outer Glow */}
          <div className="absolute inset-0 rounded-full animate-radar-glow"></div>

          {/* Radar Background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#1a4d3e]/80 to-[#0d2920]/90 border-2 border-[#4ade80]/40 shadow-2xl">
            {/* Radar Circles */}
            <div className="absolute inset-4 sm:inset-6 rounded-full border border-[#4ade80]/15" />
            <div className="absolute inset-8 sm:inset-12 rounded-full border border-[#4ade80]/20" />
            <div className="absolute inset-14 sm:inset-20 rounded-full border border-[#4ade80]/25" />
          </div>

          {/* Radar Sweep */}
          <div 
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ transform: `rotate(${radarAngle}deg)` }}
          >
            <div 
              className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
              style={{
                background: 'linear-gradient(90deg, rgba(74, 222, 128, 0.8), transparent)',
              }}
            />
            {/* Sweep Trail */}
            <div 
              className="absolute top-0 left-1/2 w-1/2 h-full origin-left"
              style={{
                background: 'conic-gradient(from -90deg, rgba(74, 222, 128, 0.2), transparent 60deg)',
                transform: 'rotate(-30deg)',
              }}
            />
          </div>

          {/* Floating Hearts */}
          <div className="absolute top-5 sm:top-7 right-5 sm:right-10 animate-pulse" style={{ animationDuration: '2s' }}>
            <span className="text-pink-400 text-base sm:text-lg">💕</span>
          </div>
          <div className="absolute bottom-10 sm:bottom-14 left-5 sm:left-7 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
            <span className="text-pink-400 text-xs sm:text-sm">💕</span>
          </div>

          {/* Center Iguana */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`text-4xl sm:text-5xl md:text-6xl transition-transform duration-300 ${isPressed ? 'scale-125' : 'animate-iguana-breathe'}`}>
              🦎
            </div>
          </div>

          {/* Clickable Overlay - Install Button */}
          {/* ✅ v2.8.6: iOS Safari fix - use onTouchEnd + onClick for better touch handling */}
          <button
            onClick={handleDownload}
            onTouchEnd={(e) => {
              e.preventDefault()  // Prevent double-firing on iOS
              handleDownload()
            }}
            className="absolute inset-2 rounded-full cursor-pointer focus:outline-none group z-10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Install I4IGUANA"
          >
            {/* Hover Ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-[#4ade80]/60 group-hover:border-[#4ade80] group-active:border-[#4ade80] group-active:shadow-lg group-active:shadow-[#4ade80]/30 transition-all duration-300"></div>
            
            {/* Install indicator */}
            {installReady && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-ping"></span>
            )}
          </button>
        </div>

        {/* Install Text */}
        <p className={`text-white/60 text-xs sm:text-sm mt-3 sm:mt-4 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          Tap the radar to install
        </p>

        {/* Continue to App Button */}
        {/* ✅ v2.8.6: iOS Safari fix */}
        <div className={`mt-3 sm:mt-4 transition-all duration-1000 delay-800 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={() => window.location.href = '/app'}
            onTouchEnd={(e) => {
              e.preventDefault()
              window.location.href = '/app'
            }}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#4ade80]/20 hover:bg-[#4ade80]/30 active:bg-[#4ade80]/40 border border-[#4ade80]/50 hover:border-[#4ade80] rounded-xl font-semibold text-[#4ade80] text-sm sm:text-base transition-all duration-300"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Continue to App →
          </button>
        </div>
        </div>  {/* End center section */}

        {/* Bottom Section - Footer */}
        <div className={`text-xs sm:text-sm font-medium tracking-wide transition-all duration-1000 delay-1000 flex-shrink-0 pb-4 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <span style={{ color: '#8B7355' }}>Real-Time Dating</span>
          <span className="mx-2 sm:mx-3" style={{ color: '#8B7355' }}>•</span>
          <a 
            href="https://i4iguana.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative inline-block text-[#4ade80] hover:text-[#86efac] transition-all duration-300 animate-glow-subtle"
          >
            www.i4iguana.com
          </a>
        </div>
      </div>

      {/* QR Code for Desktop - Bottom corner */}
      {showQR && mounted && (
        <div className="fixed bottom-6 right-6 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 animate-fadeIn">
          <p className="text-white/50 text-xs mb-2 text-center">Scan on mobile</p>
          <div className="bg-white p-2 rounded-lg">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://i4iguana.com/landing')}&color=0d2920&bgcolor=ffffff`}
              alt="QR Code"
              className="w-20 h-20"
            />
          </div>
        </div>
      )}

      {/* Install Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-gradient-to-br from-[#0d2920] to-[#051410] rounded-2xl border border-green-500/30 p-6 max-w-sm w-full shadow-2xl animate-scaleIn">
            {/* Close button */}
            <button 
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-xl"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🦎</div>
              <h3 className="text-xl font-bold text-white">Install I4IGUANA</h3>
            </div>
            
            {platform === 'ios' ? (
              <div className="space-y-4">
                <p className="text-white/80 text-center text-sm">Add to your home screen:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">1️⃣</span>
                    <span className="text-white/80 text-sm">Tap the <span className="text-[#4ade80] font-bold">Share</span> button (□↑)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">2️⃣</span>
                    <span className="text-white/80 text-sm">Scroll and tap <span className="text-[#4ade80] font-bold">Add to Home Screen</span></span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">3️⃣</span>
                    <span className="text-white/80 text-sm">Tap <span className="text-[#4ade80] font-bold">Add</span> to confirm</span>
                  </div>
                </div>
              </div>
            ) : platform === 'android' ? (
              <div className="space-y-4">
                <p className="text-white/80 text-center text-sm">Add to your home screen:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">1️⃣</span>
                    <span className="text-white/80 text-sm">Tap the <span className="text-[#4ade80] font-bold">Menu</span> (⋮) button</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">2️⃣</span>
                    <span className="text-white/80 text-sm">Tap <span className="text-[#4ade80] font-bold">Add to Home Screen</span></span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">3️⃣</span>
                    <span className="text-white/80 text-sm">Tap <span className="text-[#4ade80] font-bold">Install</span> to confirm</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/80 text-center text-sm">Scan with your phone to install:</p>
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://i4iguana.com/landing')}&color=0d2920&bgcolor=ffffff`}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Continue to app button */}
            <button
              onClick={() => window.location.href = '/app'}
              className="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold text-white hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              Continue to App →
            </button>
            
            {/* Bronze Footer */}
            <div className="text-xs font-medium tracking-wide mt-4">
              <span style={{ color: '#8B7355' }}>Real-Time Dating</span>
              <span className="mx-1" style={{ color: '#8B7355' }}>•</span>
              <a 
                href="https://i4iguana.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#4ade80] hover:text-[#86efac] transition-all duration-300 animate-glow-subtle"
              >
                www.i4iguana.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SUCCESS SCREEN - Installation Complete */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {installState === 'installed' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0a1f18] via-[#0d2920] to-[#051410] animate-fadeIn">
          
          {/* Celebration particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {mounted && [...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                {['🎉', '✨', '💚', '🦎', '🎊'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>

          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full bg-[#4ade80]/30 blur-3xl animate-pulse"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center px-8 max-w-sm animate-scaleIn flex-1 flex flex-col items-center justify-center">
            
            {/* Success Icon */}
            <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-2xl shadow-[#4ade80]/50">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-black text-white mb-4">
              🎉 Installed!
            </h2>

            {/* Instructions Box */}
            <div className="bg-white/10 rounded-2xl p-5 mb-6 border border-[#4ade80]/30">
              <p className="text-white/90 text-base leading-relaxed mb-4">
                Now close this browser and open<br/>
                <span className="text-[#4ade80] font-bold">I4IGUANA</span> from the icon<br/>
                on your home screen
              </p>
              
              {/* Icon preview */}
              <div className="flex items-center justify-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d2920] to-[#051410] flex items-center justify-center border border-[#4ade80]/30 shadow-lg">
                  <span className="text-2xl">🦎</span>
                </div>
                <span className="text-white font-medium">I4IGUANA</span>
              </div>
            </div>

            {/* Iguana */}
            <div className="text-6xl mb-6 animate-bounce">
              🦎
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                // Try to close (won't work in most browsers)
                // Instead, redirect to a simple "close browser" instruction
                try {
                  window.close()
                } catch (e) {
                  // If close fails, show alert
                }
                // Fallback: redirect to app after delay
                setTimeout(() => {
                  window.location.href = '/app'
                }, 500)
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full text-[#0d2920] font-bold text-lg shadow-lg shadow-[#4ade80]/30 hover:shadow-[#4ade80]/50 transition-all"
            >
              Got it! 👍
            </button>

            {/* Hint */}
            <p className="text-white/40 text-xs mt-4">
              💡 For the best experience, always open from the icon
            </p>
          </div>

          {/* Bronze Footer - Signature */}
          <div className="relative z-10 pb-6 text-center">
            <div className="text-sm font-medium tracking-wide">
              <span style={{ color: '#8B7355' }}>Real-Time Dating</span>
              <span className="mx-2" style={{ color: '#8B7355' }}>•</span>
              <a 
                href="https://i4iguana.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#4ade80] hover:text-[#86efac] transition-all duration-300 animate-glow-subtle"
              >
                www.i4iguana.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        html, body {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          height: 100dvh;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        
        /* iOS Safe Area Support */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          html, body {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-40px) translateX(-10px); opacity: 0.4; }
          75% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        .animate-float {
          animation: float linear infinite;
        }
        
        @keyframes radar-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(74, 222, 128, 0.2); }
          50% { box-shadow: 0 0 60px rgba(74, 222, 128, 0.4); }
        }
        .animate-radar-glow {
          animation: radar-glow 3s ease-in-out infinite;
        }
        
        @keyframes glow-subtle {
          0%, 100% { 
            text-shadow: 0 0 8px rgba(74, 222, 128, 0.4), 0 0 16px rgba(74, 222, 128, 0.2);
          }
          50% { 
            text-shadow: 0 0 12px rgba(74, 222, 128, 0.6), 0 0 24px rgba(74, 222, 128, 0.4), 0 0 36px rgba(74, 222, 128, 0.2);
          }
        }
        .animate-glow-subtle {
          animation: glow-subtle 3s ease-in-out infinite;
        }
        
        @keyframes iguana-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-iguana-breathe {
          animation: iguana-breathe 3s ease-in-out infinite;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg) scale(0); opacity: 1; }
          50% { transform: translateY(-100px) rotate(180deg) scale(1); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg) scale(0.5); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti ease-out forwards;
        }
      `}</style>
    </div>
  )
}
