// Firebase Messaging Service Worker - DISABLED
// ✅ OneSignal is now handling all push notifications
// This file exists to prevent old cached versions from loading

self.addEventListener('install', () => {
  console.log('🦎 Firebase SW disabled - OneSignal handles push');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('🦎 Firebase SW disabled - OneSignal handles push');
});

// No push handling - OneSignal takes care of it
