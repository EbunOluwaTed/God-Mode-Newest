import React, { useState } from 'react';

export default function AddTaskModal({ categories, defaultDate, onAdd, onClose }) {
  const [form, setForm] = useState({
    title: '',
    sub: '',
    area: categories[0] || 'Personal',
    status: 'fire',
    due: defaultDate || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Task title is required.');
    setLoading(true);
    const err = await onAdd(form);
    if (err) setError(err.message || 'Failed to save task.');
    else onClose();
    setLoading(false);
  };

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>
        <div style={m.header}>
          <h2 style={m.title}>New Mission</h2>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={m.fields}>
          <div style={m.field}>
            <label style={m.label}>What needs to be executed? *</label>
            <input style={m.input} placeholder="Task title"
              value={form.title} onChange={e => set('title', e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div style={m.field}>
            <label style={m.label}>Note (optional)</label>
            <input style={m.input} placeholder="Any extra context?"
              value={form.sub} onChange={e => set('sub', e.target.value)} />
          </div>
          <div style={m.row}>
            <div style={{ ...m.field, flex: 1 }}>
              <label style={m.label}>Category</label>
              <select style={m.select} value={form.area} onChange={e => set('area', e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ ...m.field, flex: 1 }}>
              <label style={m.label}>Priority</label>
              <select style={m.select} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="fire">🔥 Urgent</option>
                <option value="prog">🔵 In Progress</option>
                <option value="wait">⏸ Waiting</option>
              </select>
            </div>
          </div>
          <div style={m.field}>
            <label style={m.label}>Due date</label>
            <input type="date" style={m.input} value={form.due}
              onChange={e => set('due', e.target.value)} />
          </div>
        </div>

        {error && <div style={m.error}>{error}</div>}

        <div style={m.footer}>
          <button style={m.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={m.submitBtn} className="grad-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Add Mission →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const m = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-overlay)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, backdropFilter: 'blur(6px)',
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 22, padding: 32, width: '100%', maxWidth: 480,
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: {
    fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
    fontFamily: 'var(--font-serif)',
  },
  closeBtn: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 9, padding: '4px 11px', fontSize: 15,
    color: 'var(--text-secondary)', cursor: 'pointer',
  },
  fields: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  input: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 11, padding: '12px 14px', fontSize: 15,
    color: 'var(--text-primary)', width: '100%', fontFamily: 'var(--font-sans)',
    transition: 'border-color var(--transition)',
  },
  select: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 11, padding: '12px 14px', fontSize: 15,
    color: 'var(--text-primary)', width: '100%', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  error: {
    color: 'var(--fire-text)', fontSize: 14, background: 'var(--fire-dim)',
    border: '1px solid var(--fire-border)', borderRadius: 9, padding: '10px 14px',
  },
  footer: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 11,
    padding: '11px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  submitBtn: {
    borderRadius: 11, padding: '11px 24px', fontSize: 14,
    fontFamily: 'var(--font-sans)',
  },
};
