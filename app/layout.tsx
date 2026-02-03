import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { LanguageProvider } from '@/lib/LanguageContext'  // ✅ NEW: Multi-language support
import Script from 'next/script'
import SentryInit from '@/components/sentry-init'  // ✅ Error monitoring
// ❌ REMOVED: Accessibility widget - not needed for app
// import ConditionalAccessibility from '@/components/conditional-accessibility'

const inter = Inter({ subsets: ['latin'] })

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-5BZR9TWG9N'

// OneSignal App ID
const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7'

// App Version - increment this to force cache clear on all users
const APP_VERSION = '2.8.23'  // ✅ FIX: Delete account + fresh onboarding + language selection

export const metadata: Metadata = {
  title: 'I4IGUANA - Meet Now',
  description: 'Proximity-based dating app - Meet people within 10-500 meters instantly',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'I4IGUANA',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,  // ✅ ZOOM LOCK: Prevent zoom out
  maximumScale: 1,  // ✅ ZOOM LOCK: Prevent zoom in
  userScalable: false,  // ✅ ZOOM LOCK: Disable user scaling
  themeColor: '#4ade80',
  viewportFit: 'cover',  // ✅ FIX: Enable safe area insets
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: '#0d2920' }}>
      <head>
        {/* 🛡️ PREVENT GOOGLE DICTIONARY / TEXT SELECTION POPUP - ONLY IN /app */}
        <Script id="prevent-text-selection" strategy="beforeInteractive">
          {`
            (function() {
              // Only run on /app route
              if (!window.location.pathname.startsWith('/app')) {
                return;
              }
              
              // Prevent text selection globally (except in input/textarea)
              document.addEventListener('selectstart', function(e) {
                var tagName = e.target.tagName.toLowerCase();
                if (tagName !== 'input' && tagName !== 'textarea') {
                  e.preventDefault();
                }
              });
              
              // Prevent context menu (long press)
              document.addEventListener('contextmenu', function(e) {
                var tagName = e.target.tagName.toLowerCase();
                if (tagName !== 'input' && tagName !== 'textarea') {
                  e.preventDefault();
                }
              });
              
              // Prevent copy on non-input elements
              document.addEventListener('copy', function(e) {
                var tagName = e.target.tagName.toLowerCase();
                if (tagName !== 'input' && tagName !== 'textarea') {
                  e.preventDefault();
                }
              });
              
              console.log('🛡️ Text selection prevention enabled for /app');
            })();
          `}
        </Script>
        
        {/* 🔒 ZOOM PREVENTION REMOVED FROM WEBSITE - Only needed in PWA app mode */}
        {/* The /app route has its own handling */}
        
        {/* Auto Cache Clear on Version Change - FIXED: Don't break OneSignal! */}
        <Script id="cache-clear" strategy="beforeInteractive">
          {`
            (function() {
              var APP_VERSION = "${APP_VERSION}";
              var storedVersion = localStorage.getItem('app_version');
              
              if (storedVersion !== APP_VERSION) {
                console.log('🔄 New version detected! Clearing app cache...');
                
                // Clear only OUR caches (NOT OneSignal!)
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) {
                      // ✅ Only delete i4iguana caches, preserve OneSignal
                      if (name.startsWith('i4iguana-')) {
                        console.log('🗑️ Deleting cache:', name);
                        caches.delete(name);
                      }
                    });
                  });
                }
                
                // ⚠️ DO NOT unregister service workers!
                // OneSignal needs its SW for push notifications!
                // The SW will update itself via skipWaiting()
                
                // Save new version
                localStorage.setItem('app_version', APP_VERSION);
                
                // Reload if this isn't the first visit
                if (storedVersion) {
                  console.log('🔄 Reloading with fresh cache...');
                  window.location.reload();
                }
              }
            })();
          `}
        </Script>

        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        
        {/* OneSignal Push Notifications - NO AUTO PROMPT */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "e0009025-1eac-434c-ba27-353c60b0fcf7",
                allowLocalhostAsSecureOrigin: true,
                autoResubscribe: true,
                notifyButton: {
                  enable: false
                },
                serviceWorkerParam: {
                  scope: '/'
                },
                serviceWorkerPath: '/OneSignalSDKWorker.js',
                notificationClickHandlerMatch: 'origin',
                notificationClickHandlerAction: 'focus',
                // ✅ FIX: Set default launch URL to app
                path: '/app',
                welcomeNotification: {
                  title: "🦎 I4IGUANA",
                  message: "You'll now receive match notifications!",
                  url: "/app"
                }
              });
              
              // ✅ Handle notification clicks - navigate to chat!
              OneSignal.Notifications.addEventListener('click', function(event) {
                console.log('🔔 Notification clicked:', event);
                
                // ✅ v2.8.22: Get matchId from notification data
                const data = event.notification?.additionalData || event.notification?.data || {};
                console.log('🔔 Notification data:', data);
                
                if (data.matchId) {
                  // ✅ Save matchId to localStorage so app can open chat
                  localStorage.setItem('i4iguana_pending_chat_matchId', data.matchId);
                  console.log('🔔 Saved matchId for chat:', data.matchId);
                }
                
                // ✅ v2.8.26 FIX: Check if we're EXACTLY on /app (not admin or other pages)
                const currentPath = window.location.pathname;
                const isExactlyInApp = currentPath === '/app' || currentPath.startsWith('/app/');
                
                console.log('🔔 Current path:', currentPath, 'isExactlyInApp:', isExactlyInApp);
                
                if (isExactlyInApp) {
                  // ✅ App is already open - just dispatch event to trigger navigation
                  console.log('🔔 App already open - dispatching notification event (NO RELOAD)');
                  window.dispatchEvent(new CustomEvent('i4iguana-notification-click', { 
                    detail: { matchId: data.matchId, type: data.type || 'message' }
                  }));
                } else {
                  // ✅ Not in app (could be admin, homepage, etc) - navigate to /app
                  console.log('🔔 Not in /app - navigating to /app');
                  window.location.href = '/app';
                }
              });
              
              console.log('✅ OneSignal initialized (no auto-prompt)');
            });
          `}
        </Script>
        
        {/* ✅ PWA Install + Notification Permission Handler */}
        <Script id="pwa-install-handler" strategy="afterInteractive">
          {`
            // Store the install prompt for later
            let deferredPrompt = null;
            
            window.addEventListener('beforeinstallprompt', (e) => {
              console.log('📱 PWA install prompt available');
              deferredPrompt = e;
            });
            
            // ✅ When PWA is installed, also request notification permission
            window.addEventListener('appinstalled', async () => {
              console.log('📱 PWA installed! Requesting notification permission...');
              deferredPrompt = null;
              
              // Request notification permission after install
              if ('Notification' in window && Notification.permission === 'default') {
                try {
                  const permission = await Notification.requestPermission();
                  console.log('🔔 Notification permission after PWA install:', permission);
                  
                  if (permission === 'granted') {
                    // Setup OneSignal
                    const OneSignal = window.OneSignal;
                    if (OneSignal && OneSignal.User) {
                      await OneSignal.User.PushSubscription.optIn();
                      console.log('✅ OneSignal subscribed after PWA install');
                    }
                  }
                } catch (err) {
                  console.log('⚠️ Notification permission error:', err);
                }
              }
            });
            
            // ✅ Pull-to-refresh prevention - ONLY for /app route!
            if (window.location.pathname.startsWith('/app')) {
              let touchStartY = 0;
              document.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
              }, { passive: true });
              
              document.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                
                if (scrollTop <= 0 && touchY > touchStartY) {
                  const target = e.target;
                  if (target && target.closest) {
                    const scrollableParent = target.closest('[data-scrollable]');
                    if (scrollableParent && scrollableParent.scrollTop <= 0) {
                      return;
                    }
                  }
                }
              }, { passive: true });
              console.log('🔄 Pull-to-refresh prevention active on /app');
            }
          `}
        </Script>
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="I4IGUANA" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body 
        className={inter.className} 
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          backgroundColor: '#0d2920',  // ✅ v2.8.24: Prevent white bars on iOS
          // ✅ FIX: Removed touch-action, overscroll, user-select from body 
          // These were blocking scroll on website! PWA has its own settings.
        }}
      >
        {/* ✅ CRITICAL: HTML Splash Screen - Shows IMMEDIATELY before React loads */}
        <div 
          id="html-splash" 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom, #1a4d3e, #0d2920, #051410)',
          }}
        >
          {/* Iguana Radar Image */}
          <img 
            src="/iguana-radar.jpg" 
            alt="I4IGUANA"
            style={{
              width: '256px',
              height: '176px',
              objectFit: 'cover',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(74, 222, 128, 0.4)',
            }}
          />
          
          {/* App Name */}
          <h1 style={{
            marginTop: '40px',
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '0.1em',
          }}>
            I4IGUANA
          </h1>
          
          {/* Tagline */}
          <p style={{
            marginTop: '12px',
            fontSize: '18px',
            color: '#4ade80',
            fontWeight: '500',
          }}>
            Meet Now
          </p>
          
          {/* Loading Dots */}
          <div style={{
            position: 'absolute',
            bottom: '64px',
            display: 'flex',
            gap: '8px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              animation: 'pulse 0.8s ease-in-out infinite',
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              animation: 'pulse 0.8s ease-in-out infinite 0.15s',
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              animation: 'pulse 0.8s ease-in-out infinite 0.3s',
            }}></div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes pulse {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.4); }
            }
          `}} />
        </div>
        
        {/* Script to hide HTML splash when React is ready */}
        <Script id="hide-html-splash" strategy="afterInteractive">
          {`
            // Hide HTML splash after a short delay to let React take over
            setTimeout(function() {
              var splash = document.getElementById('html-splash');
              if (splash) {
                splash.style.transition = 'opacity 0.3s ease-out';
                splash.style.opacity = '0';
                setTimeout(function() {
                  splash.style.display = 'none';
                }, 300);
              }
            }, 500);
          `}
        </Script>
        
        {/* 🔒 v2.8.17: iOS PWA FIX - ONLY for /app route! */}
        <Script id="ios-pwa-fix" strategy="afterInteractive">
          {`
            (function() {
              // ✅ CRITICAL: Only run on /app route - NOT on main website!
              var isAppRoute = window.location.pathname.startsWith('/app');
              
              if (!isAppRoute) {
                console.log('📐 PWA fix skipped - not in /app');
                return;
              }
              
              console.log('📐 PWA fix active on /app');
              
              // ✅ Add PWA mode class to enable fixed positioning CSS
              document.documentElement.classList.add('pwa-app-mode');
              
              // ✅ CRITICAL: Set app height ONCE and DON'T update on resize!
              // This is the key to preventing jumping - resize events happen when
              // Safari's toolbar appears/disappears, causing the viewport to change.
              // By NOT updating, we keep the height stable.
              var initialHeight = window.innerHeight;
              document.documentElement.style.setProperty('--app-height', initialHeight + 'px');
              console.log('📐 Initial app height set to:', initialHeight + 'px');
              
              // ✅ ONLY update on orientation change (landscape <-> portrait)
              window.addEventListener('orientationchange', function() {
                // Wait for orientation to settle
                setTimeout(function() {
                  var newHeight = window.innerHeight;
                  document.documentElement.style.setProperty('--app-height', newHeight + 'px');
                  console.log('📐 Orientation changed, new height:', newHeight + 'px');
                }, 300);
              });
              
              // ✅ Prevent iOS Safari bounce/rubber-band effect on body
              document.body.addEventListener('touchmove', function(e) {
                // Only prevent default on body itself, not on scrollable children
                if (e.target === document.body) {
                  e.preventDefault();
                }
              }, { passive: false });
            })();
          `}
        </Script>
        
        {/* 🔒 v2.8.17: PORTRAIT LOCK - REAL LOCK (not just overlay!) */}
        <Script id="portrait-lock" strategy="beforeInteractive">
          {`
            (function() {
              // ✅ TRY 1: Screen Orientation API (best method for PWA!)
              function lockPortrait() {
                if (screen.orientation && screen.orientation.lock) {
                  screen.orientation.lock('portrait-primary')
                    .then(function() {
                      console.log('🔒 Screen locked to portrait via Orientation API!');
                    })
                    .catch(function(err) {
                      console.log('⚠️ Orientation lock not supported:', err.message);
                      // Fallback to overlay method
                      setupOverlay();
                    });
                } else {
                  console.log('⚠️ Screen Orientation API not available');
                  setupOverlay();
                }
              }
              
              // ✅ TRY 2: Fallback - show overlay when in landscape
              function setupOverlay() {
                function checkOrientation() {
                  var blocker = document.getElementById('landscape-blocker');
                  var appContent = document.getElementById('app-content');
                  
                  var width = window.innerWidth || document.documentElement.clientWidth;
                  var height = window.innerHeight || document.documentElement.clientHeight;
                  
                  var isLandscape = width > height;
                  var isPhone = height < 600;
                  var shouldBlock = isLandscape && isPhone;
                  
                  if (blocker) {
                    blocker.style.display = shouldBlock ? 'flex' : 'none';
                    
                    // ✅ v2.8.26: Show correct language text
                    if (shouldBlock) {
                      var savedLang = localStorage.getItem('i4iguana_language') || 'en';
                      var textEn = document.getElementById('landscape-text-en');
                      var textHe = document.getElementById('landscape-text-he');
                      if (textEn && textHe) {
                        textEn.style.display = savedLang === 'he' ? 'none' : 'block';
                        textHe.style.display = savedLang === 'he' ? 'block' : 'none';
                      }
                    }
                  }
                  
                  if (appContent) {
                    if (shouldBlock) {
                      appContent.style.display = 'none';
                      appContent.style.visibility = 'hidden';
                    } else {
                      appContent.style.display = '';
                      appContent.style.visibility = 'visible';
                    }
                  }
                }
                
                window.addEventListener('orientationchange', function() {
                  setTimeout(checkOrientation, 50);
                  setTimeout(checkOrientation, 150);
                });
                window.addEventListener('resize', checkOrientation);
                setInterval(checkOrientation, 500);
                checkOrientation();
              }
              
              // ✅ TRY 3: iOS specific - prevent zoom & orientation
              var meta = document.querySelector('meta[name="viewport"]');
              if (meta) {
                meta.setAttribute('content', 
                  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
                );
              }
              
              // Run when DOM is ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', lockPortrait);
              } else {
                lockPortrait();
              }
              
              // Also try when page fully loads (for PWA)
              window.addEventListener('load', lockPortrait);
            })();
          `}
        </Script>
        
        <AuthProvider>
          <SentryInit /> {/* ✅ Error monitoring */}
          <LanguageProvider>
            {/* 🔒 PORTRAIT LOCK - Landscape blocker overlay */}
            {/* ✅ v2.8.26: Added Hebrew support */}
            <div className="landscape-blocker" id="landscape-blocker">
              <div className="landscape-blocker-icon">📱</div>
              <div className="landscape-blocker-text" id="landscape-text-en">
                Please rotate your device to portrait mode
              </div>
              <div className="landscape-blocker-text" id="landscape-text-he" style={{ display: 'none', direction: 'rtl' }}>
                נא לסובב את המכשיר למצב אנכי
              </div>
              <div style={{ fontSize: '3rem' }}>🔄</div>
            </div>
            
            <div id="app-content">
              {children}
            </div>
          </LanguageProvider>
          {/* ❌ REMOVED: Accessibility widget - not needed for app */}
        </AuthProvider>
      </body>
    </html>
  )
}
