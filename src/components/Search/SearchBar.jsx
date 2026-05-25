import React, { useRef, useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch';

export function SearchBar({ onSearchActive }) {
  const { query, setSearchQuery, runSearch, clearSearch, loading } = useSearch();
  const debounceTimer = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (onSearchActive) {
      onSearchActive(val.length > 0);
    }

    // Debounced instant client-side search as user types
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      runSearch(val);
    }, 300); // 300ms debounce
  };

  const handleClear = () => {
    clearSearch();
    if (onSearchActive) {
      onSearchActive(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    // Forces immediate client + server search query
    runSearch(query);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <form className="search-bar-form" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        
        <input
          type="search"
          placeholder="Search all articles..."
          value={query}
          onChange={handleInputChange}
          className="search-input"
          aria-label="Search articles"
        />

        {loading && <span className="search-spinner-tiny" />}

        {query && (
          <button 
            type="button" 
            onClick={handleClear} 
            className="search-clear-btn"
            aria-label="Clear search"
            title="Clear search"
          >
            &times;
          </button>
        )}
      </div>
    </form>
  );
}
