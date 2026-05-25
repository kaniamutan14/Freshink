import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'auto', label: 'Auto', color: 'linear-gradient(135deg, #FAF6F1 50%, #1A1814 50%)' },
    { id: 'parchment', label: 'Parchment', color: '#FAF6F1' },
    { id: 'forest', label: 'Forest', color: '#F4F6F0' },
    { id: 'midnight', label: 'Midnight', color: '#1A1814' },
    { id: 'nordic', label: 'Nordic', color: '#1E222A' }
  ];

  return (
    <div className="theme-toggle-container">
      <span className="toggle-label">Theme</span>
      <div className="theme-options">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`theme-option-btn ${theme === t.id ? 'active' : ''}`}
            aria-label={`Select ${t.label} Theme`}
            title={`${t.label} Theme`}
            style={{ background: t.color }}
          >
            {theme === t.id && (
              <span className="theme-selected-dot" style={{ 
                backgroundColor: ['midnight', 'nordic'].includes(t.id) || (t.id === 'auto' && theme === 'auto') ? '#FAF6F1' : '#1A1814' 
              }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
