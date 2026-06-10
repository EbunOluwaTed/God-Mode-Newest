import React, { useState } from 'react';

export default function SettingsModal({ session, categories, onSaveCategories, onLogout, onClose }) {
  const [cats, setCats] = useState([...categories]);
  const [newCat, setNewCat] = useState('');
  const [saved, setSaved] = useState(false);

  const addCat = () => {
    const t = newCat.trim();
    if (!t || cats.includes(t)) return;
    setCats(c => [...c, t]);
    setNewCat('');
    setSaved(false);
  };

  const removeCat = (cat) => {
    setCats(c => c.filter(x => x !== cat));
    setSaved(false);
  };

  const handleSave = async () => {
    await onSaveCategories(cats);
    setSaved(true);
  };

  return (
    <div style={css.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={css.modal}>
        <div style={css.header}>
          <h2 style={css.title}>⚙️ Settings</h2>
          <button style={css.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Account info */}
        <div style={css.section}>
          <h3 style={css.sectionTitle}>Account</h3>
          <div style={css.infoRow}>
            <span style={css.infoLabel}>Username</span>
            <span style={css.infoValue}>{session.username}</span>
          </div>
        </div>

        {/* Categories */}
        <div style={css.section}>
          <h3 style={css.sectionTitle}>Task Categories</h3>
          <p style={css.sectionNote}>Add or remove categories for your tasks.</p>
          <div style={css.catWrap}>
            {cats.map(cat => (
              <div key={cat} style={css.catChip}>
                <span>{cat}</span>
                <button style={css.chipRemove} onClick={() => removeCat(cat)}>✕</button>
              </div>
            ))}
          </div>
          <div style={css.addRow}>
            <input
              style={css.catInput}
              placeholder="New category name…"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCat()}
              maxLength={24}
            />
            <button style={css.addBtn} onClick={addCat}>Add</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button style={css.saveBtn} onClick={handleSave}>Save Categories</button>
            {saved && <span style={{ fontSize: 13, color: 'var(--done-text)' }}>✓ Saved</span>}
          </div>
        </div>

        {/* Danger zone */}
        <div style={css.section}>
          <h3 style={{ ...css.sectionTitle, color: 'var(--fire-text)' }}>Sign Out</h3>
          <p style={css.sectionNote}>You'll need your username and PIN to sign back in.</p>
          <button style={css.logoutBtn} onClick={onLogout}>Sign Out →</button>
        </div>
      </div>
    </div>
  );
}

const css = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-overlay)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 460,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' },
  closeBtn: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '4px 10px', fontSize: 16,
    color: 'var(--text-secondary)', cursor: 'pointer',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' },
  sectionNote: { fontSize: 13, color: 'var(--text-secondary)', marginTop: -8 },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: 'var(--text-secondary)' },
  infoValue: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' },
  catWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  catChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 100, padding: '5px 12px',
    fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
  },
  chipRemove: {
    background: 'none', border: 'none',
    color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
    padding: 0, lineHeight: 1,
  },
  addRow: { display: 'flex', gap: 8 },
  catInput: {
    flex: 1,
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', fontSize: 14,
    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
  },
  addBtn: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 18px', fontSize: 14,
    fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  saveBtn: {
    background: 'var(--gradient)', color: '#0a0a20',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  logoutBtn: {
    background: 'var(--fire-dim)', color: 'var(--fire-text)',
    border: '1px solid var(--fire-border)', borderRadius: 10,
    padding: '11px 24px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    alignSelf: 'flex-start',
  },
};
