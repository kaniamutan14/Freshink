import { useContext, useEffect } from 'react';
import { AppContext } from './store/AppContext';
import { LoginPage } from './components/Auth/LoginPage';
import { AppShell } from './components/Layout/AppShell';
import * as db from './utils/db';

// Import central editorial styling system
import './styles/index.css';

export default function App() {
  const { state } = useContext(AppContext);
  const { isLoggedIn } = state.auth;

  // Prune offline DB on app mount to prevent unbounded storage growth
  useEffect(() => {
    db.pruneOldArticles().catch(console.error);
  }, []);

  return isLoggedIn ? <AppShell /> : <LoginPage />;
}
