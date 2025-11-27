/**
 * 🦎 I4IGUANA - Firebase Cloud Messaging Integration
 * 
 * This module handles push notifications for the app:
 * - Requests notification permission
 * - Gets and stores FCM tokens
 * - Handles foreground messages
 * - Registers service worker
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// ✅ VAPID Key for Web Push
// IMPORTANT: Replace with your actual VAPID key from Firebase Console
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

// Messaging instance (initialized lazily)
let messaging: Messaging | null = null;

/**
 * ✅ Initialize Firebase Messaging
 * Only works in browser environment with HTTPS
 */
export const initializeMessaging = async (): Promise<Messaging | null> => {
  // Only run in browser
  if (typeof window === 'undefined') {
    console.log('⚠️ Firebase Messaging not available on server');
    return null;
  }

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('⚠️ This browser does not support notifications');
    return null;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ This browser does not support service workers');
    return null;
  }

  try {
    // Import firebase app dynamically
    const { getApp } = await import('firebase/app');
    const app = getApp();
    
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging initialized');
    
    return messaging;
  } catch (error) {
    console.error('❌ Error initializing Firebase Messaging:', error);
    return null;
  }
};

/**
 * ✅ Register Service Worker for push notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

/**
 * ✅ Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log(`🔔 Notification permission: ${permission}`);
    return permission;
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * ✅ Get FCM Token for push notifications
 * @param userId - Current user's ID (to save token to Firestore)
 */
export const getFCMToken = async (userId?: string): Promise<string | null> => {
  try {
    // Initialize messaging if not already done
    if (!messaging) {
      messaging = await initializeMessaging();
    }

    if (!messaging) {
      console.log('⚠️ Messaging not available');
      return null;
    }

    // Register service worker first
    const swRegistration = await registerServiceWorker();
    
    if (!swRegistration) {
      console.log('⚠️ Service worker not registered');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
      
      // Save token to user's Firestore document
      if (userId) {
        await saveFCMToken(userId, token);
      }
      
      return token;
    } else {
      console.log('⚠️ No FCM token available. Request permission first.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

/**
 * ✅ Save FCM Token to user's Firestore document
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      lastFCMTokenUpdate: Timestamp.now(),
      notificationsEnabled: true
    });
    
    console.log('✅ FCM token saved to Firestore');
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
  }
};

/**
 * ✅ Remove FCM Token (when user logs out or disables notifications)
 */
export const removeFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const { arrayRemove } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token)
    });
    
    console.log('✅ FCM token removed from Firestore');
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
  }
};

/**
 * ✅ Setup foreground message handler
 * Shows in-app notification when message received while app is open
 */
export const setupForegroundMessageHandler = (
  onMessageReceived: (payload: any) => void
): (() => void) | null => {
  if (!messaging) {
    console.log('⚠️ Messaging not initialized for foreground handler');
    return null;
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('🦎 Foreground message received:', payload);
    onMessageReceived(payload);
  });

  return unsubscribe;
};

/**
 * ✅ Check if notifications are enabled
 */
export const areNotificationsEnabled = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

/**
 * ✅ Get current notification permission status
 */
export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * ✅ Full setup: Request permission + Get token + Setup handlers
 * Call this when user logs in
 */
export const setupPushNotifications = async (
  userId: string,
  onForegroundMessage?: (payload: any) => void
): Promise<{ success: boolean; token: string | null; permission: NotificationPermission }> => {
  try {
    console.log('🦎 Setting up push notifications...');
    
    // 1. Request permission
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('⚠️ Notification permission not granted');
      return { success: false, token: null, permission };
    }
    
    // 2. Initialize messaging
    await initializeMessaging();
    
    // 3. Get FCM token
    const token = await getFCMToken(userId);
    
    if (!token) {
      console.log('⚠️ Could not get FCM token');
      return { success: false, token: null, permission };
    }
    
    // 4. Setup foreground handler if provided
    if (onForegroundMessage) {
      setupForegroundMessageHandler(onForegroundMessage);
    }
    
    console.log('✅ Push notifications setup complete!');
    return { success: true, token, permission };
    
  } catch (error) {
    console.error('❌ Error setting up push notifications:', error);
    return { success: false, token: null, permission: 'denied' };
  }
};

/**
 * ✅ Listen for service worker messages (from notification clicks)
 */
export const setupServiceWorkerMessageListener = (
  onNotificationClick: (data: any, action: string) => void
): void => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NOTIFICATION_CLICK') {
      console.log('🦎 Notification click received from SW:', event.data);
      onNotificationClick(event.data.data, event.data.action);
    }
  });
};
