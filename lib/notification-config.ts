/**
 * 🦎 I4IGUANA - Push Notification Configuration
 * 
 * Environment variables needed for push notifications.
 * Add these to your .env.local file.
 */

// =============================================
// 📝 SETUP INSTRUCTIONS
// =============================================

/**
 * 1. Go to Firebase Console → Project Settings → Cloud Messaging
 * 
 * 2. Under "Web Push certificates", click "Generate key pair"
 *    - Copy the Key pair (this is your VAPID key)
 * 
 * 3. Add to your .env.local file:
 *    NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
 * 
 * 4. Copy these files to your project:
 *    - firebase-messaging-sw.js → public/firebase-messaging-sw.js
 *    - notification-icon-192.png → public/notification-icon-192.png
 *    - notification-badge-72.png → public/notification-badge-72.png
 * 
 * 5. Update firebase-messaging-sw.js with your Firebase config
 * 
 * 6. Deploy Cloud Functions (optional, for automatic notifications):
 *    - cd functions
 *    - npm install
 *    - firebase deploy --only functions
 */

// =============================================
// 🔧 CONFIGURATION CONSTANTS
// =============================================

export const NOTIFICATION_CONFIG = {
  // Default notification settings
  DEFAULT_ICON: '/notification-icon-192.png',
  DEFAULT_BADGE: '/notification-badge-72.png',
  
  // Notification types
  TYPES: {
    MATCH: 'match',
    MESSAGE: 'message',
    MEETING: 'meeting',
    VENUE: 'venue_announcement',
    LIKE: 'like'
  },
  
  // Auto-hide delays (ms)
  AUTO_HIDE_DELAY: 5000,
  
  // When to show permission prompt (after X logins)
  PERMISSION_PROMPT_AFTER_LOGINS: 2,
  
  // Local storage keys
  STORAGE_KEYS: {
    PERMISSION_ASKED: 'i4iguana_notification_permission_asked',
    PERMISSION_DISMISSED: 'i4iguana_notification_permission_dismissed',
    LOGIN_COUNT: 'i4iguana_login_count'
  }
};

// =============================================
// 🎨 NOTIFICATION TEMPLATES
// =============================================

export const NOTIFICATION_TEMPLATES = {
  match: {
    title: (name: string) => `🦎 It's a Match!`,
    body: (name: string) => `You and ${name} liked each other! Start chatting now! 💚`,
    icon: '/notification-icon-192.png'
  },
  
  message: {
    title: (name: string) => `💬 ${name}`,
    body: (preview: string) => preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
    icon: '/notification-icon-192.png'
  },
  
  meeting: {
    title: () => `🎉 We're Meeting!`,
    body: (name: string) => `${name} confirmed you're meeting! Have a great time! 💕`,
    icon: '/notification-icon-192.png'
  },
  
  venue: {
    title: (venueName: string) => `📢 ${venueName}`,
    body: (message: string) => message,
    icon: '/notification-icon-192.png'
  },
  
  like: {
    title: () => `💚 Someone Likes You!`,
    body: (name: string) => `${name} swiped right on you! Check it out!`,
    icon: '/notification-icon-192.png'
  }
};

// =============================================
// 🔔 HELPER FUNCTIONS
// =============================================

/**
 * Check if we should show the permission prompt
 */
export const shouldShowPermissionPrompt = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Already granted
  if (Notification.permission === 'granted') return false;
  
  // Already denied
  if (Notification.permission === 'denied') return false;
  
  // User dismissed the prompt before
  const dismissed = localStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.PERMISSION_DISMISSED);
  if (dismissed) {
    const dismissedAt = new Date(dismissed);
    const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
    // Don't show again for 7 days
    if (daysSinceDismissed < 7) return false;
  }
  
  // Check login count
  const loginCount = parseInt(localStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.LOGIN_COUNT) || '0');
  if (loginCount < NOTIFICATION_CONFIG.PERMISSION_PROMPT_AFTER_LOGINS) return false;
  
  return true;
};

/**
 * Record that permission prompt was dismissed
 */
export const recordPermissionDismissed = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_CONFIG.STORAGE_KEYS.PERMISSION_DISMISSED, new Date().toISOString());
};

/**
 * Increment login count
 */
export const incrementLoginCount = (): number => {
  if (typeof window === 'undefined') return 0;
  const count = parseInt(localStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.LOGIN_COUNT) || '0') + 1;
  localStorage.setItem(NOTIFICATION_CONFIG.STORAGE_KEYS.LOGIN_COUNT, String(count));
  return count;
};

/**
 * Check if notifications are supported
 */
export const areNotificationsSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
};

console.log('🦎 Notification config loaded');
