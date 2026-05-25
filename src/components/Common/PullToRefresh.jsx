import { useState, useRef, useEffect, useCallback } from 'react';

export function PullToRefresh({ children, onRefresh, isLoading }) {
  const [pullOffset, setPullOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const isPullingRef = useRef(false);
  const pullOffsetRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const PULL_MAX = 80;
  const PULL_THRESHOLD = 60;

  // Keep refs in sync with latest values
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const handleTouchStart = useCallback((e) => {
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPullingRef.current = true;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPullingRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      if (e.cancelable) e.preventDefault();
      const offset = Math.min(PULL_MAX, diff * 0.4);
      pullOffsetRef.current = offset;
      setPullOffset(offset);
    } else {
      isPullingRef.current = false;
      pullOffsetRef.current = 0;
      setIsPulling(false);
      setPullOffset(0);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    setIsPulling(false);

    if (pullOffsetRef.current >= PULL_THRESHOLD) {
      onRefreshRef.current();
    }

    pullOffsetRef.current = 0;
    setPullOffset(0);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="pull-to-refresh-container" style={{ height: '100%', overflowY: 'auto' }}>
      {/* Loading/Pulling Indicator bar */}
      <div 
        className="pull-to-refresh-indicator" 
        style={{
          height: `${pullOffset}px`,
          opacity: pullOffset / PULL_THRESHOLD,
          transition: isPulling ? 'none' : 'height 0.2s ease, opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--accent-tertiary)',
          fontSize: '0.8rem',
          borderBottom: pullOffset > 0 ? '1px solid var(--border)' : 'none'
        }}
      >
        {isLoading ? (
          <span className="ptr-spinning">Syncing feeds...</span>
        ) : pullOffset >= PULL_THRESHOLD ? (
          <span>Release to sync</span>
        ) : (
          <span>Pull down to sync</span>
        )}
      </div>
      {children}
    </div>
  );
}
