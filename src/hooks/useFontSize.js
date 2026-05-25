import { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../store/AppContext';

const SIZE_STEPS = [75, 100, 125, 150];

export function useFontSize() {
  const { state, dispatch } = useContext(AppContext);
  const currentSize = state.ui.fontSize;

  const applyFontSize = useCallback((size) => {
    document.documentElement.style.setProperty('--reader-font-size', `${size}%`);
  }, []);

  const changeSize = useCallback((direction) => {
    const currentIndex = SIZE_STEPS.indexOf(currentSize);
    let nextIndex = currentIndex;

    if (direction === 'increase' && currentIndex < SIZE_STEPS.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'decrease' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextSize = SIZE_STEPS[nextIndex];
      localStorage.setItem('freshink_font_size', nextSize);
      dispatch({ type: 'UPDATE_UI', payload: { fontSize: nextSize } });
      applyFontSize(nextSize);
    }
  }, [currentSize, dispatch, applyFontSize]);

  // Initial load
  useEffect(() => {
    applyFontSize(currentSize);
  }, [currentSize, applyFontSize]);

  return {
    fontSize: currentSize,
    increaseSize: () => changeSize('increase'),
    decreaseSize: () => changeSize('decrease'),
    canIncrease: currentSize < SIZE_STEPS[SIZE_STEPS.length - 1],
    canDecrease: currentSize > SIZE_STEPS[0]
  };
}
