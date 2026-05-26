const DB_NAME = 'FreshInkDB';
const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('feedData')) {
        db.createObjectStore('feedData', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('authData')) {
        db.createObjectStore('authData');
      }
    };
  });
}

export async function getVal(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result ? request.result.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setVal(storeName, key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put({ id: key, value });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVal(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Sync Queue helpers
export async function getQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function addToQueue(action, itemId, data = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.add({
      action,
      itemId,
      data,
      timestamp: Date.now()
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromQueue(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Rolling window auto-pruning
// Prunes read articles older than 7 days from IndexedDB, preserving starred ones
export async function pruneOldArticles() {
  try {
    const articles = await getVal('feedData', 'articles') || [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const prunedArticles = articles.filter(article => {
      const isStarred = article.isStarred || false;
      const isRead = article.isRead || false;
      const publishDate = article.published ? article.published * 1000 : Date.now();
      
      // Keep if starred, OR if it's NOT read, OR if it's read but newer than 7 days
      return isStarred || !isRead || (isRead && publishDate > sevenDaysAgo);
    });

    await setVal('feedData', 'articles', prunedArticles);
  } catch (error) {
    console.error('Error during article pruning:', error);
  }
}
