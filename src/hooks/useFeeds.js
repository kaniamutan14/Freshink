import { useContext, useCallback } from 'react';
import { AppContext } from '../store/AppContext';
import * as greader from '../api/greader';
import * as db from '../utils/db';

export function useFeeds() {
  const { state, dispatch } = useContext(AppContext);
  const { isOnline } = state.offline;
  const { isDemoMode } = state.auth;

  const refreshFeeds = useCallback(async () => {
    // If offline or in Demo Mode, load entirely from IndexedDB
    if (!isOnline || isDemoMode) {
      const categories = await db.getVal('feedData', 'categories') || [];
      const feeds = await db.getVal('feedData', 'feeds') || [];
      const unreadCounts = await db.getVal('feedData', 'unreadCounts') || {};
      
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      dispatch({ type: 'SET_FEEDS', payload: feeds });
      dispatch({ type: 'SET_UNREAD_COUNTS', payload: unreadCounts });
      return;
    }

    try {
      const [catRes, subRes, countRes] = await Promise.all([
        greader.getCategories(),
        greader.getSubscriptions(),
        greader.getUnreadCounts()
      ]);

      if (catRes.error || subRes.error || countRes.error) {
        throw new Error('API fetch failed, falling back to local DB');
      }

      // 1. Process Categories
      const categoriesList = catRes.tags ? catRes.tags.filter(tag => tag.id.includes('/label/')).map(tag => {
        // Tag format is "user/-/label/LABEL_NAME"
        const id = tag.id;
        const title = id.split('/').pop();
        return { id, title };
      }) : [];

      // 2. Process Feeds (Subscriptions)
      const feedsList = subRes.subscriptions ? subRes.subscriptions.map(sub => {
        const id = sub.id;
        const title = sub.title;
        const url = sub.htmlUrl;
        
        // Find category if nested
        let categoryId = null;
        if (sub.categories && sub.categories.length > 0) {
          categoryId = sub.categories[0].id;
        }

        // FreshRSS exposes favicons from domain: sub.iconUrl or default favicon.ico
        let icon = '';
        try {
          icon = `https://www.google.com/s2/favicons?sz=32&domain=${new URL(sub.htmlUrl || sub.url || url).hostname}`;
        } catch (e) {
          icon = `https://www.google.com/s2/favicons?sz=32&domain=example.com`;
        }

        return { id, title, url, categoryId, icon };
      }) : [];

      // 3. Process Unread Counts
      const unreadCountsObj = {};
      if (countRes.unreadcounts) {
        countRes.unreadcounts.forEach(count => {
          unreadCountsObj[count.id] = count.count;
        });
      }

      dispatch({ type: 'SET_CATEGORIES', payload: categoriesList });
      dispatch({ type: 'SET_FEEDS', payload: feedsList });
      dispatch({ type: 'SET_UNREAD_COUNTS', payload: unreadCountsObj });
    } catch (e) {
      console.warn('Could not sync feeds online, loading local cached feeds.', e);
      // Fallback
      const categories = await db.getVal('feedData', 'categories') || [];
      const feeds = await db.getVal('feedData', 'feeds') || [];
      const unreadCounts = await db.getVal('feedData', 'unreadCounts') || {};
      
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      dispatch({ type: 'SET_FEEDS', payload: feeds });
      dispatch({ type: 'SET_UNREAD_COUNTS', payload: unreadCounts });
    }
  }, [isOnline, isDemoMode, dispatch]);

  return {
    categories: state.categories,
    feeds: state.feeds,
    unreadCounts: state.unreadCounts,
    refreshFeeds
  };
}
