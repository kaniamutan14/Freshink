import { useContext, useCallback } from 'react';
import { AppContext } from '../store/AppContext';
import * as greader from '../api/greader';
import * as db from '../utils/db';

export function useArticles() {
  const { state, dispatch } = useContext(AppContext);
  const { isOnline } = state.offline;
  const { isDemoMode } = state.auth;
  const { filter } = state.ui;

  const fetchArticles = useCallback(async (streamId = 'user/-/state/com.google/reading-list', append = false) => {
    dispatch({ type: 'SET_ARTICLES_LOADING', payload: true });

    const getFilteredLocalArticles = (localList, targetStreamId) => {
      let filtered = localList;
      if (targetStreamId === 'user/-/state/com.google/starred') {
        filtered = localList.filter(art => art.isStarred);
      } else if (targetStreamId.startsWith('feed/')) {
        filtered = localList.filter(art => art.feedId === targetStreamId || `feed/${art.feedId}` === targetStreamId);
      } else if (targetStreamId.startsWith('user/') && targetStreamId.includes('/label/')) {
        const catName = targetStreamId.split('/').pop();
        const feedsInCat = state.feeds.filter(f => f.categoryId && f.categoryId.split('/').pop() === catName).map(f => f.id);
        filtered = localList.filter(art => feedsInCat.includes(art.feedId));
      } else if (targetStreamId !== 'user/-/state/com.google/reading-list' && targetStreamId !== 'all') {
        // Fallback for Demo Mode (cat_1) or non-standard category IDs
        const feedsInCat = state.feeds.filter(f => f.categoryId === targetStreamId).map(f => f.id);
        filtered = localList.filter(art => feedsInCat.includes(art.feedId));
      }

      if (filter === 'unread') {
        filtered = filtered.filter(art => !art.isRead);
      }

      filtered.sort((a, b) => b.published - a.published);
      return filtered;
    };

    // 1. If offline or in Demo Mode, fetch from local IndexedDB
    if (!isOnline || isDemoMode) {
      const localArticles = await db.getVal('feedData', 'articles') || [];
      const filtered = getFilteredLocalArticles(localArticles, streamId);

      dispatch({
        type: 'SET_ARTICLES',
        payload: {
          items: filtered,
          continuation: null
        }
      });
      dispatch({ type: 'SET_ARTICLES_LOADING', payload: false });
      return;
    }

    // 2. Fetch online
    try {
      const continuation = append ? state.articles.continuation : null;
      const res = await greader.getArticles(streamId, {
        count: 20,
        continuation,
        filter
      });

      if (res.error) throw new Error(res.message || 'API error');

      const items = res.items ? res.items.map(item => {
        // Map GReader properties to standard schema
        const id = item.id;
        const feedId = item.origin ? item.origin.streamId : '';
        const title = item.title;
        const author = item.author || '';
        const published = item.published; // Unix timestamp
        const url = item.canonical ? item.canonical[0].href : '';
        
        // Find body text (could be content.content or summary.content)
        const content = item.content ? item.content.content : (item.summary ? item.summary.content : '');

        // States
        const isRead = item.categories ? item.categories.includes('user/-/state/com.google/read') : false;
        const isStarred = item.categories ? item.categories.includes('user/-/state/com.google/starred') : false;

        return { id, feedId, title, author, published, url, content, isRead, isStarred };
      }) : [];

      const newContinuation = res.continuation || null;

      dispatch({
        type: 'SET_ARTICLES',
        payload: {
          items: append ? [...state.articles.items, ...items] : items,
          continuation: newContinuation
        }
      });
    } catch (e) {
      console.warn('Failed to load articles online, checking local DB.', e);
      // Fallback
      const localArticles = await db.getVal('feedData', 'articles') || [];
      const filtered = getFilteredLocalArticles(localArticles, streamId);
      dispatch({
        type: 'SET_ARTICLES',
        payload: {
          items: filtered,
          continuation: null
        }
      });
    } finally {
      dispatch({ type: 'SET_ARTICLES_LOADING', payload: false });
    }
  }, [isOnline, isDemoMode, filter, state.articles.continuation, state.feeds, dispatch]);

  const toggleReadStatus = async (itemId, isRead) => {
    // 1. Optimistic Update (state + unread badges)
    dispatch({ type: 'OPTIMISTIC_MARK_READ', payload: { itemId, isRead } });

    // Update local storage in IndexedDB
    const localArticles = await db.getVal('feedData', 'articles') || [];
    const updated = localArticles.map(art => art.id === itemId ? { ...art, isRead } : art);
    await db.setVal('feedData', 'articles', updated);

    // 2. Network push or Sync queue addition
    if (!isOnline || isDemoMode) {
      const action = isRead ? 'markRead' : 'markUnread';
      await db.addToQueue(action, itemId);
      const queue = await db.getQueue();
      dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: queue.length });
    } else {
      try {
        if (isRead) {
          await greader.markRead(itemId);
        } else {
          await greader.markUnread(itemId);
        }
      } catch (e) {
        console.warn('Failed to update read state on server, queuing for sync.', e);
        const action = isRead ? 'markRead' : 'markUnread';
        await db.addToQueue(action, itemId);
        const queue = await db.getQueue();
        dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: queue.length });
      }
    }
  };

  const toggleStarredStatus = async (itemId, isStarred) => {
    // 1. Optimistic Update
    dispatch({ type: 'OPTIMISTIC_MARK_STARRED', payload: { itemId, isStarred } });

    // Update local IndexedDB
    const localArticles = await db.getVal('feedData', 'articles') || [];
    const updated = localArticles.map(art => art.id === itemId ? { ...art, isStarred } : art);
    await db.setVal('feedData', 'articles', updated);

    // 2. Action push or Sync queue addition
    if (!isOnline || isDemoMode) {
      const action = isStarred ? 'star' : 'unstar';
      await db.addToQueue(action, itemId);
      const queue = await db.getQueue();
      dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: queue.length });
    } else {
      try {
        if (isStarred) {
          await greader.star(itemId);
        } else {
          await greader.unstar(itemId);
        }
      } catch (e) {
        console.warn('Failed to update star state on server, queuing for sync.', e);
        const action = isStarred ? 'star' : 'unstar';
        await db.addToQueue(action, itemId);
        const queue = await db.getQueue();
        dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: queue.length });
      }
    }
  };

  const markAllStreamRead = async (streamId) => {
    dispatch({ type: 'OPTIMISTIC_MARK_ALL_READ', payload: { streamId } });

    // Update local IndexedDB
    const localArticles = await db.getVal('feedData', 'articles') || [];
    const updated = localArticles.map(article => {
      const isMatch = 
        streamId === 'user/-/state/com.google/reading-list' ||
        article.feedId === streamId ||
        (state.feeds.find(f => f.id === article.feedId && f.categoryId === streamId));
      if (isMatch) {
        return { ...article, isRead: true };
      }
      return article;
    });
    await db.setVal('feedData', 'articles', updated);

    if (!isOnline || isDemoMode) {
      await db.addToQueue('markAllRead', streamId);
      const queue = await db.getQueue();
      dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: queue.length });
    } else {
      try {
        await greader.markAllRead(streamId);
      } catch (e) {
        console.warn('Failed to mark stream read on server, queuing sync.', e);
        await db.addToQueue('markAllRead', streamId);
        const queue = await db.getQueue();
        dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: queue.length });
      }
    }
  };

  const fetchArticleFullText = async (articleId, articleUrl) => {
    // If we already have it in state cache, return it
    if (state.ui.fullTextArticles[articleId]) {
      return state.ui.fullTextArticles[articleId];
    }

    if (isDemoMode) {
      // In demo mode, simulate worker scraping with local mock full text or generic message
      const article = state.articles.items.find(art => art.id === articleId);
      const mockHTML = article ? article.content + `<hr/><p><em>[Demo Scraped content retrieved successfully]</em></p>` : '';
      dispatch({ type: 'CACHE_FULL_TEXT', payload: { id: articleId, content: mockHTML } });
      return mockHTML;
    }

    try {
      const response = await greader.fetchFullText(articleUrl);
      
      if (response.error) {
        throw new Error(response.message || 'Scraper failed');
      }

      // Read response content from Worker Scrape object: { content }
      const content = response.content;
      dispatch({ type: 'CACHE_FULL_TEXT', payload: { id: articleId, content } });
      return content;
    } catch (e) {
      console.error('Full text scraping failed:', e);
      throw e;
    }
  };

  return {
    articles: state.articles.items,
    loading: state.articles.loading,
    continuation: state.articles.continuation,
    fetchArticles,
    toggleReadStatus,
    toggleStarredStatus,
    markAllStreamRead,
    fetchArticleFullText
  };
}
