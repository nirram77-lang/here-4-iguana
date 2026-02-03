'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PilotButton from '@/components/PilotButton'
import VenueTicker from '@/components/VenueTicker'

export default function BrazilianLandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleShare = async (method: string) => {
    const url = 'https://i4iguana.com/br'
    const title = 'I4IGUANA - Encontros em Tempo Real'
    const text = 'Conheça pessoas reais perto de você! Sem swipes infinitos. Encontros reais. Agora.'

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        break
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`, '_blank')
        break
      case 'copy':
        await navigator.clipboard.writeText(url)
        alert('Link copiado!')
        break
      case 'native':
        if (navigator.share) {
          await navigator.share({ title, text, url })
        }
        break
    }
    setShowShareMenu(false)
  }

  return (
    <div 
      className="min-h-screen bg-[#0a1f1a] text-white overflow-x-hidden landing-page"
    >
      
      {/* Floating Hearts */}
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
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/br" className="flex items-center gap-2">
                <div className="w-9 h-9 md:w-11 md:h-11 relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full animate-pulse opacity-50"></div>
                  <img 
                    src="/notification-icon-192.png" 
                    alt="I4IGUANA" 
                    className="w-9 h-9 md:w-11 md:h-11 relative z-10"
                  />
                </div>
                <span className="hidden md:block text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  I4IGUANA
                </span>
              </Link>
              
              {/* Launch Pilot Button */}
              <div className="relative z-[60]">
                <PilotButton lang="pt" />
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-gray-300 hover:text-green-400 transition-colors">Como Funciona</a>
              <a href="#features" className="text-gray-300 hover:text-green-400 transition-colors">Recursos</a>
              <a href="#for-venues" className="text-gray-300 hover:text-green-400 transition-colors">Para Locais</a>
              <a href="#download" className="text-gray-300 hover:text-green-400 transition-colors">Download</a>
              
              {/* Language Switcher - SVG flags like Hebrew site */}
              <Link 
                href="/"
                className="group relative px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white hover:bg-white/20 hover:border-white/50 transition-all flex items-center gap-1.5"
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
              <Link 
                href="/he"
                className="group relative px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white hover:bg-white/20 hover:border-white/50 transition-all flex items-center gap-1.5"
              >
                <svg className="w-5 h-4" viewBox="0 0 640 480">
                  <path fill="#fff" d="M0 0h640v480H0z"/>
                  <path fill="#0038b8" d="M0 48h640v56H0zM0 376h640v56H0z"/>
                  <path fill="#0038b8" d="M320 144l-55.43 96h110.86L320 144zm0 192l55.43-96H264.57L320 336z"/>
                </svg>
                <span>HE</span>
              </Link>

              <Link 
                href="/join"
                className="px-4 py-2 border-2 border-green-500 text-green-400 rounded-full font-semibold hover:bg-green-500/10 transition-all flex items-center gap-2"
              >
                <span>🏪</span>
                <span>Seja Parceiro</span>
              </Link>

              <Link 
                href="/app"
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all"
              >
                Abrir App
              </Link>
            </div>

            {/* Mobile Menu Button + Language Buttons */}
            <div className="md:hidden flex items-center gap-1.5">
              {/* Language Switcher - Mobile Header */}
              <Link 
                href="/"
                className="flex items-center gap-1 px-2 py-1 bg-white/10 border border-white/30 rounded-full text-xs font-bold text-white"
              >
                <svg className="w-4 h-3" viewBox="0 0 640 480">
                  <path fill="#012169" d="M0 0h640v480H0z"/>
                  <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                  <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                  <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                  <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                </svg>
                <span>EN</span>
              </Link>
              <Link 
                href="/he"
                className="flex items-center gap-1 px-2 py-1 bg-white/10 border border-white/30 rounded-full text-xs font-bold text-white"
              >
                <svg className="w-4 h-3" viewBox="0 0 640 480">
                  <path fill="#fff" d="M0 0h640v480H0z"/>
                  <path fill="#0038b8" d="M0 48h640v56H0zM0 376h640v56H0z"/>
                  <path fill="#0038b8" d="M320 144l-55.43 96h110.86L320 144zm0 192l55.43-96H264.57L320 336z"/>
                </svg>
                <span>HE</span>
              </Link>
              
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2"
              >
                <div className="w-6 h-5 flex flex-col justify-between">
                  <span className={`w-full h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`w-full h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`w-full h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a1f1a] border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">Como Funciona</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">Recursos</a>
              <a href="#for-venues" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">Para Locais</a>
              <a href="#download" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">Download</a>
              
              {/* Language Switcher - Mobile */}
              <div className="flex items-center gap-2 py-2">
                <Link href="/" className="px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white flex items-center gap-1.5">
                  <svg className="w-5 h-4" viewBox="0 0 640 480">
                    <path fill="#012169" d="M0 0h640v480H0z"/>
                    <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                    <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                  </svg>
                  <span>EN</span>
                </Link>
                <Link href="/he" className="px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white flex items-center gap-1.5">
                  <svg className="w-5 h-4" viewBox="0 0 640 480">
                    <path fill="#fff" d="M0 0h640v480H0z"/>
                    <path fill="#0038b8" d="M0 48h640v56H0zM0 376h640v56H0z"/>
                    <path fill="#0038b8" d="M320 144l-55.43 96h110.86L320 144zm0 192l55.43-96H264.57L320 336z"/>
                  </svg>
                  <span>HE</span>
                </Link>
              </div>

              {/* Share - Mobile */}
              <div className="flex items-center gap-2 py-2">
                <button onClick={() => handleShare('whatsapp')} className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-sm font-bold text-white">
                  💬 WhatsApp
                </button>
                <button onClick={() => handleShare('copy')} className="px-3 py-1.5 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white">
                  🔗 Copiar
                </button>
              </div>

              <Link href="/br/terms" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-green-400 py-2">Termos de Uso</Link>
              <Link 
                href="/app"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold mt-4"
              >
                Abrir App
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FLOATING VENUE TICKER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block fixed left-4 top-24 z-40">
        <VenueTicker lang="pt" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f1a] via-transparent to-[#0a1f1a] z-10"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" style={{animationDelay: '1s'}}></div>
          
          {/* Radar Effect - Static rings for stability */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <div className="absolute inset-0 border border-green-500/20 rounded-full opacity-50"></div>
            <div className="absolute inset-8 border border-green-500/30 rounded-full opacity-50"></div>
            <div className="absolute inset-16 border border-green-500/40 rounded-full opacity-50"></div>
          </div>

          {/* Iguana Mascot */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-20"
            style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.1}px)` }}
          >
            <img src="/notification-icon-512.png" alt="" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-8 animate-fadeIn">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 text-sm font-medium">Revolução dos Encontros em Tempo Real</span>
          </div>

          {/* Main Heading - Hollywood Style */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-8 leading-tight animate-fadeInUp">
            <span className="text-white block mb-2">
              Telas não criam química.
            </span>
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(74,222,128,0.6)]">
              Encontros reais sim
            </span>
            <span className="inline-block w-3 h-3 md:w-4 md:h-4 bg-green-400 rounded-full animate-pulse ml-1 shadow-[0_0_20px_rgba(74,222,128,0.8)]"></span>
          </h1>
          
          {/* Layer 2 - Sharp clarification with Hollywood colors */}
          <p className="text-xl md:text-2xl mb-8 animate-fadeInUp" style={{animationDelay: '0.5s'}}>
            <span className="text-white/70">Sem swipes infinitos. Sem joguinhos.</span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]">Encontro real.</span>
            {' '}
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]">Agora.</span>
          </p>

          {/* Layer 3 - Details with colors */}
          <p className="text-lg md:text-xl mb-4 animate-fadeInUp" style={{animationDelay: '0.8s'}}>
            <span className="text-pink-400">Pessoas reais.</span>
            {' '}
            <span className="text-white">Lugares reais.</span>
            {' '}
            <span className="text-green-400 font-semibold">10-500 metros de você.</span>
          </p>
          
          {/* She Decides */}
          <p className="text-lg md:text-xl text-pink-400 font-semibold mb-10 animate-fadeInUp flex items-center justify-center gap-2" style={{animationDelay: '1s'}}>
            <span className="text-pink-500">💜</span>
            <span>Ela decide. Vocês se encontram.</span>
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-3 animate-fadeInUp" style={{animationDelay: '1.2s'}}>
            <Link 
              href="/app"
              className="group px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-3"
            >
              <span>Abrir App</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-white/40 text-sm">Sem compromisso. Sem complicação.</span>
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
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como <span className="text-green-400">Funciona</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Três passos simples para conhecer alguém especial por perto
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
                <h3 className="text-2xl font-bold mb-4">Faça Check-In</h3>
                <p className="text-gray-400">
                  Chegue em um estabelecimento parceiro - bar, café ou evento. Escaneie o QR code para fazer check-in e ficar online.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">Verificado por GPS</span>
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
                <h3 className="text-2xl font-bold mb-4">Descubra</h3>
                <p className="text-gray-400">
                  Veja quem está por perto, entre 10-500 metros. Perfis reais, fotos reais, pessoas reais - agora mesmo.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm">Perfis Verificados</span>
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
                <h3 className="text-2xl font-bold mb-4">Ela Decide</h3>
                <p className="text-gray-400">
                  As mulheres estão no controle. Ela escolhe quem conhecer. Se houver match - vocês se encontram na hora. Sem espera.
                </p>
                <div className="mt-6 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm">Encontros Instantâneos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FEATURES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-[#0d2920] to-[#0a1f1a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Por que <span className="text-green-400">I4IGUANA</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Construído para conexões reais, não para swipes infinitos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#1a4d3e]/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Baseado em Proximidade</h3>
              <p className="text-gray-400">
                Conheça pessoas que estão realmente por perto. 10-500 metros. Sem matches do outro lado da cidade.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#1a4d3e]/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">👩</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Mulheres no Controle</h3>
              <p className="text-gray-400">
                Ela decide quando e se encontrar. Ambiente seguro onde as mulheres ditam as regras.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#1a4d3e]/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Tempo Real</h3>
              <p className="text-gray-400">
                Sem espera por mensagens. Sem matches antigos. Veja quem está disponível agora e conheça hoje.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#1a4d3e]/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Verificado por GPS</h3>
              <p className="text-gray-400">
                Perfis verificados por localização. Você sabe que eles estão realmente lá.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#1a4d3e]/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Check-in em Estabelecimentos</h3>
              <p className="text-gray-400">
                Escaneie o QR em bares e eventos parceiros. Encontre outros solteiros no mesmo lugar.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#1a4d3e]/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💕</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Conexões Reais</h3>
              <p className="text-gray-400">
                Chega de swipes infinitos. Chega de joguinhos. Conheça alguém especial esta noite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FOR VENUES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="for-venues" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
                <span className="text-purple-400">🏪</span>
                <span className="text-purple-400 text-sm font-medium">Para Estabelecimentos</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Transforme seu <span className="text-green-400">Estabelecimento</span> em um Ponto de Encontro
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Faça parceria com I4IGUANA e atraia solteiros para seu bar, café ou evento. 
                Aumente o movimento enquanto ajuda as pessoas a se conectarem.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Materiais de marketing gratuitos (QR codes, adesivos)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Painel de administração para gerenciar check-ins</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Envie anúncios para usuários com check-in</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Análises para acompanhar engajamento</span>
                </li>
              </ul>

              <Link 
                href="/join?lang=pt"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                <span>Seja um Parceiro</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Image/Stats Side */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-[#0d2920] rounded-2xl p-8 border border-green-500/20">
                <h3 className="text-2xl font-bold mb-6 text-center">Por que fazer parceria?</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center text-3xl">
                      📈
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">+40%</div>
                      <div className="text-gray-400">Mais movimento</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center text-3xl">
                      🎯
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">Solteiros</div>
                      <div className="text-gray-400">Público-alvo direto</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-pink-500/20 rounded-xl flex items-center justify-center text-3xl">
                      💰
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-pink-400">Grátis</div>
                      <div className="text-gray-400">Sem custos de adesão</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DOWNLOAD / CTA */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="download" className="py-24 px-6 bg-gradient-to-b from-[#0a1f1a] to-[#0d2920]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para <span className="text-green-400">Conhecer Alguém</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Baixe I4IGUANA e comece a conhecer pessoas reais perto de você. Disponível na web - nenhum app store necessário.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/app"
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>🦎</span>
              <span>Abrir App Web</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            PWA - Funciona em qualquer dispositivo. Adicione à tela inicial para a melhor experiência.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CONTACT */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-24 px-6 bg-[#0d2920]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Entre em <span className="text-green-400">Contato</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Tem perguntas? Quer fazer parceria? Adoraríamos ouvir você.
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
                Revolução dos encontros em tempo real. Conheça pessoas reais em lugares reais.
                Sem swipes infinitos. Sem joguinhos. Encontros reais. Agora.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <div className="space-y-2">
                <a href="#how-it-works" className="block text-gray-400 hover:text-green-400 transition-colors">Como Funciona</a>
                <a href="#features" className="block text-gray-400 hover:text-green-400 transition-colors">Recursos</a>
                <a href="#download" className="block text-gray-400 hover:text-green-400 transition-colors">Download</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/br/terms" className="block text-gray-400 hover:text-green-400 transition-colors">Termos de Uso</Link>
                <Link href="/br/privacy" className="block text-gray-400 hover:text-green-400 transition-colors">Política de Privacidade</Link>
                <a href="#contact" className="block text-gray-400 hover:text-green-400 transition-colors">Contato</a>
              </div>
            </div>
          </div>

          {/* Language Switcher - Footer */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Link href="/" className="px-4 py-2 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white hover:bg-white/20 transition-all flex items-center gap-2">
              <svg className="w-5 h-4" viewBox="0 0 640 480">
                <path fill="#012169" d="M0 0h640v480H0z"/>
                <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
              </svg>
              <span>English</span>
            </Link>
            <Link href="/he" className="px-4 py-2 bg-white/10 border border-white/30 rounded-full text-sm font-bold text-white hover:bg-white/20 transition-all flex items-center gap-2">
              <svg className="w-5 h-4" viewBox="0 0 640 480">
                <path fill="#fff" d="M0 0h640v480H0z"/>
                <path fill="#0038b8" d="M0 57.6h640v48H0zm0 316.8h640v48H0z"/>
                <path fill="#0038b8" d="M320 146.4l-54.6 94.6h109.2zm0 187.2l-54.6-94.6h109.2zm0-160.8l-54.6 94.6 54.6 31.8 54.6-31.8zm0 134.4l-54.6-94.6 54.6-31.8 54.6 31.8z" fillRule="evenodd"/>
              </svg>
              <span>עברית</span>
            </Link>
            <span className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-sm font-bold text-green-400 flex items-center gap-2">
              <svg className="w-5 h-4" viewBox="0 0 640 480">
                <path fill="#229e45" d="M0 0h640v480H0z"/>
                <path fill="#f8e509" d="M321.4 36.2L594.8 240l-273.4 203.8L48 240z"/>
                <circle fill="#2b49a3" cx="321.4" cy="240" r="68.8"/>
                <path fill="#fff" d="M270 210c30-18 73-18 103 0-3 8-8 15-15 20-25-14-48-14-73 0-7-5-12-12-15-20z"/>
              </svg>
              <span>Português</span>
            </span>
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
              © {new Date().getFullYear()} I4IGUANA. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Feito com</span>
              <span className="text-pink-400 animate-pulse">💕</span>
              <span>em Israel</span>
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
