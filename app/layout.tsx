import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-5BZR9TWG9N'

// OneSignal App ID
const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
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
        
        {/* OneSignal Push Notifications */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "${ONESIGNAL_APP_ID}",
                allowLocalhostAsSecureOrigin: true,
                promptOptions: {
                  slidedown: {
                    prompts: [
                      {
                        type: "push",
                        autoPrompt: true,
                        text: {
                          actionMessage: "Get notified about new matches and messages!",
                          acceptButton: "Subscribe",
                          cancelButton: "Later"
                        },
                        delay: {
                          pageViews: 1,
                          timeDelay: 3
                        }
                      }
                    ]
                  }
                },
                welcomeNotification: {
                  title: "🦎 I4IGUANA",
                  message: "You'll get notified about matches and messages!"
                }
              });
              console.log('✅ OneSignal initialized!');
              
              // Auto prompt after 3 seconds
              setTimeout(async () => {
                const permission = await OneSignal.Notifications.permission;
                if (!permission) {
                  console.log('📢 Showing notification prompt...');
                  await OneSignal.Slidedown.promptPush();
                }
              }, 3000);
            });
          `}
        </Script>
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="I4IGUANA" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
