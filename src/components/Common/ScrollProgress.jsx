import React, { useState, useEffect } from 'react';

export function ScrollProgress({ targetRef }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      const totalScroll = scrollHeight - clientHeight;
      if (totalScroll <= 0) {
        setProgress(0);
        return;
      }
      
      const scrollPercent = (scrollTop / totalScroll) * 100;
      setProgress(scrollPercent);
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
        className="scroll-progress-bar-fill" 
        style={{ transform: `scaleX(${progress / 100})`, transformOrigin: 'left' }} 
      />
    </div>
  );
}
