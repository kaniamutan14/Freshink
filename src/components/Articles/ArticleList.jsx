import { useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../store/AppContext';
import { useArticles } from '../../hooks/useArticles';
import { useFeeds } from '../../hooks/useFeeds';
import { ArticleItem } from './ArticleItem';
import { PullToRefresh } from '../Common/PullToRefresh';
import { LayoutToggle } from '../Common/LayoutToggle';

export function ArticleList({ onSelectArticle, onOpenSettings }) {
  const { state, dispatch } = useContext(AppContext);
  const { items: articles, loading, continuation } = state.articles;
  const { selectedCategory, selectedFeed, filter } = state.ui;
  const { query: searchQuery, results: searchResults } = state.search;
  
  const { fetchArticles, markAllStreamRead } = useArticles();
  const { refreshFeeds } = useFeeds();
  const scrollRef = useRef(null);

  const getStreamId = () => {
    if (selectedFeed) return `feed/${selectedFeed}`;
    if (selectedCategory === 'starred') return 'user/-/state/com.google/starred';
    if (selectedCategory === 'all') return 'user/-/state/com.google/reading-list';
    if (selectedCategory) return selectedCategory;
    return 'user/-/state/com.google/reading-list';
  };

  const getHeaderTitle = () => {
    if (selectedCategory === 'search') return `Search: "${searchQuery}"`;
    if (selectedCategory === 'starred') return 'Starred Items';
    if (selectedCategory === 'all') return 'All Articles';
    if (selectedFeed) {
      const feed = state.feeds.find(f => f.id === selectedFeed);
      return feed ? feed.title : 'Feed';
    }
    if (selectedCategory) {
      const cat = state.categories.find(c => c.id === selectedCategory);
      return cat ? cat.title : 'Category';
    }
    return 'Articles';
  };

  const handleRefresh = async () => {
    // Refresh feeds then refresh active list
    await refreshFeeds();
    if (selectedCategory !== 'search') {
      await fetchArticles(getStreamId());
    }
  };

  const fetchingRef = useRef(false);

  // Infinite Scroll Trigger
  const handleScroll = (e) => {
    const el = e.target;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 100;
    
    if (isAtBottom && continuation && !loading && !fetchingRef.current && selectedCategory !== 'search') {
      fetchingRef.current = true;
      console.log('At bottom, loading next page...');
      fetchArticles(getStreamId(), true).finally(() => {
        fetchingRef.current = false;
      });
    }
  };



  const fetchArticlesRef = useRef(fetchArticles);
  useEffect(() => {
    fetchArticlesRef.current = fetchArticles;
  }, [fetchArticles]);

  // Fetch new list when filter or active feed/category changes
  useEffect(() => {
    if (selectedCategory !== 'search') {
      fetchArticlesRef.current(getStreamId());
    }
  }, [filter, selectedFeed, selectedCategory]);

  const activeArticles = selectedCategory === 'search' ? searchResults : articles;

  return (
    <section className="article-list-panel">
      {/* Editorial Header */}
      <header className="list-panel-header">
        <div className="header-meta-row">
          <h2 className="list-title">{getHeaderTitle()}</h2>
          <div className="list-header-controls">
            {(state.ui.layoutMode === 'two-panel' || state.ui.layoutMode === 'one-panel') && (
              <button
                onClick={() => dispatch({ type: 'UPDATE_UI', payload: { sidebarDrawerOpen: true } })}
                className="list-settings-btn"
                aria-label="Open Feeds Menu"
                title="Feeds Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}
            <LayoutToggle />
            {onOpenSettings && (
              <button 
                onClick={onOpenSettings}
                className="list-settings-btn"
                aria-label="Open settings"
                title="Preferences"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="header-actions-row">
          <span className="articles-count-label">
            {new Intl.NumberFormat(navigator.language || 'en-US').format(activeArticles.length)} 
            {activeArticles.length === 1 ? ' item found' : ' items found'}
          </span>

          <button
            className={`list-filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_UI', payload: { filter: filter === 'unread' ? 'all' : 'unread' } })}
          >
            {filter === 'unread' ? '● Unread' : '○ All'}
          </button>

          {selectedCategory !== 'search' && selectedCategory !== 'starred' && activeArticles.length > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={() => markAllStreamRead(getStreamId())}
            >
              Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Pull To Refresh for Feed Syncing */}
      <PullToRefresh onRefresh={handleRefresh} isLoading={loading}>
        <div 
          className="list-scroll-area scrollbar-styled"
          onScroll={handleScroll}
          ref={scrollRef}
        >
          {loading && activeArticles.length === 0 ? (
            /* Loading skeletons */
            <div className="loading-skeletons-wrapper">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="skeleton-card">
                  <div className="skeleton-header"><span /><span /></div>
                  <div className="skeleton-title"><span /></div>
                  <div className="skeleton-excerpt"><span /><span /></div>
                </div>
              ))}
            </div>
          ) : activeArticles.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">☕</span>
              <p>All caught up! No articles here.</p>
              <button className="empty-refresh-btn" onClick={handleRefresh}>
                Sync feed
              </button>
            </div>
          ) : (
            <div className="cards-grid">
              {activeArticles.map((article) => (
                <ArticleItem
                  key={article.id}
                  article={article}
                  searchQuery={selectedCategory === 'search' ? searchQuery : ''}
                  onClick={() => onSelectArticle(article)}
                />
              ))}
            </div>
          )}

          {loading && activeArticles.length > 0 && (
            <div className="loading-more-spinner">
              <span>Loading older articles...</span>
            </div>
          )}
        </div>
      </PullToRefresh>
    </section>
  );
}
