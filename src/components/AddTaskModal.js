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
    <div style={css.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={css.modal}>
        <div style={css.header}>
          <h2 style={css.title}>New Task</h2>
          <button style={css.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={css.fields}>
          <div style={css.field}>
            <label style={css.label}>Task title *</label>
            <input
              style={css.input}
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div style={css.field}>
            <label style={css.label}>Note (optional)</label>
            <input
              style={css.input}
              placeholder="Any extra context?"
              value={form.sub}
              onChange={e => set('sub', e.target.value)}
            />
          </div>
          <div style={css.row}>
            <div style={{ ...css.field, flex: 1 }}>
              <label style={css.label}>Category</label>
              <select style={css.select} value={form.area} onChange={e => set('area', e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ ...css.field, flex: 1 }}>
              <label style={css.label}>Priority</label>
              <select style={css.select} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="fire">🔥 Urgent</option>
                <option value="prog">🔵 In Progress</option>
                <option value="wait">⏸ Waiting</option>
              </select>
            </div>
          </div>
          <div style={css.field}>
            <label style={css.label}>Due date</label>
            <input
              type="date"
              style={css.input}
              value={form.due}
              onChange={e => set('due', e.target.value)}
            />
          </div>
        </div>

        {error && <div style={css.error}>{error}</div>}

        <div style={css.footer}>
          <button style={css.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={css.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Add Task →'}
          </button>
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
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' },
  closeBtn: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '4px 10px', fontSize: 16,
    color: 'var(--text-secondary)', cursor: 'pointer',
  },
  fields: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'flex', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '12px 14px', fontSize: 15,
    color: 'var(--text-primary)', width: '100%', fontFamily: 'var(--font-sans)',
  },
  select: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '12px 14px', fontSize: 15,
    color: 'var(--text-primary)', width: '100%', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  error: { color: 'var(--fire-text)', fontSize: 14, background: 'var(--fire-dim)', border: '1px solid var(--fire-border)', borderRadius: 8, padding: '10px 14px' },
  footer: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
    padding: '11px 20px', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  submitBtn: {
    background: 'var(--accent)', border: 'none', borderRadius: 10,
    padding: '11px 24px', fontSize: 14, fontWeight: 700,
    color: 'var(--text-on-accent)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
};
