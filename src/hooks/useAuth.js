import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../store/AppContext';
import * as greader from '../api/greader';
import * as db from '../utils/db';
import { MOCK_CATEGORIES, MOCK_FEEDS, MOCK_UNREAD_COUNTS, MOCK_ARTICLES } from '../utils/mockData';

export function useAuth() {
  const { state, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const checkSingleUserMode = async () => {
    try {
      const res = await fetch('/api/auth/single-user');
      if (res.ok) {
        const text = await res.text();
        const tokenMatch = text.match(/Auth=([^\s]+)/);
        if (tokenMatch && tokenMatch[1]) {
           const token = tokenMatch[1];
           const username = res.headers.get('X-FreshRSS-Username') || 'Admin';
           localStorage.setItem('freshink_auth_token', token);
           localStorage.setItem('freshink_user', username);
           localStorage.setItem('freshink_freshrss_url', window.location.origin);
           localStorage.setItem('freshink_demo_mode', 'false');

           dispatch({
             type: 'SET_AUTH',
             payload: {
               token,
               user: username,
               freshrssUrl: window.location.origin,
               isDemoMode: false
             }
           });
           
           greader.getWriteToken().then(writeToken => {
             if (typeof writeToken === 'string') {
               dispatch({ type: 'SET_AUTH', payload: { writeToken } });
             }
           }).catch(() => {});
           
           return true;
        }
      }
      return false;
    } catch (e) {
      console.warn("Single user mode not active or unreachable");
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('freshink_auth_token');
    localStorage.removeItem('freshink_write_token');
    localStorage.removeItem('freshink_user');
    localStorage.removeItem('freshink_freshrss_url');
    localStorage.removeItem('freshink_demo_mode');
    
    // Clear local IndexedDB
    const dbInstance = await db.openDB();
    const tx = dbInstance.transaction(['feedData', 'syncQueue', 'authData'], 'readwrite');
    tx.objectStore('feedData').clear();
    tx.objectStore('syncQueue').clear();
    tx.objectStore('authData').clear();

    dispatch({ type: 'LOGOUT' });
  };

  useEffect(() => {
    // Listen for auth expiration events from API client
    const handleAuthExpired = async () => {
      // Attempt silent re-authentication via single-user mode first
      const refreshed = await checkSingleUserMode();
      if (!refreshed) {
        logout();
      }
    };
    window.addEventListener('freshink-auth-expired', handleAuthExpired);
    
    // Check single-user auto-login if not logged in
    if (!state.auth.isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      checkSingleUserMode().finally(() => setLoading(false));
    }

    return () => {
      window.removeEventListener('freshink-auth-expired', handleAuthExpired);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.auth.isLoggedIn]);


  const login = async (freshrssUrl, username, password) => {
    setLoading(true);
    
    // Normalize FreshRSS URL (remove trailing slash, ensure protocol)
    let url = freshrssUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    url = url.replace(/\/$/, '');

    try {
      const result = await greader.login(url, username, password);
      if (result.error) {
        return { success: false, error: result.error, message: result.message };
      }

      dispatch({
        type: 'SET_AUTH',
        payload: {
          token: result.token,
          user: result.username,
          freshrssUrl: url,
          isDemoMode: false
        }
      });
      
      // Save credentials to IndexedDB so Service Worker can do true headless background syncs
      db.setVal('authData', 'credentials', { token: result.token, url: url }).catch(console.warn);
      
      localStorage.setItem('freshink_demo_mode', 'false');
      
      // Prefetch write token in background
      greader.getWriteToken().then(writeToken => {
        if (typeof writeToken === 'string') {
          dispatch({ type: 'SET_AUTH', payload: { writeToken } });
        }
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: 'login_failed', message: e.message };
    } finally {
      setLoading(false);
    }
  };


  const tryDemoMode = async () => {
    setLoading(true);
    
    localStorage.setItem('freshink_auth_token', 'demo_token');
    localStorage.setItem('freshink_user', 'DemoReader');
    localStorage.setItem('freshink_freshrss_url', 'http://demo.freshink.local');
    localStorage.setItem('freshink_demo_mode', 'true');

    // Populate IndexedDB with rich mock data
    await db.setVal('feedData', 'categories', MOCK_CATEGORIES);
    await db.setVal('feedData', 'feeds', MOCK_FEEDS);
    await db.setVal('feedData', 'unreadCounts', MOCK_UNREAD_COUNTS);
    await db.setVal('feedData', 'articles', MOCK_ARTICLES);

    dispatch({
      type: 'SET_AUTH',
      payload: {
        token: 'demo_token',
        user: 'DemoReader',
        freshrssUrl: 'http://demo.freshink.local',
        isDemoMode: true
      }
    });

    dispatch({ type: 'SET_CATEGORIES', payload: MOCK_CATEGORIES });
    dispatch({ type: 'SET_FEEDS', payload: MOCK_FEEDS });
    dispatch({ type: 'SET_UNREAD_COUNTS', payload: MOCK_UNREAD_COUNTS });
    dispatch({ type: 'SET_ARTICLES', payload: { items: MOCK_ARTICLES, continuation: null } });
    
    setLoading(false);
    return { success: true };
  };

  return {
    ...state.auth,
    loading,
    login,
    logout,
    tryDemoMode
  };
}
