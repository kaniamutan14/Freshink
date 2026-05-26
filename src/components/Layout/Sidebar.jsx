import { useContext } from 'react';
import { AppContext } from '../../store/AppContext';
import { SearchBar } from '../Search/SearchBar';
import { CategoryTree } from '../Categories/CategoryTree';

export function Sidebar({ onSelectStream, onOpenSettings, isDrawerOpen }) {
  const { state, dispatch } = useContext(AppContext);
  const { categories, feeds, unreadCounts } = state;
  const { selectedCategory, selectedFeed, filter } = state.ui;

  const toggleFilter = () => {
    const nextFilter = filter === 'unread' ? 'all' : 'unread';
    dispatch({ type: 'UPDATE_UI', payload: { filter: nextFilter } });
  };

  const handleSelectStream = (type, id) => {
    onSelectStream(type, id);
    if (isDrawerOpen) {
      dispatch({ type: 'UPDATE_UI', payload: { sidebarDrawerOpen: false } });
    }
  };

  const getAllArticlesUnreadCount = () => {
    // Reading list represents all articles
    return unreadCounts['user/-/state/com.google/reading-list'] || 0;
  };

  const getStarredArticlesCount = () => {
    // Starred count
    return unreadCounts['user/-/state/com.google/starred'] || 0;
  };

  return (
    <aside className={`sidebar-panel ${isDrawerOpen ? 'drawer-open' : ''}`}>
      {/* Editorial Title Logo */}
      <div className="sidebar-branding">
        <h1 className="sidebar-logo">FreshInk</h1>
      </div>

      {/* Embedded Search input */}
      <div className="sidebar-search-container">
        <SearchBar onSearchActive={(active) => {
          if (active) {
            handleSelectStream('search', 'search');
          }
        }} />
      </div>

      <div className="sidebar-filter-toggle">
        <button 
          className={`list-filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={toggleFilter}
        >
          {filter === 'unread' ? 'Unread only' : 'All articles'}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="sidebar-nav-scroll scrollbar-styled">
        <div className="special-nav-items">
          {/* Main Feed */}
          <button 
            className={`special-nav-btn ${selectedCategory === 'all' && !selectedFeed ? 'active' : ''}`}
            onClick={() => handleSelectStream('all', 'all')}
          >
            <span className="nav-icon">📰</span>
            <span className="nav-label">Main Feed</span>
            {getAllArticlesUnreadCount() > 0 && (
              <span className="feed-unread-badge primary-badge">
                {getAllArticlesUnreadCount()}
              </span>
            )}
          </button>

          {/* Starred Articles */}
          <button 
            className={`special-nav-btn ${selectedCategory === 'starred' && !selectedFeed ? 'active' : ''}`}
            onClick={() => handleSelectStream('starred', 'starred')}
          >
            <span className="nav-icon text-terracotta">★</span>
            <span className="nav-label">Starred Items</span>
            {getStarredArticlesCount() > 0 && (
              <span className="feed-unread-badge starred-badge">
                {getStarredArticlesCount()}
              </span>
            )}
          </button>
        </div>

        {/* Separator line */}
        <hr className="nav-divider" />

        {/* Collapsible Category feed list */}
        <div className="sidebar-categories-section">
          <CategoryTree
            categories={categories}
            feeds={feeds}
            unreadCounts={unreadCounts}
            onSelectStream={handleSelectStream}
          />
        </div>
      </nav>

      {/* Footer bar with settings Gear */}
      <footer className="sidebar-footer">
        <div className="user-profile-badge">
          <span className="profile-avatar">✍</span>
          <span className="profile-name">{state.auth.user}</span>
        </div>
        
        <button 
          onClick={onOpenSettings} 
          className="settings-footer-btn"
          aria-label="Preferences"
          title="Open Preferences"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </footer>
    </aside>
  );
}
