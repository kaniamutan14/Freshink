import React, { useState, useContext } from 'react';
import { AppContext } from '../../store/AppContext';
import { FeedItem } from './FeedItem';

export function CategoryTree({ categories, feeds, unreadCounts, onSelectStream }) {
  const { state } = useContext(AppContext);
  const { selectedCategory, selectedFeed } = state.ui;
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const toggleCollapse = (catId, e) => {
    e.stopPropagation();
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const getCategoryUnreadCount = (catId) => {
    // FreshRSS Google Reader API exposes unread count under the category ID directly in unreadcounts
    if (unreadCounts[catId] !== undefined) {
      return unreadCounts[catId];
    }
    
    // Fallback: sum up children feeds unread counts
    const children = feeds.filter(f => f.categoryId === catId);
    return children.reduce((sum, feed) => sum + (unreadCounts[feed.id] || 0), 0);
  };

  return (
    <div className="category-tree-container">
      {categories.map((category) => {
        const isCollapsed = collapsedCategories[category.id];
        const catUnread = getCategoryUnreadCount(category.id);
        const isCatActive = selectedCategory === category.id && !selectedFeed;
        const childFeeds = feeds.filter(f => f.categoryId === category.id);

        return (
          <div key={category.id} className="category-section">
            <div 
              className={`category-header-row ${isCatActive ? 'active' : ''}`}
              onClick={() => onSelectStream(category.id, 'category')}
            >
              <button 
                className={`category-collapse-arrow ${isCollapsed ? 'collapsed' : ''}`}
                onClick={(e) => toggleCollapse(category.id, e)}
                aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-icon">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <span className="category-title">{category.title}</span>

              {catUnread > 0 && (
                <span className="category-unread-badge">
                  {catUnread}
                </span>
              )}
            </div>

            <div className={`category-feeds-list ${isCollapsed ? 'collapsed' : ''}`}>
              {childFeeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  feed={feed}
                  unreadCount={unreadCounts[feed.id] || 0}
                  isActive={selectedFeed === feed.id}
                  onClick={() => onSelectStream(feed.id, 'feed')}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
