import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function OnboardingPage({ onLogin, theme, toggleTheme }) {
  const [view, setView] = useState('welcome'); // welcome | create | login
  const [form, setForm] = useState({ username: '', pin: '', confirmPin: '' });
  const [loginForm, setLoginForm] = useState({ username: '', pin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLF = (k, v) => setLoginForm(f => ({ ...f, [k]: v }));
  const pinOnly = (v) => v.replace(/\D/g, '').slice(0, 4);

  const handleCreate = async () => {
    setError('');
    if (!form.username.trim() || form.username.trim().length < 2) {
      return setError('Username needs at least 2 characters.');
    }
    if (form.pin.length !== 4) return setError('PIN must be exactly 4 digits.');
    if (form.pin !== form.confirmPin) return setError('PINs do not match.');

    setLoading(true);
    try {
      const slug = form.username.trim().toLowerCase().replace(/\s+/g, '_');
      const { data: existing } = await supabase
        .from('users').select('id').eq('username', slug).maybeSingle();
      if (existing) {
        setLoading(false);
        return setError('That username is taken. Try another.');
      }
      const { data, error: err } = await supabase.from('users').insert({
        username: slug,
        display_name: form.username.trim(),
        pin: form.pin,
        categories: ['Work', 'Academics', 'Personal'],
      }).select().single();
      if (err) throw err;
      onLogin({ userId: data.id, username: data.display_name, categories: data.categories });
    } catch (e) {
      setError(e.message || 'Something went wrong. Check Supabase connection.');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setError('');
    if (!loginForm.username.trim()) return setError('Enter your username.');
    if (loginForm.pin.length !== 4) return setError('PIN must be 4 digits.');

    setLoading(true);
    try {
      const slug = loginForm.username.trim().toLowerCase().replace(/\s+/g, '_');
      const { data, error: err } = await supabase.from('users').select('*')
        .eq('username', slug).eq('pin', loginForm.pin).maybeSingle();
      if (err) throw err;
      if (!data) {
        setLoading(false);
        return setError('Wrong username or PIN.');
      }
      onLogin({ userId: data.id, username: data.display_name, categories: data.categories || ['Work', 'Academics', 'Personal'] });
    } catch (e) {
      setError(e.message || 'Login failed. Check Supabase connection.');
    }
    setLoading(false);
  };

  const back = () => { setView('welcome'); setError(''); };

  return (
    <div style={css.page}>
      {/* Theme toggle */}
      <button onClick={toggleTheme} style={css.themeBtn} aria-label="Toggle theme">
        {isDark ? '☀️' : '🌙'}
      </button>

      {view === 'welcome' && (
        <div style={css.center}>
          <div style={css.logoWrap}>
            <span style={css.bolt}>⚡</span>
          </div>
          <h1 style={css.heroTitle}>
            God<span style={{ color: 'var(--accent)' }}>Mode</span>
          </h1>
          <p style={css.heroSub}>
            Your thoughts become tasks.<br />
            Your tasks become execution.
          </p>
          <div style={css.btnStack}>
            <button style={css.primaryBtn} onClick={() => setView('create')}>
              Create your space →
            </button>
            <button style={css.ghostBtn} onClick={() => setView('login')}>
              Sign in
            </button>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div style={css.card}>
          <button style={css.backBtn} onClick={back}>← Back</button>
          <h2 style={css.cardTitle}>Set up your space</h2>
          <p style={css.cardSub}>Pick a username and a 4-digit PIN. No email needed.</p>

          <div style={css.field}>
            <label style={css.label}>Username</label>
            <input
              style={css.input}
              placeholder="e.g. EbunOluwa"
              value={form.username}
              onChange={e => setF('username', e.target.value)}
              maxLength={30}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div style={css.field}>
            <label style={css.label}>4-digit PIN</label>
            <input
              style={css.input}
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={form.pin}
              onChange={e => setF('pin', pinOnly(e.target.value))}
            />
          </div>
          <div style={css.field}>
            <label style={css.label}>Confirm PIN</label>
            <input
              style={css.input}
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={form.confirmPin}
              onChange={e => setF('confirmPin', pinOnly(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {error && <div style={css.errorBox}>{error}</div>}

          <button style={{ ...css.primaryBtn, marginTop: 8 }} onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Launch GodMode →'}
          </button>
        </div>
      )}

      {view === 'login' && (
        <div style={css.card}>
          <button style={css.backBtn} onClick={back}>← Back</button>
          <h2 style={css.cardTitle}>Welcome back</h2>
          <p style={css.cardSub}>Enter your username and PIN to continue.</p>

          <div style={css.field}>
            <label style={css.label}>Username</label>
            <input
              style={css.input}
              placeholder="Your username"
              value={loginForm.username}
              onChange={e => setLF('username', e.target.value)}
              autoFocus
            />
          </div>
          <div style={css.field}>
            <label style={css.label}>PIN</label>
            <input
              style={css.input}
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={loginForm.pin}
              onChange={e => setLF('pin', pinOnly(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <div style={css.errorBox}>{error}</div>}

          <button style={{ ...css.primaryBtn, marginTop: 8 }} onClick={handleLogin} disabled={loading}>
            {loading ? 'Checking…' : 'Enter →'}
          </button>
        </div>
      )}
    </div>
  );
}

const css = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
  },
  themeBtn: {
    position: 'fixed', top: 20, right: 20, zIndex: 99,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 18,
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  center: {
    textAlign: 'center',
    maxWidth: 500,
    width: '100%',
  },
  logoWrap: { marginBottom: 16 },
  bolt: { fontSize: 56, lineHeight: 1 },
  heroTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(52px, 9vw, 88px)',
    fontWeight: 700,
    letterSpacing: '-3px',
    lineHeight: 1,
    marginBottom: 20,
    color: 'var(--text-primary)',
  },
  heroSub: {
    fontSize: 20,
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
    marginBottom: 44,
  },
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    borderRadius: 12,
    padding: '15px 36px',
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    width: '100%',
    maxWidth: 340,
    transition: 'opacity 0.15s, transform 0.1s',
  },
  ghostBtn: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 36px',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    width: '100%',
    maxWidth: 340,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '36px 40px',
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
    fontFamily: 'var(--font-sans)',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  cardSub: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    marginTop: -10,
    lineHeight: 1.5,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  input: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '13px 16px',
    fontSize: 16,
    color: 'var(--text-primary)',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  errorBox: {
    background: 'var(--fire-dim)',
    border: '1px solid var(--fire-border)',
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--fire-text)',
    fontSize: 14,
    fontWeight: 500,
  },
};
