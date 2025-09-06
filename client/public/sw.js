const CACHE_NAME = 'civic-connect-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  // Add more static assets as needed
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }).catch(() => {
        // If both cache and network fail, return offline page for navigation requests
        if (event.request.destination === 'document') {
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>CivicConnect - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body { 
                    font-family: system-ui, sans-serif; 
                    text-align: center; 
                    padding: 50px; 
                    background: #f5f5f5; 
                  }
                  .offline-container {
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  .icon { font-size: 48px; margin-bottom: 20px; }
                  h1 { color: #333; margin-bottom: 15px; }
                  p { color: #666; line-height: 1.5; }
                  button {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 20px;
                  }
                  button:hover { background: #1d4ed8; }
                </style>
              </head>
              <body>
                <div class="offline-container">
                  <div class="icon">📡</div>
                  <h1>You're Offline</h1>
                  <p>Please check your internet connection and try again.</p>
                  <button onclick="window.location.reload()">Try Again</button>
                </div>
              </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })
  );
});

// Background sync for offline issue submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-issues') {
    event.waitUntil(syncOfflineIssues());
  }
});

// Handle offline issue submissions
async function syncOfflineIssues() {
  try {
    const offlineIssues = await getOfflineIssues();
    
    for (const issue of offlineIssues) {
      try {
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${issue.token}`
          },
          body: JSON.stringify(issue.data)
        });

        if (response.ok) {
          await removeOfflineIssue(issue.id);
          console.log('Offline issue synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync offline issue:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for offline storage
async function getOfflineIssues() {
  return new Promise((resolve) => {
    const request = indexedDB.open('CivicConnectDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineIssues'], 'readonly');
      const store = transaction.objectStore('offlineIssues');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

async function removeOfflineIssue(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('CivicConnectDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineIssues'], 'readwrite');
      const store = transaction.objectStore('offlineIssues');
      store.delete(id);
      
      transaction.oncomplete = () => {
        resolve();
      };
    };
    
    request.onerror = () => {
      resolve();
    };
  });
}