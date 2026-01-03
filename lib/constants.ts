/**
 * Application Constants
 * 
 * Central configuration for the I4IGUANA app
 */

// ⏱️ PASS & LOCK CONFIGURATION
export const PASS_CONFIG = {
  // Free users get 4 passes per check-in (✅ v2.8.15: Was 3, now 4 for better pilot experience)
  MAX_PASSES_FREE: 4,
  
  // Max matches before lockout (free users)
  MAX_MATCHES_FREE: 4,
  
  // Lock duration: 1 HOUR (✅ v2.8.15: Was 2 hours, now 1 hour for pilot!)
  LOCK_DURATION: 1 * 60 * 60 * 1000, // 3,600,000 ms = 1 hour
  
  // Premium users: unlimited
  MAX_PASSES_PREMIUM: 999,
  MAX_MATCHES_PREMIUM: 999,
  
  // ✅ Required by stripe-webhook/route.ts
  PREMIUM_PASSES: 999,
  FREE_PASSES: 4,  // ✅ v2.8.15: Was 3, now 4
  
  // ✅ v2.8.20 FIX: Free matches before paywall = 4 (Match 5 shows paywall!)
  // Was 1 (showing paywall on Match 2) - now fixed!
  FREE_MATCHES_LIMIT: 4,  // First 4 matches are FREE, 5th requires payment
}

// 💰 PRICING - Launch Prices! 🚀
export const PRICING = {
  SKIP_TIMER: 2.90,       // $2.90 to skip 1-hour timer (1 Pass)
  PREMIUM_WEEKLY: 5.90,   // $5.90/week for premium
  PREMIUM_MONTHLY: 12.90,  // $12.90/month for premium - BEST VALUE!
}

// 💰 PREMIUM_PRICING (for Stripe API and UI) - Launch Prices! 🚀
export const PREMIUM_PRICING = {
  WEEKLY: {
    price: 5.90,
    displayPrice: '$5.90',
    currency: 'usd',
    duration: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
    stripePriceId: 'price_1SOA29GgzDjUcfZ0mpJ03Rn9',
  },
  MONTHLY: {
    price: 12.90,
    displayPrice: '$12.90',
    currency: 'usd',
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    stripePriceId: 'price_1SOA5KGgzDjUcfZ0ck2C4RMO',
  },
  SKIP_TIMER: {
    price: 2.90,
    displayPrice: '$2.90',
    currency: 'usd',
    stripePriceId: 'price_1SOA6qGgzDjUcfZ0hRZ7UtRS',
  },
} as const

// 💳 STRIPE CONFIGURATION
// ✅ Required by lib/stripe-service.ts
export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success`,
  cancelUrl: process.env.NEXT_PUBLIC_STRIPE_CANCEL_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cancel`,
} as const

// 🖼️ IMAGE CONFIGURATION
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB in bytes
  MAX_FILE_SIZE_MB: 5,
  MAX_PHOTOS: 6,
  MIN_PHOTOS: 1,
  ACCEPTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'i4iguana',
  CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
} as const

// 🎯 MATCH CONFIGURATION
export const MATCH_CONFIG = {
  MATCH_DURATION_MINUTES: 10,
  MAX_DISTANCE_METERS: 500,
  MIN_DISTANCE_METERS: 10,
  NOTIFICATION_ENABLED: true,
  // ✅ Required by lib/firestore-service.ts
  QUERY_LIMIT: 50, // Max number of users to fetch in one query
  // ✅ Required by lib/match-system.ts
  EXPIRATION_TIME: 10 * 60 * 1000, // 10 minutes in milliseconds
  WARNING_TIME: 60 * 1000, // 1 minute warning in milliseconds
} as const

// 📍 LOCATION CONFIGURATION
export const LOCATION_CONFIG = {
  // Check-in and matching
  DEFAULT_RADIUS: 100,        // 100 meters check-in radius
  MAX_DISTANCE: 50000,        // 50km max distance for matching
  DEFAULT_MAX_DISTANCE: 500,  // Default max search radius (500m)
  DEFAULT_MIN_DISTANCE: 10,   // Default min search radius (10m)
  
  // ✅ Required by lib/location-service.ts
  GEOHASH_PRECISION: 6,            // Geohash precision level
  LOCATION_TIMEOUT: 10000,         // 10 seconds timeout
  LOCATION_MAX_AGE: 0,             // Don't use cached location
  LOCATION_UPDATE_INTERVAL: 30000, // Update location every 30 seconds
}

// 🔔 NOTIFICATIONS
export const NOTIFICATION_CONFIG = {
  MATCH_EXPIRY_WARNING: 60, // Warn when 60 seconds left
}

// ⏰ TIMING
export const TIMING = {
  MATCH_DURATION: 5 * 60 * 1000,     // 5 minutes per match
  PASS_RESET_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
}

// 🚫 ERROR MESSAGES
export const ERROR_MESSAGES = {
  // General
  NO_PASSES: 'אין לך PASS-ים פנויים',
  LOCKED: 'אתה נעול עד סיום הטיימר',
  NO_LOCATION: 'לא הצלחנו לקבל את המיקום שלך',
  AUTH_ERROR: 'שגיאת הזדהות',
  PAYMENT_ERROR: 'שגיאה בתשלום',
  UNKNOWN_ERROR: 'אירעה שגיאה לא צפויה',
  
  // Firestore
  FIRESTORE_SAVE_ERROR: 'שגיאה בשמירת נתונים',
  FIRESTORE_LOAD_ERROR: 'שגיאה בטעינת נתונים',
  
  // Upload/Images
  UPLOAD_SIZE_ERROR: 'הקובץ גדול מדי - מקסימום 5MB',
  UPLOAD_ERROR: 'שגיאה בהעלאת התמונה',
  
  // Matching
  NO_USERS_FOUND: 'לא נמצאו משתמשים בקרבת מקום',
  SWIPE_ERROR: 'שגיאה בביצוע הסוויפ',
  MATCH_ERROR: 'שגיאה ביצירת התאמה',
  
  // ✅ Required by lib/location-service.ts
  LOCATION_NOT_SUPPORTED: 'המכשיר שלך לא תומך במיקום',
  LOCATION_PERMISSION_DENIED: 'נדרשת הרשאת מיקום',
  LOCATION_TIMEOUT: 'חלף הזמן המוקצב לקבלת מיקום',
  LOCATION_UNAVAILABLE: 'המיקום אינו זמין כרגע',
}

// ✅ SUCCESS MESSAGES
export const SUCCESS_MESSAGES = {
  CHECK_IN: 'נכנסת בהצלחה!',
  CHECK_OUT: 'יצאת בהצלחה',
  MATCH_CREATED: 'התאמה חדשה!',
  PASS_USED: 'PASS נוצל',
  TIMER_SKIPPED: 'הטיימר דולג בהצלחה',
}

export default {
  PASS_CONFIG,
  PRICING,
  PREMIUM_PRICING,
  STRIPE_CONFIG,
  IMAGE_CONFIG,
  MATCH_CONFIG,
  LOCATION_CONFIG,
  NOTIFICATION_CONFIG,
  TIMING,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
}
