// ═══════════════════════════════════════════════════════════════════════════
// 🦎 I4IGUANA - Google Analytics Events Service
// Comprehensive tracking for all app activities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send event to Google Analytics
 */
const sendGAEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined') return
  
  const gtag = (window as any).gtag
  if (!gtag) {
    console.warn('⚠️ gtag not available')
    return
  }
  
  gtag('event', eventName, {
    ...params,
    app_name: 'I4IGUANA',
    app_version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
  
  console.log(`📊 GA Event: ${eventName}`, params || '')
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 USER AUTHENTICATION EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export const GA = {
  // ─────────────────────────────────────────────────────────────────────────
  // AUTH EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** User signed up (new account created) */
  signUp: (method: 'google' | 'phone') => {
    sendGAEvent('sign_up', {
      method,
      event_category: 'auth',
    })
  },
  
  /** User logged in */
  login: (method: 'google' | 'phone') => {
    sendGAEvent('login', {
      method,
      event_category: 'auth',
    })
  },
  
  /** User logged out */
  logout: () => {
    sendGAEvent('logout', {
      event_category: 'auth',
    })
  },
  
  /** User deleted account */
  deleteAccount: () => {
    sendGAEvent('delete_account', {
      event_category: 'auth',
    })
  },
  
  /** Phone verification completed */
  phoneVerified: () => {
    sendGAEvent('phone_verified', {
      event_category: 'auth',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ONBOARDING EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Onboarding step completed */
  onboardingStep: (step: string, stepNumber: number) => {
    sendGAEvent('onboarding_step', {
      step_name: step,
      step_number: stepNumber,
      event_category: 'onboarding',
    })
  },
  
  /** Onboarding completed fully */
  onboardingComplete: (totalTimeSeconds: number) => {
    sendGAEvent('onboarding_complete', {
      total_time_seconds: totalTimeSeconds,
      event_category: 'onboarding',
    })
  },
  
  /** Photo uploaded during onboarding */
  photoUploaded: (photoNumber: number, source: 'camera' | 'gallery') => {
    sendGAEvent('photo_uploaded', {
      photo_number: photoNumber,
      source,
      event_category: 'onboarding',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK-IN EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** QR code scanned */
  qrScanned: (venueId: string, venueName: string) => {
    sendGAEvent('qr_scanned', {
      venue_id: venueId,
      venue_name: venueName,
      event_category: 'checkin',
    })
  },
  
  /** User checked into venue */
  checkIn: (venueId: string, venueName: string) => {
    sendGAEvent('check_in', {
      venue_id: venueId,
      venue_name: venueName,
      event_category: 'checkin',
    })
  },
  
  /** User checked out of venue */
  checkOut: (venueId: string, venueName: string, durationMinutes: number) => {
    sendGAEvent('check_out', {
      venue_id: venueId,
      venue_name: venueName,
      duration_minutes: durationMinutes,
      event_category: 'checkin',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MATCHING EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** User swiped on a profile */
  swipe: (direction: 'left' | 'right', targetGender: string) => {
    sendGAEvent('swipe', {
      direction,
      target_gender: targetGender,
      event_category: 'matching',
    })
  },
  
  /** User liked someone (swipe right / heart) */
  like: (targetGender: string) => {
    sendGAEvent('like', {
      target_gender: targetGender,
      event_category: 'matching',
    })
  },
  
  /** User passed on someone (swipe left / X) */
  pass: (targetGender: string) => {
    sendGAEvent('pass', {
      target_gender: targetGender,
      event_category: 'matching',
    })
  },
  
  /** Match created! */
  matchCreated: (venueId: string, venueName: string) => {
    sendGAEvent('match_created', {
      venue_id: venueId,
      venue_name: venueName,
      event_category: 'matching',
    })
  },
  
  /** User unmatched someone */
  unmatch: (reason?: string) => {
    sendGAEvent('unmatch', {
      reason: reason || 'not_specified',
      event_category: 'matching',
    })
  },
  
  /** No more profiles available */
  noMoreProfiles: (venueId: string) => {
    sendGAEvent('no_more_profiles', {
      venue_id: venueId,
      event_category: 'matching',
    })
  },
  
  /** User ran out of passes */
  outOfPasses: () => {
    sendGAEvent('out_of_passes', {
      event_category: 'matching',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Chat opened */
  chatOpened: (matchId: string) => {
    sendGAEvent('chat_opened', {
      match_id: matchId,
      event_category: 'chat',
    })
  },
  
  /** Message sent */
  messageSent: (messageLength: number, isFirstMessage: boolean) => {
    sendGAEvent('message_sent', {
      message_length: messageLength,
      is_first_message: isFirstMessage,
      event_category: 'chat',
    })
  },
  
  /** Tip used in chat */
  tipUsed: (tipIndex: number) => {
    sendGAEvent('tip_used', {
      tip_index: tipIndex,
      event_category: 'chat',
    })
  },
  
  /** User clicked "We're Meeting!" */
  meetingConfirmed: (matchId: string) => {
    sendGAEvent('meeting_confirmed', {
      match_id: matchId,
      event_category: 'chat',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PREMIUM / MONETIZATION EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** User viewed premium upsell */
  premiumViewed: (trigger: string) => {
    sendGAEvent('premium_viewed', {
      trigger, // 'out_of_passes', 'settings', 'banner', etc.
      event_category: 'premium',
    })
  },
  
  /** User started checkout */
  checkoutStarted: (plan: string, price: number, currency: string) => {
    sendGAEvent('begin_checkout', {
      currency,
      value: price,
      items: [{
        item_name: plan,
        price,
        quantity: 1,
      }],
      event_category: 'premium',
    })
  },
  
  /** Purchase completed */
  purchase: (plan: string, price: number, currency: string, transactionId: string) => {
    sendGAEvent('purchase', {
      transaction_id: transactionId,
      currency,
      value: price,
      items: [{
        item_name: plan,
        price,
        quantity: 1,
      }],
      event_category: 'premium',
    })
  },
  
  /** User redeemed a promo code */
  promoCodeUsed: (code: string, discount: number) => {
    sendGAEvent('promo_code_used', {
      promo_code: code,
      discount_amount: discount,
      event_category: 'premium',
    })
  },
  
  /** Free pass earned (watch ad, referral, etc.) */
  freePassEarned: (source: string) => {
    sendGAEvent('free_pass_earned', {
      source,
      event_category: 'premium',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Profile viewed (own profile) */
  profileViewed: () => {
    sendGAEvent('profile_viewed', {
      event_category: 'profile',
    })
  },
  
  /** Profile edited */
  profileEdited: (field: string) => {
    sendGAEvent('profile_edited', {
      field_edited: field,
      event_category: 'profile',
    })
  },
  
  /** Search settings changed */
  searchSettingsChanged: (settings: {
    minAge?: number,
    maxAge?: number,
    gender?: string,
    distance?: number,
  }) => {
    sendGAEvent('search_settings_changed', {
      min_age: settings.minAge,
      max_age: settings.maxAge,
      gender_preference: settings.gender,
      distance: settings.distance,
      event_category: 'profile',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATION EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Notification permission requested */
  notificationPermissionRequested: () => {
    sendGAEvent('notification_permission_requested', {
      event_category: 'notifications',
    })
  },
  
  /** Notification permission granted */
  notificationPermissionGranted: () => {
    sendGAEvent('notification_permission_granted', {
      event_category: 'notifications',
    })
  },
  
  /** Notification permission denied */
  notificationPermissionDenied: () => {
    sendGAEvent('notification_permission_denied', {
      event_category: 'notifications',
    })
  },
  
  /** Push notification received (when app is open) */
  notificationReceived: (type: 'match' | 'message' | 'meeting' | 'other') => {
    sendGAEvent('notification_received', {
      notification_type: type,
      event_category: 'notifications',
    })
  },
  
  /** Push notification clicked */
  notificationClicked: (type: 'match' | 'message' | 'meeting' | 'other') => {
    sendGAEvent('notification_clicked', {
      notification_type: type,
      event_category: 'notifications',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION / ENGAGEMENT EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Screen viewed */
  screenView: (screenName: string) => {
    sendGAEvent('screen_view', {
      screen_name: screenName,
      event_category: 'navigation',
    })
  },
  
  /** App opened */
  appOpen: (source: 'direct' | 'notification' | 'link') => {
    sendGAEvent('app_open', {
      source,
      event_category: 'engagement',
    })
  },
  
  /** Session started */
  sessionStart: () => {
    sendGAEvent('session_start', {
      event_category: 'engagement',
    })
  },
  
  /** User engaged for X seconds */
  engagement: (durationSeconds: number) => {
    sendGAEvent('user_engagement', {
      engagement_time_msec: durationSeconds * 1000,
      event_category: 'engagement',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Error occurred */
  error: (errorType: string, errorMessage: string, screen?: string) => {
    sendGAEvent('error', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit length
      screen: screen || 'unknown',
      event_category: 'errors',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WEBSITE EVENTS (Landing Page)
  // ─────────────────────────────────────────────────────────────────────────
  
  /** CTA button clicked */
  ctaClicked: (buttonName: string, location: string) => {
    sendGAEvent('cta_clicked', {
      button_name: buttonName,
      location,
      event_category: 'website',
    })
  },
  
  /** App store link clicked */
  appStoreClicked: (store: 'ios' | 'android' | 'pwa') => {
    sendGAEvent('app_store_clicked', {
      store,
      event_category: 'website',
    })
  },
  
  /** Business inquiry submitted */
  businessInquiry: (venueName: string) => {
    sendGAEvent('business_inquiry', {
      venue_name: venueName,
      event_category: 'website',
    })
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FUNNEL TRACKING
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Track user journey through funnel */
  funnelStep: (funnelName: string, stepNumber: number, stepName: string) => {
    sendGAEvent('funnel_step', {
      funnel_name: funnelName,
      step_number: stepNumber,
      step_name: stepName,
      event_category: 'funnel',
    })
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROPERTIES (Set once per user)
// ═══════════════════════════════════════════════════════════════════════════

export const setUserProperties = (properties: {
  userId?: string
  gender?: string
  ageRange?: string
  isPremium?: boolean
  signUpDate?: string
  city?: string
}) => {
  if (typeof window === 'undefined') return
  
  const gtag = (window as any).gtag
  if (!gtag) return
  
  gtag('set', 'user_properties', {
    user_id: properties.userId,
    gender: properties.gender,
    age_range: properties.ageRange,
    is_premium: properties.isPremium,
    sign_up_date: properties.signUpDate,
    city: properties.city,
  })
  
  // Also set user_id for better tracking
  if (properties.userId) {
    gtag('set', { user_id: properties.userId })
  }
  
  console.log('📊 User properties set:', properties)
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

let sessionStartTime: number | null = null

export const startSession = () => {
  sessionStartTime = Date.now()
  GA.sessionStart()
}

export const getSessionDuration = (): number => {
  if (!sessionStartTime) return 0
  return Math.floor((Date.now() - sessionStartTime) / 1000)
}

export const trackSessionEnd = () => {
  const duration = getSessionDuration()
  if (duration > 0) {
    GA.engagement(duration)
  }
}

// Auto-track session end when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', trackSessionEnd)
  window.addEventListener('pagehide', trackSessionEnd)
}
