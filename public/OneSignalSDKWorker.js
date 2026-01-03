// OneSignal Service Worker for I4IGUANA
// This file MUST exist at /OneSignalSDKWorker.js for push notifications to work!

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// The OneSignal SDK will handle all push notification functionality
// Custom handling can be added below if needed

self.addEventListener('push', function(event) {
  console.log('🦎 [OneSignal SW] Push received!', event);
  // OneSignal SDK handles the actual notification display
});

self.addEventListener('notificationclick', function(event) {
  console.log('🦎 [OneSignal SW] Notification clicked!', event);
  console.log('🦎 [OneSignal SW] Notification data:', event.notification.data);
  event.notification.close();
  
  // ✅ CRITICAL FIX: Extract matchId from notification data
  const data = event.notification.data || {};
  const matchId = data.matchId || '';
  const notificationType = data.type || 'message';
  
  console.log('🦎 [OneSignal SW] matchId:', matchId);
  console.log('🦎 [OneSignal SW] type:', notificationType);
  
  // ✅ Build URL with matchId parameter for direct chat navigation
  let targetUrl = '/app';
  if (matchId) {
    targetUrl = `/app?openChat=${matchId}&notificationType=${notificationType}`;
  }
  
  console.log('🦎 [OneSignal SW] Opening URL:', targetUrl);
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // If app is already open, focus it and send message
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('i4iguana.com') && 'focus' in client) {
            // ✅ Send message to existing window to open chat
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              matchId: matchId,
              notificationType: notificationType
            });
            return client.focus();
          }
        }
        // Otherwise open new window with matchId in URL
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

console.log('🦎 OneSignal Service Worker loaded and ready!');
