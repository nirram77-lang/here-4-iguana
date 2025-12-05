/**
 * 🦎 I4IGUANA - OneSignal Push Notifications
 * 
 * Simple and reliable push notifications using OneSignal
 */

// OneSignal App ID
const ONESIGNAL_APP_ID = 'e0009025-1eac-434c-ba27-353c60b0fcf7';

/**
 * Initialize OneSignal
 * Call this once when the app loads
 */
export const initOneSignal = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  // Wait for OneSignal to be available
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // For development
      notifyButton: {
        enable: false, // We'll use our own UI
      },
      welcomeNotification: {
        title: "🦎 I4IGUANA",
        message: "Thanks for subscribing to notifications!",
      }
    });
    
    console.log('✅ OneSignal initialized');
  });
};

/**
 * Request notification permission and subscribe user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) {
      console.log('⚠️ OneSignal not loaded yet');
      return false;
    }
    
    // Request permission
    await OneSignal.Slidedown.promptPush();
    
    // Check if subscribed
    const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
    console.log('🔔 User subscribed:', isSubscribed);
    
    return isSubscribed;
  } catch (error) {
    console.error('❌ Error requesting permission:', error);
    return false;
  }
};

/**
 * Get the user's OneSignal Player ID (for sending targeted notifications)
 */
export const getPlayerId = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return null;
    
    const playerId = await OneSignal.User.PushSubscription.id;
    console.log('🆔 Player ID:', playerId);
    return playerId;
  } catch (error) {
    console.error('❌ Error getting player ID:', error);
    return null;
  }
};

/**
 * Set external user ID (link OneSignal to your user)
 */
export const setExternalUserId = async (userId: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;
    
    await OneSignal.login(userId);
    console.log('✅ External user ID set:', userId);
  } catch (error) {
    console.error('❌ Error setting external user ID:', error);
  }
};

/**
 * Add tags to user (for segmentation)
 */
export const setUserTags = async (tags: Record<string, string>): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;
    
    await OneSignal.User.addTags(tags);
    console.log('✅ Tags set:', tags);
  } catch (error) {
    console.error('❌ Error setting tags:', error);
  }
};

/**
 * Check if user is subscribed to notifications
 */
export const isSubscribed = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return false;
    
    return await OneSignal.User.PushSubscription.optedIn;
  } catch (error) {
    return false;
  }
};

/**
 * Unsubscribe from notifications
 */
export const unsubscribe = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;
    
    await OneSignal.User.PushSubscription.optOut();
    console.log('✅ Unsubscribed from notifications');
  } catch (error) {
    console.error('❌ Error unsubscribing:', error);
  }
};

// TypeScript declarations
declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}
