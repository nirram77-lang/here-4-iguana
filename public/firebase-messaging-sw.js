// Firebase Messaging Service Worker
// This file must be in the public folder: public/firebase-messaging-sw.js

// Import Firebase scripts (using importScripts for service worker)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// ✅ I4IGUANA Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6laY3N84Pe_Fl1769bIoP4NbCxjmqP_o",
  authDomain: "i4iguana-app.vercel.app",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2",
  measurementId: "G-CC0HZW3H0K"
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// ✅ Handle background messages (when app is closed/background)
messaging.onBackgroundMessage((payload) => {
  console.log('🦎 [SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || '🦎 I4IGUANA';
  
  // ✅ FIX: Use sender's photo as icon if available, otherwise use default
  const senderPhoto = payload.data?.fromUserPhoto;
  const notificationIcon = senderPhoto && senderPhoto.startsWith('http') 
    ? senderPhoto 
    : '/notification-icon-192.png';
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification!',
    icon: notificationIcon,  // ✅ Use sender's photo!
    badge: '/notification-badge-72.png', // Small badge icon
    tag: payload.data?.tag || 'i4iguana-notification',
    data: payload.data || {},
    vibrate: [200, 100, 200],  // Vibration pattern
    requireInteraction: true,  // Don't auto-dismiss
    actions: getActionsForType(payload.data?.type)
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'match':
      return [
        { action: 'view', title: '💚 View Match', icon: '/icons/heart.png' },
        { action: 'dismiss', title: '✖️ Dismiss' }
      ];
    case 'message':
      return [
        { action: 'reply', title: '💬 Reply', icon: '/icons/chat.png' },
        { action: 'dismiss', title: '✖️ Dismiss' }
      ];
    case 'meeting':
      return [
        { action: 'view', title: '🎉 View', icon: '/icons/party.png' },
        { action: 'dismiss', title: '✖️ Dismiss' }
      ];
    default:
      return [
        { action: 'view', title: '👀 View' },
        { action: 'dismiss', title: '✖️ Dismiss' }
      ];
  }
}

// ✅ Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🦎 [SW] Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  // Build the URL to open based on notification type
  let urlToOpen = '/';
  
  if (data.type === 'match' && data.matchId) {
    urlToOpen = `/?screen=match&matchId=${data.matchId}`;
  } else if (data.type === 'message' && data.chatId) {
    urlToOpen = `/?screen=chat&chatId=${data.chatId}`;
  } else if (data.type === 'meeting') {
    urlToOpen = `/?screen=match`;
  } else if (data.type === 'venue_announcement' && data.venueId) {
    urlToOpen = `/?screen=home&venue=${data.venueId}`;
  }
  
  // Handle dismiss action
  if (action === 'dismiss') {
    return;
  }
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if app is already open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // App is open, navigate and focus
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: data,
              action: action
            });
            return client.focus();
          }
        }
        // App not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ✅ Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🦎 [SW] Notification closed:', event.notification.tag);
});

// ✅ Service Worker install event
self.addEventListener('install', (event) => {
  console.log('🦎 [SW] Service Worker installed');
  self.skipWaiting();
});

// ✅ Service Worker activate event
self.addEventListener('activate', (event) => {
  console.log('🦎 [SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

console.log('🦎 Firebase Messaging Service Worker loaded!');
