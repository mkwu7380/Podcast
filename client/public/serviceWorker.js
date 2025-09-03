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
    })
  );
});

// Fetch event - respond with cached resource or fetch from network with offline fallback
self.addEventListener('fetch', event => {
  // Skip cross-origin requests like Google Analytics
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('unpkg.com')) {
    return;
  }

  // Handle API requests separately
  if (event.request.url.includes('/api/')) {
    handleApiRequest(event);
    return;
  }

  // Handle HTML page requests with offline fallback
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response for cache storage
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          // Return offline page when HTML request fails
          return caches.match(OFFLINE_PAGE);
        })
    );
    return;
  }

  // Handle image requests with SVG fallback
  if (event.request.headers.get('Accept').includes('image')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || fetch(event.request)
            .then(response => {
              // Cache successful image responses
              if (response.ok) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseToCache));
              }
              return response;
            })
            .catch(() => {
              // Return fallback image when request fails
              return caches.match(OFFLINE_IMG);
            });
        })
    );
    return;
  }

  // Standard cache-first strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the cached response
        if (response) {
          return response;
        }

        // No cache match - fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response to store in cache and return to browser
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // Only cache same-origin requests
                if (event.request.url.startsWith(self.location.origin)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // If it's a font request or non-HTML, we can't do much
            // Return the offline page as a last resort for important resources
            if (event.request.url.includes('.css') || 
                event.request.url.includes('.js')) {
              return caches.match(OFFLINE_PAGE);
            }
          });
      })
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
