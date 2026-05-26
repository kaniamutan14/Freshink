/* eslint-disable react-refresh/only-export-components */
import { createContext, useReducer, useEffect, useState } from 'react';
import * as db from '../utils/db';

export const AppContext = createContext();

const initialState = {
  auth: {
    token: localStorage.getItem('freshink_auth_token') || null,
    writeToken: localStorage.getItem('freshink_write_token') || null,
    user: localStorage.getItem('freshink_user') || null,
    freshrssUrl: localStorage.getItem('freshink_freshrss_url') || null,
    isLoggedIn: !!localStorage.getItem('freshink_auth_token'),
    isDemoMode: localStorage.getItem('freshink_demo_mode') === 'true'
  },
  categories: [],
  feeds: [],
  unreadCounts: {},
  articles: {
    items: [],
    continuation: null,
    loading: false
  },
  search: {
    query: '',
    results: [],
    loading: false
  },
  ui: {
    activePanel: 'sidebar', // sidebar | list | reader
    layoutMode: localStorage.getItem('freshink_layout_mode') || 'three-panel', // three-panel | two-panel | one-panel
    sidebarDrawerOpen: false,
    selectedCategory: null,
    selectedFeed: null,
    selectedArticle: null,
    filter: 'unread', // unread | all
    theme: localStorage.getItem('freshink_theme') || 'auto', // auto | parchment | forest | midnight | nordic
    fontSize: Number(localStorage.getItem('freshink_font_size')) || 100, // 75 | 100 | 125 | 150
    gutenbergMode: localStorage.getItem('freshink_gutenberg') === 'true',
    fullTextArticles: {} // cache of article ID -> full text HTML
  },
  offline: {
    isOnline: navigator.onLine,
    syncQueueCount: 0,
    backgroundSyncEnabled: localStorage.getItem('freshink_bg_sync') === 'true'
  }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        auth: {
          ...state.auth,
          ...action.payload,
          isLoggedIn: true
        }
      };
    case 'LOGOUT':
      return {
        ...initialState,
        auth: {
          token: null,
          writeToken: null,
          user: null,
          freshrssUrl: null,
          isLoggedIn: false,
          isDemoMode: false
        }
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_FEEDS':
      return { ...state, feeds: action.payload };
    case 'SET_UNREAD_COUNTS':
      return { ...state, unreadCounts: action.payload };
    case 'SET_ARTICLES': {
      let nextSelectedArticle = state.ui.selectedArticle;
      if (nextSelectedArticle && action.payload.items) {
        const updated = action.payload.items.find(a => a.id === nextSelectedArticle.id);
        if (updated) {
          nextSelectedArticle = updated;
        }
      }
      return {
        ...state,
        articles: {
          ...state.articles,
          ...action.payload
        },
        ui: {
          ...state.ui,
          selectedArticle: nextSelectedArticle
        }
      };
    }
    case 'SET_ARTICLES_LOADING':
      return {
        ...state,
        articles: {
          ...state.articles,
          loading: action.payload
        }
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        search: {
          ...state.search,
          query: action.payload
        }
      };
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        search: {
          ...state.search,
          results: action.payload,
          loading: false
        }
      };
    case 'SET_SEARCH_LOADING':
      return {
        ...state,
        search: {
          ...state.search,
          loading: action.payload
        }
      };
    case 'UPDATE_UI':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };
    case 'CACHE_FULL_TEXT':
      return {
        ...state,
        ui: {
          ...state.ui,
          fullTextArticles: {
            ...state.ui.fullTextArticles,
            [action.payload.id]: action.payload.content
          }
        }
      };
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        offline: {
          ...state.offline,
          isOnline: action.payload
        }
      };
    case 'SET_SYNC_QUEUE_COUNT':
      return {
        ...state,
        offline: {
          ...state.offline,
          syncQueueCount: action.payload
        }
      };
    case 'SET_BACKGROUND_SYNC':
      return {
        ...state,
        offline: {
          ...state.offline,
          backgroundSyncEnabled: action.payload
        }
      };
    // Optimistic UI actions
    case 'OPTIMISTIC_MARK_READ': {
      const { itemId, isRead } = action.payload;
      
      // Update article read state
      const updatedItems = state.articles.items.map(article => 
        article.id === itemId ? { ...article, isRead } : article
      );
      
      // Update unread counts
      const article = state.articles.items.find(art => art.id === itemId);
      let newUnreadCounts = { ...state.unreadCounts };
      if (article) {
        const feedId = article.feedId;
        const feed = state.feeds.find(f => f.id === feedId);
        const catId = feed ? feed.categoryId : null;
        const diff = isRead ? -1 : 1;
        
        if (newUnreadCounts[feedId] !== undefined) {
          newUnreadCounts[feedId] = Math.max(0, newUnreadCounts[feedId] + diff);
        }
        if (catId && newUnreadCounts[catId] !== undefined) {
          newUnreadCounts[catId] = Math.max(0, newUnreadCounts[catId] + diff);
        }
      }

      return {
        ...state,
        articles: { ...state.articles, items: updatedItems },
        unreadCounts: newUnreadCounts
      };
    }
    case 'OPTIMISTIC_MARK_STARRED': {
      const { itemId, isStarred } = action.payload;
      const updatedItems = state.articles.items.map(article => 
        article.id === itemId ? { ...article, isStarred } : article
      );
      return {
        ...state,
        articles: { ...state.articles, items: updatedItems }
      };
    }
    case 'OPTIMISTIC_MARK_ALL_READ': {
      const { streamId } = action.payload;
      let newUnreadCounts = { ...state.unreadCounts };

      // Update cached articles
      const updatedItems = state.articles.items.map(article => {
        // If streamId is reading-list, feed, or label matching the article
        const isMatch = 
          streamId === 'user/-/state/com.google/reading-list' ||
          article.feedId === streamId ||
          (state.feeds.find(f => f.id === article.feedId && f.categoryId === streamId));
          
        if (isMatch) {
          return { ...article, isRead: true };
        }
        return article;
      });

      // Reset counts
      if (streamId === 'user/-/state/com.google/reading-list') {
        newUnreadCounts = {};
      } else {
        // Calculate how much unread count to subtract from global reading-list
        const previousCount = newUnreadCounts[streamId] || 0;
        newUnreadCounts[streamId] = 0;
        
        // If it's a category, reset child feeds and sum their previous counts
        const feedsToReset = state.feeds.filter(f => f.categoryId === streamId);
        let totalReduced = previousCount;
        if (feedsToReset.length > 0) {
          totalReduced = feedsToReset.reduce((sum, f) => sum + (state.unreadCounts[f.id] || 0), 0);
        }
        feedsToReset.forEach(f => {
          newUnreadCounts[f.id] = 0;
        });
        
        // Subtract from global reading-list count
        const rlKey = 'user/-/state/com.google/reading-list';
        if (newUnreadCounts[rlKey] !== undefined) {
          newUnreadCounts[rlKey] = Math.max(0, newUnreadCounts[rlKey] - totalReduced);
        }
      }

      return {
        ...state,
        articles: { ...state.articles, items: updatedItems },
        unreadCounts: newUnreadCounts
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hasLoadedFromDB, setHasLoadedFromDB] = useState(false);

  // Load initial cached data from IndexedDB once on mount
  useEffect(() => {
    if (state.auth.isLoggedIn) {
      Promise.all([
        db.getVal('feedData', 'categories'),
        db.getVal('feedData', 'feeds'),
        db.getVal('feedData', 'unreadCounts'),
        db.getVal('feedData', 'articles')
      ]).then(([categories, feeds, unreadCounts, articles]) => {
        if (categories) dispatch({ type: 'SET_CATEGORIES', payload: categories });
        if (feeds) dispatch({ type: 'SET_FEEDS', payload: feeds });
        if (unreadCounts) dispatch({ type: 'SET_UNREAD_COUNTS', payload: unreadCounts });
        if (articles) dispatch({ type: 'SET_ARTICLES', payload: { items: articles, continuation: null } });
        
        setHasLoadedFromDB(true);
      }).catch(err => {
        console.error('Error loading initial data from DB:', err);
        setHasLoadedFromDB(true);
      });
    } else {
      setTimeout(() => setHasLoadedFromDB(true), 0);
    }
  }, [state.auth.isLoggedIn]);

  // Sync state to local IndexedDB whenever categories, feeds, or articles change (ONLY after initial load is done!)
  useEffect(() => {
    if (state.auth.isLoggedIn && hasLoadedFromDB) {
      db.setVal('feedData', 'categories', state.categories).catch(console.error);
      db.setVal('feedData', 'feeds', state.feeds).catch(console.error);
      db.setVal('feedData', 'unreadCounts', state.unreadCounts).catch(console.error);
      
      // Safely merge articles instead of overwriting the entire offline database
      if (state.articles.items.length > 0) {
        db.getVal('feedData', 'articles').then(existingArticles => {
          const merged = new Map();
          const oldList = existingArticles || [];
          
          oldList.forEach(art => merged.set(art.id, art));
          state.articles.items.forEach(art => merged.set(art.id, art));
          
          let mergedArray = Array.from(merged.values());
          mergedArray.sort((a, b) => b.published - a.published);
          
          // Truncate to most recent 500 to prevent infinite growth
          if (mergedArray.length > 500) {
             mergedArray = mergedArray.slice(0, 500);
          }
          
          return db.setVal('feedData', 'articles', mergedArray);
        }).catch(console.error);
      }
    }
  }, [state.categories, state.feeds, state.unreadCounts, state.articles.items, state.auth.isLoggedIn, hasLoadedFromDB]);

  // Monitor network connection status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync queue size
    db.getQueue().then(queue => {
      dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: queue.length });
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
