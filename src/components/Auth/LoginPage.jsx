import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const [freshrssUrl, setFreshrssUrl] = useState(localStorage.getItem('freshink_freshrss_url_input') || '');
  const [username, setUsername] = useState(localStorage.getItem('freshink_user_input') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  
  const { login, tryDemoMode, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!freshrssUrl || !username || !password) {
      setError('Please fill in all credentials fields.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('freshink_freshrss_url_input', freshrssUrl);
      localStorage.setItem('freshink_user_input', username);
    } else {
      localStorage.removeItem('freshink_freshrss_url_input');
      localStorage.removeItem('freshink_user_input');
    }

    const result = await login(freshrssUrl, username, password);
    if (!result.success) {
      setError(result.message || 'Login failed. Please double-check your URL and API password.');
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    const result = await tryDemoMode();
    if (!result.success) {
      setError('Could not initialize offline Demo Mode.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-branding">
        <h1 className="login-logo">FreshInk</h1>
        <p className="login-subtitle">A Premium Editorial Client for FreshRSS</p>
      </div>

      <form className="login-form-card" onSubmit={handleSubmit}>
        <h2>Connect Account</h2>
        <p className="login-description">
          Provide your FreshRSS API credentials. Ensure you have activated API access in settings and configured an API password.
        </p>

        {error && (
          <div className="login-error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="freshrss-url">FreshRSS Server URL</label>
          <input
            id="freshrss-url"
            type="url"
            placeholder="e.g. https://rss.yourdomain.com"
            value={freshrssUrl}
            onChange={(e) => setFreshrssUrl(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Your FreshRSS username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="api-password">API Password (NOT login password)</label>
          <input
            id="api-password"
            type="password"
            placeholder="Your FreshRSS API password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-row remember-me-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span className="checkbox-label">Remember my server & username</span>
          </label>
        </div>

        <button 
          type="submit" 
          className="login-submit-btn" 
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect to FreshRSS'}
        </button>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          onClick={handleDemoClick}
          className="login-demo-btn"
          disabled={loading}
        >
          Try Offline Sandbox Demo Mode
        </button>
      </form>
    </div>
  );
}
