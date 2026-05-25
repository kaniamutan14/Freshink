import React from 'react';
import { useFontSize } from '../../hooks/useFontSize';

export function FontSizeControl() {
  const { fontSize, increaseSize, decreaseSize, canIncrease, canDecrease } = useFontSize();

  return (
    <div className="font-size-control">
      <button 
        onClick={decreaseSize} 
        disabled={!canDecrease}
        className="font-size-btn"
        aria-label="Decrease Font Size"
        title="Decrease font size"
      >
        Aa-
      </button>
      <span className="font-size-value">{fontSize}%</span>
      <button 
        onClick={increaseSize} 
        disabled={!canIncrease}
        className="font-size-btn"
        aria-label="Increase Font Size"
        title="Increase font size"
      >
        Aa+
      </button>
    </div>
  );
}
