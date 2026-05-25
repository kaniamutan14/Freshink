import React, { useContext } from 'react';
import { AppContext } from '../../store/AppContext';

export function LayoutToggle() {
  const { state, dispatch } = useContext(AppContext);
  const layoutMode = state.ui.layoutMode;

  const toggleLayout = () => {
    const nextMode = layoutMode === 'three-panel' ? 'two-panel' : 'three-panel';
    localStorage.setItem('freshink_layout_mode', nextMode);
    dispatch({ type: 'UPDATE_UI', payload: { layoutMode: nextMode } });
  };

  return (
    <button 
      onClick={toggleLayout}
      className="layout-toggle-btn"
      aria-label="Toggle Layout Columns"
      title={layoutMode === 'three-panel' ? 'Switch to 2-panel focused reading' : 'Switch to 3-panel sidebar browse'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        {layoutMode === 'three-panel' ? (
          <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="3 3" />
        ) : (
          <>
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </>
        )}
      </svg>
      <span className="btn-label">{layoutMode === 'three-panel' ? '2-Panel' : '3-Panel'}</span>
    </button>
  );
}
