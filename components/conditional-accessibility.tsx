"use client"

import { usePathname } from 'next/navigation'
import AccessibilityWidget from './accessibility-widget'

export default function ConditionalAccessibility() {
  const pathname = usePathname()
  
  // Show accessibility widget ONLY on website pages, NOT in the app or download page
  const isAppPage = pathname?.startsWith('/app') || 
                    pathname?.startsWith('/onboarding') ||
                    pathname?.startsWith('/profile') ||
                    pathname?.startsWith('/discover') ||
                    pathname?.startsWith('/matches') ||
                    pathname?.startsWith('/chat') ||
                    pathname?.startsWith('/settings') ||
                    pathname?.startsWith('/download') ||
                    pathname?.startsWith('/checkin')
  
  // Don't show in app pages or download page
  if (isAppPage) {
    return null
  }
  
  // Show on landing page, /join, /about, /privacy, /terms, etc.
  return <AccessibilityWidget />
}
