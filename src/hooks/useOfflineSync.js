import { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../store/AppContext';
import * as db from '../utils/db';
import * as greader from '../api/greader';

export function useOfflineSync() {
  const { state, dispatch } = useContext(AppContext);
  const { isOnline } = state.offline;
  const { isDemoMode } = state.auth;

  // Drain the IndexedDB offline sync queue back to the server
  const drainSyncQueue = useCallback(async () => {
    // If offline, in demo mode, or queue is empty, do nothing
    if (!navigator.onLine || isDemoMode) return;

    const queue = await db.getQueue();
    if (queue.length === 0) return;
    
    // Sort oldest actions first to preserve sequence
    queue.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of queue) {
      try {
        let success = true;
        
        let result = null;

        switch (item.action) {
          case 'markRead':
            result = await greader.markRead(item.itemId);
            break;
          case 'markUnread':
            result = await greader.markUnread(item.itemId);
            break;
          case 'star':
            result = await greader.star(item.itemId);
            break;
          case 'unstar':
            result = await greader.unstar(item.itemId);
            break;
          case 'markAllRead':
            result = await greader.markAllRead(item.itemId);
            break;
          default:
            success = false;
            console.warn('Unknown sync action:', item.action);
        }

        // Explicitly check if the API call returned our standard error object
        if (result && result.error) {
          throw result;
        }

        if (success) {
          // Remove from local database sync queue
          await db.removeFromQueue(item.id);
        }
      } catch (error) {
        console.error(`Sync action failed for action ID ${item.id}:`, error);
        
        // If it's a permanent client error (e.g. 400 Bad Request, 403 Forbidden, 404 Not Found),
        // we must discard this item so it doesn't wedge the queue forever.
        if (error.error === 'api_error' && error.status >= 400 && error.status < 500) {
          console.warn(`Discarding permanently failed action ${item.id} (Status: ${error.status})`);
          await db.removeFromQueue(item.id);
          continue;
        }
        
        // For network/500 errors, break out of loop to retry on next connection event
        break;
      }
    }

    // Update remaining queue count in state
    const remaining = await db.getQueue();
    dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: remaining.length });
    
    // Once synced, trigger feed updates to get absolute counts
    if (remaining.length === 0) {
      db.pruneOldArticles().catch(console.error);
    }
  }, [isDemoMode, dispatch]);

  // Synchronously register for PWA Background Sync API
  const registerPWABackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-rss-actions');
        
        // Register Periodic Background Sync (if supported)
        if ('periodicSync' in registration) {
          try {
            await registration.periodicSync.register('periodic-feed-update', {
              minInterval: 12 * 60 * 60 * 1000, // 12 hours
            });
            console.log('Periodic Sync registered successfully!');
          } catch (e) {
            console.warn('Periodic Sync could not be registered', e);
          }
        }

        dispatch({ type: 'SET_BACKGROUND_SYNC', payload: true });
        localStorage.setItem('freshink_bg_sync', 'true');
      } catch (error) {
        console.warn('Background Sync registration failed, falling back to client monitoring:', error);
      }
    }
  }, [dispatch]);

  const toggleBackgroundSync = useCallback((enabled) => {
    if (enabled) {
      registerPWABackgroundSync();
    } else {
      localStorage.setItem('freshink_bg_sync', 'false');
      dispatch({ type: 'SET_BACKGROUND_SYNC', payload: false });
    }
  }, [registerPWABackgroundSync, dispatch]);

  // Watch for online reconnection events
  useEffect(() => {
    if (isOnline) {
      drainSyncQueue();
    }
  }, [isOnline, drainSyncQueue]);

  // Listen for sw.js service worker messaging
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'TRIGGER_SYNC_DRAIN') {
        drainSyncQueue();
      } else if (event.data && event.data.type === 'TRIGGER_BACKGROUND_REFRESH') {
        window.dispatchEvent(new CustomEvent('freshink-background-refresh'));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [drainSyncQueue]);

  return {
    isOnline,
    syncQueueCount: state.offline.syncQueueCount,
    backgroundSyncEnabled: state.offline.backgroundSyncEnabled,
    drainSyncQueue,
    toggleBackgroundSync
  };
}
