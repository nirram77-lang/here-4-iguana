// I4IGUANA Service Worker v52 - FIXED for Push Notifications
// ✅ Works alongside OneSignal - does NOT conflict!

const CACHE_NAME = 'i4iguana-v52'
const urlsToCache = [
  '/',
  '/manifest.json',
]

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('🦎 [SW] Installing v52...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ [SW] Cache opened')
        return cache.addAll(urlsToCache)
      })
  )
  self.skipWaiting()
})

// Activate event - clean old caches (but NOT OneSignal!)
self.addEventListener('activate', (event) => {
  console.log('🦎 [SW] Activating v52...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // ✅ Only delete OUR caches, not OneSignal's!
          if (cacheName.startsWith('i4iguana-') && cacheName !== CACHE_NAME) {
            console.log('🗑️ [SW] Removing old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip Firebase, OneSignal, and API requests - always go to network
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('firestore') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('onesignal')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone()
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache)
          })
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})

// ✅ Push notifications are handled by OneSignalSDKWorker.js
// We do NOT handle push here to avoid conflicts!
console.log('🦎 [SW] v52 loaded - OneSignal handles push notifications')
