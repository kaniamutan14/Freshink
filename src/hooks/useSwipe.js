import { useEffect, useRef } from 'react';

export function useSwipe(ref, onSwipe, options = {}) {
  const { threshold = 50, speedThreshold = 0.3 } = options;
  const touchStart = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      const start = touchStart.current;
      
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const duration = Date.now() - start.time;
      
      // Calculate speed in pixels per millisecond
      const speedX = Math.abs(deltaX) / duration;
      const speedY = Math.abs(deltaY) / duration;

      // Check if distance or speed matches threshold
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold || speedX > speedThreshold) {
          if (deltaX > 0) {
            onSwipe('right');
          } else {
            onSwipe('left');
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold || speedY > speedThreshold) {
          if (deltaY > 0) {
            onSwipe('down');
          } else {
            onSwipe('up');
          }
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipe, threshold, speedThreshold]);
}
