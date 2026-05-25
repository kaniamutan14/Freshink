import { useEffect, useRef } from 'react';

export function ScrollProgress({ targetRef }) {
  const barRef = useRef(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    let ticking = false;

    const updateProgress = () => {
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      const totalScroll = scrollHeight - clientHeight;
      let progress = 0;
      if (totalScroll > 0) {
        progress = scrollTop / totalScroll;
      }
      
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once on load
    handleScroll();

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [targetRef]);

  return (
    <div className="scroll-progress-bar-container">
      <div 
        ref={barRef}
        className="scroll-progress-bar-fill" 
        style={{ transform: `scaleX(0)`, transformOrigin: 'left' }} 
      />
    </div>
  );
}
