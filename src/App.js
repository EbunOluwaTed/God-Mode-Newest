import React, { useState, useEffect } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('gm_theme') || 'dark');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gm_theme', theme);
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem('gm_session');
    if (stored) {
      try { setSession(JSON.parse(stored)); } catch (e) {}
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setSession(userData);
    localStorage.setItem('gm_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('gm_session');
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-base)'
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>⚡</span>
    </div>
  );

  if (!session) {
    return <OnboardingPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <DashboardPage
      session={session}
      onLogout={handleLogout}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}
