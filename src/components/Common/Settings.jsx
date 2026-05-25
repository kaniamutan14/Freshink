import React, { useContext } from 'react';
import { AppContext } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { LayoutToggle } from './LayoutToggle';
import { FontSizeControl } from './FontSizeControl';
import { GutenbergToggle } from './GutenbergToggle';

export function Settings({ onClose }) {
  const { state } = useContext(AppContext);
  const { logout } = useAuth();
  const { backgroundSyncEnabled, toggleBackgroundSync, syncQueueCount, isOnline } = useOfflineSync();
  const { user, freshrssUrl, isDemoMode } = state.auth;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>FreshInk Preferences</h2>
          <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        <div className="settings-body">
          {/* User profile */}
          <div className="settings-section profile-section">
            <h3>Connected Account</h3>
            <p className="profile-detail"><strong>User:</strong> {user}</p>
            <p className="profile-detail"><strong>Server:</strong> {isDemoMode ? 'Offline Demo Mode' : freshrssUrl}</p>
            {isDemoMode && (
              <div className="demo-notice">
                <span>Running fully offline with local sandbox mock data.</span>
              </div>
            )}
          </div>

          {/* Theme customizer */}
          <div className="settings-section">
            <h3>Visual Style</h3>
            <ThemeToggle />
          </div>

          {/* Layout controls */}
          <div className="settings-section">
            <h3>Grid Architecture</h3>
            <div className="settings-row">
              <span>Layout Width:</span>
              <LayoutToggle />
            </div>
          </div>

          {/* Reading preferences */}
          <div className="settings-section">
            <h3>Reading Preferences</h3>
            <div className="settings-row">
              <span>Font Size:</span>
              <FontSizeControl />
            </div>
            <div className="settings-row">
              <span>Gutenberg Mode:</span>
              <GutenbergToggle />
            </div>
          </div>

          {/* PWA offline sync configuration */}
          <div className="settings-section">
            <h3>Offline Commute Sync</h3>
            <div className="settings-row sync-row">
              <div className="sync-info">
                <span>Background Article Sync</span>
                <small>Auto fetch new articles when screen is off</small>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox"
                  checked={backgroundSyncEnabled}
                  onChange={(e) => toggleBackgroundSync(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="sync-status-row">
              <span>Local Queue Count:</span>
              <span className={`queue-badge ${syncQueueCount > 0 ? 'has-items' : ''}`}>
                {syncQueueCount} mutation{syncQueueCount !== 1 ? 's' : ''} queued
              </span>
            </div>
            {syncQueueCount > 0 && (
              <small className="sync-notice">
                {isOnline ? 'Syncing mutations online in background...' : 'Offline. Mutations will sync automatically when online.'}
              </small>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="logout-btn" onClick={() => { logout(); onClose(); }}>
            Disconnect Account
          </button>
        </div>
      </div>
    </div>
  );
}
