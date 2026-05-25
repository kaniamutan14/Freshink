import { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../store/AppContext';

export function useTheme() {
  const { state, dispatch } = useContext(AppContext);
  const activeTheme = state.ui.theme;

  const applyTheme = useCallback((theme) => {
    let resolvedTheme = theme;
    
    // Auto-detect system preference
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = isDark ? 'midnight' : 'parchment'; // Default dark/light mappings
    }

    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Also update meta theme-color for PWA header bars
    const metaColor = document.getElementById('meta-theme-color');
    if (metaColor) {
      const colors = {
        parchment: '#FAF6F1',
        forest: '#F4F6F0',
        midnight: '#1A1814',
        nordic: '#1E222A'
      };
      metaColor.setAttribute('content', colors[resolvedTheme] || '#FAF6F1');
    }
  }, []);

  const setTheme = useCallback((theme) => {
    localStorage.setItem('freshink_theme', theme);
    dispatch({ type: 'UPDATE_UI', payload: { theme } });
    applyTheme(theme);
  }, [dispatch, applyTheme]);

  // Listen to system preference changes if 'auto' is selected
  useEffect(() => {
    applyTheme(activeTheme);

    if (activeTheme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      applyTheme('auto');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [activeTheme, applyTheme]);

  return {
    theme: activeTheme,
    setTheme
  };
}
