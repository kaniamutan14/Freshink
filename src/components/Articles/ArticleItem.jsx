import { useContext } from 'react';
import { AppContext } from '../../store/AppContext';
import { formatRelativeTime, calculateReadingTime } from '../../utils/dateFormat';

function highlightText(text, query) {
  if (!query || !text) return text;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  } catch {
    return text;
  }
}

export function ArticleItem({ article, onClick, searchQuery = '' }) {
  const { state } = useContext(AppContext);
  const { feeds } = state;

  // Find associated feed to fetch its favicon
  const feed = feeds.find(f => f.id === article.feedId);
  const relativeTime = formatRelativeTime(article.published);
  const readTime = calculateReadingTime(article.content);

  const titleContent = searchQuery ? highlightText(article.title, searchQuery) : article.title;
  
  const getExcerpt = (html) => {
    if (!html) return 'No preview available.';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent.substring(0, 140).trim() + '...';
  };
  
  const excerptText = getExcerpt(article.content);
  const excerptContent = searchQuery ? highlightText(excerptText, searchQuery) : excerptText;

  return (
    <article 
      className={`article-card ${article.isRead ? 'read' : 'unread'} ${state.ui.selectedArticle?.id === article.id ? 'selected' : ''}`}
      onClick={onClick}
    >
      <header className="card-header">
        <span className="card-feed-icon-wrapper">
          {feed?.icon ? (
            <img src={feed.icon} alt="" className="card-feed-favicon" onError={(e) => e.target.style.display = 'none'} />
          ) : (
            <span className="card-feed-fallback">📰</span>
          )}
        </span>
        <span className="card-feed-title">{feed ? feed.title : 'Feed'}</span>
        <span className="card-bullet">&bull;</span>
        <span className="card-time" title={new Date(article.published * 1000).toLocaleString()}>
          {relativeTime}
        </span>
        <span className="card-bullet">&bull;</span>
        <span className="card-reading-time">{readTime}</span>
      </header>

      <h3 className="card-title">{titleContent}</h3>
      
      {/* 2-line content description preview */}
      <p className="card-excerpt">{excerptContent}</p>

      {article.isStarred && (
        <span className="card-starred-badge" title="Starred Article">
          ★
        </span>
      )}
    </article>
  );
}
