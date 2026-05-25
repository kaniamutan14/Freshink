export function FeedItem({ feed, unreadCount, isActive, onClick }) {
  return (
    <button 
      className={`feed-item-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-label={`Feed ${feed.title}, ${unreadCount} unread articles`}
    >
      <span className="feed-favicon-wrapper">
        {feed.icon ? (
          <img 
            src={feed.icon} 
            alt="" 
            className="feed-favicon" 
            onError={(e) => {
              // Hide missing icons with default standard icon
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <span className="feed-favicon-fallback" style={{ display: feed.icon ? 'none' : 'block' }}>
          📰
        </span>
      </span>

      <span className="feed-title">{feed.title}</span>

      {unreadCount > 0 && (
        <span className="feed-unread-badge">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
