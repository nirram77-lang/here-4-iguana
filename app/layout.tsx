import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import Script from 'next/script'
import ConditionalAccessibility from '@/components/conditional-accessibility'

const inter = Inter({ subsets: ['latin'] })

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-5BZR9TWG9N'

// OneSignal App ID
const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7'

// App Version - increment this to force cache clear on all users
const APP_VERSION = '2.2.0'

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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4ade80',
  viewportFit: 'cover',  // ✅ FIX: Enable safe area insets
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Auto Cache Clear on Version Change */}
        <Script id="cache-clear" strategy="beforeInteractive">
          {`
            (function() {
              var APP_VERSION = "${APP_VERSION}";
              var storedVersion = localStorage.getItem('app_version');
              
              if (storedVersion !== APP_VERSION) {
                console.log('🔄 New version detected! Clearing cache...');
                
                // Clear all caches
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) {
                      caches.delete(name);
                    });
                  });
                }
                
                // Clear service workers
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                      registration.unregister();
                    });
                  });
                }
                
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
              
              // ✅ Handle notification clicks - navigate to app
              OneSignal.Notifications.addEventListener('click', function(event) {
                console.log('🔔 Notification clicked:', event);
                // Navigate to app
                window.location.href = '/app';
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
            
            // ✅ CRITICAL: Prevent browser's native pull-to-refresh
            // This prevents the page from reloading when user pulls down
            let touchStartY = 0;
            document.addEventListener('touchstart', (e) => {
              touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            document.addEventListener('touchmove', (e) => {
              const touchY = e.touches[0].clientY;
              const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
              
              // If at top of page and pulling down, prevent default
              if (scrollTop <= 0 && touchY > touchStartY) {
                // Check if any scrollable element is at top
                const target = e.target;
                if (target && target.closest) {
                  const scrollableParent = target.closest('[data-scrollable]');
                  if (scrollableParent && scrollableParent.scrollTop <= 0) {
                    // Allow internal pull-to-refresh, block browser's
                    return;
                  }
                }
              }
            }, { passive: true });
          `}
        </Script>
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="I4IGUANA" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className} style={{ overscrollBehavior: 'none', overscrollBehaviorY: 'none' }}>
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
        
        <AuthProvider>
          {children}
          <ConditionalAccessibility />
        </AuthProvider>
      </body>
    </html>
  )
}
