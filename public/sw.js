const CACHE_NAME = 'freshink-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Stale-While-Revalidate for app assets, Network-First for API)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If it's an API request, let the application state handle it directly with indexdb fallbacks
  if (url.pathname.startsWith('/api/') || url.pathname.includes('greader.php')) {
    return;
  }

  // Otherwise, handle as static asset (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network failures in background */});

        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache basic and CORS responses (needed for Google Fonts)
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background Sync Listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rss-actions') {
    event.waitUntil(triggerOfflineSync());
  }
});

// Periodic Sync Listener
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-feed-update') {
    event.waitUntil(fetchNewestArticles());
  }
});

// Function to handle background sync of queued offline mutations
async function triggerOfflineSync() {
  // Post message to clients telling them to start online sync
  const allClients = await self.clients.matchAll({ type: 'window' });
  for (const client of allClients) {
    client.postMessage({ type: 'TRIGGER_SYNC_DRAIN' });
  }
}

// Open IndexedDB utility for Service Worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FreshInkDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getIDBValue(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? request.result.value : null);
    request.onerror = () => reject(request.error);
  });
}

function setIDBValue(db, storeName, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put({ id: key, value });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Function to pull latest unread articles in background (Periodic Background Sync)
async function fetchNewestArticles() {
  // Always notify open clients if they exist so UI can refresh
  const allClients = await self.clients.matchAll({ type: 'window' });
  for (const client of allClients) {
    client.postMessage({ type: 'TRIGGER_BACKGROUND_REFRESH' });
  }

  // Perform true headless background fetch
  try {
    const db = await openDB();
    const auth = await getIDBValue(db, 'authData', 'credentials');
    
    if (!auth || !auth.token || !auth.url) {
      return;
    }

    // Fetch the latest 20 articles from reading list
    const apiUrl = `${auth.url.replace(/\/$/, '')}/api/greader.php/reader/api/0/stream/contents/user/-/state/com.google/reading-list?n=20&output=json`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `GoogleLogin auth=${auth.token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const newArticles = data.items ? data.items.map(item => ({
        id: item.id,
        feedId: item.origin ? item.origin.streamId : '',
        title: item.title,
        author: item.author || '',
        published: item.published,
        url: item.canonical ? item.canonical[0].href : '',
        content: item.content ? item.content.content : (item.summary ? item.summary.content : ''),
        isRead: item.categories ? item.categories.includes('user/-/state/com.google/read') : false,
        isStarred: item.categories ? item.categories.includes('user/-/state/com.google/starred') : false
      })) : [];

      if (newArticles.length > 0) {
        // Merge with existing articles in IndexedDB
        const existingArticles = await getIDBValue(db, 'feedData', 'articles') || [];
        const mergedMap = new Map();
        
        existingArticles.forEach(a => mergedMap.set(a.id, a));
        newArticles.forEach(a => mergedMap.set(a.id, a)); // New overwrites old
        
        const mergedArray = Array.from(mergedMap.values());
        mergedArray.sort((a, b) => b.published - a.published);

        await setIDBValue(db, 'feedData', 'articles', mergedArray);
      }
    }
  } catch (error) {
    console.error('SW Background Sync Failed:', error);
  }
}
