import { useContext } from 'react';
import { AppContext } from '../../store/AppContext';

export function GutenbergToggle() {
  const { state, dispatch } = useContext(AppContext);
  const isGutenberg = state.ui.gutenbergMode;

  const toggleGutenberg = () => {
    const nextVal = !isGutenberg;
    localStorage.setItem('freshink_gutenberg', nextVal ? 'true' : 'false');
    dispatch({ type: 'UPDATE_UI', payload: { gutenbergMode: nextVal } });
  };

  return (
    <button 
      onClick={toggleGutenberg}
      className={`gutenberg-toggle-btn ${isGutenberg ? 'active' : ''}`}
      aria-label="Toggle Gutenberg Typographic Mode"
      title="Toggle Gutenberg Editorial Typographic Mode (removes ugly inline styles)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather-icon">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
      <span className="btn-label">Gutenberg</span>
    </button>
  );
}
