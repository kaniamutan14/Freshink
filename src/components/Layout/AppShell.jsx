import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../store/AppContext';
import { Sidebar } from './Sidebar';
import { ArticleList } from '../Articles/ArticleList';
import { ArticleReader } from '../Articles/ArticleReader';
import { MobileNav } from './MobileNav';
import { Settings } from '../Common/Settings';
import { useFeeds } from '../../hooks/useFeeds';
import { useArticles } from '../../hooks/useArticles';
import { SwipeHandler } from '../Common/SwipeHandler';

export function AppShell() {
  const { state, dispatch } = useContext(AppContext);
  const { activePanel, layoutMode } = state.ui;
  const { selectedCategory, selectedFeed } = state.ui;
  
  const [showSettings, setShowSettings] = useState(false);
  const { refreshFeeds } = useFeeds();
  const { fetchArticles } = useArticles();

  // Load feeds list once on mount and listen for background sync
  useEffect(() => {
    refreshFeeds();
    
    const handleBackgroundRefresh = () => {
       console.log('Background refresh triggered');
       refreshFeeds();
       // Fetch "all" stream to update background cache of articles
       fetchArticles('user/-/state/com.google/reading-list');
    };
    
    window.addEventListener('freshink-background-refresh', handleBackgroundRefresh);
    return () => window.removeEventListener('freshink-background-refresh', handleBackgroundRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSelectStream = (id, type) => {
    if (type === 'category') {
      dispatch({ type: 'UPDATE_UI', payload: { selectedCategory: id, selectedFeed: null, selectedArticle: null } });
    } else if (type === 'feed') {
      dispatch({ type: 'UPDATE_UI', payload: { selectedFeed: id, selectedCategory: null, selectedArticle: null } });
    } else if (type === 'starred') {
      dispatch({ type: 'UPDATE_UI', payload: { selectedCategory: 'starred', selectedFeed: null, selectedArticle: null } });
    } else if (type === 'all') {
      dispatch({ type: 'UPDATE_UI', payload: { selectedCategory: 'all', selectedFeed: null, selectedArticle: null } });
    } else if (type === 'search') {
      dispatch({ type: 'UPDATE_UI', payload: { selectedCategory: 'search', selectedFeed: null, selectedArticle: null } });
      dispatch({ type: 'SET_ARTICLES', payload: { items: [], continuation: null } });
      dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'list' } });
      return;
    }

    // Clear articles instantly to prevent showing previous category's items
    dispatch({ type: 'SET_ARTICLES', payload: { items: [], continuation: null } });
    // Transition on mobile
    dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'list' } });
  };

  const handleBack = () => {
    if (activePanel === 'reader') {
      dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'list', selectedArticle: null } });
    } else if (activePanel === 'list') {
      dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'sidebar' } });
    }
  };

  // Touch Swipe navigation mapping
  const handleSwipe = (direction) => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    if (direction === 'right') {
      // Swipe right → go back (Reader → List → Sidebar)
      if (activePanel === 'reader') {
        dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'list' } });
      } else if (activePanel === 'list') {
        dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'sidebar' } });
      }
    } else if (direction === 'left') {
      // Swipe left → go forward (Sidebar → List → Reader)
      if (activePanel === 'sidebar' && (selectedCategory || selectedFeed)) {
        dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'list' } });
      } else if (activePanel === 'list' && state.ui.selectedArticle) {
        dispatch({ type: 'UPDATE_UI', payload: { activePanel: 'reader' } });
      }
    }
  };

  return (
    <div className="app-shell-viewport-wrapper">
      {/* Mobile Top Navigation Header */}
      <MobileNav 
        activePanel={activePanel} 
        onBack={handleBack} 
        onOpenSettings={() => setShowSettings(true)} 
      />

      <SwipeHandler onSwipe={handleSwipe}>
        <div 
          className={`app-layout-grid ${layoutMode} active-panel-${activePanel}`}
        >
          {/* Desktop Overlay Backdrop for transient sidebar */}
          {state.ui.sidebarDrawerOpen && (
            <div 
              className="sidebar-backdrop" 
              onClick={() => dispatch({ type: 'UPDATE_UI', payload: { sidebarDrawerOpen: false } })}
            />
          )}

          {/* PANEL 1: Sidebar Nav (always rendering in DOM but offset on mobile via css) */}
          <Sidebar 
            onSelectStream={handleSelectStream}
            onOpenSettings={() => setShowSettings(true)}
            isDrawerOpen={state.ui.sidebarDrawerOpen}
          />

          {/* PANEL 2: Article Cards List */}
          <ArticleList 
            onSelectArticle={(article) => {
              dispatch({ type: 'UPDATE_UI', payload: { selectedArticle: article, activePanel: 'reader' } });
            }}
            onOpenSettings={() => setShowSettings(true)}
          />

          {/* PANEL 3: Article Reader Pane */}
          <ArticleReader />
        </div>
      </SwipeHandler>

      {/* Settings Modal overlay */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
