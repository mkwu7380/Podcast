const CACHE_NAME = 'podcasthub-v2';
const OFFLINE_PAGE = '/offline.html';
const OFFLINE_IMG = '/assets/images/create-icons.svg';

const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/bundle.js',
  '/manifest.json',
  '/registerSW.js',
  '/serviceWorker.js',
  '/assets/images/create-icons.svg'
];

// Define the transcription queue for background sync
const transcriptionQueue = new Set();

// Install the service worker and cache initial assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - respond with cached resource or fetch from network with offline fallback
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip unrelated cross-origin requests (allow unpkg for icons/fonts if needed)
  if (url.origin !== self.location.origin && !url.href.includes('unpkg.com')) {
    return;
  }

  // API: handle separately
  if (url.pathname.startsWith('/api/')) {
    handleApiRequest(event);
    return;
  }

  // Navigations/HTML: network-first with cache fallback (not offline page)
  if (req.mode === 'navigate' || req.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Images: cache-first with SVG fallback
  if (req.headers.get('Accept')?.includes('image')) {
    event.respondWith(
      caches.match(req).then(cached => {
        return cached || fetch(req).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return response;
        }).catch(() => caches.match(OFFLINE_IMG));
      })
    );
    return;
  }

  // JS/CSS and other static: cache-first
  if (req.destination === 'script' || req.destination === 'style' || req.url.endsWith('.js') || req.url.endsWith('.css')) {
    event.respondWith(
      caches.match(req).then(cached => {
        return cached || fetch(req).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

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
