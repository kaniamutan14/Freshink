import { useContext, useCallback } from 'react';
import { AppContext } from '../store/AppContext';
import * as greader from '../api/greader';
import * as db from '../utils/db';

export function useSearch() {
  const { state, dispatch } = useContext(AppContext);
  const { isOnline } = state.offline;
  const { isDemoMode } = state.auth;

  const setSearchQuery = useCallback((query) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  const runSearch = useCallback(async (query) => {
    const q = query.trim();
    if (!q) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });

    // 1. Instant client-side search (highly optimized for offline/local queries)
    const localArticles = await db.getVal('feedData', 'articles') || [];
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapeRegExp(q), 'i');
    
    const clientSideResults = localArticles.filter(art => 
      searchRegex.test(art.title) || searchRegex.test(art.content) || searchRegex.test(art.author)
    );

    // If we are offline or in Demo Mode, client-side results are our absolute truth!
    if (!isOnline || isDemoMode) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: clientSideResults });
      return;
    }

    // 2. Otherwise, if online, attempt full server-side search to fetch matches from history
    try {
      const res = await greader.searchArticles(q);
      
      if (res.error) throw new Error(res.message || 'API Search failed');

      const serverResults = res.items ? res.items.map(item => {
        const id = item.id;
        const feedId = item.origin ? item.origin.streamId : '';
        const title = item.title;
        const author = item.author || '';
        const published = item.published;
        const url = item.canonical ? item.canonical[0].href : '';
        const content = item.content ? item.content.content : (item.summary ? item.summary.content : '');
        const isRead = item.categories ? item.categories.includes('user/-/state/com.google/read') : false;
        const isStarred = item.categories ? item.categories.includes('user/-/state/com.google/starred') : false;

        return { id, feedId, title, author, published, url, content, isRead, isStarred };
      }) : [];

      // Merge client-side and server-side results, avoiding duplicate IDs
      const uniqueResultsMap = new Map();
      
      // Inject client results first (guarantees local edits are reflected)
      clientSideResults.forEach(art => uniqueResultsMap.set(art.id, art));
      // Inject server results
      serverResults.forEach(art => {
        if (!uniqueResultsMap.has(art.id)) {
          uniqueResultsMap.set(art.id, art);
        }
      });

      const mergedResults = Array.from(uniqueResultsMap.values());
      mergedResults.sort((a, b) => b.published - a.published);

      dispatch({ type: 'SET_SEARCH_RESULTS', payload: mergedResults });
    } catch (e) {
      console.warn('Server search failed, displaying client-side offline results only.', e);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: clientSideResults });
    }
  }, [isOnline, isDemoMode, dispatch]);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
  }, [dispatch]);

  return {
    query: state.search.query,
    results: state.search.results,
    loading: state.search.loading,
    setSearchQuery,
    runSearch,
    clearSearch
  };
}
