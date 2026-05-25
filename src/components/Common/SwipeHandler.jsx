import { useRef } from 'react';
import { useSwipe } from '../../hooks/useSwipe';

export function SwipeHandler({ children, onSwipe, className = '' }) {
  const containerRef = useRef(null);
  
  useSwipe(containerRef, onSwipe, { threshold: 60, speedThreshold: 0.25 });

  return (
    <div ref={containerRef} className={`swipe-container ${className}`}>
      {children}
    </div>
  );
}
