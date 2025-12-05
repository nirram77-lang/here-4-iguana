'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize OneSignal when script loads
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        welcomeNotification: {
          title: "🦎 I4IGUANA",
          message: "You'll get notified about matches and messages!",
        }
      });
      console.log('✅ OneSignal initialized!');
    });
  }, []);

  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}

// TypeScript declarations
declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}
