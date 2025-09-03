const CACHE_NAME = 'podcasthub-v1';
const OFFLINE_PAGE = '/offline.html';
const OFFLINE_IMG = '/icons/create-icons.svg';

const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/components/PodcastSearch.js',
  '/components/PodcastList.js',
  '/components/PodcastDetails.js',
  '/components/AudioTranscription.js',
  '/components/EpisodeSummary.js',
  '/icons/create-icons.svg',
  'https://unpkg.com/react@17/umd/react.development.js',
  'https://unpkg.com/react-dom@17/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  // Add any additional assets to cache
];

// Define the transcription queue for background sync
const transcriptionQueue = new Set();

// Install the service worker and cache initial assets
self.addEventListener('install', event => {
  // Deprecated SW: activate immediately; no caching.
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      // Clear all caches created by this SW
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      // Unregister this deprecated SW
      await self.registration.unregister();
    } catch (e) {
      // no-op
    } finally {
      // Refresh all controlled windows to detach from this SW
      const clientsArr = await self.clients.matchAll({ type: 'window' });
      clientsArr.forEach(client => client.navigate(client.url));
    }
  })());
});

// No-op fetch handler so network proceeds normally while this SW unregisters.
self.addEventListener('fetch', () => {});

// Handle API requests differently - network first, then fallback
function handleApiRequest(event) {
  if (event.request.method === 'GET') {
    // For GET requests, use network with cache fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response for cache storage
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try from cache
          return caches.match(event.request);
        })
    );
  } else if (event.request.url.includes('/api/transcribe')) {
    // For transcription API calls, use background sync when offline
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(err => {
          // If offline, store for background sync
          return serializeRequest(event.request).then(serialized => {
            transcriptionQueue.add(serialized);
            // Register for background sync
            return self.registration.sync.register('transcription-sync')
              .then(() => {
                return new Response(JSON.stringify({
                  offline: true,
                  message: 'Your transcription request has been queued for processing when you are back online.'
                }), {
                  headers: { 'Content-Type': 'application/json' }
                });
              });
          });
        })
    );
  } else {
    // Other API requests
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({
            offline: true,
            message: 'You are currently offline. Please try again when online.'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }
}

// Serialize request for storage
async function serializeRequest(request) {
  const body = await request.text();
  return {
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body,
    time: Date.now()
  };
}

// Background sync event handler for offline transcription requests
self.addEventListener('sync', event => {
  if (event.tag === 'transcription-sync') {
    event.waitUntil(
      processBackgroundSync()
    );
  }
});

// Process queued transcription requests
async function processBackgroundSync() {
  // Convert Set to Array for processing
  const requests = Array.from(transcriptionQueue);
  
  // Process each request
  const processPromises = requests.map(async (serializedRequest) => {
    try {
      const init = {
        method: serializedRequest.method,
        headers: serializedRequest.headers.reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {}),
        body: serializedRequest.body
      };
      
      // Attempt to resend the request
      const response = await fetch(serializedRequest.url, init);
      
      if (response.ok) {
        // Request succeeded, remove from queue
        transcriptionQueue.delete(serializedRequest);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Background sync failed:', error);
      return false;
    }
  });
  
  return Promise.all(processPromises);
}

// Push notification event handler
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.message || 'New content available!',
      icon: '/icons/create-icons.svg',
      badge: '/icons/create-icons.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'PodcastHub', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
