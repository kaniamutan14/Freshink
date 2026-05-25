import { useContext } from 'react';
import { AppContext } from '../../store/AppContext';

export function LayoutToggle() {
  const { state, dispatch } = useContext(AppContext);
  const layoutMode = state.ui.layoutMode;

  const toggleLayout = () => {
    let nextMode = 'three-panel';
    if (layoutMode === 'three-panel') nextMode = 'two-panel';
    if (layoutMode === 'two-panel') nextMode = 'one-panel';
    
    localStorage.setItem('freshink_layout_mode', nextMode);
    dispatch({ type: 'UPDATE_UI', payload: { layoutMode: nextMode } });
  };

  const getLabel = () => {
    if (layoutMode === 'three-panel') return '2-Panel';
    if (layoutMode === 'two-panel') return 'Zen Mode';
    return '3-Panel';
  };

  const getTitle = () => {
    if (layoutMode === 'three-panel') return 'Switch to 2-panel focused reading';
    if (layoutMode === 'two-panel') return 'Switch to 1-panel zen mode';
    return 'Switch to 3-panel sidebar browse';
  };

  return (
    <button 
      onClick={toggleLayout}
      className="layout-toggle-btn"
      aria-label="Toggle Layout Columns"
      title={getTitle()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        {layoutMode === 'three-panel' && (
          <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="3 3" />
        )}
        {layoutMode === 'two-panel' && (
          <>
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </>
        )}
        {layoutMode === 'one-panel' && (
          <rect x="7" y="7" width="10" height="10" strokeDasharray="2 2" />
        )}
      </svg>
      <span className="btn-label">{getLabel()}</span>
    </button>
  );
}
