import React, { useContext } from 'react';
import { AppContext } from '../../store/AppContext';

export function MobileNav({ activePanel, onBack, onOpenSettings }) {
  const { state, dispatch } = useContext(AppContext);
  const { filter } = state.ui;
  const { selectedCategory, selectedFeed, selectedArticle } = state.ui;
  const { categories, feeds } = state;

  const getHeaderTitle = () => {
    if (activePanel === 'sidebar') return 'FreshInk';
    if (activePanel === 'list') {
      if (selectedFeed) {
        const feed = feeds.find(f => f.id === selectedFeed);
        return feed ? feed.title : 'Feed';
      }
      if (selectedCategory === 'all') return 'All Articles';
      if (selectedCategory === 'starred') return 'Starred';
      if (selectedCategory === 'search') return `Search: "${state.search.query}"`;
      if (selectedCategory) {
        const cat = categories.find(c => c.id === selectedCategory);
        return cat ? cat.title : 'Category';
      }
      return 'Articles';
    }
    if (activePanel === 'reader') {
      return selectedArticle ? selectedArticle.title : 'Reading';
    }
    return 'FreshInk';
  };

  const handleFilterToggle = () => {
    const nextFilter = filter === 'unread' ? 'all' : 'unread';
    dispatch({ type: 'UPDATE_UI', payload: { filter: nextFilter } });
  };

  return (
    <header className="mobile-header-bar">
      {activePanel !== 'sidebar' && (
        <button 
          onClick={onBack} 
          className="mobile-nav-back-btn"
          aria-label="Go back to previous panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-arrow-icon">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="back-text">
            {activePanel === 'reader' ? 'List' : 'Feeds'}
          </span>
        </button>
      )}

      <h1 className="mobile-header-title">{getHeaderTitle()}</h1>

      <div className="mobile-header-actions">
        {activePanel === 'list' && (
          <button 
            onClick={handleFilterToggle} 
            className={`mobile-filter-toggle ${filter === 'unread' ? 'active' : ''}`}
            title={filter === 'unread' ? 'Showing unread only' : 'Showing all articles'}
          >
            {filter === 'unread' ? 'Unread' : 'All'}
          </button>
        )}
        
        <button 
          onClick={onOpenSettings} 
          className="mobile-settings-trigger"
          aria-label="Open settings panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="settings-gear-icon">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
