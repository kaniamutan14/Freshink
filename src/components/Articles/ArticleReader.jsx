import { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../store/AppContext';
import { useArticles } from '../../hooks/useArticles';
import { ScrollProgress } from '../Common/ScrollProgress';
import { FontSizeControl } from '../Common/FontSizeControl';
import { GutenbergToggle } from '../Common/GutenbergToggle';
import { LayoutToggle } from '../Common/LayoutToggle';
import { formatFullDate, calculateReadingTime } from '../../utils/dateFormat';
import { sanitizeHTML, injectDropCap } from '../../utils/sanitize';

export function ArticleReader() {
  const { state, dispatch } = useContext(AppContext);
  const article = state.ui.selectedArticle;
  const { gutenbergMode, fullTextArticles } = state.ui;
  const { feeds } = state;

  const { toggleReadStatus, toggleStarredStatus, fetchArticleFullText } = useArticles();
  const readerScrollRef = useRef(null);
  
  const [scraping, setScraping] = useState(false);
  const [scrapingError, setScrapingError] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Find feed favicon
  const feed = article ? feeds.find(f => f.id === article.feedId) : null;
  const fullDate = article ? formatFullDate(article.published) : '';
  const readTime = article ? calculateReadingTime(article.content) : '';

  // Auto-mark read after 2 seconds of active viewing
  useEffect(() => {
    if (!article || article.isRead) return;

    const timer = setTimeout(() => {
      // Re-verify it hasn't changed
      if (state.ui.selectedArticle?.id === article.id) {
        toggleReadStatus(article.id, true);
      }
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, [article, toggleReadStatus, state.ui.selectedArticle]);

  // Reset scroll position when article changes
  useEffect(() => {
    if (readerScrollRef.current) {
      readerScrollRef.current.scrollTop = 0;
    }
    setTimeout(() => {
      setScrapingError(null);
      setImgError(false);
    }, 0);
  }, [article]);

  const handleFetchFullText = async () => {
    if (!article) return;
    setScraping(true);
    setScrapingError(null);

    try {
      await fetchArticleFullText(article.id, article.url);
    } catch {
      setScrapingError(
        "This site's security settings or network blocks prevented a clean text extraction."
      );
    } finally {
      setScraping(false);
    }
  };

  if (!article) {
    return (
      <section className="article-reader-panel empty">
        {/* Render toolbar even in empty state so user isn't trapped in Zen mode */}
        <header className="reader-toolbar">
          <div className="toolbar-left-group">
            {state.ui.layoutMode === 'one-panel' && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_UI', payload: { sidebarDrawerOpen: true } })}
                className="toolbar-btn"
                aria-label="Open Feeds Menu"
                title="Feeds Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon" style={{width: 18, height: 18}}>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          <div className="toolbar-right-group">
            {state.ui.layoutMode === 'one-panel' && <LayoutToggle />}
          </div>
        </header>

        <div className="reader-empty-state">
          <span className="editorial-seal">✒</span>
          <p className="seal-tagline">Open an article to begin reading.</p>
        </div>
      </section>
    );
  }

  // Get active body HTML: full text scraped cache OR default feed content
  const rawBody = fullTextArticles[article.id] || article.content || '';
  let cleanBody = sanitizeHTML(rawBody);
  
  if (gutenbergMode) {
    cleanBody = injectDropCap(cleanBody);
  }

  // Detect if article description is likely truncated (less than 600 chars or ends in ellipsis)
  const isTruncated = !fullTextArticles[article.id] && 
    (rawBody.length < 600 || /(&#8230;|\u2026|\.\.\.\s*)$/i.test(rawBody.replace(/<[^>]*>?/gm, '')));

  return (
    <section className="article-reader-panel">
      {/* Dynamic thin terracotta progress bar at the top */}
      <ScrollProgress targetRef={readerScrollRef} />

      {/* Reader Toolbar Header */}
      <header className="reader-toolbar">
        <div className="toolbar-left-group">
          {state.ui.layoutMode === 'one-panel' && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_UI', payload: { sidebarDrawerOpen: true } })}
              className="toolbar-btn"
              aria-label="Open Feeds Menu"
              title="Feeds Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon" style={{width: 18, height: 18}}>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          {/* Read/Unread toggler */}
          <button 
            type="button"
            onClick={() => toggleReadStatus(article.id, !article.isRead)}
            className={`toolbar-btn circle-btn ${article.isRead ? 'read' : 'unread'}`}
            aria-label={article.isRead ? "Mark as unread" : "Mark as read"}
            title={article.isRead ? "Mark as unread" : "Mark as read"}
          >
            <span className="dot-icon" />
          </button>

          {/* Star toggler */}
          <button 
            type="button"
            onClick={() => toggleStarredStatus(article.id, !article.isStarred)}
            className={`toolbar-btn star-btn ${article.isStarred ? 'starred' : ''}`}
            aria-label={article.isStarred ? "Unstar article" : "Star article"}
            title={article.isStarred ? "Unstar article" : "Star article"}
          >
            ★
          </button>
        </div>

        {/* Adjustments group */}
        <div className="toolbar-right-group">
          {state.ui.layoutMode === 'one-panel' && <LayoutToggle />}
          <FontSizeControl />
          <GutenbergToggle />
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="toolbar-link-btn"
            title="Open original website link in a new tab"
          >
            Original ↗
          </a>
        </div>
      </header>

      {/* Scrollable Reading Viewport */}
      <div 
        ref={readerScrollRef} 
        className={`reader-scroll-area scrollbar-styled ${gutenbergMode ? 'gutenberg-typography' : ''}`}
      >
        <div className="editorial-layout-frame">
          {/* Metadata Block */}
          <div className="reader-meta-block">
            <div className="source-row">
              {feed?.icon && !imgError ? (
                <img src={feed.icon} alt="Feed favicon" className="meta-feed-favicon" onError={() => setImgError(true)} />
              ) : (
                <span className="meta-feed-fallback">📰</span>
              )}
              <span className="meta-feed-name">{feed ? feed.title : 'Feed'}</span>
              <span className="meta-bullet">&bull;</span>
              <span className="meta-read-time">{readTime}</span>
            </div>

            <h1 className="reader-article-title">{article.title}</h1>
            
            <div className="author-date-row">
              {article.author && <span className="meta-author">By {article.author}</span>}
              {article.author && <span className="meta-bullet">&bull;</span>}
              <time className="meta-date">{fullDate}</time>
            </div>
          </div>

          <hr className="editorial-header-divider" />

          {/* HTML Safe Clean Rendered Content */}
          <div 
            className="reader-content-body"
            dangerouslySetInnerHTML={{ __html: cleanBody }}
          />

          {/* Full Text Fetch Section */}
          {isTruncated && !scrapingError && (
            <div className="full-text-fetch-card">
              <p>This article appears to be truncated from the source feed RSS.</p>
              <button 
                type="button"
                onClick={handleFetchFullText} 
                className="fetch-full-text-btn"
                disabled={scraping}
              >
                {scraping ? (
                  <span className="spinning-loader-tiny">Extracting text...</span>
                ) : (
                  'Fetch Full Text from Website ✒'
                )}
              </button>
            </div>
          )}

          {/* Scraping Error card Fallback */}
          {scrapingError && (
            <div className="scraping-error-card">
              <span className="error-icon">⚠️</span>
              <h4>Scraping block detected</h4>
              <p>{scrapingError}</p>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="fallback-original-link"
              >
                Open original website to read full text ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="reader-mobile-action-bar">
        <button
          type="button"
          className={`mobile-action-btn ${article.isStarred ? 'starred' : ''}`}
          onClick={() => toggleStarredStatus(article.id, !article.isStarred)}
        >
          <span className="action-icon">★</span>
          <span>{article.isStarred ? 'Starred' : 'Star'}</span>
        </button>
        <button
          type="button"
          className="mobile-action-btn"
          onClick={() => toggleReadStatus(article.id, !article.isRead)}
        >
          <span className="action-icon">{article.isRead ? '◯' : '●'}</span>
          <span>{article.isRead ? 'Unread' : 'Read'}</span>
        </button>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-action-btn"
        >
          <span className="action-icon">↗</span>
          <span>Original</span>
        </a>
      </div>
    </section>
  );
}
