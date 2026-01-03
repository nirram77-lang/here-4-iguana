'use client'

// components/sentry-init.tsx
// ✅ Initialize Sentry on client side

import { useEffect } from 'react'
import { sentry, setupGlobalErrorHandlers } from '@/lib/sentry'

export default function SentryInit() {
  useEffect(() => {
    // Initialize Sentry
    sentry.init()
    
    // Setup global error handlers
    setupGlobalErrorHandlers()
    
    // Set app context
    sentry.setTag('app_version', '2.8.23')
    sentry.setContext('app', {
      name: 'I4IGUANA',
      version: '2.8.23',
      platform: typeof window !== 'undefined' ? 
        (/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 
         /Android/.test(navigator.userAgent) ? 'Android' : 'Web') : 'Unknown'
    })
    
  }, [])

  return null // This component doesn't render anything
}

// Hook to use Sentry in components
export function useSentry() {
  const captureError = (error: Error | string, context?: Record<string, any>) => {
    sentry.captureError(error, context)
  }

  const setUser = (userId: string, email?: string, phone?: string) => {
    sentry.setUser(userId, email, phone)
  }

  const clearUser = () => {
    sentry.clearUser()
  }

  const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
    sentry.addBreadcrumb(message, category, data)
  }

  return {
    captureError,
    setUser,
    clearUser,
    addBreadcrumb,
  }
}
