import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function OnboardingPage({ onLogin, theme, toggleTheme }) {
  const [view, setView] = useState('welcome');
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
    if (!form.username.trim() || form.username.trim().length < 2)
      return setError('Username needs at least 2 characters.');
    if (form.pin.length !== 4) return setError('PIN must be exactly 4 digits.');
    if (form.pin !== form.confirmPin) return setError('PINs do not match.');

    setLoading(true);
    try {
      const slug = form.username.trim().toLowerCase().replace(/\s+/g, '_');
      const { data: existing } = await supabase
        .from('users').select('id').eq('username', slug).maybeSingle();
      if (existing) { setLoading(false); return setError('That username is taken.'); }
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
      if (!data) { setLoading(false); return setError('Wrong username or PIN.'); }
      onLogin({ userId: data.id, username: data.display_name, categories: data.categories || ['Work', 'Academics', 'Personal'] });
    } catch (e) {
      setError(e.message || 'Login failed. Check Supabase connection.');
    }
    setLoading(false);
  };

  const back = () => { setView('welcome'); setError(''); };

  return (
    <div style={o.page}>
      {/* Decorative gradient orbs */}
      <div style={o.orb1} />
      <div style={o.orb2} />

      <button onClick={toggleTheme} style={o.themeBtn} aria-label="Toggle theme">
        {isDark ? '☀️' : '🌙'}
      </button>

      {view === 'welcome' && (
        <div style={o.center}>
          <div style={o.logoWrap}>
            <span style={o.bolt}>⚡</span>
          </div>
          <h1 style={o.heroTitle}>
            <span style={{ color: 'var(--text-primary)' }}>God</span>
            <span style={{
              background: 'var(--gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Mode</span>
          </h1>
          <p style={o.heroSub}>
            Your thoughts become tasks.<br />
            Your tasks become execution.
          </p>
          <div style={o.btnStack}>
            <button style={o.primaryBtn} className="grad-btn" onClick={() => setView('create')}>
              Create your space →
            </button>
            <button style={o.ghostBtn} onClick={() => setView('login')}>
              I already have a space
            </button>
          </div>
          <p style={o.tagline}>No email. No password. Just execution.</p>
        </div>
      )}

      {view === 'create' && (
        <div style={o.card}>
          <button style={o.backBtn} onClick={back}>← Back</button>
          <h2 style={o.cardTitle}>Set up your space</h2>
          <p style={o.cardSub}>Pick a name and a 4-digit PIN. No email needed.</p>
          <div style={o.field}>
            <label style={o.label}>Display Name</label>
            <input style={o.input} placeholder="e.g. EbunOluwa"
              value={form.username} onChange={e => setF('username', e.target.value)}
              maxLength={30} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          <div style={o.field}>
            <label style={o.label}>4-Digit PIN</label>
            <input style={o.input} type="password" inputMode="numeric" placeholder="••••"
              value={form.pin} onChange={e => setF('pin', pinOnly(e.target.value))} />
          </div>
          <div style={o.field}>
            <label style={o.label}>Confirm PIN</label>
            <input style={o.input} type="password" inputMode="numeric" placeholder="••••"
              value={form.confirmPin} onChange={e => setF('confirmPin', pinOnly(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          {error && <div style={o.errorBox}>{error}</div>}
          <button style={{ ...o.primaryBtn, maxWidth: '100%' }} className="grad-btn"
            onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Launch GodMode →'}
          </button>
        </div>
      )}

      {view === 'login' && (
        <div style={o.card}>
          <button style={o.backBtn} onClick={back}>← Back</button>
          <h2 style={o.cardTitle}>Welcome back</h2>
          <p style={o.cardSub}>Enter your name and PIN to continue.</p>
          <div style={o.field}>
            <label style={o.label}>Username</label>
            <input style={o.input} placeholder="Your username"
              value={loginForm.username} onChange={e => setLF('username', e.target.value)} autoFocus />
          </div>
          <div style={o.field}>
            <label style={o.label}>PIN</label>
            <input style={o.input} type="password" inputMode="numeric" placeholder="••••"
              value={loginForm.pin} onChange={e => setLF('pin', pinOnly(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <div style={o.errorBox}>{error}</div>}
          <button style={{ ...o.primaryBtn, maxWidth: '100%' }} className="grad-btn"
            onClick={handleLogin} disabled={loading}>
            {loading ? 'Checking…' : 'Enter →'}
          </button>
        </div>
      )}
    </div>
  );
}

const o = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'fixed', top: '-10%', left: '-5%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,0,222,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', bottom: '-10%', right: '-5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,207,0,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  themeBtn: {
    position: 'fixed', top: 20, right: 20, zIndex: 99,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '7px 12px',
    fontSize: 17,
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  center: {
    textAlign: 'center',
    maxWidth: 520,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: { marginBottom: 12 },
  bolt: { fontSize: 52, lineHeight: 1 },
  heroTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(60px, 12vw, 100px)',
    fontWeight: 700,
    letterSpacing: '-4px',
    lineHeight: 0.95,
    marginBottom: 24,
  },
  heroSub: {
    fontSize: 20,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: 40,
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
  },
  btnStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    borderRadius: 14,
    padding: '16px 36px',
    fontSize: 16,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    width: '100%',
    maxWidth: 340,
  },
  ghostBtn: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '15px 36px',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    width: '100%',
    maxWidth: 340,
    transition: 'border-color var(--transition)',
  },
  tagline: {
    marginTop: 24,
    fontSize: 13,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 22,
    padding: '36px 40px',
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    position: 'relative',
    zIndex: 1,
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
    fontFamily: 'var(--font-serif)',
  },
  cardSub: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginTop: -10,
    lineHeight: 1.5,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  input: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 11,
    padding: '13px 16px',
    fontSize: 16,
    color: 'var(--text-primary)',
    width: '100%',
    transition: 'border-color var(--transition)',
  },
  errorBox: {
    background: 'var(--fire-dim)',
    border: '1px solid var(--fire-border)',
    borderRadius: 9,
    padding: '10px 14px',
    color: 'var(--fire-text)',
    fontSize: 14,
    fontWeight: 500,
  },
};
